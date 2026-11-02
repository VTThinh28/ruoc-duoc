/* Rước đuốc về trường: âm thanh tự tạo bằng Web Audio (trống, tiếng lửa, kèn), không cần file nhạc */
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
    }
    if (ac.state === "suspended") ac.resume();
  };
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
  // một tiếng trống hội: mạnh 0..1
  A.trong = function (manh, luc) {
    if (!san()) return;
    var t = luc || ac.currentTime, m = manh == null ? 1 : manh;
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.32);
    ra(o, 0.9 * m, t, 0.55);
    o.start(t); o.stop(t + 0.6);
    var o2 = ac.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(190, t);
    o2.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    ra(o2, 0.35 * m, t, 0.18);
    o2.start(t); o2.stop(t + 0.2);
    tiengNhieu(t, 0.12, "lowpass", 900, 200, 0.7, 0.35 * m);
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
    ra(o, 0.25, t, 0.09);
    o.start(t); o.stop(t + 0.1);
  };
  A.buoc = function () {
    if (!san()) return;
    tiengNhieu(ac.currentTime, 0.07, "bandpass", 500, 260, 1.2, 0.12);
  };
  A.vut = function () {
    if (!san()) return;
    tiengNhieu(ac.currentTime, 0.9, "bandpass", 300, 2400, 1.4, 0.5);
  };
  A.bungLua = function () {
    if (!san()) return;
    var t = ac.currentTime;
    tiengNhieu(t, 1.6, "lowpass", 2400, 300, 0.6, 0.8);
    A.trong(1, t);
  };
  A.lachTach = function (dai) {
    if (!san()) return;
    var t = ac.currentTime, het = t + (dai || 2);
    while (t < het) { tiengNhieu(t, 0.03, "highpass", 2500, 0, 0.7, 0.05 + Math.random() * 0.08); t += 0.04 + Math.random() * 0.15; }
  };
  // kèn: hợp âm đi lên, vui
  A.ken = function () {
    if (!san()) return;
    var t = ac.currentTime, not = [[523.25, 0], [659.25, 0.16], [783.99, 0.32], [1046.5, 0.5]];
    not.forEach(function (n, i) {
      [1, 1.005].forEach(function (lech) {
        var o = ac.createOscillator(), f = ac.createBiquadFilter();
        o.type = "sawtooth";
        o.frequency.value = n[0] * lech;
        f.type = "lowpass"; f.frequency.value = 2200;
        o.connect(f);
        ra(f, i === 3 ? 0.16 : 0.12, t + n[1], i === 3 ? 1.4 : 0.32);
        o.start(t + n[1]); o.stop(t + n[1] + 1.5);
      });
    });
  };
  A.lapLanh = function () {
    if (!san()) return;
    var t = ac.currentTime;
    for (var i = 0; i < 9; i++) {
      var o = ac.createOscillator(), at = t + i * 0.07 + Math.random() * 0.04;
      o.type = "sine";
      o.frequency.value = 1500 + Math.random() * 1800;
      ra(o, 0.06, at, 0.25);
      o.start(at); o.stop(at + 0.3);
    }
  };
})();
