@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo   Iniciando FarmaKit - Modo Desarrollo
echo ====================================================
echo.

node scripts/iniciarDesarrollo.mjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ====================================================
    echo Ocurrio un error al ejecutar el servidor.
    echo ====================================================
    pause
)
