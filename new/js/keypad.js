/* ═══════════════ ЕКРАННА ЦИФРОВА КЛАВІАТУРА ДЛЯ ТЕЛЕФОНУ ═══════════════
   Модалка по центру. Ввід тільки через екранні кнопки (поле readonly).
   Викликається openPhoneKeypad(startValue, onChange, onDone).
   - startValue: поточне значення (рядок)
   - onChange(newValue): викликається на кожну зміну (для live-підказок/чека)
   - onDone(finalValue): викликається при «Готово» або закритті */

let _kpValue = "";
let _kpOnChange = null;
let _kpOnDone = null;

function openPhoneKeypad(startValue, onChange, onDone) {
  _kpValue = (startValue || "").trim();
  if (!_kpValue) _kpValue = "+380 ";
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
  bg.innerHTML =
    "<div class='kp-modal'>" +
      "<div class='kp-modal-head'>" +
        "<span class='kp-modal-title'>Номер телефону</span>" +
        "<div class='kp-close' onclick='closePhoneKeypad()'>×</div>" +
      "</div>" +
      "<div class='kp-display' id='kp-display'></div>" +
      "<div class='kp-grid'>" +
        kpBtn("1") + kpBtn("2") + kpBtn("3") +
        kpBtn("4") + kpBtn("5") + kpBtn("6") +
        kpBtn("7") + kpBtn("8") + kpBtn("9") +
        kpBtn("+") + kpBtn("0") +
        "<button class='kp-key kp-del' onclick='kpPress(\"del\")'>⌫</button>" +
      "</div>" +
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
  d.textContent = _kpValue || "";
}

function closePhoneKeypad() {
  const bg = document.getElementById("kp-bg");
  if (bg) bg.classList.remove("open");
  if (_kpOnDone) _kpOnDone(_kpValue);
  _kpOnChange = null;
  _kpOnDone = null;
}
