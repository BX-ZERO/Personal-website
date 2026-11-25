@echo off
cd /d "%~dp0"
set HTTP_PROXY=http://127.0.0.1:10808
set HTTPS_PROXY=http://127.0.0.1:10808
echo.
echo   BX-ZERO 个人站 同步工具
echo   ------------------------
echo.
echo   正在连接 GitHub...
git fetch origin --quiet
if errorlevel 1 goto fail
set NEW=0
for /f %%i in ('git rev-list --count HEAD..origin/main') do set NEW=%%i
if "%NEW%"=="0" goto uptodate
git -c core.quotepath=false status --porcelain --untracked-files=no > "%TEMP%\bxz-sync-status.txt"
if not exist "%TEMP%\bxz-sync-status.txt" goto pull
for %%A in ("%TEMP%\bxz-sync-status.txt") do if %%~zA GTR 0 goto dirty
:pull
echo   发现 %NEW% 个新提交，正在拉取...
git merge --ff-only origin/main
if errorlevel 1 goto diverge
echo.
echo   同步完成，共拉取 %NEW% 个提交。
git log -1 --pretty=format:"   最新：%h %s" origin/main
echo.
echo.
pause
exit /b 0

:uptodate
echo.
echo   已经是最新的，没有需要拉取的内容。
echo.
pause
exit /b 0

:dirty
echo.
echo   本地这些文件有还没提交的改动，先处理掉再同步：
echo.
type "%TEMP%\bxz-sync-status.txt"
echo.
pause
exit /b 1

:diverge
echo.
echo   本地和远端都有新提交，没法直接快进，需要手动处理。
echo.
pause
exit /b 1

:fail
echo.
echo   连不上 GitHub。先确认代理软件开着（127.0.0.1:10808 端口）。
echo.
pause
exit /b 1
