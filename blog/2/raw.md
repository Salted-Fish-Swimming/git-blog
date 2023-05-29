# raw

## 设计模式原则

### solid

- S – Single Responsibility Principle 单一职责原则
  - 一个程序只做好一件事
  - 如果功能过于复杂就拆分开，每个部分保持独立

- O – OpenClosed Principle 开放/封闭原则
  - 对扩展开放，对修改封闭
  - 增加需求时，扩展新代码，而非修改已有代码
  - 这是软件设计的终极目标

- L – Liskov Substitution Principle 里氏替换原则
  - 子类能覆盖父类
  - 父类能出现的地方子类就能出现
  - js中使用较少（弱类型 && 继承使用较少）

- I – Interface Segregation Principle 接口独立原则
  - 保持接口的单一独立，避免出现胖接口
  - 类似于单一职责原则，这更关注接口

- D – Dependency Inversion Principle 依赖倒置原则
  - 面向接口编程，依赖于抽象而不依赖于具体
  - 使用方只关注接口而不关注具体类的实现

---
> version: 1

# js 中的设计模式

目前网上关于 java 的设计模式的文章比较多,
很多介绍 js 的设计模式的文章仅仅只是把 java
的设计模式生搬硬套在 js 上,
导致写出来的 js 代码很奇怪, 有一股奇怪的 java 味。

js 和 java 存在以下区别。

- js 是弱类型语言， 不像 java 有强类型对变量进行约束，
所以 js 能写出 javaer 不能接受的类型不安全的自由的代码。

- js 的没有类, js 是通过对象上一个叫 `__proto__`
的属性构成的原型链机制来实现类似 java 的类继承机制,

- js 是 duck 类型的, js 没有像 java 一样的接口,
ts 的接口也只是对对象的 __形状__ 来判断,
即如果对象存在某个名叫 `abc` 的属性, 那么它就是合法的。

- js 没有 java 一样复杂的多线程问题, 或者说,
没有 java 复杂的多线程模型带来的条件竞争的问题。
但 js 有自己的竞态问题。

综上所述, js 的设计模式和 java 的一些设计模式会存在一些区别

---

> version 2
