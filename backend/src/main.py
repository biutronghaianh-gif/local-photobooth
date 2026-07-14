# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.routes import photo_routes

app = FastAPI(title="Local Photobooth API")

# Cấu hình CORS cho frontend (Vite chạy ở port 5173 hoặc 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đảm bảo thư mục storage tồn tại và mount làm static files
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
storage_path = os.path.join(backend_dir, "storage")
os.makedirs(storage_path, exist_ok=True)

app.mount("/storage", StaticFiles(directory=storage_path), name="storage")

# Đăng ký các API routers
app.include_router(photo_routes.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to Local Photobooth API"}