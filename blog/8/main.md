# FP 式组件走到头了吗 : 一种新的基于生成器函数的组件范式

前几天在逛知乎时忽然发现一篇文章
[四年了，我为什么还是不喜欢 React Hooks](https://zhuanlan.zhihu.com/p/630723565) ,
作为前端 FP 督战队， 我一下就兴奋起来了.
React 这些年不思进取，早该重回底边了.
我怀着狠狠拷打 React 的迫切希望点进了这篇文章.

只能说, 希望有多大, 失望就有多大.
作者开门见山的给自己叠甲: 啊, 我不懂FP, 我是乱说的.
他可不是乱说, 他是有 bear 来!

作者以一个纯路人的视角去审视了 React 的 Hooks API,
发现它并没有文档中描述的那么美好, 凑合的 API 设计外表之下, 
是丑陋的代码实现 ~~(这世上有不丑陋的实现吗？)~~ .
甚至抛开这些不谈,
React Hooks 尝试用 useEffect 去管理生命周期这个行为本身就不是 FP 的,
他是 OOP 的.

前面关于 API 设计的论述可谓是一阵见血,
但关于 Hooks API 甚至 FP 本身的评论就大失水准了.
甚至搞出了 前端FP == COP == OOP 的暴论,
甚至连 Algebraic Effects 都没听说过就开指责 Hooks api 违背函数式编程的祖宗之法了。

论述到最后居然要开 OOP 的倒车。
恕我直言， 如果一个人对 OOP 的了解仅限于 Java 的那一亩三分地，
那属于是既不懂 OOP 也不懂 FP。

## 为什么会有 Hooks API ? 

首先, 为什么要有 Hooks API ? Hooks API 是什么？

要回答这个问题

## 怎么管理副作用？

```jsx
const component = (/** props **/) => {
  /** code para 1 **/
  const [state, setState] = useState(/** initial state **/)
  /** code para 2 **/
  return (
    <div>
      { state }
      <button onClick={ setState }>
    </div>
  )
}
```

```jsx
const component = (/** props **/) => {
  /** code para 1 **/
  return useState(/** initial state **/, (state, setState) => {
    /** code para 2 **/
    return (
      <div>
        { state }
        <button onClick={ setState }>
      </div>
    )
  })
}
```

```
Props -> Dom
Props -> Effect Dom
```

```js
const useABC = (...args) => {
  /** para1 **/
  const [xx, sxx] = useXXX(...);
  /** para2 **/
  return xxx
}

const useABC = (...args, k) => {
  /** para1 **/
  return useXXX(/***/, (xx, sxx) => {
    /** para2 **/
    k(xxx);
  })
}
```

```js
const useTest = (...argsk) => {
  /** para1 **/
  if (cond) {
    /** para2 **/
    const [a, b] = useXXX1(...);
    /** para3 **/
  } else {
    /** para4 **/
    const [c, d] = useXXX2(...);
    /** para5 **/
  }
  /** para6 **/
}

const useTest = (...args, k) => {
  /** para1 **/
  If(cond, () => {
    /** para2 **/
    const [a, b] = useXXX1(...);
    /** para3 **/
  }, () => {
    /** para4 **/
    const [c, d] = useXXX2(...);
    /** para5 **/
  })
  /** para 6 **/
}

const useTest = (...args, k1) => {
  /** para1 **/
  return If(cond, (k2) => {
    /** para2 **/
    return useXXX1(a, b, (...) => {
      /** para3 **/
    });
  }, (k2) => {
    /** para4 **/
    return useXXX2(c, d, (...) => {
      /** para5 **/
    });
  })
}
```