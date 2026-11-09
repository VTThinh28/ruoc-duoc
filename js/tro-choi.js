/* Rước đuốc: điều khiển buổi chơi (TV và điện thoại) */
(function () {
  "use strict";
  var RD = window.RD, SK = RD.SanKhau, Q = RD.Quet, A = RD.AmThanh;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
  function ngauNhien(n) { var s = "", c = "abcdefghijkmnpqrstuvwxyz23456789"; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function gio(t) { var d = new Date(t || Date.now()); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  var DEV = lsGet("rd-dev", "") || (function () { var d = ngauNhien(8); lsSet("rd-dev", d); return d; })();
  var TAB = ngauNhien(6);   // mỗi lần mở trang một mã riêng: phân biệt bản ghi của chính trang này với máy (hoặc thẻ) khác

  var S = { cfg: null, now: null, ph: null, scans: {} };
  var DB = null, VAI = null, NOI = { kieu: "cho", chu: "Đang nối…" }, chacCfg = false, daKhoiTao = false;

  /* ---------- đọc trạng thái ---------- */
  function ses() { return (S.cfg && S.cfg.ses) || ""; }
  function cfg() { return S.cfg || RD.cfgMacDinh(""); }
  function nowHopLe() {
    var n = S.now;
    if (!n || !n.step || RD.BUOC.indexOf(n.step) < 0 || (ses() && n.ses !== ses())) return { ses: ses(), step: "setup", pub: {} };
    if (!n.pub) n.pub = {};
    return n;
  }
  function scanHopLe(q) { var s = S.scans[q]; return s && s.ses === ses() ? s : null; }
  function cacScan() { var m = {}; for (var q = 1; q <= 5; q++) m[q] = scanHopLe(q); return m; }
  function cauDaTinh(boQua) {
    var pub = nowHopLe().pub, m = {};
    for (var q = 1; q <= 5; q++) if ((pub["r" + q] | 0) > 0 && q !== boQua) m[q] = true;
    return m;
  }
  function tinh(boQua) { return RD.tinhDiem(cfg(), cacScan(), cauDaTinh(boQua)); }

  /* ---------- ghi trạng thái ---------- */
  function datBuoc(step) {
    if (!DB) return;
    var n = clone(nowHopLe());
    n.ses = ses();
    n.step = step;
    n.at = Date.now();
    n.by = TAB;
    var q = RD.cauCuaBuoc(step);
    if (RD.loaiBuoc(step) === "r") n.pub["r" + q] = (n.pub["r" + q] | 0) + 1;
    DB.set("now", n);
  }
  function ghiCfg(sua) {
    if (!DB) return;
    var c = clone(cfg());
    sua(c);
    c.at = Date.now();
    DB.set("cfg", c);
  }
  // buoc: bước bắt đầu của ván mới (mặc định "setup"; nút "Chơi lại từ đầu" của chế độ chơi thử vào thẳng "intro").
  //   9/11 04:11 UTC (thầy Thịnh: "mặc định trong cài đặt luôn luôn là đề cơ bản nha"): ván mới nào cũng bắt đầu bằng Đề cơ bản
  //   (giữ danh sách lớp, bỏ đề đã chọn của ván trước)
  function vanMoi(giuLop, buoc) {
    var s = ngauNhien(8), c = giuLop && S.cfg ? clone(S.cfg) : RD.cfgMacDinh(s);
    c.ses = s; c.at = Date.now(); delete c.de;
    DB.set("cfg", c);
    DB.set("now", { ses: s, step: buoc || "setup", pub: {}, at: Date.now(), by: TAB });
    for (var q = 1; q <= 5; q++) DB.set("s" + q, { ses: s, q: q, cards: {}, man: {}, at: Date.now(), by: TAB });
    BL = {};
  }

  var ve = (function () {
    var hen = 0;
    return function () {
      if (hen) return;
      hen = requestAnimationFrame(function () {
        hen = 0;
        try { if (VAI === "tv") veTV(); else if (VAI === "dt") veDT(); } catch (e) { console.error(e); }
      });
    };
  })();

  /* ---------- tiếp và lùi ---------- */
  var choXacNhan = null;
  function tiep(daDongY) {
    var now = nowHopLe(), i = RD.BUOC.indexOf(now.step);
    if (i < 0 || i >= RD.BUOC.length - 1) return;
    var step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") {
      var lop = RD.lop(cfg());
      if (!lop.coMat) { thongBao("Chưa có bạn nào có mặt: kiểm tra sĩ số và danh sách nhóm."); return; }
    }
    if (loai === "a" && !daDongY) {
      var kq = RD.ketQuaCau(q, RD.lop(cfg()), scanHopLe(q));
      var trong = [];
      kq.forEach(function (r, t) { if (r.coMat > 0 && r.thay === 0) trong.push(RD.TO[t].ten); });
      if (trong.length) {
        hoi((trong.length === 4 ? "Chưa đọc được thẻ nào ở câu " + q + "." : "Chưa đọc được thẻ nào của " + trong.join(", ") + " ở câu " + q + ".") + " Vẫn di chuyển?", "Vẫn di chuyển", "Quét thêm").then(function (ok) { if (ok) tiep(true); });
        return;
      }
    }
    A.mo();
    datBuoc(RD.BUOC[i + 1]);
  }
  function lui() {
    var now = nowHopLe(), i = RD.BUOC.indexOf(now.step);
    if (i <= 0) return;
    datBuoc(RD.BUOC[i - 1]);
  }
  // hộp hỏi trong trang (hộp thoại của trình duyệt không hiện trong Claude)
  function hoi(chu, co, khong) {
    return new Promise(function (ok) {
      if (VAI === "tv") {
        $("#cbChu").textContent = chu;
        $("#cbVan").textContent = co;
        $("#cbThem").textContent = khong;
        $("#canhBao").hidden = false;
        choXacNhan = function (v) { $("#canhBao").hidden = true; choXacNhan = null; ok(v); };
      } else {
        var m = $("#dtHoi");
        if (!m) {
          m = document.createElement("div");
          m.id = "dtHoi";
          m.innerHTML = '<div><h3></h3><div class="luoi"><button type="button" class="nut chinh" data-v="1"></button><button type="button" class="nut" data-v="0"></button></div></div>';
          m.style.cssText = "position:fixed;inset:0;z-index:45;background:rgba(20,12,4,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px";
          var o = m.firstChild;
          o.style.cssText = "width:100%;max-width:520px;background:var(--giay);border-radius:20px;padding:16px;border:3px solid var(--do)";
          o.querySelector(".luoi").style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px";
          document.body.appendChild(m);
        }
        m.querySelector("h3").textContent = chu;
        m.querySelector("[data-v='1']").textContent = co;
        m.querySelector("[data-v='0']").textContent = khong;
        m.hidden = false;
        m.onclick = function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          m.hidden = true;
          ok(b.dataset.v === "1");
        };
      }
    });
  }
  function thongBao(chu) {
    if (VAI === "tv") { var g = $("#goiY"); g.textContent = chu; g.hidden = false; clearTimeout(thongBao.t); thongBao.t = setTimeout(function () { g.hidden = true; }, 4000); }
    else { var tt = $("#dtTrangThai"); if (tt) { tt.textContent = chu; tt.className = "dt-tt loi"; } }
  }

  /* ---------- Claude ---------- */
  var mauP = null;
  function layMau() {
    if (!RD.trongClaude) return Promise.resolve(null);
    return mauP || (mauP = window.claude.use("sample").catch(function () { return null; }));
  }
  function lamSach(t) {
    return String(t || "").replace(/\s+/g, " ").replace(/^["“”'«»\s]+|["“”'«»\s]+$/g, "").slice(0, 320);
  }
  // Lời bình theo mẫu của thầy Thịnh (RD.loiBinhPhan, mẫu mới 5/11 16:10: "Ở câu hỏi này, Nhóm 1 và 2 có số bạn trả lời
  // đúng nhiều nhất nhưng tổng điểm vẫn thua Nhóm 3. Cố lên nào!"). Trong Claude: Claude giữ nguyên câu đầu và câu cuối
  // của thầy, chỉ được chèn vào giữa nhiều nhất một câu ngắn cho vui (không số, không tên nhóm, để không nói sai).
  function nhacClaude(q, sau, P) {
    var hang = RD.xepHang(sau);
    var dong = sau.map(function (r, t) {
      var c = r.cau[q] || { dung: 0, thay: 0, tram: 0 };
      return "- " + RD.TO[t].ten + ": câu này " + c.dung + "/" + c.thay + " bạn đúng, được " + RD.vietDiem(c.tram) + " điểm; tổng " + RD.vietDiem(r.tram) + " điểm, đang xếp thứ " + hang.hang[t] + ".";
    }).join("\n");
    return "Bạn là bình luận viên vui vẻ của trò chơi \"Rước đuốc\" trong tiết Toán lớp 6/3 (học sinh 11-12 tuổi). " +
      "Bốn nhóm trả lời 5 câu hỏi bằng thẻ Plickers; sau mỗi câu, mỗi nhóm nhận một mảnh ghép lấp khúc cầu còn thiếu để đại diện của nhóm đi tiếp, nhóm nhiều điểm hơn tiến nhanh hơn. " +
      "Điểm mỗi câu là phần trăm bạn trong nhóm trả lời đúng (tối đa 100), câu 5 nhân đôi (tối đa 200).\n" +
      "Vừa công bố câu " + q + "/5. Số liệu:\n" + dong + "\n" +
      "Thầy giáo đã viết sẵn lời bình theo mẫu của thầy, đúng số liệu:\n" + P.chu + "\n" +
      "Giữ nguyên từng chữ câu đầu và câu cuối của thầy. Chỉ được chèn vào giữa hai câu đó nhiều nhất một câu ngắn (tối đa 12 từ) cho vui, sinh động, ví dụ khen cả lớp hay nói cuộc đua đang gay cấn; câu chèn không có chữ số, không nêu tên nhóm. Không chèn cũng được.\n" +
      "1. Bắt đầu đúng bằng: " + P.dau + "\n" +
      "2. Kết thúc đúng bằng: " + P.cuoi + "\n" +
      "Tiếng Việt có dấu, không emoji, không dấu ngoặc kép, không nhắc đáp án hay phép tính, không chê nhóm nào. Chỉ trả về lời bình.";
  }
  // lời Claude viết phải giữ nguyên câu đầu, câu cuối của thầy; phần chèn giữa ngắn, không số, không tên nhóm.
  // Lệch thì dùng đúng lời theo mẫu.
  function hopKhuon(t, P, q, sau) {
    var n = function (x) { return String(x || "").normalize("NFC").toLowerCase().replace(/[\s\u00a0]+/g, " ").trim(); };
    var tt = n(t), d = n(P.dau), c = n(P.cuoi);
    if (!P.dau || !P.cuoi || tt.length > 320 || tt.length < d.length + c.length) return false;
    if (tt.indexOf(d) !== 0 || tt.slice(-c.length) !== c) return false;
    var giua = tt.slice(d.length, tt.length - c.length).trim();
    if (!giua) return true;
    // ("tổng điểm" vẫn được, chỉ cấm chữ "tổ" đứng riêng)
    if (giua.split(" ").length > 15 || /\d/.test(giua) || /nhóm/.test(giua) || /(^|[\s,.;:!?])tổ([\s,.;:!?]|$)/.test(giua)) return false;
    void q; void sau;
    return true;
  }
  var BL = {}, lanBL = 0;
  function binhLuan(q, truoc, sau) {
    var key = ses() + ":" + q, P = RD.loiBinhPhan(q, truoc, sau), lan = ++lanBL;
    var xong = false, ctl = null;
    var dung = function (chu, tuClaude) {
      if (xong) return;
      xong = true;
      BL[key] = { chu: chu, claude: !!tuClaude };
      if (lan === lanBL && dangOR(q)) SK.binh(q, chu);
    };
    if (!RD.trongClaude || !P.dau) { dung(P.chu); return; }
    SK.binh(q, "");      // bóng nói hiện dấu chờ cho tới khi Claude viết xong
    var hen = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* bỏ qua */ } dung(P.chu); }, 10000);
    layMau().then(function (sample) {
      if (!sample) throw { code: "khong_co" };
      ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      return sample(nhacClaude(q, sau, P), { modelTier: "quick", cache: false, signal: ctl ? ctl.signal : undefined });
    }).then(function (r) {
      clearTimeout(hen);
      var t = lamSach(r && r.text);
      if (!hopKhuon(t, P, q, sau)) throw { code: "lech_mau" };
      dung(t, true);
    }).catch(function () { clearTimeout(hen); dung(P.chu); });
  }
  function dangOR(q) { var n = nowHopLe(); return VAI === "tv" && n.step === "r" + q; }
  // 8/11 thầy Thịnh: "tôi bấm vào thì cả 4 nhóm lên đốt đuốc, claude bình luận về thứ hạng". Lời bình thứ hạng theo mẫu
  //   (RD.loiBinhHang); trong Claude, Claude giữ nguyên câu đầu (thứ hạng) và câu kết, chỉ được chèn vào giữa một câu ngắn
  //   không số, không tên nhóm (như lời bình từng câu). Hiện ở bước Tổng kết khi ngọn đuốc cuối đã sáng.
  function nhacClaudeHang(sau, P) {
    var hang = RD.xepHang(sau);
    var dong = hang.thuTu.map(function (t) { return "- " + RD.TO[t].ten + ": tổng " + RD.vietDiem(sau[t].tram) + " điểm, hạng " + hang.hang[t] + "."; }).join("\n");
    return "Bạn là bình luận viên vui vẻ của trò chơi \"Rước đuốc\" trong tiết Toán lớp 6/3 (học sinh 11-12 tuổi). " +
      "Bốn nhóm vừa trả lời xong 5 câu hỏi, cả bốn nhóm đã lên thắp đuốc theo thứ hạng. Kết quả chung cuộc:\n" + dong + "\n" +
      "Thầy giáo đã viết sẵn lời bình thứ hạng, đúng kết quả:\n" + P.chu + "\n" +
      "Giữ nguyên từng chữ câu đầu và câu cuối của thầy. Chỉ được chèn vào giữa hai câu đó nhiều nhất một câu ngắn (tối đa 12 từ) cho vui, ví dụ khen tinh thần thi đua của cả lớp; câu chèn không có chữ số, không nêu tên nhóm. Không chèn cũng được.\n" +
      "1. Bắt đầu đúng bằng: " + P.dau + "\n" +
      "2. Kết thúc đúng bằng: " + P.cuoi + "\n" +
      "Tiếng Việt có dấu, không emoji, không dấu ngoặc kép, không chê nhóm nào. Chỉ trả về lời bình.";
  }
  function khoaHang(sau) { return ses() + ":hang:" + sau.map(function (r) { return r.tram; }).join(","); }
  function binhLuanHang(sau) {
    var key = khoaHang(sau), P = RD.loiBinhHang(sau), lan = ++lanBL, xong = false, ctl = null;
    var dung = function (chu, tuClaude) {
      if (xong) return;
      xong = true;
      BL[key] = { chu: chu, claude: !!tuClaude };
      if (lan === lanBL && VAI === "tv" && nowHopLe().step === "rank") SK.binh(6, chu);
    };
    if (!RD.trongClaude) { dung(P.chu); return; }
    SK.binh(6, "");      // bóng nói hiện dấu chờ cho tới khi Claude viết xong
    var hen = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* bỏ qua */ } dung(P.chu); }, 10000);
    layMau().then(function (sample) {
      if (!sample) throw { code: "khong_co" };
      ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      return sample(nhacClaudeHang(sau, P), { modelTier: "quick", cache: false, signal: ctl ? ctl.signal : undefined });
    }).then(function (r) {
      clearTimeout(hen);
      var t = lamSach(r && r.text);
      if (!hopKhuon(t, P)) throw { code: "lech_mau" };
      dung(t, true);
    }).catch(function () { clearTimeout(hen); dung(P.chu); });
  }

  /* ---------- khung chuẩn bị (dùng chung cho TV và điện thoại) ---------- */
  function dungChuanBi(el) {
    var to = RD.TO.map(function (t, i) {
      return '<span class="ten" style="--m:' + t.mau + ';--d:' + t.dam + '"><i></i>' + t.ten + '</span>' +
        '<input type="text" data-cb="ds" data-t="' + i + '" inputmode="numeric" autocomplete="off" aria-label="Số thẻ của ' + t.ten + '">' +
        '<span class="dem" data-cb="dem" data-t="' + i + '"></span>';
    }).join("");
    el.innerHTML =
      '<div class="cb">' +
      // 8/11 thầy Thịnh: "ở trang đầu sẽ cho chọn Đề cơ bản và nâng cao"
      '<div class="cb-khoi"><h3>1. Chọn đề</h3><div class="cb-de-nut" role="radiogroup" aria-label="Chọn đề">' +
      RD.THU_TU_DE.map(function (k) {
        return '<button type="button" role="radio" aria-checked="false" data-de="' + k + '"><span class="dau"><i aria-hidden="true"></i><b>' +
          esc(RD.TEN_DE[k]) + '</b></span><small>' + esc(RD.MO_TA_DE[k]) + '</small></button>';
      }).join("") + '</div><p class="cb-ghi" data-cb="deGhi"></p></div>' +
      '<div class="cb-khoi"><h3>2. Sĩ số và 4 nhóm</h3>' +
      '<div class="cb-hang"><label>Sĩ số lớp <input type="number" min="4" max="46" data-cb="siSo"></label>' +
      '<button type="button" class="nut" data-cb="chia">Chia lại 4 nhóm theo sĩ số</button></div>' +
      '<div class="cb-to">' + to + '</div>' +
      '<p class="cb-ghi">Ghi số thẻ của từng nhóm, ví dụ 1-11 hoặc 1-10, 46 (thẻ 46 là thẻ dự phòng).</p>' +
      '<p class="cb-loi" data-cb="loi" hidden></p></div>' +
      '<div class="cb-khoi"><h3>3. Chạm vào số thẻ của bạn vắng hôm nay</h3><div class="cb-luoi" data-cb="luoi"></div><p class="cb-tom" data-cb="tom"></p></div>' +
      '<div class="cb-khoi"><h3>4. Nối điện thoại với TV</h3><div data-cb="noi"></div></div>' +
      '<div class="cb-khoi" data-cb="khoiClaude" hidden><h3>5. Claude bình luận trên TV</h3>' +
      '<div class="cb-hang"><button type="button" class="nut" data-cb="claude">Kiểm tra Claude</button><span class="chip" data-cb="claudeTT">Chưa kiểm tra</span></div>' +
      '<p class="cb-ghi">Bấm một lần trên laptop nối TV trước giờ học: nếu Claude cần xin phép thì hộp xin phép hiện lúc này, không hiện giữa tiết.</p></div>' +
      '<div class="cb-khoi" data-cb="khoiAnh" hidden><h3>5. Ảnh báo tường</h3>' +
      '<div class="cb-hang"><label class="nut"><input type="file" accept="image/*" data-cb="anh" hidden>Chọn ảnh báo tường từ máy</label><span class="chip" data-cb="anhTT"></span></div>' +
      '<p class="cb-ghi">Ảnh có hình thầy cô nên không đưa lên mạng: ảnh chỉ nằm trong trình duyệt của máy này. Chưa chọn thì trang dùng tấm báo tường vẽ tạm.</p></div>' +
      '<div class="cb-khoi"><h3>Chơi thử và ván mới</h3>' +
      '<div class="cb-hang"><label><input type="checkbox" data-cb="thu"> Chơi thử không cần điện thoại: TV tự điền kết quả ngẫu nhiên cho mỗi câu</label></div>' +
      '<div class="cb-hang" style="margin-top:10px"><button type="button" class="nut" data-cb="vanMoi">Ván mới (xóa kết quả, giữ danh sách lớp)</button>' +
      '<button type="button" class="nut" data-cb="doiVai">Đổi vai máy này</button></div></div>' +
      '</div>';
    var q = function (s) { return el.querySelector('[data-cb="' + s + '"]'); };
    q("siSo").addEventListener("change", function () {
      var n = Math.max(4, Math.min(46, parseInt(this.value, 10) || 45));
      ghiCfg(function (c) { c.siSo = n; c.ds = RD.chiaTo(n); c.vang = (c.vang || []).filter(function (id) { return id <= n || id === 46; }); });
    });
    q("chia").addEventListener("click", function () {
      ghiCfg(function (c) { c.ds = RD.chiaTo(c.siSo || 45); });
    });
    $$('[data-cb="ds"]', el).forEach(function (inp) {
      inp.addEventListener("change", function () {
        var t = +this.dataset.t, v = RD.vietDanhSach(RD.docDanhSach(this.value));
        ghiCfg(function (c) { c.ds = (c.ds || RD.chiaTo(45)).slice(); c.ds[t] = v; });
      });
    });
    q("luoi").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.classList.contains("ngoai")) return;
      var id = +b.dataset.id;
      ghiCfg(function (c) {
        var v = (c.vang || []).slice(), k = v.indexOf(id);
        if (k >= 0) v.splice(k, 1); else v.push(id);
        c.vang = v.sort(function (a, b) { return a - b; });
      });
    });
    q("claude").addEventListener("click", function () {
      var tt = q("claudeTT");
      tt.className = "chip cho"; tt.textContent = "Đang hỏi Claude…";
      layMau().then(function (sample) {
        if (!sample) throw { code: "khong_co" };
        return sample("Trả lời đúng hai chữ: Sẵn sàng", { modelTier: "quick", cache: false });
      }).then(function (r) {
        tt.className = "chip ok"; tt.textContent = "Claude sẵn sàng: " + lamSach(r.text).slice(0, 40);
      }).catch(function (e) {
        var c = e && e.code;
        tt.className = "chip loi";
        tt.textContent = c === "not_granted" ? "Chưa cho phép Claude: mở menu Quyền của trang để cho phép" :
          c === "khong_co" ? "Máy này chưa dùng được Claude (cần mở trang trong Claude, đã đăng nhập)" :
          c === "rate_limited" ? "Claude đang bận, thử lại sau ít phút" : "Chưa gọi được Claude (" + (c || "lỗi") + ")";
      });
    });
    q("anh").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      luuAnhBao(f).then(function () { capNhatChuanBi(el); });
      if (SK.anhBao) SK.anhBao(RD.anhBao);
      this.value = "";
    });
    q("thu").addEventListener("change", function () { var on = this.checked; ghiCfg(function (c) { c.thu = on; }); });
    $$("[data-de]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = this.dataset.de;
        if (!duocDoiDe() || k === RD.deDang) return;
        RD.chonDe(k);
        ghiCfg(function (c) { c.de = k; });
        ve();
      });
    });
    var bVM = q("vanMoi"), henVM = 0;
    bVM.addEventListener("click", function () {
      if (!bVM.dataset.cho) {
        bVM.dataset.cho = "1"; bVM.textContent = "Bấm lần nữa để xóa kết quả"; bVM.classList.add("vang");
        henVM = setTimeout(function () { delete bVM.dataset.cho; bVM.textContent = "Ván mới (xóa kết quả, giữ danh sách lớp)"; bVM.classList.remove("vang"); }, 4000);
        return;
      }
      clearTimeout(henVM);
      delete bVM.dataset.cho; bVM.textContent = "Ván mới (xóa kết quả, giữ danh sách lớp)"; bVM.classList.remove("vang");
      vanMoi(true);
    });
    q("doiVai").addEventListener("click", function () {
      lsSet("rd-vai", "");
      Q.Live.dung();
      location.hash = "";
      location.reload();
    });
  }
  function capNhatChuanBi(el) {
    if (!el || !el.firstChild) return;
    var c = cfg(), lop = RD.lop(c);
    var q = function (s) { return el.querySelector('[data-cb="' + s + '"]'); };
    var siSo = q("siSo");
    if (document.activeElement !== siSo) siSo.value = c.siSo || 45;
    $$('[data-cb="ds"]', el).forEach(function (inp) {
      var t = +inp.dataset.t;
      if (document.activeElement !== inp) inp.value = (c.ds || [])[t] || "";
    });
    $$('[data-cb="dem"]', el).forEach(function (sp) {
      var x = lop.to[+sp.dataset.t];
      sp.textContent = x.coMat.length + "/" + x.ids.length + " có mặt";
    });
    var loi = q("loi");
    loi.hidden = !lop.trung.length;
    if (lop.trung.length) loi.textContent = "Thẻ số " + lop.trung.join(", ") + " đang nằm ở 2 nhóm, mỗi thẻ chỉ để ở 1 nhóm.";
    var luoi = q("luoi"), html = "";
    for (var id = 1; id <= RD.SO_THE; id++) {
      var t = lop.toCua[id], T = t ? RD.TO[t - 1] : null;
      var cls = !t ? "ngoai" : (lop.vang[id] ? "vang" : "");
      html += '<button type="button" data-id="' + id + '" class="' + cls + '"' + (T ? ' style="--m:' + T.mau + ';--d:' + T.dam + ';--n:' + T.nhat + '"' : "") +
        ' aria-pressed="' + (lop.vang[id] ? "true" : "false") + '" aria-label="Thẻ ' + id + (T ? ", " + T.ten : ", ngoài lớp") + (lop.vang[id] ? ", vắng" : "") + '">' + id + "</button>";
    }
    if (luoi.dataset.html !== html) { luoi.innerHTML = html; luoi.dataset.html = html; }
    q("tom").textContent = "Có mặt " + lop.coMat + "/" + lop.tong + " bạn · " + lop.to.map(function (x, i) { return RD.TO[i].ten + ": " + x.coMat.length; }).join(" · ");
    // nối máy
    var noi = q("noi"), dong = '<div class="cb-hang"><span class="chip ' + esc(NOI.kieu) + '">' + esc(NOI.chu) + "</span>";
    if (S.ph && S.ph.at) dong += '<span class="chip ok">Điện thoại mở trang lúc ' + gio(S.ph.at) + "</span>";
    dong += "</div>";
    if (RD.trongClaude) {
      dong += '<p class="cb-ghi">Trên điện thoại: mở đúng đường link của trang này bằng Chrome (đã đăng nhập cùng tài khoản Claude), chọn <b>Điện thoại</b>. Trên laptop nối TV: chọn <b>Màn hình TV</b>.</p>';
    } else {
      var url = location.href.split("#")[0] + "#dien-thoai";
      dong += '<div class="cb-qr" style="margin-top:10px"><span data-cb="qr"></span><div style="min-width:0;flex:1"><p class="cb-ghi" style="margin-top:0">Điện thoại quét mã này (hoặc mở đường link) bằng Chrome:</p><div class="cb-link">' + esc(url) + "</div>" +
        (window.RD_FIREBASE ? "" : '<p class="cb-ghi"><b>Chưa cài Firebase</b> nên điện thoại chưa gửi được kết quả sang TV. Vẫn thử được: quét thẻ trên điện thoại, hoặc chơi thử trên TV.</p>') + "</div></div>";
    }
    if (noi.dataset.html !== dong) {
      noi.innerHTML = dong; noi.dataset.html = dong;
      var qrEl = q("qr");
      if (qrEl && window.qrcode) {
        try { var qr = window.qrcode(0, "M"); qr.addData(location.href.split("#")[0] + "#dien-thoai"); qr.make(); qrEl.innerHTML = qr.createImgTag(4, 8, "Mã QR mở trang trên điện thoại"); } catch (e) { /* bỏ qua */ }
      }
    }
    q("khoiClaude").hidden = !RD.trongClaude || VAI !== "tv";
    q("khoiAnh").hidden = RD.trongClaude || VAI !== "tv";
    var att = q("anhTT");
    att.className = "chip " + (RD.anhBao ? "ok" : "");
    att.textContent = RD.anhBao ? "Đã có ảnh trên máy này" : "Chưa chọn ảnh";
    q("thu").checked = !!c.thu;
    // bộ đề: chọn được cho tới khi hiện câu 1; đang chơi thì chỉ còn sáng ô đề đang dùng
    var doiDuoc = duocDoiDe();
    $$("[data-de]", el).forEach(function (b) {
      var on = b.dataset.de === RD.deDang;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.disabled = !doiDuoc && !on;
    });
    var dg = q("deGhi"), dgChu = doiDuoc ? "TV và điện thoại dùng chung đề này. Đổi được cho tới lúc hiện câu 1." :
      "Đang chơi " + RD.TEN_DE[RD.deDang] + ". Muốn đổi đề thì bấm Ván mới ở dưới.";
    if (dg.textContent !== dgChu) dg.textContent = dgChu;
  }
  // đổi đề chỉ được trước khi hiện câu 1 (ván này chưa có thẻ nào được quét), để các câu đã chơi không bị chấm lại theo đáp án khác
  function duocDoiDe() {
    var st = nowHopLe().step;
    if (st !== "setup" && st !== "intro") return false;
    for (var q = 1; q <= 5; q++) {
      var sc = scanHopLe(q);
      if (sc && (Object.keys(sc.cards || {}).length || Object.keys(sc.man || {}).length)) return false;
    }
    return true;
  }

  /* ---------- ảnh báo tường ---------- */
  RD.anhBao = RD.trongClaude ? "anh/bao-tuong.webp" : null;
  function moIdb() {
    return new Promise(function (ok, bad) {
      if (!window.indexedDB) { bad(new Error("no idb")); return; }
      var r = indexedDB.open("ruoc-duoc", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("f"); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { bad(r.error); };
    });
  }
  function luuAnhBao(file) {
    if (RD.anhBao && RD.anhBao.indexOf("blob:") === 0) URL.revokeObjectURL(RD.anhBao);
    RD.anhBao = URL.createObjectURL(file);
    return moIdb().then(function (db) {
      return new Promise(function (ok) {
        var tx = db.transaction("f", "readwrite");
        tx.objectStore("f").put(file, "baoTuong");
        tx.oncomplete = function () { ok(); };
        tx.onerror = function () { ok(); };
      });
    }).catch(function () { /* chỉ giữ trong lần mở này */ });
  }
  function napAnhBao() {
    if (RD.trongClaude) return Promise.resolve();
    return moIdb().then(function (db) {
      return new Promise(function (ok) {
        var r = db.transaction("f").objectStore("f").get("baoTuong");
        r.onsuccess = function () { if (r.result) RD.anhBao = URL.createObjectURL(r.result); ok(); };
        r.onerror = function () { ok(); };
      });
    }).catch(function () { /* bỏ qua */ });
  }

  /* =====================================================================
     MÀN HÌNH TV
     ===================================================================== */
  var tvTruoc = null, tvDaDien = null, tvDaDienSes = null, moCB = false, henThu = 0, coNow = false;
  function khoiTV() {
    $("#tv").hidden = false;
    SK.khoiTao();
    A.taiNhac();
    if (A.taiVoTay) A.taiVoTay();
    dungChuanBi($("#cbTV"));
    napAnhBao().then(function () { if (RD.anhBao) SK.anhBao(RD.anhBao); ve(); });
    for (var q = 1; q <= 5; q++) taoVideo(q);      // tải sẵn hình chuyển động của 5 câu
    $("#nutBatDau").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "setup") tiep(); else { moCB = false; ve(); } });
    $("#nutFullTV").addEventListener("click", toanManHinh);
    // 8/11: hai cụm nút (góc trái #tvNut, góc phải #tvNutPhai: Cài đặt, Chơi lại từ đầu) dùng chung một cách bấm
    $$(".tv-nut").forEach(function (bar) { bar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      A.mo();
      var k = b.dataset.tv;
      if (k === "tiep") { if (choXacNhan) choXacNhan(true); else tiep(); }
      else if (k === "lui") { if (choXacNhan) choXacNhan(false); else lui(); }
      else if (k === "full") toanManHinh();
      else if (k === "am") { A.datBat(!A.bat); veNutAm(true); }
      else if (k === "nho") doiAm(-0.1);
      else if (k === "to") doiAm(0.1);
      else if (k === "cb") { moCB = !moCB; ve(); }
      else if (k === "thu") dienThu(RD.cauCuaBuoc(nowHopLe().step), true);
      else if (k === "lai") choiLaiTuDau();
    }); });
    datGoiNut();
    veNutAm(false);
    $("#nutThuHang").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "finish") tiep(); });
    $("#nutTiepTheo").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "rank") tiep(); });
    $("#nutHienBao").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "tuong") tiep(); });
    $("#cbVan").addEventListener("click", function () { if (choXacNhan) choXacNhan(true); });
    $("#cbThem").addEventListener("click", function () { if (choXacNhan) choXacNhan(false); });
    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
      var k = e.key;
      A.mo();
      if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "Enter" || k === "ArrowDown") {
        e.preventDefault();
        if (choXacNhan) choXacNhan(true); else tiep();
      } else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp" || k === "Backspace") {
        e.preventDefault();
        if (choXacNhan) choXacNhan(false); else lui();
      } else if (k === "Escape") { if (choXacNhan) choXacNhan(false); else if (moCB) { moCB = false; ve(); } }
      else if (k === "f" || k === "F") toanManHinh();
      else if (k === "m" || k === "M") { A.datBat(!A.bat); veNutAm(true); }
      else if (k === "+" || k === "=") doiAm(0.1);
      else if (k === "-" || k === "_") doiAm(-0.1);
    });
    document.addEventListener("pointerdown", function () { A.mo(); }, { passive: true });
    // ẩn con trỏ chuột khi không dùng; các nút góc trái dưới luôn hiện (6/11 thầy Thịnh: "mấy nút này mặc định là luôn hiện")
    var henChuot = 0;
    var hien = function () {
      var tv = $("#tv"), daAn = tv.classList.contains("an-chuot");
      tv.classList.remove("an-chuot");
      if (daAn) veGoi();                 // chuột cử động lại: hiện lại bóng chữ của nút đang trỏ
      clearTimeout(henChuot);
      henChuot = setTimeout(function () { $("#tv").classList.add("an-chuot"); veGoi(); }, 3500);
    };
    document.addEventListener("mousemove", hien, { passive: true });
    hien();
    giuManHinh();
    // 8/11 thầy Thịnh: "thu nhỏ lại thì phần phím bị đè lên đáp án". Thẻ câu hỏi dừng trên hai cụm nút (san-khau.js đặt
    //   --dayThe theo cỡ cửa sổ, chạy trước hàm này), nên đổi cỡ cửa sổ thì xếp lại hình và cỡ chữ của câu đang hiện
    window.addEventListener("resize", function () { if (mcHien && mcDang) xepLaiManCau(mcDang); veGoi(); });
    document.addEventListener("fullscreenchange", function () { if (mcHien && mcDang) xepLaiManCau(mcDang); });
  }
  // 6/11 chiều, thầy Thịnh: "trong game có nút tăng giảm âm lượng". Nút loa giữa: bật/tắt tiếng; vạch sóng trên loa theo độ to.
  function veNutAm(baoTin) {
    var b = $('[data-tv="am"]'), pt = Math.round(A.muc * 100);
    b.setAttribute("aria-pressed", A.bat ? "true" : "false");
    b.dataset.muc = !A.bat || A.muc <= 0 ? "0" : A.muc < 0.7 ? "1" : "2";
    b.setAttribute("aria-label", "Bật hoặc tắt âm thanh (phím M), đang " + (A.bat ? pt + "%" : "tắt tiếng"));
    $('[data-tv="nho"]').disabled = A.muc <= 0;
    $('[data-tv="to"]').disabled = A.muc >= (A.MUC_MAX || 1);
    if (baoTin) baoAm(A.bat ? "Âm lượng " + pt + "%" : "Đã tắt tiếng (bấm nút loa hoặc phím M để bật lại)");
    else veGoi();
  }
  // 8/11 thầy Thịnh: "các nút bấm bên dưới khi tôi để chuột vào thì sẽ hiện lên công dụng. Âm lượng để sát vào bên trái".
  //   Một bóng chữ (#tvGoi): trỏ chuột vào nút nào thì hiện công dụng ngay trên nút đó (cụm góc phải: canh mép phải nút;
  //   hai cụm dựng cột lúc báo tường thì hiện bên cạnh nút, phía trong màn hình). Đổi âm lượng (nút hay phím) thì bóng chữ
  //   hiện "Âm lượng …%" sát mép trái hàng nút trong 2 giây (trước đây hiện ở góc phải dưới màn hình).
  var GOI_NUT = {
    lui: "Lùi lại một bước (phím ←)",
    tiep: "Sang bước tiếp theo (phím → hoặc dấu cách)",
    thu: "Điền kết quả chơi thử cho câu này",
    lai: "Chơi lại từ đầu, xóa kết quả chơi thử",
    nho: "Giảm âm lượng (phím −)",
    to: "Tăng âm lượng (phím +)",
    cb: "Cài đặt"           // 9/11 04:11 UTC (thầy Thịnh: "cái này ghi cài đặt là được rồi")
  };
  function chuGoi(b) {
    var k = b.dataset.tv;
    if (k === "am") return (A.bat ? "Tắt tiếng" : "Bật tiếng") + " (phím M), âm lượng " + Math.round(A.muc * 100) + "%";
    if (k === "full") return document.fullscreenElement ? "Thoát toàn màn hình (phím F)" : "Chiếu toàn màn hình (phím F)";
    return GOI_NUT[k] || b.getAttribute("aria-label") || "";
  }
  var GOI = { nut: null, amDen: 0, amChu: "", hen: 0 };
  function veGoi() {
    var el = $("#tvGoi");
    if (!el) return;
    var am = Date.now() < GOI.amDen, nut = am ? $('[data-tv="am"]') : GOI.nut;
    var anChuot = $("#tv").classList.contains("an-chuot");
    var bar = nut && nut.closest(".tv-nut");
    if (!nut || !bar || nut.hidden || !nut.offsetParent || (!am && anChuot)) { el.hidden = true; return; }
    var chu = am ? GOI.amChu : chuGoi(nut), doc = bar.classList.contains("doc"), phai = bar.id === "tvNutPhai";
    if (el.textContent !== chu) el.textContent = chu;
    el.classList.toggle("am", am && !doc);
    el.classList.toggle("doc", doc);
    el.classList.toggle("phai", phai);
    el.hidden = false;
    var rb = bar.getBoundingClientRect(), rn = nut.getBoundingClientRect();
    var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight;
    if (doc) {                                       // cột nút sát mép: bóng chữ bên cạnh nút, phía trong màn hình
      el.style.top = (rn.top + rn.height / 2) + "px"; el.style.bottom = "auto";
      if (phai) { el.style.left = "auto"; el.style.right = (vw - rn.left + 12) + "px"; }
      else { el.style.right = "auto"; el.style.left = (rn.right + 12) + "px"; }
    } else {                                         // hàng nút dưới đáy: bóng chữ ngay trên nút
      el.style.top = "auto"; el.style.bottom = (vh - rb.top + 12) + "px";
      if (phai) {
        el.style.left = "auto"; el.style.right = (vw - rn.right) + "px";
        el.style.setProperty("--mui", (rn.width / 2) + "px");
      } else {
        var trai = am ? rb.left : rn.left;           // chữ âm lượng sát mép trái hàng nút
        el.style.right = "auto"; el.style.left = trai + "px";
        el.style.setProperty("--mui", (rn.left - trai + rn.width / 2) + "px");
      }
    }
  }
  function baoAm(chu) {
    GOI.amChu = chu; GOI.amDen = Date.now() + 2000;
    clearTimeout(GOI.hen); GOI.hen = setTimeout(veGoi, 2050);
    veGoi();
  }
  function datGoiNut() {
    $$(".tv-nut").forEach(datGoiCum);
    document.addEventListener("fullscreenchange", veGoi);
  }
  function datGoiCum(bar) {
    bar.addEventListener("pointerover", function (e) {
      var b = e.target.closest && e.target.closest("button");
      if (e.pointerType === "touch" || !b || !bar.contains(b) || b === GOI.nut) return;
      GOI.nut = b; veGoi();
    });
    bar.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest("button");
      if (!b || b !== GOI.nut || (e.relatedTarget && b.contains(e.relatedTarget))) return;
      GOI.nut = null; veGoi();
    });
    bar.addEventListener("click", function () { setTimeout(veGoi, 0); });     // chữ đổi theo (bật/tắt tiếng, toàn màn hình)
  }
  function doiAm(d) {
    A.datMuc(A.muc + d);
    if (d > 0 && !A.bat) A.datBat(true);         // đang tắt tiếng mà bấm tăng thì bật lại tiếng
    veNutAm(true);
  }
  // 6/11 chiều, thầy Thịnh: "trong chế độ chơi thử có thêm nút chơi lại từ đầu". Xóa kết quả chơi thử, giữ danh sách lớp và
  //   chế độ chơi thử, vào lại màn giới thiệu (luật chơi).
  var choiLaiCho = false;
  function choiLaiTuDau() {
    if (!cfg().thu || nowHopLe().step === "setup") return;
    hoi("Chơi lại từ đầu? Kết quả chơi thử sẽ được xóa.", "Chơi lại", "Thôi").then(function (ok) {
      if (!ok) return;
      clearTimeout(henThu);
      choiLaiCho = true;
      vanMoi(true, "intro");
    });
  }
  function toanManHinh() {
    var d = document;
    try {
      if (d.fullscreenElement) d.exitFullscreen();
      else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () { thongBao("Bấm F11 để chiếu toàn màn hình."); });
      else thongBao("Bấm F11 để chiếu toàn màn hình.");
    } catch (e) { thongBao("Bấm F11 để chiếu toàn màn hình."); }
  }
  var khoaMH = null;
  function giuManHinh() {
    if (!navigator.wakeLock || khoaMH) return;
    navigator.wakeLock.request("screen").then(function (l) { khoaMH = l; l.addEventListener("release", function () { khoaMH = null; }); }).catch(function () { /* bỏ qua */ });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") giuManHinh(); });

  function veTV() {
    var now = nowHopLe(), step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    // các lần công bố đã có trước khi TV mở trang: không phát lại hoạt cảnh
    if (coNow && (tvDaDien === null || tvDaDienSes !== ses())) { tvDaDien = clone(now.pub || {}); tvDaDienSes = ses(); }
    var cu = tvTruoc;
    var rev = now.pub["r" + q] | 0;
    var doi = step !== cu || (loai === "r" && tvDaDien !== null && rev !== (tvDaDien["r" + q] | 0));
    tvTruoc = step;
    $("#chuanBiTV").hidden = !(step === "setup" || moCB);
    capNhatChuanBi($("#cbTV"));
    A.batNhac(cfg().nhac !== false);
    A.nhacMuc(step === "setup" ? 0 : loai === "a" ? 0.08 : 0.22, loai === "a" ? 1.5 : 1);
    var laCau = loai === "q" || loai === "k" || loai === "a";
    $('[data-tv="thu"]').hidden = !(laCau && cfg().thu);
    $('[data-tv="lai"]').hidden = !(cfg().thu && step !== "setup");
    // chơi thử: bấm qua màn câu hỏi trước khi TV kịp điền thì điền nốt ngay khi sang bước sau,
    // để bước quét xong, đáp án và di chuyển luôn có kết quả (dienThu chỉ thêm thẻ còn thiếu)
    if (doi && q && loai !== "q" && cfg().thu) dienThu(q, true);
    if (doi) vaoBuocTV(step, cu, loai, q, rev);
    if (laCau) capNhatManCau(q, loai);
    if (loai === "q" && cfg().thu && doi) { clearTimeout(henThu); henThu = setTimeout(function () { dienThu(q, false); }, 1600); }
  }
  // kết quả sau từng câu theo thứ tự: ls[0] chưa có câu nào, ls[k] đã tính câu 1 đến câu k
  function lichSu() {
    var sc = cacScan(), c = cfg(), ls = [];
    for (var k = 0; k <= 5; k++) {
      var m = {};
      for (var j = 1; j <= k; j++) m[j] = true;
      ls.push(RD.tinhDiem(c, sc, m));
    }
    return ls;
  }
  // mỗi bước trên TV: màn câu hỏi (q, k, a) che sân khấu; các bước khác do sân khấu cây cầu vẽ
  function vaoBuocTV(step, cu, loai, q, rev) {
    $("#goiY").hidden = true;
    $("#canhBao").hidden = true;
    choXacNhan = null;
    var ls = lichSu();
    if (loai === "q" || loai === "k" || loai === "a") {
      SK.dat({ che: "hoi", q: q, ls: ls });
      hienManCau(q, loai, cu);
      return;
    }
    anManCau();
    if (step === "setup" || step === "intro") {
      var vao = step === "intro" && (cu === "setup" || choiLaiCho);
      if (step === "intro") choiLaiCho = false;
      SK.dat({ che: "dau", ls: ls, gioiThieu: step === "intro", hoatCanh: vao });
      // 6/11: bỏ tiếng trống lúc bắt đầu, nhạc nền đã vào (thầy Thịnh chỉ muốn tiếng ở câu hỏi mới, ô ghép vào cầu, bạn về nhất)
      return;
    }
    if (loai === "r") {
      // miếng ghép bay vào cầu, 4 bạn cùng qua; lần công bố mới (hoặc công bố lại) thì phát hoạt cảnh
      var phatLai = tvDaDien !== null && rev !== (tvDaDien["r" + q] | 0);
      if (tvDaDien) tvDaDien["r" + q] = rev;
      var hc = phatLai && rev > 0;
      SK.dat({ che: "cau", q: q, ls: ls, hoatCanh: hc });
      var bl = BL[ses() + ":" + q];
      if (hc) binhLuan(q, ls[q - 1], ls[q]);
      else SK.binh(q, bl ? bl.chu : RD.loiBinhMau(q, ls[q - 1], ls[q]), true);
      return;
    }
    if (step === "finish") { SK.dat({ che: "dich", ls: ls, hoatCanh: cu === "r5" }); return; }
    // 8/11 thầy Thịnh: "sau khi cả 4 bạn đốt đuốc, hiện thêm nút tiếp theo, tôi bấm vô thì mới hiện báo tường".
    //   rank (nút "Tổng kết"): các nhóm còn lại thắp đuốc, Claude bình luận thứ hạng, chữ trên nút đổi thành "Tiếp theo"
    //   tuong: tia lửa lên số 51, lửa đốt màn đêm, báo tường
    if (step === "rank") {
      SK.dat({ che: "hang", ls: ls, hoatCanh: cu === "finish" });
      // 8/11: Claude bình luận thứ hạng (bóng nói hiện khi ngọn đuốc cuối đã sáng); đã có lời bình đúng kết quả này thì dùng lại
      var blH = BL[khoaHang(ls[5])];
      if (cu === "finish" && !blH) binhLuanHang(ls[5]);
      else SK.binh(6, blH ? blH.chu : RD.loiBinhHang(ls[5]).chu, cu !== "finish");
      return;
    }
    if (step === "tuong") { SK.dat({ che: "hang", tiep: true, ls: ls, hoatCanh: cu === "rank" }); return; }
    SK.dat({ che: "bao", ls: ls, hoatCanh: cu === "tuong" });
  }

  /* ---------- màn câu hỏi (chữ to; hình chuyển động: video 8 giây lặp lại, lớp nhãn số đo đứng yên bên trên) ---------- */
  // loai: q đọc đề · k quét xong (số em chọn mỗi đáp án) · a đáp án (ô đúng sáng, số bạn đúng mỗi nhóm)
  var mcDang = 0, mcDe = "", mcHien = false, VID = {};
  var DE = "cubic-bezier(.45,0,.55,1)", NAY = "cubic-bezier(.34,1.56,.64,1)";
  function hoat(el, kf, ms, de, xong) {
    huyHoat(el);
    if (!el.animate) { if (xong) xong(); return; }
    var a = el.animate(kf, { duration: ms, easing: de, fill: "both" });
    el._hoat = a;
    a.onfinish = function () { if (el._hoat === a && xong) xong(); };
  }
  function huyHoat(el) { if (el._hoat) { try { el._hoat.cancel(); } catch (e) { /* bỏ qua */ } el._hoat = null; } }
  function chuDe(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\{(\d+)\/(\d+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  }
  // thu nhỏ chữ đề và chữ đáp án nếu tràn khung
  function vuaChu(q) {
    var m = $("#manCau"), chu = $("#mcChu");
    var fs = q === 5 ? 68 : 72, fo = q === 5 ? 46 : 54;
    m.style.setProperty("--fs", fs + "px");
    m.style.setProperty("--fo", fo + "px");
    if (m.hidden) return;
    while (fs > 40 && chu.scrollHeight > chu.clientHeight + 1) { fs -= 2; m.style.setProperty("--fs", fs + "px"); }
    var tran = function () { return $$(".mc-o>span", m).some(function (x) { return x.scrollWidth > x.clientWidth + 1; }); };
    while (fo > 32 && tran()) { fo -= 2; m.style.setProperty("--fo", fo + "px"); }
  }
  // video hình động của câu q (webm, máy không chạy được thì mp4). Ảnh chờ (poster) là khung đầu của video:
  // hiện ngay khi video chưa tải xong, và ở lại nếu máy không chạy được video (số đo, nét vẽ vẫn nằm đúng chỗ)
  function taoVideo(q) {
    if (q in VID) return VID[q];
    var I = RD.KHUNG && RD.KHUNG[q];
    if (!I) { VID[q] = null; return null; }
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.poster = "anh/chuyen-dong/tinh-cau-" + q + ".webp";
    [["webm", 'video/webm; codecs="vp9"'], ["mp4", 'video/mp4; codecs="avc1.640028"']].forEach(function (k) {
      if (!v.canPlayType || !v.canPlayType(k[1])) return;
      var s = document.createElement("source");
      s.src = "anh/chuyen-dong/cau-" + q + "." + k[0]; s.type = k[1];
      v.appendChild(s);
    });
    v.load();
    VID[q] = v;
    return v;
  }
  // 7/11: cột hình rộng vừa đủ cho hình cao kín ô (không quá RD.COT_HINH), chữ đề dịch sang phải
  function datCot(q) {
    var I = RD.KHUNG && RD.KHUNG[q], m = $("#manCau"), hop = $("#mcHop"), cot = RD.COT_HINH || 960;
    if (!I) { m.style.setProperty("--wh", (q === 5 ? 700 : 560) + "px"); return; }
    m.style.setProperty("--wh", cot + "px");
    var bw = hop.clientWidth - 20, bh = hop.clientHeight - 20;
    if (bw <= 0 || bh <= 0) return;
    var s = Math.min(bw / I.W, bh / I.H);
    m.style.setProperty("--wh", Math.min(cot, Math.ceil(I.W * s) + cot - bw) + "px");
  }
  function datHinh(q) {
    var I = RD.KHUNG && RD.KHUNG[q], v = taoVideo(q), k = $("#mcKhung"), anh = $("#mcAnh"), hop = $("#mcHop"), nhan = $("#mcNhan"), so = $("#mcSo");
    Object.keys(VID).forEach(function (j) { var x = VID[j]; if (x && +j !== q && x.parentNode) { x.pause(); x.parentNode.removeChild(x); } });
    var coVideo = !!(v && I);
    k.hidden = !coVideo; anh.hidden = coVideo;
    if (!coVideo) {
      if (v && v.parentNode) { v.pause(); v.parentNode.removeChild(v); }
      if (anh.getAttribute("src") !== RD.CAU[q - 1].hinh) anh.src = RD.CAU[q - 1].hinh;
      anh.alt = "Hình minh họa câu " + q;
      return;
    }
    // số đo: chữ thật nằm trên hình, cỡ chữ và chỗ đặt theo tỉ lệ hình
    //   (8/11: đề cơ bản ghi thêm số đo cho sẵn, themSo của câu; a "t" x là mép trái chữ, a "p" x là mép phải)
    var dsSo = (I.so || []).concat(RD.CAU[q - 1].themSo || []), khoaSo = RD.deDang + ":" + q;
    if (so.dataset.q !== khoaSo) {
      so.dataset.q = khoaSo;
      so.innerHTML = dsSo.map(function (n) {
        return "<span" + (n.nen ? ' class="nen"' : "") + (n.a ? ' data-a="' + n.a + '"' : "") + ">" + esc(n.t) + "</span>";
      }).join("");
    }
    var bw = hop.clientWidth - 20, bh = hop.clientHeight - 20;
    if (bw > 0 && bh > 0) {
      var s = Math.min(bw / I.W, bh / I.H);
      k.style.width = I.W * s + "px"; k.style.height = I.H * s + "px";
      v.style.left = I.x * s + "px"; v.style.top = I.y * s + "px"; v.style.width = I.w * s + "px"; v.style.height = I.h * s + "px";
      $$("span", so).forEach(function (el, i) {
        var n = dsSo[i];
        el.style.left = n.x * s + "px"; el.style.top = n.y * s + "px"; el.style.fontSize = n.f * s + "px";
      });
    }
    // lớp nét vẽ (nét đứt, góc vuông, viền): chỉ câu 3, 4, 5 có
    nhan.hidden = !I.nhan;
    if (I.nhan) { var src = "anh/chuyen-dong/nhan-cau-" + q + ".webp"; if (nhan.getAttribute("src") !== src) nhan.src = src; }
    k.setAttribute("aria-label", "Hình minh họa câu " + q);
    if (v.parentNode !== k) k.insertBefore(v, nhan);
    if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { /* hiện khung đầu */ }); }
  }
  function xepLaiManCau(q) { datCot(q); vuaChu(q); datHinh(q); }
  function dungVideo() { Object.keys(VID).forEach(function (j) { var x = VID[j]; if (x && !x.paused) x.pause(); }); }
  function hienManCau(q, loai, cu) {
    var c = RD.CAU[q - 1], m = $("#manCau"), the = $("#mcThe"), moi = !mcHien, cauMoi = mcDang !== q || mcDe !== RD.deDang;
    mcHien = true;
    m.hidden = false;
    if (cauMoi) {
      mcDang = q; mcDe = RD.deDang;
      var pill = $("#mcPill");
      pill.textContent = RD.nhanCau(q);
      pill.classList.toggle("vang", q === 5);
      datCot(q);
      $("#mcBoiCanh").innerHTML = chuDe(c.boiCanh);
      $("#mcHoi").innerHTML = chuDe(c.hoi);
      $("#mcChon").innerHTML = c.chon.map(function (t, i) {
        return '<div class="mc-o" data-l="' + RD.CHU[i] + '"><b>' + RD.CHU[i] + "</b><span>" + esc(t) + "</span><em hidden></em></div>";
      }).join("");
      // câu mới: xoá hẳn dòng kết quả của câu trước (7/11: trước đây chỉ đặt lại bộ nhớ nên lúc đọc đề câu sau vẫn còn "HS đúng" của câu trước)
      delete $("#mcTien").dataset.html;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (mcHien && mcDang === q) vuaChu(q); });
    }
    vuaChu(q);
    datHinh(q);
    if (moi) {
      // hiện dần như clip: mờ sang rõ, thẻ câu hỏi trượt lên; hiện xong thì sân khấu thôi vẽ cho nhẹ máy
      hoat(m, [{ opacity: 0 }, { opacity: 1 }], 450, DE, function () { huyHoat(m); if (mcHien) SK.phu(true); });
      hoat(the, [{ transform: "translateY(40px)" }, { transform: "none" }], 450, DE, function () { huyHoat(the); });
    } else SK.phu(true);
    var nt = $("#mcNuocTo");
    // 6/11 thầy Thịnh: chỉ kêu ở chỗ quan trọng. Màn câu hỏi chỉ còn một tiếng lúc câu hỏi mới hiện ra
    //   (bỏ trống dồn, tiếng ting lúc quét, tiếng kèn câu 5 và tiếng chuông lúc hiện đáp án)
    if (cauMoi && moi) {
      A.baoCau();
      if (q === 5 && loai === "q") {
        nt.hidden = false;
        hoat(nt, [
          { offset: 0, opacity: 0, transform: "scale(.4)" },
          { offset: 0.1, opacity: 0, transform: "scale(.4)", easing: NAY },
          { offset: 0.3, opacity: 1, transform: "scale(1)" },
          { offset: 0.833, opacity: 1, transform: "scale(1)", easing: "ease-in" },
          { offset: 1, opacity: 0, transform: "scale(.9)" }
        ], 3000, "linear", function () { nt.hidden = true; huyHoat(nt); });
      }
    }
    if (loai !== "q") { huyHoat(nt); nt.hidden = true; }
    var moDapAn = loai === "a" && cu === "k" + q;
    if (moDapAn) {
      var o2 = m.querySelector('.mc-o[data-l="' + c.dung + '"]');
      if (o2) hoat(o2, [{ transform: "scale(.94)" }, { transform: "scale(1)" }], 500, NAY, function () { huyHoat(o2); });
    }
    capNhatManCau(q, loai, moDapAn);
  }
  // rời màn câu hỏi: sân khấu vẽ lại ngay, màn câu hỏi mờ dần và thu nhỏ một chút
  function anManCau() {
    if (!mcHien) return;
    mcHien = false;
    SK.phu(false);
    var m = $("#manCau"), the = $("#mcThe"), nt = $("#mcNuocTo");
    huyHoat(nt); nt.hidden = true;
    hoat(m, [{ opacity: 1 }, { opacity: 0 }], 550, DE, function () { if (!mcHien) { m.hidden = true; dungVideo(); } huyHoat(m); });
    hoat(the, [{ transform: "none" }, { transform: "scale(.92)" }], 550, DE, function () { huyHoat(the); });
  }
  function capNhatManCau(q, loai, moDapAn) {
    var c = RD.CAU[q - 1], m = $("#manCau");
    var lop = RD.lop(cfg()), sc = scanHopLe(q), kq = RD.ketQuaCau(q, lop, sc);
    var cards = (sc && sc.cards) || {}, man = (sc && sc.man) || {};
    // số em chọn mỗi đáp án (thẻ giáo viên ghi "đúng" tính vào đáp án đúng)
    var dem = [0, 0, 0, 0];
    lop.to.forEach(function (x) {
      x.coMat.forEach(function (id) {
        var k = "t" + id;
        if (man[k] === "D") dem[RD.CHU.indexOf(c.dung)]++;
        else if (!man[k] && cards[k]) dem[RD.CHU.indexOf(cards[k])]++;
      });
    });
    var hienDem = loai === "k" || loai === "a", hien = loai === "a";
    $$(".mc-o", m).forEach(function (o, i) {
      var dung = o.dataset.l === c.dung, em = o.querySelector("em");
      o.classList.toggle("dung", hien && dung);
      o.classList.toggle("mo", hien && !dung);
      // 8/11 thầy Thịnh: "khi tôi bấm nút đáp án, đáp án đúng đã hiện ra rồi thì các đáp án kia biến mất": vừa bấm Đáp án thì
      //   ô đúng sáng lên, ba ô kia mờ đi (0,4 giây) rồi tan hẳn (từ giây 0,9 đến 1,5); vào lại bước đáp án (lùi về, mở lại
      //   trang) thì ba ô kia đã ẩn sẵn. Lùi về bước quét xong thì cả bốn ô hiện lại.
      var bien = hien && !dung;
      if (bien && !o.classList.contains("bien")) {
        if (moDapAn) hoat(o, [
          { offset: 0, opacity: 1, transform: "none" },
          { offset: 0.27, opacity: 0.4, transform: "none" },
          { offset: 0.6, opacity: 0.4, transform: "none", easing: "ease-in" },
          { offset: 1, opacity: 0, transform: "scale(.9)" }
        ], 1500, "ease-out", function () { huyHoat(o); });
        o.classList.add("bien");
      } else if (!bien && o.classList.contains("bien")) { huyHoat(o); o.classList.remove("bien"); }
      em.hidden = !hienDem;
      var t = dem[i] + " em";
      if (em.textContent !== t) em.textContent = t;
    });
    var html = "";
    if (loai === "k") {
      var thay = 0, tong = 0, thieu = [];
      kq.forEach(function (r) { thay += r.thay; tong += r.thay + r.chua.length; thieu = thieu.concat(r.chua); });
      html = '<span class="' + (thieu.length ? "quet" : "du") + '">Đã quét ' + thay + "/" + tong + " thẻ</span>";
      if (thieu.length) html += '<span class="thieu">Còn thiếu: ' + (thieu.length > 8 ? thieu.slice(0, 8).join(", ") + "…" : thieu.join(", ")) + "</span>";
    } else if (loai === "a") {
      html = kq.map(function (r, t) {
        var T = RD.TO[t];
        return '<span style="--m:' + T.mau + '">' + T.ten + ": " + r.dung + "/" + r.thay + " HS đúng</span>";
      }).join("");
    }
    var el = $("#mcTien");
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  }

  /* ---------- chơi thử: TV tự điền kết quả ---------- */
  function dienThu(q, ngay) {
    if (!q || VAI !== "tv") return;
    var lop = RD.lop(cfg()), dungChu = RD.CAU[q - 1].dung;
    var sc = clone(scanHopLe(q)) || { ses: ses(), q: q, cards: {}, man: {} };
    sc.cards = sc.cards || {}; sc.man = sc.man || {};
    var ds = [];
    lop.to.forEach(function (x, t) {
      var p = 0.5 + Math.random() * 0.48;
      x.coMat.forEach(function (id) { if (!sc.cards["t" + id]) ds.push({ id: id, l: Math.random() < p ? dungChu : RD.CHU[(RD.CHU.indexOf(dungChu) + 1 + Math.floor(Math.random() * 3)) % 4] }); });
    });
    if (!ds.length) return;
    ds.sort(function () { return Math.random() - 0.5; });
    var ghi = function () { sc.at = Date.now(); sc.by = TAB; sc.n = Object.keys(sc.cards).length; DB.set("s" + q, sc); };
    if (ngay) { ds.forEach(function (d) { sc.cards["t" + d.id] = d.l; }); ghi(); return; }
    var k = 0;
    (function buoc() {
      var n = nowHopLe();
      if (n.step !== "q" + q || k >= ds.length) return;
      var lo = ds.slice(k, k + 6);
      k += 6;
      lo.forEach(function (d) { sc.cards["t" + d.id] = d.l; });
      ghi();
      henThu = setTimeout(buoc, 650);
    })();
  }

  /* =====================================================================
     ĐIỆN THOẠI
     ===================================================================== */
  var moCD = false, PQ = null, CHO = {}, soAnh = 0, anhCuoi = null, henGhi = 0, ghiCuoi = 0, menuThe = null;
  var ROT = { doc: 0, ngang: 0, live: 0 };
  try { var rr = JSON.parse(lsGet("rd-xoay", "null")); if (rr) { ROT.doc = rr.doc | 0; ROT.ngang = rr.ngang | 0; } } catch (e) { /* bỏ qua */ }
  var NGHIENG = false;
  var ZOOM_MAY = false, dtBuocCu = null;   // ZOOM_MAY: camera tự chỉnh zoom được; không thì thu phóng bằng phần mềm

  function khoiDT() {
    $("#dt").hidden = false;
    dungChuanBi($("#cbDT"));
    $("#dtTiep").addEventListener("click", function () { A.mo(); tiep(); });
    $("#dtLui").addEventListener("click", function () { lui(); });
    $("#dtNhac").addEventListener("click", function () { var on = cfg().nhac === false; ghiCfg(function (c) { c.nhac = on; }); });
    $("#dtCaiDat").addEventListener("click", function () { moCD = !moCD; this.setAttribute("aria-pressed", moCD ? "true" : "false"); ve(); if (moCD) $("#dtChuanBi").scrollIntoView({ behavior: "smooth", block: "start" }); });
    $("#dtChup").addEventListener("change", function () {
      var f = this.files && this.files[0];
      this.value = "";
      if (f) xuLyAnh(f);
    });
    if (Q.coCamera()) {
      $("#dtBatCam").hidden = false;
      $("#dtChupChu").textContent = "Chụp một tấm ảnh";
    }
    $("#dtBatCam").addEventListener("click", function () { A.mo(); if (Q.Live.chay) dungCam(); else batCam(); });
    $("#dtDen").addEventListener("click", function () {
      var b = this, on = b.getAttribute("aria-pressed") !== "true";
      Q.Live.den(on).then(function () { b.setAttribute("aria-pressed", on ? "true" : "false"); }, function () { b.hidden = true; });
    });
    $("#dtVideo").addEventListener("resize", vuaKhungCam);
    $("#dtVideo").addEventListener("loadedmetadata", vuaKhungCam);
    window.addEventListener("resize", function () { if (Q.Live.chay) vuaKhungCam(); });
    $("#dtZoom").addEventListener("input", function () {
      var z = +this.value;
      $("#dtZoomSo").textContent = soZoomChu(z);
      if (ZOOM_MAY) Q.Live.phongTo(z).catch(function () { /* bỏ qua */ });
      else Q.Live.zoomSo(z);
    });
    // camera to toàn màn hình hoặc thu nhỏ vào thẻ; ảnh chụp chạm để phóng to, chạm lần nữa để thu nhỏ
    $("#dtLon").addEventListener("click", function () { datCamLon(!$("#dtCam").classList.contains("lon")); });
    $("#dtAnhKhung").addEventListener("click", function () { datAnhLon(!this.classList.contains("lon")); });
    $("#dtManDen").addEventListener("click", function () { datAnhLon(false); });
    $("#dtXoayChu").addEventListener("click", function () {
      var d = anhCuoi ? anhCuoi.dang : "doc";
      ROT[d] = (ROT[d] + 1) % 4;
      lsSet("rd-xoay", JSON.stringify({ doc: ROT.doc, ngang: ROT.ngang }));
      if (anhCuoi) veAnh(anhCuoi);
      ghiQuet(true);
      veBangTo();
      trangThai("ok", "Đã xoay chữ cho các ảnh " + (d === "doc" ? "dọc" : "ngang") + " trên máy này.");
    });
    $("#dtTo").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-id]");
      if (!b || !PQ) return;
      moMenu(+b.dataset.id);
    });
    $("#dtMenu").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (e.target === this || (b && b.id === "dtMenuDong")) { dongMenu(); return; }
      if (!b || b.dataset.m == null || !PQ || !menuThe) return;
      var k = "t" + menuThe;
      if (b.dataset.m) PQ.man[k] = b.dataset.m; else delete PQ.man[k];
      dongMenu();
      ghiQuet(true);
      veBangTo();
    });
    window.addEventListener("devicemotion", function (e) {
      var g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      var doc = !screen.orientation || screen.orientation.angle === 0 || screen.orientation.angle === 180;
      var nghieng = doc && Math.abs(g.x) > Math.abs(g.y) + 2.5;
      if (nghieng !== NGHIENG) { NGHIENG = nghieng; $("#dtXoayMay").hidden = !(NGHIENG && Q.Live.chay); }
    });
    Q.khoiDong();
  }
  function trangThai(kieu, chu) {
    var el = $("#dtTrangThai");
    el.className = "dt-tt" + (kieu === "ok" ? " ok" : kieu === "loi" ? " loi" : "");
    el.textContent = chu;
  }
  function tenBuoc(step) {
    var l = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") return "Chuẩn bị";
    if (step === "intro") return "Giới thiệu luật chơi";
    if (l === "q") return "Câu " + q + " · đọc đề, quét thẻ";
    if (l === "k") return "Câu " + q + " · quét xong, TV hiện số em chọn";
    if (l === "a") return "Câu " + q + " · đã hiện đáp án";
    if (l === "r") return q < 5 ? "Câu " + q + " · đang qua cầu" : "Câu 5 · qua cầu, nhóm về nhất bước lên thảm VỀ ĐÍCH";
    return { finish: "Đốt đuốc · nhóm về nhất thắp ngọn đuốc đầu tiên", rank: "Tổng kết · các nhóm còn lại thắp đuốc, Claude bình luận thứ hạng", tuong: "Lửa đốt tan màn đêm, báo tường hiện hình và số 51", bao: "Bồ câu kéo vải xanh lá bay lên, dòng chữ chúc mừng hiện ra, báo tường đầy đủ" }[step] || step;
  }
  function nhanTiep(step) {
    var l = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") return "Bắt đầu trò chơi";
    if (step === "intro") return "Hiện câu 1";
    if (l === "q") return "Quét xong";
    if (l === "k") return "Đáp án";
    if (l === "a") return "Di chuyển";
    if (l === "r") return q < 5 ? "Hiện câu " + (q + 1) : "Đốt đuốc";      // 6/11 trưa: thầy bấm thì nhóm về nhất thắp đuốc
    return { finish: "Tổng kết", rank: "Tiếp theo", tuong: "Tiếp theo" }[step] || "Đã xong phần khởi động";
  }
  function veDT() {
    var now = nowHopLe(), step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    // bấm Quét xong (hay sang bước khác): camera đang toàn màn hình thì thu nhỏ để thấy bảng thẻ còn thiếu
    if (step !== dtBuocCu) {
      if (dtBuocCu !== null && loai !== "q" && $("#dtCam").classList.contains("lon")) datCamLon(false);
      dtBuocCu = step;
    }
    $("#dtBuoc").textContent = tenBuoc(step);
    var nn = $("#dtNhac"), nhacOn = cfg().nhac !== false;
    nn.setAttribute("aria-pressed", nhacOn ? "true" : "false");
    nn.textContent = nhacOn ? "Nhạc: bật" : "Nhạc: tắt";
    var chip = $("#dtNoi");
    chip.className = "chip " + NOI.kieu;
    chip.textContent = NOI.kieu === "ok" ? "Đã nối với TV" : NOI.kieu === "motmay" ? "Chưa nối với TV" : NOI.chu;
    chip.title = NOI.chu;
    var t = $("#dtTiep");
    t.textContent = nhanTiep(step);
    t.classList.toggle("lua", step === "r5");
    t.disabled = step === "bao";
    $("#dtLui").disabled = step === "setup";
    // câu hỏi
    $("#dtCau").hidden = !q;
    if (q) {
      var c = RD.CAU[q - 1];
      $("#dtCau").style.setProperty("--ac", c.mau);
      $("#dtCauSo").textContent = RD.nhanCau(q) + " · " + RD.TEN_DE[RD.deDang];
      $("#dtDapAn").textContent = "Đáp án đúng: " + c.dung;
      $("#dtCauHoi").textContent = c.hoi;
    }
    var coQuet = loai === "q" || loai === "k" || loai === "a";
    $("#dtQuet").hidden = !coQuet;
    $("#dtChuanBi").hidden = !(step === "setup" || moCD);
    capNhatChuanBi($("#cbDT"));
    if (coQuet) { datCauQuet(q); veBangTo(); }
    else if (Q.Live.chay) dungCam();
    $("#dtNc").hidden = !(coQuet && anhCuoi);
    // hướng dẫn ngắn theo bước
    var ghi = $("#dtGhi"), html = "";
    if (step === "setup") html = "<b>Trước giờ học</b><ol><li>Chọn <b>Đề cơ bản</b> hoặc <b>Đề nâng cao</b> ở phần chuẩn bị bên dưới.</li><li>Kiểm tra sĩ số, danh sách 4 nhóm, chạm số thẻ bạn vắng.</li><li>Trên laptop nối TV: mở trang này, chọn <b>Màn hình TV</b>, bấm F11.</li><li>Bấm <b>Bắt đầu trò chơi</b> ở dưới.</li></ol>";
    else if (step === "intro") html = "TV đang hiện màn chơi, luật chơi còn ẩn. Bấm <b>Hiện luật chơi</b> ở góc phải trên TV để đọc luật cho cả lớp nghe (bấm <b>Ẩn</b> để các em xem lại màn chơi). Xong thì bấm <b>Hiện câu 1</b>.";
    else if (loai === "q") html = Q.coCamera() ? "Cả lớp đếm 3, 2, 1 rồi giơ thẻ. Bấm <b>Bật camera quét liên tục</b>, đưa điện thoại lia chậm qua từng cụm nhóm cho đến khi nhóm báo đủ, rồi bấm <b>Quét xong</b>." : "Cả lớp đếm 3, 2, 1 rồi giơ thẻ. Đứng gần từng cụm nhóm, bấm <b>Chụp ảnh một nhóm</b>: mỗi cụm một tấm, chụp thêm nếu còn thiếu thẻ, rồi bấm <b>Quét xong</b>.";
    else if (loai === "k") html = "TV đang hiện số em chọn mỗi đáp án và số thẻ còn thiếu. Thẻ nào còn thiếu thì quét lại, hoặc chạm số thẻ để ghi Đúng, Sai hoặc Vắng (thẻ không ghi thì không tính đúng cũng không tính sai). Xong bấm <b>Đáp án</b>.";
    else if (loai === "a") html = "TV hiện đáp án đúng và số bạn đúng của từng nhóm. Mời một em nêu cách làm, rồi bấm <b>Di chuyển</b>.";
    else if (loai === "r" && q === 5) html = "Miếng ghép cuối cùng bay vào cầu, các bạn qua khúc cầu cuối. Nhóm về nhất tự bước lên thảm VỀ ĐÍCH, cả lớp vỗ tay. Chờ Claude bình luận xong rồi bấm <b>Đốt đuốc</b> để nhóm về nhất thắp ngọn đuốc đầu tiên.";
    else if (loai === "r") html = "Miếng ghép đang bay vào cầu, 4 bạn cùng qua khúc cầu. Chờ Claude bình luận xong rồi bấm tiếp.";
    else if (step === "finish") html = "Nhóm về nhất đã thắp ngọn đuốc đầu tiên. Chúc mừng nhóm, rồi bấm <b>Tổng kết</b> để các nhóm còn lại lần lượt thắp đuốc.";
    else if (step === "rank") html = "Các nhóm còn lại lần lượt thắp đuốc theo thứ hạng, rồi Claude bình luận thứ hạng. Khi nút trên TV đổi thành <b>Tiếp theo</b>, chúc mừng các nhóm rồi bấm <b>Tiếp theo</b>.";
    else if (step === "tuong") html = "4 tia lửa bay lên số 51, lửa đốt tan màn đêm, báo tường hiện ra (tấm vải xanh lá còn che dải băng chúc mừng). Hỏi cả lớp: <b>Sắp tới trường chúng ta có ngày gì?</b> Nghe các em trả lời rồi bấm <b>Tiếp theo</b>: hai chú bồ câu bay xuống kéo tấm vải xanh lá bay lên (có tiếng vỗ tay), dòng chữ chúc mừng hiện ra, hiện cả báo tường.";
    else if (step === "bao") {
      var hang = RD.xepHang(tinh());
      html = "Xong phần khởi động. Thứ hạng: " + hang.thuTu.map(function (t) { return hang.hang[t] + ". " + RD.TO[t].ten; }).join(", ") + ".";
    }
    $("#dtGhi").hidden = !html;
    if (ghi.dataset.html !== html) { ghi.innerHTML = html; ghi.dataset.html = html; }
    capManDen();
  }

  /* ---------- quét trên điện thoại ---------- */
  function datCauQuet(q) {
    var key = ses() + ":" + q;
    if (!PQ || PQ.key !== key) {
      PQ = { key: key, q: q, obs: {}, man: {} };
      CHO = {};
      anhCuoi = null;
      soAnh = 0;
      $("#dtAnhKhung").hidden = true;
      trangThai("", "");
    }
    // nhận kết quả từ máy khác (hoặc lúc trang vừa mở lại)
    var sc = scanHopLe(q);
    if (sc && sc.by !== TAB) {
      Object.keys(sc.cards || {}).forEach(function (k) { var o = PQ.obs[k]; if (!o || !o.t) PQ.obs[k] = { l: sc.cards[k], t: 0 }; });
      PQ.man = clone(sc.man || {});
    } else if (sc && !PQ.daNap) {
      Object.keys(sc.cards || {}).forEach(function (k) { if (!PQ.obs[k]) PQ.obs[k] = { l: sc.cards[k], t: 0 }; });
      PQ.man = clone(sc.man || {});
    }
    PQ.daNap = true;
  }
  function chuCua(o) { return o.k != null ? RD.CHU[(o.k + (ROT[o.dang] || 0)) % 4] : o.l; }
  function theHienTai() {
    var m = {};
    if (!PQ) return m;
    Object.keys(PQ.obs).forEach(function (k) { m[k] = chuCua(PQ.obs[k]); });
    return m;
  }
  function ghiQuet(ngay) {
    if (!PQ || !DB) return;
    var lam = function () {
      henGhi = 0; ghiCuoi = Date.now();
      var cards = theHienTai();
      DB.set("s" + PQ.q, { ses: ses(), q: PQ.q, cards: cards, man: PQ.man, n: Object.keys(cards).length, at: Date.now(), by: TAB });
    };
    if (ngay) { clearTimeout(henGhi); lam(); return; }
    if (henGhi) return;
    henGhi = setTimeout(lam, Math.max(0, 700 - (Date.now() - ghiCuoi)));
  }
  function veBangTo() {
    if (!PQ) return;
    var lb = RD.loaiBuoc(nowHopLe().step), lop = RD.lop(cfg()), m = theHienTai(), man = PQ.man, hien = lb === "a", hienPB = lb === "k" || lb === "a";
    var dungChu = RD.CAU[PQ.q - 1].dung, tongThay = 0, tongCo = 0, demCam = [];
    var html = lop.to.map(function (x, t) {
      var T = RD.TO[t], thay = 0, dung = 0, chua = [], dd = [];
      x.coMat.forEach(function (id) {
        var k = "t" + id, mm = man[k];
        if (mm) { dd.push({ id: id, m: mm }); if (mm !== "V") { thay++; if (mm === "D") dung++; } return; }
        if (m[k]) { thay++; if (m[k] === dungChu) dung++; } else chua.push(id);
      });
      var tong = x.coMat.length - dd.filter(function (d) { return d.m === "V"; }).length;
      tongThay += thay; tongCo += tong;
      var du = tong > 0 && !chua.length;
      demCam.push('<span class="' + (du ? "du" : "") + '" style="--m:' + T.mau + ";--d:" + T.dam + '">' + T.ten + " · " + thay + "/" + tong + "</span>");
      var chips = chua.map(function (id) { return '<button type="button" data-id="' + id + '" aria-label="Thẻ ' + id + ' chưa đọc được, chạm để ghi">' + id + "</button>"; }).join("") +
        dd.map(function (d) { return '<button type="button" data-id="' + d.id + '" class="' + d.m + '" aria-label="Thẻ ' + d.id + ' đã ghi ' + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + '">' + d.id + " " + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + "</button>"; }).join("");
      return '<div class="dt-hang" style="--m:' + T.mau + ";--d:" + T.dam + ";--n:" + T.nhat + '"><div class="dt-hang-dau"><b>' + T.ten + '</b><span class="dt-thanh"><i style="width:' + (tong ? Math.round(100 * thay / tong) : 0) + '%"></i></span><span class="' + (du ? "du" : "") + '">' +
        (du ? "đủ " : "") + thay + "/" + tong + (hien ? " · đúng " + dung : "") + "</span></div>" +
        (chips ? '<div class="dt-thieu">' + (chua.length ? "<small>Còn thiếu:</small>" : "") + chips + "</div>" : "") + "</div>";
    }).join("");
    var el = $("#dtTo");
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    // số thẻ đã đọc của từng nhóm, hiện ngay trên khung camera lúc toàn màn hình
    var dc = $("#dtCamDem"), hdc = demCam.join("");
    if (dc.dataset.html !== hdc) { dc.innerHTML = hdc; dc.dataset.html = hdc; }
    // phân bố đáp án (chỉ giáo viên thấy, sau khi hiện đáp án)
    var pb = $("#dtPhanBo");
    pb.hidden = !hienPB;
    if (hienPB) {
      var dem = [0, 0, 0, 0];
      Object.keys(m).forEach(function (k) { var id = +k.slice(1); if (lop.toCua[id] && !lop.vang[id] && !man[k]) dem[RD.CHU.indexOf(m[k])]++; });
      pb.innerHTML = RD.CHU.map(function (l, i) { return '<span class="' + (hien && l === dungChu ? "dung" : "") + '">' + l + ": " + dem[i] + " em</span>"; }).join("");
    }
    var nut = $("#dtChupChu");
    if (!Q.Live.chay && !Q.coCamera()) nut.textContent = tongThay >= tongCo && tongCo ? "Đã đủ thẻ · chụp thêm nếu cần" : (soAnh && tongThay ? "Chụp thêm · còn thiếu " + (tongCo - tongThay) + " thẻ" : "Chụp ảnh một nhóm");
  }
  function moMenu(id) {
    menuThe = id;
    var lop = RD.lop(cfg()), t = lop.toCua[id];
    $("#dtMenuTen").textContent = "Thẻ số " + id + (t ? " · " + RD.TO[t - 1].ten : "") + ": ghi kết quả câu này";
    $("#dtMenu").hidden = false;
  }
  function dongMenu() { $("#dtMenu").hidden = true; menuThe = null; }

  function xuLyAnh(file) {
    if (!PQ) return;
    var q = PQ.q, key = PQ.key;
    trangThai("", "Đang đọc thẻ trong ảnh, chờ vài giây…");
    $("#dtChupNhan").setAttribute("aria-disabled", "true");
    Q.docAnh(file).then(function (r) {
      $("#dtChupNhan").removeAttribute("aria-disabled");
      if (!PQ || PQ.key !== key) return;
      var lop = RD.lop(cfg()), moi = 0, trong = 0, ngoai = [];
      r.cards.forEach(function (c) {
        if (!lop.toCua[c.id]) { ngoai.push(c.id); return; }
        if (lop.vang[c.id]) return;
        trong++;
        var k = "t" + c.id;
        if (!PQ.obs[k]) moi++;
        PQ.obs[k] = { k: c.k, dang: r.dang, t: Date.now() };
      });
      soAnh++;
      anhCuoi = r;
      veAnh(r);
      var giay = r.giay.toFixed(1).replace(".", ",");
      var msg = trong ? "Ảnh " + soAnh + ": đọc được " + trong + " thẻ (" + moi + " thẻ mới) trong " + giay + " giây." : "Ảnh " + soAnh + ": chưa thấy thẻ nào. Đứng gần hơn, giữ máy chắc tay, nhờ các em giơ thẻ cao và thẳng.";
      if (ngoai.length) msg += " Bỏ qua thẻ " + ngoai.join(", ") + " vì không có trong danh sách nhóm.";
      trangThai(trong ? "ok" : "loi", msg);
      if (moi) { A.tich(); try { navigator.vibrate && navigator.vibrate(30); } catch (e) { /* bỏ qua */ } }
      ghiQuet(true);
      veBangTo();
      $("#dtNc").hidden = false;
      void q;
    }, function (e) {
      $("#dtChupNhan").removeAttribute("aria-disabled");
      trangThai("loi", "Không đọc được ảnh này (" + ((e && e.message) || e) + "). Hãy chụp lại.");
    });
  }
  function veAnh(r) {
    var cv = $("#dtAnh"), x = cv.getContext("2d");
    cv.width = r.hinhNho.width; cv.height = r.hinhNho.height;
    x.drawImage(r.hinhNho, 0, 0);
    var lop = RD.lop(cfg());
    r.cards.forEach(function (c) {
      var p = c.corners.map(function (q) { return [q.x * r.tiLe, q.y * r.tiLe]; });
      var ok = lop.toCua[c.id] && !lop.vang[c.id];
      x.beginPath(); x.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < 4; i++) x.lineTo(p[i][0], p[i][1]);
      x.closePath();
      x.lineWidth = 3; x.strokeStyle = ok ? "#3ddc84" : "#bbbbbb"; x.stroke();
      var cx = (p[0][0] + p[2][0]) / 2, cy = (p[0][1] + p[2][1]) / 2;
      var chu = c.id + " " + RD.CHU[(c.k + (ROT[r.dang] || 0)) % 4];
      x.font = "700 15px system-ui, sans-serif";
      var w = x.measureText(chu).width + 10;
      x.fillStyle = "rgba(20,14,8,.8)"; x.fillRect(cx - w / 2, cy - 11, w, 22);
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(chu, cx, cy + 1);
    });
    $("#dtAnhKhung").hidden = !!Q.Live.chay;
  }
  function batCam() {
    var nut = $("#dtBatCam");
    nut.setAttribute("aria-disabled", "true");
    trangThai("", "Đang mở camera…");
    $("#dtCam").hidden = false;
    $("#dtAnhKhung").hidden = true;
    Q.Live.batDau($("#dtVideo"), $("#dtPhu"), nhanKhung, nhanThe).then(function () {
      nut.removeAttribute("aria-disabled");
      nut.textContent = "Dừng quét";
      trangThai("ok", "Đang quét: lia chậm qua từng cụm nhóm, giữ máy cách thẻ 1 đến 4 mét.");
      var kn = Q.Live.khaNang(), z = $("#dtZoom");
      $("#dtDen").hidden = !kn.torch;
      // thanh thu phóng: dùng zoom của camera nếu máy cho, không thì phóng bằng phần mềm (1 đến 3 lần)
      ZOOM_MAY = !!(kn.zoom && kn.zoom.max > kn.zoom.min);
      if (ZOOM_MAY) { z.min = kn.zoom.min; z.max = Math.min(kn.zoom.max, 8); z.step = kn.zoom.step || 0.1; z.value = kn.zoom.min; }
      else { z.min = 1; z.max = 3; z.step = 0.1; z.value = 1; Q.Live.zoomSo(1); }
      $("#dtZoomSo").textContent = soZoomChu(+z.value);
      $("#dtZoomKhung").hidden = false;
      $("#dtXoayMay").hidden = !NGHIENG;
      datCamLon(true);
      giuManHinh();
    }, function (e) {
      nut.removeAttribute("aria-disabled");
      $("#dtCam").hidden = true;
      var ten = e && e.name;
      trangThai("loi", ten === "NotAllowedError" ? "Chrome chưa cho dùng camera: bấm biểu tượng ổ khóa cạnh địa chỉ trang, cho phép Máy ảnh rồi bấm lại." :
        ten === "NotFoundError" ? "Không tìm thấy camera trên máy này." : "Không mở được camera (" + (ten || e) + "). Dùng nút Chụp một tấm ảnh.");
    });
  }
  // khung xem camera theo đúng tỉ lệ ảnh camera (dọc hay ngang) để thấy trọn khung đang đọc:
  // toàn màn hình thì to hết cỡ phía trên thanh nút dưới; thu nhỏ thì nằm trong thẻ, không cao quá 60% màn hình
  function vuaKhungCam() {
    var v = $("#dtVideo"), k = $("#dtCam");
    if (!v.videoWidth || !v.videoHeight) return;
    var r = v.videoWidth / v.videoHeight;
    k.style.aspectRatio = v.videoWidth + " / " + v.videoHeight;
    if (k.classList.contains("lon")) {
      var rong = document.documentElement.clientWidth || window.innerWidth;
      var cao = window.innerHeight - ($(".dt-chan").offsetHeight || 0);
      var w = Math.min(rong, cao * r), h = w / r;
      k.style.width = Math.round(w) + "px"; k.style.height = Math.round(h) + "px";
      k.style.left = Math.round((rong - w) / 2) + "px"; k.style.top = Math.max(0, Math.round((cao - h) / 2)) + "px";
      k.style.margin = "0";
    } else {
      var cha = k.parentNode, cs = getComputedStyle(cha);
      var w2 = cha.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      var maxH = Math.round(window.innerHeight * 0.6);
      k.style.height = ""; k.style.left = ""; k.style.top = "";
      k.style.width = w2 / r > maxH ? Math.round(maxH * r) + "px" : "";
      k.style.margin = "0 auto";
    }
    Q.Live.ve();
  }
  // lon: khung camera phủ màn hình (mặc định khi vừa bật camera) hay nằm gọn trong thẻ quét
  function datCamLon(lon) {
    var k = $("#dtCam");
    lon = !!lon && !!Q.Live.chay;
    k.classList.toggle("lon", lon);
    $("#dtLon").textContent = lon ? "Thu nhỏ" : "Toàn màn hình";
    capManDen();
    vuaKhungCam();
    if (!lon && Q.Live.chay) k.scrollIntoView({ block: "nearest" });
  }
  function datAnhLon(lon) {
    var k = $("#dtAnhKhung");
    k.classList.toggle("lon", !!lon && !k.hidden);
    capManDen();
  }
  // nền đen phía sau khung lớn; khóa cuộn trang khi đang phóng to
  function capManDen() {
    var cam = $("#dtCam"), anh = $("#dtAnhKhung"), coQuet = !$("#dtQuet").hidden;
    if (cam.classList.contains("lon") && (cam.hidden || !coQuet || !Q.Live.chay)) { cam.classList.remove("lon"); $("#dtLon").textContent = "Toàn màn hình"; }
    if (anh.classList.contains("lon") && (anh.hidden || !coQuet)) anh.classList.remove("lon");
    var lon = cam.classList.contains("lon") || anh.classList.contains("lon");
    var den = $("#dtManDen");
    if (den.hidden === lon) den.hidden = !lon;
    document.documentElement.classList.toggle("dt-khoa", lon);
    if (lon) document.documentElement.style.setProperty("--dt-chan-h", ($(".dt-chan").offsetHeight || 0) + "px");
  }
  function soZoomChu(z) { return (Math.round(z * 10) / 10).toString().replace(".", ",") + "×"; }
  function dungCam() {
    Q.Live.dung();
    $("#dtCam").hidden = true;
    datCamLon(false);
    $("#dtZoomKhung").hidden = true;
    var nut = $("#dtBatCam");
    nut.textContent = "Bật camera quét liên tục";
    if (anhCuoi) $("#dtAnhKhung").hidden = false;
  }
  // nhãn vẽ trên khung camera
  function nhanThe(c) {
    var lop = RD.lop(cfg()), k = "t" + c.id;
    if (!lop.toCua[c.id]) return { mau: "rgba(190,190,190,.85)", chu: c.id + "?" };
    if (lop.vang[c.id]) return { mau: "rgba(190,190,190,.85)", chu: c.id + " vắng" };
    var o = PQ && PQ.obs[k], l = RD.CHU[c.k];
    if (o && chuCua(o) === l) return { mau: "#3ddc84", chu: c.id + " " + l };
    return { mau: "#ffd54a", chu: String(c.id) };
  }
  // mỗi khung camera đọc xong: thẻ phải thấy cùng một chữ ở 2 khung liên tiếp mới ghi
  function nhanKhung(cards) {
    if (!PQ || NGHIENG) return;
    var lop = RD.lop(cfg()), t = performance.now(), doi = false, moi = 0;
    cards.forEach(function (c) {
      if (!lop.toCua[c.id] || lop.vang[c.id]) return;
      var k = "t" + c.id, l = RD.CHU[c.k], ch = CHO[k];
      if (ch && ch.l === l && t - ch.t < 1600) { ch.n++; ch.t = t; } else { CHO[k] = ch = { l: l, n: 1, t: t }; }
      if (ch.n >= 2) {
        var o = PQ.obs[k];
        if (!o || chuCua(o) !== l) {
          if (!o) moi++;
          PQ.obs[k] = { k: c.k, dang: "live", t: Date.now() };
          doi = true;
        }
      }
    });
    if (moi) { A.tich(); try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* bỏ qua */ } }
    if (doi) { ghiQuet(false); veBangTo(); }
  }

  /* =====================================================================
     KHỞI ĐỘNG
     ===================================================================== */
  function baoNoi(kieu, chu) { NOI = { kieu: kieu, chu: chu }; ve(); }
  // 9/11 04:11 UTC (thầy Thịnh: "mặc định trong cài đặt luôn luôn là đề cơ bản nha"): mở trang trên TV mà ván chưa bắt đầu (bước
  //   chuẩn bị hoặc giới thiệu, chưa có thẻ nào được quét) thì đề về Đề cơ bản, một lần lúc vừa nối xong dữ liệu (đợi đủ cấu hình,
  //   bước đang chơi và 5 câu quét, đều là dữ liệu chắc chắn chứ không phải bản lưu tạm của trình duyệt). Sau đó thầy vẫn bấm chọn
  //   Đề nâng cao được như cũ.
  var daVeDeMacDinh = false, chacNow = false, daNhanQuet = {};
  function veDeMacDinh() {
    if (daVeDeMacDinh || VAI !== "tv" || !chacCfg || !chacNow || Object.keys(daNhanQuet).length < 5) return;
    daVeDeMacDinh = true;
    if (S.cfg && S.cfg.ses && S.cfg.de && S.cfg.de !== RD.DE_MAC_DINH && duocDoiDe()) {
      RD.chonDe(RD.DE_MAC_DINH);
      ghiCfg(function (c) { delete c.de; });
    }
  }
  function ganDongBo() {
    DB.on("cfg", function (v, chac) {
      S.cfg = v;
      RD.chonDe(v && v.de);
      if (chac) chacCfg = true;
      if (chacCfg && !daKhoiTao) {
        daKhoiTao = true;
        if (!v || !v.ses) vanMoi(false);
      }
      veDeMacDinh();
      ve();
    });
    DB.on("now", function (v, chac) { S.now = v; coNow = true; if (chac) chacNow = true; veDeMacDinh(); ve(); });
    DB.on("ph", function (v) { S.ph = v; ve(); });
    [1, 2, 3, 4, 5].forEach(function (q) { DB.on("s" + q, function (v, chac) { S.scans[q] = v; if (chac) daNhanQuet[q] = true; veDeMacDinh(); ve(); }); });
    if (VAI === "dt") DB.set("ph", { dev: DEV, at: Date.now() });
    ve();
  }
  function vaoVai(v) {
    VAI = v;
    lsSet("rd-vai", v);
    document.documentElement.classList.add(v);
    $("#vaiTro").hidden = true;
    if (v === "tv") khoiTV(); else khoiDT();
    ve();
    RD.taoDongBo(baoNoi).then(function (api) { DB = api; ganDongBo(); }, function (e) { console.error(e); baoNoi("loi", "Không nối được dữ liệu"); });
  }
  function batDau() {
    var h = (location.hash || "").replace("#", "");
    var v = h === "dien-thoai" ? "dt" : h === "man-hinh" ? "tv" : lsGet("rd-vai", "");
    if (v === "tv" || v === "dt") { vaoVai(v); return; }
    var hop = $("#vaiTro");
    hop.hidden = false;
    var hep = window.matchMedia && matchMedia("(max-width: 700px)").matches;
    $("#vaiGhi").textContent = hep ? "Máy này có màn hình nhỏ, thường dùng làm Điện thoại." : "Máy này có màn hình lớn, thường dùng làm Màn hình TV.";
    hop.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-vai]");
      if (!b) return;
      A.mo();
      vaoVai(b.dataset.vai);
    });
  }
  RD._test = { S: S, duocDoiDe: function () { return duocDoiDe(); }, tinh: tinh, lichSu: lichSu, tiep: tiep, lui: lui, datBuoc: datBuoc, nowHopLe: nowHopLe, xuLyAnh: xuLyAnh, nhanKhung: nhanKhung, hopKhuon: hopKhuon, nhacClaude: nhacClaude, BL: function () { return BL; } };
  batDau();
})();
