# 两种中间件模式

中间件模式, 也可以叫 AOP 模式, 还有一个名字叫面向切面编程,
具体的模式用文字解释起来比较复杂, 直接上代码。

## before after 模式

对于一个函数 f 我们想要知道他的执行相关的信息,
就需要在每一个他出现的地方, 添加上检测 f 执行的函数。

```javascript
function f (...params) {
  console.log(params);
}

function before () {
  console.log('函数准备执行');
}

function after () {
  console.log('函数执行完毕');
}

function run () {
  // 想要获取 f 的调用信息,
  // 就需要同时调用 before 和 after
  before();
  // 调用 f
  f (1,2,3,4);
  after();
}
```

这种写法对程序员明显不友好, 需要显示的调用 before 和 after。
而且也不利于 before 和 after 的逻辑复用。

我们希望我们在调用 f 的时候, 和普通函数没有区别, 
而且要能实现 before 和 after 的逻辑复用。
所以, 我们通常会将 before 和 after 挂载到原型链上,
然后调用 before 和 after 方法修饰函数。

```javascript
function f (...params) {
  console.log(params);
}

Function.prototype.before = function (fn) {
  const self = this;
  return function () {
    // 先执行挂载函数
    fn.call(this);
    // 再执行自身
    self.apply(this, arguments);
  }
}

Function.prototype.after = function (fn) {
  const self = this;
  return function () {
    // 先执行自身
    self.apply(this, arguments);
    // 再执行挂载函数
    fn.call(this);
  }
}

f = f.before(() => {
  // 挂载 befor 函数
  console.log('函数准备执行');
}).after(() => {
  // 挂载 after 函数
  console.log('函数执行完毕');
}).before(() => {
  // 可以不停的通过 before 和 after 挂载函数
  console.log('挂载 before 函数')
});

function run () {
  // 调用 f 就会自动执行 before 和 after 挂载的函数
  f (1,2,3,4);
  // 执行结果: 
  // 挂载 before 函数
  // 函数准备执行  
  // [ 1, 2, 3, 4 ]
  // 函数执行完毕  
}
```

## next 模式

上述的中间件模式已经可以嵌套挂载多个 before 和 after 函数了,
看上去十分强大, 但如果我们需要 before 和 after 同时持有相同的状态呢？

比如, 统计 f 的执行时间, 就需要 before 读取当前时间,
after 减去 before 读取的时间,
我们可以用闭包或者其它手段来来解决这个持有相同状态的问题。

如果我们需要 before 不执行 f 怎么办呢？
比如被 f 的参数不合法, 强行使用可能会导致系统错误,
所以我们需要拦截这次调用, 但 before 并没有拦截函数调用的功能。
我们可以改造 before 挂载函数, 使其能够拦截函数调用。

如果我们想要修改传入的参数, 又应该怎么做呢？想必你们心中已经有答案了。

我们更改一下 before 函数和 after 函数的执行格式。

```javascript

Function.prototype.use = function (middle) {
  const self = this;
  return function (params) {
    // 将 self 传入中间件
    return middle(params, self);
  }
}

function f(params) {
  console.log(params);
}

// 给 f 添加中间件
f = f.use(function (params, next) {
  // 这里是 before
  console.log('开始计时');
  // before 和 after 由于在相同的上下文里,
  // 所以可以共享状态
  const current = Date.now();
  // next 就是被包装的函数 f
  const result = next(params);
  // 这里是after
  const spend = Date.now() - current;
  console.log('结束计时');
  console.log(`运行消耗了 ${spend} ms`);
  return result;
})

f('执行 f 函数');
// 执行结果:
// 开始计时
// 执行 f 函数
// 结束计时
// 运行消耗了 0 ms
```

这样, 我们可以通过控制 next 函数的调用位置来控制这是一个 before 还是一个 after,
亦或者是拥有相同上下文的 before 和 after。
还可以通过控制 next 的调用与否, 拦截 f 函数的执行, 以及调整传入的参数,
做一些非标准的类型转换。

我们可以简单封装一下, 将其封装成一个类。

```javascript
class MiddlerWare {

  constructor () {
    this.middle = new Array();
  }

  use (...fns) {
    fns.forEach(fn => this.middle.push(fn));
    return this;
  }

  unUse (fn) {
    const index = this.middle.indexOf(fn);
    if (index >= 0)
      this.middle.splice(index, 1);
    return this;
  }

  compose (info) {
    if (this.middle.length > 0) {
      const mixIn = (opts, f) => ({ ...opts, remove: () => this.unUse(f) });
      return (next) => this.middle.reduce(
        (f1, f2) => (opts, next) =>
          f1(mixIn(opts, f1), () => f2(mixIn(opts, f2), next))
      ) (info, next);
    } else {
      return (next) => next();
    }
  }

}
```

