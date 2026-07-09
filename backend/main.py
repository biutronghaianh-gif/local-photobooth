# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import photo_routes

app = FastAPI(title="Local Photobooth API")

# Cấu hình CORS cho frontend (Vite thường chạy ở port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các API routers
app.include_router(photo_routes.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to Local Photobooth API"}