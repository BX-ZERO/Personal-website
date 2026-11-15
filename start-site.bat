@echo off
chcp 65001 >nul
cd /d "%~dp0"

set PY=C:\Users\55231\AppData\Local\Programs\Python\Python311\python.exe
set PORT=8123
set PAGE=account.html
if not "%~1"=="" set PAGE=%~1

netstat -ano | findstr /c:":%PORT% " | findstr /c:"LISTENING" >nul
if not errorlevel 1 goto openonly

if not exist "%PY%" goto nopython

start "" "http://localhost:%PORT%/%PAGE%"
echo.
echo 本地站点：http://localhost:%PORT%/%PAGE%
echo 这个窗口别关，关掉服务就停了。
echo.
"%PY%" -m http.server %PORT%
goto end

:openonly
start "" "http://localhost:%PORT%/%PAGE%"
goto end

:nopython
echo 没找到 Python：%PY%
pause

:end
