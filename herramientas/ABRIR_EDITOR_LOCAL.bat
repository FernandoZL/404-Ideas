@echo off
setlocal
cd /d "%~dp0.."

where py >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_CMD=py"
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        set "PYTHON_CMD=python"
    ) else (
        echo.
        echo No encontre Python instalado en este equipo.
        echo Puedes abrir herramientas\index.html directamente,
        echo aunque algunas funciones del navegador pueden ser limitadas.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo NUESTRO LUGAR - EDITOR LOCAL
echo ============================================
echo Solo estara disponible en este equipo.
echo Cierra esta ventana para detenerlo.
echo.

start "" "http://127.0.0.1:8765/herramientas/"
%PYTHON_CMD% -m http.server 8765 --bind 127.0.0.1
