@echo off
echo Lancement des migrations de la base de donnees...
call .venv\Scripts\activate.bat
cd backend
python manage.py makemigrations
python manage.py migrate
echo.
echo Migrations terminees avec succes ! Vous pouvez fermer cette fenetre.
pause
