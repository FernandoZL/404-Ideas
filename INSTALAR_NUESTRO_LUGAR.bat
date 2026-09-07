@echo off
setlocal EnableExtensions
chcp 65001 >nul
title INSTALAR NUESTRO LUGAR

set "REPO_URL=https://github.com/FernandoZL/404-Ideas.git"
set "TARGET=%USERPROFILE%\.copilot\repos\404-Ideas"

echo ============================================================
echo              INSTALAR NUESTRO LUGAR
echo ============================================================
echo Destino:
echo %TARGET%
echo.

set "GIT="
if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT=%ProgramFiles%\Git\cmd\git.exe"
if not defined GIT if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" set "GIT=%ProgramFiles(x86)%\Git\cmd\git.exe"
if not defined GIT (
  for /f "delims=" %%G in ('where git 2^>nul') do if not defined GIT set "GIT=%%G"
)

if not defined GIT (
  echo [ERROR] Git no esta instalado.
  echo Instala Git for Windows y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

if exist "%TARGET%\.git\" (
  echo [INFO] El repositorio ya existe.
  cd /d "%TARGET%"
  echo.
  "%GIT%" status
  echo.
  for /f %%A in ('"%GIT%" status --porcelain ^| find /c /v ""') do set "DIRTY=%%A"
  if not "%DIRTY%"=="0" (
    echo [AVISO] Hay cambios locales.
    echo No hare pull automaticamente para no pisarlos.
    echo Abriendo el administrador...
    goto :launch
  )

  echo Sincronizando...
  "%GIT%" pull --rebase origin main
  if errorlevel 1 (
    echo [ERROR] No pude sincronizar.
    pause
    exit /b 1
  )
  goto :launch
)

if exist "%TARGET%" (
  echo [ERROR] La carpeta destino existe pero no es un repositorio Git:
  echo %TARGET%
  echo.
  echo No se modificara.
  pause
  exit /b 1
)

echo Creando carpeta...
for %%D in ("%TARGET%") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>&1

echo Clonando repositorio completo...
"%GIT%" clone "%REPO_URL%" "%TARGET%"
if errorlevel 1 (
  echo [ERROR] Fallo el clone.
  pause
  exit /b 1
)

:launch
echo.
echo ============================================================
echo [OK] NUESTRO LUGAR ESTA INSTALADO / SINCRONIZADO
echo ============================================================
echo.
if exist "%TARGET%\NUESTRO_LUGAR_ADMIN.bat" (
  echo Abriendo administrador...
  call "%TARGET%\NUESTRO_LUGAR_ADMIN.bat"
) else (
  echo [AVISO] No encontre NUESTRO_LUGAR_ADMIN.bat dentro del repo.
  echo Carpeta:
  echo %TARGET%
  explorer "%TARGET%"
  pause
)
