// State Management
let currentMode = 'basic';
let currentInput = '0';
let expression = '';
let isEvaluated = false;
let history = [];

// Currency Converter State
let exchangeRates = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 155.2 };
let currencyFlags = {
  USD: 'us',
  EUR: 'eu',
  GBP: 'gb',
  INR: 'in',
  JPY: 'jp'
};
let fromCurrency = 'USD';
let toCurrency = 'INR';
let fromAmount = 1;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderKeypad();
  fetchExchangeRates();
});

// Switch Between Modes
function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'basic') document.getElementById('btnBasic').classList.add('active');
  if (mode === 'scientific') document.getElementById('btnScientific').classList.add('active');
  if (mode === 'currency') document.getElementById('btnCurrency').classList.add('active');

  const mainLayout = document.getElementById('mainLayout');
  const calcDisplay = document.getElementById('calcDisplay');
  const historyCard = document.getElementById('historyCard');

  // History panel displays ONLY for 'basic' mode
  if (mode === 'basic') {
    calcDisplay.style.display = 'flex';
    historyCard.style.display = 'flex';
    mainLayout.classList.add('has-history');
  } else if (mode === 'scientific') {
    calcDisplay.style.display = 'flex';
    historyCard.style.display = 'none';
    mainLayout.classList.remove('has-history');
  } else { // currency
    calcDisplay.style.display = 'none';
    historyCard.style.display = 'none';
    mainLayout.classList.remove('has-history');
  }

  resetCalc();
  renderKeypad();
}

// Keypad Configurations
function renderKeypad() {
  const container = document.getElementById('keypadContainer');
  container.className = '';

  if (currentMode === 'basic') {
    container.className = 'keypad keypad-basic';
    container.innerHTML = `
      <button class="btn btn-clear" onclick="handleInput('AC')">AC</button>
      <button class="btn btn-clear" onclick="handleInput('DEL')">DEL</button>
      <button class="btn btn-op" onclick="handleInput('%')">%</button>
      <button class="btn btn-op" onclick="handleInput('/')">&divide;</button>
      <button class="btn" onclick="handleInput('7')">7</button>
      <button class="btn" onclick="handleInput('8')">8</button>
      <button class="btn" onclick="handleInput('9')">9</button>
      <button class="btn btn-op" onclick="handleInput('*')">&times;</button>
      <button class="btn" onclick="handleInput('4')">4</button>
      <button class="btn" onclick="handleInput('5')">5</button>
      <button class="btn" onclick="handleInput('6')">6</button>
      <button class="btn btn-op" onclick="handleInput('-')">-</button>
      <button class="btn" onclick="handleInput('1')">1</button>
      <button class="btn" onclick="handleInput('2')">2</button>
      <button class="btn" onclick="handleInput('3')">3</button>
      <button class="btn btn-op" onclick="handleInput('+')">+</button>
      <button class="btn span-2" onclick="handleInput('0')">0</button>
      <button class="btn" onclick="handleInput('.')">.</button>
      <button class="btn btn-equals" onclick="handleInput('=')">=</button>
    `;
  } else if (currentMode === 'scientific') {
    container.className = 'keypad keypad-scientific';
    container.innerHTML = `
      <button class="btn btn-op" onclick="handleInput('sin')">sin</button>
      <button class="btn btn-op" onclick="handleInput('cos')">cos</button>
      <button class="btn btn-op" onclick="handleInput('tan')">tan</button>
      <button class="btn btn-clear" onclick="handleInput('AC')">AC</button>
      <button class="btn btn-clear" onclick="handleInput('DEL')">DEL</button>
      <button class="btn btn-op" onclick="handleInput('sqrt')">&radic;</button>
      <button class="btn btn-op" onclick="handleInput('pow')">x&sup2;</button>
      <button class="btn btn-op" onclick="handleInput('pi')">&pi;</button>
      <button class="btn btn-op" onclick="handleInput('(')">(</button>
      <button class="btn btn-op" onclick="handleInput(')')">)</button>
      <button class="btn" onclick="handleInput('7')">7</button>
      <button class="btn" onclick="handleInput('8')">8</button>
      <button class="btn" onclick="handleInput('9')">9</button>
      <button class="btn btn-op" onclick="handleInput('%')">%</button>
      <button class="btn btn-op" onclick="handleInput('/')">&divide;</button>
      <button class="btn" onclick="handleInput('4')">4</button>
      <button class="btn" onclick="handleInput('5')">5</button>
      <button class="btn" onclick="handleInput('6')">6</button>
      <button class="btn btn-op" onclick="handleInput('*')">&times;</button>
      <button class="btn btn-op" onclick="handleInput('-')">-</button>
      <button class="btn" onclick="handleInput('1')">1</button>
      <button class="btn" onclick="handleInput('2')">2</button>
      <button class="btn" onclick="handleInput('3')">3</button>
      <button class="btn btn-op" onclick="handleInput('+')">+</button>
      <button class="btn btn-equals" onclick="handleInput('=')">=</button>
      <button class="btn span-2" onclick="handleInput('0')">0</button>
      <button class="btn" onclick="handleInput('.')">.</button>
    `;
  } else if (currentMode === 'currency') {
    container.className = 'currency-panel';
    renderCurrencyUI();
  }
}

// Handle Calculator Inputs
function handleInput(val) {
  if (val === 'AC') {
    resetCalc();
  } else if (val === 'DEL') {
    if (isEvaluated) {
      resetCalc();
    } else {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '' || currentInput === '-') currentInput = '0';
    }
  } else if (val === '=') {
    calculateResult();
  } else if (['+', '-', '*', '/', '%'].includes(val)) {
    if (isEvaluated) isEvaluated = false;
    expression += currentInput + ' ' + val + ' ';
    currentInput = '0';
  } else if (['sin', 'cos', 'tan', 'sqrt', 'pow', 'pi'].includes(val)) {
    applyScientificFunction(val);
  } else {
    if (currentInput === '0' || isEvaluated) {
      currentInput = val;
      isEvaluated = false;
    } else {
      currentInput += val;
    }
  }
  updateDisplay();
}

