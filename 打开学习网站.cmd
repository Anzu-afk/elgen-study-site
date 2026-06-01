@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo Elgen 产品学习网站正在启动...
echo.
echo 电脑本机打开: http://127.0.0.1:8765/
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /C:"IPv4"') do (
  for /f "tokens=* delims= " %%B in ("%%A") do (
    echo 安卓手机可尝试打开: http://%%B:8765/
  )
)
echo.
echo 提示: 手机和电脑需要连接同一个 Wi-Fi。
echo 如果 Windows 弹出网络访问提示，请允许。
echo 关闭这个窗口后，手机访问也会停止。
echo.
"C:\Users\Anzu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8765 --bind 0.0.0.0
pause
