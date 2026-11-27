/* Xếp thiệp, tên hoạt động "Tấm thiệp của nhóm em" (bản 14/11/2026, sửa theo lời thầy 14/11 lúc 13:21, 13:23, 14:03, 16:06, 16:16, 16:18, 16:32 và 15/11 lúc 10:08): mỗi nhóm dùng điện thoại hoặc máy tính bảng, tivi theo dõi 4 nhóm cùng lúc.
   Bước 1 (điện thoại): đo, tính rồi nhập số đo và diện tích của 7 loại mảnh (2 mảnh giống nhau chỉ nhập một lần),
            tổng diện tích 10 mảnh, tấm thiệp, phần còn lại. Đúng phần còn lại thì bàn xếp mở.
   Bước 2: 10 mảnh nằm sẵn trên bàn có lưới, mỗi mảnh ở gần chỗ của nó trong hình mẫu của nhóm, tách ra 4 phía (MAU_DAU), nằm thẳng chưa xoay:
            các em tự xoay, lật rồi kéo vô. Không có nam châm, không tự đẩy: thả mảnh đè lên mảnh khác thì vẫn để yên.
   Bước 3: bấm Hoàn thành. Còn mảnh đè lên nhau thì hiện bảng báo mảnh số mấy cần chỉnh. Mảnh còn nằm rời thì báo "chưa nhận ra hình".
            Hình ổn thì hiện bảng xác nhận; nhóm đồng ý thì máy chỉnh nhẹ rồi đưa hình vào giữa chỗ dán của thiệp 29 × 42.
   Tivi: mở trang không có tham số. Chỉ có một màn là tấm báo tường A0, hiện từ đầu tới cuối; 4 mã QR nằm trên 4 tấm thiệp, ở 4 góc ngoài cho xa nhau; bài của mỗi nhóm hiện ngay trên tấm thiệp của nhóm đó, đúng ô dán trên báo tường.
         Ảnh báo tường có hình thầy cô nên KHÔNG nằm trên mạng: trang chỉ lấy ảnh thầy chọn từ máy (lưu trong trình duyệt của máy đó).
   Điện thoại: quét mã QR của nhóm mình trên tivi (?p=<mã phòng>&n=<nhóm>).
   Nối các máy: Firebase Realtime Database, nhánh ruoc-duoc/xep-thiep/<mã phòng>. KHÔNG đụng nhánh ruoc-duoc/lop-6-3 của trò Rước đuốc.
   ?thu=1: chỉ nối các thẻ mở trên cùng một máy (chạy thử, không gọi Firebase).
   Tivi không hiện số đo hay diện tích nào, trừ khi thầy bấm Đáp số. */
(function () {
  "use strict";

  var U = 10;                                   // 1 cm = 10 đơn vị vẽ
  var R2 = Math.SQRT2;
  var FB = {
    databaseURL: "https://my-project-1473334284611-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "my-project-1473334284611"
  };
  var NHANH = "ruoc-duoc/xep-thiep";
  var BUOC_XOAY = 15;                           // độ, mỗi lần bấm xoay
  var O_LUOI = 0.5;                             // mảnh đặt thẳng: đỉnh nằm trên mắt lưới nửa ô (ô lưới 1 cm)
  var CHONG = 0.05;                             // lún vào nhau quá 0,05 cm thì coi là chồng
  var NHE = { goc: 8, xa: 0.35, dinh: 0.35, truot: 0.3, de: 1 };   // ngưỡng chỉnh nhẹ lúc Hoàn thành: lệch góc (độ), cách cạnh, cách đỉnh, trượt dọc cạnh (cm), đều nhỏ hơn nửa ô lưới: mảnh đã đặt đúng vạch lưới thì không bị dời. de: hai mảnh lún vào nhau không quá ngần này thì máy tự tách ra lúc Hoàn thành, sâu hơn thì báo các em chỉnh
  var XA_NHAT = 0.9;                            // chỉnh nhẹ không dời một mảnh quá 0,9 cm so với chỗ các em đặt
  var XA_TACH = 1.5;                            // tách các mảnh đè nhẹ: không dời một mảnh quá ngần này (cm)
  var HO_DAU = 1;                               // (chỉ để ghi nhớ, bảng MAU_DAU đã tính theo số này) lúc mới mở bàn xếp, các mảnh nằm sẵn cách nhau ít nhất 1 cm (lớn hơn NHE.xa): chưa xếp thì máy không coi là hình
  var CHAM = 0.06, LE_XA = 3, IT_NHAT_CHAM = 7; // nhận ra hình: mảnh "chạm" khi cách mảnh khác ≤ 0,06 cm; cần ≥ 7 mảnh chạm và không mảnh nào cách xa quá 3 cm

  /* ---------- bộ mảnh 198 cm² (thầy chốt 13/11): 10 mảnh, số đo cm ---------- */
  var BO = [
    { loai: "thoi", a: 12, b: 6 }, { loai: "thoi", a: 6, b: 3 }, { loai: "thoi", a: 6, b: 3 },
    { loai: "thang", L: 12, l: 6, h: 4 }, { loai: "thang", L: 6, l: 4, h: 2 },
    { loai: "cn", w: 10, h: 3 }, { loai: "cn", w: 4, h: 4 }, { loai: "cn", w: 4, h: 4 },
    { loai: "bh", b: 6, h: 3, s: 2 }, { loai: "bh", b: 6, h: 3, s: 2 }
  ];
  /* ---------- nhóm nào xếp hình mẫu nào (19/11) ----------
     19/11 14:47, thầy: "đổi lại cho tôi vị trí nhóm 2 và 4 thành 1 và 2; nhóm 1 và 3 thành 3 và 4."
     4 tấm thiệp (khổ, hình mẫu) vẫn nằm yên ở 4 ô dán trên báo tường; chỉ đổi số nhóm của từng ô:
       cột phải: Nhóm 1 ở trên (thiệp đứng, bánh sinh nhật; trước là nhóm 2), Nhóm 2 ở dưới (thiệp ngang, trống trường và ngọn đuốc; trước là nhóm 4);
       cột trái: Nhóm 3 ở trên (thiệp đứng, bó hoa tặng cô; trước là nhóm 1), Nhóm 4 ở dưới (thiệp ngang, hải đăng và con thuyền; trước là nhóm 3).
     HINH[k] = số hình mẫu của nhóm k. Số hình mẫu giữ như trước 19/11: 1 bó hoa, 2 bánh sinh nhật, 3 hải đăng và con thuyền, 4 trống trường và ngọn đuốc.
     Các bảng MAU, MAU_DAU, GOC_MAU, HINH_CON dưới đây vẫn VIẾT theo số hình mẫu (lời dặn cũ của thầy "nhóm 1 …" trong ghi chú là hình mẫu 1),
     theoNhom() đổi chúng sang số nhóm ngay lúc tải. js/tranh-3d.js (TEN, MAU_HINH, HX, khop) dùng số hình mẫu: gọi bằng HINH[k].
     Bản trước 19/11 (nhóm k xếp hình mẫu k): ban-cu/site-19-11-14h47. */
  var HINH = { 1: 2, 2: 4, 3: 1, 4: 3 };
  function theoNhom(t) { var m = {}; Object.keys(HINH).forEach(function (k) { if (t[HINH[k]] !== undefined) m[k] = t[HINH[k]]; }); return m; }

  /* màu trơn máy in pha được (bản in 13/11, sau 17:29: có lại nâu, đỏ sẫm, xám), theo thiệp của từng nhóm */
  var PAL = { "do": "#ef4d44", do_sam: "#b33638", hong: "#f493af", hong_nhat: "#faccd6", cam: "#f9a03b", cam_dat: "#f47e36", nau: "#8b5b36", xam: "#aab2bb", vang: "#ffd035", vang_nhat: "#ffec90", kem: "#ffe5bb", la: "#68bd51", duong: "#499fd8" };
  var MAU = theoNhom({
    1: ["do", "hong", "hong", "hong_nhat", "hong_nhat", "do", "vang_nhat", "vang_nhat", "la", "la"],
    2: ["cam", "cam", "cam", "duong", "duong", "hong_nhat", "kem", "kem", "vang", "vang"],
    3: ["kem", "do", "vang", "nau", "do_sam", "xam", "vang_nhat", "do", "duong", "duong"],
    4: ["do", "do_sam", "do_sam", "nau", "vang", "vang_nhat", "do", "do", "cam", "cam"]
  });
  Object.keys(MAU).forEach(function (k) { MAU[k] = MAU[k].map(function (t) { return PAL[t]; }); });
  var MAU_XAM = "#e6e1d8";
  /* bố cục thiệp đã cắt 29 × 42 cm, cm thật: khung = khung tiêu đề, dan = chỗ dán hình, ngan = vạch ngăn chuỗi hạt, viet = chỗ ghi lời chúc.
     Thầy dặn 15/11 22:33 (luồng thiệp): "cái bốn cái tấm thiệp ấy sẽ không còn cái phần mà ghi lời chúc nữa, bỏ luôn nhé. Và điều chỉnh các cái tấm hình
     cho nó ra giữa hết đi. Rồi sau đó kêu các luồng khác cũng chỉnh lại vậy." Bản in mới (bo-cuc-thiep-a3.json, 15/11 15:54 UTC): không còn chuỗi hạt,
     nhãn "Nhóm …" và dòng chấm (ngan = viet = null); chỗ dán hình rộng gần hết tấm thiệp; thiệp ngang có khung tiêu đề ra giữa; hình mẫu dời ra giữa
     (xem Tranh3D.DOI_HINH). Bản in 13/11 (còn chỗ lời chúc): dung dan [1.5, 5.0, 27.5, 31.0], ngan ["ngang", 31.8], viet [1.7, 33.4, 27.3, 41.4];
     ngang khung [2.6, 1.1, 30.6, 4.5], dan [1.5, 4.6, 32.0, 27.6], ngan ["doc", 32.6], viet [33.4, 2.5, 41.4, 28.1]. veTrangTri vẫn vẽ được cả hai kiểu. */
  var THIEP = {
    dung: { W: 29, H: 42, khung: [0.8, 1.0, 28.2, 4.4], dan: [1.5, 5.4, 27.5, 41.0], ngan: null, viet: null },
    ngang: { W: 42, H: 29, khung: [7.0, 1.1, 35.0, 4.5], dan: [1.5, 5.5, 40.5, 28.0], ngan: null, viet: null }
  };
  /* Thầy dặn 15/11 18:31: "các cái phần mà xếp hình đó, bạn chỉnh lại cho nó giống y chang như cái tờ A3 luôn, để học sinh nó xoay các cái hình
     trên tờ A3 luôn, chứ đừng có để trong cái bìa màu vàng đậm". Từ đó bàn xếp CHÍNH LÀ tấm thiệp A3: BOCUC.ban = cả tấm thiệp, mảnh đúng cỡ thật
     so với thiệp (TL_MANH = 1). Bản 17:23 cùng ngày thu mảnh còn 0,65 và xếp trong một tấm lưới 32 × 35 ô màu vàng: thầy bảo bỏ.
     BOCUC.dan = chỗ dán hình trên thiệp (hình xếp xong nằm ở đây). Lưới ô 1 cm: xem luoiGoc. */
  var TL_MANH = 1;
  var BOCUC = {};
  Object.keys(THIEP).forEach(function (h) { var t = THIEP[h]; BOCUC[h] = { W: t.W, H: t.H, dan: t.dan.slice(), ban: [0, 0, t.W, t.H] }; });
  var NHOM = { 1: "dung", 2: "ngang", 3: "dung", 4: "ngang" };      // khổ thiệp của từng nhóm (19/11: nhóm 1, 3 thiệp đứng; nhóm 2, 4 thiệp ngang; xem HINH)
  var DONG1 = "CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG";
  var DONG2 = "TRƯỜNG THCS PHAN TÂY HỒ (14/12/1976 – 14/12/2026)";

  /* ---------- các mục phải nhập ở bước 1 ---------- */
  function dienTich(m) { return m.loai === "thoi" ? m.a * m.b / 2 : m.loai === "thang" ? (m.L + m.l) * m.h / 2 : m.loai === "cn" ? m.w * m.h : m.b * m.h; }
  var KHOA_MANH = ["t1", "t2", "g1", "g2", "cn", "v", "bh"];
  var THU_TU = KHOA_MANH.concat(["tong", "thiep", "con"]);
  var MUC = {
    t1: { so: [1], ten: "Hình thoi (mảnh to)", hinh: "hình thoi", ngan: "hình thoi to" },
    t2: { so: [2, 3], ten: "Hình thoi (mảnh nhỏ)", hinh: "hình thoi", ngan: "hình thoi nhỏ" },
    g1: { so: [4], ten: "Hình thang cân (mảnh to)", hinh: "hình thang cân", ngan: "hình thang cân to" },
    g2: { so: [5], ten: "Hình thang cân (mảnh nhỏ)", hinh: "hình thang cân", ngan: "hình thang cân nhỏ" },
    cn: { so: [6], ten: "Hình chữ nhật", hinh: "hình chữ nhật", ngan: "hình chữ nhật" },
    v: { so: [7, 8], ten: "Hình vuông", hinh: "hình vuông", ngan: "hình vuông" },
    bh: { so: [9, 10], ten: "Hình bình hành", hinh: "hình bình hành", ngan: "hình bình hành" },
    tong: { ten: "Tổng diện tích 10 mảnh", ngan: "tổng diện tích" },
    thiep: { ten: "Diện tích tấm thiệp", ngan: "tấm thiệp" },      // thầy dặn 15/11 19:15
    con: { ten: "Diện tích phần còn lại", ngan: "phần còn lại" }
  };
  /* Thầy dặn 15/11 19:02: "mục nào các em nhập sai 3 lần thì hiện lên là báo GVCN để mở khóa."
     Mỗi mục đếm số lần sai trong n<k>/s/<mục> (đã có từ trước, dùng cho ngôi sao). Cứ đủ 3 lần sai thì ghi n<k>/khoa/<mục> = 1:
     mọi máy của nhóm đều không nhập được mục đó nữa. Thầy bấm "Mở khóa" trên tivi (xóa n<k>/khoa) thì nhóm được nhập tiếp 3 lần. */
  var SAI_KHOA = 3, CHU_KHOA = "Báo GVCN để mở khóa";
  /* Bảng Nhiệm vụ chiếu trên tivi (thầy dặn 15/11 21:28, luồng "Ý tưởng"): "sẽ hiện ra cái hướng dẫn trên màn hình … mỗi nhóm sẽ có các nhiệm vụ như sau,
     và đổi cái chữ bước thành chữ nhiệm vụ nhé … nó sẽ có cái mục ẩn hiện ở trong cái app của tôi … Bước 4 là dán tấm thiệp lên báo tường của lớp …
     một bạn giải thích ý nghĩa đó và đọc lời chúc". Chữ dưới đây do luồng "Ý tưởng" soạn, thầy đã đọc (21:32) và không sửa. Đổi chữ thì chỉ sửa ở đây.
     21:32 thầy dặn thêm: "Đổi toàn bộ thành nhiệm vụ nhé." → mọi chữ "Bước" trên điện thoại, tivi, máy giáo viên đều thành "Nhiệm vụ". */
  var NHIEM_VU = {                                // lời thầy chốt 15/11 22:07, nhiệm vụ 3 và 4 sửa 22:34 (luồng "Ý tưởng"). Sửa lời: chỉ sửa ở đây, bảng tự xếp lại
    ten: "TẤM THIỆP CỦA NHÓM EM",
    phu: "Thời gian hoàn thành: 15 phút",
    cot: [[0, 1], [2, 3]],                        // hai cột trên tivi: nhiệm vụ 1, 2 bên trái; 3, 4 bên phải
    viec: [
      { ten: "Đo đạc và tính toán", dong: [
        "Bốn nhóm dùng điện thoại quét mã QR và chọn đúng nhóm.",
        "Đo đạc, tính diện tích từng mảnh ghép và diện tích phần còn lại của tấm thiệp, rồi nhập vào điện thoại.",
        "AI sẽ chấm ngay từng mục. Mục nào nhập sai 3 lần thì AI sẽ khóa mục đó lại, nhóm phải báo thầy để thầy hướng dẫn nhóm làm và mở khóa cho nhóm.",
        "Nhóm nào đã tính xong diện tích phần còn lại thì báo thầy để thầy xác nhận, rồi chuyển sang nhiệm vụ 2."] },
      { ten: "Báo tường online", dong: [        // 27/11 08:37 thầy đổi tên (trước là "Xếp hình") và thêm "góp phần hoàn thiện tờ báo tường online"
        "Các nhóm thảo luận, dùng điện thoại để xếp 10 mảnh ghép thành một hình có ý nghĩa, góp phần hoàn thiện tờ báo tường online."] },
      { ten: "Dán hình lên thiệp và nêu ý nghĩa tấm thiệp", dong: [        // 15/11 22:34 thầy đổi: bỏ dòng viết lời chúc (tấm thiệp không còn phần ghi lời chúc)
        "Các nhóm dán 10 mảnh lên thiệp theo hình đã xếp trên điện thoại. Lưu ý các mảnh không chồng lên nhau.",
        "Thảo luận để chuẩn bị trình bày phần ý nghĩa tấm thiệp."] },
      { ten: "Báo tường của lớp em", dong: [        // 27/11 08:37 thầy đổi tên (trước là "Dán thiệp lên báo tường") và thêm "của lớp"
        "Bốn nhóm đem tấm thiệp đã hoàn chỉnh lên dán vào báo tường của lớp.",
        "Một bạn giải thích ý nghĩa bức tranh của nhóm."] }
    ]
  };
  var DEM_NGUOC_PHUT = 15;                        // số phút của đồng hồ đếm ngược (thầy chốt 15/11 22:12). Muốn đổi: sửa một số này
  /* 18/11 01:46, thầy: "khi tôi bấm tính giờ thì trống sẽ đánh xong mới tính giờ". Bấm Bắt đầu thì máy giáo viên ghi lúc hết giờ muộn thêm DN_TRUOC mili giây:
     trong DN_TRUOC mili giây đầu đồng hồ đứng ở 15:00 (dnTinh trả truoc > 0), trống trên tivi đánh (tiếng cuối ở 2,3 giây, ngân chừng 1 giây), rồi mới đếm.
     Chạy tiếp sau khi tạm dừng thì không chờ (không có trống). */
  var DN_TRUOC = 3600;
  function dnTinh(v, gio) {                       // đọc <phòng>/dn. Trả về null (tắt) hoặc { tt: "chay" | "dung" | "het", con: mili giây còn lại, tong: tổng mili giây, qua: mili giây đã qua kể từ lúc hết giờ, truoc: mili giây còn lại trước khi bắt đầu đếm }
    var tong, con;
    if (!v || typeof v !== "object") return null;
    tong = +v.d > 0 ? +v.d : DEM_NGUOC_PHUT * 60000;
    if (typeof v.c === "number") return { tt: v.c > 0 ? "dung" : "het", con: Math.max(0, Math.min(tong, v.c)), tong: tong, qua: v.c > 0 ? 0 : 1e9, truoc: 0 };
    if (typeof v.h !== "number") return null;
    con = v.h - gio;
    return con > 0 ? { tt: "chay", con: Math.min(tong, con), tong: tong, qua: 0, truoc: Math.max(0, con - tong) } : { tt: "het", con: 0, tong: tong, qua: -con, truoc: 0 };
  }
  function dnChu(ms) {                            // 899400 → "15:00", 59000 → "00:59", 0 → "00:00"
    var g = Math.max(0, Math.ceil(ms / 1000 - 1e-6)), ph = Math.floor(g / 60);
    g -= ph * 60;
    return (ph < 10 ? "0" : "") + ph + ":" + (g < 10 ? "0" : "") + g;
  }
  function dnLenh(T, v, viec) {                   // viec: "chay" (bắt đầu, hoặc chạy tiếp nếu đang tạm dừng), "dung" (tạm dừng), "tat"
    var gio, tt, tong = DEM_NGUOC_PHUT * 60000;
    if (!T) return;
    gio = T.gio(); tt = dnTinh(v, gio);
    if (viec === "tat") { T.set("dn", null); return; }
    if (viec === "chay") {
      if (tt && tt.tt === "dung") T.set("dn", { h: Math.round(gio + tt.con), d: tt.tong });
      else if (!tt || tt.tt === "het") T.set("dn", { h: Math.round(gio + DN_TRUOC + tong), d: tong });      // bắt đầu mới: trống đánh xong (DN_TRUOC) mới đếm
      return;
    }
    if (viec === "dung" && tt && tt.tt === "chay") T.set("dn", { c: Math.round(tt.con), d: tt.tong });
  }
  function bamHaiLan(b, chuHoi, lam) {             // nút nguy hiểm trên máy giáo viên: bấm hai lần trong 3 giây mới làm
    var goc2 = b.textContent, luc = 0;
    b.onclick = function () {
      if (Date.now() - luc > 3000) { luc = Date.now(); b.textContent = chuHoi; b.classList.add("hoi"); setTimeout(function () { b.textContent = goc2; b.classList.remove("hoi"); }, 3000); return; }
      luc = 0; b.textContent = goc2; b.classList.remove("hoi"); lam();
    };
  }
  var TONG = 0, TONG_MOT = 0, THIEP_D = 42, THIEP_R = 29, THIEP_S = THIEP_D * THIEP_R;
  BO.forEach(function (m) { TONG += dienTich(m); });
  KHOA_MANH.forEach(function (kh) {
    var M = MUC[kh], m = BO[M.so[0] - 1];
    M.manh = m; M.dt = dienTich(m); TONG_MOT += M.dt;
    /* thầy dặn 14/11 16:06: "đường chéo thứ nhất (dọc), thứ hai thì ghi ngang". Hình minh họa vẽ hình thoi nằm: đường chéo dọc là m.b, đường chéo ngang là m.a.
       tuDo: các em nhập ngược hai đường chéo máy vẫn nhận (mảnh giấy cầm chiều nào cũng được), lúc đúng thì hiện lại theo hình vẽ */
    if (m.loai === "thoi") { M.o = [{ nhan: "Đường chéo thứ nhất (dọc)", dung: m.b }, { nhan: "Đường chéo thứ hai (ngang)", dung: m.a }]; M.tuDo = true; }
    else if (m.loai === "thang") M.o = [{ nhan: "Đáy lớn", dung: m.L }, { nhan: "Đáy bé", dung: m.l }, { nhan: "Chiều cao", dung: m.h }];
    else if (m.loai === "cn" && m.w !== m.h) M.o = [{ nhan: "Chiều dài", dung: m.w }, { nhan: "Chiều rộng", dung: m.h }];
    else if (m.loai === "cn") M.o = [{ nhan: "Cạnh", dung: m.w }];
    else M.o = [{ nhan: "Cạnh đáy", dung: m.b }, { nhan: "Chiều cao", dung: m.h }];
    M.o.push({ nhan: "Diện tích " + M.hinh, dung: M.dt, dv: "cm²" });   // thầy dặn 14/11 16:06: "diện tích 1 mảnh ghi là diện tích hình thoi, các diện tích khác cũng ghi vậy"
  });
  var CON = THIEP_S - TONG;
  MUC.tong.o = [{ nhan: "Tổng diện tích", dung: TONG, dv: "cm²" }];
  MUC.thiep.o = [{ nhan: "Chiều dài", dung: THIEP_D }, { nhan: "Chiều rộng", dung: THIEP_R }, { nhan: "Diện tích tấm thiệp", dung: THIEP_S, dv: "cm²" }];
  MUC.con.o = [{ nhan: "Diện tích phần còn lại", dung: CON, dv: "cm²" }];

  /* Kiểm một mục. v = mảng số đã nhập theo thứ tự ô. Trả về { dung: [từng ô], het, goi: câu gợi ý (không lộ đáp số) } */
  function kiemMuc(kh, v) {
    var M = MUC[kh], o = M.o, n = o.length, dung = [], i, goi = "", m = M.manh, S = v[n - 1];
    for (i = 0; i < n; i++) dung[i] = v[i] === o[i].dung;
    if (M.tuDo && v[0] === o[1].dung && v[1] === o[0].dung) dung[0] = dung[1] = true;
    var doDung = dung.slice(0, n - 1).every(Boolean), het = doDung && dung[n - 1];
    if (het) return { dung: dung, het: true, goi: "" };
    var DO_LAI = "Ô màu đỏ chưa đúng. Em đo lại nhé.", TINH_LAI = "Diện tích chưa đúng. Em tính lại nhé.", canh;
    if (kh === "tong") goi = S === TONG_MOT ? "Bộ có 10 mảnh. Có loại có 2 mảnh, em đã cộng đủ chưa?" : "Chưa đúng. Em cộng lại diện tích cả 10 mảnh nhé.";
    else if (kh === "con") goi = S === THIEP_S + TONG ? "Phần còn lại thì phải bớt đi, không cộng thêm." : "Chưa đúng. Em tính lại nhé.";
    else if (kh === "thiep") {
      if (v[0] === THIEP_R && v[1] === THIEP_D) goi = "Chiều dài là cạnh dài hơn. Em đổi chỗ hai số nhé.";
      else if (!doDung) goi = "Ô màu đỏ chưa đúng. Em đo lại tấm thiệp nhé.";
      else goi = S === 2 * (THIEP_D + THIEP_R) ? "Đó là chu vi. Em tính diện tích nhé." : TINH_LAI;
    } else if (!doDung) {
      goi = DO_LAI;
      if (m.loai === "thang") {
        canh = Math.round(Math.hypot((m.L - m.l) / 2, m.h));
        if (v[0] === m.l && v[1] === m.L) goi = "Đáy lớn là đáy dài hơn. Em đổi chỗ hai số nhé.";
        else if (dung[0] && dung[1]) goi = v[2] === canh && canh !== m.h ? "Đó là cạnh bên. Chiều cao là đoạn vuông góc với hai đáy." : "Chiều cao là đoạn vuông góc với hai đáy. Em dùng ê ke đo lại nhé.";
      } else if (m.loai === "bh") {
        canh = Math.round(Math.hypot(m.s, m.h));
        if (dung[0]) goi = "Chiều cao là đoạn vuông góc với cạnh đáy, không phải cạnh bên.";
        else if (v[0] === canh) goi = "Em lấy cạnh dài hơn làm đáy nhé.";
      } else if (m.loai === "cn" && m.w !== m.h && v[0] === m.h && v[1] === m.w) goi = "Chiều dài là cạnh dài hơn. Em đổi chỗ hai số nhé.";
    } else {
      goi = TINH_LAI;
      if (m.loai === "thoi" && S === m.a * m.b) goi = "Em xem lại công thức: đã chia 2 chưa?";
      else if (m.loai === "thang" && S === (m.L + m.l) * m.h) goi = "Em xem lại công thức: đã chia 2 chưa?";
      else if (m.loai === "thang" && (S === m.L * m.h || S === m.l * m.h)) goi = "Em đã cộng hai đáy chưa?";
      else if (m.loai === "bh" && S === m.b * m.h / 2) goi = "Hình bình hành không chia 2. Em xem lại công thức nhé.";
      else if (m.loai === "cn" && m.w !== m.h && S === 2 * (m.w + m.h)) goi = "Đó là chu vi. Em tính diện tích nhé.";
      else if (m.loai === "cn" && m.w !== m.h && S === m.w + m.h) goi = "Diện tích không phải là tổng hai cạnh.";
      else if (m.loai === "cn" && m.w === m.h && S === 2 * m.w) goi = "Diện tích hình vuông không phải là cạnh nhân 2.";
    }
    return { dung: dung, het: false, goi: goi };
  }
  function demDung(d) { var n = 0; d = d || {}; THU_TU.forEach(function (kh) { if (d[kh]) n++; }); return n; }
  /* 16/11 22:08, thầy: "sau khi các em đo và nhập đúng hết thì hiện hiệu ứng Chúc mừng nhóm 1 hoàn thành xuất xắc nhiệm vụ 1; nhóm nào hoàn thành sau thì hiện
     chúc mừng nhóm 2 hoàn thành tốt nhiệm vụ 1; sau nữa là chúc mừng nhóm 3 hoàn thành nhiệm vụ 1 ; cuối cùng là Chúc mừng nhóm 4 đã xong nhiệm vụ 1."
     Tôi hiểu: số nhóm trong câu là nhóm thật, còn lời khen đi theo thứ tự về đích (nhất: "hoàn thành xuất sắc", nhì: "hoàn thành tốt", ba: "hoàn thành", tư: "đã xong").
     Máy nhập đúng mục cuối cùng ghi giờ máy chủ vào n<k>/h1 (cùng một lần ghi với mục đó). Thứ hạng = số nhóm có h1 sớm hơn + 1 (trùng giờ thì nhóm số nhỏ đứng trước).
     Tivi hiện tấm bảng chúc mừng ngay trên thiệp của nhóm (giấy màu rơi vài giây lúc nhóm vừa xong); điện thoại của nhóm hiện cùng câu đó. */
  var MUNG_NV1 = ["hoàn thành xuất sắc", "hoàn thành tốt", "hoàn thành", "đã xong"];
  function hangNv1(h1, k) {                      // h1 = { 1: giờ nhóm 1 xong, … } (0 hay trống = chưa xong). Trả về 1..4, hoặc 0 nếu nhóm k chưa xong
    var t = +h1[k], n = 1, j;
    if (!(t > 0)) return 0;
    for (j = 1; j <= 4; j++) if (j !== k && +h1[j] > 0 && (+h1[j] < t || (+h1[j] === t && j < k))) n++;
    return n;
  }
  function loiMung(k, hang) { return ["Chúc mừng nhóm " + k, MUNG_NV1[hang - 1], "nhiệm vụ 1"]; }      // 3 dòng của tấm bảng; nối lại bằng dấu cách là câu thầy dặn
  function tungGiay(cha, n, cao) {                 // n mảnh giấy màu rơi nhẹ trong khung cha (trang điện thoại); tự dọn sau 7 giây
    var mau = ["#f6c453", "#ef6f5e", "#5fb37c", "#5aa7e0", "#f3a1bd", "#b78be0"], i, e, ds = [];
    for (i = 0; i < n; i++) {
      e = document.createElement("i"); e.className = "giay-roi";      /* tên riêng: lớp "giay" đã là nền giấy trắng của tấm thiệp (rect.giay) */
      e.style.left = (2 + Math.random() * 96).toFixed(1) + "%"; e.style.background = mau[i % mau.length];
      e.style.setProperty("--x", (Math.random() * 90 - 45).toFixed(0) + "px"); e.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg"); e.style.setProperty("--cao", cao + "px");
      e.style.animationDelay = (Math.random() * 1.8).toFixed(2) + "s"; e.style.animationDuration = (3 + Math.random() * 1.6).toFixed(2) + "s";
      cha.appendChild(e); ds.push(e);
    }
    setTimeout(function () { ds.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); }); }, 7000);
  }

  /* ---------- hình học ---------- */
  function trongTam(p) {
    var a = 0, cx = 0, cy = 0, i, j, k;
    for (i = 0; i < p.length; i++) {
      j = (i + 1) % p.length; k = p[i][0] * p[j][1] - p[j][0] * p[i][1];
      a += k; cx += (p[i][0] + p[j][0]) * k; cy += (p[i][1] + p[j][1]) * k;
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function daGiacTho(m) {                        // đa giác của mảnh, chưa dời gốc
    if (m.loai === "thoi") return [[-m.a / 2, 0], [0, -m.b / 2], [m.a / 2, 0], [0, m.b / 2]];
    if (m.loai === "thang") return [[-m.l / 2, -m.h / 2], [m.l / 2, -m.h / 2], [m.L / 2, m.h / 2], [-m.L / 2, m.h / 2]];
    if (m.loai === "cn") return [[-m.w / 2, -m.h / 2], [m.w / 2, -m.h / 2], [m.w / 2, m.h / 2], [-m.w / 2, m.h / 2]];
    return [[0, 0], [m.b, 0], [m.b + m.s, m.h], [m.s, m.h]];
  }
  function daGiac(m) {                           // đa giác của mảnh, gốc đặt ở trọng tâm
    var p = daGiacTho(m), c = trongTam(p);
    return p.map(function (q) { return [q[0] - c[0], q[1] - c[1]]; });
  }
  function diemGoc(goc, lat) { return lat ? goc.map(function (q) { return [-q[0], q[1]]; }) : goc; }
  function toaDo(goc, st) {                      // đa giác trên thiệp (cm) theo vị trí st = {x, y, r, f}
    var a = st.r * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return diemGoc(goc, st.f).map(function (q) { return [st.x + q[0] * c - q[1] * s, st.y + q[0] * s + q[1] * c]; });
  }
  function khung(p) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    p.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
    return [x0, y0, x1, y1];
  }
  function dtDaGiac(p) { var a = 0, i, j; for (i = 0; i < p.length; i++) { j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return Math.abs(a) / 2; }
  function chuanGoc(r) { r = r % 360; if (r < 0) r += 360; return Math.round(r * 100) / 100; }
  function lechGoc(d) { d = ((d % 180) + 180) % 180; return d > 90 ? d - 180 : d; }   // về (−90, 90]
  function doLun(P, Q) {                          // hai đa giác lồi lún vào nhau bao nhiêu cm (≤ 0: không chạm)
    var nho = 1e9, cap = [P, Q], t, i, a, b, nx, ny, d, k, minP, maxP, minQ, maxQ, v;
    for (t = 0; t < 2; t++) {
      for (i = 0; i < cap[t].length; i++) {
        a = cap[t][i]; b = cap[t][(i + 1) % cap[t].length];
        nx = b[1] - a[1]; ny = a[0] - b[0]; d = Math.hypot(nx, ny); if (d < 1e-9) continue; nx /= d; ny /= d;
        minP = minQ = 1e9; maxP = maxQ = -1e9;
        for (k = 0; k < P.length; k++) { v = P[k][0] * nx + P[k][1] * ny; minP = Math.min(minP, v); maxP = Math.max(maxP, v); }
        for (k = 0; k < Q.length; k++) { v = Q[k][0] * nx + Q[k][1] * ny; minQ = Math.min(minQ, v); maxQ = Math.max(maxQ, v); }
        nho = Math.min(nho, Math.min(maxP, maxQ) - Math.max(minP, minQ));
        if (nho <= 0) return nho;
      }
    }
    return nho;
  }
  /* Đẩy ra: P đang chồng lên Q thì dời P theo (nx, ny) một đoạn d là vừa hết chồng (đoạn ngắn nhất, theo hướng rời xa Q). Không chồng: null. */
  function dayVec(P, Q) {
    var tot = null, cap = [P, Q], t, i, a, b, nx, ny, d, k, minP, maxP, minQ, maxQ, v, h;
    for (t = 0; t < 2; t++) {
      for (i = 0; i < cap[t].length; i++) {
        a = cap[t][i]; b = cap[t][(i + 1) % cap[t].length];
        nx = b[1] - a[1]; ny = a[0] - b[0]; d = Math.hypot(nx, ny); if (d < 1e-9) continue; nx /= d; ny /= d;
        minP = minQ = 1e9; maxP = maxQ = -1e9;
        for (k = 0; k < P.length; k++) { v = P[k][0] * nx + P[k][1] * ny; minP = Math.min(minP, v); maxP = Math.max(maxP, v); }
        for (k = 0; k < Q.length; k++) { v = Q[k][0] * nx + Q[k][1] * ny; minQ = Math.min(minQ, v); maxQ = Math.max(maxQ, v); }
        if (Math.min(maxP, maxQ) - Math.max(minP, minQ) <= 0) return null;
        h = (minP + maxP) >= (minQ + maxQ) ? 1 : -1;
        d = h > 0 ? maxQ - minP : maxP - minQ;
        if (!tot || d < tot.d) tot = { d: d, nx: nx * h, ny: ny * h };
      }
    }
    return tot;
  }
  function kcDiemDoan(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function kcDaGiac(P, Q) {                        // khoảng hở giữa hai đa giác lồi (0 nếu chạm hay chồng)
    if (doLun(P, Q) > 0) return 0;
    var nho = 1e9, i, j;
    for (i = 0; i < P.length; i++) for (j = 0; j < Q.length; j++) {
      nho = Math.min(nho, kcDiemDoan(P[i], Q[j], Q[(j + 1) % Q.length]), kcDiemDoan(Q[j], P[i], P[(i + 1) % P.length]));
    }
    return nho;
  }
  function ganNhat(P, Q) {                         // véc-tơ ngắn nhất đưa đa giác P tới chạm đa giác Q (hai đa giác lồi, đang không chồng)
    var tot = null;
    function xet(p, a, b, dau) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0;
      t = Math.max(0, Math.min(1, t));
      var vx = a[0] + dx * t - p[0], vy = a[1] + dy * t - p[1], kc = Math.hypot(vx, vy);
      if (!tot || kc < tot.kc) tot = { kc: kc, dx: vx * dau, dy: vy * dau };
    }
    P.forEach(function (p) { Q.forEach(function (q, j) { xet(p, q, Q[(j + 1) % Q.length], 1); }); });
    Q.forEach(function (q) { P.forEach(function (p, i) { xet(q, p, P[(i + 1) % P.length], -1); }); });
    return tot;
  }
  /* Các cách chỉnh nhẹ mảnh A = {goc, st} theo các mảnh khác (khac = [đa giác trên thiệp]); ng = ngưỡng.
     Trả về [{st, diem}], điểm nhỏ là nên thử trước. Ba kiểu:
     a) một cạnh gần song song và gần sát một cạnh mảnh khác: xoay cho song song, dời cho sát hẳn, rồi trượt dọc cạnh cho hai đầu cạnh trùng nhau nếu lệch ít;
     b) một đỉnh gần một đỉnh mảnh khác: dời cho trùng;
     c) hở một khe nhỏ với mảnh khác: dời theo đường ngắn nhất cho chạm. */
  function cachChinh(A, khac, ng) {
    var pa = toaDo(A.goc, A.st), ra = [], n = pa.length, i, j, k;
    function them(x, y, r, diem) { ra.push({ st: { x: x, y: y, r: r, f: A.st.f, t: A.st.t }, diem: diem }); }
    for (i = 0; i < n; i++) {
      var gA = Math.atan2(pa[(i + 1) % n][1] - pa[i][1], pa[(i + 1) % n][0] - pa[i][0]) * 180 / Math.PI;
      for (j = 0; j < khac.length; j++) {
        var B = khac[j], cB = null;
        for (k = 0; k < B.length; k++) {
          var b0 = B[k], b1 = B[(k + 1) % B.length], dx = b1[0] - b0[0], dy = b1[1] - b0[1], lb = Math.hypot(dx, dy);
          if (lb < 1e-6) continue;
          var d = lechGoc(gA - Math.atan2(dy, dx) * 180 / Math.PI);
          if (Math.abs(d) > ng.goc) continue;
          var r2 = Math.abs(d) < 1e-9 ? A.st.r : chuanGoc(A.st.r - d);
          var q = toaDo(A.goc, { x: A.st.x, y: A.st.y, r: r2, f: A.st.f }), a0 = q[i], a1 = q[(i + 1) % n], la = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
          var ux = dx / lb, uy = dy / lb;
          var xa = ((a0[0] + a1[0]) / 2 - b0[0]) * (-uy) + ((a0[1] + a1[1]) / 2 - b0[1]) * ux;   // khoảng cách có dấu từ cạnh a tới đường b
          if (Math.abs(xa) > ng.xa) continue;
          var t0 = (a0[0] - b0[0]) * ux + (a0[1] - b0[1]) * uy, t1 = (a1[0] - b0[0]) * ux + (a1[1] - b0[1]) * uy;
          if (Math.min(Math.max(t0, t1), lb) - Math.max(Math.min(t0, t1), 0) < 0.3 * Math.min(la, lb)) continue;   // hai cạnh phải gối lên nhau đủ dài
          if (!cB) cB = trongTam(B);
          var benA = (A.st.x - b0[0]) * (-uy) + (A.st.y - b0[1]) * ux - xa, benB = (cB[0] - b0[0]) * (-uy) + (cB[1] - b0[1]) * ux;
          if (benA * benB > 0) continue;                                    // cùng phía với mảnh kia: sẽ chồng, bỏ
          var x2 = A.st.x + uy * xa, y2 = A.st.y - ux * xa, diem = Math.abs(xa) + Math.abs(d) * 0.03, truot = null;
          [t0, t1].forEach(function (t) { [0, lb].forEach(function (tb) { var dd = tb - t; if (Math.abs(dd) <= ng.truot && (truot === null || Math.abs(dd) < Math.abs(truot))) truot = dd; }); });
          if (truot !== null && Math.abs(truot) > 1e-4) them(x2 + ux * truot, y2 + uy * truot, r2, diem);
          them(x2, y2, r2, diem + 0.002);
        }
      }
    }
    pa.forEach(function (a) {
      khac.forEach(function (B2) {
        B2.forEach(function (b) {
          var kc = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (kc <= ng.dinh) them(A.st.x + b[0] - a[0], A.st.y + b[1] - a[1], A.st.r, kc + 0.05);
        });
      });
    });
    khac.forEach(function (B3) {
      var g = ganNhat(pa, B3);
      if (g && g.kc > 1e-3 && g.kc <= ng.xa) them(A.st.x + g.dx, A.st.y + g.dy, A.st.r, g.kc + 0.1);
    });
    ra.sort(function (x, y) { return x.diem - y.diem; });
    return ra;
  }
  function giuTrong(goc, st, v) {                 // giữ cả mảnh nằm trong chỗ dán hình v = [x0, y0, x1, y1]
    var k = khung(toaDo(goc, st));
    if (k[0] < v[0]) st.x += v[0] - k[0]; else if (k[2] > v[2]) st.x -= k[2] - v[2];
    if (k[1] < v[1]) st.y += v[1] - k[1]; else if (k[3] > v[3]) st.y -= k[3] - v[3];
  }
  /* Thầy dặn 15/11 17:09 và 17:21: "hình không nằm thẳng với đường ô ly được mà phải xéo xéo", "cạnh hình bình hành thì các em xoay thì phải có lúc
     nó đè lên đường ngang ô ly chứ. Ở đây các em xoay nó đều bị lệch lên 1 chút".
     Mảnh có một cạnh nằm ngang hay dọc: dời mảnh (không quá nửa ô) cho một đầu của cạnh đó vào đúng mắt lưới 1 cm, vậy là cạnh nằm ĐÚNG TRÊN đường ô ly.
     (Trước 15/11 mảnh vào mắt lưới nửa ô nên cạnh hay nằm giữa hai đường ô ly.) Hình thoi đặt thẳng không có cạnh ngang dọc: đỉnh vào mắt lưới nửa ô như cũ. */
  function vaoLuoi(goc, st, v) {
    var P = toaDo(goc, st), n = P.length, i, a = null, b, o = 0, d, gan = 9, p;
    for (i = 0; i < n; i++) {                     // trong các cạnh nằm ngang hay dọc, lấy cạnh đang gần đường ô ly nhất (mảnh phải dời ít nhất)
      p = P[i]; b = P[(i + 1) % n];
      if (Math.abs(p[1] - b[1]) < 0.02) d = Math.abs(p[1] - v[1] - Math.round(p[1] - v[1]));
      else if (Math.abs(p[0] - b[0]) < 0.02) d = Math.abs(p[0] - v[0] - Math.round(p[0] - v[0]));
      else continue;
      if (d < gan - 1e-9) { gan = d; a = p; o = 1; }
    }
    if (!o) {
      var r = ((st.r % 90) + 90) % 90;
      if (r > 0.01 && r < 89.99) return false;
      a = P[0]; o = O_LUOI;
    }
    st.x += Math.round((a[0] - v[0]) / o) * o + v[0] - a[0];
    st.y += Math.round((a[1] - v[1]) / o) * o + v[1] - a[1];
    return true;
  }
  /* Chỉnh nhẹ lúc Hoàn thành. ds = [{goc, st}] (sửa thẳng vào st); vung = chỗ dán hình.
     Đi từ mảnh to tới mảnh nhỏ (mảnh to nhất đứng yên), mỗi mảnh thử các cách chỉnh của cachChinh và nhận cách đầu tiên mà:
       không làm mảnh nào chồng lên nhau, không ra ngoài chỗ dán, không tách mảnh ra khỏi mảnh nó đang chạm,
       và không dời mảnh quá XA_NHAT cm hay xoay quá NHE.goc độ so với chỗ các em đặt.
     Vì vậy hình đã ngay ngắn thì giữ nguyên; hình có khe hở nhỏ, cạnh lệch góc ít, đầu cạnh lệch ít thì được chỉnh cho khít.
     Sau đó xét có ra hình không: mảnh "chạm" là mảnh sát một mảnh khác. Ít hơn 7 mảnh chạm, hoặc có mảnh nằm cách xa, thì chưa nhận ra hình.
     Trước hết (14/11, từ khi bỏ tự đẩy lúc thả): các mảnh đè nhẹ lên nhau (lún không quá NHE.de cm) thì máy tự tách ra vừa hết đè.
     Có cặp đè nhiều hơn, hoặc tách không nổi, thì dừng và trả về cap = [[i, j], …] để báo các em chỉnh.
     Trả về { ok, le: [chỉ số các mảnh chưa chạm mảnh nào], soCham, chong: còn cặp đè lên nhau, cap: các cặp đó } */
  function canChinh(ds, vung) {
    var n = ds.length, thuTu = [], i, j, lan, kc;
    for (i = 0; i < n; i++) thuTu.push(i);
    thuTu.sort(function (x, y) { return dtDaGiac(ds[y].goc) - dtDaGiac(ds[x].goc) || x - y; });
    var ps = ds.map(function (A) { return toaDo(A.goc, A.st); }), dau = ds.map(function (A) { return { x: A.st.x, y: A.st.y, r: A.st.r }; });
    function hopLe(i2, st) {
      var P = toaDo(ds[i2].goc, st), k = khung(P), dr = st.r - dau[i2].r, j2;
      dr -= Math.round(dr / 360) * 360;
      if (k[0] < vung[0] - 1e-6 || k[1] < vung[1] - 1e-6 || k[2] > vung[2] + 1e-6 || k[3] > vung[3] + 1e-6) return null;
      if (Math.hypot(st.x - dau[i2].x, st.y - dau[i2].y) > XA_NHAT || Math.abs(dr) > NHE.goc + 0.01) return null;
      for (j2 = 0; j2 < n; j2++) if (j2 !== i2) {
        if (doLun(P, ps[j2]) > CHONG) return null;
        if (kcDaGiac(ps[i2], ps[j2]) <= CHAM && kcDaGiac(P, ps[j2]) > CHAM) return null;
      }
      return P;
    }
    /* bước 0 (14/11, từ khi bỏ tự đẩy lúc thả): tách các mảnh đè nhẹ lên nhau.
       Có cặp lún sâu hơn NHE.de thì không tách: trả về các cặp đó để báo các em chỉnh.
       Còn lại thì dời dần từng cặp ra xa nhau vừa hết đè (mảnh nhỏ nhường nhiều hơn mảnh to), lặp tới khi cả hình hết đè.
       Không hết đè được, hoặc phải dời một mảnh quá XA_TACH cm, thì trả lại hình cũ và báo các cặp đang đè. */
    function tachDe() {
      var luu = ds.map(function (A) { return { x: A.st.x, y: A.st.y }; }), dt = ds.map(function (A) { return dtDaGiac(A.goc); }), vong, a, b, v, sa, co, ok = true;
      function doi(a2, dx, dy) { var st = ds[a2].st; st.x += dx; st.y += dy; giuTrong(ds[a2].goc, st, vung); ps[a2] = toaDo(ds[a2].goc, st); }
      for (vong = 0; vong < 80; vong++) {
        co = false;
        for (a = 0; a < n; a++) for (b = a + 1; b < n; b++) {
          v = dayVec(ps[a], ps[b]);
          if (!v || v.d <= 0.01) continue;
          co = true; sa = dt[b] / (dt[a] + dt[b]);
          doi(a, v.nx * v.d * sa, v.ny * v.d * sa); doi(b, -v.nx * v.d * (1 - sa), -v.ny * v.d * (1 - sa));
        }
        if (!co) break;
      }
      for (a = 0; a < n && ok; a++) {
        if (Math.hypot(ds[a].st.x - luu[a].x, ds[a].st.y - luu[a].y) > XA_TACH) ok = false;
        for (b = a + 1; b < n && ok; b++) if (doLun(ps[a], ps[b]) > CHONG) ok = false;
      }
      if (!ok) ds.forEach(function (A, a2) { A.st.x = luu[a2].x; A.st.y = luu[a2].y; ps[a2] = toaDo(A.goc, A.st); });
      return ok;
    }
    var capDe = [], lun;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { lun = doLun(ps[i], ps[j]); if (lun > CHONG) capDe.push([i, j, lun]); }
    if (capDe.length) {
      var capSau = capDe.filter(function (c) { return c[2] > NHE.de + 1e-6; });
      if (capSau.length || !tachDe()) return { ok: false, le: [], soCham: 0, chong: true, cap: (capSau.length ? capSau : capDe).map(function (c) { return [c[0], c[1]]; }) };
      dau = ds.map(function (A) { return { x: A.st.x, y: A.st.y, r: A.st.r }; });      // chỉnh nhẹ tính quãng dời từ hình đã tách
    }
    for (lan = 0; lan < 3; lan++) {
      var co = false;
      thuTu.forEach(function (i2, vt) {
        if (!vt) return;
        var A = ds[i2], khac = ps.filter(function (p, j3) { return j3 !== i2; }), cs = cachChinh(A, khac, NHE), c, P, dr, x;
        for (x = 0; x < cs.length; x++) {
          c = cs[x]; dr = c.st.r - A.st.r; dr -= Math.round(dr / 360) * 360;
          if (Math.hypot(c.st.x - A.st.x, c.st.y - A.st.y) < 0.005 && Math.abs(dr) < 0.02) continue;   // đã đúng như vậy rồi
          P = hopLe(i2, c.st);
          if (P) { A.st.x = c.st.x; A.st.y = c.st.y; A.st.r = c.st.r; ps[i2] = P; co = true; break; }
        }
      });
      if (!co) break;
    }
    var gan = [], chong = false;
    for (i = 0; i < n; i++) gan[i] = 1e9;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { kc = kcDaGiac(ps[i], ps[j]); gan[i] = Math.min(gan[i], kc); gan[j] = Math.min(gan[j], kc); if (doLun(ps[i], ps[j]) > CHONG) chong = true; }
    var le = [], soCham = 0, coXa = false;
    for (i = 0; i < n; i++) { if (gan[i] <= CHAM) soCham++; else le.push(i); if (gan[i] > LE_XA) coXa = true; }
    return { ok: !chong && soCham >= Math.min(IT_NHAT_CHAM, n) && !coXa, le: le, soCham: soCham, chong: chong, cap: [] };
  }
  function vaoGiua(ds, vung) {                    // đưa cả hình vào giữa bàn xếp (dời chẵn ô lưới)
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ds.forEach(function (A) { var k = khung(toaDo(A.goc, A.st)); x0 = Math.min(x0, k[0]); y0 = Math.min(y0, k[1]); x1 = Math.max(x1, k[2]); y1 = Math.max(y1, k[3]); });
    var dx = Math.round((vung[0] + vung[2]) / 2 - (x0 + x1) / 2), dy = Math.round((vung[1] + vung[3]) / 2 - (y0 + y1) / 2);      // dời chẵn ô (15/11): mảnh đang nằm đúng đường ô ly thì vẫn đúng đường ô ly
    if (x0 + dx < vung[0] - 1e-6) dx += Math.ceil(vung[0] - x0 - dx - 1e-6); else if (x1 + dx > vung[2] + 1e-6) dx -= Math.ceil(x1 + dx - vung[2] - 1e-6);
    if (y0 + dy < vung[1] - 1e-6) dy += Math.ceil(vung[1] - y0 - dy - 1e-6); else if (y1 + dy > vung[3] + 1e-6) dy -= Math.ceil(y1 + dy - vung[3] - 1e-6);
    ds.forEach(function (A) { A.st.x += dx; A.st.y += dy; });
  }

  /* Chỗ nằm sẵn của 10 mảnh khi mới mở bàn xếp.
     14/11 16:06: theo hình mẫu của nhóm, tách ra 4 phía. 15/11 10:08: mảnh nằm thẳng. 15/11 17:23: theo 4 ảnh thầy gửi (bàn 32 × 35 ô).
     15/11 18:31 thầy gửi 4 ảnh mới (thầy tự kéo và xoay từng mảnh trên bản 17:23): "Chỉnh lại các hình ban đầu được sắp xếp như vậy đi",
     và bảo bàn xếp phải là tờ A3. MAU_DAU[nhóm][mảnh − 1] = [x, y, góc, lật]: tâm mảnh (cm trên tấm thiệp), góc xoay, mặt lật.
     Cách tính (test/tinh-dau.js): đọc tâm, góc, mặt lật của 40 mảnh trong 4 ảnh (test/doc-anh-thay-2.py), góc đưa về đúng nấc xoay,
     chỗ nằm đổi từ bàn 32 × 35 ô sang phần tấm thiệp dưới khung tiêu đề (giữ thứ tự trái phải, trên dưới như ảnh), rồi nhích cho không mảnh nào
     cách mảnh khác dưới 1 cm. Mảnh chưa ai kéo thì KHÔNG có trong dữ liệu: điện thoại và tivi cùng tính ra chỗ này. */
  /* 15/11 19:15, thầy gửi ảnh tivi có khung đỏ quanh chỗ dán hình: "phần xếp hình thì sẽ chỉ hiện ra phần xếp nằm trong khung này thôi
     còn mấy phần kia các em sẽ không kéo xuống được". Từ đó 10 mảnh chỉ nằm và chỉ kéo được trong chỗ dán hình (dan) của tờ A3.
     Bảng dưới tính lại từ 4 ảnh thầy gửi 18:31, dồn vào chỗ dán hình (test/tinh-dau.js, KHE=1.9,1.5,2.2,2.0). */
  /* 15/11 22:33 thầy bỏ chỗ ghi lời chúc, chỗ dán hình rộng ra: cả 10 mảnh dời theo một khối, vẫn đúng cách thầy xếp trong 4 ảnh 18:31.
     Dời đúng bằng hình mẫu (thiệp dọc: xuống 1,2 cm; thiệp ngang: sang phải 4,25 cm, xuống 0,65 cm), nên khối 10 mảnh nằm quanh chỗ của hình mẫu
     và vẫn đúng nấc lưới như trước. (Bản 15/11 23:33 thiệp dọc xuống 5,2 cm; 16/11 00:26 thầy bảo đẩy hình nhóm 1, 2 lên trên: lên 4 cm.) Tivi lúc nhóm còn đo và tính: xem CHO_O (thiệp ngang tạm vẽ các mảnh lệch sang trái để có chỗ cho 3 ô).
     Bảng trước lúc dời: xep-thiep-truoc-bo-loi-chuc (ban-cu/site-15-11-22h50). */
  /* 16/11 10:02, thầy (kèm 4 ảnh chụp bàn xếp của 4 nhóm trên điện thoại): "phần xếp hình thì vị trí các hình mở đầu giống như tôi gửi bên trên nhé."
     Nhóm 1, 3, 4: lấy đúng số trong bài thầy vừa xếp trên máy thật (phòng của thầy, chép lúc 10:10, trùng với 3 ảnh). Nhóm 2: thầy đã bấm Làm lại từ đầu
     nên đọc từ ảnh (sai số khoảng 0,1 cm), góc lấy nấc xoay gần nhất; mảnh số 1 thầy không dời. Số liệu gốc: test/anh-thay-16-11.json.
     Bảng trước đó (theo 4 ảnh 15/11 18:31, dời theo hình mẫu): ban-cu/site-16-11-07h11. */
  var MAU_DAU = theoNhom({
    1: [[15.817, 12.042, 63.43, 0], [6.493, 13.862, 50, 0], [24.696, 16.009, 130, 0], [20.5, 30.478, 195, 0], [15.286, 38.212, 195, 0], [10.175, 34.182, 345, 0], [8.956, 22.292, 333.44, 0], [18.377, 22.662, 116.56, 0], [23.552, 23.761, 115, 0], [4.55, 25.038, 65, 1]],
    2: [[16.816, 12.066, 116.57, 0], [5.111, 9.625, 75, 0], [24.32, 10.95, 105, 0], [18.617, 31.453, 210, 0], [13.766, 36.523, 333.43, 0], [7.25, 26.64, 195, 0], [10.997, 20.363, 60, 0], [18.49, 20.534, 45, 0], [25.132, 19.244, 304, 1], [4.331, 17.541, 56, 0]],
    3: [[28.502, 12.603, 75, 0], [33.75, 8.5, 165, 0], [8.908, 9.671, 63.43, 0], [29.25, 20.778, 195, 0], [14.25, 13.067, 15, 0], [9.373, 24.561, 195, 0], [8.25, 17, 105, 0], [14.25, 19, 255, 0], [24.654, 25.222, 195, 1], [36.248, 25.5, 165, 0]],
    4: [[10.003, 13.079, 243.43, 0], [26.636, 9.35, 225, 0], [38.379, 8.524, 135, 0], [33.456, 23.872, 15, 0], [11.307, 25.276, 195, 0], [33.686, 13.237, 345, 0], [28.686, 18.737, 75, 0], [37.686, 17.737, 15, 0], [6.825, 20.241, 225, 1], [17.841, 18.442, 315, 0]]
  });
  var dauNho = {};
  function viTriDau(k) {
    if (!dauNho[k]) {
      var bc = BOCUC[NHOM[k]], goc = BO.map(daGiac), lg = luoiGoc(k);
      dauNho[k] = MAU_DAU[k].map(function (m, i) {
        var st = { x: m[0], y: m[1], r: m[2], f: m[3] }, nac = nacXoay(k, i, st.f), g = nacGan(nac, st.r);
        if (Math.abs(lechVong(g - st.r)) <= 4) st.r = g;
        vaoLuoi(goc[i], st, lg); giuTrong(goc[i], st, bc.dan);
        return { x: f3(st.x), y: f3(st.y), r: st.r, f: st.f };
      });
    }
    return dauNho[k].map(function (d) { return { x: d.x, y: d.y, r: d.r, f: d.f }; });
  }
  function duChung() { return [0, 0, 0, 0]; }   // (giữ tên cũ; trước 15/11 là phần lưới nới thêm mà mọi máy của nhóm cùng thấy)

  /* Các nấc xoay của một mảnh (15/11, sau lời thầy 17:09 và 17:21). Trước đó mỗi lần bấm là 15°, nên cạnh xiên của hình bình hành, hình thang, hình thoi
     không bao giờ nằm đúng theo đường ô ly (lệch 3° tới 8°), và mảnh không xoay được về đúng góc của nó trong hình mẫu của nhóm.
     Nấc xoay = các bội của 15°, cộng thêm:
       (a) mọi góc làm MỘT CẠNH của mảnh nằm ngang hay dọc (hình bình hành: cạnh bên xiên 56,31°; hình thang 12/6/4: 53,13°; hình thang 6/4/2 và hình thoi: 63,43°);
       (b) góc của mảnh đó, và của mảnh sinh đôi với nó, trong hình mẫu của nhóm (GOC_MAU; ví dụ nhóm 1: hình vuông 26,56°, hình bình hành 65°).
     Góc thêm vào mà cách một bội của 15° dưới 4° thì THAY cho bội đó (trừ 0°, 90°, 180°, 270°), để không có hai nấc sát nhau.
     Vậy mỗi lần bấm mảnh xoay khoảng 5° tới 19°, và cạnh nào của mảnh cũng có nấc nằm đúng theo đường ô ly. */
  var GOC_MAU = theoNhom({      // [góc, lật] của 10 mảnh trong từng hình mẫu (bảng MAU_DAU bản 14/11 16:32); viết theo số hình mẫu, xem HINH
    1: [[90, 0], [50, 0], [310, 0], [180, 0], [180, 0], [0, 0], [333.44, 0], [26.56, 0], [65, 1], [295, 0]],
    2: [[90, 0], [90, 0], [90, 0], [180, 0], [0, 0], [0, 0], [0, 0], [0, 0], [304, 1], [56, 0]],
    3: [[90, 0], [0, 0], [90, 0], [180, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 1], [0, 0]],
    4: [[90, 0], [56, 0], [304, 0], [0, 0], [180, 0], [0, 0], [0, 0], [0, 0], [85, 1], [275, 0]]
  });
  var SINH_DOI = { 1: 2, 2: 1, 6: 7, 7: 6, 8: 9, 9: 8 }, nacNho = {};      // chỉ số mảnh (từ 0): 2–3, 7–8, 9–10 là các cặp cùng hình
  function lechVong(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; }      // về (−180, 180]

  /* ---------- hình mẫu của nhóm, lưới theo hình mẫu, mức giống hình mẫu (15/11 18:31) ----------
     Thầy dặn: "có cái mốc dự đoán là gần giống hình gốc 80%, thì khi bấm hoàn thành đó, bạn sẽ xếp y chang cái hình mà trong cái file báo tường làm mẫu đó
     ... thôi giảm xuống 70% đi". Hình mẫu = file in 4-thiep-a3-bo-198 (cũng là 4 tấm thiệp mẫu trên báo tường); đa giác từng mảnh nằm trong
     Tranh3D.MAU_HINH (cm trên thiệp). mauXep(k)[i] = { x, y, r, f } của mảnh thứ i trong hình mẫu nhóm k. */
  var mauNho = {}, luoiNho = {};
  function mauXep(k) {
    if (mauNho[k] === undefined) {
      var Hm = window.Tranh3D && window.Tranh3D.MAU_HINH && window.Tranh3D.MAU_HINH[HINH[k]], ra = null;
      if (Hm && Hm.manh) {
        ra = BO.map(function (b, i) {
          var Q = Hm.manh[i + 1], c = trongTam(Q), g = daGiac(b), tot = null, f, a, j, st;
          function sai(st2) {                      // đỉnh của mẫu cách đỉnh gần nhất của mảnh đặt theo st2 bao nhiêu (lớn nhất)
            var P = toaDo(g, st2), lon = 0;
            Q.forEach(function (q) { var nho = 1e9; P.forEach(function (v) { nho = Math.min(nho, Math.hypot(v[0] - q[0], v[1] - q[1])); }); lon = Math.max(lon, nho); });
            return lon;
          }
          st = { x: c[0], y: c[1], r: GOC_MAU[k][i][0], f: GOC_MAU[k][i][1] };      // góc ghi sẵn (cũng là một nấc xoay): dùng nếu khớp
          if (sai(st) < 0.03) tot = { sai: sai(st), st: st };
          for (f = 0; !tot && f <= 1; f++) {
            var gg = diemGoc(g, f);
            for (a = 0; a < Q.length; a++) for (j = 0; j < gg.length; j++) {
              st = { x: c[0], y: c[1], r: chuanGoc((Math.atan2(Q[a][1] - c[1], Q[a][0] - c[0]) - Math.atan2(gg[j][1], gg[j][0])) * 180 / Math.PI), f: f };
              var e = sai(st);
              if (!tot || e < tot.sai - 1e-9) tot = { sai: e, st: st };
            }
            if (b.loai !== "bh") break;            // chỉ hình bình hành mới có hai mặt khác nhau
          }
          return { x: f3(tot.st.x), y: f3(tot.st.y), r: tot.st.r, f: tot.st.f, sai: tot.sai };
        });
      }
      mauNho[k] = ra;
    }
    return mauNho[k];
  }
  /* Gốc của lưới ô 1 cm trên tấm thiệp nhóm k: chọn sao cho các cạnh ngang, cạnh dọc của hình mẫu nằm ĐÚNG trên đường ô ly
     (hình mẫu của mỗi thiệp đặt lệch một ít so với mép giấy: thiệp 1, 2 lệch 0,5 cm; thiệp 3 lệch 0,35 cm theo chiều đứng; thiệp 4 lệch 0,436 và 0,087 cm). */
  function luoiGoc(k) {
    if (!luoiNho[k]) {
      var M = mauXep(k), gx = null, gy = null;
      if (M) M.forEach(function (st, i) {
        var P = toaDo(daGiac(BO[i]), st), n = P.length, j, a, b;
        for (j = 0; j < n; j++) {
          a = P[j]; b = P[(j + 1) % n];
          if (gx === null && Math.abs(a[0] - b[0]) < 0.01) gx = f3(a[0]) - Math.floor(f3(a[0]));
          if (gy === null && Math.abs(a[1] - b[1]) < 0.01) gy = f3(a[1]) - Math.floor(f3(a[1]));
        }
      });
      luoiNho[k] = [f3(gx || 0), f3(gy || 0)];
    }
    return luoiNho[k];
  }
  function dtGiao(P, Q) {                         // diện tích phần chung của hai đa giác lồi (cắt P theo từng cạnh của Q)
    var s = 0, i, j, n = Q.length, ra = P, a, b, moi, v, w, dv, dw, t;
    for (i = 0; i < n; i++) { j = (i + 1) % n; s += Q[i][0] * Q[j][1] - Q[j][0] * Q[i][1]; }
    s = s >= 0 ? 1 : -1;
    for (i = 0; i < n && ra.length; i++) {
      a = Q[i]; b = Q[(i + 1) % n]; moi = [];
      for (j = 0; j < ra.length; j++) {
        v = ra[j]; w = ra[(j + 1) % ra.length];
        dv = s * ((b[0] - a[0]) * (v[1] - a[1]) - (b[1] - a[1]) * (v[0] - a[0]));
        dw = s * ((b[0] - a[0]) * (w[1] - a[1]) - (b[1] - a[1]) * (w[0] - a[0]));
        if (dv >= 0) moi.push(v);
        if ((dv >= 0) !== (dw >= 0)) { t = dv / (dv - dw); moi.push([v[0] + (w[0] - v[0]) * t, v[1] + (w[1] - v[1]) * t]); }
      }
      ra = moi;
    }
    return ra.length < 3 ? 0 : dtDaGiac(ra);
  }
  /* Mức giống hình mẫu = phần diện tích mà các mảnh của nhóm đang nằm ĐÚNG CHỖ của chính mảnh đó trong hình mẫu.
     Các em xếp hình ở đâu trên tấm thiệp cũng được: máy dời hình mẫu tới chỗ khớp nhất rồi mới so (không xoay cả hình).
     Hai mảnh cùng hình (2–3, 7–8, 9–10) đổi chỗ cho nhau vẫn tính.
     16/11 10:02, thầy: "ở hình 3 và hình 4 thì có 2 hình học sinh phải xếp trong cùng 1 tấm thiệp nên mỗi hình sẽ tính 60% độ chính xác nhé."
     HINH_CON[k] = các hình con trong hình mẫu nhóm k (chỉ số mảnh từ 0). Nhóm 3: hải đăng (mảnh 3, 5, 6, 7, 8) và con thuyền (1, 2, 4, 9, 10).
     Nhóm 4: ngọn đuốc (1, 5, 9, 10) và cái trống (2, 3, 4, 6, 7, 8). Mỗi hình con được dời RIÊNG tới chỗ khớp nhất rồi mới so với phần diện tích của chính nó,
     nên hai hình đặt xa hay gần nhau hơn mẫu vẫn tính (trước 16/11 máy dời cả tấm một lần và đòi 70 % của cả 198 cm²: thầy xếp hình nhóm 4 gần giống mẫu
     nhưng hai hình cách nhau xa hơn mẫu 5 cm nên chỉ được khoảng 55 %).
     Trả về { tile: 0..1 (phần diện tích đúng chỗ, tính trên cả 198 cm²), dat: đạt mốc hay chưa, con: [{ tile, dx, dy }] từng hình con, dx, dy: độ dời của hình con đầu,
     gan }: gan[i] = mảnh của nhóm (từ 0) nằm vào chỗ mảnh mẫu thứ i.
     Đạt (nhóm 1, 2: cả hình từ MOC_GIONG; nhóm 3, 4: MỖI hình con từ MOC_GIONG_CON): bấm Hoàn thành thì máy xếp lại y chang hình mẫu, đúng chỗ của hình mẫu trên thiệp.
     Riêng thiệp 2 hình: hình con nào nhóm CHƯA DỜI ít nhất một nửa số mảnh khỏi chỗ nằm sẵn (dời từ 0,3 cm, hoặc xoay, lật) thì chưa tính là đã xếp (con[i].chua = true).
     Lý do: theo 4 hình thầy gửi 16/11 thì 5 mảnh con thuyền của nhóm 3 nằm sẵn đã giống mẫu 68 %; không có điều kiện này thì nhóm chỉ xếp hải đăng rồi bấm Hoàn thành
     là máy xếp hộ luôn con thuyền. (Lựa chọn của Claude, đã báo thầy 16/11; thầy chưa trả lời.) */
  var MOC_GIONG = 0.7, MOC_GIONG_CON = 0.6, CUNG_HINH = [[0], [1, 2], [3], [4], [5], [6, 7], [8, 9]];
  var HINH_CON = theoNhom({ 3: [[2, 4, 5, 6, 7], [0, 1, 3, 8, 9]], 4: [[0, 4, 8, 9], [1, 2, 3, 5, 6, 7]] });      // viết theo số hình mẫu (3 hải đăng và con thuyền, 4 trống và đuốc); từ 19/11 là nhóm 4 và nhóm 2
  function giongMau(k, ps) {
    var M = mauXep(k);
    if (!M || !ps || ps.length !== M.length) return null;
    var goc = BO.map(daGiac), Q = M.map(function (st, i) { return toaDo(goc[i], st); }), cQ = Q.map(trongTam), cP = ps.map(trongTam), dtQ = Q.map(dtDaGiac);
    var con = HINH_CON[k] || [BO.map(function (b, i) { return i; })], moc = HINH_CON[k] ? MOC_GIONG_CON : MOC_GIONG, cua = {}, cach = [[]], tot = null, tong = 0;
    var daDoi = HINH_CON[k] ? viTriDau(k).map(function (st, i) {      // mảnh i của nhóm đã rời chỗ nằm sẵn chưa
      var d = toaDo(goc[i], st), xa = 0;
      d.forEach(function (v, j) { xa = Math.max(xa, Math.hypot(v[0] - ps[i][j][0], v[1] - ps[i][j][1])); });
      return xa >= 0.3;
    }) : null;
    dtQ.forEach(function (d) { tong += d; });
    con.forEach(function (F, n) { F.forEach(function (i) { cua[i] = n; }); });
    CUNG_HINH.forEach(function (g) {              // cặp mảnh cùng hình mà hai mảnh nằm ở hai hình con khác nhau (nhóm 3: mảnh 2 là lá cờ, mảnh 3 là đèn): thử cả hai cách chia
      if (g.length === 2 && cua[g[0]] !== cua[g[1]]) cach = cach.concat(cach.map(function (c) { return c.concat([g]); }));
    });
    function khopCon(F, nao) {                    // khớp một hình con; nao[i] = mảnh của nhóm đem so với mảnh mẫu i (hai mảnh cùng hình trong cùng hình con thì máy tự chọn cách ghép hơn)
      var trong = {}, nhom = [], s = 0, t = null;
      F.forEach(function (i) { trong[i] = 1; s += dtQ[i]; });
      CUNG_HINH.forEach(function (g) { var c = g.filter(function (i) { return trong[i]; }); if (c.length) nhom.push(c); });
      function diem(dx, dy) {
        var d = 0, gan = {};
        function giao(i, j) { return dtGiao(ps[j], Q[i].map(function (v) { return [v[0] + dx, v[1] + dy]; })); }
        nhom.forEach(function (g) {
          if (g.length === 1) { d += giao(g[0], nao[g[0]]); gan[g[0]] = nao[g[0]]; return; }
          var a = giao(g[0], nao[g[0]]) + giao(g[1], nao[g[1]]), b = giao(g[0], nao[g[1]]) + giao(g[1], nao[g[0]]);
          if (a >= b) { d += a; gan[g[0]] = nao[g[0]]; gan[g[1]] = nao[g[1]]; } else { d += b; gan[g[0]] = nao[g[1]]; gan[g[1]] = nao[g[0]]; }
        });
        return { tile: d / s, dt: d, dx: dx, dy: dy, gan: gan };
      }
      nhom.forEach(function (g) {                 // thử dời hình con sao cho một mảnh mẫu trùng tâm với mảnh cùng hình của nhóm
        g.forEach(function (i) { g.forEach(function (j) {
          var x = diem(cP[nao[j]][0] - cQ[i][0], cP[nao[j]][1] - cQ[i][1]);
          if (!t || x.tile > t.tile) t = x;
        }); });
      });
      [1, 0.5, 0.25, 0.125].forEach(function (b) {  // nhích thêm cho khớp hơn
        var doi = true, vong = 0;
        while (doi && vong++ < 8) {
          doi = false;
          [[b, 0], [-b, 0], [0, b], [0, -b]].forEach(function (v) { var x = diem(t.dx + v[0], t.dy + v[1]); if (x.tile > t.tile + 1e-9) { t = x; doi = true; } });
        }
      });
      return t;
    }
    cach.forEach(function (doi) {
      var nao = BO.map(function (b, i) { return i; }), kq = { con: [], gan: [], dat: true, nho: 1 }, d = 0;
      doi.forEach(function (g) { nao[g[0]] = g[1]; nao[g[1]] = g[0]; });
      con.forEach(function (F) {
        var x = khopCon(F, nao);
        var soDoi = daDoi ? F.filter(function (i) { return daDoi[x.gan[i]]; }).length : F.length, chua = soDoi < Math.ceil(F.length / 2);
        kq.con.push({ tile: x.tile, dx: x.dx, dy: x.dy, doi: soDoi, chua: chua }); d += x.dt;
        F.forEach(function (i) { kq.gan[i] = x.gan[i]; });
        if (x.tile < moc || chua) kq.dat = false;
        kq.nho = Math.min(kq.nho, x.tile);
      });
      kq.tile = d / tong; kq.dx = kq.con[0].dx; kq.dy = kq.con[0].dy; kq.moc = moc;
      if (!tot || kq.nho > tot.nho + 1e-9) tot = kq;
    });
    return tot;
  }
  function chuKy(b) { return b.loai === "thang" ? 360 : b.loai === "cn" && b.w === b.h ? 90 : 180; }      // xoay bao nhiêu độ thì mảnh trùng lại chính nó
  function kcDiem(p, P) {                         // điểm p cách đa giác lồi P bao xa (0 nếu nằm trong)
    var n = P.length, i, a, b, t, d, nho = 1e9, dau = 0, ngoai = false, c;
    for (i = 0; i < n; i++) {
      a = P[i]; b = P[(i + 1) % n];
      c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      if (c !== 0) { if (dau === 0) dau = c > 0 ? 1 : -1; else if ((c > 0 ? 1 : -1) !== dau) ngoai = true; }
      t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
      t = Math.max(0, Math.min(1, t));
      d = Math.hypot(p[0] - a[0] - t * (b[0] - a[0]), p[1] - a[1] - t * (b[1] - a[1]));
      if (d < nho) nho = d;
    }
    return ngoai ? nho : 0;
  }
  function nacXoay(k, i, f) {                    // các nấc xoay (độ, tăng dần trong [0, 360)) của mảnh thứ i (từ 0) nhóm k khi mặt lật là f
    var khoa = k + "|" + i + "|" + (f ? 1 : 0);
    if (nacNho[khoa]) return nacNho[khoa];
    var g = diemGoc(daGiac(BO[i]), f), nac = [], them = [], j, q, e, m, s;
    for (j = 0; j < 360; j += BUOC_XOAY) nac.push({ g: j, goc: true });
    for (j = 0; j < g.length; j++) {             // (a) cạnh nằm ngang hay dọc
      q = g[(j + 1) % g.length]; e = Math.atan2(q[1] - g[j][1], q[0] - g[j][0]) * 180 / Math.PI;
      for (m = 0; m < 4; m++) them.push(-e + 90 * m);
    }
    [i, SINH_DOI[i]].forEach(function (t) {      // (b) góc trong hình mẫu của nhóm; mặt lật khác thì lấy góc soi gương
      if (t === undefined || !GOC_MAU[k]) return;
      var a = GOC_MAU[k][t], r = (a[1] ? 1 : 0) === (f ? 1 : 0) || BO[i].loai !== "bh" ? a[0] : -a[0], chuKy = BO[i].loai === "thang" ? 360 : BO[i].loai === "cn" && BO[i].w === BO[i].h ? 90 : 180;
      for (m = 0; m < 360 / chuKy; m++) them.push(r + chuKy * m);
    });
    them.forEach(function (t) {
      s = Math.round((((t % 360) + 360) % 360) * 100) / 100; if (s >= 360) s = 0;
      var gan = null;
      nac.forEach(function (x) { var d = Math.abs(lechVong(x.g - s)); if (gan === null || d < gan.d) gan = { d: d, x: x }; });
      if (gan.d < 0.5) return;                    // đã có nấc này (hai góc cách nhau dưới nửa độ coi là một)
      if (gan.d < 4 && gan.x.goc && gan.x.g % 90 !== 0) { gan.x.g = s; gan.x.goc = false; }
      else nac.push({ g: s, goc: false });
    });
    return (nacNho[khoa] = nac.map(function (x) { return x.g; }).sort(function (x, y) { return x - y; }));
  }
  function nacGan(nac, r) {                      // nấc gần góc r nhất
    var tot = nac[0];
    nac.forEach(function (g) { if (Math.abs(lechVong(g - r)) < Math.abs(lechVong(tot - r)) - 1e-9) tot = g; });
    return tot;
  }
  function nacKe(nac, r, chieu) {                // nấc kế tiếp theo chiều +1 (xoay phải) hay −1 (xoay trái), tính từ góc r
    var tot = null, td = 0;
    nac.forEach(function (g) {
      var d = (((g - r) * chieu) % 360 + 360) % 360;      // quãng phải xoay theo chiều đó để tới nấc g
      if (d < 0.5 || d > 359.5) return;            // đang đứng ở nấc này
      if (tot === null || d < td) { tot = g; td = d; }
    });
    return tot === null ? r : tot;
  }

  /* ---------- tiện ích ---------- */
  var NS = "http://www.w3.org/2000/svg";
  function S(ten, tt, cha) {
    var e = document.createElementNS(NS, ten), k;
    for (k in tt) if (tt[k] !== null && tt[k] !== undefined) e.setAttribute(k, tt[k]);
    if (cha) cha.appendChild(e);
    return e;
  }
  function Sc(cha, x, y, lop, noiDung, tt) {       // chữ trong svg
    var t = S("text", { x: x, y: y, "class": lop }, cha), k;
    for (k in (tt || {})) t.setAttribute(k, tt[k]);
    t.textContent = noiDung;
    return t;
  }
  function H(ten, lop, chu, cha) {
    var e = document.createElement(ten);
    if (lop) e.className = lop;
    if (chu !== null && chu !== undefined) e.textContent = chu;
    if (cha) cha.appendChild(e);
    return e;
  }
  function $(id) { return document.getElementById(id); }
  /* 21/11 11:07, thầy: "tối ưu lại một lần cuối cùng". Đo trên trang thật: mỗi lần một mảnh nhích (mảnh đang được kéo gửi vị trí 12 lần một giây), điện thoại, tivi
     và máy giáo viên đều ghi lại vào màn hình mọi chữ, mọi mảnh, kể cả những thứ không đổi; cả nhóm cùng kéo thì máy yếu bị giật (đo: tivi còn 41 hình/giây,
     điện thoại còn 35 hình/giây). Ba hàm dưới chỉ ghi khi giá trị thật sự đổi; hình, chữ, cách chơi giữ nguyên. Chỉ dùng cho phần tử chỉ chứa chữ. */
  function chu(e, s) { s = String(s); if (e.textContent !== s) e.textContent = s; }
  function datTT(e, ten, v) { v = String(v); if (e.getAttribute(ten) !== v) e.setAttribute(ten, v); }
  function datLop(e, lop) { if (e.className !== lop) e.className = lop; }      // chỉ cho phần tử HTML
  function tat(e, b) { b = !!b; if (e.disabled !== b) e.disabled = b; }
  function an(e, b) { b = !!b; if (e.hidden !== b) e.hidden = b; }
  function kyNgoaiManh(d) {                       // chữ ký dữ liệu của một nhóm, không kể vị trí các mảnh (m): mảnh nhích thì chữ ký này không đổi
    var o = {}, t;
    for (t in d) if (t !== "m" && Object.prototype.hasOwnProperty.call(d, t)) o[t] = d[t];
    return JSON.stringify(o);
  }
  function diem(p) { return p.map(function (q) { return (q[0] * U).toFixed(2) + "," + (q[1] * U).toFixed(2); }).join(" "); }
  function f2(v) { return Math.round(v * 100) / 100; }
  function f3(v) { return Math.round(v * 1000) / 1000; }
  function goi(st) { return [f3(st.x), f3(st.y), chuanGoc(st.r), st.f ? 1 : 0, st.t || 0].join("|"); }
  function mo(s) {
    if (typeof s !== "string") return null;
    var a = s.split("|").map(Number);
    if (a.length < 4 || a.some(function (v) { return isNaN(v); })) return null;
    return { x: a[0], y: a[1], r: a[2], f: a[3] ? 1 : 0, t: a[4] || 0 };
  }
  function thamSo() {
    var o = {}, q = location.search.replace(/^\?/, "").split("&");
    q.forEach(function (c) { if (!c) return; var i = c.indexOf("="); o[decodeURIComponent(i < 0 ? c : c.slice(0, i))] = i < 0 ? "" : decodeURIComponent(c.slice(i + 1)); });
    return o;
  }
  function maNgauNhien(n) {
    var c = "abcdefghjkmnpqrstuvwxyz23456789", s = "", i;
    for (i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }
  function ngoiSao(cx, cy, R, r) {
    var p = [], i, a, d;
    for (i = 0; i < 10; i++) { a = Math.PI / 5 * i - Math.PI / 2; d = i % 2 ? r : R; p.push((cx + d * Math.cos(a)).toFixed(2) + "," + (cy + d * Math.sin(a)).toFixed(2)); }
    return p.join(" ");
  }
  function layMayId() {                          // mã riêng của máy này (mỗi thẻ trình duyệt một mã), dùng để báo có mặt
    var v = null; try { v = sessionStorage.getItem("xt-may"); } catch (e) { v = null; }
    if (!v) { v = maNgauNhien(6); try { sessionStorage.setItem("xt-may", v); } catch (e) { /* bỏ qua */ } }
    return v;
  }
  /* GIỮ SÁNG MÀN HÌNH. 25/11 08:01, thầy: "sẽ có một cái chế độ cài đặt mặc định là khi đã mở ứng dụng thì màn hình điện thoại sẽ không tắt".
     Cách chính: xin trình duyệt khóa giữ sáng (Wake Lock). Trình duyệt tự nhả khóa khi trang bị che hay tắt màn; nhả rồi thì xin lại lúc trang hiện lại,
     lúc đổi toàn màn hình và mỗi lần chạm vào màn hình. Cách dự phòng (máy không có Wake Lock: iPhone đời cũ, trình duyệt nằm trong Zalo, Facebook…;
     hoặc máy từ chối): phát lặp một đoạn phim rất ngắn, không hình không tiếng, không hiện ra (cách của thư viện NoSleep.js, MIT); máy đang phát phim thì
     không tắt màn hình. Trình duyệt chỉ cho phát sau khi người dùng chạm, nên phim bắt đầu từ lần chạm đầu tiên.
     <html data-giu-sang="khoa" | "phim" | ""> cho bài thử đọc. */
  var sangKhoa = null, sangXin = false, sangDuPhong = false, sangPhim = null, sangNap = null;
  function sangGhi(v) { datTT(document.documentElement, "data-giu-sang", v); }
  function sangNapPhim() {                        // tải 2 đoạn phim (js/giu-sang.js, 13 KB) và dựng thẻ video; chưa phát
    if (sangNap) return sangNap;
    sangNap = napScript("js/giu-sang.js?v=1").then(function () {
      var d = window.XT_GIU_SANG, v;
      function them(kieu, src) { var s = document.createElement("source"); s.src = src; s.type = "video/" + kieu; v.appendChild(s); }
      if (!d) return;
      v = document.createElement("video");
      v.setAttribute("title", "Giữ sáng màn hình"); v.setAttribute("playsinline", "");
      them("webm", d.webm); them("mp4", d.mp4);
      v.addEventListener("loadedmetadata", function () {
        if (v.duration <= 1) v.setAttribute("loop", "");      // đoạn webm: lặp
        else v.addEventListener("timeupdate", function () { if (v.currentTime > 0.5) v.currentTime = Math.random(); });      // đoạn mp4: nhảy về đầu
      });
      v.addEventListener("pause", function () { if (!sangKhoa) sangGhi(""); });
      sangPhim = v;
    }, function () { sangNap = null; });
    return sangNap;
  }
  function sangPhatPhim() {                       // phải gọi ngay trong lúc người dùng chạm
    var p;
    if (!sangPhim || !sangPhim.paused) return;
    try { p = sangPhim.play(); if (p && p.then) p.then(function () { sangGhi("phim"); }, function () { /* chưa được phép: lần chạm sau thử lại */ }); } catch (e) { /* bỏ qua */ }
  }
  function giuSang(cham) {                        // cham = true: gọi từ một lần chạm của người dùng
    try {
      if (document.visibilityState !== "visible") return;
      if (!sangDuPhong && navigator.wakeLock && navigator.wakeLock.request) {
        if (sangKhoa || sangXin) return;
        sangXin = true;
        navigator.wakeLock.request("screen").then(function (k) {
          sangXin = false; sangKhoa = k; sangGhi("khoa");
          k.addEventListener("release", function () { if (sangKhoa === k) { sangKhoa = null; sangGhi(""); } });
        }, function () { sangXin = false; sangDuPhong = true; sangNapPhim(); });      // máy từ chối (tiết kiệm pin, không cho phép…): sang cách dự phòng
        return;
      }
      sangDuPhong = true;
      if (cham && sangPhim) sangPhatPhim(); else sangNapPhim();
    } catch (e) { /* bỏ qua */ }
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") giuSang(); });   // quay lại trang thì xin giữ sáng màn hình lại
  document.addEventListener("fullscreenchange", function () { giuSang(); });
  ["pointerdown", "touchend", "click"].forEach(function (ten) {      // mỗi lần chạm: khóa đã bị nhả thì xin lại; cách dự phòng thì phát phim (iPhone tính lần chạm ở touchend, click)
    document.addEventListener(ten, function () { giuSang(true); }, { capture: true, passive: true });
  });

  /* ---------- nối các máy ---------- */
  function napScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = src; s.async = true; s.onload = function () { ok(); }; s.onerror = function () { bad(new Error("Không tải được " + src)); };
      document.head.appendChild(s);
    });
  }
  function noiFirebase(phong, bao) {
    var V = "10.12.5", goc = "https://www.gstatic.com/firebasejs/" + V + "/";
    /* 18/11 12:22 (thầy: "hơi bị lag mạng lúc mở"): index.html đã tải sẵn hai file thư viện ngay từ đầu, cùng lúc, và mở sẵn đường nối (window.XT_FB).
       Ở đây chỉ đợi việc đó xong. Không có XT_FB, hay tải hỏng, thì tải ở đây như trước, file nào đã có thì thôi (chạy lại một file thư viện là hỏng). */
    function napThuVien() {
      return (window.firebase ? Promise.resolve() : napScript(goc + "firebase-app-compat.js")).then(function () {
        return window.firebase && window.firebase.database ? null : napScript(goc + "firebase-database-compat.js");
      });
    }
    return (window.XT_FB ? window.XT_FB.then(null, napThuVien) : napThuVien()).then(function () {
      var app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(FB);
      var db = app.database(), base = db.ref(NHANH + "/" + phong), coMat = [], lechGio = 0;
      db.ref(".info/serverTimeOffset").on("value", function (sv) { lechGio = +sv.val() || 0; });     // đồng hồ của máy này lệch giờ máy chủ bao nhiêu: tivi và máy giáo viên đếm ngược theo cùng một giờ
      /* 25/11 06:46, thầy: "nếu trong lúc chơi lỡ rớt mạng thì có nối lại ngay được không". Thư viện tự nối lại và tự gửi nốt việc làm lúc mất mạng,
         nhưng đo trên trang thật (test/thu32.js, cắt mạng thật) còn 2 chỗ chậm:
         (1) mỗi lần thử hỏng thư viện chờ lâu hơn (tới 30 giây): mất mạng 75 giây, có mạng lại tivi chờ 31 giây mới nối;
         (2) đường nối chết lặng (wifi còn vạch, internet mất, không ai báo) thì thư viện không biết: trang vẫn ghi "Đã nối", tivi đứng hơn 60 giây.
         Sửa, một nhịp NHIP_MS chạy suốt (tab đang ẩn thì thôi, hiện lại là thư viện tự thử ngay):
         (1) đang mất nối: mỗi nhịp gọi goOnline. Lệnh này chỉ xóa thời gian chờ và thử ngay nếu chưa có lần thử nào đang chạy; lần thử đang chạy không bị ngắt.
         (2) đang nối: cứ DO_NHIP nhịp hỏi máy chủ một câu ở nút _do (ngoài mọi nhánh đang nghe nên get phải đi một vòng tới máy chủ; chỉ đọc, nút không có gì).
             Quá DO_CHO nhịp không có trả lời: coi như đường đã chết, đóng lại và mở đường mới (goOffline rồi goOnline); việc đang chờ ghi thư viện tự gửi lại
             trên đường mới. Sau đó nghỉ DO_NGHI nhịp rồi mới dò tiếp, để mạng rất chậm không bị đóng mở liên tục. Đếm theo nhịp chứ không theo đồng hồ:
             máy ngủ dậy (màn hình tắt rồi mở) không bị coi nhầm là đường chết. */
      var NHIP_MS = 2000, DO_NHIP = 3, DO_CHO = 5, DO_NGHI = 8;
      var daNoi = false, tungNoi = false, doRef = db.ref(NHANH + "/_do"), doSo = 0, doNhip = 0, doCho = 0, nghi = 0, soLamMoi = 0;
      var tuTay = 0, tayLuc = 0, TAY_CHO = 4;                // nút "Nối lại" (25/11 07:25): tuTay > 0 là vừa bấm nút, chữ báo là "Đang nối lại…"; quá TAY_CHO nhịp chưa nối được thì về "Mất mạng, đang nối lại…"
      db.ref(".info/connected").on("value", function (s) {
        daNoi = !!s.val(); if (daNoi) { tungNoi = true; tuTay = 0; }
        doSo++; doNhip = 0; doCho = 0;                     // đường nối vừa đổi: câu dò đang chờ (nếu có) không tính nữa
        bao(daNoi ? "ok" : tuTay ? "lai" : tungNoi ? "mat" : "cho");      // "mat": đang chơi thì rớt mạng; "cho": lần nối đầu lúc mở trang; "lai": vừa bấm nút Nối lại
        if (daNoi) coMat.forEach(function (c) { c.r.onDisconnect().remove(); c.r.set(c.v); });
      });
      setInterval(function () {
        if (document.hidden) return;
        if (!daNoi) {
          if (tuTay && ++tuTay > TAY_CHO) { tuTay = 0; bao(tungNoi ? "mat" : "cho"); }
          try { db.goOnline(); } catch (e) { /* bỏ qua */ }
          return;
        }
        tuTay = 0;
        if (nghi > 0) { nghi--; return; }
        if (doCho) {
          if (++doCho > DO_CHO) {
            doCho = 0; doSo++; nghi = DO_NGHI; soLamMoi++;
            try { document.documentElement.setAttribute("data-noi-lam-moi", soLamMoi); db.goOffline(); db.goOnline(); } catch (e) { /* bỏ qua */ }
          }
          return;
        }
        if (++doNhip >= DO_NHIP) {
          doNhip = 0; doCho = 1;
          var so = ++doSo, xong = function () { if (so === doSo) doCho = 0; };
          try { doRef.get().then(xong, xong); } catch (e) { doCho = 0; }
        }
      }, NHIP_MS);
      function loi(e) { if (e) { console.error(e); bao("loi", (e.code || e.message || e) + ""); } }
      return {
        kieu: "firebase",
        gio: function () { return Date.now() + lechGio; },
        set: function (p, v) { base.child(p).set(v, loi); },
        update: function (o) { base.update(o, loi); },            // nhiều đường dẫn một lần; giá trị null là xóa
        remove: function (p) { base.child(p).remove(loi); },
        on: function (p, cb) { (p ? base.child(p) : base).on("value", function (s) { cb(s.val()); }, loi); },
        mot: function (p, cb) { (p ? base.child(p) : base).once("value", function (s) { cb(s.val()); }, loi); },      // đọc một lần rồi thôi, không nghe tiếp
        /* Nút "Nối lại" (25/11 07:25, thầy: "nếu mất mạng thì bấm refresh để nhận tín hiệu lại"): đóng đường đang có, mở ngay một đường mới.
           KHÔNG tải lại trang: mọi thứ trên màn hình giữ nguyên, việc đang chờ ghi thư viện tự gửi lại, dữ liệu mới của máy chủ tự về.
           Đang mất nối mà bấm liên tiếp: chỉ 3 giây mới bỏ lần thử đang chạy một lần (mạng chậm không bị bấm hỏng), các lần khác chỉ giục thử ngay. */
        noiLai: function () {
          var gio = Date.now();
          tuTay = 1; doCho = 0; doSo++; nghi = DO_NGHI;
          try {
            if (daNoi || gio - tayLuc > 3000) { tayLuc = gio; db.goOffline(); db.goOnline(); } else db.goOnline();
          } catch (e) { /* bỏ qua */ }
          if (!daNoi) bao("lai");
        },
        coMat: function (p, v) {                  // báo máy này đang có mặt (mất nối thì máy chủ tự xóa). v = giá trị ghi, bỏ trống là true; gọi lại cùng đường dẫn để đổi giá trị
          var c = null;
          coMat.forEach(function (x) { if (x.p === p) c = x; });
          if (!c) { c = { p: p, r: base.child(p), v: true }; coMat.push(c); c.r.onDisconnect().remove(); }
          c.v = v === undefined ? true : v; c.r.set(c.v);
        }
      };
    });
  }
  function noiCungMay(phong, bao) {                // các thẻ trên cùng một máy: BroadcastChannel + localStorage
    var KHOA = "xt-" + phong, nghe = [], kenh = null, cay = doc(), daCoMat = {};
    function doc() { try { return JSON.parse(localStorage.getItem(KHOA) || "{}") || {}; } catch (e) { return {}; } }
    function luu() { try { localStorage.setItem(KHOA, JSON.stringify(cay)); } catch (e) { /* bỏ qua */ } }
    function lay(p) {
      var o = cay, ps = p ? p.split("/") : [], i;
      for (i = 0; i < ps.length; i++) { if (o === null || typeof o !== "object") return null; o = o[ps[i]]; }
      return o === undefined ? null : JSON.parse(JSON.stringify(o));
    }
    function dat(p, v) {
      var ps = p.split("/"), o = cay, i;
      for (i = 0; i < ps.length - 1; i++) { if (o[ps[i]] === null || typeof o[ps[i]] !== "object") o[ps[i]] = {}; o = o[ps[i]]; }
      if (v === null || v === undefined) delete o[ps[ps.length - 1]]; else o[ps[ps.length - 1]] = v;
    }
    function phat(p) {
      nghe.forEach(function (n) {
        if (!n.p || !p || n.p === p || n.p.indexOf(p + "/") === 0 || p.indexOf(n.p + "/") === 0) { try { n.cb(lay(n.p)); } catch (e) { console.error(e); } }
      });
    }
    function ghi(p, v) { cay = doc(); dat(p, v); luu(); phat(p); if (kenh) { try { kenh.postMessage({ p: p }); } catch (e) { /* bỏ qua */ } } }
    try { kenh = new BroadcastChannel(KHOA); kenh.onmessage = function (e) { cay = doc(); phat(e.data && e.data.p || ""); }; } catch (e) { kenh = null; }
    window.addEventListener("storage", function (e) { if (e.key === KHOA) { cay = doc(); phat(""); } });
    bao("cungmay");
    return Promise.resolve({
      kieu: "cungmay",
      gio: function () { return Date.now(); },
      set: ghi,
      update: function (o) { cay = doc(); Object.keys(o).forEach(function (p) { dat(p, o[p]); }); luu(); phat(""); if (kenh) { try { kenh.postMessage({ p: "" }); } catch (e) { /* bỏ qua */ } } },
      remove: function (p) { ghi(p, null); },
      on: function (p, cb) { nghe.push({ p: p, cb: cb }); cb(lay(p)); },
      mot: function (p, cb) { cb(lay(p)); },
      noiLai: function () { cay = doc(); phat(""); },       // chạy thử trên một máy: đọc lại kho, vẽ lại
      coMat: function (p, v) { ghi(p, v === undefined ? true : v); if (!daCoMat[p]) { daCoMat[p] = 1; window.addEventListener("pagehide", function () { ghi(p, null); }); } }
    });
  }
  /* Nút "Nối lại" (25/11 07:25): nút tròn mũi tên vòng như nút tải lại của trình duyệt, cạnh dòng trạng thái nối; có trên điện thoại các nhóm, máy giáo viên, tivi.
     Bấm: mũi tên quay một lúc, máy nối lại ngay (T.noiLai), trang không tải lại. Riêng lúc thư viện nối máy chủ không tải được từ đầu (chữ "Mất kết nối")
     thì không còn gì để nối lại: nút tải lại trang. */
  function nutNoiLai(nut, layT, layKieu) {
    var hen = 0;
    nut.onclick = function () {
      var t = layT();
      nut.classList.add("quay"); clearTimeout(hen); hen = setTimeout(function () { nut.classList.remove("quay"); }, 1250);
      datTT(document.documentElement, "data-noi-bam", (+document.documentElement.getAttribute("data-noi-bam") || 0) + 1);
      if (layKieu() === "loi") { location.reload(); return; }
      if (t && t.noiLai) t.noiLai();
    };
  }
  function noi(phong, thu, bao) {
    if (thu || location.protocol === "file:") return noiCungMay(phong, bao);
    bao("cho");
    return noiFirebase(phong, bao).catch(function (e) { console.error(e); bao("loi", "Không nối được máy chủ"); return noiCungMay(phong, function () {}); });
  }

  /* ---------- vẽ mảnh ---------- */
  function veManh(cha, goc, mau, so, coSo) {
    var g = S("g", { "class": "manh", "data-so": so }, cha);
    S("polygon", { "class": "cham", points: diem(goc) }, g);
    S("polygon", { "class": "than", points: diem(goc), fill: mau }, g);
    if (coSo) { var t = S("text", { "class": "so", "text-anchor": "middle", "dominant-baseline": "central" }, g); t.textContent = so; }
    return g;
  }
  function datManh(g, goc, st) {                  // đặt ngay, không chuyển động
    /* 21/11: g.xt nhớ lần ghi trước của chính hàm này (không chỗ nào khác ghi transform, points của mảnh). Mảnh không đổi chỗ thì không ghi gì;
       hình dáng (points) chỉ đổi khi lật mảnh; số trên mảnh chỉ xoay lại khi góc đổi. */
    var tf = "translate(" + (st.x * U).toFixed(2) + " " + (st.y * U).toFixed(2) + ") rotate(" + st.r + ")", f = st.f ? 1 : 0, cu = g.xt || (g.xt = { tf: null, f: -1, r: null, goc: null });
    if (cu.tf !== tf) { g.setAttribute("transform", tf); cu.tf = tf; }
    if (cu.f !== f || cu.goc !== goc) {
      var p = diem(diemGoc(goc, st.f));
      g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p);
      cu.f = f; cu.goc = goc;
    }
    if (g.children[2] && cu.r !== st.r) { g.children[2].setAttribute("transform", "rotate(" + (-st.r) + ")"); cu.r = st.r; }
  }
  function svgManh(cha, m, mau, pxCm, le) {       // hình một mảnh trong svg riêng (khay, ô nhập)
    var g = daGiac(m), kh = khung(g);
    le = le === undefined ? 0.2 : le;
    var sv = S("svg", { viewBox: [(kh[0] - le) * U, (kh[1] - le) * U, (kh[2] - kh[0] + 2 * le) * U, (kh[3] - kh[1] + 2 * le) * U].join(" ") }, cha);
    sv.style.width = ((kh[2] - kh[0] + 2 * le) * pxCm).toFixed(1) + "px"; sv.style.height = ((kh[3] - kh[1] + 2 * le) * pxCm).toFixed(1) + "px";
    S("polygon", { "class": "than", points: diem(g), fill: mau }, sv);
    return sv;
  }

  /* ---------- vẽ tấm thiệp: khung tiêu đề kiểu nhãn vở (bản in 13/11 còn vạch ngăn chuỗi hạt và dòng chấm ghi lời chúc; thầy bỏ 15/11 22:33) ---------- */
  function duongNhan(X0, Y0, X1, Y1, e, R) {      // chữ nhật khuyết 4 góc theo cung tròn tâm ở góc; e = lùi vào trong, R = bán kính cung
    var d = Math.sqrt(R * R - e * e), A = "A" + R + " " + R + " 0 0 0 ";
    return "M" + (X0 + d) + " " + (Y0 + e) + "L" + (X1 - d) + " " + (Y0 + e) + A + (X1 - e) + " " + (Y0 + d) +
      "L" + (X1 - e) + " " + (Y1 - d) + A + (X1 - d) + " " + (Y1 - e) + "L" + (X0 + d) + " " + (Y1 - e) + A + (X0 + e) + " " + (Y1 - d) +
      "L" + (X0 + e) + " " + (Y0 + d) + A + (X0 + d) + " " + (Y0 + e) + "Z";
  }
  function thoiTam(cx, cy, w, h) { return [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]].map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "); }
  function veTrangTri(g, k) {
    var bc = THIEP[NHOM[k]], kh = bc.khung, v = bc.viet, i, j;
    g = S("g", { transform: "scale(" + (1 / TL_MANH).toFixed(5) + ")" }, g);      // vẽ theo cm thật của thiệp; tấm thiệp ngoài kia tính theo cm của mảnh
    var x0 = kh[0] * U, y0 = kh[1] * U, x1 = kh[2] * U, y1 = kh[3] * U, yc = (y0 + y1) / 2, VANG = "#fdb730", CHU = "#893431";
    S("path", { d: duongNhan(x0, y0, x1, y1, 0, 8), fill: "#fff", stroke: CHU, "stroke-width": 0.7 }, g);
    S("path", { d: duongNhan(x0, y0, x1, y1, 2, 10), fill: "none", stroke: VANG, "stroke-width": 0.35 }, g);
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(function (q) {
      var cx = q[0] + (q[0] === x0 ? 3 : -3), cy = q[1] + (q[1] === y0 ? 3 : -3);
      S("polygon", { points: thoiTam(cx, cy, 5, 5), fill: VANG, stroke: CHU, "stroke-width": 0.25 }, g);
      S("polygon", { points: thoiTam(cx, cy, 1.6, 1.6), fill: PAL["do"] }, g);
    });
    [x0, x1].forEach(function (gx) {
      S("polygon", { points: thoiTam(gx, yc, 5, 9.5), fill: PAL["do"], stroke: CHU, "stroke-width": 0.28 }, g);
      S("polygon", { points: thoiTam(gx, yc, 2, 4), fill: VANG }, g);
    });
    Sc(g, (x0 + x1) / 2, yc - 6.75, "tieu-de", DONG1, { "text-anchor": "middle", dy: "0.35em" });
    Sc(g, (x0 + x1) / 2, yc + 6.75, "tieu-de", DONG2, { "text-anchor": "middle", dy: "0.35em", textLength: 248, lengthAdjust: "spacingAndGlyphs" });
    if (!bc.ngan || !v) return;                   // từ 15/11 22:33 tấm thiệp không còn chuỗi hạt và chỗ ghi lời chúc; phần dưới chỉ vẽ cho bố cục cũ
    // vạch ngăn: chuỗi hạt hình học trên sợi dây, giữa là ngôi sao
    var doc = bc.ngan[0] === "doc", vt = bc.ngan[1], L0 = R2, L1 = (doc ? bc.H : bc.W) - R2, mid = (L0 + L1) / 2;
    function P(t, n2) { return doc ? [(vt + (n2 || 0)) * U, t * U] : [t * U, (vt + (n2 || 0)) * U]; }
    function pts(a) { return a.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "); }
    [[L0, mid - 0.66 * R2], [mid + 0.66 * R2, L1]].forEach(function (d) {
      var a = P(d[0]), b = P(d[1]); S("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#b89a74", "stroke-width": 0.5 }, g);
    });
    var r = 0.21 * R2, buoc = 0.72 * R2, CHUOI = ["do", "vang", "duong", "la", "cam", "hong"], n = Math.floor((mid / R2 - 1.05 - 1.0) / 0.72), VIEN = "#573f2e";
    [-1, 1].forEach(function (ben) {
      for (i = 0; i <= n; i++) {
        var t = mid + ben * (1.05 * R2 + i * buoc), loai = i % 4, mau = PAL[CHUOI[(i + (ben > 0 ? 0 : 3)) % CHUOI.length]], c;
        if (loai === 0) S("polygon", { points: pts([P(t, -r * 1.25), P(t + r * 0.8), P(t, r * 1.25), P(t - r * 0.8)]), fill: mau, stroke: VIEN, "stroke-width": 0.3 }, g);
        else if (loai === 1) { c = P(t); S("circle", { cx: c[0], cy: c[1], r: r * 0.95 * U, fill: mau, stroke: VIEN, "stroke-width": 0.3 }, g); }
        else if (loai === 2) S("polygon", { points: pts([P(t - r * 0.85, -r * 0.85), P(t + r * 0.85, -r * 0.85), P(t + r * 0.85, r * 0.85), P(t - r * 0.85, r * 0.85)]), fill: mau, stroke: VIEN, "stroke-width": 0.3 }, g);
        else S("polygon", { points: pts([P(t, -r * 1.05), P(t + r * 1.05, r * 0.8), P(t - r * 1.05, r * 0.8)]), fill: mau, stroke: VIEN, "stroke-width": 0.3 }, g);
      }
    });
    var cs = P(mid);
    S("polygon", { points: ngoiSao(cs[0], cs[1], 0.6 * R2 * U, 0.25 * R2 * U), fill: PAL.vang, stroke: VIEN, "stroke-width": 0.35 }, g);
    // chỗ ghi lời chúc: nhãn và các dòng chấm cách nhau 0,8 cm
    Sc(g, (v[0] + 0.1) * U, (v[1] - 0.17) * U, "loi-chuc", "Nhóm " + k);
    var soDong = Math.round((v[3] - v[1]) / 0.8);
    for (j = 1; j <= soDong; j++) S("line", { "class": "cham-dong", x1: v[0] * U, y1: (v[1] + j * 0.8) * U, x2: v[2] * U, y2: (v[1] + j * 0.8) * U }, g);
  }
  function veLuoi(g, dan) {                       // lưới ô 1 cm trên chỗ dán hình, cứ 5 ô có một vạch đậm hơn
    var i, x, y, w = dan[2] - dan[0], h = dan[3] - dan[1];
    S("rect", { "class": "luoi-nen", x: dan[0] * U, y: dan[1] * U, width: w * U, height: h * U }, g);
    for (i = 0; i <= Math.floor(w + 1e-6); i++) { x = (dan[0] + i) * U; S("line", { "class": i % 5 ? "luoi-net" : "luoi-net dam", x1: x, y1: dan[1] * U, x2: x, y2: dan[3] * U }, g); }
    for (i = 0; i <= Math.floor(h + 1e-6); i++) { y = (dan[1] + i) * U; S("line", { "class": i % 5 ? "luoi-net" : "luoi-net dam", x1: dan[0] * U, y1: y, x2: dan[2] * U, y2: y }, g); }
    S("rect", { "class": "luoi-vien", x: dan[0] * U, y: dan[1] * U, width: w * U, height: h * U }, g);
  }
  /* Phần lưới hiện trên một máy. 14/11 14:03 lưới nới ra kín màn hình; từ 15/11 18:31 bàn xếp là cả tấm thiệp A3: máy nào cũng hiện đúng BOCUC.ban. */
  function cuaSo(bc) { return bc.ban.slice(); }
  function veLuoiRong(g, cua, dan, vien) {        // lưới ô 1 cm phủ kín cửa sổ cua; vạch trùng với lưới của chỗ dán hình dan (cứ 5 ô một vạch đậm, tính từ góc chỗ dán)
    var i, v;
    g.textContent = "";
    S("rect", { "class": "luoi-nen", x: cua[0] * U, y: cua[1] * U, width: (cua[2] - cua[0]) * U, height: (cua[3] - cua[1]) * U }, g);
    for (i = Math.ceil(cua[0] - dan[0] - 1e-6); i <= Math.floor(cua[2] - dan[0] + 1e-6); i++) { v = (dan[0] + i) * U; S("line", { "class": ((i % 5) + 5) % 5 ? "luoi-net" : "luoi-net dam", x1: v, y1: cua[1] * U, x2: v, y2: cua[3] * U }, g); }
    for (i = Math.ceil(cua[1] - dan[1] - 1e-6); i <= Math.floor(cua[3] - dan[1] + 1e-6); i++) { v = (dan[1] + i) * U; S("line", { "class": ((i % 5) + 5) % 5 ? "luoi-net" : "luoi-net dam", x1: cua[0] * U, y1: v, x2: cua[2] * U, y2: v }, g); }
    if (vien) S("rect", { "class": "luoi-vien", x: cua[0] * U, y: cua[1] * U, width: (cua[2] - cua[0]) * U, height: (cua[3] - cua[1]) * U }, g);
  }

  /* =====================================================================
     ĐIỆN THOẠI
     ===================================================================== */
  /* Màn chọn nhóm. Thầy dặn 15/11 13:42 và 13:44: "khi quét vẫn hay dính qr nhóm khác" → "vẫn 4 mã nhưng vẫn 4 phía như trên. nhưng tuy là 4 mã
     nhưng mã giống nhau hết. hiện xong máy sẽ tự chọn nhóm nhưng nhóm có thể chọn lại nhóm khác rồi mới bấm xác nhận".
     4 mã trên tivi là MỘT mã (?p=<phòng>&n=0) nên máy không biết em ở nhóm nào. Máy chọn sẵn nhóm đang có ít máy nhất (bằng nhau thì nhóm số nhỏ),
     tính cả các máy còn đang ở màn này (cho/<máy> = nhóm đang chọn) để mấy máy quét cùng lúc không cùng nhận một nhóm.
     Máy chỉ tự chọn MỘT lần (không tự đổi lúc em đang nhìn). Em chạm nhóm khác để đổi; bấm Xác nhận mới vào nhóm. */
  var MAU_NHOM = { 1: "#d9463c", 2: "#e07b2a", 3: "#3d8fc4", 4: "#4f9140" };
  /* Nhớ nhóm máy này đã chọn trong phòng này ("<phòng>:<nhóm>"). Chạy thử trên một máy (thu=1) thì nhớ riêng từng thẻ, vì các thẻ đóng vai các máy khác nhau. */
  function khoNhom(thu) { return thu ? sessionStorage : localStorage; }
  function nhomDaChon(phong, thu) {
    try { var a = (khoNhom(thu).getItem("xt-nhom") || "").split(":"); return a[0] === phong && +a[1] >= 1 && +a[1] <= 4 ? +a[1] : 0; } catch (e) { return 0; }
  }
  function nhoNhom(phong, k, thu) { try { khoNhom(thu).setItem("xt-nhom", phong + ":" + k); } catch (e) { /* bỏ qua */ } }
  /* Chặn phím quay lại của điện thoại trong trang của nhóm. Trình duyệt chỉ cho chặn sau khi em đã chạm vào trang ít nhất một lần:
     lần chạm đầu tiên trang thêm một mốc vào lịch sử; em bấm quay lại thì trình duyệt lùi về mốc trước, trang lập tức đi tới lại mốc đó, nên em vẫn ở nguyên trang.
     khiBam: việc làm thêm lúc em bấm quay lại (đóng bảng đang mở). */
  function chanQuayLai(khiBam) {
    var co = false;
    function dat() { if (co) return; try { history.pushState({ xt: 1 }, ""); co = true; } catch (e) { /* bỏ qua */ } }
    window.addEventListener("popstate", function (e) {
      if (e.state && e.state.xt) return;         // vừa đi tới lại mốc chặn
      if (khiBam) { try { khiBam(); } catch (er) { /* bỏ qua */ } }
      if (co) { try { history.go(1); } catch (er2) { co = false; } }
    });
    ["pointerdown", "keydown"].forEach(function (t) { window.addEventListener(t, dat, true); });
  }
  function chonNhom(ts, phong) {
    var chon = 0, mayChon = false, T = null, nut = {}, mayId = layMayId(), daTinh = false, cu = nhomDaChon(phong, ts.thu);
    $("dtChon").hidden = false;
    function ve() {
      [1, 2, 3, 4].forEach(function (i) { nut[i].classList.toggle("dang-chon", i === chon); nut[i].setAttribute("aria-pressed", i === chon ? "true" : "false"); });
      if (chon) document.body.setAttribute("data-nhom", chon); else document.body.removeAttribute("data-nhom");
      $("dtChonChu").textContent = !chon ? "Em chạm vào nhóm của mình." : mayChon === "cu" ? "Lúc nãy máy này ở Nhóm " + chon + ". Chưa đúng thì em chạm vào nhóm của mình." : mayChon ? "Máy chọn sẵn Nhóm " + chon + ". Chưa đúng thì em chạm vào nhóm của mình." : "Em đã chọn Nhóm " + chon + ".";
      $("dtChonXong").disabled = !chon;
      $("dtChonXong").textContent = chon ? "Xác nhận: Nhóm " + chon : "Xác nhận";
    }
    function dat(i, may) { chon = i; mayChon = may; ve(); if (T) T.coMat("cho/" + mayId, chon); }
    [1, 2, 3, 4].forEach(function (i) {
      var b = H("button", "nut chon-nhom", "Nhóm " + i, $("dtChonNut"));
      b.style.setProperty("--m", MAU_NHOM[i]);
      b.onclick = function () { dat(i, false); };
      nut[i] = b;
    });
    /* 16/11 10:02, thầy: "khi các em bấm phím quay lại của điện thoại thì bị thoát ra phần chọn nhóm ??? có cách nào để không bị như vậy không?"
       Vào nhóm bằng location.replace: màn chọn nhóm không còn nằm trong lịch sử của trình duyệt. Máy nhớ nhóm đã chọn (nhoNhom): lỡ thoát hẳn rồi quét lại mã
       thì màn này chọn sẵn đúng nhóm cũ. Trong trang của nhóm, phím quay lại bị chặn (chanQuayLai). */
    $("dtChonXong").onclick = function () {
      if (!chon) return;
      nhoNhom(phong, chon, ts.thu);
      location.replace(location.pathname + "?p=" + encodeURIComponent(phong) + "&n=" + chon + (ts.thu ? "&thu=1" : ""));
    };
    if (cu) dat(cu, "cu");
    ve();
    noi(phong, ts.thu, function () {}).then(function (t) {
      T = t;
      T.mot("", function (d) {                      // 21/11: đọc một lần (trước đây nghe cả phòng suốt lúc em còn ở màn này: mọi mảnh của 4 nhóm nhích đều tải về máy em dù không dùng)
        if (daTinh) return;
        daTinh = true;
        if (chon) { T.coMat("cho/" + mayId, chon); return; }      // em đã tự chạm một nhóm trước khi nối xong
        d = d || {};
        var tai = [0, 0, 0, 0, 0], cho = d.cho || {}, tot = 1;
        [1, 2, 3, 4].forEach(function (i) {
          var co = d["n" + i] && d["n" + i].co;
          if (co && typeof co === "object") tai[i] = Object.keys(co).filter(function (id) { return id !== mayId; }).length;
        });
        if (typeof cho === "object") Object.keys(cho).forEach(function (id) { var v = +cho[id]; if (id !== mayId && v >= 1 && v <= 4) tai[v]++; });
        [2, 3, 4].forEach(function (i) { if (tai[i] < tai[tot]) tot = i; });
        dat(tot, true);
      });
    });
  }

  var dtCaoDat = false;
  function dtCao() {                                // 27/11 14:46: chiều cao trang điện thoại = phần thật sự nhìn thấy (có máy 100dvh vẫn cao hơn, dòng cuối bị che)
    var vv = window.visualViewport, hen = 0;
    function dat() { var c = vv ? vv.height : window.innerHeight; if (c > 200) document.documentElement.style.setProperty("--dt-cao", Math.round(c) + "px"); }
    function sau() { clearTimeout(hen); hen = setTimeout(dat, 60); }
    if (dtCaoDat) return;
    dtCaoDat = true;
    dat(); window.addEventListener("resize", sau); window.addEventListener("orientationchange", sau); if (vv) vv.addEventListener("resize", sau);
  }
  function chayDienThoai(ts) {
    var k = parseInt(ts.n, 10), phong = ts.p;
    document.body.className = "dt";
    $("dt").hidden = false;
    dtCao();
    if (!phong) { $("dtCho").hidden = false; $("dtChoChu").textContent = "Thầy mở trang này trên tivi, rồi các em quét mã QR trên tivi."; return; }
    if (!(k >= 1 && k <= 4)) { chonNhom(ts, phong); return; }
    document.body.setAttribute("data-nhom", k);
    var bc = BOCUC[NHOM[k]], dan = bc.dan, mau = MAU[k], goc = BO.map(daGiac);
    var T = null, nhap = {}, sai = {}, khoa3 = {}, daMo = false, xong = false, man = "nhap", lanDau = true, H1 = {}, h1Nhom = 0, du10Cu = null;
    var manh = [], chon = null, keo = null, xoay2 = null, tro = {}, guiCho = {}, guiLuc = {}, chuaNhan = null, baoDe = null, quaTo = null, dangChot = false;
    var to = window.innerWidth >= 700 && window.innerHeight >= 700;
    var mayId = layMayId();
    /* 16/11 10:02, thầy: "trong app của giáo viên tôi có quyền truy cập vào từng màn hình điện thoại của các em. ngoài ra khi truy cập vào màn hình đt của từng em
       thì của tôi sẽ có thêm nút Hình AI gợi ý, khi tôi bấm vô thì sẽ hiện ra mẫu AI xếp sẵn" và "một khi đã bấm hoàn thành thì chỉ có giáo viên mới có quyền
       mở chức năng sửa lại hình cho các em".
       Máy giáo viên mở màn hình của nhóm bằng link ?p=<phòng>&n=<nhóm>&gv=<mã giáo viên> (nút "Xem màn hình" trên trang giáo viên): cùng trang này, cùng bài của nhóm
       (các máy trong một nhóm dùng chung một bài), thêm dải "Thầy đang xem màn hình Nhóm k", nút "Hình AI gợi ý" ở bàn xếp, nút "Mở cho nhóm sửa lại hình" ở màn thiệp đã xong.
       Máy giáo viên không tính là máy của nhóm (không báo có mặt), không bị chặn phím quay lại. Mã giáo viên sai thì quay về trang giáo viên (trang đó nhắc quét lại mã). */
    var laGV = ts.gv !== undefined, gvDung = false;
    function duongGV() { return location.pathname + "?p=" + encodeURIComponent(phong) + "&gv=" + encodeURIComponent(ts.gv) + (ts.thu ? "&thu=1" : ""); }
    function veGV() {                              // nút chỉ giáo viên có
      $("dtGoiY").hidden = !gvDung;
      $("thiepSua").hidden = !gvDung;
      if (O && O.kh) veO();                        // 26/11: mã giáo viên vừa được nhận lúc bảng nhập đang mở: hiện nút "AI hỗ trợ nhóm"
      veAi();                                      // 26/11 11:21: nút "AI hỗ trợ nhóm nhiệm vụ 1"
      $("thiepChu").textContent = gvDung ? "Nhóm đã bấm Hoàn thành. Chỉ thầy mở lại được cho nhóm sửa hình." : "Hình đã lên thiệp. Cả nhóm nhìn số trên từng mảnh để dán giấy nhé. Muốn sửa lại hình thì báo giáo viên.";
    }
    if (laGV) {
      document.body.classList.add("xem-gv");
      $("dtGV").hidden = false; $("dtGVChu").textContent = "Thầy đang xem màn hình Nhóm " + k;
      $("dtGVVe").onclick = function () { location.href = duongGV(); };
    } else {
      nhoNhom(phong, k, ts.thu);
      chanQuayLai(function () { if (!$("o").hidden) dongO(); else if (!$("hop").hidden) dongHop(); });
    }
    $("dtNhom").textContent = "Nhóm " + k;
    $("dtChinh").hidden = false;
    giuSang();
    /* Thầy dặn 15/11 19:15: "Khi các em nhập đúng hết thì hiện ra dòng Chúc mừng nhóm 1 đã hoàn thành rất tốt bước 1. rồi sau đó các em báo giáo viên,
       giáo viên sẽ mở bước 2 cho các em." Từ đó đúng phần còn lại KHÔNG tự mở bàn xếp nữa: chỉ khi giáo viên mở (n<k>/mo = 1). */
    function duocXep() { return daMo; }
    function du7() { return KHOA_MANH.every(function (kh) { return nhap[kh]; }); }
    function biKhoa(kh) { return !!khoa3[kh] && !nhap[kh]; }      // mục đã sai đủ 3 lần, đang chờ GVCN mở khóa

    /* ---------------- bước 1: nhập số đo ---------------- */
    var oManh = {}, oDong = {};
    KHOA_MANH.forEach(function (kh) {
      var M = MUC[kh], b = H("button", "o-manh", null, $("nhapManh"));
      b.setAttribute("aria-label", M.ten);
      var sv = svgManh(b, M.manh, MAU_XAM, to ? 10 : 7);
      H("span", "o-dau", null, b);
      if (M.so.length > 1) H("span", "o-hai", "2 mảnh", b);
      H("span", "o-kq", null, b);
      b.onclick = function () { moO(kh); };
      oManh[kh] = { nut: b, than: sv.querySelector(".than") };
    });
    ["tong", "thiep", "con"].forEach(function (kh) {
      var b = H("button", "dong", null, $("nhapDong"));
      H("span", "dong-ten", MUC[kh].ten, b); H("span", "dong-kq", null, b);
      b.onclick = function () { moO(kh); };
      oDong[kh] = b;
    });
    function khoaMuc(kh) {                         // mục chưa nhập được vì thiếu mục trước
      if (kh === "tong") return du7() ? "" : "Nhập đúng đủ 7 mảnh trước";
      if (kh === "con") return nhap.tong && nhap.thiep ? "" : "Cần tổng và tấm thiệp trước";
      return "";
    }
    function veNhap() {
      KHOA_MANH.forEach(function (kh) {
        var M = MUC[kh], o = oManh[kh], d = nhap[kh], kb = biKhoa(kh);
        o.nut.classList.toggle("xong", !!d); o.nut.classList.toggle("bi-khoa", kb);
        datTT(o.than, "fill", d ? mau[M.so[0] - 1] : MAU_XAM);
        chu(o.nut.querySelector(".o-dau"), d ? "✓" : "");      // 16/11 22:08, thầy: "bỏ cái mục dấu sao đi nhé" → đúng lần nào cũng là dấu ✓
        chu(o.nut.querySelector(".o-kq"), d ? M.dt + " cm²" : kb ? "Đã khóa" : "");
      });
      ["tong", "thiep", "con"].forEach(function (kh) {
        var b = oDong[kh], d = nhap[kh], kq = b.querySelector(".dong-kq"), khoa = khoaMuc(kh), o = MUC[kh].o, kb = biKhoa(kh);
        b.classList.toggle("xong", !!d); b.classList.toggle("khoa", !d && !!khoa && !kb); b.classList.toggle("bi-khoa", kb);
        chu(kq, d ? "✓ " + o[o.length - 1].dung + " cm²" : kb ? CHU_KHOA : khoa ? khoa : "Chạm để nhập");
      });
      var n = demDung(nhap), loi = $("nhapLoi"), chuLoi, lopLoi = "nhap-loi";
      if (nhap.con) { chuLoi = "Đúng hết rồi! Diện tích phần còn lại của tấm thiệp là " + CON + " cm²."; /* 16/11 10:02 thầy đặt tên: "diện tích phần còn lại của tấm thiệp" */ lopLoi += " tot"; }
      else if (THU_TU.some(biKhoa)) { chuLoi = "Có mục nhập sai " + SAI_KHOA + " lần nên đã khóa. " + CHU_KHOA + "."; lopLoi += " xau"; }
      else if (daMo) chuLoi = "Giáo viên đã mở nhiệm vụ 2. Các em vẫn nhập tiếp số đo được. Đã đúng " + n + "/10.";
      else chuLoi = n ? "Đã đúng " + n + "/10. Chạm mảnh chưa có màu để nhập tiếp." : "Đo từng mảnh, tính diện tích rồi chạm vào mảnh để nhập. Hai mảnh giống nhau chỉ nhập một lần.";
      datLop(loi, lopLoi); chu(loi, chuLoi);
      var du10 = n === THU_TU.length;
      an($("nhapMung"), !(du10 && !daMo));
      an(loi, du10 && !daMo);                 // lúc có lời chúc mừng thì lời chúc nằm ở chỗ dòng nhắc (đầu màn), dòng nhắc ẩn
      var hg = hangNv1(H1, k);                     // 16/11 22:08: lời chúc theo thứ tự về đích (chưa biết thứ hạng thì tạm dùng câu thứ ba)
      chu($("nhapMung1"), loiMung(k, hg || 3).join(" ") + ".");
      datTT($("nhapMung"), "data-hang", hg);
      if (du10 && du10Cu === false && !daMo) tungGiay($("dtGiay"), 46, window.innerHeight + 40);      // nhóm vừa nhập đúng mục cuối cùng (không chạy lại khi mở lại trang)
      if (!lanDau || du10) du10Cu = du10;
      tat($("nhapSang"), !duocXep());
      an($("nhapDuoi"), !duocXep());          // nút sang bước 2 chỉ hiện khi giáo viên đã mở bước 2 (trước đó là một nút mờ không bấm được, rối mắt)
      veAi();
      if (O.kh) veO();
      xetHopAi();
    }
    /* 26/11 11:21, thầy: "trên app giáo viên, ngay ngoài màn hình nhóm một cũng sẽ có nút AI hỗ trợ nhóm nhiệm vụ 1" (kèm ảnh màn "Thầy đang xem màn hình Nhóm 1").
       Nút nằm ở chân màn nhiệm vụ 1, chỉ khi thầy đang Xem ĐT nhóm (mã giáo viên đúng) và nhóm chưa đúng đủ 10 mục. Bấm thì hỏi lại; thầy đồng ý thì mọi mục còn lại
       (kể cả mục đang khóa) được ghi là đúng cho nhóm trong MỘT lần ghi, như các em tự nhập đúng (kèm giờ về đích), điện thoại của nhóm và tivi thấy ngay. */
    function veAi() {
      an($("nhapAi"), !gvDung || demDung(nhap) === THU_TU.length);
      tat($("nhapAiNut"), !T);
      $("nhapAi").classList.toggle("tren", !$("nhapDuoi").hidden);      // nút "Sang nhiệm vụ 2" đang hiện ngay dưới: bỏ khoảng trống ở chân nút AI
    }
    /* Bảng hỏi của hai nút AI (moHop với ai: { kh } hoặc { nv1: 1 }). Trước 26/11 bảng hỏi chỉ dùng ở bàn xếp nên doiMan đóng nó mỗi lần dữ liệu của nhóm đổi
       lúc đang ở màn nhiệm vụ 1; nay bảng hỏi của nút AI ở lại tới khi thầy bấm, trừ khi việc đã xong (nhóm vừa nhập đúng mục đó, mục vừa bị khóa, nhóm đã đúng đủ
       10 mục) hay máy đổi màn. */
    var hopAi = null;
    function xetHopAi() {
      if (!hopAi || $("hop").hidden) return;
      if (hopAi.kh ? O.kh !== hopAi.kh || nhap[hopAi.kh] || biKhoa(hopAi.kh) : demDung(nhap) === THU_TU.length) dongHop();
    }

    /* --- bảng nhập một mục --- */
    var O = { kh: null, v: [], i: 0, kq: null, bao: "", lopBao: "", dong: null };
    /* 26/11 11:21, thầy: "Ô sau đổi tên thành nhập ô tiếp theo. dấu vẫn vẽ nhưng ghi kế bên chữ xóa." data-p: tên phím cho bài thử (không phụ thuộc chữ trên phím). */
    "1 2 3 4 5 6 7 8 9 xoa 0 tiep".split(" ").forEach(function (p) {
      var b = H("button", "phim" + (p === "xoa" ? " phu xoa" : p === "tiep" ? " phu tiep" : ""), p === "xoa" ? null : p === "tiep" ? "Nhập ô tiếp theo" : p, $("oPhim"));
      b.setAttribute("data-p", p);
      if (p === "xoa") { H("span", "phim-bieu", "⌫", b).setAttribute("aria-hidden", "true"); H("span", null, "Xóa", b); b.setAttribute("aria-label", "Xóa"); }
      b.onclick = function () { bam(p); };
    });
    function moO(kh) {
      var khoa = khoaMuc(kh);
      if (khoa && !nhap[kh]) { var b = oDong[kh]; b.classList.add("rung"); setTimeout(function () { b.classList.remove("rung"); }, 500); return; }
      clearTimeout(O.dong);
      O.kh = kh; O.v = MUC[kh].o.map(function () { return ""; }); O.i = 0; O.kq = null; O.bao = ""; O.lopBao = "";
      veHinhO(); veO();
      $("o").hidden = false;
      $("o").scrollTop = 0; oVua();
    }
    function dongO() { clearTimeout(O.dong); O.kh = null; $("o").hidden = true; baoNhap(); }
    /* 27/11 17:36, thầy: "ý tôi là nút kiểm tra á": có máy (màn hình thấp, chữ hệ thống to) bảng nhập cao hơn màn hình, nút Kiểm tra bị che, học sinh phải
       xoay ngang. Nút Kiểm tra nay dính đáy màn hình (index.html); ở đây đo lại mỗi lần vẽ bảng và mỗi lần màn hình đổi cỡ: tràn thì gọn lại (.gon), còn tràn
       thì gọn thêm (.gon2, .gon3), vẫn tràn thì đánh dấu .tran (phần trên cuộn được, có bóng mờ trên nút Kiểm tra). */
    function oVua() {
      var o = $("o");
      if (o.hidden) return;
      o.classList.remove("gon", "gon2", "gon3", "tran");
      if (o.scrollHeight > o.clientHeight + 1) o.classList.add("gon");
      if (o.scrollHeight > o.clientHeight + 1) o.classList.add("gon2");
      if (o.scrollHeight > o.clientHeight + 1) o.classList.add("gon3");
      if (o.scrollHeight > o.clientHeight + 1) o.classList.add("tran");
    }
    (function () {
      var hen = 0, vv = window.visualViewport;
      function sau() { clearTimeout(hen); hen = setTimeout(oVua, 140); }      // sau khi dtCao đặt lại --dt-cao (60 ms)
      window.addEventListener("resize", sau); window.addEventListener("orientationchange", sau); if (vv) vv.addEventListener("resize", sau);
    })();
    /* 25/11 08:05, thầy (kèm ảnh ô nhập này): "khi học sinh mà bấm vô nhập cái này nè thì trên màn hình của TV ấy, nó cũng sẽ hiện ra cái này luôn … những cái ô số
       mà học sinh nhập á, thì nó sẽ không hiện ra. Học sinh nhập đúng thì nó hiện ra dấu tích, nhập sai thì hiện ra dấu chéo … đừng cứ hiện số để cho các nhóm khác
       khỏi copy." Máy báo cho tivi màn nhập đang mở: <phòng>/nh/n<k>/<mã máy> = { kh: mục, i: ô đang chọn (-1: không còn ô nào gõ được), n: mỗi ô đã gõ mấy chữ số,
       q: mỗi ô "d" đúng / "s" sai / "-" chưa kiểm, b: dòng nhắc, l: kiểu dòng nhắc, t: giờ }. KHÔNG ghi chữ số các em gõ. Đóng ô nhập thì xóa; rớt mạng thì máy chủ
       tự xóa (T.coMat). Máy giáo viên đang xem điện thoại của nhóm thì không báo. */
    var nhDuong = "nh/n" + k + "/" + mayId, nhKy = "";
    function baoNhap() {
      var kh = O.kh, M, d, kb, o, ky;
      if (!T || laGV) return;
      if (!kh) { if (nhKy) { nhKy = ""; T.coMat(nhDuong, null); } return; }
      M = MUC[kh]; d = nhap[kh]; kb = biKhoa(kh);
      o = {
        kh: kh, i: d || kb ? -1 : O.i,
        n: M.o.map(function (x, i) { return d ? 0 : Math.min(9, O.v[i].length); }).join(""),
        q: M.o.map(function (x, i) { return d ? "d" : O.kq && O.v[i] !== "" && O.kq.v[i] === O.v[i] ? (O.kq.dung[i] ? "d" : "s") : "-"; }).join(""),
        b: d ? "Chính xác!" : kb ? "Nhóm đã nhập sai " + SAI_KHOA + " lần. " + CHU_KHOA + "." : O.bao,
        l: d ? "tot" : kb ? "khoa" : O.lopBao
      };
      ky = JSON.stringify(o);
      if (ky === nhKy) return;
      nhKy = ky; o.t = Math.round(T.gio());
      T.coMat(nhDuong, o);
    }
    $("oVe").onclick = dongO;
    function veHinhO() {                           // hình minh họa của mục đang nhập
      var kh = O.kh, M = MUC[kh], o = $("oHinh"), d = nhap[kh];
      o.textContent = "";
      if (M.manh) {
        var m = M.manh, g = daGiac(m), khg = khung(g), le = 0.6, w = khg[2] - khg[0] + 2 * le, h = khg[3] - khg[1] + 2 * le;
        var sv = S("svg", { "class": "o-svg", viewBox: [(khg[0] - le) * U, (khg[1] - le) * U, w * U, h * U].join(" "), preserveAspectRatio: "xMidYMid meet" }, o);
        sv.style.aspectRatio = w + " / " + h; sv.style.maxWidth = Math.round(w * (to ? 34 : 24)) + "px";
        S("polygon", { "class": "than", points: diem(g), fill: d ? mau[M.so[0] - 1] : "#f1ece2" }, sv);
        var net = function (a, b) { S("line", { "class": "net-do", x1: a[0] * U, y1: a[1] * U, x2: b[0] * U, y2: b[1] * U }, sv); };
        var vuong = function (p, dx, dy) { S("path", { "class": "goc-vuong", d: "M" + (p[0] * U + dx * 5) + " " + (p[1] * U) + "l0 " + (dy * 5) + "l" + (-dx * 5) + " 0" }, sv); };
        if (m.loai === "thoi") { net(g[0], g[2]); net(g[1], g[3]); }
        else if (m.loai === "thang") { net(g[0], [g[0][0], g[3][1]]); vuong([g[0][0], g[3][1]], 1, -1); }
        else if (m.loai === "bh") { net(g[3], [g[3][0], g[0][1]]); vuong([g[3][0], g[0][1]], 1, 1); }
      } else if (kh === "tong") {
        var hop = H("div", "o-tong", null, o);
        KHOA_MANH.forEach(function (k2) {
          var M2 = MUC[k2], c = H("span", "o-tong-o", null, hop);
          svgManh(c, M2.manh, mau[M2.so[0] - 1], to ? 6 : 4.2, 0.3);
          H("b", null, M2.dt + (M2.so.length > 1 ? " × 2" : ""), c);
        });
      } else if (kh === "thiep") {
        var W = bc.W, Hh = bc.H, sv2 = S("svg", { "class": "o-svg", viewBox: "-6 -6 " + (W * U + 12) + " " + (Hh * U + 12) }, o);
        sv2.style.aspectRatio = W + " / " + Hh; sv2.style.maxWidth = Math.round(THIEP[NHOM[k]].W * (to ? 9 : 5)) + "px";
        S("rect", { x: 0, y: 0, width: W * U, height: Hh * U, fill: "#fff", stroke: "#4d4541", "stroke-width": 4.6 }, sv2);
        var gtt = S("g", { opacity: 0.55 }, sv2); veTrangTri(gtt, k);
      } else {
        H("p", "o-chu", "Dán đủ 10 mảnh lên thiệp, không mảnh nào chồng lên nhau. Phần giấy còn trống rộng bao nhiêu?", o);
      }
    }
    function veO() {
      var kh = O.kh, M = MUC[kh], d = nhap[kh], hop = $("oO"), kb = biKhoa(kh);
      $("oTen").textContent = M.ten.replace("thang cân", "thang\u00a0cân").replace(/\(mảnh (to|nhỏ)\)/, "(mảnh\u00a0$1)");      // 26/11 11:21: tên to hơn, tên dài xuống dòng: giữ "thang cân", "(mảnh to)" liền một dòng
      if (M.so && M.so.length > 1) H("small", null, "có 2 hình cùng diện tích", $("oTen"));   // thầy dặn 14/11 16:06
      hop.textContent = "";
      M.o.forEach(function (x, i) {
        var b = H("button", "o-dong", null, hop);
        H("span", "o-nhan", x.nhan, b);
        var so = H("span", "o-so", d ? String(x.dung) : O.v[i], b);
        H("span", "o-dv", x.dv || "cm", b);
        if (d) b.classList.add("dung");
        else {
          if (i === O.i && !kb) b.classList.add("dang");
          if (O.kq && O.v[i] !== "" && O.kq.v[i] === O.v[i]) b.classList.add(O.kq.dung[i] ? "dung" : "sai");
          if (!O.v[i] && i === O.i && !kb) so.classList.add("nhay");
          if (!kb) b.onclick = function () { O.i = i; veO(); };
        }
      });
      var bao = $("oBao");
      bao.className = "o-bao " + (d ? "tot" : kb ? "xau khoa3" : O.lopBao);
      bao.textContent = d ? "Chính xác!" /* 16/11 22:08, thầy: "nhận xét đã đúng ngay lần nhập đầu bỏ luôn. Hình nào các em nhập đúng thì hiện chữ chính xác" */ : kb ? "Nhóm đã nhập sai " + SAI_KHOA + " lần. " + CHU_KHOA + "." : O.bao;
      $("o").classList.toggle("bi-khoa", kb);
      $("oPhim").classList.toggle("tat", !!d || kb);
      $("oKiem").disabled = !!d || !T || kb;
      $("oKiem").textContent = d ? "Đã đúng" : kb ? "Đã khóa" : "Kiểm tra";
      $("oGv").hidden = !gvDung || !!d || kb;      // 26/11 10:49: chỉ máy giáo viên (mã đúng) mới có; mục đã đúng hoặc đang khóa thì không hiện
      oVua();                                    // 27/11 17:36: chữ nhắc dài ra, nút AI hiện thêm: đo lại cho nút Kiểm tra luôn thấy
      var hinh = $("oHinh").querySelector(".o-svg .than");
      if (hinh && M.manh) hinh.setAttribute("fill", d ? mau[M.so[0] - 1] : "#f1ece2");
      baoNhap();
    }
    function bam(p) {
      if (!O.kh || nhap[O.kh] || biKhoa(O.kh)) return;
      var n = MUC[O.kh].o.length, s = O.v[O.i];
      if (p === "tiep") O.i = (O.i + 1) % n;
      else if (p === "xoa") { if (s) O.v[O.i] = s.slice(0, -1); else if (O.i > 0) O.i--; }
      else if (s.length < 4 && !(s === "" && p === "0")) O.v[O.i] = s + p;
      veO();
    }
    $("oKiem").onclick = function () {
      var kh = O.kh; if (!kh || nhap[kh] || !T || biKhoa(kh)) return;
      var trong = O.v.findIndex(function (s) { return s === ""; });
      if (trong >= 0) { O.i = trong; O.bao = "Em nhập đủ các ô rồi bấm Kiểm tra nhé."; O.lopBao = ""; veO(); return; }
      var kq = kiemMuc(kh, O.v.map(Number));
      O.kq = { dung: kq.dung, v: O.v.slice() };
      if (kq.het) {
        nhap[kh] = (sai[kh] || 0) === 0 ? "s" : "d";
        var ghiD = {}; ghiD["n" + k + "/d/" + kh] = nhap[kh];
        if (demDung(nhap) === THU_TU.length && !h1Nhom) { h1Nhom = Math.round(T.gio()); ghiD["n" + k + "/h1"] = h1Nhom; }      // vừa đúng đủ 10 mục: ghi giờ về đích (cùng một lần ghi)
        T.update(ghiD);
        veNhap();
        O.dong = setTimeout(dongO, 1300);
      } else {
        sai[kh] = (sai[kh] || 0) + 1;
        var ghi = {}; ghi["n" + k + "/s/" + kh] = sai[kh];
        if (sai[kh] % SAI_KHOA === 0) { khoa3[kh] = 1; ghi["n" + k + "/khoa/" + kh] = 1; }      // đủ 3 lần sai: khóa mục này trên mọi máy của nhóm (ghi cùng một lần với số lần sai)
        T.update(ghi);
        O.bao = kq.goi; O.lopBao = "xau";
        var saiDau = kq.dung.indexOf(false); if (saiDau >= 0) O.i = saiDau;
        veNhap();
      }
    };
    /* 26/11 10:49, thầy: "khi mà tôi xem điện thoại nhóm 1 chẳng hạn, thì đang là nhiệm vụ 1 … riêng cái trang giáo viên thôi nha … ví dụ tôi bấm vô hình bình hành
       thì … phía dưới nút kiểm tra sẽ có cái nút là giáo viên điền đáp án. Rồi sau đó tôi bấm kiểm tra để làm cho các em luôn … Tương tự như vậy cho cái diện tích
       tấm thiệp rồi các cái kiểu vậy luôn … nếu mà ví dụ mà các em chậm quá thì tôi làm cho các em luôn."
       Nút chỉ điền số đúng vào các ô (trên máy thầy thôi: máy giáo viên không báo màn nhập lên tivi, xem baoNhap). Thầy bấm Kiểm tra thì mục đó mới được ghi là đúng
       cho cả nhóm, y như các em tự nhập. Thứ tự các mục giữ như cũ (tổng cần đủ 7 mảnh trước; phần còn lại cần tổng và tấm thiệp). Mục đang khóa: thầy mở khóa trước. */
    /* 26/11 11:21, thầy: "giáo viên điền đáp án nhớ có xác nhận nhé và đổi tên thành AI hỗ trợ nhóm." Bấm nút thì hỏi lại trước; đồng ý thì mới điền số,
       rồi thầy bấm Kiểm tra như cũ. */
    $("oGv").onclick = function () {
      var kh = O.kh; if (!gvDung || !kh || nhap[kh] || biKhoa(kh)) return;
      moHop({ kieu: "ai", ten: "AI hỗ trợ nhóm", dong: ["Điền sẵn đáp án đúng cho mục “" + MUC[kh].ten + "”?", "Điền xong, thầy bấm Kiểm tra để ghi cho nhóm."], phu: "Không", chinh: "Điền đáp án", ai: { kh: kh }, lam: function () {
        if (O.kh !== kh || nhap[kh] || biKhoa(kh)) return;      // trong lúc hỏi, mục đã đổi (nhóm vừa nhập đúng, vừa bị khóa)
        O.v = MUC[kh].o.map(function (x) { return String(x.dung); }); O.i = O.v.length - 1; O.kq = null;
        O.bao = "AI đã điền đáp án. Thầy bấm Kiểm tra để ghi cho nhóm."; O.lopBao = "";
        veO();
      } });
    };
    $("nhapAiNut").onclick = function () {
      if (!gvDung || !T) return;
      var con = THU_TU.filter(function (kh) { return !nhap[kh]; });
      if (!con.length) return;
      moHop({ kieu: "ai", ten: "AI hỗ trợ nhóm nhiệm vụ 1", dong: ["Ghi đúng luôn " + con.length + " mục còn lại của nhiệm vụ 1 cho Nhóm " + k + "?", con.some(biKhoa) ? "Mục đang khóa cũng được ghi đúng." : "", "Điện thoại của nhóm và tivi sẽ thấy nhóm đã xong nhiệm vụ 1."].filter(Boolean), phu: "Không", chinh: "Đồng ý", ai: { nv1: 1 }, lam: aiNv1 });
    };
    function aiNv1() {                             // ghi đúng mọi mục còn lại, một lần ghi (như $("oKiem").onclick: "s" = chưa sai lần nào, "d" = đúng sau khi sai)
      if (!gvDung || !T) return;
      var ghiD = {};
      THU_TU.forEach(function (kh) { if (nhap[kh]) return; nhap[kh] = (sai[kh] || 0) === 0 ? "s" : "d"; ghiD["n" + k + "/d/" + kh] = nhap[kh]; });
      if (!Object.keys(ghiD).length) return;
      if (!h1Nhom) { h1Nhom = Math.round(T.gio()); ghiD["n" + k + "/h1"] = h1Nhom; }      // giờ về đích (cùng một lần ghi)
      T.update(ghiD);
      veNhap();
    }
    $("nhapSang").onclick = function () { if (duocXep()) { man = "xep"; doiMan(); } };
    /* (14/11 14:03, thầy dặn "số đo 10/10 xóa ô đó đi": bàn xếp không còn nút quay về bước nhập số đo) */

    /* ---------------- bước 2: bàn xếp có lưới, 10 mảnh nằm sẵn ----------------
       Thầy dặn 14/11 14:03: "phần khung lưới kéo dài lên cả những chỗ trống nữa". Lưới phủ kín phần màn hình giữa tên bước và dòng nhắc,
       mảnh kéo được tới mọi chỗ có lưới. ban = phần lưới máy này đang thấy (cm trên thiệp, xem cuaSo);
       vungKeo = ban thu vào cho mép nằm trên vạch nửa ô (mảnh đặt sát mép vẫn đúng vạch lưới). Chỗ dán hình trên thiệp (dan) nằm trong ban:
       lúc Hoàn thành hình phải vừa cỡ chỗ dán, chưa vừa thì hiện khung nét đứt (khungThiep) cho các em thấy. */
    var svg = $("dtBan"), lopLuoi = S("g", { "class": "lop-luoi" }, svg), lopTT = S("g", { "class": "lop-tt" }, svg), lopManh = S("g", {}, svg), khungThiep = S("rect", { "class": "khung-thiep" }, svg), coNhom = {}, duDau = [0, 0, 0, 0], dauSan = viTriDau(k);
    var ban = bc.ban.slice(), vungKeo = [-1e6, -1e6, 1e6, 1e6], banDaVe = "", luoi = luoiGoc(k);
    veTrangTri(lopTT, k);                          // 15/11 18:31: bàn xếp là tờ thiệp A3 (khung tiêu đề; chuỗi hạt và chỗ ghi lời chúc thầy bỏ 22:33), mảnh nằm ngay trên tờ thiệp   // chưa đo được màn hình (đang ở bước nhập số): chưa giữ mảnh vào đâu cả
    khungThiep.style.display = "none";
    function macDinh(i) { var d = dauSan[i]; return { x: d.x, y: d.y, r: d.r, f: d.f, t: 0 }; }   // chỗ nằm sẵn của mảnh thứ i (theo hình mẫu của nhóm, xem MAU_DAU)
    function chuCua() {                           // phần lưới máy này đang thấy; đã đo được màn hình bàn xếp thì kèm số nửa ô lưới trống quanh chỗ dán hình
      var a = [Math.floor(ban[0] * 100) / 100, Math.floor(ban[1] * 100) / 100, Math.ceil(ban[2] * 100) / 100, Math.ceil(ban[3] * 100) / 100];
      if (banDaVe) a = a.concat([0, 0, 0, 0]);      // (4 số cũ: phần lưới nới thêm; bàn xếp bây giờ cố định là cả tấm thiệp)
      return a.join("|");
    }
    function baoCua() {                           // báo cho tivi và các máy cùng nhóm (ghi vào chỗ báo có mặt của máy)
      if (T && !laGV) T.coMat("n" + k + "/co/" + mayId, chuCua());      // máy giáo viên vào xem thì không tính là máy của nhóm
    }
    function tinhDau() {                          // tính lại chỗ nằm sẵn theo phần lưới mọi máy của nhóm cùng thấy; trả về true nếu chỗ nằm sẵn đổi
      var co = {}, id, moi;
      for (id in coNhom) if (id !== mayId) co[id] = coNhom[id];
      co[mayId] = chuCua();
      moi = duChung(co);
      if (moi.join() === duDau.join()) return false;
      duDau = moi; dauSan = viTriDau(k);
      return true;
    }

    function coBan() {                            // chỉnh lưới bàn xếp và tấm thiệp cho vừa màn hình
      var o = $("dtKhungBan"), w = o.clientWidth, h = o.clientHeight;
      if (w && h) {
        var tlB = bc.W / bc.H, bw = Math.min(w, h * tlB), bh = bw / tlB;      // bàn xếp là tấm thiệp: giữ đúng tỉ lệ tờ A3 (29 : 42 hoặc 42 : 29), nằm giữa khung
        svg.style.width = Math.floor(bw) + "px"; svg.style.height = Math.floor(bh) + "px"; svg.style.left = Math.floor((w - bw) / 2) + "px"; svg.style.top = Math.floor((h - bh) / 2) + "px";
        var moi = cuaSo(bc), khoa = moi.map(f2).join("|");
        if (khoa !== banDaVe) {
          banDaVe = khoa; ban = moi;
          vungKeo = dan.slice();                    // 15/11 19:15: mảnh chỉ kéo được trong chỗ dán hình của tờ thiệp (từ 22:33 chỗ dán hình là gần hết tấm thiệp, dưới khung tiêu đề)
          svg.setAttribute("viewBox", [ban[0] * U, ban[1] * U, (ban[2] - ban[0]) * U, (ban[3] - ban[1]) * U].join(" "));
          veLuoiRong(lopLuoi, dan, luoi, true);     // lưới mờ và viền chỉ trong chỗ dán hình
          tinhDau();
          manh.forEach(function (m, i) {           // m.dau: mảnh chưa ai kéo, nằm ở chỗ sẵn (chỗ này đổi theo phần lưới các máy thấy). m.db = chỗ thật của mảnh theo máy chủ:
            if (m.dau) m.st = macDinh(i);          // mảnh máy khác để ở chỗ máy này không thấy thì hiện sát mép (chỉ trên máy này, chưa ghi lên)
            else if (m.db) m.st = { x: m.db.x, y: m.db.y, r: m.db.r, f: m.db.f, t: m.db.t };
            giuTrong(goc[m.so - 1], m.st, vungKeo); ve(m);
          });
          if (quaTo) { quaTo = null; capNhat(); }
          baoCua();
        }
      }
      var o2 = $("thiepKhung"), w2 = o2.clientWidth, h2 = o2.clientHeight, tl2 = bc.W / bc.H;
      if (w2 && h2) { var tw = Math.min(w2, h2 * tl2); $("dtThiep").style.width = Math.floor(tw) + "px"; $("dtThiep").style.height = Math.floor(tw / tl2) + "px"; }
    }
    window.addEventListener("resize", coBan);
    window.addEventListener("orientationchange", function () { setTimeout(coBan, 250); });

    /* cả 10 mảnh có sẵn trên bàn ngay từ đầu (không còn khay, không còn nút Cất) */
    manh = goc.map(function (g, i) { return { so: i + 1, on: true, dau: true, st: macDinh(i), g: veManh(lopManh, g, mau[i], i + 1, true), chay: 0 }; });
    function ve(m) { if (!m.chay) datManh(m.g, goc[m.so - 1], m.st); }
    manh.forEach(ve);
    function truot(m, tu, ms) {                    // vẽ mảnh trượt từ vị trí tu tới m.st trong ms mili giây
      var den = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f }, dr = den.r - tu.r, t0 = null, ma = ++m.chay;
      dr -= Math.round(dr / 360) * 360;
      if (Math.hypot(den.x - tu.x, den.y - tu.y) < 0.02 && Math.abs(dr) < 0.5) { m.chay = 0; datManh(m.g, goc[m.so - 1], m.st); return; }
      function buoc(t) {
        if (m.chay !== ma) return;
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        if (p >= 1) { m.chay = 0; datManh(m.g, goc[m.so - 1], m.st); return; }
        datManh(m.g, goc[m.so - 1], { x: tu.x + (den.x - tu.x) * e, y: tu.y + (den.y - tu.y) * e, r: tu.r + dr * e, f: den.f });
        requestAnimationFrame(buoc);
      }
      requestAnimationFrame(buoc);
    }
    function leTren(m) { m.st.t = Date.now(); lopManh.appendChild(m.g); }
    function xepLop() {
      var ds = manh.slice().sort(function (a, b) { return a.st.t - b.st.t || a.so - b.so; }), c = lopManh.children, lech = c.length - ds.length, i;
      for (i = 0; i < ds.length; i++) if (c[lech + i] !== ds[i].g) break;
      if (i === ds.length) return;                 // 21/11: thứ tự trên dưới đã đúng thì không gắn lại 10 mảnh (trước đây gắn lại mỗi lần có mảnh nhích)
      ds.forEach(function (m) { lopManh.appendChild(m.g); });
    }
    function gui(m, ngay) {                       // gửi vị trí mảnh lên, tối đa khoảng 12 lần một giây
      m.db = null; m.dau = false;                  // máy này vừa đặt mảnh: chỗ trên máy này là chỗ thật
      if (!T) return;
      var p = "n" + k + "/m/p" + m.so;
      function that() { guiLuc[m.so] = Date.now(); guiCho[m.so] = null; T.set(p, goi(m.st)); }
      if (ngay) { clearTimeout(guiCho[m.so]); that(); return; }
      if (guiCho[m.so]) return;
      var cho = 80 - (Date.now() - (guiLuc[m.so] || 0));
      if (cho <= 0) that(); else guiCho[m.so] = setTimeout(that, cho);
    }
    function capNhat() {                          // viền chọn, viền báo sau khi bấm Hoàn thành, dòng nhắc, các nút
      var de = {}, le = {};
      (baoDe || []).forEach(function (i) { de[i] = 1; });
      (quaTo ? quaTo.manh : chuaNhan || []).forEach(function (i) { le[i] = 1; });
      if (quaTo) { khungThiep.setAttribute("x", quaTo.khung[0] * U); khungThiep.setAttribute("y", quaTo.khung[1] * U); khungThiep.setAttribute("width", (quaTo.khung[2] - quaTo.khung[0]) * U); khungThiep.setAttribute("height", (quaTo.khung[3] - quaTo.khung[1]) * U); }
      khungThiep.style.display = quaTo ? "" : "none";
      manh.forEach(function (m, i) {
        m.g.classList.toggle("chon", chon === i && !dangChot);
        m.g.classList.toggle("chong", !!de[i]);
        m.g.classList.toggle("le", !!le[i]);
      });
      var nhac = $("dtNhac"), chuNhac, lopNhac = "nhac";
      if (dangChot) { chuNhac = "Máy đang chỉnh lại hình cho ngay ngắn…"; lopNhac += " tot"; }
      else if (baoDe) { chuNhac = "Mảnh viền đỏ đang đè lên mảnh khác. Em chỉnh lại rồi bấm Hoàn thành nhé."; lopNhac += " xau"; }
      else if (quaTo) { chuNhac = "Hình chưa vừa khung nét đứt (chỗ dán hình trên thiệp). Em xếp gọn lại rồi bấm Hoàn thành nhé."; lopNhac += " xau"; }
      else if (chuaNhan) { chuNhac = "Mảnh viền cam còn nằm rời. Em xếp các mảnh sát nhau thành hình rồi bấm Hoàn thành nhé."; lopNhac += " xau"; }
      else if (chon === null) chuNhac = "Kéo từng mảnh để xếp thành hình. Xếp xong thì bấm Hoàn thành.";
      else chuNhac = "Chạm mảnh đang chọn để xoay, hoặc xoay bằng hai ngón. Xếp xong thì bấm Hoàn thành.";
      datLop(nhac, lopNhac); chu(nhac, chuNhac);
      var cm = chon !== null && !dangChot;
      tat($("dtTrai"), !cm); tat($("dtPhai"), !cm);
      tat($("dtLat"), !cm);
      tat($("dtXong"), dangChot || !T);
      tat($("dtLai"), dangChot || !T);
    }
    function tha(i, tu) {                         // thả mảnh: vào lưới, giữ trong bàn, gửi. Đè lên mảnh khác thì vẫn để yên (thầy dặn 14/11: bỏ tự đẩy)
      var m = manh[i];
      tu = tu || { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
      vaoLuoi(goc[i], m.st, luoi);
      giuTrong(goc[i], m.st, vungKeo);
      chuaNhan = null; baoDe = null; quaTo = null;
      truot(m, tu, 140); ve(m); gui(m, true); capNhat();
    }
    function xoay(d) {                             // d > 0: xoay phải một nấc; d < 0: xoay trái một nấc (các nấc: xem nacXoay)
      if (chon === null || dangChot) return;
      var m = manh[chon], tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
      m.st.r = chuanGoc(nacKe(nacXoay(k, chon, m.st.f), chuanGoc(m.st.r), d > 0 ? 1 : -1));
      leTren(m); tha(chon, tu);
    }
    $("dtTrai").onclick = function () { xoay(-BUOC_XOAY); };
    $("dtPhai").onclick = function () { xoay(BUOC_XOAY); };
    $("dtLat").onclick = function () {             // Lật đối xứng (thầy dặn 14/11 14:03: "lật trái phải giống trong word"): soi gương mảnh qua trục đứng đi qua tâm mảnh, như nút Flip Horizontal
      if (chon === null || dangChot) return;
      var m = manh[chon];
      if (BO[chon].loai === "bh") m.st.f = m.st.f ? 0 : 1;      // các hình khác đối xứng qua trục của chính nó: soi gương chỉ là đổi dấu góc quay
      m.st.r = chuanGoc(-m.st.r);
      leTren(m); tha(chon, { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f });
    };
    function lamLai() {                            // 10 mảnh trượt về chỗ nằm sẵn, xóa hình đang xếp của cả nhóm
      if (!T || dangChot) return;
      manh.forEach(function (m, i) {
        var tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
        clearTimeout(guiCho[m.so]); guiCho[m.so] = null;
        m.st = macDinh(i); m.db = null; m.dau = true; truot(m, tu, 320);
      });
      chon = null; chuaNhan = null; baoDe = null; quaTo = null;
      xepLop();
      T.remove("n" + k + "/m");
      capNhat();
    }
    $("dtLai").onclick = function () {             // Làm lại từ đầu (thầy dặn 14/11 14:03: "nếu bấm ô này thì có ô xác nhận")
      if (!T || dangChot) return;
      moHop({ kieu: "lai", ten: "Làm lại từ đầu?", dong: ["10 mảnh sẽ về chỗ ban đầu. Hình nhóm đang xếp sẽ mất."], phu: "Không", chinh: "Làm lại từ đầu", lam: lamLai });
    };

    /* --- bảng thông báo trên bàn xếp: xác nhận, báo mảnh đè lên nhau, báo chưa nhận ra hình --- */
    function dongHop() { $("hop").hidden = true; }
    function moHop(o) {                            // o = { kieu: "hoi" | "de" | "le", ten, dong: [chữ hoặc {chu, lop}], phu: chữ nút phụ (bỏ trống thì không có), chinh: chữ nút chính, lam: việc làm khi bấm nút chính }
      var hop = $("hop"), chu = $("hopChu");
      hop.className = "hop " + o.kieu;
      hopAi = o.ai || null;                        // 26/11 11:21: bảng hỏi của nút AI (xem xetHopAi)
      $("hopTen").textContent = o.ten;
      chu.textContent = "";
      o.dong.forEach(function (d) { H("p", typeof d === "string" ? null : d.lop, typeof d === "string" ? d : d.chu, chu); });
      $("hopPhu").hidden = !o.phu; $("hopPhu").textContent = o.phu || "";
      $("hopChinh").textContent = o.chinh;
      $("hopPhu").onclick = dongHop;
      $("hopChinh").onclick = function () { dongHop(); if (o.lam) o.lam(); };
      hop.hidden = false;
    }
    function noiSo(a) {                            // [2, 6, 8] → "số 3, số 7 và số 9"
      var s = a.map(function (i) { return "số " + (i + 1); });
      return s.length > 1 ? s.slice(0, -1).join(", ") + " và " + s[s.length - 1] : s[0];
    }
    function xetHinh() {                           // tính trên bản sao (chưa đụng tới hình của các em): tách mảnh đè nhẹ, chỉnh nhẹ, xét có ra hình không
      var ds = manh.map(function (m, i) { return { goc: goc[i], st: { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f, t: m.st.t } }; });
      /* Thầy dặn 15/11 18:31: hình các em xếp giống hình mẫu từ 70 % thì lúc bấm Hoàn thành máy xếp lại y chang hình mẫu (không xét đè, rời nữa).
         16/11 10:02: thiệp nhóm 3, 4 có hai hình, mỗi hình giống mẫu từ 60 % là đạt (xem giongMau). */
      var gm = giongMau(k, ds.map(function (A) { return toaDo(A.goc, A.st); }));
      if (gm && gm.dat) {
        var Mx = mauXep(k);
        gm.gan.forEach(function (j, i) {
          var ck = chuKy(BO[i]), r = Mx[i].r;
          if (ds[j].st.f === Mx[i].f) r += Math.round((ds[j].st.r - r) / ck) * ck;      // trong các góc cho cùng một hình, lấy góc gần góc đang đặt nhất: mảnh không quay thừa
          ds[j].st = { x: Mx[i].x, y: Mx[i].y, r: r, f: Mx[i].f, t: ds[j].st.t };
        });
        return { ds: ds, kq: { ok: true, le: [], cap: [], soCham: ds.length, chong: false, mau: gm } };
      }
      var kq = canChinh(ds, vungKeo);
      if (kq.ok) {                                 // lưới rộng hơn chỗ dán hình trên thiệp: hình phải vừa cỡ chỗ dán (máy sẽ đưa hình vào giữa chỗ dán)
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, rw = dan[2] - dan[0], rh = dan[3] - dan[1];
        ds.forEach(function (A) { var kh = khung(toaDo(A.goc, A.st)); x0 = Math.min(x0, kh[0]); y0 = Math.min(y0, kh[1]); x1 = Math.max(x1, kh[2]); y1 = Math.max(y1, kh[3]); });
        if (x1 - x0 > rw + 1e-6 || y1 - y0 > rh + 1e-6) {
          var kx = Math.max(ban[0], Math.min(ban[2] - rw, (x0 + x1) / 2 - rw / 2)), ky = Math.max(ban[1], Math.min(ban[3] - rh, (y0 + y1) / 2 - rh / 2));
          kq.to = { rong: x1 - x0 > rw + 0.05, cao: y1 - y0 > rh + 0.05, khung: [kx, ky, kx + rw, ky + rh], manh: [] };   // khung = khung cỡ chỗ dán đặt quanh hình; manh = các mảnh thò ra ngoài khung
          ds.forEach(function (A, i) { var kh = khung(toaDo(A.goc, A.st)); if (kh[0] < kx - 0.05 || kh[1] < ky - 0.05 || kh[2] > kx + rw + 0.05 || kh[3] > ky + rh + 0.05) kq.to.manh.push(i); });
        }
      }
      return { ds: ds, kq: kq };
    }
    function baoKetQua(kq) {                       // hình ổn thì trả về true; chưa ổn thì hiện bảng báo, tô viền các mảnh cần chỉnh
      var dong = [];
      if (kq.cap.length) {
        var tren = [], co = {}, cap = kq.cap.map(function (c) {      // mảnh nằm trên (mảnh các em đụng tới sau) là mảnh cần chỉnh
          return (manh[c[0]].st.t || 0) < (manh[c[1]].st.t || 0) ? [c[1], c[0]] : [c[0], c[1]];
        }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
        cap.forEach(function (c, vt) {
          if (!co[c[0]]) { co[c[0]] = 1; tren.push(c[0]); }
          if (vt < 3) dong.push("Mảnh số " + (c[0] + 1) + " đang đè lên mảnh số " + (c[1] + 1) + ".");
        });
        if (cap.length > 3) dong.push("Còn " + (cap.length - 3) + " chỗ nữa cũng đang đè lên nhau.");
        dong.push({ chu: "Em chỉnh lại mảnh " + noiSo(tren) + " rồi bấm Hoàn thành nhé.", lop: "dam" });
        baoDe = tren; chuaNhan = null; quaTo = null; chon = null; capNhat();
        moHop({ kieu: "de", ten: "Còn mảnh đè lên nhau", dong: dong, chinh: "Chỉnh lại" });
        return false;
      }
      if (!kq.ok) {
        dong.push(kq.le.length <= 4 ? "Mảnh " + noiSo(kq.le) + " còn nằm rời." : "Còn " + kq.le.length + " mảnh nằm rời (viền cam).");
        dong.push({ chu: "Em xếp các mảnh sát nhau thành hình rồi bấm Hoàn thành nhé.", lop: "dam" });
        chuaNhan = kq.le; baoDe = null; quaTo = null; chon = null; capNhat();
        moHop({ kieu: "le", ten: "Máy chưa nhận ra hình", dong: dong, chinh: "Xếp tiếp" });
        return false;
      }
      if (kq.to) {
        dong.push("Hình đang " + (kq.to.rong && kq.to.cao ? "rộng và cao" : kq.to.rong ? "rộng" : "cao") + " hơn chỗ dán hình trên thiệp.");
        dong.push({ chu: "Em xếp gọn lại cho vừa khung nét đứt rồi bấm Hoàn thành nhé.", lop: "dam" });
        quaTo = kq.to; chuaNhan = null; baoDe = null; chon = null; capNhat();
        moHop({ kieu: "le", ten: "Hình chưa vừa tấm thiệp", dong: dong, chinh: "Xếp tiếp" });
        return false;
      }
      if (quaTo || chuaNhan || baoDe) { quaTo = null; chuaNhan = null; baoDe = null; capNhat(); }   // hình đã ổn (có khi do máy khác của nhóm vừa sửa): bỏ viền báo cũ
      return true;
    }
    /* --- Hoàn thành: xét hình trước; hình ổn thì hỏi xác nhận; nhóm đồng ý thì chỉnh nhẹ, đưa hình vào giữa thiệp, báo cho tivi --- */
    function chot() {
      if (!T || dangChot) return;
      var x = xetHinh();
      if (!baoKetQua(x.kq)) return;                 // máy khác của nhóm vừa kéo lệch hình đi
      var ds = x.ds, gom = {};
      if (!x.kq.mau) vaoGiua(ds, dan);              // hình tự nghĩ: đưa vào giữa chỗ dán hình. Hình giống mẫu: đã nằm đúng chỗ của hình mẫu
      dangChot = true; chon = null; chuaNhan = null; baoDe = null; quaTo = null;
      manh.forEach(function (m, i) {
        var tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
        clearTimeout(guiCho[m.so]); guiCho[m.so] = null;
        m.st = ds[i].st; m.db = null; truot(m, tu, 600);
        gom["n" + k + "/m/p" + m.so] = goi(m.st);
      });
      gom["n" + k + "/xong"] = 1;
      capNhat();
      setTimeout(function () { dangChot = false; T.update(gom); }, 750);
    }
    $("dtXong").onclick = function () {
      if (!T || dangChot) return;
      if (!baoKetQua(xetHinh().kq)) return;
      moHop({ kieu: "hoi", ten: "Nhóm đã xếp xong hình?", dong: ["Bấm Hoàn thành thì máy chỉnh hình cho ngay ngắn rồi đưa lên tấm thiệp của nhóm."], phu: "Xếp tiếp", chinh: "Hoàn thành", lam: chot });
    };
    /* 16/11 10:02: "một khi đã bấm hoàn thành thì chỉ có giáo viên mới có quyền mở chức năng sửa lại hình cho các em". Nút này chỉ hiện trên máy giáo viên (veGV);
       trang giáo viên cũng có nút "Cho sửa lại hình" của từng nhóm. */
    $("thiepSua").onclick = function () { if (T && gvDung) T.remove("n" + k + "/xong"); };

    /* --- Hình AI gợi ý (chỉ máy giáo viên): bảng có hình mẫu của nhóm; "Xếp giúp nhóm theo hình này" thì 10 mảnh trượt về đúng hình mẫu trên mọi máy của nhóm --- */
    var goiYDaVe = false;
    function moGoiY() {
      var Mx = mauXep(k), sv = $("goiYHinh"), lop, ten = window.Tranh3D && window.Tranh3D.TEN ? window.Tranh3D.TEN[HINH[k]] : "";
      if (!gvDung || !Mx) return;
      if (!goiYDaVe) {
        goiYDaVe = true;
        sv.setAttribute("viewBox", "0 0 " + bc.W * U + " " + bc.H * U);
        S("rect", { "class": "giay", x: 0, y: 0, width: bc.W * U, height: bc.H * U }, sv);
        veTrangTri(S("g", { "class": "lop-tt" }, sv), k);
        lop = S("g", { "class": "lop-manh" }, sv);
        Mx.forEach(function (st, i) { datManh(veManh(lop, goc[i], mau[i], i + 1, true), goc[i], st); });
      }
      $("goiYHop").className = "hop-the " + NHOM[k];
      $("goiYChu").textContent = (ten ? "Hình mẫu của nhóm " + k + ": " + ten + ". " : "") + "Chỉ máy thầy thấy bảng này. Bấm nút dưới thì máy xếp 10 mảnh của nhóm thành hình này, các em thấy ngay trên máy mình.";
      $("goiYXep").disabled = !T || dangChot || xong;
      $("goiY").hidden = false;
    }
    function xepTheoMau() {
      var Mx = mauXep(k), gom = {}, luc = Date.now();
      if (!T || !Mx || !gvDung || dangChot || xong) return;
      manh.forEach(function (m, i) {
        var tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
        clearTimeout(guiCho[m.so]); guiCho[m.so] = null;
        m.st = { x: Mx[i].x, y: Mx[i].y, r: chuanGoc(Mx[i].r), f: Mx[i].f, t: luc + i }; m.db = null; m.dau = false; truot(m, tu, 500);
        gom["n" + k + "/m/p" + m.so] = goi(m.st);
      });
      chon = null; chuaNhan = null; baoDe = null; quaTo = null;
      xepLop(); T.update(gom); capNhat();
    }
    $("dtGoiY").onclick = moGoiY;
    $("goiYDong").onclick = function () { $("goiY").hidden = true; };
    $("goiYXep").onclick = function () { $("goiY").hidden = true; xepTheoMau(); };

    /* --- chạm, kéo, xoay hai ngón --- */
    function cm(e) {
      var r = svg.getBoundingClientRect();
      return [ban[0] + (e.clientX - r.left) / r.width * (ban[2] - ban[0]), ban[1] + (e.clientY - r.top) / r.height * (ban[3] - ban[1])];
    }
    function gocHaiNgon() {
      var ids = Object.keys(tro); if (ids.length < 2) return null;
      var a = tro[ids[0]], b = tro[ids[1]];
      return { g: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    svg.addEventListener("pointerdown", function (e) {
      if (dangChot) return;
      tro[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
      var n = Object.keys(tro).length;
      if (n === 2 && chon !== null && manh[chon].on) {      // ngón thứ hai: xoay mảnh đang chọn
        keo = null; manh[chon].chay = 0; xoay2 = { g0: gocHaiNgon().g, r0: manh[chon].st.r };
        e.preventDefault(); return;
      }
      if (n > 1) return;
      var el = e.target.closest ? e.target.closest("[data-so]") : null, p = cm(e), i = el ? parseInt(el.getAttribute("data-so"), 10) - 1 : -1;
      if (i < 0) {                                 // chạm hụt ra ngoài mảnh một chút (mảnh nhỏ trên màn hình nhỏ): lấy mảnh gần ngón tay nhất, trong tầm 14 px
        var tam = 14 * (ban[2] - ban[0]) / (svg.getBoundingClientRect().width || 1), ganNhat = tam;
        manh.forEach(function (m, j) { var kc = kcDiem(p, toaDo(goc[j], m.st)); if (kc < ganNhat - 1e-9 || (kc <= ganNhat + 1e-9 && i >= 0 && m.st.t > manh[i].st.t)) { ganNhat = kc; i = j; } });
      }
      if (i >= 0) {
        var da = chon === i;
        chon = i; leTren(manh[i]);
        keo = { id: e.pointerId, i: i, kieu: "manh", da: da, px: e.clientX, py: e.clientY, p0: p, x0: manh[i].st.x, y0: manh[i].st.y, dong: false, t: Date.now() };
        capNhat();
      } else if (chon !== null && manh[chon].on) {
        keo = { id: e.pointerId, i: chon, kieu: "nen", da: true, px: e.clientX, py: e.clientY, p0: p, x0: manh[chon].st.x, y0: manh[chon].st.y, dong: false, t: Date.now() };
      }
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (!tro[e.pointerId]) return;
      tro[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (xoay2 && chon !== null) {
        var g2 = gocHaiNgon(); if (!g2) return;
        var m2 = manh[chon]; m2.st.r = chuanGoc(xoay2.r0 + (g2.g - xoay2.g0));
        giuTrong(goc[chon], m2.st, vungKeo); ve(m2); gui(m2); return;
      }
      if (!keo || keo.id !== e.pointerId) return;
      if (!keo.dong && Math.hypot(e.clientX - keo.px, e.clientY - keo.py) > 6) { keo.dong = true; manh[keo.i].chay = 0; }
      if (!keo.dong) return;
      var p = cm(e), m = manh[keo.i];
      m.st.x = keo.x0 + p[0] - keo.p0[0]; m.st.y = keo.y0 + p[1] - keo.p0[1];
      giuTrong(goc[keo.i], m.st, vungKeo); ve(m); gui(m);
    });
    function nha(e) {
      if (!tro[e.pointerId]) return;
      delete tro[e.pointerId];
      if (xoay2) {
        if (Object.keys(tro).length < 2) {
          xoay2 = null;
          if (chon !== null) {                     // góc gần một nấc xoay (lệch không quá 6°) thì về đúng nấc đó: cạnh gần thẳng theo ô ly thì thành thẳng hẳn
            var m3 = manh[chon], tron = nacGan(nacXoay(k, chon, m3.st.f), m3.st.r), tu3 = { x: m3.st.x, y: m3.st.y, r: m3.st.r, f: m3.st.f };
            if (Math.abs(lechVong(m3.st.r - tron)) <= 6) m3.st.r = chuanGoc(tron);
            tha(chon, tu3);
          }
        }
        return;
      }
      if (!keo || keo.id !== e.pointerId) return;
      var kk = keo; keo = null;
      if (kk.dong) { tha(kk.i); return; }
      if (kk.kieu === "manh") { if (kk.da && Date.now() - kk.t < 400) xoay(BUOC_XOAY); else capNhat(); }
      else { chon = null; capNhat(); }
    }
    svg.addEventListener("pointerup", nha);
    svg.addEventListener("pointercancel", nha);

    /* ---------------- bước 3: tấm thiệp đã có hình ---------------- */
    var svT = $("dtThiep"), lopT = null;
    svT.setAttribute("viewBox", "0 0 " + bc.W * U + " " + bc.H * U);
    S("rect", { "class": "giay", x: 0, y: 0, width: bc.W * U, height: bc.H * U }, svT);
    veTrangTri(S("g", { "class": "lop-tt" }, svT), k);
    lopT = S("g", { "class": "lop-manh" }, svT);
    function veThiepXong() {
      lopT.textContent = "";
      manh.filter(function (m) { return m.on; }).sort(function (a, b) { return a.st.t - b.st.t; }).forEach(function (m) {
        datManh(veManh(lopT, goc[m.so - 1], mau[m.so - 1], m.so, true), goc[m.so - 1], m.st);      // 16/11 10:02: "khi hình đã hoàn thành thì vẫn hiện các con số ở các mảnh ghép để các em nhìn theo đó dán giấy"
      });
    }

    /* ---------------- đổi màn hình ---------------- */
    /* 21/11: coBan đọc bề rộng, bề cao của khung bàn xếp, nên trình duyệt phải dàn lại cả trang ngay lúc đó. Trước đây việc này chạy mỗi lần có tin của nhóm
       (mỗi mảnh đang được kéo: 12 lần một giây), chiếm gần nửa thời gian máy bận. Bây giờ: tin từ máy chủ mà màn hình không đổi thì gom lại, đo một lần
       ở đầu khung hình kế tiếp (trước khi trình duyệt vẽ, nên mắt không thấy khác). Đổi màn, em tự bấm, xoay máy: vẫn đo ngay như trước. */
    var coBanHen = 0, tenCu = "";
    function coBanSau() {
      if (coBanHen) return;
      coBanHen = requestAnimationFrame(function () { coBanHen = 0; coBan(); });
    }
    function doiMan(tuMayChu) {
      var ten = xong ? "thiep" : man;
      an($("manNhap"), ten !== "nhap"); an($("manXep"), ten !== "xep"); an($("manThiep"), ten !== "thiep");
      chu($("dtTen"), ten === "nhap" ? "Nhiệm vụ 1: Đo đạc và tính toán" : ten === "xep" ? "Nhiệm vụ 2: Báo tường online" : "Tấm thiệp đã xong");
      if (ten !== "nhap" && O.kh) dongO();
      if (ten !== "xep") { if (ten !== tenCu || !hopAi) dongHop(); $("goiY").hidden = true; }      // 26/11 11:21: bảng hỏi của nút AI ở màn nhiệm vụ 1 không tự đóng mỗi lần dữ liệu đổi
      else if (hopAi && !$("hop").hidden) dongHop();      // vừa sang bàn xếp lúc bảng hỏi của nút AI còn mở: đóng
      if (ten === "thiep") veThiepXong();
      if (tuMayChu === true && ten === tenCu && !document.hidden && window.requestAnimationFrame) coBanSau(); else coBan();
      tenCu = ten;
      if (ten === "xep") capNhat();
    }

    /* ---------------- nối ---------------- */
    function trangThai(kieu) {
      var e = $("dtNoi");
      e.className = "noi " + kieu;
      kieuNoi = kieu;
      e.textContent = kieu === "ok" ? "Đã nối với tivi" : kieu === "cungmay" ? "Chạy thử" : kieu === "loi" ? "Mất kết nối" : kieu === "mat" ? "Mất mạng, đang nối lại…" : kieu === "lai" ? "Đang nối lại…" : "Đang nối…";
    }
    var kieuNoi = "cho";
    nutNoiLai($("dtNoiLai"), function () { return T; }, function () { return kieuNoi; });
    veGV(); veNhap(); doiMan(); capNhat();
    noi(phong, ts.thu, trangThai).then(function (t) {
      T = t;
      baoCua();
      if (laGV) T.on("gv", function (v) {
        if (v === null || v === undefined) return;      // tivi chưa ghi mã: chờ
        if (String(v) !== String(ts.gv)) { location.replace(duongGV()); return; }
        gvDung = true; veGV();
      });
      [1, 2, 3, 4].forEach(function (j) { T.on("n" + j + "/h1", function (v) { H1[j] = +v || 0; if (!lanDau) veNhap(); }); });      // giờ về đích của 4 nhóm, để biết nhóm mình về thứ mấy
      T.on("n" + k, function (d) {                 // mọi thay đổi của nhóm: số đo đã đúng, vị trí mảnh, đã hoàn thành
        d = d || {};
        var khoaCu = khoa3, moCu = daMo;
        nhap = d.d || {}; sai = d.s || {}; daMo = !!d.mo; khoa3 = d.khoa || {}; h1Nhom = +d.h1 || 0;
        if (daMo && !moCu && !lanDau && demDung(nhap) === THU_TU.length && man === "nhap") { dongO(); man = "xep"; }      // giáo viên vừa mở bước 2 cho nhóm đã xong bước 1: máy tự sang bàn xếp
        if (O.kh && khoaCu[O.kh] && !khoa3[O.kh] && !nhap[O.kh]) {      // GVCN vừa mở khóa mục đang mở trên máy này: xóa số cũ, cho nhập lại
          O.v = MUC[O.kh].o.map(function () { return ""; }); O.i = 0; O.kq = null; O.bao = "GVCN đã mở khóa. Em tính lại rồi nhập nhé."; O.lopBao = "";
        }
        var o = d.m || {};
        coNhom = d.co || {}; tinhDau();           // máy khác vào hay rời bàn xếp: chỗ nằm sẵn có thể đổi
        manh.forEach(function (m, i) {
          if ((keo && keo.i === i && keo.dong) || (xoay2 && chon === i) || guiCho[m.so] || dangChot) return;
          var coDb = mo(o["p" + m.so]), st = coDb || macDinh(i);      // chưa ai kéo mảnh này: nó nằm ở chỗ sẵn
          if (m.chay && Math.abs(st.x - m.st.x) < 0.002 && Math.abs(st.y - m.st.y) < 0.002 && Math.abs(lechGoc(st.r - m.st.r)) < 0.02) { m.dau = !coDb; return; }   // tiếng vọng của chính mình, đang trượt dở
          m.chay = 0; m.st = st; m.dau = !coDb; m.db = coDb ? { x: st.x, y: st.y, r: st.r, f: st.f, t: st.t } : null;
          giuTrong(goc[i], m.st, vungKeo);           // máy khác để mảnh ở chỗ máy này không thấy: hiện sát mép (chỉ trên máy này)
          ve(m);
        });
        xepLop();
        if (lanDau) { lanDau = false; man = duocXep() ? "xep" : "nhap"; }
        if (!duocXep()) man = "nhap";              // thầy cho làm lại từ đầu
        xong = !!d.xong;
        veNhap(); doiMan(true); capNhat();
      });
    });
  }

  /* =====================================================================
     TIVI
     ===================================================================== */
  /* chỗ đặt 3 ô Tổng, Thiệp, Phần còn lại trên tấm thiệp lúc nhóm còn đo và tính: [x, y của tâm ô (cm trên thiệp), bề rộng, chữ].
     Từ 14/11 16:16 các mảnh nằm sẵn theo hình mẫu, kín cả chỗ dán hình, nên 3 ô nằm ở chỗ ghi lời chúc (thiệp ngang: xếp dọc, thu còn 0,8).
     15/11 22:33 thầy bỏ chỗ ghi lời chúc: 3 ô nằm ở phần chỗ dán hình mà 10 mảnh nằm sẵn không chiếm (thiệp dọc: dải dưới; thiệp ngang: dải bên phải),
     xem MAU_DAU. Các em kéo mảnh vào đó được, nhưng 3 ô chỉ hiện lúc nhóm còn đo và tính (chưa ai kéo mảnh).
     Thiệp ngang: 10 mảnh nằm sẵn ở GIỮA tấm thiệp (kín bề ngang trừ 4,5 cm mỗi bên), không còn dải nào đủ rộng cho 3 ô. Nên riêng lúc nhóm còn đo và tính,
     tivi vẽ các mảnh lệch sang trái doi[0] cm (chỉ là chỗ vẽ, dữ liệu không đổi); thầy mở nhiệm vụ 2 thì 3 ô mờ đi và các mảnh về đúng chỗ (xem veNhom). */
  /* 16/11 10:02: thầy gửi 4 hình chỗ nằm sẵn mới, 10 mảnh rải kín cả tấm thiệp (tới sát mép dưới), trong thiệp không còn dải nào trống cho 3 ô.
     Nên 3 ô nằm thành MỘT HÀNG vắt trên mép dưới tấm thiệp (tâm ô thấp hơn mép 0,4 cm: 0,9 cm trong thiệp, 1,7 cm ngoài thiệp), svg.thiep để overflow: visible.
     Các mảnh của thiệp ngang không còn vẽ lệch 4 cm lúc đo và tính (doi), nên mở nhiệm vụ 2 thì mảnh không nhảy chỗ nữa. Lúc mã QR còn che thiệp thì 3 ô ẩn.
     16/11 13:11: 3 ô này và bảng CHO_O đã BỎ, thay bằng bảng nhiệm vụ 1 dưới đây. */
  /* 16/11 13:11, thầy (kèm ảnh màn nhiệm vụ 1 trên điện thoại nhóm 2): "Hình nhóm đang làm nhiệm vụ 1  cũng sẽ hiện lên màn hình tivi để mọi người cùng coi".
     Từ đó, lúc nhóm còn làm nhiệm vụ 1, tấm thiệp của nhóm trên tivi hiện đúng bảng các em thấy trên điện thoại: 7 ô mảnh ghép, ô "Đã đúng n/10"
     và 3 dòng Tổng diện tích 10 mảnh / Diện tích tấm thiệp / Diện tích phần còn lại. Bảng này thay cho 10 mảnh xám rải trên thiệp và 3 ô vắt trên mép dưới (bản 16/11 11:37).
     Thầy chọn 13:16 "Không hiện số" và dặn "Có dấu tick nhé": mục nào nhóm nhập đúng thì mảnh lên màu, ô đổi nền xanh và có dấu ✓ (22:08: kèm chữ "Chính xác", bỏ dấu ★), KHÔNG hiện số
     (bốn nhóm đo cùng một bộ mảnh, hiện số thì nhóm khác chép được). HIEN_SO_TV = true thì hiện cả số như trên điện thoại.
     Mục bị khóa (sai 3 lần): viền đỏ, hình ổ khóa, chữ "Đã khóa". Thầy mở nhiệm vụ 2 thì bảng mờ đi, 10 mảnh hiện ra ở chỗ nằm sẵn.
     Số đo dưới đây theo đơn vị của hình vẽ thiệp (10 đơn vị = 1 cm trên thiệp): x0, x1, y0 = mép bảng; cot = số ô một hàng; caoO = chiều cao ô; cm = cỡ vẽ mảnh trong ô. */
  var HIEN_SO_TV = false;
  /* 16/11 22:08, thầy: "bỏ cái mục dấu sao đi nhé và nhận xét đã đúng ngay lần nhập đầu bỏ luôn. Hình nào các em nhập đúng thì hiện chữ chính xác".
     Từ đó không còn dấu ★ và dòng "n mục đúng ngay lần đầu" ở đâu nữa (tivi, điện thoại, máy giáo viên); mục nhập đúng có dấu ✓ kèm chữ "Chính xác".
     (Dữ liệu n<k>/d/<mục> vẫn ghi "s" = đúng ngay lần đầu, "d" = đúng sau khi đã sai, nhưng không hiện ra.) */
  var CHU_DUNG = "Chính xác";
  var BANG_NV1 = {
    dung: { x0: 19, x1: 271, y0: 60, cot: 3, caoO: 62, cm: 5.6, caoD: 36, ten: { tong: ["Tổng diện tích 10 mảnh"], thiep: ["Diện tích tấm thiệp"], con: ["Diện tích phần còn lại"] } },
    ngang: { x0: 19, x1: 401, y0: 59, cot: 4, caoO: 66, cm: 6.6, caoD: 47, ten: { tong: ["Tổng diện tích", "10 mảnh"], thiep: ["Diện tích", "tấm thiệp"], con: ["Diện tích", "phần còn lại"] } }
  };
  function dungBangNv1(svg, k) {
    var B = BANG_NV1[NHOM[k]], HO = 5, lop = S("g", { "class": "lop-nv1" }, svg), o = {}, rong = B.x1 - B.x0, wO = (rong - (B.cot - 1) * HO) / B.cot, yO = B.y0 + 20;
    function dau(cha, x, y, r) {                   // dấu ✓ / ổ khóa ở góc ô
      var d = S("g", { "class": "nv1-dau", transform: "translate(" + f2(x) + " " + f2(y) + ")" }, cha), kh;
      S("circle", { r: r, "class": "dau-nen" }, d);
      S("path", { "class": "dau-v", d: "M" + f2(-0.47 * r) + " " + f2(0.04 * r) + "L" + f2(-0.13 * r) + " " + f2(0.4 * r) + "L" + f2(0.51 * r) + " " + f2(-0.38 * r) }, d);
      kh = S("g", { "class": "nv1-khoa", transform: "scale(" + f2(r / 9) + ")" }, d);
      S("path", { "class": "nv1-khoa-quai", d: "M-2.7 -0.6v-2a2.7 2.7 0 0 1 5.4 0v2" }, kh);
      S("rect", { "class": "nv1-khoa-than", x: -4.2, y: -0.8, width: 8.4, height: 6.2, rx: 1.3 }, kh);
    }
    Sc(lop, B.x0 + 1, B.y0 + 11.5, "nv1-ten", "Nhiệm vụ 1: Đo đạc và tính toán");
    KHOA_MANH.forEach(function (kh, i) {
      var M = MUC[kh], x = B.x0 + (i % B.cot) * (wO + HO), y = yO + Math.floor(i / B.cot) * (B.caoO + HO), p = daGiac(M.manh), bao = khung(p);
      var cx = (bao[0] + bao[2]) / 2, cy = (bao[1] + bao[3]) / 2, gy = 3 + (B.caoO - 14) / 2;      // 14 đơn vị dưới cùng dành cho chữ "2 mảnh", "Đã khóa"
      var g = S("g", { "class": "nv1-o", "data-kh": kh, transform: "translate(" + f2(x) + " " + f2(y) + ")" }, lop);
      S("rect", { "class": "nv1-nen", x: 0, y: 0, width: f2(wO), height: B.caoO, rx: 7 }, g);
      var than = S("polygon", { "class": "nv1-than", fill: MAU_XAM, points: p.map(function (q) { return f2(wO / 2 + (q[0] - cx) * B.cm) + "," + f2(gy + (q[1] - cy) * B.cm); }).join(" ") }, g);
      if (M.so.length > 1) Sc(g, 5.5, B.caoO - 5, "nv1-hai", "2 mảnh");
      o[kh] = { g: g, than: than, kq: Sc(g, wO - 5.5, B.caoO - 5, "nv1-kq", "", { "text-anchor": "end" }) };
      dau(g, wO - 11, 11, 8.6);
    });
    /* chỗ còn trống của lưới ô (thiệp dọc: 2 ô cuối hàng 3; thiệp ngang: ô cuối hàng 2): số mục đã đúng (dòng số sao bỏ 16/11 22:08) */
    var iT = KHOA_MANH.length, xT = B.x0 + (iT % B.cot) * (wO + HO), yT = yO + Math.floor(iT / B.cot) * (B.caoO + HO), wT = B.x1 - xT;
    var gt = S("g", { "class": "nv1-dem", transform: "translate(" + f2(xT) + " " + f2(yT) + ")" }, lop);
    S("rect", { "class": "nv1-nen", x: 0, y: 0, width: f2(wT), height: B.caoO, rx: 7 }, gt);
    Sc(gt, wT / 2, B.caoO / 2 - 9.5, "nv1-dem-nhan", "Đã đúng", { "text-anchor": "middle" });
    var dem = Sc(gt, wT / 2, B.caoO / 2 + 16, "nv1-dem-so", "0/" + THU_TU.length, { "text-anchor": "middle" });
    /* 3 dòng: thiệp dọc xếp chồng, thiệp ngang xếp một hàng 3 ô */
    var yD = yO + Math.ceil((iT + 1) / B.cot) * (B.caoO + HO) + 1, ngang = NHOM[k] === "ngang", wD = ngang ? (rong - 2 * HO) / 3 : rong;
    ["tong", "thiep", "con"].forEach(function (kh, i) {
      var x = B.x0 + (ngang ? i * (wD + HO) : 0), y = yD + (ngang ? 0 : i * (B.caoD + HO)), ten = B.ten[kh];
      var g = S("g", { "class": "nv1-d", "data-kh": kh, transform: "translate(" + f2(x) + " " + f2(y) + ")" }, lop);
      S("rect", { "class": "nv1-nen", x: 0, y: 0, width: f2(wD), height: B.caoD, rx: 7 }, g);
      ten.forEach(function (c, j) { Sc(g, 9, (ngang ? 14 : 15) + j * 11.5, "nv1-d-ten", c); });
      o[kh] = { g: g, kq: Sc(g, 9, B.caoD - (ngang ? 7.5 : 7), "nv1-d-kq", "") };
      if (ngang) dau(g, wD - 12, 12, 8.6); else dau(g, wD - 17, B.caoD / 2, 10);
    });
    return { lop: lop, o: o, dem: dem, ngang: ngang };
  }
  /* Tấm bảng chúc mừng trên thiệp của nhóm (16/11 22:08, xem MUNG_NV1): nằm giữa bảng nhiệm vụ 1, hiện từ lúc nhóm đúng đủ 10 mục tới khi thầy mở nhiệm vụ 2.
     Hiện bằng cách mờ dần và trượt nhẹ lên (không phóng to thu nhỏ). */
  function dungMung(svg, k) {
    var bc = BOCUC[NHOM[k]], W = bc.W * U, ngang = NHOM[k] === "ngang", w = ngang ? 300 : 262, h = 122, x = (W - w) / 2, y = ngang ? 112 : 172;
    var lop = S("g", { "class": "lop-mung" }, svg), hoa = S("g", { "class": "mung-hoa" }, lop), the = S("g", { "class": "mung-the" }, lop);
    var g = S("g", { transform: "translate(" + f2(x) + " " + y + ")" }, the), i;
    S("rect", { "class": "mung-bong", x: 2, y: 5, width: w, height: h, rx: 16 }, g);
    S("rect", { "class": "mung-nen", x: 0, y: 0, width: w, height: h, rx: 16 }, g);
    S("rect", { "class": "mung-vien", x: 5, y: 5, width: w - 10, height: h - 10, rx: 12 }, g);
    // 26/11 12:55 thầy: "chữ này bị dấu mũi tên 2 bên che nè, bỏ hết mấy dấu mũi tên đi nhé." → bỏ hai dải nơ nhỏ hai bên dòng giữa.
    return { lop: lop, hoa: hoa, W: W, H: bc.H * U,
      d1: Sc(g, w / 2, 36, "mung-d1", "", { "text-anchor": "middle" }),
      d2: Sc(g, w / 2, 70, "mung-d2", "", { "text-anchor": "middle" }),
      d3: Sc(g, w / 2, 102, "mung-d3", "", { "text-anchor": "middle" }) };
  }
  function tungGiaySvg(M) {                        // giấy màu rơi trong tấm thiệp (hệ đơn vị của hình vẽ thiệp); tự dọn sau 7 giây
    var mau = ["#f6c453", "#ef6f5e", "#5fb37c", "#5aa7e0", "#f3a1bd", "#b78be0"], i, e, ds = [];
    for (i = 0; i < 44; i++) {
      e = S("rect", { "class": "giay-svg", x: f2(6 + Math.random() * (M.W - 12)), y: -12, width: 5.2, height: 8, rx: 1.2, fill: mau[i % mau.length] }, M.hoa);
      e.style.setProperty("--x", (Math.random() * 50 - 25).toFixed(0) + "px"); e.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg"); e.style.setProperty("--cao", (M.H + 24) + "px");
      e.style.animationDelay = (Math.random() * 1.8).toFixed(2) + "s"; e.style.animationDuration = (3 + Math.random() * 1.6).toFixed(2) + "s";
      ds.push(e);
    }
    setTimeout(function () { ds.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); }); }, 7000);
  }
  function veBangNv1(B, d, mau) {                  // d = dữ liệu của nhóm; mau = bảng màu 10 mảnh của nhóm
    var nhap = d.d || {}, kh3 = d.khoa || {};
    THU_TU.forEach(function (kh) {
      var o = B.o[kh], M = MUC[kh], v = nhap[kh], kb = !!kh3[kh] && !v;
      o.g.classList.toggle("dung", !!v); o.g.classList.toggle("bi-khoa", kb);
      if (o.than) { datTT(o.than, "fill", v ? mau[M.so[0] - 1] : MAU_XAM); chu(o.kq, kb ? "Đã khóa" : v ? (HIEN_SO_TV ? M.dt + " cm²" : CHU_DUNG) : ""); }
      else chu(o.kq, kb ? "Đã khóa: sai " + SAI_KHOA + " lần" : v ? (HIEN_SO_TV ? M.o[M.o.length - 1].dung + " cm²" : CHU_DUNG) : "Chưa nhập");
    });
    chu(B.dem, demDung(nhap) + "/" + THU_TU.length);
  }

  /* MÀN NHẬP CỦA NHÓM TRÊN TIVI (25/11 08:05). Thầy, kèm ảnh ô nhập "Hình thoi (mảnh to)" trên điện thoại: "khi học sinh mà bấm vô nhập cái này nè thì trên màn hình
     của TV ấy, nó cũng sẽ hiện ra cái này luôn. Để cho giáo viên nhìn thấy học sinh đang nhập. Nhưng mà những cái ô số mà học sinh nhập á, thì nó sẽ không hiện ra.
     Học sinh nhập đúng thì nó hiện ra dấu tích, nhập sai thì hiện ra dấu chéo … đừng cứ hiện số để cho các nhóm khác khỏi copy."
     Điện thoại báo màn nhập đang mở vào <phòng>/nh/n<k>/<mã máy> (xem baoNhap; không có chữ số nào). Lúc nhóm còn làm nhiệm vụ 1 mà có máy đang mở ô nhập thì tấm thiệp
     của nhóm trên tivi hiện màn nhập đó thay cho bảng nhiệm vụ 1: tên mục, hình, các ô (mỗi chữ số đã gõ là một chấm tròn; sau khi bấm Kiểm tra ô đúng có dấu tích,
     ô sai có dấu chéo), dòng nhắc. Tivi không vẽ bàn phím. Hình minh họa của mục "Tổng diện tích 10 mảnh" trên tivi KHÔNG ghi diện tích từng mảnh (trên điện thoại có ghi).
     Nhiều máy của nhóm cùng mở ô nhập: hiện máy gõ sau cùng, góc phải ghi "n máy đang nhập". Đóng ô nhập (hoặc đúng rồi, 1,3 giây sau ô tự đóng) thì tivi về bảng nhiệm vụ 1.
     Số đo theo đơn vị của hình vẽ thiệp: ten = [x giữa, y]; hinh = [x, y, rộng, cao]; o = [mép trái, mép phải, y ô đầu, khoảng cách các ô]; bao = [x giữa, y (0: ngay dưới ô cuối), số chữ một dòng]. y tính từ y0. */
  var NH_BO = {
    dung: { x0: 16, x1: 274, y0: 56, cao: 348, ten: [145, 40], hinh: [28, 60, 234, 92], o: [26, 266, 160, 36], bao: [145, 0, 42], chu: 44, cot: 4 },
    ngang: { x0: 16, x1: 404, y0: 55, cao: 218, ten: [210, 21], hinh: [24, 42, 122, 122], o: [158, 396, 38, 33], bao: [210, 186, 66], chu: 22, cot: 3 }
  };
  var NH_CHU_CON = "Dán đủ 10 mảnh lên thiệp, không mảnh nào chồng lên nhau. Phần giấy còn trống rộng bao nhiêu?";
  function beDong(s, toiDa) {                      // cắt một câu thành các dòng không quá toiDa chữ (svg không tự xuống dòng)
    var ds = [], d = "";
    String(s).split(" ").forEach(function (w) { if (d && (d + " " + w).length > toiDa) { ds.push(d); d = w; } else d = d ? d + " " + w : w; });
    if (d) ds.push(d);
    return ds;
  }
  function nhDocMay(o) {                           // đọc lời báo của một máy; sai dạng thì bỏ
    var M, n, q, i, so = [], kq = [], c;
    if (!o || typeof o !== "object" || typeof o.kh !== "string" || !Object.prototype.hasOwnProperty.call(MUC, o.kh)) return null;
    M = MUC[o.kh]; n = String(o.n === undefined ? "" : o.n); q = String(o.q === undefined ? "" : o.q);
    for (i = 0; i < M.o.length; i++) { so.push(Math.max(0, Math.min(4, parseInt(n.charAt(i), 10) || 0))); c = q.charAt(i); kq.push(c === "d" || c === "s" ? c : ""); }
    return { kh: o.kh, i: typeof o.i === "number" ? o.i : -1, so: so, kq: kq, b: typeof o.b === "string" ? o.b.slice(0, 140) : "", l: o.l === "xau" || o.l === "tot" || o.l === "khoa" ? o.l : "", t: +o.t || 0 };
  }
  function nhChon(ds) {                            // ds = <phòng>/nh/n<k> → màn nhập của máy gõ sau cùng (kèm may = số máy đang mở ô nhập), hoặc null
    var id, x, chon = null, dem = 0;
    if (ds && typeof ds === "object") for (id in ds) if (Object.prototype.hasOwnProperty.call(ds, id)) {
      x = nhDocMay(ds[id]); if (!x) continue;
      dem++; if (!chon || x.t > chon.t) chon = x;
    }
    if (chon) chon.may = dem;
    return chon;
  }
  function dungManNhap(svg, k) {
    var B = NH_BO[NHOM[k]], lop = S("g", { "class": "lop-nh" }, svg);
    S("rect", { "class": "nh-nen", x: B.x0, y: B.y0, width: B.x1 - B.x0, height: B.cao, rx: 9 }, lop);
    S("rect", { "class": "nh-vien", x: B.x0 + 9, y: B.y0 + 8, width: 63, height: 15, rx: 7.5 }, lop);
    S("circle", { "class": "nh-cham", cx: B.x0 + 18.5, cy: B.y0 + 15.5, r: 2.7 }, lop);
    Sc(lop, B.x0 + 24.5, B.y0 + 18.6, "nh-dang", "Đang nhập");
    return { lop: lop, B: B, may: Sc(lop, B.x1 - 10, B.y0 + 18.6, "nh-may", "", { "text-anchor": "end" }), dau: S("g", { "class": "nh-dau" }, lop), hinh: S("g", { "class": "nh-hinh" }, lop), o: S("g", { "class": "nh-o" }, lop), ky: "", kyHinh: "" };
  }
  function nhVeHinh(g, kh, k, B, tot) {            // hình minh họa của mục đang nhập (như veHinhO trên điện thoại, nhưng không có số nào)
    var M = MUC[kh], mau = MAU[k], x = B.hinh[0], y = B.y0 + B.hinh[1], w = B.hinh[2], h = B.hinh[3], cx = x + w / 2, cy = y + h / 2;
    function ve(m, mauTo, ox, oy, s, coNet) {      // một mảnh, tâm khung bao đặt ở (ox, oy), s đơn vị vẽ cho 1 cm
      var p = daGiac(m), b = khung(p), dx = ox - (b[0] + b[2]) / 2 * s, dy = oy - (b[1] + b[3]) / 2 * s;
      function P(q) { return [dx + q[0] * s, dy + q[1] * s]; }
      function net(a, c) { a = P(a); c = P(c); S("line", { "class": "nh-net", x1: f2(a[0]), y1: f2(a[1]), x2: f2(c[0]), y2: f2(c[1]) }, g); }
      function vuong(q, sx, sy) { var t = P(q), e = 0.5 * s; S("path", { "class": "nh-vuong", d: "M" + f2(t[0] + sx * e) + " " + f2(t[1]) + "l0 " + f2(sy * e) + "l" + f2(-sx * e) + " 0" }, g); }
      S("polygon", { "class": "nh-than", points: p.map(function (q) { var t = P(q); return f2(t[0]) + "," + f2(t[1]); }).join(" "), fill: mauTo }, g);
      if (!coNet) return;
      if (m.loai === "thoi") { net(p[0], p[2]); net(p[1], p[3]); }
      else if (m.loai === "thang") { net(p[0], [p[0][0], p[3][1]]); vuong([p[0][0], p[3][1]], 1, -1); }
      else if (m.loai === "bh") { net(p[3], [p[3][0], p[0][1]]); vuong([p[3][0], p[0][1]], 1, 1); }
    }
    g.textContent = "";
    if (M.manh) {
      var b0 = khung(daGiac(M.manh));
      ve(M.manh, tot ? mau[M.so[0] - 1] : "#f1ece2", cx, cy, Math.min((w - 8) / (b0[2] - b0[0]), (h - 6) / (b0[3] - b0[1]), 11), true);
    } else if (kh === "tong") {                    // 7 loại mảnh, loại có 2 mảnh ghi "× 2"; KHÔNG ghi diện tích
      var cot = B.cot, hang = Math.ceil(KHOA_MANH.length / cot), cw = w / cot, ch = h / hang, toW = 0, toH = 0, s;
      KHOA_MANH.forEach(function (k2) { var b = khung(daGiac(MUC[k2].manh)); toW = Math.max(toW, b[2] - b[0]); toH = Math.max(toH, b[3] - b[1]); });
      s = Math.min((cw - 8) / toW, (ch - 13) / toH);
      KHOA_MANH.forEach(function (k2, i) {
        var M2 = MUC[k2], n = Math.min(cot, KHOA_MANH.length - Math.floor(i / cot) * cot), ox = cx + ((i % cot) - (n - 1) / 2) * cw, oy = y + Math.floor(i / cot) * ch + (ch - 9) / 2;
        ve(M2.manh, mau[M2.so[0] - 1], ox, oy, s, false);
        if (M2.so.length > 1) Sc(g, ox, y + Math.floor(i / cot) * ch + ch - 1.5, "nh-hai", "× 2", { "text-anchor": "middle" });
      });
    } else if (kh === "thiep") {
      var bc = BOCUC[NHOM[k]], W = bc.W * U, Hh = bc.H * U, tl = Math.min((w - 6) / W, (h - 6) / Hh);
      var g2 = S("g", { transform: "translate(" + f2(cx - W * tl / 2) + " " + f2(cy - Hh * tl / 2) + ") scale(" + tl.toFixed(4) + ")" }, g);
      S("rect", { "class": "nh-thiep", x: 0, y: 0, width: W, height: Hh }, g2);
      veTrangTri(S("g", { opacity: 0.55 }, g2), k);
    } else {
      var ds = beDong(NH_CHU_CON, B.chu);
      ds.forEach(function (c, i) { Sc(g, cx, cy + (i - (ds.length - 1) / 2) * 13 + 3.4, "nh-chu", c, { "text-anchor": "middle" }); });
    }
  }
  function veManNhap(N, x, k) {                    // x = kết quả của nhChon; null thì giữ nguyên hình đang có (lớp đang mờ dần)
    var B = N.B, M, ky, kyH, hai, n, y0, yBao, rO = 58, cO = 28, xO = B.o[1] - 22 - rO;
    if (!x) { N.ky = ""; return; }
    ky = JSON.stringify([x.kh, x.i, x.so, x.kq, x.b, x.l, x.may]);
    if (ky === N.ky) return;
    N.ky = ky; M = MUC[x.kh]; hai = M.so && M.so.length > 1;
    chu(N.may, x.may > 1 ? x.may + " máy đang nhập" : "");
    kyH = x.kh + "|" + (x.l === "tot" ? 1 : 0);
    if (kyH !== N.kyHinh) {                        // tên mục và hình chỉ vẽ lại khi đổi mục (hoặc mục vừa đúng: mảnh lên màu)
      N.kyHinh = kyH; N.dau.textContent = "";
      Sc(N.dau, B.ten[0], B.y0 + B.ten[1], "nh-ten", M.ten, { "text-anchor": "middle" });
      if (hai) Sc(N.dau, B.ten[0], B.y0 + B.ten[1] + 11.5, "nh-hai", "có 2 hình cùng diện tích", { "text-anchor": "middle" });
      nhVeHinh(N.hinh, x.kh, k, B, x.l === "tot");
    }
    N.o.textContent = "";
    n = M.o.length; y0 = B.y0 + B.o[2] + (4 - n) * B.o[3] / 2; yBao = B.bao[1] ? B.y0 + B.bao[1] : y0 + (n - 1) * B.o[3] + cO + 21;
    M.o.forEach(function (o, i) {
      var y = y0 + i * B.o[3], kq = x.kq[i], dang = x.i === i && !kq, g = S("g", { "class": "nh-d" + (kq === "d" ? " dung" : kq === "s" ? " sai" : "") + (dang ? " dang" : ""), "data-o": i }, N.o), cx = xO + rO / 2, cy = y + cO / 2, j;
      Sc(g, B.o[0], y + 18, "nh-nhan", o.nhan);
      S("rect", { "class": "nh-so", x: xO, y: y, width: rO, height: cO, rx: 6 }, g);
      Sc(g, B.o[1] - 18, y + 18, "nh-dv", o.dv || "cm");
      if (kq === "d") S("path", { "class": "nh-tich", d: "M" + f2(cx - 7.4) + " " + f2(cy + 0.5) + "l4.9 5.2l9.8 -10.9" }, g);
      else if (kq === "s") S("path", { "class": "nh-cheo", d: "M" + f2(cx - 5.7) + " " + f2(cy - 5.7) + "l11.4 11.4m0 -11.4l-11.4 11.4" }, g);
      else if (x.so[i]) for (j = 0; j < x.so[i]; j++) S("circle", { "class": "nh-cham-so", cx: f2(cx + (j - (x.so[i] - 1) / 2) * 10.4), cy: cy, r: 3.4 }, g);
      else if (dang) S("rect", { "class": "nh-nhay", x: f2(cx - 0.9), y: f2(cy - 7.5), width: 1.8, height: 15 }, g);
    });
    beDong(x.b, B.bao[2]).slice(0, 3).forEach(function (c, i) { Sc(N.o, B.bao[0], yBao + i * 13.4, "nh-bao" + (x.l ? " " + x.l : ""), c, { "text-anchor": "middle" }); });
  }

  /* Một tấm thiệp trên báo tường (tivi): giấy, trang trí thiệp, lưới bàn xếp, 10 mảnh, bảng nhiệm vụ 1.
     Lúc nhóm còn làm nhiệm vụ 1 thì 10 mảnh ẩn, chỉ hiện bảng nhiệm vụ 1 (xem BANG_NV1); thầy mở nhiệm vụ 2 thì ngược lại. */
  function dungKhung(svg, k) {
    var bc = BOCUC[NHOM[k]], W = bc.W * U, Hh = bc.H * U, dan = bc.dan, goc = BO.map(daGiac);
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hh);
    S("rect", { "class": "giay", x: 0, y: 0, width: W, height: Hh }, svg);
    veTrangTri(S("g", { "class": "lop-tt" }, svg), k);
    var lopLuoi = S("g", { "class": "lop-luoi" }, svg);      // 15/11 18:31: tivi không vẽ lưới nữa, mảnh nằm ngay trên tờ thiệp (lớp này chỉ còn dùng khi phải thu nhỏ vì dữ liệu cũ)
    var lop = S("g", { "class": "lop-manh" }, svg), g = {}, khoaCua = {};
    KHOA_MANH.forEach(function (kh) { MUC[kh].so.forEach(function (so) { khoaCua[so] = kh; }); });
    goc.forEach(function (p, i) { g[i + 1] = veManh(lop, p, MAU[k][i], i + 1, false); });
    return { nv1: dungBangNv1(svg, k), nh: dungManNhap(svg, k), mung: dungMung(svg, k), hang: 0, lop: lop, lopLuoi: lopLuoi, g: g, khoaCua: khoaCua, dan: dan, W: bc.W, H: bc.H, cua: "" };
  }

  /* ---------- chấm điểm 4 nhóm theo rubric (25/11) ----------
     Thầy 25/11 01:26 (luồng "Giáo án docx"): "khi tôi bấm chấm điểm thì chỗ hình thiệp của 4 nhóm sẽ hiện ra bảng để chấm, còn giữa màn hình là các tiêu chí của rubric".
     01:42: "chỗ này là hiện nguyên bảng rubric, tiêu chí 1 là máy tự chấm nhé. hiện to lên, che luôn mấy cái dòng 51 năm cũng được nhé. ở trên điện thoại thì có thêm nút
     các nhóm đạt điểm tối đa để nếu tôi thấy tốt hết thì bấm nút đó, với lại cho chấm trên điện thoại nữa nếu chẳng may tivi bị hư không bấm được. có thêm dẫu x để tôi tắt
     màn hình chấm điểm quay về báo tường."
     Thang 10 điểm, 4 tiêu chí (3 + 3 + 2 + 2), 3 mức Tốt / Đạt / Cần cố gắng. so = điểm của 3 mức; muc = chữ trong bảng rubric trên tivi (bản rút gọn cho đủ to;
     bản đầy đủ nằm trong giáo án). Điểm thầy chấm nằm trên máy chủ ở <phòng>/diem/n<k>/t<1..4> (tải lại trang vẫn còn; "Xóa hết, về nhiệm vụ 1" xóa cả điểm).
     Tiêu chí 1 do máy chấm (diemMay): mục từng bị khóa = mục có số lần nhập sai n<k>/s/<mục> từ 3 trở lên (số này vẫn còn sau khi thầy mở khóa).
     Nhóm đã đúng đủ 10 mục: không mục nào từng bị khóa = 3 điểm, 1 mục = 2 điểm, từ 2 mục = 1 điểm; chưa đúng đủ 10 mục = 1 điểm.
     Thầy vẫn chạm đổi được tiêu chí 1: số thầy chọn ghi vào t1; chạm lại đúng số máy chấm thì bỏ t1, về lại máy chấm. */
  var TIEU_CHI = [
    { ten: "Đo và tính", so: [3, 2, 1], may: true, muc: ["Đúng hết, không mục nào bị khóa", "Đúng hết, có 1 mục bị khóa", "Từ 2 mục bị khóa, hoặc chưa tính xong"] },
    { ten: "Ghép và dán tranh", so: [3, 2, 1], muc: ["Đủ 10 mảnh, đúng hình, không chồng, dán phẳng", "Đủ mảnh, đúng hình; vài mảnh lệch, chưa phẳng", "Thiếu mảnh, sai hình, hoặc chồng, lấn mép"] },
    { ten: "Trình bày", so: [2, 1, 0], muc: ["Nói to, rõ; đủ 3 ý: hình, ý nghĩa, lời chúc", "Được 2 trong 3 ý, hoặc nói còn nhỏ", "Chỉ được 1 ý, hoặc chưa trình bày được"] },
    { ten: "Hợp tác nhóm", so: [2, 1, 0], muc: ["Bạn nào cũng có việc; xong trong 15 phút", "Còn 1–2 bạn chưa làm, hoặc phải nhắc giờ", "Vài bạn làm thay cả nhóm, hoặc chưa xong"] }
  ];
  var DIEM_TOI_DA = 0;
  TIEU_CHI.forEach(function (tc) { DIEM_TOI_DA += tc.so[0]; });
  function diemMay(d) {                           // điểm tiêu chí 1 của một nhóm, tính từ dữ liệu nhiệm vụ 1 của nhóm đó
    var s, n = 0;
    d = d || {}; s = d.s || {};
    if (demDung(d.d) < THU_TU.length) return 1;
    THU_TU.forEach(function (kh) { if ((+s[kh] || 0) >= SAI_KHOA) n++; });
    return n === 0 ? 3 : n === 1 ? 2 : 1;
  }
  function diemNhom(DIEM, k, d) {                 // → { v: [điểm 4 tiêu chí, null = chưa chấm], may: điểm máy chấm, tay: thầy đã sửa tiêu chí 1, tong }
    var o = DIEM && typeof DIEM["n" + k] === "object" && DIEM["n" + k] || {}, v = [], tong = 0, may = diemMay(d), tay = false;
    TIEU_CHI.forEach(function (tc, i) {
      var x = o["t" + (i + 1)];
      x = typeof x === "number" && tc.so.indexOf(x) >= 0 ? x : null;
      if (tc.may) { if (x === null || x === may) x = may; else tay = true; }
      v.push(x); if (x !== null) tong += x;
    });
    return { v: v, may: may, tay: tay, tong: tong };
  }
  function chamGhi(T, k, i, x, d) {               // thầy chạm số x ở tiêu chí thứ i (từ 0) của nhóm k
    var p = "diem/n" + k + "/t" + (i + 1);
    if (!T) return;
    if (TIEU_CHI[i].may && x === diemMay(d)) T.remove(p); else T.set(p, x);
  }

  function chayTivi(ts) {
    document.body.className = "tv";
    $("tvNen").hidden = false;
    $("tv").hidden = false;
    var phong = ts.p, thu = ts.thu, T = null, goc = BO.map(daGiac), khungNhom = {}, duLieu = {}, lon = 0;
    /* Thầy dặn 14/11 16:18: "cái hình báo tường sẽ hiện xuyên suốt cái hoạt động này luôn". Tivi chỉ còn một màn là tấm báo tường; mỗi tấm thiệp có một mã QR nằm ngay trên nó (từ 15/11 cả 4 là cùng một mã).
       xem = "vao": mới mở trang, mã hiện trên thiệp của nhóm chưa nhập đúng mục nào (nhóm đã làm được thì mã tự ẩn để thấy bài);
             "ma": thầy bấm Mã QR, mã hiện ở cả 4 thiệp (cho máy vào sau); "xep": thầy bấm Ẩn mã QR, không hiện mã. */
    var xem = "vao", daVao = {};
    if (!phong) { try { phong = localStorage.getItem("xt-phong"); } catch (e) { phong = null; } }
    if (!phong || !/^[a-z0-9]{3,12}$/.test(phong)) phong = maNgauNhien(5);
    try { localStorage.setItem("xt-phong", phong); } catch (e) { /* bỏ qua */ }
    giuSang();
    /* Máy giáo viên (thầy dặn 15/11 19:18). Mỗi phòng có một mã giáo viên, nằm trong link cho máy giáo viên (Cài đặt → "Mã cho máy giáo viên").
       Tivi ghi mã lên máy chủ (<phòng>/gv); trang giáo viên chỉ hiện nút khi mã trong link của nó trùng mã này. Phòng đã có mã thì tivi dùng mã đó. */
    var maGV = null, luuGV;
    try { luuGV = (localStorage.getItem("xt-gv") || "").split(":"); if (luuGV[0] === phong && /^[a-z0-9]{6}$/.test(luuGV[1] || "")) maGV = luuGV[1]; } catch (e) { maGV = null; }
    if (!maGV) { maGV = maNgauNhien(6); try { localStorage.setItem("xt-gv", phong + ":" + maGV); } catch (e) { /* bỏ qua */ } }
    function linkGV() { return location.origin + location.pathname + "?p=" + phong + "&gv=" + maGV + (thu ? "&thu=1" : ""); }

    /* 16/11 06:30, thầy: "MÀN HÌNH HIỆN RA Y CHANG LÚC CHƠI TRÒ RƯỚC ĐUỐC". Báo tường nằm đúng như màn cuối của trang Rước đuốc (js/san-khau.js: khung K và vuaManHinh):
       ảnh 1472 × 1041 nằm giữa màn hình 1920 × 1080. Màn hình không phải 16:9 thì cả khung gỗ (ảnh thêm 16 px mỗi phía) cao vừa màn hình, cách mép 8 px,
       hai bên chừa ít nhất 76 px, y như bên đó. Trang này vẽ báo tường rộng 1527 nên phần .xep (báo tường, 4 thiệp, nút Cài đặt) và đồng hồ đếm ngược co theo --bt quanh tâm màn hình. */
    var BT_RONG = 1472, BT_CAO = 1041;
    function coGian() {
      var vw = window.innerWidth, vh = window.innerHeight, s = Math.min(vw / 1920, vh / 1080);
      var tl = (BT_CAO + 32) / (BT_RONG + 32), cao = Math.min(vh - 16, (vw - 152) * tl), sb = Math.max(1, cao / s / (BT_CAO + 32));
      $("tv").style.transform = "translate(-50%,-50%) scale(" + s + ")";
      $("tv").style.setProperty("--bt", (BT_RONG * sb / 1527).toFixed(5));
      /* 27/11 21:18, thầy: "xếp mấy cái nút đó qua góc phải đi" → cụm 6 nút (2 cột × 3 hàng, rộng 122, cao 188) ở góc phải phía dưới, giữa dải viền mờ
         bên phải báo tường; cách mép dưới phần nhìn thấy bằng khoảng cách hai bên (ít nhất 24, nhiều nhất 60). Tọa độ sân 1920 × 1080. Dòng báo nối ngay trên cụm nút. */
      var bt = BT_RONG * sb / 1527, phai = 960 + vw / s / 2, day = 540 + vh / s / 2, mep = 960 + 763.5 * bt, rong = phai - mep;
      var NR = 122, NC = 188, le = Math.max(8, Math.min(60, (rong - NR) / 2));
      var trai = rong >= NR + 16 ? mep + (rong - NR) / 2 : phai - 8 - NR, tren = day - Math.max(24, le) - NC, st = $("tv").style;
      st.setProperty("--nutTrai", trai.toFixed(1) + "px"); st.setProperty("--nutTren", tren.toFixed(1) + "px");
      st.setProperty("--noiGiua", (trai + NR / 2).toFixed(1) + "px"); st.setProperty("--noiDay", (1080 - tren + 10).toFixed(1) + "px");
      st.setProperty("--noiRong", Math.round(Math.max(120, Math.min(176, rong - 12))) + "px");
    }
    window.addEventListener("resize", coGian); coGian();

    /* 15/11 13:44, thầy: "vẫn 4 mã nhưng vẫn 4 phía như trên. nhưng tuy là 4 mã nhưng mã giống nhau hết" → 4 chỗ hiện cùng MỘT mã.
       n=0 = chưa biết nhóm: điện thoại mở màn chọn nhóm (chonNhom). Link cũ có n=1..4 vẫn vào thẳng nhóm đó. */
    function link() { return location.origin + location.pathname + "?p=" + phong + "&n=0" + (thu ? "&thu=1" : ""); }
    function veMa() {
      var l = link(), hinh = "";
      if (window.qrcode) { var q = window.qrcode(0, "M"); q.addData(l); q.make(); hinh = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
      [1, 2, 3, 4].forEach(function (k) {
        var o = $("ma" + k);
        if (hinh) o.innerHTML = hinh; else o.textContent = l;
        o.setAttribute("data-link", l);
      });
      $("maPhong").textContent = phong;
    }

    [1, 2, 3, 4].forEach(function (k) {
      var o = $("khung" + k), svg = o.querySelector("svg.thiep"), K = dungKhung(svg, k);
      K.o = o; K.hien = {}; K.daVe = {}; K.thuTu = ""; K.tt = o.querySelector(".tt"); K.xong = false; K.pha = "";
      K.noi = H("div", "ket-noi", null, o); H("b", null, "Nhóm " + k, K.noi); H("span", null, "đã kết nối", K.noi);      // 26/11 10:52, xem baoKetNoi
      H("div", "ten-nhom", "Nhóm " + k, o);      // 27/11 21:35 + 22:00: tên nhóm (chữ như băng rôn báo tường) ở giữa mép dưới tấm thiệp (xem .ten-nhom trong index.html)
      khungNhom[k] = K;
      o.querySelector(".the").onclick = function () { phong_to(k); };
      svg.onclick = function () { if (chamHien) { chamAnBang(k, false); return; } phong_to(k); };      // đang chấm điểm mà bảng nhóm này đang ẩn: chạm tấm thiệp là hiện lại bảng (không hiện to thiệp)
      /* 15/11 21:29, thầy (kèm ảnh cột nút trên tivi): "mấy nút này chuyển hết vào app cho tôi đi." Từ đó thẻ nhóm trên tivi không còn nút;
         nút Mở nhiệm vụ 2 và Mở khóa của từng nhóm nằm trên máy giáo viên, bản dự phòng nằm trong bảng Cài đặt của tivi (cdMo<k>, cdKhoa<k>). */
      K.moBan = $("cdMo" + k); K.moKhoa = $("cdKhoa" + k);
      K.moBan.onclick = function () { if (T) T.set("n" + k + "/mo", 1); };
      K.moKhoa.onclick = function () { if (!T) return; var u = {}; u["n" + k + "/khoa"] = null; T.update(u); };      // 15/11 19:02: thầy mở khóa các mục nhóm đã nhập sai 3 lần
    });
    function phong_to(k) {                        // chạm một khung: hiện riêng khung đó thật lớn, chạm lần nữa để về
      lon = lon === k ? 0 : k;
      [1, 2, 3, 4].forEach(function (i) { khungNhom[i].o.classList.toggle("lon", lon === i); khungNhom[i].o.classList.toggle("an", lon && lon !== i); });
      $("tv").classList.toggle("dang-lon", !!lon);
      veNut3d(); veLai3d(); bao3d();
    }
    /* Tivi báo cho máy giáo viên trong <phòng>/tv3d: l = thiệp đang hiện to (0 = báo tường), c = "0100" nhóm đang chạy Tranh 3D, b = "1100" nhóm đã được bấm,
       q = 1 khi mã QR đang hiện trên thiệp nào đó, d = 1 khi bảng Đáp số đang mở, n = 1 khi bảng Nhiệm vụ đang mở,
       m = nhạc nền: 0 thầy đang tắt, 1 đang phát, 2 trình duyệt chưa cho phát (phải chạm một lần vào màn hình tivi), 3 đang chọn "Không dùng nhạc", 4 không mở được bài hát,
       p = 1 khi pháo hoa đang bắn (25/11; bỏ lúc 06:02, trở lại lúc 11:10 theo lời thầy), g = 1 khi màn Chấm điểm đang hiện (25/11),
       bd = 1 khi Báo tường động đang chạy, bc / ba = số ảnh khung to / khung nhỏ của Báo tường động có trong máy tivi, bn = 1 khi có bài hát của Báo tường động (27/11). */
    var tt3dCu = null;
    function bao3d() {
      var c = "", b = "", ky, q, d, n, p = phaoLuc ? 1 : 0, bd = btdBao();
      if (!T) return;
      [1, 2, 3, 4].forEach(function (k) { c += hx[k].chay ? "1" : "0"; b += hx[k].bam ? "1" : "0"; });
      q = [1, 2, 3, 4].some(hienMa) ? 1 : 0; d = $("dapSo").hidden ? 0 : 1; n = $("nhiemVu").hidden ? 0 : 1;
      ky = lon + "|" + c + "|" + b + "|" + q + d + n + nhacTT() + amTT() + p + (chamHien ? 1 : 0) + "|" + bd.join(",");
      if (ky === tt3dCu) return;
      tt3dCu = ky; T.set("tv3d", { l: lon, c: c, b: b, q: q, d: d, n: n, m: nhacTT(), a: amTT(), p: p, g: chamHien ? 1 : 0, bd: bd[0], bc: bd[1], ba: bd[2], bn: bd[3] });
    }
    /* Các bảng che báo tường: Cài đặt, Mã cho máy giáo viên (chỉ mở trên tivi), Đáp số, Nhiệm vụ (mở được từ máy giáo viên). Mỗi lúc chỉ một bảng. Hiện ngay, không phóng to thu nhỏ. */
    function dongBang() { $("caiDat").hidden = true; $("gvMa").hidden = true; }
    function hienDapSo(b) { if (b) { dongBang(); $("nhiemVu").hidden = true; } $("dapSo").hidden = !b; bao3d(); }
    function hienNhiemVu(b) { if (b && !NHIEM_VU) return; if (b) { dongBang(); $("dapSo").hidden = true; } $("nhiemVu").hidden = !b; if (b) vuaNhiemVu(); bao3d(); }
    function veBaoTuong() { dongBang(); $("dapSo").hidden = true; $("nhiemVu").hidden = true; if (lon) phong_to(lon); chamAn(); bao3d(); }
    /* Lệnh từ máy giáo viên, trong <phòng>/lenh = { i: mã lệnh, v, k }: v = "3d" hiện to thiệp nhóm k và chạy Tranh 3D; "dung" dừng Tranh 3D nhóm k;
       "ve" về báo tường (đóng mọi bảng, thôi hiện to); "ma" hiện (k = 1) hay ẩn (k = 0) mã QR; "dap" hiện / ẩn bảng Đáp số; "nv" hiện / ẩn bảng Nhiệm vụ;
       "phao" bắn pháo hoa (25/11: thầy chọn Có ở câu hỏi "Hiện pháo hoa?" trên máy giáo viên; bỏ lúc 06:02, trở lại lúc 11:10); "cham" hiện (k = 1) hay tắt (k = 0) màn Chấm điểm (25/11).
       27/11: "phao" có thể kèm n = các nhóm chạy Tranh 3D cùng lúc với pháo (vd "4"); "3dds" chạy Tranh 3D các nhóm trong n (thầy chọn Không ở câu hỏi pháo hoa);
       "btd" bật (k = 1) hay dừng (k = 0) Báo tường động. Hai lệnh liền nhau thì tivi chỉ làm lệnh sau, nên pháo và Tranh 3D đi chung một lệnh.
       Lệnh đang nằm sẵn lúc tivi mở trang là lệnh cũ: không làm. */
    var lenhCu;
    function nhanLenh(L) {
      var i = L && L.i ? String(L.i) : "", k;
      if (lenhCu === undefined) { lenhCu = i; return; }
      if (!i || i === lenhCu) return;
      lenhCu = i; k = +L.k;
      if (L.v === "ve") { veBaoTuong(); return; }
      if (L.v === "ma") { if (k) veBaoTuong(); doiXem(k ? "ma" : "xep"); return; }
      if (L.v === "dap") { hienDapSo(!!k); return; }
      if (L.v === "nv") { hienNhiemVu(!!k); return; }
      if (L.v === "phao") { batPhao(); chay3dDs(L.n); return; }
      if (L.v === "3dds") { chay3dDs(L.n); return; }
      if (L.v === "btd") { if (k) btdBat(); else btdTat(); return; }
      if (L.v === "cham") { hienCham(!!k); return; }
      if (!(k >= 1 && k <= 4)) return;
      if (L.v === "3d") lenh3d(k);
      else if (L.v === "dung") dung3d(k);
    }
    function chay3dDs(ds) {                        // 27/11: thầy trả lời câu hỏi pháo hoa (Có hay Không): Tranh 3D tự chạy cho nhóm hoàn thành sau cùng (ds = "4"); nhóm đang chạy thì để yên
      String(ds || "").split("").forEach(function (s) { var k = +s; if (k >= 1 && k <= 4 && !hx[k].chay) lenh3d(k); });
    }
    function lenh3d(k) {                           // lệnh "3d": thầy bấm Tranh 3D của nhóm k trên máy giáo viên
      if (!T3 || !(duLieu[k] || {}).xong) return;
      dongBang(); $("dapSo").hidden = true; $("nhiemVu").hidden = true;      // thầy đang bấm từ điện thoại: dẹp các bảng đang che thiệp
      if (hienMa(k)) { xem = "xep"; capNhatMa(); }
      if (lon) phong_to(lon);                    // 16/11 10:02, thầy: "tranh 3d không cần hiện to lên làm gì nhé" → thiệp chạy ngay tại chỗ của nó trên báo tường (đang có thiệp hiện to thì về báo tường)
      bat3d(k);
    }

    /* ---------- Tranh 3D (15/11; phần vẽ ở js/tranh-3d.js) ----------
       Thầy dặn 14/11 16:27: nhóm bấm Hoàn thành thì thiệp đứng yên, hoạt ảnh do thầy bấm. 15/11 13:19: tên là "Tranh 3D", thầy bấm cho từng nhóm;
       đủ 4 nhóm được bấm thì hiện pháo bông, không có chữ 51 năm, không làm tối màu.
       25/11 01:31, thầy: "pháo hoa là phím do tôi chọn" → bấm Tranh 3D đủ 4 nhóm KHÔNG còn tự bắn pháo; pháo chỉ bắn khi thầy chọn Có trên máy giáo viên (batPhao).
       25/11 06:02, thầy: "bỏ cái pháo hoa đi nhé" → gỡ pháo hoa. 25/11 11:10, thầy: "bổ sung lại pháo hoa đi" → pháo hoa trở lại, y như bản 01:31.
       Cách dùng: chạm thiệp của nhóm đã hoàn thành → thiệp hiện to → nút "Tranh 3D" (đang chạy thì thành "Dừng"), "Đóng". Thiệp đã bấm vẫn chạy khi về báo tường.
       hx[k]: cv, c = canvas đè lên thiệp; ky = chữ ký chỗ 10 mảnh lúc so hình; kieu = k (khớp hình mẫu của nhóm) hay "td" (hình tự nghĩ);
              P0, Q = đa giác lúc các em đặt và đa giác mẫu (trong hệ của mẫu), dx, dy = độ dời của cả hình so với mẫu; e = 0..1 mảnh trượt từ P0 về Q;
              chay = thầy đang cho chạy; a = 0..1 độ đậm của hoạt ảnh; t0 = lúc bấm; bam = nhóm đã được bấm ít nhất một lần; tinh = đã vẽ xong hình đứng yên.
       Tranh 3D chỉ nằm trên tivi này (không ghi lên máy chủ): tải lại trang thì thầy bấm lại. Hình của nhóm đổi (Sửa lại hình, Xóa hình) thì tranh 3D của nhóm đó bị bỏ. */
    var T3 = window.Tranh3D || null, hx = { 1: {}, 2: {}, 3: {}, 4: {} }, phaoLuc = 0, vong = 0, lucTruoc = 0, boQua = false;
    function daGiacNhom(k) {                       // đa giác 10 mảnh nhóm k đang hiện trên thiệp (cm) và chữ ký để biết hình có đổi không
      var d = duLieu[k] || {}, m = d.m || {}, ps = {}, ky = [], so, st, dau = viTriDau(k);
      for (so = 1; so <= goc.length; so++) { st = mo(m["p" + so]) || dau[so - 1]; ps[so] = toaDo(goc[so - 1], st); ky.push([f2(st.x), f2(st.y), f2(st.r), st.f ? 1 : 0].join(",")); }
      return { ps: ps, ky: ky.join(";") };
    }
    function chuan3d(k) {                          // so hình của nhóm với hình mẫu của nhóm đó (hình đổi thì so lại)
      var X = hx[k], h = daGiacNhom(k), r, i;
      if (X.ky === h.ky) return X;
      r = T3.khop(HINH[k], h.ps);      // tranh-3d.js đánh số theo hình mẫu (xem HINH)
      X.ky = h.ky; X.M = {};
      for (i = 1; i <= 10; i++) X.M[i] = MAU[k][i - 1];
      if (r.ok) { X.kieu = k; X.P0 = r.P0; X.Q = r.Q; X.dx = r.dx; X.dy = r.dy; X.e = 0; }
      else { X.kieu = "td"; X.P0 = X.Q = h.ps; X.dx = X.dy = 0; X.e = 1; }
      return X;
    }
    function bat3d(k) {
      var K = khungNhom[k], X;
      if (!T3 || !(duLieu[k] || {}).xong) return;
      X = chuan3d(k);
      if (!X.cv) { X.cv = document.createElement("canvas"); X.cv.className = "lop-3d"; K.o.insertBefore(X.cv, K.o.querySelector(".ma-phu")); X.c = X.cv.getContext("2d"); X.a = 0; }
      X.chay = true; X.bam = true; X.tinh = false; X.t0 = performance.now();
      K.o.classList.add("co-3d");
      K.o.setAttribute("data-3d", String(X.kieu));      // 1..4 = hình khớp mẫu của nhóm đó, "td" = hình nhóm tự nghĩ (bài thử đọc)
      capNhat3d(); chayVong();
    }
    function dung3d(k) { var X = hx[k]; if (X.cv) { X.chay = false; X.tinh = false; } capNhat3d(); chayVong(); }
    function bo3d(k) {
      var X = hx[k];
      if (X.cv && X.cv.parentNode) X.cv.parentNode.removeChild(X.cv);
      khungNhom[k].o.classList.remove("co-3d"); khungNhom[k].o.removeAttribute("data-3d");
      hx[k] = {};
      capNhat3d();
    }
    function veThiep3d(k, luc, dt) {               // vẽ một khung hình của thiệp nhóm k; trả về true nếu thiệp còn đang chuyển động
      var X = hx[k], K = khungNhom[k], cv = X.cv, bc = BOCUC[NHOM[k]], r, tl, w, h, t, u, c, P;
      if (!cv) return false;
      t = (luc - X.t0) / 1000;
      X.a = X.chay ? Math.min(1, X.a + dt / 0.5) : Math.max(0, X.a - dt / 0.35);
      if (X.chay && X.e < 1) X.e = Math.min(1, Math.max(X.e, t / 0.5));
      if (K.o.classList.contains("an")) return X.chay || X.a > 0;      // thiệp đang ẩn (thiệp khác đang hiện to): không vẽ
      r = cv.getBoundingClientRect();
      if (r.width < 2) return X.chay || X.a > 0;
      tl = Math.min(window.devicePixelRatio || 1, 1400 / Math.max(r.width, r.height));      // khung vẽ không quá 1400 điểm ảnh mỗi chiều, cho máy yếu
      w = Math.max(2, Math.round(r.width * tl)); h = Math.max(2, Math.round(r.height * tl));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; X.tinh = false; }
      if (X.tinh) return false;
      c = X.c; u = w / bc.W;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
      c.setTransform(u, 0, 0, u, X.dx * u, X.dy * u);
      P = T3.tron(X.P0, X.Q, T3.muot(X.e));
      T3.ve(c, X.kieu === "td" ? "td" : HINH[X.kieu], Math.max(0, t), X.a, P, X.M, [bc.W, bc.H], u);
      if (!X.chay && X.a <= 0) { X.tinh = true; return false; }
      return true;
    }
    /* ---------- pháo bông: trời đêm, tiếng pháo thật, nhạc tắt (25/11) ----------
       Thầy, 25/11 00:10: "khi cả 4 nhóm xếp xong hình trên điện thoại xong thì sẽ có pháo bông bắn lên. bạn hãy tìm kiếm để làm pháo bông giống năm mới hoặc các dịp lễ á
       và lúc pháo bông bắn lên thì tiếng nhạc tắt và có tiếng pháo bông, nhớ sử dụng tiếng pháo giống pháo thật nhé."
       25/11 01:31, thầy: "pháo hoa ok rồi đó nhưng đừng có làm tôi màn hình cứ bắn bình thường thôi là được, với lại pháo hoa là phím do tôi chọn. nó sẽ bị ẩn trên đt,
       khi nào xong hết 4 bức thì hiện ra để tôi bấm. khi nào cả 4 nhóm hoàn thành, thì màn hình điện thoại sẽ hiện ra câu hỏi Hiện pháo hoa rồi cho chọn có hoặc không."
       → không còn lớp trời đêm; lúc bắn: máy giáo viên gửi lệnh "phao" (thầy chọn Có), 0,4 giây sau pháo bắt đầu (batPhao). Phần vẽ ở js/tranh-3d.js (vePhaoBong).
       25/11 06:02, thầy: "bỏ cái pháo hoa đi nhé" → gỡ. 25/11 11:10, thầy: "bổ sung lại pháo hoa đi" → cả khối này trở lại nguyên văn bản 01:31.
       Nhạc nền: nhỏ dần trong 0,9 giây rồi TẮT hẳn (ghi <phòng>/nhac b = 0, máy giáo viên thấy nút nhạc về "tắt"); hết pháo nhạc không tự bật lại.
       Tiếng pháo: nhac/phao-bong.mp3, 19 giây cắt từ một bản thu thật (BigSoundBank số 2672 của Joseph Sardin, CC0, xem test/lam-phao.py), phát lúc tf = T3.PHAO_AM;
       các quả pháo trên màn hình nổ đúng lúc các tiếng nổ trong bản thu. Tiếng ra thẳng loa, không theo nút âm lượng của nhạc nền (như tiếng trống).
       Tivi tải tệp này 2,5 giây sau hai tiếng trống. Lúc pháo bắt đầu mà tệp chưa tải xong, hay trình duyệt chưa cho phát tiếng (tivi chưa được chạm lần nào): cứ 0,25 giây thử lại,
       được lúc nào thì phát tiếp từ đúng chỗ của lúc đó (không phát lại từ đầu), để tiếng nổ vẫn khớp hình. #phao[data-am] = "số lần đã phát,giây bỏ qua ở lần gần nhất" cho bài thử đọc. */
    var PHAO_TEP = "nhac/phao-bong.mp3", PHAO_TO = 0.9;
    var phaoMau = null, phaoDangTai = false, phaoSrc = null, phaoHen = 0, phaoLan = 0, phaoDem = 0;
    function phaoTai() {                            // tải và giải mã tiếng pháo, một lần
      var ac = amAC();
      if (phaoMau || phaoDangTai || !ac || !window.fetch) return;
      phaoDangTai = true;
      fetch(PHAO_TEP).then(function (r) { if (!r.ok) throw new Error("tải " + r.status); return r.arrayBuffer(); }).then(function (b) {
        ac.decodeAudioData(b, function (buf) { phaoMau = buf; phaoDangTai = false; $("phao").setAttribute("data-mau", "1"); }, function () { phaoDangTai = false; });
      }).catch(function () { phaoDangTai = false; });
    }
    function phaoDungTieng() {
      clearTimeout(phaoHen);
      if (phaoSrc) { try { phaoSrc.stop(); } catch (e) { /* bỏ qua */ } try { phaoSrc.disconnect(); } catch (e2) { /* bỏ qua */ } phaoSrc = null; }
    }
    function phaoTieng() {                          // phát tiếng pháo cho khớp với phaoLuc; chưa phát được thì thử lại
      var ac = amAC(), lan = ++phaoLan;
      phaoDungTieng();
      if (!ac) return;
      (function thu() {
        var tf, tre, g, src;
        if (lan !== phaoLan || !phaoLuc) return;
        tf = (performance.now() - phaoLuc) / 1000; tre = T3.PHAO_AM - tf;
        if (tf > T3.DAI_PHAO - 1.5) return;         // sắp hết pháo: thôi
        if (!phaoMau || ac.state !== "running") {
          if (!phaoMau) phaoTai(); else { try { ac.resume(); } catch (e) { /* bỏ qua */ } }
          phaoHen = setTimeout(thu, 250); return;
        }
        src = ac.createBufferSource(); g = ac.createGain(); src.buffer = phaoMau; g.gain.value = PHAO_TO; src.connect(g); g.connect(ac.destination);
        if (tre >= 0) src.start(ac.currentTime + tre); else src.start(ac.currentTime, -tre);
        src.onended = function () { try { g.disconnect(); } catch (e) { /* bỏ qua */ } if (phaoSrc === src) phaoSrc = null; };
        phaoSrc = src; phaoDem++;
        $("phao").setAttribute("data-am", phaoDem + "," + Math.max(0, -tre).toFixed(2));
      })();
    }
    function nhacPhaoBong() { nhacTatDan(900); }      // pháo bông bắt đầu: nhạc nền nhỏ dần trong 0,9 giây rồi tắt hẳn (nhacTatDan ở phần nhạc nền)
    function phaoBatDau() { nhacPhaoBong(); phaoTieng(); }
    function batPhao() {                            // lệnh "phao" từ máy giáo viên. Đang bắn mà nhận lệnh nữa thì bắn lại từ đầu
      if (!T3) return;
      if (btd.chay) btdTat(true);                   // 27/11: đang chạy Báo tường động thì dừng (pháo tự làm nhạc nhỏ dần rồi tắt)
      veBaoTuong();                                 // dẹp các bảng, thôi hiện to: pháo hoa bắn trên báo tường có 4 tấm thiệp
      phaoLuc = performance.now() + 400; phaoBatDau(); bao3d(); chayVong();
    }
    function khungHinh(luc) {
      var con = false, dt = lucTruoc ? Math.min(0.1, (luc - lucTruoc) / 1000) : 0.016, bd = performance.now(), cv = $("phao"), c, tf;
      vong = 0;
      if (boQua) { boQua = false; chayVong(); return; }      // khung trước vẽ lâu quá: bỏ một khung cho máy kịp thở (lucTruoc giữ nguyên nên chuyển động vẫn đúng giờ)
      lucTruoc = luc;
      [1, 2, 3, 4].forEach(function (k) { if (veThiep3d(k, luc, dt)) con = true; });
      if (phaoLuc) {
        tf = (luc - phaoLuc) / 1000;
        c = cv.getContext("2d");
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
        if (tf < 0) con = true;
        else if (tf > T3.DAI_PHAO) { phaoLuc = 0; cv.hidden = true; bao3d(); }
        else {
          cv.hidden = false; con = true;
          c.setTransform(cv.width / T3.PHAO_W, 0, 0, cv.height / T3.PHAO_H, 0, 0);
          T3.vePhaoBong(c, tf);
          c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
        }
      }
      if (con) { boQua = performance.now() - bd > 24; chayVong(); } else lucTruoc = 0;
    }
    function chayVong() { if (!vong && T3) vong = requestAnimationFrame(khungHinh); }
    function veLai3d() { [1, 2, 3, 4].forEach(function (k) { hx[k].tinh = false; }); chayVong(); }      // thiệp đổi cỡ (hiện to, về báo tường, đổi cỡ cửa sổ): vẽ lại cho nét
    function capNhat3d() {
      var n = 0, o = $("dem3d").querySelectorAll(".dem-o span");
      [1, 2, 3, 4].forEach(function (k) { var b = !!hx[k].bam; if (b) n++; o[k - 1].classList.toggle("da", b); });
      $("dem3dChu").textContent = "Đã bấm " + n + "/4 nhóm";
      veNut3d(); bao3d();
    }
    /* 16/11 06:30, thầy: "ẩn hết luôn, chỉ có chọn trên điện thoại của giáo viên" → bảng nút cạnh thiệp hiện to ("▶ Tranh 3D", "✕ Đóng") đã bỏ; thầy bấm Tranh 3D trên máy giáo viên.
       Nút dự phòng nằm trong bảng Cài đặt (cd3d<k>): bấm thì thiệp nhóm đó chạy; nhóm đang chạy thì nút ghi "■ Dừng nhóm k".
       16/11 10:02: Tranh 3D chạy ngay trên báo tường, thiệp không hiện to nữa. Chạm vào một thiệp thì thiệp đó vẫn hiện to (chạm lần nữa để về báo tường). */
    function veNut3d() {
      [1, 2, 3, 4].forEach(function (k) {
        var b = $("cd3d" + k), c = !!hx[k].chay;
        tat(b, !T3 || !(duLieu[k] || {}).xong);
        chu(b, c ? "■ Dừng nhóm " + k : "Nhóm " + k);
        b.classList.toggle("bat", c);
      });
    }
    [1, 2, 3, 4].forEach(function (k) {
      $("cd3d" + k).onclick = function () {
        if (!T3 || !(duLieu[k] || {}).xong) return;
        if (hx[k].chay) { dung3d(k); return; }
        dongBang();
        if (hienMa(k)) { xem = "xep"; capNhatMa(); }
        if (lon) phong_to(lon);
        bat3d(k);
      };
    });
    window.addEventListener("resize", veLai3d);
    if (!T3) $("dem3d").hidden = true;

    var NH = {};                                   // <phòng>/nh: màn nhập đang mở trên điện thoại các nhóm (25/11 08:05, xem dungManNhap)
    function veNh(k) {
      var K = khungNhom[k], d = duLieu[k] || {}, x = null;
      if (!d.mo && !d.xong && demDung(d.d) < THU_TU.length) x = nhChon(NH["n" + k]);      // chỉ lúc nhóm còn làm nhiệm vụ 1
      veManNhap(K.nh, x, k);
      K.o.classList.toggle("dang-nhap", !!x);
    }
    function veNhom(k, d) {
      d = d || {}; duLieu[k] = d;
      var K = khungNhom[k], m = d.m || {}, nhap = d.d || {}, ds = [], so, mau = MAU[k];
      var pha = d.xong ? "xong" : d.mo ? "xep" : "nhap";      // 15/11 19:15: bước 2 chỉ mở khi giáo viên bấm
      if (pha === "xong" && K.pha && K.pha !== "xong") { K.o.classList.add("chot"); clearTimeout(K.hen); K.hen = setTimeout(function () { K.o.classList.remove("chot"); }, 1200); }
      if (pha !== K.pha) { K.o.classList.remove("pha-nhap", "pha-xep", "pha-xong"); K.o.classList.add("pha-" + pha); K.pha = pha; }
      veBangNv1(K.nv1, d, mau);
      /* 10 mảnh luôn có mặt trên thiệp; mảnh chưa ai kéo thì nằm ở chỗ sẵn */
      var dau = viTriDau(k);      // chỗ nằm sẵn (theo 4 ảnh thầy gửi 15/11), tính như trên điện thoại
      for (so = 1; so <= goc.length; so++) ds.push({ so: so, st: mo(m["p" + so]) || { x: dau[so - 1].x, y: dau[so - 1].y, r: dau[so - 1].r, f: dau[so - 1].f, t: 0 } });
      ds.sort(function (a, b) { return a.st.t - b.st.t || a.so - b.so; });
      ds.forEach(function (x) {
        var g = K.g[x.so], r = x.st.r, cu = K.hien[x.so];
        if (cu !== undefined) r += Math.round((cu - r) / 360) * 360;      // góc quay liên tục: chọn giá trị gần góc đang hiện nhất để mảnh không quay một vòng thừa
        K.hien[x.so] = r;
        var tf = "translate(" + (x.st.x * U).toFixed(2) + "px," + (x.st.y * U).toFixed(2) + "px) rotate(" + r + "deg)", f = x.st.f ? 1 : 0, da = K.daVe[x.so] || (K.daVe[x.so] = { tf: null, f: -1 });
        if (da.tf !== tf) { g.style.transform = tf; da.tf = tf; }      // 21/11: mảnh không đổi chỗ thì không ghi lại (trước đây ghi lại cả 10 mảnh mỗi lần một mảnh nhích)
        if (da.f !== f) { var p = diem(diemGoc(goc[x.so - 1], x.st.f)); g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p); da.f = f; }      // hình dáng chỉ đổi khi lật mảnh
      });
      /* Lưới trên điện thoại rộng hơn chỗ dán hình (14/11 14:03), có khi rộng hơn cả tấm thiệp (thiệp ngang mà điện thoại cầm dọc).
         Lúc nhóm đang xếp: mọi mảnh còn nằm trong tấm thiệp thì tivi vẽ đúng cỡ thật như trước.
         Có mảnh nằm ngoài tấm thiệp thì tivi thu nhỏ cả bàn xếp cho vừa thiệp, lấy theo phần lưới các máy của nhóm đang thấy
         (mỗi máy báo trong co/<máy>) gộp với chỗ các mảnh đang nằm, để tivi hiện đúng như điện thoại. Đổi ngay, không phóng dần. */
      var cua = K.dan.slice(), tl = 1, dx = 0, dy = 0, LE = 0.3;
      function gop(a) { cua = [Math.min(cua[0], a[0]), Math.min(cua[1], a[1]), Math.max(cua[2], a[2]), Math.max(cua[3], a[3])]; }
      if (pha === "xep") {
        ds.forEach(function (x) { gop(khung(toaDo(goc[x.so - 1], x.st))); });
        if (cua[0] < -0.05 || cua[1] < -0.05 || cua[2] > K.W + 0.05 || cua[3] > K.H + 0.05) {
          Object.keys(d.co || {}).forEach(function (id) {
            var a = typeof d.co[id] === "string" ? d.co[id].split("|").map(parseFloat) : null;
            if (a && a.length === 4 && !a.some(function (v) { return isNaN(v) || v < -60 || v > 110; })) gop(a);
          });
          tl = Math.min(1, (K.W - 2 * LE) / (cua[2] - cua[0]), (K.H - 2 * LE) / (cua[3] - cua[1]));
          dx = K.W / 2 - tl * (cua[0] + cua[2]) / 2; dy = K.H / 2 - tl * (cua[1] + cua[3]) / 2;
        }
      }
      var khoaCua = tl === 1 && !dx && !dy ? "" : [tl.toFixed(4), dx.toFixed(2), dy.toFixed(2)].concat(cua.map(f2)).join("|");
      if (khoaCua !== K.cua) {
        K.cua = khoaCua;
        [K.lopLuoi, K.lop].forEach(function (g) { if (khoaCua) g.setAttribute("transform", "translate(" + f2(dx * U) + " " + f2(dy * U) + ") scale(" + tl.toFixed(4) + ")"); else g.removeAttribute("transform"); });
        K.lopLuoi.textContent = "";
        if (khoaCua) veLuoiRong(K.lopLuoi, cua, K.dan, true);
        K.o.classList.toggle("thu-nho", !!khoaCua);
      }
      var thuTu = ds.map(function (x) { return x.so; }).join(",");
      if (thuTu !== K.thuTu) { K.thuTu = thuTu; ds.forEach(function (x) { K.lop.appendChild(K.g[x.so]); }); }   // chỉ xếp lại lớp khi thứ tự trên dưới đổi (xếp lại làm đứt chuyển động)
      var may = d.co ? Object.keys(d.co).length : 0, nd = demDung(nhap);
      K.o.classList.toggle("co-may", may > 0);
      if (may > 0 && !daVao[k] && K.daNhan && xem === "vao" && K.o.classList.contains("hien-ma")) baoKetNoi(k);      // 26/11 10:52: máy đầu tiên của nhóm vừa vào lúc mã QR của nhóm còn hiện
      if (may > 0 || (d.s && Object.keys(d.s).length)) daVao[k] = true;      // nhóm đã có máy vào (16/11 22:08): mã QR trên thiệp nhóm đó ẩn hẳn, xem hienMa
      if (nd === THU_TU.length && !d.h1 && T && !K.henH1) K.henH1 = setTimeout(function () {      // bài cũ (trước 16/11 22:08) hay máy nhóm không ghi được giờ về đích: tivi ghi thay sau 2,5 giây
        var d2 = duLieu[k] || {}; K.henH1 = 0;
        if (T && demDung(d2.d) === THU_TU.length && !d2.h1) T.set("n" + k + "/h1", Math.round(T.gio()));
      }, 2500);
      var kh3 = d.khoa || {}, dsKhoa = pha === "xong" ? [] : THU_TU.filter(function (kh) { return kh3[kh] && !nhap[kh]; });      // mục nhóm đã nhập sai 3 lần, đang chờ thầy mở khóa
      K.o.classList.toggle("bi-khoa", dsKhoa.length > 0);
      var choMo = pha === "nhap" && nd === THU_TU.length;      // nhóm đã đúng hết bước 1, chờ giáo viên mở bước 2
      K.o.classList.toggle("cho-mo", choMo);
      tat(K.moBan, pha !== "nhap"); K.moBan.classList.toggle("san", choMo);
      tat(K.moKhoa, !dsKhoa.length);
      chu(K.tt, dsKhoa.length ? "Sai " + SAI_KHOA + " lần, đã khóa: " + dsKhoa.map(function (kh) { return MUC[kh].ngan; }).join(", ") : pha === "xong" ? "Đã hoàn thành" : pha === "xep" ? "Đang xếp hình" : choMo ? "Xong nhiệm vụ 1, chờ mở nhiệm vụ 2" : nd ? "Đo và tính: đúng " + nd + "/10" : may ? "Đã vào, đang đo và tính" : "Chưa có máy nào vào");
      chu($("vao" + k).querySelector(".vao-tt"), may ? "Đã vào: " + may + " máy" : "Chưa có máy nào");
      veNh(k);
      capNhatMa(); veMung();
      if (T3) {
        if (hx[k].ky !== undefined && (!d.xong || daGiacNhom(k).ky !== hx[k].ky)) bo3d(k);      // hình của nhóm đổi: bỏ tranh 3D của nhóm đó
      }
      veNut3d();
      if (chamHien) veCham();                      // số mục từng bị khóa đổi thì điểm máy chấm (tiêu chí 1) đổi theo
    }
    /* 16/11 22:08, thầy: "khi học sinh quét qr thì trên màn hình tivi sẽ hiện ra phần nhiệm vụ 1 khi học sinh làm luôn nhé, không cần chờ tôi bấm."
       Từ đó mã QR trên thiệp của một nhóm ẩn ngay khi nhóm đó có máy vào (daVao; trước đây phải chờ nhóm nhập đúng mục đầu tiên hoặc thầy bấm Ẩn mã QR).
       Máy của nhóm tắt màn hình hay rớt mạng thì mã không hiện lại (daVao giữ tới khi tải lại trang tivi). Muốn hiện lại mã cho máy vào sau: nút Hiện mã QR. */
    /* 26/11 10:52, thầy: "học sinh quét xong thì cái mã QR biến mất, nó sẽ hiện lên một cái dòng chữ thật to nhé … chỉ đơn giản là ghi là nhóm 1 đã kết nối, rồi sau đó
       khoảng tầm 5 giây rồi mới bắt đầu hiện ra cái màn hình nhóm 1 đang mà làm. Ý là trên điện thoại các em cứ làm bình thường thôi, nhưng mà ở trên cái màn hình TV
       á thì phải tầm 5 giây để cho giáo viên người ta dự giờ người ta thấy là cái QR này để làm cái gì ha."
       Tấm phủ .ket-noi che kín tấm thiệp của nhóm trong KET_NOI_MS rồi mờ đi; bài của nhóm (bảng nhiệm vụ 1) vẫn được vẽ bên dưới như cũ, điện thoại không bị chậm lại.
       Chỉ hiện khi mã QR của nhóm đang hiện và TỰ ẩn vì máy đầu tiên của nhóm vừa vào (xem = "vao"). Không hiện khi: tivi vừa tải lại mà nhóm đã có máy từ trước
       (K.daNhan: đã nhận dữ liệu lần đầu của nhóm), máy thứ hai của nhóm vào, thầy đang bật "Hiện QR" (mã khi đó không tự ẩn). */
    var KET_NOI_MS = 5000;
    function baoKetNoi(k) {
      var K = khungNhom[k];
      K.o.classList.add("vua-noi"); clearTimeout(K.henNoi);
      K.henNoi = setTimeout(function () { K.o.classList.remove("vua-noi"); }, KET_NOI_MS);
    }
    function hienMa(k) { var d = duLieu[k] || {}; return xem === "ma" || (xem === "vao" && !(d.mo || d.xong || demDung(d.d) > 0 || daVao[k])); }
    function gioVeDich() {                         // giờ về đích của 4 nhóm (0: chưa đúng đủ 10 mục hoặc chưa có giờ)
      var h1 = {};
      [1, 2, 3, 4].forEach(function (j) { var d = duLieu[j] || {}; h1[j] = demDung(d.d) === THU_TU.length ? +d.h1 || 0 : 0; });
      return h1;
    }
    function veMung() {                            // tấm bảng chúc mừng của cả 4 nhóm (thứ hạng của một nhóm có thể đổi khi giờ về đích của nhóm khác tới sau)
      var h1 = gioVeDich();
      [1, 2, 3, 4].forEach(function (k) {
        var K = khungNhom[k], hg = hangNv1(h1, k), cu = K.hang, L;
        K.o.classList.toggle("mung", hg > 0);
        if (hg === cu) return;
        K.hang = hg; K.o.setAttribute("data-hang", hg);
        if (!hg) return;
        L = loiMung(k, hg); K.mung.d1.textContent = L[0]; K.mung.d2.textContent = L[1]; K.mung.d3.textContent = L[2];
        if (!cu && T && Math.abs(T.gio() - h1[k]) < 8000) { tungGiaySvg(K.mung); mungTo(k); }      // nhóm vừa xong: giấy màu rơi, bảng chúc mừng to giữa tivi (mở lại trang tivi thì chỉ hiện tấm bảng trên thiệp)
      });
    }
    /* Lúc một nhóm vừa xong nhiệm vụ 1: bảng chúc mừng to hiện giữa báo tường khoảng 6 giây (mờ dần vào, trượt nhẹ; không phóng to thu nhỏ), giấy màu rơi khắp màn hình.
       Hai nhóm xong sát nhau thì hiện lần lượt. Sau đó chỉ còn tấm bảng nhỏ trên thiệp của nhóm. */
    /* Hai nhóm xong gần như cùng lúc: tin của nhóm xong sau có thể tới tivi trước. Vì vậy tivi chờ 0,6 giây rồi mới hiện bảng to,
       xếp các nhóm đang chờ theo giờ về đích và lấy thứ hạng ngay lúc hiện (không lấy lúc tin vừa tới). */
    var mungCho = [], mungDang = false, mungHen = 0;
    function mungTo(k) {
      if (mungCho.indexOf(k) < 0) mungCho.push(k);
      if (!mungDang && !mungHen) mungHen = setTimeout(function () { mungHen = 0; mungTiep(); }, 600);
    }
    function mungTiep() {
      var h1 = gioVeDich(), e = $("mungTo"), k, hg, L;
      mungCho = mungCho.filter(function (j) { return h1[j] > 0; });      // nhóm vừa bị xóa bài trong lúc chờ thì thôi
      mungCho.sort(function (a, b) { return hangNv1(h1, a) - hangNv1(h1, b); });
      k = mungCho.shift();
      if (!k) { mungDang = false; return; }
      mungDang = true; hg = hangNv1(h1, k); L = loiMung(k, hg);
      $("mungTo1").textContent = L[0]; $("mungTo2").textContent = L[1]; $("mungTo3").textContent = L[2];
      e.style.setProperty("--mau", MAU_NHOM[k]); e.setAttribute("data-nhom", k); e.setAttribute("data-hang", hg);
      e.hidden = false; void e.offsetWidth; e.classList.add("hien");
      tungGiay($("mungGiay"), 90, 1150);
      setTimeout(function () { e.classList.remove("hien"); setTimeout(function () { e.hidden = true; mungTiep(); }, 650); }, 5600);
    }
    function capNhatMa() {
      [1, 2, 3, 4].forEach(function (k) { khungNhom[k].o.classList.toggle("hien-ma", hienMa(k)); });
      chu($("nutMa"), [1, 2, 3, 4].some(hienMa) ? "Ẩn mã QR" : "Hiện mã QR");
      bao3d();
    }
    function doiXem(x) { xem = x; if (lon) phong_to(lon); capNhatMa(); }
    function xoaHinh() { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/m"] = null; o["n" + k + "/xong"] = null; }); T.update(o); }
    function lamLaiHet() { if (!T) return; var o = { dn: null, diem: null }; [1, 2, 3, 4].forEach(function (k) { ["m", "xong", "d", "s", "mo", "khoa", "h1"].forEach(function (p) { o["n" + k + "/" + p] = null; }); }); T.update(o); }      // xóa hết thì tắt luôn đồng hồ đếm ngược
    function hoiHaiLan(b, chuHoi, lam) {           // nút nguy hiểm: bấm hai lần trong 3 giây mới làm
      var goc2 = b.textContent, luc = 0;
      b.onclick = function () {
        if (Date.now() - luc > 3000) { luc = Date.now(); b.textContent = chuHoi; b.classList.add("hoi"); setTimeout(function () { b.textContent = goc2; b.classList.remove("hoi"); }, 3000); return; }
        luc = 0; b.textContent = goc2; b.classList.remove("hoi"); lam();
      };
    }

    /* --- ảnh báo tường làm nền màn làm bài ---
       Ảnh có hình thầy cô nên KHÔNG nằm trên mạng. Trang chỉ lấy ảnh từ kho của trình duyệt trên máy thầy (IndexedDB "ruoc-duoc", cùng kho với trang Rước đuốc):
         khóa "baoTuongXep": ảnh thầy chọn ở trang này (Cài đặt);
         khóa "baoTuong2": ảnh báo tường bản 7 (4 ô A3) thầy đã chọn ở trang Rước đuốc, chỉ dùng khi đúng tỉ lệ khổ A0 nằm ngang.
         KHÔNG đọc khóa cũ "baoTuong" nữa (14/11): trên máy thầy khóa đó có thể còn ảnh báo tường mẫu cũ, các ô dán nằm chỗ khác, bài của các nhóm sẽ lệch ô.
       Chưa có ảnh thì tivi hiện hình vẽ thay (vẽ sẵn trong index.html). */
    var TI_LE_A0 = 1189 / 841, anhUrl = null;
    function moKho(cb) {
      var r;
      try { r = indexedDB.open("ruoc-duoc", 1); } catch (e) { cb(null); return; }
      r.onupgradeneeded = function () { r.result.createObjectStore("f"); };
      r.onsuccess = function () { cb(r.result); };
      r.onerror = function () { cb(null); };
    }
    function layAnh(khoa, cb) {
      moKho(function (db) {
        if (!db) { cb(null); return; }
        try {
          var q = db.transaction("f").objectStore("f").get(khoa);
          q.onsuccess = function () { cb(q.result || null); };
          q.onerror = function () { cb(null); };
        } catch (e) { cb(null); }
      });
    }
    function luuAnh(khoa, v, cb) {                 // v = null là xóa
      moKho(function (db) {
        if (!db) { cb(false); return; }
        try {
          var tx = db.transaction("f", "readwrite"), st = tx.objectStore("f");
          if (v) st.put(v, khoa); else st["delete"](khoa);
          tx.oncomplete = function () { cb(true); };
          tx.onerror = tx.onabort = function () { cb(false); };
        } catch (e) { cb(false); }
      });
    }
    function docAnh(blob, cb) {                    // cb(ảnh đã mở, hoặc null nếu không mở được)
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { cb(im, u); };
      im.onerror = function () { URL.revokeObjectURL(u); cb(null, null); };
      im.src = u;
    }
    function dungTiLe(im) { return Math.abs(im.naturalWidth / im.naturalHeight - TI_LE_A0) < 0.04 * TI_LE_A0; }
    /* nền tối sau báo tường, làm đúng như nenMo của trang Rước đuốc (js/san-khau.js): chính tấm báo tường thu còn 120 × 85, nhoè 2 px, phủ màu rgba(30,17,6,.66),
       rồi phóng to cho kín màn hình (phóng to thì tự nhoè). Chưa có ảnh báo tường thì nền là vầng nâu tối vẽ sẵn trong index.html (#tvNen), như nenBao bên đó.
       Ảnh nền nhỏ này chỉ nằm trong trang đang mở trên máy thầy, không gửi đi đâu. */
    var soNen = 0;
    function veNen(im) {
      var o = $("tvNen"), c, g;
      if (!im) { o.style.backgroundImage = ""; return; }
      try {
        c = document.createElement("canvas"); c.width = 120; c.height = 85; g = c.getContext("2d");
        try { g.filter = "blur(2px)"; } catch (e) { /* bỏ qua */ }
        g.drawImage(im, -6, -6, 132, 97); g.filter = "none";
        g.fillStyle = "rgba(30,17,6,.66)"; g.fillRect(0, 0, 120, 85);
        o.style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
      } catch (e) { o.style.backgroundImage = ""; }
    }
    /* 18/11 12:22 (thầy: "hơi bị lag mạng lúc mở"): ảnh báo tường chọn ở trang Rước đuốc là file gốc 4494 × 3179. Vẽ thẳng nó vào khung 120 × 85 làm nền mờ
       thì trình duyệt phải mở cả tấm ảnh ngay trên luồng chính: đo trên máy chậm (bằng 1/4 máy thử) trang đứng hơn nửa giây lúc mở, chữ "Đã nối" cũng chậm theo.
       createImageBitmap thu nhỏ ảnh ngay lúc mở ảnh, ở luồng riêng, trang không đứng. Trình duyệt không có thì làm như cũ. */
    function veNgoai(im) {                          // 27/11 14:56: nền ngoài báo tường (#btNgoai) = báo tường lật gương ra bốn phía (3 × 3 tấm), làm nhoè chừng 20 điểm
      var o = $("btNgoai"), w = 288, h = 204, c, g, c2, g2, nho;
      if (!im) { o.style.backgroundImage = ""; return; }
      try {
        c = document.createElement("canvas"); c.width = 3 * w; c.height = 3 * h; g = c.getContext("2d");
        [-1, 0, 1].forEach(function (i) {
          [-1, 0, 1].forEach(function (j) {
            var sx = i ? -1 : 1, sy = j ? -1 : 1;
            g.setTransform(sx, 0, 0, sy, (i + 1) * w + (sx < 0 ? w : 0), (j + 1) * h + (sy < 0 ? h : 0));
            g.drawImage(im, 0, 0, w, h);
          });
        });
        g.setTransform(1, 0, 0, 1, 0, 0);
        c2 = document.createElement("canvas"); c2.width = c.width; c2.height = c.height; g2 = c2.getContext("2d");
        if ("filter" in g2) { g2.filter = "blur(4px)"; g2.drawImage(c, 0, 0); g2.filter = "none"; }
        else {                                    // trình duyệt chưa có filter cho canvas: thu nhỏ 6 lần rồi phóng lại, cũng nhoè
          nho = document.createElement("canvas"); nho.width = Math.round(c.width / 6); nho.height = Math.round(c.height / 6);
          nho.getContext("2d").drawImage(c, 0, 0, nho.width, nho.height); g2.drawImage(nho, 0, 0, c2.width, c2.height);
        }
        o.style.backgroundImage = "url(" + c2.toDataURL("image/jpeg", 0.9) + ")";
      } catch (e) { o.style.backgroundImage = ""; }
    }
    function anhNen(blob, cb) {
      function cu() { docAnh(blob, function (im, u) { cb(im); if (u) URL.revokeObjectURL(u); }); }
      if (!window.createImageBitmap) { cu(); return; }
      try { window.createImageBitmap(blob, { resizeWidth: 288, resizeHeight: 204, resizeQuality: "medium" }).then(cb, cu); } catch (e) { cu(); }
    }
    function datAnh(blob, nguon, loi) {
      var o = $("baoTuong"), lan = ++soNen;
      if (anhUrl) { URL.revokeObjectURL(anhUrl); anhUrl = null; }
      if (blob) { anhUrl = URL.createObjectURL(blob); o.style.backgroundImage = "url(\"" + anhUrl + "\")"; } else o.style.backgroundImage = "";
      if (blob) anhNen(blob, function (im) { if (lan === soNen) { veNen(im); veNgoai(im); } }); else { veNen(null); veNgoai(null); }
      o.classList.toggle("co-anh", !!blob);
      o.setAttribute("data-nguon", blob ? nguon : "");
      $("btTinh").textContent = loi || (blob ? (nguon === "rieng" ? "Đang dùng ảnh thầy đã chọn ở trang này." : "Đang dùng ảnh báo tường thầy đã chọn ở trang Rước đuốc.") : "Chưa có ảnh: tivi đang hiện hình vẽ thay cho báo tường.");
      $("btTinh").classList.toggle("xau", !!loi);
      $("nutBoAnh").hidden = !blob;
    }
    function napAnh() {
      layAnh("baoTuongXep", function (b) {
        if (b) { datAnh(b, "rieng"); return; }
        var bo = null; try { bo = localStorage.getItem("xt-bt-bo"); } catch (e) { bo = null; }
        if (bo) { datAnh(null); return; }
        layAnh("baoTuong2", function (b2) {
          if (!b2) { datAnh(null); return; }
          docAnh(b2, function (im, u) { if (u) URL.revokeObjectURL(u); if (im && dungTiLe(im)) datAnh(b2, "ruoc"); else datAnh(null); });
        });
      });
    }
    $("nutChonAnh").onclick = function () { $("btTep").value = ""; $("btTep").click(); };
    $("btTep").onchange = function () {
      var f = $("btTep").files && $("btTep").files[0];
      if (!f) return;
      docAnh(f, function (im, u) {
        if (!im) { $("btTinh").textContent = "Không mở được tệp này. Thầy chọn một tệp ảnh (jpg, png) nhé."; $("btTinh").classList.add("xau"); return; }
        if (!dungTiLe(im)) {
          URL.revokeObjectURL(u);
          $("btTinh").textContent = "Ảnh này không đúng khổ A0 nằm ngang (1189 × 841). Thầy chọn ảnh báo tường có 4 ô dán thiệp nhé."; $("btTinh").classList.add("xau");
          return;
        }
        function xong(blob) {
          URL.revokeObjectURL(u);
          luuAnh("baoTuongXep", blob, function (ok) {
            try { localStorage.removeItem("xt-bt-bo"); } catch (e) { /* bỏ qua */ }
            datAnh(blob, "rieng", ok ? "" : "Đã hiện ảnh, nhưng trình duyệt không cho lưu: lần sau mở trang thầy phải chọn lại.");
          });
        }
        var RONG = 3054;                           // gấp đôi bề rộng báo tường trên tivi 1920: đủ nét, nhẹ máy
        if (im.naturalWidth <= RONG) { xong(f); return; }
        try {
          var c = document.createElement("canvas"); c.width = RONG; c.height = Math.round(RONG * im.naturalHeight / im.naturalWidth);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) { xong(b || f); }, "image/jpeg", 0.92);
        } catch (e) { xong(f); }
      });
    };
    $("nutBoAnh").onclick = function () {
      luuAnh("baoTuongXep", null, function () {
        try { localStorage.setItem("xt-bt-bo", "1"); } catch (e) { /* bỏ qua */ }
        datAnh(null);
      });
    };
    napAnh();

    /* ---------- nhạc nền ----------
       16/11 10:02, thầy: "bổ sung thêm mục chọn bài hát trong cài đặt nhé. và có nút tắt nhạc hiện trên app của giáo viên nhé."
       16/11 10:44, thầy gửi file "10. xếp thiệp.mp3": "đưa bài hát này vào và có nút bật tắt nhạc nhé. tăng giảm âm lượng nữa. hiện kế bên nút phóng to trên màn hình tivi
       và trong cả điện thoại của giáo viên. tôi bấm bật mới bật nhạc và bài hát sẽ lặp đi lặp lại cho đến khi hết giờ"
       Bài hát chọn trong Cài đặt của tivi (từ 16/11 13:11 không còn nhớ qua lần tải trang: mở trang là bài "Xếp thiệp"):
         "xep"   = bài thầy gửi 16/11 (nhac/xep-thiep.mp3, 1 phút 46 giây). Mặc định.
         "hv"    = bài "Học Vui Mỗi Ngày" của thầy, nhạc của trò Rước đuốc (../nhac/nhac-nen.ogg, file của trang chính, trang này chỉ đọc).
         "rieng" = một file nhạc thầy chọn từ máy tivi. File chỉ nằm trong trình duyệt (IndexedDB "ruoc-duoc", khóa "nhacXep"), không đưa lên mạng.
       Bật / tắt và âm lượng: <phòng>/nhac = { b: 1 là bật, a: mức âm lượng 1..10 }. Tivi (3 nút cạnh nút Toàn màn hình, nút trong Cài đặt) và máy giáo viên cùng ghi vào đó.
       Thầy bấm Bật thì nhạc mới phát: chưa có gì trong <phòng>/nhac là tắt; tivi vừa mở trang mà thấy b = 1 (còn lại từ lần trước) thì ghi lại b = 0.
       Nhạc lặp lại cho tới khi thầy tắt, hoặc tới khi đồng hồ đếm ngược hết giờ (nhạc nhỏ dần trong 2 giây rồi tắt: nhacHetGio).
       Hai bài có sẵn phát bằng Web Audio (lặp không hở tiếng); file thầy chọn phát bằng thẻ audio.
       Trình duyệt chỉ cho phát tiếng khi trang tivi đã được chạm một lần: thầy bật từ điện thoại mà tivi chưa được chạm thì tivi báo m = 2 và phát ngay ở lần chạm đầu tiên. */
    /* 27/11 14:46, thầy: "âm thanh cho to lên tối đa, nếu tôi muốn nhỏ tôi sẽ chỉnh" → mức 10 là to nhất mà không vỡ tiếng: bài Xếp thiệp đúng độ to của tệp (trước bị hạ còn 0,56),
       bài Học Vui Mỗi Ngày nhỏ hơn 5 dB nên nhân 1,78 (đỉnh còn −2,5 dB), bài của Báo tường động và bài thầy chọn từ máy đúng độ to của tệp. Mức mặc định là 10,
       và mỗi lần tivi mở trang thì về lại mức 10 (thầy tự bấm nhỏ nếu muốn). Đo: Xếp thiệp −14,9 LUFS, Bài học đầu tiên −14,8 LUFS, Học Vui Mỗi Ngày −20,1 LUFS. */
    var NHAC_BAI = { xep: { tep: "nhac/xep-thiep.mp3", ten: "Xếp thiệp", bu: 1 }, hv: { tep: "../nhac/nhac-nen.ogg", ten: "Học Vui Mỗi Ngày", bu: 1.78 } };      // bu: nhân độ to ở mức 10
    var NHAC_MUC = 10, NHAC_MUC_DAU = 10;
    var N = { nguon: "xep", ten: "", bat: false, am: NHAC_MUC_DAU, mo: 1, tt: 0, lan: 0, ac: null, g: null, src: null, buf: {}, au: null, url: null, cho: false, daNhan: false, henMo: 0 };
    /* 16/11 13:11, thầy: "Nhạc nền mặc định là  xếp thiệp". Mỗi lần tivi mở trang, bài đang chọn luôn là "Xếp thiệp" (bản 11:37 nhớ bài thầy chọn lần trước trong localStorage "xt-nhac").
       Thầy chọn bài khác trong Cài đặt thì dùng bài đó cho tới khi tải lại trang. Chỉ còn nhớ tên file thầy đã chọn từ máy ("xt-nhac-ten") để ghi lên nút. */
    try { N.ten = localStorage.getItem("xt-nhac-ten") || ""; localStorage.removeItem("xt-nhac"); } catch (e) { /* bỏ qua */ }
    function nhacTT() { return N.tt; }
    /* ---------- âm báo của đồng hồ ----------
       16/11 13:11, thầy: "Đồng hồ lúc được mở lên và lúc hết giờ sẽ có âm báo". 17/11 00:57, thầy: "thôi cái mặt trời đổi lại trống trường đi, bắt đầu thì gõ và hết giờ thì gõ".
       18/11 01:46, thầy: "tiếng trống nghe dở quá, tham khảo trên mạng để lấy cho tiếng trống nghe hay, to rõ như trong trường ý. thường thì ngta sẽ gõ vào viền trống
       kêu cạch cạnh rồi mới đánh tùng tùng tùng".
       Từ đó tiếng trống là tiếng thu thật, hai file nhac/trong-tung.wav (dùi đánh mặt trống) và nhac/trong-cach.wav (dùi gõ viền trống), làm từ hai bản thu CC0
       (trống BigSoundBank số 2341 của Joseph Sardin; tiếng gỗ gõ wood_hit_06 trong bộ "100 CC0 metal and wood SFX" của rubberduck, OpenGameArt) bằng test/lam-trong.py:
       hạ giọng cho ra trống to, thêm bội âm cho loa tivi nhỏ (loa nhỏ không phát được tiếng dưới 150 Hz), nén cho tiếng chắc. Tivi tải hai file lúc mở trang (amTai).
       Chưa tải được (mất mạng, file hỏng) thì dùng tiếng tự tạo của bản 17/11: amTrong cho "tùng" (mặt da rung trầm, TRONG_BOI, TRONG_ON), amCachTao cho "cạch".
       Nhịp gõ ở DN_NHIP: [mili giây kể từ tiếng đầu, "cach" hay "tung", mạnh nhẹ]. Lúc bắt đầu và lúc hết giờ đều là "cạch, cạch" rồi "tùng, tùng, tùng"
       (tiếng cuối ở 2,3 giây). Cái trống vẽ trên đồng hồ gõ cùng nhịp đó (dnGo). Chạy tiếp sau khi tạm dừng thì không gõ.
       Tiếng ra thẳng loa, không theo nút âm lượng của nhạc nền (nhạc tắt vẫn có tiếng trống).
       Trình duyệt chỉ cho phát tiếng khi trang tivi đã được chạm một lần. Tivi tạo sẵn AudioContext lúc mở trang, lần chạm (hay bấm phím) đầu tiên thì cho nó chạy;
       tivi báo tv3d.a = 1 khi đã phát được tiếng, 0 khi chưa, để máy giáo viên nhắc thầy chạm vào tivi. Chưa phát được thì bỏ qua tiếng (không phát bù về sau); hình trống vẫn gõ. */
    var NHIP_TRONG = [[0, "cach", 0.85], [300, "cach", 0.85], [900, "tung", 0.95], [1600, "tung", 0.95], [2300, "tung", 1]];
    var DN_NHIP = { mo: NHIP_TRONG, het: NHIP_TRONG };
    var AM_TO = { tung: 0.9, cach: 0.8 };          // độ to mỗi loại tiếng thu thật (file đã đưa đỉnh về 0,89); đo bằng test/nghe-am.js, cùng nhạc mức 10 vẫn dưới 1
    var AM_TEP = { tung: "nhac/trong-tung.wav", cach: "nhac/trong-cach.wav" }, amMau = { tung: null, cach: null };
    var AM_TRONG = 0.38;                            // tiếng tự tạo (khi chưa tải được file): độ to một tiếng "tùng" mạnh nhất, như bản 17/11
    var AM = { mo: 0, het: 0 };                    // số lần đã phát tiếng từng loại (bài thử đọc ở #dn[data-am] = "mở,hết giờ")
    function amAC() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!N.ac && AC) { try { N.ac = new AC(); N.g = N.ac.createGain(); N.g.connect(N.ac.destination); N.ac.onstatechange = function () { if (N.ac.state === "running" && N.bat && N.tt === 2) nhacDat(1); else bao3d(); }; } catch (e) { N.ac = null; } }
      return N.ac;
    }
    function amTT() { return N.ac && N.ac.state === "running" ? 1 : 0; }
    var amOnBuf = null;
    function amOn(ac) {                             // 0,12 giây tiếng ồn trắng (số ngẫu nhiên có hạt giống), cho tiếng dùi chạm mặt trống
      if (!amOnBuf) {
        var n = Math.round(ac.sampleRate * 0.12), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), h = 20261117, i;
        for (i = 0; i < n; i++) { h = (h * 1103515245 + 12345) % 2147483648; d[i] = h / 1073741824 - 1; }
        amOnBuf = b;
      }
      return amOnBuf;
    }
    var TRONG_BOI = [[1, 0.85, 1.3], [1.59, 0.4, 0.6], [2, 0.6, 0.8], [2.65, 0.18, 0.25], [3, 0.45, 0.5], [4, 0.2, 0.25]];      // [lần tần số, độ to, thời gian ngân (giây)]
    var TRONG_ON = [["lowpass", 1100, 0, 0.4, 0.08], ["bandpass", 450, 1, 0.9, 0.1], ["bandpass", 1600, 1, 0.5, 0.03]];      // tiếng dùi chạm: [loại lọc, tần số (Hz), Q, độ to, thời gian (giây)]
    function amTrong(ac, ra, luc, to, dai) {        // một tiếng "tùng": mặt da rung (tần số tụt nhanh) với các bội âm, rồi tiếng dùi chạm mặt da (tiếng ồn qua bộ lọc)
      TRONG_BOI.forEach(function (b) {
        var o = ac.createOscillator(), g = ac.createGain(), het = luc + b[2] * dai;
        o.type = "sine";
        o.frequency.setValueAtTime(122 * b[0], luc);
        o.frequency.exponentialRampToValueAtTime(74 * b[0], luc + 0.11);
        g.gain.setValueAtTime(0.0001, luc);
        g.gain.exponentialRampToValueAtTime(to * b[1], luc + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, het);
        o.connect(g); g.connect(ra); o.start(luc); o.stop(het + 0.05);
      });
      TRONG_ON.forEach(function (x) {
        var n = ac.createBufferSource(), f = ac.createBiquadFilter(), g2 = ac.createGain();
        n.buffer = amOn(ac); f.type = x[0]; f.frequency.value = x[1]; if (x[2]) f.Q.value = x[2];
        g2.gain.setValueAtTime(to * x[3], luc); g2.gain.exponentialRampToValueAtTime(0.0001, luc + x[4]);
        n.connect(f); f.connect(g2); g2.connect(ra); n.start(luc); n.stop(luc + 0.11);
      });
    }
    function amCachTao(ac, ra, luc, to) {           // "cạch" tự tạo (khi chưa tải được file): tiếng ồn ngắn qua bộ lọc dải 1,8 kHz và một tiếng gỗ 900 Hz tắt nhanh
      var n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), o = ac.createOscillator(), g2 = ac.createGain();
      n.buffer = amOn(ac); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 1.2;
      g.gain.setValueAtTime(0.9 * to, luc); g.gain.exponentialRampToValueAtTime(0.0001, luc + 0.06);
      n.connect(f); f.connect(g); g.connect(ra); n.start(luc); n.stop(luc + 0.11);
      o.type = "triangle"; o.frequency.setValueAtTime(900, luc); o.frequency.exponentialRampToValueAtTime(760, luc + 0.08);
      g2.gain.setValueAtTime(0.0001, luc); g2.gain.exponentialRampToValueAtTime(0.5 * to, luc + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, luc + 0.09);
      o.connect(g2); g2.connect(ra); o.start(luc); o.stop(luc + 0.12);
    }
    function amTai() {                              // tải và giải mã hai tiếng trống thu thật, một lần lúc mở trang tivi (bài thử đọc ở #dn[data-mau] = "tùng,cạch", 1 là đã có)
      var ac = amAC();
      if (!ac || !window.fetch) return;
      Object.keys(AM_TEP).forEach(function (k) {
        fetch(AM_TEP[k]).then(function (r) { if (!r.ok) throw new Error("tải " + r.status); return r.arrayBuffer(); }).then(function (b) {
          ac.decodeAudioData(b, function (buf) { amMau[k] = buf; $("dn").setAttribute("data-mau", (amMau.tung ? 1 : 0) + "," + (amMau.cach ? 1 : 0)); }, function () { /* giải mã hỏng: dùng tiếng tự tạo */ });
        }).catch(function () { /* tải hỏng: dùng tiếng tự tạo */ });
      });
    }
    function amGo(ac, ra, kieu, luc, to) {          // một tiếng trống lúc "luc" (giây, theo đồng hồ Web Audio): kieu "tung" (mặt trống) hay "cach" (viền trống), to: mạnh nhẹ
      var s, g;
      if (amMau[kieu]) {
        s = ac.createBufferSource(); g = ac.createGain();
        s.buffer = amMau[kieu]; g.gain.value = AM_TO[kieu] * to;
        s.connect(g); g.connect(ra); s.start(luc);
        return;
      }
      if (kieu === "tung") amTrong(ac, ra, luc, AM_TRONG * 0.7 * to, 1); else amCachTao(ac, ra, luc, 0.35 * to);
    }
    var amRa = [];                                  // đường ra loa của các lần trống còn đang gõ (amDung cắt khi thầy tắt đồng hồ)
    function amBao(loai, cho) {                     // loai: "mo" (đồng hồ vừa bắt đầu), "het" (hết giờ); cho: mili giây chờ trước tiếng đầu (hết giờ: chờ số 00:00 hiện xong)
      var ac = amAC();
      function phat() {
        var ra, t;
        ra = ac.createGain(); ra.gain.value = 1; ra.connect(ac.destination); t = ac.currentTime + 0.04 + (cho || 0) / 1000;      // 0,04 giây: cùng mốc với cái trống vẽ trên đồng hồ (dnGo)
        DN_NHIP[loai].forEach(function (n) { amGo(ac, ra, n[1], t + n[0] / 1000, n[2]); });
        AM[loai]++; $("dn").setAttribute("data-am", AM.mo + "," + AM.het);
        amRa.push(ra);
        setTimeout(function () { try { ra.disconnect(); } catch (e) { /* bỏ qua */ } amRa = amRa.filter(function (x) { return x !== ra; }); }, 8000 + (cho || 0));
      }
      if (!ac) return;
      if (ac.state === "running") phat(); else { try { ac.resume(); } catch (e) { /* bỏ qua */ } }      // chưa phát được tiếng: bỏ qua lần báo này, không phát bù (báo muộn thì sai lúc)
    }
    function amDung() {                             // thầy tắt đồng hồ lúc trống còn đang gõ: tiếng trống nhỏ về 0 trong 0,08 giây rồi cắt hẳn
      var ac = N.ac, ds = amRa;
      amRa = [];
      ds.forEach(function (ra) {
        try { ra.gain.cancelScheduledValues(ac.currentTime); ra.gain.setValueAtTime(ra.gain.value, ac.currentTime); ra.gain.linearRampToValueAtTime(0, ac.currentTime + 0.08); } catch (e) { /* bỏ qua */ }
        setTimeout(function () { try { ra.disconnect(); } catch (e) { /* bỏ qua */ } }, 250);
      });
    }
    (function () {                                  // lần chạm (hay bấm phím) đầu tiên trên tivi: cho tiếng chạy. Màn cảm ứng chỉ tính là "đã chạm" lúc nhấc tay, nên nghe cả pointerup và click
      var ac = amAC(), viec = ["pointerdown", "pointerup", "click", "keydown"];
      function cham() {
        if (ac.state === "running") { viec.forEach(function (v) { window.removeEventListener(v, cham, true); }); bao3d(); return; }
        try { ac.resume().then(function () { bao3d(); }, function () {}); } catch (e) { /* bỏ qua */ }
      }
      if (!ac) return;
      viec.forEach(function (v) { window.addEventListener(v, cham, true); });
    })();
    /* 18/11 12:22, thầy: "trò tấm thiệp hơi bị lag mạng lúc mở". Hai tiếng trống (175 KB) trước đây tải ngay lúc mở trang, giành đường mạng với thư viện nối máy chủ.
       Trống chỉ cần khi thầy bấm Bắt đầu, nên giờ đợi tivi nối xong (hay chạy thử trên một máy) 1,5 giây rồi mới tải (trangThai gọi amTaiSau);
       nối mãi chưa được thì 12 giây sau vẫn tải. Lỡ bấm Bắt đầu trước khi tải xong thì trống dùng tiếng tự tạo như trước. */
    var amDaTai = false, amHen = 0;
    function amTaiSau(ms) {
      if (amDaTai) return;
      clearTimeout(amHen);
      amHen = setTimeout(function () { if (amDaTai) return; amDaTai = true; amTai(); setTimeout(phaoTai, 2500); }, ms);      // 25/11: tiếng pháo bông (300 KB) tải sau hai tiếng trống 2,5 giây
    }
    amTaiSau(12000);
    function nhacDat(tt) { N.tt = tt; veNhac(); bao3d(); }
    function nhacTo() { return Math.pow(N.am / NHAC_MUC, 1.7) * (NHAC_BAI[N.nguon] ? NHAC_BAI[N.nguon].bu : 1) * N.mo; }      // mức 1..10 → độ to; mức 5 ≈ 0,31 (thẻ audio thì tối đa 1)
    function nhacDatTo() { var v = nhacTo(); if (N.g) { try { N.g.gain.value = v; } catch (e) { /* bỏ qua */ } } if (N.au) { try { N.au.volume = Math.min(1, v); } catch (e2) { /* bỏ qua */ } } }
    function nhacDung() {
      if (N.src) { try { N.src.stop(); } catch (e) { /* bỏ qua */ } try { N.src.disconnect(); } catch (e2) { /* bỏ qua */ } N.src = null; }
      if (N.au) { try { N.au.pause(); } catch (e3) { /* bỏ qua */ } }
    }
    function nhacChoCham() {                        // trình duyệt chưa cho phát: chờ lần chạm (hay bấm phím) đầu tiên trên tivi
      if (N.cho) return;
      N.cho = true;
      function thu() { N.cho = false; window.removeEventListener("pointerdown", thu, true); window.removeEventListener("keydown", thu, true); if (N.bat && N.tt === 2) nhacPhat(); }
      window.addEventListener("pointerdown", thu, true); window.addEventListener("keydown", thu, true);
    }
    function nhacPhat() {                           // làm cho tiếng nhạc đúng với N.nguon và N.bat; gọi lại bao nhiêu lần cũng được
      var lan = ++N.lan, AC = window.AudioContext || window.webkitAudioContext, bai = NHAC_BAI[N.nguon];
      clearInterval(N.henMo); N.mo = 1;
      nhacDung();
      if (!N.bat) { nhacDat(0); return; }
      if (bai) {
        if (!AC) { nhacDat(4); return; }
        if (!amAC()) { nhacDat(4); return; }
        nhacDatTo();
        var chay = function () {
          if (lan !== N.lan) return;
          var s = N.ac.createBufferSource(); s.buffer = N.buf[N.nguon]; s.loop = true; s.connect(N.g); s.start(0); N.src = s;
          var xong = function () { if (lan !== N.lan) return; if (N.ac.state === "running") nhacDat(1); else { nhacDat(2); nhacChoCham(); } };
          try { N.ac.resume().then(xong, xong); } catch (e) { xong(); }
          setTimeout(xong, 400);                  // có trình duyệt để resume() treo cho tới khi trang được chạm
        };
        if (N.buf[N.nguon]) { chay(); return; }
        (function (nguon) {
          fetch(bai.tep).then(function (r) { if (!r.ok) throw new Error("" + r.status); return r.arrayBuffer(); })
            .then(function (ab) { return new Promise(function (ok, bad) { N.ac.decodeAudioData(ab, ok, bad); }); })
            .then(function (b) { N.buf[nguon] = b; chay(); }, function () { if (lan === N.lan) nhacDat(4); });
        })(N.nguon);
        return;
      }
      layAnh(N.nguon === "btd" ? "btdNhac" : "nhacXep", function (b) {             // file thầy chọn; 27/11: hay bài hát của Báo tường động
        if (lan !== N.lan) return;
        if (!b) { nhacDat(4); return; }
        if (!N.au) { N.au = new Audio(); N.au.loop = true; }
        if (!N.url || N.blob !== b) { if (N.url) URL.revokeObjectURL(N.url); N.blob = b; N.url = URL.createObjectURL(b); N.au.src = N.url; }
        nhacDatTo();
        var p = null;
        try { p = N.au.play(); } catch (e) { nhacDat(4); return; }
        if (p && p.then) p.then(function () { if (lan === N.lan) nhacDat(1); }, function (er) { if (lan !== N.lan) return; if (er && er.name === "NotAllowedError") { nhacDat(2); nhacChoCham(); } else nhacDat(4); });
        else nhacDat(1);
      });
    }
    function nhacTenBai() { return NHAC_BAI[N.nguon] ? NHAC_BAI[N.nguon].ten : N.nguon === "btd" ? (btd.nhacTen || "bài hát của Báo tường động") : (N.ten || "bài hát thầy chọn"); }
    function veNhac() {
      var tt = N.tt, chu, nhan = N.bat ? "Tắt nhạc" : "Bật nhạc", b = $("nutNhac");
      $("nhacXep").classList.toggle("bat", N.nguon === "xep"); $("nhacHV").classList.toggle("bat", N.nguon === "hv"); $("nhacChon").classList.toggle("bat", N.nguon === "rieng");
      chu = "Đang chọn: “" + nhacTenBai() + "”. " + (tt === 1 ? "Nhạc đang phát" : tt === 2 ? "Trình duyệt chưa cho phát tiếng: thầy chạm một lần vào màn hình tivi" : tt === 4 ? "Không mở được bài hát này" : "Nhạc đang tắt") + (tt === 4 || tt === 2 ? "." : ", âm lượng " + N.am + "/" + NHAC_MUC + ".");
      if (N.loi) chu = N.loi;
      $("nhacTinh").textContent = chu; $("nhacTinh").classList.toggle("xau", tt === 4 || !!N.loi);
      $("nhacBat").textContent = N.bat ? "■ Tắt nhạc" : "▶ Bật nhạc";
      b.classList.toggle("dang", N.bat); b.classList.toggle("cho", N.bat && (tt === 2 || tt === 4)); b.setAttribute("aria-label", nhan); b.title = nhan;
      $("nhacMuc").textContent = N.am;
      $("nutNhacNho").disabled = N.am <= 1; $("nutNhacTo").disabled = N.am >= NHAC_MUC;
    }
    function nhacGhi(bat, am) {                     // ghi lên phòng (máy giáo viên thấy theo); chưa nối mạng thì chỉ đổi trên tivi
      am = Math.max(1, Math.min(NHAC_MUC, am));
      if (T) T.set("nhac", { b: bat ? 1 : 0, a: am }); else nhacNhan({ b: bat ? 1 : 0, a: am });
    }
    function nhacNhan(v) {
      var bat = !!v && typeof v === "object" && v.b === 1, am = v && typeof v === "object" && v.a >= 1 && v.a <= NHAC_MUC ? Math.round(v.a) : NHAC_MUC_DAU, dau = !N.daNhan;
      N.daNhan = true;
      if (dau) { var amCu = am; am = NHAC_MUC; if (T && (bat || amCu !== am)) T.set("nhac", { b: 0, a: am }); bat = false; }      // tivi vừa mở trang: nhạc chờ thầy bấm Bật; 27/11 14:46: âm lượng về mức to nhất
      if (am !== N.am) { N.am = am; nhacDatTo(); }
      if (bat !== N.bat || dau) { N.bat = bat; nhacPhat(); } else veNhac();
    }
    /* 27/11 14:46, thầy: "khi có bắn pháo bông thì âm thanh tự tắt nhé, có tiếng trống thì âm thanh tự tắt luôn, tôi sẽ tự mở lại."
       nhacTatDan(ms): nhạc nhỏ dần trong ms mili giây rồi TẮT hẳn (ghi <phòng>/nhac b = 0, máy giáo viên thấy nút về "Bật nhạc"); không tự bật lại, thầy bấm Bật.
       Pháo bông: 0,9 giây (nhacPhaoBong, như trước). Trống lúc bắt đầu đếm ngược: 0,4 giây kể từ tiếng gõ đầu. Hết giờ: tắt xong đúng lúc trống gõ (DN_HET_CHO = 0,4 giây;
       trước 27/11 nhạc nhỏ dần trong 2 giây, đè lên tiếng trống). Chạy tiếp sau tạm dừng không có trống nên nhạc không tắt. */
    function nhacTatDan(ms) {
      var buoc = 0, so = Math.max(1, Math.round(ms / 50));
      if (!N.bat) return;
      clearInterval(N.henMo);
      N.henMo = setInterval(function () {
        buoc++; N.mo = Math.max(0, 1 - buoc / so); nhacDatTo();
        if (buoc >= so) { clearInterval(N.henMo); nhacGhi(false, N.am); }
      }, 50);
    }
    function nhacHetGio() { nhacTatDan(DN_HET_CHO); }      // đồng hồ đếm ngược vừa hết giờ (trống gõ sau DN_HET_CHO)
    function nhacTrong() { nhacTatDan(400); }              // trống gõ lúc bắt đầu đếm ngược
    function nhacChon(nguon, ten) {
      N.nguon = nguon; N.loi = "";
      if (ten !== undefined) N.ten = ten;
      try { localStorage.setItem("xt-nhac-ten", N.ten || ""); } catch (e) { /* bỏ qua */ }
      nhacPhat();
    }
    $("nhacXep").onclick = function () { nhacChon("xep"); };
    $("nhacHV").onclick = function () { nhacChon("hv"); };
    $("nhacChon").onclick = function () { $("nhacTep").value = ""; $("nhacTep").click(); };
    $("nhacTep").onchange = function () {
      var f = $("nhacTep").files && $("nhacTep").files[0], thuA, u;
      if (!f) return;
      thuA = new Audio(); u = URL.createObjectURL(f);
      thuA.onloadedmetadata = function () {
        URL.revokeObjectURL(u);
        luuAnh("nhacXep", f, function (ok) {
          if (!ok) { N.loi = "Trình duyệt không cho lưu file này. Thầy thử một file nhạc nhỏ hơn."; veNhac(); return; }
          N.blob = null; nhacChon("rieng", f.name.replace(/\.[a-z0-9]{2,5}$/i, ""));
        });
      };
      thuA.onerror = function () { URL.revokeObjectURL(u); N.loi = "Không mở được tệp này. Thầy chọn một file nhạc (mp3, m4a, ogg, wav) nhé."; veNhac(); };
      thuA.src = u;
    };
    $("nhacBat").onclick = $("nutNhac").onclick = function () { nhacGhi(!N.bat, N.am); };
    $("nutNhacNho").onclick = function () { nhacGhi(N.bat, N.am - 1); };
    $("nutNhacTo").onclick = function () { nhacGhi(N.bat, N.am + 1); };
    veNhac();

    /* ---------- Báo tường động (27/11) ----------
       27/11 08:37, thầy (kèm bài hát "09. Bèo dạt mây trôi.mp3"): "khi mà 4 nhóm đã hoàn thiện tờ báo tường online, đã bắn pháo bông xong thì trong ứng dụng sẽ có
       một nút gọi là, Báo tường động, lúc này thì hình ảnh thầy cô ở bức ảnh to sẽ chuyển động, ... còn các hình nhỏ bên dưới thì đổi hình thôi và khi tôi bấm vào
       nút báo tường động thì cũng sẽ đổi nhạc sang bài này".
       09:08, thầy: "clip nặng quá tôi tải về lâu. giờ bạn vô thư mục này chọn ảnh rồi tạo hiệu ứng đổi ảnh là được. có thể truy cập web phan tây hồ để lựa các
       hình ảnh mới nhất nhé". Nên không dùng clip: khung ảnh to đổi lần lượt các ảnh thầy cô, 6 khung nhỏ đổi ảnh hoạt động; không phóng to thu nhỏ.
       Ảnh có hình thầy cô, học sinh; bài hát có bản quyền: KHÔNG để trên mạng. Thầy chọn tệp bao-tuong-dong.zip (hay chọn thẳng nhiều ảnh và một bài hát) trong
       Cài đặt trên máy tivi; trang lưu trong kho của trình duyệt máy đó (IndexedDB "ruoc-duoc", cùng kho với ảnh báo tường, không đổi số phiên bản của kho):
       khóa "btdTo" (ảnh khung to), "btdAnh" (ảnh khung nhỏ), "btdNhac" (bài hát). Ảnh trong thư mục "anh-to" (hay tên bắt đầu bằng "to-") vào khung to, ảnh
       khác vào khung nhỏ. Lúc chọn, ảnh nào chưa đúng khung 3 : 2 thì làm lại cho đúng (ảnh ngang cắt vừa khung; ảnh dọc để nguyên ở giữa, hai bên là chính ảnh
       đó nhoè). Chọn tệp mới thì thay hết; nút "Bỏ" xóa hết khỏi máy.
       Chạy: khung to cứ BTD.TO giây đổi sang ảnh kế (theo thứ tự tên tệp, hết thì quay lại), lần lượt 3 kiểu: mờ chéo, quét mềm từ trái sang, quét mềm từ phải
       sang. 6 khung nhỏ (27/11 13:06): lúc bật 6 khung mờ dần hiện ảnh; sau đó lật sách, cột trái lật sang trái rồi cột phải lật sang phải, xen kẽ, cứ BTD.TO giây
       một cột, rơi vào giữa hai lần đổi ảnh khung to (ảnh xáo trộn; hai khung không cùng một ảnh). Dây đèn phía trên 6 ảnh nhỏ nhấp nháy (BTD.DAY).
       Nhạc nền đổi sang bài hát, lặp lại (không có
       bài hát thì giữ bài đang có). Dừng: các khung mờ đi, hiện lại ảnh trên báo tường; nhạc nhỏ dần rồi trả lại bài cũ (bài cũ đang tắt thì nhạc tắt).
       Lệnh "btd" từ máy giáo viên (k = 1 bật, 0 dừng); trong Cài đặt có nút "Xem thử". Pháo hoa bắn thì Báo tường động dừng.
       Chỗ các khung lấy từ bo-cuc-canva-a3.json (lop-a3-ban-6) của báo tường 4494 × 3179; trang vẽ báo tường rộng 1527 (#baoTuong). */
    var BTD = {
      TO: 5.5,                                      // giây: mỗi ảnh khung to hiện bao lâu, kể cả lúc đổi sang ảnh sau
      DOI: 1.6,                                     // giây đổi ảnh khung to (bằng thời gian các hiệu ứng .btd-o.mo, .quet-trai, .quet-phai trong index.html)
      KIEU: ["rem", "lat", "tron", "luot", "la", "mo", "kim", "trang", "o", "quet-trai", "roi", "cheo", "sang", "quet-phai"],   // 27/11 12:08: 14 kiểu đổi ảnh khung to, lần lượt
      RA: { luot: 1 },                              // kiểu nào thì ảnh cũ cũng chuyển động (lớp "ra-" + kiểu)
      LAT: 1.2, LAT_CACH: 0.25,                     // 27/11 13:06: giây lật một ảnh nhỏ (bằng .btd-nho img.lat-trai, .lat-phai trong index.html); ảnh trên, giữa, dưới
                                                    // của một cột lật cách nhau LAT_CACH giây. Mỗi cột cứ 2 × BTD.TO giây lật một lần (cột trái, cột phải xen kẽ)
      TO_W: 1800, TO_H: 1200, NHO_W_A: 960, NHO_H_A: 640,      // lúc chọn tệp: cỡ ảnh lưu lại (khung to trên tivi rộng chừng 1300 điểm ảnh, khung nhỏ chừng 300)
      LON: [1311.54, 597.75, 1870.93, 1246.73],     // ảnh to: trái, trên, rộng, cao (theo ảnh báo tường 4494 × 3179)
      NHO: [[1771, 1968.84, -2], [2279, 2357.66, -1.8], [2279, 2746.49, 1.6], [2279, 1968.84, 1.5], [1771, 2746.49, -1.2], [1771, 2357.66, 1.5]],
      NHO_W: 444, NHO_H: 296,                       // 6 ảnh nhỏ: trái, trên, góc xoay (độ, quanh tâm khung); thứ tự trong mảng là thứ tự đổi ảnh, xen kẽ cho đều
      VIEN: 14,                                     // 27/11 10:05: bề rộng viền đèn quanh ảnh to (điểm trên trang báo tường rộng 1527), tính ra ngoài mép ảnh
      BONG: 90,                                     // số bóng đèn trên viền (chia hết cho 3: cứ 3 bóng có 1 bóng sáng, chạy vòng)
      DAY: [[1827.2, 1933.4, "do"], [1887.5, 1936.6, "vang"], [1942, 1934.4, "xanh"], [2039.2, 1934.5, "hong"], [2091.7, 1939.2, "lam"],       // 27/11 13:06: 15 bóng
            [2142.2, 1940.6, "do"], [2172.1, 1940.9, "vang"], [2249.7, 1944.2, "xanh"], [2297, 1941.7, "hong"], [2352, 1941.3, "lam"],        // trên dây đèn phía trên
            [2404.1, 1938.8, "do"], [2451.5, 1934.4, "vang"], [2553.1, 1934.5, "xanh"], [2608.6, 1936.5, "hong"], [2667, 1933.3, "lam"]]      // 6 ảnh nhỏ: tâm bóng, màu
    };
    var btd = { chay: false, lan: 0, to: [], anh: [], nhac: null, nhacTen: "", nhacCu: null, o: [], nho: [], cur: -1, toVi: 0, kieuVi: 0,
                hen: 0, henDauTo: 0, henAnh: 0, henDau: 0, henLatDau: 0, henTan: 0, anhDs: [], anhVi: 0, latVi: 0, cot: [], dangChon: false, chonLan: 0, boQua: 0 };
    var btdKhung = H("div", null, null, $("baoTuong")), btdLon = H("div", "btd-lon", null, btdKhung);
    btdKhung.id = "btd"; btdKhung.hidden = true;
    (function () {
      var s = 1527 / 4494, L = BTD.LON;
      function dat(e, x, y, w, h) { e.style.left = (x * s).toFixed(2) + "px"; e.style.top = (y * s).toFixed(2) + "px"; e.style.width = (w * s).toFixed(2) + "px"; e.style.height = (h * s).toFixed(2) + "px"; }
      dat(btdLon, L[0], L[1], L[2], L[3]);
      (function () {                                // 27/11 10:05: khung đèn sân khấu quanh ảnh to (quầng sáng, viền vàng có bóng đèn chạy, hai luồng đèn rọi)
        var M = BTD.VIEN, x = L[0] * s - M, y = L[1] * s - M, w = L[2] * s + 2 * M, h = L[3] * s + 2 * M;
        var hao = H("div", "btd-hao"), den = H("div", "btd-den", null, btdKhung);
        btdKhung.insertBefore(hao, btdLon);
        [hao, den].forEach(function (e) { e.style.left = x.toFixed(2) + "px"; e.style.top = y.toFixed(2) + "px"; e.style.width = w.toFixed(2) + "px"; e.style.height = h.toFixed(2) + "px"; });
        den.innerHTML = btdVienSvg(w, h, M);
        // 27/11 14:56, thầy: "bỏ hiệu ứng chiếu đèn luôn đi nhé, giữ nguyên bản gốc" → không còn hai đèn rọi (.btd-goc) và hai luồng sáng (.btd-roi) đè lên ảnh to;
        // ảnh to hiện đúng như tệp. Quầng sáng sau khung và viền bóng đèn không đè lên ảnh nên giữ.
      })();
      [0, 1].forEach(function () {
        var o = { e: H("div", "btd-o", null, btdLon), url: "" };
        o.im = H("img", null, null, o.e); o.im.alt = ""; o.im.decoding = "async";
        btd.o.push(o);
      });
      BTD.NHO.forEach(function (n) {
        var e = H("div", "btd-nho", null, btdKhung), im = [H("img", null, null, e), H("img", null, null, e)];
        dat(e, n[0], n[1], BTD.NHO_W, BTD.NHO_H); e.style.transform = "rotate(" + n[2] + "deg)";
        im.forEach(function (x) { x.alt = ""; x.decoding = "async"; });
        btd.nho.push({ e: e, im: im, dang: -1, url: "", cu: "" });
      });
      (function () {                                // 27/11 13:06: hai cột ảnh nhỏ (chỉ số trong BTD.NHO, từ trên xuống): btd.cot[0] cột trái, btd.cot[1] cột phải
        var x0 = Math.min.apply(null, BTD.NHO.map(function (n) { return n[0]; }));
        [true, false].forEach(function (trai) {
          btd.cot.push(BTD.NHO.map(function (n, i) { return i; }).filter(function (i) { return (BTD.NHO[i][0] === x0) === trai; })
            .sort(function (a, b) { return BTD.NHO[a][1] - BTD.NHO[b][1]; }));
        });
      })();
      BTD.DAY.forEach(function (b, i) {             // 27/11 13:06: dây đèn phía trên 6 ảnh nhỏ nhấp nháy, bóng chẵn và bóng lẻ thay nhau sáng (.btd-bong trong index.html)
        var e = H("span", "btd-bong " + b[2] + (i % 2 ? " le" : ""), null, btdKhung);
        e.style.left = (b[0] * s).toFixed(2) + "px"; e.style.top = (b[1] * s).toFixed(2) + "px";
      });
    })();
    function btdVienSvg(w, h, M) {                  // viền vàng kim rộng M quanh ảnh to (w × h là cả khung, đã gồm viền) và BTD.BONG bóng đèn trên đường giữa viền
      var R = M / 2 + 4, n = BTD.BONG, pl = ' pathLength="' + n * 6 + '"';
      function f(v) { return Math.round(v * 100) / 100; }
      function d(k) {                               // chữ nhật bo góc cách mép ngoài k, đi theo chiều kim đồng hồ từ góc trên trái
        var q = Math.max(0, R - k), a = k, b = k, W = w - 2 * k, Hh = h - 2 * k, c = "A" + f(q) + " " + f(q) + " 0 0 1 ";
        return "M" + f(a + q) + " " + f(b) + "H" + f(a + W - q) + c + f(a + W) + " " + f(b + q) + "V" + f(b + Hh - q) + c + f(a + W - q) + " " + f(b + Hh) +
          "H" + f(a + q) + c + f(a) + " " + f(b + Hh - q) + "V" + f(b + q) + c + f(a + q) + " " + f(b) + "Z";
      }
      var g = d(M / 2), bong = ' d="' + g + '"' + pl + ' fill="none" stroke-linecap="round"';
      return '<svg viewBox="0 0 ' + f(w) + ' ' + f(h) + '" aria-hidden="true"><defs>' +
        '<linearGradient id="btdDenVang" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4a0e"/><stop offset=".16" stop-color="#c8902a"/>' +
        '<stop offset=".3" stop-color="#f6d77a"/><stop offset=".46" stop-color="#b47a1e"/><stop offset=".64" stop-color="#e8bb52"/><stop offset=".8" stop-color="#f9e39a"/>' +
        '<stop offset="1" stop-color="#7a4a0e"/></linearGradient>' +
        '<filter id="btdDenMo" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
        '<path d="' + g + '" fill="none" stroke="url(#btdDenVang)" stroke-width="' + M + '"/>' +
        '<path d="' + d(0.7) + '" fill="none" stroke="rgba(92,52,8,.85)" stroke-width="1.4"/>' +
        '<path d="' + d(1.9) + '" fill="none" stroke="rgba(255,240,190,.75)" stroke-width="1"/>' +
        '<path d="' + d(M - 0.6) + '" fill="none" stroke="rgba(84,48,10,.75)" stroke-width="1.2"/>' +
        '<path class="de"' + bong + ' stroke="#6b4512" stroke-width="9.4" stroke-dasharray="0 6" opacity=".9"/>' +
        '<path class="bong"' + bong + ' stroke="#fbe7a8" stroke-width="6.6" stroke-dasharray="0 6" opacity=".75"/>' +
        '<path class="quang"' + bong + ' stroke="#ffc83d" stroke-width="18" stroke-dasharray="0 18" opacity=".95" filter="url(#btdDenMo)"/>' +
        '<path class="sang"' + bong + ' stroke="#fffdf2" stroke-width="6.6" stroke-dasharray="0 18"/></svg>';
    }
    function btdBao() {                             // cho bao3d: [đang chạy, số ảnh khung to, số ảnh khung nhỏ, có bài hát]
      return typeof btd === "object" && btd ? [btd.chay ? 1 : 0, btd.to.length, btd.anh.length, btd.nhac ? 1 : 0] : [0, 0, 0, 0];
    }
    function btdXao(a) { var i, j, t; for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function btdDoiTo() {                           // khung to đổi sang ảnh kế: ảnh mới nằm trên, hiện ra theo một trong 3 kiểu; xong thì cất ảnh cũ
      var lan = btd.lan, moi, cu, a;
      if (!btd.chay || !btd.to.length) return;
      moi = btd.o[btd.cur === 0 ? 1 : 0]; cu = btd.cur >= 0 ? btd.o[btd.cur] : null;
      a = btd.to[btd.toVi++ % btd.to.length];
      moi.url = a.url; moi.im.src = a.url;
      function hien() {
        var kieu;
        if (lan !== btd.lan || !btd.chay || moi.url !== a.url) return;
        kieu = BTD.KIEU[btd.kieuVi++ % BTD.KIEU.length];
        BTD.KIEU.forEach(function (k) { moi.e.classList.remove(k, "ra-" + k); });
        void moi.e.offsetWidth;                     // để hiệu ứng chạy lại từ đầu
        moi.e.classList.add("tren", "hien", kieu);
        if (cu) { cu.e.classList.remove("tren"); if (BTD.RA[kieu]) cu.e.classList.add("ra-" + kieu); }
        btd.cur = btd.o.indexOf(moi);
        setTimeout(function () {
          if (lan !== btd.lan) return;              // đã dừng: btdDon dọn hết
          moi.e.classList.remove(kieu);
          if (cu && btd.o[btd.cur] !== cu) cu.e.classList.remove("hien", "ra-" + kieu);
        }, BTD.DOI * 1000 + 150);
      }
      if (moi.im.decode) moi.im.decode().then(hien, function () { /* ảnh hỏng: giữ ảnh đang hiện, tới lượt sau đổi tiếp */ });
      else moi.im.onload = hien;
    }
    function btdAnhKe() {                           // ảnh kế tiếp cho khung nhỏ: đi hết lượt rồi xáo lại, bỏ qua ảnh đang hiện ở khung khác (kể cả ảnh cũ đang lật đi)
      var dang = btd.nho.map(function (n) { return n.url; }).concat(btd.nho.map(function (n) { return n.cu; })), i, a = null;
      for (i = 0; i <= btd.anh.length; i++) {
        if (btd.anhVi >= btd.anhDs.length) { btd.anhDs = btdXao(btd.anh.slice()); btd.anhVi = 0; }
        a = btd.anhDs[btd.anhVi++];
        if (dang.indexOf(a.url) < 0) return a;
      }
      return a;
    }
    function btdDoiNho(n, kieu) {                   // một khung nhỏ sang ảnh mới. kieu "mo": ảnh mới nằm trên, mờ dần hiện ra (lúc bật). "trai" / "phai" (27/11 13:06,
      var lan = btd.lan, a, im, cu;                 // lật sách): ảnh mới hiện ngay ở dưới, ảnh cũ lật đi quanh mép trái / mép phải trong BTD.LAT giây, xong thì cất
      if (!btd.chay || !btd.anh.length) return;
      a = btdAnhKe();
      if (!a) return;
      im = n.im[n.dang === 0 ? 1 : 0]; cu = n.dang >= 0 ? n.im[n.dang] : null;
      n.cu = cu ? n.url : ""; n.url = a.url; im.className = ""; im.src = a.url;
      function xong() { if (lan === btd.lan && n.url === a.url) n.cu = ""; }
      function hien() {
        if (lan !== btd.lan || !btd.chay || n.url !== a.url) return;
        n.dang = n.im.indexOf(im);
        if (!cu || kieu === "mo") {
          im.className = "tren hien"; if (cu) cu.className = "hien";
          setTimeout(function () { if (lan !== btd.lan) return; if (cu && n.im[n.dang] !== cu) cu.className = ""; xong(); }, 1100);
          return;
        }
        im.className = "duoi hien"; cu.className = "tren hien lat-" + kieu;
        setTimeout(function () {
          if (lan !== btd.lan || n.im[n.dang] !== im) return;
          cu.className = "duoi"; im.className = "tren hien"; xong();     // lật xong: cất ảnh cũ ngay (không mờ dần), ảnh mới lên trên
        }, BTD.LAT * 1000 + 60);
      }
      if (im.decode) im.decode().then(hien, function () { /* ảnh hỏng: giữ ảnh đang hiện */ }); else im.onload = hien;
    }
    function btdDayNho() {                          // lúc bật: 6 khung nhỏ (còn trống) lần lượt mờ dần hiện ảnh, cột trái trước
      var lan = btd.lan;
      btd.cot[0].concat(btd.cot[1]).forEach(function (i, j) {
        setTimeout(function () { if (lan === btd.lan) btdDoiNho(btd.nho[i], "mo"); }, j * 150);
      });
    }
    function btdLatCot() {                          // 27/11 13:06: lật sách một cột ảnh nhỏ, trên xuống dưới; lần này cột trái lật sang trái, lần sau cột phải lật sang phải
      var lan = btd.lan, k = btd.latVi++ % 2;
      btd.cot[k].forEach(function (i, j) {
        setTimeout(function () { if (lan === btd.lan) btdDoiNho(btd.nho[i], k ? "phai" : "trai"); }, j * BTD.LAT_CACH * 1000);
      });
    }
    function btdNhacBat() {                         // nhạc nền đổi sang bài của Báo tường động (không có bài hát thì giữ bài đang có)
      if (!btd.nhac) return;
      if (!btd.nhacCu) btd.nhacCu = { nguon: N.nguon === "btd" ? "xep" : N.nguon, bat: N.bat };
      clearInterval(N.henMo);
      N.nguon = "btd"; N.loi = "";
      if (N.bat) nhacPhat(); else nhacGhi(true, N.am);
    }
    function btdNhacTat(nhanh) {                    // trả lại bài cũ: nhạc nhỏ dần chừng 0,9 giây rồi phát bài cũ, hay tắt nếu lúc bật Báo tường động nhạc đang tắt
      var cu = btd.nhacCu, buoc = 0;                // nhanh: pháo hoa sắp tự làm nhạc nhỏ dần rồi tắt, ở đây chỉ trả tên bài
      if (!cu || N.nguon !== "btd") { btd.nhacCu = null; return; }
      if (nhanh || !N.bat) { btd.nhacCu = null; N.nguon = cu.nguon; veNhac(); return; }
      clearInterval(N.henMo);
      N.henMo = setInterval(function () {
        buoc++; N.mo = Math.max(0, 1 - buoc / 15); nhacDatTo();
        if (buoc < 15) return;
        clearInterval(N.henMo);
        btd.nhacCu = null; N.nguon = cu.nguon;
        if (cu.bat) nhacPhat(); else nhacGhi(false, N.am);
      }, 60);
    }
    function btdDon() {                             // đã mờ hẳn: cất các khung
      clearTimeout(btd.henTan); btd.henTan = 0;
      btdKhung.hidden = true; btdKhung.classList.remove("tan");
      btd.o.forEach(function (o) { o.url = ""; o.e.className = "btd-o"; o.im.removeAttribute("src"); });
      btd.nho.forEach(function (n) { n.dang = -1; n.url = ""; n.cu = ""; n.im.forEach(function (im) { im.className = ""; im.removeAttribute("src"); }); });
    }
    function btdBat() {
      if (btd.chay || btd.dangChon) return;
      if (!btd.to.length && !btd.anh.length) { btdVe(); bao3d(); return; }      // máy tivi chưa có ảnh: máy giáo viên báo thầy vào Cài đặt chọn tệp
      if (btd.henTan) btdDon();                     // vừa dừng, còn đang mờ: dọn ngay rồi chạy lại
      veBaoTuong();                                 // dẹp các bảng, thôi hiện to: thấy cả tấm báo tường
      btd.chay = true; btd.lan++; btd.cur = -1; btd.toVi = 0; btd.kieuVi = 0; btd.latVi = 0;
      btdKhung.classList.remove("tan"); btdKhung.hidden = false;
      if (btd.to.length) { btd.henDauTo = setTimeout(btdDoiTo, 600); btd.hen = setInterval(btdDoiTo, BTD.TO * 1000); }
      if (btd.anh.length) {                         // 27/11 13:06: 6 khung nhỏ hiện ảnh lúc 1,5 giây; lật sách lần đầu ở giữa lần đổi ảnh khung to thứ 2 và thứ 3, rồi cứ BTD.TO giây
        btd.henDau = setTimeout(btdDayNho, 1500);
        btd.henLatDau = setTimeout(function () { btdLatCot(); btd.henAnh = setInterval(btdLatCot, BTD.TO * 1000); }, BTD.TO * 1500);
      }
      btdNhacBat();
      btdVe(); bao3d();
    }
    function btdTat(nhanh) {
      if (!btd.chay) return;
      btd.chay = false; btd.lan++;
      clearTimeout(btd.henDauTo); clearInterval(btd.hen); clearTimeout(btd.henDau); clearTimeout(btd.henLatDau); clearInterval(btd.henAnh);
      btdKhung.classList.add("tan");
      btd.henTan = setTimeout(btdDon, 850);
      btdNhacTat(nhanh);
      btdVe(); bao3d();
    }
    /* --- Cài đặt: chọn tệp, xem thử, bỏ --- */
    function btdVe() {
      var c = btd.to.length, a = btd.anh.length, e = $("btdTinh");
      if (btd.dangChon) return;
      e.textContent = (c || a || btd.nhac ? "Đang có " + c + " ảnh khung to, " + a + " ảnh khung nhỏ" + (btd.nhac ? " và bài hát “" + btd.nhacTen + "”." : ", chưa có bài hát (nhạc nền giữ bài đang chọn).")
        : "Chưa có ảnh, bài hát nào.") + (btd.boQua ? " Bỏ qua " + btd.boQua + " tệp không mở được." : "");
      e.classList.remove("xau");
      $("nutBtdThu").textContent = btd.chay ? "■ Dừng" : "▶ Xem thử";
      tat($("nutBtdThu"), !btd.chay && !c && !a);
      tat($("nutBtdChon"), false);
      an($("nutBtdBo"), !(c || a || btd.nhac));
    }
    function btdTenBai(ten) { return String(ten || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/^\s*\d{1,3}\s*[.)_-]\s*/, "") || "bài hát"; }      // "09. Bèo dạt mây trôi.mp3" → "Bèo dạt mây trôi"
    function btdNapKho(cb) {                        // đọc ảnh, bài hát đã lưu trong máy này (lúc mở trang, sau khi chọn tệp hay bỏ)
      layAnh("btdTo", function (dt) {
        layAnh("btdAnh", function (da) {
          layAnh("btdNhac", function (nh) {
            btd.to.forEach(function (a) { URL.revokeObjectURL(a.url); }); btd.anh.forEach(function (a) { URL.revokeObjectURL(a.url); });
            btd.to = (Array.isArray(dt) ? dt : []).filter(Boolean).map(function (b) { return { url: URL.createObjectURL(b) }; });
            btd.anh = (Array.isArray(da) ? da : []).filter(Boolean).map(function (b) { return { url: URL.createObjectURL(b) }; });
            btd.nhac = nh || null; btd.nhacTen = nh ? btdTenBai(nh.name) : "";
            btd.anhDs = []; btd.anhVi = 0;
            btdVe(); veNhac(); bao3d();
            if (cb) cb();
          });
        });
      });
    }
    function btdKhongDau(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }
    function btdLoai(ten, t) {                      // "to" (ảnh khung to), "anh" (ảnh khung nhỏ), "nhac", "zip" hay "" (tệp khác: bỏ qua)
      var p = btdKhongDau(ten).toLowerCase(), cuoi = p.split("/").pop(), d = cuoi.indexOf(".") >= 0 ? cuoi.split(".").pop() : "";
      t = (t || "").toLowerCase();
      if (!cuoi || /^\./.test(cuoi) || /(^|\/)__macosx\//.test(p)) return "";
      if (d === "zip" || /zip/.test(t)) return "zip";
      if (/^image\//.test(t) || /^(jpe?g|png|webp|gif|bmp|avif)$/.test(d)) return /(^|\/)(anh[ _-]*to|thay[ _-]*co)\//.test(p) || /^to[ _-]/.test(cuoi) ? "to" : "anh";
      if (/^audio\//.test(t) || /^(mp3|m4a|aac|wav|ogg|oga|opus|flac)$/.test(d)) return "nhac";
      return "";
    }
    function btdKieuTep(ten) {                      // kiểu tệp theo đuôi (cho tệp lấy ra từ .zip)
      var d = (ten.split(".").pop() || "").toLowerCase();
      return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", avif: "image/avif",
               mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", flac: "audio/flac" }[d] || "";
    }
    function btdMoZip(f, cb) {                      // mở tệp .zip (lưu thẳng, hay nén kiểu deflate như Windows nén): cb([{ ten, b }]) hay cb(null) nếu không đọc được
      var r = new FileReader();
      r.onload = function () {
        var buf = r.result, v, n, i, cuoi = -1, so, cd, ds = [], ra = [], nl, el, cl, pp, co, lo, ten, dl;
        try {
          v = new DataView(buf); n = buf.byteLength;
          for (i = n - 22; i >= Math.max(0, n - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { cuoi = i; break; }
          if (cuoi < 0) { cb(null); return; }
          so = v.getUint16(cuoi + 10, true); cd = v.getUint32(cuoi + 16, true);
          for (i = 0; i < so; i++) {
            if (cd + 46 > n || v.getUint32(cd, true) !== 0x02014b50) break;
            pp = v.getUint16(cd + 10, true); co = v.getUint32(cd + 20, true);
            nl = v.getUint16(cd + 28, true); el = v.getUint16(cd + 30, true); cl = v.getUint16(cd + 32, true); lo = v.getUint32(cd + 42, true);
            ten = new TextDecoder().decode(new Uint8Array(buf, cd + 46, nl));
            cd += 46 + nl + el + cl;
            if (/\/$/.test(ten) || !btdLoai(ten, "") || btdLoai(ten, "") === "zip" || lo + 30 > n || v.getUint32(lo, true) !== 0x04034b50) continue;
            dl = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
            if (dl + co <= n && (pp === 0 || pp === 8)) ds.push({ ten: ten, pp: pp, du: buf.slice(dl, dl + co) });
          }
        } catch (e) { cb(null); return; }
        (function tiep(k) {
          var x;
          if (k >= ds.length) { cb(ra); return; }
          x = ds[k];
          if (x.pp === 0) { ra.push({ ten: x.ten, b: new Blob([x.du], { type: btdKieuTep(x.ten) }) }); tiep(k + 1); return; }
          try {
            new Response(new Blob([x.du]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (g) {
              ra.push({ ten: x.ten, b: new Blob([g], { type: btdKieuTep(x.ten) }) }); tiep(k + 1);
            }, function () { tiep(k + 1); });
          } catch (e2) { tiep(k + 1); }
        })(0);
      };
      r.onerror = function () { cb(null); };
      r.readAsArrayBuffer(f);
    }
    function btdKhungAnh(b, W, H, cb) {             // ảnh: đúng khung W × H (3 : 2) và không lớn hơn thì giữ nguyên; không thì làm lại cho vừa khung, lưu JPEG; cb(null) nếu không mở được
      docAnh(b, function (im, u) {
        var w, h, c, g, tl, sw, sh;
        if (!im) { cb(null); return; }
        w = im.naturalWidth; h = im.naturalHeight;
        if (Math.abs(w / h - W / H) < 0.01 * W / H && w <= W) { URL.revokeObjectURL(u); cb(b); return; }
        c = document.createElement("canvas"); c.width = W; c.height = H;
        try {
          g = c.getContext("2d");
          tl = Math.max(W / w, H / h); sw = W / tl; sh = H / tl;               // phần ảnh vừa kín khung
          if (w / h >= 1.25) g.drawImage(im, (w - sw) / 2, (h - sh) * 0.4, sw, sh, 0, 0, W, H);      // ảnh ngang: cắt vừa khung (lệch lên trên một chút cho khỏi mất đầu người)
          else {                                    // ảnh dọc hay gần vuông: nền là chính ảnh đó nhoè, tối đi; ảnh để nguyên ở giữa
            try { g.filter = "blur(" + Math.round(W / 50) + "px) brightness(0.75)"; } catch (e) { /* bỏ qua */ }
            g.drawImage(im, (w - sw) / 2, (h - sh) / 2, sw, sh, -W * 0.06, -H * 0.06, W * 1.12, H * 1.12);
            g.filter = "none";
            tl = Math.min(W / w, H / h);
            g.drawImage(im, (W - w * tl) / 2, (H - h * tl) / 2, w * tl, h * tl);
          }
        } catch (e2) { URL.revokeObjectURL(u); cb(null); return; }
        URL.revokeObjectURL(u);
        try { c.toBlob(function (x) { cb(x || null); }, "image/jpeg", 0.88); } catch (e3) { cb(null); }
      });
    }
    function btdXemNhac(f, cb) {                    // mở thử bài hát
      var a = new Audio(), u = URL.createObjectURL(f), xong = false;
      function het(ok) { if (xong) return; xong = true; a.onloadedmetadata = a.onerror = null; a.removeAttribute("src"); URL.revokeObjectURL(u); cb(ok); }
      a.preload = "metadata"; a.onloadedmetadata = function () { het(true); }; a.onerror = function () { het(false); };
      setTimeout(function () { het(false); }, 10000);
      a.src = u;
    }
    function btdChon(tep) {                         // thầy chọn tệp: mở .zip, làm lại ảnh nào chưa đúng khung, lưu tất cả vào kho của trình duyệt (thay hết cái cũ)
      var lan = ++btd.chonLan, e = $("btdTinh"), ds = [], bo = 0, zip = [];
      tep.forEach(function (f) {
        var ten = f.webkitRelativePath || f.name, l = btdLoai(ten, f.type);
        if (l === "zip") zip.push(f); else if (l) ds.push({ ten: ten, b: f, l: l });
      });
      if (btd.chay) btdTat();
      btd.dangChon = true; tat($("nutBtdChon"), true); tat($("nutBtdThu"), true); an($("nutBtdBo"), true); e.classList.remove("xau");
      (function moZip(i) {
        if (lan !== btd.chonLan) return;
        if (i >= zip.length) { doc(); return; }
        e.textContent = "Đang mở tệp " + zip[i].name + "…";
        btdMoZip(zip[i], function (ra) {
          if (lan !== btd.chonLan) return;
          if (!ra) bo++;
          else ra.forEach(function (x) { var l = btdLoai(x.ten, x.b.type); if (l && l !== "zip") ds.push({ ten: x.ten, b: x.b, l: l }); });
          moZip(i + 1);
        });
      })(0);
      function doc() {
        var to = [], anh = [], nhac = null, i = 0;
        if (!ds.length) {
          btd.dangChon = false; btd.boQua = 0; btdVe();
          e.textContent = "Không thấy ảnh hay bài hát nào trong tệp đã chọn. Thầy chọn lại tệp bao-tuong-dong.zip nhé."; e.classList.add("xau");
          return;
        }
        ds.sort(function (a, b) { return a.ten.localeCompare(b.ten, "vi", { numeric: true }); });
        (function tiep() {
          var x;
          if (lan !== btd.chonLan) return;
          if (i >= ds.length) { luu(to, anh, nhac); return; }
          x = ds[i++];
          e.textContent = "Đang đọc " + i + "/" + ds.length + ": " + x.ten.split("/").pop();
          if (x.l === "to") btdKhungAnh(x.b, BTD.TO_W, BTD.TO_H, function (b) { if (b) to.push(b); else bo++; tiep(); });
          else if (x.l === "anh") btdKhungAnh(x.b, BTD.NHO_W_A, BTD.NHO_H_A, function (b) { if (b) anh.push(b); else bo++; tiep(); });
          else if (!nhac) btdXemNhac(x.b, function (ok) {
            if (ok) nhac = typeof File === "function" && x.b instanceof File ? x.b : new File([x.b], x.ten.split("/").pop(), { type: x.b.type || btdKieuTep(x.ten) });
            else bo++;
            tiep();
          });
          else tiep();                              // nhiều bài hát: lấy bài đầu tiên
        })();
      }
      function luu(to, anh, nhac) {
        e.textContent = "Đang lưu vào máy này…";
        luuAnh("btdTo", to.length ? to : null, function (ok1) {
          luuAnh("btdAnh", anh.length ? anh : null, function (ok2) {
            luuAnh("btdNhac", nhac, function (ok3) {
              btd.dangChon = false; btd.boQua = bo;
              try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e3) { /* bỏ qua */ }
              btdNapKho(function () {
                if (ok1 && ok2 && ok3) return;
                e.textContent = "Máy này không đủ chỗ lưu hết. Thầy bớt ảnh rồi chọn lại."; e.classList.add("xau");
              });
            });
          });
        });
      }
    }
    $("nutBtdChon").onclick = function () { $("btdTep").value = ""; $("btdTep").click(); };
    $("btdTep").onchange = function () { var ds = [].slice.call($("btdTep").files || []); if (ds.length) btdChon(ds); };
    $("nutBtdThu").onclick = function () { if (btd.chay) btdTat(); else btdBat(); };
    $("nutBtdBo").onclick = function () {
      if (btd.chay) btdTat();
      luuAnh("btdTo", null, function () { luuAnh("btdAnh", null, function () { luuAnh("btdNhac", null, function () { btd.boQua = 0; btdNapKho(); }); }); });
    };
    btdVe();
    setTimeout(function () { btdNapKho(); }, 1500);      // đọc kho sau khi trang mở xong (không giành việc với lúc nối máy chủ)

    $("nutMa").onclick = function () { var dangHien = [1, 2, 3, 4].some(hienMa); veBaoTuong(); doiXem(dangHien ? "xep" : "ma"); };
    $("nutCaiDat").onclick = function () { $("dapSo").hidden = true; $("nhiemVu").hidden = true; $("gvMa").hidden = true; $("caiDat").hidden = false; bao3d(); };
    $("nutNhiemVu").onclick = function () { hienNhiemVu(true); };
    /* --- đồng hồ đếm ngược. Bản 15/11 22:12 là một vòng tròn vơi dần; 16/11 22:08 và 23:48 là khung trời có mặt trời mọc, lặn.
       17/11 00:57, thầy: "cái đếm giờ che mất mấy cái nút kìa, chỉnh lại nhé. thôi cái mặt trời đổi lại trống trường đi, bắt đầu thì gõ và hết giờ thì gõ".
       Từ đó đồng hồ là tấm bảng số phút giây và cái trống trường đỏ trên giá gỗ, dùi trống ở bên phải. Lúc bắt đầu và lúc hết giờ dùi gõ vào mặt trống theo DN_NHIP,
       cùng lúc với tiếng trống (amBao): thân trống rung nhẹ, mặt trống sáng lên, vệt tiếng ở bên trái, chữ "Tùng!" ở các tiếng mạnh. Chỉ xoay, trôi, mờ; không phóng to thu nhỏ.
       Một phần ba thời gian cuối số chuyển màu cam; phút cuối số đỏ, tấm bảng hồng lên rồi nhạt đi (như các bản trước).
       Hết giờ (16/11 23:48): chữ "Hết giờ" đứng DN_HET_GIU mili giây (đủ hồi trống), mờ dần trong DN_HET_TAN mili giây rồi ẩn; tivi xóa luôn <phòng>/dn để máy giáo viên về lại nút "Bắt đầu".
       18/11 01:46, thầy: "cái dùi trống quay ngược xuống dưới nhé. khi tôi bấm tính giờ thì trống sẽ đánh xong mới tính giờ, kết thúc thì đếm số 00 thì mới đánh trống ...
       thường thì ngta sẽ gõ vào viền trống kêu cạch cạnh rồi mới đánh tùng tùng tùng".
       → dùi lật lại: tay cầm ở dưới bên phải (gốc xoay ở 270, 165 trong hình trống), đầu dùi ở trên. Gõ viền (DUI.vien): đầu dùi chạm mép phải của mặt trống, lóe tia (#dnTia),
         chữ "Cạch!"; đánh mặt trống (DUI.mat): đầu dùi vào giữa mặt trống, thân trống rung, mặt trống sáng, vệt tiếng, chữ "Tùng!".
       → bấm Bắt đầu: đồng hồ đứng ở 15:00 trong lúc trống đánh (DN_TRUOC), đánh xong mới đếm.
       → hết giờ: số dừng ở 00:00 (đỏ), dòng chữ trên số thành "Hết giờ"; DN_HET_CHO mili giây sau (số 00:00 đã hiện xong) trống mới đánh. Mờ dần lúc DN_HET_GIU, ẩn lúc DN_HET_GIU + DN_HET_TAN. */
    var dnV = null, dnCu = { tt: "", chu: "", mau: "", nho: null, p: -1 }, dnHenT = 0;
    var DN_HET_CHO = 400, DN_HET_GIU = 4200, DN_HET_TAN = 900, dnDaXoa = null;
    var DUI = { nghi: 6, vien: -19, mat: -39, xuong: 90, len: 260 };      // dùi trống: góc lúc nghỉ, lúc chạm viền trống, lúc chạm mặt trống (độ; âm là nghiêng về phía trống); thời gian vung tới, nhấc về (mili giây)
    var dnGoi = { ds: [], chu: [], raf: 0, dem: 0, so: 0, soC: 0, cach: 0, tung: 0, lan: { mo: 0, het: 0 } };      // ds: các tiếng gõ { t: lúc dùi chạm trống (theo performance.now), k: "cach" | "tung", m: mạnh nhẹ, xong }
    function dnGo(loai, cho) {                      // cái trống trên đồng hồ gõ theo DN_NHIP[loai]; tiếng trống phát riêng (amBao), cùng mốc 40 ms (+ cho)
      var t0 = performance.now() + 40 + (cho || 0);
      DN_NHIP[loai].forEach(function (n) { dnGoi.ds.push({ t: t0 + n[0], k: n[1], m: n[2], xong: false }); });
      dnGoi.ds.sort(function (a, b) { return a.t - b.t; });
      dnGoi.so = 0; dnGoi.soC = 0; dnGoi.lan[loai]++;
      $("dn").setAttribute("data-go", dnGoi.lan.mo + "," + dnGoi.lan.het);      // bài thử đọc: số lần trống đã gõ lúc bắt đầu, lúc hết giờ
      if (!dnGoi.raf) dnGoi.raf = requestAnimationFrame(dnGoKhung);
    }
    function dnCham(n) {                            // dùi vừa chạm trống: đếm tiếng (bài thử đọc ở #dn[data-tung] = mọi tiếng, #dn[data-kieu] = "cạch,tùng"); hiện chữ "Cạch!" hay "Tùng!"
      var e, o;
      dnGoi.dem++; dnGoi[n.k]++;
      $("dn").setAttribute("data-tung", dnGoi.dem); $("dn").setAttribute("data-kieu", dnGoi.cach + "," + dnGoi.tung);
      if (n.k === "cach") {
        o = [[232, 26], [268, 48]][dnGoi.soC++ % 2];
        e = S("text", { "class": "dn-cach", x: o[0], y: o[1] }, $("dnChu"));
        e.textContent = "Cạch!";
      } else {
        e = S("text", { "class": "dn-tung", x: [70, 136, 202][dnGoi.so++ % 3], y: 30 }, $("dnChu"));
        e.textContent = "Tùng!";
      }
      dnGoi.chu.push({ e: e, t: n.t, y: +e.getAttribute("y") });
    }
    function dnGoKhung() {                          // vẽ một khung hình của cái trống đang gõ (requestAnimationFrame, chỉ chạy trong lúc gõ)
      var t = performance.now(), ds = dnGoi.ds, truoc = null, sau = null, i, g, q, a0, k, rung = 0, sang = 0, song = 0, tia = 0;
      for (i = 0; i < ds.length; i++) {
        if (ds[i].t <= t) { if (!ds[i].xong) { ds[i].xong = true; dnCham(ds[i]); } truoc = ds[i]; }
        else if (!sau) sau = ds[i];
      }
      function goc(n) { return n.k === "cach" ? DUI.vien : DUI.mat; }
      function len(tt) {                            // dùi nhấc về chỗ nghỉ sau tiếng gõ trước
        var q2;
        if (!truoc) return DUI.nghi;
        q2 = Math.max(0, Math.min(1, (tt - truoc.t) / DUI.len));
        return goc(truoc) + (DUI.nghi - goc(truoc)) * (1 - (1 - q2) * (1 - q2));
      }
      g = len(t);
      if (sau && t >= sau.t - DUI.xuong) { a0 = len(sau.t - DUI.xuong); q = (t - sau.t + DUI.xuong) / DUI.xuong; g = a0 + (goc(sau) - a0) * q * q; }      // vung tới cho tiếng sau
      $("dnDui").setAttribute("transform", "translate(270 165) rotate(" + g.toFixed(2) + ")");
      if (truoc) {
        k = t - truoc.t;
        if (truoc.k === "tung") { rung = 3.2 * truoc.m * Math.exp(-k / 60) * Math.sin(k / 9); sang = Math.max(0, 1 - k / 240) * truoc.m; song = Math.max(0, 1 - k / 450) * truoc.m; }
        else { rung = 1.2 * truoc.m * Math.exp(-k / 40) * Math.sin(k / 6); tia = Math.max(0, 1 - k / 220); }      // gõ viền: thân trống chỉ rung khẽ, tia lóe ở viền
      }
      $("dnThan").setAttribute("transform", "translate(" + rung.toFixed(2) + " 0)");
      $("dnSang").setAttribute("opacity", (0.6 * sang).toFixed(3));
      $("dnSong").setAttribute("opacity", song.toFixed(3));
      $("dnSong").setAttribute("transform", "translate(" + (-10 * (1 - song)).toFixed(2) + " 0)");
      $("dnTia").setAttribute("opacity", tia.toFixed(3));
      dnGoi.chu = dnGoi.chu.filter(function (c) {   // chữ "Cạch!", "Tùng!": hiện nhanh, trôi lên 10 px, mờ dần trong 0,9 giây
        var q3 = (t - c.t) / 900;
        if (q3 >= 1) { if (c.e.parentNode) c.e.parentNode.removeChild(c.e); return false; }
        c.e.setAttribute("opacity", Math.max(0, q3 < 0.12 ? q3 / 0.12 : 1 - (q3 - 0.12) / 0.88).toFixed(3));
        c.e.setAttribute("y", (c.y - 10 * Math.max(0, q3)).toFixed(1));
        return true;
      });
      if (sau || (truoc && t - truoc.t < 600) || dnGoi.chu.length) dnGoi.raf = requestAnimationFrame(dnGoKhung);
      else { dnGoi.raf = 0; dnGoi.ds = []; }
    }
    function dnDung() {                             // đồng hồ bị tắt (Tắt, Xóa hết) hay tự ẩn: dùi về chỗ nghỉ, bỏ chữ "Tùng!", tiếng trống dứt ngay
      dnGoi.ds = [];
      dnGoi.chu.forEach(function (c) { if (c.e.parentNode) c.e.parentNode.removeChild(c.e); });
      dnGoi.chu = [];
      amDung();
    }
    function dnDoiSo(chu) {                         // "14:59": 4 ô số, ô nào đổi thì số cũ trượt lên mờ dần, số mới trượt từ dưới vào
      var o = $("dnSo").querySelectorAll(".dn-o"), so = chu.replace(":", ""), cu = dnCu.chu.replace(":", ""), i;
      for (i = 0; i < 4; i++) (function (e, moi, truoc) {
        var b, c;
        if (moi === truoc && e.firstChild) return;
        c = e.querySelector("b:not(.ra)");
        b = document.createElement("b"); b.textContent = moi;
        if (c && truoc) { c.className = "ra"; b.className = "vao"; setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 340); }
        else while (e.firstChild) e.removeChild(e.firstChild);
        e.appendChild(b);
      })(o[i], so.charAt(i), cu.charAt(i));
    }
    function dnVe() {
      var e = $("dn"), st = dnTinh(dnV, T ? T.gio() : Date.now()), chu, mau, nho, p;
      dnHenT = 0;
      if (st && st.tt === "het" && st.qua >= DN_HET_GIU + DN_HET_TAN) {      // trống đã dứt (hoặc tivi mở trang lúc đã hết giờ từ lâu): đồng hồ biến mất, trả lại báo tường
        if (T && dnV && dnDaXoa !== dnV) { dnDaXoa = dnV; T.remove("dn"); }
        st = null;
      }
      if (!st) { if (dnCu.tt) dnDung(); e.hidden = true; e.classList.remove("tan"); dnCu = { tt: "", chu: "", mau: "", nho: null, p: -1 }; return; }
      if (e.hidden) e.hidden = false;
      if (st.tt === "chay" && dnCu.tt !== "chay" && dnCu.tt !== "dung" && (st.truoc > 0 || st.con > st.tong - 2500)) { dnDung(); dnGo("mo"); amBao("mo"); nhacTrong(); }     // vừa bấm bắt đầu: trống đánh (16/11 13:11 có âm báo; 17/11 00:57 thành tiếng trống; 18/11 đánh xong mới đếm)
      p = st.tt === "het" ? 1 : Math.max(0, Math.min(1, 1 - st.con / st.tong));
      if (dnCu.p < 0 || Math.abs(p - dnCu.p) >= 0.0004 || (p === 1 && dnCu.p !== 1)) { e.setAttribute("data-p", p.toFixed(4)); dnCu.p = p; }      // phần thời gian đã trôi (bài thử đọc ở #dn[data-p])
      chu = dnChu(st.con);
      if (chu !== dnCu.chu) { dnDoiSo(chu); dnCu.chu = chu; }
      mau = st.tt === "het" ? "" : st.con <= 60000 ? "mau-do" : st.con <= st.tong / 3 ? "mau-cam" : "";      // (tên lớp cũ) mau-cam = một phần ba cuối, mau-do = phút cuối
      nho = !$("nhiemVu").hidden || !$("dapSo").hidden || !$("caiDat").hidden || !$("gvMa").hidden ? "nho" : lon ? "nho theo-thiep" : "";      // có bảng che: góc trên trái của sân; chỉ có thiệp hiện to: theo báo tường
      if (st.tt !== dnCu.tt || mau !== dnCu.mau || nho !== dnCu.nho) {
        var doiTT = st.tt !== dnCu.tt;               // chỉ khi đồng hồ đổi trạng thái mới đặt lại chữ nút dự phòng (mở bảng Cài đặt làm đồng hồ thu nhỏ: không được xóa câu "Bấm lần nữa")
        e.className = "dn " + st.tt + (mau ? " " + mau : "") + (nho ? " " + nho : "");
        $("dnTrong").setAttribute("viewBox", nho ? "0 40 300 188" : "0 0 300 226");      // thu gọn: chỉ còn cái trống, bỏ chỗ chữ "Tùng!" phía trên
        $("dnNhan").textContent = st.tt === "dung" ? "Đang tạm dừng" : st.tt === "het" ? "Hết giờ" : "Thời gian còn lại";      // 18/11: hết giờ thì số vẫn hiện (00:00), chữ "Hết giờ" ở dòng trên
        if (st.tt === "het" && dnCu.tt === "chay") { nhacHetGio(); dnDung(); dnGo("het", DN_HET_CHO); amBao("het", DN_HET_CHO); }      // 16/11 10:44: "bài hát sẽ lặp đi lặp lại cho đến khi hết giờ"; 16/11 13:11: hết giờ có âm báo; 18/11: số về 00:00 rồi mới đánh trống
        dnCu.tt = st.tt; dnCu.mau = mau; dnCu.nho = nho;
        if (doiTT) {
          dnHoiTv = 0; $("nutDn").classList.remove("hoi");
          $("nutDn").textContent = st.tt === "chay" ? "Tạm dừng đồng hồ" : st.tt === "dung" ? "▶ Chạy tiếp đồng hồ" : "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
        }
      }
      e.classList.toggle("tan", st.tt === "het" && st.qua >= DN_HET_GIU);      // trống dứt: mờ dần
      dnHenT = setTimeout(dnVe, st.tt === "chay" ? 100 : st.tt === "het" ? 150 : 400);           // tạm dừng: chỉ còn theo dõi bảng nào đang che để thu gọn
    }
    function dnNhan(v) {
      dnV = v && typeof v === "object" ? v : null;
      if (dnHenT) { clearTimeout(dnHenT); dnHenT = 0; }
      $("nutDnTat").disabled = !dnV;
      if (!dnV) $("nutDn").textContent = "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
      dnVe();
    }
    $("nutDn").textContent = "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
    /* 16/11 22:08, thầy: "đồng hồ cả ở phím chạy tiếp và tắt đều cần xác nhận". Chạy tiếp (sau khi tạm dừng) và Tắt: bấm hai lần trong 3 giây mới làm. Bắt đầu và Tạm dừng thì bấm một lần. */
    var dnHoiTv = 0;
    $("nutDn").onclick = function () {
      var st = dnTinh(dnV, T ? T.gio() : Date.now()), b = $("nutDn");
      if (st && st.tt === "dung" && Date.now() - dnHoiTv > 3000) {
        dnHoiTv = Date.now(); b.textContent = "Bấm lần nữa để chạy tiếp"; b.classList.add("hoi");
        setTimeout(function () { if (dnHoiTv && Date.now() - dnHoiTv >= 2950) { dnHoiTv = 0; b.classList.remove("hoi"); b.textContent = "▶ Chạy tiếp đồng hồ"; } }, 3000);
        return;
      }
      dnHoiTv = 0; b.classList.remove("hoi");
      dnLenh(T, dnV, st && st.tt === "chay" ? "dung" : "chay"); $("caiDat").hidden = true;
    };
    hoiHaiLan($("nutDnTat"), "Bấm lần nữa để tắt", function () { dnLenh(T, dnV, "tat"); });
    $("dongNhiemVu").onclick = function () { hienNhiemVu(false); };
    (function dungNhiemVu() {                      // dựng bảng Nhiệm vụ từ NHIEM_VU; chưa có chữ thì không có nút
      var V = NHIEM_VU, than = $("nvThan"), cot;
      $("nutNhiemVu").hidden = !V;
      if (!V) return;
      $("nvTen").textContent = V.ten;
      $("nvPhu").textContent = V.phu || ""; $("nvPhu").hidden = !V.phu;
      cot = V.cot || [V.viec.map(function (v, i) { return i; }).filter(function (i) { return i < Math.ceil(V.viec.length / 2); }), V.viec.map(function (v, i) { return i; }).filter(function (i) { return i >= Math.ceil(V.viec.length / 2); })];
      cot.forEach(function (ds) {
        var c = H("div", "nv-cot", null, than);
        ds.forEach(function (i) {
          var v = V.viec[i], o = H("div", "nv-o", null, c), d = H("div", "nv-dau", null, o), ul;
          H("span", "nv-so", "Nhiệm vụ " + (i + 1), d);
          H("span", "nv-viec", v.ten, d);
          if (v.phut) H("span", "nv-phut", v.phut, d);
          ul = H("ul", "nv-dong", null, o);
          v.dong.forEach(function (ch) { H("li", null, ch, ul); });
        });
      });
      $("nvLuuY").textContent = V.luuY ? "Lưu ý: " + V.luuY : ""; $("nvLuuY").hidden = !V.luuY;
    })();
    function vuaNhiemVu() {                        // cho bảng vừa màn tivi, chữ to nhất có thể: thử cỡ chữ từ lớn xuống, mỗi cỡ chọn bề rộng hai cột sao cho bảng thấp nhất, dừng ở cỡ đầu tiên mà bảng cao không quá 1040
      var hop = document.querySelector("#nhiemVu .nv-hop"), than = $("nvThan"), s, tot, caoTot;
      if ($("nhiemVu").hidden || !NHIEM_VU) return;
      for (s = 1.14; s >= 0.7; s -= 0.02) {
        hop.style.setProperty("--nv", s.toFixed(2)); tot = 1; caoTot = 1e9;
        [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5].forEach(function (r) {
          than.style.gridTemplateColumns = "minmax(0, " + r + "fr) minmax(0, 1fr)";
          if (hop.offsetHeight < caoTot - 1) { caoTot = hop.offsetHeight; tot = r; }
        });
        than.style.gridTemplateColumns = "minmax(0, " + tot + "fr) minmax(0, 1fr)";
        if (caoTot <= 1040) break;
      }
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { vuaNhiemVu(); });
    $("dongCaiDat").onclick = function () { $("caiDat").hidden = true; };
    /* Mã QR riêng cho máy giáo viên. Bản 15/11 19:18 giấu sau nút "Mã cho máy giáo viên" (để học sinh khỏi quét).
       16/11 13:11, thầy: "Mã quét cho giáo viên trong cài đặt sẽ luôn hiện sẵn chứ không cần bấm mở lên". Từ đó mã nằm sẵn trong bảng Cài đặt (#maGVNho);
       chạm vào mã thì mở bảng riêng có mã to và link (#gvMa, như trước). Mã đổi (tivi nhận mã đã có của phòng) thì vẽ lại cả hai. */
    function veMaGV() {
      var l = linkGV(), the = "", q;
      if (window.qrcode) { q = window.qrcode(0, "M"); q.addData(l); q.make(); the = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
      ["maGV", "maGVNho"].forEach(function (id) { var o = $(id); if (the) o.innerHTML = the; else o.textContent = ""; o.setAttribute("data-link", l); });
      $("linkGV").textContent = l; $("chepGV").textContent = "Chép link";
    }
    veMaGV();
    $("nutMaGV").onclick = function () { veMaGV(); $("caiDat").hidden = true; $("gvMa").hidden = false; };
    $("dongGvMa").onclick = function () { $("gvMa").hidden = true; };
    $("chepGV").onclick = function () {
      var b = $("chepGV");
      try { navigator.clipboard.writeText(linkGV()).then(function () { b.textContent = "Đã chép link"; }, function () { b.textContent = "Không chép được"; }); } catch (e) { b.textContent = "Không chép được"; }
    };
    /* 16/11 10:02, thầy: "bổ sung thêm nút toàn màn hình kế nút cài đặt". Nút nằm bên phải nút bánh răng, ở giữa mép dưới báo tường; nút trong Cài đặt vẫn còn. */
    function toanManHinh() {
      var d = document;
      try { if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () {}); } catch (e) { /* bỏ qua */ }
    }
    function veToan() {
      var dang = !!document.fullscreenElement, b = $("nutToanNgoai"), chu = dang ? "Thoát toàn màn hình" : "Toàn màn hình";
      b.classList.toggle("dang", dang); b.setAttribute("aria-label", chu); b.title = chu;
      $("nutToan").textContent = chu;
    }
    $("nutToan").onclick = function () { $("caiDat").hidden = true; toanManHinh(); };
    $("nutToanNgoai").onclick = toanManHinh;
    document.addEventListener("fullscreenchange", veToan); veToan();
    hoiHaiLan($("nutMoHet"), "Bấm lần nữa", function () { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/mo"] = 1; }); T.update(o); });
    hoiHaiLan($("nutXoaHinh"), "Bấm lần nữa để xóa cả 4 hình", xoaHinh);
    hoiHaiLan($("nutLamLai"), "Bấm lần nữa để xóa hết", function () { lamLaiHet(); $("caiDat").hidden = true; });
    $("nutPhongMoi").onclick = function () {
      try { localStorage.setItem("xt-phong", maNgauNhien(5)); } catch (e) { /* bỏ qua */ }
      location.href = location.pathname + (thu ? "?thu=1" : "");
    };
    /* --- Đáp số: chỉ hiện khi thầy bấm --- */
    /* 16/11 10:02, thầy: "phần đáp số dấu x chuyển thành chấm, Tấm thiệp sửa thành diện tích tấm thiệp, Phần còn lại sửa thành diện tích phần còn lại của tấm thiệp".
       Dấu nhân viết bằng dấu chấm như sách giáo khoa (NHAN).
       16/11 13:11, thầy: "Hình thoi (mảnh nhỏ) sửa thành hình thoi (2 mảnh nhỏ) hình vuông và bình hành cũng sửa vậy. Đáp số tạo bảng cho dễ nhìn đi.
       Không ghi kiểu ngang vậy khó nhìn. Với lại cho màu nền khác". Từ đó Đáp số là một bảng 4 cột: Mảnh ghép | Diện tích một mảnh | Số mảnh | Diện tích;
       tổng 198 là tổng của cột cuối (bỏ dòng cộng ngang "36 + 9 . 2 + …"), rồi hai dòng Diện tích tấm thiệp và Diện tích phần còn lại của tấm thiệp. Nền bảng màu xanh nhạt.
       Tên có "(2 mảnh …)" chỉ dùng trong bảng này (TEN); trên điện thoại vẫn là MUC.ten kèm dòng "có 2 hình cùng diện tích". */
    (function dungDapSo() {
      var NHAN = " . ", TEN = { t2: "Hình thoi (2 mảnh nhỏ)", v: "Hình vuông (2 mảnh)", bh: "Hình bình hành (2 mảnh)" };
      function o(cha, lop, chu, gop) { var e = H("td", lop, chu, cha); if (gop) e.colSpan = gop; return e; }
      KHOA_MANH.forEach(function (kh) {
        var M = MUC[kh], m = M.manh, n = M.so.length, h = H("tr", "dap-hang", null, $("dapBang")), dt;
        h.setAttribute("data-kh", kh);
        svgManh(o(h, "dap-hinh"), m, "#ffe7ad", 10.5, 0.3);
        o(h, "dap-ten", TEN[kh] || M.ten);
        var tinh = m.loai === "thoi" ? m.a + NHAN + m.b + " : 2" : m.loai === "thang" ? "(" + m.L + " + " + m.l + ")" + NHAN + m.h + " : 2" : m.loai === "cn" ? m.w + NHAN + m.h : m.b + NHAN + m.h;
        o(h, "dap-tinh", tinh + " = " + M.dt);
        dt = o(h, "dap-dt");
        if (n > 1) H("span", "dap-nhan", M.dt + NHAN + n + " = ", dt);
        H("b", null, M.dt * n, dt);
      });
      /* 16/11 22:08, thầy: "phần đáp án hiện thêm công thức tính tổng diện tích 10 mảnh. bỏ cột số mảnh đi nhé. Đáp số viết hoa in đậm và cho ra giữa. bảng đáp số cho to lên nhé."
         Bảng còn 3 cột: Mảnh ghép | Diện tích một mảnh | Diện tích. Dòng tổng ghi phép cộng 7 số của cột cuối: 36 + 18 + 36 + 10 + 30 + 32 + 36 = 198.
         3 dòng cuối: tên (gộp 2 ô) rồi phép tính kèm kết quả in đậm (gộp 2 ô). */
      var cong = KHOA_MANH.map(function (kh) { return MUC[kh].dt * MUC[kh].so.length; }).join(" + ");
      [["tong", "Tổng diện tích 10 mảnh", cong, TONG], ["thiep", "Diện tích tấm thiệp", THIEP_D + NHAN + THIEP_R, THIEP_S],
        ["con", "Diện tích phần còn lại của tấm thiệp", THIEP_S + " − " + TONG, CON]].forEach(function (x) {
        var h = H("tr", "dap-hang rong " + x[0], null, $("dapCuoi")), c;
        o(h, "dap-ten", x[1], 2); c = o(h, "dap-dt dap-tong", null, 2);
        H("span", "dap-nhan", x[2] + " = ", c); H("b", null, x[3], c);
      });
    })();
    $("nutDapSo").onclick = function () { hienDapSo(true); };
    $("dongDapSo").onclick = function () { hienDapSo(false); };
    /* --- Chấm điểm (25/11; lời thầy, thang điểm và cách máy chấm tiêu chí 1: xem TIEU_CHI) ---
       Mỗi tấm thiệp đổi thành bảng chấm của nhóm đó (.bc, nằm trong .khung nên đúng chỗ, đúng cỡ tấm thiệp): tên nhóm, tổng điểm n/10, 4 hàng tiêu chí, mỗi hàng 3 số tròn để chạm.
       Giữa màn hình là nguyên bảng rubric (#rubric), che cả số 51 và băng rôn (thầy cho phép); dấu X ở góc phải đầu bảng tắt màn chấm, về báo tường.
       Mở bằng nút Chấm điểm trên máy giáo viên (lệnh "cham"); nút dự phòng nằm trong Cài đặt. Chạm một số là chấm, chạm số khác để đổi; điểm ghi lên máy chủ
       (<phòng>/diem) nên máy giáo viên đổi theo ngay, tải lại trang vẫn còn. Về báo tường và pháo hoa cũng tắt màn chấm.
       25/11 06:02, thầy: "ở mục chấm điểm thì ở 4 cái bảng nhóm sẽ có thêm nút ẩn. bấm vô thì ẩn đi để hiện ra cái thiệp để tôi nhìn tôi chấm, với lại khi tôi bấm mục chấm điểm
       thì ban đầu cả 4 bảng sẽ không có ô nào bị tô màu ngoại trừ mục 1 máy chấm và máy chấm thì không ghi máy chấm."
       → đầu mỗi bảng nhóm có nút Ẩn (bcAn<k>): bảng đó cất đi, lộ tấm thiệp; nút "Hiện bảng" (bcHien<k>) nằm ngay trên tấm thiệp, chạm vào tấm thiệp cũng hiện lại bảng.
         Mỗi lần mở màn chấm thì cả 4 bảng cùng hiện. chamO[k].an = bảng nhóm k đang ẩn; #tv[data-bang-an] = "0100" cho bài thử đọc.
       → mỗi lần BẤM Chấm điểm (trên máy giáo viên, hay nút dự phòng ở đây) lúc màn chấm chưa hiện là một lượt chấm mới: điểm chấm tay của lượt trước bị xóa,
         chỉ tiêu chí 1 có sẵn điểm máy chấm. Nhãn "máy chấm" / "chấm tay" ở hàng tiêu chí 1 đã bỏ. */
    var DIEM = {}, chamHien = false, chamO = {};
    (function dungCham() {
      var rb = $("rubric"), dau = H("div", "rb-dau", null, rb), x, cot;
      H("b", null, "Bảng rubric chấm điểm", dau); H("span", "rb-chip", "Thang " + DIEM_TOI_DA + " điểm", dau);
      x = H("button", "rb-x", null, dau); x.id = "dongCham"; x.type = "button"; x.setAttribute("aria-label", "Tắt bảng chấm điểm, về báo tường");
      x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#4a3524" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
      x.onclick = function () { hienCham(false); };
      cot = H("div", "rb-cot", null, rb);
      [["t", "Tốt"], ["d", "Đạt"], ["c", "Cần cố gắng"]].forEach(function (m) { H("span", "rb-l " + m[0], m[1], cot); });
      TIEU_CHI.forEach(function (tc, i) {
        var o = H("div", "rb-tc", null, rb), t = H("div", "rb-ten", null, o), m = H("div", "rb-muc", null, o);
        H("b", null, (i + 1) + ". " + tc.ten, t); H("span", null, "tối đa " + tc.so[0] + " điểm", t);
        if (tc.may) H("em", null, "Máy tự chấm", t);
        tc.muc.forEach(function (c, j) { var p = H("p", null, null, m); H("i", null, tc.so[j], p); p.appendChild(document.createTextNode(c)); });
      });
      [1, 2, 3, 4].forEach(function (k) {
        var bc = H("div", "bc", null, khungNhom[k].o), d2 = H("div", "bc-dau", null, bc), tg, an, X = { o: bc, so: [], an: false };
        bc.id = "bc" + k; bc.hidden = true;
        H("b", null, "Nhóm " + k, d2);
        an = H("button", "bc-an", "Ẩn", d2); an.id = "bcAn" + k; an.type = "button"; an.setAttribute("aria-label", "Ẩn bảng chấm của nhóm " + k + " để nhìn tấm thiệp");
        an.onclick = function () { chamAnBang(k, true); };
        tg = H("span", "bc-tong", null, d2); X.tong = H("span", null, "0", tg); H("small", null, "/" + DIEM_TOI_DA, tg);
        X.hien = H("button", "bc-hien", "Hiện bảng", khungNhom[k].o); X.hien.id = "bcHien" + k; X.hien.type = "button"; X.hien.hidden = true;
        X.hien.setAttribute("aria-label", "Hiện lại bảng chấm của nhóm " + k);
        X.hien.onclick = function () { chamAnBang(k, false); };
        TIEU_CHI.forEach(function (tc, i) {
          var h = H("div", "bc-hang" + (tc.may ? " may" : ""), null, bc), s;
          H("span", "bc-ten", (i + 1) + ". " + tc.ten, h); s = H("div", "bc-so", null, h);
          X.so.push(tc.so.map(function (v) {
            var b = H("button", null, v, s);
            b.type = "button"; b.setAttribute("aria-label", "Nhóm " + k + ", " + tc.ten + ": " + v + " điểm");
            b.onclick = function () { chamGhi(T, k, i, v, duLieu[k]); };
            return b;
          }));
        });
        chamO[k] = X;
      });
    })();
    function veCham() {
      [1, 2, 3, 4].forEach(function (k) {
        var X = chamO[k], r = diemNhom(DIEM, k, duLieu[k]);
        chu(X.tong, r.tong);
        TIEU_CHI.forEach(function (tc, i) { tc.so.forEach(function (v, j) { X.so[i][j].classList.toggle("chon", r.v[i] === v); }); });
        datTT(X.o, "data-diem", r.v.map(function (v) { return v === null ? "-" : v; }).join(""));      // bài thử đọc
      });
    }
    function chamVeAn() {                           // bảng nào thầy bấm Ẩn thì cất đi, lộ tấm thiệp, và nút "Hiện bảng" hiện ngay trên tấm thiệp đó
      var kq = "";
      [1, 2, 3, 4].forEach(function (k) { var X = chamO[k], an = chamHien && X.an; X.o.hidden = !chamHien || an; X.hien.hidden = !an; kq += an ? "1" : "0"; });
      datTT($("tv"), "data-bang-an", kq);         // bài thử đọc
    }
    function chamAnBang(k, an) { if (!chamHien) return; chamO[k].an = !!an; chamVeAn(); }
    function chamAn() {                             // cất màn chấm (hàm gọi tự báo cho máy giáo viên)
      if (!chamHien) return;
      chamHien = false;
      $("rubric").hidden = true; [1, 2, 3, 4].forEach(function (k) { chamO[k].an = false; }); chamVeAn();
      $("tv").classList.remove("dang-cham");
    }
    function hienCham(b) {
      if (!b) { chamAn(); bao3d(); return; }
      dongBang(); $("dapSo").hidden = true; $("nhiemVu").hidden = true;      // mỗi lúc chỉ một bảng
      if (lon) phong_to(lon);
      if (!chamHien) [1, 2, 3, 4].forEach(function (k) { chamO[k].an = false; });      // mỗi lần mở: cả 4 bảng cùng hiện
      chamHien = true; veCham();
      $("rubric").hidden = false; chamVeAn();
      $("tv").classList.add("dang-cham");
      bao3d();
    }
    $("nutCham").onclick = function () { if (!chamHien && T) T.remove("diem"); hienCham(true); };      // lượt chấm mới: bắt đầu từ bảng trắng (xem lời thầy 25/11 06:02 ở trên)

    /* 16/11 06:30: dòng này ẩn theo lời thầy. Chỉ hiện khi mất kết nối, hoặc nối quá 8 giây chưa được, để thầy biết tivi đang không nhận bài của các nhóm. */
    var henNoi = 0;
    function trangThai(kieu) {
      var e = $("tvNoi"), dangHien = e.classList.contains("hien");
      kieuNoi = kieu;
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử trên một máy" : kieu === "loi" ? "Mất kết nối" : kieu === "mat" ? "Mất mạng, đang nối lại…" : kieu === "lai" ? "Đang nối lại…" : "Đang nối…";
      if (kieu === "ok" || kieu === "cungmay") amTaiSau(1500);      // 18/11: nối xong mới tải tiếng trống
      clearTimeout(henNoi);
      if (kieu === "loi" || kieu === "lai") e.classList.add("hien");      // 25/11 07:25: bấm nút Nối lại thì dòng chữ hiện ngay
      else if (kieu === "mat" && dangHien) e.classList.add("hien");        // đang hiện chữ mà đổi sang "Mất mạng…": giữ, không chớp tắt
      else if (kieu === "ok" && dangHien) { e.classList.add("hien"); henNoi = setTimeout(function () { e.classList.remove("hien"); }, 2500); }      // nối lại được: hiện "Đã nối" 2,5 giây rồi cất
      else if (kieu !== "ok" && kieu !== "cungmay") henNoi = setTimeout(function () { e.classList.add("hien"); }, 8000);
    }
    var kieuNoi = "cho";
    nutNoiLai($("nutNoiLai"), function () { return T; }, function () { return kieuNoi; });
    $("tv").classList.add("xem-xep");
    veMa(); doiXem("vao");
    [1, 2, 3, 4].forEach(function (k) { veNhom(k, null); });
    noi(phong, thu, trangThai).then(function (t) {
      T = t;
      [1, 2, 3, 4].forEach(function (k) { T.on("n" + k, function (d) { veNhom(k, d); khungNhom[k].daNhan = true; }); });      // daNhan (26/11): đã vẽ dữ liệu lần đầu của nhóm, từ đây máy mới vào mới tính là "vừa kết nối"
      var daGhiGV = false;
      T.on("gv", function (v) {
        if (typeof v === "string" && /^[a-z0-9]{6}$/.test(v)) { if (v !== maGV) { maGV = v; try { localStorage.setItem("xt-gv", phong + ":" + maGV); } catch (e) { /* bỏ qua */ } veMaGV(); } }
        else if (!daGhiGV) { daGhiGV = true; T.set("gv", maGV); }
      });
      T.coMat("tv/" + layMayId());                // cho máy giáo viên biết tivi đang mở trang
      bao3d();
      T.on("nh", function (v) { NH = v && typeof v === "object" ? v : {}; [1, 2, 3, 4].forEach(veNh); });      // màn nhập của các nhóm (25/11 08:05)
      T.on("lenh", nhanLenh);
      T.on("dn", dnNhan);
      T.on("nhac", nhacNhan);
      T.on("diem", function (v) { DIEM = v && typeof v === "object" ? v : {}; veCham(); });
    });
  }

  /* ---------- máy giáo viên ----------
     Thầy dặn 15/11 19:18: "app của giáo viên sẽ hiện ra các nhóm sai từ 4 lần trở lên và nút mở khóa, phím Bước 2 bàn xếp cho từng nhóm. Phím tranh 3d."
     Link: ?p=<phòng>&gv=<mã giáo viên>, lấy ở tivi: Cài đặt → "Mã cho máy giáo viên". Trang này đọc n1..n4, gv, tv, tv3d và chỉ ghi:
       n<k>/khoa = null (Mở khóa);  n<k>/mo = 1 (Mở bước 2);  lenh = { i, v, k } (Tranh 3D, Dừng, Về báo tường, Pháo hoa, Chấm điểm: xem nhanLenh ở phần tivi);
       diem/n<k>/t<1..4> = điểm thầy chấm (25/11, xem TIEU_CHI).
     Khóa: máy học sinh khóa một mục sau mỗi 3 lần nhập sai (SAI_KHOA). Trang này hiện mục đang khóa kèm số lần đã sai. */
  function chayGiaoVien(ts) {
    document.body.className = "gv";
    $("gv").hidden = false;
    var phong = ts.p, thu = ts.thu, T = null, D = {}, tv = null, coTv = false, ma = "cho", O = {}, hoi = {};
    giuSang();
    function baoLoi(chu, nhe) {
      $("gvLoi").textContent = chu; $("gvLoi").hidden = !chu; $("gvLoi").classList.toggle("nhe", !!nhe);
      $("gvThan").hidden = !!chu;
    }
    if (!phong || !/^[a-z0-9]{3,12}$/.test(phong) || !ts.gv) {
      $("gvNoi").hidden = true; $("gvNoiLai").hidden = true;
      baoLoi("Link này thiếu mã phòng. Thầy quét lại mã ở tivi: Cài đặt, nút “Mã cho máy giáo viên”.");
      return;
    }
    function chay(k) { return coTv && !!tv && typeof tv.c === "string" && tv.c.charAt(k - 1) === "1"; }
    function daBam(k) { return coTv && !!tv && typeof tv.b === "string" && tv.b.charAt(k - 1) === "1"; }
    function lenh(v, k, n) { var L = { i: maNgauNhien(8), v: v, k: k || 0 }; if (n) L.n = String(n); if (T) T.set("lenh", L); }      // 27/11: n = các nhóm chạy Tranh 3D (lệnh "phao", "3dds")
    [1, 2, 3, 4].forEach(function (k) {
      var o = H("section", "gv-nhom", null, $("gvDs")), h, kh, n, X = { o: o };
      o.id = "gvNhom" + k;
      o.style.setProperty("--m", MAU_NHOM[k]);
      var hg = H("div", "gv-hang", null, o);          // 25/11 08:00 (bản gọn): tên nhóm + tình hình bên trái, 3 nút bên phải, chung một hàng
      h = H("div", "gv-hang1", null, hg);
      H("b", "gv-so", "Nhóm " + k, h);
      X.tt = H("span", "gv-tt", "", h);
      X.may = H("span", "gv-may", "", h);
      kh = H("div", "gv-khoa", null, o); kh.hidden = true;
      X.khoa = kh;
      X.khoaChu = H("span", "gv-khoa-chu", "", kh);
      X.moKhoa = H("button", "nut gv-mo-khoa", "Mở khóa", kh);
      n = H("div", "gv-nut", null, hg);
      X.b2 = H("button", "nut gv-b2", null, n);
      X.b2a = H("span", "gv-b2a gv-tren", "Mở ", X.b2); X.b2b = H("span", "gv-b2b gv-duoi2", "nhiệm vụ 2", X.b2);      // bản gọn: dòng trên chữ nhỏ (việc làm), dòng dưới chữ đậm
      X.b3 = H("button", "nut gv-3d", null, n);
      X.b3a = H("span", "gv-tren gv-3d-tren", "▶ ", X.b3); H("span", "gv-duoi2", "Tranh 3D", X.b3);      // chữ đọc ra vẫn là "▶ Tranh 3D" / "■ Dừng Tranh 3D" như trước
      X.xem = H("button", "nut gv-xem", "", n); H("span", "gv-tren", "Xem ĐT ", X.xem); H("span", "gv-duoi2", "nhóm " + k, X.xem);      // 16/11 10:02: mở màn hình của nhóm ngay trên máy giáo viên (chayDienThoai, có gv=<mã>). 16/11 13:11 thầy đổi tên nút: "Xem màn hình đổi thành Xem ĐT nhóm 1"
      X.xem.onclick = function () { location.href = location.pathname + "?p=" + encodeURIComponent(phong) + "&n=" + k + "&gv=" + encodeURIComponent(ts.gv) + (thu ? "&thu=1" : ""); };
      O[k] = X;
      X.moKhoa.onclick = function () { var u = {}; if (!T) return; u["n" + k + "/khoa"] = null; T.update(u); };
      X.b2.onclick = function () {
        var d = D[k] || {};
        if (!T) return;
        if (d.xong) {                               // 16/11 10:02: nhóm đã bấm Hoàn thành, chỉ giáo viên mở lại được. Bấm hai lần trong 3 giây (mở lại thì Tranh 3D của nhóm đó bị bỏ)
          if (Date.now() - (hoi[k] || 0) > 3000) { hoi[k] = Date.now(); ve(k); setTimeout(function () { ve(k); }, 3050); return; }
          hoi[k] = 0; T.remove("n" + k + "/xong"); return;
        }
        if (d.mo) return;
        if (demDung(d.d) < THU_TU.length && Date.now() - (hoi[k] || 0) > 3000) {      // nhóm chưa xong bước 1: bấm hai lần trong 3 giây mới mở, tránh chạm nhầm
          hoi[k] = Date.now(); ve(k); setTimeout(function () { ve(k); }, 3050); return;
        }
        hoi[k] = 0; T.set("n" + k + "/mo", 1);
      };
      X.b3.onclick = function () { if (!T || !(D[k] || {}).xong) return; lenh(chay(k) ? "dung" : "3d", k); };
    });
    /* 15/11 21:29: các nút của cột nút trên tivi dời sang đây. 4 nút cho tivi (nhiệm vụ, mã QR, đáp số, về báo tường) gửi lệnh; tivi báo lại trong tv3d. */
    function tt(ten) { return coTv && tv ? +tv[ten] || 0 : 0; }
    function hai(b, tren) { b.querySelector("span").textContent = tren; }
    $("gvNv").hidden = !NHIEM_VU;
    $("gvNv").onclick = function () { lenh("nv", tt("n") ? 0 : 1); };
    $("gvQr").onclick = function () { lenh("ma", tt("q") ? 0 : 1); };
    $("gvDap").onclick = function () { lenh("dap", tt("d") ? 0 : 1); };
    $("gvVe").onclick = function () { lenh("ve", 0); };
    /* 26/11 10:49, thầy: "có thêm một cái phần ở trong điện thoại của giáo viên á, có ghi là mã QR của học sinh mà nằm ở dưới cuối, để ví dụ học sinh mà lỡ cái bấm
       thoát ra khỏi cái phần điện thoại á, thì sẽ có thể dùng mã QR đó để vô lại. Có nghĩa là tôi đưa điện thoại cho học sinh quét, chứ không nhất thiết là phải
       bấm lại cái phần ẩn hiện QR nữa". Cùng một link với 4 mã trên tivi (?p=<phòng>&n=0): em quét xong thì màn chọn nhóm chọn sẵn nhóm cũ của máy đó. Mã nằm sẵn, không phải bấm gì. */
    (function () {
      var l = location.origin + location.pathname + "?p=" + phong + "&n=0" + (thu ? "&thu=1" : ""), o = $("gvMaHsHinh"), q;
      if (window.qrcode) { q = window.qrcode(0, "M"); q.addData(l); q.make(); o.innerHTML = q.createSvgTag({ cellSize: 4, margin: 4, scalable: true }); }
      else o.textContent = l;
      o.setAttribute("data-link", l);
    })();
    bamHaiLan($("gvMoHet"), "Bấm lần nữa để mở cho cả 4 nhóm", function () { var o = {}; if (!T) return; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/mo"] = 1; }); T.update(o); });
    bamHaiLan($("gvXoaHinh"), "Bấm lần nữa để xóa cả 4 hình", function () { var o = {}; if (!T) return; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/m"] = null; o["n" + k + "/xong"] = null; }); T.update(o); });
    bamHaiLan($("gvLamLai"), "Bấm lần nữa để xóa hết", function () { var o = { dn: null, diem: null }; if (!T) return; [1, 2, 3, 4].forEach(function (k) { ["m", "xong", "d", "s", "mo", "khoa", "h1"].forEach(function (d) { o["n" + k + "/" + d] = null; }); }); T.update(o); });
    $("gvCdMo").onclick = function () { $("gvCd").hidden = !$("gvCd").hidden; $("gvCdMo").classList.toggle("dang-mo", !$("gvCd").hidden); };
    /* 16/11 10:02: "có nút tắt nhạc hiện trên app của giáo viên". 16/11 10:44: "có nút bật tắt nhạc ... tăng giảm âm lượng nữa ... trong cả điện thoại của giáo viên.
       tôi bấm bật mới bật nhạc". Máy này ghi <phòng>/nhac = { b: 1 là bật, a: mức âm lượng 1..10 }; tivi báo nhạc đang thế nào trong tv3d.m (xem phần nhạc của tivi). */
    var nhacBat = false, nhacAm = 10;
    function veNhacGV() {
      var m = coTv && tv ? +tv.m || 0 : -1;
      var chu = !coTv ? "Nhạc: tivi chưa mở" : !nhacBat ? "Nhạc: đang tắt" : m === 2 ? "Nhạc: thầy chạm một lần vào màn hình tivi" : m === 4 ? "Nhạc: tivi không mở được bài hát" : m === 1 ? "Nhạc: đang phát" : "Nhạc: đang bật";
      $("gvNhacChu").innerHTML = "";
      H("span", null, chu + " ", $("gvNhacChu")); H("i", null, nhacAm + "/10", $("gvNhacChu")).title = "Âm lượng " + nhacAm + "/10";      // bản gọn 25/11: chữ bên trái, mức âm lượng bên phải, chung một dòng
      $("gvNhacNut").textContent = nhacBat ? "Tắt nhạc" : "▶ Bật nhạc"; $("gvNhacNut").classList.toggle("bat", nhacBat);
      $("gvNhac").className = "gv-dn gv-nhac" + (!nhacBat ? " tat" : m === 1 ? " chay" : m === 2 || m === 4 ? " het" : "");
      $("gvNhacNut").disabled = !T || !coTv; $("gvNhacNho").disabled = !T || nhacAm <= 1; $("gvNhacTo").disabled = !T || nhacAm >= 10;
    }
    function ghiNhacGV(bat, am) { if (T) T.set("nhac", { b: bat ? 1 : 0, a: Math.max(1, Math.min(10, am)) }); }
    $("gvNhacNut").onclick = function () { ghiNhacGV(!nhacBat, nhacAm); };
    $("gvNhacNho").onclick = function () { ghiNhacGV(nhacBat, nhacAm - 1); };
    $("gvNhacTo").onclick = function () { ghiNhacGV(nhacBat, nhacAm + 1); };
    /* 15/11 22:12: hàng đếm ngược. Máy này ghi thẳng <phòng>/dn; tivi và máy này cùng tính giờ còn lại theo giờ máy chủ. */
    /* 16/11 22:08, thầy: "những ô trên điện thoại giáo viên như bắt đầu, bật nhạc thì khi đang mở hiện màu xanh, còn tắt thì hiện màu bình thường" → nút nào đang bật thì có lớp "bat" (nền xanh lá, chữ trắng):
       đồng hồ đang chạy, nhạc đang bật, bảng nhiệm vụ / mã QR / đáp số đang hiện trên tivi, Tranh 3D đang chạy.
       "đồng hồ cả ở phím chạy tiếp và tắt đều cần xác nhận" → Chạy tiếp và Tắt (kể cả Tắt lúc đã hết giờ): bấm hai lần trong 3 giây. */
    var dn = null, dnHoi = 0, dnHoiC = 0, dnDong = 0;
    function veDn() {
      var st = dnTinh(dn, T ? T.gio() : Date.now()), tt = st ? st.tt : "", dangHoi = Date.now() - dnHoi <= 3000, hoiChay = tt === "dung" && Date.now() - dnHoiC <= 3000;
      $("gvDnChu").innerHTML = "";
      if (!st) { dnHoi = 0; dnHoiC = 0; }           // đồng hồ đã tắt (kể cả khi tivi tự cất sau hồi trống hết giờ, 16/11 23:48): bỏ câu hỏi lại đang dở, lần sau vẫn phải bấm đủ hai lần
      if (!st) H("span", null, "Đếm ngược " + DEM_NGUOC_PHUT + " phút", $("gvDnChu"));
      else if (tt === "het") H("b", "het", "Hết giờ", $("gvDnChu"));
      else { H("span", null, tt === "dung" ? "Dừng ở " : "Còn ", $("gvDnChu")); H("b", null, dnChu(st.con), $("gvDnChu")); }
      $("gvDn").className = "gv-dn" + (tt ? " " + tt : "");
      $("gvDnChay").hidden = tt === "het";
      $("gvDnChay").textContent = tt === "chay" ? "Tạm dừng" : tt === "dung" ? (hoiChay ? "Bấm lần nữa" : "▶ Chạy tiếp") : "▶ Bắt đầu";
      $("gvDnChay").classList.toggle("hoi", hoiChay); $("gvDnChay").classList.toggle("bat", tt === "chay");
      $("gvDnChay").disabled = !coTv && tt !== "chay";
      $("gvDnTat").hidden = !st;
      $("gvDnTat").textContent = dangHoi && st ? "Bấm lần nữa" : tt === "het" ? "Tắt đồng hồ" : "Tắt";
      $("gvDnTat").classList.toggle("hoi", dangHoi && !!st);
      if (tt === "chay" && !dnDong) dnDong = setInterval(veDn, 250);
      if (tt !== "chay" && dnDong) { clearInterval(dnDong); dnDong = 0; }
    }
    $("gvDnChay").onclick = function () {
      var st = dnTinh(dn, T ? T.gio() : Date.now());
      if (st && st.tt === "dung" && Date.now() - dnHoiC > 3000) { dnHoiC = Date.now(); veDn(); setTimeout(veDn, 3050); return; }      // đang tạm dừng: bấm hai lần mới chạy tiếp
      dnHoiC = 0; dnLenh(T, dn, st && st.tt === "chay" ? "dung" : "chay");
    };
    $("gvDnTat").onclick = function () {
      var st = dnTinh(dn, T ? T.gio() : Date.now());
      if (!st) return;
      if (Date.now() - dnHoi > 3000) { dnHoi = Date.now(); veDn(); setTimeout(veDn, 3050); return; }     // lúc nào cũng bấm hai lần mới tắt (16/11 22:08)
      dnHoi = 0; dnLenh(T, dn, "tat");
    };
    /* 25/11 01:31, thầy: "pháo hoa là phím do tôi chọn. nó sẽ bị ẩn trên đt, khi nào xong hết 4 bức thì hiện ra để tôi bấm. khi nào cả 4 nhóm hoàn thành, thì màn hình điện thoại
       sẽ hiện ra câu hỏi Hiện pháo hoa rồi cho chọn có hoặc không." Đủ 4 nhóm bấm Hoàn thành: hàng "Cả 4 nhóm đã hoàn thành" (#gvPhao) hiện ra và câu hỏi "Hiện pháo hoa?"
       (#gvPhaoHoi) tự hiện. Có → gửi lệnh "phao" cho tivi; Không → không bắn. Trả lời rồi thì câu hỏi cất đi; nút "Pháo hoa" trên hàng đó gọi lại câu hỏi (bắn sau, hay bắn lần nữa).
       Có nhóm được cho sửa lại hình (không còn đủ 4): hàng và câu hỏi ẩn; đủ 4 nhóm lần nữa thì câu hỏi tự hiện lại.
       phaoTL = thầy đã trả lời cho lần đủ 4 nhóm này; nhớ trong sessionStorage (sang "Xem ĐT nhóm" rồi quay về không bị hỏi lại). phaoCo[k] = đã nhận dữ liệu nhóm k
       (chưa nhận đủ 4 nhóm thì chưa biết gì, không ẩn không hiện). Tivi báo tv3d.p = 1 khi pháo đang bắn.
       25/11 06:02, thầy: "bỏ cái pháo hoa đi nhé" → gỡ. 25/11 11:10, thầy: "bổ sung lại pháo hoa đi" → trở lại như cũ; trên máy giáo viên bản gọn (08:00)
       hàng #gvPhao nằm ngay trên hàng 5 ô, chỉ hiện khi đủ 4 nhóm hoàn thành. */
    var phaoCo = {}, phaoHoi = false, phaoKhoa = "xt-phao-" + phong, phaoTL = false;
    try { phaoTL = sessionStorage.getItem(phaoKhoa) === "1"; } catch (e0) { /* bỏ qua */ }
    function phaoNho(b) { phaoTL = b; try { if (b) sessionStorage.setItem(phaoKhoa, "1"); else sessionStorage.removeItem(phaoKhoa); } catch (e) { /* bỏ qua */ } }
    /* 27/11 08:37, thầy: "Khi nhóm cuối cùng hoàn thiện tấm thiệp thì hỏi về pháo hoa đó thì thi tôi bấm có hoặc không thì đều sẽ hiện tranh 3d cho nhóm cuối đó,
       không cần tôi chọn tranh 3d." nhomCuoi = nhóm bấm Hoàn thành sau cùng mà máy này thấy (nhớ trong sessionStorage như phaoTL; nhóm được cho sửa lại hình
       rồi hoàn thành lần nữa thì nhóm đó là nhóm sau cùng). Máy này mở trang sau lúc đó (không biết nhóm nào xong sau cùng) thì lấy các nhóm đã hoàn thành
       mà tivi chưa chạy Tranh 3D lần nào. Nhóm đang chạy Tranh 3D thì để yên. Có: lệnh "phao" kèm n = các nhóm đó (tivi bắn pháo và chạy Tranh 3D cùng lúc);
       Không: lệnh "3dds" kèm n. */
    var xongCu = {}, cuoiKhoa = "xt-cuoi-" + phong, nhomCuoi = 0;
    try { nhomCuoi = +sessionStorage.getItem(cuoiKhoa) || 0; } catch (e1) { /* bỏ qua */ }
    function thayXong(k) {                          // gọi mỗi lần nhận dữ liệu nhóm k, trước khi đặt phaoCo[k] (lần nhận đầu là lúc mở trang: chưa tính)
      var x = !!(D[k] || {}).xong;
      if (phaoCo[k] && x && !xongCu[k]) { nhomCuoi = k; try { sessionStorage.setItem(cuoiKhoa, String(k)); } catch (e) { /* bỏ qua */ } }
      xongCu[k] = x;
    }
    function ds3dCuoi() {                           // các nhóm sẽ tự chạy Tranh 3D khi thầy trả lời câu hỏi pháo hoa: "4", có khi "23"; "" là không có nhóm nào
      var ds = "";
      if (nhomCuoi >= 1 && nhomCuoi <= 4 && (D[nhomCuoi] || {}).xong) ds = String(nhomCuoi);
      else [1, 2, 3, 4].forEach(function (k) { if ((D[k] || {}).xong && !daBam(k)) ds += k; });
      return ds.split("").filter(function (s) { return !chay(+s); }).join("");
    }
    function vePhaoGV() {
      var du, ban = tt("p") === 1, bd = tt("bd") === 1, coBtd = tt("bc") > 0 || tt("ba") > 0, ds3;
      if (![1, 2, 3, 4].every(function (k) { return phaoCo[k]; })) return;
      du = [1, 2, 3, 4].every(function (k) { return !!(D[k] || {}).xong; });
      if (!du) { phaoHoi = false; if (phaoTL) phaoNho(false); }
      else if (!phaoTL) phaoHoi = true;
      $("gvPhao").hidden = !du;
      $("gvPhaoHoi").hidden = !(du && phaoHoi);
      $("gvPhaoNut").textContent = ban ? "Đang bắn…" : "Pháo hoa";
      $("gvPhaoNut").classList.toggle("bat", ban);
      $("gvPhaoNut").disabled = !coTv || ban || bd;
      $("gvPhaoCo").disabled = !T || !coTv;
      ds3 = du && phaoHoi && coTv ? ds3dCuoi() : "";
      $("gvPhaoPhu").textContent = coTv ? "Cả 4 nhóm đã hoàn thành." + (ds3 ? " Chọn Có hay Không thì Tranh 3D của nhóm " + ds3.split("").join(", nhóm ") + " cũng tự chạy." : "")
        : "Tivi chưa mở trang Xếp thiệp nên chưa bắn được.";
      /* 27/11 08:37: hàng Báo tường động hiện khi cả 4 nhóm đã hoàn thành, thầy đã trả lời câu hỏi pháo hoa và pháo không còn đang bắn; đang chạy thì luôn hiện để thầy dừng */
      $("gvBtd").hidden = !((du && phaoTL && !phaoHoi && !ban) || bd);
      $("gvBtdNut").textContent = bd ? "■ Dừng" : "Báo tường động";
      $("gvBtdNut").classList.toggle("bat", bd);
      $("gvBtdNut").disabled = !T || !coTv || (!bd && !coBtd);
      $("gvBtdChu").textContent = !coTv ? "Tivi chưa mở trang Xếp thiệp." : bd ? "Tivi đang chạy Báo tường động." : coBtd ? "Tivi có " + tt("bc") + " ảnh thầy cô, " + tt("ba") + " ảnh hoạt động"
        + (tt("bn") ? " và bài hát." : ", chưa có bài hát.") : "Tivi chưa có ảnh: thầy vào Cài đặt trên tivi, chọn tệp Báo tường động.";
    }
    $("gvPhaoNut").onclick = function () { phaoHoi = true; vePhaoGV(); };
    $("gvPhaoCo").onclick = function () { var ds; if (!T || !coTv) return; ds = ds3dCuoi(); phaoHoi = false; phaoNho(true); lenh("phao", 1, ds); vePhaoGV(); };
    $("gvPhaoKhong").onclick = function () { var ds = coTv ? ds3dCuoi() : ""; phaoHoi = false; phaoNho(true); if (ds && T) lenh("3dds", 0, ds); vePhaoGV(); };
    $("gvBtdNut").onclick = function () { if (!T || !coTv) return; lenh("btd", tt("bd") === 1 ? 0 : 1); };
    /* 25/11: màn Chấm điểm trên máy giáo viên (lời thầy, thang điểm, cách máy chấm tiêu chí 1: xem TIEU_CHI).
       Hàng "Bảng chấm điểm 4 nhóm" có nút Chấm điểm: mở màn chấm trên máy này (#gvChamMan, che cả máy) và gửi lệnh "cham" cho tivi hiện bảng chấm.
       Dấu X: tắt màn chấm ở cả hai nơi, tivi về báo tường. Tivi tắt bảng chấm (dấu X trên tivi, Về báo tường, pháo hoa) thì máy này tắt theo:
       chamG = tv3d.g lần trước (−1: chưa biết); thấy g từ 1 về 0 là tivi vừa tắt. 1,5 giây đầu sau khi bấm Chấm điểm thì không xét (lệnh tắt cũ có thể về muộn).
       Tivi không mở trang, hay tivi không chạm được, thì vẫn chấm được ở đây: điểm ghi thẳng lên máy chủ (<phòng>/diem).
       "Các nhóm đạt điểm tối đa": mức Tốt cho tiêu chí 2, 3, 4 của cả 4 nhóm; tiêu chí 1 vẫn do máy chấm (thầy chạm đổi được). */
    var DIEM = {}, chamMo = false, chamG = -1, chamLuc = 0, chamGV = {};
    [1, 2, 3, 4].forEach(function (k) {
      var o = H("section", "gv-cm-nhom", null, $("gvChamDs")), h = H("div", "gv-cm-h", null, o), tg, X = { o: o, so: [] };
      o.id = "gvChamNhom" + k; o.style.setProperty("--m", MAU_NHOM[k]);
      H("b", null, "Nhóm " + k, h); tg = H("span", null, null, h); X.tong = H("i", null, "0", tg); H("small", null, "/" + DIEM_TOI_DA + " điểm", tg);
      TIEU_CHI.forEach(function (tc, i) {
        var hg = H("div", "gv-cm-hang", null, o), s;
        H("span", "gv-cm-ten", (i + 1) + ". " + tc.ten, hg); s = H("div", "gv-cm-so", null, hg);
        X.so.push(tc.so.map(function (v) {
          var b = H("button", null, v, s);
          b.type = "button"; b.setAttribute("aria-label", "Nhóm " + k + ", " + tc.ten + ": " + v + " điểm");
          b.onclick = function () { chamGhi(T, k, i, v, D[k]); };
          return b;
        }));
      });
      chamGV[k] = X;
    });
    function veChamGV() {
      var g = coTv && tv ? +tv.g || 0 : -1;
      if (chamMo && chamG === 1 && g === 0 && Date.now() - chamLuc > 1500) chamMo = false;
      chamG = g;
      $("gvChamMan").hidden = !chamMo;
      $("gvChamNut").classList.toggle("bat", g === 1);
      $("gvChamTom").textContent = g === 1 ? "Tivi đang hiện bảng chấm điểm. Bấm dấu X để tắt, tivi về báo tường."
        : coTv ? "Tivi chưa hiện bảng chấm điểm. Thầy vẫn chấm được ở đây." : "Tivi chưa mở trang Xếp thiệp. Thầy vẫn chấm được ở đây, điểm được lưu lại.";
      $("gvChamTom").classList.toggle("xau", g !== 1);
      [1, 2, 3, 4].forEach(function (k) {
        var X = chamGV[k], r = diemNhom(DIEM, k, D[k]);
        X.tong.textContent = r.tong;
        TIEU_CHI.forEach(function (tc, i) { tc.so.forEach(function (v, j) { X.so[i][j].classList.toggle("chon", r.v[i] === v); }); });
        X.o.setAttribute("data-diem", r.v.map(function (v) { return v === null ? "-" : v; }).join(""));      // bài thử đọc
      });
    }
    /* 25/11 06:02, thầy: "khi tôi bấm mục chấm điểm thì ban đầu cả 4 bảng sẽ không có ô nào bị tô màu ngoại trừ mục 1 máy chấm" → bấm Chấm điểm lúc tivi chưa hiện
       bảng chấm là một lượt chấm mới: xóa điểm chấm tay của lượt trước (tiêu chí 1 về điểm máy chấm). Tivi đang hiện bảng chấm (máy này vừa tải lại trang) thì giữ nguyên điểm. */
    $("gvChamNut").onclick = function () {
      if (T && !(coTv && tv && +tv.g === 1)) T.remove("diem");
      chamMo = true; chamLuc = Date.now(); lenh("cham", 1); veChamGV(); $("gvChamMan").scrollTop = 0;
    };
    $("gvChamX").onclick = function () { chamMo = false; lenh("cham", 0); veChamGV(); };
    $("gvChamMax").onclick = function () {
      var o = {};
      if (!T) return;
      [1, 2, 3, 4].forEach(function (k) { TIEU_CHI.forEach(function (tc, i) { if (!tc.may) o["diem/n" + k + "/t" + (i + 1)] = tc.so[0]; }); });
      T.update(o);
    };
    bamHaiLan($("gvChamXoa"), "Bấm lần nữa để xóa điểm đã chấm", function () { if (T) T.remove("diem"); });
    function ve(k) {
      var d = D[k] || {}, nhap = d.d || {}, s = d.s || {}, kh3 = d.khoa || {}, X = O[k];
      var pha = d.xong ? "xong" : d.mo ? "xep" : "nhap", nd = demDung(nhap), may = d.co ? Object.keys(d.co).length : 0;
      var ds = pha === "xong" ? [] : THU_TU.filter(function (kh) { return kh3[kh] && !nhap[kh]; });
      var choMo = pha === "nhap" && nd === THU_TU.length, hoiGan = Date.now() - (hoi[k] || 0) <= 3000, dangHoi = pha === "nhap" && !choMo && hoiGan, hoiSua = pha === "xong" && hoiGan, c3 = !!d.xong && chay(k);
      X.o.classList.toggle("bi-khoa", ds.length > 0); X.o.classList.toggle("cho-mo", choMo);
      /* bản gọn 25/11: tình hình nằm trong cột hẹp bên trái. Dấu | là chỗ được xuống dòng (mỗi đoạn không bị ngắt giữa chừng), chữ đọc ra vẫn liền như trước */
      X.tt.textContent = "";
      (pha === "xong" ? "Đã hoàn thành| hình" : pha === "xep" ? "Nhiệm vụ 2:| đang xếp hình" : choMo ? "Xong nhiệm vụ 1,| chờ mở" : nd || may ? "Nhiệm vụ 1:| đúng " + nd + "/10" : "Chưa có máy| nào vào").split("|").forEach(function (doan) {
        if (doan.charAt(0) === " ") { X.tt.appendChild(document.createTextNode(" ")); doan = doan.slice(1); }
        H("span", null, doan, X.tt);
      });
      X.may.textContent = may ? may + " máy" : "";
      X.khoa.hidden = !ds.length;
      X.khoaChu.textContent = "Đã khóa: " + ds.map(function (kh) { return MUC[kh].ngan + " (sai " + (s[kh] || SAI_KHOA) + " lần)"; }).join(", ");
      X.b2.disabled = pha === "xep";
      X.b2a.textContent = pha === "xong" ? (hoiSua ? "Bấm lần nữa " : "Cho sửa ") : pha === "xep" ? "Đã mở " : dangHoi ? "Bấm lần nữa " : "Mở ";
      X.b2b.textContent = pha === "xong" ? (hoiSua ? "để sửa hình" : "lại hình") : pha === "xep" ? "nhiệm vụ 2" : dangHoi ? "để mở sớm" : "nhiệm vụ 2";
      X.b2.classList.toggle("san", choMo); X.b2.classList.toggle("hoi", dangHoi || hoiSua); X.b2.classList.toggle("bat", pha === "xep");      // nhiệm vụ 2 đang mở: nút xanh
      X.b3.disabled = !d.xong;
      X.b3a.textContent = c3 ? "■ Dừng " : "▶ ";
      X.b3.classList.toggle("dang-chay", c3); X.b3.classList.toggle("bat", c3);
      return ds.length > 0;
    }
    function veHet() {
      var chu = ma === "dung" ? "" : ma === "cho" ? "Đang nối với tivi…"
        : ma === "chua" ? "Chưa thấy tivi của phòng này. Thầy mở trang Xếp thiệp trên tivi trước, rồi quét lại mã ở Cài đặt, nút “Mã cho máy giáo viên”."
        : "Mã này không còn dùng được. Thầy quét lại mã ở tivi: Cài đặt, nút “Mã cho máy giáo viên”.";
      var dsK = [], l, n = 0, q = tt("q"), d = tt("d"), nv = tt("n"), g = tt("g"), conNhap = false;
      baoLoi(chu, ma === "cho");
      if (chu) return;
      [1, 2, 3, 4].forEach(function (k) { if (ve(k)) dsK.push(k); if (daBam(k)) n++; if (!(D[k] || {}).mo && !(D[k] || {}).xong) conNhap = true; });
      $("gvTom").textContent = dsK.length ? "Đang bị khóa: nhóm " + dsK.join(", nhóm ") : "Chưa có nhóm nào bị khóa";
      $("gvTom").classList.toggle("xau", dsK.length > 0);
      l = tt("l");
      $("gvTv").textContent = !coTv ? "Tivi chưa mở trang Xếp thiệp nên các nút cho tivi chưa có tác dụng." : "Tivi đang hiện " + (nv ? "bảng nhiệm vụ" : d ? "bảng đáp số" : g ? "bảng chấm điểm" : l ? "to thiệp nhóm " + l : "báo tường") + ". Tranh 3D: " + n + "/4 nhóm.";
      $("gvTv").classList.toggle("xau", !coTv);
      $("gvAm").hidden = !(coTv && tv && tv.a === 0);      // 16/11 13:11: tivi chưa được chạm lần nào thì trình duyệt chưa cho phát tiếng (âm báo đồng hồ, nhạc)
      hai($("gvNv"), nv ? "Ẩn" : "Hiện"); $("gvNv").classList.toggle("dang-hien", !!nv); $("gvNv").classList.toggle("bat", !!nv);
      hai($("gvQr"), q ? "Ẩn" : "Hiện"); $("gvQr").classList.toggle("dang-hien", !!q); $("gvQr").classList.toggle("bat", !!q);
      hai($("gvDap"), d ? "Ẩn" : "Hiện"); $("gvDap").classList.toggle("dang-hien", !!d); $("gvDap").classList.toggle("bat", !!d);
      $("gvVe").disabled = !(l || d || nv || g);
      if (!$("gvMoHet").classList.contains("hoi")) $("gvMoHet").disabled = !conNhap;
      veDn(); veNhacGV(); vePhaoGV(); veChamGV();
    }
    veHet();
    var kieuNoiGV = "cho";
    nutNoiLai($("gvNoiLai"), function () { return T; }, function () { return kieuNoiGV; });
    noi(phong, thu, function (kieu) {
      var e = $("gvNoi");
      kieuNoiGV = kieu;
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử" : kieu === "loi" ? "Mất kết nối" : kieu === "mat" ? "Mất mạng, đang nối lại…" : kieu === "lai" ? "Đang nối lại…" : "Đang nối…";
    }).then(function (t) {
      T = t;
      T.on("gv", function (v) { ma = v === null || v === undefined ? "chua" : String(v) === String(ts.gv) ? "dung" : "sai"; veHet(); });
      /* 21/11: máy giáo viên không hiện vị trí mảnh (chỉ hiện số mục đúng, số máy, khóa, đã mở, đã xong). Trước đây mỗi lần một mảnh của bất kì nhóm nào nhích,
         máy này vẽ lại hết cả trang (cả lớp cùng kéo: hơn 400 lần một giây). Bây giờ chỉ vẽ lại khi phần dữ liệu ngoài vị trí mảnh đổi. */
      var kyNhom = {};
      [1, 2, 3, 4].forEach(function (k) { T.on("n" + k, function (d) { var ky; D[k] = d || {}; thayXong(k); phaoCo[k] = true; ky = kyNgoaiManh(D[k]); if (ky === kyNhom[k]) return; kyNhom[k] = ky; veHet(); }); });
      T.on("tv3d", function (v) { tv = v && typeof v === "object" ? v : null; veHet(); });
      T.on("tv", function (v) { coTv = !!v && typeof v === "object" && Object.keys(v).length > 0; veHet(); });
      T.on("dn", function (v) { dn = v && typeof v === "object" ? v : null; veDn(); });
      T.on("diem", function (v) { DIEM = v && typeof v === "object" ? v : {}; veChamGV(); });
      T.on("nhac", function (v) { nhacBat = !!v && typeof v === "object" && v.b === 1; nhacAm = v && typeof v === "object" && v.a >= 1 && v.a <= 10 ? Math.round(v.a) : 5; veNhacGV(); });
    });
  }

  /* cho bài thử gọi các hàm hình học */
  window.XT = { BO: BO, MUC: MUC, THU_TU: THU_TU, TONG: TONG, CON: CON, kiemMuc: kiemMuc, daGiac: daGiac, toaDo: toaDo, doLun: doLun, dayVec: dayVec, kcDaGiac: kcDaGiac, cachChinh: cachChinh, canChinh: canChinh, vaoGiua: vaoGiua, giuTrong: giuTrong, vaoLuoi: vaoLuoi, trongTam: trongTam, BOCUC: BOCUC, NHOM: NHOM, NHE: NHE, viTriDau: viTriDau, duChung: duChung, nacXoay: nacXoay, nacKe: nacKe, nacGan: nacGan, MAU_DAU: MAU_DAU, GOC_MAU: GOC_MAU, THIEP: THIEP, TL_MANH: TL_MANH, cuaSo: cuaSo, mauXep: mauXep, luoiGoc: luoiGoc, giongMau: giongMau, dtGiao: dtGiao, MOC_GIONG: MOC_GIONG, MOC_GIONG_CON: MOC_GIONG_CON, HINH_CON: HINH_CON, HINH: HINH, kcDaGiacDiem: kcDiem, mo: mo, goi: goi, TIEU_CHI: TIEU_CHI, diemMay: diemMay, diemNhom: diemNhom, dat: function (o) { if (o.de !== undefined) NHE.de = o.de; if (o.xaTach !== undefined) XA_TACH = o.xaTach; } };

  function batDau() {
    var ts = thamSo();
    var n = parseInt(ts.n, 10);
    if (ts.gv !== undefined && n >= 1 && n <= 4) chayDienThoai(ts);      // máy giáo viên xem màn hình của một nhóm
    else if (ts.gv !== undefined) chayGiaoVien(ts); else if (ts.n !== undefined || ts.dt !== undefined) chayDienThoai(ts); else chayTivi(ts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", batDau); else batDau();
})();
