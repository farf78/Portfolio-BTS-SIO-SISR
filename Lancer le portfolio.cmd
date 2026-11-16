@echo off
setlocal
cd /d "%~dp0"
set "PORTFOLIO_NODE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined PORTFOLIO_NODE set "PORTFOLIO_NODE=%%N"
if not defined PORTFOLIO_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "PORTFOLIO_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined PORTFOLIO_NODE (
 echo Node.js est introuvable. Vous pouvez aussi ouvrir index.html directement.
 pause
 exit /b 1
)
"%PORTFOLIO_NODE%" "%~dp0launcher.cjs"
if errorlevel 1 pause
endlocal
