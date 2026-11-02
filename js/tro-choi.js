/* Rước đuốc về trường: điều khiển buổi chơi (TV và điện thoại) */
(function () {
  "use strict";
  var RD = window.RD, SK = RD.SanKhau, Q = RD.Quet, A = RD.AmThanh;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var G = function () { return window.gsap; };
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
  function vanMoi(giuLop) {
    var s = ngauNhien(8), c = giuLop && S.cfg ? clone(S.cfg) : RD.cfgMacDinh(s);
    c.ses = s; c.at = Date.now();
    DB.set("cfg", c);
    DB.set("now", { ses: s, step: "setup", pub: {}, at: Date.now(), by: TAB });
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
      if (!lop.coMat) { thongBao("Chưa có bạn nào có mặt: kiểm tra sĩ số và danh sách tổ."); return; }
    }
    if (loai === "a" && !daDongY) {
      var kq = RD.ketQuaCau(q, RD.lop(cfg()), scanHopLe(q));
      var trong = [];
      kq.forEach(function (r, t) { if (r.coMat > 0 && r.thay === 0) trong.push(RD.TO[t].ten); });
      if (trong.length) {
        hoi((trong.length === 4 ? "Chưa đọc được thẻ nào ở câu " + q + "." : "Chưa đọc được thẻ nào của " + trong.join(", ") + " ở câu " + q + ".") + " Vẫn công bố?", "Vẫn công bố", "Quét thêm").then(function (ok) { if (ok) tiep(true); });
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
    return String(t || "").replace(/\s+/g, " ").replace(/^["“”'\s]+|["“”'\s]+$/g, "").slice(0, 240);
  }
  function nhacClaude(q, truoc, sau) {
    var hang = RD.xepHang(sau), hangTruoc = RD.xepHang(truoc);
    var dong = sau.map(function (r, t) {
      var c = r.cau[q] || { dung: 0, thay: 0, buoc: 0 };
      return "- " + RD.TO[t].ten + ": câu này +" + c.buoc + " bước (" + c.dung + "/" + c.thay + " bạn đúng), tổng " + r.buoc + "/" + r.toiDa + " bước, đã đi " + Math.round(r.viTri * 100) + "% quãng đường, đang xếp thứ " + hang.hang[t] + ".";
    }).join("\n");
    var ghi = [];
    sau.forEach(function (r, t) { if (r.cau[q] && r.cau[q].tron) ghi.push(RD.TO[t].ten + " đúng cả tổ ở câu này."); });
    if (q > 1 && hang.nhat.length === 1 && hangTruoc.nhat.indexOf(hang.nhat[0]) < 0) ghi.push(RD.TO[hang.nhat[0]].ten + " vừa vượt lên dẫn đầu.");
    if (q === 5) ghi.push(hang.nhat.length > 1 ? "Câu cuối: " + hang.nhat.map(function (t) { return RD.TO[t].ten; }).join(" và ") + " về đích bằng nhau, sẽ cùng châm lửa." : "Câu cuối: " + RD.TO[hang.nhat[0]].ten + " đi xa nhất, sẽ được châm đài lửa.");
    else if (q === 4) ghi.push("Câu sau là câu 5, chặng nước rút, mỗi bạn đúng được 2 bước.");
    return "Bạn là bình luận viên vui vẻ của trò chơi \"Rước đuốc về trường\" ở lớp 6/3 (học sinh 11-12 tuổi). " +
      "Bốn tổ cầm đuốc đi trên 4 đường dài bằng nhau về đài lửa; mỗi bạn trả lời đúng thì tổ tiến 1 bước, câu 5 là chặng nước rút được 2 bước.\n" +
      "Vừa công bố câu " + q + "/5. Số liệu:\n" + dong + (ghi.length ? "\nGhi chú: " + ghi.join(" ") : "") +
      "\nViết đúng MỘT câu bình luận bằng tiếng Việt có dấu, dài 12 đến 28 từ, giọng phấn khởi như bình luận viên thể thao, nhắc tên tổ và số bước. " +
      "Không nhắc đáp án, phép tính hay lỗi sai; không chê tổ nào, tổ đi chậm thì động viên. Không dùng emoji, không dùng dấu ngoặc kép. Chỉ trả về câu bình luận.";
  }
  var BL = {};
  function hienLoiBinh(chu, nhan, cho) {
    var el = $("#loiBinh");
    el.hidden = false;
    $("#lbNhan").textContent = nhan;
    var p = $("#lbChu");
    if (cho && !chu) p.innerHTML = '<span class="cho"><i></i><i></i><i></i></span>';
    else p.textContent = chu;
  }
  function binhLuan(q, truoc, sau) {
    var key = ses() + ":" + q;
    var mau = RD.loiBinhMau(q, truoc, sau, Math.floor(Math.random() * 1000));
    var xong = false, ctl = null;
    var dung = function (chu, nhan) { if (xong) return; xong = true; BL[key] = { chu: chu, nhan: nhan }; if (dangOR(q)) hienLoiBinh(chu, nhan); };
    if (!RD.trongClaude) { dung(mau, "Lời bình"); return; }
    if (dangOR(q)) hienLoiBinh("", "Claude bình luận", true);
    var hen = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* bỏ qua */ } dung(mau, "Lời bình"); }, 10000);
    layMau().then(function (sample) {
      if (!sample) throw { code: "khong_co" };
      ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      return sample(nhacClaude(q, truoc, sau), {
        modelTier: "quick", cache: false, signal: ctl ? ctl.signal : undefined,
        onText: function (u) { if (!xong && dangOR(q)) hienLoiBinh(lamSach(u.text), "Claude bình luận"); }
      });
    }).then(function (r) {
      clearTimeout(hen);
      var t = lamSach(r && r.text);
      if (t.length < 8) throw { code: "rong" };
      dung(t, "Claude bình luận");
    }).catch(function () { clearTimeout(hen); dung(mau, "Lời bình"); });
  }
  function dangOR(q) { var n = nowHopLe(); return VAI === "tv" && n.step === "r" + q; }

  /* ---------- khung chuẩn bị (dùng chung cho TV và điện thoại) ---------- */
  function dungChuanBi(el) {
    var to = RD.TO.map(function (t, i) {
      return '<span class="ten" style="--m:' + t.mau + ';--d:' + t.dam + '"><i></i>' + t.ten + '</span>' +
        '<input type="text" data-cb="ds" data-t="' + i + '" inputmode="numeric" autocomplete="off" aria-label="Số thẻ của ' + t.ten + '">' +
        '<span class="dem" data-cb="dem" data-t="' + i + '"></span>';
    }).join("");
    el.innerHTML =
      '<div class="cb">' +
      '<div class="cb-khoi"><h3>1. Sĩ số và 4 tổ</h3>' +
      '<div class="cb-hang"><label>Sĩ số lớp <input type="number" min="4" max="46" data-cb="siSo"></label>' +
      '<button type="button" class="nut" data-cb="chia">Chia lại 4 tổ theo sĩ số</button></div>' +
      '<div class="cb-to">' + to + '</div>' +
      '<p class="cb-ghi">Ghi số thẻ của từng tổ, ví dụ 1-11 hoặc 1-10, 46 (thẻ 46 là thẻ dự phòng).</p>' +
      '<p class="cb-loi" data-cb="loi" hidden></p></div>' +
      '<div class="cb-khoi"><h3>2. Chạm vào số thẻ của bạn vắng hôm nay</h3><div class="cb-luoi" data-cb="luoi"></div><p class="cb-tom" data-cb="tom"></p></div>' +
      '<div class="cb-khoi"><h3>3. Nối điện thoại với TV</h3><div data-cb="noi"></div></div>' +
      '<div class="cb-khoi" data-cb="khoiClaude" hidden><h3>4. Claude bình luận trên TV</h3>' +
      '<div class="cb-hang"><button type="button" class="nut" data-cb="claude">Kiểm tra Claude</button><span class="chip" data-cb="claudeTT">Chưa kiểm tra</span></div>' +
      '<p class="cb-ghi">Bấm một lần trên laptop nối TV trước giờ học: nếu Claude cần xin phép thì hộp xin phép hiện lúc này, không hiện giữa tiết.</p></div>' +
      '<div class="cb-khoi" data-cb="khoiAnh" hidden><h3>4. Ảnh báo tường</h3>' +
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
      this.value = "";
    });
    q("thu").addEventListener("change", function () { var on = this.checked; ghiCfg(function (c) { c.thu = on; }); });
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
    if (lop.trung.length) loi.textContent = "Thẻ số " + lop.trung.join(", ") + " đang nằm ở 2 tổ, mỗi thẻ chỉ để ở 1 tổ.";
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
    dungChuanBi($("#cbTV"));
    napAnhBao();
    $("#nutBatDau").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "setup") tiep(); else { moCB = false; ve(); } });
    $("#nutFullTV").addEventListener("click", toanManHinh);
    $("#tvNut").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      A.mo();
      var k = b.dataset.tv;
      if (k === "tiep") { if (choXacNhan) choXacNhan(true); else tiep(); }
      else if (k === "lui") { if (choXacNhan) choXacNhan(false); else lui(); }
      else if (k === "full") toanManHinh();
      else if (k === "am") { A.datBat(!A.bat); b.setAttribute("aria-pressed", A.bat ? "true" : "false"); }
      else if (k === "cb") { moCB = !moCB; ve(); }
      else if (k === "thu") dienThu(RD.cauCuaBuoc(nowHopLe().step), true);
    });
    $('[data-tv="am"]').setAttribute("aria-pressed", A.bat ? "true" : "false");
    $("#nutChamLua").addEventListener("click", function () { A.mo(); if (nowHopLe().step === "finish") tiep(); });
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
      else if (k === "m" || k === "M") { A.datBat(!A.bat); $('[data-tv="am"]').setAttribute("aria-pressed", A.bat ? "true" : "false"); }
    });
    document.addEventListener("pointerdown", function () { A.mo(); }, { passive: true });
    // ẩn chuột và nút khi không dùng
    var henChuot = 0;
    var hien = function () {
      $("#tv").classList.remove("an-chuot");
      $("#tvNut").classList.remove("an");
      clearTimeout(henChuot);
      henChuot = setTimeout(function () { $("#tv").classList.add("an-chuot"); $("#tvNut").classList.add("an"); }, 3500);
    };
    document.addEventListener("mousemove", hien, { passive: true });
    hien();
    giuManHinh();
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
    $('[data-tv="thu"]').hidden = !((loai === "q" || loai === "a") && cfg().thu);
    // băng rôn trên tường: câu đang chơi, các câu đã công bố
    var daCB = cauDaTinh(), soCB = Object.keys(daCB).length;
    $("#btSo").textContent = q || Math.max(1, Math.min(5, soCB + (step === "intro" || step === "setup" ? 1 : 0)));
    $$("#btCham i").forEach(function (d, k) { d.classList.toggle("xong", !!daCB[k + 1]); });
    if (doi) vaoBuocTV(step, cu, loai, q, rev);
    if (loai === "q" || loai === "a") capNhatManCau(q);
    if (loai === "q" && cfg().thu && doi) { clearTimeout(henThu); henThu = setTimeout(function () { dienThu(q, false); }, 1600); }
  }
  function anHud() {
    ["#tieuDe", "#dich", "#bangRon", "#pill", "#loiBinh", "#goiY", "#dem"].forEach(function (s) { $(s).hidden = true; });
    $("#canhBao").hidden = true;
    choXacNhan = null;
  }
  function vaoBuocTV(step, cu, loai, q, rev) {
    var g = G();
    anHud();
    if (g && SK._tlCham) { SK._tlCham.kill(); SK._tlCham = null; }
    if (g && tlRace) { tlRace.kill(); tlRace = null; }
    var iStep = RD.BUOC.indexOf(step);
    $("#manCau").hidden = !(loai === "q" || loai === "a");
    $("#manBao").hidden = !(step === "bao" || step === "baoName" || step === "baoSpots");
    if (iStep < RD.BUOC.indexOf("light")) SK.tatLua();
    if (iStep < RD.BUOC.indexOf("finish")) SK.camera(960, 540, 1, cu === "finish" ? 0.8 : 0);
    var sau = tinh();
    SK.hienHuy(step !== "setup" && step !== "intro");
    if (step === "setup" || step === "intro") {
      SK.datViTri([0, 0, 0, 0]);
      sau.forEach(function (r, i) { SK.chuHuy(i, 0, r.toiDa); });
      if (step === "intro") {
        var td = $("#tieuDe");
        td.hidden = false;
        if (g && cu === "setup") g.fromTo(td, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.6)" });
        if (cu === "setup") { A.trong(0.9); setTimeout(function () { A.trong(1); }, 260); }
      }
      return;
    }
    if (loai === "q" || loai === "a") {
      veManCau(q, loai === "a", cu);
      return;
    }
    if (loai === "r") {
      var pill = $("#pill");
      pill.hidden = false;
      pill.textContent = q === 5 ? "Câu 5/5 · nước rút" : "Câu " + q + "/5";
      if (q === 5) {
        var br = $("#bangRon");
        br.hidden = false;
        if (g) g.fromTo(br, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" });
      }
      var phatLai = tvDaDien !== null && rev !== (tvDaDien["r" + q] | 0);
      if (tvDaDien) tvDaDien["r" + q] = rev;
      if (phatLai && rev > 0) {
        var truoc = tinh(q);
        tlRace = SK.congBo(q, truoc, sau, function () {
          tlRace = null;
          if (q === 5) $("#bangRon").hidden = true;
          var ten = RD.xepHang(sau);
          var tong = 0, dung = 0;
          sau.forEach(function (r) { if (r.cau[q]) { tong += r.cau[q].thay; dung += r.cau[q].dung; } });
          if (tong && dung / tong >= 0.8) { SK.phaoGiay(null, null, 140); A.lapLanh(); SK.bayChu("Cả lớp tuyệt vời!", 960, 560, "but-pha", 1.8); }
          binhLuan(q, truoc, sau);
          void ten;
        });
      } else {
        SK.datViTri(sau.map(function (r) { return r.viTri; }));
        sau.forEach(function (r, i) { SK.chuHuy(i, r.buoc, r.toiDa); });
        var bl = BL[ses() + ":" + q];
        if (bl) hienLoiBinh(bl.chu, bl.nhan);
      }
      return;
    }
    var hang = RD.xepHang(sau);
    sau.forEach(function (r, i) { SK.chuHuy(i, r.buoc, r.toiDa); });
    if (step === "finish") {
      SK.vaoDich(hang.nhat, sau, cu !== "r5");
      var dich = $("#dich"), tenNhat = hang.nhat.map(function (t) { return RD.TO[t].ten; });
      var khac = [0, 1, 2, 3].filter(function (t) { return hang.nhat.indexOf(t) < 0; }).map(function (t) { return RD.TO[t].ten; });
      $("#dichTen").textContent = tenNhat.length > 1 ? tenNhat.join(" và ") + " về đích bằng nhau!" : tenNhat[0] + " về đích xa nhất!";
      $("#dichPhu").textContent = (tenNhat.length > 1 ? "Mời hai tổ trưởng cùng lên châm lửa" : "Mời tổ trưởng " + tenNhat[0] + " lên châm lửa") + (khac.length ? " · " + khac.join(", ") + " đứng làm đội danh dự" : "");
      dich.hidden = false;
      if (g && cu === "r5") { g.fromTo(dich, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 1.6, ease: "back.out(1.6)" }); A.ken(); }
      return;
    }
    if (step === "light") {
      SK.vaoDich(hang.nhat, sau, true);
      if (cu === "finish") {
        SK.chamLua(hang.nhat, function () { goiY("Bấm tiếp để xem bức tranh"); });
      } else { SK.thapSang(true); SK.camera(1073, 600, 1.35, 0); }
      return;
    }
    // báo tường
    SK.vaoDich(hang.nhat, sau, true);
    SK.thapSang(true);
    veBao(step, cu, hang);
  }
  var tlRace = null;
  function goiY(chu) { var g = $("#goiY"); g.textContent = chu; g.hidden = false; }

  /* ---------- màn câu hỏi ---------- */
  var mcDang = 0;
  function veManCau(q, hien, cu) {
    var c = RD.CAU[q - 1], m = $("#manCau"), g = G();
    m.style.setProperty("--ac", c.mau);
    m.style.setProperty("--acn", SK.hexA(c.mau, 0.22));
    if (mcDang !== q) {
      mcDang = q;
      $("#mcPill").textContent = "Câu " + q + " / 5";
      $("#mcNuoc").hidden = q !== 5;
      $("#mcHinh").src = c.hinh;
      $("#mcHinh").alt = "Hình minh họa câu " + q;
      $("#mcBoiCanh").innerHTML = esc(c.boiCanh).replace(/\{(\d+)\/(\d+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
      $("#mcHoi").textContent = c.hoi;
      $("#mcChon").innerHTML = c.chon.map(function (t, i) {
        return '<div class="mc-o" data-l="' + RD.CHU[i] + '"><b>' + RD.CHU[i] + "</b><span>" + esc(t) + '</span><svg class="dau" viewBox="0 0 24 24" fill="none" stroke="#2b8550" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>';
      }).join("");
      if (g) g.fromTo(".mc-the", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" });
      A.trong(0.7);
    }
    $$(".mc-o", m).forEach(function (o) {
      var dung = o.dataset.l === c.dung;
      o.classList.toggle("dung", hien && dung);
      o.classList.toggle("mo", hien && !dung);
    });
    var chan = $("#mcChan");
    chan.classList.toggle("dung", hien);
    chan.textContent = hien ? "Đáp án đúng: " + c.dung : "Suy nghĩ thật kỹ · Đếm 3 – 2 – 1 · Giơ thẻ!";
    if (hien && cu === "q" + q) { A.lapLanh(); var o2 = m.querySelector('.mc-o[data-l="' + c.dung + '"]'); if (g && o2) g.fromTo(o2, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }); }
    capNhatManCau(q);
  }
  function capNhatManCau(q) {
    var lop = RD.lop(cfg()), kq = RD.ketQuaCau(q, lop, scanHopLe(q));
    var html = kq.map(function (r, t) {
      var T = RD.TO[t], tong = r.thay + r.chua.length;
      var du = tong > 0 && r.chua.length === 0;
      return '<span class="' + (du ? "du" : "") + '" style="--m:' + T.mau + ";--d:" + T.dam + '"><i></i>' + T.ten + " · " + r.thay + "/" + tong + "</span>";
    }).join("");
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

  /* ---------- màn báo tường ---------- */
  function veBao(step, cu, hang) {
    var g = G();
    var img = $("#mbAnh"), gia = $("#mbGia");
    if (RD.anhBao) { if (img.getAttribute("src") !== RD.anhBao) img.src = RD.anhBao; img.hidden = false; gia.hidden = true; }
    else { img.hidden = true; gia.hidden = false; }
    var che = $("#mbChe"), che51 = $("#mbChe51"), chu = $("#mbCheChu"), khung = $("#mbKhung"), loi = $("#mbLoi");
    var oo = $$(".mb-o");
    if (g) { g.killTweensOf([che, che51, khung, loi].concat(oo)); }
    var datMo = function (mo) {
      che.hidden = mo; che51.hidden = mo;
      che.classList.remove("nam");
      chu.textContent = "LỚP 6/3 SẮP CHÀO ĐÓN NGÀY GÌ?";
      if (g) g.set([che, che51], { opacity: 1, y: 0 });
    };
    var datO = function (hien) {
      oo.forEach(function (o, k) {
        var t = hang.thuTu[k], T = RD.TO[t];
        o.style.setProperty("--m", T.mau);
        o.style.setProperty("--d", T.dam);
        o.querySelector("b").textContent = hang.hang[t];
        o.querySelector("span").textContent = T.ten;
        o.querySelector("small").textContent = hang.hang[t] === 1 ? "chọn mẫu thiệp và dán trước" : "";
        o.querySelector("small").hidden = hang.hang[t] !== 1;
        o.style.opacity = hien ? 1 : 0;
      });
      loi.hidden = true;
    };
    if (g) g.set(khung, { scale: 1, transformOrigin: "50% 50%" });
    if (step === "bao") {
      datMo(false); datO(false);
      if (cu === "light" && g) {
        var chop = $("#chop");
        g.fromTo(chop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.in" });
        g.to(chop, { opacity: 0, duration: 1.1, delay: 0.6, ease: "power2.out" });
        g.fromTo(khung, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, delay: 0.5, ease: "power2.out" });
        A.vut();
      } else if (g) g.set(khung, { opacity: 1 });
      return;
    }
    if (step === "baoName") {
      datO(false);
      if (cu === "bao" && g) {
        datMo(false);
        che.classList.add("nam");
        var dem = { y: 1976 };
        chu.textContent = "1976";
        A.trongDon(2.4);
        var tl = g.timeline();
        tl.to(dem, { y: 2026, duration: 2.6, ease: "power1.inOut", onUpdate: function () { chu.textContent = String(Math.round(dem.y)); } });
        tl.call(function () { A.trong(1); A.ken(); }, null, 2.65);
        tl.to(che, { y: -30, opacity: 0, duration: 0.7, ease: "power2.in" }, 3.1);
        tl.to(che51, { opacity: 0, scale: 1.4, duration: 0.7, ease: "power2.in" }, 3.1);
        tl.call(function () {
          che.hidden = true; che51.hidden = true;
          SK.phaoGiay(null, null, 220, 0, true);
          SK.lapLanh(960, 110, 40, true);
          A.lapLanh();
        }, null, 3.6);
        tl.to(khung, { scale: 1.75, transformOrigin: "50% 7%", duration: 1.4, ease: "power2.inOut" }, 3.8);
        tl.to(khung, { scale: 1, duration: 1.4, ease: "power2.inOut" }, 8.6);
      } else datMo(true);
      if (g) g.set(khung, { opacity: 1 });
      return;
    }
    // baoSpots
    datMo(true);
    if (g) g.set(khung, { opacity: 1 });
    datO(true);
    if (cu === "baoName" && g) {
      oo.forEach(function (o, k) {
        g.fromTo(o, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.3 + k * 0.45, ease: "back.out(2)", onStart: function () { A.trong(0.6 + k * 0.1); } });
      });
    }
  }

  /* =====================================================================
     ĐIỆN THOẠI
     ===================================================================== */
  var moCD = false, PQ = null, CHO = {}, soAnh = 0, anhCuoi = null, henGhi = 0, ghiCuoi = 0, menuThe = null;
  var ROT = { doc: 0, ngang: 0, live: 0 };
  try { var rr = JSON.parse(lsGet("rd-xoay", "null")); if (rr) { ROT.doc = rr.doc | 0; ROT.ngang = rr.ngang | 0; } } catch (e) { /* bỏ qua */ }
  var NGHIENG = false;

  function khoiDT() {
    $("#dt").hidden = false;
    dungChuanBi($("#cbDT"));
    $("#dtTiep").addEventListener("click", function () { A.mo(); tiep(); });
    $("#dtLui").addEventListener("click", function () { lui(); });
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
    window.addEventListener("resize", function () { if (Q.Live.chay) vuaKhungCam(); });
    $("#dtZoom").addEventListener("input", function () { Q.Live.phongTo(+this.value).catch(function () { /* bỏ qua */ }); });
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
    if (l === "q") return "Câu " + q + " · quét thẻ";
    if (l === "a") return "Câu " + q + " · đã hiện đáp án";
    if (l === "r") return "Câu " + q + " · đang công bố";
    return { finish: "Về đích", light: "Châm lửa", bao: "Báo tường · hỏi ngày lễ", baoName: "Báo tường · đã mở tên ngày lễ", baoSpots: "Báo tường · 4 ô dán thiệp" }[step] || step;
  }
  function nhanTiep(step) {
    var l = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    if (step === "setup") return "Bắt đầu trò chơi";
    if (step === "intro") return "Hiện câu 1";
    if (l === "q") return "Hiện đáp án";
    if (l === "a") return q === 5 ? "Công bố nước rút" : "Công bố câu " + q;
    if (l === "r") return q < 5 ? "Hiện câu " + (q + 1) : "Về đích";
    return { finish: "Châm lửa", light: "Xem bức tranh", bao: "Mở tên ngày lễ", baoName: "Hiện 4 ô trống" }[step] || "Đã xong phần khởi động";
  }
  function veDT() {
    var now = nowHopLe(), step = now.step, loai = RD.loaiBuoc(step), q = RD.cauCuaBuoc(step);
    $("#dtBuoc").textContent = tenBuoc(step);
    var chip = $("#dtNoi");
    chip.className = "chip " + NOI.kieu;
    chip.textContent = NOI.kieu === "ok" ? "Đã nối với TV" : NOI.kieu === "motmay" ? "Chưa nối với TV" : NOI.chu;
    chip.title = NOI.chu;
    var t = $("#dtTiep");
    t.textContent = nhanTiep(step);
    t.disabled = step === "baoSpots";
    $("#dtLui").disabled = step === "setup";
    // câu hỏi
    $("#dtCau").hidden = !q;
    if (q) {
      var c = RD.CAU[q - 1];
      $("#dtCau").style.setProperty("--ac", c.mau);
      $("#dtCauSo").textContent = "Câu " + q + "/5" + (q === 5 ? " · nước rút" : "");
      $("#dtDapAn").textContent = "Đáp án đúng: " + c.dung;
      $("#dtCauHoi").textContent = c.hoi;
    }
    var coQuet = loai === "q" || loai === "a";
    $("#dtQuet").hidden = !coQuet;
    $("#dtChuanBi").hidden = !(step === "setup" || moCD);
    capNhatChuanBi($("#cbDT"));
    if (coQuet) { datCauQuet(q); veBangTo(); }
    else if (Q.Live.chay) dungCam();
    $("#dtNc").hidden = !(coQuet && anhCuoi);
    // hướng dẫn ngắn theo bước
    var ghi = $("#dtGhi"), html = "";
    if (step === "setup") html = "<b>Trước giờ học</b><ol><li>Kiểm tra sĩ số, danh sách 4 tổ, chạm số thẻ bạn vắng.</li><li>Trên laptop nối TV: mở trang này, chọn <b>Màn hình TV</b>, bấm F11.</li><li>Bấm <b>Bắt đầu trò chơi</b> ở dưới.</li></ol>";
    else if (step === "intro") html = "TV đang hiện luật chơi. Đọc cho cả lớp nghe rồi bấm <b>Hiện câu 1</b>.";
    else if (loai === "q") html = Q.coCamera() ? "Cả lớp đếm 3, 2, 1 rồi giơ thẻ. Bấm <b>Bật camera quét liên tục</b>, đưa điện thoại lia chậm qua từng cụm tổ cho đến khi tổ báo đủ." : "Cả lớp đếm 3, 2, 1 rồi giơ thẻ. Đứng gần từng cụm tổ, bấm <b>Chụp ảnh một tổ</b>: mỗi cụm một tấm, chụp thêm nếu còn thiếu thẻ.";
    else if (loai === "a") html = "Mời vài bạn giải thích cách làm. Thẻ nào chưa đọc được thì chạm số thẻ để ghi Đúng, Sai hoặc Vắng. Xong bấm <b>Công bố</b>.";
    else if (loai === "r") html = "TV đang đánh trống công bố. Chờ lời bình hiện xong rồi bấm tiếp.";
    else if (step === "finish") html = "Mời tổ trưởng tổ về đích lên bấm nút <b>Châm lửa</b> trên TV (hoặc bấm nút dưới đây). Cả lớp cùng đếm 3, 2, 1.";
    else if (step === "light") html = "Lửa đã cháy. Bấm <b>Xem bức tranh</b> để hiện báo tường.";
    else if (step === "bao") html = "Hỏi cả lớp: <b>Lớp 6/3 sắp chào đón ngày gì?</b> Mời tổ châm lửa trả lời trước, rồi bấm <b>Mở tên ngày lễ</b>.";
    else if (step === "baoName") html = "Bấm <b>Hiện 4 ô trống</b> để giao chỗ dán thiệp theo thứ tự về đích.";
    else if (step === "baoSpots") {
      var hang = RD.xepHang(tinh());
      html = "Xong phần khởi động. Thứ tự chọn mẫu thiệp và dán: " + hang.thuTu.map(function (t) { return hang.hang[t] + ". " + RD.TO[t].ten; }).join(", ") + ".";
    }
    $("#dtGhi").hidden = !html;
    if (ghi.dataset.html !== html) { ghi.innerHTML = html; ghi.dataset.html = html; }
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
    var lop = RD.lop(cfg()), m = theHienTai(), man = PQ.man, hien = RD.loaiBuoc(nowHopLe().step) === "a";
    var dungChu = RD.CAU[PQ.q - 1].dung, tongThay = 0, tongCo = 0;
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
      var chips = chua.map(function (id) { return '<button type="button" data-id="' + id + '" aria-label="Thẻ ' + id + ' chưa đọc được, chạm để ghi">' + id + "</button>"; }).join("") +
        dd.map(function (d) { return '<button type="button" data-id="' + d.id + '" class="' + d.m + '" aria-label="Thẻ ' + d.id + ' đã ghi ' + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + '">' + d.id + " " + ({ D: "đúng", S: "sai", V: "vắng" })[d.m] + "</button>"; }).join("");
      return '<div class="dt-hang" style="--m:' + T.mau + ";--d:" + T.dam + ";--n:" + T.nhat + '"><div class="dt-hang-dau"><b>' + T.ten + '</b><span class="dt-thanh"><i style="width:' + (tong ? Math.round(100 * thay / tong) : 0) + '%"></i></span><span class="' + (du ? "du" : "") + '">' +
        (du ? "đủ " : "") + thay + "/" + tong + (hien ? " · đúng " + dung : "") + "</span></div>" +
        (chips ? '<div class="dt-thieu">' + (chua.length ? "<small>Còn thiếu:</small>" : "") + chips + "</div>" : "") + "</div>";
    }).join("");
    var el = $("#dtTo");
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    // phân bố đáp án (chỉ giáo viên thấy, sau khi hiện đáp án)
    var pb = $("#dtPhanBo");
    pb.hidden = !hien;
    if (hien) {
      var dem = [0, 0, 0, 0];
      Object.keys(m).forEach(function (k) { var id = +k.slice(1); if (lop.toCua[id] && !lop.vang[id] && !man[k]) dem[RD.CHU.indexOf(m[k])]++; });
      pb.innerHTML = RD.CHU.map(function (l, i) { return '<span class="' + (l === dungChu ? "dung" : "") + '">' + l + ": " + dem[i] + "</span>"; }).join("");
    }
    var nut = $("#dtChupChu");
    if (!Q.Live.chay && !Q.coCamera()) nut.textContent = tongThay >= tongCo && tongCo ? "Đã đủ thẻ · chụp thêm nếu cần" : (soAnh && tongThay ? "Chụp thêm · còn thiếu " + (tongCo - tongThay) + " thẻ" : "Chụp ảnh một tổ");
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
      if (ngoai.length) msg += " Bỏ qua thẻ " + ngoai.join(", ") + " vì không có trong danh sách tổ.";
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
      trangThai("ok", "Đang quét: lia chậm qua từng cụm tổ, giữ máy cách thẻ 1 đến 4 mét.");
      var kn = Q.Live.khaNang();
      $("#dtDen").hidden = !kn.torch;
      if (kn.zoom && kn.zoom.max > kn.zoom.min) {
        var z = $("#dtZoom");
        z.min = kn.zoom.min; z.max = Math.min(kn.zoom.max, 8); z.step = kn.zoom.step || 0.1; z.value = kn.zoom.min;
        $("#dtZoomKhung").hidden = false;
      }
      $("#dtXoayMay").hidden = !NGHIENG;
      vuaKhungCam();
      giuManHinh();
    }, function (e) {
      nut.removeAttribute("aria-disabled");
      $("#dtCam").hidden = true;
      var ten = e && e.name;
      trangThai("loi", ten === "NotAllowedError" ? "Chrome chưa cho dùng camera: bấm biểu tượng ổ khóa cạnh địa chỉ trang, cho phép Máy ảnh rồi bấm lại." :
        ten === "NotFoundError" ? "Không tìm thấy camera trên máy này." : "Không mở được camera (" + (ten || e) + "). Dùng nút Chụp một tấm ảnh.");
    });
  }
  // khung xem camera theo đúng tỉ lệ ảnh camera (dọc hay ngang), không cao quá 60% màn hình
  function vuaKhungCam() {
    var v = $("#dtVideo"), k = $("#dtCam");
    if (!v.videoWidth || !v.videoHeight) return;
    var r = v.videoWidth / v.videoHeight, maxH = Math.round(window.innerHeight * 0.6), w = k.parentNode.clientWidth;
    k.style.aspectRatio = v.videoWidth + " / " + v.videoHeight;
    k.style.width = w / r > maxH ? Math.round(maxH * r) + "px" : "";
    k.style.margin = "0 auto";
    Q.Live.ve();
  }
  function dungCam() {
    Q.Live.dung();
    $("#dtCam").hidden = true;
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
  function ganDongBo() {
    DB.on("cfg", function (v, chac) {
      S.cfg = v;
      if (chac) chacCfg = true;
      if (chacCfg && !daKhoiTao) {
        daKhoiTao = true;
        if (!v || !v.ses) vanMoi(false);
      }
      ve();
    });
    DB.on("now", function (v) { S.now = v; coNow = true; ve(); });
    DB.on("ph", function (v) { S.ph = v; ve(); });
    [1, 2, 3, 4, 5].forEach(function (q) { DB.on("s" + q, function (v) { S.scans[q] = v; ve(); }); });
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
  RD._test = { S: S, tinh: tinh, tiep: tiep, lui: lui, datBuoc: datBuoc, nowHopLe: nowHopLe, xuLyAnh: xuLyAnh, nhanKhung: nhanKhung, BL: function () { return BL; } };
  batDau();
})();
