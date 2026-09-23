let currentMode = 'basic';
let currentExpr = '';
let currentVal = '0';
let history = [];
let shouldResetVal = false;

// Memory cache for live rates per base currency
const liveRatesCache = {};

// Flag mapping table with SVG flags
const currencyFlags = {
  USD: 'https://flagcdn.com/w40/us.png',
  EUR: 'https://flagcdn.com/w40/eu.png',
  GBP: 'https://flagcdn.com/w40/gb.png',
  INR: 'https://flagcdn.com/w40/in.png',
  JPY: 'https://flagcdn.com/w40/jp.png',
  CAD: 'https://flagcdn.com/w40/ca.png',
  AUD: 'https://flagcdn.com/w40/au.png',
  AED: 'https://flagcdn.com/w40/ae.png',
  SGD: 'https://flagcdn.com/w40/sg.png',
  CNY: 'https://flagcdn.com/w40/cn.png'
};

window.onload = () => {
  renderBasicKeypad();
};

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', 
      (mode === 'basic' && idx === 0) || 
      (mode === 'scientific' && idx === 1) || 
      (mode === 'currency' && idx === 2)
    );
  });

  const mainLayout = document.getElementById('mainLayout');
  const historyPanel = document.getElementById('historyPanel');
  const calcDisplay = document.getElementById('calcDisplay');

  if (mode === 'basic') {
    mainLayout.classList.add('has-history');
    historyPanel.style.display = 'flex';
    calcDisplay.style.display = 'flex';
    renderBasicKeypad();
  } else if (mode === 'scientific') {
    mainLayout.classList.remove('has-history');
    historyPanel.style.display = 'none';
    calcDisplay.style.display = 'flex';
    renderScientificKeypad();
  } else if (mode === 'currency') {
    mainLayout.classList.remove('has-history');
    historyPanel.style.display = 'none';
    calcDisplay.style.display = 'none';
    renderCurrencyConverter();
  }
}

function renderBasicKeypad() {
  const container = document.getElementById('keypadContainer');
  container.className = 'keypad keypad-basic';
  container.innerHTML = `
    <button class="btn btn-clear" onclick="clearCalc()">C</button>
    <button class="btn" onclick="toggleSign()">+/-</button>
    <button class="btn" onclick="appendInput('%')">%</button>
    <button class="btn btn-op" onclick="appendInput('÷')">÷</button>

    <button class="btn" onclick="appendInput('7')">7</button>
    <button class="btn" onclick="appendInput('8')">8</button>
    <button class="btn" onclick="appendInput('9')">9</button>
    <button class="btn btn-op" onclick="appendInput('×')">×</button>

    <button class="btn" onclick="appendInput('4')">4</button>
    <button class="btn" onclick="appendInput('5')">5</button>
    <button class="btn" onclick="appendInput('6')">6</button>
    <button class="btn btn-op" onclick="appendInput('-')">-</button>

    <button class="btn" onclick="appendInput('1')">1</button>
    <button class="btn" onclick="appendInput('2')">2</button>
    <button class="btn" onclick="appendInput('3')">3</button>
    <button class="btn btn-op" onclick="appendInput('+')">+</button>

    <button class="btn span-2" onclick="appendInput('0')">0</button>
    <button class="btn" onclick="appendInput('.')">.</button>
    <button class="btn btn-equals" onclick="calculateResult()">=</button>
  `;
}

