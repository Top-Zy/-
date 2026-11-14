@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  武陵山区果园管理系统 · 本地启动
echo  正在启动本地服务器，请稍候...
echo.
start "武陵果园本地服务器" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/index.html"
echo  已尝试打开浏览器；如未打开，请访问 http://localhost:8080/index.html
timeout /t 3 /nobreak >nul
