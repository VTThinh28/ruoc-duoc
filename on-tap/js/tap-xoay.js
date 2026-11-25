/* Tập xoay hình ở nhà (trang ôn tập gửi học sinh, 25/11/2026).
   Trang này là bản sao trang Xếp thiệp, chạy riêng trên máy em, không nối mạng, không đụng tới phòng thật của lớp.
   Đặt sẵn: nhiệm vụ 1 coi như đã xong, nhiệm vụ 2 đã mở, nên trang mở thẳng vào bàn xếp hình của nhóm.
   Thêm: dải trên cùng (quay lại trang ôn tập, tên hình, đồng hồ), dòng kết quả lúc xếp xong, nút Tập lại từ đầu. */
(function () {
  var k = +document.documentElement.getAttribute("data-ontap-nhom") || 0, m = /nhom-([1-4])/.exec(location.hash);
  if (m) k = +m[1];
  if (!(k >= 1 && k <= 4)) k = 1;
  var TEN = { 1: "Bánh sinh nhật", 2: "Trống trường và ngọn đuốc", 3: "Bó hoa", 4: "Hải đăng và con thuyền" };
  var KHOA = "xt-ontap", MUC = ["t1", "t2", "g1", "g2", "cn", "v", "bh", "tong", "thiep", "con"], cay = {}, n, d = {};
  try { cay = JSON.parse(localStorage.getItem(KHOA) || "{}") || {}; } catch (e) { cay = {}; }
  if (typeof cay !== "object" || !cay) cay = {};
  n = cay["n" + k] && typeof cay["n" + k] === "object" ? cay["n" + k] : {};
  MUC.forEach(function (kh) { d[kh] = "s"; });
  n.d = d; n.mo = 1; delete n.co; delete n.khoa; delete n.s; delete n.h1;
  cay["n" + k] = n; delete cay.cho;
  try { localStorage.setItem(KHOA, JSON.stringify(cay)); } catch (e) { /* máy không cho lưu: trang dùng bộ nhớ */ }
  window.XT_HAT = cay;
  window.XT_ONTAP = k;
  window.XT_THAMSO = { p: "ontap", n: String(k), thu: "1" };

  /* Gửi kết quả xếp hình cho thầy qua Google Form (chỉ khi trang đặt trên GitHub; tên em lấy từ trang ôn tập). */
  var FORM = { goc: "https://docs.google.com/forms/d/e/1FAIpQLSd0CMOg0XkVrlP5ROh6ivzWmDGfZwZT-0tVnGI8Uvn4hrhomw/", ten: "entry.381649338", kq: "entry.1217124230" };
  function guiThay(kq) {
    var ten = ""; try { ten = localStorage.getItem("ontap-ten") || ""; } catch (e) { ten = ""; }
    if (!ten || !window.fetch || !window.URLSearchParams || !/(^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) return;
    var b = new URLSearchParams(); b.append(FORM.ten, ten); b.append(FORM.kq, kq);
    fetch(FORM.goc + "formResponse", { method: "POST", mode: "no-cors", body: b, keepalive: true }).catch(function () {
      try { var h = JSON.parse(localStorage.getItem("ontap-cho") || "[]") || []; h.push([ten, kq]); localStorage.setItem("ontap-cho", JSON.stringify(h.slice(-20))); } catch (e) { /* bỏ qua */ }
    });
  }
  function luuNhanh(s) { try { localStorage.setItem("ontap-nhanh-" + k, String(s)); } catch (e) { /* bỏ qua */ } }
  function docNhanh() { try { return +localStorage.getItem("ontap-nhanh-" + k) || 0; } catch (e) { return 0; } }
  function dinh(s) { var p = Math.floor(s / 60), g = s % 60; return (p < 10 ? "0" : "") + p + ":" + (g < 10 ? "0" : "") + g; }
  function loi(s) { var p = Math.floor(s / 60), g = s % 60; return p ? p + " phút " + g + " giây" : g + " giây"; }

  function dung() {
    var st = document.createElement("style");
    st.textContent =
      "#dtNoi,#dtNoiLai{display:none!important}" +
      ".ot-thanh{display:flex;align-items:center;gap:10px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top,0px));background:#fffaf0;border-bottom:1px solid #d9c7a6;font:600 15px/1.3 'Be Vietnam Pro',system-ui,sans-serif;color:#4a3524}" +
      ".ot-ve{flex:none;display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border:1.5px solid #d9c7a6;border-radius:999px;background:#fff;color:#4a3524;text-decoration:none;font-weight:700}" +
      ".ot-ve:active{background:#f3e7d0}" +
      ".ot-ten{flex:1;min-width:0;line-height:1.2}" +
      ".ot-ten b{color:var(--ot-m)}" +
      ".ot-gio{flex:none;min-width:64px;text-align:center;padding:6px 10px;border-radius:10px;background:#4a3524;color:#fff;font:700 17px/1 'Baloo 2',system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.02em}" +
      ".ot-gio.cho{background:#e9dcc4;color:#6b5640}" +
      ".ot-gio.xong{background:#3f8f52}" +
      ".ot-kq{margin:6px 12px 0;padding:10px 14px;border-radius:12px;background:#e6f3e8;color:#24683a;font:700 16px/1.4 'Be Vietnam Pro',system-ui,sans-serif;text-align:center}" +
      ".ot-kq:empty{display:none}";
    document.head.appendChild(st);
    var chinh = document.getElementById("dtChinh"), dau = chinh && chinh.querySelector(".dt-dau");
    if (!chinh || !dau) return;
    var mau = { 1: "#d9463c", 2: "#e07b2a", 3: "#3d8fc4", 4: "#4f9140" }[k];
    var thanh = document.createElement("div");
    thanh.className = "ot-thanh";
    thanh.style.setProperty("--ot-m", mau);
    thanh.innerHTML = '<a class="ot-ve" href="./" id="otVe">‹ Ôn tập</a><span class="ot-ten"><b>' + TEN[k] + '</b></span><span class="ot-gio cho" id="otGio" title="Đồng hồ chạy từ lúc em chạm mảnh đầu tiên">00:00</span>';
    chinh.insertBefore(thanh, dau);
    document.getElementById("otVe").onclick = function (e) {
      if (history.length > 1) { e.preventDefault(); history.back(); }      // em vào từ trang ôn tập: lùi lại đúng chỗ em đang đọc
    };
    var goiY = document.getElementById("dtGoiY"); if (goiY) goiY.textContent = "✦ Xem hình mẫu";
    var goiYTen = document.getElementById("goiYTen"); if (goiYTen) goiYTen.textContent = "Hình mẫu của nhóm";
    var kq = document.createElement("p"); kq.className = "ot-kq"; kq.id = "otKq";
    var tc = document.getElementById("thiepChu"); if (tc) tc.parentNode.insertBefore(kq, tc);
    var gio = document.getElementById("otGio"), bd = 0, chay = false, het = 0, hen = 0, daXong = false, coM = false;
    function ve() {
      gio.textContent = chay ? dinh(Math.floor((Date.now() - bd) / 1000)) : het ? dinh(het) : "00:00";
      gio.className = "ot-gio" + (chay ? "" : daXong ? " xong" : " cho");
    }
    function batDau() { if (chay || daXong) return; chay = true; bd = Date.now(); het = 0; clearInterval(hen); hen = setInterval(ve, 250); ve(); }
    function dungLai() { chay = false; clearInterval(hen); }
    document.addEventListener("pointerdown", function (e) {
      if (e.target && e.target.closest && e.target.closest("#dtBan, #dtTrai, #dtPhai, #dtLat")) batDau();
    }, true);
    function ghiKq(s) {
      var cu = docNhanh(), chu = "";
      if (s > 0) {
        chu = "Em xếp xong trong " + loi(s) + ".";
        guiThay("Xếp hình Nhóm " + k + " (" + TEN[k] + "): xong trong " + loi(s));
        if (!cu || s < cu) { luuNhanh(s); chu += cu ? " Nhanh hơn lần trước rồi đó!" : ""; }
        else chu += " Lần nhanh nhất của em: " + loi(cu) + ".";
      } else if (cu) chu = "Lần nhanh nhất của em: " + loi(cu) + ".";
      kq.textContent = chu;
      coLai();
    }
    function coLai() { setTimeout(function () { try { window.dispatchEvent(new Event("resize")); } catch (e) { /* bỏ qua */ } }, 0); }      // dòng kết quả chiếm chỗ: trang tính lại cỡ tấm thiệp
    (function cho() {
      var T = window.XT_ONTAP_T;
      if (!T) { setTimeout(cho, 100); return; }
      T.on("n" + k, function (v) {
        v = v || {};
        var x = !!v.xong;
        if (x && !daXong) { daXong = true; if (chay) { dungLai(); het = Math.max(1, Math.floor((Date.now() - bd) / 1000)); ghiKq(het); } else ghiKq(0); }
        else if (!x && daXong) { daXong = false; dungLai(); het = 0; kq.textContent = ""; coLai(); }
        else if (!x && coM && !v.m && chay) { dungLai(); het = 0; }      // em bấm Làm lại từ đầu: đồng hồ về 00:00, chạm mảnh thì chạy lại
        coM = !!v.m;
        ve();
      });
    })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dung); else dung();
})();
