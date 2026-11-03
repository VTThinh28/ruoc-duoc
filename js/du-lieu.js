/* Rước đuốc về trường: dữ liệu cố định và cách tính điểm */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};

  RD.CHU = ["A", "B", "C", "D"];
  RD.MAXID = 60;          // bộ mã thẻ có 60 số
  RD.SO_THE = 46;         // thẻ in sẵn: 1–45 và thẻ dự phòng 46

  // 4 tổ (thiết kế 3/11/2026): bạn cầm đuốc vẽ kiểu Ghibli, mặt tự vẽ, đồng phục theo ảnh của trường.
  // anh: 520 px cao; lua: tâm ngọn lửa trên ảnh; kieu: cách di chuyển (đi, lướt, tốc biến, nhảy), mọi kiểu mất cùng thời gian
  RD.TO = [
    { n: 1, ten: "Tổ 1", mau: "#2f6fd6", nhat: "#dfe9fb", dam: "#1b4a97", anh: "anh/to-1.webp", mat: "anh/mat-1.webp", w: 280, h: 520, lua: [255, 42], kieu: "di", mo: "bạn nam áo vàng" },
    { n: 2, ten: "Tổ 2", mau: "#2f9a58", nhat: "#ddf2e4", dam: "#1d6a3b", anh: "anh/to-2.webp", mat: "anh/mat-2.webp", w: 349, h: 520, lua: [324, 40], kieu: "luot", mo: "bạn nữ áo vàng" },
    { n: 3, ten: "Tổ 3", mau: "#e9861c", nhat: "#fdead3", dam: "#a9590a", anh: "anh/to-3.webp", mat: "anh/mat-3.webp", w: 363, h: 520, lua: [340, 50], kieu: "bien", mo: "bạn nam áo thể dục" },
    { n: 4, ten: "Tổ 4", mau: "#8b52cc", nhat: "#eee2f9", dam: "#5b2f93", anh: "anh/to-4.webp", mat: "anh/mat-4.webp", w: 342, h: 520, lua: [320, 44], kieu: "nhay", mo: "bạn nữ áo thể dục" }
  ];

  // 5 câu (bản cuối 1/11/2026). Màn hình không ghi "chu vi", "diện tích", không hiện lời giải.
  RD.CAU = [
    {
      so: 1, mau: "#1f5fae", hinh: "anh/cau-1.webp", dung: "C",
      boiCanh: "Các bạn học sinh dự định mua ruy băng để dán xung quanh viền một khung ảnh hình vuông có cạnh 2 mét. Biết giá 1 mét ruy băng là 5 000 đồng.",
      hoi: "Hỏi các bạn học sinh cần bao nhiêu tiền để mua ruy băng?",
      chon: ["20 000 đồng", "10 000 đồng", "40 000 đồng", "30 000 đồng"]
    },
    {
      so: 2, mau: "#c4860a", hinh: "anh/cau-2.webp", dung: "A",
      boiCanh: "Một sân khấu hình chữ nhật có chiều dài 12 mét, chiều rộng bằng {2/3} chiều dài. Người ta mắc dây đèn xung quanh sân khấu.",
      hoi: "Hỏi dây đèn dài bao nhiêu mét?",
      chon: ["40 mét", "20 mét", "96 mét", "32 mét"]
    },
    {
      so: 3, mau: "#2b7a4b", hinh: "anh/cau-3.webp", dung: "D",
      boiCanh: "Người ta sơn kín một ô đậu xe hình bình hành có cạnh 3 mét, chiều cao tương ứng là 5 mét. Biết cứ 1 lít sơn thì sơn được 3 mét vuông.",
      hoi: "Hỏi cần bao nhiêu lít sơn?",
      chon: ["45 lít", "15 lít", "2,5 lít", "5 lít"]
    },
    {
      so: 4, mau: "#bd3a2c", hinh: "anh/cau-4.webp", dung: "B",
      boiCanh: "Một bồn hoa hình thoi có độ dài hai đường chéo là 12 mét và 9 mét.",
      hoi: "Hỏi nếu mỗi mét vuông trồng 5 cây hoa thì cần bao nhiêu cây hoa để trồng hết bồn hoa đó?",
      chon: ["540 cây", "270 cây", "54 cây", "105 cây"]
    },
    {
      so: 5, mau: "#7a3fb4", hinh: "anh/cau-5.webp", dung: "C",
      boiCanh: "Một mảnh đất hình thang có đáy lớn 10 mét, đáy nhỏ 6 mét, chiều cao 3 mét. Người ta chia đều mảnh đất đó cho 4 người thợ để trồng cỏ.",
      hoi: "Hỏi mỗi người thợ phải trồng bao nhiêu mét vuông cỏ?",
      chon: ["12 mét vuông", "24 mét vuông", "6 mét vuông", "8 mét vuông"]
    }
  ];
  RD.DIEM_CAU = [1, 1, 1, 1, 2];   // điểm tối đa mỗi câu: câu 5 là câu nước rút, gấp đôi điểm
  RD.TONG_DIEM = 6;

  // các bước của buổi chơi, theo đúng thứ tự bấm "tiếp"
  RD.BUOC = ["setup", "intro"];
  for (var q = 1; q <= 5; q++) RD.BUOC.push("q" + q, "a" + q, "r" + q);
  // finish: sương tan, tổ nhất thắp đuốc · rank: 3 tổ còn lại thắp đuốc, báo tường hiện hình và số 51 · bao: hiện toàn bộ báo tường
  RD.BUOC.push("finish", "rank", "bao");
  RD.cauCuaBuoc = function (b) { var m = /^[qar]([1-5])$/.exec(b || ""); return m ? +m[1] : 0; };
  RD.loaiBuoc = function (b) { return /^[qar][1-5]$/.test(b || "") ? b[0] : b; };

  /* ---------- danh sách tổ ---------- */
  // "1-11, 46" -> [1..11, 46]
  RD.docDanhSach = function (s) {
    var out = [], seen = {};
    String(s || "").split(/[,;\s]+/).forEach(function (p) {
      if (!p) return;
      var m = /^(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?$/.exec(p.trim());
      if (!m) return;
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (b < a) { var t = a; a = b; b = t; }
      for (var i = a; i <= b; i++) if (i >= 1 && i <= RD.SO_THE && !seen[i]) { seen[i] = 1; out.push(i); }
    });
    return out.sort(function (x, y) { return x - y; });
  };
  // [1,2,3,5,6,46] -> "1-3, 5-6, 46"
  RD.vietDanhSach = function (arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; }), out = [], i = 0;
    while (i < a.length) {
      var j = i;
      while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
      out.push(j > i ? a[i] + "-" + a[j] : String(a[i]));
      i = j + 1;
    }
    return out.join(", ");
  };
  // chia sĩ số thành 4 tổ liên tiếp; tổ cuối nhận phần dư (45 -> 11, 11, 11, 12)
  RD.chiaTo = function (siSo) {
    var n = Math.max(4, Math.min(RD.SO_THE, siSo | 0)), base = Math.floor(n / 4), du = n % 4, lists = [], start = 1;
    for (var t = 0; t < 4; t++) {
      var k = base + (t >= 4 - du ? 1 : 0);
      lists.push(start + "-" + (start + k - 1));
      start += k;
    }
    return lists;
  };
  RD.cfgMacDinh = function (ses) {
    return { ses: ses, siSo: 45, ds: RD.chiaTo(45), vang: [], at: 0 };
  };
  // thông tin lớp đã giải mã: tổ của từng thẻ, ai có mặt
  RD.lop = function (cfg) {
    cfg = cfg || RD.cfgMacDinh("");
    var vang = {}, toCua = {}, trung = [], to = [];
    (cfg.vang || []).forEach(function (id) { vang[+id] = 1; });
    for (var t = 0; t < 4; t++) {
      var ids = RD.docDanhSach((cfg.ds || [])[t] || "");
      ids.forEach(function (id) { if (toCua[id]) trung.push(id); else toCua[id] = t + 1; });
      var coMat = ids.filter(function (id) { return !vang[id] && toCua[id] === t + 1; });
      to.push({ ids: ids, coMat: coMat });
    }
    var tong = 0, coMatTong = 0;
    to.forEach(function (x) { tong += x.ids.length; coMatTong += x.coMat.length; });
    return { to: to, toCua: toCua, vang: vang, trung: trung, tong: tong, coMat: coMatTong };
  };

  /* ---------- tính điểm ---------- */
  // thẻ được lưu với khóa "t12"; m: "D" đúng, "S" sai, "V" vắng ở câu này (giáo viên chạm)
  RD.ketQuaCau = function (q, lop, scan) {
    var dung = RD.CAU[q - 1].dung, cards = (scan && scan.cards) || {}, man = (scan && scan.man) || {};
    return lop.to.map(function (x) {
      var r = { dung: 0, thay: 0, chua: [], coMat: x.coMat.length };
      x.coMat.forEach(function (id) {
        var k = "t" + id, m = man[k], l = cards[k];
        if (m === "V") return;
        if (m === "D") { r.thay++; r.dung++; return; }
        if (m === "S") { r.thay++; return; }
        if (l) { r.thay++; if (l === dung) r.dung++; return; }
        r.chua.push(id);
      });
      return r;
    });
  };
  // Điểm câu = điểm tối đa × số bạn đúng ÷ số thẻ đọc được của tổ (thẻ chưa đọc được hoặc ghi "vắng ở câu này"
  // không tính đúng cũng không tính sai), làm tròn 2 chữ số; tính bằng phần trăm điểm (số nguyên) để cộng không lệch.
  // Tổng = cộng các điểm câu đã làm tròn (đúng bằng số hiện trên TV); vị trí trên đường = tổng ÷ 6.
  RD.tinhDiem = function (cfg, scans, cauTinh) {
    var lop = RD.lop(cfg);
    var res = lop.to.map(function () { return { tram: 0, diem: 0, viTri: 0, cau: [] }; });
    for (var q = 1; q <= 5; q++) {
      if (!cauTinh[q]) continue;
      var max = RD.DIEM_CAU[q - 1];
      RD.ketQuaCau(q, lop, scans[q]).forEach(function (r, t) {
        var tram = r.thay ? Math.round(100 * max * r.dung / r.thay) : 0;
        res[t].tram += tram;
        res[t].cau[q] = { dung: r.dung, thay: r.thay, tram: tram, tron: r.thay > 0 && r.dung === r.thay };
      });
    }
    res.forEach(function (r) { r.diem = r.tram / 100; r.viTri = Math.min(1, r.tram / (100 * RD.TONG_DIEM)); });
    return res;
  };
  // 91 -> "0,91"
  RD.vietDiem = function (tram) { return ((tram | 0) / 100).toFixed(2).replace(".", ","); };
  // thứ hạng: tổ nhiều điểm hơn đứng trước; bằng điểm thì cùng hạng (và cùng thắp đuốc)
  RD.xepHang = function (res) {
    var idx = [0, 1, 2, 3].sort(function (a, b) { return res[b].tram - res[a].tram || a - b; });
    var hang = [], prev = null, h = 0;
    idx.forEach(function (t, i) {
      if (prev === null || res[t].tram !== res[prev].tram) h = i + 1;
      hang[t] = h;
      prev = t;
    });
    var nhom = [];
    idx.forEach(function (t) { var g = nhom[nhom.length - 1]; if (g && hang[g[0]] === hang[t]) g.push(t); else nhom.push([t]); });
    return { thuTu: idx, hang: hang, nhat: idx.filter(function (t) { return hang[t] === 1; }), nhom: nhom };
  };

  /* ---------- lời bình viết sẵn (dùng khi không có Claude) ---------- */
  function chon(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
  function noi(names) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " và " + names[names.length - 1];
  }
  RD.loiBinhMau = function (q, truoc, sau, seed) {
    var ten = function (t) { return RD.TO[t].ten; };
    var d = RD.vietDiem;
    var hangSau = RD.xepHang(sau), hangTruoc = RD.xepHang(truoc);
    var dau = hangSau.thuTu[0], nhi = hangSau.thuTu[1], cuoi = hangSau.thuTu[3];
    var tron = [0, 1, 2, 3].filter(function (t) { return sau[t].cau[q] && sau[t].cau[q].tron; });
    var doiDau = hangTruoc.nhat.indexOf(dau) < 0 && hangSau.nhat.length === 1 && q > 1;
    var cach = sau[dau].tram - sau[nhi].tram, sat = cach > 0 && cach <= 15;
    var s = seed | 0, lines = [];
    if (q === 5) {
      if (hangSau.nhat.length > 1) return "Không thể tin nổi: " + noi(hangSau.nhat.map(ten)) + " bằng điểm nhau, cùng về nhất và cùng thắp đuốc!";
      return chon([
        "Câu nước rút khép lại! " + ten(dau) + " về nhất với " + d(sau[dau].tram) + " điểm, ngọn đuốc đầu tiên đang chờ!",
        "Về đích rồi! " + ten(dau) + " dẫn đầu với " + d(sau[dau].tram) + " điểm, cả 4 tổ đã rước đuốc về tới trường.",
        "Bước chân cuối cùng đã xong, " + ten(dau) + " về nhất với " + d(sau[dau].tram) + " điểm!"
      ], s);
    }
    if (tron.length) {
      var t0 = tron[0];
      lines.push(chon([
        noi(tron.map(ten)) + " bứt phá: cả tổ đều đúng, cộng trọn " + d(sau[t0].cau[q].tram) + " điểm!",
        "Tuyệt vời " + noi(tron.map(ten)) + ", không bỏ sót bạn nào, ngọn đuốc lao vút lên phía trước!",
        "Cả " + noi(tron.map(ten)) + " cùng đúng hết, bước chân thật đều và chắc!"
      ], s));
    }
    if (doiDau) lines.push(chon([
      ten(dau) + " vượt lên dẫn đầu với " + d(sau[dau].tram) + " điểm! Cuộc đua đang nóng dần lên.",
      "Đổi ngôi rồi! " + ten(dau) + " đang cầm đuốc đi trước cả đoàn."
    ], s + 1));
    if (sat) lines.push(chon([
      ten(dau) + " và " + ten(nhi) + " đang sát nút, chỉ cách nhau " + d(cach) + " điểm!",
      "Khoảng cách giữa " + ten(dau) + " và " + ten(nhi) + " chỉ " + d(cach) + " điểm, câu sau sẽ quyết định nhiều!"
    ], s + 2));
    if (!lines.length) lines.push(chon([
      "Cả 4 tổ cùng tiến lên, " + ten(dau) + " đang đi trước một chút với " + d(sau[dau].tram) + " điểm.",
      ten(dau) + " giữ nhịp tốt, các tổ còn lại vẫn bám theo rất sát.",
      "Bốn ngọn đuốc cùng tiến về trường, " + ten(dau) + " tạm dẫn đầu sau câu " + q + "."
    ], s + 3));
    var dongVien = q < 4 ? chon([
      " " + ten(cuoi) + " cố lên, còn nhiều câu phía trước!",
      " " + ten(cuoi) + " vẫn còn đủ thời gian để bứt lên!",
      ""
    ], s + 4) : (q === 4 ? " Câu 5 là câu nước rút, gấp đôi điểm!" : "");
    return lines[0] + (lines[0].length < 70 ? dongVien : "");
  };
})();
