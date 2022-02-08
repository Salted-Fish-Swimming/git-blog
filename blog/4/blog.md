# 如何在 node 中执行 powershell 以更改防火墙

  我最近在做的一个私人 node 服务器需要在局域网内通过手机访问,
但 win10 的防火墙需要手动开关, 我想把开关防火墙的功能写到 node 脚本里,
所以有了这篇文章。

  据我所知，使用 node 更改防火墙更多的是通过命令行的方式修改,
之前 cmd 时代使用的命令行工具是 NETSH ,
现在微软旗下使用较多的命令行工具是 powershell ,
cmd 时代的命令行工具已经慢慢的弃用了。

>   这篇文章也是我记录我在实现这个功能时遇到的困难, 
> 不同的编程平台和版本可能回遇到不同的问题, 本文只做参考, 不构成指导意见。
> 因为写这篇文章前前后后花了不少时间,
> 所以可能会出现一些前后文逻辑不太通顺的情况,
> 还请斧正。

我的 node 版本和 powershell 版本。

```powershell
PS E:\server\Test> node -v
v14.16.0
PS E:\server\Test> Get-Host

Name             : ConsoleHost
Version          : 5.1.19041.1237
InstanceId       : be526335-fd53-4df1-a7f3-c81884cb1e3e
UI               : System.Management.Automation.Internal.Host.InternalHostUserInterface
CurrentCulture   : zh-CN
CurrentUICulture : zh-CN
PrivateData      : Microsoft.PowerShell.ConsoleHost+ConsoleColorProxy
DebuggerEnabled  : True
IsRunspacePushed : False
Runspace         : System.Management.Automation.Runspaces.LocalRunspace

```

## 如何在 node 中执行 powershell

  node 有一个用于执行命令行命令的原生 api , `child_process` 。
`child_process` 下的 `exec` 方法可以异步的执行命令行的命令。

### child_process

  `child_process.exec` 的使用方式如下。

```javascript
const { exec } = require('child_process');
exec('Get-ChildItem', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
  }
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
});
```
> `Get-ChildItem` 是 powershell 下的 `ls` 。

  当你运行如上代码的时候, 回抛出一个异常和乱码, 先解决乱码问题。

```powershell
PS E:\server\Test> node .\test.js
Error: Command failed: Get-ChildItem
'Get-ChildItem' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���
���������ļ���

    at ChildProcess.exithandler (child_process.js:308:12)
    at ChildProcess.emit (events.js:315:20)
    at maybeClose (internal/child_process.js:1048:16)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:288:5) {
  killed: false,
  code: 1,
  signal: null,
  cmd: 'Get-ChildItem'
}
'Get-ChildItem' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���
���������ļ���
```

#### iconv 和 iconv-lite

  由于该死的微软还在兼容 gbk 编码, 导致 win10 的命令行经常出现编码相关的问题。
而好死不死, node 刚好原生不兼容 gbk 编码,
node 原生只支持 `ascii` 和 `utf-8` 等少数几种原生编码, 和其它格式的二进制编码。

  所以, 要想解析 `gbk` 编码, 需要外部引入一个库, 这个库的名字叫 `iconv` ,
在 npm 资源的官网, 可以搜索到两个相似的库, 一个叫 `iconv` ,
另一个叫 `iconv-lite`, 前者是用 C++ 编写的,
如果电脑没有配置对应的 python 和 VS 的编译工具, 就会报错安装失败。
后者则是纯 js 版本, 直接 install 就行。

```powershell
PS E:\server\Test> npm install iconv-lite
```

安装好后,  我们再如下修改代码。

```javascript
const { exec } = require('child_process');
const iconv = require('iconv-lite');

exec(
  'Get-ChildItem', { encoding: 'binary' },
  (err, stdout, stderr) => {
    if (err) {
      err.message
        = iconv.decode(Buffer.from(err.message, 'binary'), 'gbk');
      console.log(err);
    }
    if (stdout) {
      stdout = iconv.decode(Buffer.from(stdout, 'binary'), 'gbk');
      console.log(stdout);
    }
    if (stderr) {
      stderr = iconv.decode(Buffer.from(stderr, 'binary'), 'gbk');
      console.log(stderr);
    }
  }
);
```

