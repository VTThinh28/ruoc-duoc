/* Ngọn đuốc tri thức (trò kéo co, 25/11/2026): sân kéo co của 2 đội trên TV.
   Thầy Thịnh 25/11: hiệu trưởng muốn đổi trò Rước đuốc thành kéo co, vẫn giữ phần đốt đuốc rồi sang báo tường. Thầy chọn luật
     "5 câu, 5 sức mạnh" và "nhóm 1 và 2 ghép 1 đội, nhóm 3 và 4 ghép 1 đội"; trò Rước đuốc cũ giữ nguyên ở trang gốc.
   Sân kéo co là một lớp phần tử DOM (#kc) đè lên khung vẽ cây cầu của Rước đuốc. Các bước giới thiệu, kéo co sau từng câu, thắp
     đuốc do lớp này vẽ; tới bước báo tường thì 2 quả lửa bay lên số 51, lửa đốt thủng lớp này (mặt nạ hình tròn lớn dần) để lộ
     báo tường do sân khấu cũ (san-khau.js) vẽ ở dưới, rồi lớp này ẩn hẳn.
   25/11 13:44 thầy: sân buổi sáng, cây xanh, không băng đầu, thêm hiệu ứng khi kéo.
   25/11 16:18 thầy (xem từng chỗ có ghi "16:18"): dây ở giữa không được tách rời; mỗi bên 4 bạn, 2 nam 2 nữ; Đội 1 và Đội 2 đảo vị
     trí, có nút đổi bên trong Cài đặt; chỉ còn 2 cây đuốc thấp, to, đứng sát hai đội; mỗi câu một kiểu kéo; đội thắng 2 bạn nữ
     ôm nhau, 2 bạn nam nhảy kiểu "siu", đội thua buồn; đội thắng thắp đuốc rồi tới đội kia.
     16:27: tên trò chơi là "Ngọn đuốc tri thức".
   25/11 17:19 thầy (xem từng chỗ có ghi "17:19"): chỉ sau câu 5 đội thắng mới nhảy mừng; mỗi đội 2 nữ đứng đầu, 2 nam đứng cuối,
     một đội áo thể dục, một đội áo vàng bán trú; đuốc kiểu trò Rước đuốc, đứng ngang hông mỗi đội; thắp đuốc thì sách, kí hiệu toán
     bay lên; câu 5 hiện dòng chữ vàng "Sức mạnh tình bạn" rồi mới kéo.
   25/11 17:34 thầy: dòng chữ vàng lấp lánh "Đội n chiến thắng"; bấm Tiếp theo thì đội thắng sang bắt tay đội kia, hai đuốc cùng sáng,
     sách, số pi, công thức bay về số 51, hiện báo tường.
   25/11 18:22 thầy (xem từng chỗ có ghi "18:22"): đội thắng thì hai bạn nữ ôm nhau, một bạn nam nhảy kiểu "siu", một bạn nam giơ tay
     phải thả tim; cả bốn bạn đội thắng sang bắt tay bốn bạn đội kia; tri thức bay lên gồm số pi, định lí Thalès, định lí Pythagore,
     chu vi, diện tích, sách, bút, thước, chân dung Pythagore và Thalès.
   Mọi hình là hàm của thời gian (ve(t)): vào lại một bước (tải lại trang, lùi) thì hiện ngay trạng thái cuối của bước đó.
   Luật tính nấc: RD.keoCo trong du-lieu.js. vt dương = Đội 1 đang dẫn = dây lệch về bên Đội 1 đứng (mặc định Đội 1 bên PHẢI). */
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
  const PXN = 20;                                   // mỗi nấc dây trượt bấy nhiêu điểm ảnh
  const GND = 826, KHE = 160;                       // vạch chân hai đội; khe giữa hai mép trong của hai hình đội
  // Hình hai đội xếp theo ĐỘI. 25/11 16:18 thầy Thịnh: "Hình ảnh đổi thành mỗi bên có 4 bạn thôi nhé. 2 nam 2 nữ mỗi bên."; 17:19: "xếp 2
  //   bên thì 2 nữ đứng đầu, 2 nam đứng cuối, một bên áo thể dục, một bên áo vàng đồng phục bán trú nhé". Đội 1 mặc áo thể dục
  //   (hinh/d1-<tư thế>.webp), Đội 2 mặc áo vàng bán trú (hinh/d2-…): tôi chọn như vậy cho hợp màu xanh, cam của hai đội trên bảng (thầy
  //   chưa nói đội nào mặc áo nào). Mỗi đội 7 tư thế cùng một khung (w × h điểm ảnh gốc, chân ở vạch base, thu theo s). Hình nào cũng vẽ ở
  //   hướng "đứng bên trái" (các bạn quay mặt sang phải, mép trong là mép phải); đội đứng bên phải thì trang lật hình lại, nên bấm "Đổi
  //   bên" thì áo đi theo đội. nam: chỗ sợi dây chui ra khỏi nắm tay của bạn đứng trong cùng [cách mép trong của hình, cách mép trên] (tư
  //   thế không cầm dây thì không có): trong hình, khúc dây từ nắm tay đó ra mép đã xoá, trang tự vẽ sợi dây nối thẳng từ tay bên này sang
  //   tay bên kia. vanH: chiều cao dải vân dây hinh/day-<k>.webp (cắt từ chính sợi dây trong hình).
  //   duoc: cây đuốc của đội cắm ở khe giữa hai bạn nam, cách mép ngoài của hình bấy nhiêu phần bề rộng.
  //   25/11 18:22 thầy xem bản 17:34 rồi sửa: "hai bạn nữ ôm nhau là đẹp rồi, nhưng mà hai bạn nam á, thì một bạn là nhảy cái kiểu siu của
  //   ronaldo [...] Một bạn thì giơ ngón tay hình trái tim [...] Kiểu giơ tay phải đằng trước hình trái tim á, thả tim á" (hình "thang" vẽ
  //   lại: bạn nam ngoài cùng nhảy "siu", bạn nam thứ hai giơ tay phải thả tim, hai bạn nữ ôm nhau) và "bắt tay thì cả bốn bạn bên này qua
  //   bắt bốn bạn bên kia". Nên tư thế "bat" cả đội (chỉ bạn đứng đầu chìa tay) bỏ đi, thay bằng hình TỪNG BẠN đứng nghiêng chìa tay
  //   (hinh/<k>-b0..b3.webp, b0 là bạn nam ngoài cùng, b3 là bạn nữ đứng đầu) để bốn bạn đi sang, mỗi bạn bắt tay một bạn đội kia.
  //   ban: mỗi bạn [rộng, cao, đế giày cách mép trên, giữa hai bàn chân cách mép trái, đầu bàn tay chìa ra (cách mép trái, cách mép trên),
  //   mép trái của bạn trong khung hình đội lúc cả đội đứng thành hàng].
  //   25/11 19:25 thầy xem bản 18:22: "Cân chỉnh lại tỷ lệ của các [bạn] học sinh cho ngang ngang nhau nhé". Nên hình đội thắng, hình
  //   đội thua và hình từng bạn chìa tay làm lại cho các bạn cao bằng nhau: bạn nào đứng thẳng cũng cao 284 điểm ảnh trên màn hình
  //   (bản 18:22 các bạn cao từ 263 đến 293). dinh: hình đội thắng cao hơn khung chung bấy nhiêu điểm ảnh ở phía trên (bạn nhảy "siu").
  //   25/11 22:12 thầy xem bản 5, gửi ảnh đội áo vàng hạ người cầm dây ngang hông: "cái hình để dây này chỉnh lại là để dây lên vai nha kéo
  //   nha". Hình "ha" của đội áo vàng (d2-ha.webp) vẽ lại: cả bốn bạn quay lưng về phía đội bạn, vắt dây qua vai, chúi người kéo; sợi dây
  //   chui ra sau bím tóc bạn đứng trong cùng (nam.ha mới). dayTT: sợi dây trong hình của tư thế đó dày bao nhiêu điểm ảnh gốc khi khác
  //   vanH (khúc dây trang tự vẽ thu theo cho khít); chanTT: chỗ bàn chân của tư thế đó khi khác CHAN_F. Hình "ha" của đội áo thể dục
  //   (ngả người ra sau, dây ngang ngực) thầy không nhắc tới: giữ nguyên.
  //   27/11/2026 10:45 thầy Thịnh (gửi ảnh đội áo vàng vắt dây qua vai): "cái dây bị lỗi mỗi bạn cầm một dây nè, chỉnh lại là bạn để tay lên
  //   dây rồi kéo á." Trong hình vắt vai, dây từ vai mỗi bạn vòng xuống nắm tay rồi hết ở đó (đầu dây lòi ra dưới nắm tay), nên nhìn như mỗi
  //   bạn cầm một sợi riêng. Nên d2-ha.webp về lại hình của bản 4 (25/11): bốn bạn hạ người, cả bốn nắm chung một sợi dây bằng hai tay;
  //   nam.ha của hình đó, bỏ dayTT và chanTT của hình vắt vai. Hình hạ người cao 210 đến 219 điểm ảnh trên sân, đội áo thể dục "ha" phóng
  //   1,15 lần cao 205 đến 225: hai đội vẫn cân.
  //   11:16 thầy xem bản 16: "Cho cái dây nơ ngắn lại, tôi muốn dây để lên vai nhưng vẽ hợp lí hơn". Nên (bản 17) d2-ha.webp lại là hình
  //   vắt dây qua vai của 25/11 22:12, nhưng sửa cho dây liền một sợi: dây từ giữa sân vắt qua vai bạn đứng trong cùng, vòng xuống hai
  //   nắm tay, từ nắm tay chạy lên vai bạn đứng trước, cứ thế tới bạn cuối cùng (bạn này giữ đuôi dây như cũ). Bỏ khúc dây cũ chạy ngang
  //   dưới cằm ba bạn và ba đầu dây cụt dưới nắm tay (cách làm: hinh-day-vai-ban-17/sua17.py trong thư mục dự án). Khúc dây chui ra sau
  //   bím tóc và bàn chân giữ y như hình vắt vai cũ, nên nam.ha, dayTT, chanTT lấy lại số của hình đó.
  //   27/11/2026 6:54 thầy Thịnh: "sợi dây của đội áo thể dục đang cầm thì nhỏ hơn bên áo vàng." Đo: dây áo thể dục trên sân dày khoảng
  //   6,5 điểm ảnh, dây áo vàng 8,5. Nên sợi dây trong 4 hình cầm dây của đội áo thể dục (d1-keo, -truot, -quay, -ha) và dải vân day-d1
  //   giãn theo chiều đứng 1,35 lần (vân xoắn giữ nhịp cũ, phần khác của hình giữ nguyên; cách làm: thu/day-to-hon.py trong thư mục dự
  //   án), dải vân cao 16 thành 22 hàng: vanH 16 thành 22.
  //   27/11/2026 9:53 thầy Thịnh (gửi ảnh đội áo vàng đang kéo): "trò kéo co học sinh 2 bên nhìn không cân, bên đồ thể dục nhỏ hơn bên áo
  //   vàng. chỉnh lại nhé cho 2 bên cân đối." Đo trên sân (điểm ảnh màn hình): đầu các bạn hai đội to bằng nhau, đứng thẳng cao bằng nhau
  //   (284), nhưng lúc cầm dây đội áo thể dục ngả người nhiều hơn nên thấp hơn: đỉnh đầu cách mặt sân "keo" 245 / 268 (áo vàng), "truot"
  //   242 / 271, "quay" 244 / 264, "ha" 187 / 241 (hạ người). Nên bốn hình cầm dây của đội áo thể dục phóng to quanh chân (gốc 50% 97% của
  //   khung) toTT lần: 1,1 ("ha" 1,15, vẫn là dáng hạ người); hình đứng (thắng, thua, từng bạn bắt tay) giữ nguyên. Sợi dây, vết nứt, bụi
  //   tính theo cỡ đã phóng.
  const HINH = [
    { k: "d1", w: 1175, h: 543, base: 529, s: .62, dinh: 0, nam: { keo: [94, 297.5], truot: [91, 298.2], quay: [96, 296.2], ha: [144, 378] }, vanH: 22, duoc: .225, toTT: { keo: 1.1, truot: 1.1, quay: 1.1, ha: 1.15 },
      ban: [[202, 465, 461, 67.5, 197, 198.5, 95.5], [204, 465, 460, 67, 199, 195, 346.5], [218, 466, 462, 76, 213, 189, 591.5], [241, 466, 461, 97.5, 236, 187, 829.5]] },
    { k: "d2", w: 1187, h: 493, base: 487, s: .585, dinh: 12, nam: { keo: [163, 216.8], truot: [150, 222.2], quay: [147, 226.5], ha: [198.5, 184.2] }, vanH: 21, dayTT: { ha: 14.4 }, chanTT: { ha: [.065, .294, .532, .736] }, duoc: .205,
      ban: [[213, 492, 487, 70.5, 208, 184, 76.5], [209, 493, 488, 78, 205, 192.5, 355], [230, 494, 489, 88.5, 225, 183, 626], [227, 493, 488, 81.5, 222, 182.5, 913]] }
  ];
  const TU_THE = ["keo", "truot", "quay", "ha", "thang", "thua"];
  const toTT = (d, p) => (HINH[d].toTT && HINH[d].toTT[p]) || 1;      // hình tư thế p của đội d phóng bấy nhiêu lần (27/11 9:53)
  const BEN_O = [null, null];                       // khung hình của đội đang đứng bên trái, bên phải (lúc dây ở vạch giữa): tinhO() đặt lại mỗi lần đổi bên
  const DAY_DAT = GND - 5;                          // dây nằm dưới đất (lúc hai đội buông dây)
  const DAU_Y = 556;                                // ngang đỉnh đầu các bạn (đặt bóng tiếng hò)
  const BUI_F = [.07, .3, .53, .76];                // bụi dưới chân từng bạn: cách mép ngoài của khung hình bao nhiêu phần bề rộng
  const VUT = 10, HOA = 26;
  const LA_O = [[120, 200], [300, 150], [470, 260], [700, 180], [820, 300], [620, 330], [1420, 220], [1560, 180], [1700, 260], [1840, 200], [1300, 330], [230, 330]];
  const LA_NEN = [[210, 160, 9, 1], [760, 120, 11, 6], [1500, 150, 10, 3.5], [1760, 190, 12.5, 9]];   // trái, trên, giây một vòng, lệch pha
  const HO_THANG = ["HÒ DÔ!", "KÉO!", "HÒ DÔ TA!", "KÉO MẠNH!"], HO_THUA = ["GIỮ CHẶT!", "CỐ LÊN!"];
  const HOA_MAU = ["", "#f2b531", "#ffffff", "#e23d3d", "#5fb04a"];
  const ngau = (j, k) => { const x = Math.sin(j * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };   // số "ngẫu nhiên" cố định theo thứ tự
  // mặt đất khi kéo (25/11 20:16 thầy Thịnh: "bên nào kéo mạnh quá thì nứt đất ..., bên nào bị kéo giật quá thì bụi bay lên"):
  //   vết nứt + sỏi văng + vòng chấn động dưới chân đội đang kéo, vệt trượt + cụm bụi bốc lên ở chân đội bị kéo
  const CHAN_F = [[.07, .3, .51, .73], [.065, .25, .445, .65]];      // bàn chân trước của từng bạn (theo ĐỘI): cách mép TRONG của khung hình bao nhiêu phần bề rộng
  let TT_BEN = ["keo", "keo"];                      // tư thế đang vẽ của đội đứng mỗi BÊN (ve() ghi): tư thế có chanTT thì lấy chỗ bàn chân ở đó
  const chanF = (b, k) => { const d = ben(b), H = HINH[d], v = H.chanTT && H.chanTT[TT_BEN[b]]; return (v || CHAN_F[d])[k]; };
  const ktBen = b => toTT(ben(b), TT_BEN[b]);       // cỡ phóng của hình đang vẽ ở bên b
  const phongX = (b, x) => { const O = BEN_O[b], c = O.x + O.w / 2; return c + (x - c) * ktBen(b); };      // chỗ x trong khung bên b sau khi phóng quanh giữa khung
  const NUT = 14, SOI = 24, BUI_CAO = 8;              // 2 vết nứt mỗi nấc (nhiều nhất 7 nấc); sỏi và bụi chia hai lượt theo nấc chẵn, lẻ
  // cụm bụi vẽ kiểu mây: mấy hình tròn chồng nhau, mặt dưới sẫm, thân màu đất, phía trên sáng
  const mayBui = (w, h, ds) => {
    const vong = (dx, dy, k) => ds.map(c => '<circle cx="' + (c[0] + dx) + '" cy="' + (c[1] + dy) + '" r="' + (c[2] * k).toFixed(1) + '"/>').join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><g fill="#b3925f">' + vong(0, 5, 1) + '</g><g fill="#d9c298">' + vong(0, 0, 1) + '</g><g fill="#eee2c6">' + vong(-5, -6, .62) + "</g></svg>";
  };
  const BUI_CAO_SVG = mayBui(180, 116, [[52, 70, 32], [96, 52, 40], [136, 72, 28], [74, 82, 24], [116, 84, 24]]);
  const BUI_THAP_SVG = mayBui(124, 60, [[28, 36, 18], [58, 30, 24], [92, 36, 18], [44, 42, 14], [76, 42, 14]]);
  const NUT_SVG = [0, 1, 2].map(v => {              // ba kiểu vết nứt: các khe toả ra từ một điểm (to ở gốc, nhọn dần), vài vệt ngang nối các khe; đã ép dẹt theo mặt sân
    const cx = 115, cy = 38, n = 5 + (v % 2), giua = [], so = p => p[0].toFixed(1) + " " + p[1].toFixed(1), duong = P => P.map((p, i) => (i ? "L" : "M") + so(p)).join("");
    let khe = "", loi = "", ngang = "";
    const nhanh = (x, y, g, dai, day, hat) => {
      const P = [[x, y]], T = [], D = [];
      for (let k = 1; k <= 4; k++) {
        g += (ngau(hat + k, v * 7 + 3) - .5) * .8;
        const q = P[k - 1], sn = Math.sin(g);
        P.push([q[0] + Math.cos(g) * dai / 4, q[1] + sn * dai / 4 * .42 * (sn > 0 ? 1.25 : .8)]);
      }
      for (let k = 0; k <= 4; k++) {
        const a0 = P[Math.max(0, k - 1)], a1 = P[Math.min(4, k + 1)], dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.sqrt(dx * dx + dy * dy) || 1, w = day * (1 - k / 4) / 2;
        T.push([P[k][0] - dy / L * w, P[k][1] + dx / L * w * .7]); D.push([P[k][0] + dy / L * w, P[k][1] - dx / L * w * .7]);
      }
      khe += duong(T.concat(D.reverse())) + "Z"; loi += duong(P);
      return { P: P, g: g };
    };
    for (let a = 0; a < n; a++) {
      const dai = 60 + 50 * ngau(a, v * 7 + 2), R = nhanh(cx, cy, (a + .15 + ngau(a, v * 7 + 1) * .6) / n * Math.PI * 2, dai, 7 + 3 * ngau(a, v * 7 + 6), a * 4);
      giua.push(R.P[2]);
      if (ngau(a, v * 7 + 4) > .4) nhanh(R.P[2][0], R.P[2][1], R.g + (ngau(a, v * 7 + 5) > .5 ? .9 : -.9), dai * .42, 3.6, 40 + a * 4);
    }
    giua.forEach((p, a) => {
      if (ngau(a, v * 7 + 8) < .3) return;
      const q = giua[(a + 1) % n];
      ngang += "M" + so(p) + "L" + ((p[0] + q[0]) / 2 + (ngau(a, v * 7 + 9) - .5) * 12).toFixed(1) + " " + ((p[1] + q[1]) / 2 + (ngau(a, v * 7 + 10) - .5) * 5).toFixed(1) + "L" + so(q);
    });
    return '<svg viewBox="0 0 230 96" width="230" height="96" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round">' +
      '<g transform="translate(0 2.6)"><path d="' + khe + '" fill="rgba(255,247,226,.7)"/><path d="' + ngang + '" fill="none" stroke="rgba(255,247,226,.6)" stroke-width="2.2"/></g>' +
      '<path d="' + khe + '" fill="#33241a"/><path d="' + ngang + '" fill="none" stroke="#3b2a1c" stroke-width="1.7"/>' +
      '<path class="sang" d="' + loi + '" fill="none" stroke="#ffd66b" stroke-width="1.5"/></g><ellipse cx="115" cy="38.5" rx="9" ry="4.4" fill="#2a1d14"/></svg>';
  });
  // dải lụa đỏ buộc giữa dây (thay đèn lồng của bản ban đêm)
  const DAI_LUA = '<svg viewBox="0 0 90 150" aria-hidden="true"><path d="M46 12 C54 40 66 62 64 96 C63 110 68 122 75 133 L60 128 L54 141 C52 120 50 100 50 80 C50 56 48 34 42 14 Z" fill="#c21d1d"/>' +
    '<path d="M38 12 C28 38 16 66 20 100 C22 116 18 128 11 140 L26 132 L34 145 C38 126 36 104 38 84 C40 58 44 36 46 14 Z" fill="#e22b2b"/>' +
    '<path d="M35 22 C28 44 22 68 25 98" fill="none" stroke="#ff8a78" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>' +
    '<path d="M45 12 C30 -3 10 1 14 14 C17 25 34 21 45 12 Z M45 12 C60 -3 80 1 76 14 C73 25 56 21 45 12 Z" fill="#ea3a3a" stroke="#a31515" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<ellipse cx="45" cy="12" rx="9" ry="8" fill="#f04a4a" stroke="#a31515" stroke-width="1.6"/></svg>';
  // 26/11 11:09 thầy Thịnh (gõ bằng giọng nói ở luồng "Thảo luận giáo án"): "Bạn thử thiết kế cho tôi cái sợi dây kéo co á, mà nó có hình ảnh
  //   liên quan đến môn toán coi. [...] bạn thử thiết kế vậy coi, cho tôi hình mẫu trước đi". BẢN MẪU, thầy chưa chọn: ba kiểu hình Toán gắn
  //   ở khúc dây giữa hai đội (khúc dây trang tự vẽ; khúc dây trong tay các bạn là hình vẽ sẵn nên không đổi được), chọn bằng ?day= trên
  //   địa chỉ: "co" = bốn lá cờ nhỏ treo trên dây mang bốn phép tính + − × ÷ (mặc định của bản mẫu); "hinh" = bốn hạt xâu vào dây hình
  //   vuông, tam giác đều, hình tròn, lục giác đều; "thuoc" = khúc dây giữa bọc một dải thước đo, mỗi vạch cách nhau đúng một nấc dây
  //   (PXN), số đếm từ dải lụa đỏ ra hai phía; "khong" = dây trơn như bản 8.
  //   27/11/2026 (bản 15) mặc định là "no": cái nơ giữa dây (bản 16: nơ vô cực NO_VC bên dưới); các kiểu cũ vẫn mở được bằng ?day=.
  const KIEU_DAY = (/[?&]day=(no|co|hinh|thuoc|khong)\b/.exec(location.search) || [])[1] || "no";
  const TOAN_O = [-102, -34, 34, 102];              // bốn hình cách dải lụa bấy nhiêu điểm ảnh dọc theo sợi dây
  const TOAN_MAU = [["#f6c544", "#b07a12", "#fff0a8"], ["#72c56b", "#3b8a3a", "#c9f0b4"], ["#5fbdea", "#2a7fb5", "#cdefff"], ["#b892ea", "#7550b8", "#eadcff"]];   // mặt, viền, vệt sáng
  const PHEP = ["M23 17 V37 M13 27 H33", "M13 27 H33", "M15.6 19.6 L30.4 34.4 M30.4 19.6 L15.6 34.4", "M13 27 H33 M23 18 h.01 M23 36 h.01"];      // + − × ÷
  const CO_TOAN = TOAN_MAU.map((m, i) => '<svg viewBox="0 0 46 62" aria-hidden="true"><path d="M3 3 H43 V32 L23 57 L3 32 Z" fill="' + m[0] + '" stroke="' + m[1] + '" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M4.2 4.2 H41.8 V10.5 H4.2 Z" fill="' + m[1] + '" opacity=".5"/><path d="M8.5 15 V30.5 L15.5 39.5" fill="none" stroke="' + m[2] + '" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>' +
    '<g fill="none" stroke-linecap="round"><path d="' + PHEP[i] + '" stroke="' + m[1] + '" stroke-width="9"/><path d="' + PHEP[i] + '" stroke="#fff" stroke-width="4.8"/></g></svg>');
  const HAT_DANG = ['<rect x="7" y="7" width="34" height="34" rx="4.5"', '<path d="M24 4.5 L44.5 40 H3.5 Z"', '<circle cx="24" cy="24" r="18.5"', '<path d="M43.5 24 L33.75 40.9 H14.25 L4.5 24 L14.25 7.1 H33.75 Z"'];
  const HAT_SANG = ["M12.5 30 V13.5 H24", "M15 34 L24 17.5", "M11.5 24 A12.5 12.5 0 0 1 24 11.5", "M11.5 24 L17.5 13.5 H25"];
  const HAT_TOAN = TOAN_MAU.map((m, i) => '<svg viewBox="0 0 48 48" aria-hidden="true">' + HAT_DANG[i] + ' fill="' + m[0] + '" stroke="' + m[1] + '" stroke-width="2.8" stroke-linejoin="round"/>' +
    '<path d="' + HAT_SANG[i] + '" fill="none" stroke="' + m[2] + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></svg>');
  // 27/11/2026 9:53 thầy Thịnh: "chỉnh lại 4 cái dấu + - x : thành cái nơ đi nhưng cái nơ đó có kí hiệu + - x : á. tại để 4 cái thẻ + - x :
  //   như vậy thì nó bị lỗi kéo giật về." 9:55: "ý là trong phiên bản hồi nãy vì tôi nói là đội thắng kéo cả 4 dấu + - x : về phía mình á
  //   nên ví dụ đội 2 thắng nhưng dấu cộng vẫn ở phía đội 1 thì đội 2 phải giật về thêm 1 cái. nên giờ chuyển thành cái nơ cho khỏi bị"
  //   9:56: "với đổi luật luôn đưa 4 dấu cộng trừ nhân chia về phía đội mình là được." Bản 15 (không đưa lên trang): bỏ bốn lá cờ, giữa
  //   dây một cái nơ to (khung 128 × 168) có bốn huy hiệu + − × ÷ thả dưới nút nơ.
  //   10:45 thầy xem bản 15: "thôi bỏ dấu cộng trừ nhân chia đi, đổi lại thành cái nơ có kích cỡ như ở bản đầu tiên nhưng vẽ giống kí
  //   hiệu vô cực." Nên (bản 16) không còn dấu + − × ÷ nào; cái nơ cùng khung, cùng cỡ với dải lụa đỏ đầu tiên (DAI_LUA ở trên, bản 4 đến 8:
  //   khung 90 × 150, nút nơ ở (45, 12), hai đuôi y như cũ), còn hai quai nơ vẽ thành kí hiệu vô cực ∞: một dải lụa đỏ uốn hình số 8 nằm
  //   ngang, hai nét giao nhau ở nút nơ, lòng hai quai để trống nên nhìn qua thấy sợi dây. Nơ đung đưa như dải lụa cũ (kcDen). Nút nơ nằm
  //   đúng vạch giữa lúc dây ở 0 nấc (bản 15), nên dây lệch về bên nào là nút nơ sang hẳn bên đó, không kéo thêm.
  //   11:16 thầy xem bản 16: "Cho cái dây nơ ngắn lại, tôi muốn dây để lên vai nhưng vẽ hợp lí hơn". Nên (bản 17) hai đuôi nơ chỉ còn
  //   dài tới khoảng y = 86 trong khung (đuôi cũ tới y = 145), vẫn xẻ chữ V ở cuối; hai quai ∞ và nút nơ giữ y như bản 16.
  const VO_CUC = "M45 12 C50.5 4.5 56 -1.5 63 -1.5 C71.5 -1.5 78 4.5 78 12 C78 19.5 71.5 25.5 63 25.5 C56 25.5 50.5 19.5 45 12 " +
    "C39.5 4.5 34 -1.5 27 -1.5 C18.5 -1.5 12 4.5 12 12 C12 19.5 18.5 25.5 27 25.5 C34 25.5 39.5 19.5 45 12 Z";      // ∞, tâm ở nút nơ
  const NO_VC = '<svg viewBox="0 0 90 150" aria-hidden="true">' +
    '<path d="M46 12 C53 28 63 40 63 56 C63 63 66 69 71 75 L60 72 L55 81 C52 70 50 60 50 50 C50 36 47 24 42 14 Z" fill="#c21d1d"/>' +
    '<path d="M38 12 C30 28 19 44 20 60 C21 68 18 74 13 80 L25 77 L32 86 C36 76 36 68 38 58 C40 42 44 28 46 14 Z" fill="#e22b2b"/>' +
    '<path d="M35 22 C30 34 25 46 25 60" fill="none" stroke="#ff8a78" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>' +
    '<g fill="none" stroke-linejoin="round"><path d="' + VO_CUC + '" stroke="#a31515" stroke-width="10.5"/><path d="' + VO_CUC + '" stroke="#ea3a3a" stroke-width="7.4"/>' +
    '<path d="M51 16.5 C56 22.5 59.5 23.6 63 23.6 C69.5 23.6 74.6 19.6 75.8 14.6 M39 16.5 C34 22.5 30.5 23.6 27 23.6 C20.5 23.6 15.4 19.6 14.2 14.6" stroke="#b81d1d" stroke-width="2" stroke-linecap="round" opacity=".75"/>' +
    '<path d="M51 7.5 C55.5 2.2 59.5 .4 63 .4 C68.5 .4 72.8 3 74.9 7 M39 7.5 C34.5 2.2 30.5 .4 27 .4 C21.5 .4 17.2 3 15.1 7" stroke="#ff9a8a" stroke-width="2.2" stroke-linecap="round" opacity=".9"/></g>' +
    '<ellipse cx="45" cy="12" rx="9" ry="8" fill="#f04a4a" stroke="#a31515" stroke-width="1.6"/><path d="M40.3 8.3 C42.3 6.6 45.4 6.2 48.2 7.4" fill="none" stroke="#ffb1a3" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const NEO = [45, 12];                             // nút nơ (hay nút dải lụa cũ) trong khung #kcNeo
  const THUOC_CAO = 34, THUOC_DAI = 240;            // dải thước đo: cao, dài nhất mỗi nửa (11 vạch số)
  const thuocNen = phai => {                        // nửa bên phải dải lụa: số tăng dần sang phải kể từ mép trái; nửa bên trái thì ngược lại
    let h = '<svg xmlns="http://www.w3.org/2000/svg" width="' + THUOC_DAI + '" height="' + THUOC_CAO + '" viewBox="0 0 ' + THUOC_DAI + " " + THUOC_CAO + '"><rect x="-6" y="1.6" width="' + (THUOC_DAI + 12) + '" height="' + (THUOC_CAO - 3.2) + '" fill="#fff6d2" stroke="#b3560f" stroke-width="2.6"/><path d="M-6 ' + (THUOC_CAO - 6.5) + " H" + (THUOC_DAI + 6) + '" stroke="#f0d9a0" stroke-width="5"/>';
    for (let k = 0; k < 12; k++) {
      const x = phai ? k * PXN : THUOC_DAI - k * PXN, x2 = phai ? x + PXN / 2 : x - PXN / 2;
      if (k) h += '<path d="M' + x + ' 3 v10" stroke="#b3560f" stroke-width="2.2"/><text x="' + x + '" y="' + (THUOC_CAO - 6) + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="' + (k > 9 ? 12.5 : 15) + '" fill="#6b2a00">' + k + "</text>";
      h += '<path d="M' + x2 + ' 3 v5.5" stroke="#b3560f" stroke-width="1.5"/>';
    }
    return 'url("data:image/svg+xml,' + encodeURIComponent(h + "</svg>") + '")';
  };
  // 25/11 17:19 thầy Thịnh: "đuốc thiết kế giống trò rước đuốc nhưng đứng ngang hông mỗi đội không đứng đằng sau" (bản 16:18 là đuốc đài
  //   sen đứng ở đầu ngoài mỗi đội, thầy chê). Dùng lại cây đuốc của trò Rước đuốc (../anh/duoc.webp: chân đá, thân đồng thắt nơ đỏ, chảo
  //   xếp củi), mỗi đội một cây, cắm ngay bên hông đội: trong hàng 4 bạn, ở khe giữa hai bạn nam (HINH.duoc), lùi vào trong sân một chút
  //   nên các bạn che bớt thân đuốc, chảo củi nhô lên trên đầu. Cách hiểu "ngang hông" này là của tôi, thầy chưa duyệt. Đuốc đứng
  //   yên trên sân; đuốc bên nào là của đội đang đứng bên đó. Đuốc không đứng chính giữa đội để chừa chỗ phía trong cho dòng chữ vàng
  //   "ĐỘI n CHIẾN THẮNG" (17:34).
  // 25/11 19:25 thầy: "căn chỉnh lại các cái tỷ lệ chiều cao người, rồi ngọn đuốc nhá, cho đẹp". Bản 18:22 đuốc cao 360, các bạn cao
  //   chừng 270, chảo củi nhỏ và ở tít trên cao. Nay dùng hinh/duoc.webp: vẫn là cây đuốc của trò Rước đuốc nhưng cắt bớt hai khúc thân
  //   trơn (133 × 368), cao 320 nên chảo củi to hơn trước và nằm ngay trên đầu các bạn (các bạn cao 284). Cách cân này là của tôi.
  // 26/11 12:20 thầy Thịnh: "nơ trên 2 ngọn đuốc thì đổi thành logo của trường phan tây hồ, chỉnh logo sao cho nhìn nó phù hợp với 2 ngọn đuốc nhé".
  //   Hình cây đuốc hinh/duoc-2.webp đã xoá nơ đỏ; logo trường nằm trong một huy hiệu có vành đồng cho hợp cây đuốc.
  // 26/11 13:29 thầy: "tôi gửi bạn 2 cái logo mà sao bạn làm có 1 cái logo vậy. bên ngọc đuốc trái 1 logo, bên ngọn phải 1 logo còn lại".
  //   Đuốc bên trái: logo cánh chim có chữ tên trường (hình thứ nhất thầy gửi); đuốc bên phải: huy hiệu tròn (hình thứ hai). Bên nào logo nào
  //   là tôi chọn theo thứ tự thầy gửi. Logo cánh chim dài nên huy hiệu bên trái hình bầu dục nằm ngang, rộng gần bằng chảo củi cho chữ tên
  //   trường còn đọc được. Hai huy hiệu gắn ngay mặt trước chảo củi (bản mẫu trước gắn dưới chảo, ngang đầu các bạn nên hay bị đầu các bạn
  //   che mất). HUY[b]: [tệp hình, rộng, cao] trên màn hình của đuốc bên b; HUY_Y: tâm huy hiệu cách đỉnh hình cây đuốc.
  const HUY = [["logo-canh.webp", 108, 67], ["logo-truong.webp", 78, 78]], HUY_Y = 84;
  // 26/11 12:20 thầy Thịnh: "đội nào thắng câu đó thì bảng của đội đó sẽ rực lửa xung quanh, nếu thắng liên tục thì lửa rực sáng hơn".
  // 26/11 13:29 thầy xem bản mẫu rồi sửa: "làm cho cái khung này sáng lên thôi không cần lửa". Nay không còn lưỡi lửa, tàn lửa: khung bảng
  //   của đội thắng câu sáng lên (viền vàng và quầng sáng quanh khung, lớp sang1, sang2, sang3: thắng 1 câu, 2 câu liền, từ 3 câu liền trở
  //   lên thì sáng dần). Câu hòa: không khung nào sáng. Tám nhà khoa học cổ vũ (12:20) cũng đã bỏ theo lời thầy 13:29 ("bỏ mấy nhà khoa
  //   học cổ vũ đi"); hình còn cất ở tệp dự án keo-co/nha-khoa-hoc-26-11/.
  const DUOC = [{ x: 345 }, { x: 1575 }], DUOC_H = 320, DUOC_W = DUOC_H * 133 / 368, DUOC_DAY = GND - 52;   // tâm ngang (tinhO() đặt lại), chiều cao, rộng, chân đuốc
  const MIENG = DUOC_DAY - DUOC_H + 37;             // ngang đống củi trong chảo: chân ngọn lửa
  const luaTam = b => [DUOC[b].x, MIENG - 66];      // tâm ngọn lửa của đuốc bên b
  // 25/11 17:19 thầy: "đội nào đối đuốc thì có hoạt ảnh tri thức bay lên như là cuốn sách, kí hiệu toán học etc." (thay ánh lửa xoắn ốc của
  //   bản 16:18); 17:34: "ngọn đuốc đó sẽ có [sách] hoặc là số [pi] hoặc là các cái định lý bay lên" và "những cái công thức toán học á,
  //   số [pi] rồi công thức chu vi diện tích gì đó cùng bay lên, xong cùng bay về phía cái số 51" (máy ghi giọng nói thành "sắt", "số bi").
  //   Lúc thắp: TRI hình (quyển sách, số π, kí hiệu toán, công thức chu vi và diện tích) nối nhau bay lên từ ngọn lửa, vừa bay vừa lượn
  //   và lớn dần, trong TRI_DAI giây; sau đó đuốc còn cháy thì TRI_NEN hình bay lên thong thả. Lúc bay về số 51: mỗi hình bay TRI_BAY giây.
  // 25/11 18:22 thầy nêu rõ các hình: "hình ảnh tri thức cho tôi cái hình ảnh của số [pi] nè. Rồi định lý Thales nè. Rồi định lý Pythagore,
  //   chu vi, diện tích, rồi hình cuốn sách, hình cây bút, hình cây thước, cho toàn bộ tất cả hình ảnh của những gì liên quan đến tri thức
  //   luôn, nó bay lên. Hoặc là hình mặt của Pythagore, hình mặt của Thales." Nên TRI_HINH có: số π; hình vẽ định lí Pythagore (ba hình vuông
  //   dựng trên ba cạnh tam giác vuông, kèm a² + b² = c²); hình vẽ định lí Thalès (tam giác ABC có MN song song BC; sách Toán 8 viết
  //   "Thalès"); công thức chu vi, diện tích; quyển sách, cây bút chì, cây thước, ê ke, com pa; chân dung Pythagore và Thalès.
  const TRI = 20, TRI_NEN = 8, TRI_CAO = 262, TRI_SONG = 2.3, TRI_CACH = .42, TRI_DAI = TRI_SONG + (TRI - 1) * TRI_CACH, TRI_VONG = 3.8, TRI_BAY = .62;   // TRI_CACH: hình sau ra sau hình trước bấy nhiêu giây
  const NET = ' stroke="#b3560f" stroke-linejoin="round" stroke-linecap="round"';
  const SACH = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 12 C19 8 11 7 4 9 V37 C11 35 19 36 24 40 C29 36 37 35 44 37 V9 C37 7 29 8 24 12 Z" fill="#fff6d2" stroke="#b3560f" stroke-width="2.8" stroke-linejoin="round"/><path d="M24 12 V40" stroke="#b3560f" stroke-width="2.4"/><path d="M9 15 C13 14 17 15 20 17 M9 21 C13 20 17 21 20 23 M9 27 C13 26 17 27 20 29 M28 17 C31 15 35 14 39 15 M28 23 C31 21 35 20 39 21 M28 29 C31 27 35 26 39 27" stroke="#d99a2b" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  const BUT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 41 L11 28 L31 8 L40 17 L20 37 Z" fill="#ffd35a"' + NET + ' stroke-width="2.8"/><path d="M31 8 L34 5 C36 3 39 3 41 5 L43 7 C45 9 45 12 43 14 L40 17 Z" fill="#ff8f7a"' + NET + ' stroke-width="2.8"/><path d="M11 28 L20 37 M27 12 L36 21" fill="none"' + NET + ' stroke-width="2.2"/><path d="M7 41 L8.8 35 L13 39.2 Z" fill="#6b2a00" stroke="#6b2a00" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const THUOC = '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-20 24 24)"><rect x="1" y="15" width="46" height="18" rx="2.5" fill="#fff6d2"' + NET + ' stroke-width="2.8"/><path d="M7 15 v8 M12 15 v5 M17 15 v8 M22 15 v5 M27 15 v8 M32 15 v5 M37 15 v8 M42 15 v5" fill="none"' + NET + ' stroke-width="1.9"/></g></svg>';
  const EKE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill-rule="evenodd" d="M6 43 V5 L44 43 Z M14.5 35 V24 L25.5 35 Z" fill="#bfe6ff"' + NET + ' stroke-width="2.8"/></svg>';
  const COMPA = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 45 C20 48 30 47 40 41" fill="none" stroke="#d99a2b" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 4.2"/><path d="M22.5 11 L10 43 M25.5 11 L38 39" fill="none" stroke="#b3560f" stroke-width="6.4" stroke-linecap="round"/><path d="M22.5 11 L10.6 41.4 M25.5 11 L37.4 37.6" fill="none" stroke="#fff6d2" stroke-width="2" stroke-linecap="round"/><path d="M24 1.5 V6" fill="none"' + NET + ' stroke-width="3"/><circle cx="24" cy="9" r="4.6" fill="#ffd35a" stroke="#b3560f" stroke-width="2.6"/></svg>';
  // định lí Pythagore: tam giác vuông cạnh 3, 4, 5 và ba hình vuông dựng trên ba cạnh (9 + 16 = 25)
  const PYTA = '<svg viewBox="4 0 48 52" aria-hidden="true"><path d="M8 20 H20 V32 H8 Z" fill="#bfe6ff"' + NET + ' stroke-width="2"/><path d="M20 32 H36 V48 H20 Z" fill="#c9f0b4"' + NET + ' stroke-width="2"/><path d="M20 20 L32 4 L48 16 L36 32 Z" fill="#ffd9a8"' + NET + ' stroke-width="2"/><path d="M20 20 L36 32 H20 Z" fill="#fff6d2"' + NET + ' stroke-width="2.4"/><path d="M20 28.4 h3.6 v3.6" fill="none" stroke="#b3560f" stroke-width="1.3"/></svg>';
  // định lí Thalès: tam giác ABC, đoạn MN song song với BC
  const CHU = ' style="font:800 8.5px/1 sans-serif;-webkit-text-stroke:0" fill="#6b2a00" stroke="#fff6d2" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" text-anchor="middle"';
  const THALES = '<svg viewBox="0 0 56 54" aria-hidden="true"><path d="M28 9 L8 46 H48 Z" fill="#fff6d2"' + NET + ' stroke-width="2.4"/><path d="M17.7 28 H38.3" fill="none" stroke="#e2452b" stroke-width="2.8" stroke-linecap="round"/><path d="M26.4 25.6 l3 2.4 -3 2.4 M26.4 43.6 l3 2.4 -3 2.4" fill="none" stroke="#b3560f" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    "<text" + CHU + ' x="28" y="7">A</text><text' + CHU + ' x="4.6" y="52">B</text><text' + CHU + ' x="51.4" y="52">C</text><text' + CHU + ' x="11.6" y="29.5">M</text><text' + CHU + ' x="44.2" y="29.5">N</text></svg>';
  const chanDung = (tep, ten) => '<img src="hinh/' + tep + '.webp" alt="" draggable="false"><b>' + ten + "</b>";
  // mỗi hình [lớp, nội dung, [rộng, cao] lúc to nhất]. Lớp "cthuc": công thức viết kiểu dễ đọc từ xa (diện tích hình chữ nhật, chu vi hình
  //   vuông, định lí Pythagore, diện tích hình bình hành, chu vi hình chữ nhật, diện tích hình vuông); "the": hình vẽ định lí có tên bên
  //   dưới; "chan": chân dung tròn có tên bên dưới. Tám hình đầu là các hình còn bay lên thong thả khi đuốc đã cháy (TRI_NEN).
  // 25/11 19:25 thầy: "các cái chữ cũng vậy, cho tỷ lệ đều nhau lại": công thức, tên định lí, tên nhà toán học cùng một cỡ chữ (32), các
  //   hình nhỏ cùng cỡ, và hình bay lên chỉ lớn dần từ 0,72 tới 1 và ra khỏi ngọn lửa mới hiện rõ (bản 18:22 lớn từ 0,5 tới 1 nên hình mới ra nhỏ xíu, hình trên cao to).
  const NHO = [80, 80], CT = [128, 40], THE = [272, 152], CHAN = [168, 154];     // cỡ đo trên trang (chữ cỡ 32, tính cả viền chữ)
  //   19:25: bốn hình to (hai hình vẽ định lí, hai chân dung) xếp cách nhau bốn hình nhỏ để không hình to nào chạm hình to nào.
  const TRI_HINH = [["", SACH, NHO], ["", "π", [48, 60]], ["the", PYTA + "<b>Định lí Pythagore</b>", THE], ["cthuc", "S = a × b", CT], ["", BUT, NHO], ["cthuc", "C = 4 × a", CT],
    ["the", THALES + "<b>Định lí Thalès</b>", [214, 152]], ["", THUOC, NHO], ["cthuc", "a² + b² = c²", [156, 40]], ["", COMPA, NHO], ["the chan", chanDung("pythagore", "Pythagore"), CHAN], ["cthuc", "S = a × h", CT],
    ["", EKE, NHO], ["", "π", [48, 60]], ["the chan", chanDung("thales", "Thalès"), [124, 154]], ["cthuc", "C = (a + b) × 2", [198, 40]], ["", SACH, NHO], ["", "÷", [42, 60]], ["cthuc", "S = a × a", CT], ["", BUT, NHO]];
  // 25/11 20:14 thầy Thịnh: "khi mà hai nhóm bắt tay nhau á, thì cái hiệu ứng của cái nhóm thứ hai á, nó sẽ hiện lên tiên đề khác với lại những
  //   cái ở bên nhóm 1 đi. Ví dụ như là tiên đề [Euclid] nè, tích phân, đạo hàm, nguyên hàm. Nói chung là bạn tìm trên mạng đó, những cái công
  //   thức toán học này bạn đưa vào hai ngọn [đuốc] sao cho hai bên đừng giống nhau." Nên mỗi đội một bộ, không hình nào có ở cả hai bộ:
  //   đuốc Đội 1 giữ bộ trên (chu vi, diện tích, Pythagore, Thalès); đuốc Đội 2 dùng TRI_HINH_2: tiên đề Euclid (qua điểm M ngoài đường thẳng a
  //   chỉ có một đường thẳng b song song với a), đạo hàm, tích phân, nguyên hàm, diện tích và chu vi hình tròn, sin² + cos² = 1, biệt thức Δ,
  //   hằng đẳng thức bình phương của một tổng, đẳng thức Euler, các kí hiệu ∑, ∞, √ và đồ thị, khối lập phương, máy tính, bàn tính, thước đo
  //   góc, hình tròn, bảng đen. Cùng thứ tự to nhỏ như bộ trên (bốn thẻ to cách nhau bốn hình nhỏ) nên xếp làn giống nhau.
  const DOTHI = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="4" width="40" height="40" rx="5" fill="#fff6d2"' + NET + ' stroke-width="2.8"/><path d="M9 37 H40 M14 41 V8" fill="none"' + NET + ' stroke-width="2"/><path d="M12 11 C17 43 31 43 38 9" fill="none" stroke="#e2452b" stroke-width="2.8" stroke-linecap="round"/></svg>';
  const KHOI = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 15 L24 6 L41 15 L24 24 Z" fill="#fff6d2"' + NET + ' stroke-width="2.6"/><path d="M7 15 V34 L24 43 V24 Z" fill="#bfe6ff"' + NET + ' stroke-width="2.6"/><path d="M41 15 V34 L24 43 V24 Z" fill="#c9f0b4"' + NET + ' stroke-width="2.6"/></svg>';
  const MAYTINH = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="4" width="30" height="40" rx="5" fill="#ffd35a"' + NET + ' stroke-width="2.8"/><rect x="14" y="9" width="20" height="9" rx="2" fill="#bfe6ff"' + NET + ' stroke-width="2"/><g fill="#b3560f"><circle cx="17" cy="25" r="2.3"/><circle cx="24" cy="25" r="2.3"/><circle cx="31" cy="25" r="2.3"/><circle cx="17" cy="32" r="2.3"/><circle cx="24" cy="32" r="2.3"/><circle cx="31" cy="32" r="2.3"/><circle cx="17" cy="39" r="2.3"/><circle cx="24" cy="39" r="2.3"/></g><circle cx="31" cy="39" r="2.6" fill="#e2452b"/></svg>';
  const BANTINH = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="7" width="38" height="34" rx="4" fill="#fff6d2"' + NET + ' stroke-width="2.8"/><path d="M5 13.5 H43 M5 24 H43 M5 34.5 H43" fill="none"' + NET + ' stroke-width="1.6"/><g stroke="#b3560f" stroke-width="1.4"><circle cx="12" cy="13.5" r="3.9" fill="#ff8f7a"/><circle cx="20" cy="13.5" r="3.9" fill="#ff8f7a"/><circle cx="36" cy="13.5" r="3.9" fill="#ff8f7a"/><circle cx="12" cy="24" r="3.9" fill="#74b6ff"/><circle cx="28" cy="24" r="3.9" fill="#74b6ff"/><circle cx="36" cy="24" r="3.9" fill="#74b6ff"/><circle cx="20" cy="34.5" r="3.9" fill="#8fd67a"/><circle cx="28" cy="34.5" r="3.9" fill="#8fd67a"/><circle cx="36" cy="34.5" r="3.9" fill="#8fd67a"/></g></svg>';
  const DOGOC = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M3 37 A21 21 0 0 1 45 37 Z" fill="#bfe6ff"' + NET + ' stroke-width="2.8"/><path d="M15 37 A9 9 0 0 1 33 37 Z" fill="#fff6d2"' + NET + ' stroke-width="2"/><path d="M24 16 V21 M9.2 22.2 L13 25.6 M38.8 22.2 L35 25.6 M15.5 17.6 L17.6 21.4 M32.5 17.6 L30.4 21.4" fill="none"' + NET + ' stroke-width="1.9"/></svg>';
  const HINHTRON = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#c9f0b4" stroke="#b3560f" stroke-width="2.8"/><path d="M24 24 L38.5 12" fill="none" stroke="#e2452b" stroke-width="2.8" stroke-linecap="round"/><circle cx="24" cy="24" r="2.8" fill="#6b2a00"/></svg>';
  const BANGDEN = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 36 L9 45 M35 36 L39 45" fill="none"' + NET + ' stroke-width="2.8"/><rect x="3" y="7" width="42" height="29" rx="3" fill="#2f7a58" stroke="#b3560f" stroke-width="3"/><text style="font:800 14px/1 sans-serif;-webkit-text-stroke:0" fill="#fffbe6" x="24" y="27" text-anchor="middle">1 + 1 = 2</text></svg>';
  // tiên đề Euclid: qua điểm M nằm ngoài đường thẳng a chỉ có một đường thẳng b song song với a
  const EUCLID = '<svg viewBox="0 0 56 54" aria-hidden="true"><rect x="2" y="6" width="52" height="44" rx="5" fill="#fff6d2"' + NET + ' stroke-width="2.2"/><path d="M7 39 H44" fill="none" stroke="#b3560f" stroke-width="2.6" stroke-linecap="round"/><path d="M7 21 H44" fill="none" stroke="#e2452b" stroke-width="2.8" stroke-linecap="round"/><circle cx="24" cy="21" r="3" fill="#6b2a00"/>' +
    "<text" + CHU + ' x="24" y="16.5">M</text><text' + CHU + ' x="49" y="24">b</text><text' + CHU + ' x="49" y="42">a</text></svg>';
  const CTL = [250, 94];            // thẻ công thức có tên bên dưới (cỡ đo trên trang, xem thu/do-tri.js)
  const TRI_HINH_2 = [["", DOTHI, NHO], ["", "∑", [48, 60]], ["the", EUCLID + "<b>Tiên đề Euclid</b>", [214, 152]], ["cthuc", "S = π × R²", [136, 40]], ["", KHOI, NHO], ["cthuc", "C = 2 × π × R", [176, 40]],
    ["the", '<span class="ct">(x<sup>n</sup>)\' = n · x<sup>n − 1</sup></span><b>Đạo hàm</b>', [224, 94]], ["", MAYTINH, NHO], ["cthuc", "sin²α + cos²α = 1", [242, 40]], ["", BANTINH, NHO],
    ["the", '<span class="ct">∫<span class="tp"><i>b</i><i>a</i></span>f(x)dx = F(b) − F(a)</span><b>Tích phân</b>', [346, 94]], ["cthuc", "Δ = b² − 4ac", [176, 40]],
    ["", DOGOC, NHO], ["", "∞", [60, 60]], ["the", '<span class="ct">∫ 2x dx = x² + C</span><b>Nguyên hàm</b>', CTL], ["cthuc", "(a + b)² = a² + 2ab + b²", [308, 40]], ["", HINHTRON, NHO], ["", "√", [42, 60]],
    ["cthuc", "e<sup>iπ</sup> + 1 = 0", [140, 40]], ["", BANGDEN, NHO]];
  const TRI_BO = [TRI_HINH, TRI_HINH_2];                 // bộ của Đội 1, bộ của Đội 2
  // 26/11 11:09 thầy Thịnh: "lúc mà ngọn đuốc được thắp lên á, thì từ cái thân đuốc nó chạy lên trên cũng là các cái công thức toán, những cái
  //   vấn đề liên quan toán học, kiểu nó chạy lên trên xong nó thông qua cái ngọn lửa nó bay lên á". BẢN MẪU, thầy chưa duyệt: MACH_LEO giây
  //   trước lúc đuốc bùng lửa, các công thức và kí hiệu của chính đội đó (lấy từ bộ tri thức của đội: công thức viết dọc theo thân đuốc, kí
  //   hiệu đứng thẳng) nối nhau chui ra từ đế đá, chạy dọc thân đồng lên chảo củi; dòng đầu vừa tới chảo thì lửa bùng lên, các dòng sau
  //   chạy lên thong thả (MACH_V điểm ảnh mỗi giây), đi xuyên qua ngọn lửa (to dần), tới đỉnh lửa thì tan; sách, công thức, định lí vẫn bay
  //   ra từ ngọn lửa như bản 8. Dòng công thức nằm cùng lớp với cây đuốc và ngọn lửa (sau lưng hai đội): bạn nào đứng trước cây đuốc thì
  //   che khúc thân đuốc đó, đội thắng đi sang bắt tay rồi thì thấy cả thân đuốc. Đã thử cho công thức nằm đè lên các bạn (xoắn quanh thân
  //   đuốc): chữ che mặt các bạn, rối, nên bỏ.
  const MACH_LEO = 1.1, MACH_V = 92, MACH_CO = .78, MACH_HO = 26;                  // MACH_CO: cỡ chữ so với công thức bay lên (32 → 25); MACH_HO: hai dòng cách nhau
  const MACH_Y0 = DUOC_DAY - 50, MACH_Y1 = MIENG - 156, MACH_DAI = MACH_Y0 - MACH_Y1, MACH_CHAO = MACH_Y0 - (MIENG + 14), MACH_RONG = 120;      // mặt đế đá; gần đỉnh lửa; quãng từ đế lên miệng chảo
  const MACH_BO = TRI_BO.map(bo => {
    const ds = bo.filter(h => (h[0] === "cthuc" && h[2][0] <= 250) || (h[0] === "" && h[1].charAt(0) !== "<")).map(h => ({ ct: h[0] === "cthuc", nd: h[1], dai: h[0] === "cthuc" ? h[2][0] * MACH_CO : 36 }));
    let L = 0;
    ds.forEach(g => { g.o = L + g.dai / 2; L += g.dai + MACH_HO; });
    return { ds: ds, L: Math.max(L, MACH_DAI + 240) };
  });
  const MACH_N = Math.max(MACH_BO[0].ds.length, MACH_BO[1].ds.length);
  // Xếp làn cho từng hình để hình vẽ định lí, chân dung và công thức không đè lên nhau: các hình nối nhau bay lên cùng một tốc độ, hình sau
  //   thấp hơn hình trước một quãng đều, nên chỉ cần chọn cho mỗi hình một độ lệch ngang (so với cây đuốc, lúc đã xoè hết) sao cho khung
  //   của nó không chạm khung các hình ngay trước nó. Xếp lần lượt, chọn chỗ gần giữa nhất mà không chạm (không còn chỗ thì chọn chỗ chạm
  //   ít nhất). Tám hình đầu còn bay vòng lại (TRI_NEN) nên xét cả hình cuối vòng với hình đầu vòng.
  const TRI_RONG = 250, TRI_CO = 1, TRI_CO0 = .72;              // hình lệch ngang tối đa (tính cả nửa bề rộng hình); cỡ lúc lên tới đỉnh
  const xepLan = HINH_BO => {
    const X = [], g1 = TRI_CAO * TRI_CACH / TRI_SONG, g2 = TRI_CAO / TRI_NEN;
    const cham = (k, x, j, dy) => { const A = HINH_BO[k][2], B = HINH_BO[j][2], ox = (A[0] + B[0]) / 2 * TRI_CO + 10 - Math.abs(x - X[j]), oy = (A[1] + B[1]) / 2 * TRI_CO + 8 - dy; return ox > 0 && oy > 0 ? ox * oy : 0; };
    for (let k = 0; k < TRI; k++) {
      const nua = Math.min(TRI_RONG, HINH_BO[k][2][0] * TRI_CO / 2);
      let tot = 0, nhe = Infinity;
      for (let x = -TRI_RONG + nua; x <= TRI_RONG - nua; x += 6) {
        let phat = Math.abs(x) * .5;
        for (let j = Math.max(0, k - 9); j < k; j++) phat += cham(k, x, j, (k - j) * g1) * 40;
        if (k < TRI_NEN) for (let j = 0; j < k; j++) phat += cham(k, x, j, (TRI_NEN - k + j) * g2) * 40 + cham(k, x, j, (k - j) * g2) * 40;
        if (phat < nhe) { nhe = phat; tot = x; }
      }
      X.push(Math.round(tot));
    }
    return X;
  };
  const TRI_LAN_BO = TRI_BO.map(xepLan);
  const DEN = [960, 700];                           // chỗ dải lụa giữa dây (lúc dây ở vạch giữa)
  const TH = { L: 238, R: 982 };                   // thước nấc: hai đầu ray
  const TH_U = (TH.R - TH.L) / 20, TH_G = (TH.L + TH.R) / 2;
  // mốc thời gian của một lượt kéo (giây, tính từ lúc bấm "Kéo co")
  const T_SM = .15, T_B0 = 1.1, T_B1 = 2.4, T_THANG = 2.5, T_BAO = 2.6, T_X = 3.3, T_DOI = 3.65, T_VI = 3.7, T_K = 4.0, DAI = .36, T_MUNG = .15;
  // 25/11 17:19 thầy Thịnh: "câu 5 thì đội nào trả lời được nhiều và thắng câu 5 thì hiện lên dòng chữ vàng là sức mạnh tình bạn sau đó kéo":
  //   ở câu 5, báo số nấc xong thì dòng chữ vàng "SỨC MẠNH TÌNH BẠN" hiện giữa sân TB_DAI giây, đội thắng câu toả sáng, rồi mới kéo.
  const T_TB = T_K - .2, TB_DAI = 1.7, TB_TRE = TB_DAI + .3;
  // phần kết (25/11 16:18 thầy Thịnh): "đội nào thắng thì ngọn đuốc sẽ sáng lên, xong rồi có giống như kiểu là có ánh lửa bay lên ấy
  //   [...] Rồi sau khi mà đội thắng đốt xong thì tới đội bên kia đốt". Chỗ thầy đọc bằng giọng nói máy ghi thành "hình con sắt cởi
  //   [...] cuốn vỏ cuốn sắt". 17:19 thầy nói rõ hơn: thắp đuốc thì "tri thức bay lên như là cuốn sách, kí hiệu toán học" (veTri).
  //   25/11 17:34 thầy đổi phần kết: "khi mà đội nào chiến thắng á, thì [...] hiện ra cái dòng chữ là đội 1 chiến thắng [...] ở phía bên đội
  //   đó dòng chữ đó hiện lên màu vàng lấp lánh"; "sau khi tôi bấm nút tiếp theo á, thì cái đội chiến thắng sẽ qua bắt tay cái đội bên
  //   kia, thì lúc này cả hai ngọn đuốc sẽ cùng phát sáng [...] cả hai sẽ cùng có những cuốn [sách], số [pi] [...] cùng bay lên, xong
  //   cùng bay về phía cái số 51 và xuất hiện [tờ báo tường]". Nên:
  //   kéo xong câu 5 = đội thắng mừng, dòng chữ vàng "ĐỘI n CHIẾN THẮNG" hiện bên phía đội đó (T_CT giây sau lúc buông dây);
  //   finish = hai đội buông dây về chỗ, đội thắng thắp đuốc của đội (sách, số π, công thức bay lên), dòng chữ vàng vẫn hiện;
  //   tuong (một lần bấm "Tiếp theo", bước rank không còn) = đội thắng đi sang bắt tay đội kia (T_DI đến T_BAT), đuốc đội kia sáng
  //     và cả hai đuốc cùng có sách, công thức bay lên (T_SANG2), tất cả bay về số 51 (T_BAY), vành lửa lan ra lộ báo tường (T_CHAY
  //     đến T_HET). Hai đội hòa: finish thắp cả hai đuốc cùng lúc, tuong hai đội cùng đi vào giữa sân bắt tay.
  //   25/11 18:22 thầy: "bắt tay thì cả bốn bạn bên này qua bắt bốn bạn bên kia [...] sau khi [bốn] bạn bên này qua bắt tay [bốn] bạn bên
  //   kia thì bên kia cũng sẽ xuất hiện cái hình ảnh tri thức nó bay lên. Rồi sau đó bay lên số 51 đó" (thầy đọc thành "5 bạn", mỗi đội
  //   có 4 bạn). Nên từ T_DI cả bốn bạn đội thắng cùng đi sang, bốn bạn đội kia đứng dậy bước ra đón (T_DOI_KIA), xếp thành bốn cặp đứng
  //   đối mặt (lichBat), cặp nào tới nơi thì bắt tay, cặp cuối bắt tay lúc T_BAT; rồi đuốc đội kia sáng như trên.
  const T_VE = .7, T_D1 = 1.2, T_NUT_DICH = 3.6, T_CT = .3;
  // đĩa lửa lộ báo tường: VONG_R là bán kính viền lửa của .kc-vong lúc chưa phóng (800 px, viền ở 86%); R_KIN: bán kính viền lúc đĩa đã phủ
  //   kín cả màn hình không đúng 16:9; V_KIN: tới phần đó của quãng T_CHAY..T_HET thì đĩa phủ kín, sau đó đĩa mờ dần
  const VONG_R = 344, R_KIN = 1900, V_KIN = .52;
  const T_DI = .35, DAI_DI = 2.3, T_DOI_KIA = T_DI + .55, T_BAT = T_DI + DAI_DI, T_SANG2 = T_BAT + .55, T_BAY = T_SANG2 + 3.4, DAI_BAY = 1.3, T_CHAY = T_BAY + DAI_BAY, DAI_CHAY = 3.1, T_HET = T_CHAY + DAI_CHAY;
  const CHAM = 10;                                  // lúc bắt tay hai bàn tay chồng lên nhau bấy nhiêu điểm ảnh
  const BAT_CACH = 270, BAT_LECH = 140, BAT_TRUOC = 9;   // hai cặp bắt tay kề nhau cách nhau; cả hàng lệch khỏi vạch giữa về phía đội được sang bắt tay; đội đi sang đứng nhích ra phía người xem
  // 25/11 22:12 thầy xem bản 5: "khi đã có đội chiến thắng thì ẩn toàn bộ mấy cái khung không cần thiết đi nhé và hiện cái mục đội ....
  //   chiến thắng to lên". Nên kéo xong câu 5 mà cả ván đã có đội thắng thì nhãn câu, dải sức mạnh, 5 bước, hai bảng đội, lời báo và thanh
  //   nấc mờ đi hết (T_AN giây), chỉ còn hai thẻ tên đội có sao ở hai góc như bước thắp đuốc; dòng chữ vàng to lên (104 px, trước 74 px).
  //   Chữ to hơn khoảng trống giữa cây đuốc và vạch giữa nên mép ngoài của chữ đứng sát cột lửa của đội thắng, phần còn lại lấn qua vạch giữa.
  const THANG_NUA = 356, T_AN = .35;                // nửa bề rộng dòng "CHIẾN THẮNG" cỡ 104 px (đo trên trang); thời gian các khung mờ đi
  const THANG_X = [820, 1100];                      // tâm ngang của dòng chữ đó ở bên trái, bên phải (tinhO() đặt lại theo cây đuốc)
  // 25/11 22:12: "sức mạnh tình bạn viết ở bên đội mà chiến thắng thôi nhé": dòng chữ vàng trước lượt kéo câu 5 hiện hai dòng phía trên đội
  //   thắng câu 5 (đội đang toả sáng), không còn nằm giữa sân. TB_X: tâm ngang ở bên trái, bên phải (tinhO() đặt lại)
  const TB_X = [674, 1252];
  // 25/11 22:30 thầy: "đội nào thắng thì đuốc sẽ được thắp sáng luôn nhé, không cần tôi bấm": kéo xong câu 5, đội thắng mừng T_TU giây (hòa
  //   cả ván: T_TU_HOA giây) thì trang tự sang bước thắp đuốc (KC.khiXongCau5 do tro-choi.js gắn)
  const T_TU = 1.7, T_TU_HOA = .9;
  // 27/11/2026 6:54 thầy Thịnh: "bạn thiết kế lại sao cho đến ván cuối thì đội nào thắng thì sẽ kéo 4 lá cờ về phía sân của mình". Bản 11 đến 14:
  //   kéo xong câu 5 mà dây lệch chưa tới 8 nấc thì đội thắng kéo thêm một hơi cho cả bốn lá cờ sang hẳn sân mình.
  //   27/11 9:55 thầy: "ví dụ đội 2 thắng nhưng dấu cộng vẫn ở phía đội 1 thì đội 2 phải giật về thêm 1 cái. nên giờ chuyển thành cái nơ cho
  //   khỏi bị" (bản 15): bỏ hơi kéo thêm đó. Giữa dây là một cái nơ (bản 16: nơ vô cực NO_VC, không còn dấu + − × ÷), nút nơ ở đúng vạch
  //   giữa lúc dây ở 0 nấc, đội thắng cả ván dẫn ít nhất 1 nấc là nút nơ đã ở bên sân đội đó. Sang bước thắp đuốc, hai đội buông dây về chỗ cạnh cây đuốc như cũ, sợi dây và cái nơ nằm yên dưới đất đúng chỗ dây
  //   dừng sau câu 5 (đúng số nấc thật), tới hết phần bắt tay.

  const S = { che: "an", q: 0, kc: [], t0: XA, phu: false, tinh: false, ket: 0, cues: [], L: null, d1Trai: false, doi: null, chay: null, daTu: false, m0: [0, 0] };
  let E = null;

  /* ---------- ghi vào DOM chỉ khi đổi ---------- */
  function kieu(el, k, v) { const m = el._k || (el._k = {}); if (m[k] !== v) { m[k] = v; el.style[k] = v; } }
  function chu(el, v) { if (el._c !== v) { el._c = v; el.textContent = v; } }
  function html(el, v) { if (el._h !== v) { el._h = v; el.innerHTML = v; } }
  function lop(el, ten, on) { on = !!on; const m = el._l || (el._l = {}); if (m[ten] !== on) { m[ten] = on; el.classList.toggle(ten, on); } }
  function mo(el, a) { kieu(el, "opacity", a <= 0 ? "0" : a >= 1 ? "1" : a.toFixed(3)); kieu(el, "visibility", a <= 0 ? "hidden" : "visible"); }
  const px = v => v.toFixed(1) + "px";

  /* ---------- bên nào của đội nào (25/11 16:18 thầy: "đội 1 và đổi 2 đảo vị trí cho nhau nhé, có thêm nút đổi bên trong cài đặt nhé") ----------
     Bên 0 là bên trái màn hình, bên 1 là bên phải. Mặc định Đội 1 đứng bên phải; nút "Đổi bên" trong Cài đặt ghi cfg.d1Trai. */
  const ben = d => (S.d1Trai ? d : 1 - d);          // đội d (0: Đội 1, 1: Đội 2) đứng bên nào; cũng là đội đứng ở bên d
  const huong = () => (S.d1Trai ? -1 : 1);          // vt dương (Đội 1 dẫn) thì dây lệch về phía này của màn hình
  function tinhO() {
    for (let b = 0; b < 2; b++) {
      const H = HINH[ben(b)], w = H.w * H.s, h = H.h * H.s, O = BEN_O[b] = { x: b ? 960 + KHE / 2 : 960 - KHE / 2 - w, y: GND - H.base * H.s, w: w, h: h };
      DUOC[b].x = Math.round(b ? O.x + w * (1 - H.duoc) : O.x + w * H.duoc);
      THANG_X[b] = b ? DUOC[b].x - 118 - THANG_NUA : DUOC[b].x + 118 + THANG_NUA;
      TB_X[b] = b ? (972 + DUOC[b].x - 72) / 2 : (DUOC[b].x + 72 + 948) / 2;
    }
  }
  // 25/11 19:25 thầy: "cái ngọn lửa đuốc thì cho nó đẹp hơn nhé, cho nó lấp lánh hơn". Ngọn lửa ba lớp tô chuyển màu (đỏ cam, vàng cam,
  //   lõi trắng vàng), hai lưỡi lửa nhỏ hai bên liếm lên, tàn lửa bay lên rồi tắt (.tl) và những ngôi sao nhỏ nhấp nháy quanh lửa (.ls).
  const LUA_TAN = [[-26, -44, 1.9, 0], [14, 38, 2.3, -.5], [-8, -20, 1.6, -.9], [24, 52, 2.6, -1.3], [-18, 10, 2.1, -1.7], [6, -34, 1.8, -.3], [-30, -62, 2.8, -2.1], [20, 14, 1.7, -1.1], [0, 26, 2.4, -1.9], [-12, -6, 2, -.7]];
  const LUA_SAO = [[-34, 58, 16, 0], [108, 40, 20, -.5], [-14, 8, 14, -.9], [120, 82, 13, -.2], [50, -14, 18, -1.1], [-30, 100, 12, -.7], [96, 2, 12, -1.3]];
  const LUA = '<svg class="n" viewBox="0 0 100 160" aria-hidden="true"><defs>' +
    '<linearGradient id="kcLuaN" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2f05"/><stop offset=".4" stop-color="#ff5a10"/><stop offset=".78" stop-color="#ff8a1c"/><stop offset="1" stop-color="#ffb640"/></linearGradient>' +
    '<linearGradient id="kcLuaG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8c14"/><stop offset=".5" stop-color="#ffb62a"/><stop offset="1" stop-color="#ffe27a"/></linearGradient>' +
    '<radialGradient id="kcLuaT" cx=".5" cy=".72" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#fff8cf"/><stop offset="1" stop-color="#ffd84f"/></radialGradient></defs>' +
    '<path d="M50 2 C58 30 92 62 92 104 C92 138 73 158 50 158 C27 158 8 138 8 104 C8 76 26 62 34 40 C38 52 44 56 46 46 C48 30 46 16 50 2 Z" fill="url(#kcLuaN)"/></svg>' +
    '<svg class="l1" viewBox="0 0 100 160" aria-hidden="true"><path d="M20 70 C24 86 34 96 32 116 C31 128 22 134 16 126 C8 114 16 96 20 70 Z" fill="url(#kcLuaN)"/></svg>' +
    '<svg class="l2" viewBox="0 0 100 160" aria-hidden="true"><path d="M82 62 C80 80 68 92 70 114 C71 127 80 132 86 124 C94 112 86 92 82 62 Z" fill="url(#kcLuaN)"/></svg>' +
    '<svg class="g" viewBox="0 0 100 160" aria-hidden="true"><path d="M52 30 C58 54 82 76 82 110 C82 138 68 156 50 156 C32 156 18 138 18 110 C18 90 30 80 38 62 C41 72 46 74 48 66 C50 54 49 42 52 30 Z" fill="url(#kcLuaG)"/></svg>' +
    '<svg class="t" viewBox="0 0 100 160" aria-hidden="true"><path d="M50 68 C56 88 72 100 72 122 C72 142 62 155 50 155 C38 155 28 142 28 122 C28 105 44 94 50 68 Z" fill="url(#kcLuaT)"/></svg>' +
    LUA_TAN.map(o => '<i class="tl" style="--x0:' + o[0] + "px;--x1:" + o[1] + "px;--t:" + o[2] + "s;--d:" + o[3] + 's"></i>').join("") +
    LUA_SAO.map(o => '<i class="ls" style="left:' + o[0] + "px;top:" + o[1] + "px;width:" + o[2] + "px;height:" + o[2] + "px;animation-delay:" + o[3] + 's"></i>').join("");

  // bắt tay (18:22): bạn thứ k (0: bạn nam ngoài cùng ... 3: bạn nữ đứng đầu) của đội đứng bên b lúc đầu đứng ở đâu (giữa hai bàn chân)
  const banO = (b, k) => { const H = HINH[ben(b)], B = H.ban[k], O = BEN_O[b], f = (B[6] + B[3]) * H.s; return b ? O.x + O.w - f : O.x + f; };
  // Lịch bắt tay. W: đội thắng cả ván (0 là hòa). Bốn cặp đứng thành hàng ngang, cặp j (0..3 từ trái sang) gồm bạn thứ j từ trái sang của
  //   mỗi bên, nên trong từng đội không ai phải vượt qua bạn mình; đội thắng đi sang phần sân đội kia (cả hàng lệch BAT_LECH về phía đó),
  //   đội kia bước ra đón; hòa thì hai đội cùng đi vào giữa. Trả về ban[b][k] = { x0, x1 (giữa hai bàn chân lúc đầu, lúc bắt tay), t0, t1
  //   (giây bắt đầu đi, tới nơi), di (là đội đi sang), cap } và cap[j] = { x, y (chỗ hai bàn tay gặp nhau), luc (giây bắt tay) }.
  function lichBat(W) {
    const bW = W ? ben(W - 1) : -1, tam = 960 + (bW < 0 ? 0 : bW ? -BAT_LECH : BAT_LECH), L = { ban: [[], []], cap: [] };
    let xa = 1;
    for (let j = 0; j < 4; j++) {
      const c = tam + (j - 1.5) * BAT_CACH, cap = { x: c, y: 0, luc: 0 };
      for (let b = 0; b < 2; b++) {
        const k = b ? 3 - j : j, H = HINH[ben(b)], B = H.ban[k], voi = (B[4] - B[3]) * H.s, x0 = banO(b, k), di = bW < 0 || b === bW;
        L.ban[b][k] = { x0: x0, x1: b ? c - CHAM / 2 + voi : c + CHAM / 2 - voi, di: di, cap: j };
        cap.y += (GND + (di && bW >= 0 ? BAT_TRUOC : bW < 0 && !b ? BAT_TRUOC : 0) - (B[2] - B[5]) * H.s) / 2;
        if (di) xa = Math.max(xa, Math.abs(L.ban[b][k].x1 - x0));
      }
      L.cap.push(cap);
    }
    for (let b = 0; b < 2; b++) L.ban[b].forEach((o, k) => {
      const dai = Math.abs(o.x1 - o.x0);
      if (o.di) { o.t0 = T_DI + (3 - k) * .05; o.t1 = T_DI + DAI_DI * (.66 + .34 * dai / xa); }      // bạn đứng đầu bước trước; bạn đi xa hơn tới sau
      else { o.t0 = T_DOI_KIA + (3 - k) * .06; o.t1 = o.t0 + .55 + .5 * dai / 400; }
    });
    L.cap.forEach((c, j) => { c.luc = Math.max(L.ban[0][j].t1, L.ban[1][3 - j].t1); });
    return L;
  }

  /* ---------- dựng các phần tử ---------- */
  function dung() {
    const SM = RD.SUC_MANH;
    let h = '<div class="kc-trong"><div class="kc-canh" id="kcCanh"><div class="kc-nen"><i class="t"></i><i class="d"></i><i class="tr"></i><i class="p"></i></div><div class="kc-toi"></div>';
    // hai cây đuốc: quầng sáng, cây đuốc, ngọn lửa cháy trên đống củi
    tinhO();
    DUOC.forEach(() => { h += '<div class="kc-quang" style="top:' + (MIENG - 76) + 'px"></div>'; });
    DUOC.forEach(() => { h += '<img class="kc-duoc" src="hinh/duoc-2.webp" alt="" draggable="false" style="top:' + (DUOC_DAY - DUOC_H) + "px;width:" + DUOC_W + "px;height:" + DUOC_H + 'px">'; });
    DUOC.forEach(() => { h += '<div class="kc-lua" style="top:' + (MIENG + 6) + 'px">' + LUA + "</div>"; });
    // 26/11 11:09 (bản mẫu): công thức chạy dọc thân đuốc lên chảo củi rồi xuyên qua ngọn lửa (nằm trên cây đuốc và ngọn lửa, sau hai đội)
    DUOC.forEach(() => { h += '<div class="kc-mach" style="top:' + MACH_Y1 + "px;width:" + MACH_RONG + "px;height:" + MACH_DAI + 'px">' + new Array(MACH_N + 1).join("<i></i>") + "</div>"; });
    // logo trường thay chiếc nơ đỏ (nằm trên dòng công thức: công thức chui qua sau huy hiệu); đuốc trái một logo, đuốc phải logo còn lại
    DUOC.forEach((o, b) => { h += '<img class="kc-huy" src="hinh/' + HUY[b][0] + '" alt="" draggable="false" style="top:' + (DUOC_DAY - DUOC_H + HUY_Y - HUY[b][2] / 2) + "px;width:" + HUY[b][1] + "px;height:" + HUY[b][2] + 'px">'; });
    h += '<div class="kc-vach"></div><div class="kc-chu-vach" id="kcChuVach">VẠCH GIỮA</div>';
    // vệt gió khi kéo (nằm sau hai đội)
    for (let k = 0; k < VUT; k++) h += '<i class="kc-vut" style="width:' + (150 + (k * 53) % 150) + 'px"></i>';
    // mặt đất khi kéo: vệt trượt, vòng chấn động, vết nứt (đứng yên trên sân, không trôi theo hai đội)
    h += '<div class="kc-dat" id="kcDat">' + [0, 1, 2, 3, 4, 5, 6, 7].map(() => '<i class="kc-vet"></i>').join("") + '<i class="kc-vong-dat"></i>';
    for (let k = 0; k < NUT; k++) h += '<div class="kc-nut">' + NUT_SVG[k % 3] + "</div>";
    h += "</div>";
    h += '<div class="kc-nhom" id="kcNhom">' +
      '<div class="kc-bong-doi"></div><div class="kc-bong-doi"></div>' +
      // cụm bụi bốc lên ở chân đội bị kéo (nằm sau hai đội để không che mờ các bạn; lớp bụi thấp .kc-bui thì nằm trước, ngang bàn chân)
      [0, 1].map(b => { let x = ""; for (let k = 0; k < BUI_CAO; k++) x += '<div class="kc-khoi b' + b + '">' + BUI_CAO_SVG + "</div>"; return x; }).join("") +
      // dây nằm dưới đất (hiện khi hai đội buông dây) và hai nửa sợi dây giữa hai đội (vẽ lại từng khung hình cho khít tay hai đội); chỗ đứng,
      //   vân dây theo đội đang đứng mỗi bên do datBen() đặt
      '<div class="kc-day-dat t"></div><div class="kc-day-dat p"></div><div class="kc-day t"></div><div class="kc-day p"></div>' +
      // 26/11 11:09 (bản mẫu): hình Toán ở khúc dây giữa hai đội, kiểu theo KIEU_DAY
      (KIEU_DAY === "thuoc" ? '<div class="kc-thuoc-do t"></div><div class="kc-thuoc-do p"></div>' : KIEU_DAY === "khong" || KIEU_DAY === "no" ? "" :
        TOAN_O.map((o, i) => '<div class="kc-toan ' + KIEU_DAY + '"><span class="la"><span class="lac" style="animation-delay:-' + (i * .55).toFixed(2) + 's">' + (KIEU_DAY === "co" ? CO_TOAN[i] : HAT_TOAN[i]) + "</span></span></div>").join("")) +
      // 27/11 10:45 (bản 16): hình d2-ha.webp đổi mà tên tệp giữ nguyên, nên hình hai đội mang mã phiên bản của trang (TV đã mở bản cũ trong vòng
      //   10 phút vẫn lấy hình mới, không dùng hình cũ trong bộ nhớ trình duyệt)
      HINH.map(H => '<div class="kc-doi-boc">' + TU_THE.map(p => '<img class="kc-doi" data-p="' + p + '" src="hinh/' + H.k + "-" + p + '.webp?v=' + (window.RD_V || "") + '" alt="" draggable="false"' +
        (p === "thang" && H.dinh ? ' style="top:' + (-H.dinh / H.h * 100).toFixed(3) + "%;height:" + ((H.h + H.dinh) / H.h * 100).toFixed(3) + '%"' : "") + ">").join("") + "</div>").join("") +
      // từng bạn chìa tay bắt tay (xếp theo ĐỘI rồi theo bạn): khung gốc đặt ở giữa hai bàn chân, <i> là bóng dưới chân
      HINH.map(H => H.ban.map((B, k) => '<div class="kc-ban"><i></i><img src="hinh/' + H.k + "-b" + k + '.webp" alt="" draggable="false"></div>').join("")).join("") +
      '<div class="kc-ten-doi"></div><div class="kc-ten-doi"></div>' +
      '<div class="kc-tia" id="kcTia">' + [0, 1, 2, 3, 4, 5, 6, 7].map(() => "<i></i>").join("") + "</div>" +
      [0, 1, 2, 3].map(() => '<div class="kc-tia bt">' + [0, 1, 2, 3, 4, 5, 6, 7].map(() => "<i></i>").join("") + "</div>").join("") +      // tia sáng ở chỗ bốn cặp bắt tay
      // 26/11 12:20 thầy Thịnh: "bỏ cái nơ trên dây kéo đi đổi thành 4 lá cờ": khung dải lụa còn đó (tia sáng lúc kéo vẫn loé ở giữa dây) nhưng không vẽ nơ nữa
      //   27/11 9:53 (bản 15): khung này vẽ lại cái nơ; 10:45 (bản 16): nơ vô cực cỡ như dải lụa đầu tiên (NO_VC), không còn dấu + − × ÷
      '<div class="kc-den-neo" id="kcNeo"><div class="kc-den-boc"><div class="kc-den" id="kcDen">' + (KIEU_DAY === "no" ? NO_VC : "") + "</div></div></div>";
    for (let b = 0; b < 2; b++) BUI_F.forEach((f, j) => { h += '<div class="kc-bui b' + b + '" style="top:' + (GND - (j % 2 ? 28 : 34)) + 'px;width:124px;height:60px">' + BUI_THAP_SVG + "</div>"; });
    for (let b = 0; b < 2; b++) for (let k = 0; k < 2; k++) h += '<div class="kc-ho b' + b + '"></div>';
    const muiTen = lat => '<svg class="kc-mui ' + (lat ? "m1" : "m2") + '" style="left:' + (lat ? 776 : 1048) + "px" + (lat ? ";transform:scaleX(-1)" : "") + '" width="96" height="40" viewBox="0 0 96 40" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6 L24 20 L8 34" opacity=".45"/><path d="M38 6 L54 20 L38 34" opacity=".75"/><path d="M68 6 L84 20 L68 34"/></g></svg>';
    h += muiTen(true) + muiTen(false) + '<div class="kc-so-nac" id="kcSoNac">1</div></div>';
    for (let k = 0; k < SOI; k++) h += '<i class="kc-soi s' + (k % 3) + '"></i>';        // sỏi văng lên từ vết nứt (bay trước hai đội)
    // sách, số π, kí hiệu toán, công thức bay lên từ hai cây đuốc lúc thắp (nằm trên hai đội)
    for (let b = 0; b < 2; b++) for (let k = 0; k < TRI; k++) h += '<i class="kc-tri x' + b + '"></i>';        // nội dung do datBen() điền: mỗi đội một bộ (TRI_BO)
    // lá rơi (4 chiếc rơi thong thả suốt buổi, 12 chiếc rụng theo từng nhịp kéo), hoa giấy mừng đội thắng câu, chữ nổ giữa sân
    LA_NEN.forEach((o, k) => { h += '<i class="kc-la nen" style="left:' + o[0] + "px;top:" + o[1] + "px;animation-duration:" + o[2] + "s;animation-delay:-" + o[3] + 's"></i>'; });
    for (let k = 0; k < LA_O.length; k++) h += '<i class="kc-la"></i>';
    for (let k = 0; k < HOA; k++) h += '<i class="kc-hoa"></i>';
    // dòng chữ vàng lấp lánh "ĐỘI n CHIẾN THẮNG" (hai lớp chữ chồng nhau: viền nâu ở dưới, mặt chữ vàng có vệt sáng chạy ở trên; quanh chữ là sao nhấp nháy)
    const lsO = [[-5, 8], [14, -14], [40, -6], [66, -16], [92, -8], [104, 30], [98, 78], [70, 100], [36, 104], [8, 96], [-7, 56], [52, 44]];
    h += '<div class="kc-thang" id="kcThang"><div class="th-trong"><span class="th-dong th-nho"><span class="th-v"></span><span class="th-m"></span></span><span class="th-dong"><span class="th-v">CHIẾN THẮNG</span><span class="th-m">CHIẾN THẮNG</span></span>' +
      lsO.map((o, k) => '<i class="th-ls" style="left:' + o[0] + "%;top:" + o[1] + "%;animation-delay:-" + (k * .37 % 1.4).toFixed(2) + "s" + (k % 3 === 1 ? ";width:24px;height:24px;margin:-12px 0 0 -12px" : "") + '"></i>').join("") + "</div></div>";
    h += '<div class="kc-no" id="kcNo"></div></div>';
    // quầng sáng quanh khung của hai bảng đội: nằm dưới nhãn câu và dải hiệu ứng (không được che chữ của dải hiệu ứng)
    RD.DOI.forEach(D => { h += '<div class="kc-rang" id="kcRang' + D.n + '"></div>'; });
    // nhãn câu, dải hiệu ứng
    h += '<div class="kc-cau" id="kcCau"></div>';
    h += '<div class="kc-sm" id="kcSm"><div class="bieu">' + SET + '</div><div class="ten-khoi"><div class="ten" id="kcSmTen"></div><div class="sm-luat" id="kcSmLuat"></div></div></div>';
    // 26/11 00:42 thầy Thịnh: "cái thanh đó bỏ luôn đi": không còn thanh 5 bước (5 vòng tròn số 1 tới 5 kèm tên Khai cuộc … Về đích và kết quả từng câu)
    //   ở góc trên bên phải màn kéo co; dải hiệu ứng dùng luôn chỗ đó nên chữ to thêm
    const sao = () => '<span class="kc-sao">' + [1, 2, 3, 4, 5].map(k => "<span>" + SAO + "<b>" + k + "</b></span>").join("") + "</span>";      // 26/11 12:20: ô sao thứ k là của câu k
    const tenNhom = D => "";                   // 25/11 20:14: không còn "Nhóm 1 + Nhóm 2"; số thẻ của từng đội do KC.datThe ghi theo Cài đặt
    RD.DOI.forEach((D, i) => {
      h += '<div class="kc-bang kc-the d' + D.n + '" id="kcB' + D.n + '"><div class="dau"><span class="ten">' + D.ten.toUpperCase() + '</span><span class="the-so">' + tenNhom(D) + "</span>" + sao() +
        '</div><div class="keo"><span class="nhan"></span><span class="thanh"><i></i></span><span class="pt"></span></div></div>';
    });
    RD.DOI.forEach((D, i) => { h += '<div class="kc-chip kc-the d' + D.n + '" id="kcC' + D.n + '"><span class="ten">' + D.ten.toUpperCase() + '</span><span class="nh">' + tenNhom(D) + "</span>" + sao() + "</div>"; });
    h += '<div class="kc-bao" id="kcBao"><div class="lon" id="kcLon"></div><div class="keo" id="kcKeo"></div><div class="vi" id="kcVi"></div></div><div class="kc-x2" id="kcX2"></div>';
    // 25/11 19:25 thầy: "cái thanh mà qua trái qua phải [...] khi mà nó trượt về bên nào đó thì bên [đó] [...] sáng loáng lên để người ta biết là
    //   bên [đó] đang thắng nhá. Kiểu giống như là các cái thanh máu hay thanh năng lượng [...] của các cái game nhập vai". Nên: rãnh tối viền
    //   vàng, dải năng lượng (.nang) màu của đội đang dẫn chạy từ vạch giữa tới mốc, bóng loáng, có vệt sáng quét; nửa bảng phía đội đang
    //   dẫn rực lên (.hao) và tên đội đó sáng, to hơn.
    h += '<div class="kc-thuoc" id="kcThuoc"><i class="hao t"></i><i class="hao p"></i><div class="ray"></div><i class="nang"></i><i class="cau t"><i></i></i><i class="cau p"><i></i></i>';
    for (let k = -10; k <= 10; k++) h += '<i class="vach-nac' + (k === 0 ? " giua" : "") + '" style="left:' + (TH_G + k * TH_U) + 'px"></i>';
    h += '<i class="bong"></i><i class="mui-ten"></i><i class="moc"></i><span class="dan"></span><span class="ben t" style="left:90px"></span><span class="ben p" style="right:90px"></span></div>';
    for (let k = 0; k < 2; k++) h += '<svg class="kc-sao-bay" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';      // câu hòa: hai ngôi sao, mỗi đội một ngôi
    h += '<div class="kc-ket" id="kcKet"><div class="lon" id="kcKetLon"></div><div class="vi" id="kcKetVi"></div></div>';
    for (let k = 0; k < 2; k++) h += '<div class="kc-qua"><i></i><i></i><i></i><i></i><i></i><b></b></div>';
    h += '<button type="button" class="nut-tv" id="kcNut" hidden><span></span>' + MUI + "</button>";
    h += '</div><div class="kc-vong" id="kcVong"></div><div class="kc-chop" id="kcChop"></div>';
    const g = document.createElement("div");
    g.id = "kc"; g.hidden = true; g.innerHTML = h;
    const cv = $("#cv");
    cv.parentNode.insertBefore(g, cv.nextSibling);
    const tat = (s, r) => Array.prototype.slice.call((r || g).querySelectorAll(s));
    const bang = n => { const b = $("#kcB" + n, g); return { el: b, nhan: $(".nhan", b), thanh: $(".thanh i", b), pt: $(".pt", b), sao: tat(".kc-sao span", b), theSo: $(".the-so", b) }; };
    const chip = n => { const b = $("#kcC" + n, g); return { el: b, sao: tat(".kc-sao span", b), nh: $(".nh", b) }; };
    const boc = tat(".kc-doi-boc"), ban = tat(".kc-ban").map(el => ({ el: el, img: $("img", el) }));
    E = {
      g: g, world: $("#world"), canh: $("#kcCanh", g), nhom: $("#kcNhom", g), den: $("#kcDen", g), neo: $("#kcNeo", g), chuVach: $("#kcChuVach", g), boc: boc,
      hinh: boc.map(el => tat(".kc-doi", el).map(i => ({ el: i, p: i.dataset.p }))), ban: [ban.slice(0, 4), ban.slice(4, 8)], tiaBat: tat(".kc-tia.bt").map(el => ({ el: el, i: tat("i", el) })), day: tat(".kc-day"), dayDat: tat(".kc-day-dat"), tenDoi: tat(".kc-ten-doi"),
      vut: tat(".kc-vut"), ho: [tat(".kc-ho.b0"), tat(".kc-ho.b1")], no: $("#kcNo", g), thang: $("#kcThang", g), thangDoi: tat("#kcThang .th-nho span"), la: tat(".kc-la:not(.nen)"), hoa: tat(".kc-hoa"), tia: $("#kcTia", g), tiaI: tat("#kcTia i"),
      toan: tat(".kc-toan"), toanLa: tat(".kc-toan .la"), thuocDo: tat(".kc-thuoc-do"), mach: tat(".kc-mach").map(el => ({ el: el, i: tat("i", el) })),
      lua: tat(".kc-lua"), quang: tat(".kc-quang"), duoc: tat(".kc-duoc"), tri: [tat(".kc-tri.x0"), tat(".kc-tri.x1")], bongDoi: tat(".kc-bong-doi"),
      dat: $("#kcDat", g), nutDat: tat(".kc-nut"), vetDat: tat(".kc-vet"), vongDat: $(".kc-vong-dat", g), soi: tat(".kc-soi"), khoi: [tat(".kc-khoi.b0"), tat(".kc-khoi.b1")],
      bui: [tat(".kc-bui.b0"), tat(".kc-bui.b1")], mui: [$(".kc-mui.m1", g), $(".kc-mui.m2", g)], soNac: $("#kcSoNac", g),
      cau: $("#kcCau", g), sm: $("#kcSm", g), smTen: $("#kcSmTen", g), smLuat: $("#kcSmLuat", g),
      bang: [bang(1), bang(2)], chip: [chip(1), chip(2)], bao: $("#kcBao", g), lon: $("#kcLon", g), keo: $("#kcKeo", g), vi: $("#kcVi", g), x2: $("#kcX2", g),
      rang: [$("#kcRang1", g), $("#kcRang2", g)], huy: tat(".kc-huy", g),
      thuoc: $("#kcThuoc", g), nang: $(".kc-thuoc .nang", g), moc: $(".kc-thuoc .moc", g), bong: $(".kc-thuoc .bong", g), muiTen: $(".kc-thuoc .mui-ten", g), dan: $(".kc-thuoc .dan", g), thBen: tat(".kc-thuoc .ben"), cauTh: tat(".kc-thuoc .cau > i"),
      saoBay: tat(".kc-sao-bay", g), ket: $("#kcKet", g), ketLon: $("#kcKetLon", g), ketVi: $("#kcKetVi", g),
      qua: tat(".kc-qua").map(q => ({ el: q, dau: $("b", q), duoi: tat("i", q) })), nut: $("#kcNut", g), nutChu: $("#kcNut span", g), vong: $("#kcVong", g), chop: $("#kcChop", g)
    };
    // giải mã sẵn cả 12 hình đội và 8 hình từng bạn để lúc đổi tư thế không bị khựng
    E.hinh.forEach(ds => ds.forEach(o => { if (o.el.decode) o.el.decode().catch(function () { /* hình chưa tải kịp: trình duyệt tự vẽ khi có */ }); }));
    E.ban.forEach(ds => ds.forEach(o => { if (o.img.decode) o.img.decode().catch(function () { /* như trên */ }); }));
    E.nut.addEventListener("click", function () { if (am().mo) am().mo(); if (KC.khiBam) KC.khiBam(S.che); });
    E.thuocDo.forEach((el, b) => { el.style.backgroundImage = thuocNen(b === 1); });
    datBen(); ghiThe();
  }
  // gắn tên, màu, hình của hai đội vào đúng bên đang đứng (E.boc, E.hinh xếp theo ĐỘI; bóng, dây, nhãn, bụi xếp theo BÊN)
  function datBen() {
    if (!E) return;
    tinhO();
    for (let b = 0; b < 2; b++) {
      const d = ben(b), H = HINH[d], O = BEN_O[b], bc = E.boc[d], dh = H.vanH * H.s, van = "url(hinh/day-" + H.k + ".webp)";
      kieu(bc, "left", px(O.x)); kieu(bc, "top", px(O.y)); kieu(bc, "width", px(O.w)); kieu(bc, "height", px(O.h)); lop(bc, "lat", b === 1);
      kieu(E.bongDoi[b], "left", px(O.x + 20)); kieu(E.bongDoi[b], "top", px(GND - 20)); kieu(E.bongDoi[b], "width", px(O.w - 40));
      const dd = E.dayDat[b];
      kieu(dd, "left", px(b ? O.x : O.x + 36)); kieu(dd, "top", px(DAY_DAT - dh / 2)); kieu(dd, "width", px(O.w - 36)); kieu(dd, "height", px(dh)); kieu(dd, "backgroundImage", van);
      kieu(E.day[b], "height", px(dh)); kieu(E.day[b], "backgroundImage", van);
      kieu(E.tenDoi[b], "left", px(O.x + O.w / 2)); kieu(E.tenDoi[b], "top", px(GND + 16));
      E.bui[b].forEach((el, j) => kieu(el, "left", px((b ? O.x + O.w * (1 - BUI_F[j]) : O.x + O.w * BUI_F[j]) - 62)));
      kieu(E.quang[b], "left", px(DUOC[b].x)); kieu(E.duoc[b], "left", px(DUOC[b].x - DUOC_W / 2)); kieu(E.lua[b], "left", px(DUOC[b].x));
      kieu(E.huy[b], "left", px(DUOC[b].x - HUY[b][1] / 2));
      // tri thức bay lên từ cây đuốc bên này: bộ của đội đang đứng ở đây (20:14: "hai bên đừng giống nhau")
      E.tri[b].forEach((el, k) => { const tr = TRI_BO[d][k], cls = "kc-tri x" + b + (tr[0] ? " " + tr[0] : ""); if (el.className !== cls) el.className = cls; html(el, tr[1]); });
      kieu(E.mach[b].el, "left", px(DUOC[b].x - MACH_RONG / 2));
      E.mach[b].i.forEach((el, k) => { const g = MACH_BO[d].ds[k], cls = g ? (g.ct ? "ct" : "kh") : ""; if (el.className !== cls) el.className = cls; html(el, g ? g.nd : ""); });
      // hình từng bạn: gốc xoay và lật là điểm giữa hai bàn chân; đội đứng bên phải thì lật lại cho quay mặt sang trái
      E.ban[d].forEach((o, k) => {
        const B = H.ban[k], im = o.img;
        kieu(im, "left", px(-B[3] * H.s)); kieu(im, "top", px(-B[2] * H.s)); kieu(im, "width", px(B[0] * H.s)); kieu(im, "height", px(B[1] * H.s));
        kieu(im, "transformOrigin", px(B[3] * H.s) + " " + px(B[2] * H.s));
        o.lat = b === 1;
      });
    }
    for (let d = 0; d < 2; d++) {
      const b = ben(d), D = RD.DOI[d], T = D.ten.toUpperCase();
      [E.bang[d].el, E.chip[d].el, E.rang[d]].forEach(el => { lop(el, "ben-t", b === 0); lop(el, "ben-p", b === 1); });
      chu(E.tenDoi[b], T); kieu(E.tenDoi[b], "background", D.mau);
      chu(E.thBen[b], b ? T + " ▶" : "◀ " + T); kieu(E.thBen[b], "color", b ? "#ff9d8f" : "#93c2ff");      // 20:16: màu theo bên (trái xanh mana, phải đỏ máu), không theo đội
      E.ho[b].forEach(el => kieu(el, "background", D.mau));
    }
    lop(E.thuoc, "dao", !S.d1Trai);
  }
  // dòng nhỏ cạnh tên đội: số thẻ của đội đó theo Cài đặt (25/11 20:14 thầy: "bây giờ chỉ có hai đội thôi", không còn 4 nhóm)
  function ghiThe() {
    if (!E || !S.the) return;
    S.the.forEach((s, d) => { const c = s ? "Thẻ số " + s : ""; chu(E.bang[d].theSo, c); chu(E.chip[d].nh, c); });
  }
  KC.datThe = function (ds) { S.the = ds; ghiThe(); };
  KC.datBen = function (d1Trai) {
    d1Trai = !!d1Trai;
    if (S.d1Trai === d1Trai) return;
    S.d1Trai = d1Trai; S.tinh = false;
    datBen();
    if (E && S.che !== "an") { try { ve(dongHo()); } catch (e) { console.error(e); } }
  };

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
  // 26/11 12:20 thầy Thịnh: "còn số sao thì câu nào đúng đánh sao câu đó, ví dụ câu 1 thắng thì câu 1 nhận sao, câu 3 thắng thì câu 3 nhận sao,
  //   hòa thì 2 đội có sao". Sao của mỗi đội là 5 ô theo 5 câu (bit q − 1 của một số): thắng câu nào thì ô của câu đó sáng, câu hòa thì ô của
  //   câu đó sáng ở cả hai đội (trước đây sao xếp dồn từ trái sang theo số câu thắng, câu hòa không ai có sao).
  const coSao = (K, d) => !!K && (K.thang === 0 || K.thang === d + 1);
  function saoToi(k) { const C = trong(k).cau, m = [0, 0]; for (let q = 1; q <= k; q++) for (let d = 0; d < 2; d++) if (coSao(C[q], d)) m[d] |= 1 << (q - 1); return m; }
  // đội d (0, 1) thắng liền mấy câu tính tới hết câu k (câu hòa hay câu thua làm đứt mạch): để lửa quanh bảng đội cháy to dần
  function lienThang(k, d) { const C = trong(k).cau; let n = 0; for (let q = k; q >= 1 && C[q] && C[q].thang === d + 1; q--) n++; return n; }
  // 25/11 16:18 thầy Thịnh: "tôi muốn viết lại cái công thức tính đó, làm sao cho mà dễ hiểu một chút. Chứ mà tự nhiên lấy số bạn trừ đi
  //   rồi ra cái số nước kéo là tính như thế nào tôi chưa hiểu lắm." Lời cũ ghi "83 − 64 = 19 nên kéo 2 nấc". Lời mới nói rõ từng con số
  //   là tỉ lệ đúng của đội nào, đội nào hơn bao nhiêu, và mức hơn đó ứng với mấy nấc (các mức: RD.nac trong du-lieu.js).
  const MUC = ["", "Hơn từ 5% đến dưới 10%", "Hơn từ 10% đến dưới 25%", "Hơn từ 25% trở lên"];
  // 26/11 12:20 thầy Thịnh: "cái dòng đội 1 kéo 2 nấc chỉnh thành đội 1 giành lợi thế. xuống dòng đội 1 kéo 2 nấc + 1 nấc (in vàng để thể hiện
  //   hiệu ứng)". Nên dòng lớn (lon) là "ĐỘI n GIÀNH LỢI THẾ"; dòng dưới (keo) ghi số nấc theo mức hơn kém, phần hiệu ứng cho thêm (them) in
  //   vàng: "+ 1 nấc" (Đồng lòng, Tăng tốc), "× 2" (Tiếp sức, Về đích: thầy chỉ nêu ví dụ "+ 1 nấc"; "× 2" là cách tôi ghi hai hiệu ứng nhân
  //   đôi). Phần vàng hiện sau dòng kéo một nhịp (T_DOI) cho thấy rõ là hiệu ứng cộng vào.
  function loiCau(K) {
    const q = K.q, a = K.doi[0].tram, b = K.doi[1].tram, D = RD.DONG_LONG;
    const o = { lon: "", keo: "", them: "", dau: "", vi: "" };
    if (!K.goc) {
      o.lon = "HAI ĐỘI HÒA";
      o.vi = K.hieu ? "Đội 1 đúng <b>" + a + "%</b>, Đội 2 đúng <b>" + b + "%</b>: chỉ hơn kém nhau <b>" + K.hieu + "%</b>.<br>Hơn kém nhau dưới 5% thì hòa, dây đứng yên."
        : "Hai đội cùng đúng <b>" + a + "%</b> nên hòa, dây đứng yên.";
    } else {
      const T = K.thang;
      o.lon = "ĐỘI " + T + " GIÀNH LỢI THẾ";
      o.keo = "Đội " + T + " kéo " + K.goc + " nấc";
      o.vi = "Đội " + T + " đúng <b>" + K.doi[T - 1].tram + "%</b>, Đội " + (3 - T) + " đúng <b>" + K.doi[2 - T].tram + "%</b>: Đội " + T + " hơn <b>" + K.hieu + "%</b>.<br>" +
        MUC[K.goc] + " thì kéo <b>" + K.goc + " nấc</b>.";
    }
    if (q === 2) {
      const x = K.thuong[0], y = K.thuong[1];
      if (x && y) o.vi += "<br>Cả hai đội đúng từ " + D + "% trở lên: <b>Đồng lòng</b>, hai nấc thưởng bù nhau.";
      else if (x || y) {
        if (!K.goc) { o.vi = o.vi.replace(", dây đứng yên.", "."); o.keo = "Đội " + (x ? 1 : 2) + " được thưởng"; }          // soát 25/11 22:12: hòa nhưng có nấc thưởng thì dây vẫn đi 1 nấc
        o.vi += "<br>Đội " + (x ? 1 : 2) + " đúng từ " + D + "% trở lên: <b>Đồng lòng, thưởng 1 nấc</b>."; o.them = "+ 1 nấc";
      }
      else o.vi += "<br>Chưa đội nào đúng từ " + D + "% trở lên nên chưa có nấc thưởng.";
    }
    if (q === 3 && K.goc) { o.vi += "<br><b>Tăng tốc</b>: kéo thêm 1 nấc thành " + K.nac + " nấc."; o.dau = "+1"; o.them = "+ 1 nấc"; }
    if (q === 4 && K.goc) {
      if (K.gapDoi) { o.vi += "<br>Đang bị dẫn mà thắng: <b>Tiếp sức gấp đôi</b> thành " + K.nac + " nấc."; o.dau = "×2"; o.them = "× 2"; }
      else o.vi += "<br>Đội " + K.thang + " đang không bị dẫn nên không được gấp đôi.";
    }
    if (q === 5 && K.goc) { o.vi += "<br><b>Về đích</b>: nhân đôi thành " + K.nac + " nấc."; o.dau = "×2"; o.them = "× 2"; }      // 25/11 16:18 thầy: "câu vàng đổi thành về đích"
    return o;
  }
  // lịch một lượt kéo: mốc từng nấc, lúc xong
  function lichKeo(K) {
    const n = K.buoc.length, gap = n > 4 ? .5 : .62, tb = K.q === 5 && n && K.thang ? T_TB : null, tre = tb != null ? TB_TRE : 0;
    const moc = K.buoc.map((b, i) => T_K + tre + i * gap + (i >= K.nac ? .75 : 0));
    let het = n ? moc[n - 1] + .9 : T_K + .3, vuot = null, c = K.truoc;
    K.buoc.forEach((b, i) => { c += b; if (vuot == null && K.truoc && c && (c > 0) !== (K.truoc > 0)) vuot = i; });
    return { moc: moc, het: het, sao: het, ket: het + (K.thang ? 1.7 : 1.1), loi: loiCau(K), vuot: vuot, tb: tb };      // câu hòa cũng có sao bay (0,8 giây)
  }

  /* ---------- điều khiển từ trò chơi ---------- */
  // o = { che: "dau" | "hoi" | "keo" | "dich" | "tuong" | "an", q, kc: [kết quả sau 0..5 câu], hoatCanh }
  KC.dat = function (o) {
    if (!E) return;
    const t = dongHo(), hc = !!o.hoatCanh;
    if (o.kc) S.kc = o.kc;
    S.che = o.che === "tuong" && !hc ? "an" : o.che;
    S.q = o.q || 0;
    S.t0 = hc ? t : XA;
    S.cues = []; S.tinh = false; S.L = null; S.ket = 0; S.song = false; S.chay = null; S.daTu = false;
    const che = S.che;
    if (E.g.hidden !== (che === "an")) E.g.hidden = che === "an";
    lop(E.world, "kc-che-nut", che === "tuong");
    lop(E.g, "kc-lo", false);
    if (che !== "tuong") { mo(E.vong, 0); mo(E.chop, 0); }
    if (che === "keo") {
      const K = trong(S.q).cau[S.q];
      if (K) {
        S.L = lichKeo(K); S.ket = S.L.ket;
        if (hc) {
          // 25/11 23:24 thầy Thịnh: "bỏ mấy cái âm thanh ting ting gì đi và mấy cái âm nghe kì kì lúc mà 2 ngọn đuốc sáng á, có tiếng gì nghe kì kì lúc
          //   tri thức bay ra". Bỏ hết tiếng "ting" (trước lượt kéo, nấc thưởng, huy hiệu ×2, dòng tình bạn, từng cặp bắt tay) và tiếng lấp lánh
          //   (lapLanh: vượt lên, ngôi sao, tình bạn, chiến thắng, bắt tay xong, tri thức bay về số 51); lúc đuốc sáng bỏ tiếng phừng (bungLua),
          //   tiếng vút (vut), tiếng lách tách (lachTach), cả ở lúc đội thắng sang bắt tay và lúc vầng sáng lan ra. Còn lại: gõ mộc cầm và chuông
          //   lúc hiện ô báo, trống mỗi nấc kéo, tiếng vút lúc có bạn trượt chân, khúc vui, vỗ tay, trống lúc vầng sáng lan ra, nhạc nền.
          hen(t + T_SM, keu("go", 3, .35)); hen(t + T_BAO, keu("chuong", .35));
          S.L.moc.forEach((m, i) => { hen(t + m, keu("trong", i >= K.nac ? .7 : .85)); });
          if (S.q === 2 && S.L.moc.length) hen(t + S.L.moc[0] + .1, keu("vut"));                    // có bạn trượt chân
          if (S.q === 5 && S.L.moc.length > 1) hen(t + S.L.moc[1] + .1, keu("vut"));
          if (S.q === 5 && trong(5).thang) { hen(t + S.L.het + T_MUNG + T_CT + .1, keu("ken")); S.kenLuc = t + S.L.het + T_MUNG + T_CT + .1; }      // dòng chữ vàng "ĐỘI n CHIẾN THẮNG": khúc vui
        }
      }
    } else if (che === "dich") {
      S.ket = T_D1 + TRI_DAI + .4;
      // 25/11 22:30: bước thắp đuốc tự tới ngay sau khúc vui của dòng "ĐỘI n CHIẾN THẮNG" thì không kêu khúc vui lần nữa (hai lần cách nhau hơn 1 giây nghe lặp)
      if (hc) { if (!(S.kenLuc != null && t >= S.kenLuc && t - S.kenLuc < 3)) hen(t + .05, keu("ken")); hen(t + T_D1 + .7, keu("voTay")); }      // 23:24: đuốc sáng chỉ còn vỗ tay
    } else if (che === "tuong") {
      S.ket = T_HET + .3;
      // 23:24: bước này chỉ còn vỗ tay lúc cả bốn cặp bắt tay xong, khúc vui lúc ngọn đuốc thứ hai sáng, một tiếng trống lúc vầng sáng lan ra
      hen(t + T_BAT + .2, keu("voTay"));
      hen(t + T_SANG2 + .3, keu("ken"));
      hen(t + T_CHAY, keu("trong", 1));
    }
    if (che !== "an") { try { ve(t); } catch (e) { console.error(e); } }
  };
  // màn câu hỏi che kín sân: thôi vẽ, dừng các chuyển động lặp
  KC.phu = function (on) { S.phu = !!on; if (E) lop(E.g, "kc-dung", S.phu); if (!on) S.tinh = false; };
  // lúc báo tường lộ ra hết (giây, cùng đồng hồ performance.now); không đang đốt thì null
  KC.lucBaoHien = () => (S.che === "tuong" ? S.t0 + T_HET : null);
  // bản 19 (27/11 14:33, "lúc mà hoạt động kéo co diễn ra ... thì nhạc tạm tắt"): lúc lượt kéo đang phát xong hẳn (tiếng trống nấc cuối đã
  //   tắt), cùng đồng hồ performance.now tính bằng giây; không có hoạt cảnh kéo thì null. tro-choi.js (datNhac) tắt nhạc tới lúc này.
  KC.lucKeoXong = () => (S.che === "keo" && S.L && S.t0 > XA ? S.t0 + S.L.het : null);
  KC.khiBam = null;
  KC.khiXongCau5 = null;
  KC._S = S;
  KC._ve = t => ve(t);

  /* ---------- vẽ một khung hình ---------- */
  function datSao(ds, m) { ds.forEach((s, i) => lop(s, "co", !!(m >> i & 1))); }      // m: bit q − 1 bật là câu q có sao
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
      const e = f.d / .45, x = 60 + (k * 197) % 1640 + f.b * (90 + 440 * e + (k % 3) * 60);
      kieu(el, "opacity", (Math.sin(Math.PI * e) * (.55 + .4 * ngau(k, 1))).toFixed(3));
      kieu(el, "transform", "translate(" + px(x) + "," + px(572 + k * 26) + ")");
      lop(el, "vang", !!f.vang);
    });
    const hoDung = [[null, null], [null, null]];
    fx.ho.forEach(o => { hoDung[ben(o.doi)][o.nho || fx.no ? 0 : o.i % 2] = o; });
    for (let b = 0; b < 2; b++) for (let k = 0; k < 2; k++) {
      const el = E.ho[b][k], o = hoDung[b][k];
      if (!o) { kieu(el, "opacity", "0"); continue; }
      const O = BEN_O[b], ax = [120, 430][k], x = b ? O.x + O.w - ax : O.x + ax, y = DAU_Y - (k ? 108 : 94) - 18 * o.d;
      chu(el, o.nho ? HO_THUA[o.i ? 1 : 0] : HO_THANG[o.i % 4]); lop(el, "nho", !!o.nho);
      kieu(el, "opacity", (o.d < .62 ? 1 : Math.max(0, 1 - (o.d - .62) / .26)).toFixed(3));
      kieu(el, "transform", "translate(" + px(x) + "," + px(y) + ")" + (b ? " translateX(-100%)" : "") + " rotate(" + (b ? 5 : -5) + "deg) scale(" + ob(lin(o.d, 0, .16)).toFixed(3) + ")");
    }
    if (fx.no) {
      const f = fx.no, sc = ob(lin(f.d, 0, .18)) * (1 + .03 * Math.sin(f.d * 22));
      chu(E.no, f.chu);
      if (E.no._lop !== f.lop) { E.no._lop = f.lop; E.no.className = "kc-no " + f.lop; }
      kieu(E.no, "left", px(f.x != null ? f.x : 960));
      kieu(E.no, "opacity", (f.d < f.dai - .25 ? 1 : Math.max(0, (f.dai - f.d) / .25)).toFixed(3));
      kieu(E.no, "transform", "translate(-50%,0) rotate(" + (f.x != null ? -3 : -4) + "deg) scale(" + sc.toFixed(3) + ")");
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
      const O = BEN_O[ben(f.doi)], T = f.d, r1 = ngau(j, 1), r2 = ngau(j, 2), r3 = ngau(j, 3);
      if (el._mau !== f.doi * 100 + j) { el._mau = f.doi * 100 + j; el.style.background = HOA_MAU[j % 5] || RD.DOI[f.doi].mau; }
      kieu(el, "opacity", (T < 1.2 ? 1 : Math.max(0, 1 - (T - 1.2) / .4)).toFixed(3));
      kieu(el, "transform", "translate(" + px(O.x + O.w / 2 + dx + (r1 - .5) * 560 + (r1 - .5) * 150 * T) + "," + px(O.y + 70 - (330 + r2 * 250) * T + 560 * T * T) + ") rotate(" + (T * (300 + r3 * 500)).toFixed(0) + "deg) scale(" + (.7 + r3 * .6).toFixed(2) + ")");
    });
    if (fx.tia != null) {
      const e = fx.tia / .34, o = fx.tiaO || [960, 671];          // ở dải lụa giữa dây
      kieu(E.tia, "left", px(o[0])); kieu(E.tia, "top", px(o[1]));
      kieu(E.tia, "opacity", (1 - e).toFixed(3));
      E.tiaI.forEach((el, k) => kieu(el, "transform", "rotate(" + (k * 45 + 22) + "deg) translateY(" + px(-(30 + 64 * e)) + ") scaleY(" + (1 - .6 * e).toFixed(2) + ")"));
    } else kieu(E.tia, "opacity", "0");
  }

  // tư thế của hai đội (chỉ số theo ĐỘI) tại giây thứ u của bước đang vẽ; luc là lúc đội đổi sang tư thế đó, cu là tư thế ngay trước
  // 25/11 16:18 thầy Thịnh: "cho thêm hiệu ứng kéo ở mỗi câu, ví dụ câu 1 là bình thường, câu 2 là có bạn bị trượt chân, câu 3 là có bạn
  //   quay lưng kéo, câu 4 là có bên hạ người xuống để kéo" và "đội nào thắng thì cho 2 bạn nữ ôm nhau, 2 bạn nam nhảy theo kiểu siu của
  //   ronaldo. còn bên thua thì buồn bã". 17:19: "chỉ có câu 5 khi chiến thắng thì các bạn học sinh mới nhảy lên thôi". Tôi xếp (thầy chưa
  //   duyệt): câu 2 đội bị kéo có bạn trượt chân; câu 3 đội đang kéo có bạn quay lưng kéo; câu 4 đội đang kéo hạ người; câu 5 (thầy không
  //   nêu) đội đang kéo hạ người và đội bị kéo trượt chân. Câu 1 đến câu 4 kéo xong thì hai đội về lại dáng kéo, không ai nhảy. Kéo xong
  //   câu 5: đội thắng CẢ VÁN (W) buông dây mừng, đội kia buồn. Hòa cả ván: hai đội cầm dây tới lúc thắp đuốc rồi cùng mừng.
  function tuTheDoi(che, q, u, W) {
    const tt = ["keo", "keo"], luc = [XA, XA], cu = ["", ""];
    const dat = (d, p, t) => { if (u >= t && tt[d] !== p) { cu[d] = tt[d]; tt[d] = p; luc[d] = t; } };
    const K = trong(q).cau[q], L = S.L;
    if (che === "keo" && K && L) {
      const n = K.buoc.length;
      if (n) {
        const phe = K.buoc[0] > 0 ? 0 : 1, kia = 1 - phe, tA = L.moc[0] - .5, tR = L.het + T_MUNG;
        if (q === 2) dat(kia, "truot", L.moc[0] + .1);
        if (q === 3) dat(phe, "quay", tA);
        if (q === 4) dat(phe, "ha", tA);
        if (q === 5) { dat(phe, "ha", tA); dat(kia, "truot", L.moc[Math.min(1, n - 1)] + .1); }
        if (q === 5 && W) { dat(W - 1, "thang", tR); dat(2 - W, "thua", tR); } else { dat(0, "keo", tR); dat(1, "keo", tR); }
      } else {
        if (q === 5 && W && u >= L.het + T_MUNG) { dat(W - 1, "thang", L.het + T_MUNG); dat(2 - W, "thua", L.het + T_MUNG); }      // câu 5 hòa nhưng cả ván đã có đội thắng
      }
    } else if (che === "dich" || che === "tuong") {
      if (W) { tt[W - 1] = "thang"; tt[2 - W] = "thua"; }          // dáng lúc vừa kéo xong câu 5 (dây đã buông)
      else { const luc0 = che === "dich" ? .15 : XA; dat(0, "thang", luc0); dat(1, "thang", luc0); }
      // 17:34 thầy: "đội chiến thắng sẽ qua bắt tay cái đội bên kia"; 18:22: "cả bốn bạn bên này qua bắt bốn bạn bên kia". Tư thế "ban": hình
      //   cả đội ẩn đi, hiện hình từng bạn (veBan). Đội thắng đứng thẳng lại rồi đi sang, đội kia đứng dậy bước ra đón.
      if (che === "tuong") {
        if (W) { dat(W - 1, "ban", T_DI - .2); dat(2 - W, "ban", T_DOI_KIA); }
        else { dat(0, "ban", T_DI - .2); dat(1, "ban", T_DI - .2); }
      }
    }
    return { tt: tt, luc: luc, cu: cu };
  }

  // một nửa sợi dây giữa hai đội: từ a tới b, dải vân lặp theo chiều dài (25/11 16:18 thầy: "khi kéo sợi dây ở giữa nó cứ bị tách rời nè")
  //   k: tỉ lệ bề dày (tư thế mà sợi dây trong hình mảnh hơn dải vân, HINH.dayTT): thu cả khúc dây quanh trục của nó, chiều dài giữ nguyên
  function veDay(el, a, b, H, phai, k) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dai = Math.hypot(dx, dy) || 1, ux = dx / dai, uy = dy / dai, lui = phai ? 1 : 6;      // đầu ở nắm tay thò thêm 6 px vào dưới bàn tay
    k = k || 1;
    kieu(el, "width", px((dai + 7) / k));
    kieu(el, "transform", "translate(" + px(a[0] - ux * lui) + "," + px(a[1] - uy * lui - H.vanH * H.s / 2) + ") rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2) + "deg)" + (k !== 1 ? " scale(" + k.toFixed(3) + ")" : ""));
  }
  // 26/11 11:09 (bản mẫu): hình Toán ở khúc dây giữa hai đội đi theo sợi dây. Cờ phép tính treo thẳng xuống từ dây (đung đưa bằng CSS, giật
  //   theo nhịp kéo cùng dải lụa); hạt hình học xâu vào dây nên nghiêng theo dây; dải thước là hai nửa đi từ dải lụa ra tới nắm tay hai đội
  //   (số đếm từ dải lụa). Dây rơi xuống đất thì cờ nằm bẹp như dải lụa.
  function veToan(A, M, roi) {
    if (!E.toan.length && !E.thuocDo.length) return;
    const dx = A[1][0] - A[0][0], dy = A[1][1] - A[0][1], dai = Math.hypot(dx, dy) || 1, ux = dx / dai, uy = dy / dai, goc = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2);
    E.toan.forEach((el, i) => {
      const o = TOAN_O[i];
      kieu(el, "transform", "translate(" + px(M[0] + ux * o) + "," + px(M[1] + uy * o) + ")" + (KIEU_DAY === "hinh" ? " rotate(" + goc + "deg)" : roi > 0 ? " scaleY(" + (1 - .55 * roi).toFixed(3) + ")" : ""));
      lop(el, "nam", roi > .5);
    });
    E.thuocDo.forEach((el, b) => {
      const w = Math.min(THUOC_DAI, Math.hypot(A[b][0] - M[0], A[b][1] - M[1]) + 5);
      kieu(el, "width", px(w));
      kieu(el, "transform", "translate(" + px(b ? M[0] : M[0] - w) + "," + px(M[1] - THUOC_CAO / 2) + ") rotate(" + goc + "deg)");
    });
  }
  // hai đội và sợi dây. P (mọi mảng theo BÊN): tt tư thế ("ban": hình cả đội ẩn, veBan vẽ từng bạn), ng độ ngả (độ, dương là ngả sang
  //   phải), nhay độ nhảy, rung, pop (giây từ lúc đổi tư thế), roi (0 đang cầm dây, 1 dây đã nằm dưới đất), vang (bên đang toả sáng, -1
  //   không), mung (đang nhảy mừng).
  //   Ngả người bằng phép xô nghiêng (skewX) quanh chân nên nắm tay chỉ dịch ngang, sợi dây không bị nhấc lên hạ xuống theo.
  //   Đầu dây (nắm tay trong cùng) tính lại từng khung hình theo đúng phép dời, xô, co của hình đội, nên dây luôn nối khít tay với tay.
  function veDoi(t, P) {
    const A = [null, null];
    let roiTB = 0;
    for (let b = 0; b < 2; b++) {
      const d = ben(b), H = HINH[d], O = BEN_O[b], bc = E.boc[d], p = P.tt[b], N = H.nam[p], ngoai = b ? 1 : -1;
      E.hinh[d].forEach(o => kieu(o.el, "visibility", o.p === p ? "visible" : "hidden"));
      let tx = 0, ty = P.nhay[b], nga = P.ng[b], sx = 1, sy = 1;
      if (N) { const g = .5 + .5 * Math.sin(t * 2.86 + b * 1.3); tx += ngoai * 3 * g; nga += ngoai * .7 * g; }          // gồng nhẹ lúc đang cầm dây
      else if (P.mung[b]) ty -= 13 * Math.abs(Math.sin(t * 5.6 + b));                                                  // nhảy mừng
      if (P.rung) tx += 1.6 * P.rung * Math.sin(t * 75 + b * 2);
      const dp = P.pop[b];
      if (dp >= 0 && dp < .22) { const s = Math.sin(Math.PI * dp / .22); sx = 1 + .035 * s; sy = 1 - .05 * s; }           // nhún một cái lúc đổi tư thế
      const kt = toTT(d, p); sx *= kt; sy *= kt;          // 27/11 9:53: đội áo thể dục lúc cầm dây vẽ to hơn (HINH.toTT)
      kieu(bc, "transform", "translate(" + px(tx) + "," + px(ty) + ") skewX(" + (-nga).toFixed(2) + "deg)" + (sx !== 1 || sy !== 1 ? " scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")" : ""));
      lop(bc, "vang", P.vang === b);
      kieu(E.bongDoi[b], "opacity", p === "ban" ? "0" : "1");
      // đầu dây ở nắm tay trong cùng (tâm của phép biến hình là 50% 97% khung)
      const ox = O.w / 2, oy = O.h * .97, n = N || H.nam.keo;
      const lx = ((b ? n[0] * H.s : O.w - n[0] * H.s) - ox) * sx, ly = (n[1] * H.s - oy) * sy;
      const gx = O.x + ox + lx - ly * Math.tan(nga * Math.PI / 180) + tx, gy = O.y + oy + ly + ty, k = P.roi[b];
      A[b] = k > 0 ? [gx + ((b ? O.x : O.x + O.w) - gx) * k + (P.day || 0) * k, gy + (DAY_DAT - gy) * k] : [gx, gy];
      kieu(E.dayDat[b], "opacity", lin(k, .75, 1).toFixed(2));          // khúc dây nằm sẵn dưới chân đội chỉ hiện khi dây đã rơi gần tới đất
      kieu(E.dayDat[b], "transform", P.day ? "translateX(" + px(P.day) + ")" : "");      // 27/11: hai đội về chỗ, sợi dây nằm yên bên phía đội thắng
      roiTB += k / 2;
    }
    // 27/11 9:53 (bản 15): nút nơ (cũng là chỗ hai nửa dây gặp nhau) buộc đúng giữa sợi dây theo luật: dây ở vạch giữa (0 nấc) thì nút nơ ở
    //   ngay vạch giữa (x 960 của sân), dây lệch v nấc thì cả cụm dời dx = v × PXN nên nơ lệch đúng chừng ấy. Bản 14 trở về trước lấy trung
    //   điểm hai nắm tay nên nơ, cờ nằm lệch trái 18,5 px. Dây rơi xuống đất (phần kết) thì nút nơ dời theo P.day như hai đầu dây.
    const mx = 960 + (P.day || 0) * roiTB, tM = Math.max(.05, Math.min(.95, (mx - A[0][0]) / ((A[1][0] - A[0][0]) || 1)));
    const M = [A[0][0] + (A[1][0] - A[0][0]) * tM, A[0][1] + (A[1][1] - A[0][1]) * tM];
    const kDay = b => { const H = HINH[ben(b)], v = H.dayTT && H.dayTT[P.tt[b]]; return v ? v / H.vanH : 1; };
    veDay(E.day[0], A[0], M, HINH[ben(0)], false, kDay(0));
    veDay(E.day[1], M, A[1], HINH[ben(1)], true, kDay(1));
    // dải lụa đỏ buộc ở giữa dây: che chỗ hai nửa dây gặp nhau; dây rơi xuống đất thì dải lụa nằm bẹp
    kieu(E.neo, "transform", "translate(" + px(M[0] - NEO[0]) + "," + px(M[1] - NEO[1]) + ")" + (roiTB > 0 ? " scaleY(" + (1 - .55 * roiTB).toFixed(3) + ")" : ""));
    lop(E.neo, "nam", roiTB > .5);
    veToan(A, M, roiTB);
    kieu(E.chuVach, "opacity", (1 - roiTB).toFixed(2));          // dải lụa nằm đè lên nhãn "VẠCH GIỮA" thì ẩn nhãn
  }

  // Từng bạn lúc bắt tay (25/11 18:22 thầy: "bắt tay thì cả bốn bạn bên này qua bắt bốn bạn bên kia"). LB: lịch của lichBat (null: không
  //   phải cảnh bắt tay, ẩn hết); hien[b]: giây kể từ lúc đội đứng bên b đổi sang hình từng bạn (âm: đội đó còn là hình cả đội). Bạn đang
  //   đi thì nhún theo nhịp chân và hơi ngả về phía trước; tới nơi thì cặp đó bắt tay: hai bạn nhún nhẹ mấy cái, tia sáng loé ở hai bàn
  //   tay. Đội đi sang vẽ đè lên trên và đứng nhích ra phía người xem, để lúc đi ngang qua bạn đội kia nhìn vẫn rõ.
  function veBan(t, u, LB, hien) {
    for (let d = 0; d < 2; d++) {
      const b = ben(d), h = LB ? hien[b] : -1;
      E.ban[d].forEach((o, k) => {
        if (h < 0) { mo(o.el, 0); return; }
        const L = LB.ban[b][k], e = em(lin(u, L.t0, L.t1)), x = L.x0 + (L.x1 - L.x0) * e, c = LB.cap[L.cap], truoc = L.di && (b === 0 || !LB.ban[0][0].di);
        const dangDi = u > L.t0 && u < L.t1 ? Math.min(1, (u - L.t0) / .2, (L.t1 - u) / .22) : 0, bt = u - c.luc;
        let ty = 0, nga = 0, sx = 1, sy = 1;
        if (dangDi > 0) { ty -= 7 * dangDi * Math.abs(Math.sin(t * 9.5 + k * 1.7 + b)); nga = 2.6 * dangDi; }
        if (bt >= 0 && bt < 1.6) ty -= 3.2 * Math.sin(Math.PI * 2 * bt / .32) * Math.exp(-bt * 1.5);
        if (h < .22) { const s = Math.sin(Math.PI * h / .22); sx = 1 + .05 * s; sy = 1 - .06 * s; }      // nhún một cái lúc vừa đứng thẳng lại
        mo(o.el, 1);
        kieu(o.el, "zIndex", truoc ? "2" : "1");
        kieu(o.el, "transform", "translate(" + px(x) + "," + px(GND + (truoc ? BAT_TRUOC : 0)) + ")");
        kieu(o.img, "transform", (o.lat ? "scaleX(-1) " : "") + "translateY(" + px(ty) + ") rotate(" + nga.toFixed(2) + "deg)" + (sx !== 1 ? " scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")" : ""));
      });
    }
    E.tiaBat.forEach((T, j) => {
      const bt = LB ? u - LB.cap[j].luc : -1;
      if (bt < 0 || bt >= 1.02) { kieu(T.el, "opacity", "0"); return; }
      const e = (bt % .34) / .34;                      // loé ba lần
      kieu(T.el, "left", px(LB.cap[j].x)); kieu(T.el, "top", px(LB.cap[j].y));
      kieu(T.el, "opacity", (1 - e).toFixed(3));
      T.i.forEach((el, k) => kieu(el, "transform", "rotate(" + (k * 45 + 22) + "deg) translateY(" + px(-(26 + 52 * e)) + ") scaleY(" + (1 - .6 * e).toFixed(2) + ")"));
    });
  }

  // tri thức bay lên từ đuốc bên b. tau: giây kể từ lúc thắp (âm: chưa thắp; quá TRI_DAI: hết đợt bay lúc thắp); chay: đuốc đang cháy
  //   (hết đợt lúc thắp thì TRI_NEN hình đầu bay lên thong thả theo đồng hồ t). Mỗi hình đi từ ngọn lửa lên, lượn qua lại rộng dần, lớn dần.
  //   bay (giây, bỏ trống hay âm là chưa): mọi hình rời chỗ đang bay, lượn một đường cong về điểm C (số 51 trên báo tường); hình nào lúc đó
  //   không có trên màn hình thì chui ra từ ngọn lửa rồi bay theo.
  function triCho(b, k, e, dot) {
    // mỗi hình một làn riêng (TRI_LAN), lên đều tay, xoè dần ra hai bên, lớn dần; đuốc bên phải thì các làn soi gương lại
    const chieu = b ? -1 : 1, r1 = ngau(k, 5 + b), r2 = ngau(k, 9 + b);
    return [DUOC[b].x + chieu * TRI_LAN_BO[ben(b)][k] * Math.pow(Math.min(1, e / .3), .6) + 5 * e * Math.sin(Math.PI * 2 * (e * 1.1 + r1)), MIENG - 60 - TRI_CAO * e,     // 19:25: xoè hết làn ngay từ 3 phần 10 quãng đường, cho các hình to không chạm nhau
      5 * Math.sin(Math.PI * 2 * (e * 1.2 + r2)), TRI_CO0 + (TRI_CO - TRI_CO0) * Math.pow(e, .6)];
  }
  function veTri(b, tau, t, chay, bay, C) {
    const ds = E.tri[b], coBay = bay != null && bay > 0, tauX = coBay ? tau - bay : tau, tX = coBay ? t - bay : t, dot = tauX > 0 && tauX < TRI_DAI;
    if (!dot && !chay && !coBay) { if (!ds._tat) { ds._tat = true; ds.forEach(el => kieu(el, "opacity", "0")); } return; }
    ds._tat = false;
    const moNen = dot ? 1 : lin(tauX, TRI_DAI, TRI_DAI + .8) * .9, buocK = TRI_CACH;
    ds.forEach((el, k) => {
      let e;
      if (dot) e = (tauX - k * buocK) / TRI_SONG;
      else if (k < TRI_NEN && chay) { const f = tX / TRI_VONG + k / TRI_NEN; e = f - Math.floor(f); }
      else e = -1;
      const hien = e > 0 && e < 1;
      let P, a;
      if (!coBay) {
        if (!hien) { kieu(el, "opacity", "0"); return; }
        P = triCho(b, k, e, dot); a = moNen * Math.max(0, Math.min(1, (e - .05) / .15)) * Math.min(1, (1 - e) / .16);
      } else {
        const P0 = hien ? triCho(b, k, e, dot) : triCho(b, k, .03, true), a0 = hien ? moNen * Math.max(0, Math.min(1, (e - .05) / .15)) * Math.min(1, (1 - e) / .16) : 0;
        const tre = hien ? (k % 5) * .04 : .2 + ((k * 7) % TRI) / TRI * .45, f = (bay - tre) / TRI_BAY;
        if (f >= 1 || (f <= 0 && !hien)) { kieu(el, "opacity", "0"); return; }
        if (f <= 0) { P = P0; a = a0; }
        else {
          const g = f * f * (3 - 2 * f) * .35 + f * f * .65, Qx = P0[0] + (C[0] - P0[0]) * .3, Qy = Math.max(24, Math.min(P0[1], 330) - 170), h1 = 1 - g;
          P = [h1 * h1 * P0[0] + 2 * h1 * g * Qx + g * g * C[0], h1 * h1 * P0[1] + 2 * h1 * g * Qy + g * g * C[1], P0[2] + 50 * g * (b ? -1 : 1), (hien ? P0[3] : .9) * (1 - .5 * g)];
          a = Math.min(1, a0 + f / .12, (1 - f) / .1);
        }
      }
      kieu(el, "opacity", a.toFixed(3));
      kieu(el, "transform", "translate(" + px(P[0]) + "," + px(P[1]) + ") translate(-50%,-50%) rotate(" + P[2].toFixed(1) + "deg) scale(" + P[3].toFixed(3) + ")");
    });
  }

  // 26/11 11:09 (bản mẫu): dòng công thức chạy dọc thân đuốc bên b rồi xuyên qua ngọn lửa. tm: giây kể từ lúc dòng đầu chui ra khỏi đế đá
  //   (âm: không có). Trong MACH_LEO giây đầu dòng đầu chạy nhanh từ đế lên tới miệng chảo (lúc đó lửa bùng), sau đó cả dòng chạy đều MACH_V
  //   điểm ảnh mỗi giây, hết bộ thì quay vòng. Khung .kc-mach cắt hai đầu (mờ dần): dưới là mặt đế đá, trên là gần đỉnh lửa; qua miệng chảo
  //   thì chữ to dần.
  function veMach(b, tm) {
    const C = E.mach[b];
    if (!(tm >= 0)) { if (C._tat !== true) { C._tat = true; mo(C.el, 0); } return; }
    if (C._tat !== false) { C._tat = false; mo(C.el, 1); }
    const bo = MACH_BO[ben(b)], phi = tm < MACH_LEO ? MACH_CHAO * tm / MACH_LEO : MACH_CHAO + MACH_V * (tm - MACH_LEO);
    C.i.forEach((el, k) => {
      const g = bo.ds[k];
      if (!g) { kieu(el, "opacity", "0"); return; }
      const z = phi - g.o + g.dai / 2 + 8;          // dòng này đã ló ra khỏi đế bấy nhiêu điểm ảnh (âm: chưa tới lượt)
      const x = z < 0 ? -1e4 : z % bo.L - g.dai / 2 - 8;
      if (x < -g.dai / 2 - 8 || x > MACH_DAI + g.dai * .7 + 8) { kieu(el, "opacity", "0"); return; }
      kieu(el, "opacity", "1");
      kieu(el, "transform", "translate(" + (MACH_RONG / 2) + "px," + px(MACH_DAI - x) + ") translate(-50%,-50%)" + (g.ct ? " rotate(-90deg)" : "") + " scale(" + (1 + .32 * cl((x - MACH_CHAO + 20) / 110)).toFixed(3) + ")");
    });
  }

  // mặt đất khi kéo (20:16). ds = các nấc đã kéo của câu này: { i, d (giây từ lúc kéo), sb (dây đi sang trái -1, phải 1), bw (BÊN đang kéo),
  //   manh, p0, p1 (vị trí dây trước, sau nấc) }; co = đang ở bước kéo. Hết bước kéo thì cả lớp mờ dần (transition trong CSS).
  function veDat(ds, co, hg) {
    kieu(E.dat, "opacity", co ? "1" : "0");
    if (!co) { if (!E.soi._tat) { E.soi._tat = true; E.soi.forEach(el => kieu(el, "opacity", "0")); } return; }
    E.soi._tat = false;
    const dxCua = p => hg * PXN * Math.max(-RD.NAC_HIEN, Math.min(RD.NAC_HIEN, p));
    const chanX = (b, k) => { const O = BEN_O[b], f = chanF(b, k); return phongX(b, b ? O.x + O.w * f : O.x + O.w * (1 - f)); };
    const nutHien = [], soiHien = [], vet = [null, null];
    let vg = null;
    ds.forEach(f => {
      const x0 = dxCua(f.p0), x1 = dxCua(f.p1), kia = 1 - f.bw, v = vet[kia] || (vet[kia] = { lo: x0, hi: x0 });
      v.lo = Math.min(v.lo, x0, x1); v.hi = Math.max(v.hi, x0, x1);
      if (f.d < .6) vg = f;
      if (f.i * 2 + 1 >= NUT) return;
      const cap = f.i % 2 ? [1, 3] : [0, 2], co0 = Math.min(1.25, .8 + .1 * f.i) * (f.manh ? 1.3 : 1);
      // vết nứt: bung ra dưới bàn chân đội đang kéo đúng lúc giật dây, kéo càng nhiều nấc càng to; nấc thưởng, nấc gấp đôi thì có ánh vàng
      cap.forEach((k, j) => {
        const n = f.i * 2 + j, el = E.nutDat[n], e = lin(f.d, j * .05, j * .05 + .2);
        if (e <= 0) return;
        nutHien[n] = true;
        const sc = co0 * (.2 + .8 * ob(e));
        kieu(el, "opacity", Math.min(1, e * 4).toFixed(3));
        kieu(el, "transform", "translate(" + px(chanX(f.bw, k) + x0 + (ngau(n, 1) - .5) * 18) + "," + px(GND + 2 + 9 * ngau(n, 2)) + ") scale(" + (ngau(n, 3) < .5 ? -sc : sc).toFixed(3) + "," + sc.toFixed(3) + ")");
        lop(el, "vang", f.manh);
      });
      // sỏi văng lên từ hai vết nứt rồi rơi xuống sân
      if (f.d < 1.4) {
        const g0 = (f.i % 2) * 12;
        for (let j = 0; j < 12; j++) {
          const r1 = ngau(j, f.i * 5 + 1), r2 = ngau(j, f.i * 5 + 2), r3 = ngau(j, f.i * 5 + 3), G = 1500;
          const vx = (r1 - .5) * (f.manh ? 620 : 460) - f.sb * 70, vy = -(280 + 300 * r2) * (f.manh ? 1.18 : 1), sau = 4 + 24 * r3;
          const roi = (-vy + Math.sqrt(vy * vy + 2 * G * sau)) / G, T = Math.min(f.d, roi), a = f.d < roi ? Math.min(1, f.d / .04) : 1 - (f.d - roi) / .4;
          if (a <= 0) continue;
          const el = E.soi[g0 + j];
          soiHien[g0 + j] = true;
          kieu(el, "opacity", a.toFixed(3));
          kieu(el, "transform", "translate(" + px(chanX(f.bw, cap[j % 2]) + x0 + vx * T) + "," + px(GND + vy * T + .5 * G * T * T) + ") rotate(" + (T * (300 + 600 * r3) * (r1 < .5 ? -1 : 1)).toFixed(0) + "deg) scale(" + (.7 + .7 * r2).toFixed(2) + ")");
        }
      }
    });
    E.nutDat.forEach((el, n) => { if (!nutHien[n]) kieu(el, "opacity", "0"); });
    E.soi.forEach((el, n) => { if (!soiHien[n]) kieu(el, "opacity", "0"); });
    // vệt trượt: đội bị kéo trượt tới đâu thì hai vệt dưới chân dài tới đó
    for (let b = 0; b < 2; b++) for (let k = 0; k < 4; k++) {
      const el = E.vetDat[b * 4 + k], v = vet[b], dai = v ? v.hi - v.lo : 0;
      if (dai < 3) { kieu(el, "opacity", "0"); continue; }
      kieu(el, "opacity", Math.min(1, dai / 22).toFixed(3));
      kieu(el, "width", px(dai + 46));
      kieu(el, "transform", "translate(" + px(chanX(b, k) + v.lo - 23) + "," + px(GND - 13 + (k % 2) * 4) + ")");
    }
    // vòng chấn động loang ra trên sân dưới chân đội đang kéo
    if (vg) {
      const O = BEN_O[vg.bw], e = vg.d / .6;
      kieu(E.vongDat, "opacity", ((1 - e) * (vg.manh ? .95 : .6)).toFixed(3));
      kieu(E.vongDat, "transform", "translate(" + px(O.x + O.w / 2 + dxCua(vg.p0)) + "," + px(GND + 6) + ") translate(-50%,-50%) scale(" + (.3 + (vg.manh ? 1.05 : .8) * eo(e)).toFixed(3) + ")");
      lop(E.vongDat, "vang", vg.manh);
    } else kieu(E.vongDat, "opacity", "0");
  }

  // dòng chữ vàng "ĐỘI n CHIẾN THẮNG" bên phía đội thắng. o = { doi (1, 2), b (bên), d (giây từ lúc hiện), mo (0..1) } hoặc null
  function veThang(o) {
    if (!o || o.d <= 0 || o.mo <= 0) { mo(E.thang, 0); return; }
    E.thangDoi.forEach(el => chu(el, "ĐỘI " + o.doi));
    kieu(E.thang, "left", px(THANG_X[o.b]));
    mo(E.thang, lin(o.d, 0, .15) * o.mo);
    kieu(E.thang, "transform", "translate(-50%,0) rotate(-3deg) scale(" + (o.d < .5 ? .3 + .7 * ob(lin(o.d, 0, .5)) : 1).toFixed(3) + ")");
  }

  function ve(t) {
    const che = S.che, q = S.q, u = t - S.t0;
    const tran = che === "hoi" || che === "keo", ketCanh = che === "dich" || che === "tuong";
    const cuoi = trong(5), W = cuoi.thang, hg = huong();
    let p = 0, sao = [0, 0], lit = [0, 0], thap = [-1, -1], bayTri = -1, LB = null, thangChu = null;
    const mach = [null, null];                        // giây kể từ lúc công thức bắt đầu chạy lên thân đuốc bên b (null: bước này không thắp đuốc đó)
    const C51 = (RD.SanKhau && RD.SanKhau.C51) || [955, 66];
    let sx = 0, sy = 0, la = 0, kh = 0, khD = 0, khLuc = 0, dangKeo = 0, moHUD = 1, an = 0;      // an: 0..1, các khung của lượt kéo mờ đi khi cả ván đã có đội thắng
    const buiT = [], datT = [];
    const qua = [null, null];
    // hiệu ứng khi kéo (25/11 13:44 thầy Thịnh: "nhớ cho thêm hiệu ứng khi kéo để nhìn đẹp hơn"): hai đội ngả người theo từng nhịp, lấy đà trước
    //   nhịp đầu, vệt gió, tia sáng ở dải lụa, tiếng hò trên đầu, lá rụng, chữ "KÉO!" và "VƯỢT LÊN!" giữa sân; hoa giấy và nhảy mừng chỉ sau câu 5
    const ng = [0, 0], nhay = [0, 0], fx = { vut: null, tia: null, ho: [], la: [], no: null, hoa: null, vang: -1 };      // ng, nhay, vang: theo BÊN
    let rung = 0;

    /* --- trạng thái theo bước --- */
    if (che === "hoi") { const B = trong(q - 1); p = B.vt; sao = saoToi(q - 1); }
    else if (che === "keo") {
      const B = trong(q - 1), K = trong(q).cau[q], L = S.L;
      p = B.vt; sao = saoToi(q - 1);
      if (K && L) {
        K.buoc.forEach((b, i) => {
          const d = u - L.moc[i];
          if (d > 0) {
            const w = b > 0 ? 0 : 1, bw = ben(w), sb = hg * b, manh = K.gapDoi || i >= K.nac;       // w: đội đang kéo; sb: dây đi sang trái (-1) hay phải (1)
            const p0 = p;
            p += b * ob(cl(d / DAI)); kh = i + 1; khD = b; khLuc = d;
            datT.push({ i: i, d: d, sb: sb, bw: bw, manh: manh, p0: p0, p1: p });
            la += sb * 16 * Math.exp(-d * 3.5) * Math.sin(d * 13);
            if (d < .22) { const a = (manh ? 8 : 6) * (1 - d / .22); sx += a * Math.sin(d * 95); sy += a * .6 * Math.cos(d * 77); }
            const e = d < .09 ? d / .09 : Math.exp(-(d - .09) * 5.2);
            ng[bw] += sb * 5 * e; ng[1 - bw] += sb * 3.6 * e;
            buiT.push({ d: d, sb: sb, thua: 1 - bw, i: i, manh: manh });
            if (d < .45) fx.vut = { b: sb, d: d, vang: manh };
            if (d < .34) fx.tia = d;
            if (d < .9) { fx.ho.push({ doi: w, i: i, d: d }); if (i === 0 || i === 3) fx.ho.push({ doi: 1 - w, i: i, d: d, nho: true }); }
            if (d < 1.9) fx.la.push({ d: d, b: -sb, i: i });
            if (manh && d < .8) fx.vang = bw;
          }
          if (d > -.1 && d < DAI + .3) dangKeo = b;
        });
        if (K.buoc.length) {
          // lấy đà trước nhịp đầu: hai đội ngả người ra sau, rung nhẹ; chữ "KÉO!" nổ giữa sân
          const t0 = L.moc[0], r = u < t0 ? eo(lin(u, t0 - .55, t0 - .3)) : 1 - lin(u, t0, t0 + .12);
          if (r > 0) { ng[0] -= 2.4 * r; ng[1] += 2.4 * r; if (u < t0) rung = r; }
          // câu 5: dòng chữ vàng "SỨC MẠNH TÌNH BẠN" hiện trước khi kéo, đội thắng câu toả sáng
          if (L.tb != null && u >= L.tb && u < L.tb + TB_DAI) { fx.vang = ben(K.thang - 1); fx.no = { chu: "SỨC MẠNH\nTÌNH BẠN", d: u - L.tb, dai: TB_DAI, lop: "tb", x: TB_X[fx.vang] }; }
          if (u >= t0 - .5 && u < t0 + .3) fx.no = { chu: "KÉO!", d: u - (t0 - .5), dai: .8, lop: "" };
          if (K.gapDoi && u >= t0 - .3 && u < L.het) fx.vang = ben(K.thang - 1);
          // đội đang bị dẫn kéo dải lụa qua vạch giữa
          if (L.vuot != null) { const d = u - L.moc[L.vuot]; if (d > 0 && d < 1.6) { const dk = K.thang || (K.buoc[0] > 0 ? 1 : 2); fx.no = { chu: "ĐỘI " + dk + " VƯỢT LÊN!", d: d, dai: 1.6, lop: "nho d" + dk }; } }
        }
        // 25/11 17:19 thầy: "chỉ có câu 5 khi chiến thắng thì các bạn học sinh mới nhảy lên thôi": kéo xong câu 5, đội thắng cả ván buông dây
        //   nhảy mừng, hoa giấy tung lên (câu 1 đến câu 4 không ai nhảy)
        if (q === 5 && W) {
          const th = u - L.het - T_MUNG;
          if (th > 0 && th < .66) nhay[ben(W - 1)] = -20 * Math.abs(Math.sin(Math.PI * th / .33));
          if (th > 0 && th < 1.6) fx.hoa = { doi: W - 1, d: th };
          thangChu = { doi: W, b: ben(W - 1), d: th - T_CT, mo: 1 };      // 17:34: dòng chữ vàng "ĐỘI n CHIẾN THẮNG" bên phía đội thắng
          an = lin(th, 0, T_AN);
        }
        if (u >= L.sao + .8) for (let d = 0; d < 2; d++) if (coSao(K, d)) sao[d] |= 1 << (q - 1);
      }
    } else if (che === "dau") { p = 0; }
    else { p = cuoi.vt; sao = saoToi(5); }
    // phần kết: hai đội buông dây, cả cụm về lại giữa sân để mỗi đội đứng sát cây đuốc của mình
    //   27/11 9:55 (bản 15): sợi dây và cái nơ nằm yên dưới đất đúng chỗ dây dừng sau câu 5 (số nấc thật); dxDay là chỗ của sợi dây
    const kep = x => Math.max(-RD.NAC_HIEN, Math.min(RD.NAC_HIEN, x)), pv = kep(p);
    const dxDay = hg * PXN * pv;
    const dx = ketCanh ? dxDay * (che === "dich" ? 1 - em(lin(u, 0, T_VE)) : 0) : dxDay;

    /* --- phần kết: đuốc sáng, tri thức bay lên, bắt tay, tất cả bay về số 51 --- */
    if (ketCanh) {
      const bW = W ? ben(W - 1) : -1;
      // 26/11 11:09 (bản mẫu): MACH_LEO giây trước lúc lửa bùng, công thức đã chạy từ đế đuốc lên (S.m0: đồng hồ lúc dòng công thức bắt đầu,
      //   giữ lại để sang bước sau dòng công thức chạy tiếp không giật)
      const sang = (b, luc) => { lit[b] = Math.max(lit[b], lin(u, luc, luc + .35)); thap[b] = u - luc; mach[b] = u - luc + MACH_LEO; S.m0[b] = S.t0 + luc - MACH_LEO; };
      if (che === "dich") {
        if (W) { sang(bW, T_D1); thangChu = { doi: W, b: bW, d: 9, mo: 1 }; } else { sang(0, T_D1); sang(1, T_D1); }
      } else {
        // đi sang bắt tay (18:22: "cả bốn bạn bên này qua bắt bốn bạn bên kia"): veBan vẽ từng bạn theo lịch LB
        LB = lichBat(W);
        if (W) thangChu = { doi: W, b: bW, d: 9, mo: 1 - lin(u, 0, .45) };
        // đuốc của đội kia sáng lên, hai ngọn đuốc cùng có sách, công thức bay lên; rồi tất cả bay về số 51
        if (W) { lit[bW] = 1; sang(1 - bW, T_SANG2); if (u >= T_SANG2) thap[bW] = u - T_SANG2; }
        else { lit[0] = lit[1] = 1; if (u >= T_SANG2) thap[0] = thap[1] = u - T_SANG2; }
        bayTri = u - T_BAY;
        for (let b = 0; b < 2; b++) qua[b] = { t0: T_BAY + .25 + b * .1, t1: T_CHAY - .06 + b * .03, a: luaTam(b), b: C51, h: 150, de: ei };
        moHUD = 1 - lin(u, T_BAY - .3, T_BAY + .1);
      }
    }

    /* --- sân --- */
    kieu(E.nhom, "transform", "translateX(" + px(dx) + ")");
    kieu(E.canh, "transform", sx || sy ? "translate(" + px(sx) + "," + px(sy) + ")" : "");
    kieu(E.den, "transform", Math.abs(la) > .02 ? "rotate(" + la.toFixed(2) + "deg)" : "");
    if (KIEU_DAY === "co") E.toanLa.forEach((el, i) => kieu(el, "transform", Math.abs(la) > .02 ? "rotate(" + (la * (i % 2 ? 1.25 : .95)).toFixed(2) + "deg)" : ""));
    const TT = tuTheDoi(che, q, u, W), P = { tt: [], ng: ng, nhay: nhay, rung: rung, pop: [-1, -1], roi: [0, 0], vang: fx.vang, mung: [false, false], day: dxDay - dx };
    const nen = { tt: [], ng: [0, 0], nhay: [0, 0], rung: 0, pop: [-1, -1], roi: [0, 0], vang: -1, mung: [false, false], day: dxDay - dx };
    let song = false;
    for (let d = 0; d < 2; d++) {
      const b = ben(d), tu = TT.tt[d], coDay = !!HINH[d].nam[tu], dd = u - TT.luc[d];
      P.tt[b] = nen.tt[b] = tu; P.pop[b] = dd;
      P.roi[b] = coDay ? 0 : HINH[d].nam[TT.cu[d]] ? ei(lin(dd, 0, .28)) : 1; nen.roi[b] = coDay ? 0 : 1;     // vừa buông dây thì dây rơi xuống đất
      P.mung[b] = nen.mung[b] = tu === "thang";
      if (coDay || P.mung[b]) song = true;
    }
    TT_BEN = P.tt;
    veDoi(t, P);
    veBan(t, u, LB, [P.tt[0] === "ban" ? P.pop[0] : -1, P.tt[1] === "ban" ? P.pop[1] : -1]);
    { const moTen = che === "tuong" ? 1 - lin(u, T_DI - .1, T_DI + .3) : 1; E.tenDoi.forEach(el => mo(el, moTen)); }      // nhãn tên đội dưới chân: hai đội rời chỗ thì ẩn
    S.doi = nen; S.song = song; S.chay = lit[0] >= 1 || lit[1] >= 1 ? [lit[0] >= 1, lit[1] >= 1] : null;
    for (let b = 0; b < 2; b++) {
      const a = lit[b];
      mo(E.lua[b], a); mo(E.quang[b], a); lop(E.duoc[b], "sang", a > .5); lop(E.huy[b], "sang", a > .5);
      if (a > 0) kieu(E.lua[b], "transform", a < 1 ? "scale(" + (.3 + .7 * ob(a)).toFixed(3) + ")" : "");
      veTri(b, thap[b] >= 0 ? thap[b] : a >= 1 ? 1e6 : -1, t, a >= 1, bayTri, C51);
      veMach(b, mach[b] != null ? mach[b] : a >= 1 ? t - S.m0[b] : -1);
      E.bui[b].forEach((el, j) => {
        let o = 0, sc = .7, bx = 0, by = 0;
        buiT.forEach(f => {                         // đội bị kéo trượt chân nên bụi to hơn, bốc cao hơn
          const thua = f.thua === b, x = (f.d - j * .06) / .8;
          if (x > 0 && x < 1) { o = Math.max(o, Math.sin(Math.PI * x) * (thua ? .92 : .6)); sc = (.55 + .5 * x) * (thua ? 1.18 : .8) * [1, .78, 1.08, .86][j]; bx = -f.sb * (16 + 34 * x); by = thua ? -20 * x : -6 * x; }
        });
        if (o > 0) { const O = BEN_O[b], x0 = b ? O.x + O.w * (1 - BUI_F[j]) : O.x + O.w * BUI_F[j]; bx += phongX(b, x0) - x0; }      // 9:53: theo cỡ hình đã phóng
        kieu(el, "opacity", o.toFixed(3));
        if (o > 0) kieu(el, "transform", "translate(" + px(bx) + "," + px(by) + ") scale(" + (j % 2 ? -sc : sc).toFixed(3) + "," + sc.toFixed(3) + ")");
      });
      // cụm bụi bốc lên ở chân đội bị kéo: tung về phía đang trượt rồi tụt lại sau, bay lên và loãng dần
      E.khoi[b].forEach((el, j) => {
        let o = 0, tf = "";
        buiT.forEach(f => {
          if (f.thua !== b || (f.i % 2) * 4 !== j - j % 4) return;
          const k = j % 4, x = (f.d - k * .07) / 1.05;
          if (x <= 0 || x >= 1) return;
          const O = BEN_O[b], cf = chanF(b, k), cx = phongX(b, b ? O.x + O.w * cf : O.x + O.w * (1 - cf));
          o = Math.pow(Math.sin(Math.PI * Math.pow(x, .6)), .9) * (f.manh ? 1 : .9);
          const sc = (.55 + 1.15 * x) * (f.manh ? 1.2 : 1) * [1.1, .82, 1, .88][k];
          tf = "translate(" + px(cx + f.sb * (44 - 120 * x)) + "," + px(GND - 34 - (f.manh ? 124 : 96) * eo(x)) + ") scale(" + (k % 2 ? -sc : sc).toFixed(3) + "," + sc.toFixed(3) + ")";
        });
        kieu(el, "opacity", o.toFixed(3));
        if (o > 0) kieu(el, "transform", tf);
      });
      const keo = dangKeo && ben(dangKeo > 0 ? 0 : 1) === b;
      kieu(E.mui[b], "opacity", keo ? (.6 + .4 * Math.sin(t * 14)).toFixed(3) : "0");
      if (keo) kieu(E.mui[b], "transform", (b ? "" : "scaleX(-1) ") + "translateX(" + px((t * 90) % 36) + ")");
    }
    veDat(datT, che === "keo", hg);
    veHieuUng(fx, t, dx);
    veThang(thangChu);
    if (kh && khLuc < .9) {
      const K = trong(q).cau[q];
      chu(E.soNac, kh > K.nac ? "+1" : String(kh));
      kieu(E.soNac, "opacity", (khLuc < .1 ? khLuc / .1 : Math.max(0, 1 - (khLuc - .5) / .4)).toFixed(3));
      kieu(E.soNac, "transform", "translateY(" + px(-khLuc * 26) + ")");
    } else kieu(E.soNac, "opacity", "0");

    /* --- nhãn câu, dải hiệu ứng, bảng 2 đội --- */
    const hud = tran ? 1 - an : 0;
    mo(E.cau, hud);
    if (tran) chu(E.cau, RD.nhanCau(q));
    const K = che === "keo" ? trong(q).cau[q] : null, L = S.L;
    if (che === "keo" && K) {
      const b = lin(u, T_SM, T_SM + .65), sm = RD.SUC_MANH[q - 1];
      mo(E.sm, b > 0 ? 1 - an : 0);
      chu(E.smTen, RD.tenHieuUng(q).toUpperCase()); chu(E.smLuat, sm.luat);          // 26/11 00:01: "Hiệu ứng <tên>"; 00:45: câu 1 là "Hiệu ứng Khai cuộc"
      kieu(E.sm, "transform", b < 1 ? "perspective(900px) rotateX(" + ((1 - ob(b)) * -90).toFixed(2) + "deg)" : "");
    } else mo(E.sm, 0);
    for (let d = 0; d < 2; d++) {
      const B = E.bang[d], C = E.chip[d];
      mo(B.el, hud); mo(C.el, tran ? an : moHUD);
      datSao(B.sao, sao[d]); datSao(C.sao, sao[d]);
      if (!tran) continue;
      let f = 0, r = null;
      if (K) { f = eo(lin(u, T_B0, T_B1)); r = K.doi[d]; }
      kieu(B.thanh, "width", r ? (r.tram * f).toFixed(1) + "%" : "0");
      chu(B.pt, r ? Math.round(r.tram * f) + "%" : "");
      html(B.nhan, r ? "Câu " + q + ": " + Math.round(r.dung * f) + "/" + r.thay + "<br>thẻ đúng" : "Câu " + q);
      lop(B.el, "thang", !!K && K.thang === d + 1 && u >= T_THANG);
    }
    // 26/11 13:29: khung bảng của đội thắng câu sáng lên (không còn lửa), thắng liền nhiều câu thì sáng hơn; sáng lên lúc báo đội thắng
    for (let d = 0; d < 2; d++) {
      const lv = che === "keo" && K && K.thang === d + 1 && u >= T_THANG ? Math.min(3, lienThang(q, d)) : 0, C = E.rang[d];
      if (C._lv !== lv) {
        C._lv = lv; const B = E.bang[d].el;
        C.className = "kc-rang" + (lv ? " sang" + lv : "") + (ben(d) ? " ben-p" : " ben-t");
        for (let k = 1; k <= 3; k++) lop(B, "sang" + k, lv === k);
      }
      mo(C, lv ? hud * eo(lin(u, T_THANG, T_THANG + .5)) : 0);
    }
    /* --- lời báo giữa màn --- */
    if (che === "keo" && K && L) {
      const a = lin(u, T_BAO, T_BAO + .35), loi = L.loi, coThuong = K.buoc.length > K.nac, tThuong = coThuong ? L.moc[K.buoc.length - 1] - .45 : 1e9;
      mo(E.bao, lin(u, T_BAO, T_BAO + .2) * (1 - an));
      chu(E.lon, loi.lon);
      kieu(E.lon, "opacity", a.toFixed(3));
      kieu(E.lon, "transform", a < 1 ? "translateY(" + px((1 - eo(a)) * -24) + ")" : "");
      // dòng "Đội n kéo 2 nấc" hiện ngay dưới; phần hiệu ứng "+ 1 nấc", "× 2" in vàng hiện sau một nhịp (nấc thưởng Đồng lòng: lúc sắp kéo nấc đó)
      const tThem = coThuong && K.goc ? Math.min(tThuong, T_DOI + .9) : T_DOI;
      html(E.keo, loi.keo ? loi.keo + (loi.them ? ' <b class="' + (u >= tThem ? "hien" : "") + '">' + loi.them + "</b>" : "") : "");
      kieu(E.keo, "opacity", lin(u, T_BAO + .25, T_BAO + .55).toFixed(3));
      html(E.vi, loi.vi);
      kieu(E.vi, "opacity", lin(u, T_VI, T_VI + .3).toFixed(3));
      // dấu ×2 (Tiếp sức, Về đích) hay +1 (Tăng tốc) rơi xuống cạnh lời báo
      const tX = loi.dau ? T_X : 1e9, x = lin(u, tX, tX + .35);
      if (x > 0) {
        chu(E.x2, loi.dau || "+1"); mo(E.x2, 1 - an);
        kieu(E.x2, "transform", "translateY(" + px((1 - ob(x)) * -110) + ") rotate(" + (-12 - (1 - x) * 30).toFixed(1) + "deg)");
      } else mo(E.x2, 0);
    } else { mo(E.bao, 0); mo(E.x2, 0); }

    /* --- thước nấc --- */
    const coThuoc = tran || che === "dau";
    mo(E.thuoc, coThuoc ? 1 - an : 0);
    if (coThuoc) {
      const mx = TH_G + hg * pv * TH_U;
      kieu(E.moc, "left", px(mx)); kieu(E.dan, "left", px(Math.max(120, Math.min(1100, mx))));
      // dải năng lượng từ vạch giữa tới mốc, nửa bảng bên đó rực lên; 20:16: màu theo BÊN (sang trái xanh dương, sang phải đỏ) qua lớp sang-t, sang-p
      const dd = pv > .05 ? 1 : pv < -.05 ? 2 : 0, benP = mx > TH_G;
      lop(E.thuoc, "dan1", dd === 1); lop(E.thuoc, "dan2", dd === 2); lop(E.thuoc, "sang-t", dd && !benP); lop(E.thuoc, "sang-p", dd && benP);
      kieu(E.nang, "left", px(Math.min(mx, TH_G))); kieu(E.nang, "width", px(Math.abs(mx - TH_G)));
      // hai quả cầu ở hai đầu thanh (20:16, kiểu Diablo): dây lệch về bên nào thì nước trong quả cầu bên đó dâng lên, bên kia vơi đi
      { const lech = hg * pv * 5; kieu(E.cauTh[0], "height", Math.max(8, Math.min(100, 50 - lech)).toFixed(1) + "%"); kieu(E.cauTh[1], "height", Math.max(8, Math.min(100, 50 + lech)).toFixed(1) + "%"); }
      chu(E.dan, RD.vietVT(Math.round(p)));
      const cu = K ? TH_G + hg * Math.max(-RD.NAC_HIEN, Math.min(RD.NAC_HIEN, K.truoc)) * TH_U : mx, xa = Math.abs(mx - cu);
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
    const sb = [false, false];
    if (che === "keo" && K && L && !(q === 5 && W)) {          // câu 5 mà cả ván đã có đội thắng: bảng đội đang mờ đi, sao hiện thẳng ở thẻ tên đội
      const e0 = lin(u, L.sao, L.sao + .8);
      if (e0 > 0 && e0 < 1) for (let d = 0; d < 2; d++) if (coSao(K, d)) {          // 12:20: sao bay vào đúng ô của câu này; câu hòa thì mỗi đội một ngôi
        const B = E.bang[d], o = B.sao[q - 1];
        const x0 = DEN[0] + dx - 22, y0 = 560, x1 = B.el.offsetLeft + o.offsetLeft + o.offsetWidth / 2 - 22, y1 = B.el.offsetTop + o.offsetTop + o.offsetHeight / 2 - 22, e = eo(e0);
        sb[d] = saoHien = true;
        kieu(E.saoBay[d], "transform", "translate(" + px(x0 + (x1 - x0) * e) + "," + px(y0 + (y1 - y0) * e - 260 * Math.sin(Math.PI * e)) + ") rotate(" + (e * 360).toFixed(0) + "deg)");
      }
    }
    E.saoBay.forEach((el, d) => kieu(el, "opacity", sb[d] ? "1" : "0"));

    /* --- băng kết quả và nút của phần kết --- */
    if (ketCanh) {
      let lon, vi = "", nut = "", nutLuc = 1e9;
      // 25/11 16:18 thầy Thịnh: "bỏ dòng sau 5 câu đội 1 dẫn 6 nấc": băng kết quả chỉ còn một dòng lớn. 17:34: đội thắng đã có dòng chữ vàng
      //   "ĐỘI n CHIẾN THẮNG" bên phía đội, băng trên cùng nói việc thắp đuốc; nút sau bước thắp đuốc là "Tiếp theo" ("sau khi tôi bấm nút tiếp theo")
      const haiDuoc = che === "tuong" && u >= T_SANG2;
      if (haiDuoc) lon = "HAI ĐỘI SẺ CHIA TRI THỨC!";          // 26/11 12:20 thầy: "cái câu hai ngọn đuốc cùng sáng đổi thành Hai đội sẻ chia tri thức"
      else if (W) lon = "ĐỘI " + W + " THẮP NGỌN ĐUỐC TRI THỨC!";
      else { lon = "HAI ĐỘI HÒA NHAU!"; vi = "Dây về lại vạch giữa: hai đội cùng thắp đuốc."; }
      if (che === "dich") { nut = "Tiếp theo"; nutLuc = T_NUT_DICH; }
      chu(E.ketLon, lon); chu(E.ketVi, vi); lop(E.ket, "mot", !vi);
      const a = che === "dich" ? lin(u, 0, .4) : haiDuoc ? lin(u, T_SANG2 + .15, T_SANG2 + .5) * moHUD : 1 - lin(u, 0, .4);
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
    for (let i = 0; i < 2; i++) veQua(i, qua[i], u);

    /* --- lửa từ số 51 lan ra phủ kín màn hình rồi tan đi, lộ báo tường ở lớp dưới ---
       25/11 22:12 thầy xem bản 5: "màn hình chuyển cảnh sang tấm thiệp của nhóm em bị lag với giật". Bản 5 đục thủng sân kéo co bằng mặt nạ
       (mask-image) đặt lại từng khung hình trên cả lớp #kc 3840 × 3240 và tô lại vành lửa cỡ đó: máy phải vẽ lại cả sân qua mặt nạ mỗi khung
       hình (đo trên máy không có card đồ hoạ: còn 9 khung hình mỗi giây, lúc thường là 23). Nay vành lửa là MỘT đĩa sáng (.kc-vong 800 px,
       viền lửa cam) chỉ phóng to bằng transform; đĩa phủ kín màn hình (V_KIN) thì sân kéo co tắt hẳn (lớp kc-lo), đĩa mờ dần là thấy báo tường. */
    if (che === "tuong") {
      const cx = 960 + C51[0], cy = 1080 + C51[1];
      const v = lin(u, T_CHAY, T_HET);
      if (v > 0) {
        const r = v < .25 ? 130 * (v / .25) : 130 + (R_KIN - 130) * em(lin(v, .25, V_KIN));
        kieu(E.vong, "transform", "translate(" + px(cx) + "," + px(cy) + ") scale(" + (r / VONG_R).toFixed(4) + ")");
        mo(E.vong, 1 - eo(lin(v, V_KIN + .02, .96)));
        lop(E.g, "kc-lo", v >= V_KIN);
      } else { mo(E.vong, 0); lop(E.g, "kc-lo", false); }
      const c = u < T_CHAY ? lin(u, T_CHAY - .12, T_CHAY) : 1 - lin(u, T_CHAY, T_CHAY + .7);
      if (E.chop._cx !== cx + "," + cy) { E.chop._cx = cx + "," + cy; kieu(E.chop, "transform", "translate(" + px(cx) + "," + px(cy) + ")"); }
      mo(E.chop, c);
      if (u >= T_HET + .15) {                      // xong: lớp kéo co ẩn hẳn, nút "Tiếp theo" của báo tường hiện ra
        S.che = "an"; E.g.hidden = true; lop(E.world, "kc-che-nut", false); lop(E.g, "kc-lo", false);
      }
    }
    if (u > S.ket + .2 && !saoHien) S.tinh = true;
  }

  // 25/11 22:30: kéo xong câu 5 thì báo cho trò chơi để tự sang bước thắp đuốc (một lần cho mỗi lần vào bước; vào bước mà không phát
  //   hoạt cảnh, ví dụ tải lại trang ở bước này, thì báo ngay)
  function tuThap(t) {
    if (S.daTu || S.che !== "keo" || S.q !== 5 || !S.L) return;
    if (t - S.t0 < S.L.het + T_MUNG + (trong(5).thang ? T_TU : T_TU_HOA)) return;
    S.daTu = true;
    if (KC.khiXongCau5) KC.khiXongCau5();
  }
  function vong() {
    requestAnimationFrame(vong);
    if (!E || S.che === "an") return;
    const t = dongHo();
    chayTieng(t);
    if (S.phu) return;
    try {
      if (!S.tinh) ve(t);
      else {                                          // sân đã đứng yên: chỉ còn hai đội gồng nhẹ hoặc nhảy mừng (dây đi theo), đuốc đang cháy thì tri thức vẫn bay lên
        if (S.song && S.doi) veDoi(t, S.doi);
        if (S.chay) for (let b = 0; b < 2; b++) if (S.chay[b]) { veTri(b, 1e6, t, true); veMach(b, t - S.m0[b]); }
      }
      tuThap(t);
    } catch (e) { console.error(e); }
  }
  KC.khoiTao = function () {
    if (E) return;
    dung();
    window.addEventListener("resize", function () { S.tinh = false; });
    requestAnimationFrame(vong);
  };
})();
