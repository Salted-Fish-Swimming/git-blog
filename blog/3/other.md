# 打开 administrator 模式

## Method 1

```powershell
Start-Process powershell.exe -Verb RunAs
  -WindowStyle Hidden -ArgumentList $excute_commands
  -RedirectStandardInput 'input.txt'
  -RedirectStandardOutput 'output.txt'
  -RedirectStandardError 'error.txt'
```

## Method 2

```cmd
RunAs /user:adminstrator powershell
```

然后输入密码

### 获取密码

```
```