# Rước đuốc

Trò chơi khởi động tiết Toán 6 (lớp 6/3, THCS Phan Tây Hồ): 4 nhóm trả lời 5 câu bằng thẻ Plickers, điện thoại quét thẻ. Trên màn hình TV, mỗi câu các mảnh ghép (vuông, chữ nhật, bình hành, thoi, thang cân) bay vào lấp cây cầu, 4 bạn cầm đuốc cùng qua cầu, Claude nhảy múa và bình luận. Về đích, các nhóm thắp đuốc theo thứ hạng, lửa đốt tan màn đêm và hiện báo tường 51 năm ngày truyền thống.

- Màn hình TV: mở trang, chọn **Màn hình TV**, bấm F11.
- Điện thoại: mở trang bằng Chrome (hoặc quét mã QR hiện trên TV), chọn **Điện thoại**.
- Để điện thoại gửi kết quả sang TV: điền cấu hình Firebase vào `js/cau-hinh.js`.
- Bản thử thẻ mới (mỗi chữ A, B, C, D một mã riêng, không xoay thẻ; in 4 thẻ rời hoặc 2 thẻ hai mặt đều đọc được): `the-moi.html` cùng thư mục `js-the-moi/`. Trang chính `index.html` và `js/` giữ nguyên, vẫn dùng thẻ cũ. Trên điện thoại của bản thử có mục Số đo (`js-the-moi/do.js`): máy tự ghi tốc độ đọc và từng thẻ lúc quét, không có ảnh hay tên học sinh; nút Gửi số đo ghi vào nhánh riêng `ruoc-duoc/do-thu`.
- Bản thử Xếp thiệp (hoạt động 2): thư mục `xep-thiep/`. Tivi mở trang, mỗi nhóm quét mã QR bằng điện thoại hoặc máy tính bảng. Bước 1 nhập số đo và diện tích 7 loại mảnh, tổng, tấm thiệp, phần còn lại (máy chỉ báo đúng sai và gợi ý). Bước 2 xếp trên bàn có lưới ô 1 cm: 10 mảnh nằm sẵn trên lưới, thả mảnh đè lên nhau thì vẫn để yên. Bấm Hoàn thành: còn mảnh đè lên nhau thì hiện bảng báo mảnh số mấy cần chỉnh, mảnh còn nằm rời thì báo chưa nhận ra hình, hình ổn thì hỏi xác nhận rồi máy chỉnh nhẹ cho khít và đưa hình vào giữa tấm thiệp. Tivi hiện tấm báo tường, bài của mỗi nhóm nằm ngay trên tấm thiệp của nhóm đó trong ô dán; ảnh báo tường chọn từ máy ở Cài đặt (không nằm trong kho này). Có nút Mở bàn xếp và Đáp số cho giáo viên. Dữ liệu nằm ở nhánh riêng `ruoc-duoc/xep-thiep`, không đụng tới trò Rước đuốc.
- Ảnh báo tường có hình thầy cô nên không nằm trong kho này: chọn ảnh từ máy ở phần Chuẩn bị trên TV.
- Nhạc nền: bản Suno của thầy Thịnh (nhac/nhac-nen.ogg).
