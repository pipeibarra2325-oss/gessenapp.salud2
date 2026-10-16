@echo off
REM Abre GessenApp con un enlace publico temporal (Cloudflare Tunnel), sin cuenta.
REM 1) Inicia el backend, que tambien sirve la pagina compilada (frontend/build), en el puerto 5000.
REM 2) Abre el tunel: el enlace https://....trycloudflare.com aparece en la ventana "Tunel GessenApp".
REM Mientras ambas ventanas esten abiertas, el enlace funciona. Cada vez que se abre, el enlace cambia.

cd /d "%~dp0backend"
start "Backend GessenApp (puerto 5000)" cmd /k "node src/app.js"
timeout /t 6 /nobreak >nul
start "Tunel GessenApp" cmd /k ""C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate --url http://localhost:5000"
echo.
echo Busca el enlace que termina en .trycloudflare.com en la ventana "Tunel GessenApp".
echo Para cerrarlo, cierra las dos ventanas.
pause