function applyScientificFunction(fn) {
  let num = parseFloat(currentInput);
  if (isNaN(num)) return;

  let res = 0;
  let exprStr = '';

  switch (fn) {
    case 'sin':
      res = Math.sin((num * Math.PI) / 180);
      exprStr = `sin(${num})`;
      break;
    case 'cos':
      res = Math.cos((num * Math.PI) / 180);
      exprStr = `cos(${num})`;
      break;
    case 'tan':
      res = Math.tan((num * Math.PI) / 180);
      exprStr = `tan(${num})`;
      break;
    case 'sqrt':
      res = Math.sqrt(num);
      exprStr = `&radic;(${num})`;
      break;
    case 'pow':
      res = Math.pow(num, 2);
      exprStr = `${num}&sup2;`;
      break;
    case 'pi':
      res = Math.PI;
      exprStr = '&pi;';
      break;
  }

  res = Number(res.toFixed(8));
  if (currentMode === 'basic') addHistory(exprStr, res);
  currentInput = String(res);
  isEvaluated = true;
}

function calculateResult() {
  if (!expression && !currentInput) return;
  let fullExpr = expression + currentInput;
  try {
    let sanitizeExpr = fullExpr.replace(/&times;/g, '*').replace(/&divide;/g, '/');
    let res = eval(sanitizeExpr);
    res = Number(res.toFixed(8));

    // Only record history when using basic calculator
    if (currentMode === 'basic') {
      addHistory(fullExpr, res);
    }
    
    currentInput = String(res);
    expression = '';
    isEvaluated = true;
  } catch (e) {
    currentInput = 'Error';
    isEvaluated = true;
  }
}

function resetCalc() {
  currentInput = '0';
  expression = '';
  isEvaluated = false;
  updateDisplay();
}

function updateDisplay() {
  const currentDisp = document.getElementById('currentDisplay');
  const exprDisp = document.getElementById('exprDisplay');
  if (currentDisp && exprDisp) {
    currentDisp.innerText = currentInput;
    exprDisp.innerHTML = expression;
  }
}

// History Logic
function addHistory(expr, res) {
  history.unshift({ expr, res });
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = history
    .map(
      (item) => `
    <li class="history-item">
      <span class="expr">${item.expr} =</span>
      <span class="res">${item.res}</span>
    </li>
  `
    )
    .join('');
}

function clearHistory() {
  history = [];
  renderHistory();
}

// Currency Conversion Logic
function renderCurrencyUI() {
  const container = document.getElementById('keypadContainer');
  const convertedVal = (
    (fromAmount / exchangeRates[fromCurrency]) *
    exchangeRates[toCurrency]
  ).toFixed(2);

  container.innerHTML = `
    <div class="currency-group">
      <label>Amount & From Currency</label>
      <div class="currency-input-row">
        <input type="number" value="${fromAmount}" id="fromAmountInput" oninput="updateFromAmount(this.value)">
        <div class="flag-select-wrapper">
          <img src="https://flagcdn.com/w40/${currencyFlags[fromCurrency]}.png" class="flag-img" id="fromFlag" alt="Flag">
          <select id="fromCurrencySelect" onchange="updateCurrency('from', this.value)">
            ${Object.keys(exchangeRates)
              .map(
                (c) =>
                  `<option value="${c}" ${                     c === fromCurrency ? 'selected' : ''                   }>${c}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>
    </div>

    <button class="swap-rates-btn" onclick="swapCurrencies()">
      <i class="fa-solid fa-arrows-rotate"></i> Swap Currencies
    </button>

    <div class="currency-group">
      <label>Converted Amount & Status</label>
      <div class="currency-input-row">
        <input type="text" value="${convertedVal} ${toCurrency}" readonly>
        <div class="flag-select-wrapper">
          <img src="https://flagcdn.com/w40/${currencyFlags[toCurrency]}.png" class="flag-img" id="toFlag" alt="Flag">
          <select id="toCurrencySelect" onchange="updateCurrency('to', this.value)">
            ${Object.keys(exchangeRates)
              .map(
                (c) =>
                  `<option value="${c}" ${                     c === toCurrency ? 'selected' : ''                   }>${c}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>
    </div>
    
    <div class="rate-time-info" id="rateInfoText">
      &bull; Live rate: 1 ${fromCurrency} = ${(
    exchangeRates[toCurrency] / exchangeRates[fromCurrency]
  ).toFixed(4)} ${toCurrency}
    </div>
  `;
}

function updateFromAmount(val) {
  fromAmount = parseFloat(val) || 0;
  renderCurrencyUI();
}

function updateCurrency(type, code) {
  if (type === 'from') fromCurrency = code;
  if (type === 'to') toCurrency = code;
  renderCurrencyUI();
}

function swapCurrencies() {
  let temp = fromCurrency;
  fromCurrency = toCurrency;
  toCurrency = temp;
  renderCurrencyUI();
}

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data && data.rates) {
      exchangeRates = {
        USD: data.rates.USD || 1,
        EUR: data.rates.EUR || 0.92,
        GBP: data.rates.GBP || 0.79,
        INR: data.rates.INR || 83.5,
        JPY: data.rates.JPY || 155.2
      };
      if (currentMode === 'currency') renderCurrencyUI();
    }
  } catch (err) {
    console.warn('Using fallback exchange rates.');
  }
}
