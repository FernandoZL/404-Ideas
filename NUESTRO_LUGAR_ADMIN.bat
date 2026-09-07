@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title NUESTRO LUGAR - ADMIN GIT / GITHUB

rem ============================================================
rem  NUESTRO LUGAR - ADMIN GIT / GITHUB
rem  Este BAT debe vivir en la raiz del repositorio.
rem  Protege especialmente la carpeta \contenido.
rem ============================================================

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "REMOTE=origin"
set "BRANCH=main"
set "BACKUP_ROOT=%USERPROFILE%\Documents\NuestroLugar_Backups"
set "PUBLIC_URL=https://fernandozl.github.io/404-Ideas/"
set "ADMIN_URL=https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/"

call :find_git
if errorlevel 1 goto :fatal

cd /d "%REPO%"

if not exist ".git\" (
  echo.
  echo [ERROR] Este BAT no esta dentro de un repositorio Git.
  echo Carpeta actual: %REPO%
  echo.
  pause
  exit /b 1
)

:menu
cls
echo ============================================================
echo           NUESTRO LUGAR - ADMIN GIT / GITHUB
echo ============================================================
echo Repositorio: %REPO%
echo Rama:        %BRANCH%
echo.
echo [1] Estado Git + auditoria de seguridad
echo [2] Sincronizar PC ^<- GitHub  (pull --rebase seguro)
echo [3] Backup de \contenido
echo [4] Validar / construir sitio
echo [5] Guardar version  (commit seguro)
echo [6] Subir a GitHub   (push seguro)
echo [7] Flujo previo a una actualizacion
echo [8] Abrir carpeta del repositorio
echo [9] Abrir pagina publica
echo [10] Abrir gestor privado
echo [11] Diagnostico de herramientas
echo [0] Salir
echo.
echo REGLA PRINCIPAL:
echo Antes de reemplazar archivos: [1] y luego [2].
echo La carpeta \contenido nunca se sobrescribe en una actualizacion normal.
echo ============================================================
set /p "op=Seleccione una opcion: "

if "%op%"=="1" goto :status
if "%op%"=="2" goto :sync
if "%op%"=="3" goto :backup
if "%op%"=="4" goto :build
if "%op%"=="5" goto :commit
if "%op%"=="6" goto :push
if "%op%"=="7" goto :preupdate
if "%op%"=="8" goto :openrepo
if "%op%"=="9" goto :openweb
if "%op%"=="10" goto :openadmin
if "%op%"=="11" goto :diagnostic
if "%op%"=="0" exit /b 0
goto :menu

:status
cls
echo ============================================================
echo ESTADO GIT + AUDITORIA DE SEGURIDAD
echo ============================================================
"%GIT%" status
echo.
echo ------------------------------------------------------------
echo Ultimos commits:
"%GIT%" --no-pager log --oneline -8
echo.
echo ------------------------------------------------------------
echo Cambios dentro de \contenido:
"%GIT%" status --short -- "contenido"
echo.
call :detect_content_deletes
echo.
pause
goto :menu

:sync
cls
echo ============================================================
echo SINCRONIZAR PC ^<- GITHUB
echo ============================================================
call :require_clean
if errorlevel 1 (
  echo.
  echo [BLOQUEADO] Hay cambios locales.
  echo Guardalos primero con [5] o revisalos con [1].
  echo No se ejecutara pull --rebase para evitar mezclar cambios.
  pause
  goto :menu
)

echo [1/3] Consultando GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error

echo.
echo [2/3] Aplicando cambios remotos de forma segura...
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo.
echo [3/3] Estado final:
"%GIT%" status
echo.
echo [OK] La PC ya contiene lo ultimo de GitHub, incluido lo cargado desde el gestor.
pause
goto :menu

:backup
cls
call :make_backup
pause
goto :menu

:build
cls
echo ============================================================
echo VALIDAR / CONSTRUIR SITIO
echo ============================================================
call :find_python
if errorlevel 1 (
  echo [ERROR] No encontre Python.
  echo Instala Python o ejecuta esta opcion desde una PC que ya lo tenga.
  pause
  goto :menu
)

