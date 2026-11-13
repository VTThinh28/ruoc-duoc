/* Rước đuốc, BẢN THỬ thẻ mới. 13/11/2026: ba chỗ sửa sau buổi thầy Thịnh quét thử ở lớp (số đo mã JEDC, 42 em, 5 câu).
   Tệp này chỉ có ở trang thử (js-the-moi/nhanh.js), nạp sau tro-choi.js, trước do.js. quet.js gọi sang đây; thiếu tệp này thì
   quet.js chạy như bản 12/11.

   1. THẺ NẰM TRÊN BÀN (thầy: "máy hay quét các thẻ nằm dưới bàn").
      Điện thoại báo hướng "trên" qua cảm biến nghiêng. Mỗi khung gửi cho bộ đọc kèm hướng đó; bộ đọc tính mặt thẻ quay về đâu,
      thẻ ngửa mặt lên trần thì bỏ (scanlib.js, tuThe). Ở đây chỉ lo phần cảm biến:
        - nguồn chính: deviceorientation (đã gộp con quay, không bị lệch khi tay lắc); nguồn phụ: gia tốc có trọng lực, lọc chậm;
        - Chrome chỉ báo deviceorientation khi máy xoay quá 0,1°: máy cầm yên thì không có tin mới, nên số cũ vẫn dùng tiếp,
          miễn là gia tốc (báo đều 60 lần mỗi giây) còn khớp với nó trong 20°. Hết khớp mà không có tin mới thì dùng gia tốc;
        - hai nguồn cùng báo mà lệch nhau lâu thì không tin nguồn nào, tắt phép lọc (còn luật nghiêng quá 60° như cũ);
        - không có gia tốc thì chỉ tin deviceorientation mới trong 0,5 giây.
   2. LẤY HÌNH NHANH. Số đo 13/11: vẽ video lên canvas rồi đọc điểm ảnh mất 105 ms mỗi khung trên máy thầy, bằng thời gian đọc thẻ,
      lại chạy trên luồng chính nên trang giật. Đường mới: new VideoFrame(video) rồi copyTo() thẳng vùng nhớ của khung hình
      (thường là I420: lớp sáng Y chính là ảnh xám), gửi cho worker. Lúc vừa bật camera, trang chụp một khung theo CẢ HAI đường,
      so hai ảnh nhỏ 32 × 32 ô: giống nhau (tương quan từ 0,92) và không chậm hơn thì mới dùng; hỏng giữa chừng thì về canvas.
   3. PHƠI SÁNG NGẮN. Số đo 13/11: camera tự phơi 1/50 giây; lúc lia máy thẻ nhòe, tỉ lệ đọc trúng từ 75% còn 25 đến 50%.
      Máy nào cho chỉnh (exposureMode "manual", exposureTime, iso) thì ép phơi 4 ms, bù bằng ISO; ISO tự chỉnh theo độ sáng trung
      bình của khung (bộ đọc trả về). Hết cỡ ISO mới kéo dài phơi (tới 10 ms). Lệnh bị từ chối, hoặc hình tối đen/cháy trắng
      kéo dài, thì trả camera về tự động.
   Ba ô bật tắt trên màn quét của điện thoại (mặc định bật, máy nhớ): rd-loc-nam, rd-khung, rd-phoi-ngan = "0" là tắt. */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var N = RD.Nhanh = { F_REL: 0.667 };   // tiêu cự / cạnh dài khung hình: camera chính của điện thoại (23 đến 26 mm quy đổi); 2 ảnh lớp 13/11 khớp 0,665
  var D2R = Math.PI / 180;
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
  function bay() { return performance.now(); }
  function tenLoi(e) { return String((e && (e.message || e.name)) || e).slice(0, 90); }
  var nghe = [];
  N.nghe = function (f) { nghe.push(f); };   // do.js nghe các quyết định ở đây để ghi vào số đo
  function bao(loai, a, b, c, d) { for (var i = 0; i < nghe.length; i++) { try { nghe[i](loai, a, b, c, d); } catch (e) { /* bỏ qua */ } } }
  var KHOA = { nam: "rd-loc-nam", khung: "rd-khung", phoi: "rd-phoi-ngan" };
  N.bat = { nam: lsGet(KHOA.nam, "1") !== "0", khung: lsGet(KHOA.khung, "1") !== "0", phoi: lsGet(KHOA.phoi, "1") !== "0" };
  var LIVE = null;   // RD.Quet.Live lúc camera đang bật

  /* =====================================================================
     1. CẢM BIẾN NGHIÊNG: hướng "trên" trong hệ toạ độ của khung hình
     ===================================================================== */
  var CB = N.cb = { h: null, tH: 0, nH: 0, g: null, tG: 0, nG: 0, khop: 0, nKhop: 0, quyen: "", nguon: "" };
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.addEventListener("deviceorientation", function (e) {
    if (e.beta == null || e.gamma == null || !isFinite(e.beta) || !isFinite(e.gamma)) return;
    // hướng "trên" trong hệ của máy (x sang phải màn hình, y lên đỉnh máy, z từ màn hình ra phía người cầm) = hàng 3 của Rx(beta)·Ry(gamma)
    var b = e.beta * D2R, g = e.gamma * D2R, cb = Math.cos(b);
    CB.h = [-cb * Math.sin(g), Math.sin(b), cb * Math.cos(g)]; CB.tH = bay(); CB.nH++;
  });
  window.addEventListener("devicemotion", function (e) {
    var a = e.accelerationIncludingGravity;
    if (!a || a.x == null || !isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z)) return;
    var m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z), t = bay();
    if (m < 6 || m > 14) return;   // tay đang giật mạnh: mẫu này không phải trọng lực
    var x = a.x / m, y = a.y / m, z = a.z / m;
    if (!CB.g || t - CB.tG > 600) CB.g = [x, y, z];
    else { var k = Math.min(1, (t - CB.tG) / 250); CB.g[0] += k * (x - CB.g[0]); CB.g[1] += k * (y - CB.g[1]); CB.g[2] += k * (z - CB.g[2]); }
    CB.tG = t; CB.nG++;
    if (CB.h && t - CB.tH < 400) {
      var gl = Math.sqrt(CB.g[0] * CB.g[0] + CB.g[1] * CB.g[1] + CB.g[2] * CB.g[2]) || 1;
      var d = (CB.h[0] * CB.g[0] + CB.h[1] * CB.g[1] + CB.h[2] * CB.g[2]) / gl;
      CB.khop = CB.nKhop ? CB.khop + (d - CB.khop) * 0.02 : d; CB.nKhop++;
    }
  });
  // iPhone: phải xin quyền đọc cảm biến trong một lần bấm; xin lúc thầy bấm nút bật camera
  document.addEventListener("click", function (e) {
    if (CB.quyen || !e.target || !e.target.closest || !e.target.closest("#dtBatCam")) return;
    try {
      var DO = window.DeviceOrientationEvent, DM = window.DeviceMotionEvent;
      if (DO && typeof DO.requestPermission === "function") { CB.quyen = "hoi"; DO.requestPermission().then(function (r) { CB.quyen = String(r); }, function () { CB.quyen = "loi"; }); }
      if (DM && typeof DM.requestPermission === "function") DM.requestPermission().then(function () { /* xong */ }, function () { /* bỏ qua */ });
    } catch (err) { /* bỏ qua */ }
  }, true);
  function gocManHinh() {
    var so = window.screen && window.screen.orientation;
    if (so && typeof so.angle === "number") return so.angle;
    if (typeof window.orientation === "number") return window.orientation;
    return 0;
  }
  // hướng "trên" trong hệ của máy, hoặc null khi không có số đo đáng tin
  function lenMay() {
    var t = bay(), hMoi = !!CB.h && t - CB.tH < 500, coG = !!CB.g && t - CB.tG < 500, gl = 1, dau = 1, gx = 0, gy = 0, gz = 0;
    if (coG) {
      gl = Math.sqrt(CB.g[0] * CB.g[0] + CB.g[1] * CB.g[1] + CB.g[2] * CB.g[2]) || 1;
      dau = CB.nKhop > 40 ? (CB.khop < 0 ? -1 : 1) : IOS ? -1 : 1;   // iPhone báo gia tốc ngược dấu
      gx = dau * CB.g[0] / gl; gy = dau * CB.g[1] / gl; gz = dau * CB.g[2] / gl;
    }
    if (coG && CB.h) {
      if (CB.nKhop > 40 && Math.abs(CB.khop) < 0.6) { CB.nguon = "lech"; return null; }   // hai nguồn cùng báo mà lệch nhau lâu
      // tin mới, hoặc tin cũ nhưng gia tốc còn khớp trong 20° (máy cầm yên nên không có tin mới): dùng hướng máy
      if (hMoi || CB.h[0] * gx + CB.h[1] * gy + CB.h[2] * gz >= 0.94) { CB.nguon = "huong"; return CB.h; }
      CB.nguon = "gia-toc"; return [gx, gy, gz];
    }
    if (hMoi) { CB.nguon = "huong"; return CB.h; }
    if (coG) { CB.nguon = "gia-toc"; return [gx, gy, gz]; }
    CB.nguon = "";
    return null;
  }
  // Hướng "trên" trong hệ ảnh của video (x sang phải, y xuống dưới, z từ camera sau đi tới). Video đã được trình duyệt xoay theo
  // chiều màn hình (góc A): phải màn hình = (cos A, −sin A, 0), trên màn hình = (sin A, cos A, 0) trong hệ của máy.
  N.len = function () {
    if (!N.bat.nam) return null;
    var u = lenMay();
    if (!u) return null;
    var Ag = gocManHinh(), A = Ag * D2R, c = Math.cos(A), s = Math.sin(A);
    var x = u[0] * c - u[1] * s, y = -(u[0] * s + u[1] * c), z = -u[2];
    // màn hình đang xoay ngang hoặc ngược thì chữ trên màn hình luôn thuận theo trọng lực, nên "trên" phải chỉ lên phía trên ảnh (y âm).
    // Thấy ngược rõ ràng tức là máy này tính góc xoay theo chiều kia: đổi lại.
    if (Ag % 360 !== 0 && y > 0.3) { x = -x; y = -y; }
    return [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4, Math.round(z * 1e4) / 1e4];
  };
  N.coCamBien = function () { return !!lenMay() || CB.nguon === "lech"; };

  /* =====================================================================
     2. LẤY THẲNG KHUNG HÌNH CỦA CAMERA (VideoFrame), không qua canvas
     ===================================================================== */
  var KH = N.kh = { tt: "khong", ly: "chưa bật camera", dd: "", opt: null, lut: null, tq: 0, a: 0, b: 0, tC: 0, tK: 0, soThu: 0, dangThu: false, hong: 0, bo: [], so: 0 };
  var DOC_DUOC = { I420: 1, I420A: 1, I422: 1, I444: 1, NV12: 1, RGBA: 1, RGBX: 1, BGRA: 1, BGRX: 1 };
  N.traBo = function (buf) { if (buf && buf.byteLength > 0 && KH.bo.length < 4) KH.bo.push(buf); };
  function layBo(kich) {
    for (var i = KH.bo.length - 1; i >= 0; i--) if (KH.bo[i].byteLength >= kich) return KH.bo.splice(i, 1)[0];
    if (KH.bo.length >= 4) KH.bo.length = 0;   // toàn vùng nhớ cỡ cũ: bỏ
    return new ArrayBuffer(kich);
  }
  function dong(fr) { if (fr) { try { fr.close(); } catch (e) { /* bỏ qua */ } } }
  function gonLay(lay) { return (lay || []).map(function (p) { return { offset: p.offset, stride: p.stride }; }); }
  function coKhung(fr, v) {
    var vr = fr.visibleRect, w0 = vr ? vr.width : fr.codedWidth, h0 = vr ? vr.height : fr.codedHeight;
    return { w0: w0, h0: h0, lech: w0 !== v.videoWidth || h0 !== v.videoHeight || !!fr.rotation || !!fr.flip };
  }
  // ảnh nhỏ N × N ô (trung bình từng ô, lấy mẫu thưa) của ảnh RGBA lấy theo đường canvas; cùng cách chia ô với THE.anhNho
  function anhNhoRGBA(d, w, h, n) {
    var o = new Uint8Array(n * n), i, j, x, y, x0, x1, y0, y1, s, c, r, bx, by, p;
    for (j = 0; j < n; j++) {
      y0 = Math.floor(j * h / n); y1 = Math.max(y0 + 1, Math.floor((j + 1) * h / n)); by = Math.max(1, (y1 - y0) >> 3);
      for (i = 0; i < n; i++) {
        x0 = Math.floor(i * w / n); x1 = Math.max(x0 + 1, Math.floor((i + 1) * w / n)); bx = Math.max(1, (x1 - x0) >> 3);
        s = 0; c = 0;
        for (y = y0; y < y1; y += by) { r = y * w; for (x = x0; x < x1; x += bx) { p = (r + x) * 4; s += (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8; c++; } }
        o[j * n + i] = c ? Math.round(s / c) : 0;
      }
    }
    return o;
  }
  // a (canvas) so với b (khung hình): hệ số tương quan, đường thẳng a ≈ ka·b + kb, độ lệch chuẩn của mỗi ảnh
  function soSanh(a, b) {
    var n = Math.min(a.length, b.length), i, ma = 0, mb = 0, saa = 0, sbb = 0, sab = 0;
    for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    for (i = 0; i < n; i++) { saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); sab += (a[i] - ma) * (b[i] - mb); }
    var ka = sbb > 0 ? sab / sbb : 0;
    return { r: saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0, ka: ka, kb: ma - ka * mb, sa: Math.sqrt(saa / n), sb: Math.sqrt(sbb / n) };
  }
  N._soSanh = soSanh; N._anhNhoRGBA = anhNhoRGBA;
  function thoi(ly) { KH.tt = "khong"; KH.ly = ly; KH.dangThu = false; bao("khung", "khong", ly); }
  // Gọi trong đường canvas, ngay sau khi lấy được ảnh `im` của làn n (cùng khoảnh khắc với khung hình sắp lấy).
  // Lần đầu sau khi bật camera: lấy thêm một khung theo đường mới, nhờ worker rút ảnh nhỏ, so với ảnh nhỏ của `im`.
  N.sauCanvas = function (im, v, n, z, tCanvas) {
    if (KH.tt !== "chua" || KH.dangThu || !N.bat.khung || z !== 1 || !RD.Quet || !RD.Quet.quetKhung) return;
    KH.dangThu = true; KH.soThu++;
    var fr = null, t0 = bay(), phien = KH.so;
    try {
      fr = new VideoFrame(v);
      var c = coKhung(fr, v), dd = fr.format, opt = DOC_DUOC[dd] ? null : { format: "RGBA" };
      if (c.lech) { dong(fr); thoi("khung " + c.w0 + "×" + c.h0 + (fr.rotation ? " xoay " + fr.rotation : "") + " khác video " + v.videoWidth + "×" + v.videoHeight); return; }
      var nhoC = anhNhoRGBA(im.data, im.width, im.height, 32);
      var kich = opt ? fr.allocationSize(opt) : fr.allocationSize(), buf = new ArrayBuffer(kich), mau = null;
      try { mau = fr.colorSpace ? { fr: fr.colorSpace.fullRange, mt: fr.colorSpace.matrix } : null; } catch (e2) { mau = null; }
      var coRoi = false;
      setTimeout(function () { if (!coRoi && phien === KH.so && KH.tt === "chua" && KH.dangThu) { coRoi = true; dong(fr); thoi("khung hình không trả lời sau 3 giây"); } }, 3000);
      (opt ? fr.copyTo(buf, opt) : fr.copyTo(buf)).then(function (lay) {
        if (coRoi) return null;
        coRoi = true;
        var tK = bay() - t0;
        dong(fr);
        return RD.Quet.quetKhung({ buf: buf, dd: opt ? "RGBA" : dd, lay: gonLay(lay), w0: c.w0, h0: c.h0, sc: 1, lut: null }, { lan: n.so, thu: true }).then(function (kq) {
          if (phien !== KH.so || KH.tt !== "chua") return;
          KH.dangThu = false;
          var s = soSanh(nhoC, kq.nho);
          KH.tq = Math.round(s.r * 1000) / 1000; KH.a = Math.round(s.ka * 1000) / 1000; KH.b = Math.round(s.kb * 10) / 10;
          KH.tC = Math.round(tCanvas * 10) / 10; KH.tK = Math.round(tK * 10) / 10; KH.dd = dd || "?"; KH.opt = opt; KH.mau = mau;
          if (s.sa < 4 || s.sb < 4) {   // hình quá đều (camera bị che, tường trắng): chưa so được
            if (KH.soThu >= 6) thoi("hình quá đều, không so được với cách cũ"); else bao("khung", "cho", "hình đều");
            return;
          }
          if (s.r < 0.92) { if (KH.soThu >= 3) thoi("hình hai đường khác nhau (tương quan " + KH.tq + ")"); else bao("khung", "cho", "tương quan " + KH.tq); return; }
          if (tK > tCanvas * 1.3 + 5) { thoi("chậm hơn cách cũ (" + KH.tK + " ms so với " + KH.tC + " ms)"); return; }
          // khung hình dải hẹp (16 đến 235) thì kéo về dải đủ cho giống ảnh lấy qua canvas
          KH.lut = s.ka > 1.08 && s.ka < 1.3 ? [255 / 219, -16 * 255 / 219] : null;
          KH.tt = "duoc"; KH.ly = "";
          bao("khung", "duoc", KH.dd + (opt ? "→RGBA" : ""), KH.tq, KH.tK + "/" + KH.tC);
        });
      }).catch(function (e) { coRoi = true; dong(fr); if (phien === KH.so) thoi("lỗi lúc thử: " + tenLoi(e)); });
    } catch (e) { dong(fr); thoi("lỗi lúc thử: " + tenLoi(e)); }
  };
  // chup() của quet.js gọi cho mỗi lần chụp của làn n. Trả về true: đã nhận chụp theo đường khung hình, kết quả về qua xong(cards, t1);
  // lỗi giữa chừng thì gọi lui() để lần chụp này làm lại theo canvas (làn không bị kẹt). Trả về false: quet.js chụp theo canvas.
  N.khung = function (v, n, sc, tuy, xong, lui, hong) {
    if (KH.tt !== "duoc" || !N.bat.khung) return false;
    var fr = null, t0 = bay();
    try {
      fr = new VideoFrame(v);
      var c = coKhung(fr, v);
      if ((fr.format || "?") !== KH.dd || c.lech) { dong(fr); KH.tt = "chua"; KH.dangThu = false; KH.soThu = 0; bao("khung", "doi", String(fr.format)); return false; }   // camera đổi kiểu khung: so lại từ đầu
      var kich = KH.opt ? fr.allocationSize(KH.opt) : fr.allocationSize(), buf = layBo(kich);
      var p = KH.opt ? fr.copyTo(buf, KH.opt) : fr.copyTo(buf), t1 = bay();
      n.chupMs = t1 - t0; n.kieu = "k";
      var gd = 0;   // 0: đang chờ khung hình; 1: đã có; 2: đã bỏ, lần chụp này làm lại theo canvas
      var hen = setTimeout(function () { if (gd) return; gd = 2; dong(fr); KH.hong++; thoi("khung hình không trả lời sau 1,5 giây"); lui(); }, 1500);
      p.then(function (lay) {
        if (gd) return;
        gd = 1; clearTimeout(hen);
        dong(fr); n.choMs = bay() - t1;
        RD.Quet.quetKhung({ buf: buf, dd: KH.opt ? "RGBA" : KH.dd, lay: gonLay(lay), w0: c.w0, h0: c.h0, sc: sc, lut: KH.lut }, tuy).then(function (cards) { xong(cards, t1); }, function (e) {
          if (e && e.khongLan) { hong(e); return; }   // worker của làn này không chạy: quet.js tắt làn
          KH.hong++; thoi("lỗi: " + tenLoi(e));
          lui();
        });
      }, function (e) {
        if (gd) return;
        gd = 2; clearTimeout(hen); dong(fr);
        KH.hong++; thoi("lỗi: " + tenLoi(e));
        lui();
      });
      return true;
    } catch (e) { dong(fr); KH.hong++; thoi("lỗi: " + tenLoi(e)); return false; }
  };

  /* =====================================================================
     3. PHƠI SÁNG NGẮN (chống nhòe lúc lia máy)
     ===================================================================== */
  var T_DICH = 40, T_MAX = 100, T_MIN = 5;   // đơn vị của trình duyệt: 0,1 mili giây. 4 ms; dài nhất 10 ms; ngắn nhất 0,5 ms
  var PH = N.ph = { che: "khong", ly: "chưa bật camera", T: 0, iso: 0, dich: 115, luc: 0, doc: [], tBat: 0, kn: null, track: null, dang: false, tXau: 0, soLan: 0, Ta: 0, sang: -1, lucXem: 0, so: 0 };
  function giua(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.length ? b[b.length >> 1] : 0; }
  function kepT(T) { var k = PH.kn.exposureTime, b = k.step > 0 ? k.step : 0.1; T = Math.max(k.min || 0, Math.min(k.max, T)); return Math.round(Math.round(T / b) * b * 10) / 10; }
  function kepIso(i) { var k = PH.kn.iso; return Math.round(Math.max(k.min || 50, Math.min(k.max, i))); }
  function caiDat() { try { return (PH.track && PH.track.getSettings && PH.track.getSettings()) || {}; } catch (e) { return {}; } }
  function veTuDong(che, ly) {
    var tr = PH.track;
    PH.che = che; PH.ly = ly || ""; PH.dang = false;
    if (tr) { try { tr.applyConstraints({ advanced: [{ exposureMode: "continuous" }] }).catch(function () { /* bỏ qua */ }); } catch (e) { /* bỏ qua */ } }
    bao("phoi", che, ly || "");
  }
  function dat(T, iso, ly) {
    var tr = PH.track, so = PH.so;
    if (!tr) return;
    T = kepT(T); iso = kepIso(iso);
    PH.dang = true;
    var hua;
    try { hua = tr.applyConstraints({ advanced: [{ exposureMode: "manual", exposureTime: T, iso: iso }] }); } catch (e) { hua = Promise.reject(e); }
    hua.then(function () {
      if (so !== PH.so) return;
      PH.dang = false; PH.T = T; PH.iso = iso; PH.luc = bay(); PH.soLan++;
      if (PH.che !== "tay") {
        PH.che = "tay"; PH.ly = "";
        setTimeout(function () {   // máy có thật sự chuyển sang chỉnh tay không
          if (so !== PH.so || PH.che !== "tay") return;
          var st = caiDat();
          if (st.exposureMode && st.exposureMode !== "manual") veTuDong("loi", "máy vẫn để phơi sáng tự động");
        }, 700);
      }
      bao("phoi", ly, T, iso, Math.round(PH.sang));
    }, function (e) {
      if (so !== PH.so) return;
      veTuDong("loi", "máy không nhận lệnh (" + tenLoi(e) + ")");
    });
  }
  // độ sáng trung bình v (0 đến 255) của một khung chụp lúc tc
  N.sang = function (v, tc) {
    if (!(v >= 0)) return;
    PH.sang = v;
    var t = bay(), kn = PH.kn;
    if (!PH.track || PH.dang) return;
    if (PH.che === "cho") {
      PH.doc.push(v); if (PH.doc.length > 12) PH.doc.shift();
      if (t - PH.tBat < 700 || PH.doc.length < 3 || t - PH.lucXem < 1000) return;
      PH.lucXem = t;
      var st = caiDat(), Ta = st.exposureTime > 0 ? st.exposureTime : 0, T = kepT(T_DICH);
      PH.Ta = Ta;
      if (!(Ta > 0) && t - PH.tBat < 2000) return;   // camera vừa bật chưa báo thời gian phơi (máy thầy báo 0 lúc đầu): chờ thêm, tối đa 2 giây
      if (Ta > 0 && Ta <= T * 1.2) { PH.ly = "camera đang tự phơi " + (Math.round(Ta) / 10 + "").replace(".", ",") + " ms, đủ ngắn"; return; }   // chỗ sáng: chưa cần ép, 1 giây sau xem lại
      PH.dich = Math.max(85, Math.min(150, giua(PH.doc.slice(-5))));
      dat(T, Ta > 0 ? (st.iso > 0 ? st.iso : 160) * Ta / T : 640, "bat");
      return;
    }
    if (PH.che !== "tay") return;
    if (tc < PH.luc + 250 || t - PH.luc < 400) return;   // khung chụp trước khi lệnh mới có tác dụng
    var r = PH.dich / Math.max(4, v);
    if (r < 1.19 && r > 0.84) { PH.tXau = 0; return; }
    var k = Math.pow(Math.max(0.4, Math.min(2.5, r)), 1.3), iso = PH.iso, T2 = PH.T, Td = kepT(T_DICH), Tm;
    if (k > 1) {   // cần sáng hơn: đưa phơi về 4 ms trước (nếu đang ngắn hơn), rồi tăng ISO, hết ISO mới kéo dài phơi
      if (T2 < Td) { Tm = Math.min(Td, T2 * k); k = k * T2 / Tm; T2 = Tm; }
      iso = iso * k;
      if (iso > kn.iso.max) { T2 = Math.min(kepT(T_MAX), T2 * iso / kn.iso.max); iso = kn.iso.max; }
    } else {       // cần tối đi: đưa phơi về 4 ms trước (nếu đang dài hơn), rồi giảm ISO, hết ISO mới rút ngắn phơi
      if (T2 > Td) { Tm = Math.max(Td, T2 * k); k = k * T2 / Tm; T2 = Tm; }
      iso = iso * k;
      if (iso < (kn.iso.min || 50)) { T2 = Math.max(kepT(T_MIN), T2 * iso / (kn.iso.min || 50)); iso = kn.iso.min || 50; }
    }
    T2 = kepT(T2); iso = kepIso(iso);
    if (iso === PH.iso && T2 === PH.T) {   // đã hết cỡ
      if (v < 30 || v > 238) { if (!PH.tXau) PH.tXau = t; else if (t - PH.tXau > 2500) veTuDong("loi", v < 30 ? "hình tối quá dù đã chỉnh hết cỡ" : "hình cháy sáng dù đã chỉnh hết cỡ"); }
      return;
    }
    PH.tXau = 0;
    dat(T2, iso, "chinh");
  };
  function khoiPhoi() {
    var kn = PH.kn || {};
    PH.doc = []; PH.tBat = bay(); PH.dang = false; PH.tXau = 0; PH.lucXem = 0; PH.T = 0; PH.iso = 0; PH.Ta = 0;
    if (!(kn.exposureMode && kn.exposureMode.indexOf("manual") >= 0 && kn.exposureTime && kn.exposureTime.max > 0 && kn.iso && kn.iso.max > 0)) { PH.che = "khong"; PH.ly = "máy này không cho chỉnh phơi sáng"; }
    else if (!N.bat.phoi) { PH.che = "tat"; PH.ly = ""; }
    else { PH.che = "cho"; PH.ly = ""; }
  }

  /* ---------- quet.js báo lúc bật, tắt camera ---------- */
  N.camBat = function (L) {
    LIVE = L;
    KH.so++; KH.soThu = 0; KH.dangThu = false; KH.lut = null;
    if (typeof window.VideoFrame !== "function") { KH.tt = "khong"; KH.ly = "trình duyệt không có VideoFrame"; }
    else if (!N.bat.khung) { KH.tt = "khong"; KH.ly = "đang tắt"; }
    else if (KH.hong >= 2) { KH.tt = "khong"; KH.ly = "đã lỗi 2 lần, thôi không thử nữa"; }
    else { KH.tt = "chua"; KH.ly = ""; }
    PH.so++; PH.track = L.track; PH.soLan = 0;
    try { PH.kn = L.khaNang() || {}; } catch (e) { PH.kn = {}; }
    khoiPhoi();
    bao("cam", KH.tt, PH.che, N.coCamBien() ? CB.nguon || "co" : "");
  };
  N.camTat = function () { LIVE = null; PH.so++; PH.track = null; if (PH.che === "tay" || PH.che === "cho") PH.che = "tat"; if (KH.tt !== "khong") { KH.tt = "khong"; KH.ly = "camera đã tắt"; } };
  // bật, tắt từng chỗ (máy nhớ); đổi lúc camera đang chạy thì có tác dụng ngay
  N.dat = function (ten, b) {
    if (!(ten in KHOA)) return;
    b = !!b; N.bat[ten] = b; lsSet(KHOA[ten], b ? "1" : "0");
    bao("dat", ten, b ? 1 : 0);
    if (ten === "khung" && LIVE) { if (!b) { KH.tt = "khong"; KH.ly = "đang tắt"; } else if (KH.tt === "khong" && typeof window.VideoFrame === "function") { KH.tt = "chua"; KH.ly = ""; KH.soThu = 0; KH.dangThu = false; } }
    if (ten === "phoi" && LIVE) { if (!b) { if (PH.che === "tay") veTuDong("tat", ""); else if (PH.che === "cho") PH.che = "tat"; } else if (PH.che === "tat") khoiPhoi(); }
  };
  // chữ trạng thái cho màn quét và cho số đo
  function ms1(T) { return (Math.round(T) / 10 + "").replace(".", ","); }
  N.chu = function () {
    var coLen = !!lenMay();
    var cb = !N.bat.nam ? "đang tắt" : coLen ? "đang dùng cảm biến nghiêng" : CB.nguon === "lech" ? "cảm biến nghiêng báo không khớp nhau, tạm chỉ loại thẻ nghiêng quá 60°"
      : "máy chưa báo độ nghiêng, tạm chỉ loại thẻ nghiêng quá 60°";
    var kh = !N.bat.khung ? "đang tắt" : KH.tt === "duoc" ? "đang dùng (" + KH.dd + ", " + ms1(KH.tK * 10) + " ms so với " + ms1(KH.tC * 10) + " ms cách cũ)"
      : KH.tt === "chua" ? "đang so với cách cũ…" : !LIVE ? "chờ bật camera" : "không dùng được: " + KH.ly;
    var ph = !N.bat.phoi ? "đang tắt" : PH.che === "tay" ? "đang giữ " + ms1(PH.T) + " ms, ISO " + PH.iso
      : PH.che === "cho" ? (PH.ly || "chờ camera ổn định…") : !LIVE ? "chờ bật camera" : PH.che === "khong" ? PH.ly : PH.che === "loi" ? "không ép được: " + PH.ly + "; camera tự chỉnh như cũ" : "đang tắt";
    return { nam: cb, khung: kh, phoi: ph };
  };
  // gắn 3 ô bật tắt trên màn quét
  function gan() {
    [["nam", "#dtLocNam"], ["khung", "#dtKhung"], ["phoi", "#dtPhoiNgan"]].forEach(function (x) {
      var o = document.querySelector(x[1]);
      if (!o) return;
      o.checked = N.bat[x[0]];
      o.addEventListener("change", function () { N.dat(x[0], o.checked); ve(); });
    });
    ve();
    setInterval(ve, 700);
  }
  function ve() {
    var c = N.chu();
    [["#dtLocNamTT", c.nam], ["#dtKhungTT", c.khung], ["#dtPhoiNganTT", c.phoi]].forEach(function (x) {
      var e = document.querySelector(x[0]);
      if (e && e.textContent !== x[1]) e.textContent = x[1];
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gan); else gan();
})();
