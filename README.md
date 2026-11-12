# Rước đuốc

Trò chơi khởi động tiết Toán 6 (lớp 6/3, THCS Phan Tây Hồ): 4 nhóm trả lời 5 câu bằng thẻ Plickers, điện thoại quét thẻ. Trên màn hình TV, mỗi câu các mảnh ghép (vuông, chữ nhật, bình hành, thoi, thang cân) bay vào lấp cây cầu, 4 bạn cầm đuốc cùng qua cầu, Claude nhảy múa và bình luận. Về đích, các nhóm thắp đuốc theo thứ hạng, lửa đốt tan màn đêm và hiện báo tường 51 năm ngày truyền thống.

- Màn hình TV: mở trang, chọn **Màn hình TV**, bấm F11.
- Điện thoại: mở trang bằng Chrome (hoặc quét mã QR hiện trên TV), chọn **Điện thoại**.
- Để điện thoại gửi kết quả sang TV: điền cấu hình Firebase vào `js/cau-hinh.js`.
- Bản thử thẻ mới (mỗi chữ A, B, C, D một mã riêng, không xoay thẻ; in 4 thẻ rời hoặc 2 thẻ hai mặt đều đọc được): `the-moi.html` cùng thư mục `js-the-moi/`. Trang chính `index.html` và `js/` giữ nguyên, vẫn dùng thẻ cũ. Trên điện thoại của bản thử có mục Số đo (`js-the-moi/do.js`): máy tự ghi tốc độ đọc và từng thẻ lúc quét, không có ảnh hay tên học sinh; nút Gửi số đo ghi vào nhánh riêng `ruoc-duoc/do-thu`.
- Bản thử Xếp thiệp (hoạt động 2): thư mục `xep-thiep/`. Tivi mở trang, mỗi nhóm quét mã QR bằng điện thoại hoặc máy tính bảng rồi xếp 10 mảnh, tivi hiện 4 tấm thiệp cùng lúc. Dữ liệu nằm ở nhánh riêng `ruoc-duoc/xep-thiep`, không đụng tới trò Rước đuốc.
- Ảnh báo tường có hình thầy cô nên không nằm trong kho này: chọn ảnh từ máy ở phần Chuẩn bị trên TV.
- Nhạc nền: bản Suno của thầy Thịnh (nhac/nhac-nen.ogg).
