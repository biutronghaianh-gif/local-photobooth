import sys
import os

# Add the current directory (backend) to the Python path
# to support absolute imports of `src`
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from .src.main import app

__all__ = ["app"]


# __file__ là một biến đặc biệt của python chứa đường dẫn tới file đang hoạt động
# os.path.abspath là một hàm để biến đường dẫn đó thành đường dẫn tuyệt đối
# os.path.dirname() là một hàm để cắt bỏ tên file chỉ giữ lại thư mục đó

# ==> đây là quá trình đưa thông tin cho python biết được thư mục backend là nơi chứa logic python chính

#sys.path.append(current_dir) là hàm thêm biến current_dir vào sys.path của python

# from .src.main là cú pháp import tương đối, nó đi vào thư mục src/ để tìm main.py và lôi biến app ra
# và biến app này mang giá trị là app = FastAPI(title="Local Photobooth API")

# __all__ = ["app"] là một biến của python để thông báo cho trình biên dịch ẩn các biến không cần thiết
# mà chỉ hiện biến app