运行代码, 得到如下结果。

```powershell
PS E:\server\Test> node .\test.js
Error: Command failed: Get-ChildItem
'Get-ChildItem' 不是内部或外部命令，也不是可运行的程序
或批处理文件。

    at ChildProcess.exithandler (child_process.js:308:12)
    at ChildProcess.emit (events.js:315:20)
    at maybeClose (internal/child_process.js:1048:16)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:288:5) {
  killed: false,
  code: 1,
  signal: null,
  cmd: 'Get-ChildItem'
}
'Get-ChildItem' 不是内部或外部命令，也不是可运行的程序
或批处理文件。
```

  好了, 乱码问题算是解决了, 现在来解决报错的问题。

  这个报错提示一看就是 cmd 的报错提示, 我们尝试执行 `dir` 命令,
将代码中 `'Get-ChildItem'` 修改为 `'dir'`。运行结果如下。

```powershell
PS E:\server\Test> node .\test.js
 驱动器 E 中的卷没有标签。
 卷的序列号是 5A48-2CED

 E:\server\Test 的目录

2021/09/22  23:16    <DIR>          .
2021/09/22  23:16    <DIR>          ..
2021/09/18  11:51               263 app.js
2021/09/20  18:29             1,437 index.js
2021/09/22  22:17    <DIR>          node_modules     
2021/09/22  22:17            45,211 package-lock.json
2021/09/22  22:17               406 package.json     
2021/09/15  16:36    <DIR>          static
2021/09/22  23:15             1,895 test.js
               5 个文件         49,212 字节
               4 个目录 13,801,934,848 可用字节      
```

  看来 `exec` 应该是使用 cmd 来解析命令的。

  我们翻阅 node 的 child_process 中关于 exec 的文档,
可以看到 `options` 的参数中有一个 `shell` 的选项,
默认参数是 `process.env.Comspec` , 我们打开 node 的 repl 查看一下这个值。

```powershell
PS E:\server\Test> node 
Welcome to Node.js v14.16.0.      
Type ".help" for more information.
> process.env.Comspec
'C:\\Windows\\system32\\cmd.exe'
>
```

  果然是 cmd , 我只需要修改一下 `options` 参数中 `shell` 的值就行了。
代码如下。

```js
const { exec } = require('child_process');
const iconv = require('iconv-lite');

exec(
  'Get-ChildItem', { encoding: 'binary', shell: 'powershell' },
  (err, stdout, stderr) => {
    if (err) {
      err.message
        = iconv.decode(Buffer.from(err.message, 'binary'), 'gbk');
      console.log(err);
    }
    if (stdout) {
      stdout = iconv.decode(Buffer.from(stdout, 'binary'), 'gbk');
      console.log(stdout);
    }
    if (stderr) {
      stderr = iconv.decode(Buffer.from(stderr, 'binary'), 'gbk');
      console.log(stderr);
    }
  }
);
```

  执行结果如下。

```powershell
PS E:\server\Test> node .\test.js


    目录: E:\server\Test


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         2021/9/22     22:17                node_modules
d-----         2021/9/15     16:36                static
-a----         2021/9/18     11:51            263 app.js
-a----         2021/9/20     18:29           1437 index.js
-a----         2021/9/22     22:17          45211 package-lock.json
-a----         2021/9/22     22:17            406 package.json
-a----         2021/9/22     23:27           1921 test.js


```

  除了 `exec` 的命令执行方式, 还有 `spawn` 的方式。
`spawn` 会生成一个子进程, 通过往这个子进程写入数据来执行命令,
监听进程的输出获得执行结果。