if not exist "scripts\build.py" (
  echo [ERROR] No existe scripts\build.py
  pause
  goto :menu
)

echo Ejecutando build...
%PYTHON_CMD% "scripts\build.py"
if errorlevel 1 (
  echo.
  echo [ERROR] El build encontro un problema. NO hagas push todavia.
  pause
  goto :menu
)

echo.
echo [OK] Build correcto.
pause
goto :menu

:commit
cls
echo ============================================================
echo GUARDAR VERSION - COMMIT SEGURO
echo ============================================================
echo Estado actual:
"%GIT%" status --short
echo.

for /f %%A in ('"%GIT%" status --porcelain ^| find /c /v ""') do set "CHANGES=%%A"
if "%CHANGES%"=="0" (
  echo [INFO] No hay cambios para guardar.
  pause
  goto :menu
)

echo Creando backup automatico de \contenido antes del commit...
call :make_backup_quiet
if errorlevel 1 (
  echo [ERROR] No pude crear el backup. Se cancela el commit.
  pause
  goto :menu
)

echo.
echo Preparando cambios...
"%GIT%" add .
if errorlevel 1 goto :git_error

call :detect_staged_content_deletes
if errorlevel 2 (
  echo.
  echo ============================================================
  echo ALERTA: HAY BORRADOS DENTRO DE \contenido
  echo ============================================================
  echo Los borrados de recuerdos, fotos, videos o audios requieren
  echo confirmacion explicita.
  echo.
  set /p "confirm=Escriba BORRAR para continuar, o Enter para cancelar: "
  if /I not "!confirm!"=="BORRAR" (
    echo.
    echo Cancelado. Los archivos quedaron preparados pero SIN commit.
    echo Puede usar: git restore --staged .
    pause
    goto :menu
  )
)

echo.
set /p "msg=Mensaje del commit: "
if "%msg%"=="" set "msg=Actualizar Nuestro Lugar"

echo.
"%GIT%" commit -m "%msg%"
if errorlevel 1 goto :git_error

echo.
echo [OK] Version guardada localmente.
echo Use [6] para subirla a GitHub.
pause
goto :menu

:push
cls
echo ============================================================
echo SUBIR A GITHUB - PUSH SEGURO
echo ============================================================
call :require_clean
if errorlevel 1 (
  echo [BLOQUEADO] Hay cambios sin guardar.
  echo Use [5] antes de subir.
  pause
  goto :menu
)

echo [1/4] Consultando GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error

echo.
echo [2/4] Integrando cualquier cambio remoto previo...
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo.
echo [3/4] Ejecutando build de seguridad si Python esta disponible...
call :find_python >nul 2>&1
if not errorlevel 1 (
  %PYTHON_CMD% "scripts\build.py"
  if errorlevel 1 (
    echo.
    echo [BLOQUEADO] El build fallo. No se hara push.
    pause
    goto :menu
  )
) else (
  echo [AVISO] Python no disponible; se omite build local.
)

echo.
echo [4/4] Subiendo...
"%GIT%" push "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo.
echo [OK] GitHub actualizado.
echo GitHub Actions publicara la web automaticamente.
pause
goto :menu

:preupdate
cls
echo ============================================================
echo FLUJO PREVIO A UNA ACTUALIZACION
echo ============================================================
echo Este proceso NO reemplaza archivos.
echo Solo deja la PC segura y sincronizada antes de copiar una
echo actualizacion nueva.
echo.
call :require_clean
if errorlevel 1 (
  echo [BLOQUEADO] Hay cambios locales. Revisalos primero con [1].
  pause
  goto :menu
)

echo [1/3] Backup de \contenido...
call :make_backup_quiet
if errorlevel 1 (
  echo [ERROR] No pude crear backup.
  pause
  goto :menu
)

echo.
echo [2/3] Sincronizando con GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo.
echo [3/3] Estado final...
"%GIT%" status
echo.
echo ============================================================
echo [OK] YA PUEDES REEMPLAZAR LOS ARCHIVOS DE LA ACTUALIZACION.
echo ============================================================
echo IMPORTANTE:
echo - NO reemplaces ni borres la carpeta \contenido.
echo - Despues usa [4] para validar.
echo - Luego [5] para commit y [6] para push.
pause
goto :menu

