@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title NUESTRO LUGAR - ADMIN

rem ============================================================
rem NUESTRO LUGAR - BAT UNICO FINAL v1.3
rem - Si se ejecuta fuera del repo: instala / sincroniza y se copia.
rem - Si se ejecuta dentro del repo: abre el menu administrador.
rem ============================================================

set "REPO_URL=https://github.com/FernandoZL/404-Ideas.git"
set "TARGET=%USERPROFILE%\.copilot\repos\404-Ideas"
set "REMOTE=origin"
set "BRANCH=main"
set "BACKUP_ROOT=%USERPROFILE%\Documents\NuestroLugar_Backups"
set "PUBLIC_URL=https://fernandozl.github.io/404-Ideas/"
set "ADMIN_URL=https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/"

call :find_git
if errorlevel 1 goto :fatal

rem ------------------------------------------------------------
rem Detectar si ya estamos dentro del repositorio correcto
rem ------------------------------------------------------------
set "CURRENT=%~dp0"
if "%CURRENT:~-1%"=="\" set "CURRENT=%CURRENT:~0,-1%"

if exist "%CURRENT%\.git\" (
    cd /d "%CURRENT%"
    for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "CURRENT_REMOTE=%%R"
    echo !CURRENT_REMOTE! | find /I "FernandoZL/404-Ideas" >nul
    if not errorlevel 1 goto :admin
)

rem ------------------------------------------------------------
rem MODO INSTALADOR / SINCRONIZADOR
rem ------------------------------------------------------------
cls
echo ============================================================
echo          NUESTRO LUGAR - INSTALAR / SINCRONIZAR
echo ============================================================
echo.
echo Repositorio:
echo %REPO_URL%
echo.
echo Destino:
echo %TARGET%
echo.

if exist "%TARGET%\.git\" (
    echo [INFO] El repositorio ya existe.
    cd /d "%TARGET%"

    echo.
    echo Estado actual:
    "%GIT%" status

    for /f %%A in ('git status --porcelain ^| findstr /V /X /C:"?? NUESTRO_LUGAR.bat" ^| find /c /v ""') do set "DIRTY=%%A"

    if not "!DIRTY!"=="0" (
        echo.
        echo ============================================================
        echo [BLOQUEADO] HAY CAMBIOS LOCALES
        echo ============================================================
        echo No hare pull para evitar mezclar o perder cambios.
        echo.
        echo Abriendo el administrador existente si esta disponible...
        echo.
        if exist "%TARGET%\NUESTRO_LUGAR.bat" (
            call "%TARGET%\NUESTRO_LUGAR.bat"
            exit /b
        )
        pause
        exit /b 2
    )

    echo.
    echo [1/4] Consultando GitHub...
    "%GIT%" fetch "%REMOTE%"
    if errorlevel 1 goto :git_error

    echo [2/4] Trayendo lo ultimo de GitHub...
    "%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
    if errorlevel 1 goto :git_error

) else (
    if exist "%TARGET%" (
        echo [ERROR] La carpeta destino existe pero no es un repositorio Git:
        echo %TARGET%
        echo.
        echo No se modificara automaticamente.
        pause
        exit /b 1
    )

    echo [1/4] Creando carpeta padre...
    for %%D in ("%TARGET%") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>&1

    echo [2/4] Clonando repositorio completo...
    "%GIT%" clone "%REPO_URL%" "%TARGET%"
    if errorlevel 1 goto :git_error
)

echo [3/4] Instalando este BAT dentro del repositorio...
copy /Y "%~f0" "%TARGET%\NUESTRO_LUGAR.bat" >nul
if errorlevel 1 (
    echo [ERROR] No pude copiar el BAT al repositorio.
    pause
    exit /b 1
)

echo [4/4] Verificando...
cd /d "%TARGET%"
"%GIT%" status --short

echo.
echo ============================================================
echo [OK] NUESTRO LUGAR ESTA LISTO EN ESTA PC
echo ============================================================
echo.
echo Administrador:
echo %TARGET%\NUESTRO_LUGAR.bat
echo.
echo Abriendo menu...
timeout /t 2 >nul
call "%TARGET%\NUESTRO_LUGAR.bat"
exit /b 0


rem ============================================================
rem MODO ADMINISTRADOR
rem ============================================================
:admin
set "REPO=%CURRENT%"
cd /d "%REPO%"

:menu
cls
echo ============================================================
echo           NUESTRO LUGAR - ADMIN GIT / GITHUB
echo ============================================================
echo Repositorio: %REPO%
echo Rama:        %BRANCH%
echo.
echo [1] Estado Git + auditoria de seguridad
echo [2] Sincronizar PC ^<- GitHub
echo [3] Backup de \contenido
echo [4] Validar / construir sitio
echo [5] Guardar version  (commit seguro)
echo [6] Subir a GitHub   (push seguro)
echo [7] Flujo previo a una actualizacion
echo [8] Abrir carpeta del repositorio
echo [9] Abrir pagina publica
echo [10] Gestor web universal - crear / editar contenido
echo [11] Diagnostico
echo [0] Salir
echo.
echo REGLA:
echo Antes de reemplazar archivos: [1] y luego [2].
echo \contenido no se sobrescribe en actualizaciones normales.
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
    pause
    goto :menu
)

echo [1/3] Consultando GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error

echo.
echo [2/3] Aplicando cambios remotos...
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo.
echo [3/3] Estado final:
"%GIT%" status
echo.
echo [OK] PC sincronizada con GitHub y con lo cargado desde el gestor.
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
    echo Instala Python para usar la validacion local.
    pause
    goto :menu
)

