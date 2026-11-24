/* Tranh 3D của trang Xếp thiệp ("Tấm thiệp của nhóm em"). Chỉ tivi dùng.
   Thầy Thịnh, 14/11 16:27: "khi nhóm bấm hoàn thành thì sẽ hiện lên hình hoàn thiện trước, còn hoạt ảnh là do tôi bấm là người quyết định bấm hay không nhé".
   15/11 13:19: "phần hoạt ảnh đổi tên thành tranh 3D tôi sẽ bấm cho từng nhóm. khi cả 4 nhóm được bấm hoạt ảnh thì sẽ hiện pháo bông
   nhưng không hiện dòng chúc mừng 51 năm và không cần làm tối màu. chỉ hiện pháo bông là đủ."
   25/11 06:02, thầy: "bỏ cái pháo hoa đi nhé" → trang KHÔNG còn pháo hoa; phần vẽ pháo đã gỡ khỏi file này (bản có pháo: ban-cu/site-25-11-truoc-khi-bo-phao-hoa/).
   Hoạt ảnh lấy nguyên từ video mô phỏng bản 4 (tro-choi-cuoi-gio/thiep-song-day/hieu-ung-thay-bam-15-11/nguon/ve.js):
   vẽ bằng canvas, đơn vị cm trên tấm thiệp, t = số giây từ lúc thầy bấm, a = 0 (đứng yên) .. 1 (chạy đủ).
   File này chỉ có phần vẽ và phần so hình; nút bấm, đếm nhóm, vòng lặp nằm trong xep-thiep.js (chayTivi). */
