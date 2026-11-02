/* Rước đuốc về trường: nối điện thoại với màn hình TV.
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
  function noiFirebase(cfg, baoTrangThai) {
    var V = "10.12.5", goc = "https://www.gstatic.com/firebasejs/" + V + "/";
    return napScript(goc + "firebase-app-compat.js").then(function () {
      return napScript(goc + "firebase-database-compat.js");
    }).then(function () {
      var app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(cfg);
      var db = app.database();
      var base = db.ref("ruoc-duoc/lop-6-3");
      var nn = taoNguoiNghe();
      db.ref(".info/connected").on("value", function (s) {
        baoTrangThai(s.val() ? "ok" : "cho", s.val() ? "Đã nối qua Firebase" : "Đang nối Firebase…");
      });
      var ghi = taoHangDoi(function (key, v) { return base.child(key).set(v); }, function (e) {
        baoTrangThai("loi", "Firebase không cho ghi (" + ((e && (e.code || e.message)) || e) + "). Kiểm tra mục Rules.");
      });
      KHOA.forEach(function (key) {
        base.child(key).on("value", function (s) { nn.phat(key, sach(s.val())); }, function (e) {
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
