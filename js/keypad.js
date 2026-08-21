/* ═══════════════ ЕКРАННА ЦИФРОВА КЛАВІАТУРА ═══════════════
   Модалка по центру. Ввід тільки через екранні кнопки (поле readonly).
   Два режими: телефон (openPhoneKeypad) і ціна (openPriceKeypad).
   - startValue: поточне значення (рядок/число)
   - onChange(newValue): викликається на кожну зміну (для live-підказок/чека)
   - onDone(finalValue): викликається при «Готово» або закритті */

let _kpValue = "";
let _kpOnChange = null;
let _kpOnDone = null;
let _kpMode = "phone";

function openPhoneKeypad(startValue, onChange, onDone) {
  let v = (startValue || "").trim();
  if (!v) v = "+380 ";
  _openKeypad("phone", "Номер телефону", v, onChange, onDone);
}

function openPriceKeypad(startValue, onChange, onDone) {
  const v = (startValue != null && startValue !== "") ? String(parseInt(startValue) || 0) : "";
  _openKeypad("price", "Ціна", v, onChange, onDone);
}

function _openKeypad(mode, title, startValue, onChange, onDone) {
  _kpMode = mode;
  _kpValue = startValue;
  _kpOnChange = onChange || null;
  _kpOnDone = onDone || null;

  let bg = document.getElementById("kp-bg");
  if (!bg) {
    bg = document.createElement("div");
    bg.id = "kp-bg";
    bg.className = "kp-bg";
    bg.onclick = function(e) { if (e.target === bg) closePhoneKeypad(); };
    document.body.appendChild(bg);
  }

  const grid = mode === "price"
    ? (kpBtn("1") + kpBtn("2") + kpBtn("3") +
       kpBtn("4") + kpBtn("5") + kpBtn("6") +
       kpBtn("7") + kpBtn("8") + kpBtn("9") +
       "<span></span>" + kpBtn("0") +
       "<button class='kp-key kp-del' onclick='kpPress(\"del\")'>⌫</button>")
    : (kpBtn("1") + kpBtn("2") + kpBtn("3") +
       kpBtn("4") + kpBtn("5") + kpBtn("6") +
       kpBtn("7") + kpBtn("8") + kpBtn("9") +
       kpBtn("+") + kpBtn("0") +
       "<button class='kp-key kp-del' onclick='kpPress(\"del\")'>⌫</button>");

  bg.innerHTML =
    "<div class='kp-modal'>" +
      "<div class='kp-modal-head'>" +
        "<span class='kp-modal-title'>" + title + "</span>" +
        "<div class='kp-close' onclick='closePhoneKeypad()'>×</div>" +
      "</div>" +
      "<div class='kp-display' id='kp-display'></div>" +
      "<div class='kp-grid'>" + grid + "</div>" +
      "<button class='kp-done' onclick='closePhoneKeypad()'>Готово</button>" +
    "</div>";
  bg.classList.add("open");
  kpRenderDisplay();
}

function kpBtn(k) {
  return "<button class='kp-key' onclick='kpPress(\"" + k + "\")'>" + k + "</button>";
}

function kpPress(k) {
  if (k === "del") _kpValue = _kpValue.slice(0, -1);
  else if (k === "+") { if (!_kpValue.includes("+")) _kpValue = "+" + _kpValue; }
  else _kpValue += k;
  kpRenderDisplay();
  if (_kpOnChange) _kpOnChange(_kpValue);
}

function kpRenderDisplay() {
  const d = document.getElementById("kp-display");
  if (!d) return;
  if (_kpMode === "price") {
    const n = parseInt(_kpValue || "0") || 0;
    d.textContent = n.toLocaleString("uk-UA") + " ₴";
  } else {
    d.textContent = _kpValue || "";
  }
}

function closePhoneKeypad() {
  const bg = document.getElementById("kp-bg");
  if (bg) bg.classList.remove("open");
  if (_kpOnDone) _kpOnDone(_kpValue);
  _kpOnChange = null;
  _kpOnDone = null;
}
