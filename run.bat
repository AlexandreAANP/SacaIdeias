@echo off
setlocal

start "backend" /D "%~dp0sacaideia-be" cmd /k uvicorn app.main:app --reload --host localhost --port 8000
start "frontend" /D "%~dp0sacaideias-fe" cmd /k ng serve

endlocal