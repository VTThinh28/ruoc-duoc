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
  /* màu trơn máy in pha được (bản in 13/11, sau 17:29: có lại nâu, đỏ sẫm, xám), theo thiệp của từng nhóm */
  var PAL = { "do": "#ef4d44", do_sam: "#b33638", hong: "#f493af", hong_nhat: "#faccd6", cam: "#f9a03b", cam_dat: "#f47e36", nau: "#8b5b36", xam: "#aab2bb", vang: "#ffd035", vang_nhat: "#ffec90", kem: "#ffe5bb", la: "#68bd51", duong: "#499fd8" };
  var MAU = {
    1: ["do", "hong", "hong", "hong_nhat", "hong_nhat", "do", "vang_nhat", "vang_nhat", "la", "la"],
    2: ["cam", "cam", "cam", "duong", "duong", "hong_nhat", "kem", "kem", "vang", "vang"],
    3: ["kem", "do", "vang", "nau", "do_sam", "xam", "vang_nhat", "do", "duong", "duong"],
    4: ["do", "do_sam", "do_sam", "nau", "vang", "vang_nhat", "do", "do", "cam", "cam"]
  };
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
  var NHOM = { 1: "dung", 2: "dung", 3: "ngang", 4: "ngang" };
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
      { ten: "Xếp hình", dong: [
        "Các nhóm thảo luận, dùng điện thoại để xếp 10 mảnh ghép thành một hình có ý nghĩa."] },
      { ten: "Dán hình lên thiệp và nêu ý nghĩa tấm thiệp", dong: [        // 15/11 22:34 thầy đổi: bỏ dòng viết lời chúc (tấm thiệp không còn phần ghi lời chúc)
        "Các nhóm dán 10 mảnh lên thiệp theo hình đã xếp trên điện thoại. Lưu ý các mảnh không chồng lên nhau.",
        "Thảo luận để chuẩn bị trình bày phần ý nghĩa tấm thiệp."] },
      { ten: "Dán thiệp lên báo tường", dong: [
        "Bốn nhóm đem tấm thiệp đã hoàn chỉnh lên dán vào báo tường.",
        "Một bạn giải thích ý nghĩa bức tranh của nhóm."] }
    ]
  };
  var DEM_NGUOC_PHUT = 15;                        // số phút của đồng hồ đếm ngược (thầy chốt 15/11 22:12). Muốn đổi: sửa một số này
  function dnTinh(v, gio) {                       // đọc <phòng>/dn. Trả về null (tắt) hoặc { tt: "chay" | "dung" | "het", con: mili giây còn lại, tong: tổng mili giây }
    var tong, con;
    if (!v || typeof v !== "object") return null;
    tong = +v.d > 0 ? +v.d : DEM_NGUOC_PHUT * 60000;
    if (typeof v.c === "number") return { tt: v.c > 0 ? "dung" : "het", con: Math.max(0, Math.min(tong, v.c)), tong: tong };
    if (typeof v.h !== "number") return null;
    con = v.h - gio;
    return con > 0 ? { tt: "chay", con: Math.min(tong, con), tong: tong } : { tt: "het", con: 0, tong: tong };
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
      else if (!tt || tt.tt === "het") T.set("dn", { h: Math.round(gio + tong), d: tong });
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
  function demSao(d) { var n = 0; d = d || {}; THU_TU.forEach(function (kh) { if (d[kh] === "s") n++; }); return n; }

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
     Dời đúng bằng hình mẫu (thiệp dọc: xuống 5,2 cm; thiệp ngang: sang phải 4,25 cm, xuống 0,65 cm), nên các mảnh nằm giữa chỗ dán hình
     và vẫn đúng nấc lưới như trước. Tivi lúc nhóm còn đo và tính: xem CHO_O (thiệp ngang tạm vẽ các mảnh lệch sang trái để có chỗ cho 3 ô).
     Bảng trước lúc dời: xep-thiep-truoc-bo-loi-chuc (ban-cu/site-15-11-22h50). */
  var MAU_DAU = {
    1: [[17.816, 16.066, 116.57, 0], [4.6, 13.348, 75, 0], [24.618, 13.741, 135, 0], [19.867, 27.557, 165, 0], [22.53, 33.114, 15, 0], [9.997, 33.207, 345, 0], [4.436, 20.137, 296.56, 0], [24.567, 20.041, 63.44, 0], [10.782, 23.859, 105, 0], [4.234, 27.09, 75, 1]],
    2: [[16.816, 16.066, 116.57, 0], [6.158, 13.371, 63.43, 0], [22.158, 14.371, 63.43, 0], [7.827, 31.375, 210, 0], [23.766, 33.523, 333.43, 0], [20.656, 26.695, 30, 0], [8.79, 24.987, 150, 0], [9.99, 18.48, 120, 0], [24.775, 20.681, 315, 1], [4, 20.7, 90, 0]],
    3: [[32.566, 11.366, 116.57, 0], [27.005, 8.026, 135, 0], [20.899, 7.621, 135, 0], [24.125, 20.766, 150, 0], [14.845, 7.668, 315, 0], [11.428, 18.09, 195, 0], [19.589, 13.878, 75, 0], [8.449, 11.379, 285, 0], [12.51, 25.516, 165, 1], [32.525, 25.516, 195, 0]],
    4: [[17.37, 11.371, 296.57, 0], [23.742, 7.987, 236, 0], [32.357, 7.079, 153.43, 0], [30.665, 24.73, 15, 0], [9.42, 25.914, 153.43, 0], [30.782, 12.625, 345, 0], [24.246, 18.937, 105, 0], [33.268, 18.145, 330, 0], [9.889, 16.366, 225, 1], [16.312, 20.539, 315, 0]]
  };
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
  var GOC_MAU = {      // [góc, lật] của 10 mảnh trong hình mẫu từng nhóm (bảng MAU_DAU bản 14/11 16:32)
    1: [[90, 0], [50, 0], [310, 0], [180, 0], [180, 0], [0, 0], [333.44, 0], [26.56, 0], [65, 1], [295, 0]],
    2: [[90, 0], [90, 0], [90, 0], [180, 0], [0, 0], [0, 0], [0, 0], [0, 0], [304, 1], [56, 0]],
    3: [[90, 0], [0, 0], [90, 0], [180, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 1], [0, 0]],
    4: [[90, 0], [56, 0], [304, 0], [0, 0], [180, 0], [0, 0], [0, 0], [0, 0], [85, 1], [275, 0]]
  };
  var SINH_DOI = { 1: 2, 2: 1, 6: 7, 7: 6, 8: 9, 9: 8 }, nacNho = {};      // chỉ số mảnh (từ 0): 2–3, 7–8, 9–10 là các cặp cùng hình
  function lechVong(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; }      // về (−180, 180]

  /* ---------- hình mẫu của nhóm, lưới theo hình mẫu, mức giống hình mẫu (15/11 18:31) ----------
     Thầy dặn: "có cái mốc dự đoán là gần giống hình gốc 80%, thì khi bấm hoàn thành đó, bạn sẽ xếp y chang cái hình mà trong cái file báo tường làm mẫu đó
     ... thôi giảm xuống 70% đi". Hình mẫu = file in 4-thiep-a3-bo-198 (cũng là 4 tấm thiệp mẫu trên báo tường); đa giác từng mảnh nằm trong
     Tranh3D.MAU_HINH (cm trên thiệp). mauXep(k)[i] = { x, y, r, f } của mảnh thứ i trong hình mẫu nhóm k. */
  var mauNho = {}, luoiNho = {};
  function mauXep(k) {
    if (mauNho[k] === undefined) {
      var Hm = window.Tranh3D && window.Tranh3D.MAU_HINH && window.Tranh3D.MAU_HINH[k], ra = null;
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
  /* Mức giống hình mẫu = phần diện tích (trong 198 cm² của 10 mảnh) mà các mảnh của nhóm đang nằm ĐÚNG CHỖ của chính mảnh đó trong hình mẫu.
     Các em xếp hình ở đâu trên tấm thiệp cũng được: máy dời cả hình mẫu tới chỗ khớp nhất rồi mới so (không xoay cả hình).
     Hai mảnh cùng hình (2–3, 7–8, 9–10) đổi chỗ cho nhau vẫn tính. Trả về { tile: 0..1, dx, dy, gan }: gan[i] = mảnh của nhóm (từ 0) nằm vào chỗ mảnh mẫu thứ i.
     Từ MOC_GIONG trở lên: bấm Hoàn thành thì máy xếp lại y chang hình mẫu, đúng chỗ của hình mẫu trên thiệp. */
  var MOC_GIONG = 0.7, CUNG_HINH = [[0], [1, 2], [3], [4], [5], [6, 7], [8, 9]];
  function giongMau(k, ps) {
    var M = mauXep(k);
    if (!M || !ps || ps.length !== M.length) return null;
    var goc = BO.map(daGiac), Q = M.map(function (st, i) { return toaDo(goc[i], st); }), cQ = Q.map(trongTam), cP = ps.map(trongTam), tong = 0, tot = null;
    Q.forEach(function (q) { tong += dtDaGiac(q); });
    function diem(dx, dy) {
      var Qd = Q.map(function (q) { return q.map(function (v) { return [v[0] + dx, v[1] + dy]; }); }), d = 0, gan = [];
      CUNG_HINH.forEach(function (g) {
        if (g.length === 1) { d += dtGiao(ps[g[0]], Qd[g[0]]); gan[g[0]] = g[0]; return; }
        var a = dtGiao(ps[g[0]], Qd[g[0]]) + dtGiao(ps[g[1]], Qd[g[1]]), b = dtGiao(ps[g[1]], Qd[g[0]]) + dtGiao(ps[g[0]], Qd[g[1]]);
        if (a >= b) { d += a; gan[g[0]] = g[0]; gan[g[1]] = g[1]; } else { d += b; gan[g[0]] = g[1]; gan[g[1]] = g[0]; }
      });
      return { tile: d / tong, dx: dx, dy: dy, gan: gan };
    }
    CUNG_HINH.forEach(function (g) {              // thử dời hình mẫu sao cho một mảnh mẫu trùng tâm với mảnh cùng hình của nhóm
      g.forEach(function (i) { g.forEach(function (j) {
        var x = diem(cP[j][0] - cQ[i][0], cP[j][1] - cQ[i][1]);
        if (!tot || x.tile > tot.tile) tot = x;
      }); });
    });
    [1, 0.5, 0.25, 0.125].forEach(function (b) {  // nhích thêm cho khớp hơn
      var doi = true, vong = 0;
      while (doi && vong++ < 8) {
        doi = false;
        [[b, 0], [-b, 0], [0, b], [0, -b]].forEach(function (v) { var x = diem(tot.dx + v[0], tot.dy + v[1]); if (x.tile > tot.tile + 1e-9) { tot = x; doi = true; } });
      }
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
  function giuSang() { try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(function () {}); } catch (e) { /* bỏ qua */ } }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") giuSang(); });   // quay lại trang thì xin giữ sáng màn hình lại

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
    return napScript(goc + "firebase-app-compat.js").then(function () { return napScript(goc + "firebase-database-compat.js"); }).then(function () {
      var app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(FB);
      var db = app.database(), base = db.ref(NHANH + "/" + phong), coMat = [], lechGio = 0;
      db.ref(".info/serverTimeOffset").on("value", function (sv) { lechGio = +sv.val() || 0; });     // đồng hồ của máy này lệch giờ máy chủ bao nhiêu: tivi và máy giáo viên đếm ngược theo cùng một giờ
      db.ref(".info/connected").on("value", function (s) {
        bao(s.val() ? "ok" : "cho");
        if (s.val()) coMat.forEach(function (c) { c.r.onDisconnect().remove(); c.r.set(c.v); });
      });
      function loi(e) { if (e) { console.error(e); bao("loi", (e.code || e.message || e) + ""); } }
      return {
        kieu: "firebase",
        gio: function () { return Date.now() + lechGio; },
        set: function (p, v) { base.child(p).set(v, loi); },
        update: function (o) { base.update(o, loi); },            // nhiều đường dẫn một lần; giá trị null là xóa
        remove: function (p) { base.child(p).remove(loi); },
        on: function (p, cb) { (p ? base.child(p) : base).on("value", function (s) { cb(s.val()); }, loi); },
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
      coMat: function (p, v) { ghi(p, v === undefined ? true : v); if (!daCoMat[p]) { daCoMat[p] = 1; window.addEventListener("pagehide", function () { ghi(p, null); }); } }
    });
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
    g.setAttribute("transform", "translate(" + (st.x * U).toFixed(2) + " " + (st.y * U).toFixed(2) + ") rotate(" + st.r + ")");
    var p = diem(diemGoc(goc, st.f));
    g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p);
    if (g.children[2]) g.children[2].setAttribute("transform", "rotate(" + (-st.r) + ")");
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
  function chonNhom(ts, phong) {
    var chon = 0, mayChon = false, T = null, nut = {}, mayId = layMayId(), daTinh = false;
    $("dtChon").hidden = false;
    function ve() {
      [1, 2, 3, 4].forEach(function (i) { nut[i].classList.toggle("dang-chon", i === chon); nut[i].setAttribute("aria-pressed", i === chon ? "true" : "false"); });
      if (chon) document.body.setAttribute("data-nhom", chon); else document.body.removeAttribute("data-nhom");
      $("dtChonChu").textContent = !chon ? "Em chạm vào nhóm của mình." : mayChon ? "Máy chọn sẵn Nhóm " + chon + ". Chưa đúng thì em chạm vào nhóm của mình." : "Em đã chọn Nhóm " + chon + ".";
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
    $("dtChonXong").onclick = function () { if (chon) location.search = "?p=" + encodeURIComponent(phong) + "&n=" + chon + (ts.thu ? "&thu=1" : ""); };
    ve();
    noi(phong, ts.thu, function () {}).then(function (t) {
      T = t;
      T.on("", function (d) {
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

  function chayDienThoai(ts) {
    var k = parseInt(ts.n, 10), phong = ts.p;
    document.body.className = "dt";
    $("dt").hidden = false;
    if (!phong) { $("dtCho").hidden = false; $("dtChoChu").textContent = "Thầy mở trang này trên tivi, rồi các em quét mã QR trên tivi."; return; }
    if (!(k >= 1 && k <= 4)) { chonNhom(ts, phong); return; }
    document.body.setAttribute("data-nhom", k);
    var bc = BOCUC[NHOM[k]], dan = bc.dan, mau = MAU[k], goc = BO.map(daGiac);
    var T = null, nhap = {}, sai = {}, khoa3 = {}, daMo = false, xong = false, man = "nhap", lanDau = true;
    var manh = [], chon = null, keo = null, xoay2 = null, tro = {}, guiCho = {}, guiLuc = {}, chuaNhan = null, baoDe = null, quaTo = null, dangChot = false;
    var to = window.innerWidth >= 700 && window.innerHeight >= 700;
    var mayId = layMayId();
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
        o.nut.classList.toggle("xong", !!d); o.nut.classList.toggle("sao", d === "s"); o.nut.classList.toggle("bi-khoa", kb);
        o.than.setAttribute("fill", d ? mau[M.so[0] - 1] : MAU_XAM);
        o.nut.querySelector(".o-dau").textContent = d === "s" ? "★" : d ? "✓" : "";
        o.nut.querySelector(".o-kq").textContent = d ? M.dt + " cm²" : kb ? "Đã khóa" : "";
      });
      ["tong", "thiep", "con"].forEach(function (kh) {
        var b = oDong[kh], d = nhap[kh], kq = b.querySelector(".dong-kq"), khoa = khoaMuc(kh), o = MUC[kh].o, kb = biKhoa(kh);
        b.classList.toggle("xong", !!d); b.classList.toggle("khoa", !d && !!khoa && !kb); b.classList.toggle("bi-khoa", kb);
        kq.textContent = d ? (d === "s" ? "★ " : "✓ ") + o[o.length - 1].dung + " cm²" : kb ? CHU_KHOA : khoa ? khoa : "Chạm để nhập";
      });
      var n = demDung(nhap), loi = $("nhapLoi");
      loi.className = "nhap-loi";
      if (nhap.con) { loi.textContent = "Đúng hết rồi! Phần còn lại của tấm thiệp rộng " + CON + " cm²."; /* 15/11 22:33 thầy bỏ chỗ ghi lời chúc; tên mới của phần còn lại thầy chưa chốt */ loi.classList.add("tot"); }
      else if (THU_TU.some(biKhoa)) { loi.textContent = "Có mục nhập sai " + SAI_KHOA + " lần nên đã khóa. " + CHU_KHOA + "."; loi.classList.add("xau"); }
      else if (daMo) loi.textContent = "Giáo viên đã mở nhiệm vụ 2. Các em vẫn nhập tiếp số đo được. Đã đúng " + n + "/10.";
      else loi.textContent = n ? "Đã đúng " + n + "/10. Chạm mảnh chưa có màu để nhập tiếp." : "Đo từng mảnh, tính diện tích rồi chạm vào mảnh để nhập. Hai mảnh giống nhau chỉ nhập một lần.";
      var du10 = n === THU_TU.length;
      $("nhapMung").hidden = !(du10 && !daMo);
      loi.hidden = du10 && !daMo;                 // lúc có lời chúc mừng thì lời chúc nằm ở chỗ dòng nhắc (đầu màn), dòng nhắc ẩn
      $("nhapMung1").textContent = "Chúc mừng nhóm " + k + " đã hoàn thành rất tốt nhiệm vụ 1.";
      $("nhapSang").disabled = !duocXep();
      $("nhapDuoi").hidden = !duocXep();          // nút sang bước 2 chỉ hiện khi giáo viên đã mở bước 2 (trước đó là một nút mờ không bấm được, rối mắt)
      if (O.kh) veO();
    }

    /* --- bảng nhập một mục --- */
    var O = { kh: null, v: [], i: 0, kq: null, bao: "", lopBao: "", dong: null };
    "1 2 3 4 5 6 7 8 9 xoa 0 tiep".split(" ").forEach(function (p) {
      var b = H("button", "phim" + (p === "xoa" || p === "tiep" ? " phu" : ""), p === "xoa" ? "⌫" : p === "tiep" ? "Ô sau" : p, $("oPhim"));
      b.onclick = function () { bam(p); };
    });
    function moO(kh) {
      var khoa = khoaMuc(kh);
      if (khoa && !nhap[kh]) { var b = oDong[kh]; b.classList.add("rung"); setTimeout(function () { b.classList.remove("rung"); }, 500); return; }
      clearTimeout(O.dong);
      O.kh = kh; O.v = MUC[kh].o.map(function () { return ""; }); O.i = 0; O.kq = null; O.bao = ""; O.lopBao = "";
      veHinhO(); veO();
      $("o").hidden = false;
    }
    function dongO() { clearTimeout(O.dong); O.kh = null; $("o").hidden = true; }
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
      $("oTen").textContent = M.ten;
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
      bao.textContent = d ? (d === "s" ? "Đúng rồi! Đúng ngay lần đầu nên nhóm được 1 ngôi sao." : "Đúng rồi!") : kb ? "Nhóm đã nhập sai " + SAI_KHOA + " lần. " + CHU_KHOA + "." : O.bao;
      $("o").classList.toggle("bi-khoa", kb);
      $("oPhim").classList.toggle("tat", !!d || kb);
      $("oKiem").disabled = !!d || !T || kb;
      $("oKiem").textContent = d ? "Đã đúng" : kb ? "Đã khóa" : "Kiểm tra";
      var hinh = $("oHinh").querySelector(".o-svg .than");
      if (hinh && M.manh) hinh.setAttribute("fill", d ? mau[M.so[0] - 1] : "#f1ece2");
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
        T.set("n" + k + "/d/" + kh, nhap[kh]);
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
      if (T) T.coMat("n" + k + "/co/" + mayId, chuCua());
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
      manh.slice().sort(function (a, b) { return a.st.t - b.st.t || a.so - b.so; }).forEach(function (m) { lopManh.appendChild(m.g); });
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
      var nhac = $("dtNhac");
      nhac.className = "nhac";
      if (dangChot) { nhac.textContent = "Máy đang chỉnh lại hình cho ngay ngắn…"; nhac.classList.add("tot"); }
      else if (baoDe) { nhac.textContent = "Mảnh viền đỏ đang đè lên mảnh khác. Em chỉnh lại rồi bấm Hoàn thành nhé."; nhac.classList.add("xau"); }
      else if (quaTo) { nhac.textContent = "Hình chưa vừa khung nét đứt (chỗ dán hình trên thiệp). Em xếp gọn lại rồi bấm Hoàn thành nhé."; nhac.classList.add("xau"); }
      else if (chuaNhan) { nhac.textContent = "Mảnh viền cam còn nằm rời. Em xếp các mảnh sát nhau thành hình rồi bấm Hoàn thành nhé."; nhac.classList.add("xau"); }
      else if (chon === null) nhac.textContent = "Kéo từng mảnh để xếp thành hình. Xếp xong thì bấm Hoàn thành.";
      else nhac.textContent = "Chạm mảnh đang chọn để xoay, hoặc xoay bằng hai ngón. Xếp xong thì bấm Hoàn thành.";
      var cm = chon !== null && !dangChot;
      $("dtTrai").disabled = $("dtPhai").disabled = !cm;
      $("dtLat").disabled = !cm;
      $("dtXong").disabled = dangChot || !T;
      $("dtLai").disabled = dangChot || !T;
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
      /* Thầy dặn 15/11 18:31: hình các em xếp giống hình mẫu từ 70 % thì lúc bấm Hoàn thành máy xếp lại y chang hình mẫu (không xét đè, rời nữa). */
      var gm = giongMau(k, ds.map(function (A) { return toaDo(A.goc, A.st); }));
      if (gm && gm.tile >= MOC_GIONG) {
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
    $("thiepSua").onclick = function () { if (T) T.remove("n" + k + "/xong"); };

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
        datManh(veManh(lopT, goc[m.so - 1], mau[m.so - 1], m.so, false), goc[m.so - 1], m.st);
      });
    }

    /* ---------------- đổi màn hình ---------------- */
    function doiMan() {
      var ten = xong ? "thiep" : man;
      $("manNhap").hidden = ten !== "nhap"; $("manXep").hidden = ten !== "xep"; $("manThiep").hidden = ten !== "thiep";
      $("dtTen").textContent = ten === "nhap" ? "Nhiệm vụ 1: Đo đạc và tính toán" : ten === "xep" ? "Nhiệm vụ 2: Xếp hình" : "Tấm thiệp đã xong";
      if (ten !== "nhap" && O.kh) dongO();
      if (ten !== "xep") dongHop();
      if (ten === "thiep") veThiepXong();
      coBan();
      if (ten === "xep") capNhat();
    }

    /* ---------------- nối ---------------- */
    function trangThai(kieu) {
      var e = $("dtNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối với tivi" : kieu === "cungmay" ? "Chạy thử" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }
    veNhap(); doiMan(); capNhat();
    noi(phong, ts.thu, trangThai).then(function (t) {
      T = t;
      baoCua();
      T.on("n" + k, function (d) {                 // mọi thay đổi của nhóm: số đo đã đúng, vị trí mảnh, đã hoàn thành
        d = d || {};
        var khoaCu = khoa3, moCu = daMo;
        nhap = d.d || {}; sai = d.s || {}; daMo = !!d.mo; khoa3 = d.khoa || {};
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
        veNhap(); doiMan(); capNhat();
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
  var CHO_O = {
    dung: { tl: 1, tong: [5.4, 38.6, 6, "Tổng"], thiep: [13.2, 38.6, 6.5, "Thiệp"], con: [22.3, 38.6, 9.5, "Phần còn lại"] },
    ngang: { tl: 0.8, doi: [-4, 0], tong: [37.2, 12.75, 6, "Tổng"], thiep: [37.2, 16.75, 6.5, "Thiệp"], con: [37.2, 20.75, 9.5, "Phần còn lại"] }
  };

  /* Một tấm thiệp trên báo tường (tivi): giấy, trang trí thiệp, lưới bàn xếp, 3 ô theo dõi, 10 mảnh.
     10 mảnh luôn có mặt: lúc đo và tính thì mảnh xám, loại nào nhập đúng thì lên màu và có dấu ✓ (★ nếu đúng ngay lần đầu) trên mảnh đầu của loại đó. */
  function dungKhung(svg, k) {
    var bc = BOCUC[NHOM[k]], W = bc.W * U, Hh = bc.H * U, dan = bc.dan, goc = BO.map(daGiac);
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hh);
    S("rect", { "class": "giay", x: 0, y: 0, width: W, height: Hh }, svg);
    veTrangTri(S("g", { "class": "lop-tt" }, svg), k);
    var lopLuoi = S("g", { "class": "lop-luoi" }, svg);      // 15/11 18:31: tivi không vẽ lưới nữa, mảnh nằm ngay trên tờ thiệp (lớp này chỉ còn dùng khi phải thu nhỏ vì dữ liệu cũ)
    var ln = S("g", { "class": "lop-nhap", transform: "scale(" + (1 / TL_MANH).toFixed(5) + ")" }, svg), cho = CHO_O[NHOM[k]], muc = {};      // CHO_O theo cm thật
    ["tong", "thiep", "con"].forEach(function (kh) {
      var c = cho[kh], x = c[0] * U, y = c[1] * U, w = c[2] * U;
      var o = S("g", { "class": "muc o-chu", transform: "translate(" + x + " " + y + ")" + (cho.tl !== 1 ? " scale(" + cho.tl + ")" : "") }, ln);
      S("rect", { "class": "o-nen", x: -w / 2, y: -13, width: w, height: 26, rx: 13 }, o);
      Sc(o, 0, 0, "o-ten", c[3], { "text-anchor": "middle", dy: "0.35em" });
      S("polygon", { "class": "dau-sao", points: ngoiSao(w / 2 - 2, -11, 6.4, 2.8) }, o);
      muc[kh] = { o: o };
    });
    var lop = S("g", { "class": "lop-manh" }, svg), g = {}, khoaCua = {};
    KHOA_MANH.forEach(function (kh) { MUC[kh].so.forEach(function (so) { khoaCua[so] = kh; }); });
    goc.forEach(function (p, i) {
      var so = i + 1, e = veManh(lop, p, MAU_XAM, so, false);
      if (MUC[khoaCua[so]].so[0] === so) {
        var dau = S("g", { "class": "dau" }, e);
        S("circle", { r: 9, "class": "dau-nen" }, dau);
        S("path", { "class": "dau-v", d: "M-4.2 0.4L-1.2 3.6L4.6 -3.4" }, dau);
        S("polygon", { "class": "dau-sao", points: ngoiSao(0, 0.3, 7.4, 3.2) }, dau);
      }
      g[so] = e;
    });
    svg.appendChild(ln);                           // 15/11 18:31: mảnh nằm sẵn rải khắp tờ thiệp nên 3 ô Tổng / Thiệp / Phần còn lại phải nằm TRÊN các mảnh mới đọc được
    return { muc: muc, lop: lop, lopLuoi: lopLuoi, g: g, khoaCua: khoaCua, dan: dan, W: bc.W, H: bc.H, cua: "" };
  }

  function chayTivi(ts) {
    document.body.className = "tv";
    $("tv").hidden = false;
    var phong = ts.p, thu = ts.thu, T = null, goc = BO.map(daGiac), khungNhom = {}, duLieu = {}, lon = 0;
    /* Thầy dặn 14/11 16:18: "cái hình báo tường sẽ hiện xuyên suốt cái hoạt động này luôn". Tivi chỉ còn một màn là tấm báo tường; mỗi tấm thiệp có một mã QR nằm ngay trên nó (từ 15/11 cả 4 là cùng một mã).
       xem = "vao": mới mở trang, mã hiện trên thiệp của nhóm chưa nhập đúng mục nào (nhóm đã làm được thì mã tự ẩn để thấy bài);
             "ma": thầy bấm Mã QR, mã hiện ở cả 4 thiệp (cho máy vào sau); "xep": thầy bấm Ẩn mã QR, không hiện mã. */
    var xem = "vao";
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

    function coGian() {
      var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      $("tv").style.transform = "translate(-50%,-50%) scale(" + s + ")";
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
      K.o = o; K.hien = {}; K.thuTu = ""; K.tt = o.querySelector(".tt"); K.sao = o.querySelector(".so-sao"); K.xong = false; K.pha = "";
      khungNhom[k] = K;
      o.querySelector(".the").onclick = function () { phong_to(k); };
      svg.onclick = function () { phong_to(k); };
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
      veBang3d(); veLai3d(); bao3d();
    }
    /* Tivi báo cho máy giáo viên trong <phòng>/tv3d: l = thiệp đang hiện to (0 = báo tường), c = "0100" nhóm đang chạy Tranh 3D, b = "1100" nhóm đã được bấm,
       q = 1 khi mã QR đang hiện trên thiệp nào đó, d = 1 khi bảng Đáp số đang mở, n = 1 khi bảng Nhiệm vụ đang mở. */
    var tt3dCu = null;
    function bao3d() {
      var c = "", b = "", ky, q, d, n;
      if (!T) return;
      [1, 2, 3, 4].forEach(function (k) { c += hx[k].chay ? "1" : "0"; b += hx[k].bam ? "1" : "0"; });
      q = [1, 2, 3, 4].some(hienMa) ? 1 : 0; d = $("dapSo").hidden ? 0 : 1; n = $("nhiemVu").hidden ? 0 : 1;
      ky = lon + "|" + c + "|" + b + "|" + q + d + n;
      if (ky === tt3dCu) return;
      tt3dCu = ky; T.set("tv3d", { l: lon, c: c, b: b, q: q, d: d, n: n });
    }
    /* Các bảng che báo tường: Cài đặt, Mã cho máy giáo viên (chỉ mở trên tivi), Đáp số, Nhiệm vụ (mở được từ máy giáo viên). Mỗi lúc chỉ một bảng. Hiện ngay, không phóng to thu nhỏ. */
    function dongBang() { $("caiDat").hidden = true; $("gvMa").hidden = true; }
    function hienDapSo(b) { if (b) { dongBang(); $("nhiemVu").hidden = true; } $("dapSo").hidden = !b; bao3d(); }
    function hienNhiemVu(b) { if (b && !NHIEM_VU) return; if (b) { dongBang(); $("dapSo").hidden = true; } $("nhiemVu").hidden = !b; if (b) vuaNhiemVu(); bao3d(); }
    function veBaoTuong() { dongBang(); $("dapSo").hidden = true; $("nhiemVu").hidden = true; if (lon) phong_to(lon); bao3d(); }
    /* Lệnh từ máy giáo viên, trong <phòng>/lenh = { i: mã lệnh, v, k }: v = "3d" hiện to thiệp nhóm k và chạy Tranh 3D; "dung" dừng Tranh 3D nhóm k;
       "ve" về báo tường (đóng mọi bảng, thôi hiện to); "ma" hiện (k = 1) hay ẩn (k = 0) mã QR; "dap" hiện / ẩn bảng Đáp số; "nv" hiện / ẩn bảng Nhiệm vụ.
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
      if (!(k >= 1 && k <= 4)) return;
      if (L.v === "3d") {
        if (!T3 || !(duLieu[k] || {}).xong) return;
        dongBang(); $("dapSo").hidden = true; $("nhiemVu").hidden = true;      // thầy đang bấm từ điện thoại: dẹp các bảng đang che thiệp
        if (hienMa(k)) { xem = "xep"; capNhatMa(); }
        if (lon !== k) phong_to(k);
        bat3d(k);
      } else if (L.v === "dung") dung3d(k);
    }

    /* ---------- Tranh 3D (15/11; phần vẽ ở js/tranh-3d.js) ----------
       Thầy dặn 14/11 16:27: nhóm bấm Hoàn thành thì thiệp đứng yên, hoạt ảnh do thầy bấm. 15/11 13:19: tên là "Tranh 3D", thầy bấm cho từng nhóm;
       đủ 4 nhóm được bấm thì hiện pháo bông, không có chữ 51 năm, không làm tối màu.
       Cách dùng: chạm thiệp của nhóm đã hoàn thành → thiệp hiện to → nút "Tranh 3D" (đang chạy thì thành "Dừng"), "Đóng". Thiệp đã bấm vẫn chạy khi về báo tường.
       hx[k]: cv, c = canvas đè lên thiệp; ky = chữ ký chỗ 10 mảnh lúc so hình; kieu = k (khớp hình mẫu của nhóm) hay "td" (hình tự nghĩ);
              P0, Q = đa giác lúc các em đặt và đa giác mẫu (trong hệ của mẫu), dx, dy = độ dời của cả hình so với mẫu; e = 0..1 mảnh trượt từ P0 về Q;
              chay = thầy đang cho chạy; a = 0..1 độ đậm của hoạt ảnh; t0 = lúc bấm; bam = nhóm đã được bấm ít nhất một lần; tinh = đã vẽ xong hình đứng yên.
       Tranh 3D chỉ nằm trên tivi này (không ghi lên máy chủ): tải lại trang thì thầy bấm lại. Hình của nhóm đổi (Sửa lại hình, Xóa hình) thì tranh 3D của nhóm đó bị bỏ. */
    var T3 = window.Tranh3D || null, hx = { 1: {}, 2: {}, 3: {}, 4: {} }, daNo = false, phaoLuc = 0, vong = 0, lucTruoc = 0, boQua = false;
    function daGiacNhom(k) {                       // đa giác 10 mảnh nhóm k đang hiện trên thiệp (cm) và chữ ký để biết hình có đổi không
      var d = duLieu[k] || {}, m = d.m || {}, ps = {}, ky = [], so, st, dau = viTriDau(k);
      for (so = 1; so <= goc.length; so++) { st = mo(m["p" + so]) || dau[so - 1]; ps[so] = toaDo(goc[so - 1], st); ky.push([f2(st.x), f2(st.y), f2(st.r), st.f ? 1 : 0].join(",")); }
      return { ps: ps, ky: ky.join(";") };
    }
    function chuan3d(k) {                          // so hình của nhóm với hình mẫu của nhóm đó (hình đổi thì so lại)
      var X = hx[k], h = daGiacNhom(k), r, i;
      if (X.ky === h.ky) return X;
      r = T3.khop(k, h.ps);
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
      if (!daNo && [1, 2, 3, 4].every(function (i) { return hx[i].bam; })) { daNo = true; phaoLuc = performance.now() + 400; }   // đủ 4 nhóm: pháo bông nổ sau lần bấm thứ tư 0,4 giây
      capNhat3d(); chayVong();
    }
    function dung3d(k) { var X = hx[k]; if (X.cv) { X.chay = false; X.tinh = false; } capNhat3d(); chayVong(); }
    function bo3d(k) {
      var X = hx[k];
      if (X.cv && X.cv.parentNode) X.cv.parentNode.removeChild(X.cv);
      khungNhom[k].o.classList.remove("co-3d");
      if (X.bam) daNo = false;                     // nhóm này phải được bấm lại; khi đủ 4 nhóm lần nữa thì pháo bông nổ lần nữa
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
      T3.ve(c, X.kieu, Math.max(0, t), X.a, P, X.M, [bc.W, bc.H], u);
      if (!X.chay && X.a <= 0) { X.tinh = true; return false; }
      return true;
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
        else if (tf > T3.DAI_PHAO) { phaoLuc = 0; cv.hidden = true; }
        else {
          cv.hidden = false; con = true;
          c.setTransform(cv.width / T3.PHAO_W, 0, 0, cv.height / T3.PHAO_H, 0, 0);
          T3.vePhaoBong(c, tf);
          c.globalAlpha = 1;
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
      veBang3d(); bao3d();
    }
    function veBang3d() {                          // bảng nút bên phải tấm thiệp đang hiện to
      var b = $("bang3d"), k = lon, X, xong;
      b.hidden = !k || !T3;
      if (b.hidden) return;
      xong = !!(duLieu[k] || {}).xong; X = hx[k];
      b.className = "bang-3d " + NHOM[k];
      $("ten3d").textContent = !xong ? "" : chuan3d(k).kieu === "td" ? "Hình nhóm tự nghĩ" : T3.TEN[k];
      $("nut3d").disabled = !xong;
      $("nut3d").textContent = X.chay ? "■ Dừng" : "▶ Tranh 3D";
      $("nut3d").classList.toggle("dang-chay", !!X.chay);
      $("tt3d").textContent = !xong ? "Nhóm chưa hoàn thành hình nên chưa bấm được." : X.chay ? "Tranh 3D đang chạy" : "Thiệp đang đứng yên";
    }
    $("nut3d").onclick = function () { if (!lon) return; if (hx[lon].chay) dung3d(lon); else bat3d(lon); };
    $("dong3d").onclick = function () { if (lon) phong_to(lon); };
    window.addEventListener("resize", veLai3d);
    if (!T3) $("dem3d").hidden = true;

    function veNhom(k, d) {
      d = d || {}; duLieu[k] = d;
      var K = khungNhom[k], m = d.m || {}, nhap = d.d || {}, ds = [], so, mau = MAU[k];
      var pha = d.xong ? "xong" : d.mo ? "xep" : "nhap";      // 15/11 19:15: bước 2 chỉ mở khi giáo viên bấm
      if (pha === "xong" && K.pha && K.pha !== "xong") { K.o.classList.add("chot"); clearTimeout(K.hen); K.hen = setTimeout(function () { K.o.classList.remove("chot"); }, 1200); }
      if (pha !== K.pha) { K.o.classList.remove("pha-nhap", "pha-xep", "pha-xong"); K.o.classList.add("pha-" + pha); K.pha = pha; }
      ["tong", "thiep", "con"].forEach(function (kh) {
        var M = K.muc[kh], v = nhap[kh];
        M.o.classList.toggle("dung", !!v); M.o.classList.toggle("sao", v === "s");
      });
      /* 10 mảnh luôn có mặt trên thiệp; mảnh chưa ai kéo thì nằm ở chỗ sẵn */
      var dau = viTriDau(k);      // chỗ nằm sẵn (theo 4 ảnh thầy gửi 15/11), tính như trên điện thoại
      for (so = 1; so <= goc.length; so++) ds.push({ so: so, st: mo(m["p" + so]) || { x: dau[so - 1].x, y: dau[so - 1].y, r: dau[so - 1].r, f: dau[so - 1].f, t: 0 } });
      ds.sort(function (a, b) { return a.st.t - b.st.t || a.so - b.so; });
      var doiN = pha === "nhap" && !Object.keys(m).length && CHO_O[NHOM[k]].doi || [0, 0];      // lúc còn đo và tính: thiệp ngang vẽ các mảnh lệch đi cho 3 ô có chỗ (xem CHO_O)
      ds.forEach(function (x) {
        var g = K.g[x.so], v = nhap[K.khoaCua[x.so]], r = x.st.r, cu = K.hien[x.so];
        if (cu !== undefined) r += Math.round((cu - r) / 360) * 360;      // góc quay liên tục: chọn giá trị gần góc đang hiện nhất để mảnh không quay một vòng thừa
        K.hien[x.so] = r;
        g.style.transform = "translate(" + ((x.st.x + doiN[0]) * U).toFixed(2) + "px," + ((x.st.y + doiN[1]) * U).toFixed(2) + "px) rotate(" + r + "deg)";
        var p = diem(diemGoc(goc[x.so - 1], x.st.f));
        g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p);
        g.children[1].setAttribute("fill", pha === "nhap" && !v ? MAU_XAM : mau[x.so - 1]);
        g.classList.toggle("dung", !!v); g.classList.toggle("sao", v === "s");
        if (g.children[2]) g.children[2].style.transform = "rotate(" + (-r) + "deg) scale(" + (1 / TL_MANH).toFixed(3) + ")";      // dấu ✓ / ★ luôn đứng thẳng, giữ cỡ cũ dù mảnh vẽ nhỏ lại
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
      var may = d.co ? Object.keys(d.co).length : 0, nd = demDung(nhap), ns = demSao(nhap);
      K.o.classList.toggle("co-may", may > 0);
      var kh3 = d.khoa || {}, dsKhoa = pha === "xong" ? [] : THU_TU.filter(function (kh) { return kh3[kh] && !nhap[kh]; });      // mục nhóm đã nhập sai 3 lần, đang chờ thầy mở khóa
      K.o.classList.toggle("bi-khoa", dsKhoa.length > 0);
      var choMo = pha === "nhap" && nd === THU_TU.length;      // nhóm đã đúng hết bước 1, chờ giáo viên mở bước 2
      K.o.classList.toggle("cho-mo", choMo);
      K.moBan.disabled = pha !== "nhap"; K.moBan.classList.toggle("san", choMo);
      K.moKhoa.disabled = !dsKhoa.length;
      K.tt.textContent = dsKhoa.length ? "Sai " + SAI_KHOA + " lần, đã khóa: " + dsKhoa.map(function (kh) { return MUC[kh].ngan; }).join(", ") : pha === "xong" ? "Đã hoàn thành" : pha === "xep" ? "Đang xếp hình" : choMo ? "Xong nhiệm vụ 1, chờ mở nhiệm vụ 2" : nd ? "Đo và tính: đúng " + nd + "/10" : may ? "Đã vào, đang đo và tính" : "Chưa có máy nào vào";
      K.sao.textContent = ns ? "★ " + ns : "";
      $("vao" + k).querySelector(".vao-tt").textContent = may ? "Đã vào: " + may + " máy" : "Chưa có máy nào";
      capNhatMa();
      if (T3) {
        if (hx[k].ky !== undefined && (!d.xong || daGiacNhom(k).ky !== hx[k].ky)) bo3d(k);      // hình của nhóm đổi: bỏ tranh 3D của nhóm đó
        if (lon === k) veBang3d();
      }
    }
    function hienMa(k) { var d = duLieu[k] || {}; return xem === "ma" || (xem === "vao" && !(d.mo || d.xong || demDung(d.d) > 0)); }
    function capNhatMa() {
      [1, 2, 3, 4].forEach(function (k) { khungNhom[k].o.classList.toggle("hien-ma", hienMa(k)); });
      $("nutMa").textContent = [1, 2, 3, 4].some(hienMa) ? "Ẩn mã QR" : "Hiện mã QR";
      bao3d();
    }
    function doiXem(x) { xem = x; if (lon) phong_to(lon); capNhatMa(); }
    function xoaHinh() { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/m"] = null; o["n" + k + "/xong"] = null; }); T.update(o); }
    function lamLaiHet() { if (!T) return; var o = { dn: null }; [1, 2, 3, 4].forEach(function (k) { ["m", "xong", "d", "s", "mo", "khoa"].forEach(function (p) { o["n" + k + "/" + p] = null; }); }); T.update(o); }      // xóa hết thì tắt luôn đồng hồ đếm ngược
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
    function datAnh(blob, nguon, loi) {
      var o = $("baoTuong");
      if (anhUrl) { URL.revokeObjectURL(anhUrl); anhUrl = null; }
      if (blob) { anhUrl = URL.createObjectURL(blob); o.style.backgroundImage = "url(\"" + anhUrl + "\")"; } else o.style.backgroundImage = "";
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

    $("nutMa").onclick = function () { var dangHien = [1, 2, 3, 4].some(hienMa); veBaoTuong(); doiXem(dangHien ? "xep" : "ma"); };
    $("nutCaiDat").onclick = function () { $("dapSo").hidden = true; $("nhiemVu").hidden = true; $("gvMa").hidden = true; $("caiDat").hidden = false; bao3d(); };
    $("nutNhiemVu").onclick = function () { hienNhiemVu(true); };
    /* --- đồng hồ đếm ngược (15/11 22:12): vòng tròn vơi dần theo chiều kim đồng hồ, đốm lửa nhỏ đi đầu, số đổi bằng cách trượt nhẹ; không phóng to thu nhỏ --- */
    var dnV = null, dnCu = { tt: "", chu: "", mau: "", nho: null, vach: -1 }, dnMoLuc = 0, dnHenT = 0, dnHenF = 0, DN_R = 124, DN_C = 2 * Math.PI * 124;
    function dnDungVach(n) {                        // n chấm quanh vòng, mỗi chấm một phút
      var g = $("dnVach"), i, a, c;
      while (g.firstChild) g.removeChild(g.firstChild);
      if (n < 2 || n > 30) return;
      for (i = 1; i <= n; i++) {
        a = i / n * 2 * Math.PI;
        c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", (150 + 143.5 * Math.sin(a)).toFixed(2)); c.setAttribute("cy", (150 - 143.5 * Math.cos(a)).toFixed(2)); c.setAttribute("r", "4");
        g.appendChild(c);
      }
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
    function dnRoiHoa() {                           // hết giờ: vài cánh hoa rơi nhẹ trong khung đồng hồ
      var k = $("dnHoa"), mau = ["#f6c453", "#f29f8d", "#f7d9a0", "#e98a6b", "#f3b8c4"], i, e;
      while (k.firstChild) k.removeChild(k.firstChild);
      for (i = 0; i < 16; i++) {
        e = document.createElement("i");
        e.style.left = (6 + Math.random() * 88) + "%"; e.style.background = mau[i % mau.length];
        e.style.setProperty("--x", (Math.random() * 70 - 35).toFixed(0) + "px"); e.style.setProperty("--r", (Math.random() * 500 - 250).toFixed(0) + "deg");
        e.style.animationDelay = (Math.random() * 1.6).toFixed(2) + "s";
        k.appendChild(e);
      }
      setTimeout(function () { while (k.firstChild) k.removeChild(k.firstChild); }, 6500);
    }
    function dnVe() {
      var e = $("dn"), st = dnTinh(dnV, T ? T.gio() : Date.now()), phan, hien, goc2, a, x, y, chu, mau, nho, daQua, vach, mo;
      dnHenT = 0; dnHenF = 0;
      if (!st) { e.hidden = true; dnCu = { tt: "", chu: "", mau: "", nho: null, vach: -1 }; return; }
      if (e.hidden) { e.hidden = false; dnDungVach(Math.round(st.tong / 60000)); }
      if (st.tt === "chay" && dnCu.tt !== "chay" && dnCu.tt !== "dung" && st.con > st.tong - 2500) dnMoLuc = Date.now();     // vừa bấm bắt đầu: vòng tròn vẽ ra một vòng rồi mới chạy
      mo = dnMoLuc ? Math.min(1, (Date.now() - dnMoLuc) / 900) : 1;
      if (mo >= 1) dnMoLuc = 0;
      mo = 1 - Math.pow(1 - mo, 3);
      phan = st.tt === "het" ? 1 : st.con / st.tong;                 // hết giờ: vòng đầy màu vàng
      hien = phan * mo;
      goc2 = st.tt === "het" || mo < 1 ? 0 : 360 * (1 - phan);       // phần đã trôi qua mất dần từ đỉnh theo chiều kim đồng hồ
      $("dnCung").setAttribute("stroke-dasharray", (hien * DN_C).toFixed(1) + " " + (DN_C + 10).toFixed(1));
      $("dnCung").setAttribute("transform", "rotate(" + (goc2 - 90).toFixed(2) + " 150 150)");
      a = (mo < 1 ? 360 * hien : goc2) * Math.PI / 180;
      x = 150 + DN_R * Math.sin(a); y = 150 - DN_R * Math.cos(a);
      $("dnLua").setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")");
      chu = dnChu(st.con);
      if (chu !== dnCu.chu) { dnDoiSo(chu); dnCu.chu = chu; }
      mau = st.tt === "het" ? "" : st.con <= 60000 ? "mau-do" : st.con <= st.tong / 3 ? "mau-cam" : "";
      nho = !!lon || !$("nhiemVu").hidden || !$("dapSo").hidden || !$("caiDat").hidden || !$("gvMa").hidden;
      if (st.tt !== dnCu.tt || mau !== dnCu.mau || nho !== dnCu.nho) {
        e.className = "dn " + st.tt + (mau ? " " + mau : "") + (nho ? " nho" : "");
        $("dnNhan").textContent = st.tt === "dung" ? "Đang tạm dừng" : st.tt === "het" ? "" : "Thời gian còn lại";
        $("dnSo").hidden = st.tt === "het"; $("dnHet").hidden = st.tt !== "het";
        if (st.tt === "het" && dnCu.tt === "chay") dnRoiHoa();
        dnCu.tt = st.tt; dnCu.mau = mau; dnCu.nho = nho;
        $("nutDn").textContent = st.tt === "chay" ? "Tạm dừng đồng hồ" : st.tt === "dung" ? "▶ Chạy tiếp đồng hồ" : "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
      }
      daQua = st.tt === "het" ? 0 : Math.floor((st.tong - st.con) / 60000 + 1e-6);
      if (daQua !== dnCu.vach) { vach = $("dnVach").childNodes; for (a = 0; a < vach.length; a++) vach[a].setAttribute("class", a < daQua ? "qua" : ""); dnCu.vach = daQua; }
      if (mo < 1) dnHenF = requestAnimationFrame(dnVe);
      else dnHenT = setTimeout(dnVe, st.tt === "chay" ? 100 : 400);           // tạm dừng, hết giờ: chỉ còn theo dõi bảng nào đang che để thu gọn
    }
    function dnNhan(v) {
      dnV = v && typeof v === "object" ? v : null;
      if (dnHenT) { clearTimeout(dnHenT); dnHenT = 0; }
      if (dnHenF) { cancelAnimationFrame(dnHenF); dnHenF = 0; }
      $("nutDnTat").disabled = !dnV;
      if (!dnV) $("nutDn").textContent = "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
      dnVe();
    }
    $("nutDn").textContent = "▶ Đếm ngược " + DEM_NGUOC_PHUT + " phút";
    $("nutDn").onclick = function () { var st = dnTinh(dnV, T ? T.gio() : Date.now()); dnLenh(T, dnV, st && st.tt === "chay" ? "dung" : "chay"); $("caiDat").hidden = true; };
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
    $("nutMaGV").onclick = function () {           // mã QR riêng cho máy giáo viên: chỉ hiện khi thầy bấm
      var l = linkGV(), o = $("maGV"), q;
      if (window.qrcode) { q = window.qrcode(0, "M"); q.addData(l); q.make(); o.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } else o.textContent = "";
      o.setAttribute("data-link", l);
      $("linkGV").textContent = l; $("chepGV").textContent = "Chép link";
      $("caiDat").hidden = true; $("gvMa").hidden = false;
    };
    $("dongGvMa").onclick = function () { $("gvMa").hidden = true; };
    $("chepGV").onclick = function () {
      var b = $("chepGV");
      try { navigator.clipboard.writeText(linkGV()).then(function () { b.textContent = "Đã chép link"; }, function () { b.textContent = "Không chép được"; }); } catch (e) { b.textContent = "Không chép được"; }
    };
    $("nutToan").onclick = function () {
      var d = document;
      $("caiDat").hidden = true;
      if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () {});
    };
    hoiHaiLan($("nutMoHet"), "Bấm lần nữa", function () { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/mo"] = 1; }); T.update(o); });
    hoiHaiLan($("nutXoaHinh"), "Bấm lần nữa để xóa cả 4 hình", xoaHinh);
    hoiHaiLan($("nutLamLai"), "Bấm lần nữa để xóa hết", function () { lamLaiHet(); $("caiDat").hidden = true; });
    $("nutPhongMoi").onclick = function () {
      try { localStorage.setItem("xt-phong", maNgauNhien(5)); } catch (e) { /* bỏ qua */ }
      location.href = location.pathname + (thu ? "?thu=1" : "");
    };
    /* --- Đáp số: chỉ hiện khi thầy bấm --- */
    (function dungDapSo() {
      var hop = $("dapBang"), DAU = { thoi: " : 2", thang: " : 2" };
      KHOA_MANH.forEach(function (kh) {
        var M = MUC[kh], m = M.manh, h = H("div", "dap-hang", null, hop), o = H("span", "dap-hinh", null, h);
        svgManh(o, m, "#f1ece2", 9, 0.3);
        H("span", "dap-ten", M.ten + (M.so.length > 1 ? " × 2" : ""), h);
        var tinh = m.loai === "thoi" ? m.a + " × " + m.b + " : 2" : m.loai === "thang" ? "(" + m.L + " + " + m.l + ") × " + m.h + " : 2" : m.loai === "cn" ? m.w + " × " + m.h : m.b + " × " + m.h;
        H("span", "dap-tinh", tinh + " = " + M.dt + " (cm²)", h);
      });
      var tong = KHOA_MANH.map(function (kh) { return MUC[kh].dt + (MUC[kh].so.length > 1 ? " × 2" : ""); }).join(" + ");
      [["Tổng diện tích 10 mảnh", tong + " = " + TONG + " (cm²)"], ["Tấm thiệp", THIEP_D + " × " + THIEP_R + " = " + THIEP_S + " (cm²)"], ["Phần còn lại", THIEP_S + " − " + TONG + " = " + CON + " (cm²)"]].forEach(function (x) {
        var h = H("div", "dap-hang rong", null, $("dapCuoi")); H("span", "dap-ten", x[0], h); H("span", "dap-tinh", x[1], h);
      });
      void DAU;
    })();
    $("nutDapSo").onclick = function () { hienDapSo(true); };
    $("dongDapSo").onclick = function () { hienDapSo(false); };

    function trangThai(kieu) {
      var e = $("tvNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử trên một máy" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }
    $("tv").classList.add("xem-xep");
    veMa(); doiXem("vao");
    [1, 2, 3, 4].forEach(function (k) { veNhom(k, null); });
    noi(phong, thu, trangThai).then(function (t) {
      T = t;
      [1, 2, 3, 4].forEach(function (k) { T.on("n" + k, function (d) { veNhom(k, d); }); });
      var daGhiGV = false;
      T.on("gv", function (v) {
        if (typeof v === "string" && /^[a-z0-9]{6}$/.test(v)) { if (v !== maGV) { maGV = v; try { localStorage.setItem("xt-gv", phong + ":" + maGV); } catch (e) { /* bỏ qua */ } } }
        else if (!daGhiGV) { daGhiGV = true; T.set("gv", maGV); }
      });
      T.coMat("tv/" + layMayId());                // cho máy giáo viên biết tivi đang mở trang
      bao3d();
      T.on("lenh", nhanLenh);
      T.on("dn", dnNhan);
    });
  }

  /* ---------- máy giáo viên ----------
     Thầy dặn 15/11 19:18: "app của giáo viên sẽ hiện ra các nhóm sai từ 4 lần trở lên và nút mở khóa, phím Bước 2 bàn xếp cho từng nhóm. Phím tranh 3d."
     Link: ?p=<phòng>&gv=<mã giáo viên>, lấy ở tivi: Cài đặt → "Mã cho máy giáo viên". Trang này đọc n1..n4, gv, tv, tv3d và chỉ ghi:
       n<k>/khoa = null (Mở khóa);  n<k>/mo = 1 (Mở bước 2);  lenh = { i, v, k } (Tranh 3D, Dừng, Về báo tường: xem nhanLenh ở phần tivi).
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
      $("gvNoi").hidden = true;
      baoLoi("Link này thiếu mã phòng. Thầy quét lại mã ở tivi: Cài đặt, nút “Mã cho máy giáo viên”.");
      return;
    }
    function chay(k) { return coTv && !!tv && typeof tv.c === "string" && tv.c.charAt(k - 1) === "1"; }
    function daBam(k) { return coTv && !!tv && typeof tv.b === "string" && tv.b.charAt(k - 1) === "1"; }
    function lenh(v, k) { if (T) T.set("lenh", { i: maNgauNhien(8), v: v, k: k || 0 }); }
    [1, 2, 3, 4].forEach(function (k) {
      var o = H("section", "gv-nhom", null, $("gvDs")), h, kh, n, X = { o: o };
      o.id = "gvNhom" + k;
      o.style.setProperty("--m", MAU_NHOM[k]);
      h = H("div", "gv-hang1", null, o);
      H("b", "gv-so", "Nhóm " + k, h);
      X.tt = H("span", "gv-tt", "", h);
      X.may = H("span", "gv-may", "", h);
      kh = H("div", "gv-khoa", null, o); kh.hidden = true;
      X.khoa = kh;
      X.khoaChu = H("span", "gv-khoa-chu", "", kh);
      X.moKhoa = H("button", "nut gv-mo-khoa", "Mở khóa", kh);
      n = H("div", "gv-nut", null, o);
      X.b2 = H("button", "nut gv-b2", null, n);
      X.b2a = H("span", "gv-b2a", "Mở nhiệm vụ 2", X.b2); X.b2b = H("span", "gv-b2b", "bàn xếp", X.b2);
      X.b3 = H("button", "nut gv-3d", "▶ Tranh 3D", n);
      O[k] = X;
      X.moKhoa.onclick = function () { var u = {}; if (!T) return; u["n" + k + "/khoa"] = null; T.update(u); };
      X.b2.onclick = function () {
        var d = D[k] || {};
        if (!T || d.mo || d.xong) return;
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
    bamHaiLan($("gvMoHet"), "Bấm lần nữa để mở cho cả 4 nhóm", function () { var o = {}; if (!T) return; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/mo"] = 1; }); T.update(o); });
    bamHaiLan($("gvXoaHinh"), "Bấm lần nữa để xóa cả 4 hình", function () { var o = {}; if (!T) return; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/m"] = null; o["n" + k + "/xong"] = null; }); T.update(o); });
    bamHaiLan($("gvLamLai"), "Bấm lần nữa để xóa hết", function () { var o = { dn: null }; if (!T) return; [1, 2, 3, 4].forEach(function (k) { ["m", "xong", "d", "s", "mo", "khoa"].forEach(function (d) { o["n" + k + "/" + d] = null; }); }); T.update(o); });
    $("gvCdMo").onclick = function () { $("gvCd").hidden = !$("gvCd").hidden; $("gvCdMo").classList.toggle("dang-mo", !$("gvCd").hidden); };
    /* 15/11 22:12: hàng đếm ngược. Máy này ghi thẳng <phòng>/dn; tivi và máy này cùng tính giờ còn lại theo giờ máy chủ. */
    var dn = null, dnHoi = 0, dnDong = 0;
    function veDn() {
      var st = dnTinh(dn, T ? T.gio() : Date.now()), tt = st ? st.tt : "", dangHoi = Date.now() - dnHoi <= 3000;
      $("gvDnChu").innerHTML = "";
      if (!st) H("span", null, "Đồng hồ đếm ngược " + DEM_NGUOC_PHUT + " phút", $("gvDnChu"));
      else if (tt === "het") H("b", "het", "Hết giờ", $("gvDnChu"));
      else { H("span", null, tt === "dung" ? "Dừng ở " : "Còn ", $("gvDnChu")); H("b", null, dnChu(st.con), $("gvDnChu")); }
      $("gvDn").className = "gv-dn" + (tt ? " " + tt : "");
      $("gvDnChay").hidden = tt === "het";
      $("gvDnChay").textContent = tt === "chay" ? "Tạm dừng" : tt === "dung" ? "▶ Chạy tiếp" : "▶ Bắt đầu";
      $("gvDnChay").disabled = !coTv && tt !== "chay";
      $("gvDnTat").hidden = !st;
      $("gvDnTat").textContent = dangHoi && st ? "Bấm lần nữa" : tt === "het" ? "Tắt đồng hồ" : "Tắt";
      $("gvDnTat").classList.toggle("hoi", dangHoi && !!st);
      if (tt === "chay" && !dnDong) dnDong = setInterval(veDn, 250);
      if (tt !== "chay" && dnDong) { clearInterval(dnDong); dnDong = 0; }
    }
    $("gvDnChay").onclick = function () { var st = dnTinh(dn, T ? T.gio() : Date.now()); dnLenh(T, dn, st && st.tt === "chay" ? "dung" : "chay"); };
    $("gvDnTat").onclick = function () {
      var st = dnTinh(dn, T ? T.gio() : Date.now());
      if (!st) return;
      if (st.tt !== "het" && Date.now() - dnHoi > 3000) { dnHoi = Date.now(); veDn(); setTimeout(veDn, 3050); return; }     // đang chạy hay tạm dừng: bấm hai lần mới tắt
      dnHoi = 0; dnLenh(T, dn, "tat");
    };
    function ve(k) {
      var d = D[k] || {}, nhap = d.d || {}, s = d.s || {}, kh3 = d.khoa || {}, X = O[k];
      var pha = d.xong ? "xong" : d.mo ? "xep" : "nhap", nd = demDung(nhap), may = d.co ? Object.keys(d.co).length : 0;
      var ds = pha === "xong" ? [] : THU_TU.filter(function (kh) { return kh3[kh] && !nhap[kh]; });
      var choMo = pha === "nhap" && nd === THU_TU.length, dangHoi = pha === "nhap" && !choMo && Date.now() - (hoi[k] || 0) <= 3000, c3 = !!d.xong && chay(k);
      X.o.classList.toggle("bi-khoa", ds.length > 0); X.o.classList.toggle("cho-mo", choMo);
      X.tt.textContent = pha === "xong" ? "Đã hoàn thành hình" : pha === "xep" ? "Nhiệm vụ 2: đang xếp hình" : choMo ? "Xong nhiệm vụ 1, chờ mở nhiệm vụ 2" : nd || may ? "Nhiệm vụ 1: đúng " + nd + "/10" : "Chưa có máy nào vào";
      X.may.textContent = may ? may + " máy" : "";
      X.khoa.hidden = !ds.length;
      X.khoaChu.textContent = "Đã khóa: " + ds.map(function (kh) { return MUC[kh].ngan + " (sai " + (s[kh] || SAI_KHOA) + " lần)"; }).join(", ");
      X.b2.disabled = pha !== "nhap";
      X.b2a.textContent = pha !== "nhap" ? "Nhiệm vụ 2" : dangHoi ? "Bấm lần nữa để mở" : "Mở nhiệm vụ 2";
      X.b2b.textContent = pha !== "nhap" ? "đã mở" : dangHoi ? "nhóm chưa xong nhiệm vụ 1" : "bàn xếp";
      X.b2.classList.toggle("san", choMo); X.b2.classList.toggle("hoi", dangHoi);
      X.b3.disabled = !d.xong;
      X.b3.textContent = c3 ? "■ Dừng Tranh 3D" : "▶ Tranh 3D";
      X.b3.classList.toggle("dang-chay", c3);
      return ds.length > 0;
    }
    function veHet() {
      var chu = ma === "dung" ? "" : ma === "cho" ? "Đang nối với tivi…"
        : ma === "chua" ? "Chưa thấy tivi của phòng này. Thầy mở trang Xếp thiệp trên tivi trước, rồi quét lại mã ở Cài đặt, nút “Mã cho máy giáo viên”."
        : "Mã này không còn dùng được. Thầy quét lại mã ở tivi: Cài đặt, nút “Mã cho máy giáo viên”.";
      var dsK = [], l, n = 0, q = tt("q"), d = tt("d"), nv = tt("n"), conNhap = false;
      baoLoi(chu, ma === "cho");
      if (chu) return;
      [1, 2, 3, 4].forEach(function (k) { if (ve(k)) dsK.push(k); if (daBam(k)) n++; if (!(D[k] || {}).mo && !(D[k] || {}).xong) conNhap = true; });
      $("gvTom").textContent = dsK.length ? "Đang bị khóa: nhóm " + dsK.join(", nhóm ") : "Chưa có nhóm nào bị khóa";
      $("gvTom").classList.toggle("xau", dsK.length > 0);
      l = tt("l");
      $("gvTv").textContent = !coTv ? "Tivi chưa mở trang Xếp thiệp nên các nút cho tivi chưa có tác dụng." : "Tivi đang hiện " + (nv ? "bảng nhiệm vụ" : d ? "bảng đáp số" : l ? "to thiệp nhóm " + l : "báo tường") + ". Tranh 3D: đã bấm " + n + "/4 nhóm.";
      $("gvTv").classList.toggle("xau", !coTv);
      hai($("gvNv"), nv ? "Ẩn" : "Hiện"); $("gvNv").classList.toggle("dang-hien", !!nv);
      hai($("gvQr"), q ? "Ẩn" : "Hiện"); $("gvQr").classList.toggle("dang-hien", !!q);
      hai($("gvDap"), d ? "Ẩn" : "Hiện"); $("gvDap").classList.toggle("dang-hien", !!d);
      $("gvVe").disabled = !(l || d || nv);
      if (!$("gvMoHet").classList.contains("hoi")) $("gvMoHet").disabled = !conNhap;
      veDn();
    }
    veHet();
    noi(phong, thu, function (kieu) {
      var e = $("gvNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }).then(function (t) {
      T = t;
      T.on("gv", function (v) { ma = v === null || v === undefined ? "chua" : String(v) === String(ts.gv) ? "dung" : "sai"; veHet(); });
      [1, 2, 3, 4].forEach(function (k) { T.on("n" + k, function (d) { D[k] = d || {}; veHet(); }); });
      T.on("tv3d", function (v) { tv = v && typeof v === "object" ? v : null; veHet(); });
      T.on("tv", function (v) { coTv = !!v && typeof v === "object" && Object.keys(v).length > 0; veHet(); });
      T.on("dn", function (v) { dn = v && typeof v === "object" ? v : null; veDn(); });
    });
  }

  /* cho bài thử gọi các hàm hình học */
  window.XT = { BO: BO, MUC: MUC, THU_TU: THU_TU, TONG: TONG, CON: CON, kiemMuc: kiemMuc, daGiac: daGiac, toaDo: toaDo, doLun: doLun, dayVec: dayVec, kcDaGiac: kcDaGiac, cachChinh: cachChinh, canChinh: canChinh, vaoGiua: vaoGiua, giuTrong: giuTrong, vaoLuoi: vaoLuoi, trongTam: trongTam, BOCUC: BOCUC, NHOM: NHOM, NHE: NHE, viTriDau: viTriDau, duChung: duChung, nacXoay: nacXoay, nacKe: nacKe, nacGan: nacGan, MAU_DAU: MAU_DAU, GOC_MAU: GOC_MAU, THIEP: THIEP, TL_MANH: TL_MANH, cuaSo: cuaSo, mauXep: mauXep, luoiGoc: luoiGoc, giongMau: giongMau, dtGiao: dtGiao, MOC_GIONG: MOC_GIONG, kcDaGiacDiem: kcDiem, mo: mo, goi: goi, dat: function (o) { if (o.de !== undefined) NHE.de = o.de; if (o.xaTach !== undefined) XA_TACH = o.xaTach; } };

  function batDau() {
    var ts = thamSo();
    if (ts.gv !== undefined) chayGiaoVien(ts); else if (ts.n !== undefined || ts.dt !== undefined) chayDienThoai(ts); else chayTivi(ts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", batDau); else batDau();
})();
