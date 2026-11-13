/* Rước đuốc: đọc thẻ trả lời.
   - Chụp ảnh (chạy được cả trong Claude): mỗi lần bấm một tấm, đọc ngay trên điện thoại.
   - Quét liên tục bằng camera (chỉ trên trang web thường như GitHub Pages): như Plickers.
   Ảnh và hình camera không gửi đi đâu, chỉ số thẻ và chữ cái được gửi lên màn hình. */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var Q = RD.Quet = {};

  /* ---------- worker đọc thẻ ----------
     9/11: có thể chạy 2 worker cùng lúc (camera: một làn đọc khung nhỏ cho thẻ ở gần, một làn đọc khung lớn cho thẻ ở xa).
     Worker 0 cũng dùng cho ảnh chụp. Worker nào hỏng thì làn đó tắt; worker 0 hỏng thì đọc trên trang chính như trước. */
  var maSan = null, jobSeq = 0, jobs = {};
  var THO = [{ w: null, hong: false, san: null }, { w: null, hong: false, san: null }];
  // Chạy TRONG worker (ghép vào sau scanlib.js), không gọi ở trang chính. Không dùng biến nào của tệp này.
  function trongWorker(e) {
    var d = e.data;
    if (d.ping) { self.postMessage({ pong: 1 }); return; }
    var kh = d.kh || null, tra = kh ? [kh.buf] : [];
    try {
      if (d.thu) {   // thử đường "khung hình" lúc vừa bật camera: chỉ rút ảnh nhỏ 32 × 32 ô để trang so với đường canvas
        var t0 = performance.now(), x = THE.xamTuKhung({ buf: kh.buf, dd: kh.dd, lay: kh.lay, w0: kh.w0, h0: kh.h0, sc: 1, lut: null });
        if (!x) throw new Error("không đọc được khung " + kh.dd);
        self.postMessage({ id: d.id, thu: { nho: THE.anhNho(x.g, 0, x.w, x.w, x.h, 1, 32), tg: performance.now() - t0, w: x.w, h: x.h }, buf: kh.buf }, tra);
        return;
      }
      var tuy = { chiDu: !!d.chiDu, len: d.len || null, f: d.f || 0 };
      var r = kh ? THE.scanKhung(kh, d.maxId, tuy) : THE.scan({ data: new Uint8ClampedArray(d.buf), width: d.w, height: d.h }, d.maxId, tuy);
      self.postMessage({
        id: d.id,
        cards: r.cards.map(function (c) { return { id: c.id, k: c.k, corners: c.corners, size: c.size, cx: c.cx, cy: c.cy, dist: c.dist, hai: !!c.hai, det: c.det, ngo: !!c.ngo, tt: c.tt || 0, e: c.e || null, gt: c.gt || null }; }),
        nam: (r.nam || []).map(function (c) { return c.vi ? { id: c.id, k: c.k, size: c.size, det: c.det, vi: 1, corners: c.corners, tt: 2, e: c.e || null, gt: c.gt || null } : { id: c.id, k: c.k, size: c.size, det: c.det }; }),
        sang: r.info.sang, w: r.w || 0, h: r.h || 0, tgDoi: r.tgDoi || 0, buf: kh ? kh.buf : null
      }, tra);
    } catch (err) { self.postMessage({ id: d.id, error: String(err && err.message || err), buf: kh ? kh.buf : null }, tra); }
  }
  // kết quả đọc ngay trên trang chính (không có worker): gói giống kết quả worker trả về
  function taiCho(r) {
    var cs = r.cards;
    cs.nam = r.nam || []; cs.sang = r.info ? r.info.sang : null; cs.w = r.w || 0; cs.h = r.h || 0; cs.tgDoi = r.tgDoi || 0;
    return cs;
  }
  function taiMa() {
    if (!maSan) {
      maSan = fetch("js-the-moi/scanlib.js?v=" + (window.RD_V || "")).then(function (r) {
        if (!r.ok) throw new Error("scanlib " + r.status);
        return r.text();
      }).then(function (txt) {
        var code = txt + "\nself.onmessage = " + trongWorker.toString() + ";";
        return URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      });
    }
    return maSan;
  }
  function taoWorker(i) {
    var t = THO[i || 0];
    if (t.w || t.hong || typeof Worker === "undefined") return Promise.resolve(t.w);
    if (t.san) return t.san;
    t.san = taiMa().then(function (url) {
      var w = new Worker(url);
      return new Promise(function (ok, bad) {
        var hen = setTimeout(function () { bad(new Error("worker im lặng")); }, 5000);
        w.onmessage = function (e) {
          if (e.data && e.data.pong) { clearTimeout(hen); ok(w); return; }
          if (e.data.buf && RD.Nhanh) RD.Nhanh.traBo(e.data.buf);   // vùng nhớ khung hình: dùng lại cho lần chụp sau
          var j = jobs[e.data.id];
          if (!j) return;
          delete jobs[e.data.id];
          if (e.data.error) { j.bad(new Error(e.data.error)); return; }
          if (e.data.thu) { j.ok(e.data.thu); return; }
          var cs = e.data.cards;
          cs.nam = e.data.nam || []; cs.sang = e.data.sang; cs.w = e.data.w; cs.h = e.data.h; cs.tgDoi = e.data.tgDoi;
          j.ok(cs);
        };
        w.onerror = function () { clearTimeout(hen); bad(new Error("worker lỗi")); };
        w.postMessage({ ping: 1 });
      });
    }).then(function (w) { t.w = w; return w; }, function (e) {
      console.warn("Worker đọc thẻ " + (i || 0) + " không chạy:", e && e.message);
      t.hong = true;
      t.w = null;
      return null;
    });
    return t.san;
  }
  function boWorker(i) {
    var t = THO[i];
    t.hong = true;
    if (t.w) { try { t.w.terminate(); } catch (e) { /* bỏ qua */ } }
    t.w = null;
    Object.keys(jobs).forEach(function (k) { if (jobs[k].i === i) { jobs[k].bad(new Error("worker")); delete jobs[k]; } });
  }
  // im: ImageData. Trả về [{id, k, corners, ...}] (k: 0..3 = cạnh A/B/C/D đang ở trên)
  // layLai(): tạo lại ImageData nếu phải đọc trên trang chính sau khi worker hỏng giữa chừng
  // tuy: {lan: 0|1 (worker nào), chiDu: bỏ lượt nửa cỡ}. Worker 1 không có thì báo lỗi {khongLan: true}.
  Q.quetAnh = function (im, layLai, tuy) {
    tuy = tuy || {};
    var i = tuy.lan || 0;
    return taoWorker(i).then(function (w) {
      if (!w) {
        if (i) { var e = new Error("không có worker " + i); e.khongLan = true; throw e; }
        return taiCho(window.THE.scan(im, RD.MAXID, tuy));
      }
      return new Promise(function (ok, bad) {
        var id = ++jobSeq;
        var hen = setTimeout(function () { boWorker(i); }, 60000);
        jobs[id] = { i: i, ok: function (v) { clearTimeout(hen); ok(v); }, bad: function (e) { clearTimeout(hen); bad(e); } };
        w.postMessage({ id: id, w: im.width, h: im.height, buf: im.data.buffer, maxId: RD.MAXID, chiDu: !!tuy.chiDu, len: tuy.len || null, f: tuy.f || 0 }, [im.data.buffer]);
      }).catch(function (e) {
        if (i) { e.khongLan = true; throw e; }
        if (!layLai) throw e;
        return taiCho(window.THE.scan(layLai(), RD.MAXID, tuy));
      });
    });
  };
  // 13/11: gửi thẳng vùng nhớ của một khung hình camera (nhanh.js gọi). kh: {buf, dd, lay, w0, h0, sc, lut}; tuy như quetAnh,
  //   thêm tuy.thu: chỉ rút ảnh nhỏ để so. Lỗi của worker (không có, treo) mới tính là hỏng làn; lỗi đọc khung thì nhanh.js lo.
  Q.quetKhung = function (kh, tuy) {
    tuy = tuy || {};
    var i = tuy.lan || 0;
    return taoWorker(i).then(function (w) {
      if (!w) {
        if (i) { var e = new Error("không có worker " + i); e.khongLan = true; throw e; }
        if (tuy.thu) {
          var x = window.THE.xamTuKhung({ buf: kh.buf, dd: kh.dd, lay: kh.lay, w0: kh.w0, h0: kh.h0, sc: 1, lut: null });
          if (!x) throw new Error("không đọc được khung " + kh.dd);
          return { nho: window.THE.anhNho(x.g, 0, x.w, x.w, x.h, 1, 32), tg: 0, w: x.w, h: x.h };
        }
        var r = taiCho(window.THE.scanKhung(kh, RD.MAXID, tuy));
        if (RD.Nhanh) RD.Nhanh.traBo(kh.buf);
        return r;
      }
      return new Promise(function (ok, bad) {
        var id = ++jobSeq;
        var hen = setTimeout(function () { boWorker(i); }, 60000);
        jobs[id] = { i: i, ok: function (v) { clearTimeout(hen); ok(v); }, bad: function (e) { clearTimeout(hen); bad(e); } };
        w.postMessage({ id: id, kh: kh, thu: !!tuy.thu, maxId: RD.MAXID, chiDu: !!tuy.chiDu, len: tuy.len || null, f: tuy.f || 0 }, [kh.buf]);
      }).catch(function (e) {
        if (i && e && e.message === "worker") e.khongLan = true;
        throw e;
      });
    });
  };
  Q.khoiDong = function () { return taoWorker(0); };

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

  /* ---------- quét liên tục bằng camera ----------
     9/11 (thầy Thịnh: "máy nhận diện hơi chậm… plicker gốc nhận diện nhanh hơn"): đọc được nhiều khung hơn mỗi giây.
     - Máy từ 4 nhân trở lên chạy hai làn song song, mỗi làn một worker:
       làn gần: khung nhỏ (cạnh dài 800–1120) đọc cả cỡ đủ lẫn nửa cỡ, nhiều khung mỗi giây, bắt thẻ ở gần và vừa;
       làn xa: khung lớn (1280–1920) chỉ đọc cỡ đủ, bắt thẻ nhỏ ở cuối lớp.
       Cỡ khung mỗi làn tự chỉnh theo tốc độ máy.
     - Máy yếu, hoặc worker thứ hai không chạy: một làn như trước (cỡ đủ và nửa cỡ).
     - Mỗi lần mỗi khung hình chỉ chụp cho một làn, để trang không bị giật.
     - Kết quả kèm thời điểm chụp khung (onKq(cards, tc)); khung vẽ quanh thẻ lấy lần đọc mới nhất của thẻ đó ở cả hai làn. */
  var L = Q.Live = {
    chay: false, maxW: 1600, stream: null, track: null, video: null, phu: null,
    the: [], fw: 0, fh: 0, raf: 0, nhan: null, onKq: null, soZoom: 1, lan: [], phien: 0, keTiep: 0
  };
  function motLan() { return { so: 0, ten: "một", maxW: 1440, min: 1120, max: 1920, cham: 360, nhanh: 140, chiDu: false }; }
  function taoLan() {
    var hai = typeof Worker !== "undefined" && (navigator.hardwareConcurrency || 4) >= 4;
    L.lan = (hai ? [
      { so: 0, ten: "gần", maxW: 960, min: 800, max: 1120, cham: 170, nhanh: 80, chiDu: false },
      { so: 1, ten: "xa", maxW: 1600, min: 1280, max: 1920, cham: 450, nhanh: 180, chiDu: true }
    ] : [motLan()]).map(function (n) {
      n.ban = false; n.tat = false; n.tg = []; n.the = []; n.t = 0; n.cv = null; n.ctx = null;
      return n;
    });
    L.maxW = L.lan[L.lan.length - 1].maxW;
  }
  // worker thứ hai không chạy: tắt làn xa, làn gần làm một mình như cách cũ
  function tatLan(n) {
    if (!n.so || n.tat) return;
    n.tat = true; n.ban = false; n.the = [];
    var g = L.lan[0], m = motLan();
    ["ten", "maxW", "min", "max", "cham", "nhanh", "chiDu"].forEach(function (k) { g[k] = m[k]; });
    L.maxW = g.maxW;
  }
  // thu phóng bằng phần mềm (cho máy không chỉnh được zoom camera): video phóng to quanh tâm,
  // bộ đọc chỉ đọc đúng phần giữa đang thấy trên màn hình
  L.zoomSo = function (z) {
    L.soZoom = Math.max(1, Math.min(4, +z || 1));
    if (L.video) L.video.style.transform = L.soZoom > 1 ? "scale(" + L.soZoom + ")" : "";
  };
  Q.coCamera = function () {
    return !RD.trongClaude && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
  };
  // video: <video>, phu: <canvas> phủ lên video; onKq(cards, tc) mỗi khung đọc xong; nhan(card) -> {mau, chu}
  L.batDau = function (video, phu, onKq, nhan) {
    if (L.chay) return Promise.resolve();
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }   // 4:3: lấy trọn khung cảm biến, thấy được nhiều thẻ hơn
    }).then(function (s) {
      L.stream = s;
      L.track = s.getVideoTracks()[0] || null;
      L.zoomMay = 0;   // bản thử 13/11: camera vừa bật, chưa zoom
      // lấy nét liên tục nếu máy cho chỉnh (đưa camera qua lại giữa các bàn mà ảnh vẫn nét)
      try {
        var kn = L.khaNang();
        if (kn.focusMode && kn.focusMode.indexOf("continuous") >= 0) L.track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(function () { /* bỏ qua */ });
      } catch (e) { /* bỏ qua */ }
      video.setAttribute("playsinline", "");
      video.muted = true;
      video.srcObject = s;
      L.video = video; L.phu = phu; L.onKq = onKq; L.nhan = nhan;
      return video.play().catch(function () { /* một số máy tự chạy sau */ });
    }).then(function () {
      if (!L.lan.length) taoLan();
      L.phien++;
      L.lan.forEach(function (n) { n.tg = []; n.the = []; n.t = 0; if (!n.tat) taoWorker(n.so); });
      L.chay = true;
      if (RD.Nhanh) { try { RD.Nhanh.camBat(L); } catch (e) { console.error(e); } }   // bản thử 13/11: cảm biến nghiêng, đường khung hình, phơi sáng ngắn
      L.raf = requestAnimationFrame(vong);
    });
  };
  function vong() {
    if (!L.chay) return;
    var v = L.video, k = L.lan.length;
    if (v && v.readyState >= 2 && v.videoWidth) {
      // mỗi khung hình chỉ chụp cho một làn đang rảnh, lần lượt từng làn
      for (var i = 0; i < k; i++) {
        var n = L.lan[(L.keTiep + i) % k];
        if (!n.ban && !n.tat) { L.keTiep = (n.so + 1) % k; chup(n); break; }
      }
    }
    L.raf = requestAnimationFrame(vong);
  }
  function chup(n) {
    var v = L.video, vw = v.videoWidth, vh = v.videoHeight, z = L.soZoom || 1, phien = L.phien;
    var sw = vw / z, sh = vh / z;
    // có thu phóng thì phần cắt được kéo to tới gấp đôi, để thẻ ở xa đủ lớn cho bộ đọc
    var sc = Math.min(z > 1 ? 2 : 1, n.maxW / Math.max(sw, sh));
    var w = Math.round(sw * sc), h = Math.round(sh * sc);
    var tc = performance.now(), ng = RD.Nhanh || null;
    var tuy = { lan: n.so, chiDu: n.chiDu, len: null, f: 0 };
    // bản thử 13/11: hướng "trên" của cảm biến nghiêng và tiêu cự (tính bằng điểm ảnh của khung gửi đi) để bộ đọc bỏ thẻ nằm ngửa trên bàn
    if (ng) { try { tuy.len = ng.len(); } catch (e) { tuy.len = null; } if (tuy.len) tuy.f = ng.F_REL * Math.max(vw, vh) * sc * (L.zoomMay > 0 ? L.zoomMay : 1); }
    var xong = function (cards, t0) {
      var dt = performance.now() - t0;
      n.ban = false;
      n.tg.push(dt); if (n.tg.length > 12) n.tg.shift();
      if (dt > n.cham && n.maxW > n.min) n.maxW = Math.max(n.min, n.maxW - 160);
      else if (dt < n.nhanh && n.maxW < n.max) n.maxW = Math.min(n.max, n.maxW + 160);
      L.maxW = L.lan[L.lan.length - 1].tat ? L.lan[0].maxW : L.lan[L.lan.length - 1].maxW;
      if (!L.chay || phien !== L.phien) return;
      // toạ độ góc thẻ đổi về phần cắt trên video (chung cho các làn dù cỡ khung khác nhau)
      var fw = cards.w || w, fh = cards.h || h, kx = sw / fw, ky = sh / fh;
      var doi = function (c) { c.corners = c.corners.map(function (p) { return { x: p.x * kx, y: p.y * ky }; }); c.tc = tc; c.lan = n.so; };
      cards.forEach(doi);
      n.nam = (cards.nam || []).filter(function (c) { return c.vi && c.corners; });   // thẻ nằm trên bàn bị bỏ: để vẽ viền xám
      n.nam.forEach(doi);
      n.the = cards; n.t = tc; n.kw = fw; n.kh = fh;
      n.len = tuy.len; n.f = tuy.f; n.sang = cards.sang; n.doiMs = cards.tgDoi || 0;   // bản thử: số đo
      L.fw = sw; L.fh = sh;
      if (ng && cards.sang != null) { try { ng.sang(cards.sang, tc); } catch (e) { console.error(e); } }
      gop();
      try { if (L.onKq) L.onKq(cards, tc); } catch (e) { console.error(e); }
      L.ve();
    };
    var hong = function (e) {
      n.ban = false;
      if (e && e.khongLan) tatLan(n);
    };
    var canvas = function () {
      if (!n.cv) { n.cv = document.createElement("canvas"); n.ctx = n.cv.getContext("2d", { willReadFrequently: true }); }
      if (n.cv.width !== w || n.cv.height !== h) { n.cv.width = w; n.cv.height = h; }
      tc = performance.now();
      n.ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
      var im = n.ctx.getImageData(0, 0, w, h), t0 = performance.now();
      n.chupMs = t0 - tc; n.choMs = 0; n.kieu = "c"; n.kw = w; n.kh = h;   // bản thử: số đo
      if (ng) { try { ng.sauCanvas(im, v, n, z, n.chupMs); } catch (e) { console.error(e); } }   // lần đầu sau khi bật camera: thử đường khung hình
      Q.quetAnh(im, null, tuy).then(function (cards) { xong(cards, t0); }, hong);
    };
    n.ban = true;
    // bản thử 13/11: lấy thẳng khung hình camera khi đã so khớp với đường canvas (không thu phóng); không thì canvas như cũ
    if (ng && z === 1) {
      var nhan = false;
      try { nhan = ng.khung(v, n, sc, tuy, xong, canvas, hong); } catch (e) { console.error(e); nhan = false; }
      if (nhan) return;
    }
    canvas();
  }
  // thẻ đang thấy = lần đọc mới nhất của từng thẻ ở mọi làn (kết quả quá 0,9 giây thì coi như thẻ đã ra khỏi khung)
  function gop() {
    var bay = performance.now(), tot = {}, nam = {};
    L.lan.forEach(function (n) {
      if (n.tat || bay - n.t > 900) return;
      n.the.forEach(function (c) { var o = tot[c.id]; if (!o || c.tc > o.tc) tot[c.id] = c; });
      (n.nam || []).forEach(function (c) { var kk = c.id + "." + c.k, o = nam[kk]; if (!o || c.tc > o.tc) nam[kk] = c; });
    });
    L.the = Object.keys(tot).map(function (k) { return tot[k]; }).sort(function (a, b) { return a.id - b.id; });
    // bản thử 13/11: thẻ nằm trên bàn đang bị bỏ qua (trừ khi chính mã đó vừa được đọc là thẻ đang giơ ở lần đọc mới hơn)
    L.nam = Object.keys(nam).map(function (k) { return nam[k]; }).filter(function (c) { var o = tot[c.id]; return !(o && o.k === c.k && o.tc >= c.tc); });
  }
  // số khung đọc được mỗi giây, cộng các làn
  L.khungMoiGiay = function () {
    var f = 0;
    L.lan.forEach(function (n) {
      if (n.tat || !n.tg.length) return;
      var s = 0; n.tg.forEach(function (x) { s += x; });
      f += 1000 / (s / n.tg.length);
    });
    return f;
  };
  L.tungLan = function () {
    return L.lan.map(function (n) {
      var s = 0; n.tg.forEach(function (x) { s += x; });
      return { ten: n.ten, tat: n.tat, maxW: n.maxW, ms: n.tg.length ? Math.round(s / n.tg.length) : 0 };
    });
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
    // bản thử 13/11: thẻ nằm trên bàn, máy thấy nhưng bỏ qua: viền đứt màu xám nhạt, chữ "nằm"
    (L.nam || []).forEach(function (card) {
      var p = card.corners.map(function (q) { return [ox + q.x * s, oy + q.y * s]; });
      x.beginPath();
      x.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < 4; i++) x.lineTo(p[i][0], p[i][1]);
      x.closePath();
      x.setLineDash([6, 5]); x.lineWidth = 2; x.strokeStyle = "rgba(240,240,240,.9)"; x.stroke(); x.setLineDash([]);
      var cxp = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cyp = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4;
      x.font = "600 13px system-ui, sans-serif";
      var tw = x.measureText("nằm").width + 10;
      x.fillStyle = "rgba(20,14,8,.6)";
      x.fillRect(cxp - tw / 2, cyp - 10, tw, 20);
      x.fillStyle = "#eee"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("nằm", cxp, cyp + 1);
    });
  };
  L.dung = function () {
    if (RD.Nhanh && L.chay) { try { RD.Nhanh.camTat(L); } catch (e) { console.error(e); } }
    L.chay = false; L.nam = [];
    cancelAnimationFrame(L.raf);
    if (L.stream) L.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* bỏ qua */ } });
    L.stream = null; L.track = null; L.the = []; L.fw = 0;
    L.lan.forEach(function (n) { n.the = []; n.nam = []; n.t = 0; });
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
    return L.track.applyConstraints({ advanced: [{ zoom: z }] }).then(function () { L.zoomMay = +z || 0; });
  };
})();
