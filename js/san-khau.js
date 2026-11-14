/* Rước đuốc: sân khấu cây cầu trên màn hình TV (clip bản 8, thầy Thịnh duyệt 5/11/2026: "ok rồi đó, viết game đi")
   Cây cầu 4 làn nhìn từ trên xuống, mỗi làn thiếu 5 khúc (vuông, chữ nhật, bình hành, thoi, thang cân).
   Mỗi câu: miếng ghép sáng màu của nhóm điểm cao nhất bay vào trước, rồi các miếng gỗ theo điểm từ cao xuống thấp;
   4 bạn cùng qua khúc vừa lấp (nhóm 1, 3 đi bộ; nhóm 2, 4 tốc biến), hạng sau đứng lùi dần; bảng điểm cập nhật;
   Claude nhảy múa thổi kèn và bình luận (mỗi câu một kiểu nhảy).
   Kết thúc: bạn về nhất bước lên thảm VỀ ĐÍCH, cả làn chuyển đỏ "Nhóm n về nhất", thắp đuốc; bấm "Tổng kết" (8/11, trước là "Thứ hạng các nhóm"):
   các bạn còn lại thắp đuốc theo hạng rồi dừng, hiện nút "Tiếp theo" (8/11); bấm "Tiếp theo": 4 tia lửa bay lên số 51,
   lửa đốt tan màn đêm hiện báo tường, 4 bạn về ô dán thiệp; bấm "Tiếp theo" lần cuối (8/11 tối, trước là "Hiện báo tường"):
   vệt sáng quét qua, hai chú bồ câu trắng (ảnh thật) hạ xuống hai góc tấm vải xanh lá phủ kín dải băng đỏ rồi kéo vải bay lên
   (9/11; trước đó là dải băng xanh dương, sáng 9/11 băng rơi xuống, 8/11 tối là kéo vàng cắt băng), cả lớp vỗ tay, dòng chữ
   chúc mừng hiện dần, pháo giấy; không phóng to thu nhỏ.
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
    che: "dau", tieu: false, luat: false, anLuat: true, ALa: 0, AL0: -1e6, luatK: 0, luatDo: true, hienCho: null, I0: -1e6, q: 0, nCau: 0, ls: null, vt: null, hg: null,
    R0: XA, L: null, E0: CHUA, B0: CHUA, T0: CHUA, H0: CHUA, W0: CHUA, K: null, tiep: false,
    binh: { q: 0, chu: "", luc: 0 }, phu: false, cues: [], tCu: 0,
    ext: { bn: 0, bd: 0, EW: W, EH: H, KF: null }
  };
  let cv, ctx, A = null, rDo = 1, bao = null, baoSo = 0, baoKhung = null, daSanSang = false;
  const UI = {};

  /* ---------- tải hình ---------- */
  const tai = s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = s; });
  async function taiHinh() {
    const [nen, go, koi, koiNhay, ech, thoNhay, thoNgoi, c0, c1, c2, boCau] = await Promise.all([
      "anh/song-dem.webp", "anh/van-go.webp", "anh/ca-koi.webp", "anh/ca-koi-nhay.webp", "anh/ech.webp", "anh/tho-nhay.webp", "anh/tho-ngoi.webp",
      "anh/claude-ken-phai.webp", "anh/claude-ken-trai.webp", "anh/claude-co-vu.webp", "anh/bo-cau.webp"].map(tai));
    const to = await Promise.all(RD.TO.map(T => tai(T.anh)));
    try {
      await Promise.all(["800 46px 'Baloo 2'", "700 46px 'Be Vietnam Pro'", "600 36px 'Be Vietnam Pro'"].map(f => document.fonts.load(f)));
    } catch (e) { /* phông dự phòng */ }
    A = { nen, go, to, convat: { koi, koiNhay, ech, thoNhay, thoNgoi }, claude: [c0, c1, c2].every(Boolean) ? [c0, c1, c2] : null, boCau };
    CC.xoaSan();
    daSanSang = true;
    henRanh(vaiXanh); henRanh(bongVai);         // vải xanh lá che dải băng (vẽ mất chừng 80 ms): vẽ sẵn ngay từ đầu
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
  // màu dải băng đỏ của báo tường vẽ tạm (toạ độ ảnh K.w × K.h): dùng cho cả baoGia và tấm xoá chữ của nó
  const mauBangGia = g => { const gr = g.createLinearGradient(0, K.h * .07, 0, K.h * .159); gr.addColorStop(0, "#d23b2f"); gr.addColorStop(1, "#a3231b"); return gr; };
  async function baoGia() {
    // 9/11: đợi phông chữ tải xong (tối đa 2,5 giây; đưa kèm chữ để tải cả phần chữ có dấu tiếng Việt) rồi mới vẽ chữ
    const CHU1 = "CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG", CHU2 = "TRƯỜNG TRUNG HỌC CƠ SỞ PHAN TÂY HỒ (14/12/1976 – 14/12/2026)";
    try {
      await Promise.race([Promise.all([document.fonts.load("800 34px 'Baloo 2'", CHU1), document.fonts.load("700 18px 'Be Vietnam Pro'", CHU2 + " Ô dán thiệp")]),
        new Promise(ok => setTimeout(ok, 2500))]);
    } catch (e) { /* phông dự phòng */ }
    const c = document.createElement("canvas"); c.width = K.w; c.height = K.h;
    const g = c.getContext("2d"), w = K.w, h = K.h;
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e5f3fa"); gr.addColorStop(.3, "#fdf4dc"); gr.addColorStop(1, "#fbecd0");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "800 64px 'Baloo 2'"; g.lineWidth = 4; g.strokeStyle = "#9c6a07"; g.strokeText("51", w * .5, h * .036); g.fillStyle = "#e9a920"; g.fillText("51", w * .5, h * .036);
    g.fillStyle = mauBangGia(g); g.fillRect(w * .236, h * .07, w * .528, h * .089);
    g.fillStyle = "#f2c14e"; g.fillRect(w * .236, h * .07, w * .528, 4); g.fillRect(w * .236, h * .159 - 4, w * .528, 4);
    // 9/11: hai dòng chữ nằm gọn trong vùng tấm xoá chữ XC (đã đo: dòng trên hàng 85–118, dòng dưới hàng 127–152, cột 413–1057;
    //   rộng tối đa 690, phông dự phòng cũng vừa), để vải xanh lá bay đi thì dải băng đỏ còn trống rồi chữ mới hiện
    g.font = "800 34px 'Baloo 2'"; g.fillStyle = "#ffe08a"; g.fillText(CHU1, w * .5, h * .108, 690);
    g.font = "700 18px 'Be Vietnam Pro'"; g.fillStyle = "#fff3d0"; g.fillText(CHU2, w * .5, h * .137, 690);
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
  //   hai lần phóng to (báo tường to dần 1 giây; dòng chữ phóng to rồi thu về).
  // 9/11 (thầy Thịnh: "Có một dải màu xanh che cái phần chữ chúc mừng 51 năm ngày truyền thống. Sau khi tôi bấm nút tiếp theo, thì
  //   để băng đó rớt xuống. Có hiệu ứng rớt xuống. Rồi sau đó xuất hiện cái chữ chúc mừng 51 năm ngày truyền thống."): bỏ cây kéo cắt
  //   băng của 8/11 tối; dải băng che dòng chữ màu xanh dương viền vàng.
  // 9/11 03:29 UTC (thầy Thịnh: "cái chỗ cắt băng chỉ cần có tiếng vỗ tay là được và cho 2 con chim bồ câu hạ xuống 2 bên kéo băng bay
  //   lên đừng cho rớt xuống"): băng không rơi nữa mà được hai chú bồ câu kéo bay lên; chỉ còn tiếng vỗ tay. Tính từ lúc bấm nút cuối
  //   (S.H0).
  // 9/11 04:11 UTC (thầy Thịnh: "cho vải màu xanh lá che hết khúc này, 2 con chim bồ câu vẽ nhỏ lại cho đúng tỉ lệ, đừng dùng
  //   ghibli, vẽ hình thật nha"): dải băng xanh dương thành tấm vải sa tanh xanh lá phủ kín cả dải băng đỏ (hai đuôi, hai nơ vàng);
  //   bồ câu là ảnh thật, nhỏ bằng nửa, quặp hai bên vải gần góc trên; vải lên nhanh hơn một chút cho kịp lúc chữ hiện.
  //   1. 0–QUET: vệt sáng vàng quét chéo qua màn hình. Phía sau vệt sáng báo tường đã ở cỡ đầy màn hình (KF) trên nền nhoè, phía
  //      trước vẫn như lúc chưa bấm, nên không lúc nào báo tường to dần; vải xanh lá còn nằm yên;
  //   2. BC0–BC1: hai chú bồ câu trắng từ trên cao bay xuống hai bên vải gần góc trên (đường cong, chậm dần, ngóc đầu hãm lại);
  //   3. BC1–NANG: chân quặp giữ hai góc vải, vỗ cánh nhanh, hai góc vải nhích lên;
  //   4. NANG: cả lớp vỗ tay; hai chú kéo vải bay lên khỏi màn hình (mép trên võng ở giữa, vải rủ xuống). Dưới vải là dải băng đỏ
  //      của báo tường, chỗ hai dòng chữ còn trống (tấm xoá chữ bangTrong);
  //   5. HIEN đến XONG: dòng chữ hiện dần từ trái sang phải sau một vệt sáng vàng nghiêng, bụi sao rơi lại;
  //   6. XONG: pháo giấy bắn lên từ hai góc dưới và rơi khắp khung xem; vệt sáng lướt qua dòng chữ lần nữa; sao vàng lấp lánh
  //      quanh dòng chữ và số 51 chừng 9 giây rồi đứng yên.
  const QUET = .8, BC0 = .55, BC1 = 1.45, NANG = 1.75, HIEN = NANG + .75, VIET = 1.1, XONG = HIEN + VIET;
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
    henRanh(() => { vaiXanh(); bongVai(); bangTrong(); vetLuot(); domCat(); domLap(); });     // vải xanh lá, tấm xoá chữ, vệt sáng
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
  // trên báo tường (toạ độ khung K): che chữ "Ô dán thiệp n", tấm xoá chữ (từ lúc bồ câu quặp vải tới lúc chữ hiện xong), vải
  //   xanh lá nằm yên, vòng sáng số 51, 4 bạn với thẻ tên nhóm; phần đã quét (sau) còn có vải đang bay lên, vệt sáng làm hiện
  //   chữ với bụi sao, vệt sáng lướt qua dòng chữ, sao lấp lánh, và hai chú bồ câu (vẽ sau cùng)
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
    veChuTrong(c, r);
    if (r < BC1) veVaiYen(c);
    ve51(c, t, r);
    if (nguoi) veNguoiBao(c, t);
    if (!sau) return;
    const L = r >= BC0 ? chimBay(0, r) : null, R = L && chimBay(1, r);
    if (L && r >= BC1) veBangBay(c, r, L, R);
    if (r >= HIEN) veHienChu(c, r);
    if (L) { veBoCau(c, L); veBoCau(c, R); }
  }
  // vải xanh lá phủ kín dải băng đỏ của báo tường (9/11 04:11 UTC, thầy Thịnh: "cho vải màu xanh lá che hết khúc này"; bản 19–21
  //   là dải băng xanh dương chỉ che hai dòng chữ). Vải che cả thân băng đỏ, hai đuôi băng gấp và hai nơ vàng (đo trên báo tường
  //   bản 15b thu về K.w × K.h: thân băng x 350–1105, y 75–165; đuôi trái từ x 272, đuôi phải tới x 1200, đuôi xuống tới y 185;
  //   số 51 hết ở y 62; báo tường vẽ tạm: băng x 347–1125, y 73–166). Toạ độ khung K.
  const BX = K.x + 260, BY = K.y + 63, BW = 952, BH = 134;
  // dải băng đỏ (chỗ sao lấp lánh quanh dòng chữ sau khi chữ hiện)
  const DB = { x: K.x + .235 * K.w, y: K.y + .069 * K.h, w: .53 * K.w, h: .092 * K.h };
  // Vải sa tanh như vải thật, vẽ từng điểm ảnh một lần ở độ nét gấp đôi (VN): nếp gấp dọc (tổng sáu sóng sin) sâu dần về phía gấu,
  //   pháp tuyến theo độ dốc nếp, ánh sáng từ trên bên trái (khuếch tán và bóng loáng), sợi vải lấm tấm; viền kim tuyến vàng ở mép
  //   trên và ở gấu, gấu lượn theo nếp (chỗ nếp nhô ra thì gấu thấp hơn). Vẽ mất chừng 80 ms nên giữ riêng (không để CC.xoaSan xoá
  //   lúc phông tải xong) và vẽ sẵn lúc máy rảnh ngay sau khi tải hình.
  const VN = 2;
  const NEP = [[97, 5.2, .7], [61, 3.1, 2.1], [43, 1.9, 4.4], [151, 4.2, 1.3], [29, .8, 5.6], [211, 3.0, 3.9]];
  const NEP_MAX = NEP.reduce((s, n) => s + n[1], 0);
  function nep(X) {
    let f = 0, d = 0;
    for (const [l, a, p] of NEP) { const w = 2 * Math.PI / l; f += a * Math.sin(w * X + p); d += a * w * Math.cos(w * X + p); }
    return [f, d];
  }
  let cvVai = null, cvBongVai = null;
  function vaiXanh() {
    if (cvVai) return cvVai;
    const w = Math.round(BW * VN), h = Math.round(BH * VN);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), im = g.createImageData(w, h), q = im.data;
    const n0 = Math.hypot(-.42, -.62, .66), lx = -.42 / n0, ly = -.62 / n0, lz = .66 / n0;          // hướng ánh sáng
    const n1 = Math.hypot(lx, ly, lz + 1), hx = lx / n1, hy = ly / n1, hz = (lz + 1) / n1;          // nửa đường (bóng loáng)
    const XANH = [30, 140, 68], VANG = [214, 168, 64];
    const cot = []; for (let px = 0; px < w; px++) cot.push(nep((px + .5) / VN));
    let s = 99; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let py = 0; py < h; py++) {
      const Y = (py + .5) / VN, t = Y / BH, A = .2 + .8 * Math.pow(t, 1.25), dA = Math.pow(Math.max(t, 1e-4), .25) / BH;
      for (let px = 0; px < w; px++) {
        const [f, df] = cot[px], yh = BH - 3.2 + 2.6 * f / NEP_MAX, i = (py * w + px) * 4;
        const phu = Math.max(0, Math.min(1, (yh - Y) * VN + .5));                               // dưới gấu: trong suốt
        if (phu <= 0) { q[i + 3] = 0; continue; }
        let nx = -.8 * A * df, ny = -.8 * dA * f, nz = 1; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
        const kt = Math.max(0, nx * lx + ny * ly + nz * lz), nh = Math.max(0, nx * hx + ny * hy + nz * hz);
        const vTren = Y < 5.5, vDuoi = Y > yh - 6.5 && Y < yh - 1.2;
        let r, gg, b;
        if (vTren || vDuoi) {              // viền kim tuyến vàng
          const sp = Math.pow(nh, 14), k = .5 + .62 * kt, v = vTren ? Y / 5.5 : (Y - yh + 6.5) / 5.3, ke = .82 + .18 * Math.sin(Math.PI * v);
          r = (VANG[0] * k + 178 * sp) * ke; gg = (VANG[1] * k + 168 * sp) * ke; b = (VANG[2] * k + 108 * sp) * ke;
        } else {                           // vải sa tanh xanh lá, gấu hơi tối (mép vải cuộn)
          const sp = Math.pow(nh, 30), am = 1.06 - .2 * t - (Y > yh - 12 ? .18 * (1 - (yh - Y) / 12) : 0), k = (.3 + .82 * kt) * am;
          r = XANH[0] * k + 115 * sp; gg = XANH[1] * k + 155 * sp; b = XANH[2] * k + 124 * sp;
        }
        const n = (rnd() - .5) * 5;
        q[i] = r + n; q[i + 1] = gg + n; q[i + 2] = b + n; q[i + 3] = 255 * phu;
      }
    }
    g.putImageData(im, 0, 0);
    return (cvVai = c);
  }
  // bóng đổ của vải lúc nằm yên (độ nét thường, chừa lề 30)
  function bongVai() {
    if (cvBongVai) return cvBongVai;
    const c = document.createElement("canvas"); c.width = BW + 60; c.height = BH + 60;
    const g = c.getContext("2d");
    g.shadowColor = "rgba(0,0,0,.34)"; g.shadowBlur = 14; g.shadowOffsetX = 4000; g.shadowOffsetY = 6;
    g.drawImage(vaiXanh(), 30 - 4000, 30, BW, BH);
    return (cvBongVai = c);
  }
  // vải nằm yên trên báo tường
  function veVaiYen(c) { c.drawImage(bongVai(), BX - 30, BY - 30); c.drawImage(vaiXanh(), BX, BY, BW, BH); }
  // tấm xoá chữ (9/11): chỗ hai dòng chữ "CHÚC MỪNG 51 NĂM NGÀY TRUYỀN THỐNG" và "TRƯỜNG TRUNG HỌC CƠ SỞ PHAN TÂY HỒ (…)" trên dải
  //   băng đỏ của báo tường, tô kín màu đỏ: mỗi cột nối liền màu của ba chỗ đỏ không có chữ (ngay dưới chỉ vàng trên, khe giữa hai
  //   dòng chữ, ngay trên chỉ vàng dưới), làm mượt 5 cột. Băng xanh bay lên thì thấy dải băng đỏ còn trống, rồi chữ mới hiện ra.
  //   Toạ độ trong ảnh báo tường đã thu về đúng K.w × K.h (đo 9/11 trên báo tường bản 15b; hai đầu chừa nơ vàng). Ảnh không cho
  //   đọc điểm ảnh thì tô dải màu đỏ thay (veChuTrong).
  const XC = { x: 371, y: 84, w: 733, h: 70, tren: 83, giua: [118, 127], duoi: [154, 156] };
  let cvTrong = null, soTrong = -1;
  function bangTrong() {
    if (!bao || soTrong === baoSo) return cvTrong;
    soTrong = baoSo; cvTrong = null;
    if (!SK.coAnhBao) {        // báo tường vẽ tạm (chưa chọn ảnh): vẽ lại đúng dải băng đỏ của nó, không chữ
      const ra = document.createElement("canvas"); ra.width = XC.w; ra.height = XC.h;
      const g = ra.getContext("2d"); g.translate(-XC.x, -XC.y);
      g.fillStyle = mauBangGia(g); g.fillRect(XC.x, XC.y, XC.w, XC.h);
      return (cvTrong = ra);
    }
    try {
      const w = XC.w, y0 = XC.tren, h = XC.duoi[1] - y0;
      const doc = document.createElement("canvas"); doc.width = w; doc.height = h;
      const g = doc.getContext("2d", { willReadFrequently: true });
      g.drawImage(bao, -XC.x, -y0);
      const p = g.getImageData(0, 0, w, h).data;
      // màu trung bình theo từng cột của các hàng a … b - 1 (toạ độ K), làm mượt 5 cột
      const tb = (a, b) => {
        const m = new Float32Array(w * 3), o = new Float32Array(w * 3);
        for (let y = a; y < b; y++) for (let x = 0; x < w; x++) {
          const i = ((y - y0) * w + x) * 4; m[3 * x] += p[i]; m[3 * x + 1] += p[i + 1]; m[3 * x + 2] += p[i + 2];
        }
        for (let x = 0; x < w; x++) {
          const x0 = Math.max(0, x - 2), x1 = Math.min(w - 1, x + 2), n = (x1 - x0 + 1) * (b - a);
          for (let j = 0; j < 3; j++) { let s = 0; for (let k = x0; k <= x1; k++) s += m[3 * k + j]; o[3 * x + j] = s / n; }
        }
        return o;
      };
      const T = tb(XC.tren, XC.tren + 1), G = tb(XC.giua[0], XC.giua[1]), D = tb(XC.duoi[0], XC.duoi[1]);
      const yT = XC.tren + .5, yG = (XC.giua[0] + XC.giua[1]) / 2, yD = (XC.duoi[0] + XC.duoi[1]) / 2;
      const ra = document.createElement("canvas"); ra.width = w; ra.height = XC.h;
      const gr = ra.getContext("2d"), anh = gr.createImageData(w, XC.h), q = anh.data;
      for (let yy = 0; yy < XC.h; yy++) {
        const y = XC.y + yy + .5, tren = y < yG, A = tren ? T : G, B = tren ? G : D, f = tren ? (y - yT) / (yG - yT) : (y - yG) / (yD - yG);
        for (let x = 0; x < w; x++) {
          const i = (yy * w + x) * 4;
          for (let j = 0; j < 3; j++) q[i + j] = A[3 * x + j] + (B[3 * x + j] - A[3 * x + j]) * f;
          q[i + 3] = 255;
        }
      }
      gr.putImageData(anh, 0, 0);
      cvTrong = ra;
    } catch (e) { cvTrong = null; }
    return cvTrong;
  }
  // dòng chữ hiện dần từ trái sang phải: mép một vệt sáng nghiêng (như vetLuot, nghiêng .3) đi từ XL - 60 tới XR + 60 (toạ độ x
  //   của mép ở ngang tâm tấm xoá chữ YG)
  const XL = K.x + XC.x, XR = XL + XC.w, YT = K.y + XC.y, YB = YT + XC.h, YG = (YT + YB) / 2, TG = Math.tan(.3);
  const mepChu = r => XL - 60 + (XR - XL + 120) * (.5 - .5 * Math.cos(Math.PI * lin(r, HIEN, XONG)));
  // tấm xoá chữ, từ lúc bồ câu bám băng; lúc chữ hiện dần chỉ còn phần bên phải mép vệt sáng
  function veChuTrong(c, r) {
    if (r < BC1 || r >= XONG) return;
    c.save();
    if (r > HIEN) {
      const xe = mepChu(r), d = (YB - YT) / 2 + 4;
      c.beginPath(); c.moveTo(xe + d * TG, YT - 4); c.lineTo(XR + 4, YT - 4); c.lineTo(XR + 4, YB + 4); c.lineTo(xe - d * TG, YB + 4);
      c.closePath(); c.clip();
    }
    const tr = bangTrong();
    if (tr) c.drawImage(tr, XL, YT);
    else {
      const gr = c.createLinearGradient(0, YT, 0, YB);
      gr.addColorStop(0, "#e65e4a"); gr.addColorStop(.55, "#d4473a"); gr.addColorStop(1, "#bd3d31");
      c.fillStyle = gr; c.fillRect(XL, YT, XR - XL, YB - YT);
    }
    c.restore();
  }
  // vòng sáng quanh số 51 lúc chờ bấm; tắt dần khi vải xanh lá được kéo lên
  function ve51(c, t, r) {
    const a51 = r < NANG ? 1 : 1 - lin(r, NANG, NANG + .5);
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
  /* ---------- hai chú bồ câu kéo vải xanh lá bay lên (9/11 03:29 UTC, thầy Thịnh: "cho 2 con chim bồ câu hạ xuống 2 bên kéo băng
     bay lên đừng cho rớt xuống"; 9/11 04:11 UTC: "2 con chim bồ câu vẽ nhỏ lại cho đúng tỉ lệ, đừng dùng ghibli, vẽ hình thật nha") ---------- */
  // Bồ câu trắng ảnh thật (ảnh Canva AI đã tách nền): anh/bo-cau.webp gồm 3 lớp xếp ngang, mỗi lớp BCW × BCH điểm ảnh, cùng gốc toạ
  //   độ: cánh xa | thân (đầu, đuôi, chân) | cánh gần. Chim nhìn nghiêng quay sang phải, hai cánh giơ lên, chân duỗi ra trước để
  //   quặp. Vỗ cánh: hai lớp cánh cùng gập quanh đường khớp vai (qua KHOP, góc GOC_KHOP), co theo hướng vuông góc với đường khớp
  //   (hệ số 1: cánh giơ như ảnh; âm: cánh hạ xuống dưới thân); cánh xa vẽ sau thân, cánh gần vẽ trước thân. SBC: đơn vị khung K mỗi
  //   điểm ảnh của lớp (chim cao chừng 110 đơn vị kể cả cánh, dài chừng 80: nhỏ bằng nửa bồ câu vẽ của bản 21). Chân quặp mép bên
  //   của vải, dưới góc trên BAM_Y đơn vị, để lúc cánh giơ cao chim vẫn gần trọn trong màn hình TV.
  const BCW = 210, BCH = 285, SBC = .4, BAM_Y = 19;
  const CHAN = [142.5, 251];                                        // chỗ chân quặp (điểm ảnh của lớp)
  const KHOP = [89, 197], GOC_KHOP = Math.atan2(133 - 197, 166 - 89);
  // một chú bồ câu theo trạng thái o của chimBay: (o.x, o.y) chỗ chân quặp (toạ độ khung K); o.lat: quay sang trái; o.ng: góc thân
  //   so với ảnh (0: như ảnh, ngóc đầu lên chừng 40°; dương: chúi đầu xuống); o.ph: pha vỗ cánh (0: cánh giơ lên); o.a: độ mờ
  function veBoCau(c, o) {
    const im = A && A.boCau; if (!o.hien || !im) return;
    const k = .2 + .8 * Math.cos(o.ph), sy = Math.abs(k) < .06 ? (k < 0 ? -.06 : .06) : k;
    const lop = (j, gap) => {
      c.save();
      if (gap) { c.translate(KHOP[0], KHOP[1]); c.rotate(GOC_KHOP); c.scale(1, sy); c.rotate(-GOC_KHOP); c.translate(-KHOP[0], -KHOP[1]); }
      c.drawImage(im, j * BCW, 0, BCW, BCH, 0, 0, BCW, BCH);
      c.restore();
    };
    c.save(); c.globalAlpha = o.a;
    c.translate(o.x, o.y); if (o.lat) c.scale(-1, 1); c.rotate(o.ng); c.scale(SBC, SBC); c.translate(-CHAN[0], -CHAN[1]);
    lop(0, true); lop(1, false); lop(2, true);
    c.restore();
  }
  // pha vỗ cánh: tần số (lần một giây) đổi tuyến tính từng đoạn, tính theo giây kể từ BC0; pha là tích phân của tần số
  const PHA = [[0, 4.4], [BC1 - BC0 - .25, 4.4], [BC1 - BC0 + .05, 6.2], [NANG - BC0, 6.2], [NANG - BC0 + .2, 6.8]];
  function phaCanh(u) {
    let n = 0;
    for (let j = 0; j < PHA.length; j++) {
      const [a, fa] = PHA[j], [b, fb] = PHA[j + 1] || [a + 1, fa];
      if (u <= a) break;
      const e = j + 1 < PHA.length ? Math.min(u, b) : u, fe = j + 1 < PHA.length ? fa + (fb - fa) * (e - a) / (b - a) : fa;
      n += (e - a) * (fa + fe) / 2;
    }
    return 2 * Math.PI * n;
  }
  // đường bay của một chú (ben 0: bên trái, quay sang phải; ben 1: bên phải, quay sang trái, chậm hơn 0,07 giây): chỗ chân quặp
  //   (x, y, toạ độ khung K), góc thân ng, pha cánh ph, độ mờ a; bam: chân đã quặp mép vải
  function chimBay(ben, r) {
    const tr = r - (ben ? .07 : 0), dau = ben ? 1 : -1;
    const gx = BX + BW / 2 + dau * BW / 2, gy = BY + BAM_Y;                      // mép bên của vải, gần góc trên
    const ph = phaCanh(Math.max(0, tr - BC0)) + (ben ? 1.3 : 0), nhun = -1.6 * Math.sin(ph);
    let x, y, ng, a = 1;
    if (tr < BC1) {                // bay xuống theo đường cong từ trên cao phía ngoài, chậm dần, ngóc đầu xoè cánh hãm lại
      const p = eo(lin(tr, BC0, BC1)), q = 1 - p, sx = gx + dau * 400, sy = gy - 660, kx = gx + dau * 300, ky = gy - 60;
      x = q * q * sx + 2 * q * p * kx + p * p * gx; y = q * q * sy + 2 * q * p * ky + p * p * gy + .6 * nhun;
      ng = .75 - .8 * em(lin(p, .45, 1));
    } else if (tr < NANG) {        // quặp chân giữ góc vải, vỗ cánh nhanh, góc vải nhích lên
      x = gx; y = gy - 8 * eo(lin(tr, BC1, NANG)) + nhun; ng = -.05 + .03 * Math.sin(ph * .5);
    } else {                       // kéo vải bay lên, nhanh dần; hai chú hơi nhích vào giữa nên vải võng xuống; mờ dần ở trên cao
      const u = tr - NANG;
      x = gx - dau * 40 * (1 - Math.exp(-2.5 * u)); y = gy - 8 - (50 * u + 300 * u * u) + nhun;
      ng = -.05 - .12 * em(lin(u, 0, .3)); a = 1 - lin(u, 1.5, 1.9);
    }
    const bam = tr >= BC1;
    return { x, y, ng, ph, a, lat: ben === 1, hien: tr >= BC0 && a > 0, bx: bam ? x : gx, by: bam ? y : gy };
  }
  // vải từ lúc hai chú bồ câu quặp hai bên gần góc trên: mép trên theo chân chim (bx, by - BAM_Y), giữa võng xuống, gợn sóng chạy dọc mép, vải rủ
  //   xuống dưới mép trên, gần hai góc hơi co lại như vải dồn. Thân vải (vaiXanh) chia thành các lát dọc theo điểm mẫu UBC: lát mỏng
  //   2 đơn vị ở hai đầu, lát 16 đơn vị ở giữa; mỗi lát một phép xô nghiêng và co dọc, mép trên khớp đường cong ở giữa lát. Bóng đổ
  //   cũ (bongVai) mờ dần tại chỗ. Lớp phủ nếp (dốc xuống tối, dốc lên sáng, chỗ dồn tối) là một dải màu liền theo chiều ngang, khỏi
  //   thành sọc, không phủ tới gấu lượn.
  const CHUM = .16;
  const UBC = (() => {
    const u = [], mong = 2 / BW, day = 16 / BW;
    for (let x = 0; x < CHUM; x += mong) u.push(x);
    const n = Math.ceil((1 - 2 * CHUM) / day);
    for (let j = 0; j < n; j++) u.push(CHUM + j * (1 - 2 * CHUM) / n);
    for (let x = 1 - CHUM; x < 1 - 1e-9; x += mong) u.push(x);
    u.push(1);
    return u;
  })();
  function veBangBay(c, r, L, R) {
    const a = Math.min(L.a, R.a); if (a <= 0) return;
    const sp = vaiXanh(), SW = BW * VN;
    const tau = Math.max(0, r - NANG - .035), giu = eo(lin(r, BC1, NANG));
    const chum = .06 * giu + .1 * (1 - Math.exp(-3 * tau)), vong = 8 * giu + 95 * (1 - Math.exp(-3.2 * tau)), gon = 5 * (1 - Math.exp(-3 * tau));
    const ab = a * (1 - lin(r, BC1, NANG + .25));                // bóng đổ của vải lúc nằm yên mờ dần tại chỗ
    if (ab > 0) { c.save(); c.globalAlpha = ab; c.drawImage(bongVai(), BX - 30, BY - 30); c.restore(); }
    const tren = u => L.by + (R.by - L.by) * u + vong * 4 * u * (1 - u) + gon * Math.sin(2 * Math.PI * (1.4 * u - 1.1 * tau)) * Math.sin(Math.PI * u) - BAM_Y;
    const co = u => { const e = Math.min(u, 1 - u); return 1 - chum * Math.pow(1 - Math.min(1, e / CHUM), 2); };
    const dx = R.bx - L.bx, cx = dx / SW;
    c.save(); c.globalAlpha = a;
    for (let j = 0; j < UBC.length - 1; j++) {
      const u0 = UBC[j], u1 = UBC[j + 1], um = (u0 + u1) / 2, sx0 = u0 * SW, sw = (u1 - u0) * SW;
      const X0 = L.bx + dx * u0, Xm = L.bx + dx * um, d = (tren(u1) - tren(u0)) / ((u1 - u0) * dx), k = co(um);
      const ww = Math.min(sw + .8 * VN, SW - sx0);
      c.save(); c.transform(cx, d * cx, 0, k / VN, X0 - sx0 * cx, tren(um) + d * (X0 - sx0 * cx - Xm));
      c.drawImage(sp, sx0, 0, ww, BH * VN, sx0, 0, ww, BH * VN);
      c.restore();
    }
    // nếp vải: một lớp phủ liền trên thân vải, màu đổi dần theo chiều ngang
    const gr = c.createLinearGradient(L.bx, 0, R.bx, 0), M = 40;
    for (let j = 0; j <= M; j++) {
      const u = j / M, h = .004, ua = Math.max(0, u - h), ub = Math.min(1, u + h), dd = (tren(ub) - tren(ua)) / ((ub - ua) * dx), m = dd * 1.4 + (1 - co(u)) * 1.2;
      gr.addColorStop(u, m > 0 ? "rgba(4,30,12," + Math.min(.34, m).toFixed(3) + ")" : "rgba(255,255,255," + Math.min(.08, -m * .45).toFixed(3) + ")");
    }
    c.beginPath();
    for (let j = 0; j <= M; j++) { const u = j / M; c.lineTo(L.bx + dx * u, tren(u)); }
    for (let j = M; j >= 0; j--) { const u = j / M; c.lineTo(L.bx + dx * u, tren(u) + co(u) * (BH - 6)); }
    c.closePath(); c.fillStyle = gr; c.fill();
    c.restore();
  }
  const domCat = () => domSang("cat", "rgba(255,247,215,1)", "rgba(255,190,80,0)");
  const domLap = () => domSang("lap", "rgba(255,238,170,1)", "rgba(255,200,90,0)");
  // vệt sáng vàng nghiêng: làm hiện dòng chữ, rồi lướt qua dòng chữ lần nữa
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
  function veLuot(c, x, a) {
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = a;
    c.translate(x, YG); c.rotate(.3); c.drawImage(vetLuot(), -110, -85);
    c.restore();
  }
  // bụi sao vàng rơi lại sau mép vệt sáng lúc chữ hiện dần
  const BUI = (() => {
    let s = 3; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const d = [];
    for (let j = 0; j < 34; j++) d.push({ p: .14 + .72 * (j + rnd()) / 34, y: YT + 4 + rnd() * (XC.h - 8), vx: -(14 + rnd() * 34), vy: -(6 + rnd() * 26), r: 6 + rnd() * 7 });
    return d;
  })();
  // sao vàng lấp lánh quanh dòng chữ và số 51 sau khi chữ hiện xong: mỗi sao loé hai lần (cách 3 giây)
  const SAO_CB = (() => {
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const d = [];
    for (let j = 0; j < 18; j++) {
      let x, y;
      if (j % 6 === 5) { const g = rnd() * 6.28; x = C51[0] + Math.cos(g) * (78 + rnd() * 20); y = C51[1] + Math.sin(g) * (48 + rnd() * 14); }
      else { x = DB.x - 30 + rnd() * (DB.w + 60); y = rnd() < .5 ? DB.y - 8 - rnd() * 22 : DB.y + DB.h + 6 + rnd() * 22; }
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
  // dòng chữ hiện (r: giây kể từ lúc bấm nút cuối): vệt sáng nghiêng làm hiện chữ, hai sao lớn chạy theo mép, bụi sao; hiện xong
  //   thì vệt sáng lướt qua lần nữa, sao vàng lấp lánh
  function veHienChu(c, r) {
    if (r < XONG + .1) {
      const xe = mepChu(r), k = Math.max(0, Math.min(1, (r - HIEN) / .15, (XONG + .1 - r) / .2)), dom = domLap();
      veLuot(c, xe, .95 * k);
      c.save(); c.globalCompositeOperation = "lighter";
      BUI.forEach(d => {
        const tb = HIEN + d.p * VIET, a = r - tb; if (a <= 0 || a >= .75) return;
        const q = Math.sin(Math.PI * a / .75), x = mepChu(tb) - (d.y - YG) * TG + d.vx * a, y = d.y + d.vy * a;
        c.globalAlpha = .55 * q; c.drawImage(dom, x - 2.2 * d.r, y - 2.2 * d.r, 4.4 * d.r, 4.4 * d.r);
        CC.sao(c, x, y, d.r * (.45 + .55 * q), q);
      });
      if (xe > XL - 30 && xe < XR + 30) [.26, .74].forEach((v, j) => {
        const y = YT + XC.h * v, x = xe - (y - YG) * TG, q = .7 + .3 * Math.sin(r * 17 + j * 2);
        c.globalAlpha = .6 * k; c.drawImage(dom, x - 34, y - 34, 68, 68);
        CC.sao(c, x, y, (15 + 9 * q) * k, k);
      });
      c.restore();
    }
    const gl = lin(r, XONG + .5, XONG + 1.5);
    if (gl > 0 && gl < 1) veLuot(c, XL - 60 + (XR - XL + 120) * em(gl), .9 * Math.sin(Math.PI * gl));
    if (r - XONG > .2 && r - XONG < 9.6) veLapLanh(c, r - XONG);
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
  // pháo giấy bắn lên từ hai góc dưới lúc dòng chữ hiện xong (như pháo kim tuyến ở lễ khánh thành): kim tuyến vàng, bạc và giấy màu bay
  //   vút lên, chậm dần rồi rơi lả tả; khung xem cao (điện thoại cầm dọc) thì bắn cao theo
  function vePhaoBan(c, t) {
    const u = t - S.H0 - XONG; if (u < 0 || u > 6) return;
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
  // pháo giấy rơi khắp khung xem sau khi dòng chữ hiện xong
  function vePhaoGiay(c, t) {
    const t0 = S.H0 + XONG + .1; if (t < t0 || t > t0 + 6) return;
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
  // 9/11 05:03 UTC thầy Thịnh: "cái chỗ luật chơi có thêm mục ẩn tôi bấm vào thì ẩn đi để cho học sinh quan sát màn chơi, bấm ẩn
  //   xong thì sẽ có nút hiện nữa nhé". Mức hiện của khung luật chơi: 1 = hiện hẳn, 0 = đã ẩn; đổi êm từ mức lúc bấm (ALa)
  function mucLuat(t) {
    const dich = S.anLuat ? 0 : 1, u = eo(lin(t, S.AL0, S.AL0 + (S.anLuat ? .32 : .38)));
    return S.ALa + (dich - S.ALa) * u;
  }
  // 9/11 05:27 UTC thầy Thịnh: "chữ rước đuốc với phần luật chơi cho to lên tí nha. che luôn cây cầu cũng được". Khung luật chơi
  //   chữ to (CSS) nhưng không chạm hai cụm nút góc: co cả khung (neo giữa mép trên) cho đáy khung cách đỉnh hàng nút 10 px
  //   (S.ext.day, như đáy thẻ câu hỏi). Cũng tính chỗ nút "Hiện luật chơi": góc phải trên trùng góc phải trên nút Ẩn, cùng cỡ.
  //   Khung đang ẩn thì tạm bỏ ẩn để đo rồi ẩn lại ngay (không vẽ ra màn hình).
  function doLuat() {
    const L = UI.luat; if (!L) return;
    const an = L.hidden; if (an) L.hidden = false;
    // Điện thoại: nút Ẩn phóng to NT lần (neo góc phải trên) sẽ đè dòng đầu của "Nhiệm vụ". Chừa một ô trống thả nổi bên phải đầu
    //   khung (UI.luatCho) đúng cỡ nút đã phóng, cộng khe 12 px, để chữ chạy vòng quanh. Màn hình lớn (NT = 1) thì không cần.
    const A = UI.luatAn, C = UI.luatCho, NT = (S.ext && S.ext.nutTo) || 1;
    if (C) { const can = !!A && NT > 1.001; datAn(C, !can);
      if (can) { const cs = getComputedStyle(L), pR = parseFloat(cs.paddingRight) || 0, pT = parseFloat(cs.paddingTop) || 0;
        datKieu(C, "width", Math.max(0, A.offsetWidth * NT + 28 - pR + 12).toFixed(1) + "px");
        datKieu(C, "height", Math.max(0, A.offsetHeight * NT + 28 - pT + 12).toFixed(1) + "px"); } }
    const h = L.offsetHeight, w = L.offsetWidth, x0 = L.offsetLeft, y0 = L.offsetTop;
    const ax = A ? x0 + L.clientLeft + A.offsetLeft + A.offsetWidth : x0 + w, ay = A ? y0 + L.clientTop + A.offsetTop : y0;
    if (an) L.hidden = true;
    if (!h) return;
    const day = (S.ext && S.ext.day) || (H - 14), k = Math.max(.5, Math.min(1, (day - 10 - y0) / h)), cx = x0 + w / 2;
    S.luatK = k;
    S.hienCho = { phai: W - (cx + (ax - cx) * k), tren: y0 + (ay - y0) * k, k };
    S.luatDo = false;
  }
  function veChu(t) {
    const NT = (S.ext && S.ext.nutTo) || 1;
    // tiêu đề và luật chơi (màn giới thiệu). Vào màn giới thiệu thì khung luật chơi ẩn sẵn, chỉ có nút "Hiện luật chơi"; thầy bấm
    //   thì khung hiện ra (mờ dần vào, trượt nhẹ xuống, không phóng to thu nhỏ). Bấm Ẩn thì khung mờ đi, trượt nhẹ lên, nút "Hiện
    //   luật chơi" hiện lại đúng chỗ nút Ẩn. Tiêu đề luôn giữ. Cửa sổ nhỏ (điện thoại) thì hai nút to lên như nút Tổng kết (NT).
    datAn(UI.tieu, !S.tieu);
    if (S.luat && (S.luatDo || !S.luatK)) doLuat();
    const kL = S.luatK || 1, vaoL = lin(t, S.I0 + .8, S.I0 + 1.6);
    const mL = S.luat ? mucLuat(t) : 0, coLuat = S.luat && mL > .002;
    datAn(UI.luat, !coLuat);
    if (coLuat) {
      datKieu(UI.luat, "opacity", String(vaoL * mL));
      datKieu(UI.luat, "transform", (mL < 1 ? "translateY(" + (-26 * (1 - mL)).toFixed(1) + "px) " : "") + (kL < .999 ? "scale(" + kL.toFixed(4) + ")" : ""));
      datKieu(UI.luat, "pointerEvents", S.anLuat ? "none" : "");
      if (UI.luatAn) datKieu(UI.luatAn, "transform", NT > 1 ? "scale(" + NT.toFixed(3) + ")" : "");
    }
    const aH = S.luat && S.anLuat ? eo(lin(t, S.AL0 + .16, S.AL0 + .44)) * vaoL : 0;
    if (UI.luatHien) {
      datAn(UI.luatHien, !(aH > 0));
      if (aH > 0) {
        const c = S.hienCho, kH = NT * (c ? c.k : 1);
        if (c) { datKieu(UI.luatHien, "right", c.phai.toFixed(1) + "px"); datKieu(UI.luatHien, "top", c.tren.toFixed(1) + "px"); }
        datKieu(UI.luatHien, "opacity", aH.toFixed(3));
        datKieu(UI.luatHien, "transform", "translateY(" + (-10 * (1 - aH)).toFixed(1) + "px)" + (Math.abs(kH - 1) > .001 ? " scale(" + kH.toFixed(3) + ")" : ""));
      }
    }
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
    // 9/11 03:29 UTC (thầy Thịnh: "cái chỗ cắt băng chỉ cần có tiếng vỗ tay là được"): chỉ một tiếng vỗ tay, lúc hai chú bồ câu
    //   kéo vải bay lên (sáng 9/11 còn trống dồn, trống, tiếng gió, lấp lánh, khúc mộc cầm)
    hen(S.H0 + NANG, () => am().voTay && am().voTay());
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
    UI.tieu = $("#tieu"); UI.luat = $("#luat"); UI.luatAn = $("#luatAn"); UI.luatCho = $("#luatCho"); UI.luatHien = $("#luatHien"); UI.pill = $("#pill"); UI.binh = $("#binh"); UI.bx = $("#bx");
    UI.nutTH = $("#nutThuHang"); UI.nutTT = $("#nutTiepTheo"); UI.nutHB = $("#nutHienBao"); UI.nenNgoai = $("#nenNgoai"); UI.tvNut = $("#tvNut"); UI.tvNutPhai = $("#tvNutPhai");
    UI.dong = RD.TO.map(T => {
      const d = document.createElement("div"); d.className = "dong"; d.style.setProperty("--m", T.mau); d.style.setProperty("--n", T.nhat);
      d.innerHTML = '<i class="quang"></i><i class="luot"></i><span class="h">1</span><img src="' + T.mat + '" alt=""><span class="t">' + T.ten + '</span><span class="d">0</span>' + VUONG_MIEN;
      UI.bx.appendChild(d);
      return { el: d, h: d.querySelector(".h"), d: d.querySelector(".d") };
    });
    // nút Ẩn / Hiện luật chơi: 9/11 tro-choi.js ghi vào dữ liệu chung (SK.khiBamLuat) để điện thoại cũng biết, nút trên điện
    //   thoại đổi được luật chơi trên TV; chưa có SK.khiBamLuat thì chỉ đổi trên máy TV này
    if (UI.luatAn) UI.luatAn.addEventListener("click", function () { if (SK.khiBamLuat) SK.khiBamLuat(true); else SK.anLuat(true); });
    if (UI.luatHien) UI.luatHien.addEventListener("click", function () { if (SK.khiBamLuat) SK.khiBamLuat(false); else SK.anLuat(false); });
    // phông chữ tải xong thì đo lại khung luật chơi (chữ đổi cỡ, khung đổi cao)
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(function () { S.luatDo = true; });
      if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", function () { S.luatDo = true; });
    }
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
      // đáy cho khung luật chơi (toạ độ thế giới): trên hai cụm nút góc, như đáy thẻ câu hỏi
      day: Math.min(H - 14, H + bd - ND / k),
      // nút Tổng kết / Tiếp theo / Tiếp theo cuối: chữ trên màn hình thật không nhỏ hơn 16 px (điện thoại)
      nutTo: Math.max(1, .5 / k) };
    // nút "Tiếp theo" cuối (#nutHienBao, góc phải dưới): nút dưới đáy thì đứng trên các hàng nút
    wd.style.setProperty("--hbDuoi", (nutHang ? ND / k : 8).toFixed(1) + "px");
    S.luatDo = true;
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

  // ẩn (an = true) hoặc hiện lại khung luật chơi ở màn giới thiệu
  SK.anLuat = function (an) {
    an = !!an;
    if (!S.luat || S.anLuat === an) return;
    const t = dongHo();
    S.ALa = mucLuat(t); S.anLuat = an; S.AL0 = t;
  };
  SK.luatDaAn = function () { return !!(S.luat && S.anLuat); };

  /* ---------- điều khiển từ trò chơi ---------- */
  // o = { che, q, ls (kết quả sau từng câu: ls[0..n]), hoatCanh, gioiThieu }
  SK.dat = function (o) {
    const t = dongHo(), hc = !!o.hoatCanh;
    const cheCu = S.che, qCu = S.q, w0Cu = S.W0;
    S.cues = [];
    S.che = o.che;
    S.tieu = o.che === "dau";
    const luatCu = S.luat;
    S.luat = o.che === "dau" && !!o.gioiThieu;
    // 9/11 05:29 UTC thầy Thịnh: "mới vô là ẩn luật đi nha, tôi bấm hiện mới hiện ra": vào màn giới thiệu (cả khi lùi về từ câu 1)
    //   thì khung luật chơi ẩn sẵn, chỉ có nút Hiện luật chơi; vẽ lại cùng màn giới thiệu thì giữ ẩn / hiện như thầy đã bấm
    if (!S.luat || !luatCu) { S.anLuat = true; S.ALa = 0; S.AL0 = XA; }
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
  // 14/11: lúc tấm vải xanh lá đã bay khỏi màn hình (dòng chữ chúc mừng bắt đầu hiện); mở thẳng bước bao thì là mốc đã qua từ lâu
  SK.lucVaiDi = () => S.che === "bao" ? S.H0 + HIEN : null;
  SK._S = S;
  SK._ve = t => { veKhung(t); veChu(t); };
})();
