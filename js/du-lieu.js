/* Rước đuốc về trường: dữ liệu cố định và cách tính điểm */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};

  RD.CHU = ["A", "B", "C", "D"];
  RD.MAXID = 60;          // bộ mã thẻ có 60 số
  RD.SO_THE = 46;         // thẻ in sẵn: 1–45 và thẻ dự phòng 46

  // 4 tổ: màu lấy theo dải băng chéo của 4 bạn cầm đuốc
  RD.TO = [
    { n: 1, ten: "Tổ 1", mau: "#2f6fd6", nhat: "#dfe9fb", dam: "#1b4a97", anh: "anh/to-1.webp", w: 311, h: 640, dau: [278, 44], quay: 1 },
    { n: 2, ten: "Tổ 2", mau: "#2f9a58", nhat: "#ddf2e4", dam: "#1d6a3b", anh: "anh/to-2.webp", w: 366, h: 640, dau: [319, 40], quay: 1 },
    { n: 3, ten: "Tổ 3", mau: "#e9861c", nhat: "#fdead3", dam: "#a9590a", anh: "anh/to-3.webp", w: 331, h: 640, dau: [30, 39], quay: -1 },
    { n: 4, ten: "Tổ 4", mau: "#8b52cc", nhat: "#eee2f9", dam: "#5b2f93", anh: "anh/to-4.webp", w: 330, h: 640, dau: [302, 44], quay: 1 }
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
  RD.HE_SO = [1, 1, 1, 1, 2];   // câu 5 = chặng nước rút, mỗi bạn đúng 2 bước
  RD.TONG_HE_SO = 6;

  // các bước của buổi chơi, theo đúng thứ tự bấm "tiếp"
  RD.BUOC = ["setup", "intro"];
  for (var q = 1; q <= 5; q++) RD.BUOC.push("q" + q, "a" + q, "r" + q);
  RD.BUOC.push("finish", "light", "bao", "baoName", "baoSpots");
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
  // vị trí 0..1 trên đường dài bằng nhau = số bước / số bước tối đa.
  // Tối đa = số bạn có mặt × 6; ở câu đã công bố, thẻ chưa đọc được (hoặc ghi "vắng ở câu này")
  // không tính đúng cũng không tính sai và được bớt khỏi tối đa, nên nhãn "bước / tối đa" luôn khớp vị trí.
  RD.tinhDiem = function (cfg, scans, cauTinh) {
    var lop = RD.lop(cfg);
    var res = lop.to.map(function () { return { buoc: 0, toiDa: 0, viTri: 0, cau: [] }; });
    for (var q = 1; q <= 5; q++) {
      var w = RD.HE_SO[q - 1];
      if (!cauTinh[q]) { res.forEach(function (r, t) { r.toiDa += lop.to[t].coMat.length * w; }); continue; }
      RD.ketQuaCau(q, lop, scans[q]).forEach(function (r, t) {
        res[t].buoc += r.dung * w;
        res[t].toiDa += r.thay * w;
        res[t].cau[q] = { dung: r.dung, thay: r.thay, buoc: r.dung * w, tron: r.thay > 0 && r.dung === r.thay };
      });
    }
    res.forEach(function (r) { r.viTri = r.toiDa ? Math.min(1, r.buoc / r.toiDa) : 0; });
    return res;
  };
  // thứ hạng: tổ đi xa hơn đứng trước; bằng nhau thì cùng hạng
  RD.xepHang = function (res) {
    var idx = [0, 1, 2, 3].sort(function (a, b) { return res[b].viTri - res[a].viTri || a - b; });
    var hang = [], prev = null, h = 0;
    idx.forEach(function (t, i) {
      if (prev === null || Math.abs(res[t].viTri - res[prev].viTri) > 1e-9) h = i + 1;
      hang[t] = h;
      prev = t;
    });
    return { thuTu: idx, hang: hang, nhat: idx.filter(function (t) { return hang[t] === 1; }) };
  };

  /* ---------- lời bình viết sẵn (dùng khi không có Claude) ---------- */
  function chon(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
  function noi(names) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " và " + names[names.length - 1];
  }
  RD.loiBinhMau = function (q, truoc, sau, seed) {
    var ten = function (t) { return RD.TO[t].ten; };
    var hangSau = RD.xepHang(sau), hangTruoc = RD.xepHang(truoc);
    var dau = hangSau.thuTu[0], nhi = hangSau.thuTu[1], cuoi = hangSau.thuTu[3];
    var tron = [0, 1, 2, 3].filter(function (t) { return sau[t].cau[q] && sau[t].cau[q].tron; });
    var gain = function (t) { return sau[t].cau[q] ? sau[t].cau[q].buoc : 0; };
    var doiDau = hangTruoc.nhat.indexOf(dau) < 0 && hangSau.nhat.length === 1 && q > 1;
    var sat = sau[dau].viTri - sau[nhi].viTri < 0.03;
    var s = seed | 0, lines = [];
    if (q === 5) {
      lines.push(chon([
        "Chặng nước rút khép lại! " + ten(dau) + " đã đi xa nhất trên đường về trường.",
        "Về đích rồi! " + ten(dau) + " dẫn đầu, cả 4 tổ đã cùng rước đuốc về tới sân trường.",
        "Bước chân cuối cùng đã xong, " + ten(dau) + " là tổ đi xa nhất hôm nay!"
      ], s));
      if (hangSau.nhat.length > 1) lines = ["Không thể tin nổi: " + noi(hangSau.nhat.map(ten)) + " về đích bằng nhau, cùng nhau châm lửa!"];
      return lines[0];
    }
    if (tron.length) {
      var t0 = tron[0];
      lines.push(chon([
        noi(tron.map(ten)) + " bứt phá: cả tổ đều đúng, tiến liền " + gain(t0) + " bước!",
        "Tuyệt vời " + noi(tron.map(ten)) + ", không bỏ sót bạn nào, ngọn đuốc lao vút lên phía trước!",
        "Cả " + noi(tron.map(ten)) + " cùng đúng hết, bước chân thật đều và chắc!"
      ], s));
    }
    if (doiDau) lines.push(chon([
      ten(dau) + " vượt lên dẫn đầu! Cuộc đua đang nóng dần lên.",
      "Đổi ngôi rồi! " + ten(dau) + " đang cầm đuốc đi trước cả đoàn."
    ], s + 1));
    if (sat) lines.push(chon([
      ten(dau) + " và " + ten(nhi) + " đang sát nút, chỉ cách nhau vài bước chân!",
      "Khoảng cách giữa " + ten(dau) + " và " + ten(nhi) + " rất mỏng, câu sau sẽ quyết định nhiều!"
    ], s + 2));
    if (!lines.length) lines.push(chon([
      "Cả 4 tổ cùng tiến lên, " + ten(dau) + " đang đi trước một chút.",
      ten(dau) + " giữ nhịp tốt, các tổ còn lại vẫn bám theo rất sát.",
      "Bốn ngọn đuốc cùng tiến về trường, " + ten(dau) + " tạm dẫn đầu sau câu " + q + "."
    ], s + 3));
    var dongVien = q < 4 ? chon([
      " " + ten(cuoi) + " cố lên, còn nhiều câu phía trước!",
      " " + ten(cuoi) + " vẫn còn đủ thời gian để bứt lên!",
      ""
    ], s + 4) : (q === 4 ? " Câu 5 là chặng nước rút, mỗi bạn đúng được 2 bước!" : "");
    return lines[0] + (lines[0].length < 70 ? dongVien : "");
  };
})();
