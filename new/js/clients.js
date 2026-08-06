/* ═══════ ВКЛАДКА КЛІЄНТИ (clients.js) ═══════
   Список клієнтів + пошук. Містить renderers.clients = ..., тому
   підключається наприкінці, після основного коду.
   Залежить від глобальних: ORDERS, gv, openOrder, clientRating,
   clientPaymentStats, clientBonusBalance, clientMessenger, esc, renderers. */

/* ═══════════════ ВКЛАДКА КЛІЄНТИ ═══════════════ */
let clientSearch = "";
let _clientsCache = [];
function buildClientRows() {
  const q = (clientSearch || "").trim().toLowerCase();
  const list = _clientsCache.filter(c => !q || (c.phone||"").toLowerCase().includes(q) || (c.name||"").toLowerCase().includes(q));
  if (!list.length) return "<div class='orders-empty'>" + (_clientsCache.length ? "Нічого не знайдено" : "Ще немає клієнтів") + "</div>";
  return list.map(c => {
    const r = clientRating(c.phone);
    const bonus = clientBonusBalance(c.phone);
    const bonusCls = bonus >= BONUS_MIN_SPEND ? " ready" : "";
    return "<div class='client-row' onclick=\"openClientCard('" + c.phone.replace(/'/g,"") + "')\">" +
      "<span class='client-dot'>" + r.dot + "</span>" +
      "<div><div class='client-name'>" + (c.name || "—") + "</div></div>" +
      "<div class='client-phone'>" + c.phone + "</div>" +
      "<span class='client-count'>" + c.count + " замовл.</span>" +
      "<span class='client-bonus" + bonusCls + "'>" + (bonus > 0 ? bonus + " б." : "—") + "</span>" +
      "<span class='client-sum'>" + c.sum.toLocaleString("uk-UA") + " ₴</span>" +
    "</div>";
  }).join("");
}
renderers.clients = function() {
  const page = document.getElementById("page-clients");
  // Унікальні клієнти за телефоном — ремонт + пошив
  const map = {};
  ORDERS.forEach(o => {
    const phone = gv(o,"Телефон"); if (!phone) return;
    if (!map[phone]) map[phone] = { name: gv(o,"Ім'я клієнта"), phone: phone, count: 0, sum: 0 };
    map[phone].count++;
    map[phone].sum += orderTotal(gv(o,"Номер замовлення"));
  });
  TAILOR.forEach(t => {
    const phone = gv(t,"Телефон"); if (!phone) return;
    if (!map[phone]) map[phone] = { name: gv(t,"Ім'я клієнта"), phone: phone, count: 0, sum: 0 };
    map[phone].count++;
    map[phone].sum += extractAmt(gv(t,"Вартість"));
  });
  _clientsCache = Object.values(map).sort((a,b) => b.sum - a.sum);
  const rows = buildClientRows();

  page.innerHTML =
    "<div class='page-header'><div class='page-title'>Клієнти</div>" +
      "<button class='btn-primary' onclick='openSummaryReceipt()'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'><path d='M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z'/><path d='M9 12h6M9 16h6M9 8h3'/></svg>Зведений чек</button>" +
    "</div>" +
    "<div class='clients-search-wrap'><input class='clients-search' id='clients-search' placeholder='Пошук за номером телефону або імʼям…' value=\"" + (clientSearch||"").replace(/"/g,"&quot;") + "\" oninput='clientSearch=this.value; document.getElementById(\"clients-list\").innerHTML=buildClientRows();'></div>" +
    "<div class='tab-scroll'>" +
      "<div class='clients-list' id='clients-list'>" + rows + "</div>" +
    "</div>";
};

function openClientCard(phone) {
  // Знайти останнє замовлення клієнта і відкрити його картку
  const cOrders = ORDERS.filter(o => gv(o,"Телефон") === phone);
  if (!cOrders.length) return;
  const last = cOrders[cOrders.length - 1];
  openOrder(gv(last,"Номер замовлення"));
}