if not exist "scripts\build.py" (
    echo [ERROR] No existe scripts\build.py
    pause
    goto :menu
)

%PYTHON_CMD% "scripts\build.py"
if errorlevel 1 (
    echo.
    echo [ERROR] El build fallo. NO hagas push.
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
"%GIT%" status --short
echo.

for /f %%A in ('git status --porcelain ^| find /c /v ""') do set "CHANGES=%%A"
if "%CHANGES%"=="0" (
    echo [INFO] No hay cambios para guardar.
    pause
    goto :menu
)

echo Creando backup automatico de \contenido...
call :make_backup_quiet
if errorlevel 1 (
    echo [ERROR] No pude crear backup. Se cancela el commit.
    pause
    goto :menu
)

echo.
"%GIT%" add .
if errorlevel 1 goto :git_error

call :detect_staged_content_deletes
if errorlevel 2 (
    echo.
    echo ============================================================
    echo ALERTA: HAY BORRADOS DENTRO DE \contenido
    echo ============================================================
    echo Escriba BORRAR para autorizar un borrado real.
    echo.
    set /p "confirm=Confirmacion: "
    if /I not "!confirm!"=="BORRAR" (
        echo.
        echo Commit cancelado.
        echo Los cambios siguen en staging.
        pause
        goto :menu
    )
)

echo.
set /p "msg=Mensaje del commit: "
if "%msg%"=="" set "msg=Actualizar Nuestro Lugar"

"%GIT%" commit -m "%msg%"
if errorlevel 1 goto :git_error

echo.
echo [OK] Version guardada localmente.
echo Use [6] para subirla.
pause
goto :menu


:push
cls
echo ============================================================
echo SUBIR A GITHUB
echo ============================================================
call :require_clean
if errorlevel 1 (
    echo [BLOQUEADO] Hay cambios sin guardar.
    echo Use [5] primero.
    pause
    goto :menu
)

echo [1/4] Consultando GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error

echo [2/4] Integrando cambios remotos...
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo [3/4] Validando si Python esta disponible...
call :find_python >nul 2>&1
if not errorlevel 1 (
    %PYTHON_CMD% "scripts\build.py"
    if errorlevel 1 (
        echo [BLOQUEADO] El build fallo. No se hara push.
        pause
        goto :menu
    )
) else (
    echo [AVISO] Python no disponible; se omite build local.
)

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
echo.
call :require_clean
if errorlevel 1 (
    echo [BLOQUEADO] Hay cambios locales.
    echo Revisalos primero con [1].
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

echo [2/3] Sincronizando con GitHub...
"%GIT%" fetch "%REMOTE%"
if errorlevel 1 goto :git_error
"%GIT%" pull --rebase "%REMOTE%" "%BRANCH%"
if errorlevel 1 goto :git_error

echo [3/3] Estado final...
"%GIT%" status
echo.
echo ============================================================
echo [OK] YA PUEDES APLICAR LA ACTUALIZACION.
echo ============================================================
echo No reemplaces ni borres \contenido.
echo Luego usa [4], [5] y [6].
pause
goto :menu


:openrepo
start "" explorer "%REPO%"
goto :menu

:openweb
start "" "%PUBLIC_URL%"
goto :menu

:openadmin
cls
echo ============================================================
echo GESTOR WEB UNIVERSAL
echo ============================================================
echo.
echo Este es el centro de contenido de Nuestro Lugar.
echo Funciona desde iPhone, iPad, PC u otro dispositivo con navegador.
echo.
echo Desde el gestor puedes:
echo - Crear recuerdos
echo - Agregar fotos y otros archivos
echo - Crear cartas, frases y fechas
echo - Agregar canciones y videos
echo - Crear sorpresas HTML
echo - Editar contenido existente
echo - Publicar u ocultar contenido
echo - Administrar archivos existentes
echo.
echo Todo se guarda mediante commits en:
echo FernandoZL/404-Ideas ^> main
echo.
echo Abriendo:
echo %ADMIN_URL%
echo.
start "" "%ADMIN_URL%"
pause
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


rem ============================================================
rem SUBRUTINAS
rem ============================================================

:find_git
rem Usamos el comando corto "git" para evitar el problema de FOR /F
rem con rutas como C:\Program Files\Git\cmd\git.exe.
set "GIT=git"

where git >nul 2>&1
if not errorlevel 1 exit /b 0

if exist "%ProgramFiles%\Git\cmd\git.exe" (
    set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
    where git >nul 2>&1
    if not errorlevel 1 exit /b 0
)

if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" (
    set "PATH=%ProgramFiles(x86)%\Git\cmd;%PATH%"
    where git >nul 2>&1
    if not errorlevel 1 exit /b 0
)

echo [ERROR] Git no esta instalado o no se encuentra.
exit /b 1


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
rem Durante la primera instalación NUESTRO_LUGAR.bat puede ser untracked.
rem Ese único archivo no debe bloquear un pull seguro. Cualquier otro
rem cambio local sí bloquea la sincronización.
set "DIRTY=0"
for /f %%A in ('git status --porcelain ^| findstr /V /X /C:"?? NUESTRO_LUGAR.bat" ^| find /c /v ""') do set "DIRTY=%%A"
if not "%DIRTY%"=="0" exit /b 1
exit /b 0


:detect_content_deletes
set "HAS_DELETE=0"
for /f "tokens=1,*" %%A in ('git status --short -- "contenido"') do (
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
for /f "tokens=1,*" %%A in ('git diff --cached --name-status -- "contenido"') do (
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
echo No hagas reset, force push ni borres archivos.
echo Copia la salida y revisala antes de continuar.
pause
goto :menu


:fatal
echo.
echo No se puede continuar.
pause
exit /b 1
