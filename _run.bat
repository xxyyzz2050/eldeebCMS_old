@ECHO OFF
:: if you dragged this file to cmd (ex: ConEmu.exe) outside this folder, it will change path to here
cd /D "%~dp0"
CLS
ECHO 1. run
ECHO 2. run (ssr)
ECHO 3. update eldeeb
ECHO 4. babel
ECHO.

CHOICE /C 1234 /M "Enter your choice:"

:: Note - list ERRORLEVELS in decreasing order

IF ERRORLEVEL 4 GOTO babel
IF ERRORLEVEL 3 GOTO update_eldeeb
IF ERRORLEVEL 2 GOTO run_ssr
IF ERRORLEVEL 1 GOTO run

:run
call npm run start
GOTO End

:run_ssr
call npm run ssr
GOTO End

:update_eldeeb
call npm eldeeb
GOTO End

:babel
call npm run babel
GOTO End

:End

:notes:
::in dev mode don't build with ssr (to watch for changes)
:: if the project uses some node modules (ex: fs), run with ssr
::nx: add browser": {"fs": false,"path": false,"os": false} to webpack to run in browser mode
:Executing npm from DOS batch file terminates the script, https://github.com/npm/npm/issues/2938
