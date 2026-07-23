# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.routes import photo_routes

app = FastAPI(title="Local Photobooth API")

# Cấu hình CORS cho frontend (hỗ trợ cả localhost và Vercel domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đảm bảo thư mục storage tồn tại và mount làm static files
storage_path = photo_routes.get_storage_path()
app.mount("/storage", StaticFiles(directory=storage_path), name="storage")

# Đăng ký các API routers
app.include_router(photo_routes.router, prefix="/api/v1")

@app.get("/")
@app.get("/api")
def read_root():
    return {"message": "Welcome to Local Photobooth API"}
