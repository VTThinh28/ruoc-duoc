/* Xếp thiệp: mỗi nhóm một điện thoại (hoặc máy tính bảng) xếp 10 mảnh, tivi hiện 4 tấm thiệp cùng lúc.
   Tivi: mở trang không có tham số.  Điện thoại: quét mã QR trên tivi (?p=<mã phòng>&n=<nhóm>).
   Nối các máy: Firebase Realtime Database, nhánh ruoc-duoc/xep-thiep/<mã phòng>.
   KHÔNG đụng nhánh ruoc-duoc/lop-6-3 của trò Rước đuốc.
   ?thu=1: chỉ nối các thẻ mở trên cùng một máy (chạy thử, không gọi Firebase).
   Trang không hiện số đo hay diện tích nào: phần đó các em tự tính. */
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
  var HIT_GOC = 12, HIT_XA = 0.8, HIT_DINH = 0.5; // ngưỡng hít: lệch góc (độ), cách cạnh (cm), cách đỉnh (cm)
  var CHONG = 0.12;                             // lún vào nhau quá 0,12 cm thì coi là chồng

  /* ---------- bộ mảnh (cm). "nho" là bộ đang dùng, "to" là bộ to hơn đề xuất 12/11 lúc 16:30 (thầy chưa chốt) ---------- */
  var BO = {
    nho: [
      { loai: "thoi", a: 8, b: 4 }, { loai: "thoi", a: 4, b: 2 }, { loai: "thoi", a: 4, b: 2 },
      { loai: "thang", L: 8, l: 4, h: 3 }, { loai: "thang", L: 4, l: 2, h: 2 },
      { loai: "cn", w: 7, h: 2 }, { loai: "cn", w: 3, h: 3 }, { loai: "cn", w: 3, h: 3 },
      { loai: "bh", b: 4, h: 2, s: 1.5 }, { loai: "bh", b: 4, h: 2, s: 1.5 }
    ],
    to: [
      { loai: "thoi", a: 10, b: 5 }, { loai: "thoi", a: 5, b: 2 }, { loai: "thoi", a: 5, b: 2 },
      { loai: "thang", L: 10, l: 6, h: 4 }, { loai: "thang", L: 6, l: 4, h: 2 },
      { loai: "cn", w: 9, h: 2 }, { loai: "cn", w: 4, h: 4 }, { loai: "cn", w: 4, h: 4 },
      { loai: "bh", b: 5, h: 2, s: 1.5 }, { loai: "bh", b: 5, h: 2, s: 1.5 }
    ]
  };
  /* màu từng mảnh theo thiệp của nhóm (bộ màu gốc 8/11) */
  var MAU = {
    1: ["#d9463c", "#e9799d", "#e9799d", "#f6bfd0", "#f6bfd0", "#d9463c", "#fdfbf6", "#fdfbf6", "#5e9e4a", "#5e9e4a"],
    2: ["#ee8a3a", "#ee8a3a", "#ee8a3a", "#5aa7d8", "#5aa7d8", "#f6bfd0", "#f6efe0", "#f6efe0", "#f2bf3a", "#f2bf3a"],
    3: ["#fdfbf6", "#d9463c", "#f2bf3a", "#8b5a2b", "#b3322b", "#aab2bb", "#fdfbf6", "#d9463c", "#5aa7d8", "#5aa7d8"],
    4: ["#d9463c", "#b3322b", "#b3322b", "#8b5a2b", "#f2bf3a", "#f8dc7c", "#d9463c", "#d9463c", "#ee8a3a", "#ee8a3a"]
  };
  /* bố cục thiệp đã cắt 29 × 42 cm (lấy từ bản thiệp A3 12/11): dai = dải tiêu đề, dan = chỗ dán hình, viet = chỗ ghi lời chúc */
  var BOCUC = {
    dung: { W: 29, H: 42, dai: [14.5 - 7.9 * R2, 1.4 * R2, 14.5 + 7.9 * R2, 3.3 * R2], dan: [2, 5.3, 27, 31.1], ngan: ["ngang", 31.6], viet: [2.83, 32, 26.17, 40.3] },
    ngang: { W: 42, H: 29, dai: [16.1 - 8.35 * R2, 1.4 * R2, 16.1 + 8.35 * R2, 3.3 * R2], dan: [2, 5.3, 30.2, 27], ngan: ["doc", 30.75], viet: [31.3, 2, 40.1, 27.25] }
  };
  var NHOM = { 1: "dung", 2: "dung", 3: "ngang", 4: "ngang" };
  var DONG1 = "CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG";
  var DONG2 = "THCS PHAN TÂY HỒ · 14/12/1976 – 14/12/2026";

  /* ---------- hình học ---------- */
  function trongTam(p) {
    var a = 0, cx = 0, cy = 0, i, j, k;
    for (i = 0; i < p.length; i++) {
      j = (i + 1) % p.length; k = p[i][0] * p[j][1] - p[j][0] * p[i][1];
      a += k; cx += (p[i][0] + p[j][0]) * k; cy += (p[i][1] + p[j][1]) * k;
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function daGiac(m) {                           // đa giác của mảnh, gốc đặt ở trọng tâm
    var p;
    if (m.loai === "thoi") p = [[-m.a / 2, 0], [0, -m.b / 2], [m.a / 2, 0], [0, m.b / 2]];
    else if (m.loai === "thang") p = [[-m.l / 2, -m.h / 2], [m.l / 2, -m.h / 2], [m.L / 2, m.h / 2], [-m.L / 2, m.h / 2]];
    else if (m.loai === "cn") p = [[-m.w / 2, -m.h / 2], [m.w / 2, -m.h / 2], [m.w / 2, m.h / 2], [-m.w / 2, m.h / 2]];
    else p = [[0, 0], [m.b, 0], [m.b + m.s, m.h], [m.s, m.h]];
    var c = trongTam(p);
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
  function chuanGoc(r) { r = r % 360; if (r < 0) r += 360; return Math.round(r * 100) / 100; }
  function lechGoc(d) { d = ((d % 180) + 180) % 180; return d > 90 ? d - 180 : d; }   // về (−90, 90]
  function doLun(P, Q) {                          // hai đa giác lồi lún vào nhau bao nhiêu cm (≤ 0: không chạm)
    var nho = 1e9, cap = [P, Q], t, i, j, a, b, nx, ny, d, k, minP, maxP, minQ, maxQ, v;
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
  /* Hít: xoay và dời mảnh A cho một cạnh nằm sát một cạnh của mảnh khác; không có cạnh nào gần thì hít đỉnh vào đỉnh.
     A = {goc, st}; khac = [đa giác trên thiệp]. Sửa thẳng vào A.st, trả về true nếu có hít. */
  function hit(A, khac) {
    var pa = toaDo(A.goc, A.st), tot = null, i, j, k, a0, a1, b0, b1, B;
    for (i = 0; i < pa.length; i++) {
      a0 = pa[i]; a1 = pa[(i + 1) % pa.length];
      var gA = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) * 180 / Math.PI, la = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
      var ma = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2];
      for (j = 0; j < khac.length; j++) {
        B = khac[j];
        for (k = 0; k < B.length; k++) {
          b0 = B[k]; b1 = B[(k + 1) % B.length];
          var dx = b1[0] - b0[0], dy = b1[1] - b0[1], lb = Math.hypot(dx, dy); if (lb < 1e-6) continue;
          var d = lechGoc(gA - Math.atan2(dy, dx) * 180 / Math.PI);
          if (Math.abs(d) > HIT_GOC) continue;
          var ux = dx / lb, uy = dy / lb;
          var xa = (ma[0] - b0[0]) * (-uy) + (ma[1] - b0[1]) * ux;          // khoảng cách có dấu từ giữa cạnh a tới đường b
          if (Math.abs(xa) > HIT_XA) continue;
          var t0 = (a0[0] - b0[0]) * ux + (a0[1] - b0[1]) * uy, t1 = (a1[0] - b0[0]) * ux + (a1[1] - b0[1]) * uy;
          var phu = Math.min(Math.max(t0, t1), lb) - Math.max(Math.min(t0, t1), 0);
          if (phu < 0.3 * Math.min(la, lb)) continue;
          var cB = trongTam(B);
          var benA = (A.st.x - b0[0]) * (-uy) + (A.st.y - b0[1]) * ux, benB = (cB[0] - b0[0]) * (-uy) + (cB[1] - b0[1]) * ux;
          if (benA * benB > 0) continue;                                    // cùng phía với mảnh kia: sẽ chồng, bỏ
          var diem = Math.abs(xa) + Math.abs(d) * 0.03;
          if (!tot || diem < tot.diem) tot = { diem: diem, i: i, d: d, b0: b0, b1: b1, ux: ux, uy: uy, lb: lb };
        }
      }
    }
    if (tot) {
      A.st.r = chuanGoc(A.st.r - tot.d);
      pa = toaDo(A.goc, A.st); a0 = pa[tot.i]; a1 = pa[(tot.i + 1) % pa.length];
      var m2 = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2];
      var xa2 = (m2[0] - tot.b0[0]) * (-tot.uy) + (m2[1] - tot.b0[1]) * tot.ux;
      A.st.x -= -tot.uy * xa2; A.st.y -= tot.ux * xa2;
      a0 = [a0[0] + tot.uy * xa2, a0[1] - tot.ux * xa2]; a1 = [a1[0] + tot.uy * xa2, a1[1] - tot.ux * xa2];
      var truot = null;                                                      // trượt dọc cạnh cho đầu cạnh trùng nhau
      [a0, a1].forEach(function (a) {
        [tot.b0, tot.b1].forEach(function (b) {
          var dd = (b[0] - a[0]) * tot.ux + (b[1] - a[1]) * tot.uy;
          if (Math.abs(dd) <= HIT_XA && (truot === null || Math.abs(dd) < Math.abs(truot))) truot = dd;
        });
      });
      if (truot !== null) { A.st.x += tot.ux * truot; A.st.y += tot.uy * truot; }
      return true;
    }
    var gan = null;
    pa.forEach(function (a) {
      khac.forEach(function (B2) {
        B2.forEach(function (b) {
          var kc = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (kc <= HIT_DINH && (!gan || kc < gan.kc)) gan = { kc: kc, dx: b[0] - a[0], dy: b[1] - a[1] };
        });
      });
    });
    if (gan) { A.st.x += gan.dx; A.st.y += gan.dy; return true; }
    return false;
  }
  function giuTrong(goc, st, v) {                 // giữ cả mảnh nằm trong chỗ dán hình v = [x0, y0, x1, y1]
    var k = khung(toaDo(goc, st));
    if (k[0] < v[0]) st.x += v[0] - k[0]; else if (k[2] > v[2]) st.x -= k[2] - v[2];
    if (k[1] < v[1]) st.y += v[1] - k[1]; else if (k[3] > v[3]) st.y -= k[3] - v[3];
  }

  /* ---------- tiện ích ---------- */
  var NS = "http://www.w3.org/2000/svg";
  function S(ten, tt, cha) {
    var e = document.createElementNS(NS, ten), k;
    for (k in tt) if (tt[k] !== null && tt[k] !== undefined) e.setAttribute(k, tt[k]);
    if (cha) cha.appendChild(e);
    return e;
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
  function goi(st) { return [f2(st.x), f2(st.y), chuanGoc(st.r), st.f ? 1 : 0, st.t || 0].join("|"); }
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
  function datManh(g, goc, st) {                  // điện thoại: đặt ngay, không chuyển động
    g.setAttribute("transform", "translate(" + (st.x * U).toFixed(2) + " " + (st.y * U).toFixed(2) + ") rotate(" + st.r + ")");
    var p = diem(diemGoc(goc, st.f));
    g.children[0].setAttribute("points", p); g.children[1].setAttribute("points", p);
    if (g.children[2]) g.children[2].setAttribute("transform", "rotate(" + (-st.r) + ")");
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
    var bc = BOCUC[NHOM[k]], dan = bc.dan, mau = MAU[k];
    var bo = null, goc = [], manh = [], chon = null, keo = null, xoay2 = null, tro = {}, xong = false, T = null, guiCho = {}, guiLuc = {};
    var svg = $("dtBan"), lopManh = null, dem = 0, mayId = (function () {
      var v = null; try { v = sessionStorage.getItem("xt-may"); } catch (e) { v = null; }
      if (!v) { v = maNgauNhien(6); try { sessionStorage.setItem("xt-may", v); } catch (e) { /* bỏ qua */ } }
      return v;
    })();
    $("dtNhom").textContent = "Nhóm " + k;
    $("dtChinh").hidden = false;
    giuSang();

    svg.setAttribute("viewBox", [dan[0] * U, dan[1] * U, (dan[2] - dan[0]) * U, (dan[3] - dan[1]) * U].join(" "));
    S("rect", { "class": "giay", x: dan[0] * U, y: dan[1] * U, width: (dan[2] - dan[0]) * U, height: (dan[3] - dan[1]) * U }, svg);
    var nhan = S("text", { "class": "nhan-dan", x: (dan[0] + dan[2]) / 2 * U, y: (dan[1] + dan[3]) / 2 * U, "text-anchor": "middle" }, svg);
    nhan.textContent = "Chỗ dán hình";
    lopManh = S("g", {}, svg);

    function coBan() {                            // chỉnh cỡ bàn xếp cho vừa màn hình
      var o = $("dtKhungBan"), w = o.clientWidth, h = o.clientHeight, tl = (dan[2] - dan[0]) / (dan[3] - dan[1]);
      var bw = Math.min(w, h * tl), bh = bw / tl;
      svg.style.width = Math.floor(bw) + "px"; svg.style.height = Math.floor(bh) + "px";
    }
    window.addEventListener("resize", coBan);
    window.addEventListener("orientationchange", function () { setTimeout(coBan, 250); });

    function datBo(ten) {
      if (!BO[ten]) ten = "nho";
      if (bo === ten) return;
      bo = ten; goc = BO[ten].map(daGiac);
      lopManh.textContent = ""; $("dtKhay").textContent = "";
      var rongNhat = 0;
      goc.forEach(function (g) { var kh0 = khung(g); rongNhat = Math.max(rongNhat, kh0[2] - kh0[0]); });
      var tiLe = (window.innerWidth >= 700 && window.innerHeight >= 700 ? 84 : 66) / rongNhat;   // px cho 1 cm trong khay
      manh = goc.map(function (g, i) {
        var m = { so: i + 1, on: false, st: { x: 0, y: 0, r: 0, f: 0, t: 0 }, g: veManh(lopManh, g, mau[i], i + 1, true), nut: null };
        m.g.style.display = "none";
        var nut = H("button", "khay-nut", null, $("dtKhay")); nut.setAttribute("aria-label", "Lấy mảnh " + (i + 1));
        var kh = khung(g), le = 0.2, sv = S("svg", { viewBox: [(kh[0] - le) * U, (kh[1] - le) * U, (kh[2] - kh[0] + 2 * le) * U, (kh[3] - kh[1] + 2 * le) * U].join(" ") }, nut);
        sv.style.width = ((kh[2] - kh[0] + 2 * le) * tiLe).toFixed(1) + "px"; sv.style.height = ((kh[3] - kh[1] + 2 * le) * tiLe).toFixed(1) + "px";
        S("polygon", { "class": "than", points: diem(g), fill: mau[i] }, sv);
        H("span", "khay-so", i + 1, nut);
        nut.onclick = function () { layRa(i); };
        m.nut = nut;
        return m;
      });
      chon = null; capNhat();
    }
    function ve(m) {
      m.g.style.display = m.on ? "" : "none";
      m.nut.classList.toggle("da-lay", m.on);
      if (m.on) datManh(m.g, goc[m.so - 1], m.st);
    }
    function leTren(m) { m.st.t = Date.now(); lopManh.appendChild(m.g); }
    function xepLop() {
      manh.slice().sort(function (a, b) { return a.st.t - b.st.t; }).forEach(function (m) { lopManh.appendChild(m.g); });
    }
    function gui(m, ngay) {                       // gửi vị trí mảnh lên, tối đa khoảng 12 lần một giây
      if (!T) return;
      var p = "n" + k + "/m/p" + m.so;
      function that() { guiLuc[m.so] = Date.now(); guiCho[m.so] = null; if (m.on) T.set(p, goi(m.st)); else T.remove(p); }
      if (ngay) { clearTimeout(guiCho[m.so]); that(); return; }
      if (guiCho[m.so]) return;
      var cho = 80 - (Date.now() - (guiLuc[m.so] || 0));
      if (cho <= 0) that(); else guiCho[m.so] = setTimeout(that, cho);
    }
    function dsChong() {
      var ps = manh.map(function (m) { return m.on ? toaDo(goc[m.so - 1], m.st) : null; }), c = {}, i, j;
      for (i = 0; i < ps.length; i++) for (j = i + 1; j < ps.length; j++) if (ps[i] && ps[j] && doLun(ps[i], ps[j]) > CHONG) { c[i] = 1; c[j] = 1; }
      return c;
    }
    function capNhat() {                          // viền chọn, viền chồng, dòng nhắc, các nút
      var c = dsChong(), tren = 0, coChong = false;
      manh.forEach(function (m, i) {
        if (m.on) tren++;
        if (c[i]) coChong = true;
        m.g.classList.toggle("chon", chon === i && !xong);
        m.g.classList.toggle("chong", !!c[i]);
      });
      var du = tren === manh.length && manh.length > 0;
      var nhac = $("dtNhac");
      nhac.className = "nhac";
      if (xong) { nhac.textContent = "Đã chốt hình. Cả nhóm dán giấy theo hình này nhé."; nhac.classList.add("tot"); }
      else if (coChong) { nhac.textContent = "Có mảnh đang chồng lên nhau (viền đỏ)."; nhac.classList.add("xau"); }
      else if (!tren) nhac.textContent = "Chạm một mảnh trong khay để lấy ra.";
      else if (!du) nhac.textContent = "Còn " + (manh.length - tren) + " mảnh trong khay. Kéo để xếp, chạm thêm lần nữa để xoay.";
      else { nhac.textContent = "Đủ " + manh.length + " mảnh, không mảnh nào chồng. Bấm Xong được rồi."; nhac.classList.add("tot"); }
      var cm = chon !== null && manh[chon].on && !xong;
      $("dtTrai").disabled = $("dtPhai").disabled = $("dtCat").disabled = !cm;
      $("dtLat").disabled = !(cm && BO[bo][chon].loai === "bh");
      $("dtXong").disabled = !xong && !(du && !coChong);
      $("dtXong").textContent = xong ? "Sửa tiếp" : "Xong";
      $("dtKhayTrong").hidden = tren < manh.length;
      $("dtChinh").classList.toggle("khoa", xong);
      nhan.style.display = tren ? "none" : "";
      dem = tren;
    }
    function khacCua(i) { return manh.filter(function (m, j) { return j !== i && m.on; }).map(function (m) { return toaDo(goc[m.so - 1], m.st); }); }
    function tha(i) {                             // thả mảnh: hít, giữ trong chỗ dán, gửi
      var m = manh[i];
      hit({ goc: goc[i], st: m.st }, khacCua(i));
      giuTrong(goc[i], m.st, dan);
      ve(m); gui(m, true); capNhat();
    }
    function layRa(i) {
      if (xong) return;
      var m = manh[i], cx = (dan[0] + dan[2]) / 2, cy = (dan[1] + dan[3]) / 2, lan = 0, khac = khacCua(i);
      m.on = true; m.st.r = 0; m.st.f = 0; m.st.x = cx; m.st.y = cy;
      // tìm chỗ trống gần giữa, đi theo đường xoắn ốc
      while (lan < 60 && khac.some(function (p) { return doLun(p, toaDo(goc[i], m.st)) > CHONG; })) {
        lan++; var a = lan * 0.9, r = 1.2 + lan * 0.35;
        m.st.x = cx + Math.cos(a) * r; m.st.y = cy + Math.sin(a) * r * 0.9; giuTrong(goc[i], m.st, dan);
      }
      giuTrong(goc[i], m.st, dan);
      leTren(m); chon = i; ve(m); gui(m, true); capNhat();
    }
    function xoay(d) {
      if (chon === null || xong) return;
      var m = manh[chon];
      m.st.r = chuanGoc(Math.round((m.st.r + d) / BUOC_XOAY) * BUOC_XOAY);
      giuTrong(goc[chon], m.st, dan); leTren(m); ve(m); gui(m, true); capNhat();
    }
    $("dtTrai").onclick = function () { xoay(-BUOC_XOAY); };
    $("dtPhai").onclick = function () { xoay(BUOC_XOAY); };
    $("dtLat").onclick = function () {
      if (chon === null || xong) return;
      var m = manh[chon]; m.st.f = m.st.f ? 0 : 1; giuTrong(goc[chon], m.st, dan); leTren(m); ve(m); gui(m, true); capNhat();
    };
    $("dtCat").onclick = function () {
      if (chon === null || xong) return;
      var m = manh[chon]; m.on = false; chon = null; ve(m); gui(m, true); capNhat();
    };
    $("dtXong").onclick = function () {
      if (!T) return;
      xong = !xong; chon = null;
      if (xong) T.set("n" + k + "/xong", 1); else T.remove("n" + k + "/xong");
      capNhat();
    };
    var hoiLai = 0;
    $("dtLai").onclick = function () {
      var b = $("dtLai");
      if (Date.now() - hoiLai > 3000) { hoiLai = Date.now(); b.textContent = "Bấm lần nữa để xếp lại"; b.classList.add("hoi"); setTimeout(function () { b.textContent = "Xếp lại"; b.classList.remove("hoi"); }, 3000); return; }
      hoiLai = 0; b.textContent = "Xếp lại"; b.classList.remove("hoi");
      manh.forEach(function (m) { m.on = false; ve(m); });
      chon = null; xong = false;
      if (T) { T.remove("n" + k + "/m"); T.remove("n" + k + "/xong"); }
      capNhat();
    };

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
      if (xong) return;
      tro[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
      var n = Object.keys(tro).length;
      if (n === 2 && chon !== null && manh[chon].on) {      // ngón thứ hai: xoay mảnh đang chọn
        keo = null; xoay2 = { g0: gocHaiNgon().g, r0: manh[chon].st.r };
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
      if (!keo.dong && Math.hypot(e.clientX - keo.px, e.clientY - keo.py) > 6) keo.dong = true;
      if (!keo.dong) return;
      var p = cm(e), m = manh[keo.i];
      m.st.x = keo.x0 + p[0] - keo.p0[0]; m.st.y = keo.y0 + p[1] - keo.p0[1];
      giuTrong(goc[keo.i], m.st, dan); ve(m); gui(m);
    });
    function nha(e) {
      if (!tro[e.pointerId]) return;
      delete tro[e.pointerId];
      if (xoay2) {
        if (Object.keys(tro).length < 2) { xoay2 = null; if (chon !== null) tha(chon); }
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

    /* --- nối --- */
    function trangThai(kieu) {
      var e = $("dtNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối với tivi" : kieu === "cungmay" ? "Chạy thử trên một máy" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }
    datBo("nho"); coBan();
    noi(phong, ts.thu, trangThai).then(function (t) {
      T = t;
      T.coMat("n" + k + "/co/" + mayId);
      T.on("cfg", function (c) { datBo(c && c.bo || "nho"); });
      T.on("n" + k + "/m", function (o) {          // vị trí từ máy khác cùng nhóm, hoặc tivi bấm xếp lại
        o = o || {};
        manh.forEach(function (m, i) {
          if ((keo && keo.i === i) || (xoay2 && chon === i) || guiCho[m.so]) return;
          var st = mo(o["p" + m.so]);
          if (st) { m.on = true; m.st = st; } else m.on = false;
          ve(m);
        });
        if (chon !== null && !manh[chon].on) chon = null;
        xepLop(); capNhat();
      });
      T.on("n" + k + "/xong", function (v) { xong = !!v; capNhat(); });
    });
  }

  /* =====================================================================
     TIVI
     ===================================================================== */
  function veThiep(svg, k) {                      // tấm thiệp trống: khung, dải tiêu đề, vạch ngăn, dòng lời chúc
    var bc = BOCUC[NHOM[k]], W = bc.W * U, Hh = bc.H * U, d = bc.dai, v = bc.viet, i, y;
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hh);
    S("rect", { "class": "giay", x: 0, y: 0, width: W, height: Hh }, svg);
    S("rect", { "class": "vien", x: 10, y: 10, width: W - 20, height: Hh - 20 }, svg);
    S("rect", { "class": "vien manh-vien", x: 13.5, y: 13.5, width: W - 27, height: Hh - 27 }, svg);
    S("rect", { "class": "dai", x: d[0] * U, y: d[1] * U, width: (d[2] - d[0]) * U, height: (d[3] - d[1]) * U }, svg);
    S("rect", { "class": "dai-trong", x: d[0] * U + 1.6, y: d[1] * U + 1.6, width: (d[2] - d[0]) * U - 3.2, height: (d[3] - d[1]) * U - 3.2 }, svg);
    var cx = (d[0] + d[2]) / 2 * U, t1 = S("text", { "class": "dong1", x: cx, y: d[1] * U + 12.2, "text-anchor": "middle" }, svg), t2 = S("text", { "class": "dong2", x: cx, y: d[1] * U + 20.6, "text-anchor": "middle" }, svg);
    t1.textContent = DONG1; t2.textContent = DONG2;
    if (bc.ngan[0] === "ngang") { y = bc.ngan[1] * U; S("line", { "class": "ngan", x1: 13.5, y1: y, x2: W - 13.5, y2: y }, svg); thoiNho(svg, W / 2, y); }
    else { var x = bc.ngan[1] * U; S("line", { "class": "ngan", x1: x, y1: 13.5, x2: x, y2: Hh - 13.5 }, svg); thoiNho(svg, x, Hh / 2); }
    var nh = S("text", { "class": "loi-chuc", x: v[0] * U + 3, y: v[1] * U + 10 }, svg); nh.textContent = "Lời chúc của nhóm " + k;
    for (i = 0, y = v[1] * U + 20.5; y <= v[3] * U - 2; i++, y += 14.85) S("line", { "class": "cham-dong", x1: v[0] * U + 3, y1: y, x2: v[2] * U - 3, y2: y }, svg);
    return S("g", { "class": "lop-manh" }, svg);
  }
  function thoiNho(svg, x, y) {
    S("polygon", { fill: "#fffdf8", points: [[x, y - 5], [x + 5, y], [x, y + 5], [x - 5, y]].join(" ") }, svg);
    S("polygon", { fill: "#b89a74", points: [[x, y - 3.4], [x + 3.4, y], [x, y + 3.4], [x - 3.4, y]].join(" ") }, svg);
  }

  function chayTivi(ts) {
    document.body.className = "tv";
    $("tv").hidden = false;
    var phong = ts.p, thu = ts.thu, T = null, bo = "nho", goc = BO.nho.map(daGiac), khungNhom = {}, duLieu = {}, xem = "vao", lon = 0;
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
      var o = $("khung" + k), svg = o.querySelector("svg.thiep");
      khungNhom[k] = { o: o, lop: veThiep(svg, k), g: {}, goc: {}, tt: o.querySelector(".tt"), hien: {} };
      o.querySelector(".the").onclick = function () { phong_to(k); };
      svg.onclick = function () { phong_to(k); };
    });
    function phong_to(k) {                        // chạm một tấm thiệp: hiện riêng tấm đó thật lớn, chạm lần nữa để về
      lon = lon === k ? 0 : k;
      [1, 2, 3, 4].forEach(function (i) { khungNhom[i].o.classList.toggle("lon", lon === i); khungNhom[i].o.classList.toggle("an", lon && lon !== i); });
      $("tv").classList.toggle("dang-lon", !!lon);
    }

    function veNhom(k, d) {
      d = d || {}; duLieu[k] = d;
      var K = khungNhom[k], m = d.m || {}, ds = [], so, mau = MAU[k];
      for (so = 1; so <= goc.length; so++) { var st = mo(m["p" + so]); if (st) ds.push({ so: so, st: st }); }
      ds.sort(function (a, b) { return a.st.t - b.st.t; });
      var con = {};
      ds.forEach(function (x) {
        con[x.so] = 1;
        var g = K.g[x.so], moi = false;
        if (!g) { g = K.g[x.so] = veManh(K.lop, goc[x.so - 1], mau[x.so - 1], x.so, false); moi = true; K.hien[x.so] = x.st.r; g.style.transition = "none"; g.style.opacity = "0"; }
        // góc quay liên tục: chọn giá trị gần góc đang hiện nhất để mảnh không quay một vòng thừa
        var r = x.st.r, cu = K.hien[x.so]; r += Math.round((cu - r) / 360) * 360; K.hien[x.so] = r;
        g.style.transform = "translate(" + (x.st.x * U).toFixed(2) + "px," + (x.st.y * U).toFixed(2) + "px) rotate(" + r + "deg)";
        var p = diem(diemGoc(goc[x.so - 1], x.st.f)); g.children[1].setAttribute("points", p);
        K.lop.appendChild(g);
        if (moi) { g.getBoundingClientRect(); g.style.transition = ""; g.style.opacity = "1"; }
      });
      Object.keys(K.g).forEach(function (s2) { if (!con[s2]) { K.lop.removeChild(K.g[s2]); delete K.g[s2]; delete K.hien[s2]; } });
      var may = d.co ? Object.keys(d.co).length : 0, n = ds.length;
      K.o.classList.toggle("xong", !!d.xong);
      K.o.classList.toggle("co-may", may > 0);
      K.tt.textContent = d.xong ? "Đã xong" : n ? "Đã đặt " + n + "/" + goc.length + " mảnh" : may ? "Đã vào, chưa đặt mảnh nào" : "Chưa có máy nào vào";
      var o = $("vao" + k);
      o.classList.toggle("co", may > 0);
      o.querySelector(".vao-tt").textContent = may ? "Đã vào: " + may + " máy" : "Chưa có máy nào";
    }
    function datBo(ten) {
      if (!BO[ten]) ten = "nho";
      if (ten === bo) return;
      bo = ten; goc = BO[ten].map(daGiac);
      [1, 2, 3, 4].forEach(function (k) { var K = khungNhom[k]; K.lop.textContent = ""; K.g = {}; K.hien = {}; veNhom(k, duLieu[k]); });
      danhDauBo();
    }
    function danhDauBo() { $("boNho").classList.toggle("bat", bo === "nho"); $("boTo").classList.toggle("bat", bo === "to"); }
    function doiXem(x) { xem = x; $("tv").classList.toggle("xem-vao", x === "vao"); $("tv").classList.toggle("xem-xep", x === "xep"); if (lon) phong_to(lon); }
    function xepLaiHet() { if (!T) return; [1, 2, 3, 4].forEach(function (k) { T.remove("n" + k + "/m"); T.remove("n" + k + "/xong"); }); }

    $("nutBatDau").onclick = function () { doiXem("xep"); };
    $("nutMa").onclick = function () { doiXem("vao"); };
    $("nutCaiDat").onclick = function () { $("caiDat").hidden = false; };
    $("nutCaiDat2").onclick = function () { $("caiDat").hidden = false; };
    $("dongCaiDat").onclick = function () { $("caiDat").hidden = true; };
    $("nutToan").onclick = function () {
      var d = document;
      if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () {});
    };
    var hoi = 0;
    $("nutLai").onclick = function () {
      var b = $("nutLai");
      if (Date.now() - hoi > 3000) { hoi = Date.now(); b.textContent = "Bấm lần nữa để xóa cả 4 hình"; b.classList.add("hoi"); setTimeout(function () { b.textContent = "Xếp lại cả 4 nhóm"; b.classList.remove("hoi"); }, 3000); return; }
      hoi = 0; b.textContent = "Xếp lại cả 4 nhóm"; b.classList.remove("hoi"); xepLaiHet();
    };
    function chonBo(ten) { if (!T || ten === bo) return; xepLaiHet(); T.set("cfg", { bo: ten }); }
    $("boNho").onclick = function () { chonBo("nho"); };
    $("boTo").onclick = function () { chonBo("to"); };
    $("nutPhongMoi").onclick = function () {
      try { localStorage.setItem("xt-phong", maNgauNhien(5)); } catch (e) { /* bỏ qua */ }
      location.href = location.pathname + (thu ? "?thu=1" : "");
    };

    function trangThai(kieu) {
      var e = $("tvNoi");
      e.className = "noi " + kieu;
      e.textContent = kieu === "ok" ? "Đã nối" : kieu === "cungmay" ? "Chạy thử trên một máy" : kieu === "loi" ? "Mất kết nối" : "Đang nối…";
    }
    veMa(); danhDauBo(); doiXem("vao");
    noi(phong, thu, trangThai).then(function (t) {
      T = t;
      T.on("cfg", function (c) { datBo(c && c.bo || "nho"); });
      [1, 2, 3, 4].forEach(function (k) { veNhom(k, null); T.on("n" + k, function (d) { veNhom(k, d); }); });
    });
  }

  /* cho bài thử gọi các hàm hình học */
  window.XT = { BO: BO, daGiac: daGiac, toaDo: toaDo, doLun: doLun, hit: hit, giuTrong: giuTrong, trongTam: trongTam, BOCUC: BOCUC, mo: mo, goi: goi };

  function batDau() {
    var ts = thamSo();
    if (ts.n !== undefined || ts.dt !== undefined) chayDienThoai(ts); else chayTivi(ts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", batDau); else batDau();
})();
