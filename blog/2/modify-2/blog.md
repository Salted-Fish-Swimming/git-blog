# js 设计模式

目前网上关于 java 的设计模式的文章比较多，
很多介绍 js 的设计模式的文章仅仅只是把 java 的设计模式生搬硬套在 js 上，
导致写出来的 js 代码很奇怪，有一股奇怪的 java 味 (~~js被java ntr了~~) 。

js 不像 java 有完整的面向对象机制:
- js 是弱类型语言，
不像 java 有强类型对变量进行约束，
所以 js 能写出 javaer 不能接受的类型不安全的自由的代码。
- js 的没有类，
js 是通过对象上一个叫 `__proto__`
的属性构成的原型链机制来实现类似 java 的类继承机制，
- js 是 duck 类型的，js 没有像 java 一样的接口

## 单例模式