```js
const { spawn } = require('child_process');
const iconv = require('iconv-lite');

const child = spawn('powershell');

// 绑定输出事件
child.stdout.on('data', (data) => {
  data = iconv.decode(Buffer.from(data), 'gbk');
  console.log(data);
});

child.stderr.on('data', (data) => {
  data = iconv.decode(Buffer.from(data), 'gbk');
  console.log(data);
});

// 绑定结束事件
child.on('exit', () => {
  console.log('powershell exited');
});

// 执行 powershell 命令
const script = [
  'Get-ChildItem',
  'exit', // 如果不退出的话, 程序会阻塞住，不会结束
].forEach(command => {
  child.stdin.write(command);
  child.stdin.write('\n');
});
```

  或者封装成一个对象。

```js
const { spawn } = require('child_process');
const iconv = require('iconv-lite');

const PSRunner = {
  results: new Array(),
  child: spawn('powershell'),
  init ()  {
    // 使用管道的方式处理流
    // 将子进程的输出流绑定到当前进程上
    this.child.stdout
      .pipe(iconv.decodeStream('gbk'))
      .pipe(iconv.encodeStream('utf-8'))
      .pipe(process.stdout);
    this.child.stderr
      .pipe(iconv.decodeStream('gbk'))
      .pipe(iconv.encodeStream('utf-8'))
      .pipe(process.stderr);

    return this;
  },
  send (commands) {
    this.child.stdin.write(commands);
    this.child.stdin.write('\n');
  }
}.init();

// 执行命令
PSRunner.send('Get-ChildItem');
PSRunner.send('Get-Host');
PSRunner.send('exit');
```

  第二种方式使用了 node 的 stream 的 api 绑定命令行的输出。

### node-powershell

  node-powershell 是一个用于执行 powershell 的库,
作者将 powershell 相关的执行函数和原生的子进程进行了封装,
使得使用起来更加方便。

  执行 

```js
const iconv = require('iconv-lite');
const shell = require('node-powershell');

// 创建一个 powershell 执行实例
const ps = new shell({
  executionPolicy: 'Bypass',  // 安全策略
  noProfile: true,
});

// 添加命令
// 由于使用了 await , 不要忘了包在 async 里面
await ps.addCommand('echo hello node-powershell');
await ps.addCommand('Get-ChildItem');
await ps.addCommand('ls');

// 执行脚本并输出结果
const originOutput = await ps.invoke();
// 很不幸, 作者并没有适配字符编码的问题
// 因为该死微软的字符编码是随着地区不同而改变的
// 在中国就是 gbk , 在欧洲就是 iso
const output  = iconv.decode(Buffer.from(originOutput), 'gbk');
console.log(output);

// 结束 ps invoke 出来的进程
ps.dispose();
```

  一条 powershell 通常由单数的命令和和复数参数选项构成,
比如下面这一条生成防火墙规则的命令。

```powershell
New-NetFirewallRule
  -DisplayName "Block WINS" -Direction Inbound -Action Block
  -RemoteAddress WINS
```

`node-powershell` 封装了关于构造 powershell 命令的 api ,

```javascript
const iconv = require('iconv-lite');
const shell = require('node-powershell');

// 第一种api
const ps = new shell({
  executionPolicy: 'Bypass',  // 安全策略
  noProfile: true,
});
await ps.addCommand('New-NetFirewallRule')
await ps.addParameter({
  DisplayName: "Block WINS", Direction: "Inbound",
  Action: "Block", RemoteAddress: "WINS",
});

// 第二种 api
const { PSCommand } = shell;
const netwall = new PSCommand('New-NetFirewallRule');
netwall.addParameter({
  DisplayName: "Block WINS", Direction: "Inbound",
  Action: "Block", RemoteAddress: "WINS",
});
ps.addCommand(netwall);

// 执行
await ps.invoke();

// 关闭
await ps.dispose();
```

### edge.js

  这是一个十分强大的 js 库, 能够从 node 中执行
`C#, J#, .Net, SQL, Python, powershell` 等 CLR 语言。
但使用 edge 需要配置 `.NET` 运行环境, 此处就不多做赘述。

## 如何使用 powershell 更改防火墙

