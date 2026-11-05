/* Rước đuốc: đọc thẻ trả lời.
   - Chụp ảnh (chạy được cả trong Claude): mỗi lần bấm một tấm, đọc ngay trên điện thoại.
   - Quét liên tục bằng camera (chỉ trên trang web thường như GitHub Pages): như Plickers.
   Ảnh và hình camera không gửi đi đâu, chỉ số thẻ và chữ cái được gửi lên màn hình. */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var Q = RD.Quet = {};

  /* ---------- worker đọc thẻ ---------- */
  var worker = null, workerHong = false, workerSan = null, jobSeq = 0, jobs = {};
  function taoWorker() {
    if (worker || workerHong || typeof Worker === "undefined") return Promise.resolve(worker);
    if (workerSan) return workerSan;
    workerSan = fetch("js/scanlib.js").then(function (r) {
      if (!r.ok) throw new Error("scanlib " + r.status);
      return r.text();
    }).then(function (txt) {
      var code = txt + "\nself.onmessage = function (e) { var d = e.data; if (d.ping) { self.postMessage({ pong: 1 }); return; } try { var r = THE.scan({ data: new Uint8ClampedArray(d.buf), width: d.w, height: d.h }, d.maxId); self.postMessage({ id: d.id, cards: r.cards.map(function (c) { return { id: c.id, k: c.k, corners: c.corners, size: c.size, cx: c.cx, cy: c.cy, dist: c.dist }; }) }); } catch (err) { self.postMessage({ id: d.id, error: String(err && err.message || err) }); } };";
      var w = new Worker(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
      return new Promise(function (ok, bad) {
        var t = setTimeout(function () { bad(new Error("worker im lặng")); }, 5000);
        w.onmessage = function (e) {
          if (e.data && e.data.pong) { clearTimeout(t); ok(w); return; }
          var j = jobs[e.data.id];
          if (!j) return;
          delete jobs[e.data.id];
          if (e.data.error) j.bad(new Error(e.data.error)); else j.ok(e.data.cards);
        };
        w.onerror = function () { clearTimeout(t); bad(new Error("worker lỗi")); };
        w.postMessage({ ping: 1 });
      });
    }).then(function (w) { worker = w; return w; }, function (e) {
      console.warn("Đọc thẻ trên trang chính:", e && e.message);
      workerHong = true;
      worker = null;
      return null;
    });
    return workerSan;
  }
  function boWorker() {
    workerHong = true;
    if (worker) { try { worker.terminate(); } catch (e) { /* bỏ qua */ } }
    worker = null;
    Object.keys(jobs).forEach(function (k) { jobs[k].bad(new Error("worker")); delete jobs[k]; });
  }
  // im: ImageData. Trả về [{id, k, corners, ...}] (k: 0..3 = cạnh A/B/C/D đang ở trên)
  // layLai(): tạo lại ImageData nếu phải đọc trên trang chính sau khi worker hỏng giữa chừng
  Q.quetAnh = function (im, layLai) {
    return taoWorker().then(function (w) {
      if (!w) return window.THE.scan(im, RD.MAXID).cards;
      return new Promise(function (ok, bad) {
        var id = ++jobSeq;
        var t = setTimeout(function () { boWorker(); }, 60000);
        jobs[id] = { ok: function (v) { clearTimeout(t); ok(v); }, bad: function (e) { clearTimeout(t); bad(e); } };
        w.postMessage({ id: id, w: im.width, h: im.height, buf: im.data.buffer, maxId: RD.MAXID }, [im.data.buffer]);
      }).catch(function (e) {
        if (!layLai) throw e;
        return window.THE.scan(layLai(), RD.MAXID).cards;
      });
    });
  };
  Q.khoiDong = function () { return taoWorker(); };

  /* ---------- đọc một tấm ảnh chụp ---------- */
  var MAXSIDE = 4032;
  function giaiMa(file) {
    var quaImg = function () {
      return new Promise(function (ok, bad) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () { ok({ img: img, w: img.naturalWidth, h: img.naturalHeight, xong: function () { URL.revokeObjectURL(url); } }); };
        img.onerror = function () { URL.revokeObjectURL(url); bad(new Error("ảnh hỏng")); };
        img.src = url;
      });
    };
    if (typeof createImageBitmap !== "function") return quaImg();
    return createImageBitmap(file, { imageOrientation: "from-image" }).then(function (b) {
      return { img: b, w: b.width, h: b.height, xong: function () { if (b.close) b.close(); } };
    }, quaImg);
  }
  // thẻ hướng EXIF (0x0112) trong JPEG: {o, pos, little}; không có thì {o: 1}
  function huongExif(buf) {
    var v = new DataView(buf), off = 2;
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return { o: 1 };
    while (off + 4 <= v.byteLength) {
      var marker = v.getUint16(off), len = v.getUint16(off + 2);
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
      if (marker === 0xFFE1 && off + 18 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) {
        var tiff = off + 10, little = v.getUint16(tiff) === 0x4949;
        var ifd = tiff + v.getUint32(tiff + 4, little);
        if (ifd + 2 > v.byteLength) break;
        var n = v.getUint16(ifd, little);
        for (var i = 0; i < n; i++) {
          var e = ifd + 2 + i * 12;
          if (e + 12 > v.byteLength) break;
          if (v.getUint16(e, little) === 0x0112) {
            var o = v.getUint16(e + 8, little);
            return { o: o >= 1 && o <= 8 ? o : 1, pos: e + 8, little: little };
          }
        }
        break;
      }
      off += 2 + len;
    }
    return { o: 1 };
  }
  // giải mã với thẻ hướng đặt về 1 (điểm ảnh gốc) rồi tự xoay theo thẻ hướng thật
  function giaiMaDungHuong(file) {
    return file.arrayBuffer().then(function (buf) {
      var ex = huongExif(buf);
      if (!ex.pos) return giaiMa(file).then(function (d) { d.o = 1; return d; });
      var bytes = new Uint8Array(buf.slice(0));
      new DataView(bytes.buffer).setUint16(ex.pos, 1, ex.little);
      return giaiMa(new Blob([bytes], { type: "image/jpeg" })).then(function (d) { d.o = ex.o; return d; }, function () {
        return giaiMa(file).then(function (d) { d.o = 1; return d; });
      });
    }, function () { return giaiMa(file).then(function (d) { d.o = 1; return d; }); });
  }
  function xoayTheoExif(x, o, w, h) {
    if (o === 2) x.transform(-1, 0, 0, 1, w, 0);
    else if (o === 3) x.transform(-1, 0, 0, -1, w, h);
    else if (o === 4) x.transform(1, 0, 0, -1, 0, h);
    else if (o === 5) x.transform(0, 1, 1, 0, 0, 0);
    else if (o === 6) x.transform(0, 1, -1, 0, h, 0);
    else if (o === 7) x.transform(0, -1, -1, 0, h, w);
    else if (o === 8) x.transform(0, -1, 1, 0, 0, w);
  }
  // Trả về {cards, w, h, giay, hinhNho (canvas ≤ 1024), dang: "doc"|"ngang"}
  Q.docAnh = function (file) {
    return giaiMaDungHuong(file).then(function (src) {
      var xoay = src.o >= 5;
      var ow = xoay ? src.h : src.w, oh = xoay ? src.w : src.h;
      var sc = Math.min(1, MAXSIDE / Math.max(ow, oh));
      var w = Math.max(1, Math.round(ow * sc)), h = Math.max(1, Math.round(oh * sc));
      var dw = xoay ? h : w, dh = xoay ? w : h;
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      var cx = cv.getContext("2d", { willReadFrequently: true });
      if (!cx) { src.xong(); throw new Error("máy không đủ bộ nhớ cho ảnh này"); }
      try { xoayTheoExif(cx, src.o, dw, dh); cx.drawImage(src.img, 0, 0, dw, dh); cx.setTransform(1, 0, 0, 1, 0, 0); } finally { src.xong(); }
      var t0 = performance.now();
      var ts = Math.min(1, 1024 / Math.max(w, h)), nho = document.createElement("canvas");
      nho.width = Math.round(w * ts); nho.height = Math.round(h * ts);
      nho.getContext("2d").drawImage(cv, 0, 0, nho.width, nho.height);
      return Q.quetAnh(cx.getImageData(0, 0, w, h), function () { return cx.getImageData(0, 0, w, h); }).then(function (cards) {
        cv.width = cv.height = 0;
        return { cards: cards, w: w, h: h, giay: (performance.now() - t0) / 1000, hinhNho: nho, tiLe: ts, dang: h > w ? "doc" : "ngang" };
      });
    });
  };

  /* ---------- quét liên tục bằng camera ---------- */
  var L = Q.Live = {
    chay: false, ban: false, maxW: 1600, stream: null, track: null, video: null, phu: null,
    cv: null, ctx: null, the: [], fw: 0, fh: 0, sc: 1, raf: 0, nhan: null, onKq: null, tg: [], moTa: "", soZoom: 1
  };
  // thu phóng bằng phần mềm (cho máy không chỉnh được zoom camera): video phóng to quanh tâm,
  // bộ đọc chỉ đọc đúng phần giữa đang thấy trên màn hình
  L.zoomSo = function (z) {
    L.soZoom = Math.max(1, Math.min(4, +z || 1));
    if (L.video) L.video.style.transform = L.soZoom > 1 ? "scale(" + L.soZoom + ")" : "";
  };
  Q.coCamera = function () {
    return !RD.trongClaude && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
  };
  // video: <video>, phu: <canvas> phủ lên video; onKq(cards) mỗi khung đọc xong; nhan(card) -> {mau, chu}
  L.batDau = function (video, phu, onKq, nhan) {
    if (L.chay) return Promise.resolve();
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }   // 4:3: lấy trọn khung cảm biến, thấy được nhiều thẻ hơn
    }).then(function (s) {
      L.stream = s;
      L.track = s.getVideoTracks()[0] || null;
      video.setAttribute("playsinline", "");
      video.muted = true;
      video.srcObject = s;
      L.video = video; L.phu = phu; L.onKq = onKq; L.nhan = nhan;
      if (!L.cv) { L.cv = document.createElement("canvas"); L.ctx = L.cv.getContext("2d", { willReadFrequently: true }); }
      return video.play().catch(function () { /* một số máy tự chạy sau */ });
    }).then(function () {
      L.chay = true;
      L.tg = [];
      taoWorker();
      L.raf = requestAnimationFrame(vong);
    });
  };
  function vong() {
    if (!L.chay) return;
    var v = L.video;
    if (!L.ban && v && v.readyState >= 2 && v.videoWidth) chup();
    L.raf = requestAnimationFrame(vong);
  }
  function chup() {
    var v = L.video, vw = v.videoWidth, vh = v.videoHeight, z = L.soZoom || 1;
    var sw = vw / z, sh = vh / z;
    // có thu phóng thì phần cắt được kéo to tới gấp đôi, để thẻ ở xa đủ lớn cho bộ đọc
    var sc = Math.min(z > 1 ? 2 : 1, L.maxW / Math.max(sw, sh));
    var w = Math.round(sw * sc), h = Math.round(sh * sc);
    if (L.cv.width !== w || L.cv.height !== h) { L.cv.width = w; L.cv.height = h; }
    L.ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
    var im = L.ctx.getImageData(0, 0, w, h), t0 = performance.now();
    L.ban = true;
    Q.quetAnh(im).then(function (cards) {
      var dt = performance.now() - t0;
      L.tg.push(dt); if (L.tg.length > 12) L.tg.shift();
      if (dt > 480 && L.maxW > 1120) L.maxW -= 160;
      else if (dt < 170 && L.maxW < 1920) L.maxW += 160;
      L.ban = false;
      if (!L.chay) return;
      L.the = cards; L.fw = w; L.fh = h; L.sc = sc;
      try { if (L.onKq) L.onKq(cards); } catch (e) { console.error(e); }
      L.ve();
    }, function () { L.ban = false; });
  }
  L.khungMoiGiay = function () {
    if (!L.tg.length) return 0;
    var s = 0; L.tg.forEach(function (x) { s += x; });
    return 1000 / (s / L.tg.length);
  };
  // vẽ khung quanh thẻ đọc được, theo kiểu hiển thị object-fit: cover
  L.ve = function () {
    var c = L.phu, v = L.video;
    if (!c || !v) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = c.clientWidth, ch = c.clientHeight;
    if (!cw || !ch) return;
    if (c.width !== Math.round(cw * dpr)) c.width = Math.round(cw * dpr);
    if (c.height !== Math.round(ch * dpr)) c.height = Math.round(ch * dpr);
    var x = c.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, cw, ch);
    if (!L.fw) return;
    var s = Math.max(cw / L.fw, ch / L.fh), ox = (cw - L.fw * s) / 2, oy = (ch - L.fh * s) / 2;
    L.the.forEach(function (card) {
      var nh = L.nhan ? L.nhan(card) : { mau: "#3ddc84", chu: String(card.id) };
      if (!nh) return;
      var p = card.corners.map(function (q) { return [ox + q.x * s, oy + q.y * s]; });
      x.beginPath();
      x.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < 4; i++) x.lineTo(p[i][0], p[i][1]);
      x.closePath();
      x.lineWidth = 4; x.strokeStyle = nh.mau; x.stroke();
      x.globalAlpha = 0.25; x.fillStyle = nh.mau; x.fill(); x.globalAlpha = 1;
      var cxp = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cyp = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4;
      x.font = "700 17px system-ui, sans-serif";
      var tw = x.measureText(nh.chu).width + 12;
      x.fillStyle = "rgba(20,14,8,.78)";
      x.fillRect(cxp - tw / 2, cyp - 12, tw, 24);
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(nh.chu, cxp, cyp + 1);
    });
  };
  L.dung = function () {
    L.chay = false;
    cancelAnimationFrame(L.raf);
    if (L.stream) L.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* bỏ qua */ } });
    L.stream = null; L.track = null; L.the = []; L.fw = 0;
    L.zoomSo(1);
    if (L.video) { try { L.video.srcObject = null; } catch (e) { /* bỏ qua */ } }
    if (L.phu) { var x = L.phu.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, L.phu.width, L.phu.height); }
  };
  L.khaNang = function () {
    try { return (L.track && L.track.getCapabilities) ? L.track.getCapabilities() : {}; } catch (e) { return {}; }
  };
  L.den = function (bat) {
    if (!L.track) return Promise.reject(new Error("chưa bật camera"));
    return L.track.applyConstraints({ advanced: [{ torch: !!bat }] });
  };
  L.phongTo = function (z) {
    if (!L.track) return Promise.reject(new Error("chưa bật camera"));
    return L.track.applyConstraints({ advanced: [{ zoom: z }] });
  };
})();
