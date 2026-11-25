/* ═══════ ПРАЙС + КОШТОРИС (pricelist.js) ═══════
   Вкладка «Прайс»: процеси (Догляд / Ремонт) у вигляді білих «острівців»,
   перемикач Взуття / Аксесуари, пошук, сортування, кнопка «Кошторис».
   Сторінка «Кошторис»: той самий майстер речі та чек, що й при оформленні
   замовлення, але у власній графітово-синій кольоровій схемі (body.kosh).
   Кошторис тримає СВОЇ речі (KO) окремо від форми нового замовлення (NO).
   УВАГА: підключається ПІСЛЯ основного <script> (renderers уже існує).
   Залежить від глобальних: PRICE, priceLoaded, renderers, showPage, NO,
   ITEMS, gv, svcHint, addItem, addItemAndOpen, renderItemList, updateReceipt,
   closeItemModal, html2canvas. */
(function () {
  "use strict";

  /* ───────── процеси ───────── */
  var PROCS = ["Чищення та догляд", "Фарбування", "Реставрація", "Каблуки та набійки", "Підошва",
    "Устілки та задники", "Шиття та латки", "Розтяжка та ушивання", "Блискавки", "Фурнітура",
    "Торцювання урізів", "Ручки та ремені", "Підкладка", "Поясні ремені"];
  var CARE = ["Чищення та догляд", "Фарбування", "Реставрація", "Торцювання урізів"];

  function classify(n, d) {
    if (d == "Чищення / Базовий догляд") return PROCS[0];
    if (d == "Фарбування / Реставрація") return /^(Фарбування|Відбілювання)/.test(n) ? PROCS[1] : PROCS[2];
    if (d == "Каблуки та набійки") return PROCS[3];
    if (d == "Підошва") return /устілк|задник|супінатор/i.test(n) ? PROCS[5] : PROCS[4];
    if (d == "Швейні роботи та деталі") {
      if (/устілк|задник|кармана/i.test(n)) return PROCS[5];
      if (/Ушивання халяви/.test(n)) return PROCS[7];
      return PROCS[6];
    }
    if (d == "Блискавки") return PROCS[8];
    if (d == "Розтяжка") return PROCS[7];
    if (d == "Фурнітура") return PROCS[9];
    if (d == "Реставрація урізів") return PROCS[10];
    if (d == "Ручки та ремінь") return PROCS[11];
    if (d == "Підкладка") return PROCS[12];
    if (d == "Поясний ремінь") return PROCS[13];
    return PROCS[6];
  }

  /* ───────── стан ───────── */
  var ALL = [];
  var obj = "", proc = "", q = "", openKey = "";
  var sortMode = "", sortDir = "asc", menuOpen = false;
  var sw = "price";                 // 'price' | 'kosh'
  var animateNext = false, lastSlide = null;
  var popMap = null;
  var koshOn = false, KO = null, NOsaved = null;

  function objLabel(c) {
    if (c == "shoes") return "Взуття";
    if (c == "bags") return "Аксесуари";
    return (PRICE[c] && PRICE[c].label) || c;
  }
  function buildAll() {
    ALL = [];
    Object.keys(PRICE).forEach(function (c) {
      Object.keys(PRICE[c].departments).forEach(function (d) {
        PRICE[c].departments[d].forEach(function (s) {
          if (s.active === false) return;
          ALL.push({ name: s.name, price: s.price, unit: s.unit, term: s.term, obj: c, dept: d, proc: classify(s.name, d) });
        });
      });
    });
  }
  function objKeys() { return Object.keys(PRICE); }
  function inProc(p, o) { return ALL.filter(function (s) { return (!p || s.proc == p) && (!o || s.obj == o); }); }
  function cntProc(p, o) { return inProc(p, o).length; }

  /* ───────── утиліти ───────── */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function money(n) { return (Number(n) || 0).toLocaleString("uk-UA") + " ₴"; }
  function hl(t, toks) {
    var o = esc(t);
    toks.forEach(function (k) {
      if (!k) return;
      var re = new RegExp("(" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      o = o.replace(re, "<mark>$1</mark>");
    });
    return o;
  }
  function splitName(n) {
    var m = String(n).split(/\s*—\s*/);
    return m.length >= 2 ? [m[0].trim(), m.slice(1).join(" — ").trim()] : [null, null];
  }
  function hintFor(name) { try { return svcHint(name) || ""; } catch (e) { return ""; } }

  /* популярність послуг — за реальними замовленнями (лист «Послуги» у виробах) */
  function buildPop() {
    popMap = {};
    try {
      var txt = ITEMS.map(function (i) { return (gv(i, "Послуги") || "").toLowerCase(); }).join("\n");
      ALL.forEach(function (s) {
        var key = s.name.toLowerCase(), n = 0, at = txt.indexOf(key);
        while (at > -1 && n < 5000) { n++; at = txt.indexOf(key, at + key.length); }
        popMap[s.name] = n;
      });
    } catch (e) {}
  }
  function popOf(s) { if (!popMap) buildPop(); return popMap[s.name] || 0; }

  var SORT_LABELS = { price: "За ціною", alpha: "За алфавітом", pop: "За популярністю" };
  function sortServices(arr) {
    var a = arr.slice();
    if (sortMode == "price") a.sort(function (x, y) { return sortDir == "asc" ? x.price - y.price : y.price - x.price; });
    else if (sortMode == "alpha") a.sort(function (x, y) { return x.name.localeCompare(y.name, "uk"); });
    else if (sortMode == "pop") a.sort(function (x, y) { return popOf(y) - popOf(x); });
    return a;
  }
  function groupMin(g) { return Math.min.apply(null, g.items.map(function (x) { return x.s.price; })); }
  function groupPop(g) { return g.items.reduce(function (n, x) { return n + popOf(x.s); }, 0); }
  function sortGroups(gs) {
    var a = gs.slice();
    if (sortMode == "price") a.sort(function (x, y) { return sortDir == "asc" ? groupMin(x) - groupMin(y) : groupMin(y) - groupMin(x); });
    else if (sortMode == "alpha") a.sort(function (x, y) { return x.key.localeCompare(y.key, "uk"); });
    else if (sortMode == "pop") a.sort(function (x, y) { return groupPop(y) - groupPop(x); });
    return a;
  }
  function groupList(arr) {
    var order = [], map = {};
    arr.forEach(function (s) {
      var sp = splitName(s.name), k = sp[0] || s.name, key = k + "|" + s.obj;
      if (!map[key]) { map[key] = { key: k, obj: s.obj, items: [] }; order.push(key); }
      map[key].items.push({ s: s, v: sp[1] });
    });
    return order.map(function (k) { return map[k]; });
  }

  /* ───────── розмітка ───────── */
  var SEARCH = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/></svg>";
  var SORT_SVG = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M7 4v16M7 20l-3-3M7 20l3-3'/><path d='M17 20V4M17 4l-3 3M17 4l3 3'/></svg>";

  function sortBar() {
    var opts = Object.keys(SORT_LABELS).map(function (k) {
      var on = sortMode == k;
      return "<button class='pn-sort-o" + (on ? " on" : "") + "' onclick=\"PL.sort('" + k + "')\"><span>" + SORT_LABELS[k] + "</span><i>" +
        (on ? (k == "price" ? (sortDir == "asc" ? "↑" : "↓") : "✓") : "") + "</i></button>";
    }).join("");
    if (sortMode) opts += "<button class='pn-sort-o pn-sort-reset' onclick=\"PL.sort('')\">Скинути</button>";
    return "<div class='pn-sortwrap'><button class='pn-ibtn" + (sortMode ? " active" : "") + "' title='Сортування' onclick='PL.menu()'>" + SORT_SVG + "</button>" +
      (menuOpen ? "<div class='pn-sortmenu'>" + opts + "</div>" : "") + "</div>";
  }
  function searchBar() {
    return "<div class='pn-search pn-sm" + (q ? " has" : "") + "'>" + SEARCH + "<input type='text' id='pl-q' placeholder='Пошук' value=\"" + esc(q) +
      "\" oninput='PL.q(this.value)'><button class='pn-x' onclick='PL.clear()'>×</button></div>";
  }
  function toksOf() {
    return q.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (t) { return t.length > 4 ? t.slice(0, -1) : t; });
  }
  function priceCell(price, unit) {
    return "<div class='pv-pc'><span class='pv-p'>" + money(price) + (unit ? "<span class='pl-unit'>/ " + esc(unit) + "</span>" : "") + "</span></div>";
  }
  function pvRow(name, price, unit, where, toks) {
    return "<div class='pv-row' onclick=\"this.classList.toggle('pv-lit')\"><div class='pn-nm'>" + (toks ? hl(name, toks) : esc(name)) +
      (where ? "<div class='pn-where'>" + esc(where) + "</div>" : "") + "</div>" + priceCell(price, unit) + "</div>";
  }
  function vContent() {
    var arr = inProc(proc, obj), gs = sortGroups(groupList(arr)), out = "", singles = [];
    gs.forEach(function (g) {
      if (g.items.length < 2) { g.items.forEach(function (x) { singles.push(x.s); }); return; }
      var its = sortServices(g.items.map(function (x) { return x.s; })).map(function (s) { return { s: s, v: splitName(s.name)[1] }; });
      out += "<div class='pv-card'><div class='pv-ch'>" + esc(g.key) + "</div>" +
        its.map(function (x) { return pvRow(x.v, x.s.price, x.s.unit); }).join("") + "</div>";
    });
    if (singles.length) {
      out += "<div class='pv-card'>" + (out ? "<div class='pv-ch'>Окремі послуги</div>" : "") +
        sortServices(singles).map(function (s) { return pvRow(s.name, s.price, s.unit); }).join("") + "</div>";
    }
    return out || "<div class='pn-empty'>Немає послуг</div>";
  }
  function vSearch() {
    var toks = toksOf(), out = "", n = 0;
    sortServices(ALL).forEach(function (s) {
      var hay = (s.name + " " + s.proc + " " + objLabel(s.obj) + " " + hintFor(s.name)).toLowerCase();
      if (toks.every(function (t) { return hay.indexOf(t) > -1; })) { n++; out += pvRow(s.name, s.price, s.unit, s.proc + " · " + objLabel(s.obj), toks); }
    });
    return "<div class='pn-count'>Знайдено: " + n + "</div><div class='pv-card'>" + (out || "<div class='pn-empty'>Нічого не знайдено</div>") + "</div>";
  }

  /* ───────── сторінка «Прайс» ───────── */
  function priceView() {
    var tools = searchBar() + sortBar();
    var keys = objKeys();
    if (!obj || keys.indexOf(obj) < 0) obj = keys.indexOf("shoes") > -1 ? "shoes" : keys[0];
    var list = PROCS.filter(function (p) { return cntProc(p, obj); });
    if (!proc || list.indexOf(proc) < 0) proc = list[0];
    var searching = !!q.trim();
    var care = list.filter(function (p) { return CARE.indexOf(p) > -1; }), rep = list.filter(function (p) { return CARE.indexOf(p) < 0; });
    var order = care.concat(rep), idx = searching ? -1 : order.indexOf(proc);

    var tabs = "<div class='pl-tabs'>" + keys.map(function (o) {
      return "<button class='pl-tab" + (obj == o ? " active" : "") + "' onclick=\"PL.obj('" + o + "')\">" + esc(objLabel(o)) + "<em>" +
        ALL.filter(function (x) { return x.obj == o; }).length + "</em></button>";
    }).join("") + "</div>";
    function btn(p) {
      return "<button class='pv-tab" + ((proc == p && !searching) ? " active" : "") + "' onclick=\"PL.po('" + p.replace(/'/g, "\\'") + "')\"><span>" + esc(p) +
        "</span><em>" + cntProc(p, obj) + "</em></button>";
    }
    function blk(cls, t, arr) {
      return arr.length ? "<div class='pv-blk " + cls + "'><div class='pv-blk-h'><i></i>" + t + "</div>" + arr.map(btn).join("") + "</div>" : "";
    }
    var rail = "<div class='pv-slider'></div>" + blk("care", "Догляд", care) + blk("rep", "Ремонт", rep) +
      "<button class='pv-kbtn' onclick=\"PL.sw('kosh')\">Кошторис<span>›</span></button>";
    var main = searching ? vSearch() : "<div class='pv-th'><span>Ціна</span></div>" + vContent();
    var tl = idx == 0 ? 0 : 12, bl = idx == order.length - 1 ? 0 : 12;
    var rad = searching ? "12px" : (tl + "px 12px 12px " + bl + "px");
    return "<div class='tab-scroll'><div class='pn-wrap pn-wide'><div class='pv-grid pvs-b pvx-b pvo-seg'>" +
      "<div class='pv-objs'>" + tabs + "</div><div class='pv-toolsrow'>" + tools + "</div>" +
      "<div class='pv-tabs' data-first='" + (idx == 0 ? 1 : 0) + "' data-last='" + (idx == order.length - 1 ? 1 : 0) + "' data-rad='" + rad + "'>" + rail + "</div>" +
      "<div class='pv-panel" + (animateNext ? " pv-anim" : "") + "' style='border-radius:" + rad + "'>" + main + "</div></div></div></div>";
  }
  function afterPaint(root) {
    var tabsEl = root.querySelector(".pv-tabs"), sl = root.querySelector(".pv-slider"), act = root.querySelector(".pv-tab.active"), panel = root.querySelector(".pv-panel");
    if (!tabsEl || !sl) return;
    if (!act) { sl.style.display = "none"; return; }
    var now = { top: act.offsetTop, h: act.offsetHeight, first: tabsEl.dataset.first == "1", last: tabsEl.dataset.last == "1", rad: tabsEl.dataset.rad };
    function apply(st) {
      sl.style.top = st.top + "px"; sl.style.height = st.h + "px";
      sl.classList.toggle("first", st.first); sl.classList.toggle("last", st.last);
    }
    if (animateNext && lastSlide) {
      sl.style.transition = "none"; panel.style.transition = "none";
      apply(lastSlide); panel.style.borderRadius = lastSlide.rad;
      void sl.offsetHeight;
      sl.style.transition = ""; panel.style.transition = "";
      requestAnimationFrame(function () { requestAnimationFrame(function () { apply(now); panel.style.borderRadius = now.rad; }); });
    } else { sl.style.transition = "none"; apply(now); void sl.offsetHeight; sl.style.transition = ""; }
    lastSlide = now; animateNext = false;
  }

  /* ───────── сторінка «Кошторис» ───────── */
  function koshTotals() {
    var n = 0, t = 0;
    NO.items.forEach(function (i) { (i.services || []).forEach(function (s) { n++; t += (parseInt(s.price) || 0); }); });
    return { n: n, t: t };
  }
  function koshReceipt() {
    var any = NO.items.some(function (i) { return i.services && i.services.length; });
    if (!any) return "<div class='r-empty'><div class='icon'>🧾</div>Додайте річ та послуги — тут з'явиться кошторис</div>";
    var now = new Date();
    var d = now.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }) + " · " + now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    var t = koshTotals(), ih = "";
    NO.items.forEach(function (it, ix) {
      if (!it.services || !it.services.length) return;
      var label = [it.model, it.brand].filter(Boolean).join(" · ");
      var nm = typeof rcName === "function" ? rcName : function (x) { return x; };
      ih += "<div class='r-item'><div class='r-item-title'><span class='ri-num'>№" + (ix + 1) + "</span>" + (label ? "<span class='ri-name'>" + esc(label) + "</span>" : "") + "</div>" +
        it.services.map(function (sv) { return "<div class='r-svcrow'><span>" + esc(nm(sv.name)) + "</span><span class='rs-price'>" + sv.price + " ₴</span></div>"; }).join("") +
        (it.note ? "<div class='r-item-note'>Коментар: " + esc(it.note) + "</div>" : "") + "</div>";
    });
    var cc = "";
    if (NO.client || NO.note) {
      cc = "<div class='r-client r-client-2col'><div class='r-ccol'>" +
        (NO.client ? "<div class='r-crow'><span class='rc-label'>Клієнт</span></div><div class='rc-value-2col'>" + esc(NO.client) + "</div>" : "") +
        "</div><div class='r-ccol'>" +
        (NO.note ? "<div class='r-crow'><span class='rc-label'>Примітка</span></div><div class='rc-value-2col'>" + esc(NO.note) + "</div>" : "") + "</div></div>";
    }
    return "<div class='r-header'><div class='r-subtag' style='margin-top:0;font-size:11.5px'>Ремонт · Реставрація · Чищення</div>" +
      "<div class='r-doc'>Попередній кошторис</div></div>" +
      "<div class='r-meta' style='justify-content:flex-end'><span>" + d + "</span></div>" + cc +
      "<div class='r-items'>" + ih + "</div><hr class='r-divider'>" +
      "<div class='r-total'><span class='rt-label'>Разом</span><span class='rt-amount'>" + t.t + " ₴</span></div>" +
      "<div class='r-footer'>Остаточна вартість узгоджується після огляду речі.</div><div class='r-disclaimer'>Документ не є фіскальним чеком</div>";
  }
  function koshPage() {
    return "<div class='tab-scroll'><div class='ks-top'><button class='ks-back' onclick=\"PL.sw('price')\">‹ Прайс</button>" +
      "<div class='ks-title'>Кошторис</div><div class='ks-act'><button class='btn-share' onclick='PL.share()'>Поділитися</button>" +
      "<button class='btn-share' onclick='PL.save()'>Зберегти зображення</button></div></div>" +
      "<div class='ks-grid'><div class='ks-left'><div class='cr-box'><div class='cr-block-label first'>Клієнт</div><div class='ks-row2'>" +
      "<input class='cr-input' placeholder=\"Ім'я або магазин\" value=\"" + esc(NO.client) + "\" oninput='PL.cl(\"client\",this.value)'>" +
      "<input class='cr-input' placeholder='Примітка' value=\"" + esc(NO.note || "") + "\" oninput='PL.cl(\"note\",this.value)'></div></div>" +
      "<div class='cr-box'><div class='cr-block-label first'>Речі та послуги</div><div id='cr-items'></div>" +
      "<button class='add-item-btn' onclick='addItemAndOpen()'>+ Додати ще одну річ</button></div></div>" +
      "<div class='ks-right'><div id='receipt'>" + koshReceipt() + "</div></div></div></div>";
  }

  /* вхід / вихід: кошторис працює зі своїм об'єктом речей KO, а NO форми замовлення лишається недоторканим */
  function koshEnter() {
    if (koshOn) return;
    if (!KO) KO = { manager: NO.manager, client: "", note: "", phone: "", messenger: "", items: [], payment: "", prepay: "", prepayMethod: "", deadline: "", delivery: "Самовивіз" };
    NOsaved = NO; NO = KO; koshOn = true;
    var pc = document.getElementById("page-create");   // щоб не дублювались #cr-items / #receipt
    if (pc) pc.innerHTML = "";
    document.body.classList.add("kosh");
  }
  function koshLeave() {
    if (!koshOn) return;
    KO = NO; NO = NOsaved; NOsaved = null; koshOn = false;
    document.body.classList.remove("kosh");
    sw = "price";
  }
  /* підміна updateReceipt / renderers.create на час кошторису (встановлюється один раз) */
  var hooked = false;
  function hook() {
    if (hooked) return; hooked = true;
    var ur = window.updateReceipt;
    window.updateReceipt = function () {
      if (koshOn) { var r = document.getElementById("receipt"); if (r) r.innerHTML = koshReceipt(); return; }
      return ur.apply(this, arguments);
    };
    var rc = renderers.create;
    renderers.create = function () {
      if (koshOn) { try { renderItemList(); } catch (e) {} window.updateReceipt(); return; }
      return rc.apply(this, arguments);
    };
  }
  /* вихід з кошторису при переході на іншу вкладку або повторному тапі «Прайс» */
  var origShow = window.showPage;
  window.showPage = function (name) {
    if (koshOn && (name !== "pricelist" || currentPage === "pricelist")) koshLeave();
    return origShow.apply(this, arguments);
  };

  /* ───────── рендер ───────── */
  function paint(keepFocus) {
    var page = document.getElementById("page-pricelist");
    if (!page) return;
    try {
      if (!priceLoaded) {
        page.innerHTML = "<div class='page-header'><div class='page-title'>Прайс</div></div><div class='orders-loading'>Завантаження...</div>";
        return;
      }
      if (!Object.keys(PRICE).length) {
        page.innerHTML = "<div class='page-header'><div class='page-title'>Прайс</div></div><div class='orders-empty'>Прайс порожній</div>";
        return;
      }
      buildAll();
      var pos = 0, f = document.getElementById("pl-q");
      if (keepFocus && f) { try { pos = f.selectionStart; } catch (e) {} }
      if (sw == "kosh") {
        hook(); koshEnter();
        page.innerHTML = koshPage();
        try { renderItemList(); } catch (e) {}
      } else {
        koshLeave();
        page.innerHTML = priceView();
        afterPaint(page);
      }
      if (keepFocus) { var i = document.getElementById("pl-q"); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (e) {} } }
    } catch (e) {
      page.innerHTML = "<div class='page-header'><div class='page-title'>Прайс</div></div><div style='padding:20px;color:#E24B4A;font-size:13px'>Помилка прайсу: " + esc(e.message || e) + "</div>";
    }
  }
  renderers.pricelist = function () { paint(); };

  function saveImage() {
    var el = document.getElementById("receipt");
    if (!el || el.querySelector(".r-empty")) { alert("Додайте послуги для кошторису"); return; }
    html2canvas(el, { backgroundColor: "#FFFFFF", scale: 2, useCORS: true }).then(function (canvas) {
      var a = document.createElement("a");
      a.download = "koshtorys-" + Date.now() + ".png"; a.href = canvas.toDataURL("image/png"); a.click();
    });
  }
  function shareImage() {
    var el = document.getElementById("receipt");
    if (!el || el.querySelector(".r-empty")) { alert("Додайте послуги для кошторису"); return; }
    html2canvas(el, { backgroundColor: "#FFFFFF", scale: 2, useCORS: true }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        var file = new File([blob], "koshtorys.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: "Кошторис" }).catch(function () {});
        else saveImage();
      }, "image/png");
    });
  }

  window.PL = {
    sw: function (k) { sw = k; paint(); try { window.scrollTo(0, 0); } catch (e) {} },
    obj: function (o) { animateNext = true; obj = o; proc = ""; q = ""; openKey = ""; paint(); },
    po: function (p) { animateNext = true; proc = p; q = ""; openKey = ""; paint(); },
    sort: function (k) {
      if (k == "price" && sortMode == "price") sortDir = sortDir == "asc" ? "desc" : "asc";
      else if (k && k == sortMode && k != "price") sortMode = "";
      else { sortMode = k; sortDir = "asc"; }
      menuOpen = (k == "price"); paint();
    },
    menu: function () { menuOpen = !menuOpen; paint(); },
    q: function (v) { q = v; paint(true); },
    clear: function () { q = ""; paint(); },
    cl: function (f, v) { NO[f] = v; var r = document.getElementById("receipt"); if (r) r.innerHTML = koshReceipt(); },
    share: shareImage,
    save: saveImage
  };
})();