function renderScientificKeypad() {
  const container = document.getElementById('keypadContainer');
  container.className = 'keypad keypad-scientific';
  container.innerHTML = `
    <button class="btn" onclick="appendFunc('sin')">sin</button>
    <button class="btn" onclick="appendFunc('cos')">cos</button>
    <button class="btn" onclick="appendFunc('tan')">tan</button>
    <button class="btn btn-clear" onclick="clearCalc()">C</button>
    <button class="btn btn-op" onclick="appendInput('÷')">÷</button>

    <button class="btn" onclick="appendFunc('log')">log</button>
    <button class="btn" onclick="appendFunc('ln')">ln</button>
    <button class="btn" onclick="appendInput('(')">(</button>
    <button class="btn" onclick="appendInput(')')">)</button>
    <button class="btn btn-op" onclick="appendInput('×')">×</button>

    <button class="btn" onclick="appendFunc('sqrt')">√</button>
    <button class="btn" onclick="appendInput('7')">7</button>
    <button class="btn" onclick="appendInput('8')">8</button>
    <button class="btn" onclick="appendInput('9')">9</button>
    <button class="btn btn-op" onclick="appendInput('-')">-</button>

    <button class="btn" onclick="appendInput('^')">x^y</button>
    <button class="btn" onclick="appendInput('4')">4</button>
    <button class="btn" onclick="appendInput('5')">5</button>
    <button class="btn" onclick="appendInput('6')">6</button>
    <button class="btn btn-op" onclick="appendInput('+')">+</button>

    <button class="btn" onclick="appendInput('π')">π</button>
    <button class="btn" onclick="appendInput('1')">1</button>
    <button class="btn" onclick="appendInput('2')">2</button>
    <button class="btn" onclick="appendInput('3')">3</button>
    <button class="btn btn-equals span-2" style="grid-row: span 2;" onclick="calculateResult()">=</button>

    <button class="btn" onclick="appendInput('e')">e</button>
    <button class="btn span-2" onclick="appendInput('0')">0</button>
    <button class="btn" onclick="appendInput('.')">.</button>
  `;
}

function appendInput(char) {
  if (shouldResetVal) {
    currentVal = '';
    shouldResetVal = false;
  }
  if (currentVal === '0' && char !== '.') {
    currentVal = char;
  } else {
    currentVal += char;
  }
  updateDisplay();
}

function appendFunc(funcName) {
  if (shouldResetVal) {
    currentVal = '';
    shouldResetVal = false;
  }
  currentVal += funcName + '(';
  updateDisplay();
}

function clearCalc() {
  currentVal = '0';
  currentExpr = '';
  shouldResetVal = false;
  updateDisplay();
}

function toggleSign() {
  if (currentVal !== '0') {
    currentVal = currentVal.startsWith('-') ? currentVal.substring(1) : '-' + currentVal;
    updateDisplay();
  }
}

function updateDisplay() {
  document.getElementById('currentVal').innerText = currentVal || '0';
  document.getElementById('expression').innerText = currentExpr;
}

function calculateResult() {
  try {
    let parsedExpr = currentVal
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/\^/g, '**');

    let result = eval(parsedExpr);
    if (typeof result === 'number') {
      result = Math.round(result * 1e8) / 1e8;
    }

    if (currentMode === 'basic') {
      addHistoryItem(currentVal, result);
    }

    currentExpr = currentVal + ' =';
    currentVal = String(result);
    shouldResetVal = true;
    updateDisplay();
  } catch (e) {
    currentVal = 'Error';
    shouldResetVal = true;
    updateDisplay();
  }
}

function addHistoryItem(expr, result) {
  history.unshift({ expr, result });
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = history.map(item => `
    <li class="history-item">
      <span class="expr">${item.expr}</span>
      <span class="res">${item.result}</span>
    </li>
  `).join('');
}

function clearHistory() {
  history = [];
  renderHistory();
}