### PowerShell

  与传统的 bash 等 CUI(Command User Interface) 不同,
powershell 默认返回的不是字符串, 而是 .NET 对象。
powershell 提供了一整套关于 .NET 对象的操作命令和输出方式。

#### PowerShell 的常用命令

> 此部分内容来自互联网和 powershell 官方文档

  powershell 提供了一些常用的命令的类似 linux 命令的缩写, 
以减小其它 bash 使用者的门槛, 具体有哪些命令可以使用 `Get-Alias` 查看。
  
| linux 命令 | powershell |
| ---     | ---             |
| `ls`    | `Get-ChildItem` |
| `cd`    | `Set-Location`  |
| `pwd`   | `Get-Location`  |
| `cp`    | `Copy-Item`     |
| `rm`    | `Remove-Item`   |
| `rmdir` | `Remove-Item`   |

  powershell 的命令返回的基本都是 .NET 对象。 可以通过 `.GetType()` 方法读取类型。

```powershell
PS E:\server\Test> (ls).GetType()

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     True     Object[]                                 System.Array

PS E:\server\Test> (pwd).GetType()

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     False    PathInfo                                 System.Object

```

  `ls` 返回的是一个 Object 数组, `pwd` 返回的是一个普通的对象。
但数组可以看作是一个特殊的对象。是对象就有属性, 在 powershell 中,
可以通过 `Get-Member -InputObjec` 访问对象可以访问的成员。

```powershell
PS E:\server\Test> Get-Member -InputObject (pwd)

   TypeName:System.Management.Automation.PathInfo

Name         MemberType Definition
----         ---------- ----------
Equals       Method     bool Equals(System.Object obj)
GetHashCode  Method     int GetHashCode()
GetType      Method     type GetType()
ToString     Method     string ToString()
Drive        Property   System.Management.Automation.PSDriveInfo Drive {get;}    
Path         Property   string Path {get;}
Provider     Property   System.Management.Automation.ProviderInfo Provider {get;}
ProviderPath Property   string ProviderPath {get;}

```

  也可以使用管道的写法。
```powershell
# 我们会用如下的命令提示符来提示要执行的命令
PS :\ps> pwd | Get-Member
```

### powershell 一些简单的操作对象的命令

