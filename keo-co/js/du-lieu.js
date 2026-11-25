/* Kéo co (bản tách từ Rước đuốc 25/11/2026): dữ liệu cố định, cách tính điểm của từng nhóm (giữ của Rước đuốc)
   và luật kéo co của 2 đội (RD.DOI, RD.SUC_MANH, RD.keoCo) */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};

  RD.CHU = ["A", "B", "C", "D"];
  RD.MAXID = 46;          // thẻ mới 12/11: 46 bộ, mỗi bộ 4 thẻ A, B, C, D
  RD.BO_THE = "moi";
  RD.SO_THE = 50;         // Cài đặt nhận số thẻ 1–50 (25/11 20:14 thầy: "bạn cứ làm cho tôi là 50 số đi"); bộ thẻ in và bộ đọc mới có số 1–46 (RD.MAXID)

  // 4 tổ (thiết kế 3/11/2026): bạn cầm đuốc vẽ kiểu Ghibli, mặt tự vẽ, đồng phục theo ảnh của trường.
  // anh: 520 px cao; lua: tâm ngọn lửa trên ảnh; kieu: cách di chuyển (đi, lướt, tốc biến, nhảy), mọi kiểu mất cùng thời gian
  RD.TO = [
    { n: 1, ten: "Nhóm 1", mau: "#2f6fd6", nhat: "#dfe9fb", dam: "#1b4a97", anh: "../anh/to-1.webp", mat: "../anh/mat-1.webp", w: 280, h: 520, lua: [255, 42], kieu: "di", mo: "bạn nam áo vàng" },
    { n: 2, ten: "Nhóm 2", mau: "#2f9a58", nhat: "#ddf2e4", dam: "#1d6a3b", anh: "../anh/to-2.webp", mat: "../anh/mat-2.webp", w: 223, h: 520, lua: [183, 55], kieu: "bien", mo: "bạn nữ áo vàng, váy ca rô đồng phục, đứng thẳng" },
    { n: 3, ten: "Nhóm 3", mau: "#e9861c", nhat: "#fdead3", dam: "#a9590a", anh: "../anh/to-3.webp", mat: "../anh/mat-3.webp", w: 363, h: 520, lua: [340, 50], kieu: "di", mo: "bạn nam áo thể dục" },
    { n: 4, ten: "Nhóm 4", mau: "#8b52cc", nhat: "#eee2f9", dam: "#5b2f93", anh: "../anh/to-4.webp", mat: "../anh/mat-4.webp", w: 342, h: 520, lua: [320, 44], kieu: "bien", mo: "bạn nữ áo thể dục" }
  ];

  // Hai bộ đề, mỗi bộ 5 câu. Màn hình không gắn nhãn "chu vi" / "diện tích" cho từng câu, không hiện lời giải.
  //   Đề nâng cao: 5 câu bản cuối 1/11/2026, mỗi câu 2 bước tính.
  //   Đề cơ bản (8/11 thầy Thịnh: "5 câu đề bài tạo thêm 1 bản Dễ hơn, các câu chỉ có 1 bước tính ví dụ câu 1 là hỏi các bạn
  //     học sinh cần mua bao nhiêu mét dây ruy băng", "ở trang đầu sẽ cho chọn Đề cơ bản và nâng cao"): cùng hình, mỗi câu
  //     1 bước tính. themSo: số đo ghi thêm trên hình của câu đó.
  //     Bản 2 (thầy thấy bản 1 "hơi bị kỳ", nhờ tra SGK, SBT; duyệt 8/11 09:37 UTC): hỏi theo kiểu SGK bài 4.18 (độ dài hàng
  //     rào) và SBT bài 4.22, 4.25 (diện tích … bao nhiêu); mỗi đáp án sai là một lỗi hay gặp (de-co-ban-ban-2.md).
  RD.DE = {
    "nang-cao": [
      {
        so: 1, mau: "#1f5fae", hinh: "../anh/cau-1.webp", dung: "C",
        boiCanh: "Các bạn học sinh dự định mua ruy băng để dán xung quanh viền một khung ảnh hình vuông có cạnh **2 mét**. Biết giá 1 mét ruy băng là **5 000 đồng**.",
        hoi: "Hỏi các bạn học sinh cần bao nhiêu tiền để mua ruy băng?",
        chon: ["20 000 đồng", "10 000 đồng", "40 000 đồng", "30 000 đồng"]
      },
      {
        so: 2, mau: "#c4860a", hinh: "../anh/cau-2.webp", dung: "A",
        boiCanh: "Một sân khấu hình chữ nhật có chiều dài **12 mét**, chiều rộng bằng **{2/3}** chiều dài. Người ta mắc dây đèn xung quanh sân khấu.",
        hoi: "Hỏi dây đèn dài bao nhiêu mét?",
        chon: ["40 mét", "20 mét", "96 mét", "32 mét"]
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "../anh/cau-3.webp", dung: "D",
        boiCanh: "Người ta sơn kín một ô đậu xe hình bình hành có cạnh **3 mét**, chiều cao tương ứng là **5 mét**. Biết cứ 1 lít sơn thì sơn được **3 mét vuông**.",
        hoi: "Hỏi cần bao nhiêu lít sơn?",
        chon: ["45 lít", "15 lít", "2,5 lít", "5 lít"]
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "../anh/cau-4.webp", dung: "B",
        boiCanh: "Một bồn hoa hình thoi có độ dài hai đường chéo là **12 mét** và **9 mét**.",
        hoi: "Hỏi nếu mỗi mét vuông trồng 5 cây hoa thì cần bao nhiêu cây hoa để trồng hết bồn hoa đó?",
        chon: ["540 cây", "270 cây", "54 cây", "105 cây"]
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "../anh/cau-5.webp", dung: "C",
        boiCanh: "Một mảnh đất hình thang có đáy lớn **10 mét**, đáy nhỏ **6 mét**, chiều cao **3 mét**. Người ta chia đều mảnh đất đó cho **4 người thợ** để trồng cỏ.",
        hoi: "Hỏi mỗi người thợ phải trồng bao nhiêu mét vuông cỏ?",
        chon: ["12 mét vuông", "24 mét vuông", "6 mét vuông", "8 mét vuông"]
      }
    ],
    "co-ban": [
      {
        so: 1, mau: "#1f5fae", hinh: "../anh/cau-1.webp", dung: "B",
        boiCanh: "Các bạn học sinh mua dây ruy băng để dán vừa đủ một vòng quanh viền một khung ảnh hình vuông có cạnh **2 mét**.",
        hoi: "Hỏi các bạn học sinh cần mua bao nhiêu mét dây ruy băng?",
        chon: ["4 mét", "8 mét", "6 mét", "2 mét"]
      },
      {
        so: 2, mau: "#c4860a", hinh: "../anh/cau-2.webp", dung: "D",
        boiCanh: "Một sân khấu hình chữ nhật có chiều dài **12 mét**, chiều rộng **8 mét**. Người ta mắc dây đèn vừa đủ một vòng quanh mép sân khấu.",
        hoi: "Hỏi dây đèn dài bao nhiêu mét?",
        chon: ["20 mét", "96 mét", "32 mét", "40 mét"],
        // đề cho sẵn chiều rộng nên hình ghi thêm "8 mét" sát cạnh phải sân khấu (a "p": x là mép phải của chữ)
        themSo: [{ t: "8 mét", x: 816, y: 384, f: 56, nen: 1, a: "p" }]
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "../anh/cau-3.webp", dung: "A",
        boiCanh: "Người ta sơn kín một ô đậu xe hình bình hành có độ dài một cạnh là **3 mét**, chiều cao tương ứng là **5 mét**.",
        hoi: "Hỏi diện tích phần cần sơn là bao nhiêu mét vuông?",
        chon: ["15 mét vuông", "8 mét vuông", "16 mét vuông", "7,5 mét vuông"]
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "../anh/cau-4.webp", dung: "C",
        boiCanh: "Một bồn hoa hình thoi có độ dài hai đường chéo là **12 mét** và **9 mét**.",
        hoi: "Hỏi diện tích bồn hoa đó là bao nhiêu mét vuông?",
        chon: ["108 mét vuông", "21 mét vuông", "54 mét vuông", "42 mét vuông"]
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "../anh/cau-5.webp", dung: "B",
        boiCanh: "Người ta trồng cỏ kín một mảnh đất hình thang có độ dài hai đáy là **10 mét** và **6 mét**, chiều cao **3 mét**.",
        hoi: "Hỏi diện tích phần trồng cỏ là bao nhiêu mét vuông?",
        chon: ["48 mét vuông", "24 mét vuông", "8 mét vuông", "30 mét vuông"]
      }
    ],
    // Đề demo (9/11 06:20 UTC thầy Thịnh: "tạo thêm 1 đề gọi là đề demo, đề này giống đề 1 nhưng câu hỏi, hình ảnh khác đề 1 là
    //   đề thi chính thức"; 06:49 "ok"): để cả lớp chơi thử trước, không lộ đề chính thức. Cùng kiểu Đề cơ bản (1 bước tính, cùng
    //   thứ tự hình), bối cảnh, số đo, đáp án khác; mỗi đáp án sai là một lỗi hay gặp. Hình tĩnh vẽ kiểu Ghibli (Canva AI),
    //   khung riêng của từng câu (khung: W×H; anh: ảnh tĩnh đặt ở x, y cỡ w×h; nhan: lớp nét vẽ; so: số đo bằng chữ thật).
    //   25/11 22:12 thầy Thịnh: "đề demo giữ nguyên nhưng đổi số liệu nhé": giữ bối cảnh, hình, thứ tự và chữ cái đáp án đúng; đổi số đo
    //   (đều là số tự nhiên), đáp án và ba đáp án sai (vẫn mỗi đáp án sai là một lỗi hay gặp). Trước đó: cạnh 5; 9 × 4; 8, cao 3; 10 và 6; 9, 5, cao 4.
    "demo": [
      {
        so: 1, mau: "#1f5fae", hinh: "../anh/de-demo/cau-1.webp", dung: "D",
        boiCanh: "Người ta kẻ vạch sơn vừa đủ một vòng quanh mép một ô sân chơi hình vuông có cạnh **6 mét**.",
        hoi: "Hỏi vạch sơn dài bao nhiêu mét?",
        chon: ["36 mét", "12 mét", "18 mét", "24 mét"],
        khung: { W: 970, H: 970, anh: "../anh/de-demo/cau-1.webp", x: -120, y: -80, w: 1200, h: 1200,
          so: [{ t: "6 mét", x: 485, y: 905, f: 77, nen: 1 }] }
      },
      {
        so: 2, mau: "#c4860a", hinh: "../anh/de-demo/cau-2.webp", dung: "A",
        boiCanh: "Vườn rau của lớp hình chữ nhật có chiều dài **7 mét**, chiều rộng **3 mét**. Các bạn làm hàng rào tre vừa đủ một vòng quanh vườn.",
        hoi: "Hỏi hàng rào tre dài bao nhiêu mét?",
        chon: ["20 mét", "10 mét", "21 mét", "17 mét"],
        khung: { W: 1060, H: 610, anh: "../anh/de-demo/cau-2.webp", x: -80, y: -30, w: 1200, h: 674,
          so: [{ t: "7 mét", x: 530, y: 64, f: 56, nen: 1 }, { t: "3 mét", x: 940, y: 288, f: 56, nen: 1, a: "p" }] }
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "../anh/de-demo/cau-3.webp", dung: "C",
        boiCanh: "Một hồ cá cảnh hình bình hành có độ dài một cạnh là **9 mét**, chiều cao tương ứng là **4 mét**.",
        hoi: "Hỏi diện tích mặt hồ là bao nhiêu mét vuông?",
        chon: ["13 mét vuông", "26 mét vuông", "36 mét vuông", "18 mét vuông"],
        khung: { W: 1200, H: 800, anh: "../anh/de-demo/cau-3.webp", x: 0, y: -70, w: 1200, h: 897, nhan: "../anh/de-demo/nhan-cau-3.webp",
          so: [{ t: "4 mét", x: 282, y: 366, f: 64, nen: 1, a: "t" }, { t: "9 mét", x: 506, y: 732, f: 64, nen: 1 }] }
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "../anh/de-demo/cau-4.webp", dung: "B",
        boiCanh: "Một tấm bạt che nắng hình thoi có độ dài hai đường chéo là **14 mét** và **6 mét**.",
        hoi: "Hỏi diện tích tấm bạt là bao nhiêu mét vuông?",
        chon: ["84 mét vuông", "42 mét vuông", "20 mét vuông", "40 mét vuông"],
        khung: { W: 1200, H: 820, anh: "../anh/de-demo/cau-4.webp", x: 0, y: -40, w: 1200, h: 897, nhan: "../anh/de-demo/nhan-cau-4.webp",
          so: [{ t: "14 mét", x: 330, y: 390, f: 64, nen: 1 }, { t: "6 mét", x: 624, y: 210, f: 64, nen: 1, a: "t" }] }
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "../anh/de-demo/cau-5.webp", dung: "A",
        boiCanh: "Các bạn trồng hoa hướng dương kín một mảnh vườn hình thang có độ dài hai đáy là **12 mét** và **8 mét**, chiều cao **5 mét**.",
        hoi: "Hỏi diện tích phần trồng hoa là bao nhiêu mét vuông?",
        chon: ["50 mét vuông", "100 mét vuông", "10 mét vuông", "60 mét vuông"],
        khung: { W: 1200, H: 854, anh: "../anh/de-demo/cau-5.webp", x: 0, y: 90, w: 1200, h: 674, nhan: "../anh/de-demo/nhan-cau-5.webp",
          so: [{ t: "8 mét", x: 591, y: 45, f: 66 }, { t: "12 mét", x: 602, y: 809, f: 66 }, { t: "5 mét", x: 319, y: 412, f: 66, nen: 1, a: "t" }] }
      }
    ]
  };
  RD.THU_TU_DE = ["co-ban", "nang-cao", "demo"];
  // 25/11 22:12 thầy Thịnh: "Đề cơ bản đổi tên thành Đề chính thức" (khoá "co-ban" giữ nguyên để máy đang lưu cfg.de cũ vẫn đọc được)
  RD.TEN_DE = { "co-ban": "Đề chính thức", "nang-cao": "Đề nâng cao", "demo": "Đề demo" };
  RD.MO_TA_DE = { "co-ban": "Mỗi câu 1 bước tính", "nang-cao": "Mỗi câu 2 bước tính", "demo": "Chơi thử trước, mỗi câu 1 bước tính" };
  // 9/11 04:11 UTC (thầy Thịnh: "mặc định trong cài đặt luôn luôn là đề cơ bản nha"): mặc định Đề cơ bản (8/11 là Đề nâng cao)
  RD.DE_MAC_DINH = "co-ban";
  // bộ đề đang dùng: lưu ở cfg.de (TV và điện thoại dùng chung); RD.CAU là 5 câu của bộ đề đó
  RD.chonDe = function (k) {
    if (!RD.DE[k]) k = RD.DE_MAC_DINH;
    RD.deDang = k;
    RD.CAU = RD.DE[k];
    return k;
  };
  RD.chonDe(RD.DE_MAC_DINH);
  // khung hình của câu q trong đề đang chơi: câu có khung riêng (Đề demo, ảnh tĩnh) thì dùng khung đó, không thì khung chung RD.KHUNG
  RD.khungCau = function (q) { var c = RD.CAU && RD.CAU[q - 1]; return (c && c.khung) || (RD.KHUNG && RD.KHUNG[q]) || null; };
  // hình chuyển động của 5 câu (video 8 giây lặp lại). Khung W×H tính theo điểm ảnh video; video đặt ở (x, y), cỡ w×h
  // (x, y âm là cắt bớt lề trắng của video). 7/11 thầy Thịnh: "những cái số trong các hình ảnh cho to lên"
  //   -> số đo viết bằng chữ thật trên trang (so: tâm x, y; a "t" thì x là mép trái; f cỡ chữ; nen: nền trắng khi nằm trên hình),
  //      khoảng 60 px trên khung 1920 (trước khoảng 20 px); lớp phủ anh/chuyen-dong/nhan-cau-N.webp (nhan) chỉ còn nét đứt,
  //      góc vuông, viền hình thang; ảnh chờ anh/chuyen-dong/tinh-cau-N.webp là khung đầu của video
  RD.KHUNG = {
    1: { W: 820, H: 929, x: -44, y: 0, w: 930, h: 862, so: [{ t: "2 mét", x: 432, y: 880, f: 73 }] },
    2: { W: 873, H: 692, x: -30, y: 27, w: 930, h: 706, so: [{ t: "12 mét", x: 436, y: 40, f: 56 }] },
    3: { W: 930, H: 869, x: 0, y: 0, w: 930, h: 842, nhan: true,
      so: [{ t: "5 mét", x: 379, y: 418, f: 68, nen: 1, a: "t" }, { t: "3 mét", x: 362.5, y: 820, f: 68, nen: 1 }] },
    4: { W: 772, H: 600, x: -80, y: -88, w: 930, h: 768, nhan: true,
      so: [{ t: "12 mét", x: 220, y: 252, f: 50, nen: 1 }, { t: "9 mét", x: 396, y: 392, f: 50, nen: 1, a: "t" }] },
    5: { W: 860, H: 502, x: 0, y: 80, w: 860, h: 342, nhan: true,
      so: [{ t: "6 mét", x: 348.8, y: 41, f: 55 }, { t: "10 mét", x: 427.8, y: 461, f: 55 }, { t: "3 mét", x: 100.5, y: 280, f: 55, nen: 1, a: "t" }] }
  };
  // 7/11 thầy Thịnh: "phần chữ cho dịch qua phải, rồi cho hình to lên" -> cột hình rộng tới 960 px (trước 560, câu 5 700),
  // hình cao kín ô; chữ đề nằm bên phải
  RD.COT_HINH = 960;
  // Điểm câu = phần trăm bạn có mặt của tổ trả lời đúng (số nguyên); câu 5 nhân đôi. Tối đa 600 (thiết kế cây cầu 4/11/2026).
  RD.HE_SO = [1, 1, 1, 1, 2];
  RD.TONG_DIEM = 600;
  // Kéo co: câu 5 không còn "nhân đôi số điểm" (thay bằng sức mạnh Về đích, xem RD.SUC_MANH)
  RD.nhanCau = function (q) { return "Câu " + q + "/5"; };

  /* ---------- Kéo co (25/11/2026) ----------
     Thầy Thịnh 25/11: hiệu trưởng muốn đổi Rước đuốc thành kéo co; thầy chọn luật "5 câu, 5 sức mạnh" (11:50) và
       "nhóm 1 và 2 ghép 1 đội, nhóm 3 và 4 ghép 1 đội" (12:05). Luật gốc: keoco_mo_phong.py, hàm van(rows, 'suc-manh').
     Mỗi câu: tỉ lệ đúng của đội = số thẻ đúng ÷ số thẻ đọc được của cả 2 nhóm trong đội, làm tròn thành số nguyên phần trăm
       (cùng con số hiện trên TV). Đội hơn kém nhau d điểm phần trăm: d < 5 hòa, dây đứng yên; 5 ≤ d < 10 kéo 1 nấc;
       10 ≤ d < 25 kéo 2 nấc; d ≥ 25 kéo 3 nấc. Rồi tới sức mạnh của câu:
       câu 1 Khai cuộc: không thêm gì · câu 2 Đồng lòng: đội nào đúng từ 90% trở lên được thưởng thêm 1 nấc (cả hai đội đều có thể)
       · câu 3 Tăng tốc: đội thắng câu này kéo thêm 1 nấc · câu 4 Tiếp sức: đội đang bị dẫn mà thắng câu này thì số nấc nhân đôi
       · câu 5 Về đích (25/11 16:18 thầy: "câu vàng đổi thành về đích"): số nấc nhân đôi. Mỗi câu thắng được 1 ngôi sao (chỉ để nhìn, không tính vào kết quả).
     vt: vị trí dây tính bằng nấc, dương là Đội 1 đang dẫn (dây lệch về bên Đội 1 đứng), âm là Đội 2 đang dẫn.
     Đội nào đứng bên nào trên TV: cfg.d1Trai (true: Đội 1 bên trái; mặc định Đội 1 bên phải), nút "Đổi bên" trong Cài đặt. */
  RD.DOI = [
    { n: 1, ten: "Đội 1", mau: "#2f6fd6", dam: "#1b4a97", nhat: "#dfe9fb", to: [0, 1] },
    { n: 2, ten: "Đội 2", mau: "#e9861c", dam: "#a8560a", nhat: "#fdead3", to: [2, 3] }
  ];
  RD.SUC_MANH = [
    { ten: "Khai cuộc", luat: "Đội nào đúng nhiều hơn thì kéo dây về phía đội mình" },
    { ten: "Đồng lòng", luat: "Đội nào đúng từ 90% trở lên được thưởng thêm 1 nấc" },
    { ten: "Tăng tốc", luat: "Đội thắng câu này được kéo thêm 1 nấc" },
    { ten: "Tiếp sức", luat: "Đội đang bị dẫn mà thắng câu này thì được kéo gấp đôi" },
    { ten: "Về đích", luat: "Số nấc của câu này được nhân đôi" }
  ];
  // 26/11 00:01 thầy Thịnh (gửi hình dải "TĂNG TỐC Đội thắng câu này được kéo thêm 1 nấc"): "đổi tên thành hiệu ứng tăng tốc. và cho dòng này
  //   to lên. câu 5 cũng ghi giống mấy câu kia nhé. còn câu 1 thì ghi rõ là không có hiệu ứng." Nên dải trên TV ghi "Hiệu ứng <tên>".
  // 26/11 00:45 thầy đổi ý về câu 1: "hiệu ứng khai cuộc giữ nguyên như lúc đầu không đổi nhé": câu 1 lại ghi "Hiệu ứng Khai cuộc" với lời
  //   luật cũ, không còn ghi "Không có hiệu ứng" (bản 7 có ghi, trên trang từ 00:37 tới lúc bản 8 lên).
  RD.tenHieuUng = function (q) { return "Hiệu ứng " + RD.SUC_MANH[q - 1].ten; };
  RD.DONG_LONG = 90;         // ngưỡng Đồng lòng (phần trăm). Ván thật 19/11 cao nhất 87%: thầy chưa chốt giữ 90 hay hạ
  RD.NAC_HIEN = 10;          // dây và thước trên TV chỉ lệch tối đa bấy nhiêu nấc; chữ vẫn ghi số nấc thật
  RD.nac = function (d) { d = Math.abs(d); return d < 5 ? 0 : d < 10 ? 1 : d < 25 ? 2 : 3; };
  // số liệu một câu của 2 đội: [{dung, thay, coMat, tram}, …]
  RD.doiCau = function (q, lop, scan) {
    var kq = RD.ketQuaCau(q, lop, scan);
    return RD.DOI.map(function (D) {
      var r = { dung: 0, thay: 0, coMat: 0, tram: 0 };
      D.to.forEach(function (t) { r.dung += kq[t].dung; r.thay += kq[t].thay; r.coMat += kq[t].coMat; });
      r.tram = r.thay ? Math.round(100 * r.dung / r.thay) : 0;
      return r;
    });
  };
  // một câu kéo co từ số liệu 2 đội và vị trí dây trước câu đó
  //   trả về { q, doi, hieu, thang (0 hòa, 1, 2), goc (nấc theo hiệu), nac (nấc sau sức mạnh), them, gapDoi, thuong: [0|1, 0|1],
  //            truoc, sau, buoc: [+1 | -1, …] (từng nấc dây đi, dương là về phía Đội 1; nấc thưởng Đồng lòng đi sau) }
  RD.keoCau = function (q, doi, truoc) {
    var hieu = doi[0].tram - doi[1].tram, goc = RD.nac(hieu), thang = goc ? (hieu > 0 ? 1 : 2) : 0;
    var nac = goc, them = 0, gapDoi = false, thuong = [0, 0];
    if (q === 3 && goc) { nac += 1; them = 1; }
    if (q === 4 && goc && ((thang === 1 && truoc < 0) || (thang === 2 && truoc > 0))) { nac *= 2; gapDoi = true; }
    if (q === 5 && goc) { nac *= 2; gapDoi = true; }
    if (q === 2) { thuong = doi.map(function (r) { return r.thay > 0 && r.tram >= RD.DONG_LONG ? 1 : 0; }); }
    var buoc = [], i, chieu = thang === 1 ? 1 : -1;
    for (i = 0; i < nac; i++) buoc.push(chieu);
    if (thuong[0] && !thuong[1]) buoc.push(1);
    if (thuong[1] && !thuong[0]) buoc.push(-1);       // cả hai đội cùng được thưởng thì hai nấc bù nhau, dây không đi thêm
    var sau = truoc;
    buoc.forEach(function (b) { sau += b; });
    return { q: q, doi: doi, hieu: Math.abs(hieu), thang: thang, goc: goc, nac: nac, them: them, gapDoi: gapDoi, thuong: thuong, truoc: truoc, sau: sau, buoc: buoc };
  };
  // cả ván tới hết các câu trong cauTinh ({1: true, 2: true, …}): { vt, sao: [đội 1, đội 2], cau: {q: kết quả câu}, thang }
  RD.keoCo = function (cfg, scans, cauTinh) {
    var lop = RD.lop(cfg), vt = 0, sao = [0, 0], cau = {};
    for (var q = 1; q <= 5; q++) {
      if (!cauTinh[q]) continue;
      var k = RD.keoCau(q, RD.doiCau(q, lop, scans[q]), vt);
      vt = k.sau;
      if (k.thang) sao[k.thang - 1]++;
      cau[q] = k;
    }
    return { vt: vt, sao: sao, cau: cau, thang: vt > 0 ? 1 : vt < 0 ? 2 : 0 };
  };
  RD.vietVT = function (vt) { return vt > 0 ? "Đội 1 dẫn " + vt + " nấc" : vt < 0 ? "Đội 2 dẫn " + (-vt) + " nấc" : "Hai đội ngang nhau"; };

  // các bước của buổi chơi, theo đúng thứ tự bấm "tiếp"
  RD.BUOC = ["setup", "intro"];
  // mỗi câu: q đọc đề và quét thẻ · k quét xong (số em chọn mỗi đáp án) · a đáp án (số bạn đúng mỗi tổ) · r di chuyển qua cầu
  for (var q = 1; q <= 5; q++) RD.BUOC.push("q" + q, "k" + q, "a" + q, "r" + q);
  // finish: 4 bạn tới cuối cầu, tổ nhất thắp đuốc · rank: 3 tổ còn lại thắp đuốc, đủ 4 ngọn đuốc thì hiện nút "Tiếp theo" ·
  // tuong: 4 tia lửa bay lên số 51, lửa đốt tan màn đêm, báo tường chỉ hiện hình và số 51 · bao: hiện toàn bộ báo tường, vỗ tay
  // (8/11 thầy Thịnh: "sau khi cả 4 bạn đốt đuốc, hiện thêm nút tiếp theo, tôi bấm vô thì mới hiện báo tường")
  // Ngọn đuốc tri thức (25/11 17:34 thầy Thịnh: "sau khi tôi bấm nút tiếp theo á, thì cái đội chiến thắng sẽ qua bắt tay cái đội bên kia, thì lúc
  //   này cả hai ngọn đuốc sẽ cùng phát sáng và xuất hiện cái hiệu ứng ra cái tờ báo tường"): không còn bước rank. finish: đội thắng thắp
  //   đuốc · tuong: đội thắng sang bắt tay, hai ngọn đuốc cùng sáng, sách và công thức bay về số 51, báo tường hiện hình và số 51 · bao: như cũ
  RD.BUOC.push("finish", "tuong", "bao");
  RD.cauCuaBuoc = function (b) { var m = /^[qkar]([1-5])$/.exec(b || ""); return m ? +m[1] : 0; };
  RD.loaiBuoc = function (b) { return /^[qkar][1-5]$/.test(b || "") ? b[0] : b; };

  /* ---------- danh sách tổ ---------- */
  // "1-11, 46" -> [1..11, 46]
  RD.docDanhSach = function (s) {
    var out = [], seen = {};
    String(s || "").split(/[,;\s]+/).forEach(function (p) {
      if (!p) return;
      var m = /^(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?$/.exec(p.trim());
      if (!m) return;
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (b < a) { var t = a; a = b; b = t; }
      for (var i = a; i <= b; i++) if (i >= 1 && i <= RD.SO_THE && !seen[i]) { seen[i] = 1; out.push(i); }
    });
    return out.sort(function (x, y) { return x - y; });
  };
  // [1,2,3,5,6,46] -> "1-3, 5-6, 46"
  RD.vietDanhSach = function (arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; }), out = [], i = 0;
    while (i < a.length) {
      var j = i;
      while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
      out.push(j > i ? a[i] + "-" + a[j] : String(a[i]));
      i = j + 1;
    }
    return out.join(", ");
  };
  // chia sĩ số thành 4 tổ liên tiếp; tổ cuối nhận phần dư (45 -> 11, 11, 11, 12)
  RD.chiaTo = function (siSo) {
    var n = Math.max(4, Math.min(RD.SO_THE, siSo | 0)), base = Math.floor(n / 4), du = n % 4, lists = [], start = 1;
    for (var t = 0; t < 4; t++) {
      var k = base + (t >= 4 - du ? 1 : 0);
      lists.push(start + "-" + (start + k - 1));
      start += k;
    }
    return lists;
  };
  // 25/11 20:14 thầy Thịnh: "trong cái phần cài đặt ấy, thì cái nhóm thì vì bây giờ chỉ có hai đội thôi ... bạn cứ làm cho tôi là 50 số đi ...
  //   Rồi bữa đó tôi sẽ nhập vô rồi chia thành hai đội. Ví dụ lớp 46 em thì chia thành 23 em mỗi đội chẳng hạn."
  //   Hai đội nằm ở ô 0 và ô 2 của cfg.ds (ô 1 và ô 3 để trống), nên phần tính điểm (4 ô; RD.DOI[].to = [0, 1] và [2, 3]) giữ nguyên, và danh
  //   sách cũ ghi theo 4 nhóm vẫn đọc được: Đội 1 = ô 0 + ô 1, Đội 2 = ô 2 + ô 3. Sĩ số lẻ thì Đội 2 nhiều hơn 1 bạn (45 -> 22 và 23, như trước).
  RD.chiaDoi = function (siSo) {
    var n = Math.max(2, Math.min(RD.SO_THE, siSo | 0)), a = Math.floor(n / 2);
    return [a > 1 ? "1-" + a : "1", "", a + 1 < n ? (a + 1) + "-" + n : String(n), ""];
  };
  // số thẻ của từng đội, đã gộp các ô: [{ ids, coMat, ds: "1-23" }, { … }]
  RD.lopDoi = function (lop) {
    var tang = function (a, b) { return a - b; };
    return RD.DOI.map(function (D) {
      var ids = [], coMat = [];
      D.to.forEach(function (t) {
        ids = ids.concat(lop.to[t].ids.filter(function (id) { return lop.toCua[id] === t + 1; }));
        coMat = coMat.concat(lop.to[t].coMat);
      });
      ids.sort(tang); coMat.sort(tang);
      return { ids: ids, coMat: coMat, ds: RD.vietDanhSach(ids) };
    });
  };
  // thẻ số id thuộc đội nào: 1, 2, hoặc 0 (ngoài lớp)
  RD.doiCuaThe = function (lop, id) { var t = lop.toCua[id]; return !t ? 0 : RD.DOI[0].to.indexOf(t - 1) >= 0 ? 1 : 2; };
  RD.cfgMacDinh = function (ses) {
    return { ses: ses, siSo: 45, ds: RD.chiaDoi(45), vang: [], at: 0 };
  };
  // thông tin lớp đã giải mã: tổ của từng thẻ, ai có mặt
  RD.lop = function (cfg) {
    cfg = cfg || RD.cfgMacDinh("");
    var vang = {}, toCua = {}, trung = [], to = [];
    (cfg.vang || []).forEach(function (id) { vang[+id] = 1; });
    for (var t = 0; t < 4; t++) {
      var ids = RD.docDanhSach((cfg.ds || [])[t] || "");
      ids.forEach(function (id) { if (toCua[id]) trung.push(id); else toCua[id] = t + 1; });
      var coMat = ids.filter(function (id) { return !vang[id] && toCua[id] === t + 1; });
      to.push({ ids: ids, coMat: coMat });
    }
    var tong = 0, coMatTong = 0;
    to.forEach(function (x) { tong += x.ids.length; coMatTong += x.coMat.length; });
    return { to: to, toCua: toCua, vang: vang, trung: trung, tong: tong, coMat: coMatTong };
  };

  /* ---------- tính điểm ---------- */
  // thẻ được lưu với khóa "t12"; m: "D" đúng, "S" sai, "V" vắng ở câu này (giáo viên chạm)
  RD.ketQuaCau = function (q, lop, scan) {
    var dung = RD.CAU[q - 1].dung, cards = (scan && scan.cards) || {}, man = (scan && scan.man) || {};
    return lop.to.map(function (x) {
      var r = { dung: 0, thay: 0, chua: [], coMat: x.coMat.length };
      x.coMat.forEach(function (id) {
        var k = "t" + id, m = man[k], l = cards[k];
        if (m === "V") return;
        if (m === "D") { r.thay++; r.dung++; return; }
        if (m === "S") { r.thay++; return; }
        if (l) { r.thay++; if (l === dung) r.dung++; return; }
        r.chua.push(id);
      });
      return r;
    });
  };
  // Điểm câu = 100 × số bạn đúng ÷ số thẻ đọc được của tổ, làm tròn thành số nguyên (thẻ chưa đọc được hoặc ghi
  // "vắng ở câu này" không tính đúng cũng không tính sai); câu 5 nhân 2. Tổng = cộng các điểm câu (tối đa 600).
  // Trường "tram" giữ tên cũ: nay là điểm số nguyên hiện trên TV.
  RD.tinhDiem = function (cfg, scans, cauTinh) {
    var lop = RD.lop(cfg);
    var res = lop.to.map(function () { return { tram: 0, diem: 0, viTri: 0, cau: [] }; });
    for (var q = 1; q <= 5; q++) {
      if (!cauTinh[q]) continue;
      var heSo = RD.HE_SO[q - 1];
      RD.ketQuaCau(q, lop, scans[q]).forEach(function (r, t) {
        var tram = r.thay ? Math.round(100 * r.dung / r.thay) * heSo : 0;
        res[t].tram += tram;
        res[t].cau[q] = { dung: r.dung, thay: r.thay, tram: tram, tron: r.thay > 0 && r.dung === r.thay };
      });
    }
    res.forEach(function (r) { r.diem = r.tram; r.viTri = Math.min(1, r.tram / RD.TONG_DIEM); });
    return res;
  };
  RD.vietDiem = function (tram) { return String(tram | 0); };
  // các tổ được miếng vàng ở câu q (điểm câu cao nhất; bằng điểm thì cùng vàng)
  RD.toVang = function (res, q) {
    var mx = -1;
    res.forEach(function (r) { var c = r.cau[q]; if (c && c.thay && c.tram > mx) mx = c.tram; });
    return mx < 0 ? [] : [0, 1, 2, 3].filter(function (t) { var c = res[t].cau[q]; return c && c.thay && c.tram === mx; });
  };
  // thứ hạng: tổ nhiều điểm hơn đứng trước; bằng điểm thì cùng hạng (và cùng thắp đuốc)
  RD.xepHang = function (res) {
    var idx = [0, 1, 2, 3].sort(function (a, b) { return res[b].tram - res[a].tram || a - b; });
    var hang = [], prev = null, h = 0;
    idx.forEach(function (t, i) {
      if (prev === null || res[t].tram !== res[prev].tram) h = i + 1;
      hang[t] = h;
      prev = t;
    });
    var nhom = [];
    idx.forEach(function (t) { var g = nhom[nhom.length - 1]; if (g && hang[g[0]] === hang[t]) g.push(t); else nhom.push([t]); });
    return { thuTu: idx, hang: hang, nhat: idx.filter(function (t) { return hang[t] === 1; }), nhom: nhom };
  };

  /* ---------- lời bình viết sẵn (dùng khi không có Claude) ---------- */
  function chon(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
  function noi(names) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " và " + names[names.length - 1];
  }
  // Lời bình theo mẫu mới của thầy Thịnh (5/11, 16:10; thầy viết "Tổ", trang ghi "Nhóm" như thầy đã dặn trước đó):
  //   "Ở câu hỏi này, Nhóm 1 và 2 có số bạn trả lời đúng nhiều nhất nhưng tổng điểm vẫn thua Nhóm 3. Cố lên nào!"
  // Các trường hợp khác viết tương tự:
  //   nhóm đúng nhiều nhất cũng đang dẫn đầu: "Ở câu hỏi này, Nhóm 2 có số bạn trả lời đúng nhiều nhất và đang dẫn đầu
  //     tổng điểm. Các nhóm khác cố lên nào!"
  //   chỉ trùng một phần: "Ở câu hỏi này, Nhóm 1 và 2 có số bạn trả lời đúng nhiều nhất, còn tổng điểm thì Nhóm 2 đang
  //     dẫn đầu. Các nhóm khác cố lên nào!"
  //   câu 5 (hết trò chơi): "... nhưng tổng điểm vẫn thua Nhóm 3. Chúc mừng Nhóm 3 về nhất!" hoặc "... và về nhất chung
  //     cuộc. Chúc mừng Nhóm 2!"
  // Nhóm được nêu là nhóm nhận miếng vàng (điểm câu cao nhất). Các nhóm có số bạn khác nhau (11 hoặc 12), nên nếu nhóm đó
  // không có nhiều bạn đúng nhất tính theo số người thì ghi "có tỉ lệ bạn trả lời đúng cao nhất" cho đúng sự thật.
  function dsTo(ds) {      // [1] -> "Nhóm 2"; [0,1] -> "Nhóm 1 và 2"; [0,2,3] -> "Nhóm 1, 3 và 4"; đủ 4 -> "cả bốn nhóm"
    if (ds.length === 4) return "cả bốn nhóm";
    var so = ds.slice().sort().map(function (t) { return String(RD.TO[t].n); });
    return "Nhóm " + noi(so);
  }
  // trả về cả các phần của lời bình để Claude giữ đúng lời thầy: dau (câu đầu), cuoi (câu kết), danChu (nhóm dẫn đầu)
  RD.loiBinhPhan = function (q, truoc, sau) {
    var vang = RD.toVang(sau, q);
    var dan = RD.xepHang(sau).nhat;
    if (!vang.length) return { chu: "Ở câu hỏi này, chưa có thẻ nào được quét.", dau: "", cuoi: "", danChu: "" };
    var maxDung = Math.max.apply(null, [0, 1, 2, 3].map(function (t) { return (sau[t].cau[q] && sau[t].cau[q].dung) || 0; }));
    // 18/11: chỉ nói "số bạn trả lời đúng nhiều nhất" khi đúng là chỉ các nhóm được nêu có nhiều bạn đúng nhất. Nhóm 12 bạn có
    //   cùng số bạn đúng với nhóm 11 bạn thì ít điểm hơn, không được nêu: lúc đó trước đây lời bình vẫn nói "nhiều nhất", trái với
    //   dòng "Nhóm 4: 3/12 HS đúng" cả lớp vừa thấy. Nay ghi "có tỉ lệ bạn trả lời đúng cao nhất".
    var nhieuNhat = [0, 1, 2, 3].every(function (t) {
      var d = (sau[t].cau[q] && sau[t].cau[q].dung) || 0;
      return vang.indexOf(t) >= 0 ? d === maxDung : d < maxDung;
    });
    var cau1 = "Ở câu hỏi này, " + (vang.length === 4 ? "cả bốn nhóm có tỉ lệ bạn trả lời đúng ngang nhau" :
      dsTo(vang) + (nhieuNhat ? " có số bạn trả lời đúng nhiều nhất" : " có tỉ lệ bạn trả lời đúng cao nhất"));
    var trung = vang.filter(function (t) { return dan.indexOf(t) >= 0; });
    var cungNhau = trung.length === vang.length && trung.length === dan.length;     // nhóm đúng nhiều nhất cũng là nhóm dẫn đầu
    var ca4 = dan.length === 4, Ls = dsTo(dan), giua, cuoi;
    if (cungNhau) giua = ca4 ? " và tổng điểm vẫn đang bằng nhau." : q === 5 ? " và về nhất chung cuộc." : " và đang dẫn đầu tổng điểm.";
    else if (!trung.length) giua = " nhưng tổng điểm vẫn thua " + Ls + ".";
    else giua = ca4 ? ", còn tổng điểm thì cả bốn nhóm vẫn đang bằng nhau." : ", còn tổng điểm thì " + Ls + (q === 5 ? " về nhất." : " đang dẫn đầu.");
    if (q === 5) cuoi = ca4 ? "Chúc mừng cả bốn nhóm!" : !trung.length ? "Chúc mừng " + Ls + " về nhất!" : "Chúc mừng " + Ls + "!";
    else cuoi = (!trung.length || ca4) ? "Cố lên nào!" : "Các nhóm khác cố lên nào!";
    var dau = cau1 + giua;
    return { chu: dau + " " + cuoi, dau: dau, cuoi: cuoi, danChu: Ls };
  };
  RD.loiBinhMau = function (q, truoc, sau) { return RD.loiBinhPhan(q, truoc, sau).chu; };
  // 8/11 thầy Thịnh: "tôi bấm vào thì cả 4 nhóm lên đốt đuốc, claude bình luận về thứ hạng". Lời bình thứ hạng (bước Tổng kết,
  //   hiện khi cả bốn ngọn đuốc đã sáng), viết theo kiểu lời bình từng câu của thầy:
  //   "Chúc mừng Nhóm 1 về nhất! Nhóm 3 về nhì, Nhóm 2 về ba, Nhóm 4 về tư. Cả bốn ngọn đuốc đều đã sáng, cảm ơn các bạn đã
  //   chơi hết mình!" Bằng điểm thì cùng hạng: "Chúc mừng Nhóm 1 và 3 cùng về nhất! Nhóm 2 về ba, Nhóm 4 về tư. …";
  //   cả bốn nhóm bằng điểm: "Chúc mừng cả bốn nhóm cùng về nhất! …"
  var TEN_HANG = ["", "nhất", "nhì", "ba", "tư"];
  RD.loiBinhHang = function (sau) {
    var xh = RD.xepHang(sau), nh = xh.nhom;
    var veHang = function (g) { return dsTo(g) + (g.length > 1 ? " cùng" : "") + " về " + TEN_HANG[xh.hang[g[0]]]; };
    var dau = nh.length === 1 ? "Chúc mừng cả bốn nhóm cùng về nhất!" :
      "Chúc mừng " + veHang(nh[0]) + "! " + nh.slice(1).map(veHang).join(", ") + ".";
    var cuoi = "Cả bốn ngọn đuốc đều đã sáng, cảm ơn các bạn đã chơi hết mình!";
    return { chu: dau + " " + cuoi, dau: dau, cuoi: cuoi };
  };
})();
