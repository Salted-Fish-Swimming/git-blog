# 子类型-逆变与协变

一个现代的静态类型编程语言一般都要支持支持泛型系统以实现在复用某些更高级的模块, 
比如最常用的排序函数。

排序函数通常在内部使用一些优化过的排序方法, 
这些算法通常比程序员现场手搓的性能要高。
学过离散数学的我们知道, 一个集合要排序需要有一个全序关系, 
即集合内的任意两个元素能比较大小。

这两个条件变成函数的入参函数的签名就如下所示。

```
// 排序函数的函数签名
Sort<T>(
  T[],              /* param1: 待排序数组 */
  (T, T) -> boolean /* param2: 比较函数 */
) -> T[] /* return: 排序完成数组 */
```

为了使这个函数能接受各种各样的数组, 类型 `T` 就不能限定的太死。
类型 `T` 可以是普通的基础类型(此处指无法被继续分解的类型),
比如 `int, float, char` 等, 也可以是其它复合类型, 比如数组。

## 什么是泛型

通过上面的例子我们可以看到, 有很大一部分代码是类型无关的,
比如各种排序算法和各种容器类。

我们可以简单的把泛型看成是一个返回类型的函数, 即

```
generic := (.../* 可以是类型也可以是值 */) => Type
```

对于上面的排序函数前面, 我门可以看作

```
Sort<T> = (T[], (T, T) -> boolean) -> T[]
```

某些语言的类型系统支持依值类型,
这个返回类型的函数, 其参数也可以是值。

一个缺少泛型系统的语言需要对为了通过编译器的类型检查需要编写大量的模板代码,
这些模板代码在摧残程序员手指的同时也在摧残程序员的心智。

同时, 更多的代码也意味着更多的测试和更多的编码工作量
(即使有编辑器能够批量生成代码, 也需要检查审计生成的代码是否可靠)。

## 什么是子类型

这里为了方便讨论, 我们简单定义为满足里氏替换原则
(子类能够完全替换父类) 的类型就是子类型。

对于 java 这样 all-in `OOP` 的语言, 其类继承机制就是天生支持里氏替换原则的。
只要子类没有重写掉父类的方法, 子类的实例完全可以当作父类的实例使用,
而不会与父类有任何区别。

当 `B` 是 `A` 的子类型, `C` 是 `B` 的子类型时, `C` 也是 `A` 的子类型,
可以看到子类型据有传递性, 子类型是一个偏序关系。

```
A <: B <: c
```

接下来我们看一个简单的例子。

我们假设 `A` 是 `B` 的父亲类型 `C` 是 `B` 的子类型,
同理, 我们对 `D` `E` `F` 也采取相同的定义。

```
A  <:  B  <:  C

D  <:  E  <:  F
```

当存在一个类型为 `B -> E` 的函数时, 我们想要替换掉这个函数,
只要替换的这个函数类型和原函数相同(不考虑程序逻辑), 就不会有问题。

当我们用一个类型为 `A -> E` 的函数去替换时, 也不会出现问题,
因为传入的参数是更具体的 `B` 类型,
根据里氏替换原则, 不会对这个函数的正常运行造成影响,
即 `A -> E` 类型的函数能够完全替换 `B -> E` 。
根据前面我们对于子类型的定义, 我们可以说
`A -> E` 是 `B -> E` 的子类型。

同样的, 我们可以得出 `B => E` 是 `A => E` 的子类型。

```
(B -> E)  <:  (A -> E)  <:  (A -> F)
(B -> E)  <:  (B -> F)  <:  (A -> F)
```

## 逆变与协变

我们看到函数类型的子类型关于入参类型和出参类型发生了变化,
函数类型的子类型关于入参类型变得更泛化, 关于出参类型变得更具体,
写下来就是这样

```
(S1 -> T1)  <:  (S2 -> T2)
S1  :>  S2
T1  <:  T2
```

可以看到 `S` 类型变化与函数类型的变化相反,
`T` 类型的变化与函数类型的变化相同。
函数的入参类型与函数本身的类型变化是相反的, 我们称这样的变化是逆变的,
出参类型与函数本身的类型变化是相同的, 我们称这样的变化是协变的。

其实函数类型可以看作是由两个类型组合成的更复杂具体的类型

```
Function<S, T> = S -> T
```

数组也可以看成是一个泛型

```
Array<T> = T[]
```

那么数组泛型关于 `T` 是逆变的还是协变的呢？

我们可以先尝试找到数组类型的子类型,
我们假设存在 `A` `B` `C` 三个类型, 这三个类型对应的子类型关系如下

```
A  <:  B  <:  C
```

我们先假设 `B[]` 的子类型是 `A[]`。

对于一个变量 `x: B[]`, 我们根据预期的类型, 希望里面存入的是 `B` 的子类型。

假设存在一个变量 `y: A[]`, 根据前面的假设, 这个变量的值可以是 `y = x`,
现在我们往 `y` 这个数组里存入一个 `A`类型的值,

```
y.push(a: A) // 向 y 数组中填入一个类型为 A 的值
```

则从 `x` 里就有可能取出类型 `A` 的值, 一个类型不是 `B` 子类型的值。

```
let a: A = x.pop() // x 中取出了类型不安全的值
// x 的类型是 B[], 应该取出 B, C 类型的值而不是 A 类型的值
```

所以数组类型不是逆变的, 那么数组类型是不是协变的呢？

同样, 我们假设又存在一个变量 `z: C[]` , 根据上面的假设,
这个变量的值可以是 `z = x`, 当我们从 `z` 里取出一个值时,
会发现取出的这个值类型为 `c: B = z.pop()`, 不符合 `z` 标注的 `C[]` 类型。

所以, 对于普通编程语言中的可读可写数组 `T[]` 而言, 其既不是逆变的,
也不是协变的。

### java 的泛型数组

java 就犯了这个错误, java 的数组是协变的, 但协变数组有可能往里面写入不安全的类型,
所以要做运行时类型检查, 因为要做运行时类型检查, 所以数组的类型就需要在声明时确定,
而 java 的泛型又是基于类擦除机制,
导致 java 的泛型代码编译以后所有的泛型在字节码里都是 Object 类型。

这意味着数组类型脱离了类型检查, 会造成上述所说的累心不安全的隐患,
所以 java 不允许创建泛型数组 ( 最新的 java 可以创建泛型数组,
但只是放松了类型检查, 还是没有办法创建对应类型的数组,
你从一个类型比较严格的泛型数组中还是有可能取出 Object 出来 ) ,
只能通过反射的方式获取类型后再根据类型创建对应类型的数组。

但相信我, 对于普通的程序员而言, 泛型数组和协变数组, 大多数都会选择后者。

那我即想要数组协变, 又想要泛型数组呢？
那数组的读取和写入就不应该耦合在一起, 换句话说,
可读的数组和可写的数组对应两种类型, 可读的数组是逆变,
可写的数组是协变的。
或者像 rust 一样有变量借出机制, 天然区别可读可写。

### 其它的逆变和协变

泛型主要在容器类里使用比较多,