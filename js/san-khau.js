/* Rước đuốc về trường: sân khấu trên màn hình TV (sân trường, đường đua, lửa, pháo giấy) */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var SK = RD.SanKhau = {};
  var W = 1920, H = 1080;
  var $ = function (s) { return document.querySelector(s); };
  var gs = function () { return window.gsap; };

  /* ---------- hình học: 4 đường thảm hội tụ về đài lửa, có phối cảnh ---------- */
  var LAN = { y0: 1046, y1: 800, yh: 560, s0: 0.5, xs: [270, 730, 1190, 1650], xe: [790, 905, 1241, 1356] };
  var TI = (LAN.y0 - LAN.yh) / (LAN.y1 - LAN.yh);
  function diem(i, f) {
    var z = 1 + Math.max(-0.05, f) * (TI - 1);
    var y = LAN.yh + (LAN.y0 - LAN.yh) / z;
    var t = (LAN.y0 - y) / (LAN.y0 - LAN.y1);
    return { x: LAN.xs[i] + t * (LAN.xe[i] - LAN.xs[i]), y: y, s: LAN.s0 / z };
  }
  SK.diem = diem;
  var DAI = { x: 1073, y: 772, s: 0.366, w: 608, h: 800, rimY: 30, rimX: [105, 502] };
  DAI.top = DAI.y - DAI.h * DAI.s;
  DAI.rim = DAI.top + DAI.rimY * DAI.s;
  DAI.x0 = DAI.x + (DAI.rimX[0] - DAI.w / 2) * DAI.s;
  DAI.x1 = DAI.x + (DAI.rimX[1] - DAI.w / 2) * DAI.s;

  // ma trận phối cảnh: phần tử w×h -> tứ giác p (TL, TR, BR, BL)
  function matranPhoiCanh(w, h, p) {
    var x0 = p[0][0], y0 = p[0][1], x1 = p[1][0], y1 = p[1][1], x2 = p[2][0], y2 = p[2][1], x3 = p[3][0], y3 = p[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    var a, b, c, d, e, f, g, hh;
    if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; g = 0; hh = 0; }
    else {
      var den = dx1 * dy2 - dx2 * dy1;
      g = (dx3 * dy2 - dx2 * dy3) / den; hh = (dx1 * dy3 - dx3 * dy1) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0;
      d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
    }
    return "matrix3d(" + [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1].join(",") + ")";
  }

  /* ---------- trạng thái ---------- */
  var NG = [];                         // 4 bạn cầm đuốc
  var CAM = { x: W / 2, y: H / 2, z: 1 };
  var P = [];                          // hạt lửa, pháo giấy
  var tex = {};
  var daiChay = 0;                     // 0..1 độ lớn lửa trên đài
  var fxCv, fx, fxTrenCv, fxTren, rFx = 1, tCu = 0, motes = [];
  var huongNhin = [1, 1, -1, -1];      // tổ 1–2 đi sang phải, tổ 3–4 đi sang trái

  function taoTex(size, stops) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var x = c.getContext("2d"), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }

  SK.khoiTao = function () {
    tex.lua = taoTex(64, [[0, "rgba(255,250,220,1)"], [0.25, "rgba(255,214,110,0.95)"], [0.55, "rgba(255,130,30,0.55)"], [1, "rgba(255,60,0,0)"]]);
    tex.do = taoTex(64, [[0, "rgba(255,200,120,0.9)"], [0.4, "rgba(240,90,20,0.5)"], [1, "rgba(160,20,0,0)"]]);
    tex.sang = taoTex(256, [[0, "rgba(255,226,150,0.85)"], [0.35, "rgba(255,170,60,0.35)"], [1, "rgba(255,120,20,0)"]]);
    tex.dom = taoTex(32, [[0, "rgba(255,255,230,1)"], [0.4, "rgba(255,220,140,0.8)"], [1, "rgba(255,160,40,0)"]]);
    tex.bui = taoTex(32, [[0, "rgba(255,248,220,0.9)"], [1, "rgba(255,240,200,0)"]]);
    fxCv = $("#fxCv");
    fx = fxCv.getContext("2d");
    fxTrenCv = $("#fxTren");
    fxTren = fxTrenCv.getContext("2d");
    datCoFx();
    // 4 bạn cầm đuốc
    var lop = $("#nguoi");
    lop.innerHTML = "";
    RD.TO.forEach(function (t, i) {
      var el = document.createElement("div");
      el.className = "sv";
      el.innerHTML = '<img alt="Bạn ' + t.ten + ' cầm đuốc" src="' + t.anh + '" width="' + t.w + '" height="' + t.h + '">' +
        '<div class="huy" style="--m:' + t.mau + ';--d:' + t.dam + '"><b>' + t.ten + '</b><span>0 bước</span></div>' +
        '<div class="nhan-dd" hidden>Đội danh dự</div>';
      lop.appendChild(el);
      var img = el.querySelector("img");
      img.style.left = (-t.w / 2) + "px";
      img.style.top = (-t.h) + "px";
      NG.push({ i: i, t: t, el: el, img: img, huy: el.querySelector(".huy"), huyChu: el.querySelector(".huy span"), dd: el.querySelector(".nhan-dd"), f: 0, bob: 0, tilt: 0, nhay: 0, rieng: null, di: 0, hien: 1, gio: 0 });
    });
    var dai = $("#dai");
    dai.style.width = DAI.w * DAI.s + "px";
    dai.style.left = (DAI.x - DAI.w * DAI.s / 2) + "px";
    dai.style.top = DAI.top + "px";
    dai.style.zIndex = String(Math.round(DAI.y));
    veTham();
    // hai tấm băng rôn trên tường bên trái
    var b1 = $("#bangTuong1"), b2 = $("#bangTuong2");
    b1.style.transform = matranPhoiCanh(560, 228, [[178, 333], [455, 420], [452, 500], [173, 447]]);
    b2.style.transform = matranPhoiCanh(250, 676, [[17, 2], [142, 37], [139, 373], [14, 338]]);
    for (var m = 0; m < 14; m++) motes.push(moteMoi(true));
    window.addEventListener("resize", SK.vuaManHinh);
    SK.vuaManHinh();
    requestAnimationFrame(khung);
  };
  function datCoFx() {
    var k = SK.k || 1, dpr = window.devicePixelRatio || 1;
    rFx = Math.max(0.5, Math.min(1, k * dpr));
    fxCv.width = Math.round(W * rFx);
    fxCv.height = Math.round(H * rFx);
    fxTrenCv.width = Math.round(W * rFx);
    fxTrenCv.height = Math.round(H * rFx);
  }
  SK.vuaManHinh = function () {
    var k = Math.min(window.innerWidth / W, window.innerHeight / H);
    SK.k = k;
    var w = $("#world");
    w.style.transform = "translate(-50%,-50%) scale(" + k + ")";
    if (fxCv) datCoFx();
  };

  /* ---------- vẽ 4 đường thảm ---------- */
  function veTham() {
    var c = $("#thamCv"), x = c.getContext("2d");
    x.clearRect(0, 0, W, H);
    RD.TO.forEach(function (t, i) {
      var N = 60, trai = [], phai = [];
      for (var k = 0; k <= N; k++) {
        var f = k / N, p = diem(i, f), q = diem(i, Math.min(1, f + 0.01)), pre = diem(i, Math.max(0, f - 0.01));
        var dx = q.x - pre.x, dy = q.y - pre.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        var hw = 66 * p.s / LAN.s0;
        trai.push([p.x + nx * hw, p.y + ny * hw]);
        phai.push([p.x - nx * hw, p.y - ny * hw]);
      }
      var poly = function () {
        x.beginPath();
        x.moveTo(trai[0][0], trai[0][1]);
        trai.forEach(function (p) { x.lineTo(p[0], p[1]); });
        for (var k = phai.length - 1; k >= 0; k--) x.lineTo(phai[k][0], phai[k][1]);
        x.closePath();
      };
      // thân thảm
      x.save();
      poly();
      var g = x.createLinearGradient(0, LAN.y0, 0, LAN.y1);
      g.addColorStop(0, hexA(t.mau, 0.62)); g.addColorStop(1, hexA(t.mau, 0.42));
      x.fillStyle = g; x.fill();
      x.clip();
      // chặng nước rút: sọc vàng mờ
      var a = diem(i, 4 / 6);
      x.globalAlpha = 0.22; x.strokeStyle = "#ffe08a"; x.lineWidth = 7;
      for (var sx = -400; sx < W; sx += 26) { x.beginPath(); x.moveTo(sx, a.y + 4); x.lineTo(sx + 160, LAN.y1 - 60); x.stroke(); }
      x.globalAlpha = 1;
      x.restore();
      // viền vàng hai bên
      x.lineJoin = "round";
      [trai, phai].forEach(function (side) {
        x.beginPath();
        side.forEach(function (p, k) { if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); });
        x.strokeStyle = "rgba(255,214,120,0.85)"; x.lineWidth = 3.2; x.stroke();
      });
      // vạch mốc sau mỗi câu
      [1, 2, 3, 4, 6].forEach(function (k) {
        var f = k / 6, p = diem(i, f), q = diem(i, Math.min(1, f + 0.01)), pre = diem(i, f - 0.01);
        var dx = q.x - pre.x, dy = q.y - pre.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        var hw = 66 * p.s / LAN.s0;
        x.beginPath();
        x.moveTo(p.x + nx * hw, p.y + ny * hw);
        x.lineTo(p.x - nx * hw, p.y - ny * hw);
        x.strokeStyle = k === 6 ? "rgba(255,226,120,0.95)" : "rgba(255,255,255,0.75)";
        x.lineWidth = (k === 6 ? 6 : 3) * p.s / LAN.s0 + 1;
        x.stroke();
      });
    });
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  SK.hexA = hexA;

  /* ---------- vòng vẽ mỗi khung hình ---------- */
  function viTriNguoi(n) {
    if (n.rieng) return n.rieng;
    return diem(n.i, n.f);
  }
  function dauDuoc(n, p) {
    var t = n.t, quay = huongNhin[n.i] * t.quay, s = p.s * (n.to || 1);
    var tx = quay > 0 ? t.dau[0] : t.w - t.dau[0];
    var dx = (tx - t.w / 2) * s, dy = (t.dau[1] - t.h) * s;
    var a = n.tilt * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    return { x: p.x + dx * ca - dy * sa, y: p.y + n.bob - n.nhay + dx * sa + dy * ca, s: s };
  }
  SK.dauDuoc = function (i) { var n = NG[i]; return dauDuoc(n, viTriNguoi(n)); };
  function capNhatNguoi(now) {
    NG.forEach(function (n) {
      var p = viTriNguoi(n), t = n.t, quay = huongNhin[n.i] * t.quay, s = p.s * (n.to || 1);
      var tho = Math.sin(now / 900 + n.i * 1.7) * 2;
      var buoc = n.di ? Math.sin(now / 1000 * Math.PI * 2 * 2.4 + n.i) : 0;
      n.bob = n.di ? -Math.abs(buoc) * 9 : tho;
      n.tilt = n.di ? buoc * 2.6 : 0;
      n.el.style.transform = "translate(" + p.x.toFixed(1) + "px," + (p.y + n.bob - n.nhay).toFixed(1) + "px)";
      n.el.style.zIndex = String(Math.round(p.y));
      n.el.style.opacity = n.hien;
      n.img.style.transform = "rotate(" + n.tilt.toFixed(2) + "deg) scale(" + (s * quay).toFixed(4) + "," + s.toFixed(4) + ")";
      n.huy.style.transform = "translate(-50%," + (-(t.h * s) - 18 - (n.gio ? 0 : 0)).toFixed(1) + "px) translateY(-100%)";
      n.dd.style.transform = "translate(-50%, 14px)";
    });
  }
  function moteMoi(dau) {
    return { x: 120 + Math.random() * 1680, y: dau ? 640 + Math.random() * 420 : 1080 + Math.random() * 40, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 10, s: 6 + Math.random() * 12, a: 0.12 + Math.random() * 0.2, ph: Math.random() * 6 };
  }
  function khung(now) {
    var dt = Math.min(0.05, tCu ? (now - tCu) / 1000 : 0.016);
    tCu = now;
    capNhatNguoi(now);
    // camera
    var z = CAM.z, tx = W / 2 - CAM.x * z, ty = H / 2 - CAM.y * z;
    tx = Math.min(0, Math.max(W - W * z, tx));
    ty = Math.min(0, Math.max(H - H * z, ty));
    $("#cam").style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + z.toFixed(4) + ")";
    phatHat(dt, now);
    veHat(dt, now);
    requestAnimationFrame(khung);
  }

  /* ---------- hạt: lửa đuốc, lửa đài, tàn lửa, pháo giấy ---------- */
  function phatHat(dt, now) {
    if (SK.anFx) return;
    NG.forEach(function (n) {
      if (n.hien < 0.5) return;
      var d = dauDuoc(n, viTriNguoi(n)), k = d.s / 0.5;
      n.duDuoc = (n.duDuoc || 0) + dt * 22;
      while (n.duDuoc > 1) {
        n.duDuoc -= 1;
        P.push({ k: "lua", x: d.x + (Math.random() - 0.5) * 8 * k, y: d.y + 4 * k, vx: (Math.random() - 0.5) * 18 * k, vy: (-70 - Math.random() * 60) * k, l: 0, m: 0.35 + Math.random() * 0.3, s: (12 + Math.random() * 10) * k });
      }
    });
    if (daiChay > 0.01) {
      var rate = 170 * daiChay, w = (DAI.x1 - DAI.x0) - 26;
      SK._duDai = (SK._duDai || 0) + dt * rate;
      while (SK._duDai > 1) {
        SK._duDai -= 1;
        var u = Math.random(), xx = DAI.x0 + 13 + u * w, giua = 1 - Math.abs(u - 0.5) * 2;
        P.push({ k: "lua", x: xx, y: DAI.rim + 2, vx: (0.5 - u) * 40 + (Math.random() - 0.5) * 20, vy: -(120 + Math.random() * 150) * (0.6 + 0.6 * giua) * (0.7 + 0.3 * daiChay), l: 0, m: 0.55 + Math.random() * 0.55, s: (26 + Math.random() * 30) * (0.7 + 0.5 * giua) });
      }
      SK._duTan = (SK._duTan || 0) + dt * 7 * daiChay;
      while (SK._duTan > 1) {
        SK._duTan -= 1;
        P.push({ k: "tan", x: DAI.x0 + 20 + Math.random() * w, y: DAI.rim - 20, vx: (Math.random() - 0.5) * 50, vy: -90 - Math.random() * 110, l: 0, m: 1.4 + Math.random() * 1.2, s: 3 + Math.random() * 3 });
      }
    }
  }
  function veHat(dt, now) {
    var x = fx, coTren = false;
    x.setTransform(rFx, 0, 0, rFx, 0, 0);
    x.clearRect(0, 0, W, H);
    fxTren.setTransform(rFx, 0, 0, rFx, 0, 0);
    if (SK._trenBan) { fxTren.clearRect(0, 0, W, H); SK._trenBan = false; }
    // bụi nắng
    x.globalCompositeOperation = "lighter";
    motes.forEach(function (m, i) {
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.y < 560) motes[i] = moteMoi(false);
      x.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(now / 700 + m.ph));
      x.drawImage(tex.bui, m.x - m.s, m.y - m.s, m.s * 2, m.s * 2);
    });
    // quầng sáng quanh đuốc
    if (!SK.anFx) NG.forEach(function (n) {
      if (n.hien < 0.5) return;
      var d = dauDuoc(n, viTriNguoi(n)), k = d.s / 0.5, r = (62 + Math.sin(now / 90 + n.i * 3) * 6) * k;
      x.globalAlpha = 0.42;
      x.drawImage(tex.sang, d.x - r, d.y - r * 0.9, r * 2, r * 2);
    });
    if (daiChay > 0.01) {
      var r = (300 + Math.sin(now / 120) * 18 + Math.sin(now / 47) * 8) * (0.4 + 0.6 * daiChay);
      x.globalAlpha = 0.62 * daiChay;
      x.drawImage(tex.sang, DAI.x - r, DAI.rim - 70 - r, r * 2, r * 2);
    }
    // hạt
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
      } else if (p.k === "cau") {        // quả cầu lửa bay từ đuốc lên đài
        var t = Math.min(1, p.l / p.m), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, it = 1 - e;
        var cx = it * it * p.x0 + 2 * it * e * p.cx + e * e * p.x1, cy = it * it * p.y0 + 2 * it * e * p.cy + e * e * p.y1;
        p.x = cx; p.y = cy;
        for (var k = 0; k < 4; k++) P.push({ k: "lua", x: cx + (Math.random() - 0.5) * 10, y: cy + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, l: 0, m: 0.35 + Math.random() * 0.25, s: 22 + Math.random() * 16 });
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = 1;
        x.drawImage(tex.sang, cx - 70, cy - 70, 140, 140);
        x.drawImage(tex.lua, cx - 26, cy - 26, 52, 52);
        if (t >= 1) { P.splice(i, 1); if (p.toi) p.toi(); continue; }   // tới miệng đài: bùng lửa
      } else if (p.k === "giay") {        // pháo giấy
        p.vy += 260 * dt; p.vx *= 0.99; p.vy = Math.min(p.vy, 240);
        p.x += (p.vx + Math.sin(now / 300 + p.ph) * 40) * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        x.globalCompositeOperation = "source-over";
        x.globalAlpha = u > 0.8 ? (1 - u) * 5 : 1;
        x.save();
        x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(now / 160 + p.ph));
        x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        x.restore();
      } else if (p.k === "sao") {         // tia lấp lánh
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
        x.globalCompositeOperation = "lighter";
        x.globalAlpha = 1 - u;
        x.drawImage(tex.dom, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
    }
    fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
    fxTren.globalAlpha = 1; fxTren.globalCompositeOperation = "source-over";
    if (coTren) SK._trenBan = true;
  }
  // tren: vẽ trên cùng (phủ cả màn báo tường), không theo camera
  SK.phaoGiay = function (x0, y0, n, rong, tren) {
    var mau = ["#e94b3c", "#f6c445", "#2f9a58", "#2f6fd6", "#8b52cc", "#ff8fb1", "#ffffff", "#e9861c"];
    n = n || 160;
    var tuTren = x0 == null;             // không có điểm bắn: rơi từ mép trên màn hình
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

  /* ---------- camera ---------- */
  SK.camera = function (x, y, z, giay) {
    var G = gs();
    if (G && giay) G.to(CAM, { x: x, y: y, z: z, duration: giay, ease: "power2.inOut", overwrite: true });
    else { if (G) G.killTweensOf(CAM); CAM.x = x; CAM.y = y; CAM.z = z; }
  };

  /* ---------- đặt vị trí, huy hiệu ---------- */
  SK.datViTri = function (viTri) {
    NG.forEach(function (n, i) {
      var G = gs();
      if (G) G.killTweensOf(n);
      n.f = viTri[i] || 0; n.di = 0; n.nhay = 0; n.rieng = null; n.to = 1; n.hien = 1;
      n.dd.hidden = true;
    });
  };
  SK.chuHuy = function (i, buoc, toiDa) {
    NG[i].huyChu.textContent = toiDa ? buoc + " / " + toiDa + " bước" : buoc + " bước";
  };
  SK.hienHuy = function (on) { NG.forEach(function (n) { n.huy.hidden = !on; }); };

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

  /* ---------- công bố một câu: trống dồn, từng tổ tiến lên (ít bước trước, nhiều bước sau) ---------- */
  SK.congBo = function (q, truoc, sau, xong) {
    var G = gs(), A = RD.AmThanh;
    var gain = [0, 1, 2, 3].map(function (t) { return sau[t].cau[q] ? sau[t].cau[q].buoc : 0; });
    var thuTu = [0, 1, 2, 3].sort(function (a, b) { return (sau[a].viTri - truoc[a].viTri) - (sau[b].viTri - truoc[b].viTri) || gain[a] - gain[b] || a - b; });
    SK.datViTri(truoc.map(function (r) { return r.viTri; }));
    NG.forEach(function (n, i) { SK.chuHuy(i, truoc[i].buoc, truoc[i].toiDa); });
    if (!G) { SK.datViTri(sau.map(function (r) { return r.viTri; })); NG.forEach(function (n, i) { SK.chuHuy(i, sau[i].buoc, sau[i].toiDa); }); if (xong) xong(); return; }
    var tl = G.timeline({ onComplete: function () { if (xong) xong(); } });
    tl.addLabel("bd", 0.5);
    thuTu.forEach(function (i, k) {
      var n = NG[i], tu = truoc[i].viTri, den = sau[i].viTri, dai = Math.max(0.6, Math.min(2.4, 0.7 + (den - tu) * 9));
      var at = 0.5 + k * 1.9;
      tl.call(function () {
        A.trongDon(0.55);
        n.huy.classList.add("soi");
      }, null, at);
      tl.call(function () {
        A.trong(1);
        var p = viTriNguoi(n), top = p.y - n.t.h * p.s - 150;   // phía trên huy hiệu tên tổ
        bayChu("+" + gain[i] + " bước", p.x, top, "", 1.3);
        SK.chuHuy(i, sau[i].buoc, sau[i].toiDa);
        n.di = den > tu + 1e-6 ? 1 : 0;
      }, null, at + 0.6);
      tl.to(n, { f: den, duration: dai, ease: "power1.inOut", onUpdate: function () {
        var now = performance.now();
        if (n.di && (!n._b || now - n._b > 210)) { n._b = now; A.buoc(); }
      }, onComplete: function () {
        n.di = 0;
        n.huy.classList.remove("soi");
        if (sau[i].cau[q] && sau[i].cau[q].tron) {
          var p = viTriNguoi(n);
          G.to(n, { nhay: 46, duration: 0.22, yoyo: true, repeat: 3, ease: "power2.out" });
          bayChu("Bứt phá!", p.x, p.y - n.t.h * p.s - 215, "but-pha", 1.4);
          var d = dauDuoc(n, p);
          SK.lapLanh(d.x, d.y, 30);
          A.lapLanh();
        }
      } }, at + 0.6);
    });
    return tl;
  };

  /* ---------- về đích: tổ thắng bước lên trước đài lửa, 3 tổ còn lại làm đội danh dự ---------- */
  function choDung(i, so, tong) {
    // chỗ đứng của tổ thắng ngay trước bậc đài; nhiều tổ bằng nhau thì đứng cạnh nhau
    var lech = tong > 1 ? (so - (tong - 1) / 2) * 120 : 0;
    var y = 838, zz = (LAN.y0 - LAN.yh) / (y - LAN.yh);
    return { x: DAI.x + lech, y: y, s: LAN.s0 / zz * 1.06 };
  }
  SK.vaoDich = function (nhat, sau, ngay) {
    var G = gs();
    SK.datViTri(sau.map(function (r) { return r.viTri; }));
    SK.hienHuy(false);                   // bỏ huy hiệu số bước: chỉ còn nhãn tên tổ dưới chân
    NG.forEach(function (n, i) {
      var thang = nhat.indexOf(i) >= 0;
      n.dd.hidden = false;
      n.dd.classList.toggle("thang", thang);
      n.dd.textContent = n.t.ten + (thang ? " · châm lửa" : " · đội danh dự");
      if (thang) {
        var dich = choDung(i, nhat.indexOf(i), nhat.length), p0 = viTriNguoi(n);
        if (ngay || !G) { n.rieng = dich; return; }
        n.rieng = { x: p0.x, y: p0.y, s: p0.s };
        n.di = 1;
        G.to(n.rieng, { x: dich.x, y: dich.y, s: dich.s, duration: 1.8, delay: 0.6, ease: "power1.inOut", onComplete: function () { n.di = 0; } });
      }
    });
    SK.camera(DAI.x, 640, 1.55, ngay ? 0 : 2.2);
  };
  // đếm 3-2-1 rồi châm lửa; cauLua: quả cầu lửa bay từ đuốc tổ thắng lên đài
  SK.chamLua = function (nhat, xong) {
    var G = gs(), A = RD.AmThanh, dem = $("#dem"), so = dem.querySelector("span");
    if (!G) { SK.thapSang(true); if (xong) xong(); return null; }
    var tl = G.timeline();
    SK._tlCham = tl;
    [3, 2, 1].forEach(function (s, k) {
      tl.call(function () {
        dem.hidden = false; so.textContent = s; dem.className = "";
        A.trong(0.8 + k * 0.1);
        G.fromTo(so, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
      }, null, k * 1.0);
    });
    tl.call(function () {
      so.textContent = "Thắp sáng!"; dem.className = "chu";
      G.fromTo(so, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
      A.vut();
      NG.forEach(function (n, i) { if (nhat.indexOf(i) >= 0) G.to(n, { nhay: 26, duration: 0.25, yoyo: true, repeat: 1 }); });
      var toi = 0;
      nhat.forEach(function (i) {
        var d = SK.dauDuoc(i);
        P.push({ k: "cau", x0: d.x, y0: d.y, x1: DAI.x, y1: DAI.rim - 6, cx: (d.x + DAI.x) / 2 + (d.x < DAI.x ? -60 : 60), cy: Math.min(d.y, DAI.rim) - 230, l: 0, m: 1.0, x: d.x, y: d.y, toi: function () {
          toi++;
          if (toi === 1) SK.thapSang(false);
        } });
      });
    }, null, 3.0);
    tl.to(so, { opacity: 0, duration: 0.5 }, 5.2);
    tl.call(function () { dem.hidden = true; if (xong) xong(); }, null, 5.8);
    return tl;
  };
  SK.thapSang = function (ngay) {
    var G = gs(), A = RD.AmThanh;
    if (ngay || !G) { daiChay = 1; return; }
    A.bungLua();
    A.ken();
    A.lachTach(3);
    daiChay = 0.05;
    G.to(SK, { _dc: 1, duration: 1.2, ease: "power2.out", onUpdate: function () { daiChay = SK._dc; } });
    SK._dc = 0.05;
    SK.lapLanh(DAI.x, DAI.rim - 30, 60);
    SK.phaoGiay(DAI.x, DAI.rim - 40, 90, 120);
    // đội danh dự giơ cao đuốc
    NG.forEach(function (n) { if (!n.dd.hidden) G.to(n, { nhay: 14, duration: 0.3, yoyo: true, repeat: 3, delay: 0.3 + Math.random() * 0.3 }); });
    G.to(CAM, { z: 1.35, y: 600, duration: 2.5, ease: "power2.inOut", delay: 0.6 });
  };
  SK.tatLua = function () {
    var G = gs();
    if (G) G.killTweensOf(SK);
    daiChay = 0; SK._dc = 0;
    for (var i = P.length - 1; i >= 0; i--) if (P[i].k === "cau") P.splice(i, 1);   // quả cầu lửa đang bay
  };
  SK.daiDangChay = function () { return daiChay > 0.01; };
  SK.DAI = DAI;
})();
