@echo off
echo Starting Local Photobooth Backend...
cd backend
call .\venv\Scripts\activate.bat
python -m uvicorn src.main:app --reload --port 8000
pause
