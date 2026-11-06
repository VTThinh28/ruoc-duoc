/* Rước đuốc: tiếng động tự tạo bằng Web Audio (trống, tiếng lửa, kèn) và nhạc nền "Fireflies over the Festival" (bản Suno của thầy Thịnh), lặp liền mạch */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var A = RD.AmThanh = { bat: true };
  var ac = null, tong = null, nhieu = null;
  try { A.bat = localStorage.getItem("rd-am") !== "0"; } catch (e) { /* bỏ qua */ }

  // chỉ gọi sau một lần chạm hoặc bấm phím (trình duyệt chặn âm thanh tự phát)
  A.mo = function () {
    if (!ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      ac = new C();
      tong = ac.createGain();
      tong.gain.value = A.bat ? 0.9 : 0;
      var nen = ac.createDynamicsCompressor();
      tong.connect(nen); nen.connect(ac.destination);
      var len = ac.sampleRate * 1.5, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      nhieu = b;
      setTimeout(function () { if (!voTayBuf) voTayBuf = taoVoTay(); }, 2000);   // tạo sẵn tiếng vỗ tay lúc rảnh
    }
    if (ac.state === "suspended") ac.resume();
    giaiMaNhac();
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
    if (tong) tong.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.05);
  };
  function san() { return ac && ac.state === "running" && A.bat; }
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
  // tiếng cả lớp vỗ tay (6/11 thầy Thịnh: "bạn về nhất thì có tiếng vỗ tay"): khoảng 20 bạn vỗ lệch nhịp nhau,
  // ngồi rải trái phải, to dần rồi thưa dần trong hơn 3 giây. Tạo một lần thành đoạn âm thanh rồi phát lại.
  var voTayBuf = null;
  function taoVoTay() {
    var sr = ac.sampleRate, dai = 3.6, n = Math.floor(sr * dai), dv = Math.floor(sr * 0.026);
    var b = ac.createBuffer(2, n, sr), L = b.getChannelData(0), R = b.getChannelData(1);
    for (var p = 0; p < 20; p++) {
      var bd = Math.random() * 0.3, kt = 1.6 + Math.random() * 1.8;          // lúc bạn này bắt đầu và thôi vỗ
      var nhip = 1 / (3.2 + Math.random() * 1.8), to = 0.55 + Math.random() * 0.45;
      var goc = Math.random() * Math.PI / 2, gl = Math.cos(goc), gr = Math.sin(goc);
      var fc = 900 + Math.random() * 1200;                                   // mỗi đôi bàn tay một giọng
      for (var t = bd; t < Math.min(kt, dai - 0.05); t += nhip * (0.88 + Math.random() * 0.24)) {
        var tang = t < 0.3 ? t / 0.3 : 1, giam = kt - t < 0.7 ? (kt - t) / 0.7 : 1;
        var a = to * Math.max(0, Math.min(tang, giam)) * (0.75 + Math.random() * 0.25);
        if (a < 0.03) continue;
        // một tiếng vỗ: nhiễu ngắn tắt nhanh, lọc dải quanh giọng của bạn đó
        var f = fc * (0.9 + Math.random() * 0.2), Q = 1 + Math.random() * 0.8, w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * Q), a0 = 1 + al;
        var b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
        var tat = Math.exp(-1 / (sr * (0.003 + Math.random() * 0.003))), vao = sr * 0.0005, bao = 1;
        var x1 = 0, x2 = 0, y1 = 0, y2 = 0, o = Math.floor(t * sr);
        for (var k = 0; k < dv && o + k < n; k++, bao *= tat) {
          var x = (Math.random() * 2 - 1) * bao * (k < vao ? k / vao : 1);
          var y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
          x2 = x1; x1 = x; y2 = y1; y1 = y;
          var v = a * (y + 0.08 * x);            // thêm chút tiếng giòn, không để rít
          L[o + k] += v * gl; R[o + k] += v * gr;
        }
      }
    }
    var dinh = 0, i;
    for (i = 0; i < n; i++) dinh = Math.max(dinh, Math.abs(L[i]), Math.abs(R[i]));
    if (dinh > 0) for (i = 0; i < n; i++) { L[i] /= dinh; R[i] /= dinh; }
    return b;
  }
  A.voTay = function (manh) {
    if (!san()) return;
    if (!voTayBuf) voTayBuf = taoVoTay();
    var s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = voTayBuf;
    g.gain.value = 0.38 * (manh == null ? 1 : manh);     // nhỉnh hơn nhạc nền một chút
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
