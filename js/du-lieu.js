/* Rước đuốc: dữ liệu cố định và cách tính điểm */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};

  RD.CHU = ["A", "B", "C", "D"];
  RD.MAXID = 60;          // bộ mã thẻ có 60 số
  RD.SO_THE = 46;         // thẻ in sẵn: 1–45 và thẻ dự phòng 46

  // 4 tổ (thiết kế 3/11/2026): bạn cầm đuốc vẽ kiểu Ghibli, mặt tự vẽ, đồng phục theo ảnh của trường.
  // anh: 520 px cao; lua: tâm ngọn lửa trên ảnh; kieu: cách di chuyển (đi, lướt, tốc biến, nhảy), mọi kiểu mất cùng thời gian
  RD.TO = [
    { n: 1, ten: "Nhóm 1", mau: "#2f6fd6", nhat: "#dfe9fb", dam: "#1b4a97", anh: "anh/to-1.webp", mat: "anh/mat-1.webp", w: 280, h: 520, lua: [255, 42], kieu: "di", mo: "bạn nam áo vàng" },
    { n: 2, ten: "Nhóm 2", mau: "#2f9a58", nhat: "#ddf2e4", dam: "#1d6a3b", anh: "anh/to-2.webp", mat: "anh/mat-2.webp", w: 223, h: 520, lua: [183, 55], kieu: "bien", mo: "bạn nữ áo vàng, váy ca rô đồng phục, đứng thẳng" },
    { n: 3, ten: "Nhóm 3", mau: "#e9861c", nhat: "#fdead3", dam: "#a9590a", anh: "anh/to-3.webp", mat: "anh/mat-3.webp", w: 363, h: 520, lua: [340, 50], kieu: "di", mo: "bạn nam áo thể dục" },
    { n: 4, ten: "Nhóm 4", mau: "#8b52cc", nhat: "#eee2f9", dam: "#5b2f93", anh: "anh/to-4.webp", mat: "anh/mat-4.webp", w: 342, h: 520, lua: [320, 44], kieu: "bien", mo: "bạn nữ áo thể dục" }
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
        so: 1, mau: "#1f5fae", hinh: "anh/cau-1.webp", dung: "C",
        boiCanh: "Các bạn học sinh dự định mua ruy băng để dán xung quanh viền một khung ảnh hình vuông có cạnh **2 mét**. Biết giá 1 mét ruy băng là **5 000 đồng**.",
        hoi: "Hỏi các bạn học sinh cần bao nhiêu tiền để mua ruy băng?",
        chon: ["20 000 đồng", "10 000 đồng", "40 000 đồng", "30 000 đồng"]
      },
      {
        so: 2, mau: "#c4860a", hinh: "anh/cau-2.webp", dung: "A",
        boiCanh: "Một sân khấu hình chữ nhật có chiều dài **12 mét**, chiều rộng bằng **{2/3}** chiều dài. Người ta mắc dây đèn xung quanh sân khấu.",
        hoi: "Hỏi dây đèn dài bao nhiêu mét?",
        chon: ["40 mét", "20 mét", "96 mét", "32 mét"]
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "anh/cau-3.webp", dung: "D",
        boiCanh: "Người ta sơn kín một ô đậu xe hình bình hành có cạnh **3 mét**, chiều cao tương ứng là **5 mét**. Biết cứ 1 lít sơn thì sơn được **3 mét vuông**.",
        hoi: "Hỏi cần bao nhiêu lít sơn?",
        chon: ["45 lít", "15 lít", "2,5 lít", "5 lít"]
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "anh/cau-4.webp", dung: "B",
        boiCanh: "Một bồn hoa hình thoi có độ dài hai đường chéo là **12 mét** và **9 mét**.",
        hoi: "Hỏi nếu mỗi mét vuông trồng 5 cây hoa thì cần bao nhiêu cây hoa để trồng hết bồn hoa đó?",
        chon: ["540 cây", "270 cây", "54 cây", "105 cây"]
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "anh/cau-5.webp", dung: "C",
        boiCanh: "Một mảnh đất hình thang có đáy lớn **10 mét**, đáy nhỏ **6 mét**, chiều cao **3 mét**. Người ta chia đều mảnh đất đó cho **4 người thợ** để trồng cỏ.",
        hoi: "Hỏi mỗi người thợ phải trồng bao nhiêu mét vuông cỏ?",
        chon: ["12 mét vuông", "24 mét vuông", "6 mét vuông", "8 mét vuông"]
      }
    ],
    "co-ban": [
      {
        so: 1, mau: "#1f5fae", hinh: "anh/cau-1.webp", dung: "B",
        boiCanh: "Các bạn học sinh mua dây ruy băng để dán vừa đủ một vòng quanh viền một khung ảnh hình vuông có cạnh **2 mét**.",
        hoi: "Hỏi các bạn học sinh cần mua bao nhiêu mét dây ruy băng?",
        chon: ["4 mét", "8 mét", "6 mét", "2 mét"]
      },
      {
        so: 2, mau: "#c4860a", hinh: "anh/cau-2.webp", dung: "D",
        boiCanh: "Một sân khấu hình chữ nhật có chiều dài **12 mét**, chiều rộng **8 mét**. Người ta mắc dây đèn vừa đủ một vòng quanh mép sân khấu.",
        hoi: "Hỏi dây đèn dài bao nhiêu mét?",
        chon: ["20 mét", "96 mét", "32 mét", "40 mét"],
        // đề cho sẵn chiều rộng nên hình ghi thêm "8 mét" sát cạnh phải sân khấu (a "p": x là mép phải của chữ)
        themSo: [{ t: "8 mét", x: 816, y: 384, f: 56, nen: 1, a: "p" }]
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "anh/cau-3.webp", dung: "A",
        boiCanh: "Người ta sơn kín một ô đậu xe hình bình hành có độ dài một cạnh là **3 mét**, chiều cao tương ứng là **5 mét**.",
        hoi: "Hỏi diện tích phần cần sơn là bao nhiêu mét vuông?",
        chon: ["15 mét vuông", "8 mét vuông", "16 mét vuông", "7,5 mét vuông"]
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "anh/cau-4.webp", dung: "C",
        boiCanh: "Một bồn hoa hình thoi có độ dài hai đường chéo là **12 mét** và **9 mét**.",
        hoi: "Hỏi diện tích bồn hoa đó là bao nhiêu mét vuông?",
        chon: ["108 mét vuông", "21 mét vuông", "54 mét vuông", "42 mét vuông"]
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "anh/cau-5.webp", dung: "B",
        boiCanh: "Người ta trồng cỏ kín một mảnh đất hình thang có độ dài hai đáy là **10 mét** và **6 mét**, chiều cao **3 mét**.",
        hoi: "Hỏi diện tích phần trồng cỏ là bao nhiêu mét vuông?",
        chon: ["48 mét vuông", "24 mét vuông", "8 mét vuông", "30 mét vuông"]
      }
    ],
    // Đề demo (9/11 06:20 UTC thầy Thịnh: "tạo thêm 1 đề gọi là đề demo, đề này giống đề 1 nhưng câu hỏi, hình ảnh khác đề 1 là
    //   đề thi chính thức"; 06:49 "ok"): để cả lớp chơi thử trước, không lộ đề chính thức. Cùng kiểu Đề cơ bản (1 bước tính, cùng
    //   thứ tự hình), bối cảnh, số đo, đáp án khác; mỗi đáp án sai là một lỗi hay gặp. Hình tĩnh vẽ kiểu Ghibli (Canva AI),
    //   khung riêng của từng câu (khung: W×H; anh: ảnh tĩnh đặt ở x, y cỡ w×h; nhan: lớp nét vẽ; so: số đo bằng chữ thật).
    "demo": [
      {
        so: 1, mau: "#1f5fae", hinh: "anh/de-demo/cau-1.webp", dung: "D",
        boiCanh: "Người ta kẻ vạch sơn vừa đủ một vòng quanh mép một ô sân chơi hình vuông có cạnh **5 mét**.",
        hoi: "Hỏi vạch sơn dài bao nhiêu mét?",
        chon: ["25 mét", "10 mét", "15 mét", "20 mét"],
        khung: { W: 970, H: 970, anh: "anh/de-demo/cau-1.webp", x: -120, y: -80, w: 1200, h: 1200,
          so: [{ t: "5 mét", x: 485, y: 905, f: 77, nen: 1 }] }
      },
      {
        so: 2, mau: "#c4860a", hinh: "anh/de-demo/cau-2.webp", dung: "A",
        boiCanh: "Vườn rau của lớp hình chữ nhật có chiều dài **9 mét**, chiều rộng **4 mét**. Các bạn làm hàng rào tre vừa đủ một vòng quanh vườn.",
        hoi: "Hỏi hàng rào tre dài bao nhiêu mét?",
        chon: ["26 mét", "13 mét", "36 mét", "22 mét"],
        khung: { W: 1060, H: 610, anh: "anh/de-demo/cau-2.webp", x: -80, y: -30, w: 1200, h: 674,
          so: [{ t: "9 mét", x: 530, y: 64, f: 56, nen: 1 }, { t: "4 mét", x: 940, y: 288, f: 56, nen: 1, a: "p" }] }
      },
      {
        so: 3, mau: "#2b7a4b", hinh: "anh/de-demo/cau-3.webp", dung: "C",
        boiCanh: "Một hồ cá cảnh hình bình hành có độ dài một cạnh là **8 mét**, chiều cao tương ứng là **3 mét**.",
        hoi: "Hỏi diện tích mặt hồ là bao nhiêu mét vuông?",
        chon: ["11 mét vuông", "22 mét vuông", "24 mét vuông", "12 mét vuông"],
        khung: { W: 1200, H: 800, anh: "anh/de-demo/cau-3.webp", x: 0, y: -70, w: 1200, h: 897, nhan: "anh/de-demo/nhan-cau-3.webp",
          so: [{ t: "3 mét", x: 282, y: 366, f: 64, nen: 1, a: "t" }, { t: "8 mét", x: 506, y: 732, f: 64, nen: 1 }] }
      },
      {
        so: 4, mau: "#bd3a2c", hinh: "anh/de-demo/cau-4.webp", dung: "B",
        boiCanh: "Một tấm bạt che nắng hình thoi có độ dài hai đường chéo là **10 mét** và **6 mét**.",
        hoi: "Hỏi diện tích tấm bạt là bao nhiêu mét vuông?",
        chon: ["60 mét vuông", "30 mét vuông", "16 mét vuông", "32 mét vuông"],
        khung: { W: 1200, H: 820, anh: "anh/de-demo/cau-4.webp", x: 0, y: -40, w: 1200, h: 897, nhan: "anh/de-demo/nhan-cau-4.webp",
          so: [{ t: "10 mét", x: 330, y: 390, f: 64, nen: 1 }, { t: "6 mét", x: 624, y: 210, f: 64, nen: 1, a: "t" }] }
      },
      {
        so: 5, mau: "#7a3fb4", hinh: "anh/de-demo/cau-5.webp", dung: "A",
        boiCanh: "Các bạn trồng hoa hướng dương kín một mảnh vườn hình thang có độ dài hai đáy là **9 mét** và **5 mét**, chiều cao **4 mét**.",
        hoi: "Hỏi diện tích phần trồng hoa là bao nhiêu mét vuông?",
        chon: ["28 mét vuông", "56 mét vuông", "7 mét vuông", "36 mét vuông"],
        khung: { W: 1200, H: 854, anh: "anh/de-demo/cau-5.webp", x: 0, y: 90, w: 1200, h: 674, nhan: "anh/de-demo/nhan-cau-5.webp",
          so: [{ t: "5 mét", x: 591, y: 45, f: 66 }, { t: "9 mét", x: 602, y: 809, f: 66 }, { t: "4 mét", x: 319, y: 412, f: 66, nen: 1, a: "t" }] }
      }
    ]
  };
  RD.THU_TU_DE = ["co-ban", "nang-cao", "demo"];
  RD.TEN_DE = { "co-ban": "Đề cơ bản", "nang-cao": "Đề nâng cao", "demo": "Đề demo" };
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
  RD.nhanCau = function (q) { return q === 5 ? "Câu 5/5: nhân đôi số điểm" : "Câu " + q + "/5"; };

  // các bước của buổi chơi, theo đúng thứ tự bấm "tiếp"
  RD.BUOC = ["setup", "intro"];
  // mỗi câu: q đọc đề và quét thẻ · k quét xong (số em chọn mỗi đáp án) · a đáp án (số bạn đúng mỗi tổ) · r di chuyển qua cầu
  for (var q = 1; q <= 5; q++) RD.BUOC.push("q" + q, "k" + q, "a" + q, "r" + q);
  // finish: 4 bạn tới cuối cầu, tổ nhất thắp đuốc · rank: 3 tổ còn lại thắp đuốc, đủ 4 ngọn đuốc thì hiện nút "Tiếp theo" ·
  // tuong: 4 tia lửa bay lên số 51, lửa đốt tan màn đêm, báo tường chỉ hiện hình và số 51 · bao: hiện toàn bộ báo tường, vỗ tay
  // (8/11 thầy Thịnh: "sau khi cả 4 bạn đốt đuốc, hiện thêm nút tiếp theo, tôi bấm vô thì mới hiện báo tường")
  RD.BUOC.push("finish", "rank", "tuong", "bao");
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
  RD.cfgMacDinh = function (ses) {
    return { ses: ses, siSo: 45, ds: RD.chiaTo(45), vang: [], at: 0 };
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
    var nhieuNhat = vang.every(function (t) { return sau[t].cau[q].dung === maxDung; });
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
