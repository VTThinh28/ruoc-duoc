/* Rước đuốc: nối điện thoại với màn hình TV.
   Trong Claude: kho dữ liệu của trang (db). Trên GitHub: Firebase Realtime Database.
   Chưa có gì: chỉ nối các thẻ (tab) mở trên cùng một máy. */
(function () {
  "use strict";
  var RD = window.RD = window.RD || {};
  var KHOA = ["cfg", "now", "ph", "s1", "s2", "s3", "s4", "s5"];

  RD.trongClaude = !!(window.claude && typeof window.claude.use === "function");

  function sach(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  function napScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { bad(new Error("Không tải được " + src)); };
      document.head.appendChild(s);
    });
  }

  // hàng đợi ghi: mỗi khóa ghi một lần một lượt, chỉ giữ giá trị mới nhất đang chờ
  function taoHangDoi(ghiThat, baoLoi) {
    var dang = {}, cho = {};
    function chay(key) {
      if (dang[key] || !(key in cho)) return;
      var v = cho[key];
      delete cho[key];
      dang[key] = true;
      var lan = 0;
      (function thu() {
        Promise.resolve().then(function () { return ghiThat(key, v); }).then(function () {
          dang[key] = false;
          chay(key);
        }, function (e) {
          var code = e && e.code;
          if ((code === "unavailable" || !code) && lan < 2) { lan++; setTimeout(thu, 400 + Math.random() * 600); return; }
          dang[key] = false;
          baoLoi(e);
          chay(key);
        });
      })();
    }
    return function (key, v) { cho[key] = v; chay(key); };
  }

  // cb(giá trị, chắc): chắc = false khi kho mới trả bản lưu tạm, chưa hỏi được máy chủ
  function taoNguoiNghe() {
    var nghe = {}, cuoi = {}, chacChan = {};
    return {
      on: function (key, cb) {
        (nghe[key] = nghe[key] || []).push(cb);
        if (key in cuoi) { try { cb(cuoi[key], chacChan[key]); } catch (e) { console.error(e); } }
      },
      phat: function (key, v, chac) {
        cuoi[key] = v;
        chacChan[key] = chac !== false;
        (nghe[key] || []).forEach(function (cb) { try { cb(v, chac !== false); } catch (e) { console.error(e); } });
      }
    };
  }

  /* ---------- trong Claude ---------- */
  function noiClaude(db, baoTrangThai) {
    var nn = taoNguoiNghe();
    var duong = function (key) { return (key[0] === "s" ? "quet/" : "rd/") + key; };
    var ghi = taoHangDoi(function (key, v) { return db.doc(duong(key)).set(v); }, function (e) {
      baoTrangThai("loi", (e && e.code === "resource_exhausted") ? "Ghi quá nhanh, chờ một chút rồi bấm lại." : "Không lưu được (" + ((e && (e.code || e.message)) || e) + ").");
    });
    KHOA.forEach(function (key) {
      db.doc(duong(key)).onSnapshot(function (snap) {
        nn.phat(key, snap.exists ? sach(snap.data()) : null, !(snap.metadata && snap.metadata.fromCache));
      }, function (e) {
        baoTrangThai("loi", "Mất kết nối dữ liệu (" + ((e && e.code) || e) + "). Tải lại trang để nối lại.");
      });
    });
    baoTrangThai("ok", "Đã nối qua Claude");
    return {
      kieu: "claude",
      set: function (key, v) { v = sach(v); nn.phat(key, v); ghi(key, v); },
      on: nn.on
    };
  }

  /* ---------- trên GitHub: Firebase ---------- */
  // Firebase tự bỏ mảng rỗng, đối tượng rỗng và đổi đối tượng có khóa là số thành mảng,
  // nên mỗi khóa được lưu nguyên thành một chuỗi JSON để đọc ra đúng như lúc ghi.
  function dongGoi(v) { return v == null ? null : JSON.stringify(v); }
  function moGoi(x) {
    if (x == null) return null;
    if (typeof x === "string") { try { return JSON.parse(x); } catch (e) { return null; } }
    return sach(x);
  }
  function noiFirebase(cfg, baoTrangThai) {
    var V = "10.12.5", goc = "https://www.gstatic.com/firebasejs/" + V + "/";
    return napScript(goc + "firebase-app-compat.js").then(function () {
      return napScript(goc + "firebase-database-compat.js");
    }).then(function () {
      var app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(cfg);
      var db = app.database();
      var base = db.ref("ruoc-duoc/lop-6-3");
      var nn = taoNguoiNghe();
      // 25/11/2026 thầy Thịnh: "nếu trong lúc chơi lỡ rớt mạng thì có nối lại ngay được không ???"
      //   Thư viện Firebase tự nối lại và tự gửi nốt những gì ghi lúc mất mạng. Nhưng mỗi lần thử hỏng nó chờ lâu thêm 30% (tối đa
      //   5 phút), chỉ thử ngay khi trình duyệt báo "có mạng lại" (wifi của máy tắt rồi bật). Wifi còn bắt mà đường ra mạng mất thì
      //   không có tin báo ấy, mạng có lại rồi máy vẫn ngồi chờ hết nhịp (đo: bài thử ban-the-moi/test/rot-mang-25-11.js).
      //   Nên khi đang mất nối (sau khi đã nối được ít nhất một lần), cứ 2 giây hỏi thử máy chủ dữ liệu một câu rất nhẹ; có trả
      //   lời (kể cả trả lời từ chối) là mạng đã có lại, lúc đó bảo thư viện nối ngay: goOffline rồi goOnline đặt nhịp chờ về 1 giây
      //   và thử liền. Lần "đá" sau cách lần trước ít nhất 8, 12 rồi 20 giây để lượt nối đang dở trên mạng chậm kịp xong.
      var dangNoi = false, daTungNoi = false, vong = 0, tDa = 0, lanDa = 0, nhip = null;
      try { var dc = new URL(cfg.databaseURL); dc.pathname = "/ruoc-duoc/nhip.json"; dc.searchParams.set("shallow", "true"); nhip = dc.href; } catch (e) { nhip = null; }
      function thuMang(v) {
        if (v !== vong || dangNoi || !nhip || typeof fetch !== "function") return;
        var ac = typeof AbortController === "function" ? new AbortController() : null;
        var het = setTimeout(function () { if (ac) ac.abort(); }, 4000);
        fetch(nhip, { mode: "no-cors", cache: "no-store", signal: ac ? ac.signal : undefined }).then(function () { return true; }, function () { return false; }).then(function (coMang) {
          clearTimeout(het);
          if (v !== vong || dangNoi) return;
          if (coMang && Date.now() - tDa >= [0, 8000, 12000, 20000][Math.min(lanDa, 3)]) {
            tDa = Date.now(); lanDa++;
            try { db.goOffline(); db.goOnline(); } catch (e) { console.error(e); }
          }
          setTimeout(function () { thuMang(v); }, 2000);
        });
      }
      db.ref(".info/connected").on("value", function (s) {
        dangNoi = !!s.val();
        vong++;
        if (dangNoi) { daTungNoi = true; tDa = 0; lanDa = 0; }
        else if (daTungNoi) { var v = vong; setTimeout(function () { thuMang(v); }, 3000); }
        baoTrangThai(dangNoi ? "ok" : "cho", dangNoi ? "Đã nối qua Firebase" : daTungNoi ? "Mất mạng, đang nối lại…" : "Đang nối Firebase…");
      });
      var ghi = taoHangDoi(function (key, v) { return base.child(key).set(dongGoi(v)); }, function (e) {
        baoTrangThai("loi", "Firebase không cho ghi (" + ((e && (e.code || e.message)) || e) + "). Kiểm tra mục Rules.");
      });
      KHOA.forEach(function (key) {
        base.child(key).on("value", function (s) { nn.phat(key, moGoi(s.val())); }, function (e) {
          baoTrangThai("loi", "Firebase không cho đọc (" + ((e && (e.code || e.message)) || e) + "). Kiểm tra mục Rules.");
        });
      });
      return {
        kieu: "firebase",
        set: function (key, v) { v = sach(v); nn.phat(key, v); ghi(key, v); },
        on: nn.on
      };
    });
  }

  /* ---------- chỉ trên một máy (các thẻ cùng trình duyệt) ---------- */
  function noiMotMay(baoTrangThai) {
    var nn = taoNguoiNghe(), kenh = null, LS = "rd-motmay-";
    try { kenh = new BroadcastChannel("ruoc-duoc"); } catch (e) { kenh = null; }
    KHOA.forEach(function (key) {
      var v = null;
      try { v = JSON.parse(localStorage.getItem(LS + key) || "null"); } catch (e) { v = null; }
      nn.phat(key, v);
    });
    if (kenh) kenh.onmessage = function (e) { if (e.data && KHOA.indexOf(e.data.k) >= 0) nn.phat(e.data.k, e.data.v); };
    baoTrangThai("motmay", "Chỉ nối được các cửa sổ trên cùng máy này");
    return {
      kieu: "motmay",
      set: function (key, v) {
        v = sach(v);
        nn.phat(key, v);
        try { localStorage.setItem(LS + key, JSON.stringify(v)); } catch (e) { /* bỏ qua */ }
        if (kenh) { try { kenh.postMessage({ k: key, v: v }); } catch (e) { /* bỏ qua */ } }
      },
      on: nn.on
    };
  }

  // trả về Promise<api>; baoTrangThai(kind, text) để hiện trạng thái kết nối
  RD.taoDongBo = function (baoTrangThai) {
    baoTrangThai = baoTrangThai || function () {};
    if (RD.trongClaude) {
      baoTrangThai("cho", "Đang nối qua Claude…");
      return window.claude.use("db").then(function (db) {
        if (!db) return noiMotMay(function (k, t) { baoTrangThai(k, k === "motmay" ? "Chưa đăng nhập Claude trên máy này nên chỉ dùng được một máy" : t); });
        return noiClaude(db, baoTrangThai);
      }, function () { return noiMotMay(baoTrangThai); });
    }
    if (window.RD_FIREBASE && window.RD_FIREBASE.databaseURL) {
      baoTrangThai("cho", "Đang nối Firebase…");
      return noiFirebase(window.RD_FIREBASE, baoTrangThai).catch(function (e) {
        console.error(e);
        return noiMotMay(function (k, t) { baoTrangThai(k === "motmay" ? "loi" : k, k === "motmay" ? "Không nối được Firebase, tạm dùng một máy" : t); });
      });
    }
    return Promise.resolve(noiMotMay(baoTrangThai));
  };
})();
