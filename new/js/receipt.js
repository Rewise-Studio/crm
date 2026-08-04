/* ═══════ ЧЕК (receipt.js) ═══════
   Винесено з index.html. Залежить від глобальних: NO, ORDERS, ITEMS,
   gv, extractAmt, html2canvas — вони лишаються в основному коді. */

function updateReceipt() {
  const receipt = document.getElementById("receipt");
  if (!receipt) return;
  const hasSvc = NO.items.some(i => i.services.length > 0);
  if (!hasSvc) {
    receipt.innerHTML = "<div class='r-empty'><div class='icon'>🧾</div>Додайте річ та послуги — тут з'явиться кошторис</div>";
    return;
  }
  const now = new Date();
  const dateStr = now.toLocaleDateString("uk-UA",{day:"2-digit",month:"2-digit",year:"numeric"});
  const timeStr = now.toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit"});
  let total = 0, itemsHTML = "";
  NO.items.forEach((item, idx) => {
    if (!item.services.length) return;
    item.services.forEach(s => total += s.price);
    const svcs = item.services.map(s => "<div class='r-svcrow'><span>"+s.name+"</span><span class='rs-price'>"+s.price+" ₴</span></div>").join("");
    const label = [item.model, item.brand].filter(Boolean).join(" · ");
    const noteHTML = item.note ? "<div class='r-item-note'>Прим.: "+item.note.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</div>" : "";
    itemsHTML += "<div class='r-item'><div class='r-item-title'><span class='ri-num'>№"+(idx+1)+"</span>"+(label?"<span class='ri-name'>"+label+"</span>":"")+"</div>"+svcs+noteHTML+"</div>";
  });
  let clientHTML = "";
  if (NO.client || NO.phone) {
    clientHTML = "<div class='r-client'>";
    if (NO.client) clientHTML += "<div class='r-crow'><span class='rc-label'>Клієнт</span><span class='rc-value'>"+NO.client+"</span></div>";
    if (NO.phone) clientHTML += "<div class='r-crow'><span class='rc-label'>Телефон</span><span class='rc-value'>"+NO.phone+"</span></div>";
    clientHTML += "</div>";
  }
  receipt.innerHTML =
    "<div class='r-header'><div class='r-logo'>REWISE · STUDIO</div><div class='r-tag'>Чек</div></div>" +
    "<div class='r-meta'><span>"+dateStr+", "+timeStr+"</span></div>" + clientHTML +
    "<div class='r-items'>"+itemsHTML+"</div>" +
    (total>0 ? "<hr class='r-divider'><div class='r-total'><span class='rt-label'>Разом</span><span class='rt-amount'>"+total+" ₴</span></div><p class='r-note'>Остаточна вартість узгоджується після огляду речі.</p>" : "") +
    "<div class='r-footer'>rewise-studio · ukraine</div>";
}

function shareReceipt() {
  const el = document.getElementById("receipt");
  if (!el || el.querySelector(".r-empty")) { alert("Додайте послуги для кошторису"); return; }
  const btn = document.querySelector("button[onclick=\"shareReceipt()\"]");
  const orig = btn ? btn.innerHTML : "";
  if (btn) btn.textContent = "Готую...";
  html2canvas(el, { backgroundColor: "#F0EBE3", scale: 2, useCORS: true }).then(canvas => {
    canvas.toBlob(blob => {
      const file = new File([blob], "rewise-koshtorys.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "Rewise — Кошторис" }).then(()=>{ if(btn) btn.innerHTML=orig; }).catch(()=>{ if(btn) btn.innerHTML=orig; });
      } else {
        const link = document.createElement("a");
        link.download = "rewise-koshtorys-"+Date.now()+".png";
        link.href = canvas.toDataURL("image/png"); link.click();
        if(btn) btn.innerHTML = orig;
      }
    }, "image/png");
  }).catch(()=>{ if(btn) btn.innerHTML=orig; });
}

function orderReceiptHTML(num) {
  const o = ORDERS.find(x => gv(x,"Номер замовлення") === num);
  const its = ITEMS.filter(i => gv(i,"Номер замовлення") === num);
  const client = o ? gv(o,"Ім'я клієнта") : "";
  const phone = o ? gv(o,"Телефон") : "";
  const created = o ? gv(o,"Дата створення") : "";
  let total = 0, itemsHTML = "";
  its.forEach((it, idx) => {
    const amt = extractAmt(gv(it,"Сума")); total += amt;
    const name = [gv(it,"Тип"), gv(it,"Бренд")].filter(Boolean).join(" · ") || "Виріб";
    const svcs = gv(it,"Послуги");
    const note = gv(it,"Коментар");
    const svcRow = "<div class='r-svcrow'><span>" + (svcs || "Послуги") + "</span><span class='rs-price'>" + amt.toLocaleString("uk-UA") + " ₴</span></div>";
    const noteHTML = note ? "<div class='r-item-note'>Прим.: " + note.replace(/&/g,"&amp;").replace(/</g,"&lt;") + "</div>" : "";
    itemsHTML += "<div class='r-item'><div class='r-item-title'><span class='ri-num'>№" + (idx+1) + "</span><span class='ri-name'>" + name + "</span></div>" + svcRow + noteHTML + "</div>";
  });
  let clientHTML = "";
  if (client || phone) {
    clientHTML = "<div class='r-client'>";
    if (client) clientHTML += "<div class='r-crow'><span class='rc-label'>Клієнт</span><span class='rc-value'>" + client + "</span></div>";
    if (phone) clientHTML += "<div class='r-crow'><span class='rc-label'>Телефон</span><span class='rc-value'>" + phone + "</span></div>";
    clientHTML += "</div>";
  }
  return "<div id='order-receipt'>" +
    "<div class='r-header'><div class='r-logo'>REWISE · STUDIO</div><div class='r-tag'>Чек · " + num + "</div></div>" +
    "<div class='r-meta'><span>" + created + "</span></div>" + clientHTML +
    "<div class='r-items'>" + itemsHTML + "</div>" +
    (total > 0 ? "<hr class='r-divider'><div class='r-total'><span class='rt-label'>Разом</span><span class='rt-amount'>" + total.toLocaleString("uk-UA") + " ₴</span></div>" : "") +
    "<div class='r-footer'>rewise-studio · ukraine</div>" +
  "</div>";
}

function shareOrderReceipt(num) {
  const el = document.getElementById("order-receipt");
  if (!el) return;
  html2canvas(el, { backgroundColor: "#FBF8F3", scale: 2, useCORS: true }).then(canvas => {
    canvas.toBlob(blob => {
      const file = new File([blob], "rewise-chek-" + num + ".png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "Rewise — Чек " + num }).catch(()=>{});
      } else {
        const link = document.createElement("a");
        link.download = "rewise-chek-" + num + ".png";
        link.href = canvas.toDataURL("image/png"); link.click();
      }
    }, "image/png");
  }).catch(()=>{});
}
