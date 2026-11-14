/* Xếp thiệp (bản 14/11/2026, sửa theo lời thầy lúc 13:21 và 13:23): mỗi nhóm dùng điện thoại hoặc máy tính bảng, tivi theo dõi 4 nhóm cùng lúc.
   Bước 1 (điện thoại): đo, tính rồi nhập số đo và diện tích của 7 loại mảnh (2 mảnh giống nhau chỉ nhập một lần),
            tổng diện tích 10 mảnh, tấm thiệp, phần còn lại. Đúng phần còn lại thì bàn xếp mở.
   Bước 2: 10 mảnh nằm sẵn trên bàn có lưới, các em chỉ kéo và xoay. Không có nam châm, không tự đẩy: thả mảnh đè lên mảnh khác thì vẫn để yên.
   Bước 3: bấm Hoàn thành. Còn mảnh đè lên nhau thì hiện bảng báo mảnh số mấy cần chỉnh. Mảnh còn nằm rời thì báo "chưa nhận ra hình".
            Hình ổn thì hiện bảng xác nhận; nhóm đồng ý thì máy chỉnh nhẹ rồi đưa hình vào giữa chỗ dán của thiệp 29 × 42.
   Tivi: mở trang không có tham số. Màn làm bài là tấm báo tường A0; bài của mỗi nhóm hiện ngay trên tấm thiệp của nhóm đó, đúng ô dán trên báo tường.
         Ảnh báo tường có hình thầy cô nên KHÔNG nằm trên mạng: trang chỉ lấy ảnh thầy chọn từ máy (lưu trong trình duyệt của máy đó).
   Điện thoại: quét mã QR trên tivi (?p=<mã phòng>&n=<nhóm>).
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
  var HO_DAU = 1;                               // lúc mới mở bàn xếp, các mảnh nằm sẵn cách nhau 1 cm (lớn hơn NHE.xa): chưa xếp thì máy không coi là hình
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
  /* bố cục thiệp đã cắt 29 × 42 cm (bản in 13/11): khung = khung tiêu đề, dan = chỗ dán hình, ngan = vạch ngăn chuỗi hạt, viet = chỗ ghi lời chúc */
  var BOCUC = {
    dung: { W: 29, H: 42, khung: [0.8, 1.0, 28.2, 4.4], dan: [1.5, 5.0, 27.5, 31.0], ngan: ["ngang", 31.8], viet: [1.7, 33.4, 27.3, 41.4] },
    ngang: { W: 42, H: 29, khung: [2.6, 1.1, 30.6, 4.5], dan: [1.5, 4.6, 32.0, 27.6], ngan: ["doc", 32.6], viet: [33.4, 2.5, 41.4, 28.1] }
  };
  var NHOM = { 1: "dung", 2: "dung", 3: "ngang", 4: "ngang" };
  var DONG1 = "CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG";
  var DONG2 = "TRƯỜNG THCS PHAN TÂY HỒ (14/12/1976 – 14/12/2026)";

  /* ---------- các mục phải nhập ở bước 1 ---------- */
  function dienTich(m) { return m.loai === "thoi" ? m.a * m.b / 2 : m.loai === "thang" ? (m.L + m.l) * m.h / 2 : m.loai === "cn" ? m.w * m.h : m.b * m.h; }
  var KHOA_MANH = ["t1", "t2", "g1", "g2", "cn", "v", "bh"];
  var THU_TU = KHOA_MANH.concat(["tong", "thiep", "con"]);
  var MUC = {
    t1: { so: [1], ten: "Hình thoi (mảnh to)" },
    t2: { so: [2, 3], ten: "Hình thoi (mảnh nhỏ)" },
    g1: { so: [4], ten: "Hình thang cân (mảnh to)" },
    g2: { so: [5], ten: "Hình thang cân (mảnh nhỏ)" },
    cn: { so: [6], ten: "Hình chữ nhật" },
    v: { so: [7, 8], ten: "Hình vuông" },
    bh: { so: [9, 10], ten: "Hình bình hành" },
    tong: { ten: "Tổng diện tích 10 mảnh" },
    thiep: { ten: "Tấm thiệp" },
    con: { ten: "Phần còn lại" }
  };
  var TONG = 0, TONG_MOT = 0, THIEP_D = 42, THIEP_R = 29, THIEP_S = THIEP_D * THIEP_R;
  BO.forEach(function (m) { TONG += dienTich(m); });
  KHOA_MANH.forEach(function (kh) {
    var M = MUC[kh], m = BO[M.so[0] - 1];
    M.manh = m; M.dt = dienTich(m); TONG_MOT += M.dt;
    if (m.loai === "thoi") { M.o = [{ nhan: "Đường chéo thứ nhất", dung: m.a }, { nhan: "Đường chéo thứ hai", dung: m.b }]; M.tuDo = true; }
    else if (m.loai === "thang") M.o = [{ nhan: "Đáy lớn", dung: m.L }, { nhan: "Đáy bé", dung: m.l }, { nhan: "Chiều cao", dung: m.h }];
    else if (m.loai === "cn" && m.w !== m.h) M.o = [{ nhan: "Chiều dài", dung: m.w }, { nhan: "Chiều rộng", dung: m.h }];
    else if (m.loai === "cn") M.o = [{ nhan: "Cạnh", dung: m.w }];
    else M.o = [{ nhan: "Cạnh đáy", dung: m.b }, { nhan: "Chiều cao", dung: m.h }];
    M.o.push({ nhan: M.so.length > 1 ? "Diện tích 1 mảnh" : "Diện tích", dung: M.dt, dv: "cm²" });
  });
  var CON = THIEP_S - TONG;
  MUC.tong.o = [{ nhan: "Tổng diện tích", dung: TONG, dv: "cm²" }];
  MUC.thiep.o = [{ nhan: "Chiều dài", dung: THIEP_D }, { nhan: "Chiều rộng", dung: THIEP_R }, { nhan: "Diện tích", dung: THIEP_S, dv: "cm²" }];
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
  function vaoLuoi(goc, st, v) {                  // mảnh đặt thẳng (góc là bội của 90°): dời cho các đỉnh nằm trên mắt lưới nửa ô
    var r = ((st.r % 90) + 90) % 90;
    if (r > 0.01 && r < 89.99) return false;
    var p = toaDo(goc, st)[0];
    st.x += Math.round((p[0] - v[0]) / O_LUOI) * O_LUOI + v[0] - p[0];
    st.y += Math.round((p[1] - v[1]) / O_LUOI) * O_LUOI + v[1] - p[1];
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
  function vaoGiua(ds, vung) {                    // đưa cả hình vào giữa chỗ dán (dời theo bội của nửa ô lưới)
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ds.forEach(function (A) { var k = khung(toaDo(A.goc, A.st)); x0 = Math.min(x0, k[0]); y0 = Math.min(y0, k[1]); x1 = Math.max(x1, k[2]); y1 = Math.max(y1, k[3]); });
    var dx = Math.round(((vung[0] + vung[2]) / 2 - (x0 + x1) / 2) / O_LUOI) * O_LUOI, dy = Math.round(((vung[1] + vung[3]) / 2 - (y0 + y1) / 2) / O_LUOI) * O_LUOI;
    dx = Math.max(vung[0] - x0, Math.min(vung[2] - x1, dx)); dy = Math.max(vung[1] - y0, Math.min(vung[3] - y1, dy));
    ds.forEach(function (A) { A.st.x += dx; A.st.y += dy; });
  }

  /* Chỗ nằm sẵn của 10 mảnh khi mới mở bàn xếp (thầy dặn 14/11: "mới vào thì các hình sẽ hiện sẵn trên các ô lưới luôn").
     Xếp thành từng hàng từ mép trên chỗ dán, mảnh cách mảnh HO_DAU cm, đỉnh nằm trên mắt lưới nửa ô, chưa mảnh nào chạm mảnh nào.
     Mảnh chưa ai kéo thì KHÔNG có trong dữ liệu: điện thoại và tivi đều hiểu là mảnh đang nằm ở chỗ này. Trả về [{x, y}] theo số mảnh. */
  var THU_TU_DAU = [1, 7, 8, 5, 4, 6, 2, 3, 9, 10];
  function viTriDau(dan) {
    var goc = BO.map(daGiac), rong = dan[2] - dan[0], hang = [], h = null, ra = [], y = dan[1] + HO_DAU;
    THU_TU_DAU.forEach(function (so) {
      var kh = khung(goc[so - 1]), w = kh[2] - kh[0], cao = kh[3] - kh[1];
      if (!h || h.w + HO_DAU + w > rong - 0.5 + 1e-6) { h = { w: 0, cao: 0, ds: [] }; hang.push(h); }
      h.ds.push({ so: so, kh: kh, x: h.w + (h.ds.length ? HO_DAU : 0), cao: cao });
      h.w += (h.ds.length > 1 ? HO_DAU : 0) + w; h.cao = Math.max(h.cao, cao);
    });
    hang.forEach(function (h2) {
      var x0 = dan[0] + Math.floor((rong - h2.w) / 2 / O_LUOI + 1e-6) * O_LUOI;
      h2.ds.forEach(function (m) { ra[m.so - 1] = { x: x0 + m.x - m.kh[0], y: y + (h2.cao - m.cao) / 2 - m.kh[1] }; });
      y += h2.cao + HO_DAU;
    });
    return ra;
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
      var db = app.database(), base = db.ref(NHANH + "/" + phong), coMat = [];
      db.ref(".info/connected").on("value", function (s) {
        bao(s.val() ? "ok" : "cho");
        if (s.val()) coMat.forEach(function (r) { r.onDisconnect().remove(); r.set(true); });
      });
      function loi(e) { if (e) { console.error(e); bao("loi", (e.code || e.message || e) + ""); } }
      return {
        kieu: "firebase",
        set: function (p, v) { base.child(p).set(v, loi); },
        update: function (o) { base.update(o, loi); },            // nhiều đường dẫn một lần; giá trị null là xóa
        remove: function (p) { base.child(p).remove(loi); },
        on: function (p, cb) { (p ? base.child(p) : base).on("value", function (s) { cb(s.val()); }, loi); },
        coMat: function (p) { var r = base.child(p); coMat.push(r); r.onDisconnect().remove(); r.set(true); }
      };
    });
  }
  function noiCungMay(phong, bao) {                // các thẻ trên cùng một máy: BroadcastChannel + localStorage
    var KHOA = "xt-" + phong, nghe = [], kenh = null, cay = doc();
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
      set: ghi,
      update: function (o) { cay = doc(); Object.keys(o).forEach(function (p) { dat(p, o[p]); }); luu(); phat(""); if (kenh) { try { kenh.postMessage({ p: "" }); } catch (e) { /* bỏ qua */ } } },
      remove: function (p) { ghi(p, null); },
      on: function (p, cb) { nghe.push({ p: p, cb: cb }); cb(lay(p)); },
      coMat: function (p) { ghi(p, true); window.addEventListener("pagehide", function () { ghi(p, null); }); }
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

  /* ---------- vẽ tấm thiệp (bản in 13/11): khung tiêu đề kiểu nhãn vở, vạch ngăn chuỗi hạt, dòng chấm ghi lời chúc ---------- */
  function duongNhan(X0, Y0, X1, Y1, e, R) {      // chữ nhật khuyết 4 góc theo cung tròn tâm ở góc; e = lùi vào trong, R = bán kính cung
    var d = Math.sqrt(R * R - e * e), A = "A" + R + " " + R + " 0 0 0 ";
    return "M" + (X0 + d) + " " + (Y0 + e) + "L" + (X1 - d) + " " + (Y0 + e) + A + (X1 - e) + " " + (Y0 + d) +
      "L" + (X1 - e) + " " + (Y1 - d) + A + (X1 - d) + " " + (Y1 - e) + "L" + (X0 + d) + " " + (Y1 - e) + A + (X0 + e) + " " + (Y1 - d) +
      "L" + (X0 + e) + " " + (Y0 + d) + A + (X0 + d) + " " + (Y0 + e) + "Z";
  }
  function thoiTam(cx, cy, w, h) { return [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]].map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "); }
  function veTrangTri(g, k) {
    var bc = BOCUC[NHOM[k]], kh = bc.khung, v = bc.viet, i, j;
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

  /* =====================================================================
     ĐIỆN THOẠI
     ===================================================================== */
  function chayDienThoai(ts) {
    var k = parseInt(ts.n, 10), phong = ts.p;
    document.body.className = "dt";
    $("dt").hidden = false;
    if (!phong) { $("dtCho").hidden = false; $("dtChoChu").textContent = "Thầy mở trang này trên tivi, rồi các em quét mã QR của nhóm mình."; return; }
    if (!(k >= 1 && k <= 4)) {
      $("dtChon").hidden = false;
      [1, 2, 3, 4].forEach(function (i) {
        var b = H("button", "nut chon-nhom", "Nhóm " + i, $("dtChonNut"));
        b.onclick = function () { location.search = "?p=" + encodeURIComponent(phong) + "&n=" + i + (ts.thu ? "&thu=1" : ""); };
      });
      return;
    }
    document.body.setAttribute("data-nhom", k);
    var bc = BOCUC[NHOM[k]], dan = bc.dan, mau = MAU[k], goc = BO.map(daGiac);
    var T = null, nhap = {}, sai = {}, daMo = false, xong = false, man = "nhap", lanDau = true;
    var manh = [], chon = null, keo = null, xoay2 = null, tro = {}, guiCho = {}, guiLuc = {}, chuaNhan = null, baoDe = null, dangChot = false;
    var to = window.innerWidth >= 700 && window.innerHeight >= 700;
    var mayId = (function () {
      var v = null; try { v = sessionStorage.getItem("xt-may"); } catch (e) { v = null; }
      if (!v) { v = maNgauNhien(6); try { sessionStorage.setItem("xt-may", v); } catch (e) { /* bỏ qua */ } }
      return v;
    })();
    $("dtNhom").textContent = "Nhóm " + k;
    $("dtChinh").hidden = false;
    giuSang();
    function duocXep() { return daMo || !!nhap.con; }
    function du7() { return KHOA_MANH.every(function (kh) { return nhap[kh]; }); }

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
        var M = MUC[kh], o = oManh[kh], d = nhap[kh];
        o.nut.classList.toggle("xong", !!d); o.nut.classList.toggle("sao", d === "s");
        o.than.setAttribute("fill", d ? mau[M.so[0] - 1] : MAU_XAM);
        o.nut.querySelector(".o-dau").textContent = d === "s" ? "★" : d ? "✓" : "";
        o.nut.querySelector(".o-kq").textContent = d ? M.dt + " cm²" : "";
      });
      ["tong", "thiep", "con"].forEach(function (kh) {
        var b = oDong[kh], d = nhap[kh], kq = b.querySelector(".dong-kq"), khoa = khoaMuc(kh), o = MUC[kh].o;
        b.classList.toggle("xong", !!d); b.classList.toggle("khoa", !d && !!khoa);
        kq.textContent = d ? (d === "s" ? "★ " : "✓ ") + o[o.length - 1].dung + " cm²" : khoa ? khoa : "Chạm để nhập";
      });
      var n = demDung(nhap), loi = $("nhapLoi");
      loi.className = "nhap-loi";
      if (nhap.con) { loi.textContent = "Đúng hết rồi! Phần còn trống rộng " + CON + " cm²: chỗ để ghi lời chúc và trang trí thêm."; loi.classList.add("tot"); }
      else if (daMo) loi.textContent = "Thầy đã mở bàn xếp. Các em vẫn nhập tiếp số đo được. Đã đúng " + n + "/10.";
      else loi.textContent = n ? "Đã đúng " + n + "/10. Chạm mảnh chưa có màu để nhập tiếp." : "Đo từng mảnh, tính diện tích rồi chạm vào mảnh để nhập. Hai mảnh giống nhau chỉ nhập một lần.";
      $("nhapSang").disabled = !duocXep();
      $("nhapSang").textContent = duocXep() ? "Sang bàn xếp" : "Đúng phần còn lại thì mở bàn xếp";
      $("dtSoDo").textContent = "Số đo " + n + "/10";
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
        sv2.style.aspectRatio = W + " / " + Hh; sv2.style.maxWidth = Math.round(W * (to ? 9 : 5)) + "px";
        S("rect", { x: 0, y: 0, width: W * U, height: Hh * U, fill: "#fff", stroke: "#4d4541", "stroke-width": 3 }, sv2);
        var gtt = S("g", { opacity: 0.55 }, sv2); veTrangTri(gtt, k);
      } else {
        H("p", "o-chu", "Dán đủ 10 mảnh lên thiệp, không mảnh nào chồng lên nhau. Phần giấy còn trống rộng bao nhiêu?", o);
      }
    }
    function veO() {
      var kh = O.kh, M = MUC[kh], d = nhap[kh], hop = $("oO");
      $("oTen").textContent = M.ten + (M.so && M.so.length > 1 ? " · có 2 mảnh" : "");
      hop.textContent = "";
      M.o.forEach(function (x, i) {
        var b = H("button", "o-dong", null, hop);
        H("span", "o-nhan", x.nhan, b);
        var so = H("span", "o-so", d ? String(x.dung) : O.v[i], b);
        H("span", "o-dv", x.dv || "cm", b);
        if (d) b.classList.add("dung");
        else {
          if (i === O.i) b.classList.add("dang");
          if (O.kq && O.v[i] !== "" && O.kq.v[i] === O.v[i]) b.classList.add(O.kq.dung[i] ? "dung" : "sai");
          if (!O.v[i] && i === O.i) so.classList.add("nhay");
          b.onclick = function () { O.i = i; veO(); };
        }
      });
      var bao = $("oBao");
      bao.className = "o-bao " + (d ? "tot" : O.lopBao);
      bao.textContent = d ? (d === "s" ? "Đúng rồi! Đúng ngay lần đầu nên nhóm được 1 ngôi sao." : "Đúng rồi!") : O.bao;
      $("oPhim").classList.toggle("tat", !!d);
      $("oKiem").disabled = !!d || !T;
      $("oKiem").textContent = d ? "Đã đúng" : "Kiểm tra";
      var hinh = $("oHinh").querySelector(".o-svg .than");
      if (hinh && M.manh) hinh.setAttribute("fill", d ? mau[M.so[0] - 1] : "#f1ece2");
    }
    function bam(p) {
      if (!O.kh || nhap[O.kh]) return;
      var n = MUC[O.kh].o.length, s = O.v[O.i];
      if (p === "tiep") O.i = (O.i + 1) % n;
      else if (p === "xoa") { if (s) O.v[O.i] = s.slice(0, -1); else if (O.i > 0) O.i--; }
      else if (s.length < 4 && !(s === "" && p === "0")) O.v[O.i] = s + p;
      veO();
    }
    $("oKiem").onclick = function () {
      var kh = O.kh; if (!kh || nhap[kh] || !T) return;
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
        T.set("n" + k + "/s/" + kh, sai[kh]);
        O.bao = kq.goi; O.lopBao = "xau";
        var saiDau = kq.dung.indexOf(false); if (saiDau >= 0) O.i = saiDau;
        veO();
      }
    };
    $("nhapSang").onclick = function () { if (duocXep()) { man = "xep"; doiMan(); } };
    $("dtSoDo").onclick = function () { man = "nhap"; doiMan(); };

    /* ---------------- bước 2: bàn xếp có lưới, 10 mảnh nằm sẵn ---------------- */
    var svg = $("dtBan"), lopManh = null, dauSan = viTriDau(dan);
    svg.setAttribute("viewBox", [dan[0] * U, dan[1] * U, (dan[2] - dan[0]) * U, (dan[3] - dan[1]) * U].join(" "));
    veLuoi(S("g", { "class": "lop-luoi" }, svg), dan);
    lopManh = S("g", {}, svg);
    function macDinh(i) { return { x: dauSan[i].x, y: dauSan[i].y, r: 0, f: 0, t: 0 }; }   // chỗ nằm sẵn của mảnh thứ i

    function coBan() {                            // chỉnh cỡ bàn xếp và tấm thiệp cho vừa màn hình
      var o = $("dtKhungBan"), w = o.clientWidth, h = o.clientHeight, tl = (dan[2] - dan[0]) / (dan[3] - dan[1]);
      if (w && h) { var bw = Math.min(w, h * tl); svg.style.width = Math.floor(bw) + "px"; svg.style.height = Math.floor(bw / tl) + "px"; }
      var o2 = $("thiepKhung"), w2 = o2.clientWidth, h2 = o2.clientHeight, tl2 = bc.W / bc.H;
      if (w2 && h2) { var tw = Math.min(w2, h2 * tl2); $("dtThiep").style.width = Math.floor(tw) + "px"; $("dtThiep").style.height = Math.floor(tw / tl2) + "px"; }
    }
    window.addEventListener("resize", coBan);
    window.addEventListener("orientationchange", function () { setTimeout(coBan, 250); });

    /* cả 10 mảnh có sẵn trên bàn ngay từ đầu (không còn khay, không còn nút Cất) */
    manh = goc.map(function (g, i) { return { so: i + 1, on: true, st: macDinh(i), g: veManh(lopManh, g, mau[i], i + 1, true), chay: 0 }; });
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
      (chuaNhan || []).forEach(function (i) { le[i] = 1; });
      manh.forEach(function (m, i) {
        m.g.classList.toggle("chon", chon === i && !dangChot);
        m.g.classList.toggle("chong", !!de[i]);
        m.g.classList.toggle("le", !!le[i]);
      });
      var nhac = $("dtNhac");
      nhac.className = "nhac";
      if (dangChot) { nhac.textContent = "Máy đang chỉnh lại hình cho ngay ngắn…"; nhac.classList.add("tot"); }
      else if (baoDe) { nhac.textContent = "Mảnh viền đỏ đang đè lên mảnh khác. Em chỉnh lại rồi bấm Hoàn thành nhé."; nhac.classList.add("xau"); }
      else if (chuaNhan) { nhac.textContent = "Mảnh viền cam còn nằm rời. Em xếp các mảnh sát nhau thành hình rồi bấm Hoàn thành nhé."; nhac.classList.add("xau"); }
      else if (chon === null) nhac.textContent = "Kéo từng mảnh để xếp thành hình. Xếp xong thì bấm Hoàn thành.";
      else nhac.textContent = "Chạm mảnh đang chọn để xoay, hoặc xoay bằng hai ngón. Xếp xong thì bấm Hoàn thành.";
      var cm = chon !== null && !dangChot;
      $("dtTrai").disabled = $("dtPhai").disabled = !cm;
      $("dtLat").disabled = !(cm && BO[chon].loai === "bh");
      $("dtXong").disabled = dangChot || !T;
      $("dtLai").disabled = dangChot || !T;
    }
    function tha(i, tu) {                         // thả mảnh: vào lưới, giữ trong bàn, gửi. Đè lên mảnh khác thì vẫn để yên (thầy dặn 14/11: bỏ tự đẩy)
      var m = manh[i];
      tu = tu || { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
      vaoLuoi(goc[i], m.st, dan);
      giuTrong(goc[i], m.st, dan);
      chuaNhan = null; baoDe = null;
      truot(m, tu, 140); ve(m); gui(m, true); capNhat();
    }
    function xoay(d) {
      if (chon === null || dangChot) return;
      var m = manh[chon], tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
      m.st.r = chuanGoc(Math.round((m.st.r + d) / BUOC_XOAY) * BUOC_XOAY);
      leTren(m); tha(chon, tu);
    }
    $("dtTrai").onclick = function () { xoay(-BUOC_XOAY); };
    $("dtPhai").onclick = function () { xoay(BUOC_XOAY); };
    $("dtLat").onclick = function () {
      if (chon === null || dangChot) return;
      var m = manh[chon]; m.st.f = m.st.f ? 0 : 1; leTren(m); tha(chon);
    };
    var hoiLai = 0;
    $("dtLai").onclick = function () {             // Làm lại (bấm 2 lần): 10 mảnh trượt về chỗ nằm sẵn
      var b = $("dtLai");
      if (!T || dangChot) return;
      if (Date.now() - hoiLai > 3000) { hoiLai = Date.now(); b.textContent = "Bấm lần nữa để xếp lại từ đầu"; b.classList.add("hoi"); setTimeout(function () { b.textContent = "Làm lại"; b.classList.remove("hoi"); }, 3000); return; }
      hoiLai = 0; b.textContent = "Làm lại"; b.classList.remove("hoi");
      manh.forEach(function (m, i) {
        var tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
        clearTimeout(guiCho[m.so]); guiCho[m.so] = null;
        m.st = macDinh(i); truot(m, tu, 320);
      });
      chon = null; chuaNhan = null; baoDe = null;
      xepLop();
      T.remove("n" + k + "/m");
      capNhat();
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
      return { ds: ds, kq: canChinh(ds, dan) };
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
        baoDe = tren; chuaNhan = null; chon = null; capNhat();
        moHop({ kieu: "de", ten: "Còn mảnh đè lên nhau", dong: dong, chinh: "Chỉnh lại" });
        return false;
      }
      if (!kq.ok) {
        dong.push(kq.le.length <= 4 ? "Mảnh " + noiSo(kq.le) + " còn nằm rời." : "Còn " + kq.le.length + " mảnh nằm rời (viền cam).");
        dong.push({ chu: "Em xếp các mảnh sát nhau thành hình rồi bấm Hoàn thành nhé.", lop: "dam" });
        chuaNhan = kq.le; baoDe = null; chon = null; capNhat();
        moHop({ kieu: "le", ten: "Máy chưa nhận ra hình", dong: dong, chinh: "Xếp tiếp" });
        return false;
      }
      return true;
    }
    /* --- Hoàn thành: xét hình trước; hình ổn thì hỏi xác nhận; nhóm đồng ý thì chỉnh nhẹ, đưa hình vào giữa thiệp, báo cho tivi --- */
    function chot() {
      if (!T || dangChot) return;
      var x = xetHinh();
      if (!baoKetQua(x.kq)) return;                 // máy khác của nhóm vừa kéo lệch hình đi
      var ds = x.ds, gom = {};
      vaoGiua(ds, dan);
      dangChot = true; chon = null; chuaNhan = null; baoDe = null;
      manh.forEach(function (m, i) {
        var tu = { x: m.st.x, y: m.st.y, r: m.st.r, f: m.st.f };
        clearTimeout(guiCho[m.so]); guiCho[m.so] = null;
        m.st = ds[i].st; truot(m, tu, 600);
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
      return [dan[0] + (e.clientX - r.left) / r.width * (dan[2] - dan[0]), dan[1] + (e.clientY - r.top) / r.height * (dan[3] - dan[1])];
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
      var el = e.target.closest ? e.target.closest("[data-so]") : null, p = cm(e);
      if (el) {
        var i = parseInt(el.getAttribute("data-so"), 10) - 1, da = chon === i;
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
        giuTrong(goc[chon], m2.st, dan); ve(m2); gui(m2); return;
      }
      if (!keo || keo.id !== e.pointerId) return;
      if (!keo.dong && Math.hypot(e.clientX - keo.px, e.clientY - keo.py) > 6) { keo.dong = true; manh[keo.i].chay = 0; }
      if (!keo.dong) return;
      var p = cm(e), m = manh[keo.i];
      m.st.x = keo.x0 + p[0] - keo.p0[0]; m.st.y = keo.y0 + p[1] - keo.p0[1];
      giuTrong(goc[keo.i], m.st, dan); ve(m); gui(m);
    });
    function nha(e) {
      if (!tro[e.pointerId]) return;
      delete tro[e.pointerId];
      if (xoay2) {
        if (Object.keys(tro).length < 2) {
          xoay2 = null;
          if (chon !== null) {                     // góc gần bội của 15° (lệch dưới 4°) thì về đúng bội đó
            var m3 = manh[chon], tron = Math.round(m3.st.r / BUOC_XOAY) * BUOC_XOAY, tu3 = { x: m3.st.x, y: m3.st.y, r: m3.st.r, f: m3.st.f };
            if (Math.abs(m3.st.r - tron) <= 4) m3.st.r = chuanGoc(tron);
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
      $("dtTen").textContent = ten === "nhap" ? "Bước 1: Đo và tính" : ten === "xep" ? "Bước 2: Xếp hình" : "Tấm thiệp đã xong";
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
      T.coMat("n" + k + "/co/" + mayId);
      T.on("n" + k, function (d) {                 // mọi thay đổi của nhóm: số đo đã đúng, vị trí mảnh, đã hoàn thành
        d = d || {};
        nhap = d.d || {}; sai = d.s || {}; daMo = !!d.mo;
        var o = d.m || {};
        manh.forEach(function (m, i) {
          if ((keo && keo.i === i && keo.dong) || (xoay2 && chon === i) || guiCho[m.so] || dangChot) return;
          var st = mo(o["p" + m.so]) || macDinh(i);      // chưa ai kéo mảnh này: nó nằm ở chỗ sẵn
          if (m.chay && Math.abs(st.x - m.st.x) < 0.002 && Math.abs(st.y - m.st.y) < 0.002 && Math.abs(lechGoc(st.r - m.st.r)) < 0.02) return;   // tiếng vọng của chính mình, đang trượt dở
          m.chay = 0; m.st = st;
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
  /* chỗ đặt 3 ô Tổng, Thiệp, Phần còn lại trên tấm thiệp lúc nhóm còn đo và tính (cm, tính từ tâm chỗ dán hình); nằm dưới các mảnh đang nằm sẵn */
  var CHO_O = { tong: [-9.5, 10, 6, "Tổng"], thiep: [-1.75, 10, 6.5, "Thiệp"], con: [7.75, 10, 9.5, "Phần còn lại"] };

  /* Một tấm thiệp trên báo tường (tivi): giấy, trang trí thiệp, lưới bàn xếp, 3 ô theo dõi, 10 mảnh.
     10 mảnh luôn có mặt: lúc đo và tính thì mảnh xám, loại nào nhập đúng thì lên màu và có dấu ✓ (★ nếu đúng ngay lần đầu) trên mảnh đầu của loại đó. */
  function dungKhung(svg, k) {
    var bc = BOCUC[NHOM[k]], W = bc.W * U, Hh = bc.H * U, dan = bc.dan, goc = BO.map(daGiac);
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hh);
    S("rect", { "class": "giay", x: 0, y: 0, width: W, height: Hh }, svg);
    veTrangTri(S("g", { "class": "lop-tt" }, svg), k);
    veLuoi(S("g", { "class": "lop-luoi" }, svg), dan);
    var ln = S("g", { "class": "lop-nhap" }, svg), cx = (dan[0] + dan[2]) / 2, cy = (dan[1] + dan[3]) / 2, muc = {};
    ["tong", "thiep", "con"].forEach(function (kh) {
      var c = CHO_O[kh], x = (cx + c[0]) * U, y = (cy + c[1]) * U, w = c[2] * U;
      var o = S("g", { "class": "muc o-chu", transform: "translate(" + x + " " + y + ")" }, ln);
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
    return { muc: muc, lop: lop, g: g, khoaCua: khoaCua, dau: viTriDau(dan) };
  }

  function chayTivi(ts) {
    document.body.className = "tv";
    $("tv").hidden = false;
    var phong = ts.p, thu = ts.thu, T = null, goc = BO.map(daGiac), khungNhom = {}, duLieu = {}, xem = "vao", lon = 0;
    if (!phong) { try { phong = localStorage.getItem("xt-phong"); } catch (e) { phong = null; } }
    if (!phong || !/^[a-z0-9]{3,12}$/.test(phong)) phong = maNgauNhien(5);
    try { localStorage.setItem("xt-phong", phong); } catch (e) { /* bỏ qua */ }
    giuSang();

    function coGian() {
      var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      $("tv").style.transform = "translate(-50%,-50%) scale(" + s + ")";
    }
    window.addEventListener("resize", coGian); coGian();

    function link(k) { return location.origin + location.pathname + "?p=" + phong + "&n=" + k + (thu ? "&thu=1" : ""); }
    function veMa() {
      [1, 2, 3, 4].forEach(function (k) {
        var o = $("ma" + k); o.textContent = "";
        if (window.qrcode) {
          var q = window.qrcode(0, "M"); q.addData(link(k)); q.make();
          o.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        } else o.textContent = link(k);
        o.setAttribute("data-link", link(k));
      });
      $("maPhong").textContent = phong;
    }

    [1, 2, 3, 4].forEach(function (k) {
      var o = $("khung" + k), svg = o.querySelector("svg.thiep"), K = dungKhung(svg, k);
      K.o = o; K.hien = {}; K.thuTu = ""; K.tt = o.querySelector(".tt"); K.sao = o.querySelector(".so-sao"); K.xong = false; K.pha = "";
      khungNhom[k] = K;
      o.querySelector(".the").onclick = function () { phong_to(k); };
      svg.onclick = function () { phong_to(k); };
      o.querySelector(".mo-ban").onclick = function (e) { e.stopPropagation(); if (T) T.set("n" + k + "/mo", 1); };
    });
    function phong_to(k) {                        // chạm một khung: hiện riêng khung đó thật lớn, chạm lần nữa để về
      lon = lon === k ? 0 : k;
      [1, 2, 3, 4].forEach(function (i) { khungNhom[i].o.classList.toggle("lon", lon === i); khungNhom[i].o.classList.toggle("an", lon && lon !== i); });
      $("tv").classList.toggle("dang-lon", !!lon);
    }

    function veNhom(k, d) {
      d = d || {}; duLieu[k] = d;
      var K = khungNhom[k], m = d.m || {}, nhap = d.d || {}, ds = [], so, mau = MAU[k];
      var pha = d.xong ? "xong" : (d.mo || nhap.con) ? "xep" : "nhap";
      if (pha === "xong" && K.pha && K.pha !== "xong") { K.o.classList.add("chot"); clearTimeout(K.hen); K.hen = setTimeout(function () { K.o.classList.remove("chot"); }, 1200); }
      if (pha !== K.pha) { K.o.classList.remove("pha-nhap", "pha-xep", "pha-xong"); K.o.classList.add("pha-" + pha); K.pha = pha; }
      ["tong", "thiep", "con"].forEach(function (kh) {
        var M = K.muc[kh], v = nhap[kh];
        M.o.classList.toggle("dung", !!v); M.o.classList.toggle("sao", v === "s");
      });
      /* 10 mảnh luôn có mặt trên thiệp; mảnh chưa ai kéo thì nằm ở chỗ sẵn */
      for (so = 1; so <= goc.length; so++) ds.push({ so: so, st: mo(m["p" + so]) || { x: K.dau[so - 1].x, y: K.dau[so - 1].y, r: 0, f: 0, t: 0 } });
      ds.sort(function (a, b) { return a.st.t - b.st.t || a.so - b.so; });
      ds.forEach(function (x) {
        var g = K.g[x.so], v = nhap[K.khoaCua[x.so]], r = x.st.r, cu = K.hien[x.so];
        if (cu !== undefined) r += Math.round((cu - r) / 360) * 360;      // góc quay liên tục: chọn giá trị gần góc đang hiện nhất để mảnh không quay một vòng thừa
        K.hien[x.so] = r;
        g.style.transform = "translate(" + (x.st.x * U).toFixed(2) + "px," + (x.st.y * U).toFixed(2) + "px) rotate(" + r + "deg)";
        var p = diem(diemGoc(goc[x.so - 1], x.st.f));
        g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p);
        g.children[1].setAttribute("fill", pha === "nhap" && !v ? MAU_XAM : mau[x.so - 1]);
        g.classList.toggle("dung", !!v); g.classList.toggle("sao", v === "s");
        if (g.children[2]) g.children[2].style.transform = "rotate(" + (-r) + "deg)";      // dấu ✓ / ★ luôn đứng thẳng
      });
      var thuTu = ds.map(function (x) { return x.so; }).join(",");
      if (thuTu !== K.thuTu) { K.thuTu = thuTu; ds.forEach(function (x) { K.lop.appendChild(K.g[x.so]); }); }   // chỉ xếp lại lớp khi thứ tự trên dưới đổi (xếp lại làm đứt chuyển động)
      var may = d.co ? Object.keys(d.co).length : 0, nd = demDung(nhap), ns = demSao(nhap);
      K.o.classList.toggle("co-may", may > 0);
      K.tt.textContent = pha === "xong" ? "Đã hoàn thành" : pha === "xep" ? "Đang xếp hình" : nd ? "Đo và tính: đúng " + nd + "/10" : may ? "Đã vào, đang đo và tính" : "Chưa có máy nào vào";
      K.sao.textContent = ns ? "★ " + ns : "";
      var o = $("vao" + k);
      o.classList.toggle("co", may > 0);
      o.querySelector(".vao-tt").textContent = may ? "Đã vào: " + may + " máy" : "Chưa có máy nào";
    }
    function doiXem(x) { xem = x; $("tv").classList.toggle("xem-vao", x === "vao"); $("tv").classList.toggle("xem-xep", x === "xep"); if (lon) phong_to(lon); }
    function xoaHinh() { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/m"] = null; o["n" + k + "/xong"] = null; }); T.update(o); }
    function lamLaiHet() { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { ["m", "xong", "d", "s", "mo"].forEach(function (p) { o["n" + k + "/" + p] = null; }); }); T.update(o); }
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
         khóa "baoTuong": ảnh thầy đã chọn ở trang Rước đuốc, chỉ dùng khi đúng tỉ lệ khổ A0 nằm ngang.
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
        layAnh("baoTuong", function (b2) {
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

    $("nutBatDau").onclick = function () { doiXem("xep"); };
    $("nutMa").onclick = function () { doiXem("vao"); };
    $("nutCaiDat").onclick = function () { $("caiDat").hidden = false; };
    $("nutCaiDat2").onclick = function () { $("caiDat").hidden = false; };
    $("dongCaiDat").onclick = function () { $("caiDat").hidden = true; };
    $("nutToan").onclick = function () {
      var d = document;
      if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () {});
    };
    hoiHaiLan($("nutMoHet"), "Bấm lần nữa để mở cho cả 4 nhóm", function () { if (!T) return; var o = {}; [1, 2, 3, 4].forEach(function (k) { o["n" + k + "/mo"] = 1; }); T.update(o); });
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
    $("nutDapSo").onclick = function () { $("dapSo").hidden = false; };
    $("dongDapSo").onclick = function () { $("dapSo").hidden = true; };

    function trangThai(kieu) {
      var e = $("tvNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử trên một máy" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }
    veMa(); doiXem("vao");
    [1, 2, 3, 4].forEach(function (k) { veNhom(k, null); });
    noi(phong, thu, trangThai).then(function (t) {
      T = t;
      [1, 2, 3, 4].forEach(function (k) { T.on("n" + k, function (d) { veNhom(k, d); }); });
    });
  }

  /* cho bài thử gọi các hàm hình học */
  window.XT = { BO: BO, MUC: MUC, THU_TU: THU_TU, TONG: TONG, CON: CON, kiemMuc: kiemMuc, daGiac: daGiac, toaDo: toaDo, doLun: doLun, dayVec: dayVec, kcDaGiac: kcDaGiac, cachChinh: cachChinh, canChinh: canChinh, vaoGiua: vaoGiua, giuTrong: giuTrong, vaoLuoi: vaoLuoi, trongTam: trongTam, BOCUC: BOCUC, NHOM: NHOM, NHE: NHE, viTriDau: viTriDau, mo: mo, goi: goi, dat: function (o) { if (o.de !== undefined) NHE.de = o.de; if (o.xaTach !== undefined) XA_TACH = o.xaTach; } };

  function batDau() {
    var ts = thamSo();
    if (ts.n !== undefined || ts.dt !== undefined) chayDienThoai(ts); else chayTivi(ts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", batDau); else batDau();
})();