// --- CURRENCY CONVERTER LOGIC WITH FLAGS ---
function renderCurrencyConverter() {
  const container = document.getElementById('keypadContainer');
  container.className = 'currency-panel';
  
  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'AED', 'SGD', 'CNY'];

  container.innerHTML = `
    <div class="currency-group">
      <label>Amount & From Currency</label>
      <div class="currency-input-row">
        <input type="number" id="curr-amount" value="1" oninput="convertCurrency()" />
        <div class="flag-select-wrapper">
          <img id="from-flag" class="flag-img" src="${currencyFlags['USD']}" alt="USD" />
          <select id="from-curr" onchange="updateFlags(); convertCurrency(true)">
            ${currencies.map(c => `<option value="${c}" ${c === 'USD' ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <button class="swap-rates-btn" onclick="swapCurrencies()">
      <i class="fa-solid fa-arrows-up-down"></i> Swap Currencies
    </button>

    <div class="currency-group">
      <label>Converted Amount & Status</label>
      <div class="currency-input-row">
        <input type="text" id="curr-result" readonly />
        <div class="flag-select-wrapper">
          <img id="to-flag" class="flag-img" src="${currencyFlags['INR']}" alt="INR" />
          <select id="to-curr" onchange="updateFlags(); convertCurrency()">
            ${currencies.map(c => `<option value="${c}" ${c === 'INR' ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="rate-time-info" id="rate-time-info">Live exchange rates active</div>
  `;

  updateFlags();
  convertCurrency();
}

function updateFlags() {
  const from = document.getElementById('from-curr').value;
  const to = document.getElementById('to-curr').value;
  
  document.getElementById('from-flag').src = currencyFlags[from] || '';
  document.getElementById('to-flag').src = currencyFlags[to] || '';
}

function swapCurrencies() {
  const fromSelect = document.getElementById('from-curr');
  const toSelect = document.getElementById('to-curr');
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  
  updateFlags();
  convertCurrency(true);
}

// --- DUAL API REAL-TIME FETCHING ---
async function convertCurrency(forceFetch = false) {
  const amtInput = document.getElementById('curr-amount');
  const resultDisplay = document.getElementById('curr-result');
  const fromSelect = document.getElementById('from-curr');
  const toSelect = document.getElementById('to-curr');
  const infoDisplay = document.getElementById('rate-time-info');

  if (!amtInput || !resultDisplay) return;

  const from = fromSelect.value;
  const to = toSelect.value;
  const amt = parseFloat(amtInput.value);

  if (isNaN(amt) || amt <= 0) {
    resultDisplay.value = "Enter valid amount";
    return;
  }

  // Use in-memory cached rate if available
  if (!forceFetch && liveRatesCache[from] && liveRatesCache[from][to]) {
    const rate = liveRatesCache[from][to];
    const finalRes = amt * rate;
    resultDisplay.value = finalRes.toFixed(2) + " " + to;
    return;
  }

  resultDisplay.value = "Fetching live rate...";

  try {
    let response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    let data;

    if (response.ok) {
      data = await response.json();
    } else {
      response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      data = await response.json();
    }

    if (data && data.rates && data.rates[to]) {
      const rate = data.rates[to];
      liveRatesCache[from] = data.rates;

      const finalRes = amt * rate;
      resultDisplay.value = finalRes.toFixed(2) + " " + to;
      if (infoDisplay) infoDisplay.innerHTML = `<span style="color:#10b981;">●</span> Live rate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
    } else {
      throw new Error("Invalid rate data structure");
    }
  } catch (error) {
    console.warn("Live API fetch failed. Using fallback calculation...", error);

    const defaultUSDConversion = { 
      USD: 1.0, 
      EUR: 0.87, 
      GBP: 0.75, 
      INR: 95.8, 
      JPY: 150.0, 
      CAD: 1.35, 
      AUD: 1.48, 
      AED: 3.67, 
      SGD: 1.30, 
      CNY: 7.10 
    };

    const inUSD = amt / (defaultUSDConversion[from] || 1);
    const fallbackRes = inUSD * (defaultUSDConversion[to] || 1);

    resultDisplay.value = fallbackRes.toFixed(2) + " " + to + " (offline)";
    if (infoDisplay) infoDisplay.innerHTML = `<span style="color:#ef4444;">●</span> Offline estimation`;
  }
}