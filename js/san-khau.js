/* Rước đuốc: sân khấu cây cầu trên màn hình TV (clip bản 8, thầy Thịnh duyệt 5/11/2026: "ok rồi đó, viết game đi")
   Cây cầu 4 làn nhìn từ trên xuống, mỗi làn thiếu 5 khúc (vuông, chữ nhật, bình hành, thoi, thang cân).
   Mỗi câu: miếng ghép sáng màu của nhóm điểm cao nhất bay vào trước, rồi các miếng gỗ theo điểm từ cao xuống thấp;
   4 bạn cùng qua khúc vừa lấp (nhóm 1, 3 đi bộ; nhóm 2, 4 tốc biến), hạng sau đứng lùi dần; bảng điểm cập nhật;
   Claude nhảy múa thổi kèn và bình luận (mỗi câu một kiểu nhảy).
   Kết thúc: bạn về nhất bước lên thảm VỀ ĐÍCH, cả làn chuyển đỏ "Nhóm n về nhất", thắp đuốc; bấm "Tổng kết" (8/11, trước là "Thứ hạng các nhóm"):
   các bạn còn lại thắp đuốc theo hạng rồi dừng, hiện nút "Tiếp theo" (8/11); bấm "Tiếp theo": 4 tia lửa bay lên số 51,
   lửa đốt tan màn đêm hiện báo tường, 4 bạn về ô dán thiệp; bấm "Tiếp theo" lần cuối (8/11 tối, trước là "Hiện báo tường"):
   lễ cắt băng khánh thành (vệt sáng quét, kéo vàng cắt dải băng, pháo giấy), cả lớp vỗ tay; không phóng to thu nhỏ.
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
    R0: XA, L: null, E0: CHUA, B0: CHUA, T0: CHUA, H0: CHUA, W0: CHUA, K: null, tiep: false,
    binh: { q: 0, chu: "", luc: 0 }, phu: false, cues: [], tCu: 0,
    ext: { bn: 0, bd: 0, EW: W, EH: H, KF: null }
  };
  let cv, ctx, A = null, rDo = 1, bao = null, baoSo = 0, baoKhung = null, daSanSang = false;
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
  // việc nặng chỉ làm một lần: đợi lúc máy rảnh (giữa hai khung hình) để khỏi làm khựng hoạt cảnh
  const henRanh = fn => (window.requestIdleCallback ? requestIdleCallback(() => fn(), { timeout: 700 }) : setTimeout(fn, 60));
  // 6/11 tối (thầy Thịnh: "phần chuyển cảnh sang báo tường bị lag với giật"): ảnh báo tường (ảnh thầy chọn trên GitHub có thể là
  //   ảnh in rất lớn) được giải mã và thu về đúng cỡ dùng trên sân khấu (K.w × K.h) ngay lúc nạp, khung báo tường dựng sẵn lúc
  //   máy rảnh; trước đây đợi tới khung hình đầu tiên của lửa đốt mới làm nên hình khựng lại.
  async function vuaCoBao(im) {
    try {
      if (window.createImageBitmap) return await createImageBitmap(im, { resizeWidth: K.w, resizeHeight: K.h, resizeQuality: "high" });
    } catch (e) { /* không thu nhỏ được bằng cách này: dùng khung vẽ */ }
    const c = document.createElement("canvas"); c.width = K.w; c.height = K.h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(im, 0, 0, K.w, K.h);
    return c;
  }
  let baoLan = 0;
  SK.anhBao = async function (url) {
    const lan = ++baoLan;
    let im = url ? await tai(url) : null;
    if (im) { try { im = await vuaCoBao(im); } catch (e) { /* giữ ảnh gốc */ } }
    const moi = im || await baoGia();
    if (lan !== baoLan) return;
    bao = moi; baoSo++; baoKhung = null;
    SK.coAnhBao = !!im;
    henRanh(khungBao);
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
  // các mốc phần kết: W0 bạn về nhất bắt đầu bước lên thảm VỀ ĐÍCH, E0 bấm "Đốt đuốc", B0 bấm "Tổng kết" (trước là "Thứ hạng các nhóm"),
  //   T0 bấm "Tiếp theo" (8/11), H0 bấm nút cuối "Tiếp theo" (8/11 tối, trước là "Hiện báo tường").
  // 6/11 trưa (thầy Thịnh: "khi nào có nhóm về nhất thì nhóm đó sẽ tự bước tới ô về đích luôn và có tiếng vỗ tay", "trên điện thoại
  //   sẽ hiện nút đốt đuốc, tôi ấn vô thì nhóm đó sẽ đốt đuốc"): W0 nay tính từ lúc công bố câu 5 (S.W0, đặt trong SK.dat). Bạn về
  //   nhất tự bước lên thảm (vỗ tay), rồi tới đứng cạnh đuốc chờ; TN là lúc thắp đuốc: sau khi bấm "Đốt đuốc" và bạn đã tới đuốc.
  function mocKet() {
    if (!S.ls || S.ls.length < 6) return null;
    const xh = S.hg[5], NHAT = xh.nhat, W0 = S.W0, W1 = W0 + 2, TN = Math.max(S.E0 + .45, W1 + .65);
    const CHAY = [CHUA, CHUA, CHUA, CHUA];
    NHAT.forEach(i => { CHAY[i] = TN; });
    // các nhóm còn lại thắp đuốc theo hạng; bằng điểm thì cùng hạng, thắp cùng lúc
    const nhom = xh.nhom.filter(g => xh.hang[g[0]] !== 1);
    nhom.forEach((g, j) => g.forEach(i => { CHAY[i] = S.B0 + 1.35 + j * 1.25; }));
    // 8/11 thầy Thịnh: "sau khi cả 4 bạn đốt đuốc, hiện thêm nút tiếp theo, tôi bấm vô thì mới hiện báo tường".
    //   L0 lượt thắp đuốc cuối, TT nút "Tiếp theo" hiện (ngọn đuốc cuối đã bùng hẳn), F0 tia lửa bay lên số 51: ngay sau khi bấm
    //   "Tiếp theo" (bấm sớm lúc các nhóm còn đang thắp thì chờ ngọn đuốc cuối sáng xong, như trước)
    const L0 = nhom.length ? S.B0 + 1.35 + (nhom.length - 1) * 1.25 : S.B0, TT = L0 + 1.2, F0 = Math.max(TT, S.T0 + .3);
    return { hang: xh.hang, NHAT, nhom, W0, W1, TN, CHAY, L0, TT, F0, BURN0: F0 + 1, BURN1: F0 + 4.1, S0: F0 + 4.2, HTH: TN + 1, HB: F0 + 4.2 + 2.6 };
  }

  // 8/11: lúc chữ "Tổng kết" đổi thành "Tiếp theo": bốn ngọn đuốc đã sáng (TT) và Claude đã gõ xong lời bình thứ hạng (48 chữ
  //   một giây); Claude còn đang viết thì chờ, lâu nhất khoảng 11 giây sau ngọn đuốc cuối (quá 10 giây trang dùng lời theo mẫu)
  function lucTiep(KK) {
    const B = S.binh;
    if (B.q !== 6 || !B.chu) return Math.max(KK.TT, KK.L0 + 11);
    return Math.max(KK.TT, Math.max(KK.L0 + .4, B.luc) + B.chu.length / 48 + .5);
  }
  SK.lucTiep = () => S.K && S.che === "hang" ? lucTiep(S.K) : null;

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
      const y = CC.yChan(i), hang = di ? hangSau(S.q, i) : (xong ? hangSau(xong, i) : 0);
      let o;
      if (di) o = CC.diChuyen(i, S.vt[S.q - 1][i], y, S.vt[S.q][i], y, (t - S.R0 - S.L.kid0) / S.L.kidDur, 4);
      else {
        const x = S.vt[xong][i];
        if (xong === 5 && KK && KK.NHAT.indexOf(i) >= 0 && t >= KK.W0) {      // về nhất: đi bộ lên thảm, đứng đó, rồi tới đuốc
          const X_THAM = (CC.THAM[0] + CC.THAM[1]) / 2;
          o = t < KK.W1 ? CC.diChuyen(i, x, y, X_THAM, y, (t - KK.W0) / .85, 3, "di") : CC.diChuyen(i, X_THAM, y, CC.xCanhDuoc(i), y, (t - KK.W1) / .55, 2, "di");
        } else o = (xong === 5 && KK && t >= KK.CHAY[i] - 1.15) ? CC.diChuyen(i, x, y, CC.xCanhDuoc(i), y, (t - KK.CHAY[i] + 1.15) / 1.05, 4) : { i, x, y };
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
      const m = CC.mieng(i), x0 = m[0], y0 = m[1] - 60 * CC.DS;
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
  function duongChay(c, R, t, noi) {
    if (!noi) c.beginPath();
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
  // đường mép cháy chỉ gồm phần nằm trong khung vẽ (6/11 tối): lỗ cháy lớn dần quá màn hình thì phần lớn vòng tròn ở ngoài,
  //   khỏi tính nét cho phần đó. Lỗ còn nhỏ (cả vòng thấy được) thì vẫn là vòng kín như duongChay.
  function duongMep(c, R, t) {
    const E = S.ext, x0 = -E.bn - 90, y0 = -E.bd - 90, x1 = W + E.bn + 90, y1 = H + E.bd + 90, N = 160, P = [];
    for (let k = 0; k < N; k++) {
      const th = k / N * 6.2832;
      const r = R * (1 + .10 * Math.sin(5 * th + 1.3) + .06 * Math.sin(9 * th + t * 2) + .04 * Math.sin(17 * th + .7));
      const x = C51[0] + r * Math.cos(th), y = C51[1] + r * Math.sin(th);
      P.push([x, y, x > x0 && x < x1 && y > y0 && y < y1]);
    }
    c.beginPath();
    const s = P.findIndex(p => !p[2]);
    if (s < 0) { P.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); return; }
    let dang = false;
    for (let j = 1; j <= N; j++) {
      const p = P[(s + j) % N], q = P[(s + j - 1) % N];
      if (p[2]) { if (!dang) { c.moveTo(q[0], q[1]); dang = true; } c.lineTo(p[0], p[1]); }
      else if (dang) { c.lineTo(p[0], p[1]); dang = false; }
    }
  }
  // mép giấy cháy: viền nâu, viền cam rực, chỉ vàng (vẽ nhiều nét chồng nhau thay cho bóng mờ).
  //   6/11 tối: 9 nét thay 11, tổng bề rộng 290 thay 424 (dải mờ ngoài cùng gộp lại), độ đậm từng dải gần như cũ
  function veMepChay(c, R, t) {
    c.save(); duongMep(c, R, t); c.lineJoin = "round";
    [[72, "rgba(60,20,0,.16)"], [44, "rgba(60,20,0,.30)"], [30, "rgba(80,34,8,.85)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    c.globalCompositeOperation = "lighter";
    [[66, "rgba(255,154,46,.10)"], [38, "rgba(255,154,46,.22)"], [14, "rgba(255,120,30,.9)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    [[22, "rgba(255,233,160,.14)"], [12, "rgba(255,233,160,.28)"], [4, "rgba(255,236,150,.95)"]].forEach(([w, m]) => { c.lineWidth = w; c.strokeStyle = m; c.stroke(); });
    c.restore();
  }

  /* ---------- báo tường trên sân khấu ---------- */
  // 6/11 chiều (thầy Thịnh: "cái màn hình cuối sao không full màn hình vậy"): sau khi bấm, báo tường cao vừa màn hình (cách mép
  //   8 px; hai bên chừa 76 px cho cột nút), phía sau là chính báo tường phóng to, nhoè và tối, phủ kín hai bên. Khung to S.ext.KF
  //   tính trong vuaManHinh().
  // 8/11 tối (thầy Thịnh: "ở đoạn clip cuối đừng có ra nút bấm hiện báo tường, nút đó đổi thành nút tiếp theo. khi bấm vào thì báo
  //   tường hiện đầy đủ nhưng đừng có hiệu ứng phóng to thu nhỏ, đổi hiệu ứng nào hay hay đi"): nút cuối nay ghi "Tiếp theo". Bỏ cả
  //   hai lần phóng to (báo tường to dần 1 giây; dòng chữ phóng to rồi thu về). Nay là lễ cắt băng khánh thành, tính từ lúc bấm (S.H0):
  //   1. 0–0,8 giây: vệt sáng vàng quét chéo qua màn hình. Phía sau vệt sáng báo tường đã ở cỡ đầy màn hình (KF) trên nền nhoè,
  //      phía trước vẫn như lúc chưa bấm, nên không lúc nào báo tường to dần;
  //   2. KEO: cây kéo vàng đưa vào, mở ra; CAT: kéo khép lại cắt đôi dải băng đỏ ở giữa (chớp sao, tiếng trống, khúc mộc cầm, vỗ tay);
  //   3. hai nửa dải băng rủ xuống hai bên rồi tan, lộ dòng chữ; pháo giấy bắn lên từ hai góc dưới và rơi khắp khung xem; vệt sáng
  //      lướt qua dòng chữ; sao vàng lấp lánh quanh dòng chữ và số 51 chừng 9 giây rồi đứng yên.
  const QUET = .8, KEO = .5, CAT = 1.15;
  // biến đổi đưa khung báo tường K về khung đầy màn hình KF
  function bienKF() {
    const F = S.ext && S.ext.KF; if (!F) return null;
    return { s: F.w / K.w, cx0: K.x + K.w / 2, cy0: K.y + K.h / 2, cx: F.x + F.w / 2, cy: F.y + F.h / 2 };
  }
  // báo tường nhoè phủ kín khung vẽ (vẽ nhỏ rồi phóng to thì tự nhoè). 6/11 tối: phóng to một lần ra đúng cỡ khung vẽ rồi giữ lại;
  //   trước đây phóng to mỗi khung hình, mất khoảng 9 ms mỗi khung trên máy không có card đồ hoạ.
  let moLon = null, khoaMo = "";
  function nenMo() {
    if (!bao || !cv) return null;
    const E = S.ext, khoa = [cv.width, cv.height, baoSo, E.EW.toFixed(1), E.EH.toFixed(1)].join("|");
    if (moLon && khoa === khoaMo) return moLon;
    const nho = document.createElement("canvas"); nho.width = 120; nho.height = 85;
    let g = nho.getContext("2d");
    try { g.filter = "blur(2px)"; } catch (e) { /* bỏ qua */ }
    g.drawImage(bao, -6, -6, 132, 97); g.filter = "none";
    g.fillStyle = "rgba(30,17,6,.66)"; g.fillRect(0, 0, 120, 85);
    if (!moLon) moLon = document.createElement("canvas");
    moLon.width = cv.width; moLon.height = cv.height;
    g = moLon.getContext("2d");
    g.fillStyle = "#130c06"; g.fillRect(0, 0, moLon.width, moLon.height);      // phủ kín (ảnh có chỗ trong suốt cũng không lộ)
    const s = Math.max(moLon.width / 120, moLon.height / 85), w = 120 * s, h = 85 * s;
    g.imageSmoothingQuality = "high";
    g.drawImage(nho, (moLon.width - w) / 2, (moLon.height - h) / 2, w, h);
    khoaMo = khoa;
    return moLon;
  }
  const nenBao = () => CC.veSan("nenBao", W, H, 0, g => {
    const bg = g.createRadialGradient(960, 432, 50, 960, 432, 1150);
    bg.addColorStop(0, "#3b2a17"); bg.addColorStop(.75, "#130c06"); bg.addColorStop(1, "#130c06");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
  });
  // nền tối và khung báo tường vẽ chung một tấm đúng cỡ, đúng độ nét khung vẽ (6/11 tối): lúc lửa đốt và lúc chờ bấm nút cuối
  //   "Tiếp theo" mỗi khung chỉ chép một tấm này (trước đây chép hai tấm lớn, một tấm có bóng đổ trong suốt)
  let cvCanhBao = null, khoaCanhBao = "";
  function canhBao() {
    const kb = khungBao(); if (!kb || !cv) return null;
    const E = S.ext, khoa = [cv.width, cv.height, rDo.toFixed(4), baoSo, E.bn.toFixed(2), E.bd.toFixed(2)].join("|");
    if (!cvCanhBao || khoa !== khoaCanhBao) {
      if (!cvCanhBao) cvCanhBao = document.createElement("canvas");
      cvCanhBao.width = cv.width; cvCanhBao.height = cv.height;
      const g = cvCanhBao.getContext("2d");
      g.setTransform(rDo, 0, 0, rDo, Math.round(E.bn * rDo), Math.round(E.bd * rDo));
      g.drawImage(nenBao(), 0, 0); g.drawImage(kb.c, kb.dx, kb.dy);
      khoaCanhBao = khoa;
    }
    return cvCanhBao;
  }
  // cây cầu lúc lửa đốt màn đêm (6/11 tối): vẽ sẵn cả cây cầu một tấm ở bước thứ hạng (thảm đỏ, số điểm, nhãn nhóm đã xong;
  //   vệt sáng trên miếng vàng đứng yên), mỗi khung chỉ vẽ lửa bốn ngọn đuốc. Trước đây vẽ lại cả cây cầu mỗi khung (khoảng 20 ms).
  let cvCauKet = null, khoaCauKet = "";
  function cauKet(st) {
    const rong = Math.round(W * rDo), cao = Math.round(H * rDo);
    const khoa = [rong, cao, rDo.toFixed(4), CC.banSan, CC.Y0, CC.LH, S.B0, S.E0,
      st.lap.map(r => [0, 1, 2, 3, 4].map(k => (r[k] ? (r[k].vang ? 2 : 1) : 0)).join("")).join(",")].join("|");
    if (!cvCauKet || khoa !== khoaCauKet) {
      if (!cvCauKet) cvCauKet = document.createElement("canvas");
      if (cvCauKet.width !== rong) cvCauKet.width = rong;
      if (cvCauKet.height !== cao) cvCauKet.height = cao;
      const g = cvCauKet.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvCauKet.width, cvCauKet.height);
      g.setTransform(rDo, 0, 0, rDo, 0, 0);
      CC.veCauTinh(g, A, st, -1); CC.veCauDong(g, A, st, -1, true); veDo(g, st, st.t); CC.veSo(g, st); CC.nhan(g, RD.TO);
      khoaCauKet = khoa;
    }
    return cvCauKet;
  }
  // những thứ nặng của phần kết (lớp cầu đứng yên, nền tối, khung báo tường, nền nhoè) dựng sẵn lúc máy rảnh ngay khi bắt đầu
  //   về đích, không đợi tới khung hình đầu tiên cần tới
  let khoaHenKet = "";
  function chuanBiKet() {
    const khoa = [S.che, cv.width, cv.height, baoSo, CC.Y0, CC.LH].join("|");
    if (khoa === khoaHenKet) return;
    khoaHenKet = khoa;
    henRanh(() => { if (S.che === "hang" && daSanSang && S.ls && S.ls.length >= 6) cauKet(trangThai(dongHo()).st); });
    henRanh(() => { nenBao(); khungBao(); });
    henRanh(canhBao);
    henRanh(nenMo);
    henRanh(() => { bangChe(); luoiKeo(); vetLuot(); domCat(); domLap(); });     // hình vẽ sẵn của lễ cắt băng
  }
  // vệt sáng quét chéo (góc QG so với trục ngang) từ góc trên trái xuống góc dưới phải khung xem; s: vị trí giữa vệt sáng, đo dọc
  //   hướng quét (toạ độ thế giới)
  const QG = 22 * Math.PI / 180, QC = Math.cos(QG), QS = Math.sin(QG), QB = 150;
  function gocXem() { const E = S.ext; return [[-E.bn, -E.bd], [W + E.bn, -E.bd], [-E.bn, H + E.bd], [W + E.bn, H + E.bd]]; }
  function mepQuet(f) {
    const d = gocXem().map(p => p[0] * QC + p[1] * QS), a = Math.min(...d) - QB, b = Math.max(...d) + QB;
    return a + (b - a) * em(f);
  }
  // cắt khung vẽ: phần vệt sáng đã quét qua (sau = true) hoặc phần chưa tới
  function catQuet(c, s, sau) {
    c.save(); c.rotate(QG); c.beginPath();
    if (sau) c.rect(-3e4, -3e4, s + 3e4, 6e4); else c.rect(s, -3e4, 6e4, 6e4);
    c.restore(); c.clip();
  }
  function veVetQuet(c, s, t) {
    const n = gocXem().map(p => -p[0] * QS + p[1] * QC), n0 = Math.min(...n), n1 = Math.max(...n);
    c.save(); c.globalCompositeOperation = "lighter"; c.rotate(QG);
    const g = c.createLinearGradient(s - QB, 0, s + QB, 0);
    g.addColorStop(0, "rgba(255,196,96,0)"); g.addColorStop(.28, "rgba(255,204,112,.16)"); g.addColorStop(.4, "rgba(255,228,160,.6)");
    g.addColorStop(.46, "rgba(255,244,212,.9)"); g.addColorStop(.5, "rgba(255,250,232,.97)"); g.addColorStop(.54, "rgba(255,244,212,.9)");
    g.addColorStop(.6, "rgba(255,228,160,.6)"); g.addColorStop(.72, "rgba(255,204,112,.16)"); g.addColorStop(1, "rgba(255,196,96,0)");
    c.fillStyle = g; c.fillRect(s - QB, n0, 2 * QB, n1 - n0);
    // sao nhỏ lấp lánh dọc vệt sáng
    for (let j = 0; j < 8; j++) {
      const y = n0 + (n1 - n0) * (j + .5) / 8 + 30 * Math.sin(j * 2.3), x = s + 26 * Math.sin(j * 1.7 + t * 5), k = .55 + .45 * Math.sin(t * 11 + j * 1.9);
      CC.sao(c, x, y, 12 + 10 * k, k);
    }
    c.restore();
  }
  function veBao(c, t, nguoi) {
    const kb = khungBao(); if (!kb) return;
    const f = S.che === "bao" ? lin(t, S.H0, S.H0 + QUET) : 0, s = f > 0 && f < 1 ? mepQuet(f) : 0;
    if (f < 1) {
      // báo tường như lúc chưa bấm (khung K trên nền tối): chép tấm vẽ sẵn
      const cb = canhBao(); if (!cb) return;
      c.save();
      if (f > 0) catQuet(c, s, false);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cb, 0, 0); c.restore();
      veTrenBao(c, t, nguoi, false);
      c.restore();
    }
    if (f > 0) {
      // phần vệt sáng đã quét qua: báo tường cỡ đầy màn hình trên nền nhoè
      c.save();
      if (f < 1) catQuet(c, s, true);
      const m = nenMo();
      if (m) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(m, 0, 0); c.restore(); } else c.drawImage(nenBao(), 0, 0);
      const b = bienKF();
      if (b) { c.translate(b.cx, b.cy); c.scale(b.s, b.s); c.translate(-b.cx0, -b.cy0); }
      c.drawImage(kb.c, kb.dx, kb.dy);
      veTrenBao(c, t, nguoi, true);
      c.restore();
      if (f < 1) veVetQuet(c, s, t);
    }
  }
  // trên báo tường (toạ độ khung K): che chữ "Ô dán thiệp n", dải băng (hoặc hai nửa đã cắt), vòng sáng số 51, 4 bạn với thẻ
  //   tên nhóm; phần đã quét (sau) còn có kéo vàng, chớp sao lúc cắt, vệt sáng lướt qua dòng chữ, sao lấp lánh
  function veTrenBao(c, t, nguoi, sau) {
    const KK = S.K;
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
    const r = S.che === "bao" ? t - S.H0 : -1;          // giây kể từ lúc bấm nút cuối (chưa bấm: -1)
    veBangChe(c, t, r);
    if (nguoi) veNguoiBao(c, t);
    if (sau && r >= 0) veCatBang(c, t, r);
  }
  // dải băng đỏ che dòng chữ trên báo tường (toạ độ khung K), vẽ sẵn một lần
  const BX = K.x + .235 * K.w, BY = K.y + .069 * K.h, BW = .53 * K.w, BH = .092 * K.h;
  const bangChe = () => CC.veSan("bangChe", BW, BH, 30, (g, pad) => {
    g.translate(pad, pad);
    g.save(); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 14; g.shadowOffsetY = 6;
    const gr = g.createLinearGradient(0, 0, 0, BH); gr.addColorStop(0, "#d3392d"); gr.addColorStop(1, "#a3221b");
    g.fillStyle = gr; g.fillRect(0, 0, BW, BH); g.restore();
    g.fillStyle = "#f3c552"; g.fillRect(0, 0, BW, 5); g.fillRect(0, BH - 5, BW, 5);
    for (let k = 0; k < 9; k++) CC.sao(g, BW * (k + .5) / 9, BH / 2 + (k % 2 ? 8 : -8), k % 2 ? 9 : 12, .9);
  });
  // nửa dải băng sau khi cắt rủ xuống quanh đầu buộc: dao động tắt dần quanh 75°, vận tốc đầu bằng 0
  const ru = u => 1 - Math.exp(-4 * u) * (Math.cos(7 * u) + 4 / 7 * Math.sin(7 * u));
  function veBangChe(c, t, r) {
    const tc = r < 0 ? -1 : r - CAT;
    if (tc < 0) c.drawImage(bangChe(), BX - 30, BY - 30);
    else {
      const a = 1 - lin(tc, .6, 1.35);
      if (a > 0) {
        const bang = bangChe(), g = 75 * Math.PI / 180 * ru(tc), nua = 30 + BW / 2, hb = bang.height, yg = BY + BH / 2;
        c.save(); c.globalAlpha = a;
        c.translate(BX, yg); c.rotate(g); c.translate(-BX, -yg);
        c.drawImage(bang, 0, 0, nua, hb, BX - 30, BY - 30, nua, hb);
        c.restore();
        c.save(); c.globalAlpha = a;
        c.translate(BX + BW, yg); c.rotate(-g); c.translate(-BX - BW, -yg);
        c.drawImage(bang, nua, 0, bang.width - nua, hb, BX - 30 + nua, BY - 30, bang.width - nua, hb);
        c.restore();
      }
    }
    // vòng sáng quanh số 51 lúc chờ bấm; tắt dần khi cắt băng
    const a51 = tc < 0 ? 1 : 1 - lin(tc, 0, .5);
    if (a51 <= 0) return;
    const pu = .5 + .5 * Math.sin(t * 3.9);
    c.save(); c.globalAlpha = a51; c.globalCompositeOperation = "lighter";
    const rg = c.createRadialGradient(C51[0], C51[1], 30, C51[0], C51[1], 110 + 25 * pu);
    rg.addColorStop(0, "rgba(255,226,120,0)"); rg.addColorStop(.45, "rgba(255,220,110," + (.35 + .3 * pu) + ")"); rg.addColorStop(1, "rgba(255,200,80,0)");
    c.fillStyle = rg; c.fillRect(C51[0] - 150, C51[1] - 150, 300, 300);
    c.restore();
    c.save(); c.globalAlpha = a51;
    c.beginPath(); c.ellipse(C51[0], C51[1], 72, 50, 0, 0, 7);
    c.strokeStyle = "rgba(255,215,106,.22)"; c.lineWidth = 22 + 3 * pu; c.stroke();
    c.strokeStyle = "rgba(255,215,106,.35)"; c.lineWidth = 13 + 3 * pu; c.stroke();
    c.strokeStyle = "rgba(255,230,130,.9)"; c.lineWidth = 5 + 3 * pu; c.stroke();
    c.restore();
  }
  // cây kéo vàng: lưỡi thép, quai đỏ viền vàng. Vẽ sẵn một lưỡi (chốt kéo ở gốc toạ độ, mũi kéo hướng lên, quai ở dưới bên
  //   phải), lưỡi kia là hình lật gương. Kéo nghiêng KEO_G, chốt đặt sao cho hai lưỡi cắt đúng giữa dải băng; mũi kéo dừng dưới số 51.
  const KEO_L = 135, KEO_G = -12 * Math.PI / 180;
  const KEO_X = BX + BW / 2 + 90 * Math.sin(-KEO_G), KEO_Y = BY + BH / 2 + 90 * Math.cos(KEO_G);
  const luoiKeo = () => CC.veSan("luoiKeo", 70, KEO_L + 96, 16, (g, pad) => {
    g.translate(pad + 22, pad + KEO_L + 6);
    g.shadowColor = "rgba(40,20,0,.38)"; g.shadowBlur = 8; g.shadowOffsetY = 4;
    g.strokeStyle = "#e0a92a"; g.lineWidth = 8; g.lineCap = "round";                     // cán vàng nối chốt với quai
    g.beginPath(); g.moveTo(-1, 4); g.lineTo(13, 36); g.stroke();
    g.save(); g.translate(22, 60); g.rotate(.32);                                          // quai đỏ viền vàng
    g.beginPath(); g.ellipse(0, 0, 15, 21, 0, 0, 7);
    g.strokeStyle = "#c8261e"; g.lineWidth = 10; g.stroke();
    g.shadowColor = "transparent"; g.strokeStyle = "#ffd76a"; g.lineWidth = 2.5; g.stroke();
    g.restore();
    g.beginPath(); g.moveTo(3, 6); g.lineTo(.5, -KEO_L); g.quadraticCurveTo(-14, -KEO_L * .38, -9, 7); g.closePath();   // lưỡi thép
    const gr = g.createLinearGradient(-12, 0, 4, 0);
    gr.addColorStop(0, "#8f99a6"); gr.addColorStop(.55, "#f6f9fd"); gr.addColorStop(1, "#bcc4ce");
    g.fillStyle = gr; g.fill();
    g.shadowColor = "transparent"; g.strokeStyle = "rgba(60,68,80,.55)"; g.lineWidth = 1.2; g.stroke();
  });
  function veKeo(c, x, y, mo, a) {
    const L = luoiKeo(), ox = 38, oy = KEO_L + 22;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(KEO_G);
    c.save(); c.rotate(mo / 2); c.scale(-1, 1); c.drawImage(L, -ox, -oy); c.restore();      // lưỡi sau (lật gương): mũi sang phải khi mở
    c.save(); c.rotate(-mo / 2); c.drawImage(L, -ox, -oy); c.restore();                    // lưỡi trước: mũi sang trái khi mở
    c.fillStyle = "#f6d36a"; c.beginPath(); c.arc(0, 0, 6.5, 0, 7); c.fill();               // đinh chốt
    c.fillStyle = "#9c6a07"; c.beginPath(); c.arc(0, 0, 2.2, 0, 7); c.fill();
    c.restore();
  }
  const domCat = () => domSang("cat", "rgba(255,247,215,1)", "rgba(255,190,80,0)");
  const domLap = () => domSang("lap", "rgba(255,238,170,1)", "rgba(255,200,90,0)");
  // chớp sao lúc kéo cắt đôi dải băng (p: 0..1)
  function veChopCat(c, x, y, p) {
    const q = 1 - p, e = eo(p), R = 60 + 170 * e;
    c.save(); c.globalCompositeOperation = "lighter";
    c.globalAlpha = q * q; c.drawImage(domCat(), x - R, y - R, 2 * R, 2 * R);
    c.globalAlpha = q; c.strokeStyle = "#ffe08c"; c.lineCap = "round";
    c.lineWidth = 2 + 8 * q; c.beginPath(); c.arc(x, y, 24 + 190 * e, 0, 7); c.stroke();
    c.lineWidth = 3 + 4 * q;
    for (let j = 0; j < 10; j++) {
      const g = (j + .5) * Math.PI / 5, r1 = 30 + 150 * e, r2 = r1 + 64 * q;
      c.beginPath(); c.moveTo(x + r1 * Math.cos(g), y + r1 * Math.sin(g)); c.lineTo(x + r2 * Math.cos(g), y + r2 * Math.sin(g)); c.stroke();
    }
    CC.sao(c, x, y, 20 + 64 * q, q);
    c.restore();
  }
  // vệt sáng lướt qua dòng chữ vừa lộ ra (gl: 0..1)
  const vetLuot = () => CC.veSan("vetLuot", 220, 170, 0, g => {
    const gx = g.createLinearGradient(0, 0, 220, 0);
    gx.addColorStop(0, "rgba(255,248,225,0)"); gx.addColorStop(.3, "rgba(255,246,220,.28)"); gx.addColorStop(.44, "rgba(255,250,232,.8)");
    gx.addColorStop(.5, "rgba(255,253,244,.97)"); gx.addColorStop(.56, "rgba(255,250,232,.8)"); gx.addColorStop(.7, "rgba(255,246,220,.28)");
    gx.addColorStop(1, "rgba(255,248,225,0)");
    g.fillStyle = gx; g.fillRect(0, 0, 220, 170);
    g.globalCompositeOperation = "destination-in";
    const gy = g.createLinearGradient(0, 0, 0, 170);
    gy.addColorStop(0, "rgba(0,0,0,0)"); gy.addColorStop(.22, "rgba(0,0,0,1)"); gy.addColorStop(.78, "rgba(0,0,0,1)"); gy.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gy; g.fillRect(0, 0, 220, 170);
  });
  function veLuot(c, gl) {
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = .9 * Math.sin(Math.PI * gl);
    c.translate(BX - 60 + (BW + 120) * em(gl), BY + BH / 2); c.rotate(.3); c.drawImage(vetLuot(), -110, -85);
    c.restore();
  }
  // sao vàng lấp lánh quanh dòng chữ và số 51 sau khi cắt băng: mỗi sao loé hai lần (cách 3 giây)
  const SAO_CB = (() => {
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const d = [];
    for (let j = 0; j < 18; j++) {
      let x, y;
      if (j % 6 === 5) { const g = rnd() * 6.28; x = C51[0] + Math.cos(g) * (78 + rnd() * 20); y = C51[1] + Math.sin(g) * (48 + rnd() * 14); }
      else { x = BX - 30 + rnd() * (BW + 60); y = rnd() < .5 ? BY - 8 - rnd() * 22 : BY + BH + 6 + rnd() * 22; }
      d.push({ x, y, r: 11 + rnd() * 9, t0: .3 + j * .3 + rnd() * .2 });
    }
    return d;
  })();
  function veLapLanh(c, tc) {
    const dom = domLap();
    c.save(); c.globalCompositeOperation = "lighter";
    SAO_CB.forEach(d => [0, 3].forEach(lap => {
      const q = (tc - d.t0 - lap) / .8; if (q <= 0 || q >= 1) return;
      const k = Math.sin(Math.PI * q);
      c.globalAlpha = .7 * k; c.drawImage(dom, d.x - 2.2 * d.r, d.y - 2.2 * d.r, 4.4 * d.r, 4.4 * d.r);
      CC.sao(c, d.x, d.y, d.r * (.4 + .6 * k), k);
    }));
    c.restore();
  }
  // lễ cắt băng (r: giây kể từ lúc bấm nút cuối)
  function veCatBang(c, t, r) {
    const tc = r - CAT;
    // kéo vàng đưa vào và mở ra, khép lại cắt đôi dải băng ở giữa, rồi lùi ra và tan
    if (r >= KEO && tc < .45) {
      const vao = eo(lin(r, KEO, KEO + .3)), lui = em(lin(tc, 0, .45));
      const mo = tc >= 0 ? 0 : r < CAT - .18 ? 8 + 22 * vao : 30 * (1 - em(lin(r, CAT - .18, CAT)));
      veKeo(c, KEO_X + 70 * (1 - vao) + 46 * lui, KEO_Y + 56 * (1 - vao) + 40 * lui, mo * Math.PI / 180, vao * (1 - lui));
    }
    if (tc >= 0 && tc < .7) veChopCat(c, BX + BW / 2, BY + BH / 2, tc / .7);
    const gl = lin(tc, .8, 1.8);
    if (gl > 0 && gl < 1) veLuot(c, gl);
    if (tc > .2 && tc < 9.6) veLapLanh(c, tc);
  }
  const choDuoc = i => [CC.xCanhDuoc(i), CC.yChan(i)];
  function nguoiBao(t) {
    const KK = S.K;
    return [0, 1, 2, 3].map(i => {
      const p = lin(t, KK.S0 + i * .12, KK.S0 + i * .12 + 2.0);
      const [x0, y0] = choDuoc(i), [x1, y1] = choO(i);
      const o = CC.diChuyen(i, x0, y0, x1, y1, p, 6);
      o.h = 172 * CC.KS + (180 - 172 * CC.KS) * p;
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
  // pháo giấy bắn lên từ hai góc dưới lúc cắt băng (như pháo kim tuyến ở lễ khánh thành): kim tuyến vàng, bạc và giấy màu bay
  //   vút lên, chậm dần rồi rơi lả tả; khung xem cao (điện thoại cầm dọc) thì bắn cao theo
  function vePhaoBan(c, t) {
    const u = t - S.H0 - CAT; if (u < 0 || u > 6) return;
    const E = S.ext, sy = Math.max(1, E.EH / H), sx = Math.max(1, E.EW / W), k = 1.5, g = 380 * sy;
    if (u < .35) {                                       // chớp sáng ở hai miệng pháo
      const R = 90 + 160 * eo(u / .35);
      c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 1 - u / .35;
      c.drawImage(domCat(), -E.bn - R, H + E.bd - R, 2 * R, 2 * R); c.drawImage(domCat(), W + E.bn - R, H + E.bd - R, 2 * R, 2 * R);
      c.restore();
    }
    let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const MAU = ["#ffd76a", "#e9532f", "#ffffff", "#2f9a58", "#2f6fd6", "#ff8fb1", "#8b52cc"];
    for (let j = 0; j < 150; j++) {
      const ben = j % 2, de = rnd() * .15, goc = (6 + rnd() * 30) * Math.PI / 180, v = 1450 + rnd() * 750;
      const kim = rnd() < .45, m = kim ? (rnd() < .6 ? "#ffd76a" : "#e6ebf2") : MAU[Math.floor(rnd() * MAU.length)];
      const w = kim ? 4 : 10 + rnd() * 6, h = kim ? 22 + rnd() * 12 : 13 + rnd() * 8, ph = rnd() * 6.3, sp = 2 + rnd() * 6, lac = 25 + rnd() * 40;
      const tt = u - de; if (tt <= 0) continue;
      const e = 1 - Math.exp(-k * tt), vx = v * Math.sin(goc) * sx * (ben ? -1 : 1), vy = -v * Math.cos(goc) * sy;
      const x = (ben ? W + E.bn - 20 : -E.bn + 20) + vx * e / k + Math.sin(tt * 2.4 + ph) * lac * Math.min(1, tt);
      const y = H + E.bd + 10 + (vy + g / k) * e / k - g / k * tt;
      if (y > H + E.bd + 40) continue;
      c.save(); c.translate(x, y); c.rotate(tt * sp + ph); c.scale(1, Math.cos(tt * sp * 1.3 + ph));
      c.fillStyle = m; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
    }
  }
  // pháo giấy rơi khắp khung xem sau khi cắt băng
  function vePhaoGiay(c, t) {
    const t0 = S.H0 + CAT + .1; if (t < t0 || t > t0 + 6) return;
    let s = 5; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const MAU = ["#ffd76a", "#e9532f", "#2f9a58", "#2f6fd6", "#8b52cc", "#ff8fb1", "#ffffff"];
    const E = S.ext;                    // 6/11 chiều: rơi khắp khung xem (cả phần dư ngoài khung 16:9)
    for (let j = 0; j < 240; j++) {
      const x0 = -E.bn + rnd() * E.EW, de = rnd() * 1.4, v = (260 + rnd() * 220) * E.EH / H, w = 9 + rnd() * 8, h = 14 + rnd() * 10, m = MAU[Math.floor(rnd() * MAU.length)], ph = rnd() * 6, sp = 2 + rnd() * 5;
      const tt = t - t0 - de; if (tt < 0) continue;
      const y = -E.bd - 30 + tt * v, x = x0 + Math.sin(tt * 2 + ph) * 40; if (y > H + E.bd + 30) continue;
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
  //   Màn hình không đúng 16:9 (laptop 16:10, cửa sổ Claude) thì lớp này dư thêm mép (mx, my điểm ảnh) quanh thế giới:
  //   ảnh nền soi gương, tối dần ra ngoài như #nenNgoai.
  let tinhMx = 0, tinhMy = 0;
  function lopTinh(st, cot, f) {
    const mx = Math.ceil(S.ext.bn * f) + (S.ext.bn > 0 ? 2 : 0), my = Math.ceil(S.ext.bd * f) + (S.ext.bd > 0 ? 2 : 0);
    const rong = Math.round(W * f) + 2 * mx, cao = Math.round(H * f) + 2 * my;
    const khoa = [rong, cao, f.toFixed(4), mx, my, cot, CC.banSan,
      st.lap.map(r => [0, 1, 2, 3, 4].map(k => (k === cot ? "-" : r[k] ? (r[k].vang ? 2 : 1) : 0)).join("")).join(",")].join("|");
    if (khoa !== khoaTinh || !cvTinh) {
      if (!cvTinh) cvTinh = document.createElement("canvas");
      if (cvTinh.width !== rong) cvTinh.width = rong;
      if (cvTinh.height !== cao) cvTinh.height = cao;
      const g = cvTinh.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvTinh.width, cvTinh.height);
      if (mx || my) veGuongNen(g, f, mx, my);
      g.setTransform(f, 0, 0, f, mx, my);
      g.drawImage(A.nen, 0, 0, W, H);
      CC.veCauTinh(g, A, st, cot);
      khoaTinh = khoa; tinhMx = mx; tinhMy = my;
      SK.soLanVeTinh = (SK.soLanVeTinh || 0) + 1;
    }
    return cvTinh;
  }

  // ảnh nền soi gương ra mép dư (vẽ trước ảnh nền chính, lấn vào trong 2 điểm ảnh để chỗ nối không hở), tối dần ra ngoài
  //   giống hệt #nenNgoai (dải tối kéo dài thêm 40 px ngoài màn hình) để lúc đốt cầu chuyển sang #nenNgoai không thấy khác
  function veGuongNen(g, f, mx, my) {
    const N = A.nen, nw = N.naturalWidth || N.width, nh = N.naturalHeight || N.height, LAN = 2 / f;
    const toi = (x0, y0, x1, y1, w, h, x, y) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, "rgba(3,8,20,0)"); gr.addColorStop(1, "rgba(3,8,20,.5)");
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    };
    if (my) {
      const h = Math.min(H, my / f), sh = h * nh / H;
      g.setTransform(f, 0, 0, -f, mx, my);                       // trên: lật quanh y = 0
      g.drawImage(N, 0, 0, nw, sh, 0, -LAN, W, h + LAN);
      g.setTransform(f, 0, 0, -f, mx, my + 2 * H * f);           // dưới: lật quanh y = H
      g.drawImage(N, 0, nh - sh, nw, sh, 0, H - h, W, h + LAN);
      g.setTransform(f, 0, 0, f, mx, my);
      toi(0, 0, 0, -h - 40, W, h, 0, -h); toi(0, H, 0, H + h + 40, W, h, 0, H);
    }
    if (mx) {
      const w = Math.min(W, mx / f), sw = w * nw / W;
      g.setTransform(-f, 0, 0, f, mx, my);                       // trái: lật quanh x = 0
      g.drawImage(N, 0, 0, sw, nh, -LAN, 0, w + LAN, H);
      g.setTransform(-f, 0, 0, f, mx + 2 * W * f, my);           // phải: lật quanh x = W
      g.drawImage(N, nw - sw, 0, sw, nh, W - w, 0, w + LAN, H);
      g.setTransform(f, 0, 0, f, mx, my);
      toi(0, 0, -w - 40, 0, w, H, -w, 0); toi(W, 0, W + w + 40, 0, w, H, W, 0);
    }
  }

  // Claude nhảy múa thổi kèn trong lúc bình luận (mỗi câu một kiểu nhảy); mờ dần khi bắt đầu về đích.
  //   7/11 (thầy Thịnh: "chỉnh cho claude đứng thấp xuống dưới gần sát cây cầu và nhích qua bên phải 1 chút"): trước đây Claude
  //   neo theo đỉnh màn hình, ngay dưới nhãn câu (tâm x 118, y 176). Nay chân hình cách mép trên cây cầu 4 px, tâm x 165 (giữa
  //   hai cột đèn đầu cầu). Vẽ trước các bạn nhỏ và cắt ở mép cầu: quầng sáng, tia sáng, pháo giấy không tràn xuống làn cầu;
  //   bạn ở làn trên cùng đi ngang qua thì đầu và đuốc nằm phía trước Claude.
  const CLAUDE_X = 165, CLAUDE_W = 196, CLAUDE_HO = 4;
  function veClaudeCau(t, E) {
    let p, mo, kieu;
    if (S.che === "hang" && S.K) {
      // 8/11 thầy Thịnh: "tôi bấm vào thì cả 4 nhóm lên đốt đuốc, claude bình luận về thứ hạng": bấm "Tổng kết" thì Claude
      //   ra đứng chỗ cũ (bật lên xoay vòng, pháo giấy), bình luận thứ hạng; bấm "Tiếp theo" thì mờ dần
      if (!A.claude) return;
      p = t - (S.B0 + .3); mo = S.tiep ? 1 - lin(t, S.T0, S.T0 + .5) : 1; kieu = 2;
    } else {
      const qB = S.che === "cau" ? S.q : (S.che === "dich" ? 5 : 0);
      if (!qB || !S.L || S.L.q !== qB || !A.claude) return;
      p = t - (S.R0 + S.L.board + .2); mo = S.che === "dich" ? 1 - lin(t, S.E0, S.E0 + .5) : 1; kieu = qB - 1;
    }
    if (p < 0 || mo <= 0) return;
    const im = A.claude[0], h = CLAUDE_W * im.height / im.width;
    ctx.save(); ctx.globalAlpha = mo;
    ctx.beginPath(); ctx.rect(-E.bn, -E.bd, E.EW, CC.Y0 + E.bd + 2); ctx.clip();
    CC.veClaude(ctx, A, p, CLAUDE_X, CC.Y0 - CLAUDE_HO - h / 2, CLAUDE_W, kieu);
    ctx.restore();
  }
  SK.choClaude = () => { const im = A && A.claude && A.claude[0]; return im ? { x: CLAUDE_X, y: CC.Y0 - CLAUDE_HO - CLAUDE_W * im.height / im.width / 2, w: CLAUDE_W, h: CLAUDE_W * im.height / im.width } : null; };

  /* ---------- vẽ một khung hình ---------- */
  // 6/11 chiều: bỏ máy quay phóng to (thầy Thịnh: "chỉnh đường chạy dài lên trên và xuống dưới chứ không phải phóng to");
  //   cả cây cầu luôn nằm trọn trong màn hình, làn cao ra theo khung xem (vuaManHinh).
  function veKhung(t) {
    const E = S.ext, ox = Math.round(E.bn * rDo), oy = Math.round(E.bd * rDo);   // gốc khung 16:9 trong khung vẽ
    const KK = S.K, ket = (S.che === "hang" || S.che === "bao") && KK, dem = !ket || t < KK.BURN0;
    const sanSang = daSanSang && S.ls;
    // lúc vẽ cầu, lớp đứng yên (ảnh nền + mép soi gương) phủ kín khung vẽ nên khỏi xoá
    if (!(dem && sanSang)) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(rDo, 0, 0, rDo, ox, oy);
    if (!sanSang) { ctx.fillStyle = "#0b1428"; ctx.fillRect(-E.bn, -E.bd, E.EW, E.EH); return; }
    const { st, no } = trangThai(t);
    if (S.che === "dich" || S.che === "hang") chuanBiKet();
    if (dem) {
      const cot = cotBay(t), tinh = lopTinh(st, cot, rDo);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tinh, ox - tinhMx, oy - tinhMy);
      ctx.setTransform(rDo, 0, 0, rDo, ox, oy);
      CC.veNenDong(ctx, A, t); CC.veCauDong(ctx, A, st, cot); veDo(ctx, st, t); veNo(ctx, no);
      veClaudeCau(t, E);
      CC.veNguoi(ctx, A, nguoiCau(t), t);
      (st.sang || []).forEach(d => CC.veSaoRoi(ctx, d.i, d.x, t, d.a == null ? 1 : d.a));
      CC.veSo(ctx, st);
      if (ket) veTiaLua(ctx, t);
      CC.nhan(ctx, RD.TO);
    } else {
      const R = banKinh(t), u = lin(t, KK.BURN0, KK.BURN1);
      if (u < 1) {
        // 6/11 tối (thầy Thịnh: "phần chuyển cảnh sang báo tường bị lag với giật"): trên máy không có card đồ hoạ mỗi khung lửa đốt
        //   mất khoảng 50 ms. Nay báo tường chỉ vẽ trong khung bao quanh lỗ cháy (chỗ khác màn đêm còn che); màn đêm vẽ thẳng lên
        //   khung vẽ, cắt bỏ phần đã cháy (trước đây vẽ ra lớp riêng, khoét lỗ rồi chép cả khung); cây cầu dùng lớp vẽ sẵn.
        const m = Math.ceil(1.2 * R + 60);
        ctx.save(); ctx.beginPath(); ctx.rect(C51[0] - m, C51[1] - m, 2 * m, 2 * m); ctx.clip();
        veBao(ctx, t, t >= KK.S0);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
        ctx.beginPath(); ctx.rect(0, 0, W, H); duongChay(ctx, R, t, true); ctx.clip("evenodd");
        CC.veNen(ctx, A, t);
        ctx.restore();
        veMepChay(ctx, R, t);
      } else veBao(ctx, t, t >= KK.S0);
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
      // cây cầu không bị đốt: mờ dần khi báo tường đã lộ gần hết. Cả cây cầu đã vẽ sẵn thành một tấm phẳng (cauKet) nên chép thẳng
      //   lên khung vẽ với độ mờ là cả cây cầu mờ đều; mỗi khung chỉ vẽ thêm lửa bốn ngọn đuốc
      const ac = 1 - lin(t, KK.F0 + 2.4, KK.F0 + 4.0);
      if (ac > 0) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = ac;
        ctx.drawImage(cauKet(st), ox, oy);
        ctx.setTransform(rDo, 0, 0, rDo, ox, oy);
        CC.veLuaDuoc(ctx, st);
        ctx.restore();
      }
      if (t < KK.S0) CC.veNguoi(ctx, A, [0, 1, 2, 3].map(i => ({ i, x: choDuoc(i)[0], y: choDuoc(i)[1], hang: KK.hang[i] })), t);
      veTiaLua(ctx, t);
    }
    if (S.che === "bao") { vePhaoBan(ctx, t); vePhaoGiay(ctx, t); }
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
      datKieu(UI.bx, "transform", "translateX(" + (60 * (1 - vao)).toFixed(1) + "px) scale(" + BX_S + ")");
      veBang(t, q);
    }
    // bóng nói lời bình (chữ hiện dần như đang gõ)
    // 8/11 thầy Thịnh: "claude bình luận về thứ hạng": bước Tổng kết (cảnh thứ hạng) có lời bình thứ hạng (q = 6), hiện khi
    //   ngọn đuốc cuối đã sáng, mờ dần khi bấm "Tiếp theo". Lúc này không có bảng điểm nên bóng nói rộng tới gần nút góc phải.
    const KK = S.K, hangCanh = S.che === "hang" && !!KK;
    const bq = hangCanh ? 6 : q, b0 = hangCanh ? KK.L0 + .4 : L ? S.R0 + L.board + .2 : CHUA;
    const moBinh = hangCanh ? (S.tiep ? 1 - lin(t, S.T0, S.T0 + .5) : 1) : moDich;
    const coBinh = (hangCanh ? moBinh > 0 : !!L && L.q === q && (cau || (dich && moDich > 0))) && t >= b0;
    datAn(UI.binh, !coBinh);
    if (coBinh) {
      const L0 = hangCanh ? 306 : Math.max(306, (UI.pillW || 0) + 24), R = hangCanh ? BINH_PHAI_HANG : BINH_PHAI;
      datKieu(UI.binh, "left", L0 + "px"); datKieu(UI.binh, "width", (R - L0) + "px");
      datKieu(UI.binh, "opacity", String(moBinh));
      const B = S.binh;
      if (B.q !== bq || !B.chu) { if (UI.binh.dataset.cho !== "1") { UI.binh.dataset.cho = "1"; UI.binh.innerHTML = '<span class="cho"><i></i><i></i><i></i></span>'; } }
      else {
        const bd = Math.max(b0, B.luc), n = Math.floor((t - bd) * 48), chu = B.chu.slice(0, Math.max(0, Math.min(B.chu.length, n)));
        if (UI.binh.dataset.cho === "1" || UI.binh.textContent !== chu) { UI.binh.dataset.cho = ""; UI.binh.textContent = chu; }
      }
    }
    // nút trên TV
    // 8/11 thầy Thịnh: "khi nhóm 1 đốt đuốc xong thì hiện lên chữ tổng kết. tôi bấm vào thì cả 4 nhóm lên đốt đuốc, claude bình
    //   luận về thứ hạng. chữ tổng kết chuyển thành tiếp theo". Nút "Tổng kết" (trước là "Thứ hạng các nhóm") hiện khi nhóm về
    //   nhất đã thắp đuốc; bấm rồi thì nút mờ đi đứng chờ các nhóm còn lại thắp đuốc và Claude nói xong, rồi chữ trên nút đổi
    //   thành "Tiếp theo" (nút Tiếp theo hiện đúng chỗ đó, nảy nhẹ)
    const TTL = hangCanh && !S.tiep ? lucTiep(KK) : CHUA;
    const NT = (S.ext && S.ext.nutTo) || 1;
    let thHien = false, thBam = false, thCho = false, thS = 1, thA = 1;
    if (KK && dich && t >= KK.HTH) { thHien = true; thA = lin(t, KK.HTH, KK.HTH + .3); thS = (.8 + .2 * eb(lin(t, KK.HTH, KK.HTH + .5))) * (1 + .03 * Math.sin(t * 4)); }
    if (hangCanh && !S.tiep && t < TTL + .2) {
      thHien = true;
      if (t < S.B0 + .25) { thBam = true; thS = .93; }
      else { thCho = true; thA = .62 * (1 - lin(t, TTL - .05, TTL + .2)); }
    }
    datAn(UI.nutTH, !thHien);
    if (thHien) { UI.nutTH.classList.toggle("bam", thBam); UI.nutTH.classList.toggle("cho", thCho); datKieu(UI.nutTH, "transform", "scale(" + (thS * NT).toFixed(3) + ")"); datKieu(UI.nutTH, "opacity", String(thA)); }
    // 8/11: nút "Tiếp theo" hiện khi cả bốn ngọn đuốc đã sáng và Claude đã bình luận xong; bấm thì mới tới tia lửa, lửa đốt màn
    //   đêm và báo tường
    let ttHien = false, ttBam = false, ttS = 1, ttA = 1;
    if (hangCanh && !S.tiep && t >= TTL) { ttHien = true; ttA = lin(t, TTL, TTL + .3); ttS = (.8 + .2 * eb(lin(t, TTL, TTL + .5))) * (1 + .03 * Math.sin(t * 4)); }
    if (KK && S.che === "hang" && S.tiep && t < S.T0 + .25) { ttHien = true; ttBam = true; ttS = .93; }
    datAn(UI.nutTT, !ttHien);
    if (ttHien) { UI.nutTT.classList.toggle("bam", ttBam); datKieu(UI.nutTT, "transform", "scale(" + (ttS * NT).toFixed(3) + ")"); datKieu(UI.nutTT, "opacity", String(ttA)); }
    let hbHien = false, hbBam = false, hbS = 1, hbA = 1;
    if (KK && S.che === "hang" && t >= KK.HB) { hbHien = true; hbA = lin(t, KK.HB, KK.HB + .3); hbS = (.8 + .2 * eb(lin(t, KK.HB, KK.HB + .5))) * (1 + .03 * Math.sin(t * 4)); }
    if (KK && S.che === "bao" && t < S.H0 + .25) { hbHien = true; hbBam = true; hbS = .93; }
    datAn(UI.nutHB, !hbHien);
    if (hbHien) { UI.nutHB.classList.toggle("bam", hbBam); datKieu(UI.nutHB, "transform", "scale(" + (hbS * NT).toFixed(3) + ")"); datKieu(UI.nutHB, "opacity", String(hbA)); }
    // báo tường đã lộ ra: hai cụm nút (góc trái, góc phải) dựng thành cột sát mép trái và mép phải, khỏi che góc báo tường
    const docNut = !!KK && !(S.ext && S.ext.nutHang) && (S.che === "bao" || (S.che === "hang" && t >= KK.BURN1));
    if (UI.tvNut) UI.tvNut.classList.toggle("doc", docNut);
    if (UI.tvNutPhai) UI.tvNutPhai.classList.toggle("doc", docNut);
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
      datKieu(d.el, "top", (40 + r * 50).toFixed(1) + "px");      // 6/11: bảng điểm gọn, nằm trên mép cầu
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
  // bạn về nhất bước lên thảm VỀ ĐÍCH (ngay sau câu 5): cả lớp vỗ tay
  function tiengVeDich() { hen(S.K.W0 + .85, () => am().voTay && am().voTay()); }
  function tiengDich() {
    if (S.K.W0 + .85 > dongHo()) tiengVeDich();                 // bấm "Đốt đuốc" sớm, lúc bạn về nhất chưa tới thảm
    hen(S.K.TN, () => am().bungLua && am().bungLua());          // nhóm về nhất thắp đuốc
  }
  function tiengHang() {
    const KK = S.K, t = dongHo();
    // mỗi lượt thắp đuốc theo hạng (bấm "Tiếp theo" lúc các nhóm còn đang thắp thì chỉ hẹn các lượt chưa tới, khỏi kêu hai lần)
    KK.nhom.forEach(g => { if (KK.CHAY[g[0]] > t) hen(KK.CHAY[g[0]], () => am().bungLua && am().bungLua()); });
    if (KK.F0 < CHUA) hen(KK.F0 + .9, () => am().trong && am().trong(1));               // bốn tia lửa chạm số 51 (sau "Tiếp theo")
  }
  function tiengBao() {
    // 8/11 tối: trống dồn lúc vệt sáng quét và kéo vàng đưa vào; lúc kéo cắt đôi dải băng: tiếng trống, khúc mộc cầm, vỗ tay
    hen(S.H0, () => am().trongDon && am().trongDon(CAT - .1));
    hen(S.H0 + CAT, () => { am().trong && am().trong(1); am().ken && am().ken(); });
    hen(S.H0 + CAT + .1, () => am().voTay && am().voTay());     // 8/11 thầy Thịnh: "bấm nút hiện báo tường thì sẽ có tiếng vỗ tay"
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
  // 6/11 chiều, thầy Thịnh (laptop 2560×1600, tức 1280×800 điểm ảnh CSS, 16:10): "phần trên và dưới bị chừa chỗ nhiều quá nên hãy
  //   chỉnh đường chạy dài lên trên và xuống dưới", "không phải vừa màn hình mà canh vừa đủ thôi, còn chừa chỗ cho Claude nhận xét".
  //   Mép trên cầu cách đỉnh màn hình CAU_TREN (toạ độ thế giới) để nhãn câu, lời Claude và bảng điểm nằm trên cầu;
  //   mép dưới cầu nằm trên hàng nút góc trái. Làn cao 120 tới 190 px (laptop 16:10 khoảng 184, TV 16:9 khoảng 163);
  //   làn chạm 190 px thì cầu nằm giữa khoảng đó.
  // 6/11 tối (thầy Thịnh: "cho đường chơi nhỏ xuống 1 chút và phóng to bảng điểm lên"): bảng điểm to 1,35 lần, neo góc phải trên
  //   (CSS .bx: rộng 284, cao 246, cách đỉnh 14); cầu bắt đầu ngay dưới bảng điểm (chừa 24 px vì cột đuốc nhô lên 18 px trên mặt
  //   cầu) nên làn thấp đi một chút (laptop 16:10 khoảng 159 px thay 184, TV 16:9 khoảng 138 thay 163). Lời Claude hẹp lại để
  //   không chạm bảng điểm.
  const BX_S = 1.35, BX_W = 284, BX_H = 246, BX_TREN = 14, BX_PHAI = 1622 + 284;
  const BINH_PHAI = Math.round(BX_PHAI - BX_W * BX_S - 18);
  const BINH_PHAI_HANG = 1600;     // 8/11: bước Tổng kết không có bảng điểm, chỉ chừa chỗ cho nút Tổng kết / Tiếp theo ở góc phải
  const CAU_TREN = Math.round(BX_TREN + BX_H * BX_S + 24);   // 370: mép trên cầu không cao hơn mức này (thảm, cột đuốc nhô 10, 18 px)
  // 6/11 trưa (thầy Thịnh: "bảng điểm đè lên đuốc rồi nên hãy cho đường chạy nhỏ xuống"): đuốc nhóm 1 (kể cả mấy đốm sáng quanh
  //   miệng đuốc) nhô lên khỏi mặt cầu một đoạn (doanNho, tuỳ chiều cao làn) và nằm ngay dưới bảng tổng điểm, nên mép trên cầu phải
  //   thấp hơn đáy bảng một đoạn bằng đó cộng 10 px. Chọn làn cao nhất (190 trở xuống) mà cầu vẫn nằm trên hàng nút; cửa sổ thấp
  //   (trình duyệt không toàn màn hình, có thanh dấu trang) thì làn thấp tới 104 px. Laptop 16:10 toàn màn hình khoảng 145 px,
  //   cửa sổ 1280×640 khoảng 109 px, TV 16:9 khoảng 123 px, khung Claude 830×630 vẫn 190 px.
  const BANG_DAY = BX_TREN + BX_H * BX_S, LH_MIN = 104;
  const doanNho = lh => { const ks = Math.min(lh / 120, 1.4), ds = 1 + .4 * (ks - 1); return 190 * ds - (CC.BEAM + lh / 2 + 40 * ks); };
  function chonLan(tren, y1) {
    let lh = 190, y0 = 0;
    for (; lh >= LH_MIN; lh--) {
      y0 = tren + Math.max(CAU_TREN, BANG_DAY + 10 + doanNho(lh));
      if (y0 + 4 * lh + 5 * CC.BEAM <= y1) return { y0, lh };
    }
    return { y0: tren + Math.max(CAU_TREN, BANG_DAY + 10 + doanNho(LH_MIN)), lh: LH_MIN };
  }
  // vương miện vàng đội trên ảnh nhóm đang dẫn đầu bảng tổng điểm (CSS .dong.nhat .vm)
  const VUONG_MIEN = '<svg class="vm" viewBox="0 0 28 21" aria-hidden="true"><path d="M3 16.5L1.6 5.2l7 5.4L14 2.2l5.4 8.4 7-5.4L25 16.5z" fill="#ffd23a" stroke="#8a5200" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 14.6l-.8-6 3.9 3z" fill="#fff3b0" opacity=".8"/><rect x="3" y="15.6" width="22" height="4.2" rx="1.6" fill="#eaa21c" stroke="#8a5200" stroke-width="1.1"/><circle cx="14" cy="17.7" r="1.5" fill="#e2402e"/><circle cx="8.6" cy="17.7" r="1" fill="#fff3c4"/><circle cx="19.4" cy="17.7" r="1" fill="#fff3c4"/><circle cx="14" cy="2.4" r="1.9" fill="#fff6cf" stroke="#8a5200" stroke-width=".8"/><circle cx="1.8" cy="5.2" r="1.5" fill="#fff6cf" stroke="#8a5200" stroke-width=".7"/><circle cx="26.2" cy="5.2" r="1.5" fill="#fff6cf" stroke="#8a5200" stroke-width=".7"/></svg>';
  // chỗ chừa dưới đáy cho các cụm nút, điểm ảnh CSS: 74 = nút cao 52 + cách đáy 14 + 8; màn hình hẹp (điện thoại cầm dọc) hai hàng
  //   nút thì nhiều hơn. Lấy từ biến CSS --nutDuoi của #tv (đổi theo cỡ màn hình trong ruoc-duoc.html)
  function nutDuoi() {
    const tv = document.getElementById("tv"), v = tv ? parseFloat(getComputedStyle(tv).getPropertyValue("--nutDuoi")) : NaN;
    return v > 0 ? v : 74;
  }
  SK.doNet = 1;
  SK.khoiTao = function () {
    cv = $("#cv"); ctx = cv.getContext("2d");
    UI.tieu = $("#tieu"); UI.luat = $("#luat"); UI.pill = $("#pill"); UI.binh = $("#binh"); UI.bx = $("#bx");
    UI.nutTH = $("#nutThuHang"); UI.nutTT = $("#nutTiepTheo"); UI.nutHB = $("#nutHienBao"); UI.nenNgoai = $("#nenNgoai"); UI.tvNut = $("#tvNut"); UI.tvNutPhai = $("#tvNutPhai");
    UI.dong = RD.TO.map(T => {
      const d = document.createElement("div"); d.className = "dong"; d.style.setProperty("--m", T.mau); d.style.setProperty("--n", T.nhat);
      d.innerHTML = '<i class="quang"></i><i class="luot"></i><span class="h">1</span><img src="' + T.mat + '" alt=""><span class="t">' + T.ten + '</span><span class="d">0</span>' + VUONG_MIEN;
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
    // khung vẽ phủ cả phần dư; khung 16:9 nằm giữa, lệch (bn, bd)
    const bn = Math.max(0, (vw / k - W) / 2), bd = Math.max(0, (vh / k - H) / 2);
    wd.style.setProperty("--bdT", bd.toFixed(2) + "px");          // chữ và nút neo theo đỉnh, đáy màn hình thật
    // 8/11 thầy Thịnh: "thu nhỏ lại thì phần phím bị đè lên đáp án": đáy thẻ câu hỏi nằm trên hai cụm nút dưới đáy màn hình
    //   (chừa 8 px); cửa sổ dư trên dưới đủ chỗ (16:10) thì thẻ vẫn cao như cũ (đáy ở 1066)
    const ND = nutDuoi();
    wd.style.setProperty("--dayThe", Math.min(H - 14, H + bd - ND / k).toFixed(1) + "px");
    // làn cầu theo khung xem
    const tren = -bd, duoi = H + bd, y1 = duoi - Math.max(20, ND / k) - 4;
    const { y0, lh } = chonLan(tren, y1), du = Math.max(0, y1 - y0 - (4 * lh + 5 * CC.BEAM));
    if (CC.datHinh(y0 + du / 2, lh, tren, duoi) && S.ls) datSoLieu(S.ls);
    // báo tường sau khi bấm nút cuối "Tiếp theo" (trước là "Hiện báo tường"): cả viền gỗ (16 px quanh ảnh) cao vừa màn hình, cách mép 8 px; hai bên chừa 76 px cho
    //   cột nút; toạ độ thế giới.
    // 8/11 chiều (thầy mở trên điện thoại cầm dọc): hai cột nút hai bên che mép báo tường. Chọn cách cho báo tường to hơn: hai
    //   cột nút hai bên (màn hình ngang) hay nút vẫn nằm dưới đáy (màn hình dọc: báo tường rộng gần hết bề ngang, trên dưới
    //   còn nhiều chỗ). Nút nằm dưới đáy thì báo tường lúc chưa bấm (khung K) cũng phải ở trên hàng nút.
    const tl = (K.h + 32) / (K.w + 32);
    const hCot = Math.min(vh - 16, (vw - 152) * tl), hHang = Math.min(vh - 2 * (ND + 8), (vw - 24) * tl);
    const nutHang = hHang > hCot && vh / 2 + (K.y + K.h + 16 - H / 2) * k <= vh - ND - 8;
    const sb = Math.max(1, (nutHang ? hHang : hCot) / k / (K.h + 32)), hb = K.h * sb, wb = K.w * sb;
    S.ext = { bn, bd, EW: W + 2 * bn, EH: H + 2 * bd, KF: { x: W / 2 - wb / 2, y: H / 2 - hb / 2, w: wb, h: hb }, nutHang,
      // nút Tổng kết / Tiếp theo / Tiếp theo cuối: chữ trên màn hình thật không nhỏ hơn 16 px (điện thoại)
      nutTo: Math.max(1, .5 / k) };
    // nút "Tiếp theo" cuối (#nutHienBao, góc phải dưới): nút dưới đáy thì đứng trên các hàng nút
    wd.style.setProperty("--hbDuoi", (nutHang ? ND / k : 8).toFixed(1) + "px");
    datKieu(cv, "left", (-bn).toFixed(1) + "px"); datKieu(cv, "top", (-bd).toFixed(1) + "px");
    datKieu(cv, "width", S.ext.EW.toFixed(1) + "px"); datKieu(cv, "height", S.ext.EH.toFixed(1) + "px");
    { const w = Math.round(S.ext.EW * rDo), h = Math.round(S.ext.EH * rDo); if (cv.width !== w) cv.width = w; if (cv.height !== h) cv.height = h; }
  };

  // cho bài thử: khung báo tường (kể cả viền gỗ) trên màn hình thật, điểm ảnh CSS; nutHang: nút vẫn nằm dưới đáy
  SK.khungBao = function () {
    const k = SK.k, vw = window.innerWidth, vh = window.innerHeight, E = S.ext;
    const F = (S.che === "bao" && E && E.KF) ? E.KF : K, v = 16 * F.w / K.w;
    return { l: vw / 2 + (F.x - v - W / 2) * k, t: vh / 2 + (F.y - v - H / 2) * k, r: vw / 2 + (F.x + F.w + v - W / 2) * k,
      b: vh / 2 + (F.y + F.h + v - H / 2) * k, nutHang: !!(E && E.nutHang) };
  };

  /* ---------- điều khiển từ trò chơi ---------- */
  // o = { che, q, ls (kết quả sau từng câu: ls[0..n]), hoatCanh, gioiThieu }
  SK.dat = function (o) {
    const t = dongHo(), hc = !!o.hoatCanh;
    const cheCu = S.che, qCu = S.q, w0Cu = S.W0;
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
    // 8/11: bước "Tiếp theo" (o.tiep) vẫn là cảnh thứ hạng; bấm lúc các nhóm còn đang thắp đuốc thì giữ mốc B0 để các nhóm
    //   thắp nốt, rồi tia lửa mới bay lên số 51
    const tiepCu = S.tiep;
    S.tiep = o.che === "hang" && !!o.tiep;
    S.B0 = o.che === "hang" ? (S.tiep ? ((hc && cheCu === "hang" && !tiepCu) ? S.B0 : XA) : (hc ? t : XA)) : o.che === "bao" ? XA : CHUA;
    S.T0 = o.che === "hang" ? (S.tiep ? (hc ? t : XA) : CHUA) : o.che === "bao" ? XA : CHUA;
    S.H0 = o.che === "bao" ? (hc ? t : XA) : CHUA;
    // bạn về nhất bước lên thảm VỀ ĐÍCH ngay sau khi các bạn qua khúc cầu cuối và bảng tổng điểm cập nhật (câu 5, có hoạt cảnh).
    //   Vào thẳng câu 5 hay các bước sau (tải lại trang, lùi lại) thì bạn đó đã đứng sẵn cạnh đuốc.
    if (o.che === "cau" && o.q === 5) S.W0 = S.R0 + S.L.board + .8;
    else if (o.che === "dich") S.W0 = (hc && cheCu === "cau" && qCu === 5 && w0Cu < CHUA) ? w0Cu : XA;
    else if (o.che === "hang" || o.che === "bao") S.W0 = XA;
    else S.W0 = CHUA;
    S.K = mocKet();
    if (hc) {
      if (o.che === "cau") { tiengCau(); if (o.q === 5 && S.K) tiengVeDich(); }
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
