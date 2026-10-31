# Veo App - Lái mượt, Quản lý chuẩn (React + Vite + TypeScript)

Ứng dụng sổ theo dõi và quản lý phương tiện, chi phí đi lại, đổ xăng, bảo dưỡng linh kiện, phân tích thu chi, và tự động đồng bộ lên Google Drive. Được viết lại hoàn chỉnh bằng React, TypeScript và Vite.

## Tính năng chính

- 🚗 **Quản lý đa phương tiện**: Thêm, sửa, xóa nhiều xe (xe máy, ô tô). Ghi nhận biển số, odo hiện tại, dung tích bình xăng, mức tiêu hao công bố và hãng xe.
- ⛽ **Theo dõi đổ xăng & ước tính bình xăng**:
  - Tự động tính số lít hoặc số tiền từ đơn giá/lít.
  - Phân loại nhiên liệu: E10 RON95, E5 RON92, RON95 khoáng hoặc loại khác.
  - Đồng hồ ước tính mức xăng còn lại trong bình hiện tại và sau khi đổ.
  - Dự đoán thời điểm và số km cần đổ xăng tiếp theo, phân tích xu hướng tiết kiệm/hao xăng.
- 🔧 **Bảo dưỡng & Quản lý linh kiện**:
  - Theo dõi tuổi thọ các linh kiện chính: Nhớt máy, bugi, lọc gió, má phanh, lốp xe, ắc quy, nước làm mát...
  - Cảnh báo trực quan khi linh kiện sắp đến hạn thay (dưới 20% hoặc quá hạn).
  - Tự động ghi nhận mốc thay và cập nhật % linh kiện khi ghi khoản bảo dưỡng.
- 📊 **Biểu đồ & Báo cáo thu chi**:
  - Chuyển đổi linh hoạt giữa biểu đồ Cột (Bar), Đường (Line) và Biểu đồ tròn (Pie/Donut).
  - Xem theo 6 tháng gần nhất, theo từng tháng hoặc theo năm.
  - Phân loại chi tiết cơ cấu chi phí (Đổ xăng, Bảo dưỡng, Chi phí khác) và so sánh Thu - Chi - Lãi/Lỗ.
- 🏅 **Hệ thống huy chương (Gamification)**:
  - 3 nhóm huy chương: Nhiên liệu, Bảo dưỡng và Chung.
  - Hiệu ứng pháo hoa và lấp lánh khi mở khóa huy chương mới.
- 🗺️ **Bản đồ Mapbox**:
  - Tìm nhanh các cây xăng xung quanh vị trí của bạn.
  - Tìm showroom / xưởng dịch vụ chính hãng theo từng dòng xe (Honda, Yamaha, Toyota, VinFast...).
  - Định vị GPS thời gian thực với biểu tượng ghim xanh trực quan.
- 🎨 **Tùy biến giao diện**:
  - Các theme nền cài sẵn (Hoàng hôn, Xe máy, Xe hơi, Đêm phố, v.v.).
  - Cho phép tải lên ảnh nền riêng từ thiết bị với thanh điều chỉnh độ mờ lớp phủ.
  - Hỗ trợ chế độ Sáng / Tối (Dark mode).
- 🔊 **Âm thanh và hiệu ứng thắng xe**:
  - Âm thanh rít bánh xe chân thực mô phỏng bằng Web Audio API khi chuyển tab.
  - Hiệu ứng vệt bánh xe và khói lốp xe sống động.
- ☁️ **Sao lưu & Đồng bộ Google Drive**:
  - Tự động đồng bộ hai chiều lên thư mục `appDataFolder` trên Google Drive qua Google Identity Services.
  - Xuất / nhập dữ liệu sao lưu `.json`.
  - Xuất bảng kê chi tiết ra file Excel `.csv`.

## Cài đặt và phát triển

```bash
# Cài đặt thư viện
npm install

# Khởi chạy dev server (port 3000)
npm run dev

# Kiểm tra mã nguồn
npm run lint

# Build production
npm run build
```
