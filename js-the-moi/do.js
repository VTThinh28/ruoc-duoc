/* Rước đuốc, BẢN THỬ thẻ mới: đo tốc độ đọc và ghi "số đo" lúc quét.
   12/11/2026, thầy Thịnh: "cho thêm file đo thông số nữa để mai tôi quét thử xong sẽ đưa thông số đo cho bạn chỉnh."
   Tệp này chỉ có ở trang thử (js-the-moi/do.js), nạp sau tro-choi.js. Nó chỉ QUAN SÁT: không đổi kết quả đọc thẻ, không đổi luật ghi.

   Ghi những gì (không có ảnh, không có tên học sinh; chỉ số thẻ, chữ, cỡ thẻ, thời gian):
     may   : máy và trình duyệt (để biết máy mạnh hay yếu)
     cam   : mỗi lần bật camera: cỡ hình, số hình mỗi giây, máy cho chỉnh những gì (zoom, lấy nét, phơi sáng…)
     giay  : mỗi giây lúc camera bật: [mốc, ms của khoảng đo, rồi mỗi làn 4 số: số lần đọc, cỡ khung, ms đọc, ms chụp; số thẻ đang thấy, số thẻ đã ghi,
             câu, zoom, tốc độ xoay máy trung bình và lớn nhất (độ/giây, −1 nếu máy không báo)]
     phoi  : 2 giây một lần, nếu máy cho biết: [mốc, thời gian phơi sáng (đơn vị 0,1 mili giây), ISO, khoảng lấy nét, zoom] (ảnh nhòe lúc lia máy là do phơi lâu)
     cau   : từng câu, từng thẻ: lúc thấy lần đầu, lúc ghi, cỡ thẻ, số lần đọc trúng của từng làn, chữ khác thấy sau khi ghi, lần giơ 2 thẻ, thẻ nằm bị loại
     vet   : từng lần đọc (tối đa khoảng 2,5 MB): lúc chụp | làn (0 gần, 1 xa) | cỡ khung | ms đọc | ms chụp | ms từ lúc chụp tới lúc có kết quả |
             trạng thái (0 đang ghi được, 1 đang đếm ngược, 2 không ở màn quét) | các thẻ đọc được | thẻ nằm bị loại | thẻ vừa ghi | thẻ vừa bị coi là "2 thẻ" |
             tốc độ xoay máy lúc đó (độ/giây, −1 nếu máy không báo)
             mỗi thẻ viết: <số><chữ><cạnh mã tính bằng điểm ảnh của khung làn đó>, thêm ".<độ dẹt × 100>" nếu độ dẹt dưới 0,85 (thẻ nghiêng quá 30°),
             thêm "!" nếu cùng khung có 2 thẻ của em đó
     sk    : sự kiện (bật, tắt camera, đổi câu, đếm ngược, bật tắt Ghi ngay, ẩn trang, tải lại trang, lỗi)
   Mọi mốc thời gian là mili giây tính từ lúc tạo bản ghi (D.mo, giờ máy).
   Lưu tạm trên máy (localStorage) để tải lại trang không mất. Lấy ra bằng 3 nút ở mục "Số đo bản thử" trên điện thoại:
     Gửi số đo cho Claude: ghi vào cơ sở dữ liệu của trò chơi, nhánh ruoc-duoc/do-thu (không đụng nhánh lop-6-3 của trò chơi)
     Tải file số đo: tệp .txt gồm phần tóm tắt đọc được và phần dữ liệu JSON
     Chép tóm tắt: chép phần tóm tắt để dán vào tin nhắn */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var P0 = performance.now(), E0 = Date.now();
  var KHOA = "rd-so-do-2", KHOA_VET = "rd-so-do-2-vet", GIOI_VET = 2500000, GIOI_LUU = 1200000, BAN = 2;
  var CHU = ["A", "B", "C", "D"];
  var $ = function (s) { return document.querySelector(s); };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }
  function maMoi() { var a = "23456789ABCDEFGHJKMNPQRSTUVWXYZ", s = ""; for (var i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function thongTinMay() {
    var n = navigator, s = window.screen || {};
    return {
      ua: String(n.userAgent || ""), nen: String(n.platform || ""), nhan: n.hardwareConcurrency || 0, ram: n.deviceMemory || 0,
      man: [s.width || 0, s.height || 0, Math.round((window.devicePixelRatio || 1) * 100) / 100], cua: [window.innerWidth, window.innerHeight],
      mang: (n.connection && n.connection.effectiveType) || ""
    };
  }
  function banGhiMoi() {
    return { ban: BAN, v: window.RD_V || "", ma: maMoi(), mo: E0, may: thongTinMay(), cam: [], sk: [], giay: [], phoi: [], cau: {}, thuTu: [], loi: [], soVet: 0, vetDay: false, gui: 0 };
  }
  var D = null, VET = [], vetDai = 0, coMoi = false;   // coMoi: trang này đã tự ghi thêm số đo (chỉ khi đó mới lưu, để tab khác không đè lên)
  (function nap() {
    try {
      var x = JSON.parse(lsGet(KHOA) || "null");
      if (x && x.ban === BAN && x.mo && x.cau) {
        D = x; if (!D.phoi) D.phoi = [];
        var v = lsGet(KHOA_VET);
        VET = v ? v.split("\n") : [];
        vetDai = v ? v.length : 0;
      }
    } catch (e) { D = null; }
    if (!D) { D = banGhiMoi(); VET = []; vetDai = 0; }
  })();
  // mốc thời gian: mili giây từ lúc tạo bản ghi; tc là giờ kiểu performance.now() của trang này
  function moc(tc) { return Math.round(E0 + ((tc == null ? performance.now() : tc) - P0) - D.mo); }
  function suKien(loai, a, b, c) {
    if (D.sk.length >= 600) return;
    var s = [moc(), loai];
    if (a !== undefined) s.push(a);
    if (b !== undefined) s.push(b);
    if (c !== undefined) s.push(c);
    D.sk.push(s);
  }
  function loi(e, o) {
    if (D.loi.length >= 30) return;
    D.loi.push([moc(), String((e && e.message) || e).slice(0, 200), o || ""]);
  }
  if (D.mo !== E0) suKien("tai-lai-trang", window.RD_V || ""); else suKien("mo-trang", window.RD_V || "");
  if (D.v !== (window.RD_V || "")) { suKien("doi-ban", D.v, window.RD_V || ""); D.v = window.RD_V || ""; }
  D.may = thongTinMay();
  window.addEventListener("error", function (e) { loi(e.message || "lỗi", (e.filename || "").split("/").pop() + ":" + (e.lineno || 0)); });
  window.addEventListener("unhandledrejection", function (e) { loi((e.reason && e.reason.message) || e.reason || "lỗi hứa", "promise"); });

  /* ---------- máy đang lia nhanh hay chậm (độ/giây), để biết lần đọc hụt có phải do ảnh nhòe ---------- */
  var xoayNay = -1, xoayTong = 0, xoaySo = 0, xoayMax = -1;
  window.addEventListener("devicemotion", function (e) {
    var r = e.rotationRate; if (!r || r.alpha == null) return;
    var m = Math.sqrt(r.alpha * r.alpha + r.beta * r.beta + r.gamma * r.gamma);
    if (!isFinite(m)) return;
    xoayNay = m; xoayTong += m; xoaySo++; if (m > xoayMax) xoayMax = m;
  });

  /* ---------- gộp số đo theo câu và theo thẻ ---------- */
  var st = null;   // trạng thái quét lấy từ tro-choi.js: {key, q, dem, n, ghiNgay}
  function trangThai() { try { st = RD.trangThaiQuet ? RD.trangThaiQuet() : null; } catch (e) { st = null; } return st; }
  function cauCua(key, q) {
    var C = D.cau[key];
    if (!C) {
      if (D.thuTu.length >= 40) return null;
      C = D.cau[key] = { q: q, t0: null, tl: null, doc: [0, 0], the: {}, nam: {}, ngoai: {}, ghiNgay: null };
      D.thuTu.push(key);
      suKien("cau", key, q);
    }
    return C;
  }
  function theCua(C, id) {
    return C.the[id] || (C.the[id] = { l1: null, t1: null, s1: 0, w1: 0, lan1: 0, d1: 0, n: [0, 0], ra: [0, 0], rb: [0, 0], sm: [0, 0], sx: [0, 0], dm: 100,
      tg: null, lg: null, ng: 0, sg: 0, wg: 0, lang: 0, tre: 0, gn: null, khac: {}, doi: 0, hai: 0, sau: 0, tl: null });
  }
  var moiGhi = [], moiHai = [];
  var Do = RD.Do = {};
  // tro-choi.js gọi lúc vừa ghi một thẻ (trước khi lần đọc này được gộp ở dưới)
  Do.ghi = function (c, tc, PQ) {
    try {
      var C = cauCua(PQ.key, PQ.q); if (!C) return;
      var o = theCua(C, c.id), L = RD.Quet && RD.Quet.Live, n = L && L.lan && L.lan[c.lan || 0];
      o.tg = moc(tc); o.lg = CHU[c.k]; o.ng = o.n[0] + o.n[1] + 1; o.sg = Math.round(c.size || 0); o.wg = (n && n.kw) || 0; o.lang = c.lan || 0;
      o.tre = Math.round(performance.now() - tc);
      o.gn = RD.ghiNgay ? (RD.ghiNgay() ? 1 : 0) : null;
      moiGhi.push(c.id); coMoi = true;
    } catch (e) { loi(e, "ghi"); }
  };
  // tro-choi.js gọi lúc một em bị coi là đang giơ 2 thẻ (chưa ghi)
  Do.hai = function (c, tc, PQ) {
    try {
      var C = cauCua(PQ.key, PQ.q); if (!C) return;
      theCua(C, c.id).hai++;
      moiHai.push(c.id); coMoi = true;
    } catch (e) { loi(e, "hai"); }
  };
  function gopThe(C, c, t, i, w, truoc) {
    var o = theCua(C, c.id), l = CHU[c.k], s = Math.round(c.size || 0), d = c.det != null ? Math.round(c.det * 100) : 100;
    if (o.t1 == null) { o.t1 = t; o.l1 = l; o.s1 = s; o.w1 = w; o.lan1 = i; o.d1 = d; }
    else if (o.lc && o.lc !== l) o.doi++;
    o.lc = l;
    if (!o.n[i]) { o.ra[i] = truoc; o.sm[i] = s; o.sx[i] = s; }
    o.n[i]++; o.rb[i] = truoc + 1;
    if (s < o.sm[i]) o.sm[i] = s;
    if (s > o.sx[i]) o.sx[i] = s;
    if (d < o.dm) o.dm = d;
    if (o.tg != null) { if (t > o.tg) o.sau++; if (l !== o.lg) o.khac[l] = (o.khac[l] || 0) + 1; }
    o.tl = t;
  }
  var soDoc = [0, 0], cuT = [0, 0], demGiay = [0, 0];
  function motLanDoc(L, n, i) {
    var t = moc(n.t), ms = n.tg && n.tg.length ? Math.round(n.tg[n.tg.length - 1]) : 0, w = n.kw || 0;
    var chup = n.chupMs != null ? Math.round(n.chupMs) : -1, tre = Math.round(performance.now() - n.t);
    var s = trangThai(), C = s && s.key ? cauCua(s.key, s.q) : null, cards = n.the || [], nam = cards.nam || [];
    var co = !s || !s.key ? 2 : s.dem ? 1 : 0;   // 0: đang ghi được; 1: đang đếm ngược (chưa ghi); 2: không ở màn quét của câu nào
    soDoc[i]++; demGiay[i]++; coMoi = true;
    var chuoi = [], chuoiNam = [];
    if (C) {
      var truoc = C.doc[i];
      C.doc[i]++; C.tl = t;
      if (co === 0 && C.t0 == null) C.t0 = t;
      if (C.ghiNgay == null && s) C.ghiNgay = s.ghiNgay ? 1 : 0;
    }
    for (var a = 0; a < cards.length; a++) {
      var c = cards[a];
      chuoi.push(c.id + CHU[c.k] + Math.round(c.size || 0) + (c.det != null && c.det < 0.85 ? "." + Math.round(c.det * 100) : "") + (c.hai ? "!" : ""));
      if (C && co === 0) {
        if (!theTrongLop(c.id)) C.ngoai[c.id] = (C.ngoai[c.id] || 0) + 1;   // số không có trong lớp hoặc đang vắng: trang không ghi
        else gopThe(C, c, t, i, w, truoc);
      }
    }
    for (var b = 0; b < nam.length; b++) {
      var m = nam[b];
      chuoiNam.push(m.id + CHU[m.k] + Math.round(m.size || 0) + "." + Math.round((m.det || 0) * 100));
      if (C && co === 0) C.nam[m.id] = (C.nam[m.id] || 0) + 1;
    }
    if (!D.vetDay) {
      var dong = t + "|" + i + "|" + w + "|" + ms + "|" + chup + "|" + tre + "|" + co + "|" + chuoi.join(" ") + "|" + chuoiNam.join(" ") + "|" + moiGhi.join(" ") + "|" + moiHai.join(" ") + "|" + Math.round(xoayNay);
      if (vetDai + dong.length + 1 > GIOI_VET) { D.vetDay = true; suKien("vet-day", VET.length); }
      else { VET.push(dong); vetDai += dong.length + 1; D.soVet = VET.length; }
    }
    moiGhi = []; moiHai = [];
  }
  var lopNho = null, lopLuc = 0;
  function theTrongLop(id) {
    var bay = performance.now();
    if (!lopNho || bay - lopLuc > 2000) { try { lopNho = RD.lopHienTai ? RD.lopHienTai() : null; } catch (e) { lopNho = null; } lopLuc = bay; }
    return !lopNho || !lopNho.toCua || (!!lopNho.toCua[id] && !(lopNho.vang && lopNho.vang[id]));
  }
  function gan(L) {
    if (L._doGan) return;
    var ve = L.ve;
    L.ve = function () {
      try {
        var ds = L.lan || [];
        for (var i = 0; i < ds.length && i < 2; i++) { var n = ds[i]; if (n.t && n.t !== cuT[i]) { cuT[i] = n.t; motLanDoc(L, n, i); } }
      } catch (e) { loi(e, "ve"); }
      return ve.apply(this, arguments);
    };
    L._doGan = true;
  }

  /* ---------- camera, từng giây, lưu ---------- */
  function sach(x) {
    try { var o = JSON.parse(JSON.stringify(x || {})); delete o.deviceId; delete o.groupId; return o; } catch (e) { return {}; }
  }
  var dangChay = false, camCho = null, tGiay = 0, luuLuc = 0, keyCu = "", demCu = false, gnCu = null;
  function batDauCam(L) {
    var o = { t: moc(), w: 0, h: 0, st: {}, kn: {}, lan: (L.lan || []).length };
    try { o.st = sach(L.track && L.track.getSettings && L.track.getSettings()); } catch (e) { /* bỏ qua */ }
    try { o.kn = sach(L.khaNang && L.khaNang()); } catch (e) { /* bỏ qua */ }
    try { var lop = RD.lopHienTai && RD.lopHienTai(); if (lop) D.lop = { tong: lop.tong, coMat: lop.coMat }; } catch (e) { /* bỏ qua */ }
    if (D.cam.length < 40) D.cam.push(o);
    camCho = o;
    suKien("cam-bat");
  }
  function tungGiay(L, bay) {
    var ds = L.lan || [], dt = bay - tGiay, o = [moc(), Math.round(dt)];
    for (var i = 0; i < 2; i++) {
      var n = ds[i];
      if (!n || n.tat) { o.push(0, 0, 0, -1); continue; }
      var s = 0; (n.tg || []).forEach(function (x) { s += x; });
      o.push(demGiay[i], n.kw || n.maxW || 0, n.tg && n.tg.length ? Math.round(s / n.tg.length) : 0, n.chupMs != null ? Math.round(n.chupMs) : -1);
    }
    var s2 = trangThai();
    var zo = $("#dtZoom"), zk = $("#dtZoomKhung");
    o.push((L.the || []).length, s2 ? s2.n : 0, s2 ? s2.q : 0, zo && zk && !zk.hidden ? +zo.value || 1 : 1);
    o.push(xoaySo ? Math.round(xoayTong / xoaySo) : -1, xoaySo ? Math.round(xoayMax) : -1);
    xoayTong = 0; xoaySo = 0; xoayMax = -1;
    if (D.giay.length < 3000) D.giay.push(o);
    demGiay = [0, 0];
    // tên làn đổi (làn xa không chạy được thì làn gần làm một mình)
    var ten = ds.map(function (n) { return n.ten + (n.tat ? " (tắt)" : ""); }).join(", ");
    if (ten !== D.lanTen) { D.lanTen = ten; suKien("lan", ten); }
    // phơi sáng, ISO, lấy nét: 2 giây một lần, máy nào cho biết thì ghi
    if (D.giay.length % 2 === 0 && D.phoi.length < 1500) {
      try {
        var stg = L.track && L.track.getSettings ? L.track.getSettings() : null;
        if (stg && (stg.exposureTime != null || stg.iso != null || stg.focusDistance != null))
          D.phoi.push([moc(), stg.exposureTime != null ? Math.round(stg.exposureTime) : -1, stg.iso != null ? Math.round(stg.iso) : -1, stg.focusDistance != null ? Math.round(stg.focusDistance * 100) / 100 : -1, stg.zoom != null ? stg.zoom : -1]);
      } catch (e) { /* bỏ qua */ }
    }
  }
  function luu(caVet) {
    if (!coMoi) return;
    try {
      luuLuc = performance.now();
      if (!lsSet(KHOA, JSON.stringify(D))) return;
      if (!caVet) return;
      var v = VET.join("\n");
      if (lsSet(KHOA_VET, v)) return;
      // máy không cho lưu nhiều (hay gặp trên iPhone): giữ phần đầu của vết; bản đầy đủ vẫn nằm trong trang cho tới khi tải lại
      var cat = v.lastIndexOf("\n", GIOI_LUU);
      if (cat <= 0 || !lsSet(KHOA_VET, v.slice(0, cat))) { lsDel(KHOA_VET); if (!D.vetKhongLuu) { D.vetKhongLuu = 1; suKien("vet-khong-luu-duoc"); } }
      else if (!D.vetLuuMotPhan) { D.vetLuuMotPhan = 1; suKien("vet-luu-mot-phan", cat); }
    } catch (e) { /* bỏ qua */ }
  }
  var nhan = document.getElementById("banThu"), nhanGoc = nhan ? nhan.textContent : "", t0Nhan = 0, demNhan = 0, soDocCu = 0;
  setInterval(function () {
    var L = RD.Quet && RD.Quet.Live;
    if (!L || typeof L.ve !== "function") return;
    gan(L);
    var bay = performance.now(), s = trangThai();
    if (s) {
      if (s.key !== keyCu) { keyCu = s.key; if (s.key) { cauCua(s.key, s.q); suKien("vao-cau", s.q); } else suKien("roi-man-quet"); }
      if (!!s.dem !== demCu) { demCu = !!s.dem; suKien(demCu ? "dem-bat-dau" : "dem-xong"); }
      if (gnCu !== null && !!s.ghiNgay !== gnCu) suKien("ghi-ngay", s.ghiNgay ? 1 : 0);
      gnCu = !!s.ghiNgay;
    }
    if (L.chay && !dangChay) { dangChay = true; batDauCam(L); tGiay = bay; demGiay = [0, 0]; t0Nhan = 0; }
    else if (!L.chay && dangChay) { dangChay = false; camCho = null; suKien("cam-tat"); luu(true); veSoDo(); }
    if (dangChay && camCho && L.video && L.video.videoWidth) {
      camCho.w = L.video.videoWidth; camCho.h = L.video.videoHeight;
      try { camCho.st = sach(L.track && L.track.getSettings && L.track.getSettings()); } catch (e) { /* bỏ qua */ }
      camCho = null;
    }
    if (dangChay && bay - tGiay >= 1000) { tungGiay(L, bay); tGiay = bay; }
    if (dangChay && bay - luuLuc > 10000) luu(false);
    // nhãn "Bản thử" ở mép trên: lúc camera bật thì hiện tốc độ đọc (như bản 12/11)
    if (!nhan) return;
    if (!L.chay) {
      if (nhan.dataset.dangDo) { nhan.textContent = nhanGoc; nhan.style.whiteSpace = "nowrap"; nhan.style.opacity = ".45"; delete nhan.dataset.dangDo; }
      t0Nhan = 0;
      return;
    }
    var tong = soDoc[0] + soDoc[1];
    if (!t0Nhan) { t0Nhan = bay; soDocCu = tong; return; }
    if (bay - t0Nhan < 1000) return;
    demNhan = (tong - soDocCu) * 1000 / (bay - t0Nhan);
    soDocCu = tong; t0Nhan = bay;
    var v = L.video, cam = v && v.videoWidth ? v.videoWidth + "×" + v.videoHeight : "chưa rõ";
    var lan = L.tungLan().filter(function (x) { return !x.tat; }).map(function (x) { return x.ten + " " + x.maxW + " px " + x.ms + " ms"; }).join(" · ");
    nhan.dataset.dangDo = "1";
    nhan.style.whiteSpace = "normal"; nhan.style.textAlign = "center"; nhan.style.opacity = ".9"; nhan.style.maxWidth = "94vw"; nhan.style.width = "max-content";
    nhan.innerHTML = nhanGoc + (RD.ghiNgay && RD.ghiNgay() ? " · ghi ngay" : "") + "<br>" + so1(demNhan) + " lần đọc/giây · camera " + cam + "<br>" + lan;
  }, 250);
  document.addEventListener("visibilitychange", function () { suKien(document.hidden ? "an-trang" : "hien-trang"); if (document.hidden) luu(true); });
  window.addEventListener("pagehide", function () { luu(true); });

  /* ---------- tóm tắt đọc được ---------- */
  function so1(x) { return (x < 9.95 ? x.toFixed(1) : String(Math.round(x))).replace(".", ","); }
  function giayChu(ms) { return so1(ms / 1000) + " giây"; }
  function giua(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
  function hai(n) { return (n < 10 ? "0" : "") + n; }
  function ngayGio(ms) { var d = new Date(ms); return hai(d.getDate()) + "/" + hai(d.getMonth() + 1) + "/" + d.getFullYear() + " " + hai(d.getHours()) + ":" + hai(d.getMinutes()); }
  function tomTat() {
    var r = [], m = D.may || {}, i;
    r.push("SỐ ĐO QUÉT THẺ · bản thử thẻ mới · bản " + (D.v || "?") + " · mã " + D.ma);
    r.push("Bắt đầu đo " + ngayGio(D.mo) + ", lấy số đo " + ngayGio(Date.now()));
    r.push("Máy: " + (m.ua || "").replace(/^Mozilla\/5\.0 /, "").slice(0, 150));
    r.push("  " + (m.nhan || "?") + " nhân, RAM " + (m.ram ? m.ram + " GB" : "không rõ") + ", màn " + (m.man || []).slice(0, 2).join("×") + " ×" + String((m.man || [])[2] || "?").replace(".", ","));
    var cam = D.cam[D.cam.length - 1];
    if (cam) {
      var st = cam.st || {}, kn = cam.kn || {};
      r.push("Camera: " + cam.w + "×" + cam.h + (st.frameRate ? ", " + Math.round(st.frameRate) + " hình/giây" : "") +
        (kn.zoom ? ", zoom " + (st.zoom || 1) + " (máy cho " + kn.zoom.min + " đến " + kn.zoom.max + ")" : ", không chỉnh được zoom") +
        (st.focusMode ? ", lấy nét " + st.focusMode : "") + (kn.exposureTime ? ", chỉnh được phơi sáng" : "") + (kn.torch ? ", có đèn" : "") + " · bật camera " + D.cam.length + " lần");
    } else r.push("Camera: chưa bật lần nào");
    if (D.giay.length) {
      var tong = [], g = [[], [], [], []], x = [[], [], [], []];
      D.giay.forEach(function (o) {
        var k = 1000 / Math.max(200, o[1]);
        tong.push((o[2] + o[6]) * k);
        if (o[2]) { g[0].push(o[3]); g[1].push(o[4]); g[2].push(o[5]); g[3].push(o[2] * k); }
        if (o[6]) { x[0].push(o[7]); x[1].push(o[8]); x[2].push(o[9]); x[3].push(o[6] * k); }
      });
      var sx = tong.slice().sort(function (a, b) { return a - b; });
      r.push("Tốc độ đọc (" + D.giay.length + " giây camera bật): giữa " + so1(giua(tong)) + " lần/giây, chậm nhất " + so1(sx[0]) + ", nhanh nhất " + so1(sx[sx.length - 1]));
      if (g[0].length) r.push("  Làn " + (x[0].length ? "gần" : "duy nhất") + ": " + so1(giua(g[3])) + " lần/giây, khung " + giua(g[0]) + " px (nhỏ nhất " + Math.min.apply(null, g[0]) + "), đọc " + giua(g[1]) + " ms, chụp " + giua(g[2]) + " ms");
      if (x[0].length) r.push("  Làn xa: " + so1(giua(x[3])) + " lần/giây, khung " + giua(x[0]) + " px (nhỏ nhất " + Math.min.apply(null, x[0]) + "), đọc " + giua(x[1]) + " ms, chụp " + giua(x[2]) + " ms");
      else r.push("  Làn xa: không chạy (máy dưới 4 nhân hoặc không mở được luồng thứ hai)");
      var xo = D.giay.filter(function (o) { return o[14] != null && o[14] >= 0; });
      if (xo.length) r.push("  Lia máy: giữa " + giua(xo.map(function (o) { return o[14]; })) + " độ/giây, nhanh nhất " + Math.max.apply(null, xo.map(function (o) { return o[15]; })) + " độ/giây");
      if (D.phoi && D.phoi.length) {
        var ph = D.phoi.filter(function (o) { return o[1] >= 0; }).map(function (o) { return o[1]; }), iso = D.phoi.filter(function (o) { return o[2] >= 0; }).map(function (o) { return o[2]; });
        if (ph.length) r.push("  Phơi sáng: giữa " + so1(giua(ph) / 10) + " ms, lâu nhất " + so1(Math.max.apply(null, ph) / 10) + " ms" + (iso.length ? " · ISO giữa " + giua(iso) : ""));
      }
    }
    D.thuTu.forEach(function (key) {
      var C = D.cau[key]; if (!C) return;
      var ids = Object.keys(C.the), ghi = ids.filter(function (id) { return C.the[id].tg != null; }), chua = ids.filter(function (id) { return C.the[id].tg == null; });
      if (!ids.length && !C.doc[0] && !C.doc[1]) return;
      var gnB = ghi.filter(function (id) { return C.the[id].gn === 1; }).length, gnT = ghi.filter(function (id) { return C.the[id].gn === 0; }).length;
      r.push("Câu " + C.q + " · ghi ngay " + (gnB && gnT ? "BẬT " + gnB + " thẻ, TẮT " + gnT + " thẻ" : (ghi.length ? gnB > 0 : C.ghiNgay) ? "BẬT" : "TẮT") + " · " + (C.doc[0] + C.doc[1]) + " lần đọc trong " + (C.t0 != null && C.tl != null ? giayChu(C.tl - C.t0) : "0 giây") + " · ghi " + ghi.length + " thẻ" + (D.lop ? " (lớp có mặt " + D.lop.coMat + " em)" : ""));
      if (ghi.length) {
        var tg = ghi.map(function (id) { return C.the[id].tg - C.t0; }).sort(function (a, b) { return a - b; });
        r.push("  Tính từ lần đọc đầu của câu: nửa số thẻ sau " + giayChu(tg[Math.max(0, Math.ceil(tg.length / 2) - 1)]) + ", 90% sau " + giayChu(tg[Math.max(0, Math.ceil(tg.length * 0.9) - 1)]) + ", thẻ cuối " + giayChu(tg[tg.length - 1]));
        var cho = ghi.map(function (id) { return C.the[id].tg - C.the[id].t1; }), tre = ghi.map(function (id) { return C.the[id].tre; });
        r.push("  Từ lúc thấy thẻ tới lúc ghi: giữa " + giua(cho) + " ms, lâu nhất " + Math.max.apply(null, cho) + " ms · từ lúc chụp khung tới lúc ghi: giữa " + giua(tre) + " ms, lâu nhất " + Math.max.apply(null, tre) + " ms");
        var co = ghi.map(function (id) { return C.the[id].sg / 6; }).sort(function (a, b) { return a - b; });
        r.push("  Cỡ thẻ lúc ghi (điểm ảnh mỗi ô, theo khung của làn đọc được): nhỏ nhất " + so1(co[0]) + ", giữa " + so1(giua(co)) + ", lớn nhất " + so1(co[co.length - 1]) + " · làn gần ghi " + ghi.filter(function (id) { return !C.the[id].lang; }).length + " thẻ, làn xa ghi " + ghi.filter(function (id) { return C.the[id].lang; }).length + " thẻ");
      }
      // tỉ lệ đọc trúng của từng làn, tính trên các thẻ làn đó thấy ít nhất 3 lần đọc liền trong khoảng
      var nhom = [[0, 5, "dưới 5"], [5, 8, "5 đến 8"], [8, 1e9, "trên 8"]], dong = [];
      for (i = 0; i < 2; i++) {
        var phan = [];
        nhom.forEach(function (nh) {
          var trung = 0, tongDoc = 0, soThe = 0;
          ids.forEach(function (id) {
            var o = C.the[id]; if (!o.n[i] || o.rb[i] - o.ra[i] < 3) return;
            var c2 = (o.sm[i] + o.sx[i]) / 12; if (c2 < nh[0] || c2 >= nh[1]) return;
            trung += o.n[i]; tongDoc += o.rb[i] - o.ra[i]; soThe++;
          });
          if (soThe) phan.push(nh[2] + ": " + Math.round(100 * trung / tongDoc) + "% (" + soThe + " thẻ)");
        });
        if (phan.length) dong.push((i ? "làn xa " : "làn gần ") + phan.join(", "));
      }
      if (dong.length) r.push("  Đọc trúng lúc thẻ đang trong khung, theo cỡ thẻ (điểm ảnh mỗi ô): " + dong.join(" · "));
      if (chua.length) r.push("  Thấy mà chưa ghi: số " + chua.map(function (id) { var o = C.the[id]; return id + (o.hai ? " (2 thẻ " + o.hai + " lần)" : " (" + (o.n[0] + o.n[1]) + " lần đọc)"); }).join(", "));
      var haiDs = ghi.filter(function (id) { return C.the[id].hai; }), khac = ghi.filter(function (id) { return Object.keys(C.the[id].khac).length; });
      if (haiDs.length) r.push("  Từng bị coi là giơ 2 thẻ rồi vẫn ghi được: số " + haiDs.map(function (id) { return id + " (" + C.the[id].hai + " lần)"; }).join(", "));
      if (khac.length) r.push("  Sau khi ghi còn thấy chữ khác: số " + khac.map(function (id) { var o = C.the[id]; return id + " (ghi " + o.lg + ", sau thấy " + Object.keys(o.khac).map(function (l) { return l + " " + o.khac[l] + " lần"; }).join(", ") + ")"; }).join("; "));
      var nam = Object.keys(C.nam), ngoai = Object.keys(C.ngoai);
      if (nam.length) r.push("  Thẻ nằm nghiêng quá 60 độ bị loại: " + nam.reduce(function (a, id) { return a + C.nam[id]; }, 0) + " lượt (số " + nam.join(", ") + ")");
      if (ngoai.length) r.push("  Đọc ra số không có trong lớp hoặc đang vắng: " + ngoai.map(function (id) { return id + " (" + C.ngoai[id] + " lần)"; }).join(", "));
    });
    if (D.loi.length) r.push("Lỗi trang: " + D.loi.length + " (" + D.loi.slice(0, 3).map(function (l) { return l[1]; }).join(" | ") + ")");
    r.push("Vết từng lần đọc: " + (D.soVet || 0) + " dòng" + (D.vetDay ? " (đã đầy, phần sau chỉ còn số gộp)" : ""));
    return r.join("\n");
  }
  function duLieu() { var o = JSON.parse(JSON.stringify(D)); o.lay = Date.now(); o.vet = VET; return o; }
  function noiDungTep() {
    return tomTat() + "\n\n=== DỮ LIỆU CHO CLAUDE (JSON, đừng sửa) ===\n" + JSON.stringify(duLieu()) + "\n";
  }
  Do.tomTat = tomTat; Do.duLieu = duLieu; Do.noiDungTep = noiDungTep; Do.luu = luu;

  /* ---------- mục "Số đo bản thử" trên điện thoại ---------- */
  function bao(chu, kieu) {
    var e = $("#sdBao"); if (!e) return;
    e.hidden = !chu; e.textContent = chu || ""; e.className = "dt-tt" + (kieu ? " " + kieu : "");
  }
  function soThe() { var n = 0; D.thuTu.forEach(function (k) { var C = D.cau[k]; if (C) n += Object.keys(C.the).filter(function (id) { return C.the[id].tg != null; }).length; }); return n; }
  function veSoDo() {
    var e = $("#sdTT"); if (!e) return;
    var coGi = (D.soVet || 0) > 0 || D.giay.length > 0;
    e.textContent = coGi ? "Đã có số đo: " + (D.soVet || 0) + " lần đọc, " + D.giay.length + " giây camera bật, " + soThe() + " lượt ghi thẻ. Mã số đo: " + D.ma + "."
      : "Chưa có số đo. Thầy cứ quét thẻ như bình thường, máy tự ghi. Mã số đo: " + D.ma + ".";
    ["#sdGui", "#sdTai", "#sdChep"].forEach(function (s) { var b = $(s); if (b) b.disabled = !coGi; });
    var x = $("#sdXem"), d = $("#sdXemKhung");
    if (x && d && d.open) x.textContent = tomTat();
  }
  Do.ve = veSoDo;
  function tenTep() { var d = new Date(); return "so-do-quet-the-" + hai(d.getDate()) + "-" + hai(d.getMonth() + 1) + "-" + hai(d.getHours()) + hai(d.getMinutes()) + "-" + D.ma + ".txt"; }
  function taiTep() {
    try {
      luu(true);
      var blob = new Blob([noiDungTep()], { type: "text/plain;charset=utf-8" }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = tenTep(); a.style.display = "none";
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { /* bỏ qua */ } }, 4000);
      suKien("tai-tep");
      bao("Đã tải tệp " + a.download + " về máy (thư mục Tệp tải xuống). Thầy đính kèm tệp đó vào tin nhắn cho Claude.", "ok");
    } catch (e) { loi(e, "tai"); bao("Máy này không tải tệp được. Thầy bấm Gửi số đo cho Claude hoặc Chép tóm tắt.", "loi"); }
  }
  function chepTomTat() {
    var chu = tomTat();
    var xong = function () { suKien("chep"); bao("Đã chép tóm tắt. Thầy dán vào tin nhắn cho Claude.", "ok"); };
    var cachCu = function () {
      try {
        var t = document.createElement("textarea");
        t.value = chu; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.left = "-9999px"; t.style.top = "0";
        document.body.appendChild(t); t.select(); t.setSelectionRange(0, chu.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(t);
        if (ok) xong(); else throw new Error("copy");
      } catch (e) {
        var d = $("#sdXemKhung"); if (d) { d.open = true; veSoDo(); }
        bao("Máy không cho chép tự động. Thầy mở phần Xem tóm tắt bên dưới, giữ tay lên chữ để chép.", "loi");
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(chu).then(xong, cachCu); else cachCu();
  }
  var dangGui = false;
  function guiDi() {
    if (dangGui) return;
    var cfg = window.RD_FIREBASE || {};
    if (!cfg.databaseURL || typeof fetch !== "function") { bao("Trang này không nối được cơ sở dữ liệu. Thầy bấm Tải file số đo.", "loi"); return; }
    dangGui = true; luu(true);
    bao("Đang gửi số đo…", "");
    var d = new Date(D.mo), khoa = "d" + d.getFullYear() + hai(d.getMonth() + 1) + hai(d.getDate()) + "-" + D.ma;
    var than;
    try { than = JSON.stringify({ at: Date.now(), ma: D.ma, v: D.v, tomTat: tomTat(), log: JSON.stringify(duLieu()) }); }
    catch (e) { dangGui = false; loi(e, "gui"); bao("Không gói được số đo. Thầy bấm Tải file số đo.", "loi"); return; }
    var hen = setTimeout(function () { if (dangGui) { dangGui = false; bao("Gửi quá lâu chưa xong (mạng chậm). Thầy bấm lại, hoặc bấm Tải file số đo.", "loi"); } }, 30000);
    fetch(cfg.databaseURL.replace(/\/+$/, "") + "/ruoc-duoc/do-thu/" + khoa + ".json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: than })
      .then(function (r) { if (!r.ok) throw new Error("máy chủ trả lời " + r.status); return r.text(); })
      .then(function () {
        clearTimeout(hen); dangGui = false; D.gui = (D.gui || 0) + 1; suKien("gui", Math.round(than.length / 1024)); luu(false);   // luu() chỉ ghi khi trang này có số đo mới
        bao("Đã gửi số đo (" + Math.round(than.length / 1024) + " KB). Thầy nhắn Claude: “đã gửi số đo, mã " + D.ma + "”.", "ok");
      }, function (e) {
        clearTimeout(hen); dangGui = false; loi(e, "gui");
        bao("Không gửi được (" + String((e && e.message) || e).slice(0, 80) + "). Thầy bấm Tải file số đo hoặc Chép tóm tắt.", "loi");
      });
  }
  function xoaHet() {
    if (!window.confirm("Xóa hết số đo đang có và đo lại từ đầu?")) return;
    lsDel(KHOA); lsDel(KHOA_VET);
    E0 = Date.now(); P0 = performance.now();
    D = banGhiMoi(); VET = []; vetDai = 0; coMoi = false; keyCu = ""; soDoc = [0, 0]; demGiay = [0, 0]; soDocCu = 0; t0Nhan = 0;
    suKien("xoa-do-lai");
    if (dangChay) { var L = RD.Quet && RD.Quet.Live; if (L) batDauCam(L); }
    bao("Đã xóa. Số đo mới có mã " + D.ma + ".", "ok"); veSoDo();
  }
  function ganNut() {
    var o = $("#dtGhiNgay");
    if (o && RD.ghiNgay) {
      o.checked = RD.ghiNgay();
      o.addEventListener("change", function () { RD.ghiNgay(o.checked); });
    }
    var n = function (s, f) { var b = $(s); if (b) b.addEventListener("click", f); };
    n("#sdGui", guiDi); n("#sdTai", taiTep); n("#sdChep", chepTomTat); n("#sdXoa", xoaHet);
    var d = $("#sdXemKhung"); if (d) d.addEventListener("toggle", veSoDo);
    veSoDo();
    setInterval(veSoDo, 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ganNut); else ganNut();
})();