(function () {
'use strict';
const NET = '#4d4541';
const deg = Math.PI / 180, PI2 = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const muot = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const raNhanh = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const frac = x => x - Math.floor(x);
const lerp = (a, b, x) => a + (b - a) * x;
function rnd(i, j) { const s = Math.sin(i * 127.1 + j * 311.7 + 17.3) * 43758.5453; return s - Math.floor(s); }
const gio = (t, s) => Math.sin(PI2 * t / 3.1 + s) * 0.6 + Math.sin(PI2 * t / 1.27 + 1.7 * s) * 0.3 + Math.sin(PI2 * t / 0.61 + 2.9 * s) * 0.1;
const giua = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function tam(pts) { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; }
let UPX = 1;   // điểm ảnh thật trên 1 cm thiệp (dùng cho độ nhòe)

function duong(c, pts) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
function veManh(c, pts, mau) { duong(c, pts); c.fillStyle = mau; c.fill(); c.lineWidth = 0.09; c.strokeStyle = NET; c.lineJoin = 'round'; c.stroke(); }
function xoay(c, ox, oy, rad) { c.translate(ox, oy); c.rotate(rad); c.translate(-ox, -oy); }
function quang(c, x, y, r, rgb, al) {
  if (al <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(0.45, `rgba(${rgb},${al * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function sao4(c, x, y, r, al, rgb = '255,255,255') {
  if (al <= 0 || r <= 0) return;
  c.save(); c.translate(x, y);
  c.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.22 : r, an = i * Math.PI / 4 - Math.PI / 2; i ? c.lineTo(rr * Math.cos(an), rr * Math.sin(an)) : c.moveTo(rr * Math.cos(an), rr * Math.sin(an)); }
  c.closePath(); c.fillStyle = `rgba(${rgb},${al})`; c.shadowColor = `rgba(${rgb},${al})`; c.shadowBlur = 0.25 * UPX; c.fill();
  c.restore();
}
// ngôi sao vàng 5 cánh (một cánh hướng lên)
function sao5(c, x, y, R, al, mau) {
  if (al <= 0) return;
  c.save(); c.translate(x, y); c.globalAlpha = al; c.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.382 : R, an = -Math.PI / 2 + i * Math.PI / 5; i ? c.lineTo(r * Math.cos(an), r * Math.sin(an)) : c.moveTo(r * Math.cos(an), r * Math.sin(an)); }
  c.closePath(); c.fillStyle = mau; c.shadowColor = 'rgba(255,232,120,0.95)'; c.shadowBlur = 0.3 * UPX; c.fill(); c.shadowBlur = 0;
  c.lineJoin = 'round'; c.lineWidth = 0.04; c.strokeStyle = 'rgba(196,128,20,0.75)'; c.stroke();
  c.restore();
}
// ngọn lửa mềm vẽ bên trong một mảnh, từ gốc B hướng tới ngọn T
function luaTrong(c, B, T, w, t, hat, al, vien) {
  if (al <= 0) return;
  const dx = T[0] - B[0], dy = T[1] - B[1], L = Math.hypot(dx, dy);
  c.save();
  if (vien) { duong(c, vien); c.clip(); }
  c.translate(B[0], B[1]); c.rotate(Math.atan2(dy, dx));
  const f = 0.74 + 0.07 * Math.sin(t * 9.1 + hat) + 0.05 * Math.sin(t * 14.3 + hat * 2.3);
  const len = L * f, lech = 0.07 * w * Math.sin(t * 6.3 + hat * 1.7);
  for (const [k, rgb, aa] of [[1, '255,222,110', 0.5], [0.7, '255,240,165', 0.62], [0.42, '255,252,228', 0.8]]) {
    const l = len * k, ww = w * k * 0.5, x0 = L * 0.05;
    c.beginPath(); c.moveTo(x0, 0);
    c.bezierCurveTo(l * 0.22, -ww * 1.2, l * 0.62, -ww * 0.85 + lech, l, lech * 1.6);
    c.bezierCurveTo(l * 0.62, ww * 0.85 + lech, l * 0.22, ww * 1.2, x0, 0);
    c.fillStyle = `rgba(${rgb},${aa * al})`; c.shadowColor = `rgba(${rgb},${aa * al})`; c.shadowBlur = 0.35 * UPX; c.fill();
  }
  c.restore();
}
// tàn lửa bay lên
function tanLua(c, t, a, o) {
  for (let i = 0; i < o.n; i++) {
    const P = 1.7 + 1.7 * rnd(i, o.hat), u = frac(t / P + rnd(i, o.hat + 1));
    const x = lerp(o.x0, o.x1, rnd(i, o.hat + 2)) + 0.7 * Math.sin(t * 1.4 + i * 1.3) * u;
    const y = lerp(o.y0, o.y1, rnd(i, o.hat + 5)) - o.len * (0.45 + 0.55 * rnd(i, o.hat + 3)) * u;
    const al = a * Math.pow(Math.sin(Math.PI * u), 1.4) * 0.95, r = 0.07 + 0.08 * rnd(i, o.hat + 4);
    if (al <= 0.01) continue;
    if (i % 5 === 0) sao4(c, x, y, r * 4.2, al, '255,176,50');      // 16/11: nền sáng nên tàn lửa màu cam đậm hơn (trước là vàng nhạt trên nền tối)
    else { c.beginPath(); c.arc(x, y, r, 0, PI2); c.fillStyle = `rgba(255,${140 + Math.round(50 * rnd(i, 9))},${30 + Math.round(50 * rnd(i, 8))},${al})`; c.shadowColor = `rgba(255,160,60,${al})`; c.shadowBlur = 0.2 * UPX; c.fill(); c.shadowBlur = 0; }
  }
}
function phu(c, d, rgbTren, rgbDuoi, a1, a2) {
  const g = c.createLinearGradient(0, 0, 0, d.cm[1]);
  g.addColorStop(0, `rgba(${rgbTren},${a1})`); g.addColorStop(1, `rgba(${rgbDuoi},${a2})`);
  c.fillStyle = g; c.fillRect(-60, -60, d.cm[0] + 120, d.cm[1] + 120);
}

// ---------------------------------------------------------------- hoạt ảnh từng thiệp (đơn vị cm trên thiệp)
const HX = {};

// bông hoa nở: các cánh xoè dần từ một cái nụ (không phóng to cả bông)
function hoaNo(c, x, y, R, huong, tau, al, mau, t, hat) {
  if (al <= 0 || tau <= 0) return;
  c.save(); c.translate(x, y);
  const hien = al * Math.min(1, tau / 0.2);
  [[9, 1, 0, mau[0], mau[1]], [6, 0.63, 0.45, mau[2], mau[3]]].forEach(([n, k, tre, m0, m1], li) => {
    if (tau < tre) return;
    const p = muot((tau - tre) / 0.95);
    c.globalAlpha = hien * Math.min(1, (tau - tre) / 0.2);
    for (let i = 0; i < n; i++) {
      const lechGoc = PI2 * (i + (li ? 0.5 : 0)) / n - Math.PI + Math.PI / n;      // -π..π quanh hướng nụ
      const goc = huong + lechGoc * p + 0.05 * Math.sin(t * 2.3 + i * 1.7 + hat) * p;
      const L = R * k * (0.6 + 0.4 * p), w = R * k * (0.17 + 0.2 * p);
      c.save(); c.rotate(goc);
      const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, m0); g.addColorStop(1, m1);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(L * 0.3, -w, L * 0.82, -w * 0.85, L, 0); c.bezierCurveTo(L * 0.82, w * 0.85, L * 0.3, w, 0, 0);
      c.fillStyle = g; c.shadowColor = 'rgba(90,40,30,0.3)'; c.shadowBlur = 0.12 * UPX; c.fill();
      c.restore();
    }
  });
  const pn = muot((tau - 0.95) / 0.4);
  if (pn > 0) {
    c.globalAlpha = al * pn; c.shadowColor = 'rgba(120,70,10,0.4)'; c.shadowBlur = 0.1 * UPX;
    c.beginPath(); c.arc(0, 0, R * 0.2, 0, PI2); c.fillStyle = mau[4]; c.fill(); c.shadowBlur = 0;
    for (let i = 0; i < 6; i++) { const an = PI2 * i / 6 + 0.3; c.beginPath(); c.arc(R * 0.11 * Math.cos(an), R * 0.11 * Math.sin(an), R * 0.035, 0, PI2); c.fillStyle = mau[5]; c.fill(); }
  }
  c.restore();
  // vài đốm sáng lúc hoa vừa nở
  const u = (tau - 0.9) / 0.8;
  if (u > 0 && u < 1) for (let i = 0; i < 4; i++) { const an = PI2 * (i + 0.3 * hat) / 4 + 0.6; sao4(c, x + R * (1.05 + 0.35 * u) * Math.cos(an), y + R * (1.05 + 0.35 * u) * Math.sin(an), 0.5 * Math.sin(Math.PI * u), al * Math.sin(Math.PI * u), '255,244,190'); }
}
// gân lá hiện dần từ cuống tới ngọn
function ganLa(c, m, p, al) {
  if (p <= 0 || al <= 0) return;
  const A = giua(m[0], m[3]), B = giua(m[1], m[2]), nx = (m[3][0] - m[0][0]) / 2, ny = (m[3][1] - m[0][1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1];
  c.save(); duong(c, m); c.clip(); c.lineCap = 'round'; c.strokeStyle = `rgba(36,112,44,${0.6 * al})`;
  c.beginPath(); c.moveTo(A[0] + dx * 0.04, A[1] + dy * 0.04); c.lineTo(A[0] + dx * 0.96 * p, A[1] + dy * 0.96 * p); c.lineWidth = 0.13; c.stroke();
  for (const f of [0.22, 0.44, 0.66]) {
    const q = muot((p - f) / 0.25); if (q <= 0) continue;
    const x0 = A[0] + dx * f, y0 = A[1] + dy * f;
    for (const dau of [-1, 1]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (dau * nx * 0.78 + dx * 0.13) * q, y0 + (dau * ny * 0.78 + dy * 0.13) * q); c.lineWidth = 0.09; c.stroke(); }
  }
  c.restore();
}
// chiếc nơ mở dần hai cánh từ chỗ gập (không phóng to)
function noBuoc(c, x, y, s, p, al) {
  if (al <= 0) return;
  c.save(); c.translate(x, y); c.globalAlpha = al; c.shadowColor = 'rgba(110,50,10,0.35)'; c.shadowBlur = 0.14 * UPX;
  for (const dau of [-1, 1]) {   // hai dải nơ rủ xuống
    const dai = s * 1.45 * p;
    c.beginPath(); c.moveTo(dau * s * 0.1, 0); c.lineTo(dau * (s * 0.1 + dai * 0.42), dai); c.lineTo(dau * (s * 0.1 + dai * 0.42 + s * 0.2), dai * 0.82); c.lineTo(dau * (s * 0.1 + dai * 0.42 + s * 0.42), dai * 0.95); c.lineTo(dau * s * 0.42, 0); c.closePath();
    c.fillStyle = '#f2a93b'; c.fill();
  }
  for (const dau of [-1, 1]) {   // hai cánh nơ
    const goc = dau > 0 ? lerp(78, -14, p) * deg : lerp(102, 194, p) * deg;
    c.save(); c.rotate(goc);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s * 0.45, -s * 0.78, s * 1.3, -s * 0.62, s * 1.24, 0); c.bezierCurveTo(s * 1.3, s * 0.62, s * 0.45, s * 0.78, 0, 0);
    c.fillStyle = '#ffd54a'; c.fill();
    c.shadowBlur = 0; c.beginPath(); c.moveTo(s * 0.12, 0); c.bezierCurveTo(s * 0.45, -s * 0.36, s * 0.92, -s * 0.3, s * 0.9, 0); c.bezierCurveTo(s * 0.92, s * 0.3, s * 0.45, s * 0.36, s * 0.12, 0);
    c.fillStyle = '#f2a93b'; c.fill();
    c.restore(); c.shadowBlur = 0.14 * UPX;
  }
  c.beginPath(); c.roundRect(-s * 0.26, -s * 0.3, s * 0.52, s * 0.6, s * 0.16); c.fillStyle = '#ffe27a'; c.fill();
  c.restore();
}
const MAU_HOA = {
  do: ['#ff6a60', '#ffc4bc', '#ff9a90', '#ffe3de', '#ffd95a', '#e08a1f'],
  cam: ['#ff982b', '#ffd27a', '#ffb84d', '#ffe9b5', '#c9553a', '#7a2e1c'],
  hong: ['#e2457f', '#f9a8c6', '#ee6f9e', '#fdd6e4', '#ffe07a', '#d98a1f'],
};

// Ô 1: bó hoa. Hoa nở trên từng mảnh hoa, lá hiện gân, nơ thắt trên dải băng, rồi hoa lá đung đưa, cánh hoa rơi, một cánh bướm.
HX['1'] = function (c, t, a, P, M, d) {
  [5, 4, 6].forEach(i => veManh(c, P[i], M[i]));
  if (a > 0) {   // nếp giấy gói và chiếc nơ
    const p = muot((t - 1.7) / 0.7);
    if (p > 0) {
      c.save(); duong(c, P[4]); c.clip(); c.lineCap = 'round'; c.lineWidth = 0.1; c.strokeStyle = `rgba(214,112,136,${0.6 * a})`;
      for (const [x0, x1] of [[10.6, 13.3], [14.5, 14.5], [18.4, 15.7]]) { c.beginPath(); c.moveTo(x0, 19.5); c.lineTo(lerp(x0, x1, p), 19.5 + 4 * p); c.stroke(); }
      c.restore();
    }
  }
  const g = s => a * gio(t * 0.9, s), goc = [14.5, 19.5];
  const huongRa = m => { const ct = tam(m); return Math.atan2(ct[1] - goc[1], ct[0] - goc[0]); };
  // lá
  for (const [i, o, s] of [[9, P[9][0], 0.2], [10, P[10][3], 0.9]]) {
    c.save(); xoay(c, o[0], o[1], 4.2 * deg * g(s)); veManh(c, P[i], M[i]); ganLa(c, P[i], muot((t - 0.5 - s * 0.3) / 0.9), a); c.restore();
  }
  // hoa vàng (2 hình vuông)
  for (const [i, o, s, t0] of [[7, P[7][2], 0.5, 0.8], [8, P[8][1], 1.2, 1.05]]) {
    const ct = tam(P[i]);
    c.save(); xoay(c, o[0], o[1], 2.8 * deg * g(s)); veManh(c, P[i], M[i]); hoaNo(c, ct[0], ct[1], 1.8, huongRa(P[i]), t - t0, a, MAU_HOA.cam, t, i); c.restore();
  }
  // nụ hồng (2 hình thoi nhỏ)
  for (const [i, o, s, t0] of [[2, P[2][0], 1.6, 1.4], [3, P[3][3], 2.3, 1.65]]) {
    const ct = tam(P[i]);
    c.save(); xoay(c, goc[0], goc[1], 2.6 * deg * g(s - 0.3)); xoay(c, o[0], o[1], 3.2 * deg * g(s + 1)); veManh(c, P[i], M[i]);
    hoaNo(c, ct[0], ct[1], 1.45, huongRa(P[i]), t - t0, a, MAU_HOA.hong, t, i); c.restore();
  }
  // hoa đỏ ở giữa (hình thoi lớn)
  c.save(); xoay(c, P[1][2][0], P[1][2][1], 2.1 * deg * g(0)); veManh(c, P[1], M[1]); hoaNo(c, 14.5, 13.1, 2.95, -Math.PI / 2, t - 0.25, a, MAU_HOA.do, t, 1); c.restore();
  if (a <= 0) return;
  noBuoc(c, 14.5, 24.7, 1.55, muot((t - 2.1) / 0.75), a * muot((t - 2.1) / 0.2));
  // cánh hoa rơi (sau khi hoa đã nở)
  const roi = a * muot((t - 2.2) / 1.2);
  const mauCanh = ['244,150,176', '250,190,205', '240,96,88', '255,200,110'];
  for (let i = 0; i < 16; i++) {
    const Pd = 4.2 + 2.4 * rnd(i, 21), u = frac(t / Pd + rnd(i, 22));
    const x = 5 + 19 * rnd(i, 23) + 1.3 * Math.sin(t * 1.1 + i * 2.1) + 1.2 * u * (rnd(i, 26) - 0.3);
    const y = 8 + 5 * rnd(i, 24) + 19 * u;
    const al = roi * Math.min(1, u * 6) * Math.min(1, (1 - u) * 4) * 0.9;
    if (al <= 0.01) continue;
    c.save(); c.translate(x, y); c.rotate(t * (1.2 + rnd(i, 25)) + i);
    c.beginPath(); c.ellipse(0, 0, 0.42, 0.2 + 0.05 * Math.sin(t * 3 + i), 0, 0, PI2);
    c.fillStyle = `rgba(${mauCanh[i % 4]},${al})`; c.shadowColor = `rgba(${mauCanh[i % 4]},${al * 0.8})`; c.shadowBlur = 0.12 * UPX; c.fill();
    c.restore();
  }
  // 16/11 10:02, thầy: "Hiệu ứng tranh 3d của hình 1 cho thêm vài con bướm nhé". Trước chỉ có một con màu xanh; nay 4 con, lần lượt bay tới sau khi hoa nở.
  BUOM.forEach(([t0, cx, ax, Tx, px, cy, ay, Ty, py, co, mau1, mau2, vien], i) => {
    const bay = a * muot((t - t0) / 0.8);
    if (bay <= 0) return;
    const bx = cx + ax * Math.sin(PI2 * t / Tx + px), by = cy + ay * Math.sin(PI2 * t / Ty + py) + 0.5 * Math.sin(t * 5 + i * 1.3);
    const huong = Math.cos(PI2 * t / Tx + px) >= 0 ? 1 : -1, vo = Math.abs(Math.sin(t * 13 + i * 1.7));
    c.save(); c.translate(bx, by); c.scale(huong * co, co); c.rotate(-0.25); c.globalAlpha = bay;
    for (const dau of [-1, 1]) {
      c.save(); c.scale(1, dau * (0.25 + 0.75 * vo));
      c.beginPath(); c.ellipse(0.1, -0.62, 0.62, 0.5, -0.5, 0, PI2); c.fillStyle = mau1; c.fill(); c.lineWidth = 0.05; c.strokeStyle = vien; c.stroke();
      c.beginPath(); c.ellipse(-0.4, -0.42, 0.4, 0.32, 0.6, 0, PI2); c.fillStyle = mau2; c.fill(); c.stroke();
      c.restore();
    }
    c.beginPath(); c.moveTo(-0.5, 0); c.lineTo(0.55, 0); c.lineWidth = 0.13; c.lineCap = 'round'; c.strokeStyle = '#5a4636'; c.stroke();
    c.restore();
  });
};
// [lúc bay tới (giây), tâm x, biên độ x, chu kỳ x, pha x, tâm y, biên độ y, chu kỳ y, pha y, cỡ, màu cánh lớn, màu cánh nhỏ, màu viền]. Con đầu là con bướm xanh có từ trước.
const BUOM = [
  [2.6, 14.5, 8.6, 7.4, 0.4, 8.3, 2.6, 3.1, 1.0, 1.7, 'rgba(96,150,235,0.95)', 'rgba(150,196,250,0.97)', 'rgba(60,84,150,0.8)'],
  [3.0, 8.6, 5.2, 6.1, 2.2, 13.4, 3.0, 4.3, 0.3, 1.25, 'rgba(255,190,50,0.96)', 'rgba(255,224,120,0.97)', 'rgba(176,112,20,0.8)'],
  [3.4, 20.6, 4.8, 8.3, 4.1, 11.0, 3.2, 3.7, 2.0, 1.4, 'rgba(240,120,170,0.95)', 'rgba(250,176,206,0.97)', 'rgba(170,60,110,0.8)'],
  [3.8, 14.5, 10.0, 9.7, 1.3, 19.0, 3.4, 5.3, 5.0, 1.15, 'rgba(160,120,230,0.95)', 'rgba(200,176,246,0.97)', 'rgba(96,66,160,0.8)'],
];

// Ô 2: bánh sinh nhật. Nến cháy lung linh, tàn lửa bay lên.
// 16/11 10:02, thầy: "tranh 3d của bức 2 thì chỉnh sang nền sáng nhé, thêm hiệu ứng hoa giấy rơi hoặc cho số 51 xuất hiện ở đâu đó nhé."
// Nền sáng: bỏ lớp phủ nâu tối, quanh nến chỉ còn quầng vàng ấm nhạt. Số 51 hiện trên hai hình vuông (thân bánh): "5" bên trái, "1" bên phải. Hoa giấy rơi khắp tấm thiệp.
const MAU_GIAY = ['#ef4d44', '#ffc21a', '#499fd8', '#68bd51', '#f493af', '#f9a03b', '#9a7fd4'];
HX['2'] = function (c, t, a, P, M, d) {
  const fl = 0.86 + 0.14 * Math.sin(t * 11) * Math.sin(t * 7.3 + 1);
  if (a > 0) { quang(c, 14.5, 11.5, 13.5, '255,214,120', 0.42 * a * fl); quang(c, 11, 14.5, 6, '255,200,110', 0.22 * a * fl); quang(c, 18, 14.5, 6, '255,200,110', 0.22 * a * fl); }
  [5, 4, 6, 7, 8].forEach(i => veManh(c, P[i], M[i]));
  if (a > 0) [[7, '5', 0], [8, '1', 0.22]].forEach(([i, chu, tre]) => {      // số 51 hiện dần, trượt nhẹ từ dưới lên (không phóng to)
    const q = muot((t - 1.0 - tre) / 0.6);
    if (q <= 0) return;
    const ct = tam(P[i]), u = (t - 1.2 - tre) / 0.9;
    c.save(); c.globalAlpha = a * q; c.translate(ct[0], ct[1] + 0.2 + 0.5 * (1 - q)); c.scale(0.034, 0.034);
    c.font = '800 100px "Baloo 2", "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 13; c.strokeStyle = '#fffaf0'; c.strokeText(chu, 0, 0);
    c.fillStyle = '#d9382e'; c.fillText(chu, 0, 0);
    c.restore();
    if (u > 0 && u < 1) for (let j = 0; j < 4; j++) { const an = PI2 * j / 4 + 0.6 + i; sao4(c, ct[0] + (2.3 + 0.5 * u) * Math.cos(an), ct[1] + (2.3 + 0.5 * u) * Math.sin(an), 0.5 * Math.sin(Math.PI * u), a * Math.sin(Math.PI * u), '255,190,60'); }
  });
  [[10, [10.5, 17.5]], [9, [18.5, 17.5]]].forEach(([i, o], j) => {
    c.save(); xoay(c, o[0], o[1], a * 2.4 * deg * gio(t * 1.1, j * 2 + 0.5)); veManh(c, P[i], M[i]);
    luaTrong(c, giua(P[i][0], P[i][3]), giua(P[i][1], P[i][2]), 2.1, t, 3 + j * 4, 0.6 * a, P[i]); c.restore();
  });
  [[2, [11, 17.5]], [3, [18, 17.5]], [1, [14.5, 17.5]]].forEach(([i, o], j) => {
    c.save(); xoay(c, o[0], o[1], a * (i === 1 ? 2.2 : 3.6) * deg * gio(t * 1.25, j * 1.9 + 1)); veManh(c, P[i], M[i]);
    luaTrong(c, P[i][2], P[i][0], (i === 1 ? 6 : 3) * 0.62, t, j * 5 + 1, 0.9 * a, P[i]); c.restore();
  });
  if (a <= 0) return;
  tanLua(c, t, a, { x0: 6.5, x1: 22.5, y0: 16.5, y1: 9, len: 9.5, n: 22, hat: 2 });
  const roi = a * muot((t - 0.8) / 1.0);      // hoa giấy rơi: mảnh giấy nhỏ nhiều màu, vừa rơi vừa lật
  for (let i = 0; i < 44; i++) {
    const Pd = 4.6 + 3.2 * rnd(i, 81), u = frac(t / Pd + rnd(i, 82));
    const x = 2 + 25 * rnd(i, 83) + 1.3 * Math.sin(t * (0.8 + rnd(i, 84)) + i * 1.9), y = 4.2 + 33.5 * u;
    const al = roi * Math.min(1, u * 8) * Math.min(1, (1 - u) * 5) * 0.92;
    if (al <= 0.01) continue;
    c.save(); c.translate(x, y); c.rotate(t * (1.5 + 2 * rnd(i, 85)) + i); c.scale(1, Math.cos(t * (3 + 3 * rnd(i, 86)) + i));
    c.globalAlpha = al; c.fillStyle = MAU_GIAY[i % 7];
    if (i % 3) c.fillRect(-0.42, -0.23, 0.84, 0.46); else { c.beginPath(); c.arc(0, 0, 0.3, 0, PI2); c.fill(); }
    c.restore();
  }
  c.globalAlpha = 1;
};

// Ô 3: hải đăng và con thuyền. Đèn quét, thuyền dập dềnh, sóng, chim biển.
// 16/11 10:02, thầy: "hiệu ứng tranh 3d hình 3 cũng để nền màu sáng nhé." Trước là trời về chiều (lớp phủ xanh tím, sao trời). Nay là trời ban ngày: dải trời xanh nhạt dưới khung tiêu đề,
// mặt trời nhỏ và vài đám mây trôi; tia đèn hải đăng màu vàng đậm hơn cho còn thấy trên nền sáng.
function may(c, x, y, s, al) {      // một đám mây trắng viền xanh nhạt
  if (al <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = al;
  c.beginPath(); c.arc(-1.5, 0.25, 0.85, 0, PI2); c.arc(-0.5, -0.35, 1.15, 0, PI2); c.arc(0.8, -0.1, 0.95, 0, PI2); c.arc(1.75, 0.3, 0.7, 0, PI2); c.rect(-1.5, 0.1, 3.25, 1.0);
  c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(96,150,210,0.55)'; c.shadowBlur = 0.22 * UPX; c.fill();
  c.restore();
}
HX['3'] = function (c, t, a, P, M, d) {
  const L = [8, 10.35];
  const th = (13.5 + 16.5 * Math.sin(PI2 * t / 4.4 - 1.2)) * deg;
  if (a > 0) {
    const gt = c.createLinearGradient(0, 4.1, 0, 23);      // dải trời xanh nhạt, bắt đầu dưới khung tiêu đề, nhạt dần xuống mặt nước
    gt.addColorStop(0, 'rgba(170,216,250,0)'); gt.addColorStop(0.24, `rgba(170,216,250,${0.5 * a})`); gt.addColorStop(0.6, `rgba(190,226,250,${0.3 * a})`); gt.addColorStop(1, 'rgba(190,226,250,0)');
    c.fillStyle = gt; c.fillRect(-10, 4.1, 60, 18.9);
    const mt = [33.2, 8.4];      // mặt trời ở khoảng trống bên phải con thuyền
    quang(c, mt[0], mt[1], 5.2, '255,214,90', 0.5 * a);
    c.save(); c.translate(mt[0], mt[1]); c.rotate(t * 0.25); c.lineCap = 'round'; c.lineWidth = 0.22; c.strokeStyle = `rgba(255,186,40,${0.85 * a})`;
    for (let i = 0; i < 10; i++) { const an = PI2 * i / 10, r0 = 2.15, r1 = 2.75 + 0.25 * Math.sin(t * 2 + i); c.beginPath(); c.moveTo(r0 * Math.cos(an), r0 * Math.sin(an)); c.lineTo(r1 * Math.cos(an), r1 * Math.sin(an)); c.stroke(); }
    c.restore();
    c.beginPath(); c.arc(mt[0], mt[1], 1.6, 0, PI2); c.fillStyle = `rgba(255,206,60,${a})`; c.fill();
    for (const [x0, y, sc, v] of [[2, 6.4, 0.9, 0.42], [17, 5.6, 0.7, 0.3], [29, 12.2, 0.6, 0.36]]) {      // mây trôi chậm từ trái sang phải
      const x = ((x0 + t * v + 8) % 50) - 8;
      may(c, x, y, sc, a * Math.min(1, (x + 8) / 3) * Math.min(1, (42 - x) / 3) * 0.95);
    }
    c.save();
    for (const [huong, al] of [[th, 1], [Math.PI - th, 0.5]]) {
      for (let j = 0; j < 42; j++) {      // 42 lớp mỏng chồng lên nhau (trước là 14): trên nền sáng, 14 lớp để lộ sọc ở cuối tia
        const k = 1 - j / 45, aa = 0.03;
        const h = 10 * deg * k, len = 24.5;
        c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(L[0] + len * Math.cos(huong - h), L[1] + len * Math.sin(huong - h)); c.lineTo(L[0] + len * Math.cos(huong + h), L[1] + len * Math.sin(huong + h)); c.closePath();
        const g = c.createRadialGradient(L[0], L[1], 0.5, L[0], L[1], len);
        g.addColorStop(0, `rgba(255,210,70,${aa * al * a})`); g.addColorStop(0.42, `rgba(255,214,80,${aa * al * a * 0.6})`); g.addColorStop(0.78, 'rgba(255,214,80,0)'); g.addColorStop(1, 'rgba(255,214,80,0)');
        c.fillStyle = g; c.fill();
      }
    }
    quang(c, L[0], L[1], 5.5, '255,206,70', a * (0.55 + 0.2 * Math.sin(t * 5)));
    c.restore();
  }
  // hải đăng đứng yên
  [6, 8, 7, 5, 3].forEach(i => veManh(c, P[i], M[i]));
  if (a > 0) { c.save(); duong(c, P[3]); c.clip(); quang(c, L[0], L[1], 2.6, '255,255,235', 0.85 * a); c.restore(); }
  // sóng (2 hình bình hành)
  const nh = PI2 * t / 2.7;
  const gonSong = (m, ph) => {   // gợn sóng trắng nằm trong mảnh xanh
    if (a <= 0) return;
    c.save(); duong(c, m); c.clip(); c.lineCap = 'round';
    const x0 = Math.min(...m.map(q => q[0])), x1 = Math.max(...m.map(q => q[0]));
    for (const [y, lw, al, k] of [[24.15, 0.13, 0.8, 0], [25.0, 0.11, 0.65, 1.9], [25.8, 0.1, 0.55, 3.4]]) {
      c.beginPath();
      for (let x = x0; x <= x1; x += 0.15) { const yy = y + 0.14 * Math.sin(x * 1.7 - t * 2.4 + ph + k); if (Math.sin(x * 0.9 + k * 2 + ph + t * 0.7) > -0.15) c.lineTo(x, yy); else c.moveTo(x, yy); }
      c.lineWidth = lw; c.strokeStyle = `rgba(255,255,255,${al * a})`; c.stroke();
    }
    c.restore();
  };
  c.save(); c.translate(a * 0.38 * Math.sin(nh), a * 0.13 * Math.sin(nh * 2)); veManh(c, P[9], M[9]); gonSong(P[9], 0); c.restore();
  c.save(); c.translate(-a * 0.38 * Math.sin(nh + 0.6), a * 0.13 * Math.sin(nh * 2 + 1)); veManh(c, P[10], M[10]); gonSong(P[10], 1.3); c.restore();
  // thuyền dập dềnh
  c.save(); c.translate(0, a * 0.24 * Math.sin(nh + 0.4)); xoay(c, 22.5, 21.35, a * 1.9 * deg * Math.sin(nh + 1.5));
  veManh(c, P[4], M[4]); veManh(c, P[1], M[1]);
  if (a > 0) {  // buồm bắt ánh đèn khi tia đèn quét qua
    const lech = (th - 11.7 * deg) / (9 * deg), sang = Math.exp(-lech * lech);
    c.save(); duong(c, P[1]); c.clip(); c.fillStyle = `rgba(255,240,160,${0.55 * a * sang})`; c.fillRect(18, 6, 9, 15); c.restore();
  }
  c.save(); xoay(c, 22.5, 7.35, a * (5.5 * Math.sin(PI2 * t / 0.9) + 2 * Math.sin(PI2 * t / 0.37)) * deg); veManh(c, P[2], M[2]);
  if (a > 0) {   // sao vàng hiện trong lá cờ đỏ, bay theo lá cờ
    const tc = tam(P[2]), hs = muot((t - 0.5) / 0.5), u = (t - 0.6) / 0.9;
    sao5(c, tc[0], tc[1], 1.02, a * hs, '#ffd835');
    if (u > 0 && u < 1) for (let i = 0; i < 4; i++) { const an = PI2 * i / 4 + 0.5; sao4(c, tc[0] + (1.7 + 0.5 * u) * Math.cos(an) * 1.5, tc[1] + (1.7 + 0.5 * u) * Math.sin(an) * 0.75, 0.45 * Math.sin(Math.PI * u), a * Math.sin(Math.PI * u), '255,244,190'); }
  }
  c.restore();
  c.restore();
  if (a <= 0) return;
  // chim biển
  for (let i = 0; i < 3; i++) {
    const u = frac(t / 9.5 + i * 0.37 + 0.15), x = -2 + 36 * u, y = 6.2 + i * 1.5 + 0.5 * Math.sin(t * 1.3 + i * 2), s = 0.75 - i * 0.12, fl = Math.sin(t * 7 + i * 1.9);
    if (x > 31.2) continue;
    c.beginPath(); c.moveTo(x - s, y - s * 0.35 * fl); c.quadraticCurveTo(x - s * 0.5, y - s * 0.6 * fl - s * 0.12, x, y); c.quadraticCurveTo(x + s * 0.5, y - s * 0.6 * fl - s * 0.12, x + s, y - s * 0.35 * fl);
    c.lineWidth = 0.12; c.strokeStyle = `rgba(58,72,98,${0.9 * a})`; c.stroke();
  }
};

// Ô 4: trống trường và ngọn đuốc. Dùi gõ trống, lửa đuốc bập bùng.
const NHIP = 0.44;
HX['4'] = function (c, t, a, P, M, d) {
  // 16/11 10:02: thầy bảo thiệp 2 và 3 để nền sáng; thiệp này trước cũng phủ nâu tối như thiệp 2 nên bỏ luôn cho cả 4 thiệp cùng sáng. Nét sáng (tia, sóng âm, nốt nhạc) đổi sang cam đậm.
  // ---- đuốc
  veManh(c, P[5], M[5]);
  const fl = 0.86 + 0.14 * Math.sin(t * 10.3) * Math.sin(t * 6.7 + 2);
  if (a > 0) quang(c, 9.75, 15.5, 12, '255,186,90', 0.42 * a * fl);
  [[9, P[9][0]], [10, P[10][3]]].forEach(([i, o], j) => {
    c.save(); xoay(c, o[0], o[1], a * 4.2 * deg * gio(t * 1.3, j * 2.2 + 0.4)); veManh(c, P[i], M[i]);
    luaTrong(c, giua(P[i][0], P[i][3]), giua(P[i][1], P[i][2]), 2.3, t, 7 + j * 3, 0.8 * a, P[i]); c.restore();
  });
  c.save(); xoay(c, P[1][2][0], P[1][2][1], a * 2.3 * deg * gio(t * 1.2, 1.1)); veManh(c, P[1], M[1]);
  luaTrong(c, P[1][2], P[1][0], 3.9, t, 2, 0.9 * a, P[1]); c.restore();
  if (a > 0) tanLua(c, t, a, { x0: 4, x1: 15.5, y0: 17.5, y1: 11, len: 6.5, n: 26, hat: 5 });
  // ---- trống
  const chuKy = 2 * NHIP;
  const pha = lech => frac((t - lech) / chuKy), tuLuc = lech => pha(lech) * chuKy;
  const nang = p => p < 0.5 ? raNhanh(p / 0.5) : p < 0.74 ? 1 : 1 - Math.pow((p - 0.74) / 0.26, 2);
  const tT = tuLuc(0), tP = tuLuc(NHIP);
  const dap = a * (Math.exp(-tT / 0.09) + Math.exp(-tP / 0.09));
  veManh(c, P[4], M[4]);
  c.save(); c.translate(0, 0.05 * dap); veManh(c, P[7], M[7]); veManh(c, P[8], M[8]); c.restore();
  c.save(); c.translate(0, 0.1 * dap); veManh(c, P[6], M[6]); c.restore();
  const A = 17 * deg * a;
  c.save(); xoay(c, P[2][2][0], P[2][2][1], -A * nang(pha(0))); veManh(c, P[2], M[2]); c.restore();
  c.save(); xoay(c, P[3][1][0], P[3][1][1], A * nang(pha(NHIP))); veManh(c, P[3], M[3]); c.restore();
  if (a <= 0) return;
  c.lineCap = 'round';
  for (const [tau, dinh] of [[tT, P[2][0]], [tP, P[3][3]]]) {
    if (tau < 0.26 && t > 0.3) {   // tia chạm mặt trống
      const u = tau / 0.26;
      for (let i = 0; i < 6; i++) {
        const an = (-160 + i * 28) * deg, r0 = 0.45 + 1.0 * u, r1 = r0 + 0.65 * (1 - u * 0.5);
        c.beginPath(); c.moveTo(dinh[0] + r0 * Math.cos(an), dinh[1] - 0.15 + r0 * Math.sin(an)); c.lineTo(dinh[0] + r1 * Math.cos(an), dinh[1] - 0.15 + r1 * Math.sin(an));
        c.lineWidth = 0.15; c.strokeStyle = `rgba(240,140,30,${(1 - u) * a})`; c.stroke();
      }
    }
    if (tau < 0.62 && t > 0.3) {   // sóng âm hai bên thân trống
      const u = tau / 0.62;
      for (const [x0, h] of [[19.6, Math.PI], [29.25, 0]]) for (let j = 0; j < 2; j++) {
        const r = 1.1 + 2.6 * u + j * 0.8;
        c.beginPath(); c.arc(x0, 17.3, r, h - 34 * deg, h + 34 * deg);
        c.lineWidth = 0.16; c.strokeStyle = `rgba(232,136,36,${(1 - u) * 0.9 * a})`; c.stroke();
      }
    }
  }
  // nốt nhạc bay lên
  for (let i = 0; i < 4; i++) {
    const u = frac(t / 3.0 + i * 0.25 + 0.1), x = 17.6 + (i % 2) * 13.6 + (i % 2 ? 1 : -1) * 1.2 * u + 0.35 * Math.sin(t * 3 + i), y = 12.5 - 6 * u;
    const al = a * Math.min(1, u * 5) * Math.min(1, (1 - u) * 3);
    c.save(); c.translate(x, y); c.rotate(0.2 * Math.sin(t * 2 + i)); c.globalAlpha = al;
    c.fillStyle = '#b5521a'; c.strokeStyle = '#b5521a'; c.shadowColor = 'rgba(255,200,110,0.9)'; c.shadowBlur = 0.2 * UPX;
    c.beginPath(); c.ellipse(0, 0, 0.36, 0.26, -0.4, 0, PI2); c.fill();
    c.beginPath(); c.moveTo(0.3, -0.05); c.lineTo(0.3, -1.25); c.quadraticCurveTo(0.75, -1.15, 0.85, -0.6); c.lineWidth = 0.13; c.stroke();
    c.restore();
  }
};

// Hình tự nghĩ: các mảnh lần lượt sáng lên, nhún nhẹ, rồi lấp lánh.
const THU_TU = [1, 4, 7, 8, 9, 10, 6, 5, 2, 3], VONG = 5.2;
HX.td = function (c, t, a, P, M, d) {
  const v = t % VONG;
  const tt = {}; THU_TU.forEach((i, r) => tt[i] = 0.2 + r * 0.27);
  for (const i of [1, 4, 7, 8, 6, 5, 9, 10, 2, 3]) {
    const x = (v - tt[i]) / 0.5, nhun = (x > 0 && x < 1) ? Math.sin(Math.PI * x) : 0;
    c.save(); c.translate(0, -0.3 * a * nhun); veManh(c, P[i], M[i]);
    if (a > 0) {
      const y = (v - tt[i]) / 0.75;
      if (y > 0 && y < 1) {
        const xs = P[i].map(p => p[0]), ys = P[i].map(p => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        c.save(); duong(c, P[i]); c.clip();
        xoay(c, (x0 + x1) / 2, (y0 + y1) / 2, -24 * deg);
        const q = x0 - 2.5 + (x1 - x0 + 5) * y, g = c.createLinearGradient(q - 1.3, 0, q + 1.3, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.85 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
        c.restore();
        const al = Math.sin(Math.PI * y) * a;
        duong(c, P[i]); c.lineWidth = 0.2; c.strokeStyle = `rgba(255,214,90,${al})`; c.shadowColor = `rgba(255,205,70,${al})`; c.shadowBlur = 0.45 * UPX; c.stroke(); c.shadowBlur = 0;
      }
    }
    c.restore();
  }
  if (a <= 0) return;
  for (let j = 0; j < 22; j++) {   // lấp lánh sau khi cả hình đã sáng
    const bd = 3.0 + (j % 11) * 0.16 + (j > 10 ? 0.1 : 0), x = (v - bd) / 0.85;
    if (x <= 0 || x >= 1) continue;
    const m = P[1 + (j * 3) % 10], ct = tam(m), k = Math.sin(Math.PI * x);
    sao4(c, ct[0] + (rnd(j, 51) - 0.5) * 3.2, ct[1] + (rnd(j, 52) - 0.5) * 2.6, 0.95 * k, a * k, j % 3 ? '255,255,255' : '255,236,150');
  }
  for (let j = 0; j < 8; j++) {   // vài đốm sáng quanh hình suốt vòng
    const u = frac(t / 2.3 + rnd(j, 61));
    sao4(c, d.cm[0] * (0.16 + 0.68 * rnd(j, 62)), d.cm[1] * (0.14 + 0.62 * rnd(j, 63)), 0.5 * Math.sin(Math.PI * u), a * 0.8 * Math.sin(Math.PI * u), '255,226,120');
  }
};

// ---------------------------------------------------------------- hình mẫu của 4 nhóm (file in 4-thiep-a3, toa-do-manh-a3-bo-198.json): đa giác từng mảnh, cm trên thiệp
// Số ở đây (TEN, MAU_HINH, DOI_HINH, HX) là số HÌNH MẪU, không phải số nhóm. Từ 19/11 nhóm k xếp hình mẫu HINH[k] (js/xep-thiep.js): nhóm 1 bánh, 2 trống, 3 bó hoa, 4 hải đăng.
const TEN = { 1: 'Bó hoa tặng cô', 2: 'Bánh sinh nhật', 3: 'Hải đăng và con thuyền', 4: 'Trống trường và ngọn đuốc' };
/* 15/11 22:33 thầy bỏ chỗ ghi lời chúc trên 4 tấm thiệp và bảo đưa hình ra giữa. Hình mẫu chỉ dời cả khối, từng mảnh giữ nguyên.
   MAU_HINH = chỗ MỚI của hình mẫu trên thiệp (toa-do-manh-a3-bo-198.json bản 15/11 17:29 UTC).
   16/11 00:26 thầy xem thiệp mới: "ok giữ nguyên thiết kế này đi. nhưng hình 1 và 2 đẩy 2 hình đó lên trên". Luồng thiệp đẩy hình nhóm 1, 2 lên 4 cm
   (thầy không cho số; luồng đó đo theo mũi tên thầy vẽ), nên so với bản 14/11 hình nhóm 1, 2 chỉ còn xuống 1,2 cm (bản 15:54 là 5,2 cm).
   Các hoạt ảnh HX[1..4] viết theo chỗ CŨ của hình (bản 14/11), nên ve() dời khung vẽ đi DOI_HINH và đưa đa giác về chỗ cũ trước khi gọi HX. */
const DOI_HINH = { 1: [0, 1.2], 2: [0, 1.2], 3: [4.25, 0.65], 4: [4.25, 0.65] };
const MAU_HINH = {"1":{"cm":[29,42],"manh":{"1":[[14.5,8.7],[17.5,14.7],[14.5,20.7],[11.5,14.7]],"2":[[11.08,14.865],[10.3007,11.60269],[7.22327,10.26873],[8.00257,13.53105]],"3":[[20.99743,13.53105],[21.77673,10.26873],[18.6993,11.60269],[17.92,14.865]],"4":[[8.5,20.7],[20.5,20.7],[17.5,24.7],[11.5,24.7]],"5":[[11.5,27.7],[17.5,27.7],[16.5,29.7],[12.5,29.7]],"6":[[9.5,24.7],[19.5,24.7],[19.5,27.7],[9.5,27.7]],"7":[[11.81672,15.33344],[13.60557,18.91115],[10.02786,20.7],[8.23901,17.12229]],"8":[[20.76099,17.12229],[18.97214,20.7],[15.39443,18.91115],[17.18328,15.33344]],"9":[[8.5,20.7],[5.96429,15.26215],[2.40013,14.71739],[4.93584,20.15524]],"10":[[24.06416,20.15524],[26.59987,14.71739],[23.03571,15.26215],[20.5,20.7]]}},"2":{"cm":[29,42],"manh":{"1":[[14.5,6.7],[17.5,12.7],[14.5,18.7],[11.5,12.7]],"2":[[11.0,12.7],[12.5,15.7],[11.0,18.7],[9.5,15.7]],"3":[[18.0,12.7],[19.5,15.7],[18.0,18.7],[16.5,15.7]],"4":[[8.5,25.7],[20.5,25.7],[17.5,29.7],[11.5,29.7]],"5":[[12.5,29.7],[16.5,29.7],[17.5,31.7],[11.5,31.7]],"6":[[9.5,22.7],[19.5,22.7],[19.5,25.7],[9.5,25.7]],"7":[[10.5,18.7],[14.5,18.7],[14.5,22.7],[10.5,22.7]],"8":[[14.5,18.7],[18.5,18.7],[18.5,22.7],[14.5,22.7]],"9":[[18.5,18.7],[21.85516,13.72577],[23.22388,17.06143],[19.86873,22.03565]],"10":[[9.13127,22.03565],[5.77612,17.06143],[7.14484,13.72577],[10.5,18.7]]}},"3":{"cm":[42,29],"manh":{"1":[[26.75,8.0],[29.75,14.0],[26.75,20.0],[23.75,14.0]],"2":[[26.75,8.0],[29.75,6.5],[32.75,8.0],[29.75,9.5]],"3":[[12.25,8.0],[13.75,11.0],[12.25,14.0],[10.75,11.0]],"4":[[20.75,20.0],[32.75,20.0],[29.75,24.0],[23.75,24.0]],"5":[[10.25,14.0],[14.25,14.0],[15.25,16.0],[9.25,16.0]],"6":[[7.25,24.0],[17.25,24.0],[17.25,27.0],[7.25,27.0]],"7":[[10.25,16.0],[14.25,16.0],[14.25,20.0],[10.25,20.0]],"8":[[10.25,20.0],[14.25,20.0],[14.25,24.0],[10.25,24.0]],"9":[[20.75,24.0],[26.75,24.0],[24.75,27.0],[18.75,27.0]],"10":[[26.75,24.0],[32.75,24.0],[34.75,27.0],[28.75,27.0]]}},"4":{"cm":[42,29],"manh":{"1":[[14.0,10.73711],[17.0,16.73711],[14.0,22.73711],[11.0,16.73711]],"2":[[26.88583,13.73711],[26.45181,10.41121],[23.53067,8.76289],[23.96469,12.08879]],"3":[[33.40697,12.08879],[33.84099,8.76289],[30.91985,10.41121],[30.48583,13.73711]],"4":[[25.68583,20.73711],[31.68583,20.73711],[34.68583,24.73711],[22.68583,24.73711]],"5":[[11.0,22.73711],[17.0,22.73711],[16.0,24.73711],[12.0,24.73711]],"6":[[23.68583,13.73711],[33.68583,13.73711],[33.68583,16.73711],[23.68583,16.73711]],"7":[[24.68583,16.73711],[28.68583,16.73711],[28.68583,20.73711],[24.68583,20.73711]],"8":[[28.68583,16.73711],[32.68583,16.73711],[32.68583,20.73711],[28.68583,20.73711]],"9":[[11.0,22.73711],[10.47707,16.75994],[7.31417,15.02902],[7.8371,21.00619]],"10":[[20.1629,21.00619],[20.68583,15.02902],[17.52293,16.75994],[17.0,22.73711]]}}};
const CUNG_LOAI = [[1], [2, 3], [4], [5], [6], [7, 8], [9, 10]];   // hai mảnh cùng loại đổi chỗ cho nhau vẫn là hình mẫu
const XA_KHOP = 1.6, LECH_KHOP = 0.9;   // cm: tâm mảnh lệch chỗ mẫu không quá XA_KHOP; đặt trùng tâm rồi thì đỉnh lệch không quá LECH_KHOP (mảnh to nhất xoay lệch khoảng 8 độ)

/* So hình nhóm đã xếp với hình mẫu của nhóm đó. ps = { 1..10: đa giác trên thiệp (cm) }.
   Hình được dời cả khối (máy đã đưa hình vào giữa chỗ dán) nên so sau khi trừ độ dời chung (dx, dy).
   Khớp: trả { ok: true, dx, dy, P0, Q }. Q = đa giác mẫu; P0 = đa giác nhóm đã xếp, tính trong hệ của mẫu (đã trừ dx, dy), đỉnh theo đúng thứ tự đỉnh của mẫu,
   để lúc thầy bấm các mảnh trượt nhẹ từ chỗ các em đặt (P0) về đúng chỗ mẫu (Q) rồi hoạt ảnh chạy như trong video.
   Không khớp (nhóm tự nghĩ hình khác): { ok: false } → trang dùng hoạt ảnh chung HX.td trên đúng hình của nhóm. */
function khop(k, ps) {
  const Q = MAU_HINH[k] && MAU_HINH[k].manh;
  if (!Q) return { ok: false };
  let ax = 0, ay = 0, qx = 0, qy = 0;
  for (let i = 1; i <= 10; i++) { if (!ps[i] || ps[i].length !== Q[i].length) return { ok: false }; const a = tam(ps[i]), q = tam(Q[i]); ax += a[0]; ay += a[1]; qx += q[0]; qy += q[1]; }
  const dx = (ax - qx) / 10, dy = (ay - qy) / 10;
  const cach = (i, j) => { const a = tam(ps[j]), q = tam(Q[i]); return Math.hypot(a[0] - q[0] - dx, a[1] - q[1] - dy); };
  const gan = {};
  for (const g of CUNG_LOAI) {
    if (g.length === 1) gan[g[0]] = g[0];
    else if (cach(g[0], g[0]) + cach(g[1], g[1]) <= cach(g[0], g[1]) + cach(g[1], g[0])) { gan[g[0]] = g[0]; gan[g[1]] = g[1]; }
    else { gan[g[0]] = g[1]; gan[g[1]] = g[0]; }
  }
  const P0 = {};
  let xaNhat = 0, lechNhat = 0;
  for (let i = 1; i <= 10; i++) {
    const A = ps[gan[i]], q = Q[i], ca = tam(A), cq = tam(q);
    const xa = Math.hypot(ca[0] - cq[0] - dx, ca[1] - cq[1] - dy);
    xaNhat = Math.max(xaNhat, xa);
    if (xa > XA_KHOP) return { ok: false, xa: xaNhat, manh: i };
    const dung = [], da = {};
    let lech = 0, moiDinh = true;
    q.forEach(v => {
      let tot = -1, kc = 1e9;
      A.forEach((w, n) => { const d = Math.hypot(w[0] - ca[0] - (v[0] - cq[0]), w[1] - ca[1] - (v[1] - cq[1])); if (d < kc) { kc = d; tot = n; } });
      lech = Math.max(lech, kc); if (da[tot]) moiDinh = false; da[tot] = 1; dung.push(tot);
    });
    lechNhat = Math.max(lechNhat, lech);
    if (lech > LECH_KHOP) return { ok: false, lech: lechNhat, manh: i };
    P0[i] = moiDinh ? dung.map(n => [A[n][0] - dx, A[n][1] - dy]) : q.map(v => [v[0] + ca[0] - cq[0] - dx, v[1] + ca[1] - cq[1] - dy]);
  }
  return { ok: true, dx, dy, P0, Q, xa: xaNhat, lech: lechNhat };
}
function tron(P0, Q, e) {      // đa giác ở giữa chỗ các em đặt (e = 0) và chỗ mẫu (e = 1)
  if (e >= 1) return Q;
  const P = {};
  for (const i of Object.keys(Q)) P[i] = Q[i].map((v, j) => [lerp(P0[i][j][0], v[0], e), lerp(P0[i][j][1], v[1], e)]);
  return P;
}

/* Vẽ tranh 3D của một tấm thiệp. c = canvas 2d đã đặt tỉ lệ 1 đơn vị = 1 cm và đã dời tới gốc của hình; kieu = 1..4 (hình mẫu) hay 'td' (hình tự nghĩ);
   t = giây từ lúc bấm; a = 0..1; P = { 1..10: đa giác }; M = { 1..10: màu }; cm = [rộng, cao] của thiệp; upx = số điểm ảnh thật trên 1 cm (cho độ nhòe). */
function ve(c, kieu, t, a, P, M, cm, upx) {
  UPX = upx;
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0;
  const dd = HX[kieu] ? DOI_HINH[kieu] : null;
  if (dd) {                                       // hình mẫu: hoạt ảnh viết theo chỗ cũ của hình, nay hình nằm lệch đi dd (xem DOI_HINH)
    const Pc = {};
    for (const i of Object.keys(P)) Pc[i] = P[i].map(v => [v[0] - dd[0], v[1] - dd[1]]);
    c.save(); c.translate(dd[0], dd[1]);
    HX[kieu](c, t, a, Pc, M, { cm: cm });
    c.restore();
  } else (HX[kieu] || HX.td)(c, t, a, P, M, { cm: cm });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0;
}

window.Tranh3D = { TEN: TEN, MAU_HINH: MAU_HINH, DOI_HINH: DOI_HINH, khop: khop, tron: tron, ve: ve, muot: muot };
})();
