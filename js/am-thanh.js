/* Rước đuốc: tiếng động tự tạo bằng Web Audio (trống, tiếng lửa, kèn) và nhạc nền "Fireflies over the Festival" (bản Suno của thầy Thịnh), lặp liền mạch */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var A = RD.AmThanh = { bat: true, muc: 1 };
  var ac = null, tong = null, nhieu = null;
  try { A.bat = localStorage.getItem("rd-am") !== "0"; } catch (e) { /* bỏ qua */ }
  // 6/11 chiều, thầy Thịnh: "trong game có nút tăng giảm âm lượng". muc: 0 … 1, mỗi nấc 10%, nhớ trên máy.
  //   6/11 trưa: "tăng giảm âm lượng cho tối đa là 100 thôi" (trước cho tới 150%; số cũ lớn hơn 100% thì về 100%)
  try { var m0 = parseFloat(localStorage.getItem("rd-am-muc")); if (m0 >= 0) A.muc = Math.min(1, m0); } catch (e) { /* bỏ qua */ }
  var DO_TO = 0.9;
  function doTo() { return A.bat ? DO_TO * A.muc : 0; }

  // chỉ gọi sau một lần chạm hoặc bấm phím (trình duyệt chặn âm thanh tự phát)
  A.mo = function () {
    if (!ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      ac = new C();
      tong = ac.createGain();
      tong.gain.value = doTo();
      var nen = ac.createDynamicsCompressor();
      tong.connect(nen); nen.connect(ac.destination);
      var len = ac.sampleRate * 1.5, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      nhieu = b;
    }
    if (ac.state === "suspended") ac.resume();
    giaiMaNhac();
    giaiMaVoTay();
  };

  /* ---------- nhạc nền ---------- */
  // muc: độ to mong muốn (0..1) theo bước chơi; batNhac: nút tắt/bật nhạc (điện thoại hoặc TV)
  var NH = { url: "nhac/nhac-nen.ogg", tai: null, buf: null, src: null, g: null, muc: 0, batNhac: true, dangGiai: false };
  A.taiNhac = function (url) {
    if (url) NH.url = url;
    if (NH.tai) return;
    NH.tai = fetch(NH.url).then(function (r) { if (!r.ok) throw new Error("nhac " + r.status); return r.arrayBuffer(); })
      .then(function (ab) { NH.ab = ab; giaiMaNhac(); })
      .catch(function () { NH.tai = null; });
  };
  function giaiMaNhac() {
    if (!ac || !NH.ab || NH.buf || NH.dangGiai) return;
    NH.dangGiai = true;
    var ab = NH.ab;
    var xong = function (b) { NH.buf = b; NH.ab = null; NH.dangGiai = false; capNhatNhac(1.2); };
    var p = ac.decodeAudioData(ab, xong, function () { NH.dangGiai = false; });
    if (p && p.then) p.catch(function () { NH.dangGiai = false; });
  }
  function capNhatNhac(giay) {
    if (!ac || !NH.buf) return;
    var dich = NH.batNhac ? NH.muc : 0;
    if (!NH.src && dich > 0) {
      NH.g = ac.createGain();
      NH.g.gain.value = 0.0001;
      NH.g.connect(tong);
      NH.src = ac.createBufferSource();
      NH.src.buffer = NH.buf;
      NH.src.loop = true;
      NH.src.connect(NH.g);
      NH.src.start();
    }
    if (NH.g) NH.g.gain.setTargetAtTime(Math.max(0.0001, dich), ac.currentTime, (giay || 0.8) / 3);
  }
  // độ to nhạc: 0 tắt, 0.22 bình thường, 0.08 khi học sinh nêu cách làm (5/11: nhỏ lại theo ý thầy Thịnh, trước là 0.32 và 0.12)
  A.nhacMuc = function (muc, giay) { NH.muc = muc; capNhatNhac(giay); };
  A.batNhac = function (on) { NH.batNhac = !!on; capNhatNhac(0.6); };
  A.nhacDangBat = function () { return NH.batNhac; };
  A.datBat = function (on) {
    A.bat = !!on;
    try { localStorage.setItem("rd-am", on ? "1" : "0"); } catch (e) { /* bỏ qua */ }
    if (tong) tong.gain.setTargetAtTime(doTo(), ac.currentTime, 0.05);
  };
  // đặt độ to (0 … 1); trả về độ to mới. Đang tắt tiếng mà bấm tăng thì bật lại tiếng
  A.MUC_MAX = 1;
  A.datMuc = function (v) {
    A.muc = Math.round(Math.max(0, Math.min(A.MUC_MAX, v)) * 10) / 10;
    try { localStorage.setItem("rd-am-muc", String(A.muc)); } catch (e) { /* bỏ qua */ }
    if (tong) tong.gain.setTargetAtTime(doTo(), ac.currentTime, 0.05);
    return A.muc;
  };
  function san() { return ac && ac.state === "running" && A.bat && A.muc > 0; }
  function ra(node, gain, t, len) {
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    node.connect(g); g.connect(tong);
    return g;
  }
  function tiengNhieu(t, len, loc, f1, f2, q, gain) {
    var s = ac.createBufferSource();
    s.buffer = nhieu;
    var f = ac.createBiquadFilter();
    f.type = loc; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f1, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + len);
    s.connect(f);
    ra(f, gain, t, len);
    s.start(t, Math.random() * 0.5);
    s.stop(t + len + 0.05);
  }
  // một tiếng trống hội êm: mạnh 0..1
  // (5/11: thầy Thịnh thấy tiếng trống cũ nghe như tiếng nổ, nhức đầu. Bỏ tiếng rền sâu 48 Hz và tiếng xoẹt nhiễu,
  //  trống giờ tròn tiếng hơn, nhỏ hơn và chỉ còn ở lúc mở đầu, về đích, báo tường)
  A.trong = function (manh, luc) {
    if (!san()) return;
    var t = luc || ac.currentTime, m = (manh == null ? 1 : manh) * 0.55;
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(175, t);
    o.frequency.exponentialRampToValueAtTime(98, t + 0.22);
    ra(o, 0.7 * m, t, 0.38);
    o.start(t); o.stop(t + 0.42);
    var o2 = ac.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(350, t);
    o2.frequency.exponentialRampToValueAtTime(230, t + 0.07);
    ra(o2, 0.1 * m, t, 0.09);
    o2.start(t); o2.stop(t + 0.11);
  };
  // âm giai ngũ cung Đô Rê Mi Son La (quãng tám 5 và 6) cho tiếng mộc cầm
  var NGU = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  // một tiếng gõ mộc cầm êm (thay tiếng trống khi mảnh ghép đáp xuống cầu); bac: bậc trong âm giai, mạnh 0..1
  A.go = function (bac, manh, luc) {
    if (!san()) return;
    var t = luc || ac.currentTime, m = manh == null ? 1 : manh;
    var f = NGU[Math.max(0, Math.min(NGU.length - 1, bac | 0))];
    var o = ac.createOscillator();
    o.type = "sine"; o.frequency.value = f;
    ra(o, 0.1 * m, t, 0.5);
    o.start(t); o.stop(t + 0.55);
    var o2 = ac.createOscillator();     // tiếng gõ nhẹ đầu nốt (mộc cầm có họa âm gần gấp 4)
    o2.type = "sine"; o2.frequency.value = f * 3.93;
    ra(o2, 0.018 * m, t, 0.06);
    o2.start(t); o2.stop(t + 0.09);
  };
  // chuông nhỏ trong trẻo, ngân nhẹ (như hộp nhạc)
  A.chuong = function (manh, luc) {
    if (!san()) return;
    var t = luc || ac.currentTime, m = manh == null ? 1 : manh;
    [[1046.5, 0.065, 1.3], [2093, 0.019, 0.8], [3139.5, 0.009, 0.45]].forEach(function (p) {
      var o = ac.createOscillator();
      o.type = "sine"; o.frequency.value = p[0];
      ra(o, p[1] * m, t, p[2]);
      o.start(t); o.stop(t + p[2] + 0.05);
    });
  };
  // báo câu hỏi mới: hai nốt mộc cầm Son, Đô và một tiếng chuông
  A.baoCau = function () {
    if (!san()) return;
    var t = ac.currentTime;
    A.go(3, 0.25, t); A.go(5, 0.28, t + 0.16); A.chuong(0.17, t + 0.16);
  };
  // trống dồn: dài (giây), tiếng dồn nhanh dần
  A.trongDon = function (dai) {
    if (!san()) return;
    var t = ac.currentTime, het = t + (dai || 0.8), k = 0.16;
    while (t < het) { A.trong(0.28 + 0.4 * (1 - (het - t) / (dai || 0.8)), t); t += k; k = Math.max(0.05, k * 0.82); }
  };
  A.tich = function () {
    if (!san()) return;
    var t = ac.currentTime, o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1320, t);
    o.frequency.exponentialRampToValueAtTime(1760, t + 0.05);
    ra(o, 0.16, t, 0.09);
    o.start(t); o.stop(t + 0.1);
  };
  A.buoc = function () {
    if (!san()) return;
    tiengNhieu(ac.currentTime, 0.07, "bandpass", 500, 260, 1.2, 0.12);
  };
  A.vut = function () {
    if (!san()) return;
    tiengNhieu(ac.currentTime, 0.9, "bandpass", 300, 2400, 1.4, 0.3);
  };
  // đuốc bén lửa: tiếng "phừng" nhẹ và một tiếng chuông (trước đây là tiếng nổ trầm kèm trống; 6/11 bỏ tiếng lách tách)
  A.bungLua = function () {
    if (!san()) return;
    var t = ac.currentTime;
    tiengNhieu(t, 0.8, "bandpass", 450, 1500, 0.9, 0.2);
    A.chuong(0.6, t + 0.12);
  };
  A.lachTach = function (dai) {
    if (!san()) return;
    var t = ac.currentTime, het = t + (dai || 2);
    while (t < het) { tiengNhieu(t, 0.03, "highpass", 2500, 0, 0.7, 0.05 + Math.random() * 0.08); t += 0.04 + Math.random() * 0.15; }
  };
  // khúc vui ngắn: hợp âm rải Đô Mi Son Đô bằng tiếng mộc cầm, nốt cuối ngân như chuông
  // (trước đây là tiếng kèn răng cưa, nghe chói)
  A.ken = function () {
    if (!san()) return;
    var t = ac.currentTime;
    [0, 2, 3, 5].forEach(function (b, i) { A.go(b, i === 3 ? 0.5 : 0.4, t + i * 0.14); });
    A.chuong(0.45, t + 0.42);
  };
  // "ting" khi quét xong (5/11: nhỏ lại, trước là 0.22, to nhất trong các tiếng)
  A.ting = function () {
    if (!san()) return;
    var t = ac.currentTime;
    [[1318.5, 0], [1975.5, 0.11]].forEach(function (n) {
      var o = ac.createOscillator();
      o.type = "sine"; o.frequency.value = n[0];
      ra(o, 0.065, t + n[1], 0.7);
      o.start(t + n[1]); o.stop(t + n[1] + 0.75);
    });
  };
  // tiếng cả lớp vỗ tay khi bạn về nhất bước lên thảm VỀ ĐÍCH (6/11 thầy Thịnh: "bạn về nhất thì có tiếng vỗ tay").
  //   6/11 trưa: "tiếng vỗ tay hiện tại nghe ghê quá đổi đi": bỏ tiếng vỗ tay tự tạo bằng nhiễu, dùng bản thu thật:
  //   nhac/vo-tay.ogg (6,25 giây, vỗ tay to dần rồi thưa dần), cắt từ "Applause in a large hall or church" của eXpl0it3r
  //   trên OpenGameArt.org, giấy phép CC0 (dùng tự do). Tải sẵn lúc mở trang, giải mã sau lần chạm đầu tiên.
  var VT = { url: "nhac/vo-tay.ogg", tai: null, ab: null, buf: null, dangGiai: false };
  A.taiVoTay = function (url) {
    if (url) VT.url = url;
    if (VT.tai || VT.buf) return;
    VT.tai = fetch(VT.url).then(function (r) { if (!r.ok) throw new Error("vo tay " + r.status); return r.arrayBuffer(); })
      .then(function (ab) { VT.ab = ab; giaiMaVoTay(); })
      .catch(function () { VT.tai = null; });
  };
  function giaiMaVoTay() {
    if (!ac || !VT.ab || VT.buf || VT.dangGiai) return;
    VT.dangGiai = true;
    var ab = VT.ab;
    var xong = function (b) { VT.buf = b; VT.ab = null; VT.dangGiai = false; };
    var p = ac.decodeAudioData(ab, xong, function () { VT.dangGiai = false; });
    if (p && p.then) p.catch(function () { VT.dangGiai = false; });
  }
  A.coVoTay = function () { return !!VT.buf; };
  A.voTay = function (manh) {
    if (!san() || !VT.buf) return;
    var s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = VT.buf;
    g.gain.value = 0.55 * (manh == null ? 1 : manh);     // to hơn nhạc nền khoảng 4 dB (đo độ to LUFS của hai tệp)
    s.connect(g); g.connect(tong);
    s.start(ac.currentTime);
  };
  A.lapLanh = function () {
    if (!san()) return;
    var t = ac.currentTime;
    for (var i = 0; i < 9; i++) {
      var o = ac.createOscillator(), at = t + i * 0.07 + Math.random() * 0.04;
      o.type = "sine";
      o.frequency.value = 1500 + Math.random() * 1800;
      ra(o, 0.045, at, 0.25);
      o.start(at); o.stop(at + 0.3);
    }
  };
})();
