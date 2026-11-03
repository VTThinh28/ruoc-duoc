/* Rước đuốc về trường: sân khấu trên màn hình TV (thiết kế 3/11/2026)
   Con đường gạch ban đêm có đèn lồng, 4 làn ngang. Sương mù che phía trước, tan dần tới bạn đi đầu.
   4 bạn cầm đuốc, mỗi bạn một kiểu di chuyển (đi, lướt, tốc biến, nhảy), mọi kiểu mất cùng thời gian.
   Về đích: 4 ngọn đuốc đứng thành một cột ngay trước tổ dẫn đầu, các tổ lần lượt thắp đuốc theo thứ hạng. */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var SK = RD.SanKhau = {};
  var W = 1920, H = 1080;
  var $ = function (s) { return document.querySelector(s); };
  var gs = function () { return window.gsap; };
  var A = function () { return RD.AmThanh; };

  /* ---------- hình học ---------- */
  // tổ 1 ở làn xa nhất (trên), tổ 4 ở làn gần nhất (dưới). x0: vạch xuất phát, x1: chỗ đứng khi đủ 6 điểm
  var DG = { vach: 236, x0: 260, x1: 1450, chan: [648, 748, 848, 948], cao: [226, 236, 246, 256] };
  SK.DG = DG;
  function xCua(f) { return DG.x0 + Math.max(0, Math.min(1, f || 0)) * (DG.x1 - DG.x0); }
  SK.xCua = xCua;
  // đuốc đứng (ảnh 133×520): miệng chậu lửa cách đỉnh ảnh 58 px
  var DUOC = { w: 133, h: 520, mieng: 58, rong: 30 };
  function caoDuoc(i) { return 185 + i * 8; }
  var COT = { x: 1500 };                 // vị trí cột đuốc (đuốc tổ i đặt ở COT.x + 40i)

  /* ---------- trạng thái ---------- */
  var NG = [], DC = [], P = [], tex = {}, PH = 0;
  var fxCv, fx, fxTrenCv, fxTren, vetCv, vet, suCv, su, rFx = 1, tCu = 0;
  var SU = { x: 420, a: 1, nhay: true, puffs: [] };
  var BX = { tram: [0, 0, 0, 0], hien: [0, 0, 0, 0], cong: [null, null, null, null], dong: [] };

  function taoTex(size, stops) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var x = c.getContext("2d"), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  SK.hexA = hexA;

  // hẹn giờ gắn với "phiên" hoạt cảnh: đổi bước (SK.huy) thì mọi việc đã hẹn tự bỏ
  function hen(giay, fn) {
    var t = PH, G = gs();
    if (G) G.delayedCall(giay, function () { if (t === PH) fn(); });
    else setTimeout(function () { if (t === PH) fn(); }, giay * 1000);
  }

  SK.khoiTao = function () {
    tex.lua = taoTex(64, [[0, "rgba(255,250,220,1)"], [0.25, "rgba(255,214,110,0.95)"], [0.55, "rgba(255,130,30,0.55)"], [1, "rgba(255,60,0,0)"]]);
    tex.do = taoTex(64, [[0, "rgba(255,200,120,0.9)"], [0.4, "rgba(240,90,20,0.5)"], [1, "rgba(160,20,0,0)"]]);
    tex.sang = taoTex(256, [[0, "rgba(255,226,150,0.85)"], [0.35, "rgba(255,170,60,0.35)"], [1, "rgba(255,120,20,0)"]]);
    tex.dom = taoTex(32, [[0, "rgba(255,255,230,1)"], [0.4, "rgba(255,220,140,0.8)"], [1, "rgba(255,160,40,0)"]]);
    tex.suong = taoTex(128, [[0, "rgba(214,224,244,0.9)"], [0.5, "rgba(200,212,236,0.45)"], [1, "rgba(190,204,230,0)"]]);
    RD.TO.forEach(function (t, i) { tex["sao" + i] = taoTex(32, [[0, "rgba(255,255,255,1)"], [0.3, hexA(t.mau, 0.9)], [1, hexA(t.mau, 0)]]); });
    fxCv = $("#fxCv"); fx = fxCv.getContext("2d");
    fxTrenCv = $("#fxTren"); fxTren = fxTrenCv.getContext("2d");
    vetCv = $("#vetCv"); vet = vetCv.getContext("2d");
    suCv = $("#suongCv"); su = suCv.getContext("2d");
    suCv.width = W / 2; suCv.height = H / 2;     // sương mờ sẵn: vẽ nửa độ phân giải cho nhẹ máy
    datCoFx();
    for (var k = 0; k < 30; k++) SU.puffs.push({ x: Math.random() * 1900, y: 380 + Math.random() * 690, r: 130 + Math.random() * 170, v: 8 + Math.random() * 16, a: 0.35 + Math.random() * 0.35, ph: Math.random() * 6 });
    // 4 bạn cầm đuốc và nhãn tên tổ
    var lop = $("#nguoi");
    lop.innerHTML = "";
    RD.TO.forEach(function (t, i) {
      var el = document.createElement("div");
      el.className = "sv";
      el.innerHTML = '<img alt="' + t.ten + ": " + t.mo + ' cầm đuốc" src="' + t.anh + '" width="' + t.w + '" height="' + t.h + '">';
      lop.appendChild(el);
      var img = el.querySelector("img");
      img.style.left = (-t.w / 2) + "px";
      img.style.top = (-t.h) + "px";
      var tag = document.createElement("div");
      tag.className = "the-to";
      tag.style.setProperty("--m", t.mau);
      tag.style.setProperty("--d", t.dam);
      tag.textContent = t.ten;
      lop.appendChild(tag);
      NG.push({ i: i, t: t, el: el, img: img, tag: tag, s: DG.cao[i] / t.h, x: DG.x0, dx: DG.x0, lift: 0, nhay: 0, hien: 1, mv: null, pops: [] });
    });
    // 4 ngọn đuốc đứng (hiện khi về đích)
    RD.TO.forEach(function (t, i) {
      var el = document.createElement("div");
      el.className = "duoc";
      el.innerHTML = '<img alt="Ngọn đuốc của ' + t.ten + '" src="anh/duoc.webp" width="' + DUOC.w + '" height="' + DUOC.h + '"><b class="so-hang" hidden></b>';
      var img = el.querySelector("img"), h = caoDuoc(i), s = h / DUOC.h;
      img.style.width = DUOC.w * s + "px"; img.style.height = h + "px";
      img.style.left = (-DUOC.w * s / 2) + "px"; img.style.top = (-h) + "px";
      var so = el.querySelector(".so-hang");
      so.style.top = (-h - 30) + "px";
      lop.appendChild(el);
      DC.push({ i: i, el: el, so: so, h: h, s: s, x: 0, hien: 0, chay: 0, hang: 0 });
    });
    // bảng xếp hạng
    var bx = $("#bxDong");
    bx.innerHTML = "";
    RD.TO.forEach(function (t, i) {
      var d = document.createElement("div");
      d.className = "bx-dong";
      d.style.setProperty("--m", t.mau);
      d.innerHTML = '<b class="bx-hang">1</b><span class="bx-mat" style="background-image:url(' + t.mat + ')"></span><span class="bx-ten">' + t.ten + '</span><span class="bx-diem"><b>0,00</b><small></small></span>';
      bx.appendChild(d);
      BX.dong.push({ el: d, hang: d.querySelector(".bx-hang"), diem: d.querySelector(".bx-diem b"), cong: d.querySelector(".bx-diem small") });
    });
    veBang();
    window.addEventListener("resize", SK.vuaManHinh);
    SK.vuaManHinh();
    requestAnimationFrame(khung);
  };
  function datCoFx() {
    var k = SK.k || 1, dpr = window.devicePixelRatio || 1;
    rFx = Math.max(0.5, Math.min(1, k * dpr));
    [fxCv, fxTrenCv, vetCv].forEach(function (c) { c.width = Math.round(W * rFx); c.height = Math.round(H * rFx); });
  }
  SK.vuaManHinh = function () {
    var k = Math.min(window.innerWidth / W, window.innerHeight / H);
    SK.k = k;
    $("#world").style.transform = "translate(-50%,-50%) scale(" + k + ")";
    if (fxCv) datCoFx();
  };

  /* ---------- 4 kiểu di chuyển ---------- */
  function lam(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  // trạng thái hiển thị của một bạn ở thời điểm now
  function dang(n, now) {
    var o = { x: n.x, lift: 0, op: 1, sx: 1, sy: 1, tilt: 0 };
    var m = n.mv;
    if (!m) { o.lift = Math.sin(now / 900 + n.i * 1.7) * 2; return o; }
    var p = m.p, d = m.den - m.tu, k, s, j, f;
    switch (n.t.kieu) {
      case "di":            // đi bộ: nhún theo từng bước chân
        o.x = m.tu + d * (0.5 - 0.5 * Math.cos(Math.PI * p));
        var ph = p * m.buoc * Math.PI;
        o.lift = Math.abs(Math.sin(ph)) * 10;
        o.tilt = Math.sin(ph) * 2.4;
        break;
      case "luot":          // lướt: bay là là, nghiêng người về trước
        o.x = m.tu + d * (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
        o.lift = Math.sin(p * Math.PI) * 16;
        o.tilt = Math.sin(p * Math.PI) * 5;
        break;
      case "bien":          // tốc biến: mờ đi, hiện ra ở chỗ mới
        k = m.k; s = p * k; j = Math.min(k - 1, Math.floor(s)); f = s - j;
        var da = f >= 0.5 ? j + 1 : j;
        o.x = m.tu + d * da / k;
        var a = f < 0.5 ? 1 - lam(0.28, 0.5, f) : lam(0.5, 0.72, f);
        o.op = a; o.sx = 0.45 + 0.55 * a; o.sy = 1 + (1 - a) * 0.18;
        o.lift = (1 - a) * 10;
        if (da !== m.da) { m.da = da; m.doiCho = true; }
        break;
      case "nhay":          // nhảy: từng cú nhảy cong, chạm đất hơi nhún
        k = m.k; s = p * k; j = Math.min(k - 1, Math.floor(s)); f = s - j;
        o.x = m.tu + d * (j + (0.5 - 0.5 * Math.cos(Math.PI * f))) / k;
        o.lift = Math.sin(Math.PI * f) * 72;
        var sq = Math.max(0, 1 - Math.min(f, 1 - f) * 7);
        o.sy = 1 - 0.09 * sq; o.sx = 1 + 0.07 * sq;
        o.tilt = (0.5 - f) * -10;
        if (j !== m.j) { m.j = j; m.dap = true; }
        break;
    }
    return o;
  }
  function viTriLua(n, o) {
    var t = n.t, s = n.s;
    var dx = (t.lua[0] - t.w / 2) * s * o.sx, dy = (t.lua[1] - t.h) * s * o.sy;
    var a = o.tilt * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    return { x: o.x + dx * ca - dy * sa, y: DG.chan[n.i] - o.lift - n.nhay + dx * sa + dy * ca, k: s / 0.45 };
  }
  // bắt đầu đi tới x = den theo kiểu của tổ; trả về thời gian (giây). Mọi kiểu dùng chung một công thức thời gian.
  function diToi(i, den, xong) {
    var n = NG[i], G = gs(), tu = n.mv ? n.dx : n.x, d = den - tu, t = PH;
    if (Math.abs(d) < 2 || !G) { n.x = den; n.mv = null; if (xong) hen(0.35, xong); return 0.35; }
    var D = 0.9 + Math.min(1.6, Math.abs(d) / 260);
    var m = n.mv = { tu: tu, den: den, p: 0, D: D, buoc: Math.max(2, Math.round(D * 2.6)), k: Math.max(1, Math.round(Math.abs(d) / 165)), da: 0, j: 0 };
    if (n.t.kieu === "luot") A().vut();
    G.to(m, { p: 1, duration: D, ease: "none", onUpdate: function () {
      var now = performance.now();
      if (n.t.kieu === "di" && (!m._b || now - m._b > 1000 * D / m.buoc)) { m._b = now; A().buoc(); }
    }, onComplete: function () {
      if (n.mv === m) { n.x = den; n.mv = null; }
      if (t === PH && xong) xong();
    } });
    return D;
  }
  SK.diToi = diToi;

  /* ---------- vòng vẽ mỗi khung hình ---------- */
  function khung(now) {
    var dt = Math.min(0.05, tCu ? (now - tCu) / 1000 : 0.016);
    tCu = now;
    var xa = DG.x0;
    NG.forEach(function (n) {
      var o = dang(n, now);
      n.o = o; n.dx = o.x;
      if (n.hien > 0.5) xa = Math.max(xa, o.x);
      n.el.style.transform = "translate(" + o.x.toFixed(1) + "px," + (DG.chan[n.i] - o.lift - n.nhay).toFixed(1) + "px)";
      n.el.style.zIndex = String(DG.chan[n.i]);
      n.el.style.opacity = (o.op * n.hien).toFixed(3);
      n.img.style.transform = "rotate(" + o.tilt.toFixed(2) + "deg) scale(" + (n.s * o.sx).toFixed(4) + "," + (n.s * o.sy).toFixed(4) + ")";
      n.tag.style.transform = "translate(" + (o.x - 150).toFixed(1) + "px," + (DG.chan[n.i] - 58) + "px)";
      n.tag.style.opacity = n.hien;
      n.tag.style.zIndex = String(2600 + n.i);     // nhãn tên tổ luôn nằm trên các bạn để dễ đọc
      var top = DG.chan[n.i] - DG.cao[n.i] - 16;
      n.pops.forEach(function (p) { p.el.style.left = o.x.toFixed(1) + "px"; p.el.style.top = (top - p.dy).toFixed(1) + "px"; });
      // hiệu ứng theo kiểu di chuyển
      var m = n.mv;
      if (m && n.t.kieu === "luot" && Math.random() < 0.9) {
        P.push({ k: "sao", c: n.i, x: o.x - 40 + (Math.random() - 0.5) * 50, y: DG.chan[n.i] - o.lift - 10 - Math.random() * 60, vx: -60 - Math.random() * 80, vy: (Math.random() - 0.5) * 30, l: 0, m: 0.5 + Math.random() * 0.4, s: 5 + Math.random() * 7 });
      }
      if (m && m.doiCho) {
        m.doiCho = false;
        var x0 = m.tu + (m.den - m.tu) * (m.da - 1) / m.k;
        lapLanhMau(x0, DG.chan[n.i] - DG.cao[n.i] / 2, n.i, 16);
        lapLanhMau(o.x, DG.chan[n.i] - DG.cao[n.i] / 2, n.i, 22);
        A().tich();
      }
      if (m && m.dap) { m.dap = false; if (m.j > 0) { bui(o.x, DG.chan[n.i]); A().buoc(); } }
    });
    // sương mù đi theo bạn đi xa nhất
    var dich = Math.min(W + 200, xa + 150);
    if (SU.nhay) { SU.x = dich; SU.nhay = false; } else SU.x += (dich - SU.x) * Math.min(1, dt * 2.2);
    DC.forEach(function (d) {
      var sc = 0.4 + 0.6 * d.hien;
      d.el.style.transform = "translate(" + d.x.toFixed(1) + "px," + (DG.chan[d.i] + 6) + "px) scale(" + sc.toFixed(3) + ")";
      d.el.style.opacity = Math.min(1, d.hien * 1.4).toFixed(3);
      d.el.style.zIndex = String(DG.chan[d.i] - 1);
    });
    veVet();
    veSuong(now);
    phatHat(dt, now);
    veHat(dt, now);
    requestAnimationFrame(khung);
  }
  // vạch xuất phát và vệt sáng màu tổ trên mỗi làn
  function veVet() {
    var x = vet;
    x.setTransform(rFx, 0, 0, rFx, 0, 0);
    x.clearRect(0, 0, W, H);
    var g0 = x.createLinearGradient(0, 560, 0, 980);
    g0.addColorStop(0, "rgba(255,227,154,0.35)"); g0.addColorStop(1, "rgba(216,164,64,0.75)");
    x.fillStyle = g0;
    x.fillRect(DG.vach - 4, 560, 8, 410);
    NG.forEach(function (n) {
      if (n.hien < 0.05) return;
      var y = DG.chan[n.i] - 14, a = DG.x0 - 40, b = n.dx - 30;
      if (b <= a + 4) return;
      var g = x.createLinearGradient(a, 0, b, 0);
      g.addColorStop(0, hexA(n.t.mau, 0));
      g.addColorStop(0.5, hexA(n.t.mau, 0.32));
      g.addColorStop(1, hexA(n.t.mau, 0.62));
      x.globalAlpha = n.hien;
      x.fillStyle = g;
      x.beginPath();
      if (x.roundRect) x.roundRect(a, y - 12, b - a, 24, 12); else x.rect(a, y - 12, b - a, 24);
      x.fill();
      x.fillStyle = hexA("#fff4d6", 0.18);
      x.fillRect(Math.max(a, b - 260), y - 2, Math.min(260, b - a), 4);
    });
    x.globalAlpha = 1;
  }
  function veSuong(now) {
    var x = su;
    x.setTransform(0.5, 0, 0, 0.5, 0, 0);
    x.clearRect(0, 0, W, H);
    if (SU.a < 0.01 || SU.x > W + 150) return;
    x.globalAlpha = SU.a;
    var g = x.createLinearGradient(SU.x - 80, 0, SU.x + 260, 0);
    g.addColorStop(0, "rgba(176,192,222,0)");
    g.addColorStop(0.6, "rgba(176,192,222,0.62)");
    g.addColorStop(1, "rgba(186,200,228,0.78)");
    x.fillStyle = g;
    x.fillRect(SU.x - 80, 300, W - SU.x + 80, H - 300);
    SU.puffs.forEach(function (p) {
      var X = SU.x - 40 + ((p.x + now * p.v / 1000) % 1900);
      if (X - p.r > W) return;
      x.globalAlpha = SU.a * p.a * (0.75 + 0.25 * Math.sin(now / 1700 + p.ph));
      x.drawImage(tex.suong, X - p.r, p.y - p.r * 0.7, p.r * 2, p.r * 1.4);
    });
    // mép trên mờ dần để thấy trời và mái trường
    x.globalAlpha = 1;
    x.globalCompositeOperation = "destination-in";
    var gv = x.createLinearGradient(0, 300, 0, 470);
    gv.addColorStop(0, "rgba(0,0,0,0)"); gv.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gv;
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
  }

  /* ---------- hạt: lửa đuốc, tàn lửa, lấp lánh, pháo giấy ---------- */
  function phatHat(dt, now) {
    NG.forEach(function (n) {
      if (n.hien < 0.5 || !n.o || n.o.op < 0.4) return;
      var d = viTriLua(n, n.o), k = d.k;
      n.duLua = (n.duLua || 0) + dt * 14;
      while (n.duLua > 1) {
        n.duLua -= 1;
        P.push({ k: "lua", x: d.x + (Math.random() - 0.5) * 10 * k, y: d.y + 10 * k, vx: (Math.random() - 0.5) * 14 * k, vy: (-60 - Math.random() * 50) * k, l: 0, m: 0.3 + Math.random() * 0.25, s: (10 + Math.random() * 8) * k });
      }
      n.duTan = (n.duTan || 0) + dt * 2.5;
      while (n.duTan > 1) {
        n.duTan -= 1;
        P.push({ k: "tan", x: d.x + (Math.random() - 0.5) * 12, y: d.y - 10, vx: (Math.random() - 0.5) * 30, vy: -50 - Math.random() * 60, l: 0, m: 1 + Math.random(), s: 2 + Math.random() * 2 });
      }
    });
    DC.forEach(function (d) {
      if (d.chay < 0.02 || d.hien < 0.5) return;
      var mx = d.x, my = DG.chan[d.i] + 6 - d.h + DUOC.mieng * d.s, w = DUOC.rong * d.s * 2;
      d.du = (d.du || 0) + dt * 80 * d.chay;
      while (d.du > 1) {
        d.du -= 1;
        var u = Math.random(), giua = 1 - Math.abs(u - 0.5) * 2;
        P.push({ k: "lua", x: mx - w / 2 + u * w, y: my, vx: (0.5 - u) * 22 + (Math.random() - 0.5) * 14, vy: -(80 + Math.random() * 90) * (0.6 + 0.6 * giua), l: 0, m: 0.45 + Math.random() * 0.4, s: (16 + Math.random() * 16) * (0.7 + 0.5 * giua) * (0.6 + 0.4 * d.chay) });
      }
      d.duTan = (d.duTan || 0) + dt * 5 * d.chay;
      while (d.duTan > 1) {
        d.duTan -= 1;
        P.push({ k: "tan", x: mx + (Math.random() - 0.5) * w, y: my - 20, vx: (Math.random() - 0.5) * 40, vy: -80 - Math.random() * 90, l: 0, m: 1.2 + Math.random(), s: 2.5 + Math.random() * 2.5 });
      }
    });
  }
  function veHat(dt, now) {
    var x = fx, coTren = false;
    x.setTransform(rFx, 0, 0, rFx, 0, 0);
    x.clearRect(0, 0, W, H);
    fxTren.setTransform(rFx, 0, 0, rFx, 0, 0);
    if (SK._trenBan) { fxTren.clearRect(0, 0, W, H); SK._trenBan = false; }
    x.globalCompositeOperation = "lighter";
    // quầng sáng quanh đuốc cầm tay và đuốc đứng
    NG.forEach(function (n) {
      if (n.hien < 0.5 || !n.o) return;
      var d = viTriLua(n, n.o), r = (58 + Math.sin(now / 90 + n.i * 3) * 6) * d.k;
      x.globalAlpha = 0.4 * n.o.op;
      x.drawImage(tex.sang, d.x - r, d.y - r * 0.9, r * 2, r * 2);
    });
    DC.forEach(function (d) {
      if (d.chay < 0.02 || d.hien < 0.5) return;
      var my = DG.chan[d.i] + 6 - d.h + DUOC.mieng * d.s, r = (150 + Math.sin(now / 110 + d.i) * 10) * (0.4 + 0.6 * d.chay);
      x.globalAlpha = 0.55 * d.chay;
      x.drawImage(tex.sang, d.x - r, my - 40 - r, r * 2, r * 2);
    });
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      p.l += dt;
      if (p.l >= p.m && p.k !== "cau") { P.splice(i, 1); continue; }
      var u = p.l / p.m;
      if (p.tren && !coTren) { coTren = true; fxTren.clearRect(0, 0, W, H); }
      x = p.tren ? fxTren : fx;
      if (p.k === "lua") {
        p.vy *= 0.985; p.vx *= 0.96;
        p.x += p.vx * dt; p.y += p.vy * dt;
        var sz = p.s * (1 - 0.65 * u);
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = Math.min(1, (1 - u) * 1.15);
        x.drawImage(u < 0.45 ? tex.lua : tex.do, p.x - sz / 2, p.y - sz / 2, sz, sz);
      } else if (p.k === "tan") {
        p.vx += (Math.random() - 0.5) * 60 * dt; p.vy += 12 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = (1 - u) * (0.6 + 0.4 * Math.sin(now / 40 + i));
        x.drawImage(tex.dom, p.x - p.s * 2, p.y - p.s * 2, p.s * 4, p.s * 4);
      } else if (p.k === "cau") {        // đốm lửa bay từ đuốc cầm tay sang đuốc đứng
        var t = Math.min(1, p.l / p.m), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, it = 1 - e;
        var cx = it * it * p.x0 + 2 * it * e * p.cx + e * e * p.x1, cy = it * it * p.y0 + 2 * it * e * p.cy + e * e * p.y1;
        for (var k = 0; k < 3; k++) P.push({ k: "lua", x: cx + (Math.random() - 0.5) * 8, y: cy + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 24, vy: -20 - Math.random() * 30, l: 0, m: 0.3 + Math.random() * 0.2, s: 16 + Math.random() * 12 });
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = 1;
        x.drawImage(tex.sang, cx - 55, cy - 55, 110, 110);
        x.drawImage(tex.lua, cx - 20, cy - 20, 40, 40);
        if (t >= 1) { P.splice(i, 1); if (p.toi) p.toi(); continue; }
      } else if (p.k === "giay") {
        p.vy += 260 * dt; p.vx *= 0.99; p.vy = Math.min(p.vy, 240);
        p.x += (p.vx + Math.sin(now / 300 + p.ph) * 40) * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        x.globalCompositeOperation = "source-over";
        x.globalAlpha = u > 0.8 ? (1 - u) * 5 : 1;
        x.save();
        x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(now / 160 + p.ph));
        x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        x.restore();
      } else if (p.k === "sao") {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = 1 - u;
        x.drawImage(p.c != null ? tex["sao" + p.c] : tex.dom, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      } else if (p.k === "bui") {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9;
        x.globalCompositeOperation = "source-over";
        x.globalAlpha = (1 - u) * 0.35;
        x.drawImage(tex.suong, p.x - p.s, p.y - p.s * 0.5, p.s * 2, p.s);
      }
    }
    fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
    fxTren.globalAlpha = 1; fxTren.globalCompositeOperation = "source-over";
    if (coTren) SK._trenBan = true;
  }
  SK.phaoGiay = function (x0, y0, n, rong, tren) {
    var mau = ["#e94b3c", "#f6c445", "#2f9a58", "#2f6fd6", "#8b52cc", "#ff8fb1", "#ffffff", "#e9861c"];
    n = n || 160;
    var tuTren = x0 == null;
    for (var i = 0; i < n; i++) {
      P.push({
        k: "giay", c: mau[i % mau.length], s: 12 + Math.random() * 12, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, ph: Math.random() * 6,
        x: tuTren ? Math.random() * W : x0 + (Math.random() - 0.5) * (rong || 60),
        y: tuTren ? -20 - Math.random() * 200 : y0,
        vx: tuTren ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * 700,
        vy: tuTren ? 40 + Math.random() * 80 : -300 - Math.random() * 500,
        l: 0, m: 3.2 + Math.random() * 1.6, tren: !!(tren || tuTren)
      });
    }
  };
  SK.lapLanh = function (x0, y0, n, tren) {
    for (var i = 0; i < (n || 26); i++) {
      var a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 320;
      P.push({ k: "sao", x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: 0.7 + Math.random() * 0.5, s: 6 + Math.random() * 8, tren: !!tren });
    }
  };
  function lapLanhMau(x0, y0, c, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 220;
      P.push({ k: "sao", c: c, x: x0 + (Math.random() - 0.5) * 40, y: y0 + (Math.random() - 0.5) * 120, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: 0.5 + Math.random() * 0.4, s: 6 + Math.random() * 8 });
    }
  }
  function bui(x0, y0) {
    for (var i = 0; i < 6; i++) P.push({ k: "bui", x: x0 + (Math.random() - 0.5) * 30, y: y0 - 4, vx: (Math.random() - 0.5) * 160, vy: -10 - Math.random() * 20, l: 0, m: 0.5 + Math.random() * 0.3, s: 26 + Math.random() * 18 });
  }

  /* ---------- chữ bay, chữ nổi trên đầu ---------- */
  function bayChu(text, x, y, lop, giay) {
    var el = document.createElement("div");
    el.className = "bay " + (lop || "");
    el.textContent = text;
    el.style.left = x + "px"; el.style.top = y + "px";
    $("#popLop").appendChild(el);
    var G = gs();
    if (G) {
      G.set(el, { xPercent: -50, yPercent: -50 });
      G.fromTo(el, { y: 10, opacity: 0, scale: 0.7 }, { y: -40, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" });
      G.to(el, { y: -110, opacity: 0, duration: 0.8, delay: (giay || 1.6), ease: "power1.in", onComplete: function () { el.remove(); } });
    } else setTimeout(function () { el.remove(); }, 2000);
  }
  SK.bayChu = bayChu;
  // chữ nổi đi theo bạn cầm đuốc: "10/11 bạn đúng · +0,91", "Bứt phá!"
  function noiTren(i, html, lop, dy, giay) {
    var n = NG[i], el = document.createElement("div"), G = gs();
    el.className = "noi " + (lop || "");
    el.innerHTML = html;
    $("#popLop").appendChild(el);
    var p = { el: el, dy: dy || 0 };
    n.pops.push(p);
    var bo = function () { el.remove(); var k = n.pops.indexOf(p); if (k >= 0) n.pops.splice(k, 1); };
    if (G) {
      G.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" });
      G.to(el, { opacity: 0, y: -24, duration: 0.6, delay: giay || 2.6, ease: "power1.in", onComplete: bo });
    } else setTimeout(bo, (giay || 2.6) * 1000);
    return p;
  }
  function xoaNoi() {
    NG.forEach(function (n) { n.pops.forEach(function (p) { var G = gs(); if (G) G.killTweensOf(p.el); p.el.remove(); }); n.pops = []; });
    Array.prototype.forEach.call(document.querySelectorAll("#popLop .bay"), function (el) { el.remove(); });
  }

  /* ---------- bảng xếp hạng ---------- */
  function veBang() {
    var res = BX.tram.map(function (t) { return { tram: t }; }), h = RD.xepHang(res);
    h.thuTu.forEach(function (t, k) {
      var d = BX.dong[t];
      d.el.style.top = (66 + k * 84) + "px";
      d.hang.textContent = h.hang[t];
      d.hang.className = "bx-hang h" + h.hang[t];
      d.el.classList.toggle("nhat", h.hang[t] === 1 && BX.tram[t] > 0);
    });
    BX.dong.forEach(function (d, t) {
      d.diem.textContent = RD.vietDiem(Math.round(BX.hien[t]));
      d.cong.textContent = BX.cong[t] == null ? "" : "+" + RD.vietDiem(BX.cong[t]);
    });
  }
  SK.datBang = function (res, q) {
    BX.tram = res.map(function (r) { return r.tram; });
    BX.hien = BX.tram.slice();
    BX.cong = res.map(function (r) { return q && r.cau[q] ? r.cau[q].tram : null; });
    veBang();
  };
  SK.hienBang = function (on, hoatCanh) {
    var el = $("#bangXH"), G = gs();
    if (G) G.killTweensOf(el);
    if (on && el.hidden) {
      el.hidden = false;
      if (G && hoatCanh) G.fromTo(el, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" });
      else if (G) G.set(el, { x: 0, opacity: 1 });
    } else if (!on && !el.hidden) {
      if (G && hoatCanh) G.to(el, { x: 60, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: function () { el.hidden = true; } });
      else el.hidden = true;
    }
  };

  /* ---------- đặt ngay (không hoạt cảnh) ---------- */
  SK.huy = function () {
    PH++;
    var G = gs();
    if (G) {
      NG.forEach(function (n) { G.killTweensOf(n); if (n.mv) G.killTweensOf(n.mv); });
      DC.forEach(function (d) { G.killTweensOf(d); G.killTweensOf(d.so); });
      G.killTweensOf(SU); G.killTweensOf(BX.hien);
    }
    NG.forEach(function (n) { n.mv = null; n.nhay = 0; n.hien = 1; n.tag.classList.remove("soi"); });
    for (var i = P.length - 1; i >= 0; i--) if (P[i].k === "cau") P.splice(i, 1);
    xoaNoi();
  };
  SK.datViTri = function (viTri) {
    NG.forEach(function (n, i) { n.x = n.dx = xCua(viTri[i]); n.mv = null; });
    SU.nhay = true;
  };
  SK.datSuong = function (a) { SU.a = a; };
  SK.anDuoc = function () {
    DC.forEach(function (d) { d.hien = 0; d.chay = 0; d.hang = 0; d.so.hidden = true; });
  };

  /* ---------- công bố một câu: trống dồn, từng tổ tiến lên (ít điểm trước, nhiều điểm sau) ---------- */
  SK.congBo = function (q, truoc, sau, xong) {
    var G = gs(), am = A();
    SK.huy();
    SK.anDuoc();
    SU.a = 1;
    SK.datViTri(truoc.map(function (r) { return r.viTri; }));
    SK.datBang(truoc, null);
    BX.cong = [null, null, null, null]; veBang();
    if (!G) { SK.datViTri(sau.map(function (r) { return r.viTri; })); SK.datBang(sau, q); if (xong) xong(); return; }
    var c = function (i) { return sau[i].cau[q] || { dung: 0, thay: 0, tram: 0, tron: false }; };
    var thuTu = [0, 1, 2, 3].sort(function (a, b) { return c(a).tram - c(b).tram || a - b; }), con = 4;
    thuTu.forEach(function (i, k) {
      var n = NG[i], at = 0.5 + k * 1.9;
      hen(at, function () { am.trongDon(0.55); n.tag.classList.add("soi"); });
      hen(at + 0.6, function () {
        am.trong(1);
        var r = c(i);
        noiTren(i, r.thay ? r.dung + "/" + r.thay + " bạn đúng · <b>+" + RD.vietDiem(r.tram) + "</b>" : "Chưa đọc được thẻ · <b>+0,00</b>", "", 0, 2.9);
        var D = diToi(i, xCua(sau[i].viTri), function () {
          n.tag.classList.remove("soi");
          BX.tram[i] = sau[i].tram;
          veBang();
          if (r.tron) {
            G.to(n, { nhay: 40, duration: 0.22, yoyo: true, repeat: 3, ease: "power2.out" });
            noiTren(i, "Bứt phá!", "but-pha", 64, 1.6);
            var d = viTriLua(n, n.o || dang(n, performance.now()));
            SK.lapLanh(d.x, d.y, 30);
            am.lapLanh();
          }
          if (--con === 0) hen(0.9, function () { if (xong) xong(); });
        });
        // điểm trên bảng đếm dần theo bước chân
        BX.cong[i] = r.tram;
        G.to(BX.hien, { [i]: sau[i].tram, duration: D, ease: "none", onUpdate: veBang });
      });
    });
  };

  /* ---------- về đích: 4 ngọn đuốc, các tổ thắp đuốc theo thứ hạng ---------- */
  // chỗ đứng cạnh đuốc: ngọn lửa trên tay sát mép trái chậu lửa
  function choDung(i) { var t = RD.TO[i], s = NG[i].s; return DC[i].x - 24 - (t.lua[0] - t.w / 2) * s; }
  function datCot(sau) {
    var xa = 0;
    sau.forEach(function (r) { xa = Math.max(xa, xCua(r.viTri)); });
    COT.x = Math.max(760, Math.min(1640, xa + 190));
    DC.forEach(function (d, i) { d.x = COT.x + i * 40; });
  }
  function hienSo(i, hang, hoatCanh) {
    var d = DC[i], G = gs();
    d.hang = hang;
    d.so.textContent = hang;
    d.so.className = "so-hang h" + hang;
    d.so.hidden = false;
    if (G && hoatCanh) G.fromTo(d.so, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.6)" });
    else if (G) G.set(d.so, { scale: 1, rotation: 0 });
  }
  // đốm lửa bay từ đuốc cầm tay sang chậu lửa, chạm vào thì bùng lên
  function thap(i, hang, xong) {
    var n = NG[i], d = DC[i], G = gs(), am = A();
    var tu = viTriLua(n, n.o || dang(n, performance.now()));
    var mx = d.x, my = DG.chan[i] + 6 - d.h + DUOC.mieng * d.s;
    P.push({ k: "cau", x0: tu.x, y0: tu.y, x1: mx, y1: my, cx: (tu.x + mx) / 2, cy: Math.min(tu.y, my) - 90, l: 0, m: 0.6, x: tu.x, y: tu.y, toi: function () {
      am.bungLua(); am.lachTach(1.5);
      if (G) G.fromTo(d, { chay: 0.1 }, { chay: 1, duration: 0.9, ease: "power2.out" }); else d.chay = 1;
      SK.lapLanh(mx, my - 20, 34);
      hienSo(i, hang, true);
      if (hang === 1) { am.ken(); SK.phaoGiay(mx, my - 30, 70, 80); }
      if (G) G.to(n, { nhay: 26, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
      if (xong) xong();
    } });
  }
  // sau câu 5: sương tan, cột đuốc hiện, tổ (hoặc các tổ bằng điểm) hạng 1 đi tới và thắp đuốc
  SK.veDich = function (sau, hang, hoatCanh, xong) {
    var G = gs(), am = A();
    SK.huy();
    SK.datViTri(sau.map(function (r) { return r.viTri; }));
    SK.datBang(sau, null);
    SK.hienBang(false, hoatCanh);
    datCot(sau);
    SK.anDuoc();
    var dau = hang.nhom[0];
    if (!hoatCanh || !G) {
      SU.a = 0;
      DC.forEach(function (d) { d.hien = 1; });
      dau.forEach(function (i) { NG[i].x = choDung(i); DC[i].chay = 1; hienSo(i, 1, false); });
      if (xong) xong();
      return;
    }
    SU.a = 1;
    G.to(SU, { a: 0, duration: 1.6, delay: 0.2, ease: "power1.inOut" });
    DC.forEach(function (d, i) {
      G.to(d, { hien: 1, duration: 0.5, delay: 1.0 + i * 0.18, ease: "back.out(2)", onStart: function () {
        am.trong(0.5 + i * 0.1);
        SK.lapLanh(d.x, DG.chan[i] - d.h / 2, 12);
      } });
    });
    var con = dau.length;
    hen(2.2, function () {
      dau.forEach(function (i) {
        diToi(i, choDung(i), function () {
          hen(0.25, function () { thap(i, 1, function () { if (--con === 0) hen(0.6, function () { if (xong) xong(); }); }); });
        });
      });
    });
  };
  // bấm "Thứ hạng các tổ": các tổ còn lại lần lượt (theo hạng) đi tới và thắp đuốc; xong thì cả 4 đuốc cùng sáng
  SK.thuHang = function (sau, hang, hoatCanh, xong) {
    var G = gs(), am = A();
    SK.huy();
    SK.datViTri(sau.map(function (r) { return r.viTri; }));
    SK.hienBang(false, false);
    datCot(sau);
    SU.a = 0;
    DC.forEach(function (d) { d.hien = 1; d.chay = 0; d.so.hidden = true; });
    hang.nhom[0].forEach(function (i) { NG[i].x = choDung(i); DC[i].chay = 1; hienSo(i, 1, false); });
    var conLai = hang.nhom.slice(1);
    if (!hoatCanh || !G) {
      conLai.forEach(function (g) { g.forEach(function (i) { NG[i].x = choDung(i); DC[i].chay = 1; hienSo(i, hang.hang[i], false); }); });
      if (xong) xong();
      return;
    }
    var con = 0;
    conLai.forEach(function (g) { con += g.length; });
    var het = function () {
      am.ken(); am.lapLanh();
      SK.phaoGiay(null, null, 200);
      DC.forEach(function (d, i) { SK.lapLanh(d.x, DG.chan[i] - d.h, 16); });
      hen(2.8, function () { if (xong) xong(); });
    };
    if (!con) { hen(0.6, het); return; }
    conLai.forEach(function (g, k) {
      hen(0.4 + k * 1.5, function () {
        g.forEach(function (i) {
          diToi(i, choDung(i), function () {
            hen(0.2, function () { thap(i, hang.hang[i], function () { if (--con === 0) hen(0.9, het); }); });
          });
        });
      });
    });
  };
  SK.toaDoDuoc = function (i) { return { x: DC[i].x, y: DG.chan[i] + 6 - DC[i].h }; };
})();
