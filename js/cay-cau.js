// Cây cầu nhìn từ trên xuống: hình học (đúng tỉ lệ) và vẽ tĩnh lên canvas 1920×1080.
// Mỗi làn thiếu 5 khúc: vuông, chữ nhật, bình hành, thoi, thang cân (đúng thứ tự 5 câu).
(function () {
  const CC = {};
  // 6/11 chiều, thầy Thịnh: "chỉnh đường chạy dài lên trên và xuống dưới chứ không phải phóng to", "canh vừa đủ thôi, còn chừa
  //   chỗ cho Claude nhận xét" (laptop 16:10). Mép trên cầu Y0 và chiều cao làn LH do san-khau.js tính theo khung màn hình rồi
  //   gọi CC.datHinh(y0, lh, tren, duoi); mặc định là cầu cũ (làn 120 px, mép trên 430). Bề ngang cầu giữ nguyên.
  //   TL = LH / 120; KS: độ to của các bạn nhỏ (tối đa 1,4 lần); DS: độ to của đuốc; NS: cỡ chữ số điểm.
  let LH = 120, Y0 = 430;
  const BEAM = 16;                               // bề dày dầm
  const XS = 60, XE = 1880;                      // đầu cầu, cuối bệ đuốc (4/11 13:08: đuốc lùi về sau, có thảm VỀ ĐÍCH; 5/11: thảm rộng gấp đôi)
  CC.BEAM = BEAM; CC.XS = XS; CC.XE = XE;
  CC.TL = 1; CC.KS = 1; CC.DS = 1; CC.NS = 1; CC.TREN = 0; CC.DUOI = 1080;
  CC.laneTop = i => Y0 + BEAM + i * (LH + BEAM);
  CC.laneMid = i => CC.laneTop(i) + LH / 2;
  CC.yChan = i => CC.laneMid(i) + 40 * CC.KS;     // chân các bạn nhỏ (và chân đế đuốc) trong làn i

  // 5 chỗ thiếu, toạ độ trong một làn (y: 0 = mép trên làn, LH = mép dưới làn), xếp từ x = 272 tới 1508, ván nối giữa các chỗ bằng nhau.
  //   Làn cao hơn 120 px thì hình đổi theo để vẫn đúng tên: vuông có cạnh bằng chiều cao làn; chữ nhật dài 1,4 lần chiều cao;
  //   thoi đứng dọc (hai đường chéo 0,62 : 1, khỏi trông như hình vuông xoay); bình hành, thang cân giữ bề ngang.
  const G = [];
  let HOP = [], CHO = [];
  function dungHinh() {
    const h = LH, X0 = 272, X1 = 1508;
    const wCN = Math.max(200, Math.round(1.4 * h)), lech = Math.round(60 + .3 * (h - 120)), wBH = 180 + lech;
    const wT = h > 140 ? Math.round(.62 * h) : 220;
    const van = Math.round((X1 - X0 - (h + wCN + wBH + wT + 200)) / 4);
    G.length = 0;
    let x = X0;                                    // hết ván đầu cầu
    G.push({ ten: "vuông", pts: [[x, 0], [x + h, 0], [x + h, h], [x, h]] }); x += h + van;
    G.push({ ten: "chữ nhật", pts: [[x, 0], [x + wCN, 0], [x + wCN, h], [x, h]] }); x += wCN + van;
    G.push({ ten: "bình hành", pts: [[x + lech, 0], [x + wBH, 0], [x + wBH - lech, h], [x, h]] }); x += wBH + van;
    G.push({ ten: "thoi", pts: [[x + wT / 2, 0], [x + wT, h / 2], [x + wT / 2, h], [x, h / 2]] }); x += wT + van;
    G.push({ ten: "thang cân", pts: [[x + 45, 0], [x + 155, 0], [x + 200, h], [x, h]] });
    // khung bao của chỗ thiếu k (toạ độ trong làn)
    HOP = G.map(g => { const xs = g.pts.map(p => p[0]), x = Math.floor(Math.min.apply(null, xs)); return { x, w: Math.ceil(Math.max.apply(null, xs)) - x }; });
    // chỗ đứng sau câu k: giữa tấm ván nối hai chỗ thiếu (đo ở ngang giữa làn); 0 = đầu cầu, 5 = trước thảm VỀ ĐÍCH
    const ngang = g => {
      const xs = [];
      g.pts.forEach((p, k) => {
        const q = g.pts[(k + 1) % g.pts.length], y = h / 2;
        if (p[1] !== q[1] && (p[1] - y) * (q[1] - y) <= 0) xs.push(p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]));
      });
      return [Math.min.apply(null, xs), Math.max.apply(null, xs)];
    };
    CHO = [X0 - 58 + Math.round(45 * (CC.KS - 1))];      // các bạn to hơn thì đứng lùi vào trong, khỏi lấn nhãn nhóm
    for (let k = 1; k < 5; k++) CHO.push(Math.round((ngang(G[k - 1])[1] + ngang(G[k])[0]) / 2));
    CHO.push(1530);
    CC.LH = LH; CC.Y0 = Y0;
    CC.Y1 = CC.laneTop(3) + LH + BEAM;              // mép dưới cầu
    datConVat();
  }
  CC.GAP = G;
  const hopGap = k => HOP[k];
  // y0: mép trên cầu, lh: chiều cao làn, tren/duoi: mép trên, mép dưới của phần màn hình nhìn thấy (toạ độ thế giới 1920×1080)
  // trả về true nếu cầu đổi hình (phải vẽ lại các hình vẽ sẵn, tính lại chỗ đứng)
  CC.datHinh = function (y0, lh, tren, duoi) {
    y0 = Math.round(y0); lh = Math.round(lh);
    CC.TREN = tren == null ? 0 : tren; CC.DUOI = duoi == null ? 1080 : duoi;
    if (y0 === Y0 && lh === LH && G.length) { datConVat(); return false; }
    Y0 = y0; LH = lh;
    CC.TL = LH / 120; CC.KS = Math.min(CC.TL, 1.4); CC.DS = 1 + .4 * (CC.KS - 1); CC.NS = Math.min(CC.TL, 1.4);
    dungHinh();
    BE_DA = null;
    CC.xoaSan();
    return true;
  };
  // 5/11: hình có bộ lọc hoặc bóng mờ (shadowBlur) được vẽ sẵn MỘT lần rồi dùng lại: vẽ lại mỗi khung hình thì rất chậm
  //   (đo trên máy không có card đồ hoạ: 250 ms một khung, bỏ bóng mờ còn 20 ms)
  const SAN = new Map();
  function veSan(khoa, rong, cao, pad, ve) {
    let c = SAN.get(khoa);
    if (!c) { c = document.createElement("canvas"); c.width = Math.ceil(rong + 2 * pad); c.height = Math.ceil(cao + 2 * pad); ve(c.getContext("2d"), pad); SAN.set(khoa, c); }
    return c;
  }
  CC.veSan = veSan;
  // đốm sáng tròn vẽ sẵn (giữa đặc, mép trong suốt), vẽ ra bằng drawImage với globalAlpha thay cho tạo dải màu mỗi khung hình
  function domTron(khoa, trong, ngoai) {
    return veSan("domTron" + khoa, 32, 32, 0, g => {
      const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      rg.addColorStop(0, "rgba(" + trong + ",1)"); rg.addColorStop(1, "rgba(" + ngoai + ",0)");
      g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    });
  }
  // tâm (để ghi điểm, đặt nhân vật)
  CC.tam = g => { let sx = 0, sy = 0; g.pts.forEach(p => { sx += p[0]; sy += p[1]; }); return [sx / g.pts.length, sy / g.pts.length]; };
  // chỗ đứng sau câu k (0 = đầu cầu, 1..5 = sau khúc k; 5 = trước đuốc), tính trong dungHinh()
  CC.cho = k => CHO[k];
  // tổ đang thua đứng lùi sau tổ dẫn đầu theo thứ hạng: hạng 2 lùi 110 px, hạng 3 lùi 210 px, hạng 4 lùi 300 px
  //   (bằng điểm thì cùng hạng, đứng ngang nhau; sau câu 1 cầu còn ngắn nên các khoảng lùi co lại cho vừa từ đầu cầu)
  CC.LUI_HANG = [0, 110, 210, 300];
  CC.xDung = (q, hang) => {
    if (!q) return CC.cho(0);
    const co = Math.min(1, (CC.cho(q) - CC.cho(0)) / CC.LUI_HANG[3]);
    return CC.cho(q) - CC.LUI_HANG[(hang || 1) - 1] * co;
  };
  CC.xDuocI = i => (i % 2 ? 1838 : 1780);
  // thảm đỏ dọc VỀ ĐÍCH nằm giữa khúc cầu cuối và hàng đuốc; bạn nhỏ bước qua thảm tới đứng cạnh đuốc
  CC.THAM = [1548, 1708];                        // 5/11 Thịnh: thảm VỀ ĐÍCH to bề ngang (80 → 160 px)
  CC.X_CANH_DUOC = 1740;
  // 6/11 chiều: các bạn to hơn nên đứng lùi sang trái đuốc của mình, khỏi che huy chương thứ hạng trên cán đuốc
  CC.xCanhDuoc = i => Math.round(CC.xDuocI(i) - 46 - 40 * CC.KS);
  CC.DUOC_H = 150;                                // 5/11: đuốc mới, từ chân đế tới miệng đuốc

  // đường bao mặt cầu của một làn = hình chữ nhật trừ 5 chỗ thiếu (vẽ bằng evenodd)
  function lanePath(ctx, i, gaps) {
    const t = CC.laneTop(i);
    ctx.beginPath();
    ctx.rect(XS, t, XE - XS, LH);
    gaps.forEach(g => {
      ctx.moveTo(g.pts[0][0], t + g.pts[0][1]);
      for (let k = g.pts.length - 1; k >= 1; k--) ctx.lineTo(g.pts[k][0], t + g.pts[k][1]); // ngược chiều
      ctx.closePath();
    });
  }
  function gapPath(ctx, i, g, dx, dy, s) {
    const t = CC.laneTop(i), c = CC.tam(g);
    dx = dx || 0; dy = dy || 0; s = s || 1;
    ctx.beginPath();
    g.pts.forEach((p, k) => {
      const x = c[0] + (p[0] - c[0]) * s + dx, y = t + c[1] + (p[1] - c[1]) * s + dy;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
  }
  CC.gapPath = gapPath;

  function sao(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fffbe0";
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
    ctx.restore();
  }

  // ---------- miếng ghép (gỗ hoặc vàng), vẽ đúng chỗ thiếu; tr = {dx, dy, s, r, a} để vẽ lúc đang bay ----------
  function veMieng(ctx, A, pat, i, k, m, tr) {
    const g = G[k], t = CC.laneTop(i), c = CC.tam(g);
    ctx.save();
    if (tr) {
      ctx.globalAlpha = tr.a == null ? 1 : tr.a;
      ctx.translate(c[0] + (tr.dx || 0), t + c[1] + (tr.dy || 0));
      ctx.rotate(tr.r || 0); ctx.scale(tr.s || 1, tr.s || 1);
      ctx.translate(-c[0], -(t + c[1]));
    }
    ctx.save();
    gapPath(ctx, i, g);
    if (m.vang) {
      // miếng của tổ đúng nhiều nhất: gỗ màu mật ong sáng hơn các miếng khác, chỉ ửng sáng nhẹ, không chói
      // (quầng sáng và viền sáng vẽ sẵn cho từng ô; mỗi khung hình chỉ vẽ vệt sáng lướt qua)
      const b = hopGap(k);
      ctx.drawImage(veSan("vang" + i + "_" + k, b.w, LH, 34, (c2, pad) => {
        c2.translate(pad - b.x, pad - t);                 // vân gỗ khớp đúng chỗ như vẽ thẳng lên cảnh
        gapPath(c2, i, g);
        c2.shadowColor = "rgba(255,196,110,.75)"; c2.shadowBlur = 22; c2.fillStyle = c2.createPattern(A.go, "repeat"); c2.fill(); c2.shadowBlur = 0;
        c2.clip(); c2.fillStyle = "rgba(255,206,130,.40)"; c2.fill();
      }), b.x - 34, t - 34);
      if (!m.tinh) {                                       // m.tinh: vẽ vào lớp đứng yên, vệt sáng vẽ sau mỗi khung hình (veMiengSang)
        ctx.clip();
        const sh = (m.sheen == null ? .5 : m.sheen);
        const s = ctx.createLinearGradient(c[0] - 260 + sh * 300, t, c[0] - 140 + sh * 300, t + LH);
        s.addColorStop(0, "rgba(255,248,220,0)"); s.addColorStop(.48, "rgba(255,248,220,.30)"); s.addColorStop(.56, "rgba(255,248,220,0)");
        ctx.fillStyle = s; ctx.fill();
      }
      ctx.restore(); ctx.save();
      ctx.drawImage(veSan("vienVang" + k, b.w, LH, 24, (c2, pad) => {
        c2.translate(pad - b.x, pad - CC.laneTop(0));
        gapPath(c2, 0, g); c2.lineWidth = 4; c2.strokeStyle = "rgba(255,232,180,.95)"; c2.shadowColor = "rgba(255,214,140,.8)"; c2.shadowBlur = 10; c2.stroke();
      }), b.x - 24, t - 24);
    } else {
      ctx.fillStyle = pat; ctx.fill();
      ctx.fillStyle = "rgba(14,10,36,.52)"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,236,200,.75)"; ctx.stroke();
    }
    ctx.restore();
    if (m.diem != null && m.chu !== false) {
      ctx.save();
      ctx.font = fontSo(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
      if (m.vang) { ctx.lineWidth = 8 * CC.NS; ctx.strokeStyle = "#fff8d6"; ctx.strokeText(m.diem, c[0], t + c[1] + 3); ctx.fillStyle = "#6b3f00"; }
      else { ctx.lineWidth = 8 * CC.NS; ctx.strokeStyle = "#3a2410"; ctx.strokeText(m.diem, c[0], t + c[1] + 3); ctx.fillStyle = "#fff"; }
      ctx.fillText(m.diem, c[0], t + c[1] + 3);
      ctx.restore();
    }
    if (m.vang && !m.tinh) saoVang(ctx, c, t, m.tw == null ? 1 : m.tw);
    ctx.restore();
  }
  CC.veMieng = veMieng;
  const fontSo = () => "800 " + Math.round(46 * CC.NS) + "px 'Baloo 2'";
  // hai ngôi sao lấp lánh trên miếng vàng (c: tâm miếng trong làn, t: mép trên làn)
  function saoVang(ctx, c, t, tw) {
    const n = CC.NS;
    sao(ctx, c[0] - 46 * n, t + 24 * CC.TL, 11 * tw * n, .9); sao(ctx, c[0] + 50 * n, t + LH - 26 * CC.TL, 9 * (1.4 - tw * .4) * n, .85);
  }
  // vệt sáng lướt qua và hai ngôi sao trên miếng vàng đã vẽ sẵn trong lớp đứng yên
  function veMiengSang(ctx, i, k, tw, sh) {
    const g = G[k], t = CC.laneTop(i), c = CC.tam(g);
    if (sh > .03 && sh < 1.3) {                         // ngoài khoảng này vệt sáng nằm ngoài miếng ghép
      ctx.save(); gapPath(ctx, i, g); ctx.clip();
      const s = ctx.createLinearGradient(c[0] - 260 + sh * 300, t, c[0] - 140 + sh * 300, t + LH);
      s.addColorStop(0, "rgba(255,248,220,0)"); s.addColorStop(.48, "rgba(255,248,220,.30)"); s.addColorStop(.56, "rgba(255,248,220,0)");
      ctx.fillStyle = s; ctx.fill();
      ctx.restore();
    }
    saoVang(ctx, c, t, tw);
  }
  // số điểm vẽ sau cùng (trên đầu nhân vật) để bạn nhỏ đứng trên miếng ghép không che số
  CC.veSo = function (ctx, st) {
    for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) {
      const m = st.lap && st.lap[i] && st.lap[i][k]; if (!m || m.diem == null) continue;
      if (st.do && st.do[i] && CC.tam(G[k])[0] > CC.THAM[0] - (CC.THAM[0] - XS) * st.do[i]) continue;   // đã phủ thảm đỏ
      const g = G[k], t = CC.laneTop(i), c = CC.tam(g);
      ctx.save();
      ctx.font = fontSo(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
      ctx.lineWidth = 8 * CC.NS; ctx.strokeStyle = m.vang ? "#fff8d6" : "#3a2410"; ctx.strokeText(m.diem, c[0], t + c[1] + 3);
      ctx.fillStyle = m.vang ? "#6b3f00" : "#fff"; ctx.fillText(m.diem, c[0], t + c[1] + 3);
      ctx.restore();
    }
  };
  CC.sao = sao;

  // ---------- ngọn lửa vẽ bằng code (bập bùng theo t) ----------
  // màu lửa theo thứ hạng: hạng càng cao lửa càng to, càng sáng (hạng 1 gần trắng vàng, hạng 4 đỏ cam dịu)
  CC.LUA_HANG = {
    0: { s: 1, quang: ["255,200,90", .55], lop: [[1, "255,110,20", .85], [.72, "255,175,40", .9], [.45, "255,236,150", .95], [.25, "255,255,235", 1]], tan: 7 },
    1: { s: 1.12, quang: ["255,226,140", .85], lop: [[1, "255,160,30", .85], [.72, "255,205,70", .82], [.46, "255,238,165", .82], [.24, "255,252,225", .9]], tan: 12, sao: true },
    2: { s: 1.0, quang: ["255,200,100", .6], lop: [[1, "255,135,25", .85], [.7, "255,185,50", .85], [.44, "255,228,140", .85], [.22, "255,248,215", .9]], tan: 8 },
    3: { s: .9, quang: ["255,165,70", .42], lop: [[1, "235,95,25", .82], [.68, "250,140,40", .82], [.4, "255,195,100", .82], [.2, "255,228,175", .85]], tan: 6 },
    4: { s: .78, quang: ["230,115,50", .28], lop: [[1, "200,60,25", .78], [.66, "230,100,30", .78], [.38, "245,150,60", .78], [.18, "255,200,135", .8]], tan: 4 }
  };
  CC.veLua = function (ctx, x, y, s, t, seed, a, hang) {
    if (s <= 0) return;
    a = a == null ? 1 : a; seed = seed || 0;
    const P = CC.LUA_HANG[hang || 0] || CC.LUA_HANG[0];
    s *= P.s;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    let rg = ctx.createRadialGradient(x, y - 40 * s, 0, x, y - 40 * s, 150 * s);
    rg.addColorStop(0, "rgba(" + P.quang[0] + "," + (P.quang[1] * a) + ")"); rg.addColorStop(.4, "rgba(255,140,40," + (P.quang[1] * .45 * a) + ")"); rg.addColorStop(1, "rgba(255,120,30,0)");
    ctx.fillStyle = rg; ctx.fillRect(x - 150 * s, y - 190 * s, 300 * s, 300 * s);
    ctx.globalCompositeOperation = "source-over";   // 5/11: thân lửa giữ màu cam, vàng rõ như hình mẫu (không cộng sáng thành trắng)
    P.lop.forEach((L, j) => {
      const h = 120 * s * L[0] * (1 + .10 * Math.sin(t * 9.3 + seed + j) + .06 * Math.sin(t * 15.1 + seed * 2 + j));
      const w = 34 * s * (L[0] * .8 + .2) * (1 + .05 * Math.sin(t * 11 + j));
      const lean = (6 * Math.sin(t * 5.3 + seed) + 4 * Math.sin(t * 8.7 + seed * 3)) * s * L[0];
      ctx.fillStyle = "rgba(" + L[1] + "," + (L[2] * a) + ")";
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.bezierCurveTo(x - w * 1.1, y - h * .45, x - w * .35 + lean * .5, y - h * .7, x + lean, y - h);
      ctx.bezierCurveTo(x + w * .35 + lean * .5, y - h * .7, x + w * 1.1, y - h * .45, x + w, y);
      ctx.quadraticCurveTo(x, y + w * .55, x - w, y);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "lighter";       // lõi lửa sáng rực
    rg = ctx.createRadialGradient(x, y - 34 * s, 0, x, y - 34 * s, 46 * s);
    rg.addColorStop(0, "rgba(255,250,220," + (.45 * a) + ")"); rg.addColorStop(1, "rgba(255,220,120,0)");
    ctx.fillStyle = rg; ctx.fillRect(x - 46 * s, y - 80 * s, 92 * s, 92 * s);
    // tàn lửa nhỏ bay lên
    for (let k = 0; k < P.tan; k++) {
      const ph = ((t * .9 + k / P.tan + seed * .13) % 1), ex = x + Math.sin(k * 7.1 + seed + t * 2) * 22 * s, ey = y - 60 * s - ph * 150 * s;
      ctx.fillStyle = "rgba(255,210,120," + ((1 - ph) * .9 * a) + ")";
      ctx.beginPath(); ctx.arc(ex, ey, 3.2 * s * (1 - ph * .6), 0, 7); ctx.fill();
    }
    ctx.restore();
    if (P.sao) for (let k = 0; k < 4; k++) {   // hạng 1: thêm sao lấp lánh quanh ngọn lửa
      const tw = Math.pow(Math.max(0, Math.sin(t * 2.6 + k * 1.7 + seed)), 2);
      if (tw > .05) sao(ctx, x + [-58, 60, -40, 46][k] * s, y - [70, 96, 140, 40][k] * s, 13 * tw, a * tw);
    }
  };

  // ---------- nền: sông đêm + con vật (chuyển động theo t) ----------
  CC.veNen = function (ctx, A, t) {
    ctx.drawImage(A.nen, 0, 0, 1920, 1080);
    CC.veNenDong(ctx, A, t);
  };
  // phần chuyển động của nền: gợn nước, con vật, đom đóm (đều nằm ngoài cây cầu nên vẽ đè lên lớp đứng yên được)
  CC.veNenDong = function (ctx, A, t) {
    CC.veGon(ctx, t || 0);
    if (A.convat) CC.veConVat(ctx, A, t || 0);
  };

  // ---------- cây cầu: mặt cầu, miếng ghép, viền chỗ thiếu, dầm, đuốc ----------
  // st = { lap: [[{diem, vang}|null ×5] ×4], bay: [{i,k,m,tr}], duoc: [{chay:0..1, hang}] ×4, t }
  // 6/11 (thầy Thịnh: "game hơi lag"): tách làm hai phần.
  //   veCauTinh: phần đứng yên (mặt cầu, dầm, đèn, miếng ghép đã đặt, viền chỗ trống, thảm, bệ đá, thân đuốc),
  //     san-khau.js vẽ sẵn vào một lớp cùng ảnh nền, chỉ vẽ lại khi có miếng ghép mới.
  //   veCauDong: phần chuyển động (gợn nước, vòi nước, vệt sáng, miếng đang bay, lửa đuốc), vẽ mỗi khung hình.
  //   cot: cột chỗ thiếu đang có miếng ghép bay vào (vẽ ở phần chuyển động), -1 nếu không có.
  const coMieng = (st, i, k) => !!(st.lap && st.lap[i] && st.lap[i][k]);
  const sapDat = (st, i, k) => !!(st.bay && st.bay.some(b => b.i === i && b.k === k && b.dat));
  function veNetDut(ctx, i, k) {                       // viền nét đứt sáng của chỗ còn trống (vẽ sẵn)
    const g = G[k], b = hopGap(k);
    ctx.drawImage(veSan("netDut" + k, b.w, LH, 26, (c2, pad) => {
      c2.translate(pad - b.x, pad - CC.laneTop(0)); gapPath(c2, 0, g, 0, 0, .94);
      c2.setLineDash([14, 10]); c2.lineWidth = 4;
      c2.shadowColor = "rgba(255,230,150,.9)"; c2.shadowBlur = 12;
      c2.strokeStyle = "rgba(255,240,190,.95)"; c2.stroke();
    }), b.x - 26, CC.laneTop(i) - 26);
  }
  CC.veCauTinh = function (ctx, A, st, cot) {
    { const wR = XE - XS, hR = CC.Y1 - Y0 + 6;      // bóng mờ dưới cây cầu
      ctx.drawImage(veSan("bongCau", wR, hR, 48, (g, pad) => { g.fillStyle = "rgba(0,10,25,.45)"; g.filter = "blur(14px)"; g.fillRect(pad, pad, wR, hR); }), XS + 10 - 48, Y0 + 18 - 48); }
    const pat = ctx.createPattern(A.go, "repeat");
    for (let i = 0; i < 4; i++) {
      ctx.save();
      lanePath(ctx, i, G);
      ctx.fillStyle = pat; ctx.fill("evenodd");
      ctx.fillStyle = "rgba(12,8,30,.68)"; ctx.fill("evenodd");
      ctx.restore();
      G.forEach((g, k) => {
        ctx.save(); gapPath(ctx, i, g); ctx.clip();
        ctx.fillStyle = "rgba(5,15,35,.35)"; ctx.fill();
        mauNuocHo(ctx, i, k);                          // màu nước trong chỗ thiếu (gợn nước vẽ ở phần chuyển động)
        ctx.restore();
        const b = hopGap(k);                           // mép tối bên trong chỗ thiếu (vẽ sẵn)
        ctx.drawImage(veSan("mepGap" + k, b.w, LH, 4, (c2, pad) => {
          c2.translate(pad - b.x, pad - CC.laneTop(0)); gapPath(c2, 0, g); c2.clip();
          c2.shadowColor = "rgba(0,0,0,.7)"; c2.shadowBlur = 16;
          c2.lineWidth = 10; c2.strokeStyle = "rgba(0,0,0,.55)"; gapPath(c2, 0, g); c2.stroke();
        }), b.x - 4, CC.laneTop(i) - 4);
      });
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let x = XS + 6; x <= XE; x += 198) [Y0, CC.Y1].forEach(y => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 120);
      rg.addColorStop(0, "rgba(255,170,70,.08)"); rg.addColorStop(1, "rgba(255,150,60,0)");
      ctx.fillStyle = rg; ctx.fillRect(x - 120, y - 120, 240, 240);
    });
    ctx.restore();
    for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) {
      if (k === cot) continue;
      if (coMieng(st, i, k)) veMieng(ctx, A, pat, i, k, Object.assign({}, st.lap[i][k], { chu: false, tinh: true }));
      else if (!sapDat(st, i, k)) veNetDut(ctx, i, k);
    }
    for (let b = 0; b < 5; b++) {
      const y = Y0 + b * (LH + BEAM), outer = b === 0 || b === 4;
      const bh = BEAM + (outer ? 6 : 0), yy = y - (outer ? 3 : 0);
      ctx.save();
      const gr = ctx.createLinearGradient(0, yy, 0, yy + bh);
      gr.addColorStop(0, "#6e4626"); gr.addColorStop(.5, "#54331a"); gr.addColorStop(1, "#3a2210");
      ctx.fillStyle = gr; ctx.fillRect(XS - 8, yy, XE - XS + 16, bh);
      ctx.globalAlpha = .35; ctx.fillStyle = pat; ctx.fillRect(XS - 8, yy, XE - XS + 16, bh);
      ctx.restore();
      if (outer) for (let x = XS + 6; x <= XE; x += 198) {
        ctx.fillStyle = "#3f2512"; ctx.fillRect(x - 13, yy - 6, 26, bh + 12);
        ctx.fillStyle = "#6e4526"; ctx.fillRect(x - 9, yy - 2, 18, bh + 4);
        const ly = b === 0 ? yy - 4 : yy + bh + 4;
        // 6/11: đèn trên lan can sáng đều (trước đây chập chờn từng khung hình)
        const rg = ctx.createRadialGradient(x, ly, 0, x, ly, 46);
        rg.addColorStop(0, "rgba(255,200,110,.5)"); rg.addColorStop(1, "rgba(255,170,80,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, ly, 46, 0, 7); ctx.fill();
        ctx.fillStyle = "#ffcf7a"; ctx.beginPath(); ctx.arc(x, ly, 7, 0, 7); ctx.fill();
        ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.arc(x, ly, 4, 0, 7); ctx.fill();
      }
    }
    CC.veTham(ctx, 0, "tinh");
    CC.veBeDa(ctx);                                  // 5/11: bệ đá sáng màu để đuốc nổi lên, không lẫn với gỗ
    for (let i = 0; i < 4; i++) veDuocTinh(ctx, i);
  };
  CC.veCauDong = function (ctx, A, st, cot) {
    const t0 = st.t || 0;
    const trong = [], phun = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) {
      if (coMieng(st, i, k)) continue;
      trong.push([i, k]);                            // gợn nước: mọi chỗ còn trống, kể cả chỗ có miếng ghép đang bay tới
      if (!(st.bay && st.bay.some(b => b.i === i && b.k === k))) phun.push([i, k]);
    }
    CC.veGonNuoc(ctx, trong, t0);
    // cột đang có miếng ghép bay vào: miếng đã đáp xuống, viền nét đứt của chỗ còn trống
    if (cot >= 0) {
      const pat = ctx.createPattern(A.go, "repeat");
      for (let i = 0; i < 4; i++) {
        if (coMieng(st, i, cot)) veMieng(ctx, A, pat, i, cot, Object.assign({ tw: .75 + .25 * Math.sin(t0 * 3 + i + cot), sheen: (t0 * .35 + cot * .2) % 1.6 }, st.lap[i][cot], st.soTren ? { chu: false } : {}));
        else if (!sapDat(st, i, cot)) veNetDut(ctx, i, cot);
      }
    }
    // vệt sáng lướt và sao lấp lánh trên các miếng vàng đã vẽ sẵn
    for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) {
      if (k === cot || !coMieng(st, i, k) || !st.lap[i][k].vang) continue;
      veMiengSang(ctx, i, k, .75 + .25 * Math.sin(t0 * 3 + i + k), (t0 * .35 + k * .2) % 1.6);
    }
    // 5/11 Thịnh: chỗ chưa có mảnh ghép thì nước phun lên, như chưa qua được
    CC.veVoiNuocNhieu(ctx, phun, t0);
    (st.sang || []).forEach(d => CC.veDuongSang(ctx, d.i, d.x, t0, d.a == null ? 1 : d.a));
    CC.veTham(ctx, t0, "dong");
    // miếng đang bay (vẽ trên dầm)
    if (st.bay && st.bay.length) { const pat = ctx.createPattern(A.go, "repeat"); st.bay.forEach(b => veMieng(ctx, A, pat, b.i, b.k, b.m, b.tr)); }
    for (let i = 0; i < 4; i++) veDuocDong(ctx, i, (st.duoc && st.duoc[i]) || {}, t0);
  };
  // vẽ cả cây cầu một lần (phần kết khi lửa đốt màn đêm, ảnh phác thảo)
  CC.veCau = function (ctx, A, st) { CC.veCauTinh(ctx, A, st, -1); CC.veCauDong(ctx, A, st, -1); };

  // đuốc cuối cầu (5/11 04:53–04:59 Thịnh: vẽ theo hình mẫu, bỏ quyển sách)
  // 6/11 chiều: đuốc to theo làn (DS), chân đế ngang chân các bạn nhỏ
  const choDuocI = i => { const y = CC.yChan(i); return [CC.xDuocI(i), y, y - CC.DUOC_H * CC.DS]; };   // x, y chân đế, yM miệng đuốc
  CC.mieng = i => { const d = choDuocI(i); return [d[0], d[2]]; };
  function veDuocTinh(ctx, i) {
    const [x, y, yM] = choDuocI(i), Z = CC.DS;
    // quầng sáng ấm sau đuốc để đuốc nổi trên nền đá
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    let rg = ctx.createRadialGradient(x, yM + 34 * Z, 0, x, yM + 34 * Z, 105 * Z);
    rg.addColorStop(0, "rgba(255,225,130,.5)"); rg.addColorStop(.4, "rgba(255,190,70,.22)"); rg.addColorStop(1, "rgba(255,160,40,0)");
    ctx.fillStyle = rg; ctx.fillRect(x - 105 * Z, yM - 71 * Z, 210 * Z, 210 * Z);
    rg = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, 60 * Z);
    rg.addColorStop(0, "rgba(255,210,100,.42)"); rg.addColorStop(1, "rgba(255,180,60,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, y - 4, 60 * Z, 22 * Z, 0, 0, 7); ctx.fill();
    ctx.restore();
    // thân đuốc: vẽ sẵn một lần (đúng cỡ) rồi dùng lại
    const P = Math.round(20 * Z), ox = Math.round(65 * Z) + P, oy = Math.round(186 * Z) + P;
    ctx.drawImage(veSan("than-duoc" + Z.toFixed(3), Math.round(130 * Z), Math.round(200 * Z), P, (g) => { g.translate(ox, oy); g.scale(Z, Z); veThanDuoc(g); }), x - ox, y - oy);
  }
  function veDuocDong(ctx, i, D, t0) {
    const [x, y, yM] = choDuocI(i), Z = CC.DS;
    if (D.chay > 0) {
      const p = D.chay, s = p < .35 ? (p / .35) * 1.25 : 1.25 - .25 * Math.min(1, (p - .35) / .3);
      CC.veLua(ctx, x, yM + 2 * Z, s * .86 * Z, t0, i * 1.7, 1, D.hang);
      if (p < .5) {   // bùng lửa: vòng sáng nở ra
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const r = (40 + p * 360) * Z * (D.hang ? CC.LUA_HANG[D.hang].s : 1), al = (1 - p / .5) * .8 * (D.hang ? Math.min(1, CC.LUA_HANG[D.hang].quang[1] + .2) : 1);
        const rr = ctx.createRadialGradient(x, yM, 0, x, yM, r);
        rr.addColorStop(0, "rgba(255,240,180," + al + ")"); rr.addColorStop(1, "rgba(255,170,60,0)");
        ctx.fillStyle = rr; ctx.fillRect(x - r, yM - r, 2 * r, 2 * r); ctx.restore();
      }
    } else {
      // than hồng âm ỉ trong miệng đuốc, chờ được thắp
      const nh = .55 + .45 * Math.sin(t0 * 3.1 + i * 1.3);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const eg = ctx.createRadialGradient(x, yM - 2 * Z, 0, x, yM - 2 * Z, 30 * Z);
      eg.addColorStop(0, "rgba(255,130,50," + (.55 * nh) + ")"); eg.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = eg; ctx.fillRect(x - 30 * Z, yM - 32 * Z, 60 * Z, 60 * Z); ctx.restore();
      sao(ctx, x - 44 * Z, yM - 4 * Z, 11 * Z, .95); sao(ctx, x + 46 * Z, yM + 30 * Z, 9 * Z, .9); sao(ctx, x + 30 * Z, yM - 34 * Z, 6 * Z, .8);
    }
    if (D.hang && D.huy > 0) {    // huy chương thứ hạng gắn giữa cán đuốc
      const q = Math.min(1, D.huy), sc = q < .6 ? q / .6 * 1.25 : 1.25 - .25 * (q - .6) / .4;
      const huy = veSan("huy" + D.hang, 66, 66, 30, (c2, pad) => {
        c2.translate(pad + 33, pad + 33);
        c2.shadowColor = "rgba(255,200,60,.9)"; c2.shadowBlur = 20;
        const mg = c2.createRadialGradient(-7, -9, 3, 0, 0, 31);
        mg.addColorStop(0, "#fff6c2"); mg.addColorStop(.5, D.hang === 1 ? "#ffcf2e" : "#f2b632"); mg.addColorStop(1, "#c98a0c");
        c2.fillStyle = mg; c2.beginPath(); c2.arc(0, 0, 31, 0, 7); c2.fill();
        c2.shadowBlur = 0; c2.lineWidth = 3.5; c2.strokeStyle = "#fff4c4"; c2.stroke();
        c2.font = "800 44px 'Baloo 2'"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillStyle = "#6b3f00";
        c2.fillText(D.hang, 0, 4);
      });
      ctx.save(); ctx.translate(x, y - 78 * Z); ctx.scale(sc * Z, sc * Z);
      ctx.drawImage(huy, -63, -63);
      ctx.restore();
    }
  }

  // ---------- thân đuốc mới (5/11 Thịnh gửi hình mẫu): cán hình nón thon hai tông cam/đỏ, miệng đuốc vàng loe ra.
  //   Thêm cho đẹp: đế tròn sơn đỏ viền vàng, hai khâu vàng trên cán, hai cành nguyệt quế vàng ôm miệng đuốc, than hồng trong miệng.
  //   Gốc toạ độ ở giữa chân đế, trục y hướng xuống; miệng đuốc ở y = -CC.DUOC_H (ngọn lửa đặt ở đó).
  function veThanDuoc(g) {
    const vang = (x0, x1) => {
      const v = g.createLinearGradient(x0, 0, x1, 0);
      v.addColorStop(0, "#a86c08"); v.addColorStop(.3, "#ffe58a"); v.addColorStop(.6, "#f6c33a"); v.addColorStop(1, "#9a6206");
      return v;
    };
    // bóng đổ mềm trên nền đá
    g.fillStyle = "rgba(25,14,6,.38)"; g.beginPath(); g.ellipse(3, 4, 38, 9, 0, 0, 7); g.fill();
    // đế tròn sơn đỏ, viền vàng
    let gr = g.createLinearGradient(-30, 0, 30, 0);
    gr.addColorStop(0, "#6e1c10"); gr.addColorStop(.3, "#b3402a"); gr.addColorStop(.55, "#c4553a"); gr.addColorStop(1, "#5a160c");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-30, 0); g.lineTo(-23, -20); g.lineTo(23, -20); g.lineTo(30, 0); g.ellipse(0, 0, 30, 8, 0, 0, Math.PI); g.closePath(); g.fill();
    g.fillStyle = "#cf6248"; g.beginPath(); g.ellipse(0, -20, 23, 6, 0, 0, 7); g.fill();
    g.strokeStyle = vang(-30, 30); g.lineWidth = 3.4;
    g.beginPath(); g.ellipse(0, 0, 30, 8, 0, 0, Math.PI); g.stroke();
    g.beginPath(); g.ellipse(0, -20, 23, 6, 0, 0, 7); g.stroke();
    // cán đuốc: nón thon, phần trái cam sáng, phần phải đỏ đậm (theo hình mẫu)
    const yd = -18, yt = -137, bd = 6.5, bt = 20, xc = 5;
    const nua = y => bd + (bt - bd) * (y - yd) / (yt - yd);
    gr = g.createLinearGradient(-bt, 0, xc, 0); gr.addColorStop(0, "#f07a26"); gr.addColorStop(.45, "#ffa24c"); gr.addColorStop(1, "#f37422");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-bt, yt); g.lineTo(xc, yt); g.lineTo(xc * .35, yd); g.lineTo(-bd, yd); g.closePath(); g.fill();
    gr = g.createLinearGradient(xc, 0, bt, 0); gr.addColorStop(0, "#d63d22"); gr.addColorStop(1, "#9c2315");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(xc, yt); g.lineTo(bt, yt); g.lineTo(bd, yd); g.lineTo(xc * .35, yd); g.closePath(); g.fill();
    g.lineCap = "round";
    g.strokeStyle = "rgba(255,230,180,.75)"; g.lineWidth = 2.6;                 // vệt sáng
    g.beginPath(); g.moveTo(-bt + 5.5, yt + 10); g.lineTo(-bd + 2.4, yd - 8); g.stroke();
    g.strokeStyle = "rgba(105,26,10,.55)"; g.lineWidth = 1.3;                   // viền mảnh
    g.beginPath(); g.moveTo(-bt, yt); g.lineTo(-bd, yd); g.lineTo(bd, yd); g.lineTo(bt, yt); g.stroke();
    // hai khâu vàng trên cán
    const khau = (yc, h) => {
      const a = nua(yc + h / 2) + 2, b = nua(yc - h / 2) + 2;
      g.fillStyle = vang(-b, b);
      g.beginPath(); g.moveTo(-a, yc + h / 2); g.lineTo(-b, yc - h / 2); g.lineTo(b, yc - h / 2); g.lineTo(a, yc + h / 2); g.closePath(); g.fill();
      g.strokeStyle = "rgba(130,80,8,.6)"; g.lineWidth = 1; g.stroke();
    };
    khau(-25, 9); khau(-106, 9);
    // miệng đuốc vàng: cổ loe, hạt chấm trang trí, vành tròn, lòng có than hồng
    g.fillStyle = vang(-22, 22);
    g.beginPath(); g.moveTo(-bt - 1, yt + 2); g.lineTo(-26, -150); g.lineTo(26, -150); g.lineTo(bt + 1, yt + 2); g.closePath(); g.fill();
    g.strokeStyle = "rgba(130,80,8,.6)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#fff4bf"; for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * 8, -143, 1.8, 0, 7); g.fill(); }
    g.fillStyle = vang(-27, 27); g.beginPath(); g.ellipse(0, -150, 27, 7.5, 0, 0, 7); g.fill();
    g.strokeStyle = "#9a6206"; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = "#3a1a08"; g.beginPath(); g.ellipse(0, -150, 21.5, 5.4, 0, 0, 7); g.fill();
    // ụ than (bấc đuốc) nhô lên khỏi miệng, cho biết đây là đuốc đang chờ thắp
    const than = g.createLinearGradient(0, -162, 0, -150); than.addColorStop(0, "#4a2410"); than.addColorStop(1, "#1c0c04");
    g.fillStyle = than; g.beginPath(); g.ellipse(0, -150, 19, 11, 0, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1;                         // vài vết nứt của than
    [[-12, -152, -4, -157], [-3, -151, 5, -158], [6, -152, 13, -155]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
    g.strokeStyle = "rgba(255,170,90,.3)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -150, 19, 11, 0, Math.PI * 1.15, Math.PI * 1.55); g.stroke();
    g.fillStyle = "rgba(255,120,40,.95)"; [[-7, -154], [4, -156.5], [10, -152]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 1.3, 0, 7); g.fill(); });
    // hai cành nguyệt quế vàng ôm miệng đuốc
    [-1, 1].forEach(d => {
      const P0 = [d * 11, -104], P1 = [d * 50, -118], P2 = [d * 37, -172];
      const diem = u => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1]]; };
      const huong = u => Math.atan2(2 * (1 - u) * (P1[1] - P0[1]) + 2 * u * (P2[1] - P1[1]), 2 * (1 - u) * (P1[0] - P0[0]) + 2 * u * (P2[0] - P1[0]));
      g.strokeStyle = "#b8800e"; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(P0[0], P0[1]); g.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); g.stroke();
      const la = (u, lech, dai, rong) => {
        const p = diem(u), goc = huong(u) + lech;
        g.save(); g.translate(p[0], p[1]); g.rotate(goc);
        const lg = g.createLinearGradient(0, -rong, 0, rong); lg.addColorStop(0, "#fff0a0"); lg.addColorStop(.5, "#f4c43a"); lg.addColorStop(1, "#c88a10");
        g.fillStyle = lg; g.beginPath(); g.ellipse(dai / 2, 0, dai / 2, rong, 0, 0, 7); g.fill();
        g.strokeStyle = "rgba(150,95,8,.7)"; g.lineWidth = .9; g.stroke();
        g.strokeStyle = "rgba(255,248,210,.85)"; g.lineWidth = .9; g.beginPath(); g.moveTo(2, 0); g.lineTo(dai - 3, 0); g.stroke();
        g.restore();
      };
      for (let n = 0; n < 6; n++) la(.16 + n * .15, (n % 2 ? 1 : -1) * .72, 15 - n * .6, 4.6 - n * .2);
      la(1, 0, 11, 3.6);
    });
  }

  // ---------- đường chạy lấp lánh của tổ đang dẫn đầu: thảm ánh vàng, vệt sáng lướt qua, sao lấp lánh, bụi vàng bay lên ----------
  CC.veDuongSang = function (ctx, i, x1, t, a) {
    if (a <= 0) return;
    const y0 = CC.laneTop(i), y1 = y0 + LH, xe = Math.min(XE, x1 + 60);
    ctx.save();
    ctx.beginPath(); ctx.rect(XS, y0, xe - XS, LH); ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const nh = .85 + .15 * Math.sin(t * 2.1);
    let g = ctx.createLinearGradient(XS, 0, xe, 0);
    g.addColorStop(0, "rgba(255,205,90," + (.07 * a) + ")"); g.addColorStop(.85, "rgba(255,215,100," + (.20 * a * nh) + ")"); g.addColorStop(1, "rgba(255,215,100,0)");
    ctx.fillStyle = g; ctx.fillRect(XS, y0, xe - XS, LH);
    const L = xe - XS + 420, xs = XS - 210 + ((t * 380) % L);
    g = ctx.createLinearGradient(xs - 90, 0, xs + 90, 0);
    g.addColorStop(0, "rgba(255,245,200,0)"); g.addColorStop(.5, "rgba(255,245,200," + (.30 * a) + ")"); g.addColorStop(1, "rgba(255,245,200,0)");
    ctx.fillStyle = g; ctx.fillRect(xs - 90, y0, 180, LH);
    let s = 31 + i * 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const bui = domTron("bui", "255,240,170", "255,200,80");   // 6/11: đốm sáng vẽ sẵn, không tạo dải màu mỗi khung hình
    for (let k = 0; k < 24; k++) {     // bụi vàng bay lên
      const x = XS + 20 + rnd() * (xe - XS - 40), ph = rnd(), q = (t * .45 + ph) % 1, y = y1 - 8 - q * (LH - 10);
      const rr = 7 * (1 - q * .5);
      ctx.globalAlpha = .9 * a * (1 - q); ctx.drawImage(bui, x - rr, y - rr, 2 * rr, 2 * rr);
    }
    ctx.restore();
    ctx.save();
    for (let k = 0; k < 22; k++) {     // sao lấp lánh
      const x = XS + 30 + rnd() * (xe - XS - 60), y = y0 + 14 + rnd() * (LH - 28), ph = rnd() * 6.3;
      const tw = Math.pow(Math.max(0, Math.sin(t * 2.3 + ph)), 3);
      const sz = 9 + 10 * rnd(); if (tw > .05) sao(ctx, x, y, sz * tw, a * tw);
    }
    // hai mép đường viền vàng: một nét sáng vẽ sẵn (đầu, thân, cuối), thân kéo dài theo chiều dài đường
    const len = xe - 30 - XS;
    if (len > 0) {
      const P = 24, L0 = 120, net = veSan("netSang", L0, 3, P, (c2, pad) => {
        c2.strokeStyle = "rgba(255,226,120,.85)"; c2.lineWidth = 3; c2.shadowColor = "#ffd76a"; c2.shadowBlur = 14;
        c2.beginPath(); c2.moveTo(pad, pad + 1.5); c2.lineTo(pad + L0, pad + 1.5); c2.stroke();
      });
      const dau = P + 20, giua = Math.max(0, len - 40);
      ctx.globalAlpha = a;
      [y0 + 2, y1 - 2].forEach(y => {
        const yy = y - P - 1.5, w0 = Math.min(dau, P + len / 2);
        ctx.drawImage(net, 0, 0, w0, net.height, XS - P, yy, w0, net.height);
        if (giua > 0) ctx.drawImage(net, dau, 0, L0 - 40, net.height, XS + 20, yy, giua, net.height);
        ctx.drawImage(net, net.width - w0, 0, w0, net.height, XS + len + P - w0, yy, w0, net.height);
      });
    }
    ctx.restore();
  };

  // ---------- thảm đỏ dọc VỀ ĐÍCH (vạch đích trước hàng đuốc) ----------
  // phan: "tinh" chỉ vẽ thảm (lớp đứng yên), "dong" chỉ vẽ ánh sáng lướt, bỏ trống thì vẽ cả hai
  CC.veTham = function (ctx, t, phan) {
    const [x0, x1] = CC.THAM, y0 = Y0 - 10, y1 = CC.Y1 + 10, w = x1 - x0;
    // thảm và chữ vẽ sẵn một lần (có bóng mờ); mỗi khung hình chỉ vẽ ánh sáng lướt
    if (phan !== "dong") ctx.drawImage(veSan("tham", w, y1 - y0, 26, (c, pad) => {
      c.translate(pad - x0, pad - y0);
      c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = 14; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "#9e1420"); g.addColorStop(.5, "#d0262f"); g.addColorStop(1, "#9e1420");
      c.fillStyle = g; c.fillRect(x0, y0, w, y1 - y0);
      c.shadowBlur = 0; c.shadowOffsetY = 0; c.shadowColor = "transparent";
      c.globalAlpha = .12; c.fillStyle = "#000";                    // sọc vải mờ
      for (let y = y0 + 6; y < y1; y += 12) c.fillRect(x0, y, w, 2);
      c.globalAlpha = 1;
      c.fillStyle = "#e8b64a"; c.fillRect(x0 + 8, y0, 6, y1 - y0); c.fillRect(x1 - 14, y0, 6, y1 - y0);   // viền kim tuyến
      c.fillStyle = "rgba(255,236,170,.9)"; c.fillRect(x0 + 9, y0, 2, y1 - y0); c.fillRect(x1 - 13, y0, 2, y1 - y0);
      c.fillStyle = "rgba(232,182,74,.55)"; c.fillRect(x0 + 20, y0, 2, y1 - y0); c.fillRect(x1 - 22, y0, 2, y1 - y0);
      // chữ VỀ ĐÍCH viết dọc, mỗi chữ cái đứng thẳng
      const chu = ["V", "Ề", "", "Đ", "Í", "C", "H"], cao = (y1 - y0 - 60) / chu.length;
      c.font = "800 " + Math.round(76 * Math.min(1.3, CC.TL)) + "px 'Baloo 2'"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
      chu.forEach((ch, k) => {
        if (!ch) return;
        const cx = (x0 + x1) / 2, cy = y0 + 40 + cao * (k + .5) + (k > 2 ? -cao * .2 : k < 2 ? cao * .2 : 0);   // khoảng trống giữa VỀ và ĐÍCH hẹp lại, chữ to đỡ chật
        c.lineWidth = 8; c.strokeStyle = "#6e0d14"; c.strokeText(ch, cx, cy + 4);
        c.fillStyle = "#ffe9a8"; c.fillText(ch, cx, cy + 4);
      });
    }), x0 - 26, y0 - 26);
    if (phan === "tinh") return;
    ctx.save();
    // ánh sáng lướt nhẹ dọc thảm
    const ly = y0 + (((t || 0) * 160) % (y1 - y0 + 300)) - 150;
    const lg = ctx.createLinearGradient(0, ly - 80, 0, ly + 80);
    lg.addColorStop(0, "rgba(255,240,200,0)"); lg.addColorStop(.5, "rgba(255,240,200,.18)"); lg.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = lg; ctx.fillRect(x0, Math.max(y0, ly - 80), w, 160);
    ctx.restore();
  };

  // ---------- sao rơi trên đường của tổ đang dẫn đầu (vẽ sau nhân vật, trước số điểm) ----------
  function sao5(ctx, r) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath();
  }
  CC.MAU_SAO = ["#ffe066", "#fff6d0", "#ffd03a", "#ffeaa0", "#fffbe8"];
  CC.veSaoRoi = function (ctx, i, x1, t, a) {
    if (a <= 0) return;
    const y0 = CC.laneTop(i), xe = Math.min(CC.THAM[0] - 10, x1 + 40);
    if (xe < XS + 60) return;
    let s = 97 + i * 13; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    ctx.save();
    ctx.beginPath(); ctx.rect(XS, y0 - 26, xe - XS + 20, LH + 26); ctx.clip();   // chỉ rơi trong làn của tổ dẫn đầu
    for (let k = 0; k < 18; k++) {
      const xd = XS + 30 + rnd() * (xe - XS - 60), yd = y0 + 16 + rnd() * (LH - 32);
      const P = 2.4 + rnd() * 1.4, ph = rnd(), r0 = 8 + rnd() * 7, quay = (rnd() - .5) * 3, goc0 = rnd() * 6.3;
      const c = CC.MAU_SAO[Math.floor(rnd() * CC.MAU_SAO.length)];
      const q = ((t / P + ph) % 1), roi = .55;
      let x, y, al, r = r0, goc;
      if (q < roi) {                       // đang rơi, lắc nhẹ, xoay chậm
        const p = q / roi;
        x = xd + 10 * Math.sin(t * 2 + k) * (1 - p); y = yd - 95 * (1 - p); al = Math.min(1, p / .25); goc = goc0 + quay * t;
      } else {                             // chạm mặt cầu: lấp lánh rồi mờ dần
        const p = (q - roi) / (1 - roi);
        x = xd; y = yd; al = 1 - p * p; r = r0 * (1 + .25 * Math.sin(p * Math.PI)); goc = goc0 + quay * (Math.floor(t / P) * P);
      }
      // ngôi sao có quầng sáng vẽ sẵn theo từng màu (bán kính 16), rồi thu phóng theo r
      const anh = veSan("saoRoi" + c, 32, 32, 18, (c2, pad) => {
        c2.translate(pad + 16, pad + 16);
        c2.shadowColor = "rgba(255,210,90,.95)"; c2.shadowBlur = 10;
        sao5(c2, 16); c2.fillStyle = c; c2.fill();
        c2.shadowBlur = 0; c2.lineWidth = 1.5 * 16 / 11.5; c2.strokeStyle = "rgba(190,120,20,.7)"; c2.stroke();
      });
      ctx.save(); ctx.globalAlpha = a * al;
      ctx.translate(x, y); ctx.rotate(goc); ctx.scale(r / 16, r / 16);
      ctx.drawImage(anh, -34, -34);
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------- nhân vật: ds = [{i, x, y (chân), h, a, lat, ghost:[{x,y,a}], sx, sy, rot}] ----------
  CC.veNguoi = function (ctx, A, ds, t) {
    ds.forEach(n => {
      const im = A.to[n.i], h = n.h || 172 * CC.KS, w = h * im.width / im.height;
      const T = (window.RD && RD.TO[n.i]) || null;
      const ve = (x, y, a, bong) => {
        ctx.save(); ctx.globalAlpha = a;
        if (bong) { ctx.fillStyle = "rgba(0,0,0,.38)"; ctx.beginPath(); ctx.ellipse(x, (n.dat != null ? n.dat : y) - 3, w * .32 * (n.bongS || 1), 9 * h / 172, 0, 0, 7); ctx.fill(); }
        ctx.translate(x, y); if (n.rot) ctx.rotate(n.rot);
        ctx.scale((n.lat ? -1 : 1) * (n.sx || 1), n.sy || 1);
        ctx.drawImage(im, -w / 2, -h, w, h);
        // đốm lửa bập bùng ở đầu đuốc bạn cầm
        if (T && T.lua) {
          const lx = -w / 2 + T.lua[0] / T.w * w, ly = -h + T.lua[1] / T.h * h, f = .7 + .3 * Math.sin((t || 0) * 11 + n.i * 2);
          ctx.globalCompositeOperation = "lighter";
          // hạng hiện tại càng cao, đốm lửa càng to và sáng
          const K = [[1, 1], [1.45, 1.25], [1.15, 1.05], [.85, .9], [.6, .8]][n.hang || 0], R = 40 * K[1] * h / 172;
          const rg = ctx.createRadialGradient(lx, ly, 0, lx, ly, R);
          rg.addColorStop(0, "rgba(255,205,100," + Math.min(1, .55 * K[0] * f) + ")"); rg.addColorStop(1, "rgba(255,140,40,0)");
          ctx.fillStyle = rg; ctx.fillRect(lx - R, ly - R, 2 * R, 2 * R);
        }
        ctx.restore();
      };
      (n.ghost || []).forEach(g => ve(g.x, g.y, g.a, false));
      if ((n.a == null ? 1 : n.a) > 0) ve(n.x, n.y, n.a == null ? 1 : n.a, true);
      (n.sparks || []).forEach(s => sao(ctx, s.x, s.y, s.r, s.a));
    });
  };

  // ---------- kiểu di chuyển: đi bộ (tổ 1, 3), tốc biến (tổ 2, 4); còn kiểu lướt, nhảy nếu cần ----------
  const em = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  CC.em = em;
  CC.diChuyen = function (i, x0, y0, x1, y1, p, soBuoc, kieuEp) {
    p = Math.max(0, Math.min(1, p)); soBuoc = soBuoc || 4;
    const kieu = kieuEp || (window.RD && RD.TO[i] && RD.TO[i].kieu) || ["di", "bien", "di", "bien"][i];
    const lat = x1 < x0 - 2, Z = CC.KS;
    const o = { i, lat, x: x0, y: y0, dat: null };
    if (kieu === "di") {
      const q = em(p); o.x = x0 + (x1 - x0) * q; o.y = y0 + (y1 - y0) * q;
      o.dat = o.y; o.y -= Math.abs(Math.sin(Math.PI * soBuoc * p)) * 7 * Z * (p > 0 && p < 1 ? 1 : 0);
      o.rot = Math.sin(Math.PI * 2 * soBuoc * p) * .035 * (p > 0 && p < 1 ? 1 : 0);
    } else if (kieu === "luot") {
      const q = em(p); o.x = x0 + (x1 - x0) * q; o.y = y0 + (y1 - y0) * q; o.dat = o.y;
      o.y -= Math.sin(Math.PI * p) * 14 * Z; o.rot = (lat ? -1 : 1) * Math.sin(Math.PI * p) * .06;
      if (p > 0 && p < 1) o.ghost = [1, 2, 3].map(j => { const qq = em(Math.max(0, p - .05 * j)); return { x: x0 + (x1 - x0) * qq, y: y0 + (y1 - y0) * qq - Math.sin(Math.PI * Math.max(0, p - .05 * j)) * 14 * Z, a: .28 / j }; });
    } else if (kieu === "bien") {
      const ra = p < .3 ? 1 : p < .42 ? 1 - (p - .3) / .12 : p < .58 ? 0 : p < .7 ? (p - .58) / .12 : 1;
      const o2 = p < .5 ? 0 : 1;
      o.x = o2 ? x1 : x0 + (x1 - x0) * .06 * Math.min(1, p / .3); o.y = o2 ? y1 : y0; o.dat = o.y;
      o.a = ra; o.sx = .4 + .6 * ra; o.sy = 1 + (1 - ra) * .25;
      o.sparks = [];
      const no = (cx, cy, q) => { for (let k = 0; k < 9; k++) { const an = k / 9 * 6.283 + 0.4, d = (30 + q * 80) * Z; o.sparks.push({ x: cx + Math.cos(an) * d, y: cy - 90 * Z + Math.sin(an) * d * .9, r: 14 * Z * (1 - q), a: 1 - q }); } };
      if (p > .3 && p < .55) no(x0, y0, (p - .3) / .25);
      if (p > .56 && p < .82) no(x1, y1, (p - .56) / .26);
    } else {
      const q = em(p), n = Math.max(1, Math.round(soBuoc / 2));
      o.x = x0 + (x1 - x0) * q; const yb = y0 + (y1 - y0) * q; o.dat = yb;
      const ph = (p * n) % 1, hop = p >= 1 ? 0 : Math.sin(Math.PI * ph);
      o.y = yb - hop * 46 * Z; o.sy = 1 + (hop > .1 ? .04 : -.06 * (1 - hop / .1)); o.sx = 1 / o.sy;
      o.bongS = 1 - hop * .35;
    }
    return o;
  };

  // ve(ctx, A, st): vẽ tĩnh cả cảnh (dùng cho ảnh phác thảo)
  CC.ve = function (ctx, A, st) {
    CC.veNen(ctx, A, st.t || 0);
    CC.veCau(ctx, A, st);
    CC.veNguoi(ctx, A, [0, 1, 2, 3].map(i => ({ i, x: CC.cho(st.dung || 0), y: CC.yChan(i) })), st.t || 0);
  };

  // con vật quanh cầu: thỏ trên bờ, cá koi và cá nhảy dưới sông, ếch trên lá sen, đom đóm (t: giây, để chuyển động)
  // Tỉ lệ theo chiều cao bạn nhỏ: 172 px ≈ 1,45 m, tức 1 m ≈ 118 px.
  //   2 cá koi nhảy khỏi mặt nước, dài khoảng 50 cm → 53–58 px; thỏ 40–45 cm → 38–53 px;
  //   ếch ngồi trên lá sen: cả ảnh rộng 120 px (lá ≈ 1 m), ếch cao ≈ 45 px (to hơn ếch thật để còn thấy trên TV), có phồng mang.
  CC.TI_LE = 172 / 1.45;
  CC.CON_VAT = [
    { a: "koiNhay", x: 760, y: 352, h: 21, nhay: 5.4, lech: 1.3 },
    { a: "koiNhay", x: 990, y: 300, h: 19, nhay: 6.3, lech: 4.2, lat: true },
    { a: "ech", x: 1440, y: 352, h: 69 },
    { a: "thoNhay", nhayBo: [110, 240, 300, 0] , h: 40 },
    { a: "thoNgoi", x: 1866, y: 1036, h: 47 },
    { a: "thoNhay", nhayBo: [1842, 1892, 394, 3.1], h: 38 }
  ];
  // 6/11 chiều: cầu cao ra nên con vật đặt theo mép cầu. Phía trên cầu (lúc chơi có bảng điểm và lời Claude che) chỉ còn một cá
  //   koi và thỏ ở bờ trái; cá koi thứ hai, ếch và thỏ nhảy bờ phải xuống khoảng nước dưới cầu (khoảng này hẹp: cá nhảy thấp hơn).
  function datConVat() {
    const V = CC.CON_VAT, Y1 = CC.laneTop(3) + LH + BEAM, duoi = Math.max(Y1 + 60, CC.DUOI);
    const yD = Math.min(Y1 + 46, (Y1 + duoi) / 2 + 4);
    V[0].y = Y0 - 110; V[0].cao = 58;
    V[1].x = 1130; V[1].y = yD + 2; V[1].cao = 34;
    V[2].x = 1350; V[2].y = yD;
    V[3].nhayBo[2] = Y0 - 130;
    V[4].y = yD;
    V[5].nhayBo = [1700, 1800, yD + 2, 3.1];
    // gợn nước trên mặt sông: giữ chỗ cũ theo tỉ lệ, phía trên cầu dồn vào khoảng (TREN, Y0 - 30), phía dưới vào (Y1 + 16, DUOI)
    const tren = CC.TREN || 0;
    CC.GON = GON0.map(([x, y, P, ph]) => [x, y < 700 ? tren + (y / 430) * (Y0 - 30 - tren) : Y1 + 16 + ((y - 990) / 90) * (duoi - Y1 - 16) * .8, P, ph]);
  }
  // ---------- nước trong chỗ thiếu + vòi nước phun (5/11 Thịnh: "cho nước phun lên ... giống kiểu không qua được") ----------
  function hat(i, k) { let s = 31 + i * 97 + k * 13; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  // thêm hình chỗ thiếu vào đường đang vẽ (không bắt đầu đường mới), để cắt nhiều chỗ thiếu trong một lần
  function gapPathThem(ctx, i, g, s) {
    const t = CC.laneTop(i), c = CC.tam(g); s = s || 1;
    g.pts.forEach((p, k) => { const x = c[0] + (p[0] - c[0]) * s, y = t + c[1] + (p[1] - c[1]) * s; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
  }
  // màu nước trong chỗ thiếu (đứng yên, vẽ sẵn); gọi khi đã clip theo hình chỗ thiếu
  function mauNuocHo(ctx, i, k) {
    const g = G[k], top = CC.laneTop(i), b = HOP[k], c = CC.tam(g);
    const rg = ctx.createRadialGradient(c[0], top + c[1], 6, c[0], top + c[1], 130);
    rg.addColorStop(0, "rgba(40,120,170,.38)"); rg.addColorStop(1, "rgba(6,30,62,.30)");
    ctx.fillStyle = rg; ctx.fillRect(b.x - 10, top, b.w + 20, LH);
  }
  // gợn nước của nhiều chỗ thiếu: cắt theo hình một lần, mỗi dòng gợn của cùng một kiểu chỗ thiếu vẽ một nét
  //   (6/11: trước đây mỗi chỗ cắt và vẽ riêng 5 nét, 20 chỗ là 100 nét mỗi khung hình)
  CC.veGonNuoc = function (ctx, ds, t) {
    if (!ds.length) return;
    ctx.save();
    ctx.beginPath(); ds.forEach(([i, k]) => gapPathThem(ctx, i, G[k])); ctx.clip();
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const cung = ds.filter(d => d[1] === k); if (!cung.length) continue;
      const b = HOP[k], xa = b.x - 10, xb = b.x + b.w + 10;
      for (let j = 0; j < 5; j++) {
        ctx.strokeStyle = "rgba(175,225,255," + (.13 + .07 * Math.sin(t * 1.6 + j * 1.3 + k)) + ")";
        ctx.beginPath();
        cung.forEach(([i]) => {
          const yj = CC.laneTop(i) + 12 + j * (LH - 24) / 4;
          for (let x = xa; x <= xb; x += 8) {
            const y = yj + 3.5 * Math.sin(x * .045 + t * 2.2 + j * 1.7 + i);
            x === xa ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }
    }
    ctx.restore();
  };
  CC.veMatNuocHo = function (ctx, i, k, t) {        // gọi khi đã clip theo hình chỗ thiếu (giữ cho các trang cũ)
    mauNuocHo(ctx, i, k); CC.veGonNuoc(ctx, [[i, k]], t);
  };
  // 5/11 04:53 Thịnh: nước chỉ phun và rơi TRONG ô của mình, không văng sang ô khác.
  //   Mọi thứ cắt theo đường bao của ô; vòi đặt thấp trong ô, cột nước cao tối đa ~60 px (ô cao 120 px).
  //   6/11: cắt theo hình tất cả các ô có vòi trong một lần (nước mỗi vòi vẫn chỉ nằm trong ô của mình)
  CC.veVoiNuocNhieu = function (ctx, ds, t) {
    if (!ds.length) return;
    ctx.save();
    ctx.beginPath(); ds.forEach(([i, k]) => gapPathThem(ctx, i, G[k], .96)); ctx.clip();
    ds.forEach(([i, k]) => voiNuoc(ctx, i, k, t));
    ctx.restore();
  };
  CC.veVoiNuoc = function (ctx, i, k, t) { CC.veVoiNuocNhieu(ctx, [[i, k]], t); };
  function voiNuoc(ctx, i, k, t) {
    const r = hat(i, k), P = 3.4 + r() * 2.0, ph = r() * P, D = 1.6, Hm = (50 + r() * 10) * CC.TL, lech = r() * 6.3;
    const u = (((t + ph) % P) + P) % P / D;
    const g = G[k], c = CC.tam(g), cx = c[0], cy = CC.laneTop(i) + LH * (k === 3 && LH > 140 ? .62 : .733);
    // gợn nước luôn có ở chân vòi (kể cả lúc nghỉ) cho biết chỗ này là nước
    for (let j = 0; j < 2; j++) {
      const q = ((t * .55 + j * .5 + lech) % 1);
      ctx.strokeStyle = "rgba(210,238,255," + (.2 * (1 - q)) + ")"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(cx, cy, 10 + q * 38, (10 + q * 38) * .36, 0, 0, 7); ctx.stroke();
    }
    if (u <= 1) {
      const len = Math.sin(Math.PI * Math.min(1, u / .9)), H = Hm * Math.pow(len, .8), lac = 2.5 * Math.sin(t * 9 + lech);
      // hơi nước mờ quanh vòi
      const mg = ctx.createRadialGradient(cx, cy - H * .5, 3, cx, cy - H * .5, 52);
      mg.addColorStop(0, "rgba(205,232,255," + (.24 * len) + ")"); mg.addColorStop(1, "rgba(205,232,255,0)");
      ctx.fillStyle = mg; ctx.fillRect(cx - 52, cy - H * .5 - 52, 104, 104);
      // bọt ở chân vòi
      ctx.fillStyle = "rgba(235,248,255," + (.55 * len + .15) + ")";
      ctx.beginPath(); ctx.ellipse(cx, cy, 20 + 8 * len, 7 + 3 * len, 0, 0, 7); ctx.fill();
      if (H > 4) {
        // cột nước thon dần lên trên, lắc nhẹ: lớp mờ bên ngoài + lõi sáng
        const cg = ctx.createLinearGradient(0, cy, 0, cy - H);
        cg.addColorStop(0, "rgba(190,228,255,.85)"); cg.addColorStop(.6, "rgba(225,244,255,.9)"); cg.addColorStop(1, "rgba(255,255,255,.95)");
        ctx.fillStyle = "rgba(200,232,255,.30)";
        ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.quadraticCurveTo(cx - 14 + lac * .4, cy - H * .5, cx - 9 + lac, cy - H - 4);
        ctx.lineTo(cx + 9 + lac, cy - H - 4); ctx.quadraticCurveTo(cx + 14 + lac * .4, cy - H * .5, cx + 20, cy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.moveTo(cx - 13, cy);
        ctx.quadraticCurveTo(cx - 9 + lac * .4, cy - H * .5, cx - 6 + lac, cy - H);
        ctx.lineTo(cx + 6 + lac, cy - H);
        ctx.quadraticCurveTo(cx + 9 + lac * .4, cy - H * .5, cx + 13, cy);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.8;   // ánh sáng dọc cột nước
        ctx.beginPath(); ctx.moveTo(cx - 2, cy - 4); ctx.quadraticCurveTo(cx - 1.5 + lac * .4, cy - H * .5, cx + lac * .9, cy - H + 3); ctx.stroke();
        // chóp nước tung bọt (dẹt, nằm gọn trong ô)
        for (let m = 0; m < 9; m++) {
          const an = m / 9 * 6.283 + t * 2, rr = 5 + 2.5 * Math.sin(t * 7 + m);
          ctx.fillStyle = "rgba(240,250,255,.9)";
          ctx.beginPath(); ctx.arc(cx + lac + Math.cos(an) * 11, cy - H + Math.sin(an) * 4, rr, 0, 7); ctx.fill();
        }
      }
      // giọt nước văng ra rồi rơi lại xuống chính ô này
      for (let m = 0; m < 16; m++) {
        const u0 = m / 16 * .7, tau = (u - u0) * D; if (tau <= 0) continue;
        const hu = Hm * Math.pow(Math.sin(Math.PI * Math.min(1, u0 / .9)), .8);
        const vx = (m % 2 ? 1 : -1) * (18 + ((m * 37) % 34)), vy = -18 - ((m * 23) % 26);
        const x = cx + vx * tau, y = cy - hu + vy * tau + 300 * tau * tau;
        if (y > cy + 4) continue;
        ctx.fillStyle = "rgba(225,245,255," + (.85 * (1 - Math.min(1, tau / 1.1))) + ")";
        ctx.beginPath(); ctx.ellipse(x, y, 3.2, 4.2, 0, 0, 7); ctx.fill();
      }
    }
  }

  // ---------- bệ đá dưới hàng đuốc (5/11: đuốc trùng màu gỗ cầu nên đặt đuốc trên nền đá sáng) ----------
  let BE_DA = null;
  CC.veBeDa = function (ctx) {
    const x0 = CC.THAM[1], x1 = XE + 12, y0 = Y0 - 18, y1 = CC.Y1 + 18;
    if (!BE_DA) {                                    // vẽ sẵn một lần (đá không chuyển động)
      const W = x1 - x0 + 40, Hh = y1 - y0 + 40, cv = document.createElement("canvas"); cv.width = W; cv.height = Hh;
      const c = cv.getContext("2d"), ox = 10, oy = 10, w = x1 - x0, h = y1 - y0;
      c.fillStyle = "rgba(0,0,0,.45)"; c.filter = "blur(10px)"; c.fillRect(ox + 6, oy + 10, w, h); c.filter = "none";
      let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      const hang = 9, ch = h / hang;
      for (let r = 0; r < hang; r++) {
        let x = ox - (r % 2 ? 44 : 0); const cw = 88;
        while (x < ox + w) {
          const xa = Math.max(ox, x), xb = Math.min(ox + w, x + cw), ya = oy + r * ch, v = rnd();
          const base = [138 + v * 20, 129 + v * 18, 114 + v * 16].map(Math.round);
          const gg = c.createLinearGradient(0, ya, 0, ya + ch);
          gg.addColorStop(0, "rgb(" + base.map(n => n + 14).join(",") + ")"); gg.addColorStop(1, "rgb(" + base.map(n => n - 14).join(",") + ")");
          c.fillStyle = gg; c.fillRect(xa, ya, xb - xa, ch);
          c.fillStyle = "rgba(60,48,36,.10)";        // vân đá lấm tấm
          for (let d = 0; d < 10; d++) c.fillRect(xa + rnd() * (xb - xa), ya + rnd() * ch, 2 + rnd() * 3, 1.5);
          c.strokeStyle = "rgba(48,40,32,.75)"; c.lineWidth = 2.5; c.strokeRect(xa + 1, ya + 1, xb - xa - 2, ch - 2);
          c.strokeStyle = "rgba(255,246,226,.30)"; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(xa + 3, ya + ch - 4); c.lineTo(xa + 3, ya + 3); c.lineTo(xb - 4, ya + 3); c.stroke();
          x += cw;
        }
      }
      c.strokeStyle = "#4a3f33"; c.lineWidth = 6; c.strokeRect(ox + 3, oy + 3, w - 6, h - 6);
      c.strokeStyle = "rgba(255,236,190,.55)"; c.lineWidth = 2; c.strokeRect(ox + 8, oy + 8, w - 16, h - 16);
      BE_DA = { cv, dx: x0 - ox, dy: y0 - oy };
    }
    ctx.drawImage(BE_DA.cv, BE_DA.dx, BE_DA.dy);
  };

  // ---------- Claude bình luận: hình tròn nhảy theo nhịp, thổi kèn, nốt nhạc bay, pháo giấy (5/11 Thịnh) ----------
  // A.claude = [kèn phải, kèn trái, cổ vũ]; KEN = chỗ miệng kèn trên mỗi hình (tỉ lệ 0..1) để nốt nhạc bay ra đúng chỗ
  CC.KEN = [[.89, .41, 1], [.21, .52, -1], [.14, .47, -1]];
  CC.MAU_VUI = ["#ffd34d", "#ff8fb1", "#7cc8ff", "#8ee6b0", "#ffb36b", "#c9a7ff"];
  function notNhac(ctx, x, y, s, kieu, mau, a) {   // nốt móc đơn / móc kép vẽ bằng nét (không phụ thuộc phông chữ)
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
    ctx.fillStyle = mau; ctx.strokeStyle = mau; ctx.lineWidth = 3.2; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 4;
    const dau = (dx) => { ctx.beginPath(); ctx.ellipse(dx, 0, 7.5, 5.6, -.45, 0, 7); ctx.fill(); };
    if (kieu) {                                    // móc kép: hai nốt nối gạch
      dau(-9); dau(11);
      ctx.beginPath(); ctx.moveTo(-2.5, -2); ctx.lineTo(-2.5, -28); ctx.lineTo(17.5, -32); ctx.lineTo(17.5, -6); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-2.5, -26); ctx.lineTo(17.5, -30); ctx.stroke();
    } else {
      dau(0);
      ctx.beginPath(); ctx.moveTo(6.5, -2); ctx.lineTo(6.5, -30); ctx.quadraticCurveTo(10, -20, 17, -16); ctx.stroke();
    }
    ctx.restore();
  }
  // Tư thế của Claude ở giây p theo kiểu nhảy. 5/11 04:53 Thịnh: mỗi câu một kiểu nhảy khác nhau.
  //   0 nhún nhảy thổi kèn · 1 lắc lư qua lại · 2 bật lên xoay một vòng · 3 lật mặt như đồng xu · 4 lò xo bật cao, có pháo hoa
  CC.KIEU_NHAY = ["nhún nhảy", "lắc lư", "xoay vòng", "lật đồng xu", "lò xo, pháo hoa"];
  const emIO = v => v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  function tuThe(kieu, p) {
    const nhip = .5, k = Math.floor(p / nhip), f = (p % nhip) / nhip, T = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, hinh: 0 };
    if (kieu === 1) {                       // lắc lư như con lắc, kèn quay theo hướng đang lắc
      const ph = Math.PI * p / nhip;
      T.dx = 24 * Math.sin(ph); T.rot = .2 * Math.sin(ph); T.dy = -12 * Math.pow(Math.sin(ph), 2);
      T.hinh = Math.cos(ph) >= 0 ? 0 : 1;
    } else if (kieu === 2) {                // mỗi giây bật lên xoay trọn một vòng rồi đáp xuống nhún
      const u = p % 1;
      if (u < .62) { const v = u / .62; T.dy = -36 * Math.sin(Math.PI * v); T.rot = 2 * Math.PI * emIO(v); T.hinh = 2; }
      else { const n = Math.sin(Math.PI * (u - .62) / .38); T.dy = -5 * n; T.sy = 1 - .12 * n; T.sx = 1 + .1 * n; T.hinh = Math.floor(p) % 2; }
    } else if (kieu === 3) {                // lật mặt như đồng xu: vừa nhảy vừa quay nửa vòng, đổi hướng kèn
      const u = p % 1, c = Math.floor(p), th = Math.PI * emIO(u);
      T.dy = -30 * Math.sin(Math.PI * u); T.rot = .06 * Math.sin(2 * Math.PI * u);
      if (th < Math.PI / 2) { T.sx = Math.max(.03, Math.cos(th)); T.hinh = c % 2; }
      else { T.sx = Math.max(.03, -Math.cos(th)); T.hinh = 1 - c % 2; }
    } else if (kieu === 4) {                // lò xo: thu người, bật cao, duỗi dài, đáp xuống nhún
      if (f < .25) { const n = Math.sin(Math.PI * f / .25); T.sy = 1 - .22 * n; T.sx = 1 + .15 * n; }
      else if (f < .85) { const n = Math.sin(Math.PI * (f - .25) / .6); T.dy = -34 * n; T.sy = 1 + .1 * n; T.sx = 1 - .07 * n; }
      else { const n = Math.sin(Math.PI * (f - .85) / .15); T.sy = 1 - .1 * n; T.sx = 1 + .07 * n; }
      T.rot = (k % 2 ? 1 : -1) * .08 * Math.sin(Math.PI * f); T.hinh = [2, 0, 2, 1][k % 4];
    } else {                                // nhún nhảy thổi kèn
      const ep = 1 - .06 * Math.cos(Math.PI * 2 * f);
      T.dy = -18 * Math.sin(Math.PI * f); T.rot = (k % 2 ? 1 : -1) * .07 * Math.sin(Math.PI * f); T.sx = 2 - ep; T.sy = ep; T.hinh = [0, 2, 1, 2][k % 4];
    }
    return T;
  }
  CC.tuTheClaude = tuThe;
  // p: giây kể từ lúc lời bình hiện; (cx, cy): tâm hình; W: bề rộng hình; kieu: kiểu nhảy (câu 1 → 0 … câu 5 → 4)
  CC.veClaude = function (ctx, A, p, cx, cy, W, kieu) {
    if (!A.claude || p < 0) return;
    kieu = kieu || 0;
    const vao = Math.min(1, p / .45), sVao = vao < 1 ? (1 + 2.7 * Math.pow(vao - 1, 3) + 1.7 * Math.pow(vao - 1, 2)) : 1;
    const T = tuThe(kieu, p), im = A.claude[T.hinh], H = W * im.height / im.width;
    const gx = cx + T.dx * .6;
    // quầng sáng sau hình
    ctx.save();
    const qg = ctx.createRadialGradient(gx, cy, W * .2, gx, cy, W * .78);
    qg.addColorStop(0, "rgba(255,226,150," + (.45 * vao) + ")"); qg.addColorStop(1, "rgba(255,200,110,0)");
    ctx.fillStyle = qg; ctx.fillRect(gx - W, cy - W, 2 * W, 2 * W);
    // tia sáng xoay chậm
    ctx.translate(gx, cy); ctx.rotate(p * .5); ctx.globalAlpha = .13 * vao; ctx.fillStyle = "#ffd98a";
    for (let r = 0; r < 12; r++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * .74, -W * .06); ctx.lineTo(W * .74, W * .06); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // pháo giấy bung ra lúc hiện
    if (p < 1.6) for (let m = 0; m < 26; m++) {
      const an = m / 26 * 6.283 + .3, v = 230 + (m * 53) % 160, tt = p;
      const x = cx + Math.cos(an) * v * tt, yy = cy + Math.sin(an) * v * tt * .8 + 260 * tt * tt;
      ctx.save(); ctx.translate(x, yy); ctx.rotate(tt * 9 + m); ctx.globalAlpha = Math.max(0, 1 - tt / 1.6);
      ctx.fillStyle = CC.MAU_VUI[m % CC.MAU_VUI.length]; ctx.fillRect(-6, -3.5, 12, 7); ctx.restore();
    }
    // câu 5 (nhân đôi điểm): pháo hoa nhỏ nổ quanh Claude
    if (kieu === 4) {
      // chỗ nổ: quanh hình và khoảng trống bên phải (bong bóng lời bình câu 5 bắt đầu từ x ≈ 554)
      const CHO = [[200, -30], [-80, 105], [290, 75], [120, 125], [235, 150], [-25, 150]];
      for (let n = Math.max(0, Math.floor((p - 1) / .5)); n * .5 <= p; n++) {
        const tn = p - n * .5; if (tn < 0 || tn > 1) continue;
        const c0 = CHO[n % CHO.length], bx = cx + c0[0], by = cy + c0[1], v = tn / 1, R = 16 + 56 * (1 - Math.pow(1 - v, 2.2)), roi = 22 * tn * tn;
        const mau = CC.MAU_VUI[(n * 2 + 1) % CC.MAU_VUI.length], al = (1 - Math.pow(v, 1.6)) * vao;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        if (v < .25) {                                   // chớp sáng lúc nổ
          const fl = ctx.createRadialGradient(bx, by, 0, bx, by, 40);
          fl.addColorStop(0, "rgba(255,250,220," + (.9 * (1 - v / .25) * vao) + ")"); fl.addColorStop(1, "rgba(255,220,150,0)");
          ctx.fillStyle = fl; ctx.fillRect(bx - 40, by - 40, 80, 80);
        }
        ctx.globalAlpha = al; ctx.fillStyle = mau; ctx.strokeStyle = mau; ctx.lineWidth = 3.2; ctx.lineCap = "round";
        for (let m = 0; m < 18; m++) {
          const an = m / 18 * 6.283 + n, x1 = bx + Math.cos(an) * R, y1 = by + Math.sin(an) * R + roi;
          ctx.beginPath(); ctx.moveTo(bx + Math.cos(an) * R * .58, by + Math.sin(an) * R * .58 + roi); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.fillStyle = "#fffbe8"; ctx.beginPath(); ctx.arc(x1, y1, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = mau;
          if (m % 2) { ctx.beginPath(); ctx.arc(bx + Math.cos(an + .17) * R * .82, by + Math.sin(an + .17) * R * .82 + roi * 1.2, 2.4, 0, 7); ctx.fill(); }
        }
        ctx.restore();
      }
    }
    // nốt nhạc bay ra từ miệng kèn (mỗi 0,25 giây một nốt, sống 1,9 giây), theo đúng tư thế lúc nốt bay ra
    for (let n = Math.max(0, Math.floor((p - 1.9) / .25)); n * .25 <= p; n++) {
      const tn = p - n * .25; if (tn < 0 || tn > 1.9) continue;
      const Te = tuThe(kieu, n * .25), ken = CC.KEN[Te.hinh], He = W * A.claude[Te.hinh].height / A.claude[Te.hinh].width;
      const ox = (ken[0] - .5) * W * Te.sx, oy = (ken[1] - .5) * He * Te.sy, cr = Math.cos(Te.rot), sr = Math.sin(Te.rot);
      const x0 = cx + Te.dx + ox * cr - oy * sr, y0 = cy + Te.dy + ox * sr + oy * cr;
      const x = x0 + ken[2] * (40 + 70 * tn) + 10 * Math.sin(tn * 5 + n), yy = y0 - 95 * tn - 14 * Math.sin(tn * 3 + n);
      const a = Math.min(1, tn * 5) * (1 - Math.max(0, (tn - 1.3) / .6));
      notNhac(ctx, x, yy, .95 + .25 * Math.sin(n), n % 3 === 1, CC.MAU_VUI[n % CC.MAU_VUI.length], a * vao);
    }
    // sao lấp lánh quanh hình
    for (let m = 0; m < 6; m++) {
      const an = m * 1.05 + p * .6, r = W * (.56 + .06 * Math.sin(p * 2 + m)), tw = .5 + .5 * Math.sin(p * 5 + m * 2);
      sao(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * .9, 9 + 5 * tw, .85 * tw * vao);
    }
    // hình Claude (kèm bóng đổ vẽ sẵn): xoay quanh tâm, co giãn tựa vào chân
    const anh = veSan("claude" + T.hinh + "_" + W, W, H, 30, (g, pad) => {
      g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 16; g.shadowOffsetY = 6; g.drawImage(im, pad, pad, W, H);
    });
    ctx.save();
    ctx.translate(cx + T.dx * vao, cy + T.dy * vao); ctx.rotate(T.rot * vao);
    ctx.translate(0, H / 2); ctx.scale(sVao * T.sx, sVao * T.sy); ctx.translate(0, -H / 2);
    ctx.drawImage(anh, -W / 2 - 30, -H / 2 - 30);
    ctx.restore();
  };

  // ---------- gợn nước nhẹ trên mặt sông (5/11 Thịnh: "mặt nước cho thêm vài chỗ có gợn nước nhẹ") ----------
  // mỗi chỗ: 3 vòng elip mảnh nở ra rồi mờ dần, lặp lại theo chu kỳ riêng; chỉ ở chỗ có nước (trên và dưới cây cầu)
  const GON0 = [[560, 140, 5.2, 0], [1130, 92, 6.1, 1.7], [870, 228, 5.6, 3.1], [1385, 250, 6.6, .8], [655, 335, 5.9, 2.4],
            [1215, 372, 6.3, 4.2], [735, 1046, 5.4, 1.2], [1300, 1052, 6.0, 3.6]];
  CC.GON = GON0.slice();
  CC.veGon = function (ctx, t) {
    ctx.save(); ctx.lineCap = "round";
    CC.GON.forEach(([x, y, P, ph]) => {
      for (let k = 0; k < 3; k++) {
        const q = ((t + ph) / P - k * .16) % 1; if (q < 0 || q > .62) continue;
        const u = q / .62, r = 8 + u * 66, a = Math.pow(1 - u, 1.6) * .30 * Math.min(1, u * 6);
        ctx.strokeStyle = "rgba(205,232,255," + a + ")"; ctx.lineWidth = 2.2 - u;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * .42, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = "rgba(255,245,215," + a * .7 + ")"; ctx.lineWidth = 1.2;   // ánh trăng trên mép gợn
        ctx.beginPath(); ctx.ellipse(x, y - 1, r, r * .42, 0, 3.5, 5.9); ctx.stroke();
      }
    });
    ctx.restore();
  };

  // ---------- đường của tổ về nhất chuyển đỏ, ghi "Tổ n về nhất" (5/11 Thịnh) ----------
  // p: 0..1 thảm đỏ trải từ thảm VỀ ĐÍCH ngược về đầu cầu; c: 0..1 chữ hiện ra
  CC.veDuongDo = function (ctx, i, p, c, t, chu, xTrai) {
    if (p <= 0) return;
    const y0 = CC.laneTop(i), y1 = y0 + LH, xe = CC.THAM[0], xa = xe - (xe - XS) * p;
    ctx.save();
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#8c0f1a"); g.addColorStop(.5, "#d22a34"); g.addColorStop(1, "#8c0f1a");
    ctx.fillStyle = g; ctx.fillRect(xa, y0, xe - xa, LH);
    ctx.globalAlpha = .10; ctx.fillStyle = "#000";
    for (let y = y0 + 8; y < y1; y += 12) ctx.fillRect(xa, y, xe - xa, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e8b64a"; ctx.fillRect(xa, y0 + 7, xe - xa, 5); ctx.fillRect(xa, y1 - 12, xe - xa, 5);   // viền kim tuyến
    ctx.fillStyle = "rgba(255,236,170,.9)"; ctx.fillRect(xa, y0 + 8, xe - xa, 2); ctx.fillRect(xa, y1 - 11, xe - xa, 2);
    // ánh sáng lướt dọc thảm
    const lx = XS + (((t || 0) * 260) % (xe - XS + 500)) - 250;
    const lg = ctx.createLinearGradient(lx - 160, 0, lx + 160, 0);
    lg.addColorStop(0, "rgba(255,240,200,0)"); lg.addColorStop(.5, "rgba(255,240,200,.16)"); lg.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = lg; ctx.fillRect(Math.max(xa, lx - 160), y0, Math.min(xe, lx + 160) - Math.max(xa, lx - 160), LH);
    if (p < 1) {                                   // mép thảm đang trải: vệt sáng vàng
      const eg = ctx.createLinearGradient(xa - 30, 0, xa + 40, 0);
      eg.addColorStop(0, "rgba(255,220,120,0)"); eg.addColorStop(.45, "rgba(255,232,160,.85)"); eg.addColorStop(1, "rgba(255,200,90,0)");
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = eg; ctx.fillRect(xa - 30, y0 - 6, 70, LH + 12);
      ctx.globalCompositeOperation = "source-over";
    }
    if (c > 0 && chu) {
      const cx = (Math.max(XS, xTrai || XS) + xe) / 2, cy = y0 + LH / 2 + 5;
      const s = (c < .6 ? .55 + .55 * (c / .6) : 1.1 - .1 * Math.min(1, (c - .6) / .4)) * Math.min(1.25, CC.TL);
      ctx.translate(cx, cy); ctx.scale(s, s);
      ctx.globalAlpha = Math.min(1, c * 2.5);
      // chữ có quầng sáng vẽ sẵn một lần
      const RW = 1100, RH = 130, anh = veSan("chuDo" + chu, RW, RH, 44, (c2, pad) => {
        c2.translate(pad + RW / 2, pad + RH / 2);
        c2.font = "800 84px 'Baloo 2'"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.lineJoin = "round";
        c2.shadowColor = "rgba(255,210,110,.9)"; c2.shadowBlur = 26;
        c2.lineWidth = 12; c2.strokeStyle = "#5e0a12"; c2.strokeText(chu, 0, 4);
        c2.shadowBlur = 0; c2.shadowColor = "transparent";
        const tg = c2.createLinearGradient(0, -36, 0, 40);
        tg.addColorStop(0, "#fff6cf"); tg.addColorStop(.55, "#ffe08a"); tg.addColorStop(1, "#ffc94a");
        c2.fillStyle = tg; c2.fillText(chu, 0, 4);
      });
      ctx.drawImage(anh, -RW / 2 - 44, -RH / 2 - 44);
    }
    ctx.restore();
  };

  CC.veConVat = function (ctx, A, t) {
    CC.CON_VAT.forEach(c => {
      const im = A.convat[c.a]; if (!im) return;
      const h = c.h, w = h * im.width / im.height;
      let x = c.x, y = c.y, r = 0, sx = 1, sy = 1, lat = false, an = 1;
      if (c.vong) {           // cá koi bơi vòng elip, đầu theo hướng bơi, thân uốn nhẹ
        const [cx, cy, rx, ry, w0, ph] = c.vong, a = ph + w0 * t;
        x = cx + rx * Math.cos(a); y = cy + ry * Math.sin(a);
        const vx = -rx * Math.sin(a) * Math.sign(w0), vy = ry * Math.cos(a) * Math.sign(w0);
        r = Math.atan2(vy, vx) - Math.PI / 2;
        sx = 1 + .07 * Math.sin(t * 6 + ph * 3);
      } else if (c.nhay) {    // cá koi thỉnh thoảng nhảy khỏi mặt nước
        const T = c.nhay, ph = ((t + c.lech) % T) / T * T, d = 1.1;
        ctx.save(); ctx.strokeStyle = "rgba(200,235,255,.65)"; ctx.lineWidth = 2;
        const vong = (vx, q) => { if (q < 0 || q > 1) return; ctx.globalAlpha = .7 * (1 - q); ctx.beginPath(); ctx.ellipse(vx, c.y + 6, 10 + 34 * q, 3 + 9 * q, 0, 0, 7); ctx.stroke(); };
        vong(c.x, ph / .8); vong(c.x + (c.lat ? 70 : -70), (ph - d) / .8);
        ctx.restore();
        if (ph > d) return;
        const p = ph / d, chieu = c.lat ? 1 : -1;      // đầu cá đi trước
        x = c.x + chieu * 70 * p; y = c.y - (c.cao || 58) * Math.sin(Math.PI * p); r = -chieu * (.55 - 1.1 * p); lat = !!c.lat;
        // giọt nước văng lúc lao lên và lúc rơi xuống
        ctx.save(); ctx.fillStyle = "rgba(215,240,255,.8)";
        [[p, 0], [p - .85, 70]].forEach(([q, dx]) => { if (q < 0 || q > .3) return; const k = q / .3;
          for (let j = 0; j < 6; j++) { const an = -Math.PI * (.15 + .7 * j / 5); ctx.globalAlpha = .8 * (1 - k);
            ctx.beginPath(); ctx.arc(c.x + chieu * dx + Math.cos(an) * 22 * k, c.y + 4 + Math.sin(an) * 26 * k + 30 * k * k, 2.2, 0, 7); ctx.fill(); } });
        ctx.restore();
      } else if (c.nhayBo) {  // thỏ nhảy qua lại trên bờ
        const [xa, xb, yb, ph0] = c.nhayBo, hop = .5, nghi = .45, buoc = 26;
        const n = Math.max(1, Math.floor((xb - xa) / buoc)), chuKy = 2 * n * (hop + nghi);
        const tt = (t + ph0) % chuKy, k = Math.floor(tt / (hop + nghi)), q = tt - k * (hop + nghi);
        const di = k < n ? 1 : -1, kk = k < n ? k : k - n;
        const p = Math.min(1, q / hop);
        const x0 = di > 0 ? xa + kk * buoc : xb - kk * buoc;
        x = x0 + di * buoc * p; y = yb - Math.sin(Math.PI * p) * 13 * (q < hop ? 1 : 0); lat = di < 0;
        if (q >= hop) { sy = 1 - .03 * Math.sin((q - hop) / nghi * Math.PI); }
      } else if (c.a === "ech") {
        r = .02 * Math.sin(t * .8); y = c.y + 1.5 * Math.sin(t * 1.1);
        sy = 1 + .015 * Math.max(0, Math.sin(t * 2.4));
      } else if (c.a === "thoNgoi") {
        sy = 1 + .02 * Math.sin(t * 3.1); r = .03 * Math.sin(t * .9);
      }
      ctx.save();
      if (c.a === "koi") ctx.globalAlpha = c.mo || .92;
      if (c.a.startsWith("tho")) { ctx.save(); ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, (c.nhayBo ? c.nhayBo[2] : y) + h * .46, w * .36, h * .07, 0, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.translate(x, y); ctx.rotate(r); ctx.scale((lat ? -1 : 1) * sx, sy);
      ctx.globalAlpha *= an;
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      if (c.a === "ech") {    // túi kêu dưới cằm phồng lên xẹp xuống (2 lần liền, nghỉ)
        const sc = w / 350, ch = (t % 3.2), f1 = ch < .9 ? Math.sin(Math.PI * ch / .9) : 0, f2 = ch > 1.0 && ch < 1.9 ? Math.sin(Math.PI * (ch - 1.0) / .9) : 0;
        const f = Math.max(f1, f2);
        if (f > .02) {
          const cx = -w / 2 + 168 * sc, cy = -h / 2 + 70 * sc + 9 * sc * f, rx = (8 + 26 * f) * sc, ry = (6 + 22 * f) * sc;
          const g = ctx.createRadialGradient(cx - rx * .3, cy - ry * .35, 1, cx, cy, Math.max(rx, ry));
          g.addColorStop(0, "rgba(255,253,230,.97)"); g.addColorStop(.55, "rgba(243,233,170,.95)"); g.addColorStop(1, "rgba(196,190,110,.92)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = "rgba(70,95,40,.55)"; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255," + (.7 * f) + ")"; ctx.beginPath(); ctx.ellipse(cx - rx * .35, cy - ry * .4, rx * .22, ry * .16, -.4, 0, 7); ctx.fill();
        }
      }
      ctx.restore();
    });
    // đom đóm: nhấp nháy và trôi nhẹ
    let s = 7;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const dom = domTron("gon", "255,250,170", "220,255,120");   // 6/11: đốm sáng vẽ sẵn
    for (let k = 0; k < 46; k++) {
      const tren = CC.TREN || 0, Y1 = CC.Y1, duoi = Math.max(Y1 + 30, CC.DUOI);
      let x = rnd() * 1920, y = rnd() < .5 ? tren + rnd() * Math.max(10, Y0 - 20 - tren) : Y1 + 10 + rnd() * (duoi - Y1 - 10);
      x += Math.sin(t * .35 + k * 1.7) * 16; y += Math.cos(t * .28 + k * 2.3) * 10;
      ctx.globalAlpha = .35 + .6 * Math.abs(Math.sin(t * 1.3 + k));
      ctx.drawImage(dom, x - 12, y - 12, 24, 24);
    }
    ctx.restore();
  };
  // nhãn "Nhóm n" ở đầu làn (vẽ sau nhân vật); yLan(i): tâm dọc của nhãn làn i (mặc định giữa làn), x0: mép trái (mặc định 4)
  CC.nhan = function (ctx, TO, yLan, x0) {
    const s = Math.min(1.15, CC.TL), P = 22;
    for (let i = 0; i < 4; i++) {
      const y = yLan ? yLan(i) : CC.laneMid(i), x = x0 == null ? 4 : x0;
      // nhãn có bóng mờ vẽ sẵn một lần (6/11 chiều: to theo làn, tối đa 1,15 lần)
      ctx.drawImage(veSan("nhan" + TO[i].ten + TO[i].mau + s.toFixed(3), 260 * s, 64 * s, P, (c) => {
        c.translate(P, P); c.scale(s, s);
        c.font = "800 40px 'Baloo 2'"; c.textBaseline = "middle";      // 5/11: "Nhóm n" dài hơn "Tổ n"
        const w = Math.max(128, Math.ceil(c.measureText(TO[i].ten).width) + 30);
        c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 10; c.shadowOffsetY = 3;
        c.fillStyle = TO[i].mau; c.strokeStyle = "#fff"; c.lineWidth = 4;
        c.beginPath(); c.roundRect(0, 0, w, 64, 32); c.fill(); c.shadowColor = "transparent"; c.stroke();
        c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(TO[i].ten, w / 2, 35);
      }), x - P, Math.round(y - 32 * s) - P);
    }
  };
  // gọi lại khi phông chữ vừa tải xong (chữ trong hình vẽ sẵn); CC.banSan đổi để lớp đứng yên của sân khấu vẽ lại
  CC.banSan = 0;
  CC.xoaSan = () => { SAN.clear(); CC.banSan++; };
  dungHinh();
  window.CC = CC;
})();
