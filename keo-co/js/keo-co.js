/* Kéo co (25/11/2026): sân kéo co của 2 đội trên TV.
   Thầy Thịnh 25/11: hiệu trưởng muốn đổi trò Rước đuốc thành kéo co, vẫn giữ phần đốt đuốc rồi sang báo tường. Thầy chọn luật
     "5 câu, 5 sức mạnh" và "nhóm 1 và 2 ghép 1 đội, nhóm 3 và 4 ghép 1 đội"; trò Rước đuốc cũ giữ nguyên ở trang gốc.
   Sân kéo co là một lớp phần tử DOM (#kc) đè lên khung vẽ cây cầu của Rước đuốc. Các bước giới thiệu, kéo co sau từng câu, thắp
     đuốc (phần kết bản tạm, xem chỗ T_D1) do lớp này vẽ; tới bước báo tường thì 4 quả lửa bay lên số 51, lửa đốt thủng lớp này (mặt nạ hình tròn lớn
     dần) để lộ báo tường do sân khấu cũ (san-khau.js) vẽ ở dưới, rồi lớp này ẩn hẳn.
   25/11 13:44 thầy: "chuyển hình nền thành buổi sáng, không có đèn lồng đổi thành cây xanh, các em không đeo dải băng trên đầu. nhớ cho
     thêm hiệu ứng khi kéo để nhìn đẹp hơn": sân buổi sáng (hinh/nen-sang.webp), giữa dây là dải lụa đỏ, hiệu ứng khi kéo ở veHieuUng.
   Mọi hình là hàm của thời gian (ve(t)): vào lại một bước (tải lại trang, lùi) thì hiện ngay trạng thái cuối của bước đó.
   Luật tính nấc: RD.keoCo trong du-lieu.js. vt dương = Đội 1 đang dẫn = dây lệch sang trái (Đội 1 đứng bên trái). */
