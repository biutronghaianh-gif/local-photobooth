import base64
import os
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/photos")

class PhotoUpload(BaseModel):
    image: str  # base64 data URL

def get_storage_path():
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.dirname(current_dir)
    return os.path.join(backend_dir, "storage")

@router.get("/")
def get_photos():
    """
    Get all captured photos sorted by newest first.
    """
    storage_path = get_storage_path()
    if not os.path.exists(storage_path):
        return {"photos": []}
    
    photos = []
    for filename in os.listdir(storage_path):
        if filename.lower().endswith((".png", ".jpg", ".jpeg")):
            filepath = os.path.join(storage_path, filename)
            try:
                stat = os.stat(filepath)
                photos.append({
                    "filename": filename,
                    "url": f"http://localhost:8000/storage/{filename}",
                    "created_at": stat.st_mtime
                })
            except OSError:
                continue
                
    # Sắp xếp mới nhất lên đầu
    photos.sort(key=lambda x: x["created_at"], reverse=True)
    return {"photos": photos}

@router.post("/upload")
def upload_photo(photo: PhotoUpload):
    """
    Upload or save a newly captured photo.
    """
    try:
        if "," in photo.image:
            header, base64_data = photo.image.split(",", 1)
        else:
            base64_data = photo.image
            
        image_bytes = base64.b64decode(base64_data)
        
        storage_path = get_storage_path()
        os.makedirs(storage_path, exist_ok=True)
        
        # Tạo tên file độc nhất dựa trên timestamp
        filename = f"booth_{int(time.time() * 1000)}.png"
        filepath = os.path.join(storage_path, filename)
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
            
        return {
            "message": "Photo uploaded successfully",
            "filename": filename,
            "url": f"http://localhost:8000/storage/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

@router.delete("/{filename}")
def delete_photo(filename: str):
    """
    Delete a photo by filename.
    """
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    storage_path = get_storage_path()
    filepath = os.path.join(storage_path, filename)
    
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            return {"message": f"Photo {filename} deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
    else:
        raise HTTPException(status_code=404, detail="Photo not found")