```javascript
// 实例代码

const mid = new MiddlerWare();

// 添加多个中间件
mid.use((opts, next) => {
  console.log('mid 1 s')
  console.log(opts);
  const result = next();
  console.log('mid 1 e')
  return result;
}).use((opts, next) => {
  console.log('mid 2 s')
  console.log(opts);
  const result = next();
  console.log('mid 2 e')
  return result;
}, (opts, next) => {
  console.log('mid 2 s')
  console.log(opts);
  const result = next();
  console.log('mid 2 e')
  return result;
});

function f (params) {
  console.log(params);
}

f = f.use((params, next) => {
  return mid.compose({params})(() => {
    next(params)
    return 0;
  });
});

f([1,2,3,4,5]);
// 执行结果:
// mid 1 s
// { params: [ 1, 2, 3, 4, 5 ], remove: [Function: remove] }
// mid 2 s
// { params: [ 1, 2, 3, 4, 5 ], remove: [Function: remove] }
// mid 2 s
// { params: [ 1, 2, 3, 4, 5 ], remove: [Function: remove] }
// [ 1, 2, 3, 4, 5 ]
// mid 2 e
// mid 2 e
// mid 1 e
```

## 两者如何相互转换

正因为 next 回调式的中间件 api 是如此的优秀,
使其出现在了几乎格式的支持中间件的框架种,
比如 nodejs 中著名的 Koa 就是以异步中间件的洋葱模型而闻名于世的。

但是这种 api 并不是没有缺点, 我们先来看看异步函数的中间件。

```javascript
async function middle (ctx, next) {
  console.log('mid s');
  await next();
  console.log('mid e');
}

function f(params) {
  console.log(params);
}

// 用立即执行函数覆盖掉子作用域中的 f ,
// 避免污染父作用域的 f 造成无限递归
f = params  => (f => { middle({}, () => f(params)); })(f);

f([1,2,4]);
```

虽然在异步函数 middle 中共享了上下文, 但有些时候,
这个 next 的异步函数会等待很长时间。
长到会打乱程序的顺序结构, 长到 before 和 after 需要分开调用。

比如在 react 和 vue 等著名前端框架中,
会有关于 dom 生命周期的钩子函数, 以 vue 为例,
vue 有一对 beforeMount 和 mounted 的钩子,
和一对 beforeDestroy 和 destroye 的钩子,
这些 api 有点类似之前 before 和 after 的中间件形式。

我们想要将其写成 next 的形式。

```javascript
const hooks = {
  befor () {
    // ... todo something
  },
  after () {
    // ... todo something
  }
}

// =-- 改写成 --=

async hooks (next) {
  // before ... todo something
  await next();
  // after ... todo something
}
```

意味着我们要把一个异步函数, 拆成两个同步函数, 然后挂载到对应的监听器上。

```javascript
async function middle (next) {
  console.log('start');
  await next();
  console.log('end');
}

function gain (middle) {
  let handler = null;
  // 阻塞异步函数 middle
  const block = () => (new Promise((res, rej) => handler = res));
  const f1 = () => middle(block);
  const f2 = () => handler(0);
  return [f1, f2];
}

// 这样, 我们就把一个回调函数拆成了两个同步函数
const [f1, f2] = gain(middle);

// 挂载到对应的监听器上。
setTimeout(() => {
  f1();
}, 1000);

setTimeout(() => {
  f2();
}, 2000);
// start 在 1s 后打印
// end   在 2s 后打印
```

这意味着我们可以像编写 koa 中间件一样编写这些回调函数。
我们可以把资源的申请和释放写在一个函数里而不用跨越作用域。

vue 的完整生命周期由组件创建、挂载、卸载几个阶段构成。
所以写成异步函数的模式的话需要更多的阻塞参数。

```javascript
async function fullLife (creating, compiling, mounting, lifing, unMounting) {
  // beforeCreate hooks
  await creating();
  // ceated hooks
  await compiling();
  // beforeMount hooks
  await mounting();
  // mounted hooks
  await lifing();
  // beforeUnmount hooks
  await unMounting();
  // unmounted hooks
}

function gain(fullLife) {
  const handler = [];
  const block = [
    () => (new Promise(res => handler[0] = res)),
    () => (new Promise(res => handler[1] = res)),
    () => (new Promise(res => handler[2] = res)),
    () => (new Promise(res => handler[3] = res)),
    () => (new Promise(res => handler[4] = res)),
  ];
  return [
    () => fullLife(...block),
    () => handler[0](),
    () => handler[1](),
    () => handler[2](),
    () => handler[3](),
    () => handler[4](),
  ]
}

// 将一个全生命周期的函数拆成了多个生命周期的钩子函数
const [
  beforeCreate,
  created,
  beforeMount,
  mounted,
  beforeUnmount,
  unmounted,
] = gain(fullLife);
```

# 结语

`after / before` 模式和 `next` 模式, 在其它文章中已有详细的论述,
本文重点在于讨论两者的转换, 以及可能的应用场景。