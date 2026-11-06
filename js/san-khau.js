/* Rước đuốc: sân khấu cây cầu trên màn hình TV (clip bản 8, thầy Thịnh duyệt 5/11/2026: "ok rồi đó, viết game đi")
   Cây cầu 4 làn nhìn từ trên xuống, mỗi làn thiếu 5 khúc (vuông, chữ nhật, bình hành, thoi, thang cân).
   Mỗi câu: miếng ghép sáng màu của nhóm điểm cao nhất bay vào trước, rồi các miếng gỗ theo điểm từ cao xuống thấp;
   4 bạn cùng qua khúc vừa lấp (nhóm 1, 3 đi bộ; nhóm 2, 4 tốc biến), hạng sau đứng lùi dần; bảng điểm cập nhật;
   Claude nhảy múa thổi kèn và bình luận (mỗi câu một kiểu nhảy).
   Kết thúc: bạn về nhất bước lên thảm VỀ ĐÍCH, cả làn chuyển đỏ "Nhóm n về nhất", thắp đuốc; bấm "Thứ hạng các nhóm":
   các bạn còn lại thắp đuốc theo hạng, 4 tia lửa bay lên số 51, lửa đốt tan màn đêm hiện báo tường, 4 bạn về ô dán thiệp;
   bấm "Hiện báo tường": dải băng mở ra, pháo giấy, phóng to dòng chữ.
   Hình vẽ bằng các hàm trong cay-cau.js. Thời điểm hoạt cảnh tính từ lúc giáo viên bấm. */
