/* Ngọn đuốc tri thức (trò kéo co, bản tách từ Rước đuốc 25/11/2026): điều khiển buổi chơi (TV và điện thoại).
   Các bước theo Rước đuốc (RD.BUOC): bước r của mỗi câu là lượt kéo co, finish là đội thắng thắp đuốc; bước rank của Rước đuốc không còn
   (thầy chốt 25/11 17:34: bấm Tiếp theo thì đội thắng sang bắt tay đội kia, hai ngọn đuốc cùng sáng, sách và công thức bay về số 51, hiện
   báo tường; 18:22: cả bốn bạn đội thắng sang bắt tay bốn bạn đội kia); tuong là cảnh bắt tay đó rồi vành lửa lan ra lộ báo tường, bao là
   bồ câu kéo vải. Phần quét thẻ giữ nguyên. */
(function () {
  "use strict";
  var RD = window.RD, SK = RD.SanKhau, KC = RD.KeoCo, Q = RD.Quet, A = RD.AmThanh;
  // màn câu hỏi che kín sân: cả sân khấu cũ lẫn sân kéo co thôi vẽ
  function phuSan(on) { SK.phu(on); KC.phu(on); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
  function ngauNhien(n) { var s = "", c = "abcdefghijkmnpqrstuvwxyz23456789"; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function gio(t) { var d = new Date(t || Date.now()); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  var DEV = lsGet("rd-dev", "") || (function () { var d = ngauNhien(8); lsSet("rd-dev", d); return d; })();
  var TAB = ngauNhien(6);   // mỗi lần mở trang một mã riêng: phân biệt bản ghi của chính trang này với máy (hoặc thẻ) khác

  var S = { cfg: null, now: null, ph: null, scans: {} };
  var DB = null, VAI = null, NOI = { kieu: "cho", chu: "Đang nối…" }, chacCfg = false, daKhoiTao = false;

  /* ---------- đọc trạng thái ---------- */
  function ses() { return (S.cfg && S.cfg.ses) || ""; }
  function cfg() { return S.cfg || RD.cfgMacDinh(""); }
  function nowHopLe() {
    var n = S.now;
    if (!n || !n.step || RD.BUOC.indexOf(n.step) < 0 || (ses() && n.ses !== ses())) return { ses: ses(), step: "setup", pub: {} };
    if (!n.pub) n.pub = {};
    return n;
  }
  function scanHopLe(q) { var s = S.scans[q]; return s && s.ses === ses() ? s : null; }
  function cacScan() { var m = {}; for (var q = 1; q <= 5; q++) m[q] = scanHopLe(q); return m; }
  function cauDaTinh(boQua) {
    var pub = nowHopLe().pub, m = {};
    for (var q = 1; q <= 5; q++) if ((pub["r" + q] | 0) > 0 && q !== boQua) m[q] = true;
    return m;
  }
  function tinh(boQua) { return RD.tinhDiem(cfg(), cacScan(), cauDaTinh(boQua)); }

  /* ---------- ghi trạng thái ---------- */
  // tuDong: TV tự sang bước (kéo xong câu 5 thì tự thắp đuốc), ghi n.tu để máy khác biết bước này không do thầy bấm
  function datBuoc(step, tuDong) {
    if (!DB) return;
    var n = clone(nowHopLe());
    n.ses = ses();
    n.step = step;
    n.at = Date.now();
    n.by = TAB;
    if (tuDong) n.tu = 1; else delete n.tu;
    delete n.luat;   // 9/11: đổi bước thì luật chơi về ẩn (vào màn giới thiệu là ẩn sẵn) và thôi đếm ngược
    delete n.dem;
    var q = RD.cauCuaBuoc(step);
    if (RD.loaiBuoc(step) === "r") n.pub["r" + q] = (n.pub["r" + q] | 0) + 1;
    DB.set("now", n);
  }
  function ghiCfg(sua) {
    if (!DB) return;
    var c = clone(cfg());
    sua(c);
    c.at = Date.now();
    DB.set("cfg", c);
  }
  // 9/11 09:04 UTC thầy Thịnh: "Trong app điện thoại bổ sung thêm mục ẩn hiện luật ở lần đầu vô app": ở màn giới thiệu, nút trên
  //   điện thoại và hai nút Ẩn / Hiện luật chơi trên TV cùng ghi now.luat (true: TV hiện luật chơi), TV làm theo. Đổi bước thì xóa.
  function ghiLuat(hien) {
    if (!DB) return;
    var n = clone(nowHopLe());
    if (n.step !== "intro" || !!n.luat === !!hien) return;
    if (hien) n.luat = true; else delete n.luat;
    n.at = Date.now(); n.by = TAB;
    DB.set("now", n);
  }

  /* ---------- đếm ngược 5 giây (9/11 09:04 UTC) ----------
     thầy Thịnh: "sau khi câu hỏi hiện ra thì tôi sẽ đọc đề, đọc xong có 5 giây đếm ngược hiện lên màn hình (tôi bấm nút đếm
     ngược), sau khi xong 5 giây thì các em giơ bảng lên quét". Bấm nút (điện thoại, TV hay phím D) thì ghi now.dem = { id, q };
     máy nào nhận được cũng tự đếm 5 giây kể từ lúc nhận (không so đồng hồ giữa các máy). Đang đếm thì điện thoại chưa ghi thẻ
     nào; hết giờ TV hiện "Giơ đáp án". Lần đếm đã có sẵn lúc trang vừa mở thì không đếm lại. Đổi bước thì thôi đếm.
     9/11 14:36 UTC thầy Thịnh: "cái ô đếm giờ hiện to quá che hết đề. đẩy đề cao lên trên rồi hiện đếm giờ bên dưới, đếm xong
     hiện một ô là Giơ đáp án": trên TV ô đếm nằm dưới chữ đề (veODem), chữ "Giơ đáp án" ở lại tới khi đổi bước. */
  var DEM_GIAY = 5, DEM_XONG = 2600;
  var DEM = { id: "", q: 0, bd: 0, hen: 0, so: null }, demThay = {}, demNap = false;
  var ICON_DEM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.6"/><path d="M9.5 2.5h5"/><path d="M12 2.5V6"/><path d="M18.4 6.6l1.5-1.5"/></svg>';
  function dangDem() { return !!DEM.id && performance.now() - DEM.bd < DEM_GIAY * 1000; }
  // 18/11 (thầy Thịnh: "chỉ quét một hiệp thôi, cho dù các em có dơ 2-3 lần thì cũng chỉ quét một lần"): mỗi câu, mỗi em chỉ được
  //   ghi một lần (đáp án đầu tiên, xem PQ.obs). TV đã hiện đáp án (bước "a") thì máy thôi ghi thẻ của câu đó: camera tắt, nút
  //   camera và chụp ảnh ẩn, để em chưa được ghi không giơ thẻ đúng sau khi đã thấy đáp án. Thầy vẫn chạm số thẻ để ghi tay.
  function daHienDapAn() { return RD.loaiBuoc(nowHopLe().step) === "a"; }
  function batDemNguoc() {
    var n = nowHopLe();
    if (!DB || RD.loaiBuoc(n.step) !== "q" || DEM.id) return false;
    n = clone(n);
    n.dem = { id: ngauNhien(6), q: RD.cauCuaBuoc(n.step), t: Date.now() };
    n.at = Date.now(); n.by = TAB;
    demNap = true;
    DB.set("now", n);
    return true;
  }
  // gọi mỗi lần nhận now: lần đếm mới (đúng câu đang đọc đề) thì bắt đầu đếm; bước đã đổi hay ván mới thì thôi
  function xemDem(chac) {
    var n = nowHopLe(), d = n.dem, hop = !!(d && d.id && n.step === "q" + d.q);
    if (!demNap) { if (d && d.id) demThay[d.id] = 1; if (chac) demNap = true; return; }
    if (DEM.id && (!hop || d.id !== DEM.id)) dungDem();
    if (hop && !demThay[d.id]) { demThay[d.id] = 1; chayDem(d); }
  }
  function chayDem(d) {
    clearTimeout(DEM.hen);
    DEM.id = d.id; DEM.q = d.q; DEM.bd = performance.now(); DEM.so = null;
    CHO = {}; THAY = {}; HAI = {}; NGO = {};   // hết giờ mới bắt đầu tính thời gian giữ chữ
    // điện thoại có camera: mở camera ngay lúc bắt đầu đếm cho kịp, hết giờ mới ghi thẻ
    if (VAI === "dt" && Q.coCamera() && !Q.Live.chay && !camDangMo) batCam();
    (function nhip() {
      if (DEM.id !== d.id) return;
      var t = performance.now() - DEM.bd;
      if (t >= DEM_GIAY * 1000 + DEM_XONG) { dungDem(); return; }
      var con = Math.max(0, DEM_GIAY - Math.floor(t / 1000));
      if (con !== DEM.so) { var dau = DEM.so === null; DEM.so = con; veDem(con, dau); }
      DEM.hen = setTimeout(nhip, Math.max(30, Math.min(250, 1000 - (t % 1000) + 8)));
    })();
  }
  function dungDem() {
    clearTimeout(DEM.hen); DEM.hen = 0;
    var co = !!DEM.id;
    DEM.id = ""; DEM.q = 0; DEM.so = null;
    if (co) { veDem(-1, false); ve(); }
  }
  // con: 5..1 đang đếm, 0 vừa hết giờ ("Giơ đáp án"), -1 thôi đếm; dau: lần vẽ đầu tiên của lần đếm này
  function veDem(con, dau) { if (VAI === "tv") veDemTV(con, dau); else if (VAI === "dt") veDemDT(con); }
  function veDemTV(con, dau) {
    var so = $("#mcDemSo"), vong = $("#mcDemVong"), nut = $('[data-tv="dem"]');
    if (nut) nut.disabled = con >= 0;
    if (dau) {
      huyHoat(vong);
      if (vong.animate) vong._hoat = vong.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 553 }], { duration: DEM_GIAY * 1000, easing: "linear", fill: "both" });
    }
    if (con > 0) so.textContent = String(con);
    veODem(true);
    if (con < 0) return;
    // 21/11 (thầy Thịnh: "lúc mà tôi bấm 5 giây, đếm ngược, thì sẽ có tiếng đếm ngược. Và lúc đó không có nhạc nền luôn"): bắt đầu đếm thì
    //   nhạc nền tắt (datNhac thấy dangDem()), mỗi giây một tiếng đồng hồ "tích tắc" kèm nốt mộc cầm cao dần (A.demNguoc; trước là
    //   A.go mạnh 0,5, lẫn vào nhạc); hết giờ: khúc vui ngắn, nhạc nền có lại dần trong 2 giây.
    if (dau || con === 0) { var st = nowHopLe().step; datNhac(st, RD.loaiBuoc(st)); }
    if (con > 0) {
      so.textContent = String(con);
      hoat(so, [{ opacity: 0.2 }, { opacity: 1 }], 260, DE, function () { huyHoat(so); });
      A.demNguoc(DEM_GIAY - con);
    } else A.ken();                    // hết giờ: khúc vui ngắn
  }
  // TV, ô dưới chữ đề ở bước đọc đề: "dem" đang đếm (vòng tròn và số), "gio" đã đếm xong ở câu này (chữ "Giơ đáp án", ở lại tới
  //   khi đổi bước; mở lại trang lúc đang quét cũng thấy), "" chưa bấm đếm. now.dem bị xoá khi đổi bước (datBuoc)
  function oDem() {
    var n = nowHopLe(), d = n.dem;
    if (!d || !d.id || n.step !== "q" + d.q) return "";
    return DEM.id === d.id && DEM.so !== 0 ? "dem" : "gio";
  }
  var odTT = "";
  // hoatCanh: đổi trạng thái thì chữ đề trượt tới chỗ mới (lên đầu cột khi ô hiện, về giữa khi ô ẩn), ô mờ dần hiện ra;
  //   không có hoạt cảnh khi câu mới hiện hay mở lại trang
  function veODem(hoatCanh) {
    if (VAI !== "tv") return;
    var tt = mcHien ? oDem() : "", o = $("#mcDem");
    if (tt === odTT) return;
    var cu = odTT, ps = [$("#mcBoiCanh"), $("#mcHoi")], truoc = ps.map(function (p) { return p.getBoundingClientRect().top; });
    odTT = tt;
    $("#mcChu").classList.toggle("co-dem", !!tt);
    o.classList.toggle("xong", tt === "gio");
    o.hidden = !tt;
    if (!!tt !== !!cu) vuaChu(mcDang); else vuaDem();
    if (!hoatCanh) return;
    if (!!tt !== !!cu) {
      var k = (RD.SanKhau && RD.SanKhau.k) || 1;
      ps.forEach(function (p, i) {
        var d = (truoc[i] - p.getBoundingClientRect().top) / k;
        if (Math.abs(d) > 1) hoat(p, [{ transform: "translateY(" + d.toFixed(1) + "px)" }, { transform: "none" }], 500, DE, function () { huyHoat(p); });
      });
      if (tt) hoat(o, [{ opacity: 0, transform: "translateY(40px)" }, { offset: 0.35, opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }], 700, DE, function () { huyHoat(o); });
    } else if (tt === "gio") {
      var st = o.querySelector("strong");
      hoat(st, [{ opacity: 0 }, { opacity: 1 }], 400, DE, function () { huyHoat(st); });
    }
  }
  // cỡ vòng tròn và chữ "Giơ đáp án" vừa chiều cao còn lại của ô (ô cao 170 đến 300 px tuỳ chữ đề dài ngắn)
  function vuaDem() {
    var o = $("#mcDem");
    if (o.hidden) return;
    // h: chiều cao phần trong ô (clientHeight đã trừ viền, chỉ trừ thêm lề trong)
    var cs = getComputedStyle(o), h = o.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    o.style.setProperty("--demR", Math.max(100, Math.min(230, Math.floor(h))) + "px");
    // chữ "Giơ đáp án" cao dòng 1,34 (đủ chứa dấu tiếng Việt của phông này): cỡ chữ tối đa h / 1,34
    var st = o.querySelector("strong"), co = Math.max(64, Math.min(124, Math.floor(h / 1.34)));
    o.style.setProperty("--gioCo", co + "px");
    while (co > 64 && o.classList.contains("xong") && (st.scrollWidth > st.clientWidth + 1 || o.scrollHeight > o.clientHeight + 1)) { co -= 4; o.style.setProperty("--gioCo", co + "px"); }
  }
  function veDemDT(con) {
    var cs = $("#dtCamSo"), chup = $("#dtChupNhan");
    capNutDem(con);
    cs.hidden = con < 0;
    if (con >= 0) {
      cs.classList.toggle("xong", con === 0);
      $("#dtCamSoSo").textContent = con > 0 ? String(con) : "Giơ đáp án";
      $("#dtCamSoChu").textContent = con > 0 ? "Chưa ghi thẻ, chờ TV đếm xong" : "Bắt đầu ghi thẻ";
    }
    if (con > 0) chup.setAttribute("aria-disabled", "true"); else chup.removeAttribute("aria-disabled");
    if (PQ) veNutNgau(emChuaQuet().length);   // 26/11: đang đếm thì chưa có nút Chọn đáp án ngẫu nhiên
    if (con > 0) trangThai("", "Đang đếm ngược " + con + " giây: máy chưa ghi thẻ, các em chưa giơ thẻ.");
    else if (con === 0) {
      trangThai("ok", "Hết giờ: các em giơ thẻ, máy bắt đầu ghi.");
      try { navigator.vibrate && navigator.vibrate([90, 60, 90]); } catch (e) { /* bỏ qua */ }
    }
  }
  // nút Đếm ngược trên điện thoại: đang đếm thì hiện số giây còn lại; đã đếm ở câu này thì "Đếm ngược lại"
  function capNutDem(con) {
    var b = $("#dtDem");
    if (!b) return;
    if (con == null) con = DEM.id && DEM.so !== null ? DEM.so : -1;
    var n = nowHopLe(), q = RD.cauCuaBuoc(n.step), daDem = !!(n.dem && n.dem.q === q);
    var html = ICON_DEM + (con > 0 ? "Đang đếm ngược <b>" + con + "</b>" : con === 0 ? "Giơ đáp án" : daDem ? "Đếm ngược lại 5 giây" : "Đếm ngược 5 giây");
    if (b.dataset.html !== html) { b.innerHTML = html; b.dataset.html = html; }
    b.disabled = con >= 0;
    b.classList.toggle("dang", con >= 0);
  }
  // buoc: bước bắt đầu của ván mới (mặc định "setup"; nút "Chơi lại từ đầu" của chế độ chơi thử vào thẳng "intro").
  //   9/11 04:11 UTC (thầy Thịnh: "mặc định trong cài đặt luôn luôn là đề cơ bản nha"): ván mới nào cũng bắt đầu bằng Đề cơ bản
  //   (giữ danh sách lớp, bỏ đề đã chọn của ván trước)
  function vanMoi(giuLop, buoc) {
    var s = ngauNhien(8), c = giuLop && S.cfg ? clone(S.cfg) : RD.cfgMacDinh(s);
    c.ses = s; c.at = Date.now(); delete c.de; delete c.d1Trai;      // 27/11 thầy: "mặc định đội 1 luôn nằm bên phải nhé"
    DB.set("cfg", c);
    DB.set("now", { ses: s, step: buoc || "setup", pub: {}, at: Date.now(), by: TAB });
    for (var q = 1; q <= 5; q++) DB.set("s" + q, { ses: s, q: q, cards: {}, man: {}, at: Date.now(), by: TAB });
    BL = {};
  }

  var ve = (function () {
    var hen = 0;
    return function () {
      if (hen) return;
      hen = requestAnimationFrame(function () {
        hen = 0;
        try { if (VAI === "tv") veTV(); else if (VAI === "dt") veDT(); } catch (e) { console.error(e); }
      });
    };
  })();

  /* ---------- tiếp và lùi ---------- */
  var choXacNhan = null;
  // 25/11 22:30 thầy Thịnh: "đội nào thắng thì đuốc sẽ được thắp sáng luôn nhé, không cần tôi bấm". Kéo xong câu 5, TV tự sang bước thắp
  //   đuốc (KC.khiXongCau5). Thầy quen tay bấm "Đốt đuốc" đúng lúc đó thì cú bấm sẽ rơi vào bước thắp đuốc và nhảy luôn sang bắt tay: máy
  //   nào vừa thấy bước thắp đuốc tự tới (now.tu) thì bỏ qua cú bấm "tiếp" trong 2 giây đầu (tính bằng đồng hồ của chính máy đó).
  var tuThay = { at: 0, luc: 0 };
  function ghiNhanTu(now) { if (now.step === "finish" && now.tu && tuThay.at !== now.at) { tuThay.at = now.at; tuThay.luc = performance.now(); } }
  function tiep(daDongY) {
    var now = nowHopLe(), i = RD.BUOC.indexOf(now.step);
    if (i < 0 || i >= RD.BUOC.length - 1) return;
    if (now.step === "finish" && now.tu && tuThay.at === now.at && performance.now() - tuThay.luc < 2000) return;
    var step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") {
      var lop = RD.lop(cfg());
      if (!lop.coMat) { thongBao("Chưa có bạn nào có mặt: kiểm tra sĩ số và số thẻ của hai đội."); return; }
    }
    // 18/11: hỏi lúc bấm Đáp án (bước "k"), không đợi tới lúc bấm Di chuyển: TV đã hiện đáp án thì máy thôi ghi thẻ (daHienDapAn),
    //   nên "Quét thêm" chỉ còn công bằng trước khi các em thấy đáp án.
    if (loai === "k" && !daDongY) {
      var kq = RD.doiCau(q, RD.lop(cfg()), scanHopLe(q));
      var trong = [];
      kq.forEach(function (r, d) { if (r.coMat > 0 && r.thay === 0) trong.push(RD.DOI[d].ten); });
      if (trong.length) {
        hoi((trong.length === 2 ? "Chưa đọc được thẻ nào ở câu " + q + "." : "Chưa đọc được thẻ nào của " + trong.join(", ") + " ở câu " + q + ".") + " Vẫn hiện đáp án?", "Vẫn hiện đáp án", "Quét thêm").then(function (ok) { if (ok) tiep(true); });
        return;
      }
    }
    A.mo();
    datBuoc(RD.BUOC[i + 1]);
  }
  function lui() {
    var now = nowHopLe(), i = RD.BUOC.indexOf(now.step);
    if (i <= 0) return;
    datBuoc(RD.BUOC[i - 1]);
  }
  // hộp hỏi trong trang (hộp thoại của trình duyệt không hiện trong Claude)
  function hoi(chu, co, khong) {
    return new Promise(function (ok) {
      if (VAI === "tv") {
        $("#cbChu").textContent = chu;
        $("#cbVan").textContent = co;
        $("#cbThem").textContent = khong;
        $("#canhBao").hidden = false;
        choXacNhan = function (v) { $("#canhBao").hidden = true; choXacNhan = null; ok(v); };
      } else {
        var m = $("#dtHoi");
        if (!m) {
          m = document.createElement("div");
          m.id = "dtHoi";
          m.innerHTML = '<div><h3></h3><div class="luoi"><button type="button" class="nut chinh" data-v="1"></button><button type="button" class="nut" data-v="0"></button></div></div>';
          m.style.cssText = "position:fixed;inset:0;z-index:45;background:rgba(20,12,4,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px";
          var o = m.firstChild;
          o.style.cssText = "width:100%;max-width:520px;background:var(--giay);border-radius:20px;padding:16px;border:3px solid var(--do)";
          o.querySelector(".luoi").style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px";
          document.body.appendChild(m);
        }
        m.querySelector("h3").textContent = chu;
        m.querySelector("[data-v='1']").textContent = co;
        m.querySelector("[data-v='0']").textContent = khong;
        m.hidden = false;
        m.onclick = function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          m.hidden = true;
          ok(b.dataset.v === "1");
        };
      }
    });
  }
  function thongBao(chu) {
    if (VAI === "tv") { var g = $("#goiY"); g.textContent = chu; g.hidden = false; clearTimeout(thongBao.t); thongBao.t = setTimeout(function () { g.hidden = true; }, 4000); }
    else { var tt = $("#dtTrangThai"); if (tt) { tt.textContent = chu; tt.className = "dt-tt loi"; } }
  }

  /* ---------- Claude ---------- */
  var mauP = null;
  function layMau() {
    if (!RD.trongClaude) return Promise.resolve(null);
    return mauP || (mauP = window.claude.use("sample").catch(function () { return null; }));
  }
  function lamSach(t) {
    return String(t || "").replace(/\s+/g, " ").replace(/^["“”'«»\s]+|["“”'«»\s]+$/g, "").slice(0, 320);
  }
  // Lời bình theo mẫu của thầy Thịnh (RD.loiBinhPhan, mẫu mới 5/11 16:10: "Ở câu hỏi này, Nhóm 1 và 2 có số bạn trả lời
  // đúng nhiều nhất nhưng tổng điểm vẫn thua Nhóm 3. Cố lên nào!"). Trong Claude: Claude giữ nguyên câu đầu và câu cuối
  // của thầy, chỉ được chèn vào giữa nhiều nhất một câu ngắn cho vui (không số, không tên nhóm, để không nói sai).
  function nhacClaude(q, sau, P) {
    var hang = RD.xepHang(sau);
    var dong = sau.map(function (r, t) {
      var c = r.cau[q] || { dung: 0, thay: 0, tram: 0 };
      return "- " + RD.TO[t].ten + ": câu này " + c.dung + "/" + c.thay + " bạn đúng, được " + RD.vietDiem(c.tram) + " điểm; tổng " + RD.vietDiem(r.tram) + " điểm, đang xếp thứ " + hang.hang[t] + ".";
    }).join("\n");
    return "Bạn là bình luận viên vui vẻ của trò chơi \"Rước đuốc\" trong tiết Toán lớp 6/3 (học sinh 11-12 tuổi). " +
      "Bốn nhóm trả lời 5 câu hỏi bằng thẻ Plickers; sau mỗi câu, mỗi nhóm nhận một mảnh ghép lấp khúc cầu còn thiếu để đại diện của nhóm đi tiếp, nhóm nhiều điểm hơn tiến nhanh hơn. " +
      "Điểm mỗi câu là phần trăm bạn trong nhóm trả lời đúng (tối đa 100), câu 5 nhân đôi (tối đa 200).\n" +
      "Vừa công bố câu " + q + "/5. Số liệu:\n" + dong + "\n" +
      "Thầy giáo đã viết sẵn lời bình theo mẫu của thầy, đúng số liệu:\n" + P.chu + "\n" +
      "Giữ nguyên từng chữ câu đầu và câu cuối của thầy. Chỉ được chèn vào giữa hai câu đó nhiều nhất một câu ngắn (tối đa 12 từ) cho vui, sinh động, ví dụ khen cả lớp hay nói cuộc đua đang gay cấn; câu chèn không có chữ số, không nêu tên nhóm. Không chèn cũng được.\n" +
      "1. Bắt đầu đúng bằng: " + P.dau + "\n" +
      "2. Kết thúc đúng bằng: " + P.cuoi + "\n" +
      "Tiếng Việt có dấu, không emoji, không dấu ngoặc kép, không nhắc đáp án hay phép tính, không chê nhóm nào. Chỉ trả về lời bình.";
  }
  // lời Claude viết phải giữ nguyên câu đầu, câu cuối của thầy; phần chèn giữa ngắn, không số, không tên nhóm.
  // Lệch thì dùng đúng lời theo mẫu.
  function hopKhuon(t, P, q, sau) {
    var n = function (x) { return String(x || "").normalize("NFC").toLowerCase().replace(/[\s\u00a0]+/g, " ").trim(); };
    var tt = n(t), d = n(P.dau), c = n(P.cuoi);
    if (!P.dau || !P.cuoi || tt.length > 320 || tt.length < d.length + c.length) return false;
    if (tt.indexOf(d) !== 0 || tt.slice(-c.length) !== c) return false;
    var giua = tt.slice(d.length, tt.length - c.length).trim();
    if (!giua) return true;
    // ("tổng điểm" vẫn được, chỉ cấm chữ "tổ" đứng riêng)
    if (giua.split(" ").length > 15 || /\d/.test(giua) || /nhóm/.test(giua) || /(^|[\s,.;:!?])tổ([\s,.;:!?]|$)/.test(giua)) return false;
    void q; void sau;
    return true;
  }
  var BL = {}, lanBL = 0;
  function binhLuan(q, truoc, sau) {
    var key = ses() + ":" + q, P = RD.loiBinhPhan(q, truoc, sau), lan = ++lanBL;
    var xong = false, ctl = null;
    var dung = function (chu, tuClaude) {
      if (xong) return;
      xong = true;
      BL[key] = { chu: chu, claude: !!tuClaude };
      if (lan === lanBL && dangOR(q)) SK.binh(q, chu);
    };
    if (!RD.trongClaude || !P.dau) { dung(P.chu); return; }
    SK.binh(q, "");      // bóng nói hiện dấu chờ cho tới khi Claude viết xong
    var hen = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* bỏ qua */ } dung(P.chu); }, 10000);
    layMau().then(function (sample) {
      if (!sample) throw { code: "khong_co" };
      ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      return sample(nhacClaude(q, sau, P), { modelTier: "quick", cache: false, signal: ctl ? ctl.signal : undefined });
    }).then(function (r) {
      clearTimeout(hen);
      var t = lamSach(r && r.text);
      if (!hopKhuon(t, P, q, sau)) throw { code: "lech_mau" };
      dung(t, true);
    }).catch(function () { clearTimeout(hen); dung(P.chu); });
  }
  function dangOR(q) { var n = nowHopLe(); return VAI === "tv" && n.step === "r" + q; }
  // 8/11 thầy Thịnh: "tôi bấm vào thì cả 4 nhóm lên đốt đuốc, claude bình luận về thứ hạng". Lời bình thứ hạng theo mẫu
  //   (RD.loiBinhHang); trong Claude, Claude giữ nguyên câu đầu (thứ hạng) và câu kết, chỉ được chèn vào giữa một câu ngắn
  //   không số, không tên nhóm (như lời bình từng câu). Hiện ở bước Tổng kết khi ngọn đuốc cuối đã sáng.
  function nhacClaudeHang(sau, P) {
    var hang = RD.xepHang(sau);
    var dong = hang.thuTu.map(function (t) { return "- " + RD.TO[t].ten + ": tổng " + RD.vietDiem(sau[t].tram) + " điểm, hạng " + hang.hang[t] + "."; }).join("\n");
    return "Bạn là bình luận viên vui vẻ của trò chơi \"Rước đuốc\" trong tiết Toán lớp 6/3 (học sinh 11-12 tuổi). " +
      "Bốn nhóm vừa trả lời xong 5 câu hỏi, cả bốn nhóm đã lên thắp đuốc theo thứ hạng. Kết quả chung cuộc:\n" + dong + "\n" +
      "Thầy giáo đã viết sẵn lời bình thứ hạng, đúng kết quả:\n" + P.chu + "\n" +
      "Giữ nguyên từng chữ câu đầu và câu cuối của thầy. Chỉ được chèn vào giữa hai câu đó nhiều nhất một câu ngắn (tối đa 12 từ) cho vui, ví dụ khen tinh thần thi đua của cả lớp; câu chèn không có chữ số, không nêu tên nhóm. Không chèn cũng được.\n" +
      "1. Bắt đầu đúng bằng: " + P.dau + "\n" +
      "2. Kết thúc đúng bằng: " + P.cuoi + "\n" +
      "Tiếng Việt có dấu, không emoji, không dấu ngoặc kép, không chê nhóm nào. Chỉ trả về lời bình.";
  }
  function khoaHang(sau) { return ses() + ":hang:" + sau.map(function (r) { return r.tram; }).join(","); }
  function binhLuanHang(sau) {
    var key = khoaHang(sau), P = RD.loiBinhHang(sau), lan = ++lanBL, xong = false, ctl = null;
    var dung = function (chu, tuClaude) {
      if (xong) return;
      xong = true;
      BL[key] = { chu: chu, claude: !!tuClaude };
      if (lan === lanBL && VAI === "tv" && nowHopLe().step === "rank") SK.binh(6, chu);
    };
    if (!RD.trongClaude) { dung(P.chu); return; }
    SK.binh(6, "");      // bóng nói hiện dấu chờ cho tới khi Claude viết xong
    var hen = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* bỏ qua */ } dung(P.chu); }, 10000);
    layMau().then(function (sample) {
      if (!sample) throw { code: "khong_co" };
      ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      return sample(nhacClaudeHang(sau, P), { modelTier: "quick", cache: false, signal: ctl ? ctl.signal : undefined });
    }).then(function (r) {
      clearTimeout(hen);
      var t = lamSach(r && r.text);
      if (!hopKhuon(t, P)) throw { code: "lech_mau" };
      dung(t, true);
    }).catch(function () { clearTimeout(hen); dung(P.chu); });
  }

  /* ---------- khung chuẩn bị (dùng chung cho TV và điện thoại) ---------- */
  function dungChuanBi(el) {
    // 25/11 20:14 thầy Thịnh: "bây giờ chỉ có hai đội thôi ... bạn cứ làm cho tôi là 50 số đi ... bữa đó tôi sẽ nhập vô rồi chia thành hai đội"
    var to = RD.DOI.map(function (t, i) {
      return '<span class="ten" style="--m:' + t.mau + ';--d:' + t.dam + '"><i></i>' + t.ten + '</span>' +
        '<input type="text" data-cb="ds" data-t="' + i + '" inputmode="numeric" autocomplete="off" aria-label="Số thẻ của ' + t.ten + '">' +
        '<span class="dem" data-cb="dem" data-t="' + i + '"></span>';
    }).join("");
    el.innerHTML =
      '<div class="cb">' +
      // 8/11 thầy Thịnh: "ở trang đầu sẽ cho chọn Đề cơ bản và nâng cao"
      '<div class="cb-khoi"><h3>1. Chọn đề</h3><div class="cb-de-nut" role="radiogroup" aria-label="Chọn đề">' +
      RD.THU_TU_DE.map(function (k) {
        return '<button type="button" role="radio" aria-checked="false" data-de="' + k + '"><span class="dau"><i aria-hidden="true"></i><b>' +
          esc(RD.TEN_DE[k]) + '</b></span><small>' + esc(RD.MO_TA_DE[k]) + '</small></button>';
      }).join("") + '</div><p class="cb-ghi" data-cb="deGhi"></p></div>' +
      '<div class="cb-khoi"><h3>2. Sĩ số và 2 đội</h3>' +
      '<div class="cb-hang"><label>Sĩ số lớp <input type="number" min="2" max="' + RD.SO_THE + '" data-cb="siSo"></label>' +
      '<button type="button" class="nut" data-cb="chia">Chia đôi lớp thành 2 đội</button></div>' +
      '<div class="cb-to">' + to + '</div>' +
      '<p class="cb-ghi">Nhập sĩ số thì lớp tự chia đôi, ví dụ 46 bạn: Đội 1 thẻ 1-23, Đội 2 thẻ 24-46. Muốn chia khác thì ghi lại số thẻ của từng đội, ví dụ 1-20, 45. Nhận số thẻ từ 1 đến ' + RD.SO_THE + '; bộ thẻ đã in có số 1 đến ' + RD.MAXID + '.</p>' +
      '<p class="cb-loi" data-cb="loi" hidden></p></div>' +
      '<div class="cb-khoi"><h3>3. Chạm vào số thẻ của bạn vắng hôm nay</h3><div class="cb-luoi" data-cb="luoi"></div><p class="cb-tom" data-cb="tom"></p></div>' +
      '<div class="cb-khoi"><h3>4. Nối điện thoại với TV</h3><div data-cb="noi"></div></div>' +
      '<div class="cb-khoi" data-cb="khoiClaude" hidden><h3>5. Claude bình luận trên TV</h3>' +
      '<div class="cb-hang"><button type="button" class="nut" data-cb="claude">Kiểm tra Claude</button><span class="chip" data-cb="claudeTT">Chưa kiểm tra</span></div>' +
      '<p class="cb-ghi">Bấm một lần trên laptop nối TV trước giờ học: nếu Claude cần xin phép thì hộp xin phép hiện lúc này, không hiện giữa tiết.</p></div>' +
      '<div class="cb-khoi" data-cb="khoiAnh" hidden><h3>5. Ảnh báo tường</h3>' +
      '<div class="cb-hang"><label class="nut"><input type="file" accept="image/*" data-cb="anh" hidden>Chọn ảnh báo tường từ máy</label><span class="chip" data-cb="anhTT"></span></div>' +
      '<p class="cb-ghi">Ảnh có hình thầy cô nên không đưa lên mạng: ảnh chỉ nằm trong trình duyệt của máy này. Chưa chọn thì trang dùng tấm báo tường vẽ tạm. Ảnh mới nhất là file <b>bao-tuong-A0-4-o-A3-xem-truoc.jpg</b> (bản 15/11, số 51 màu đỏ): máy nào chọn ảnh trước ngày đó thì chọn lại một lần.</p></div>' +
      // 25/11 16:18 thầy Thịnh: "đội 1 và đổi 2 đảo vị trí cho nhau nhé, có thêm nút đổi bên trong cài đặt nhé"
      '<div class="cb-khoi"><h3>Vị trí hai đội trên TV</h3>' +
      '<div class="cb-hang"><button type="button" class="nut" data-cb="doiBen">Đổi bên</button><span class="chip" data-cb="benTT"></span></div>' +
      '<p class="cb-ghi">Bấm để hai đội đổi chỗ cho nhau trên TV (bảng điểm, cây đuốc và thước nấc đổi theo). Nên xếp theo đúng chỗ ngồi của hai đội trong lớp.</p></div>' +
      '<div class="cb-khoi"><h3>Chơi thử và ván mới</h3>' +
      '<div class="cb-hang"><label><input type="checkbox" data-cb="thu"> Chơi thử không cần điện thoại: TV tự điền kết quả ngẫu nhiên cho mỗi câu</label></div>' +
      '<div class="cb-hang" style="margin-top:10px"><button type="button" class="nut" data-cb="vanMoi">Ván mới (xóa kết quả, giữ danh sách lớp)</button>' +
      '<button type="button" class="nut" data-cb="doiVai">Đổi vai máy này</button></div></div>' +
      '</div>';
    var q = function (s) { return el.querySelector('[data-cb="' + s + '"]'); };
    q("siSo").addEventListener("change", function () {
      var n = Math.max(2, Math.min(RD.SO_THE, parseInt(this.value, 10) || 45));
      ghiCfg(function (c) { c.siSo = n; c.ds = RD.chiaDoi(n); c.vang = (c.vang || []).filter(function (id) { return id <= n; }); });
    });
    q("chia").addEventListener("click", function () {
      ghiCfg(function (c) { c.ds = RD.chiaDoi(c.siSo || 45); });
    });
    $$('[data-cb="ds"]', el).forEach(function (inp) {
      inp.addEventListener("change", function () {
        var t = +this.dataset.t, v = RD.vietDanhSach(RD.docDanhSach(this.value));
        ghiCfg(function (c) { var L = RD.lopDoi(RD.lop(c)), hai = [L[0].ds, L[1].ds]; hai[t] = v; c.ds = [hai[0], "", hai[1], ""]; });
      });
    });
    q("luoi").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.classList.contains("ngoai")) return;
      var id = +b.dataset.id;
      ghiCfg(function (c) {
        var v = (c.vang || []).slice(), k = v.indexOf(id);
        if (k >= 0) v.splice(k, 1); else v.push(id);
        c.vang = v.sort(function (a, b) { return a - b; });
      });
    });
    q("claude").addEventListener("click", function () {
      var tt = q("claudeTT");
      tt.className = "chip cho"; tt.textContent = "Đang hỏi Claude…";
      layMau().then(function (sample) {
        if (!sample) throw { code: "khong_co" };
        return sample("Trả lời đúng hai chữ: Sẵn sàng", { modelTier: "quick", cache: false });
      }).then(function (r) {
        tt.className = "chip ok"; tt.textContent = "Claude sẵn sàng: " + lamSach(r.text).slice(0, 40);
      }).catch(function (e) {
        var c = e && e.code;
        tt.className = "chip loi";
        tt.textContent = c === "not_granted" ? "Chưa cho phép Claude: mở menu Quyền của trang để cho phép" :
          c === "khong_co" ? "Máy này chưa dùng được Claude (cần mở trang trong Claude, đã đăng nhập)" :
          c === "rate_limited" ? "Claude đang bận, thử lại sau ít phút" : "Chưa gọi được Claude (" + (c || "lỗi") + ")";
      });
    });
    q("anh").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      luuAnhBao(f).then(function () { capNhatChuanBi(el); });
      if (SK.anhBao) SK.anhBao(RD.anhBao);
      this.value = "";
    });
    q("thu").addEventListener("change", function () { var on = this.checked; ghiCfg(function (c) { c.thu = on; }); });
    q("doiBen").addEventListener("click", function () { ghiCfg(function (c) { c.d1Trai = RD.d1Trai(c) ? false : c.ses; }); });      // 27/11: chỉ đổi trong ván này
    $$("[data-de]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = this.dataset.de;
        if (!duocDoiDe() || k === RD.deDang) return;
        RD.chonDe(k);
        ghiCfg(function (c) { c.de = k; });
        ve();
      });
    });
    var bVM = q("vanMoi"), henVM = 0;
    bVM.addEventListener("click", function () {
      if (!bVM.dataset.cho) {
        bVM.dataset.cho = "1"; bVM.textContent = "Bấm lần nữa để xóa kết quả"; bVM.classList.add("vang");
        henVM = setTimeout(function () { delete bVM.dataset.cho; bVM.textContent = "Ván mới (xóa kết quả, giữ danh sách lớp)"; bVM.classList.remove("vang"); }, 4000);
        return;
      }
      clearTimeout(henVM);
      delete bVM.dataset.cho; bVM.textContent = "Ván mới (xóa kết quả, giữ danh sách lớp)"; bVM.classList.remove("vang");
      vanMoi(true);
    });
    q("doiVai").addEventListener("click", function () {
      lsSet("rd-vai", "");
      Q.Live.dung();
      location.hash = "";
      location.reload();
    });
  }
  function capNhatChuanBi(el) {
    if (!el || !el.firstChild) return;
    var c = cfg(), lop = RD.lop(c), hai = RD.lopDoi(lop);
    var q = function (s) { return el.querySelector('[data-cb="' + s + '"]'); };
    var siSo = q("siSo");
    if (document.activeElement !== siSo) siSo.value = c.siSo || 45;
    $$('[data-cb="ds"]', el).forEach(function (inp) {
      var t = +inp.dataset.t;
      if (document.activeElement !== inp) inp.value = hai[t].ds;
    });
    $$('[data-cb="dem"]', el).forEach(function (sp) {
      var x = hai[+sp.dataset.t];
      sp.textContent = x.coMat.length + "/" + x.ids.length + " có mặt";
    });
    var loi = q("loi");
    loi.hidden = !lop.trung.length;
    if (lop.trung.length) loi.textContent = "Thẻ số " + lop.trung.join(", ") + " đang nằm ở cả 2 đội, mỗi thẻ chỉ để ở 1 đội.";
    var luoi = q("luoi"), html = "";
    for (var id = 1; id <= RD.SO_THE; id++) {
      var t = RD.doiCuaThe(lop, id), T = t ? RD.DOI[t - 1] : null;
      var cls = !t ? "ngoai" : (lop.vang[id] ? "vang" : "");
      html += '<button type="button" data-id="' + id + '" class="' + cls + '"' + (T ? ' style="--m:' + T.mau + ';--d:' + T.dam + ';--n:' + T.nhat + '"' : "") +
        ' aria-pressed="' + (lop.vang[id] ? "true" : "false") + '" aria-label="Thẻ ' + id + (T ? ", " + T.ten : ", ngoài lớp") + (lop.vang[id] ? ", vắng" : "") + '">' + id + "</button>";
    }
    if (luoi.dataset.html !== html) { luoi.innerHTML = html; luoi.dataset.html = html; }
    q("tom").textContent = "Có mặt " + lop.coMat + "/" + lop.tong + " bạn · " + hai.map(function (x, i) { return RD.DOI[i].ten + ": " + x.coMat.length; }).join(" · ");
    // nối máy
    var noi = q("noi"), dong = '<div class="cb-hang"><span class="chip ' + esc(NOI.kieu) + '">' + esc(NOI.chu) + "</span>";
    if (S.ph && S.ph.at) dong += '<span class="chip ok">Điện thoại mở trang lúc ' + gio(S.ph.at) + "</span>";
    dong += "</div>";
    if (RD.trongClaude) {
      dong += '<p class="cb-ghi">Trên điện thoại: mở đúng đường link của trang này bằng Chrome (đã đăng nhập cùng tài khoản Claude), chọn <b>Điện thoại</b>. Trên laptop nối TV: chọn <b>Màn hình TV</b>.</p>';
    } else {
      var url = location.href.split("#")[0] + "#dien-thoai";
      dong += '<div class="cb-qr" style="margin-top:10px"><span data-cb="qr"></span><div style="min-width:0;flex:1"><p class="cb-ghi" style="margin-top:0">Điện thoại quét mã này (hoặc mở đường link) bằng Chrome:</p><div class="cb-link">' + esc(url) + "</div>" +
        (window.RD_FIREBASE ? "" : '<p class="cb-ghi"><b>Chưa cài Firebase</b> nên điện thoại chưa gửi được kết quả sang TV. Vẫn thử được: quét thẻ trên điện thoại, hoặc chơi thử trên TV.</p>') + "</div></div>";
    }
    if (noi.dataset.html !== dong) {
      noi.innerHTML = dong; noi.dataset.html = dong;
      var qrEl = q("qr");
      if (qrEl && window.qrcode) {
        try { var qr = window.qrcode(0, "M"); qr.addData(location.href.split("#")[0] + "#dien-thoai"); qr.make(); qrEl.innerHTML = qr.createImgTag(4, 8, "Mã QR mở trang trên điện thoại"); } catch (e) { /* bỏ qua */ }
      }
    }
    q("khoiClaude").hidden = !RD.trongClaude || VAI !== "tv";
    q("khoiAnh").hidden = RD.trongClaude || VAI !== "tv";
    var att = q("anhTT");
    att.className = "chip " + (RD.anhBao ? "ok" : "");
    att.textContent = RD.anhBao ? "Đã có ảnh trên máy này" : "Chưa chọn ảnh";
    q("thu").checked = !!c.thu;
    q("benTT").textContent = RD.d1Trai(c) ? "Đội 1 bên trái, Đội 2 bên phải" : "Đội 2 bên trái, Đội 1 bên phải";
    // bộ đề: chọn được cho tới khi hiện câu 1; đang chơi thì chỉ còn sáng ô đề đang dùng
    var doiDuoc = duocDoiDe();
    $$("[data-de]", el).forEach(function (b) {
      var on = b.dataset.de === RD.deDang;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.disabled = !doiDuoc && !on;
    });
    var dg = q("deGhi"), dgChu = doiDuoc ? "TV và điện thoại dùng chung đề này. Đổi được cho tới lúc hiện câu 1." :
      "Đang chơi " + RD.TEN_DE[RD.deDang] + ". Muốn đổi đề thì bấm Ván mới ở dưới.";
    if (dg.textContent !== dgChu) dg.textContent = dgChu;
  }
  // đổi đề chỉ được trước khi hiện câu 1 (ván này chưa có thẻ nào được quét), để các câu đã chơi không bị chấm lại theo đáp án khác
  function duocDoiDe() {
    var st = nowHopLe().step;
    if (st !== "setup" && st !== "intro") return false;
    for (var q = 1; q <= 5; q++) {
      var sc = scanHopLe(q);
      if (sc && (Object.keys(sc.cards || {}).length || Object.keys(sc.man || {}).length)) return false;
    }
    return true;
  }

  /* ---------- ảnh báo tường ---------- */
  RD.anhBao = RD.trongClaude ? "../anh/bao-tuong.webp" : null;
  // 14/11: báo tường đổi mẫu (bản 7, băng rôn ba dòng chữ, số 51 đỏ), chỗ vải xanh và chỗ 4 nhóm đứng đổi theo. Ảnh mẫu cũ còn lưu trong
  //   trình duyệt (khoá "baoTuong") không khớp chỗ nữa nên trang không dùng: trang chỉ đọc khoá mới, thầy chọn lại một lần. Lúc
  //   chọn, ảnh mới ghi vào cả hai khoá, để trang Xếp thiệp (đọc khoá "baoTuong") cũng có ảnh mới.
  var KHOA_ANH = "baoTuong2";
  function moIdb() {
    return new Promise(function (ok, bad) {
      if (!window.indexedDB) { bad(new Error("no idb")); return; }
      var r = indexedDB.open("ruoc-duoc", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("f"); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { bad(r.error); };
    });
  }
  function luuAnhBao(file) {
    if (RD.anhBao && RD.anhBao.indexOf("blob:") === 0) URL.revokeObjectURL(RD.anhBao);
    RD.anhBao = URL.createObjectURL(file);
    return moIdb().then(function (db) {
      return new Promise(function (ok) {
        var tx = db.transaction("f", "readwrite");
        var st = tx.objectStore("f");
        st.put(file, KHOA_ANH);
        st.put(file, "baoTuong");            // trang Xếp thiệp (xep-thiep/) lấy ảnh ở khoá này khi chưa chọn ảnh riêng
        tx.oncomplete = function () { ok(); };
        tx.onerror = function () { ok(); };
      });
    }).catch(function () { /* chỉ giữ trong lần mở này */ });
  }
  function napAnhBao() {
    if (RD.trongClaude) return Promise.resolve();
    return moIdb().then(function (db) {
      return new Promise(function (ok) {
        var r = db.transaction("f").objectStore("f").get(KHOA_ANH);
        r.onsuccess = function () { if (r.result) RD.anhBao = URL.createObjectURL(r.result); ok(); };
        r.onerror = function () { ok(); };
      });
    }).catch(function () { /* bỏ qua */ });
  }

  /* =====================================================================
     MÀN HÌNH TV
     ===================================================================== */
  var tvTruoc = null, tvDaDien = null, tvDaDienSes = null, moCB = false, henThu = 0, coNow = false;
  // 9/11 06:20 UTC thầy Thịnh: "cho thêm nút thoát vô đây" (bảng Cài đặt). anCB: ở bước chuẩn bị (setup) thầy đã bấm Thoát nên
  //   bảng không tự hiện nữa, sân khấu hiện ra; bấm Cài đặt thì bảng hiện lại. Rời bước setup thì anCB về false.
  var anCB = false;
  function bangCBMo() { return !$("#chuanBiTV").hidden; }
  function thoatCB() { moCB = false; if (nowHopLe().step === "setup") anCB = true; ve(); }
  function khoiTV() {
    $("#tv").hidden = false;
    SK.khoiTao();
    KC.khoiTao();
    // nút trên sân kéo co (phần kết): "Tiếp theo" ở bước finish
    KC.khiBam = function () { if (nowHopLe().step === "finish") tiep(); };
    // 25/11 22:30: kéo xong câu 5 thì tự sang bước thắp đuốc (chỉ khi vẫn đang ở bước kéo câu 5)
    KC.khiXongCau5 = function () { if (nowHopLe().step === "r5") datBuoc("finish", true); };
    SK.khiBamLuat = function (an) { SK.anLuat(an); ghiLuat(!an); };   // 9/11: điện thoại cũng thấy, cũng đổi được
    A.taiNhac();
    if (A.taiVoTay) A.taiVoTay();
    dungChuanBi($("#cbTV"));
    napAnhBao().then(function () { if (RD.anhBao) SK.anhBao(RD.anhBao); ve(); });
    for (var q = 1; q <= 5; q++) taoVideo(q);      // tải sẵn hình chuyển động của 5 câu
    napAnhTinh();                                   // và ảnh tĩnh của Đề demo
    // bảng mở bằng nút Cài đặt (moCB) ở bước chuẩn bị rồi bấm Bắt đầu trò chơi: tắt moCB trước, kẻo bảng còn che màn giới thiệu
    $("#nutBatDau").addEventListener("click", function () { A.mo(); moCB = false; if (nowHopLe().step === "setup") tiep(); else ve(); });
    $("#nutFullTV").addEventListener("click", toanManHinh);
    $("#nutThoatCB").addEventListener("click", function () { A.mo(); thoatCB(); });
    // 8/11: hai cụm nút (góc trái #tvNut, góc phải #tvNutPhai: Cài đặt, Chơi lại từ đầu) dùng chung một cách bấm
    $$(".tv-nut").forEach(function (bar) { bar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      A.mo();
      var k = b.dataset.tv;
      if (k === "tiep") { if (choXacNhan) choXacNhan(true); else tiep(); }
      else if (k === "lui") { if (choXacNhan) choXacNhan(false); else lui(); }
      else if (k === "full") toanManHinh();
      else if (k === "am") { A.datBat(!A.bat); veNutAm(true); }
      else if (k === "nho") doiAm(-0.1);
      else if (k === "to") doiAm(0.1);
      else if (k === "cb") { if (bangCBMo()) thoatCB(); else { moCB = true; ve(); } }
      else if (k === "thu") dienThu(RD.cauCuaBuoc(nowHopLe().step), true);
      else if (k === "lai") choiLaiTuDau();
      else if (k === "dem") batDemNguoc();
    }); });
    datGoiNut();
    veNutAm(false);
    $("#nutThuHang").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "finish") tiep(); });
    $("#nutTiepTheo").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "rank") tiep(); });
    $("#nutHienBao").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "tuong") tiep(); });
    // 15/11: nút "Tấm thiệp của nhóm em" (hiện sau hoạt cảnh cuối) mở trang Xếp thiệp. Trên GitHub trang đó nằm cạnh trang này
    //   (xep-thiep/), mở ngay trong thẻ đang xem. Trong Claude không có trang đó: mở trang GitHub ở thẻ mới.
    var nutThiep = $("#nutThiep");
    if (nutThiep && RD.trongClaude) { nutThiep.href = "https://vtthinh28.github.io/ruoc-duoc/xep-thiep/"; nutThiep.target = "_blank"; nutThiep.rel = "noopener"; }
    $("#cbVan").addEventListener("click", function () { if (choXacNhan) choXacNhan(true); });
    $("#cbThem").addEventListener("click", function () { if (choXacNhan) choXacNhan(false); });
    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
      var k = e.key;
      A.mo();
      if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "Enter" || k === "ArrowDown") {
        e.preventDefault();
        if (choXacNhan) choXacNhan(true); else tiep();
      } else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp" || k === "Backspace") {
        e.preventDefault();
        if (choXacNhan) choXacNhan(false); else lui();
      } else if (k === "Escape") { if (choXacNhan) choXacNhan(false); else if (bangCBMo()) thoatCB(); }
      else if (k === "f" || k === "F") toanManHinh();
      else if (k === "m" || k === "M") { A.datBat(!A.bat); veNutAm(true); }
      else if (k === "+" || k === "=") doiAm(0.1);
      else if (k === "-" || k === "_") doiAm(-0.1);
      else if (k === "d" || k === "D" || k === "đ" || k === "Đ") batDemNguoc();
    });
    document.addEventListener("pointerdown", function () { A.mo(); }, { passive: true });
    // ẩn con trỏ chuột khi không dùng; các nút góc trái dưới luôn hiện (6/11 thầy Thịnh: "mấy nút này mặc định là luôn hiện")
    var henChuot = 0;
    var hien = function () {
      var tv = $("#tv"), daAn = tv.classList.contains("an-chuot");
      tv.classList.remove("an-chuot");
      if (daAn) veGoi();                 // chuột cử động lại: hiện lại bóng chữ của nút đang trỏ
      clearTimeout(henChuot);
      henChuot = setTimeout(function () { $("#tv").classList.add("an-chuot"); veGoi(); }, 3500);
    };
    document.addEventListener("mousemove", hien, { passive: true });
    hien();
    giuManHinh();
    // 8/11 thầy Thịnh: "thu nhỏ lại thì phần phím bị đè lên đáp án". Thẻ câu hỏi dừng trên hai cụm nút (san-khau.js đặt
    //   --dayThe theo cỡ cửa sổ, chạy trước hàm này), nên đổi cỡ cửa sổ thì xếp lại hình và cỡ chữ của câu đang hiện
    window.addEventListener("resize", function () { if (mcHien && mcDang) xepLaiManCau(mcDang); veGoi(); });
    document.addEventListener("fullscreenchange", function () { if (mcHien && mcDang) xepLaiManCau(mcDang); });
  }
  // 6/11 chiều, thầy Thịnh: "trong game có nút tăng giảm âm lượng". Nút loa giữa: bật/tắt tiếng; vạch sóng trên loa theo độ to.
  function veNutAm(baoTin) {
    var b = $('[data-tv="am"]'), pt = Math.round(A.muc * 100);
    b.setAttribute("aria-pressed", A.bat ? "true" : "false");
    b.dataset.muc = !A.bat || A.muc <= 0 ? "0" : A.muc < 0.7 ? "1" : "2";
    b.setAttribute("aria-label", "Bật hoặc tắt âm thanh (phím M), đang " + (A.bat ? pt + "%" : "tắt tiếng"));
    $('[data-tv="nho"]').disabled = A.muc <= 0;
    $('[data-tv="to"]').disabled = A.muc >= (A.MUC_MAX || 1);
    if (baoTin) baoAm(A.bat ? "Âm lượng " + pt + "%" : "Đã tắt tiếng (bấm nút loa hoặc phím M để bật lại)");
    else veGoi();
  }
  // 8/11 thầy Thịnh: "các nút bấm bên dưới khi tôi để chuột vào thì sẽ hiện lên công dụng. Âm lượng để sát vào bên trái".
  //   Một bóng chữ (#tvGoi): trỏ chuột vào nút nào thì hiện công dụng ngay trên nút đó (cụm góc phải: canh mép phải nút;
  //   hai cụm dựng cột lúc báo tường thì hiện bên cạnh nút, phía trong màn hình). Đổi âm lượng (nút hay phím) thì bóng chữ
  //   hiện "Âm lượng …%" sát mép trái hàng nút trong 2 giây (trước đây hiện ở góc phải dưới màn hình).
  var GOI_NUT = {
    lui: "Lùi lại một bước (phím ←)",
    tiep: "Sang bước tiếp theo (phím → hoặc dấu cách)",
    thu: "Điền kết quả chơi thử cho câu này",
    lai: "Chơi lại từ đầu, xóa kết quả chơi thử",
    nho: "Giảm âm lượng (phím −)",
    to: "Tăng âm lượng (phím +)",
    dem: "Đếm ngược 5 giây rồi cả lớp giơ thẻ (phím D)",
    cb: "Cài đặt"           // 9/11 04:11 UTC (thầy Thịnh: "cái này ghi cài đặt là được rồi")
  };
  function chuGoi(b) {
    var k = b.dataset.tv;
    if (k === "am") return (A.bat ? "Tắt tiếng" : "Bật tiếng") + " (phím M), âm lượng " + Math.round(A.muc * 100) + "%";
    if (k === "full") return document.fullscreenElement ? "Thoát toàn màn hình (phím F)" : "Chiếu toàn màn hình (phím F)";
    return GOI_NUT[k] || b.getAttribute("aria-label") || "";
  }
  var GOI = { nut: null, amDen: 0, amChu: "", hen: 0 };
  function veGoi() {
    var el = $("#tvGoi");
    if (!el) return;
    var am = Date.now() < GOI.amDen, nut = am ? $('[data-tv="am"]') : GOI.nut;
    var anChuot = $("#tv").classList.contains("an-chuot");
    var bar = nut && nut.closest(".tv-nut");
    if (!nut || !bar || nut.hidden || !nut.offsetParent || (!am && anChuot)) { el.hidden = true; return; }
    var chu = am ? GOI.amChu : chuGoi(nut), doc = bar.classList.contains("doc"), phai = bar.id === "tvNutPhai";
    if (el.textContent !== chu) el.textContent = chu;
    el.classList.toggle("am", am && !doc);
    el.classList.toggle("doc", doc);
    el.classList.toggle("phai", phai);
    el.hidden = false;
    var rb = bar.getBoundingClientRect(), rn = nut.getBoundingClientRect();
    var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight;
    if (doc) {                                       // cột nút sát mép: bóng chữ bên cạnh nút, phía trong màn hình
      el.style.top = (rn.top + rn.height / 2) + "px"; el.style.bottom = "auto";
      if (phai) { el.style.left = "auto"; el.style.right = (vw - rn.left + 12) + "px"; }
      else { el.style.right = "auto"; el.style.left = (rn.right + 12) + "px"; }
    } else {                                         // hàng nút dưới đáy: bóng chữ ngay trên nút
      el.style.top = "auto"; el.style.bottom = (vh - rb.top + 12) + "px";
      if (phai) {
        el.style.left = "auto"; el.style.right = (vw - rn.right) + "px";
        el.style.setProperty("--mui", (rn.width / 2) + "px");
      } else {
        var trai = am ? rb.left : rn.left;           // chữ âm lượng sát mép trái hàng nút
        el.style.right = "auto"; el.style.left = trai + "px";
        el.style.setProperty("--mui", (rn.left - trai + rn.width / 2) + "px");
      }
    }
  }
  function baoAm(chu) {
    GOI.amChu = chu; GOI.amDen = Date.now() + 2000;
    clearTimeout(GOI.hen); GOI.hen = setTimeout(veGoi, 2050);
    veGoi();
  }
  function datGoiNut() {
    $$(".tv-nut").forEach(datGoiCum);
    document.addEventListener("fullscreenchange", veGoi);
  }
  function datGoiCum(bar) {
    bar.addEventListener("pointerover", function (e) {
      var b = e.target.closest && e.target.closest("button");
      if (e.pointerType === "touch" || !b || !bar.contains(b) || b === GOI.nut) return;
      GOI.nut = b; veGoi();
    });
    bar.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest("button");
      if (!b || b !== GOI.nut || (e.relatedTarget && b.contains(e.relatedTarget))) return;
      GOI.nut = null; veGoi();
    });
    bar.addEventListener("click", function () { setTimeout(veGoi, 0); });     // chữ đổi theo (bật/tắt tiếng, toàn màn hình)
  }
  function doiAm(d) {
    A.datMuc(A.muc + d);
    if (d > 0 && !A.bat) A.datBat(true);         // đang tắt tiếng mà bấm tăng thì bật lại tiếng
    veNutAm(true);
  }
  // 6/11 chiều, thầy Thịnh: "trong chế độ chơi thử có thêm nút chơi lại từ đầu". Xóa kết quả chơi thử, giữ danh sách lớp và
  //   chế độ chơi thử, vào lại màn giới thiệu (luật chơi).
  var choiLaiCho = false;
  function choiLaiTuDau() {
    if (!cfg().thu || nowHopLe().step === "setup") return;
    hoi("Chơi lại từ đầu? Kết quả chơi thử sẽ được xóa.", "Chơi lại", "Thôi").then(function (ok) {
      if (!ok) return;
      clearTimeout(henThu);
      choiLaiCho = true;
      vanMoi(true, "intro");
    });
  }
  function toanManHinh() {
    var d = document;
    try {
      if (d.fullscreenElement) d.exitFullscreen();
      else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () { thongBao("Bấm F11 để chiếu toàn màn hình."); });
      else thongBao("Bấm F11 để chiếu toàn màn hình.");
    } catch (e) { thongBao("Bấm F11 để chiếu toàn màn hình."); }
  }
  // 25/11/2026 thầy Thịnh (08:01): "... sẽ có một cái chế độ cài đặt mặc định là khi đã mở ứng dụng thì màn hình điện thoại sẽ không tắt."
  //   Trước đây điện thoại chỉ xin giữ màn hình sáng lúc mở camera (TV thì xin ngay từ đầu). Nay điện thoại xin ngay khi mở trang
  //   (khoiDT), xin lại mỗi lần trang hiện trở lại (trình duyệt tự nhả khóa khi trang bị che) và mỗi lần thầy chạm màn hình mà khóa
  //   đang mất. Không cần bật gì, không có nút tắt. Máy không cho, hoặc trình duyệt không có chức năng này, thì báo MỘT lần bằng một
  //   dòng nổi phía trên hàng nút dưới cùng (không chắn nút nào, tự ẩn sau 8 giây); TV không báo gì.
  var khoaMH = null, mhDangXin = false, mhDaBao = false, mhHen = null;
  function mhBao(chu) {
    if (VAI !== "dt" || mhDaBao) return;
    mhDaBao = true;
    var el = $("#dtBaoMH");
    if (!el) return;
    el.textContent = chu; el.hidden = false;
    mhHen = setTimeout(function () { el.hidden = true; }, 8000);
  }
  function giuManHinh() {
    if (khoaMH || mhDangXin) return;
    if (!navigator.wakeLock) { mhBao("Trình duyệt này không giữ được màn hình sáng. Thầy mở trang bằng Chrome nhé."); return; }
    if (document.visibilityState !== "visible") return;
    mhDangXin = true;
    navigator.wakeLock.request("screen").then(function (l) {
      mhDangXin = false; khoaMH = l;
      l.addEventListener("release", function () { if (khoaMH === l) khoaMH = null; });
      var el = $("#dtBaoMH");
      if (el) { clearTimeout(mhHen); el.hidden = true; }
    }, function () {
      mhDangXin = false;
      if (document.visibilityState === "visible") mhBao("Điện thoại chưa cho giữ màn hình sáng. Nếu máy đang bật tiết kiệm pin thì thầy tắt đi rồi chạm vào trang.");
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") giuManHinh(); });
  document.addEventListener("pointerdown", function () { if (VAI === "dt") giuManHinh(); }, true);

  function veTV() {
    var now = nowHopLe(), step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    ghiNhanTu(now);
    // các lần công bố đã có trước khi TV mở trang: không phát lại hoạt cảnh
    if (coNow && (tvDaDien === null || tvDaDienSes !== ses())) { tvDaDien = clone(now.pub || {}); tvDaDienSes = ses(); }
    var cu = tvTruoc;
    var rev = now.pub["r" + q] | 0;
    var doi = step !== cu || (loai === "r" && tvDaDien !== null && rev !== (tvDaDien["r" + q] | 0));
    tvTruoc = step;
    if (step !== "setup") anCB = false;
    $("#chuanBiTV").hidden = !((step === "setup" && !anCB) || moCB);
    capNhatChuanBi($("#cbTV"));
    KC.datBen(RD.d1Trai(cfg()));
    KC.datThe(RD.lopDoi(RD.lop(cfg())).map(function (x) { return x.ds; }));
    A.batNhac(cfg().nhac !== false);
    var laCau = loai === "q" || loai === "k" || loai === "a";
    $('[data-tv="thu"]').hidden = !(laCau && cfg().thu);
    $('[data-tv="lai"]').hidden = !(cfg().thu && step !== "setup");
    // chơi thử: bấm qua màn câu hỏi trước khi TV kịp điền thì điền nốt ngay khi sang bước sau,
    // để bước quét xong, đáp án và di chuyển luôn có kết quả (dienThu chỉ thêm thẻ còn thiếu)
    if (doi && q && loai !== "q" && cfg().thu) dienThu(q, true);
    if (doi) vaoBuocTV(step, cu, loai, q, rev);
    datNhac(step, loai);          // sau vaoBuocTV: bước tuong cần mốc báo tường hiện (SK.mocKet) của bước mới
    // 9/11: màn giới thiệu hiện hay ẩn luật chơi theo now.luat (nút trên điện thoại hay trên TV)
    if (step === "intro" && SK.luatDaAn() !== !now.luat) SK.anLuat(!now.luat);
    var nd = $('[data-tv="dem"]');
    nd.hidden = loai !== "q";
    nd.disabled = !!DEM.id;
    if (laCau) capNhatManCau(q, loai);
    if (loai === "q" && cfg().thu && doi) { clearTimeout(henThu); henThu = setTimeout(function () { dienThu(q, false); }, 1600); }
  }
  // độ to nhạc nền theo bước: 0 tắt (chuẩn bị, và bước bao sau khi vải bay đi), NHAC_VUA bình thường, NHAC_NHO lúc học sinh phát biểu.
  // 13/11 thầy Thịnh (đổi nhạc nền sang bài Suno "Học Vui Mỗi Ngày"): "chỗ nào mà tôi sẽ kêu học sinh phát biểu thì cho nhạc nhỏ lại".
  //   Hai chỗ: bước đáp án (mời một em nêu cách làm) và bước tuong từ lúc báo tường hiện xong (hỏi "Sắp tới trường chúng ta có ngày gì?");
  //   lúc tia lửa bay lên số 51 và lửa đốt tan màn đêm nhạc vẫn to như thường. Trước đây chỉ bước đáp án nhỏ lại, mức 0,08.
  var NHAC_VUA = 0.22, NHAC_NHO = 0.06, henNhac = null;
  function datNhac(step, loai) {
    clearTimeout(henNhac); henNhac = null;
    var muc = NHAC_VUA, giay = 1;
    if (step === "setup") muc = 0;
    else if (loai === "q" && dangDem()) { muc = 0; giay = 0.25; }       // 21/11: đang đếm ngược 5 giây thì không có nhạc nền
    else if (loai === "q" && DEM.id) giay = 2;                          //   vừa đếm xong ("Giơ đáp án"): nhạc có lại từ từ
    else if (loai === "a") { muc = NHAC_NHO; giay = 1.5; }
    else if (step === "tuong") {
      var lb = KC.lucBaoHien(), con = lb != null ? lb - performance.now() / 1000 : 0;        // Kéo co: mốc lửa đốt xong của sân kéo co
      if (con > 0) henNhac = setTimeout(function () { henNhac = null; if (nowHopLe().step === "tuong") A.nhacMuc(NHAC_NHO, 1.5); }, Math.min(con, 15) * 1000);
      else { muc = NHAC_NHO; giay = 1.5; }
    } else if (step === "bao") {
      // 14/11 thầy Thịnh: "sau khi chim bồ câu kéo rèm đi thì tắt nhạc". Bấm nút cuối: nhạc to lại cùng tiếng vỗ tay lúc bồ câu kéo vải;
      //   vải bay khỏi màn hình (SK.lucVaiDi, 2,5 giây sau khi bấm) thì nhạc tắt dần trong khoảng 2 giây, tiếng vỗ tay vẫn kêu hết.
      //   Mở lại trang đang ở bước bao: nhạc tắt sẵn.
      var lv = SK.lucVaiDi && SK.lucVaiDi(), con2 = lv != null ? lv - performance.now() / 1000 : 0;
      if (con2 > 0) henNhac = setTimeout(function () { henNhac = null; if (nowHopLe().step === "bao") A.nhacMuc(0, 2); }, Math.min(con2, 15) * 1000);
      else { muc = 0; giay = 2; }
    }
    A.nhacMuc(muc, giay);
  }
  // kết quả sau từng câu theo thứ tự: ls[0] chưa có câu nào, ls[k] đã tính câu 1 đến câu k
  function lichSu() {
    var sc = cacScan(), c = cfg(), ls = [];
    for (var k = 0; k <= 5; k++) {
      var m = {};
      for (var j = 1; j <= k; j++) m[j] = true;
      ls.push(RD.tinhDiem(c, sc, m));
    }
    return ls;
  }
  // Kéo co: kết quả kéo co sau từng câu: kc[0] chưa có câu nào, kc[k] đã tính câu 1 đến câu k
  function lichSuKC() {
    var sc = cacScan(), c = cfg(), kc = [];
    for (var k = 0; k <= 5; k++) {
      var m = {};
      for (var j = 1; j <= k; j++) m[j] = true;
      kc.push(RD.keoCo(c, sc, m));
    }
    return kc;
  }
  // mỗi bước trên TV: màn câu hỏi (q, k, a) che sân; các bước khác do sân kéo co (keo-co.js) vẽ; riêng hai bước báo tường cuối
  //   (tuong, bao) là sân khấu cũ của Rước đuốc (san-khau.js): báo tường, 4 bạn cầm đuốc trong 4 ô thiệp, bồ câu kéo vải
  function vaoBuocTV(step, cu, loai, q, rev) {
    $("#goiY").hidden = true;
    $("#canhBao").hidden = true;
    choXacNhan = null;
    var ls = lichSu(), kc = lichSuKC();
    SK.keoCo(!(step === "tuong" || step === "bao"));
    if (loai === "q" || loai === "k" || loai === "a") {
      SK.dat({ che: "hoi", q: q, ls: ls });
      KC.dat({ che: "hoi", q: q, kc: kc });
      hienManCau(q, loai, cu);
      return;
    }
    anManCau();
    if (step === "setup" || step === "intro") {
      var vao = step === "intro" && (cu === "setup" || choiLaiCho);
      if (step === "intro") choiLaiCho = false;
      SK.dat({ che: "dau", ls: ls, gioiThieu: step === "intro", hoatCanh: vao });     // tiêu đề NGỌN ĐUỐC TRI THỨC và khung luật chơi
      KC.dat({ che: "dau", kc: kc });
      return;
    }
    if (loai === "r") {
      // lượt kéo co của câu q; lần công bố mới (hoặc công bố lại) thì phát hoạt cảnh
      var phatLai = tvDaDien !== null && rev !== (tvDaDien["r" + q] | 0);
      if (tvDaDien) tvDaDien["r" + q] = rev;
      SK.dat({ che: "hoi", q: q, ls: ls });
      KC.dat({ che: "keo", q: q, kc: kc, hoatCanh: phatLai && rev > 0 });
      return;
    }
    if (step === "finish") { SK.dat({ che: "hoi", q: 5, ls: ls }); KC.dat({ che: "dich", kc: kc, hoatCanh: cu === "r5" }); return; }
    // tuong: sân khấu cũ dựng sẵn cảnh báo tường đã lộ (4 bạn cầm đuốc đứng trong 4 ô thiệp, vải xanh lá còn che băng chúc mừng);
    //   sân kéo co ở trên: đội thắng sang bắt tay, hai ngọn đuốc cùng sáng, sách và công thức bay lên số 51 rồi lửa đốt thủng sân kéo co, lộ báo tường
    if (step === "tuong") {
      SK.dat({ che: "hang", tiep: true, ls: ls, hoatCanh: false });
      KC.dat({ che: "tuong", kc: kc, hoatCanh: cu === "finish" });
      return;
    }
    KC.dat({ che: "an" });
    SK.dat({ che: "bao", ls: ls, hoatCanh: cu === "tuong" });
  }

  /* ---------- màn câu hỏi (chữ to; hình chuyển động: video 8 giây lặp lại, lớp nhãn số đo đứng yên bên trên) ---------- */
  // loai: q đọc đề · k quét xong (số em chọn mỗi đáp án) · a đáp án (ô đúng sáng, số bạn đúng mỗi nhóm)
  var mcDang = 0, mcDe = "", mcHien = false, VID = {};
  var DE = "cubic-bezier(.45,0,.55,1)", NAY = "cubic-bezier(.34,1.56,.64,1)";
  function hoat(el, kf, ms, de, xong) {
    huyHoat(el);
    if (!el.animate) { if (xong) xong(); return; }
    var a = el.animate(kf, { duration: ms, easing: de, fill: "both" });
    el._hoat = a;
    a.onfinish = function () { if (el._hoat === a && xong) xong(); };
  }
  function huyHoat(el) { if (el._hoat) { try { el._hoat.cancel(); } catch (e) { /* bỏ qua */ } el._hoat = null; } }
  function chuDe(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\{(\d+)\/(\d+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  }
  // thu nhỏ chữ đề và chữ đáp án nếu tràn khung
  function vuaChu(q) {
    var m = $("#manCau"), chu = $("#mcChu");
    var fs = q === 5 ? 68 : 72, fo = q === 5 ? 46 : 54;
    m.style.setProperty("--fs", fs + "px");
    m.style.setProperty("--fo", fo + "px");
    if (m.hidden) return;
    while (fs > 40 && chu.scrollHeight > chu.clientHeight + 1) { fs -= 2; m.style.setProperty("--fs", fs + "px"); }
    var tran = function () { return $$(".mc-o>span", m).some(function (x) { return x.scrollWidth > x.clientWidth + 1; }); };
    while (fo > 32 && tran()) { fo -= 2; m.style.setProperty("--fo", fo + "px"); }
    vuaDem();
  }
  // video hình động của câu q (webm, máy không chạy được thì mp4). Ảnh chờ (poster) là khung đầu của video:
  // hiện ngay khi video chưa tải xong, và ở lại nếu máy không chạy được video (số đo, nét vẽ vẫn nằm đúng chỗ)
  function taoVideo(q) {
    if (q in VID) return VID[q];
    var I = RD.KHUNG && RD.KHUNG[q];
    if (!I) { VID[q] = null; return null; }
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.poster = "../anh/chuyen-dong/tinh-cau-" + q + ".webp";
    [["webm", 'video/webm; codecs="vp9"'], ["mp4", 'video/mp4; codecs="avc1.640028"']].forEach(function (k) {
      if (!v.canPlayType || !v.canPlayType(k[1])) return;
      var s = document.createElement("source");
      s.src = "../anh/chuyen-dong/cau-" + q + "." + k[0]; s.type = k[1];
      v.appendChild(s);
    });
    v.load();
    VID[q] = v;
    return v;
  }
  // 7/11: cột hình rộng vừa đủ cho hình cao kín ô (không quá RD.COT_HINH), chữ đề dịch sang phải
  function datCot(q) {
    var I = RD.khungCau(q), m = $("#manCau"), hop = $("#mcHop"), cot = RD.COT_HINH || 960;
    if (!I) { m.style.setProperty("--wh", (q === 5 ? 700 : 560) + "px"); return; }
    m.style.setProperty("--wh", cot + "px");
    var bw = hop.clientWidth - 20, bh = hop.clientHeight - 20;
    if (bw <= 0 || bh <= 0) return;
    var s = Math.min(bw / I.W, bh / I.H);
    m.style.setProperty("--wh", Math.min(cot, Math.ceil(I.W * s) + cot - bw) + "px");
  }
  // 9/11 Đề demo: câu có khung riêng với ảnh tĩnh (khung.anh) thì đặt ảnh đó vào khung thay cho video; số đo, nét vẽ như đề chính thức
  var ANH_TINH = {};
  function anhTinh(src) {
    if (!ANH_TINH[src]) { var i = new Image(); i.alt = ""; i.className = "mc-tinh"; i.decoding = "async"; i.src = src; ANH_TINH[src] = i; }
    return ANH_TINH[src];
  }
  function napAnhTinh() {   // tải sẵn ảnh tĩnh và lớp nét vẽ của mọi đề (đổi đề lúc chuẩn bị thì hình hiện ngay)
    Object.keys(RD.DE).forEach(function (k) { RD.DE[k].forEach(function (c) {
      if (c.khung && c.khung.anh) { anhTinh(c.khung.anh); if (typeof c.khung.nhan === "string") (new Image()).src = c.khung.nhan; }
    }); });
  }
  function datHinh(q) {
    var I = RD.khungCau(q), tinh = !!(I && I.anh), v = tinh ? null : taoVideo(q), m = tinh ? anhTinh(I.anh) : v,
      k = $("#mcKhung"), anh = $("#mcAnh"), hop = $("#mcHop"), nhan = $("#mcNhan"), so = $("#mcSo");
    Object.keys(VID).forEach(function (j) { var x = VID[j]; if (x && x !== v && x.parentNode) { x.pause(); x.parentNode.removeChild(x); } });
    $$("img.mc-tinh", k).forEach(function (x) { if (x !== m) x.parentNode.removeChild(x); });
    var coVideo = !!(m && I);
    k.hidden = !coVideo; anh.hidden = coVideo;
    if (!coVideo) {
      if (v && v.parentNode) { v.pause(); v.parentNode.removeChild(v); }
      if (anh.getAttribute("src") !== RD.CAU[q - 1].hinh) anh.src = RD.CAU[q - 1].hinh;
      anh.alt = "Hình minh họa câu " + q;
      return;
    }
    // số đo: chữ thật nằm trên hình, cỡ chữ và chỗ đặt theo tỉ lệ hình
    //   (8/11: đề cơ bản ghi thêm số đo cho sẵn, themSo của câu; a "t" x là mép trái chữ, a "p" x là mép phải)
    var dsSo = (I.so || []).concat(RD.CAU[q - 1].themSo || []), khoaSo = RD.deDang + ":" + q;
    if (so.dataset.q !== khoaSo) {
      so.dataset.q = khoaSo;
      so.innerHTML = dsSo.map(function (n) {
        return "<span" + (n.nen ? ' class="nen"' : "") + (n.a ? ' data-a="' + n.a + '"' : "") + ">" + esc(n.t) + "</span>";
      }).join("");
    }
    var bw = hop.clientWidth - 20, bh = hop.clientHeight - 20;
    if (bw > 0 && bh > 0) {
      var s = Math.min(bw / I.W, bh / I.H);
      k.style.width = I.W * s + "px"; k.style.height = I.H * s + "px";
      m.style.left = I.x * s + "px"; m.style.top = I.y * s + "px"; m.style.width = I.w * s + "px"; m.style.height = I.h * s + "px";
      $$("span", so).forEach(function (el, i) {
        var n = dsSo[i];
        el.style.left = n.x * s + "px"; el.style.top = n.y * s + "px"; el.style.fontSize = n.f * s + "px";
      });
    }
    // lớp nét vẽ (nét đứt, góc vuông, viền): chỉ câu 3, 4, 5 có (nhan: true là lớp của đề chính thức, chuỗi là đường dẫn riêng)
    var srcNhan = typeof I.nhan === "string" ? I.nhan : I.nhan ? "../anh/chuyen-dong/nhan-cau-" + q + ".webp" : "";
    nhan.hidden = !srcNhan;
    if (srcNhan && nhan.getAttribute("src") !== srcNhan) nhan.src = srcNhan;
    k.setAttribute("aria-label", "Hình minh họa câu " + q);
    if (m.parentNode !== k) k.insertBefore(m, nhan);
    if (!tinh && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { /* hiện khung đầu */ }); }
  }
  function xepLaiManCau(q) { datCot(q); vuaChu(q); datHinh(q); }
  function dungVideo() { Object.keys(VID).forEach(function (j) { var x = VID[j]; if (x && !x.paused) x.pause(); }); }
  function hienManCau(q, loai, cu) {
    var c = RD.CAU[q - 1], m = $("#manCau"), the = $("#mcThe"), moi = !mcHien, cauMoi = mcDang !== q || mcDe !== RD.deDang;
    mcHien = true;
    m.hidden = false;
    if (cauMoi) {
      mcDang = q; mcDe = RD.deDang;
      var pill = $("#mcPill");
      pill.textContent = RD.nhanCau(q);
      pill.classList.toggle("vang", q === 5);
      // Kéo co: dải hiệu ứng của câu nằm thành một hàng riêng dưới nhãn câu (26/11 00:01 thầy: "đổi tên thành hiệu ứng tăng tốc. và cho
      //   dòng này to lên"; 00:45: câu 1 vẫn là "Hiệu ứng Khai cuộc" như lúc đầu)
      var sm = RD.SUC_MANH[q - 1];
      $("#mcSmTen").textContent = RD.tenHieuUng(q);
      $("#mcSmLuat").textContent = sm.luat;
      datCot(q);
      $("#mcBoiCanh").innerHTML = chuDe(c.boiCanh);
      $("#mcHoi").innerHTML = chuDe(c.hoi);
      $("#mcChon").innerHTML = c.chon.map(function (t, i) {
        return '<div class="mc-o" data-l="' + RD.CHU[i] + '"><b>' + RD.CHU[i] + "</b><span>" + esc(t) + "</span><em hidden></em></div>";
      }).join("");
      // câu mới: xoá hẳn dòng kết quả của câu trước (7/11: trước đây chỉ đặt lại bộ nhớ nên lúc đọc đề câu sau vẫn còn "HS đúng" của câu trước)
      delete $("#mcTien").dataset.html;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (mcHien && mcDang === q) vuaChu(q); });
    }
    vuaChu(q);
    veODem(!moi && !cauMoi);
    datHinh(q);
    if (moi) {
      // hiện dần như clip: mờ sang rõ, thẻ câu hỏi trượt lên; hiện xong thì sân khấu thôi vẽ cho nhẹ máy
      hoat(m, [{ opacity: 0 }, { opacity: 1 }], 450, DE, function () { huyHoat(m); if (mcHien) phuSan(true); });
      hoat(the, [{ transform: "translateY(40px)" }, { transform: "none" }], 450, DE, function () { huyHoat(the); });
    } else phuSan(true);
    // 6/11 thầy Thịnh: chỉ kêu ở chỗ quan trọng. Màn câu hỏi chỉ còn một tiếng lúc câu hỏi mới hiện ra
    //   (bỏ trống dồn, tiếng ting lúc quét, tiếng kèn câu 5 và tiếng chuông lúc hiện đáp án)
    // 26/11 00:01 thầy Thịnh: "câu 5 cũng ghi giống mấy câu kia nhé": câu 5 không còn tấm bảng vàng "Về đích: số nấc nhân đôi" bật giữa
    //   màn hình 3 giây lúc câu hỏi hiện ra (chỉ câu 5 có, các câu kia không có); hiệu ứng của cả 5 câu đều ghi ở dải dưới nhãn câu
    if (cauMoi && moi) A.baoCau();
    var moDapAn = loai === "a" && cu === "k" + q;
    if (moDapAn) {
      var o2 = m.querySelector('.mc-o[data-l="' + c.dung + '"]');
      if (o2) hoat(o2, [{ transform: "scale(.94)" }, { transform: "scale(1)" }], 500, NAY, function () { huyHoat(o2); });
    }
    capNhatManCau(q, loai, moDapAn);
  }
  // rời màn câu hỏi: sân khấu vẽ lại ngay, màn câu hỏi mờ dần và thu nhỏ một chút
  function anManCau() {
    if (!mcHien) return;
    mcHien = false;
    phuSan(false);
    var m = $("#manCau"), the = $("#mcThe");
    hoat(m, [{ opacity: 1 }, { opacity: 0 }], 550, DE, function () { if (!mcHien) { m.hidden = true; dungVideo(); } huyHoat(m); });
    hoat(the, [{ transform: "none" }, { transform: "scale(.92)" }], 550, DE, function () { huyHoat(the); });
  }
  function capNhatManCau(q, loai, moDapAn) {
    var c = RD.CAU[q - 1], m = $("#manCau");
    var lop = RD.lop(cfg()), sc = scanHopLe(q), kq = RD.ketQuaCau(q, lop, sc);
    var cards = (sc && sc.cards) || {}, man = (sc && sc.man) || {};
    // số em chọn mỗi đáp án (thẻ giáo viên ghi "đúng" tính vào đáp án đúng)
    var dem = [0, 0, 0, 0];
    lop.to.forEach(function (x) {
      x.coMat.forEach(function (id) {
        var k = "t" + id;
        if (man[k] === "D") dem[RD.CHU.indexOf(c.dung)]++;
        else if (!man[k] && cards[k]) dem[RD.CHU.indexOf(cards[k])]++;
      });
    });
    var hienDem = loai === "k" || loai === "a", hien = loai === "a";
    $$(".mc-o", m).forEach(function (o, i) {
      var dung = o.dataset.l === c.dung, em = o.querySelector("em");
      o.classList.toggle("dung", hien && dung);
      // 8/11 thầy Thịnh: "khi tôi bấm nút đáp án, đáp án đúng đã hiện ra rồi thì các đáp án kia biến mất".
      // 9/11 14:36 UTC thầy Thịnh: "các đáp án sai giờ đây sẽ không biến mất mà chuyển sang màu xám nhé tối màu nhé": vừa bấm Đáp án
      //   thì ô đúng sáng lên, ba ô kia chuyển dần sang nền xám tối (0,4 giây) và ở lại; lùi về bước quét xong thì cả bốn ô như cũ.
      o.classList.toggle("xam", hien && !dung);
      em.hidden = !hienDem;
      var t = dem[i] + " em";
      if (em.textContent !== t) em.textContent = t;
    });
    var html = "";
    // 9/11 09:04 UTC thầy Thịnh: "không biết được em nào chưa quét": đang quét (bước đọc đề, đã ghi được thẻ) TV cũng hiện số thẻ
    //   đã quét và thẻ còn thiếu như lúc quét xong; thiếu nhiều thì ghi số thẻ thiếu và 8 số đầu
    if (loai === "k" || loai === "q") {
      var thay = 0, tong = 0, thieu = [];
      kq.forEach(function (r) { thay += r.thay; tong += r.thay + r.chua.length; thieu = thieu.concat(r.chua); });
      if (loai === "k" || thay > 0) {
        html = '<span class="' + (thieu.length ? "quet" : "du") + '">Đã quét ' + thay + "/" + tong + " thẻ</span>";
        if (thieu.length) html += '<span class="thieu">' + (thieu.length > 12 ? "Còn thiếu " + thieu.length + " thẻ: " + thieu.slice(0, 8).join(", ") + "…" : "Còn thiếu: " + thieu.join(", ")) + "</span>";
      }
    } else if (loai === "a") {
      // Kéo co: số bạn đúng của 2 đội (mỗi đội 2 nhóm)
      html = RD.doiCau(q, lop, sc).map(function (r, d) {
        var D = RD.DOI[d];
        return '<span class="doi" style="--m:' + D.dam + '">' + D.ten + ": " + r.dung + "/" + r.thay + " HS đúng</span>";          // 25/11 22:12 thầy: "cho dòng đội 1 đội 2 số hs đúng to lên" (lớp doi)
      }).join("");
    }
    var el = $("#mcTien");
    if (el.dataset.html !== html) {
      el.innerHTML = html; el.dataset.html = html;
    }
  }

  /* ---------- chơi thử: TV tự điền kết quả ---------- */
  function dienThu(q, ngay) {
    if (!q || VAI !== "tv") return;
    var lop = RD.lop(cfg()), dungChu = RD.CAU[q - 1].dung;
    var sc = clone(scanHopLe(q)) || { ses: ses(), q: q, cards: {}, man: {} };
    sc.cards = sc.cards || {}; sc.man = sc.man || {};
    var ds = [];
    lop.to.forEach(function (x, t) {
      var p = 0.5 + Math.random() * 0.48;
      x.coMat.forEach(function (id) { if (!sc.cards["t" + id]) ds.push({ id: id, l: Math.random() < p ? dungChu : RD.CHU[(RD.CHU.indexOf(dungChu) + 1 + Math.floor(Math.random() * 3)) % 4] }); });
    });
    if (!ds.length) return;
    ds.sort(function () { return Math.random() - 0.5; });
    var ghi = function () { sc.at = Date.now(); sc.by = TAB; sc.n = Object.keys(sc.cards).length; DB.set("s" + q, sc); };
    if (ngay) { ds.forEach(function (d) { sc.cards["t" + d.id] = d.l; }); ghi(); return; }
    var k = 0;
    (function buoc() {
      var n = nowHopLe();
      if (n.step !== "q" + q || k >= ds.length) return;
      if (dangDem()) { henThu = setTimeout(buoc, 300); return; }   // 9/11: đang đếm ngược thì chờ
      var lo = ds.slice(k, k + 6);
      k += 6;
      lo.forEach(function (d) { sc.cards["t" + d.id] = d.l; });
      ghi();
      henThu = setTimeout(buoc, 650);
    })();
  }

  /* =====================================================================
     ĐIỆN THOẠI
     ===================================================================== */
  var moCD = false, PQ = null, CHO = {}, soAnh = 0, anhCuoi = null, henGhi = 0, ghiCuoi = 0, menuThe = null, henNgau = 0, xacNgau = false;
  var ROT = { doc: 0, ngang: 0, live: 0 };
  // thẻ mới 12/11: chữ nằm trong mã, không tính theo cạnh nào ở trên, nên không có chuyện "xoay chữ" (ROT luôn bằng 0)
  // THAY[thẻ][chữ] = lúc vừa thấy chữ đó; HAI[thẻ] = lúc vừa thấy em đó giơ 2 thẻ khác chữ
  var THAY = {}, HAI = {}, HAI_THE = 700;
  // bản thử 13/11 (thẻ nằm trên bàn): NAM[thẻ.chữ] = lúc bộ đọc vừa coi mã đó là thẻ nằm; NGO[thẻ.chữ] = {n, moi}: số lần đọc "chưa rõ" liền nhau
  //   NAM không xóa theo câu: nó chỉ nói "mã này vừa nằm trên bàn", tự hết hạn (3 giây với lần đọc chưa rõ, 1 giây với lần đọc rõ).
  var NAM = {}, NGO = {}, NAM_NHO = 3000, NAM_GAN = 1000, NGO_CAN = 3, NGO_CACH = 1200;
  var NGHIENG = false;
  var ZOOM_MAY = false, dtBuocCu = null;   // ZOOM_MAY: camera tự chỉnh zoom được; không thì thu phóng bằng phần mềm

  var nlLuc = 0, nlHen = null;
  function nlDung() { clearTimeout(nlHen); nlHen = null; $("#dtNoiLai").classList.remove("quay"); }
  function khoiDT() {
    $("#dt").hidden = false;
    giuManHinh();   // 25/11: giữ màn hình điện thoại sáng ngay từ lúc mở trang
    dungChuanBi($("#cbDT"));
    $("#dtTiep").addEventListener("click", function () { A.mo(); tiep(); });
    // 9/11: nút Đếm ngược 5 giây (camera tự mở trong chayDem) và nút hiện / ẩn luật chơi trên TV
    $("#dtDem").addEventListener("click", function () { A.mo(); batDemNguoc(); });
    $("#dtLuatNut").addEventListener("click", function () { ghiLuat(!nowHopLe().luat); });
    var luatNoi = $("#dtLuatNoi"), luatGoc = $("#luat");
    if (luatNoi && luatGoc) luatNoi.innerHTML = $$("h2, p, ul", luatGoc).map(function (el) { return el.tagName === "H2" ? "<h4>" + esc(el.textContent) + "</h4>" : el.outerHTML; }).join("");
    $("#dtLui").addEventListener("click", function () { lui(); });
    // 25/11/2026 thầy Thịnh: "ok thêm nút refresh hình vòng tròn giống mấy trình duyệt hay có". Bấm là nối lại ngay với TV, không tải
    //   lại trang (DB.noiLai trong dong-bo.js, chỉ có khi nối qua Firebase). Mũi tên quay tới khi nối xong (ít nhất 0,7 giây cho thầy
    //   kịp thấy), quá 8 giây chưa nối được thì thôi quay để thầy bấm lại được.
    $("#dtNoiLai").addEventListener("click", function () {
      if (!DB || !DB.noiLai || nlHen) return;
      nlLuc = Date.now();
      this.classList.add("quay");
      nlHen = setTimeout(nlDung, 8000);
      DB.noiLai();
    });
    $("#dtNhac").addEventListener("click", function () { var on = cfg().nhac === false; ghiCfg(function (c) { c.nhac = on; }); });
    $("#dtCaiDat").addEventListener("click", function () { moCD = !moCD; this.setAttribute("aria-pressed", moCD ? "true" : "false"); ve(); if (moCD) $("#dtChuanBi").scrollIntoView({ behavior: "smooth", block: "start" }); });
    $("#dtChup").addEventListener("change", function () {
      var f = this.files && this.files[0];
      this.value = "";
      if (f) xuLyAnh(f);
    });
    if (Q.coCamera()) {
      $("#dtBatCam").hidden = false;
      $("#dtChupChu").textContent = "Chụp một tấm ảnh";
    }
    $("#dtBatCam").addEventListener("click", function () { A.mo(); if (Q.Live.chay) dungCam(); else batCam(); });
    // 26/11/2026 17:13 thầy Thịnh: nút "Chọn đáp án ngẫu nhiên" (chỉ có trên điện thoại). Bấm lần đầu: nút đỏ lên, ghi "Bấm thêm lần nữa
    //   để xác nhận" (5 giây, quá thì về như cũ). Bấm lần hai: em nào chưa quét được thì máy chọn luôn cho em một đáp án ngẫu nhiên.
    //   26/11 17:26 thầy: "Cái nút này nó sẽ hiện cái lúc mà tôi bấm quét. Tôi đang quét đấy, quét nếu mà quét không hết thì nó hiện. ...
    //   Rồi sau khi chọn xong tôi bấm quét xong." Nên nút chỉ hiện khi đã bắt đầu quét mà còn em chưa quét được, có cả trên khung camera
    //   toàn màn hình (#dtCamNgau, ngay trên thanh có nút Quét xong) lẫn dưới hai nút quét (#dtNgau). Hai nút chung một lần bấm xác nhận.
    $("#dtNgau").addEventListener("click", bamNgau);
    $("#dtCamNgau").addEventListener("click", bamNgau);
    $("#dtDen").addEventListener("click", function () {
      var b = this, on = b.getAttribute("aria-pressed") !== "true";
      Q.Live.den(on).then(function () { b.setAttribute("aria-pressed", on ? "true" : "false"); }, function () { b.hidden = true; });
    });
    $("#dtVideo").addEventListener("resize", vuaKhungCam);
    $("#dtVideo").addEventListener("loadedmetadata", vuaKhungCam);
    window.addEventListener("resize", function () { if (Q.Live.chay) vuaKhungCam(); });
    $("#dtZoom").addEventListener("input", function () {
      var z = +this.value;
      $("#dtZoomSo").textContent = soZoomChu(z);
      if (ZOOM_MAY) Q.Live.phongTo(z).catch(function () { /* bỏ qua */ });
      else Q.Live.zoomSo(z);
    });
    // camera to toàn màn hình hoặc thu nhỏ vào thẻ; ảnh chụp chạm để phóng to, chạm lần nữa để thu nhỏ
    $("#dtLon").addEventListener("click", function () { datCamLon(!$("#dtCam").classList.contains("lon")); });
    $("#dtAnhKhung").addEventListener("click", function () { datAnhLon(!this.classList.contains("lon")); });
    $("#dtManDen").addEventListener("click", function () { datAnhLon(false); });
    $("#dtXoayChu").addEventListener("click", function () {
      var d = anhCuoi ? anhCuoi.dang : "doc";
      ROT[d] = (ROT[d] + 1) % 4;
      lsSet("rd-xoay", JSON.stringify({ doc: ROT.doc, ngang: ROT.ngang }));
      if (anhCuoi) veAnh(anhCuoi);
      ghiQuet(true);
      veBangTo();
      trangThai("ok", "Đã xoay chữ cho các ảnh " + (d === "doc" ? "dọc" : "ngang") + " trên máy này.");
    });
    $("#dtTo").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-id]");
      if (!b || !PQ) return;
      moMenu(+b.dataset.id);
    });
    $("#dtMenu").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (e.target === this || (b && b.id === "dtMenuDong")) { dongMenu(); return; }
      if (!b || b.dataset.m == null || !PQ || !menuThe) return;
      var k = "t" + menuThe;
      if (b.dataset.m) PQ.man[k] = b.dataset.m; else delete PQ.man[k];
      dongMenu();
      ghiQuet(true);
      veBangTo();
    });
    window.addEventListener("devicemotion", function (e) {
      var g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      var doc = !screen.orientation || screen.orientation.angle === 0 || screen.orientation.angle === 180;
      var nghieng = false && doc;   // thẻ mới: cầm điện thoại kiểu nào cũng đọc đúng chữ
      if (nghieng !== NGHIENG) { NGHIENG = nghieng; $("#dtXoayMay").hidden = !(NGHIENG && Q.Live.chay); }
    });
    Q.khoiDong();
  }
  function trangThai(kieu, chu) {
    var el = $("#dtTrangThai");
    el.className = "dt-tt" + (kieu === "ok" ? " ok" : kieu === "loi" ? " loi" : "");
    el.textContent = chu;
  }
  function tenBuoc(step) {
    var l = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") return "Chuẩn bị";
    if (step === "intro") return "Giới thiệu luật chơi";
    if (l === "q") return "Câu " + q + " · đọc đề, quét thẻ";
    if (l === "k") return "Câu " + q + " · quét xong, TV hiện số em chọn";
    if (l === "a") return "Câu " + q + " · đã hiện đáp án";
    if (l === "r") return "Câu " + q + " · hai đội kéo co";
    return { finish: "Đốt đuốc · đội thắng thắp đuốc trước", tuong: "Hai đội bắt tay, hai ngọn đuốc cùng sáng, báo tường hiện hình và số 51", bao: "Bồ câu kéo vải xanh lá bay lên, dòng chữ chúc mừng hiện ra, báo tường đầy đủ" }[step] || step;
  }
  function nhanTiep(step) {
    var l = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") return "Bắt đầu trò chơi";
    if (step === "intro") return "Hiện câu 1";
    if (l === "q") return "Quét xong";
    if (l === "k") return "Đáp án";
    if (l === "a") return "Kéo co";
    if (l === "r") return q < 5 ? "Hiện câu " + (q + 1) : "Đốt đuốc";      // 6/11 trưa: thầy bấm thì nhóm về nhất thắp đuốc
    return { finish: "Tiếp theo", tuong: "Tiếp theo" }[step] || "Đã xong phần khởi động";      // finish: cùng chữ với nút trên TV
  }
  function veDT() {
    var now = nowHopLe(), step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    ghiNhanTu(now);
    // bấm Quét xong (hay sang bước khác): camera đang toàn màn hình thì thu nhỏ để thấy bảng thẻ còn thiếu
    if (step !== dtBuocCu) {
      if (dtBuocCu !== null && loai !== "q" && $("#dtCam").classList.contains("lon")) datCamLon(false);
      if (dtBuocCu !== null && (loai === "a" || RD.loaiBuoc(dtBuocCu) === "a")) trangThai("", loai === "a" ? "TV đã hiện đáp án: máy thôi ghi thẻ câu này." : "");
      dtBuocCu = step;
    }
    $("#dtBuoc").textContent = tenBuoc(step);
    var nn = $("#dtNhac"), nhacOn = cfg().nhac !== false;
    nn.setAttribute("aria-pressed", nhacOn ? "true" : "false");
    nn.textContent = nhacOn ? "Nhạc: bật" : "Nhạc: tắt";
    var chip = $("#dtNoi");
    chip.className = "chip " + NOI.kieu;
    chip.textContent = NOI.kieu === "ok" ? "Đã nối với TV" : NOI.kieu === "motmay" ? "Chưa nối với TV" : NOI.chu;
    chip.title = NOI.chu;
    $("#dtNoiLai").hidden = !(DB && DB.noiLai);
    if (nlHen && NOI.kieu === "ok") { clearTimeout(nlHen); nlHen = setTimeout(nlDung, Math.max(0, 700 - (Date.now() - nlLuc))); }
    var t = $("#dtTiep");
    t.textContent = nhanTiep(step);
    t.classList.toggle("lua", step === "r5");
    t.disabled = step === "bao";
    $("#dtLui").disabled = step === "setup";
    // câu hỏi
    $("#dtCau").hidden = !q;
    if (q) {
      var c = RD.CAU[q - 1];
      $("#dtCau").style.setProperty("--ac", c.mau);
      $("#dtCauSo").textContent = RD.nhanCau(q) + " · " + RD.TEN_DE[RD.deDang];
      $("#dtDapAn").textContent = "Đáp án đúng: " + c.dung;
      $("#dtCauHoi").textContent = c.hoi;
    }
    var coQuet = loai === "q" || loai === "k" || loai === "a";
    $("#dtQuet").hidden = !coQuet;
    $("#dtChuanBi").hidden = !(step === "setup" || moCD);
    capNhatChuanBi($("#cbDT"));
    if (coQuet) { datCauQuet(q); veBangTo(); }
    else if (Q.Live.chay) dungCam();
    // 18/11: TV đã hiện đáp án thì thôi ghi thẻ: tắt camera, ẩn nút camera, nút chụp ảnh và các ô chỉnh cách đọc (lùi về Kết quả thì hiện lại)
    var choGhi = loai === "q" || loai === "k";
    if (loai === "a" && Q.Live.chay) dungCam();
    // 27/11 9:10: ba ô chỉnh cách quét nay là khung riêng #dtCachQuet ngay trên Số đo quét (thầy: "chuyển 3 mục này xuống cuồi cùng")
    [".dt-quet-nut", "#dtCachQuet"].forEach(function (s) { var e = $(s); if (e && e.hidden === choGhi) e.hidden = !choGhi; });
    $("#dtNc").hidden = true;
    // 9/11: màn giới thiệu: nút hiện / ẩn luật chơi trên TV; bước đọc đề: nút Đếm ngược 5 giây
    var luatHien = !!now.luat, ln = $("#dtLuatNut");
    $("#dtLuat").hidden = step !== "intro";
    if (step === "intro") {
      var lh = luatHien ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4.1"/><path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10.4 10.4 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>Ẩn luật chơi trên TV' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Hiện luật chơi trên TV';
      if (ln.dataset.html !== lh) { ln.innerHTML = lh; ln.dataset.html = lh; }
      ln.className = "nut dt-luat-nut" + (luatHien ? "" : " vang");
      ln.setAttribute("aria-pressed", luatHien ? "true" : "false");
      var ltt = $("#dtLuatTT");
      ltt.className = "chip" + (luatHien ? " ok" : "");
      ltt.textContent = luatHien ? "TV đang hiện luật chơi" : "TV đang ẩn luật chơi";
    }
    $("#dtDemHang").hidden = loai !== "q";
    if (loai === "q") capNutDem();
    // hướng dẫn ngắn theo bước
    var ghi = $("#dtGhi"), html = "";
    if (step === "setup") html = "<b>Trước giờ học</b><ol><li>Chọn <b>Đề chính thức</b> hoặc <b>Đề nâng cao</b> ở phần chuẩn bị bên dưới.</li><li>Kiểm tra sĩ số, số thẻ của 2 đội, chạm số thẻ bạn vắng.</li><li>Trên laptop nối TV: mở trang này, chọn <b>Màn hình TV</b>, bấm F11.</li><li>Bấm <b>Bắt đầu trò chơi</b> ở dưới.</li></ol>";
    else if (step === "intro") html = "Bấm <b>Hiện luật chơi trên TV</b> ở trên để cả lớp cùng xem, đọc luật cho các em nghe, rồi bấm <b>Ẩn luật chơi trên TV</b> để các em xem lại màn chơi (trên TV cũng có nút Ẩn, Hiện luật chơi ở góc phải)." +
      // 18/11: bản 4 thẻ đọc trúng mã là ghi, thẻ ngửa mặt mã trên bàn cũng được ghi, nên dặn các em trước câu 1
      (RD.BO_THE === "moi" ? " Dặn các em: mỗi câu chỉ giơ <b>1 thẻ</b>, mặt mã quay về phía thầy; <b>3 thẻ còn lại úp mặt mã xuống bàn</b>." : "") +
      " Xong thì bấm <b>Hiện câu 1</b>.";
    else if (loai === "q") html = Q.coCamera() ? "Đọc đề cho cả lớp nghe rồi bấm <b>Đếm ngược 5 giây</b>: TV đếm từ 5 về 1, camera tự mở nhưng chỉ ghi thẻ khi TV báo <b>Giơ đáp án</b>. Lia chậm qua từng cụm nhóm, nhìn số thẻ còn thiếu của mỗi nhóm trên khung camera, rồi bấm <b>Quét xong</b>. Thẻ đã ghi thì giữ nguyên đáp án, quét lại không đổi. Quét không hết thì bấm <b>Chọn đáp án ngẫu nhiên</b> (hiện ngay trên khung camera), bấm thêm lần nữa để xác nhận: em nào chưa quét được thì máy chọn ngẫu nhiên một đáp án, rồi bấm <b>Quét xong</b>." : "Đọc đề cho cả lớp nghe rồi bấm <b>Đếm ngược 5 giây</b>. Khi TV báo <b>Giơ đáp án</b>, đứng gần từng cụm nhóm, bấm <b>Chụp ảnh một nhóm</b>: mỗi cụm một tấm, chụp thêm nếu còn thiếu thẻ, rồi bấm <b>Quét xong</b>. Thẻ đã ghi thì giữ nguyên đáp án, chụp lại không đổi. Chụp không hết thì bấm <b>Chọn đáp án ngẫu nhiên</b>, bấm thêm lần nữa để xác nhận: em nào chưa quét được thì máy chọn ngẫu nhiên một đáp án, rồi bấm <b>Quét xong</b>.";
    else if (loai === "k") html = "TV đang hiện số em chọn mỗi đáp án và số thẻ còn thiếu. Thẻ nào còn thiếu thì quét lại, chạm số thẻ để ghi Đúng, Sai hoặc Vắng, hoặc bấm <b>Chọn đáp án ngẫu nhiên</b> rồi bấm thêm lần nữa để xác nhận: em nào chưa quét được thì máy chọn ngẫu nhiên một đáp án (thẻ không ghi thì không tính đúng cũng không tính sai). Xong bấm <b>Đáp án</b>: từ lúc đó máy thôi ghi thẻ câu này.";
    else if (loai === "a") html = "TV hiện đáp án đúng và số bạn đúng của 2 đội. Máy đã thôi ghi thẻ câu này (em nào chưa có thì chạm số thẻ để ghi tay). Mời một em nêu cách làm, rồi bấm <b>Kéo co</b>.";
    else if (loai === "r") {
      var kcr = lichSuKC()[q], Kr = kcr && kcr.cau[q];
      html = "TV đang cho hai đội kéo co theo kết quả câu " + q + " (hiệu ứng: <b>" + RD.SUC_MANH[q - 1].ten + "</b>)." + (Kr ? " Câu này: Đội 1 đúng " + Kr.doi[0].tram + "%, Đội 2 đúng " + Kr.doi[1].tram + "%. Sau câu " + q + ": <b>" + RD.vietVT(kcr.vt) + "</b>." : "") +
        (q < 5 ? " Dây đứng yên rồi thì bấm <b>Hiện câu " + (q + 1) + "</b>." : " Kéo xong, TV tự sang bước thắp đuốc: đuốc của đội thắng tự sáng, thầy không cần bấm.");
    }
    else if (step === "finish") {
      var wf = lichSuKC()[5].thang;
      // 25/11 20:14: mỗi ngọn đuốc một bộ tri thức riêng (keo-co.js, TRI_BO)
      var triDoi = ["", "sách, bút, thước, số pi, định lí Pythagore, định lí Thalès và các công thức chu vi, diện tích", "tiên đề Euclid, đạo hàm, tích phân, nguyên hàm và nhiều công thức toán học khác"];
      html = "Hai đội buông dây. " + (wf ? "Bên phía Đội " + wf + " có dòng chữ vàng <b>Đội " + wf + " chiến thắng</b>. Đội " + wf + " thắp ngọn đuốc của đội mình: " + triDoi[wf] + " bay lên từ ngọn lửa. Chúc mừng Đội " + wf + ", rồi bấm <b>Tiếp theo</b>: cả bốn bạn Đội " + wf + " sang bắt tay bốn bạn Đội " + (3 - wf) + ", ngọn đuốc của Đội " + (3 - wf) + " cũng sáng với " + triDoi[3 - wf] + ", tất cả bay về số 51, báo tường hiện ra."
        : "Hai đội hòa nhau: hai ngọn đuốc cùng sáng, mỗi ngọn một bộ tri thức bay lên từ ngọn lửa. Bên Đội 1 là " + triDoi[1] + "; bên Đội 2 là " + triDoi[2] + ". Chúc mừng hai đội, rồi bấm <b>Tiếp theo</b>: bốn bạn mỗi đội vào giữa sân bắt tay nhau, tất cả bay về số 51, báo tường hiện ra.");
    }
    else if (step === "tuong") html = "Bốn bạn đội này bắt tay bốn bạn đội kia, hai ngọn đuốc cùng sáng, sách, định lí và công thức toán học bay về số 51, vành lửa lan ra, báo tường hiện ra (tấm vải xanh lá còn che dải băng chúc mừng). Hỏi cả lớp: <b>Số 51 trên báo tường có ý nghĩa gì?</b> (Kỷ niệm 51 năm ngày truyền thống trường.) Nghe các em trả lời rồi bấm <b>Tiếp theo</b>: hai chú bồ câu bay xuống kéo tấm vải xanh lá bay lên (có tiếng vỗ tay), dòng chữ chúc mừng hiện ra, hiện cả báo tường.";
    else if (step === "bao") {
      var kcc = lichSuKC()[5];
      html = "Xong phần khởi động. Kết quả kéo co: <b>" + (kcc.thang ? "Đội " + kcc.thang + " thắng, dẫn " + Math.abs(kcc.vt) + " nấc" : "hai đội hòa") + "</b>. Báo tường còn 4 ô trống để dán 4 tấm thiệp: mời các nhóm giúp thầy hoàn thiện. Pháo giấy rơi hết thì trên TV hiện nút <b>Tấm thiệp của nhóm em</b>: bấm nút đó trên TV để sang hoạt động tiếp theo.";
    }
    $("#dtGhi").hidden = !html;
    if (ghi.dataset.html !== html) { ghi.innerHTML = html; ghi.dataset.html = html; }
    capManDen();
  }

  /* ---------- quét trên điện thoại ---------- */
  function datCauQuet(q) {
    var key = ses() + ":" + q;
    if (!PQ || PQ.key !== key) {
      PQ = { key: key, q: q, obs: {}, man: {} };
      CHO = {}; THAY = {}; HAI = {}; NGO = {};
      anhCuoi = null;
      soAnh = 0;
      $("#dtAnhKhung").hidden = true;
      trangThai("", "");
      boXacNgau();
    }
    // nhận kết quả từ máy khác (hoặc lúc trang vừa mở lại). 26/11: sc.ngau = các thẻ máy đã chọn ngẫu nhiên đáp án (nn: 1 trong PQ.obs);
    //   thẻ máy này chọn ngẫu nhiên mà máy khác đọc được thẻ thật thì lấy thẻ thật
    var sc = scanHopLe(q), ng = (sc && sc.ngau) || {};
    var nhan = function (k) { PQ.obs[k] = ng[k] ? { l: sc.cards[k], t: 0, nn: 1 } : { l: sc.cards[k], t: 0 }; };
    if (sc && sc.by !== TAB) {
      Object.keys(sc.cards || {}).forEach(function (k) { var o = PQ.obs[k]; if (!o || !o.t || (o.nn && !ng[k])) nhan(k); });
      Object.keys(PQ.obs).forEach(function (k) { var o = PQ.obs[k]; if (o.nn && !o.t && !(sc.cards || {})[k]) delete PQ.obs[k]; });
      PQ.man = clone(sc.man || {});
    } else if (sc && !PQ.daNap) {
      Object.keys(sc.cards || {}).forEach(function (k) { if (!PQ.obs[k]) nhan(k); });
      PQ.man = clone(sc.man || {});
    }
    PQ.daNap = true;
  }
  function chuCua(o) { return o.k != null ? RD.CHU[(o.k + (ROT[o.dang] || 0)) % 4] : o.l; }
  function theHienTai() {
    var m = {};
    if (!PQ) return m;
    Object.keys(PQ.obs).forEach(function (k) { m[k] = chuCua(PQ.obs[k]); });
    return m;
  }
  function ghiQuet(ngay) {
    if (!PQ || !DB) return;
    var lam = function () {
      henGhi = 0; ghiCuoi = Date.now();
      var cards = theHienTai(), ngau = {};
      Object.keys(PQ.obs).forEach(function (k) { if (PQ.obs[k].nn) ngau[k] = 1; });
      DB.set("s" + PQ.q, { ses: ses(), q: PQ.q, cards: cards, man: PQ.man, ngau: ngau, n: Object.keys(cards).length, at: Date.now(), by: TAB });
    };
    if (ngay) { clearTimeout(henGhi); lam(); return; }
    if (henGhi) return;
    // 9/11: 0,25 giây ghi một lần (trước 0,7 giây) để TV báo "Đã quét / Còn thiếu" theo kịp camera đọc nhanh hơn
    henGhi = setTimeout(lam, Math.max(0, 250 - (Date.now() - ghiCuoi)));
  }
  function veBangTo() {
    if (!PQ) return;
    var lb = RD.loaiBuoc(nowHopLe().step), lop = RD.lop(cfg()), m = theHienTai(), man = PQ.man, hien = lb === "a", hienPB = lb === "k" || lb === "a";
    var dungChu = RD.CAU[PQ.q - 1].dung, tongThay = 0, tongCo = 0, demCam = [], tongChua = 0;
    var html = RD.lopDoi(lop).map(function (x, t) {
      var T = RD.DOI[t], thay = 0, dung = 0, chua = [], dd = [];
      x.coMat.forEach(function (id) {
        var k = "t" + id, mm = man[k];
        if (mm) { dd.push({ id: id, m: mm }); if (mm !== "V") { thay++; if (mm === "D") dung++; } return; }
        if (m[k]) { thay++; if (m[k] === dungChu) dung++; } else chua.push(id);
      });
      tongChua += chua.length;
      var tong = x.coMat.length - dd.filter(function (d) { return d.m === "V"; }).length;
      tongThay += thay; tongCo += tong;
      var du = tong > 0 && !chua.length;
      // 9/11 thầy Thịnh: "không biết được em nào chưa quét": trên khung camera mỗi nhóm một dòng, ghi luôn số thẻ còn thiếu
      var thieuChu = du ? " · đủ" : chua.length ? " · thiếu " + (chua.length > 6 ? chua.slice(0, 5).join(", ") + "…" : chua.join(", ")) : "";
      demCam.push('<span class="' + (du ? "du" : "") + '" style="--m:' + T.mau + ";--d:" + T.dam + '">' + T.ten + " · " + thay + "/" + tong + thieuChu + "</span>");
      var chips = chua.map(function (id) { return '<button type="button" data-id="' + id + '" aria-label="Thẻ ' + id + ' chưa đọc được, chạm để ghi">' + id + "</button>"; }).join("") +
        dd.map(function (d) { return '<button type="button" data-id="' + d.id + '" class="' + d.m + '" aria-label="Thẻ ' + d.id + ' đã ghi ' + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + '">' + d.id + " " + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + "</button>"; }).join("");
      return '<div class="dt-hang" style="--m:' + T.mau + ";--d:" + T.dam + ";--n:" + T.nhat + '"><div class="dt-hang-dau"><b>' + T.ten + '</b><span class="dt-thanh"><i style="width:' + (tong ? Math.round(100 * thay / tong) : 0) + '%"></i></span><span class="' + (du ? "du" : "") + '">' +
        (du ? "đủ " : "") + thay + "/" + tong + (hien ? " · đúng " + dung : "") + "</span></div>" +
        (chips ? '<div class="dt-thieu">' + (chua.length ? "<small>Còn thiếu:</small>" : "") + chips + "</div>" : "") + "</div>";
    }).join("");
    var el = $("#dtTo");
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    // số thẻ đã đọc của từng nhóm, hiện ngay trên khung camera lúc toàn màn hình
    var dc = $("#dtCamDem"), hdc = demCam.join("");
    if (dc.dataset.html !== hdc) { dc.innerHTML = hdc; dc.dataset.html = hdc; }
    // phân bố đáp án (chỉ giáo viên thấy, sau khi hiện đáp án)
    var pb = $("#dtPhanBo");
    pb.hidden = !hienPB;
    if (hienPB) {
      var dem = [0, 0, 0, 0];
      Object.keys(m).forEach(function (k) { var id = +k.slice(1); if (lop.toCua[id] && !lop.vang[id] && !man[k]) dem[RD.CHU.indexOf(m[k])]++; });
      pb.innerHTML = RD.CHU.map(function (l, i) { return '<span class="' + (hien && l === dungChu ? "dung" : "") + '">' + l + ": " + dem[i] + " em</span>"; }).join("");
    }
    veNutNgau(tongChua);
    var nut = $("#dtChupChu");
    if (!Q.Live.chay && !Q.coCamera()) nut.textContent = tongThay >= tongCo && tongCo ? "Đã đủ thẻ · chụp thêm nếu cần" : (soAnh && tongThay ? "Chụp thêm · còn thiếu " + (tongCo - tongThay) + " thẻ" : "Chụp ảnh một nhóm");
  }
  // 26/11/2026 thầy Thịnh: 17:13 nút chọn đáp án ngẫu nhiên cho em không quét được, có bấm xác nhận; 19:12 "không cần hiện lên là ghi cho
  //   mấy em đâu, chỉ cần ghi đơn giản là chọn đáp án ngẫu nhiên. Đó, rồi tôi bấm vô thì xác nhận rồi chọn thôi. Nhưng mà không cần phải chọn
  //   đáp án sai, mà bạn cứ cho ngẫu nhiên thôi, ngẫu nhiên đáp án nhé." (17:13 thầy dặn luôn chọn đáp án sai; 19:12 bỏ.)
  //   Em chưa quét = có mặt (không vắng), chưa có thẻ, chưa ghi tay ở câu đang quét, của cả hai đội. Mỗi em được một trong bốn chữ A, B, C, D
  //   (có thể trúng đáp án đúng), đánh dấu nn: 1 (sc.ngau); sau đó camera hay ảnh đọc được thẻ thật của em thì lấy thẻ thật.
  //   Nút và lời báo không ghi số em, không kể tên em nào.
  // 27/11/2026 6:39 thầy Thịnh: "bạn sẽ chọn làm sao để cho cái trò chơi hay hơn ... đang ván 3 mà đội 2 đang thua. Đó thì bạn sẽ chọn làm sao
  //   để cho đội 2 có thể thắng được. Đó, và kéo ngược dây về phía mình." Nên lúc dây đang lệch, máy chọn có tính toán (RD.chonNgauCoTinh
  //   trong du-lieu.js): đội bị dẫn kéo được dây về phía mình nếu làm được, dây về gần giữa nhất. Dây đang ở giữa thì chọn ngẫu nhiên như cũ.
  //   Nút, lời báo và TV không đổi gì.
  // 27/11 7:47 thầy: "ví dụ nhóm 23 em mà có 8 em đúng là sao? claude chọn xác suất gì kì vậy ?": em chưa quét chọn đúng theo tỉ lệ đúng
  //   của các em đã quét trong câu đó (RD.tiLeNgau), không còn bốc thăm đều bốn chữ.
  function emChuaQuet() {
    var ds = [];
    if (!PQ) return ds;
    var m = theHienTai(), man = PQ.man;
    RD.lopDoi(RD.lop(cfg())).forEach(function (x, t) { x.coMat.forEach(function (id) { var k = "t" + id; if (!man[k] && !m[k]) ds.push({ id: id, t: t }); }); });
    return ds;
  }
  function chonNgauNhien(ds) {
    if (!PQ || !ds.length) return;
    var luc = Date.now(), chon = null;
    try {
      var truoc = {};
      for (var j = 1; j < PQ.q; j++) truoc[j] = true;
      var ngau = {};
      Object.keys(PQ.obs).forEach(function (k) { if (PQ.obs[k].nn) ngau[k] = 1; });
      chon = RD.chonNgauCoTinh(PQ.q, cfg(), theHienTai(), PQ.man, ds, RD.keoCo(cfg(), cacScan(), truoc).vt, null, ngau).chon;
    } catch (e) { chon = null; }      // tính lỗi thì chọn ngẫu nhiên như cũ, không để nút hỏng giữa giờ dạy
    ds.forEach(function (e) {
      var l = chon && chon["t" + e.id];
      PQ.obs["t" + e.id] = { l: RD.CHU.indexOf(l) >= 0 ? l : RD.CHU[Math.floor(Math.random() * 4)], t: luc, nn: 1 };
    });
    ghiQuet(true);
    veBangTo();
    trangThai("ok", "Đã chọn đáp án ngẫu nhiên.");
    try { navigator.vibrate && navigator.vibrate(30); } catch (e) { /* bỏ qua */ }
  }
  function boXacNgau() { clearTimeout(henNgau); henNgau = 0; xacNgau = false; }
  // bấm nút (dưới nút quét hay trên khung camera): lần đầu chờ xác nhận 5 giây, lần hai mới chọn
  function bamNgau() {
    if (!PQ) return;
    var ds = emChuaQuet();
    if (!ds.length || dangDem()) { boXacNgau(); veBangTo(); return; }
    if (!xacNgau) {
      xacNgau = true;
      clearTimeout(henNgau);
      henNgau = setTimeout(function () { boXacNgau(); if (PQ) veBangTo(); }, 5000);
      veNutNgau(ds.length);
      return;
    }
    boXacNgau();
    chonNgauNhien(ds);
  }
  // n: số em chưa quét. Nút chỉ hiện ở bước đọc đề (đã bắt đầu quét: camera đang chạy, đã chụp ảnh hay đã ghi được thẻ) và bước quét
  //   xong, khi còn em chưa quét; đang đếm ngược thì chưa hiện. Trên khung camera: chờ dải "Giơ đáp án" tắt mới hiện.
  function veNutNgau(n) {
    var b = $("#dtNgau"), c = $("#dtCamNgau");
    if (!b || !c || !PQ) return;
    var lb = RD.loaiBuoc(nowHopLe().step);
    var daQuet = lb === "k" || Q.Live.chay || soAnh > 0 || Object.keys(PQ.obs).length > 0;
    var co = (lb === "q" || lb === "k") && n > 0 && !dangDem() && daQuet;
    if (xacNgau && !co) boXacNgau();
    var h = $("#dtNgauHang");
    if (h.hidden === co) h.hidden = !co;
    var chu = xacNgau ? "Bấm thêm lần nữa để xác nhận" : "Chọn đáp án ngẫu nhiên";
    if ($("#dtNgauChu").textContent !== chu) $("#dtNgauChu").textContent = chu;
    b.classList.toggle("xac", xacNgau);
    var hienCam = co && $("#dtCamSo").hidden;
    if (c.hidden === hienCam) c.hidden = !hienCam;
    if ($("#dtCamNgauChu").textContent !== chu) $("#dtCamNgauChu").textContent = chu;
    c.classList.toggle("xac", xacNgau);
  }
  function moMenu(id) {
    menuThe = id;
    var lop = RD.lop(cfg()), t = RD.doiCuaThe(lop, id);
    $("#dtMenuTen").textContent = "Thẻ số " + id + (t ? " · " + RD.DOI[t - 1].ten : "") + ": ghi kết quả câu này";
    $("#dtMenu").hidden = false;
  }
  function dongMenu() { $("#dtMenu").hidden = true; menuThe = null; }

  function xuLyAnh(file) {
    if (!PQ) return;
    if (daHienDapAn()) { trangThai("loi", "TV đã hiện đáp án: máy thôi ghi thẻ câu này. Em nào chưa có thì chạm số thẻ để ghi tay."); return; }
    if (dangDem()) { trangThai("loi", "Đang đếm ngược: chờ TV báo Giơ đáp án rồi hãy chụp."); return; }
    var q = PQ.q, key = PQ.key;
    trangThai("", "Đang đọc thẻ trong ảnh, chờ vài giây…");
    $("#dtChupNhan").setAttribute("aria-disabled", "true");
    Q.docAnh(file).then(function (r) {
      $("#dtChupNhan").removeAttribute("aria-disabled");
      if (!PQ || PQ.key !== key) return;
      var lop = RD.lop(cfg()), moi = 0, trong = 0, ngoai = [];
      r.cards.forEach(function (c) {
        if (!lop.toCua[c.id]) { ngoai.push(c.id); return; }
        if (lop.vang[c.id]) return;
        trong++;
        var k = "t" + c.id;
        // 9/11 thầy Thịnh: "em nào đã quét rồi nhưng đổi đáp án thì đáp án đó bị quét lại cần cố định": thẻ đã ghi thì giữ nguyên
        //   26/11: em máy đã chọn ngẫu nhiên (nn) mà nay đọc được thẻ thật thì lấy đáp án thật của em
        if (!PQ.obs[k] || PQ.obs[k].nn) { moi++; PQ.obs[k] = { k: c.k, dang: r.dang, t: Date.now() }; }
      });
      soAnh++;
      anhCuoi = r;
      veAnh(r);
      var giay = r.giay.toFixed(1).replace(".", ",");
      var msg = trong ? "Ảnh " + soAnh + ": đọc được " + trong + " thẻ (" + moi + " thẻ mới) trong " + giay + " giây." : "Ảnh " + soAnh + ": chưa thấy thẻ nào. Đứng gần hơn, giữ máy chắc tay, nhờ các em giơ thẻ cao và thẳng.";
      if (ngoai.length) msg += " Bỏ qua thẻ " + ngoai.join(", ") + " vì không có trong danh sách hai đội.";
      trangThai(trong ? "ok" : "loi", msg);
      if (moi) { A.tich(); try { navigator.vibrate && navigator.vibrate(30); } catch (e) { /* bỏ qua */ } }
      ghiQuet(true);
      veBangTo();
      void q;
    }, function (e) {
      $("#dtChupNhan").removeAttribute("aria-disabled");
      trangThai("loi", "Không đọc được ảnh này (" + ((e && e.message) || e) + "). Hãy chụp lại.");
    });
  }
  function veAnh(r) {
    var cv = $("#dtAnh"), x = cv.getContext("2d");
    cv.width = r.hinhNho.width; cv.height = r.hinhNho.height;
    x.drawImage(r.hinhNho, 0, 0);
    var lop = RD.lop(cfg());
    r.cards.forEach(function (c) {
      var p = c.corners.map(function (q) { return [q.x * r.tiLe, q.y * r.tiLe]; });
      var ok = lop.toCua[c.id] && !lop.vang[c.id];
      x.beginPath(); x.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < 4; i++) x.lineTo(p[i][0], p[i][1]);
      x.closePath();
      x.lineWidth = 3; x.strokeStyle = ok ? "#3ddc84" : "#bbbbbb"; x.stroke();
      var cx = (p[0][0] + p[2][0]) / 2, cy = (p[0][1] + p[2][1]) / 2;
      var oDa = ok && PQ && PQ.obs["t" + c.id];   // thẻ đã ghi: hiện đáp án đã giữ
      var chu = c.id + " " + (oDa ? chuCua(oDa) : RD.CHU[(c.k + (ROT[r.dang] || 0)) % 4]);
      x.font = "700 15px system-ui, sans-serif";
      var w = x.measureText(chu).width + 10;
      x.fillStyle = "rgba(20,14,8,.8)"; x.fillRect(cx - w / 2, cy - 11, w, 22);
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(chu, cx, cy + 1);
    });
    $("#dtAnhKhung").hidden = !!Q.Live.chay;
  }
  var camDangMo = false;
  function batCam() {
    if (camDangMo) return;
    camDangMo = true;
    var nut = $("#dtBatCam");
    nut.setAttribute("aria-disabled", "true");
    trangThai("", "Đang mở camera…");
    $("#dtCam").hidden = false;
    $("#dtAnhKhung").hidden = true;
    Q.Live.batDau($("#dtVideo"), $("#dtPhu"), nhanKhung, nhanThe).then(function () {
      camDangMo = false;
      nut.removeAttribute("aria-disabled");
      nut.textContent = "Dừng quét";
      if (dangDem()) trangThai("", "Camera đã mở: chờ TV đếm xong mới ghi thẻ.");
      else trangThai("ok", "Đang quét: lia chậm qua từng cụm nhóm, giữ máy cách thẻ 1 đến 4 mét.");
      var kn = Q.Live.khaNang(), z = $("#dtZoom");
      $("#dtDen").hidden = !kn.torch;
      // thanh thu phóng: dùng zoom của camera nếu máy cho, không thì phóng bằng phần mềm (1 đến 3 lần)
      ZOOM_MAY = !!(kn.zoom && kn.zoom.max > kn.zoom.min);
      if (ZOOM_MAY) { z.min = kn.zoom.min; z.max = Math.min(kn.zoom.max, 8); z.step = kn.zoom.step || 0.1; z.value = kn.zoom.min; }
      else { z.min = 1; z.max = 3; z.step = 0.1; z.value = 1; Q.Live.zoomSo(1); }
      $("#dtZoomSo").textContent = soZoomChu(+z.value);
      $("#dtZoomKhung").hidden = false;
      $("#dtXoayMay").hidden = !NGHIENG;
      datCamLon(true);
      giuManHinh();
      if (PQ) veBangTo();   // 26/11: camera đã chạy là đang quét, hiện nút Chọn đáp án ngẫu nhiên nếu còn em chưa quét
    }, function (e) {
      camDangMo = false;
      nut.removeAttribute("aria-disabled");
      $("#dtCam").hidden = true;
      var ten = e && e.name;
      trangThai("loi", ten === "NotAllowedError" ? "Chrome chưa cho dùng camera: bấm biểu tượng ổ khóa cạnh địa chỉ trang, cho phép Máy ảnh rồi bấm lại." :
        ten === "NotFoundError" ? "Không tìm thấy camera trên máy này." : "Không mở được camera (" + (ten || e) + "). Dùng nút Chụp một tấm ảnh.");
    });
  }
  // khung xem camera theo đúng tỉ lệ ảnh camera (dọc hay ngang) để thấy trọn khung đang đọc:
  // toàn màn hình thì to hết cỡ phía trên thanh nút dưới; thu nhỏ thì nằm trong thẻ, không cao quá 60% màn hình
  function vuaKhungCam() {
    var v = $("#dtVideo"), k = $("#dtCam");
    if (!v.videoWidth || !v.videoHeight) return;
    var r = v.videoWidth / v.videoHeight;
    k.style.aspectRatio = v.videoWidth + " / " + v.videoHeight;
    if (k.classList.contains("lon")) {
      var rong = document.documentElement.clientWidth || window.innerWidth;
      var cao = window.innerHeight - ($(".dt-chan").offsetHeight || 0);
      var w = Math.min(rong, cao * r), h = w / r;
      k.style.width = Math.round(w) + "px"; k.style.height = Math.round(h) + "px";
      k.style.left = Math.round((rong - w) / 2) + "px"; k.style.top = Math.max(0, Math.round((cao - h) / 2)) + "px";
      k.style.margin = "0";
    } else {
      var cha = k.parentNode, cs = getComputedStyle(cha);
      var w2 = cha.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      var maxH = Math.round(window.innerHeight * 0.6);
      k.style.height = ""; k.style.left = ""; k.style.top = "";
      k.style.width = w2 / r > maxH ? Math.round(maxH * r) + "px" : "";
      k.style.margin = "0 auto";
    }
    Q.Live.ve();
  }
  // lon: khung camera phủ màn hình (mặc định khi vừa bật camera) hay nằm gọn trong thẻ quét
  function datCamLon(lon) {
    var k = $("#dtCam");
    lon = !!lon && !!Q.Live.chay;
    k.classList.toggle("lon", lon);
    $("#dtLon").textContent = lon ? "Thu nhỏ" : "Toàn màn hình";
    capManDen();
    vuaKhungCam();
    if (!lon && Q.Live.chay) k.scrollIntoView({ block: "nearest" });
  }
  function datAnhLon(lon) {
    var k = $("#dtAnhKhung");
    k.classList.toggle("lon", !!lon && !k.hidden);
    capManDen();
  }
  // nền đen phía sau khung lớn; khóa cuộn trang khi đang phóng to
  function capManDen() {
    var cam = $("#dtCam"), anh = $("#dtAnhKhung"), coQuet = !$("#dtQuet").hidden;
    if (cam.classList.contains("lon") && (cam.hidden || !coQuet || !Q.Live.chay)) { cam.classList.remove("lon"); $("#dtLon").textContent = "Toàn màn hình"; }
    if (anh.classList.contains("lon") && (anh.hidden || !coQuet)) anh.classList.remove("lon");
    var lon = cam.classList.contains("lon") || anh.classList.contains("lon");
    var den = $("#dtManDen");
    if (den.hidden === lon) den.hidden = !lon;
    document.documentElement.classList.toggle("dt-khoa", lon);
    if (lon) document.documentElement.style.setProperty("--dt-chan-h", ($(".dt-chan").offsetHeight || 0) + "px");
  }
  function soZoomChu(z) { return (Math.round(z * 10) / 10).toString().replace(".", ",") + "×"; }
  function dungCam() {
    Q.Live.dung();
    $("#dtCam").hidden = true;
    datCamLon(false);
    $("#dtZoomKhung").hidden = true;
    var nut = $("#dtBatCam");
    nut.textContent = "Bật camera quét liên tục";
    if (anhCuoi) $("#dtAnhKhung").hidden = false;
    if (PQ && !$("#dtQuet").hidden) veBangTo();   // 26/11: tắt camera thì xem lại nút Chọn đáp án ngẫu nhiên
  }
  // nhãn vẽ trên khung camera
  function nhanThe(c) {
    var lop = RD.lop(cfg()), k = "t" + c.id;
    if (!lop.toCua[c.id]) return { mau: "rgba(190,190,190,.85)", chu: c.id + "?" };
    if (lop.vang[c.id]) return { mau: "rgba(190,190,190,.85)", chu: c.id + " vắng" };
    if (dangDem()) return { mau: "rgba(190,190,190,.85)", chu: c.id + " chờ" };   // 9/11: đang đếm ngược, chưa ghi
    var o = PQ && PQ.obs[k];
    if (o && !o.nn) return { mau: "#3ddc84", chu: c.id + " " + chuCua(o) };              // đã ghi: đáp án đã giữ, quét lại không đổi
    return { mau: "#ffd54a", chu: String(c.id) };
  }
  // mỗi khung camera đọc xong: thẻ phải giữ cùng một chữ một lúc mới ghi (xem GIU_CHU bên dưới).
  //   9/11: đang đếm ngược thì chưa ghi; thẻ đã ghi thì giữ nguyên đáp án đầu tiên (các em đổi thẻ, thầy quét lại cũng không đổi)
  // 9/11 (thầy Thịnh: "máy nhận diện hơi chậm"): camera nay đọc nhiều khung mỗi giây (hai làn song song), nên điều kiện ghi
  //   đổi từ "thấy 2 khung liền nhau" sang "cùng một chữ đọc được liên tục ít nhất GIU_CHU ms (tính theo lúc chụp khung),
  //   giữa chừng không lần nào ra chữ khác". Thẻ đang xoay lúc các em giơ lên không đứng yên đủ lâu ở một chữ nên không bị
  //   ghi rồi khóa nhầm (thẻ đã ghi thì giữ đáp án đầu tiên). tc: lúc chụp khung; kết quả đến trễ của khung chụp trước
  //   lần đọc mới nhất thì bỏ qua cho thẻ đó.
  var GIU_CHU = 150;
  // bản thử 12/11 (thầy Thịnh: "tối ưu lại web"): "Ghi ngay" = ghi ở lần đọc rõ đầu tiên, không chờ giữ chữ 0,15 giây.
  //   Mặc định BẬT: mã phải khớp đủ 16 ô, đo trên 5.460 khung ảnh thật không ra thẻ ma nào (the-4-mat/nguon/thu-ma-12-11/e7).
  //   Tắt bằng ô trên màn quét, máy nhớ (rd-ghi-ngay = "0"). Luật "một em hiện 2 thẻ" đã bỏ 18/11.
  var GHI_NGAY = lsGet("rd-ghi-ngay", "1") !== "0";
  RD.ghiNgay = function (b) { if (b != null) { GHI_NGAY = !!b; lsSet("rd-ghi-ngay", GHI_NGAY ? "1" : "0"); } return GHI_NGAY; };
  // bản thử: phần ghi số đo (js-the-moi/do.js) hỏi trạng thái quét và danh sách lớp
  RD.trangThaiQuet = function () { return { key: PQ ? PQ.key : "", q: PQ ? PQ.q : 0, dem: dangDem(), n: PQ ? Object.keys(PQ.obs).length : 0, ghiNgay: GHI_NGAY }; };
  RD.lopHienTai = function () { return RD.lop(cfg()); };
  function nhanKhung(cards, tc) {
    if (!PQ || NGHIENG || dangDem() || daHienDapAn()) return;
    var lop = RD.lop(cfg()), t = tc || performance.now(), doi = false, moi = 0;
    cards.forEach(function (c) {
      if (!lop.toCua[c.id] || lop.vang[c.id]) return;
      var k = "t" + c.id, l = RD.CHU[c.k], ch = CHO[k];
      // 18/11 (thầy Thịnh: "chỉ cần quét trúng mã là nhận không cần phải đo góc thẻ nằm trên bàn hay đang cầm"): bỏ luật thẻ nằm
      //   (13/11), thẻ "chưa rõ" và luật "một em 2 thẻ" (12/11). Đọc trúng mã của em nào là ghi cho em đó, đáp án đầu tiên vẫn giữ.
      //   Cùng một khung có 2 thẻ của một em thì bộ đọc đã chọn thẻ to hơn (thường là thẻ đang giơ, ở gần máy hơn).
      if (ch && t < ch.moi) return;
      if (ch && ch.l === l && t - ch.moi < 1600) ch.moi = t;
      else CHO[k] = ch = { l: l, dau: t, moi: t };
      if (ch.moi - ch.dau >= (GHI_NGAY ? 0 : GIU_CHU) && (!PQ.obs[k] || PQ.obs[k].nn)) {   // 26/11: thẻ thật thay đáp án máy chọn ngẫu nhiên
        moi++;
        PQ.obs[k] = { k: c.k, dang: "live", t: Date.now() };
        if (RD.Do) RD.Do.ghi(c, t, PQ);   // bản thử: số đo
        doi = true;
      }
    });
    if (moi) { A.tich(); try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* bỏ qua */ } }
    if (doi) { ghiQuet(false); veBangTo(); }
  }

  /* =====================================================================
     KHỞI ĐỘNG
     ===================================================================== */
  function baoNoi(kieu, chu) { NOI = { kieu: kieu, chu: chu }; ve(); }
  // 9/11 04:11 UTC (thầy Thịnh: "mặc định trong cài đặt luôn luôn là đề cơ bản nha"): mở trang trên TV mà ván chưa bắt đầu (bước
  //   chuẩn bị hoặc giới thiệu, chưa có thẻ nào được quét) thì đề về Đề cơ bản, một lần lúc vừa nối xong dữ liệu (đợi đủ cấu hình,
  //   bước đang chơi và 5 câu quét, đều là dữ liệu chắc chắn chứ không phải bản lưu tạm của trình duyệt). Sau đó thầy vẫn bấm chọn
  //   Đề nâng cao được như cũ.
  var daVeDeMacDinh = false, chacNow = false, daNhanQuet = {};
  function veDeMacDinh() {
    if (daVeDeMacDinh || VAI !== "tv" || !chacCfg || !chacNow || Object.keys(daNhanQuet).length < 5) return;
    daVeDeMacDinh = true;
    if (S.cfg && S.cfg.ses && S.cfg.de && S.cfg.de !== RD.DE_MAC_DINH && duocDoiDe()) {
      RD.chonDe(RD.DE_MAC_DINH);
      ghiCfg(function (c) { delete c.de; });
    }
  }
  function ganDongBo() {
    DB.on("cfg", function (v, chac) {
      S.cfg = v;
      RD.chonDe(v && v.de);
      if (chac) chacCfg = true;
      if (chacCfg && !daKhoiTao) {
        daKhoiTao = true;
        if (!v || !v.ses) vanMoi(false);
      }
      veDeMacDinh();
      ve();
    });
    DB.on("now", function (v, chac) { S.now = v; coNow = true; if (chac) chacNow = true; xemDem(chac); veDeMacDinh(); ve(); });
    DB.on("ph", function (v) { S.ph = v; ve(); });
    [1, 2, 3, 4, 5].forEach(function (q) { DB.on("s" + q, function (v, chac) { S.scans[q] = v; if (chac) daNhanQuet[q] = true; veDeMacDinh(); ve(); }); });
    if (VAI === "dt") DB.set("ph", { dev: DEV, at: Date.now() });
    ve();
  }
  function vaoVai(v) {
    VAI = v;
    lsSet("rd-vai", v);
    document.documentElement.classList.add(v);
    $("#vaiTro").hidden = true;
    if (v === "tv") khoiTV(); else khoiDT();
    ve();
    RD.taoDongBo(baoNoi).then(function (api) { DB = api; ganDongBo(); }, function (e) { console.error(e); baoNoi("loi", "Không nối được dữ liệu"); });
  }
  function batDau() {
    var h = (location.hash || "").replace("#", "");
    var v = h === "dien-thoai" ? "dt" : h === "man-hinh" ? "tv" : lsGet("rd-vai", "");
    if (v === "tv" || v === "dt") { vaoVai(v); return; }
    var hop = $("#vaiTro");
    hop.hidden = false;
    var hep = window.matchMedia && matchMedia("(max-width: 700px)").matches;
    $("#vaiGhi").textContent = hep ? "Máy này có màn hình nhỏ, thường dùng làm Điện thoại." : "Máy này có màn hình lớn, thường dùng làm Màn hình TV.";
    hop.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-vai]");
      if (!b) return;
      A.mo();
      vaoVai(b.dataset.vai);
    });
  }
  RD._test = { kc: function () { return lichSuKC(); }, S: S, duocDoiDe: function () { return duocDoiDe(); }, tinh: tinh, lichSu: lichSu, tiep: tiep, lui: lui, datBuoc: datBuoc, nowHopLe: nowHopLe, xuLyAnh: xuLyAnh, nhanKhung: nhanKhung, hopKhuon: hopKhuon, nhacClaude: nhacClaude, BL: function () { return BL; },
    dem: function () { return { id: DEM.id, so: DEM.so, dang: dangDem() }; }, batDemNguoc: batDemNguoc, ghiLuat: ghiLuat };
  batDau();
})();
