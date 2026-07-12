from fastapi import APIRouter

router = APIRouter(prefix="/photos")

@router.get("/")
def get_photos():
    """
    Get all captured photos.
    """
    return {"photos": []}

@router.post("/upload")
def upload_photo():
    """
    Upload or save a newly captured photo.
    """
    return {"message": "Photo uploaded successfully"}