(function () {
  "use strict";
  const RD = window.RD = window.RD || {}, KC = RD.KeoCo = {};
  const am = () => RD.AmThanh || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const dongHo = () => performance.now() / 1000;
  const XA = -1e6;
  const cl = x => Math.max(0, Math.min(1, x)), lin = (t, a, b) => cl((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3), ei = x => x * x;
  const em = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const ob = x => { const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const SAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
  const SET = '<svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true"><path d="M27 4 L12 27 h10 l-3 17 L36 20 H25 Z" fill="#6b2a00"/></svg>';
  const MUI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  /* ---------- số đo của sân (toạ độ thế giới 1920 × 1080) ---------- */
  const PXN = 26;                                   // mỗi nấc dây trượt bấy nhiêu điểm ảnh
  // 25/11 13:44 thầy Thịnh: sân buổi sáng, hai đội không băng đầu. Hình đội thu còn 92% và khe giữa hai đội nằm đúng vạch giữa
  //   (trước lệch 36 px sang phải), nên dẫn 4 nấc cả hai đội vẫn nằm trọn trong màn hình.
  const DOI_O = [{ x: 120, y: 530, w: 765, h: 289 }, { x: 1035, y: 545, w: 747, h: 290 }];   // khung hình Đội 1, Đội 2 (lúc dây ở vạch giữa)
  const DAY_Y = 664;                                // tâm sợi dây
  const BUI_X = [[176, 333, 480, 636, 774], [1098, 1252, 1397, 1550, 1685]];                // bụi dưới chân từng bạn
  const VUT = 10, HOA = 26;
  const LA_O = [[120, 200], [300, 150], [470, 260], [700, 180], [820, 300], [620, 330], [1420, 220], [1560, 180], [1700, 260], [1840, 200], [1300, 330], [230, 330]];
  const LA_NEN = [[210, 160, 9, 1], [760, 120, 11, 6], [1500, 150, 10, 3.5], [1760, 190, 12.5, 9]];   // trái, trên, giây một vòng, lệch pha
  const HO_THANG = ["HÒ DÔ!", "KÉO!", "HÒ DÔ TA!", "KÉO MẠNH!"], HO_THUA = ["GIỮ CHẶT!", "CỐ LÊN!"];
  const HOA_MAU = ["", "#f2b531", "#ffffff", "#e23d3d", "#5fb04a"];
  const ngau = (j, k) => { const x = Math.sin(j * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };   // số "ngẫu nhiên" cố định theo thứ tự
  // dải lụa đỏ buộc giữa dây (thay đèn lồng của bản ban đêm)
  const DAI_LUA = '<svg viewBox="0 0 90 150" aria-hidden="true"><path d="M46 12 C54 40 66 62 64 96 C63 110 68 122 75 133 L60 128 L54 141 C52 120 50 100 50 80 C50 56 48 34 42 14 Z" fill="#c21d1d"/>' +
    '<path d="M38 12 C28 38 16 66 20 100 C22 116 18 128 11 140 L26 132 L34 145 C38 126 36 104 38 84 C40 58 44 36 46 14 Z" fill="#e22b2b"/>' +
    '<path d="M35 22 C28 44 22 68 25 98" fill="none" stroke="#ff8a78" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>' +
    '<path d="M45 12 C30 -3 10 1 14 14 C17 25 34 21 45 12 Z M45 12 C60 -3 80 1 76 14 C73 25 56 21 45 12 Z" fill="#ea3a3a" stroke="#a31515" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<ellipse cx="45" cy="12" rx="9" ry="8" fill="#f04a4a" stroke="#a31515" stroke-width="1.6"/></svg>';
  const DUOC = [{ x: 242, y: 334 }, { x: 420, y: 344 }, { x: 1500, y: 344 }, { x: 1678, y: 334 }];   // đuốc Nhóm 1..4: tâm ngang, đỉnh cột
  const luaTam = i => [DUOC[i].x, DUOC[i].y - 34];  // tâm ngọn lửa của đuốc i
  const TRONG = [1, 2], NGOAI = [0, 3];             // đuốc gần vạch giữa và đuốc ngoài cùng của Đội 1, Đội 2
  const DEN = [960, 700];                           // chỗ dải lụa giữa dây (lúc dây ở vạch giữa)
  const TH = { L: 140, R: 1080 };                   // thước nấc: hai đầu ray
  const TH_U = (TH.R - TH.L) / 20, TH_G = (TH.L + TH.R) / 2;
  // mốc thời gian của một lượt kéo (giây, tính từ lúc bấm "Kéo co")
  const T_SM = .15, T_B0 = 1.1, T_B1 = 2.4, T_THANG = 2.5, T_BAO = 2.6, T_X = 3.3, T_DOI = 3.65, T_VI = 3.7, T_K = 4.0, DAI = .36;
  // phần kết
  // 25/11 13:18 thầy Thịnh (luồng Thảo luận giáo án) nói hai kiểu kết đã xem ("truyền lửa" từ đèn lồng, "kéo mở báo tường") đều
  //   "chưa ổn lắm", đang cân nhắc cách chuyển tiếp. PHẦN KẾT DƯỚI ĐÂY LÀ BẢN TẠM, giữ đúng nhịp của trang Rước đuốc để thay
  //   nhanh khi thầy chốt: finish = đội thắng thắp 2 đuốc của đội (đuốc tự bén lửa, không có quả lửa bay từ đèn lồng),
  //   rank = đội còn lại thắp 2 đuốc, tuong = 4 quả lửa bay lên số 51 rồi vành lửa lan ra lộ báo tường.
  const T_D1 = 1.0, T_D2 = 1.6, T_NUT_DICH = 2.6, T_H1 = .6, T_H2 = 1.2, T_DU = 1.6, T_NUT_HANG = 2.4, T_CHAY = 1.5, DAI_CHAY = 3.1, T_HET = T_CHAY + DAI_CHAY;

  const S = { che: "an", q: 0, kc: [], t0: XA, phu: false, tinh: false, ket: 0, cues: [], L: null };
  let E = null;

  /* ---------- ghi vào DOM chỉ khi đổi ---------- */
  function kieu(el, k, v) { const m = el._k || (el._k = {}); if (m[k] !== v) { m[k] = v; el.style[k] = v; } }
  function chu(el, v) { if (el._c !== v) { el._c = v; el.textContent = v; } }
  function html(el, v) { if (el._h !== v) { el._h = v; el.innerHTML = v; } }
  function lop(el, ten, on) { on = !!on; const m = el._l || (el._l = {}); if (m[ten] !== on) { m[ten] = on; el.classList.toggle(ten, on); } }
  function mo(el, a) { kieu(el, "opacity", a <= 0 ? "0" : a >= 1 ? "1" : a.toFixed(3)); kieu(el, "visibility", a <= 0 ? "hidden" : "visible"); }
  const px = v => v.toFixed(1) + "px";

  /* ---------- dựng các phần tử ---------- */
  function dung() {
    const TO = RD.TO, SM = RD.SUC_MANH;
    let h = '<div class="kc-trong"><div class="kc-canh" id="kcCanh"><div class="kc-nen"><i class="t"></i><i class="d"></i><i class="tr"></i><i class="p"></i></div><div class="kc-toi"></div>';
    DUOC.forEach((d, i) => { h += '<div class="kc-quang" style="left:' + d.x + "px;top:" + (d.y - 34) + 'px"></div>'; });
    DUOC.forEach((d, i) => { h += '<div class="kc-duoc" style="left:' + (d.x - 28) + "px;top:" + d.y + 'px"></div>'; });
    DUOC.forEach((d, i) => { h += '<div class="kc-lua" style="left:' + d.x + "px;top:" + (d.y - 76) + 'px"><i></i></div>'; });
    DUOC.forEach((d, i) => { h += '<div class="kc-nhan" style="left:' + d.x + "px;top:" + (d.y + 54) + "px;background:" + TO[i].mau + '">' + TO[i].ten + "</div>"; });
    h += '<div class="kc-vach"></div><div class="kc-chu-vach">VẠCH GIỮA</div>';
    // vệt gió khi kéo (nằm sau hai đội)
    for (let k = 0; k < VUT; k++) h += '<i class="kc-vut" style="width:' + (150 + (k * 53) % 150) + 'px"></i>';
    h += '<div class="kc-nhom" id="kcNhom">' +
      '<div class="kc-bong-doi" style="left:' + (DOI_O[0].x + 6) + "px;top:" + (DOI_O[0].y + DOI_O[0].h - 26) + "px;width:" + (DOI_O[0].w - 12) + 'px"></div>' +
      '<div class="kc-bong-doi" style="left:' + (DOI_O[1].x + 6) + "px;top:" + (DOI_O[1].y + DOI_O[1].h - 26) + "px;width:" + (DOI_O[1].w - 12) + 'px"></div>' +
      '<div class="kc-day" style="left:' + (DOI_O[0].x + DOI_O[0].w - 6) + "px;top:" + (DAY_Y - 5) + "px;width:" + (DOI_O[1].x - DOI_O[0].x - DOI_O[0].w + 12) + 'px"></div>' +
      DOI_O.map((o, d) => '<div class="kc-doi-boc" style="left:' + o.x + "px;top:" + o.y + "px;width:" + o.w + "px;height:" + o.h + 'px"><img class="kc-doi d' + (d + 1) + '" src="hinh/doi-' + (d + 1) + '.webp" alt="" draggable="false"></div>').join("") +
      DOI_O.map((o, d) => '<div class="kc-ten-doi" style="left:' + (o.x + o.w / 2) + "px;top:" + (DOI_O[1].y + DOI_O[1].h + 12) + "px;background:var(--" + (d ? "cam" : "xanh") + ')">ĐỘI ' + (d + 1) + "</div>").join("") +
      '<div class="kc-tia" id="kcTia">' + [0, 1, 2, 3, 4, 5, 6, 7].map(() => "<i></i>").join("") + "</div>" +
      '<div class="kc-den-boc" style="left:915px;top:' + (DAY_Y - 12) + 'px"><div class="kc-den" id="kcDen">' + DAI_LUA + "</div></div>";
    BUI_X[0].forEach((x, j) => { h += '<div class="kc-bui b1" style="left:' + x + "px;top:" + (j % 2 ? 798 : 792) + 'px;width:124px;height:60px"></div>'; });
    BUI_X[1].forEach((x, j) => { h += '<div class="kc-bui b2" style="left:' + x + "px;top:" + (j % 2 ? 814 : 808) + 'px;width:124px;height:60px"></div>'; });
    for (let d = 1; d <= 2; d++) for (let k = 0; k < 2; k++) h += '<div class="kc-ho d' + d + '"></div>';
    const muiTen = lat => '<svg class="kc-mui ' + (lat ? "m1" : "m2") + '" style="left:' + (lat ? 776 : 1048) + "px" + (lat ? ";transform:scaleX(-1)" : "") + '" width="96" height="40" viewBox="0 0 96 40" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6 L24 20 L8 34" opacity=".45"/><path d="M38 6 L54 20 L38 34" opacity=".75"/><path d="M68 6 L84 20 L68 34"/></g></svg>';
    h += muiTen(true) + muiTen(false) + '<div class="kc-so-nac" id="kcSoNac">1</div></div>';
    // lá rơi (4 chiếc rơi thong thả suốt buổi, 12 chiếc rụng theo từng nhịp kéo), hoa giấy mừng đội thắng câu, chữ nổ giữa sân
    LA_NEN.forEach((o, k) => { h += '<i class="kc-la nen" style="left:' + o[0] + "px;top:" + o[1] + "px;animation-duration:" + o[2] + "s;animation-delay:-" + o[3] + 's"></i>'; });
    for (let k = 0; k < LA_O.length; k++) h += '<i class="kc-la"></i>';
    for (let k = 0; k < HOA; k++) h += '<i class="kc-hoa"></i>';
    h += '<div class="kc-no" id="kcNo"></div></div>';
    // nhãn câu, sức mạnh, 5 bước
    h += '<div class="kc-cau" id="kcCau"></div>';
    h += '<div class="kc-sm" id="kcSm"><div class="bieu">' + SET + '</div><div class="ten-khoi"><div class="nho" id="kcSmNho"></div><div class="ten" id="kcSmTen"></div></div><div class="sm-luat" id="kcSmLuat"></div></div>';
    h += '<div class="kc-duong kc-the" id="kcDuong"><div class="day-noi"></div>' + SM.map((s, i) => '<div class="buoc" style="left:' + (92 + 165 * i) + 'px"><div class="tron">' + (i + 1) + '</div><div class="tb">' + s.ten + '</div><div class="kq"></div></div>').join("") + "</div>";
    const sao = () => '<span class="kc-sao">' + [0, 1, 2, 3, 4].map(() => "<span>" + SAO + "</span>").join("") + "</span>";
    const tenNhom = D => D.to.map(t => TO[t].ten).join(" + ");
    RD.DOI.forEach((D, i) => {
      h += '<div class="kc-bang kc-the d' + D.n + '" id="kcB' + D.n + '"><div class="dau"><span class="ten">' + D.ten.toUpperCase() + '</span><span class="the-so">' + tenNhom(D) + "</span>" + sao() +
        '</div><div class="keo"><span class="nhan"></span><span class="thanh"><i></i></span><span class="pt"></span></div></div>';
    });
    RD.DOI.forEach((D, i) => { h += '<div class="kc-chip kc-the d' + D.n + '" id="kcC' + D.n + '"><span class="ten">' + D.ten.toUpperCase() + '</span><span class="nh">' + tenNhom(D) + "</span>" + sao() + "</div>"; });
    h += '<div class="kc-bao" id="kcBao"><div class="lon" id="kcLon"></div><div class="vi" id="kcVi"></div></div><div class="kc-x2" id="kcX2"></div>';
    h += '<div class="kc-thuoc" id="kcThuoc"><div class="ray"></div>';
    for (let k = -10; k <= 10; k++) h += '<i class="vach-nac' + (k === 0 ? " giua" : "") + '" style="left:' + (TH_G + k * TH_U) + 'px"></i>';
    h += '<i class="bong"></i><i class="mui-ten"></i><i class="moc"></i><span class="dan"></span><span class="ben" style="left:22px;color:#8fb4f2">◀ ĐỘI 1</span><span class="ben" style="right:22px;color:#f6b25c">ĐỘI 2 ▶</span></div>';
    h += '<svg class="kc-sao-bay" id="kcSaoBay" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
    h += '<div class="kc-ket" id="kcKet"><div class="lon" id="kcKetLon"></div><div class="vi" id="kcKetVi"></div></div>';
    for (let k = 0; k < 4; k++) h += '<div class="kc-qua"><i></i><i></i><i></i><i></i><i></i><b></b></div>';
    h += '<button type="button" class="nut-tv" id="kcNut" hidden><span></span>' + MUI + "</button>";
    h += '</div><div class="kc-vong" id="kcVong"></div><div class="kc-chop" id="kcChop"></div>';
    const g = document.createElement("div");
    g.id = "kc"; g.hidden = true; g.innerHTML = h;
    const cv = $("#cv");
    cv.parentNode.insertBefore(g, cv.nextSibling);
    const tat = (s, r) => Array.prototype.slice.call((r || g).querySelectorAll(s));
    const bang = n => { const b = $("#kcB" + n, g); return { el: b, nhan: $(".nhan", b), thanh: $(".thanh i", b), pt: $(".pt", b), sao: tat(".kc-sao span", b) }; };
    const chip = n => { const b = $("#kcC" + n, g); return { el: b, sao: tat(".kc-sao span", b) }; };
    E = {
      g: g, world: $("#world"), canh: $("#kcCanh", g), nhom: $("#kcNhom", g), den: $("#kcDen", g), doi: [$(".kc-doi.d1", g), $(".kc-doi.d2", g)], boc: tat(".kc-doi-boc"),
      vut: tat(".kc-vut"), ho: [tat(".kc-ho.d1"), tat(".kc-ho.d2")], no: $("#kcNo", g), la: tat(".kc-la:not(.nen)"), hoa: tat(".kc-hoa"), tia: $("#kcTia", g), tiaI: tat("#kcTia i"),
      lua: tat(".kc-lua"), quang: tat(".kc-quang"), bui: [tat(".kc-bui.b1"), tat(".kc-bui.b2")], mui: [$(".kc-mui.m1", g), $(".kc-mui.m2", g)], soNac: $("#kcSoNac", g),
      cau: $("#kcCau", g), sm: $("#kcSm", g), smNho: $("#kcSmNho", g), smTen: $("#kcSmTen", g), smLuat: $("#kcSmLuat", g),
      duong: $("#kcDuong", g), buoc: tat(".kc-duong .buoc").map(b => ({ el: b, kq: $(".kq", b) })),
      bang: [bang(1), bang(2)], chip: [chip(1), chip(2)], bao: $("#kcBao", g), lon: $("#kcLon", g), vi: $("#kcVi", g), x2: $("#kcX2", g),
      thuoc: $("#kcThuoc", g), moc: $(".kc-thuoc .moc", g), bong: $(".kc-thuoc .bong", g), muiTen: $(".kc-thuoc .mui-ten", g), dan: $(".kc-thuoc .dan", g),
      saoBay: $("#kcSaoBay", g), ket: $("#kcKet", g), ketLon: $("#kcKetLon", g), ketVi: $("#kcKetVi", g),
      qua: tat(".kc-qua").map(q => ({ el: q, dau: $("b", q), duoi: tat("i", q) })), nut: $("#kcNut", g), nutChu: $("#kcNut span", g), vong: $("#kcVong", g), chop: $("#kcChop", g)
    };
    E.nut.addEventListener("click", function () { if (am().mo) am().mo(); if (KC.khiBam) KC.khiBam(S.che); });
  }

  /* ---------- tiếng ---------- */
  function hen(t, fn) { S.cues.push({ t: t, fn: fn }); }
  function chayTieng(t) {
    for (let i = 0; i < S.cues.length; i++) {
      const c = S.cues[i];
      if (!c.xong && t >= c.t) { c.xong = true; if (t - c.t < 1.5) { try { c.fn(); } catch (e) { console.error(e); } } }
    }
  }
  const keu = (ten, a, b) => () => { const f = am()[ten]; if (f) f(a, b); };

  /* ---------- lời báo của một câu ---------- */
  function trong(k) { return (S.kc && S.kc[k]) || { vt: 0, sao: [0, 0], cau: {}, thang: 0 }; }
  function loiCau(K) {
    const q = K.q, a = K.doi[0].tram, b = K.doi[1].tram, to = Math.max(a, b), nho = Math.min(a, b), D = RD.DONG_LONG;
    const o = { lon0: "", lon1: "", lon2: "", dau: "", vi: "" };
    if (!K.goc) {
      o.lon0 = o.lon1 = "HAI ĐỘI HÒA";
      o.vi = K.hieu ? to + " − " + nho + " = <b>" + K.hieu + "</b>, hơn kém nhau dưới 5 nên dây đứng yên." : "Hai đội cùng đúng " + a + "% nên dây đứng yên.";
    } else {
      o.lon0 = "ĐỘI " + K.thang + " KÉO " + K.goc + " NẤC";
      o.lon1 = K.nac !== K.goc ? "ĐỘI " + K.thang + " KÉO " + K.nac + " NẤC!" : o.lon0;
      o.vi = to + " − " + nho + " = <b>" + K.hieu + "</b> nên kéo " + K.goc + " nấc.";
    }
    if (q === 2) {
      const x = K.thuong[0], y = K.thuong[1];
      if (x && y) o.vi += "<br>Cả hai đội đúng từ " + D + "% trở lên: <b>Đồng lòng</b>, hai nấc thưởng bù nhau.";
      else if (x || y) { o.vi += "<br>Đội " + (x ? 1 : 2) + " đúng từ " + D + "% trở lên: <b>Đồng lòng, thưởng 1 nấc</b>."; o.lon2 = "ĐỘI " + (x ? 1 : 2) + " THƯỞNG 1 NẤC"; }
      else o.vi += "<br>Chưa đội nào đúng từ " + D + "% trở lên nên chưa có nấc thưởng.";
    }
    if (q === 3 && K.goc) { o.vi += "<br><b>Tăng tốc</b>: kéo thêm 1 nấc thành " + K.nac + " nấc."; o.dau = "+1"; }
    if (q === 4 && K.goc) {
      if (K.gapDoi) { o.vi += "<br>Đang bị dẫn mà thắng: <b>Tiếp sức gấp đôi</b> thành " + K.nac + " nấc."; o.dau = "×2"; }
      else o.vi += "<br>Đội " + K.thang + " đang không bị dẫn nên không được gấp đôi.";
    }
    if (q === 5 && K.goc) { o.vi += "<br><b>Câu vàng</b>: nhân đôi thành " + K.nac + " nấc."; o.dau = "×2"; }
    return o;
  }
  const kqCau = K => { const d = K.sau - K.truoc; return d > 0 ? "Đội 1 +" + d : d < 0 ? "Đội 2 +" + (-d) : "Hòa"; };
  // lịch một lượt kéo: mốc từng nấc, lúc xong
  function lichKeo(K) {
    const n = K.buoc.length, gap = n > 4 ? .5 : .62, moc = K.buoc.map((b, i) => T_K + i * gap + (i >= K.nac ? .75 : 0));
    const het = n ? moc[n - 1] + .9 : T_K + .3;
    let vuot = null, c = K.truoc;
    K.buoc.forEach((b, i) => { c += b; if (vuot == null && K.truoc && c && (c > 0) !== (K.truoc > 0)) vuot = i; });
    return { moc: moc, het: het, sao: het, ket: het + (K.thang ? 1.7 : .6), loi: loiCau(K), vuot: vuot };
  }

  /* ---------- điều khiển từ trò chơi ---------- */
  // o = { che: "dau" | "hoi" | "keo" | "dich" | "hang" | "tuong" | "an", q, kc: [kết quả sau 0..5 câu], hoatCanh }
  KC.dat = function (o) {
    if (!E) return;
    const t = dongHo(), hc = !!o.hoatCanh;
    if (o.kc) S.kc = o.kc;
    S.che = o.che === "tuong" && !hc ? "an" : o.che;
    S.q = o.q || 0;
    S.t0 = hc ? t : XA;
    S.cues = []; S.tinh = false; S.L = null; S.ket = 0;
    const che = S.che;
    if (E.g.hidden !== (che === "an")) E.g.hidden = che === "an";
    lop(E.world, "kc-che-nut", che === "tuong");
    if (che !== "tuong") { kieu(E.g, "webkitMaskImage", ""); kieu(E.g, "maskImage", ""); mo(E.vong, 0); mo(E.chop, 0); }
    if (che === "keo") {
      const K = trong(S.q).cau[S.q];
      if (K) {
        S.L = lichKeo(K); S.ket = S.L.ket;
        if (hc) {
          hen(t + T_SM, keu("go", 3, .35)); hen(t + T_BAO, keu("chuong", .35));
          if (S.L.loi.dau) hen(t + T_X, keu("ting"));
          S.L.moc.forEach((m, i) => { hen(t + m, keu("trong", i >= K.nac ? .7 : .85)); if (i >= K.nac) hen(t + m - .4, keu("ting")); });
          if (S.L.moc.length) hen(t + S.L.moc[0] - .5, keu("ting"));
          if (S.L.vuot != null) hen(t + S.L.moc[S.L.vuot] + .05, keu("lapLanh"));
          if (K.thang) hen(t + S.L.sao + .75, keu("lapLanh"));
        }
      }
    } else if (che === "dich") {
      S.ket = T_NUT_DICH + .6;
      if (hc) { hen(t + .05, keu("ken")); hen(t + T_D1, keu("bungLua")); hen(t + T_D2, keu("bungLua")); hen(t + T_D2 + .3, keu("voTay")); }
    } else if (che === "hang") {
      S.ket = T_NUT_HANG + .6;
      if (hc && trong(5).thang) { hen(t + T_H1, keu("bungLua")); hen(t + T_H2, keu("bungLua")); hen(t + T_DU, keu("voTay")); hen(t + T_DU, keu("ken")); }
    } else if (che === "tuong") {
      S.ket = T_HET + .3;
      hen(t + .2, keu("vut")); hen(t + T_CHAY, keu("trong", 1)); hen(t + T_CHAY, keu("bungLua")); hen(t + T_CHAY + .2, keu("lachTach", 2.4));
    }
    if (che !== "an") { try { ve(t); } catch (e) { console.error(e); } }
  };
  // màn câu hỏi che kín sân: thôi vẽ, dừng các chuyển động lặp
  KC.phu = function (on) { S.phu = !!on; if (E) lop(E.g, "kc-dung", S.phu); if (!on) S.tinh = false; };
  // lúc báo tường lộ ra hết (giây, cùng đồng hồ performance.now); không đang đốt thì null
  KC.lucBaoHien = () => (S.che === "tuong" ? S.t0 + T_HET : null);
  KC.khiBam = null;
  KC._S = S;
  KC._ve = t => ve(t);

  /* ---------- vẽ một khung hình ---------- */
  function datSao(ds, n) { ds.forEach((s, i) => lop(s, "co", i < n)); }
  function bay(a, b, h, e) { return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - h * Math.sin(Math.PI * e)]; }
  function veQua(k, f, u) {
    const Q = E.qua[k];
    if (!f) { mo(Q.el, 0); return; }
    const e0 = lin(u, f.t0, f.t1);
    if (e0 <= 0 || e0 >= 1) { mo(Q.el, 0); return; }
    const de = f.de || em, e = de(e0), P = bay(f.a, f.b, f.h, e);
    mo(Q.el, Math.min(1, e0 / .08, (1 - e0) / .06));
    kieu(Q.el, "transform", "translate(" + px(P[0]) + "," + px(P[1]) + ")");
    Q.duoi.forEach((d, j) => {
      const ej = de(Math.max(0, e0 - (j + 1) * .035)), Pj = bay(f.a, f.b, f.h, ej), s = 1 - (j + 1) * .15;
      kieu(d, "transform", "translate(" + px(Pj[0] - P[0]) + "," + px(Pj[1] - P[1]) + ") scale(" + s.toFixed(2) + ")");
      kieu(d, "opacity", (.8 - j * .14).toFixed(2));
    });
  }

  // vệt gió, tiếng hò, chữ nổ, lá rụng, hoa giấy, tia sáng ở dải lụa: fx do ve() gom theo thời gian của từng nhịp kéo
  function veHieuUng(fx, t, dx) {
    E.vut.forEach((el, k) => {
      const f = fx.vut;
      if (!f) { kieu(el, "opacity", "0"); return; }
      const e = f.d / .45, x = 60 + (k * 197) % 1640 - f.b * (90 + 440 * e + (k % 3) * 60);
      kieu(el, "opacity", (Math.sin(Math.PI * e) * (.55 + .4 * ngau(k, 1))).toFixed(3));
      kieu(el, "transform", "translate(" + px(x) + "," + px(572 + k * 26) + ")");
      lop(el, "vang", !!f.vang);
    });
    const hoDung = [[null, null], [null, null]];
    fx.ho.forEach(o => { hoDung[o.doi][o.nho || fx.no ? 0 : o.i % 2] = o; });
    for (let d = 0; d < 2; d++) for (let k = 0; k < 2; k++) {
      const el = E.ho[d][k], o = hoDung[d][k];
      if (!o) { kieu(el, "opacity", "0"); continue; }
      const O = DOI_O[d], ax = [130, 470][k], x = d ? O.x + O.w - ax : O.x + ax, y = O.y - (k ? 100 : 86) - 18 * o.d;
      chu(el, o.nho ? HO_THUA[o.i ? 1 : 0] : HO_THANG[o.i % 4]); lop(el, "nho", !!o.nho);
      kieu(el, "opacity", (o.d < .62 ? 1 : Math.max(0, 1 - (o.d - .62) / .26)).toFixed(3));
      kieu(el, "transform", "translate(" + px(x) + "," + px(y) + ")" + (d ? " translateX(-100%)" : "") + " rotate(" + (d ? 5 : -5) + "deg) scale(" + ob(lin(o.d, 0, .16)).toFixed(3) + ")");
    }
    if (fx.no) {
      const f = fx.no, sc = ob(lin(f.d, 0, .18)) * (1 + .03 * Math.sin(f.d * 22));
      chu(E.no, f.chu);
      if (E.no._lop !== f.lop) { E.no._lop = f.lop; E.no.className = "kc-no " + f.lop; }
      kieu(E.no, "opacity", (f.d < f.dai - .25 ? 1 : Math.max(0, (f.dai - f.d) / .25)).toFixed(3));
      kieu(E.no, "transform", "translate(-50%,0) rotate(-4deg) scale(" + sc.toFixed(3) + ")");
    } else kieu(E.no, "opacity", "0");
    const laDung = [];
    fx.la.forEach(o => { for (let j = o.i % 3; j < LA_O.length; j += 3) laDung[j] = o; });
    E.la.forEach((el, j) => {
      const o = laDung[j];
      if (!o) { kieu(el, "opacity", "0"); return; }
      const T = o.d;
      kieu(el, "opacity", (Math.max(0, Math.min(1, T / .15, (1.9 - T) / .4)) * .95).toFixed(3));
      kieu(el, "transform", "translate(" + px(LA_O[j][0] + 34 * Math.sin(T * 4 + j) + o.b * 50 * T) + "," + px(LA_O[j][1] + 150 * T + 60 * T * T) + ") rotate(" + (j * 40 + T * 220).toFixed(0) + "deg)");
    });
    E.hoa.forEach((el, j) => {
      const f = fx.hoa;
      if (!f) { kieu(el, "opacity", "0"); return; }
      const O = DOI_O[f.doi], T = f.d, r1 = ngau(j, 1), r2 = ngau(j, 2), r3 = ngau(j, 3);
      if (el._mau !== f.doi * 100 + j) { el._mau = f.doi * 100 + j; el.style.background = HOA_MAU[j % 5] || RD.DOI[f.doi].mau; }
      kieu(el, "opacity", (T < 1.2 ? 1 : Math.max(0, 1 - (T - 1.2) / .4)).toFixed(3));
      kieu(el, "transform", "translate(" + px(O.x + O.w / 2 + dx + (r1 - .5) * 560 + (r1 - .5) * 150 * T) + "," + px(O.y + 30 - (330 + r2 * 250) * T + 560 * T * T) + ") rotate(" + (T * (300 + r3 * 500)).toFixed(0) + "deg) scale(" + (.7 + r3 * .6).toFixed(2) + ")");
    });
    if (fx.tia != null) {
      const e = fx.tia / .34;
      kieu(E.tia, "opacity", (1 - e).toFixed(3));
      E.tiaI.forEach((el, k) => kieu(el, "transform", "rotate(" + (k * 45 + 22) + "deg) translateY(" + px(-(30 + 64 * e)) + ") scaleY(" + (1 - .6 * e).toFixed(2) + ")"));
    } else kieu(E.tia, "opacity", "0");
  }

  function ve(t) {
    const che = S.che, q = S.q, u = t - S.t0;
    const tran = che === "hoi" || che === "keo", ketCanh = che === "dich" || che === "hang" || che === "tuong";
    const cuoi = trong(5), W = cuoi.thang;
    let p = 0, sao = [0, 0], lit = [0, 0, 0, 0];
    let sx = 0, sy = 0, la = 0, kh = 0, khD = 0, khLuc = 0, dangKeo = 0, moHUD = 1;
    const buiT = [[], []];
    const qua = [null, null, null, null];
    // hiệu ứng khi kéo (25/11 13:44 thầy Thịnh: "nhớ cho thêm hiệu ứng khi kéo để nhìn đẹp hơn"): hai đội ngả người theo từng nhịp, lấy đà trước
    //   nhịp đầu, vệt gió, tia sáng ở dải lụa, tiếng hò trên đầu, lá rụng, chữ "KÉO!" và "VƯỢT LÊN!" giữa sân, hoa giấy và nhảy mừng khi thắng câu
    const ng = [0, 0], nhay = [0, 0], fx = { vut: null, tia: null, ho: [], la: [], no: null, hoa: null, vang: -1 };
    let rung = 0;

    /* --- trạng thái theo bước --- */
    if (che === "hoi") { const B = trong(q - 1); p = B.vt; sao = B.sao.slice(); }
    else if (che === "keo") {
      const B = trong(q - 1), K = trong(q).cau[q], L = S.L;
      p = B.vt; sao = B.sao.slice();
      if (K && L) {
        K.buoc.forEach((b, i) => {
          const d = u - L.moc[i];
          if (d > 0) {
            const w = b > 0 ? 0 : 1, manh = K.gapDoi || i >= K.nac;
            p += b * ob(cl(d / DAI)); kh = i + 1; khD = b; khLuc = d;
            la += -b * 16 * Math.exp(-d * 3.5) * Math.sin(d * 13);
            if (d < .22) { const a = (manh ? 8 : 6) * (1 - d / .22); sx += a * Math.sin(d * 95); sy += a * .6 * Math.cos(d * 77); }
            const e = d < .09 ? d / .09 : Math.exp(-(d - .09) * 5.2);
            ng[w] += -b * 3.4 * e; ng[1 - w] += -b * 2.4 * e;
            buiT[0].push({ d: d, b: b }); buiT[1].push({ d: d, b: b });
            if (d < .45) fx.vut = { b: b, d: d, vang: manh };
            if (d < .34) fx.tia = d;
            if (d < .9) { fx.ho.push({ doi: w, i: i, d: d }); if (i === 0 || i === 3) fx.ho.push({ doi: 1 - w, i: i, d: d, nho: true }); }
            if (d < 1.9) fx.la.push({ d: d, b: b, i: i });
            if (manh && d < .8) fx.vang = w;
          }
          if (d > -.1 && d < DAI + .3) dangKeo = b;
        });
        if (K.buoc.length) {
          // lấy đà trước nhịp đầu: hai đội ngả người ra sau, rung nhẹ; chữ "KÉO!" nổ giữa sân
          const t0 = L.moc[0], r = u < t0 ? eo(lin(u, t0 - .55, t0 - .3)) : 1 - lin(u, t0, t0 + .12);
          if (r > 0) { ng[0] -= 1.5 * r; ng[1] += 1.5 * r; if (u < t0) rung = r; }
          if (u >= t0 - .5 && u < t0 + .3) fx.no = { chu: "KÉO!", d: u - (t0 - .5), dai: .8, lop: "" };
          if (K.gapDoi && u >= t0 - .3 && u < L.het) fx.vang = K.thang - 1;
          // đội đang bị dẫn kéo dải lụa qua vạch giữa
          if (L.vuot != null) { const d = u - L.moc[L.vuot]; if (d > 0 && d < 1.6) fx.no = { chu: "ĐỘI " + K.thang + " VƯỢT LÊN!", d: d, dai: 1.6, lop: "nho d" + K.thang }; }
          // thắng câu: đội thắng nhảy mừng, hoa giấy tung lên
          if (K.thang) {
            const th = u - L.het;
            if (th > 0 && th < .66) nhay[K.thang - 1] = -20 * Math.abs(Math.sin(Math.PI * th / .33));
            if (th > 0 && th < 1.6) fx.hoa = { doi: K.thang - 1, d: th };
          }
        }
        if (K.thang && u >= L.sao + .8) sao[K.thang - 1]++;
      }
    } else if (che === "dau") { p = 0; }
    else { p = cuoi.vt; sao = cuoi.sao.slice(); }
    const pv = Math.max(-RD.NAC_HIEN, Math.min(RD.NAC_HIEN, p)), dx = -PXN * pv;

    /* --- phần kết: đuốc sáng, quả lửa bay --- */
    if (che === "dich" || che === "hang" || che === "tuong") {
      const doiThang = W ? [W - 1] : [0, 1];
      const sang = (i, luc) => { lit[i] = Math.max(lit[i], lin(u, luc, luc + .35)); };
      if (che === "dich") {
        doiThang.forEach(d => { sang(TRONG[d], T_D1); sang(NGOAI[d], T_D2); });
      } else {
        doiThang.forEach(d => { lit[TRONG[d]] = lit[NGOAI[d]] = 1; });
        if (che === "hang" && W) {
          const d = 2 - W;                                        // đội còn lại
          sang(TRONG[d], T_H1); sang(NGOAI[d], T_H2);
        } else lit = [1, 1, 1, 1];
        if (che === "tuong") {
          const C = (RD.SanKhau && RD.SanKhau.C51) || [955, 66];
          for (let i = 0; i < 4; i++) qua[i] = { t0: .2 + i * .08, t1: T_CHAY - .06 + i * .02, a: luaTam(i), b: C, h: [150, 60, 60, 150][i], de: ei };
          moHUD = 1 - lin(u, 0, .4);
        }
      }
    }

    /* --- sân --- */
    kieu(E.nhom, "transform", "translateX(" + px(dx) + ")");
    kieu(E.canh, "transform", sx || sy ? "translate(" + px(sx) + "," + px(sy) + ")" : "");
    kieu(E.den, "transform", Math.abs(la) > .02 ? "rotate(" + la.toFixed(2) + "deg)" : "");
    for (let i = 0; i < 4; i++) {
      const a = lit[i];
      mo(E.lua[i], a); mo(E.quang[i], a);
      if (a > 0) kieu(E.lua[i], "transform", a < 1 ? "scale(" + (.3 + .7 * ob(a)).toFixed(3) + ")" : "");
    }
    for (let d = 0; d < 2; d++) {
      E.bui[d].forEach((el, j) => {
        let o = 0, sc = .7, bx = 0;
        buiT[d].forEach(f => {                      // đội bị kéo trượt chân nên bụi to hơn
          const thua = (f.b > 0 ? 1 : 0) === d, x = (f.d - j * .03) / .75;
          if (x > 0 && x < 1) { o = Math.max(o, Math.sin(Math.PI * x) * (thua ? 1 : .75)); sc = (.7 + .6 * x) * (thua ? 1.35 : 1); bx = f.b * (16 + 30 * x); }
        });
        kieu(el, "opacity", o.toFixed(3));
        if (o > 0) kieu(el, "transform", "translateX(" + px(bx) + ") scale(" + sc.toFixed(3) + ")");
      });
      const jx = rung ? 1.6 * rung * Math.sin(t * 75 + d * 2) : 0;
      kieu(E.boc[d], "transform", ng[d] || nhay[d] || jx ? "translate(" + px(jx) + "," + px(nhay[d]) + ") rotate(" + ng[d].toFixed(2) + "deg)" : "");
      lop(E.doi[d], "vang", fx.vang === d);
      const keo = dangKeo && (dangKeo > 0 ? 0 : 1) === d;
      kieu(E.mui[d], "opacity", keo ? (.6 + .4 * Math.sin(t * 14)).toFixed(3) : "0");
      if (keo) kieu(E.mui[d], "transform", (d ? "" : "scaleX(-1) ") + "translateX(" + px((t * 90) % 36) + ")");
      lop(E.doi[d], "mung", ketCanh && (W ? W - 1 === d : true) && (che !== "dich" || u >= T_D1));
    }
    veHieuUng(fx, t, dx);
    if (kh && khLuc < .9) {
      const K = trong(q).cau[q];
      chu(E.soNac, kh > K.nac ? "+1" : String(kh));
      kieu(E.soNac, "opacity", (khLuc < .1 ? khLuc / .1 : Math.max(0, 1 - (khLuc - .5) / .4)).toFixed(3));
      kieu(E.soNac, "transform", "translateY(" + px(-khLuc * 26) + ")");
    } else kieu(E.soNac, "opacity", "0");

    /* --- nhãn câu, sức mạnh, 5 bước, bảng 2 đội --- */
    mo(E.cau, tran ? 1 : 0); mo(E.duong, tran ? 1 : 0);
    if (tran) chu(E.cau, RD.nhanCau(q));
    const K = che === "keo" ? trong(q).cau[q] : null, L = S.L;
    if (che === "keo" && K) {
      const b = lin(u, T_SM, T_SM + .65), sm = RD.SUC_MANH[q - 1];
      mo(E.sm, b > 0 ? 1 : 0);
      chu(E.smNho, "Sức mạnh câu " + q); chu(E.smTen, sm.ten.toUpperCase()); chu(E.smLuat, sm.luat);
      kieu(E.sm, "transform", b < 1 ? "perspective(900px) rotateX(" + ((1 - ob(b)) * -90).toFixed(2) + "deg)" : "");
    } else mo(E.sm, 0);
    if (tran) {
      E.buoc.forEach((B, i) => {
        const j = i + 1, xong = j < q || (j === q && che === "keo" && !!L && u >= L.het), Kj = trong(j).cau[j];
        lop(B.el, "xong", xong); lop(B.el, "nay", j === q && !xong); lop(B.el, "vang", j === 5 && !xong && j !== q);
        chu(B.kq, xong && Kj ? kqCau(Kj) : j === q && che === "keo" ? "…" : "");
      });
    }
    for (let d = 0; d < 2; d++) {
      const B = E.bang[d], C = E.chip[d];
      mo(B.el, tran ? 1 : 0); mo(C.el, tran ? 0 : moHUD);
      datSao(B.sao, sao[d]); datSao(C.sao, sao[d]);
      if (!tran) continue;
      let f = 0, r = null;
      if (K) { f = eo(lin(u, T_B0, T_B1)); r = K.doi[d]; }
      kieu(B.thanh, "width", r ? (r.tram * f).toFixed(1) + "%" : "0");
      chu(B.pt, r ? Math.round(r.tram * f) + "%" : "");
      html(B.nhan, r ? "Câu " + q + ": " + Math.round(r.dung * f) + "/" + r.thay + "<br>thẻ đúng" : "Câu " + q);
      lop(B.el, "thang", !!K && K.thang === d + 1 && u >= T_THANG);
    }
    /* --- lời báo giữa màn --- */
    if (che === "keo" && K && L) {
      const a = lin(u, T_BAO, T_BAO + .35), loi = L.loi, coThuong = K.buoc.length > K.nac, tThuong = coThuong ? L.moc[K.buoc.length - 1] - .45 : 1e9;
      mo(E.bao, lin(u, T_BAO, T_BAO + .2));
      chu(E.lon, u >= tThuong && loi.lon2 ? loi.lon2 : u >= T_DOI ? loi.lon1 : loi.lon0);
      kieu(E.lon, "opacity", a.toFixed(3));
      kieu(E.lon, "transform", a < 1 ? "translateY(" + px((1 - eo(a)) * -24) + ")" : "");
      const fl = Math.max(u >= T_DOI && loi.lon1 !== loi.lon0 ? Math.max(0, 1 - (u - T_DOI) / .5) : 0, u >= tThuong && loi.lon2 ? Math.max(0, 1 - (u - tThuong) / .5) : 0);
      kieu(E.lon, "textShadow", fl > 0 ? "0 0 " + (18 + 30 * fl).toFixed(0) + "px rgba(255,160,50,.95),0 0 4px rgba(255,160,50,.9),0 3px 6px rgba(0,0,0,.6)" : "");
      html(E.vi, loi.vi);
      kieu(E.vi, "opacity", lin(u, T_VI, T_VI + .3).toFixed(3));
      // dấu ×2 (Tiếp sức, Câu vàng) hay +1 (Tăng tốc) rơi xuống cạnh lời báo
      const tX = loi.dau ? T_X : 1e9, x = lin(u, tX, tX + .35);
      if (x > 0) {
        chu(E.x2, loi.dau || "+1"); mo(E.x2, 1);
        kieu(E.x2, "transform", "translateY(" + px((1 - ob(x)) * -110) + ") rotate(" + (-12 - (1 - x) * 30).toFixed(1) + "deg)");
      } else mo(E.x2, 0);
    } else { mo(E.bao, 0); mo(E.x2, 0); }

    /* --- thước nấc --- */
    const coThuoc = tran || che === "dau";
    mo(E.thuoc, coThuoc ? 1 : 0);
    if (coThuoc) {
      const mx = TH_G - pv * TH_U;
      kieu(E.moc, "left", px(mx)); kieu(E.dan, "left", px(Math.max(120, Math.min(1100, mx))));
      chu(E.dan, RD.vietVT(Math.round(p)));
      const cu = K ? TH_G - Math.max(-RD.NAC_HIEN, Math.min(RD.NAC_HIEN, K.truoc)) * TH_U : mx, xa = Math.abs(mx - cu);
      kieu(E.bong, "opacity", K && xa > 20 ? "1" : "0");
      kieu(E.muiTen, "opacity", K && xa > 50 ? "1" : "0");
      if (K && xa > 20) {
        kieu(E.bong, "left", px(cu));
        if (xa > 50) {
          const phai = mx > cu;
          kieu(E.muiTen, "left", px(phai ? cu + 16 : mx + 18)); kieu(E.muiTen, "width", px(xa - 34));
          kieu(E.muiTen, "background", "linear-gradient(" + (phai ? "90deg" : "270deg") + ",rgba(255,190,90,0),rgba(255,190,90,.95))");
        }
      }
    }
    /* --- ngôi sao bay vào bảng đội thắng câu --- */
    let saoHien = false;
    if (che === "keo" && K && L && K.thang) {
      const e0 = lin(u, L.sao, L.sao + .8);
      if (e0 > 0 && e0 < 1) {
        const B = E.bang[K.thang - 1], o = B.sao[Math.min(4, trong(q - 1).sao[K.thang - 1])];
        const x0 = DEN[0] + dx - 22, y0 = 560, x1 = B.el.offsetLeft + o.offsetLeft + 15 - 22, y1 = B.el.offsetTop + o.offsetTop + 15 - 22, e = eo(e0);
        saoHien = true;
        kieu(E.saoBay, "transform", "translate(" + px(x0 + (x1 - x0) * e) + "," + px(y0 + (y1 - y0) * e - 260 * Math.sin(Math.PI * e)) + ") rotate(" + (e * 360).toFixed(0) + "deg)");
      }
    }
    kieu(E.saoBay, "opacity", saoHien ? "1" : "0");

    /* --- băng kết quả và nút của phần kết --- */
    if (ketCanh) {
      const D = W ? "Đội " + W : "", k = Math.abs(cuoi.vt);
      let lon, vi, nut = "", nutLuc = 1e9;
      const duCa = che !== "dich" && (!W || che === "tuong" || u >= T_DU);
      if (duCa) { lon = "4 NGỌN ĐUỐC CÙNG SÁNG!"; vi = W ? "Cả 4 nhóm đã thắp sáng ngọn đuốc của nhóm mình." : "Hai đội hòa nhau, cùng thắp sáng 4 ngọn đuốc."; }
      else if (W) { lon = "ĐỘI " + W + " THẮNG, THẮP ĐUỐC TRƯỚC!"; vi = "Sau 5 câu, " + D + " dẫn " + k + " nấc."; }
      else { lon = "HAI ĐỘI HÒA NHAU!"; vi = "Sau 5 câu, dây về lại vạch giữa: hai đội cùng thắp đuốc."; }
      if (che === "dich") { nut = "Tổng kết"; nutLuc = T_NUT_DICH; }
      else if (che === "hang") { nut = "Tiếp theo"; nutLuc = W ? T_NUT_HANG : .5; }
      chu(E.ketLon, lon); chu(E.ketVi, vi);
      const a = che === "dich" ? lin(u, 0, .4) : moHUD;
      mo(E.ket, a);
      kieu(E.ket, "transform", a < 1 && che === "dich" ? "translateY(" + px((1 - eo(a)) * -30) + ")" : "");
      const hienNut = u >= nutLuc;
      if (E.nut.hidden !== !hienNut) E.nut.hidden = !hienNut;
      if (hienNut) {
        chu(E.nutChu, nut);
        const v = lin(u, nutLuc, nutLuc + .5);
        kieu(E.nut, "opacity", lin(u, nutLuc, nutLuc + .3).toFixed(3));
        kieu(E.nut, "transform", "translateX(-50%) scale(" + (.8 + .2 * ob(v)).toFixed(3) + ")");
      }
    } else { mo(E.ket, 0); if (!E.nut.hidden) E.nut.hidden = true; }
    for (let i = 0; i < 4; i++) veQua(i, qua[i], u);

    /* --- vành lửa lan ra, lộ báo tường ở lớp dưới --- */
    if (che === "tuong") {
      const C = (RD.SanKhau && RD.SanKhau.C51) || [955, 66], cx = 960 + C[0], cy = 1080 + C[1];
      const v = lin(u, T_CHAY, T_HET);
      if (v > 0) {
        const r = v < .25 ? 130 * (v / .25) : 130 + 1650 * em((v - .25) / .75);
        const mn = "radial-gradient(circle at " + cx + "px " + cy + "px,transparent " + px(Math.max(0, r - 8)) + ",#000 " + px(r) + ")";
        kieu(E.g, "webkitMaskImage", mn); kieu(E.g, "maskImage", mn);
        mo(E.vong, 1);
        kieu(E.vong, "background", "radial-gradient(circle at " + cx + "px " + cy + "px,rgba(255,250,220,0) " + px(Math.max(0, r - 10)) + ",rgba(255,248,214,.98) " + px(r + 3) + ",rgba(255,196,80,.92) " + px(r + 20) + ",rgba(255,110,24,.5) " + px(r + 64) + ",rgba(255,80,10,0) " + px(r + 150) + ")");
      } else mo(E.vong, 0);
      const c = u < T_CHAY ? lin(u, T_CHAY - .12, T_CHAY) : 1 - lin(u, T_CHAY, T_CHAY + .7);
      if (E.chop._cx !== cx + "," + cy) { E.chop._cx = cx + "," + cy; E.chop.style.setProperty("--cx", cx + "px"); E.chop.style.setProperty("--cy", cy + "px"); }
      mo(E.chop, c);
      if (u >= T_HET + .15) {                      // xong: lớp kéo co ẩn hẳn, nút "Tiếp theo" của báo tường hiện ra
        S.che = "an"; E.g.hidden = true; lop(E.world, "kc-che-nut", false);
        kieu(E.g, "webkitMaskImage", ""); kieu(E.g, "maskImage", "");
      }
    }
    if (u > S.ket + .2 && !saoHien) S.tinh = true;
  }

  function vong() {
    requestAnimationFrame(vong);
    if (!E || S.che === "an") return;
    const t = dongHo();
    chayTieng(t);
    if (S.phu || S.tinh) return;
    try { ve(t); } catch (e) { console.error(e); }
  }
  KC.khoiTao = function () {
    if (E) return;
    dung();
    window.addEventListener("resize", function () { S.tinh = false; });
    requestAnimationFrame(vong);
  };
})();