:openrepo
start "" explorer "%REPO%"
goto :menu

:openweb
start "" "%PUBLIC_URL%"
goto :menu

:openadmin
start "" "%ADMIN_URL%"
goto :menu

:diagnostic
cls
echo ============================================================
echo DIAGNOSTICO
echo ============================================================
echo.
echo Git:
"%GIT%" --version
echo.
echo Remoto:
"%GIT%" remote -v
echo.
echo Rama:
"%GIT%" branch --show-current
echo.
echo Python:
call :find_python
if errorlevel 1 (
  echo [NO ENCONTRADO]
) else (
  %PYTHON_CMD% --version
)
echo.
echo Node:
where node >nul 2>&1
if errorlevel 1 (
  echo [NO ENCONTRADO]
) else (
  node --version
)
echo.
echo Backup:
echo %BACKUP_ROOT%
echo.
pause
goto :menu

:find_git
set "GIT="
if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT=%ProgramFiles%\Git\cmd\git.exe"
if not defined GIT if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" set "GIT=%ProgramFiles(x86)%\Git\cmd\git.exe"
if not defined GIT (
  for /f "delims=" %%G in ('where git 2^>nul') do if not defined GIT set "GIT=%%G"
)
if not defined GIT (
  echo [ERROR] Git no esta instalado o no se encuentra en PATH.
  exit /b 1
)
exit /b 0

:find_python
set "PYTHON_CMD="
where py >nul 2>&1
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
  exit /b 0
)
where python >nul 2>&1
if not errorlevel 1 (
  set "PYTHON_CMD=python"
  exit /b 0
)
exit /b 1

:require_clean
for /f %%A in ('"%GIT%" status --porcelain ^| find /c /v ""') do set "DIRTY=%%A"
if not "%DIRTY%"=="0" exit /b 1
exit /b 0

:detect_content_deletes
set "HAS_DELETE=0"
for /f "tokens=1,*" %%A in ('"%GIT%" status --short -- "contenido"') do (
  echo %%A %%B | findstr /B /C:"D " /C:" D" /C:"RD" >nul && set "HAS_DELETE=1"
)
if "%HAS_DELETE%"=="1" (
  echo [ALERTA] Se detectaron borrados dentro de \contenido.
) else (
  echo [OK] No se detectan borrados dentro de \contenido.
)
exit /b 0

:detect_staged_content_deletes
set "HAS_STAGED_DELETE=0"
for /f "tokens=1,*" %%A in ('"%GIT%" diff --cached --name-status -- "contenido"') do (
  if /I "%%A"=="D" (
    set "HAS_STAGED_DELETE=1"
    echo BORRADO: %%B
  )
)
if "%HAS_STAGED_DELETE%"=="1" exit /b 2
exit /b 0

:make_backup
echo ============================================================
echo BACKUP DE \contenido
echo ============================================================
call :make_backup_quiet
if errorlevel 1 (
  echo [ERROR] No se pudo crear el backup.
  exit /b 1
)
echo.
echo [OK] Backup creado.
exit /b 0

:make_backup_quiet
if not exist "contenido\" (
  echo [ERROR] No existe la carpeta contenido.
  exit /b 1
)
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%" >nul 2>&1

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%I"
set "ZIP=%BACKUP_ROOT%\contenido_%STAMP%.zip"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; Compress-Archive -Path '%REPO%\contenido\*' -DestinationPath '%ZIP%' -CompressionLevel Optimal"
if errorlevel 1 exit /b 1

echo Backup: %ZIP%
exit /b 0

:git_error
echo.
echo [ERROR] Git devolvio un error.
echo No ejecutes comandos destructivos ni force push.
echo Revisa con [1] y, si hace falta, pega la salida en ChatGPT.
pause
goto :menu

:fatal
echo.
echo No se puede continuar.
pause
exit /b 1