> 此部分内容部分来自博客 [使用管道符在PowerShell中进行各种数据操作](htps://www.cnblogs.com/studyzy/p/4518807.html)

#### Import / Export

  前面我们说过, powershell 是基于 .NET 对象的交互式 shell ,
当我们想要保存 .NET 对象的时候, 可以使用 `Export-Csv [path] -Encoding Utf-8 `
将数据以 CSV 的格式通过 `Utf-8` 的编码方式保存在对应路径下,
可以使用 `Import-Csv [path] -Encoding Utf-8` 来载入数据。

```powershell
# 获取进程数据写入文件
PS :\ps> Get-Process | Export-Csv '.\process.csv' -Encoding Utf-8
# 从对应的 CSV 载入数据
PS :\ps> $data = Import-Csv '.\process.csv' -Encoding Utf-8
```

#### Select-Object

  大多数命令返回的都是一个对象数组, powershell 的管道就是为对象数组设置的。
返回结果的形式比较像数据库查询返回的表, 所以 这部分对象管道的命令比较像 SQL
的关键字, 我们可以简单的套用一下 SQL 的语言模型,
并且后文在某些时候会用列名代指数组里对象的属性名, 但要认识到两者的区别。

  我们可以使用 `Select-Object -Property <属性数组>` 或者简写的 
`select <属性数组>` 命令来选定要展示的列或者说要展示的数组中的对象的属性。
其作用类型于 SQL 查询语言中的 `select` 关键字。

```powershell
# 完整命令
PS :\ps> $data | Select-Object -Property Name, VM, @{ label="VM(Mb)" ; expression={ $_.VM/1MB} }
# 命令缩写, 省略 `-Property` 
PS :\ps> $data | select Name, VM, @{ l="VM(Mb)" ; e={ $_.VM/1MB} }
```
##### powershell 创建对象和数组

  powershell 原生支持数组和对象, 创建数组只需要 `,` 符号分割,
创建对象需要以 `@` 符号开头。

```powershell
PS :\ps> $list1 = 1, 2, 3, 4, 5
# 以下两种都是合法的创建数组的方式
PS :\ps> $list2 = (1, 2, 3, 4, 5)
PS :\ps> $list3 = @(1, 2, 3, 4, 5)
# 数组的成员也可以是命令的执行结果或者 .NET 对象
PS :\ps> $list1 = @((ls), (pwd), (ps))
# 对象的成员也与数组的成员一样
PS :\ps> $dict = @{ prop1="value1" ; prop2=2 ; prop3=(ls) };
# 嵌套复合型数据
PS :\ps> $data = @{
  prop1=("item1", (pwd), @{ key = "value1" });
  prop2=2 ; prop3=(ls)
};
```

  数组的成员可以是基础类型的数据, 比如字符串和数字, 也可以是复杂的 .NET 对象,
比如程序执行结果, 比如一个对象或是数组。

  现在来具体解释一下之前的命令:

```powershell
PS :\ps> $data | select Name, VM, @{l="VM(Mb)";e={$_.VM/1MB}}
```

  `$data` 是加载的之前保存的 `Get-Process` 命令的执行结果, 所以相当于执行了:

```powershell
# `ps` 是 `Get-Process` 的别名
PS :\ps> ps | select Name, VM, @{l="VM(Mb)";e={$_.VM/1MB}} 
```

  `select` 命令的 `Property` 参数 ( 省略掉了 `-Property` ,
此命令在不加选项时默认是 `Property` 的选项的参数 ) 要求是一个对象数组,
数组中的对象要么是 `String` 要么是 `caculated property` (可计算属性,
也是一个对象) 要么是 `ScriptBlock` (代码块)。

  `Name, VM, @{l="VM(Mb)";e={$_.VM/1MB}}` 就是声明一个数组的语法, 
只不过把声明数组的符号 `@(...)` 省去了而已。 对于存在选项里的 `Name`
和 `VM` 这样的字符序列 powershell 默认都是字符串。

```powershell
#"可以看到在对于选项的参数中,字符串可以不带"单引号"或者"双引号
PS E:\server\Test> select -InputObject abc | % { $_.GetType() }

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     True     String                                   System.Object

```

  所以命令:

```powershell
PS :\ps> select Name, Vm, @{l="VM(Mb)";e={$_.VM/1MB}}
```

  相当于命令:

```powershell
PS :\ps> select -Property @("Name", "Vm", @{l="VM(Mb)";e={$_.VM/1MB}})
```

  此处的 `@{l="VM(Mb)";e={$_.VM/1MB}}` 就是可计算属性,
不同命令的可计算属性要求并不相同, `select` 命令要求具有两个属性 `name/label`
和 `expression` , `name` 和 `label` 两者有其一即可, `expression`
的值要求是一个 `ScriptBlock`, 即大括号 `{...}` 包裹的 powershell 可执行代码块。
两个属性都可以使用缩写, 最终就是前一条命令展示的样子。

```powershell
# 完整的 select 命令
PS :\ps> Select-Object -Property @( "Name", "Vm", @{ label="VM(Mb)"; expression={$_.VM/1MB} } )
```

  powershell 具有完整的数学运算的功能, 可以直接在命令行里输入四则运算的字符串,
能够直接执行而不需要其它的命令。powershell 也支持常用的计算机大小单位,
比如常见的 `kb, mb, gb, tb`。

  `@{ label="VM(Mb)"; expression={$_.VM/1MB} }` 中的 `expression`
属性对应的代码块中的 `$_` 表示的是数组中的每一个对象的索引。`$_.VM/1MB`
表示将 `ps` 命令中的每一条结果中的 `VM` 属性除以 `1024 * 1024`,
并且将其列名命名为 `VM(Mb)` 。

>   个人理解, 可计算属性 - `Caculated Properties` 的 `Property` 指的是 `select` 命令的
> `-Property`选项, 不是 `@{l="VM(Mb)";e={$_.VM/1MB}}` 对象的属性。
>
> [可计算属性官方文档](https://docs.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_calculated_properties?view=powershell-5.1)
>
>   可计算属性也可以单纯的只用代码块:
> 
> ```powershell
> # 此处大括号包裹的 get-date 是一条获取日期的命令,
> # 大括号和其包裹的代码块本身就是一个可计算属性
> PS E:\server\Test> ls | select name, length, {Get-Date}
> 
> Name              length Get-Date
> ----              ------ --------
> node_modules             2021/9/26 23:14:27
> static                   2021/9/26 23:14:27
> app.js            263    2021/9/26 23:14:27
> index.js          1437   2021/9/26 23:14:27
> package-lock.json 45211  2021/9/26 23:14:27
> package.json      406    2021/9/26 23:14:27
> process.csv       158356 2021/9/26 23:14:27
> test.js           4461   2021/9/26 23:14:27
> 
> ```

  `Get-Process (ps)` 命令返回的结果的是一个对象数组, 数组里的对象的类型是
`Process`, 通过 `BaseType` 属性可以得知这个类型的继承关系。

```powershell
PS E:\server\Test> $type = $data[0].GetType()
PS E:\server\Test> $type.ToString()
System.Diagnostics.Process
PS :\ps> $type 

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     False    Process                                  System.ComponentModel.Component

PS :\ps> $type.BaseType

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     False    Component                                System.MarshalByRefObject


PS :\ps> $type.BaseType.BaseType

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     True     MarshalByRefObject                       System.Object

PS :\ps> $type.BaseType.BaseType.BaseType

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     True     Object

```

  我们使用 `Get-Member` 可以得知这个对象里有这么一群属性。

```powershell
PS E:\server\Test> $data[0] | Get-Member    

   TypeName:System.Diagnostics.Process

Name                       MemberType     Definition
----                       ----------     ----------
Handles                    AliasProperty  Handles = Handlecount
Name                       AliasProperty  Name = ProcessName
NPM                        AliasProperty  NPM = NonpagedSystemMemorySize64
PM                         AliasProperty  PM = PagedMemorySize64
SI                         AliasProperty  SI = SessionId
VM                         AliasProperty  VM = VirtualMemorySize64
WS                         AliasProperty  WS = WorkingSet64
Disposed                   Event          System.EventHandler Disposed(System.Object, System.EventA...
ErrorDataReceived          Event          System.Diagnostics.DataReceivedEventHandler ErrorDataRece...
Exited                     Event          System.EventHandler Exited(System.Object, System.EventArgs) 
OutputDataReceived         Event          System.Diagnostics.DataReceivedEventHandler OutputDataRec...
BeginErrorReadLine         Method         void BeginErrorReadLine()
BeginOutputReadLine        Method         void BeginOutputReadLine()
CancelErrorRead            Method         void CancelErrorRead()
CancelOutputRead           Method         void CancelOutputRead()
... ...

```

  可以看到, 之前我门选择的属性都是 `AliasProperty` , 是属性别名 ,
为了方便访问而设置的。`Name` 属性是 `ProcessName` 即 '进程名' 的别名,
`VM` 是 `VirtualMemorySize` 即 '虚拟内存大小' 的别名。

>   虽然 powershell 的命令又臭又长, 但基本做到了见名知意,
> 后面讲到防火墙相关命令的时候更是如此。但 powershell 的智能提示十分的不好用。 

  所以, 我们使用 `select` 命令选择了 `Name` 和 `VM` 属性,
并且通过可计算属性添加了一个名叫 `VM(Mb)` 的属性, 字面意思上讲,
这个属性展示进程的 '虚拟内存大小' , 以 `Mb` 为单位, 并且值是 `VM` 属性的值除以
`1024 * 1024`。

#### Measure-Object

  当我们要统计个数或者总和时, 可以使用 `Measure-Object` 命令。
我们可以通过 `Get-Alias` 命令获得 `Measure-Object` 的别名。

```powershell
PS :\ps> Get-Alias -Definition Measure-Object

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           measure -> Measure-Object

```

  `Measure-Object` 通常用于从管道中合并结果, 通过 `-Property` (默认缺省)
设置要统计的属性, 比如统计 `ls` 命令返回的数组中的对象中的 `Length` 属性,
然后添加 `-Sum -Average -Maximum -Minimum` 等参数以进行统计。

```powershell
# 统计当前目录下所有文件的大小
PS E:\server\Test> ls -Recurse | Measure-Object Length -Sum

Count    : 878     
Average  :
Sum      : 20058630
Maximum  :
Minimum  :
Property : Length  

PS E:\server\Test> ls -Recurse | Measure-Object Length -Sum -Average -Maximum -Minimum

Count    : 878
Average  : 22845.8200455581
Sum      : 20058630        
Maximum  : 633152
Minimum  : 5
Property : Length

```

  也可以统计多个属性。

```powershell
PS E:\server\Test> ps         

Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    509      29    28792      34976       0.86  10816   4 ApplicationFrameHost
     56       6      908       3964              5368   0 AsHidSrv64
    135       8     1732       5824              4960   0 AsLdrSrv64
    121       9     1372       7024       0.16  10924   4 AsMonStartupTask64
    112       5      996       4416              5356   0 ASUSOptimization
    423      15     7448      14624              5344   0 AsusSoftwareManager
    405      22    32732      31180       0.33   5284   4 AsusSoftwareManagerAgent
   5342      20     5172      23760              5336   0 AsusSystemAnalysis
    124       7     1312       5488              5324   0 AsusSystemDiagnosis
    139       8     1528       8436       0.03   2144   4 ChsIME
... ... 

PS E:\server\Test> ps | measure CPU -Sum        

Count    : 245
Average  :
Sum      : 13476.484375
Maximum  :
Minimum  :
Property : CPU

PS E:\server\Test> ps | measure PM, WS, CPU -Sum

Count    : 243        
Average  :
Sum      : 16261545984
Maximum  :
Minimum  :
Property : PM

Count    : 243        
Average  :
Sum      : 10135371776
Maximum  :
Minimum  :
Property : WS

Count    : 243        
Average  :
Sum      : 13465.6875 
Maximum  :
Minimum  :
Property : CPU        

PS E:\server\Test> ps | measure PM, WS, CPU -Sum -Average -Maximum -Minimum

Count    : 242
Average  : 54281444.4958678
Sum      : 13136109568     
Maximum  : 5686894592      
Minimum  : 61440
Property : PM

Count    : 242
Average  : 41522302.9421488
Sum      : 10048397312     
Maximum  : 1462370304      
Minimum  : 8192
Property : WS

Count    : 242
Average  : 17.7990056818182
Sum      : 4307.359375     
Maximum  : 1735.765625     
Minimum  : 0.6875
Property : CPU

# 使用 Format-Table 格式化输出
PS E:\server\Test> ps | measure PM, WS, CPU -Sum -Average -Maximum -Minimum | Format-Table

Count          Average         Sum    Maximum Minimum Property
-----          -------         ---    ------- ------- --------
  242 54632583.4049587 13221085184 5699870720   61440 PM      
  242 41892974.0165289 10138099712 1462378496    8192 WS      
  242 17.8390366735537 4317.046875 1736.28125  0.6875 CPU     

```

#### ForEach-Object

  类似于 javascript 中的 map 函数, 用于映射管道中的每一个对象, 简写成 `%` ,
也是它的别名。我们可以简单的做一些映射, 比如映射一些普通对象来生成测试数据。

```powershell
# ForEach-Object 有两个别名, 只不过 % 用得更多
PS :\ps> Get-Alias -Definition ForEach-Object

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           % -> ForEach-Object
Alias           foreach -> ForEach-Object

# 目标数据
PS :\ps> 1 , 2, 3 , 4
1
2
3
4
# 在执行脚本中生成了新的对象以代替原本管道中的数据
# 在 powershell 中 $_ 用于指代管道中的对象
PS :\ps> 1 , 2, 3 , 4 | % { @{ value=$_ } }

Name                           Value
----                           -----
value                          1
value                          2
value                          3
value                          4

```

#### Where-Object

  类似于 SQL 中的 `where` , 也类似于 javascript 中的 `filter` 函数,
通过脚本块中的逻辑表达式, 来决定当前计算的对象是否该存在于下一个管道流中。

```powershell
PS E:\server\Test> Get-Alias -Definition Where-Object

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           ? -> Where-Object
Alias           where -> Where-Object

# 查看进程中和 powershell 相关的进程信息
PS E:\server\Test> ps | ? { $_.name -like 'powershell' }

Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    610      32    95948      84720      22.03   5112   4 powershell
    669      33   125392      84836      18.02  14268   4 powershell

```

#### Group-Object

  和 SQL 中的 `group by` 类似, `Group-Object` 也会将具有相同属性的对线划归一组,
并通过 `Group` 属性访问同一组的所有对象。别名是 `group`。

```powershell
PS E:\server\Test> Get-Alias -Definition Group-Object         

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           group -> Group-Object

# 我们将具有相同进程名的对象聚合起来
PS E:\server\Test> ps | group name

Count Name                      Group
----- ----                      -----
    1 ApplicationFrameHost      {System.Diagnostics.Process (ApplicationFrameHost)}
    1 AsHidSrv64                {System.Diagnostics.Process (AsHidSrv64)}
    1 AsLdrSrv64                {System.Diagnostics.Process (AsLdrSrv64)}
... ...
    1 ChsIME                    {System.Diagnostics.Process (ChsIME)}
    9 Code                      {System.Diagnostics.Process (Code), System.Diagnostics.Process (Cod...
    1 CompPkgSrv                {System.Diagnostics.Process (CompPkgSrv)}
... ...

# 统计聚合起来的对象的 Vm 的和 ( 以 MB 为单位 )
PS E:\server\Test> ps | group name | select name, @{
>> l='VM(Mb)'; e={ ($_.group | measure vm -Sum).Sum / 1MB }}

Name                               VM(Mb)
----                               ------
ApplicationFrameHost     2101506.73046875
AsHidSrv64                  4153.25390625
AsLdrSrv64                  4163.32421875
... ...
AsusSystemAnalysis       2101382.40234375
AsusSystemDiagnosis         4165.17578125
audiodg                  2101340.33203125
... ...

```

### 操作防火墙

  我们通过 `gcm -Nonu NetFirewallRule` 命令可以得知操纵防火墙的一些命令,
`gcm` 是 `Get-Command` 的别名。

```PowerShell
PS :\path> gcm -Noun NetFirewallRule

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Function        Copy-NetFirewallRule                               2.0.0.0    NetSecurity
Function        Disable-NetFirewallRule                            2.0.0.0    NetSecurity
Function        Enable-NetFirewallRule                             2.0.0.0    NetSecurity
Function        Get-NetFirewallRule                                2.0.0.0    NetSecurity
Function        New-NetFirewallRule                                2.0.0.0    NetSecurity
Function        Remove-NetFirewallRule                             2.0.0.0    NetSecurity
Function        Rename-NetFirewallRule                             2.0.0.0    NetSecurity
Function        Set-NetFirewallRule                                2.0.0.0    NetSecurity
Function        Show-NetFirewallRule                               2.0.0.0    NetSecurity

```

  我们使用最多的则是四条命令:

-  `New-NetFirewallRule` 添加防火墙规则
-  `Get-NetFirewallRule` 获取防火墙规则
-  `Set-NetFirewallRule` 更改防火墙规则
-  `Remove-NetFirewallRule` 删除防火墙规则

#### New-NetFirewallRule

  `New-NetFirewallRule` 命令有超过 35 个选项, 用以选择创建的

```javascript
const firewallallowpath = process.execpath;
```