(function () {
  "use strict";
  const RD = window.RD = window.RD || {};
  const SK = RD.SanKhau = {};
  const CC = window.CC;
  const W = 1920, H = 1080;
  const $ = s => document.querySelector(s);
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const lin = (t, a, b) => cl((t - a) / (b - a), 0, 1);
  const em = CC.em, eo = p => 1 - Math.pow(1 - p, 3);
  const eb = p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const XA = -1e6;        // mốc "đã xong từ lâu": hiện thẳng trạng thái cuối, không hoạt cảnh
  const CHUA = 1e9;       // mốc "chưa tới"
  const am = () => RD.AmThanh || {};
  const dongHo = () => performance.now() / 1000;

  /* ---------- trạng thái sân khấu ---------- */
  // che: dau (chuẩn bị, giới thiệu) · hoi (màn câu hỏi che cảnh) · cau (di chuyển câu q) · dich (về đích) · hang (thứ hạng) · bao (hiện báo tường)
  const S = {
    che: "dau", tieu: false, luat: false, I0: -1e6, q: 0, nCau: 0, ls: null, vt: null, hg: null,
    R0: XA, L: null, E0: CHUA, B0: CHUA, H0: CHUA, K: null,
    binh: { q: 0, chu: "", luc: 0 }, phu: false, cues: [], tCu: 0
  };
  let cv, ctx, A = null, rDo = 1, cvDem, cvCau, bao = null, baoKhung = null, daSanSang = false;
  const UI = {};

  /* ---------- tải hình ---------- */
  const tai = s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = s; });
  async function taiHinh() {
    const [nen, go, koi, koiNhay, ech, thoNhay, thoNgoi, c0, c1, c2] = await Promise.all([
      "anh/song-dem.webp", "anh/van-go.webp", "anh/ca-koi.webp", "anh/ca-koi-nhay.webp", "anh/ech.webp", "anh/tho-nhay.webp", "anh/tho-ngoi.webp",
      "anh/claude-ken-phai.webp", "anh/claude-ken-trai.webp", "anh/claude-co-vu.webp"].map(tai));
    const to = await Promise.all(RD.TO.map(T => tai(T.anh)));
    try {
      await Promise.all(["800 46px 'Baloo 2'", "700 46px 'Be Vietnam Pro'", "600 36px 'Be Vietnam Pro'"].map(f => document.fonts.load(f)));
    } catch (e) { /* phông dự phòng */ }
    A = { nen, go, to, convat: { koi, koiNhay, ech, thoNhay, thoNgoi }, claude: [c0, c1, c2].every(Boolean) ? [c0, c1, c2] : null };
    CC.xoaSan();
    daSanSang = true;
  }
  // chữ trong các hình vẽ sẵn: phông tải xong muộn thì vẽ lại
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => { if (CC.xoaSan) CC.xoaSan(); });

  /* ---------- báo tường ---------- */
  const K = { x: 224, y: 22, w: 1472, h: 1041 };
  const O = [[.024, .2, .183, .363], [.793, .2, .183, .363], [.024, .706, .257, .26], [.719, .706, .257, .26]]
    .map(o => ({ x: K.x + o[0] * K.w, y: K.y + o[1] * K.h, w: o[2] * K.w, h: o[3] * K.h }));
  const C51 = [K.x + .5 * K.w, K.y + .033 * K.h];
  const choO = i => { const o = O[i]; return [o.x + o.w / 2, o.y + o.h * (i < 2 ? .80 : .78)]; };
  // không có ảnh báo tường (bản GitHub chưa chọn ảnh): vẽ một tấm giả cùng bố cục
  async function baoGia() {
    const c = document.createElement("canvas"); c.width = K.w; c.height = K.h;
    const g = c.getContext("2d"), w = K.w, h = K.h;
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e5f3fa"); gr.addColorStop(.3, "#fdf4dc"); gr.addColorStop(1, "#fbecd0");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "800 64px 'Baloo 2'"; g.lineWidth = 4; g.strokeStyle = "#9c6a07"; g.strokeText("51", w * .5, h * .036); g.fillStyle = "#e9a920"; g.fillText("51", w * .5, h * .036);
    gr = g.createLinearGradient(0, h * .07, 0, h * .159); gr.addColorStop(0, "#d23b2f"); gr.addColorStop(1, "#a3231b");
    g.fillStyle = gr; g.fillRect(w * .236, h * .07, w * .528, h * .089);
    g.fillStyle = "#f2c14e"; g.fillRect(w * .236, h * .07, w * .528, 4); g.fillRect(w * .236, h * .159 - 4, w * .528, 4);
    g.font = "800 36px 'Baloo 2'"; g.fillStyle = "#ffe08a"; g.fillText("CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG", w * .5, h * .1);
    g.font = "700 18px 'Be Vietnam Pro'"; g.fillStyle = "#fff3d0"; g.fillText("TRƯỜNG TRUNG HỌC CƠ SỞ PHAN TÂY HỒ (14/12/1976 – 14/12/2026)", w * .5, h * .137);
    const anh = await tai("anh/nen.webp");
    const px = w * .22, py = h * .184, pw = w * .56, ph = h * .498;
    g.fillStyle = "#fff"; g.fillRect(px - 8, py - 8, pw + 16, ph + 16);
    if (anh) { const s = Math.max(pw / anh.width, ph / anh.height), sw = pw / s, sh = ph / s; g.drawImage(anh, (anh.width - sw) / 2, (anh.height - sh) / 2, sw, sh, px, py, pw, ph); }
    else { g.fillStyle = "#e8dcc4"; g.fillRect(px, py, pw, ph); }
    O.forEach((o, i) => {
      const x = o.x - K.x, y = o.y - K.y;
      g.fillStyle = "rgba(255,255,255,.75)"; g.fillRect(x, y, o.w, o.h);
      g.setLineDash([16, 10]); g.lineWidth = 4; g.strokeStyle = "#b48a3c"; g.strokeRect(x + 2, y + 2, o.w - 4, o.h - 4); g.setLineDash([]);
      g.font = "700 26px 'Be Vietnam Pro'"; g.fillStyle = "#9c7a3a"; g.fillText("Ô dán thiệp " + (i + 1), x + o.w / 2, y + o.h / 2);
    });
    return c;
  }
  let baoLan = 0;
  SK.anhBao = async function (url) {
    const lan = ++baoLan;
    const im = url ? await tai(url) : null;
    const moi = im || await baoGia();
    if (lan !== baoLan) return;
    bao = moi; baoKhung = null;
    SK.coAnhBao = !!im;
  };
  // khung báo tường (viền gỗ vàng, bóng đổ) vẽ sẵn một lần cho mỗi ảnh
  function khungBao() {
    if (baoKhung || !bao) return baoKhung;
    const P = 140, c = document.createElement("canvas");
    c.width = K.w + 32 + 2 * P; c.height = K.h + 32 + 2 * P;
    const g = c.getContext("2d");
    g.translate(P + 16 - K.x, P + 16 - K.y);
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 80; g.shadowOffsetY = 30;
    g.fillStyle = "#b8892f"; g.fillRect(K.x - 16, K.y - 16, K.w + 32, K.h + 32); g.restore();
    g.fillStyle = "#f6e7c4"; g.fillRect(K.x - 10, K.y - 10, K.w + 20, K.h + 20);
    g.drawImage(bao, K.x, K.y, K.w, K.h);
    baoKhung = { c, dx: K.x - 16 - P, dy: K.y - 16 - P };
    return baoKhung;
  }

  /* ---------- tính sẵn khi có số liệu mới ---------- */
  function datSoLieu(ls) {
    S.ls = ls;
    S.hg = ls.map((r, k) => (k ? RD.xepHang(r) : null));
    S.vt = [];
    for (let k = 0; k < ls.length; k++) S.vt.push([0, 1, 2, 3].map(i => (k ? Math.max(S.vt[k - 1][i], CC.xDung(k, S.hg[k].hang[i])) : CC.cho(0))));
  }
  const hangSau = (k, i) => (k ? S.hg[k].hang[i] : 1);
  const diemCau = (k, i) => { const c = S.ls[k][i].cau[k]; return c ? c.tram : 0; };
  // lịch hoạt cảnh của câu q, tính từ lúc bấm "Di chuyển" (giây)
  function lichCau(q) {
    const sau = S.ls[q], vang = RD.toVang(sau, q);
    const go = [0, 1, 2, 3].filter(t => vang.indexOf(t) < 0).sort((a, b) => diemCau(q, b) - diemCau(q, a) || a - b);
    const p0 = .7, L = { q, vang, bay: [] };
    vang.forEach(t => L.bay.push({ i: t, t0: p0, d: .8, vang: true }));
    const tg = vang.length ? p0 + 1.05 : p0;
    go.forEach((t, j) => L.bay.push({ i: t, t0: tg + j * .3, d: .55, vang: false }));
    L.pEnd = tg + (go.length ? (go.length - 1) * .3 + .55 : 0);
    L.kid0 = L.pEnd + .5; L.kidDur = (q === 1 || q === 5) ? 1.6 : 1.4;
    L.board = L.kid0 + L.kidDur;
    return L;
  }
  // các mốc phần kết: E0 bắt đầu về đích, B0 bấm "Thứ hạng các nhóm", H0 bấm "Hiện báo tường"
  function mocKet() {
    if (!S.ls || S.ls.length < 6) return null;
    const xh = S.hg[5], NHAT = xh.nhat, W0 = S.E0 + 1, W1 = W0 + 2;
    const CHAY = [CHUA, CHUA, CHUA, CHUA];
    NHAT.forEach(i => { CHAY[i] = W1 + .65; });
    // các nhóm còn lại thắp đuốc theo hạng; bằng điểm thì cùng hạng, thắp cùng lúc
    const nhom = xh.nhom.filter(g => xh.hang[g[0]] !== 1);
    nhom.forEach((g, j) => g.forEach(i => { CHAY[i] = S.B0 + 1.35 + j * 1.25; }));
    const F0 = (nhom.length ? S.B0 + 1.35 + (nhom.length - 1) * 1.25 : S.B0) + 1.2;
    return { hang: xh.hang, NHAT, nhom, W0, W1, CHAY, F0, BURN0: F0 + 1, BURN1: F0 + 4.1, S0: F0 + 4.2, HTH: W1 + 1.6, HB: F0 + 4.2 + 2.6 };
  }

  /* ---------- trạng thái cây cầu ở thời điểm t ---------- */
  function trangThai(t) {
    const st = { t, lap: [[], [], [], []], bay: [], duoc: [{}, {}, {}, {}], soTren: true };
    const no = [];
    for (let k = 1; k <= S.nCau; k++) {
      const vang = RD.toVang(S.ls[k], k);
      if (S.che === "cau" && k === S.q && S.R0 > XA) {
        S.L.bay.forEach(b => {
          const t0 = S.R0 + b.t0, m = { diem: diemCau(k, b.i), vang: b.vang };
          if (t >= t0 + b.d) { st.lap[b.i][k - 1] = m; if (t < t0 + b.d + .9) no.push({ i: b.i, k: k - 1, p: (t - t0 - b.d) / .9, vang: b.vang }); }
          else if (t >= t0) {
            const p = (t - t0) / b.d, e = eo(p), ra = 1 - e;
            const tr = b.vang ? { dx: ra * 260, dy: -ra * 720, s: 1 + ra * .9 + .1 * Math.sin(Math.PI * cl((p - .8) / .2, 0, 1)), r: -ra * 1.2, a: Math.min(1, p * 4) }
                              : { dx: ra * 170, dy: -ra * 560, s: 1 + ra * .45 + .07 * Math.sin(Math.PI * cl((p - .8) / .2, 0, 1)), r: -ra * .55, a: Math.min(1, p * 4) };
            st.bay.push({ i: b.i, k: k - 1, m: Object.assign({ chu: false }, m), tr, dat: p > .85 });
          }
        });
      } else for (let i = 0; i < 4; i++) st.lap[i][k - 1] = { diem: diemCau(k, i), vang: vang.indexOf(i) >= 0 };
    }
    st.sang = duongSang(t);
    st.do = {};
    if (S.K) {
      const KK = S.K;
      for (let i = 0; i < 4; i++) if (t >= KK.CHAY[i]) st.duoc[i] = { chay: Math.min(1.5, (t - KK.CHAY[i]) / 1.0), hang: KK.hang[i], huy: (t - KK.CHAY[i] - .5) / .5 };
      KK.NHAT.forEach(i => { st.do[i] = em(lin(t, KK.W0 + .85, KK.W0 + 1.75)); });
    }
    return { st, no };
  }
  // bước di chuyển của câu q đang chạy?
  function dangDi(t) { return S.che === "cau" && S.R0 > XA && t >= S.R0 + S.L.kid0 && t < S.R0 + S.L.kid0 + S.L.kidDur; }
  function xongDen(t) {      // số khúc cầu các bạn đã đi qua (theo thời gian)
    if (S.che === "cau" && S.R0 > XA && t < S.R0 + S.L.kid0 + S.L.kidDur) return S.q - 1;
    return S.nCau;
  }
  function nguoiCau(t) {
    const di = dangDi(t), xong = xongDen(t), KK = S.K;
    return [0, 1, 2, 3].map(i => {
      const y = CC.laneMid(i) + 40, hang = di ? hangSau(S.q, i) : (xong ? hangSau(xong, i) : 0);
      let o;
      if (di) o = CC.diChuyen(i, S.vt[S.q - 1][i], y, S.vt[S.q][i], y, (t - S.R0 - S.L.kid0) / S.L.kidDur, 4);
      else {
        const x = S.vt[xong][i];
        if (xong === 5 && KK && KK.NHAT.indexOf(i) >= 0 && t >= KK.W0) {      // về nhất: đi bộ lên thảm, đứng đó, rồi tới đuốc
          const X_THAM = (CC.THAM[0] + CC.THAM[1]) / 2;
          o = t < KK.W1 ? CC.diChuyen(i, x, y, X_THAM, y, (t - KK.W0) / .85, 3, "di") : CC.diChuyen(i, X_THAM, y, CC.X_CANH_DUOC, y, (t - KK.W1) / .55, 2, "di");
        } else o = (xong === 5 && KK && t >= KK.CHAY[i] - 1.15) ? CC.diChuyen(i, x, y, CC.X_CANH_DUOC, y, (t - KK.CHAY[i] + 1.15) / 1.05, 4) : { i, x, y };
      }
      o.hang = hang;
      return o;
    });
  }
  // làn sáng lấp lánh của nhóm đang dẫn đầu
  function duongSang(t) {
    if (dangDi(t)) {
      const q = S.q;
      if (q === 1) return [];
      const p = em(lin(t, S.R0 + S.L.kid0, S.R0 + S.L.kid0 + S.L.kidDur));
      return S.hg[q - 1].nhat.map(i => ({ i, x: CC.cho(q - 1) + (CC.cho(q) - CC.cho(q - 1)) * p, a: 1 }));
    }
    const xong = xongDen(t);
    if (!xong) return [];
    const tx = (S.che === "cau" && S.R0 > XA && xong === S.q) ? S.R0 + S.L.kid0 + S.L.kidDur : XA;
    const a = lin(t, tx, tx + .6), moi = S.hg[xong].nhat, cu = xong > 1 ? S.hg[xong - 1].nhat : [];
    const ds = moi.map(i => ({ i, x: CC.cho(xong), a: cu.indexOf(i) >= 0 ? 1 : a }));
    cu.forEach(i => { if (moi.indexOf(i) < 0) ds.push({ i, x: CC.cho(xong), a: 1 - a }); });
    return ds;
  }
  function veDo(c, st, t) {
    if (!S.K) return;
    S.K.NHAT.forEach(i => CC.veDuongDo(c, i, st.do[i] || 0, lin(t, S.K.W0 + 1.3, S.K.W0 + 1.8), t, RD.TO[i].ten + " về nhất"));
  }
  function veNo(c, no) {
    no.forEach(n => {
      const g = CC.GAP[n.k], tt = CC.laneTop(n.i), cc = CC.tam(g), x = cc[0], y = tt + cc[1];
      c.save(); c.globalCompositeOperation = "lighter";
      if (n.vang) {
        const r = 60 + n.p * 170, a = (1 - n.p) * .45;
        const rg = c.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, "rgba(255,232,180," + a + ")"); rg.addColorStop(1, "rgba(255,200,90,0)");
        c.fillStyle = rg; c.fillRect(x - r, y - r, 2 * r, 2 * r);
        for (let k = 0; k < 8; k++) { const an = k / 8 * 6.283, d = 40 + n.p * 120; CC.sao(c, x + Math.cos(an) * d, y + Math.sin(an) * d * .7, 11 * (1 - n.p), .85 * (1 - n.p)); }
      } else {
        c.strokeStyle = "rgba(255,236,200," + (.7 * (1 - n.p)) + ")"; c.lineWidth = 3;
        c.beginPath(); c.ellipse(x, y, 60 + n.p * 70, 40 + n.p * 40, 0, 0, 7); c.stroke();
      }
      c.restore();
    });
  }

  /* ---------- đốm sáng vẽ sẵn (thay cho tạo dải màu mỗi khung hình) ---------- */
  function domSang(khoa, trong, ngoai) {
    return CC.veSan("dom" + khoa, 64, 64, 0, g => {
      const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, trong); rg.addColorStop(1, ngoai);
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    });
  }
  // tia lửa từ 4 ngọn đuốc bay lên số 51, rồi chớp sáng
  function veTiaLua(c, t) {
    const KK = S.K; if (!KK) return;
    const dom = domSang("tia", "rgba(255,240,170,1)", "rgba(255,120,30,0)");
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const t0 = KK.F0 + i * .06, p = lin(t, t0, t0 + .9); if (p <= 0 || (p >= 1 && t > t0 + 1.2)) continue;
      const x0 = CC.xDuocI(i), y0 = CC.laneMid(i) + 40 - CC.DUOC_H - 60;
      const cx = (x0 + C51[0]) / 2 + 60 - i * 30, cy = Math.min(y0, C51[1]) - 110;
      const P = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * C51[0], (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * C51[1]];
      const h = em(p), fade = 1 - lin(t, t0 + .9, t0 + 1.2);
      for (let k = 0; k <= 26; k++) {
        const u = h - .3 * k / 26; if (u < 0) break;
        const [x, y] = P(u), a = (1 - k / 26) * .8 * fade, r = (14 * (1 - k / 26) + 3) * 2.2;
        c.globalAlpha = a; c.drawImage(dom, x - r, y - r, 2 * r, 2 * r);
      }
    }
    c.globalAlpha = 1;
    const fp = lin(t, KK.F0 + .9, KK.F0 + 1.15), ff = 1 - lin(t, KK.F0 + 1.15, KK.F0 + 1.7);
    if (fp > 0 && ff > 0) {
      const r = 40 + 220 * eo(fp);
      const rg = c.createRadialGradient(C51[0], C51[1], 0, C51[0], C51[1], r);
      rg.addColorStop(0, "rgba(255,255,230," + ff + ")"); rg.addColorStop(.4, "rgba(255,220,120," + .7 * ff + ")"); rg.addColorStop(1, "rgba(255,170,60,0)");
      c.fillStyle = rg; c.fillRect(C51[0] - r, C51[1] - r, 2 * r, 2 * r);
    }
    c.restore();
  }

  /* ---------- lửa đốt màn đêm (bắt đầu từ số 51) ---------- */
  function banKinh(t) {
    const u = lin(t, S.K.BURN0, S.K.BURN1);
    return u < .25 ? 130 * (u / .25) : 130 + 1600 * em((u - .25) / .75);
  }
  function duongChay(c, R, t) {
    c.beginPath();
    for (let k = 0; k <= 160; k++) {
      const th = k / 160 * 6.2832;
      const r = R * (1 + .10 * Math.sin(5 * th + 1.3) + .06 * Math.sin(9 * th + t * 2) + .04 * Math.sin(17 * th + .7));
      const x = C51[0] + r * Math.cos(th), y = C51[1] + r * Math.sin(th);
      k ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  let EMB = null;
  function tanLua() {
    if (EMB) return EMB;
    let s = 99; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    EMB = []; for (let j = 0; j < 170; j++) EMB.push({ tb: rnd(), th: rnd() * 6.2832, life: 1 + rnd() * .7, v: .6 + rnd(), r: 2.2 + rnd() * 2.6, ph: rnd() * 6 });
    return EMB;
  }
  // mép giấy cháy: viền nâu, viền cam rực, chỉ vàng (vẽ nhiều nét chồng nhau thay cho bóng mờ)
  function veMepChay(c, R, t) {
    c.save(); duongChay(c, R, t); c.lineJoin = "round";
    [[78, "rgba(60,20,0,.10)"], [60, "rgba(60,20,0,.16)"], [44, "rgba(60,20,0,.24)"], [30, "rgba(80,34,8,.85)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    c.globalCompositeOperation = "lighter";
    [[74, "rgba(255,154,46,.07)"], [52, "rgba(255,154,46,.11)"], [34, "rgba(255,154,46,.16)"], [14, "rgba(255,120,30,.9)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    [[22, "rgba(255,233,160,.14)"], [12, "rgba(255,233,160,.28)"], [4, "rgba(255,236,150,.95)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    c.restore();
  }

  /* ---------- báo tường trên sân khấu ---------- */
  function veBao(c, t, nguoi) {
    const KK = S.K;
    c.drawImage(CC.veSan("nenBao", W, H, 0, g => {
      const bg = g.createRadialGradient(960, 432, 50, 960, 432, 1150);
      bg.addColorStop(0, "#3b2a17"); bg.addColorStop(.75, "#130c06"); bg.addColorStop(1, "#130c06");
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
    }), 0, 0);
    const kb = khungBao(); if (!kb) return;
    // phóng to phần tiêu đề sau khi hiện báo tường, rồi thu về
    const z = 1 + .75 * (em(lin(t, S.H0 + 1.0, S.H0 + 2.4)) - em(lin(t, S.H0 + 4.0, S.H0 + 5.4)));
    const ox = K.x + .5 * K.w, oy = K.y + .07 * K.h;
    c.save(); c.translate(ox, oy); c.scale(z, z); c.translate(-ox, -oy);
    c.drawImage(kb.c, kb.dx, kb.dy);
    // 4 bạn vào ô thiệp: che chữ "Ô dán thiệp n" để ghi tên nhóm
    const trang = CC.veSan("oTrang", 250, 60, 22, (g, pad) => {
      g.fillStyle = "#fffbf2"; g.shadowColor = "#fffbf2"; g.shadowBlur = 14;
      g.beginPath(); g.roundRect(pad, pad, 250, 60, 20); g.fill();
    });
    for (let i = 0; i < 4; i++) {
      const p = lin(t, KK.S0 + i * .12 + 1.6, KK.S0 + i * .12 + 2.0); if (p <= 0) continue;
      const o = O[i], cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      c.globalAlpha = p; c.drawImage(trang, cx - 125 - 22, cy - 30 - 22); c.globalAlpha = 1;
    }
    // dải băng che dòng chữ, chỉ còn hình và số 51
    const lo = lin(t, S.H0, S.H0 + .8);
    if (lo < 1) {
      const x = K.x + .235 * K.w, y = K.y + .069 * K.h - 40 * em(lo), w = .53 * K.w, h = .092 * K.h;
      const bang = CC.veSan("bangChe", w, h, 30, (g, pad) => {
        g.translate(pad, pad);
        g.save(); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 14; g.shadowOffsetY = 6;
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d3392d"); gr.addColorStop(1, "#a3221b");
        g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
        g.fillStyle = "#f3c552"; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
        for (let k = 0; k < 9; k++) CC.sao(g, w * (k + .5) / 9, h / 2 + (k % 2 ? 8 : -8), k % 2 ? 9 : 12, .9);
      });
      c.globalAlpha = 1 - em(lo); c.drawImage(bang, x - 30, y - 30); c.globalAlpha = 1;
      // vòng sáng quanh số 51
      const pu = .5 + .5 * Math.sin(t * 3.9);
      c.save(); c.globalAlpha = 1 - lo; c.globalCompositeOperation = "lighter";
      const rg = c.createRadialGradient(C51[0], C51[1], 30, C51[0], C51[1], 110 + 25 * pu);
      rg.addColorStop(0, "rgba(255,226,120,0)"); rg.addColorStop(.45, "rgba(255,220,110," + (.35 + .3 * pu) + ")"); rg.addColorStop(1, "rgba(255,200,80,0)");
      c.fillStyle = rg; c.fillRect(C51[0] - 150, C51[1] - 150, 300, 300);
      c.restore();
      c.save(); c.globalAlpha = 1 - lo;
      c.beginPath(); c.ellipse(C51[0], C51[1], 72, 50, 0, 0, 7);
      c.strokeStyle = "rgba(255,215,106,.22)"; c.lineWidth = 22 + 3 * pu; c.stroke();
      c.strokeStyle = "rgba(255,215,106,.35)"; c.lineWidth = 13 + 3 * pu; c.stroke();
      c.strokeStyle = "rgba(255,230,130,.9)"; c.lineWidth = 5 + 3 * pu; c.stroke();
      c.restore();
    }
    if (nguoi) veNguoiBao(c, t);
    c.restore();
  }
  const choDuoc = i => [CC.X_CANH_DUOC, CC.laneMid(i) + 40];
  function nguoiBao(t) {
    const KK = S.K;
    return [0, 1, 2, 3].map(i => {
      const p = lin(t, KK.S0 + i * .12, KK.S0 + i * .12 + 2.0);
      const [x0, y0] = choDuoc(i), [x1, y1] = choO(i);
      const o = CC.diChuyen(i, x0, y0, x1, y1, p, 6);
      o.h = 172 + 8 * p;
      if (p >= 1) o.lat = i % 2 === 1;      // đứng yên: quay mặt vào giữa báo tường
      o.hang = KK.hang[i];
      return o;
    });
  }
  function veNguoiBao(c, t) {
    const KK = S.K, ds = nguoiBao(t);
    CC.veNguoi(c, A, ds, t);
    ds.forEach((o, i) => {
      const p = lin(t, KK.S0 + i * .12 + 1.6, KK.S0 + i * .12 + 2.0); if (p <= 0) return;
      const [x, y] = choO(i), T = RD.TO[i];
      const the = CC.veSan("theNhom" + T.ten + T.mau, 164, 48, 14, (g, pad) => {
        g.translate(pad + 82, pad + 24);
        g.font = "800 36px 'Baloo 2'"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillStyle = T.mau; g.strokeStyle = "#fff"; g.lineWidth = 4;
        g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 8;
        g.beginPath(); g.roundRect(-82, -24, 164, 48, 24); g.fill(); g.shadowColor = "transparent"; g.stroke();
        g.fillStyle = "#fff"; g.fillText(T.ten, 0, 2);
      });
      const s = .7 + .3 * eb(p);
      c.save(); c.globalAlpha = p; c.translate(x, y + 34); c.scale(s, s); c.drawImage(the, -96, -38); c.restore();
    });
  }
  // pháo giấy khi hiện báo tường
  function vePhaoGiay(c, t) {
    const t0 = S.H0 + .8; if (t < t0 || t > t0 + 6) return;
    let s = 5; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const MAU = ["#ffd76a", "#e9532f", "#2f9a58", "#2f6fd6", "#8b52cc", "#ff8fb1", "#ffffff"];
    for (let j = 0; j < 240; j++) {
      const x0 = rnd() * 1920, de = rnd() * 1.4, v = 260 + rnd() * 220, w = 9 + rnd() * 8, h = 14 + rnd() * 10, m = MAU[Math.floor(rnd() * MAU.length)], ph = rnd() * 6, sp = 2 + rnd() * 5;
      const tt = t - t0 - de; if (tt < 0) continue;
      const y = -30 + tt * v, x = x0 + Math.sin(tt * 2 + ph) * 40; if (y > 1110) continue;
      c.save(); c.translate(x, y); c.rotate(tt * sp + ph); c.scale(1, Math.cos(tt * sp * 1.3 + ph));
      c.fillStyle = m; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
    }
  }

  /* ---------- lớp đứng yên: ảnh nền + phần cây cầu không chuyển động ----------
     6/11 (thầy Thịnh: "game hơi lag"): đo trên máy không có card đồ hoạ, mỗi khung hình mất 24 ms, riêng cây cầu đứng yên đã 12 ms.
     Nay vẽ sẵn một lần vào lớp này, chỉ vẽ lại khi có miếng ghép mới đặt xuống (hoặc đổi độ nét, phông chữ vừa tải xong). */
  let cvTinh = null, khoaTinh = "";
  // cột chỗ thiếu đang có miếng ghép bay vào: vẽ ở phần chuyển động cho tới khi miếng cuối đáp xuống
  const cotBay = t => (S.che === "cau" && S.R0 > XA && S.L && t < S.R0 + S.L.pEnd + .5) ? S.q - 1 : -1;
  function lopTinh(st, cot) {
    const khoa = [cv.width, cv.height, cot, CC.banSan,
      st.lap.map(r => [0, 1, 2, 3, 4].map(k => (k === cot ? "-" : r[k] ? (r[k].vang ? 2 : 1) : 0)).join("")).join(",")].join("|");
    if (khoa !== khoaTinh || !cvTinh) {
      if (!cvTinh) cvTinh = document.createElement("canvas");
      if (cvTinh.width !== cv.width) cvTinh.width = cv.width;
      if (cvTinh.height !== cv.height) cvTinh.height = cv.height;
      const g = cvTinh.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvTinh.width, cvTinh.height);
      g.setTransform(rDo, 0, 0, rDo, 0, 0);
      g.drawImage(A.nen, 0, 0, W, H);
      CC.veCauTinh(g, A, st, cot);
      khoaTinh = khoa;
      SK.soLanVeTinh = (SK.soLanVeTinh || 0) + 1;
    }
    return cvTinh;
  }

  /* ---------- vẽ một khung hình ---------- */
  function veKhung(t) {
    ctx.setTransform(rDo, 0, 0, rDo, 0, 0);
    if (!daSanSang || !S.ls) { ctx.fillStyle = "#0b1428"; ctx.fillRect(0, 0, W, H); return; }
    const KK = S.K, ket = (S.che === "hang" || S.che === "bao") && KK;
    const { st, no } = trangThai(t);
    if (!ket || t < KK.BURN0) {
      const cot = cotBay(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lopTinh(st, cot), 0, 0); ctx.setTransform(rDo, 0, 0, rDo, 0, 0);
      CC.veNenDong(ctx, A, t); CC.veCauDong(ctx, A, st, cot); veDo(ctx, st, t); veNo(ctx, no);
      CC.veNguoi(ctx, A, nguoiCau(t), t);
      (st.sang || []).forEach(d => CC.veSaoRoi(ctx, d.i, d.x, t, d.a == null ? 1 : d.a));
      CC.veSo(ctx, st);
      CC.nhan(ctx, RD.TO);
      if (ket) veTiaLua(ctx, t);
      // Claude nhảy múa thổi kèn bên trái bóng nói (mỗi câu một kiểu nhảy); mờ dần khi bắt đầu về đích
      const qB = S.che === "cau" ? S.q : (S.che === "dich" ? 5 : 0);
      if (qB && S.L && S.L.q === qB) {
        const p = t - (S.R0 + S.L.board + .2), mo = S.che === "dich" ? 1 - lin(t, S.E0, S.E0 + .5) : 1;
        if (p >= 0 && mo > 0) { ctx.save(); ctx.globalAlpha = mo; CC.veClaude(ctx, A, p, 150, 256, 250, qB - 1); ctx.restore(); }
      }
    } else {
      const R = banKinh(t), u = lin(t, KK.BURN0, KK.BURN1);
      veBao(ctx, t, t >= KK.S0);
      if (u < 1) {
        const d = cvDem.getContext("2d");
        d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, cvDem.width, cvDem.height);
        d.setTransform(rDo, 0, 0, rDo, 0, 0); CC.veNen(d, A, t);
        d.globalCompositeOperation = "destination-out"; duongChay(d, R, t); d.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cvDem, 0, 0); ctx.setTransform(rDo, 0, 0, rDo, 0, 0);
        veMepChay(ctx, R, t);
      }
      // tàn lửa lấp lánh bay lên
      const dom = domSang("tan", "rgba(255,240,170,1)", "rgba(255,140,40,0)");
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      tanLua().forEach(e => {
        const tb = KK.BURN0 + e.tb * (KK.BURN1 - KK.BURN0 - .2), q = (t - tb) / e.life; if (q < 0 || q > 1) return;
        const r0 = banKinh(tb) * (1 + .10 * Math.sin(5 * e.th + 1.3) + .06 * Math.sin(9 * e.th + tb * 2) + .04 * Math.sin(17 * e.th + .7));
        const x = C51[0] + r0 * Math.cos(e.th) + Math.sin(e.ph + t * 3) * 14 * q, y = C51[1] + r0 * Math.sin(e.th) - q * 140 * e.v;
        ctx.globalAlpha = 1 - q; ctx.drawImage(dom, x - e.r * 3, y - e.r * 3, e.r * 6, e.r * 6);
      });
      ctx.restore();
      // cây cầu không bị đốt: mờ dần khi báo tường đã lộ gần hết
      const ac = 1 - lin(t, KK.F0 + 2.4, KK.F0 + 4.0);
      if (ac > 0) {
        const c2 = cvCau.getContext("2d");
        c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cvCau.width, cvCau.height); c2.setTransform(rDo, 0, 0, rDo, 0, 0);
        CC.veCau(c2, A, st); veDo(c2, st, t); CC.veSo(c2, st); CC.nhan(c2, RD.TO);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = ac; ctx.drawImage(cvCau, 0, 0); ctx.restore();
      }
      if (t < KK.S0) CC.veNguoi(ctx, A, [0, 1, 2, 3].map(i => ({ i, x: choDuoc(i)[0], y: choDuoc(i)[1], hang: KK.hang[i] })), t);
      veTiaLua(ctx, t);
    }
    if (S.che === "bao") vePhaoGiay(ctx, t);
  }

  /* ---------- lớp chữ và nút trên sân khấu ---------- */
  function datAn(el, an) { if (el.hidden !== an) el.hidden = an; }
  function datKieu(el, k, v) { const m = el._kieu || (el._kieu = {}); if (m[k] !== v) { m[k] = v; el.style[k] = v; } }   // chỉ ghi khi đổi
  function veChu(t) {
    // tiêu đề và luật chơi (màn giới thiệu)
    datAn(UI.tieu, !S.tieu); datAn(UI.luat, !S.luat);
    if (S.luat) datKieu(UI.luat, "opacity", String(lin(t, S.I0 + .8, S.I0 + 1.6)));
    // nhãn câu, bảng điểm, lời bình: trong bước di chuyển; mờ dần khi bắt đầu về đích
    const cau = S.che === "cau", dich = S.che === "dich", L = S.L;
    const q = cau ? S.q : 5;
    const moDich = dich ? 1 - lin(t, S.E0, S.E0 + .5) : 1;
    const coNhan = !!L && ((cau && t >= S.R0 + .6) || (dich && moDich > 0));
    datAn(UI.pill, !coNhan);
    if (coNhan) {
      const chu = RD.nhanCau(q);
      if (UI.pill.textContent !== chu) { UI.pill.textContent = chu; UI.pill.classList.toggle("vang", q === 5); UI.pillW = 0; }
      datKieu(UI.pill, "opacity", String(moDich));
      if (!UI.pillW) UI.pillW = UI.pill.offsetLeft + UI.pill.offsetWidth;
    }
    // bảng điểm
    const bang0 = cau && L ? (S.q === 1 ? S.R0 + L.board : S.R0 + .6) : XA;
    const coBang = !!L && ((cau && t >= bang0) || (dich && moDich > 0));
    datAn(UI.bx, !coBang);
    if (coBang) {
      const vao = cau && S.q === 1 ? lin(t, bang0, bang0 + .4) : 1;
      datKieu(UI.bx, "opacity", String(Math.min(vao, moDich)));
      datKieu(UI.bx, "transform", "translateX(" + (60 * (1 - vao)).toFixed(1) + "px)");
      veBang(t, q);
    }
    // bóng nói lời bình (chữ hiện dần như đang gõ)
    const b0 = L ? S.R0 + L.board + .2 : CHUA;
    const coBinh = !!L && L.q === q && (cau || (dich && moDich > 0)) && t >= b0;
    datAn(UI.binh, !coBinh);
    if (coBinh) {
      const L0 = Math.max(306, (UI.pillW || 0) + 24);
      datKieu(UI.binh, "left", L0 + "px"); datKieu(UI.binh, "width", (1602 - L0) + "px");
      datKieu(UI.binh, "opacity", String(moDich));
      const B = S.binh;
      if (B.q !== q || !B.chu) { if (UI.binh.dataset.cho !== "1") { UI.binh.dataset.cho = "1"; UI.binh.innerHTML = '<span class="cho"><i></i><i></i><i></i></span>'; } }
      else {
        const bd = Math.max(b0, B.luc), n = Math.floor((t - bd) * 48), chu = B.chu.slice(0, Math.max(0, Math.min(B.chu.length, n)));
        if (UI.binh.dataset.cho === "1" || UI.binh.textContent !== chu) { UI.binh.dataset.cho = ""; UI.binh.textContent = chu; }
      }
    }
    // nút trên TV
    const KK = S.K;
    let thHien = false, thBam = false, thS = 1, thA = 1;
    if (KK && dich && t >= KK.HTH) { thHien = true; thA = lin(t, KK.HTH, KK.HTH + .3); thS = (.8 + .2 * eb(lin(t, KK.HTH, KK.HTH + .5))) * (1 + .03 * Math.sin(t * 4)); }
    if (KK && S.che === "hang" && t < S.B0 + .25) { thHien = true; thBam = true; thS = .93; }
    datAn(UI.nutTH, !thHien);
    if (thHien) { UI.nutTH.classList.toggle("bam", thBam); datKieu(UI.nutTH, "transform", "scale(" + thS.toFixed(3) + ")"); datKieu(UI.nutTH, "opacity", String(thA)); }
    let hbHien = false, hbBam = false, hbS = 1, hbA = 1;
    if (KK && S.che === "hang" && t >= KK.HB) { hbHien = true; hbA = lin(t, KK.HB, KK.HB + .3); hbS = (.8 + .2 * eb(lin(t, KK.HB, KK.HB + .5))) * (1 + .03 * Math.sin(t * 4)); }
    if (KK && S.che === "bao" && t < S.H0 + .25) { hbHien = true; hbBam = true; hbS = .93; }
    datAn(UI.nutHB, !hbHien);
    if (hbHien) { UI.nutHB.classList.toggle("bam", hbBam); datKieu(UI.nutHB, "transform", "scale(" + hbS.toFixed(3) + ")"); datKieu(UI.nutHB, "opacity", String(hbA)); }
    // dòng sông vẽ tiếp ở phần dư ngoài khung 16:9: tắt dần khi lửa đốt tan màn đêm (nửa sau), tới báo tường thì hết hẳn
    if (UI.nenNgoai) {
      const an = S.che === "bao" ? 0 : (S.che === "hang" && KK) ? 1 - lin(t, (KK.BURN0 + KK.BURN1) / 2, KK.BURN1) : 1;
      datKieu(UI.nenNgoai, "opacity", an.toFixed(3));
    }
  }
  // bảng điểm: các dòng trượt tới chỗ mới theo thứ hạng, số điểm tăng dần
  function veBang(t, q) {
    const L = S.L, bt = (S.che === "cau" && L) ? S.R0 + L.board : XA;
    const qq = t >= bt ? q : q - 1, qTruoc = t >= bt ? q - 1 : q - 2;
    const p = t >= bt ? em(lin(t, bt, bt + .7)) : 1, pd = t >= bt ? lin(t, bt, bt + .8) : 1;
    const sau = qq > 0 ? S.hg[qq] : null, truoc = qTruoc > 0 ? S.hg[qTruoc] : null;
    UI.dong.forEach((d, i) => {
      const a = truoc ? truoc.thuTu.indexOf(i) : i, b = sau ? sau.thuTu.indexOf(i) : i, r = a + (b - a) * p;
      datKieu(d.el, "top", (54 + r * 66).toFixed(1) + "px");
      const h = String(sau ? sau.hang[i] : 1), dc = qTruoc > 0 ? S.ls[qTruoc][i].tram : 0, ds = qq > 0 ? S.ls[qq][i].tram : 0;
      const so = String(Math.round(dc + (ds - dc) * pd));
      if (d.h.textContent !== h) d.h.textContent = h;
      if (d.d.textContent !== so) d.d.textContent = so;
      d.el.classList.toggle("nhat", !!sau && p > .5 && sau.hang[i] === 1);
    });
  }

  /* ---------- tiếng động theo hoạt cảnh ---------- */
  function hen(luc, fn) { S.cues.push({ luc, fn }); }
  function chayTieng(t) {
    if (!S.cues.length) return;
    const con = [];
    S.cues.forEach(c => {
      if (t >= c.luc) { if (t - c.luc < 1.0) { try { c.fn(); } catch (e) { /* bỏ qua */ } } }
      else con.push(c);
    });
    S.cues = con;
  }
  // 6/11 thầy Thịnh: "chỉ kêu tiếng ở những chỗ quan trọng thôi", "âm thanh nên có lúc hiện ra câu hỏi mới, lúc ghép ô
  //   vào cây cầu. Bạn về nhất thì có tiếng vỗ tay". Bỏ tiếng bước chân, vút, tích tắc, lấp lánh, lách tách
  //   (danh sách đủ ở DOC-TRUOC.md, mục "Âm thanh").
  function tiengCau() {
    // ghép ô vào cầu: mỗi miếng đáp xuống kêu một tiếng; miếng vàng (nhóm đúng nhiều nhất) kêu chuông,
    // các miếng gỗ gõ mộc cầm đi lên Mi, Son, La
    let j = 0;
    S.L.bay.forEach(b => {
      if (b.vang) hen(S.R0 + b.t0 + b.d, () => am().chuong && am().chuong(.9));
      else { const bac = 2 + Math.min(j++, 2); hen(S.R0 + b.t0 + b.d, () => am().go && am().go(bac, .7)); }
    });
  }
  function tiengDich() {
    const KK = S.K;
    hen(KK.W0 + .85, () => am().voTay && am().voTay());           // bạn về nhất bước lên thảm VỀ ĐÍCH: cả lớp vỗ tay
    hen(KK.W1 + .65, () => am().bungLua && am().bungLua());       // thắp đuốc
  }
  function tiengHang() {
    const KK = S.K;
    KK.nhom.forEach(g => hen(KK.CHAY[g[0]], () => am().bungLua && am().bungLua()));   // mỗi lượt thắp đuốc theo hạng
    hen(KK.F0 + .9, () => am().trong && am().trong(1));                                 // bốn tia lửa chạm số 51
  }
  function tiengBao() {
    hen(S.H0, () => { am().trong && am().trong(1); am().ken && am().ken(); });         // mở dải băng báo tường
  }

  /* ---------- vòng vẽ ---------- */
  let dts = [], hThap = 0;
  function vong() {
    requestAnimationFrame(vong);
    const t = dongHo();
    chayTieng(t);
    if (S.phu) { S.tCu = 0; return; }
    try { veKhung(t); veChu(t); } catch (e) { console.error(e); }
    // máy yếu: khung hình quá chậm thì giảm độ nét của cảnh (chỉ giảm, không tăng lại)
    if (S.tCu && document.visibilityState === "visible") {
      dts.push(t - S.tCu); if (dts.length > 90) dts.shift();
      if (dts.length >= 90 && t > hThap + 3) {
        const tb = dts.reduce((a, b) => a + b, 0) / dts.length;
        if (tb > .024 && SK.doNet > .7) { SK.doNet = Math.max(.7, SK.doNet - .15); hThap = t; dts = []; SK.vuaManHinh(); }
      }
    }
    S.tCu = t;
  }

  /* ---------- khởi tạo, vừa màn hình ---------- */
  SK.doNet = 1;
  SK.khoiTao = function () {
    cv = $("#cv"); ctx = cv.getContext("2d");
    cvDem = document.createElement("canvas"); cvCau = document.createElement("canvas");
    UI.tieu = $("#tieu"); UI.luat = $("#luat"); UI.pill = $("#pill"); UI.binh = $("#binh"); UI.bx = $("#bx");
    UI.nutTH = $("#nutThuHang"); UI.nutHB = $("#nutHienBao"); UI.nenNgoai = $("#nenNgoai");
    UI.dong = RD.TO.map(T => {
      const d = document.createElement("div"); d.className = "dong"; d.style.setProperty("--m", T.mau); d.style.setProperty("--n", T.nhat);
      d.innerHTML = '<span class="h">1</span><img src="' + T.mat + '" alt=""><span class="t">' + T.ten + '</span><span class="d">0</span>';
      UI.bx.appendChild(d);
      return { el: d, h: d.querySelector(".h"), d: d.querySelector(".d") };
    });
    window.addEventListener("resize", SK.vuaManHinh);
    SK.vuaManHinh();
    taiHinh();
    if (!bao) SK.anhBao(null);
    requestAnimationFrame(vong);
  };
  SK.vuaManHinh = function () {
    const vw = window.innerWidth, vh = window.innerHeight;
    const k = Math.min(vw / W, vh / H), wd = $("#world");
    SK.k = k;
    wd.style.transform = "translate(-50%,-50%) scale(" + k + ")";
    // 6/11 thầy Thịnh: khung xem không đúng tỉ lệ 16:9 (cửa sổ Claude, máy 16:10) thì phần dư trên dưới (hoặc hai bên)
    //   vẽ tiếp dòng sông bằng ảnh nền lật gương, không còn hai viền đen. Dư thêm 40 px cho màn câu hỏi làm mờ không bị viền tối.
    wd.style.setProperty("--bd", (Math.max(0, Math.ceil((vh / k - H) / 2)) + 40) + "px");
    wd.style.setProperty("--bn", (Math.max(0, Math.ceil((vw / k - W) / 2)) + 40) + "px");
    if (wd.parentNode && wd.parentNode.style) wd.parentNode.style.setProperty("--k", String(k));   // nền báo tường kéo dài ra phần dư
    // độ nét của cảnh theo cỡ màn hình thật (màn nhỏ thì vẽ nhỏ cho nhẹ máy), tối đa 1920×1080
    rDo = Math.max(.5, Math.min(1, k * (window.devicePixelRatio || 1))) * SK.doNet;
    [cv, cvDem, cvCau].forEach(c => { const w = Math.round(W * rDo), h = Math.round(H * rDo); if (c.width !== w) c.width = w; if (c.height !== h) c.height = h; });
  };

  /* ---------- điều khiển từ trò chơi ---------- */
  // o = { che, q, ls (kết quả sau từng câu: ls[0..n]), hoatCanh, gioiThieu }
  SK.dat = function (o) {
    const t = dongHo(), hc = !!o.hoatCanh;
    S.cues = [];
    S.che = o.che;
    S.tieu = o.che === "dau";
    S.luat = o.che === "dau" && !!o.gioiThieu;
    S.I0 = hc ? t : XA;
    datSoLieu(o.ls);
    if (o.che === "dau") { S.q = 0; S.nCau = 0; }
    else if (o.che === "hoi") { S.q = o.q; S.nCau = o.q - 1; }
    else if (o.che === "cau") { S.q = o.q; S.nCau = o.q; }
    else { S.q = 5; S.nCau = 5; }
    // lịch câu đang di chuyển (giữ lịch câu 5 cho Claude và bảng điểm lúc mới về đích)
    if (o.che === "cau" || o.che === "dich") {
      S.L = lichCau(o.che === "cau" ? o.q : 5);
      S.R0 = (o.che === "cau" && hc) ? t : XA;
    } else { S.L = null; S.R0 = XA; }
    S.E0 = o.che === "dich" ? (hc ? t : XA) : (o.che === "hang" || o.che === "bao") ? XA : CHUA;
    S.B0 = o.che === "hang" ? (hc ? t : XA) : o.che === "bao" ? XA : CHUA;
    S.H0 = o.che === "bao" ? (hc ? t : XA) : CHUA;
    S.K = mocKet();
    if (hc) {
      if (o.che === "cau") tiengCau();
      else if (o.che === "dich" && S.K) tiengDich();
      else if (o.che === "hang" && S.K) tiengHang();
      else if (o.che === "bao") tiengBao();
    }
    if (o.che !== "hoi") S.phu = false;
  };
  // lời bình đã có (Claude viết xong, hoặc lời bình theo mẫu); ngay: hiện đủ chữ, không gõ dần
  SK.binh = function (q, chu, ngay) { S.binh = { q, chu: String(chu || ""), luc: ngay ? XA : dongHo() }; };
  // màn câu hỏi che kín sân khấu: thôi vẽ cho nhẹ máy
  SK.phu = function (on) { S.phu = !!on; };
  SK.huy = function () { S.cues = []; };
  SK.mocKet = () => S.K;
  SK._S = S;
  SK._ve = t => { veKhung(t); veChu(t); };
})();
