from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Xin chào từ Backend Python!"}

@app.get("/api/data")
def get_data():
    return {"data": [1, 2, 3, 4, 5]}