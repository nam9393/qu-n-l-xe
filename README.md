# Sổ Xe – tự đồng bộ lên Google Drive

App chạy hoàn toàn trên trình duyệt. Dữ liệu lưu trong file ẩn `so-xe.json` ở thư mục riêng của app trên Google Drive (không đụng tới file khác của bạn).

## Bước 1. Đưa lên GitHub Pages
1. Tạo repository mới trên GitHub (ví dụ `so-xe`), chọn Public.
2. Upload file `index.html` vào repository.
3. Vào Settings > Pages > Source: "Deploy from a branch" > branch `main`, thư mục `/ (root)` > Save.
4. Sau vài phút có địa chỉ dạng `https://TENCUABAN.github.io/so-xe/`.

## Bước 2. Tạo Client ID (miễn phí, làm một lần)
1. Vào https://console.cloud.google.com, tạo project mới (ví dụ "So Xe").
2. APIs & Services > Library > tìm "Google Drive API" > Enable.
3. APIs & Services > OAuth consent screen (Google Auth Platform) > chọn External > điền tên app, email của bạn > Save.
   - Mục Audience / Test users: thêm email Google của bạn.
   - Mục Data Access / Scopes: thêm `.../auth/drive.appdata`.
4. APIs & Services > Credentials > Create credentials > OAuth client ID > Application type: **Web application**.
   - Authorized JavaScript origins: `https://TENCUABAN.github.io` (chỉ domain, không có đường dẫn, không dấu `/` ở cuối).
5. Copy **Client ID** (đuôi `.apps.googleusercontent.com`).

## Bước 3. Điền Client ID
Mở `index.html`, tìm dòng
`const CLIENT_ID='DAN_CLIENT_ID_VAO_DAY.apps.googleusercontent.com';`
và thay bằng Client ID của bạn. Commit lại lên GitHub.

## Dùng
Mở địa chỉ GitHub Pages > bấm "Kết nối Google Drive" > chọn tài khoản > cho phép. Từ đó mỗi lần thêm hoặc xóa khoản, app tự lưu lên Drive; mở trên máy khác và kết nối cùng tài khoản là dữ liệu tự về.

Ghi chú: app ở chế độ Testing nên Google hiện cảnh báo "app chưa được xác minh" (bấm Nâng cao > Tiếp tục), và đăng nhập có thể phải xác nhận lại sau khoảng 7 ngày. Dữ liệu trên Drive không mất.
