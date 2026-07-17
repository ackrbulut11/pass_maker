/**
 * pass_maker - Cryptographically Secure Password Generator
 * Client-side only. Pure Javascript.
 */

const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Returns a cryptographically secure random integer in the range [0, max - 1].
 * Uses window.crypto.getRandomValues().
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(max) {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm and CSPRNG.
 * @param {Array} array
 * @returns {Array}
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Generates a secure random password of specified length.
 * Guarantees at least 1 character from each active category.
 * @param {number} length
 * @param {boolean} includeNumbers
 * @param {boolean} includeSymbols
 * @returns {string}
 */
function generatePassword(length, includeNumbers, includeSymbols) {
  const pools = [CHARS.lower, CHARS.upper];
  const guaranteed = [];

  // Guarantee at least one lowercase and one uppercase letter
  guaranteed.push(CHARS.lower[getRandomInt(CHARS.lower.length)]);
  guaranteed.push(CHARS.upper[getRandomInt(CHARS.upper.length)]);

  if (includeNumbers) {
    pools.push(CHARS.numbers);
    guaranteed.push(CHARS.numbers[getRandomInt(CHARS.numbers.length)]);
  }
  
  if (includeSymbols) {
    pools.push(CHARS.symbols);
    guaranteed.push(CHARS.symbols[getRandomInt(CHARS.symbols.length)]);
  }

  // Ensure length is at least the size of guaranteed characters
  const finalLength = Math.max(length, guaranteed.length);
  const combinedPool = pools.join('');
  const passwordChars = [...guaranteed];

  // Fill the remaining length with random choices from the active pool
  for (let i = passwordChars.length; i < finalLength; i++) {
    passwordChars.push(combinedPool[getRandomInt(combinedPool.length)]);
  }

  // Shuffle the resulting password array using CSPRNG Fisher-Yates
  return shuffleArray(passwordChars).join('');
}

/**
 * Generates a PIN containing only numbers.
 * @param {number} length
 * @returns {string}
 */
function generatePin(length) {
  const pinChars = [];
  for (let i = 0; i < length; i++) {
    pinChars.push(CHARS.numbers[getRandomInt(CHARS.numbers.length)]);
  }
  return pinChars.join('');
}

/**
 * Reads UI state, generates the password/PIN, and displays it in the DOM.
 */
let localHistory = [];
const HISTORY_EXPIRY_MS = 180000; // 3 minutes

/**
 * Loads history from chrome.storage.local.
 */
function loadHistory(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['passwordHistory'], (result) => {
      localHistory = result.passwordHistory || [];
      callback(localHistory);
    });
  } else {
    callback(localHistory);
  }
}

/**
 * Saves localHistory to chrome.storage.local.
 */
function saveHistory() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ passwordHistory: localHistory });
  }
}

/**
 * Adds a generated password to the history list (caps at 5 items).
 * @param {string} password
 */
function addToHistory(password) {
  // Silent prune first
  pruneExpiredHistory(true);

  // Avoid duplicate consecutive additions
  if (localHistory.length > 0 && localHistory[0].password === password) {
    return;
  }

  localHistory.unshift({
    password: password,
    timestamp: Date.now()
  });

  if (localHistory.length > 3) {
    localHistory.pop();
  }

  saveHistory();
  renderHistory();
}

/**
 * Clears the stored password history.
 */
function clearHistory() {
  localHistory = [];
  saveHistory();
  renderHistory();
}

/**
 * Prunes expired items (older than 3 minutes) from localHistory.
 * @param {boolean} [silent=false] If true, skip re-rendering.
 */
function pruneExpiredHistory(silent = false) {
  const now = Date.now();
  const originalLength = localHistory.length;

  localHistory = localHistory.filter(item => (now - item.timestamp) < HISTORY_EXPIRY_MS);

  if (localHistory.length !== originalLength) {
    saveHistory();
    if (!silent) {
      renderHistory();
    }
  } else if (!silent) {
    // Re-render anyway to refresh the relative time text (e.g. "Just now" to "1m ago")
    renderHistory();
  }
}

/**
 * Helper to mask passwords for security (e.g. pa••••12 or •••• for short strings).
 * @param {string} pwd
 * @returns {string}
 */
function maskPassword(pwd) {
  if (pwd.length <= 4) {
    return '••••';
  }
  return pwd.substring(0, 2) + '••••' + pwd.substring(pwd.length - 2);
}

/**
 * Formats timestamps to friendly relative time labels.
 * @param {number} timestamp
 * @returns {string}
 */
function getRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

/**
 * Dynamically renders the password history items in the UI.
 */
/**
 * Dynamically renders the password history items in the UI.
 */
function renderHistory() {
  const historyList = document.getElementById('history-list');
  const historySection = document.getElementById('history-section');
  if (!historyList) return;

  historyList.innerHTML = '';

  if (localHistory.length === 0) {
    if (historySection) {
      historySection.classList.add('hidden');
    }
    return;
  } else {
    if (historySection) {
      historySection.classList.remove('hidden');
    }
  }

  localHistory.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'history-item';

    // Left Container: Password & Time label
    const leftDiv = document.createElement('div');
    leftDiv.className = 'history-item-left';

    const pwdSpan = document.createElement('span');
    pwdSpan.className = 'history-pwd';
    pwdSpan.textContent = maskPassword(item.password);
    pwdSpan.dataset.revealed = 'false';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'history-time';
    timeSpan.textContent = getRelativeTime(item.timestamp);

    leftDiv.appendChild(pwdSpan);
    leftDiv.appendChild(timeSpan);

    // Right Container: Action icon buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'history-actions';

    // Reveal toggle (Eye) button
    const btnEye = document.createElement('button');
    btnEye.className = 'btn-action-sm';
    btnEye.title = 'Reveal password';
    btnEye.ariaLabel = 'Reveal password';
    btnEye.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    btnEye.addEventListener('click', () => {
      const isRevealed = pwdSpan.dataset.revealed === 'true';
      if (isRevealed) {
        pwdSpan.textContent = maskPassword(item.password);
        pwdSpan.dataset.revealed = 'false';
        btnEye.title = 'Reveal password';
        btnEye.ariaLabel = 'Reveal password';
        btnEye.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      } else {
        pwdSpan.textContent = item.password;
        pwdSpan.dataset.revealed = 'true';
        btnEye.title = 'Hide password';
        btnEye.ariaLabel = 'Hide password';
        btnEye.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      }
    });

    // Copy button
    const btnCopy = document.createElement('button');
    btnCopy.className = 'btn-action-sm';
    btnCopy.title = 'Copy password';
    btnCopy.ariaLabel = 'Copy password';
    btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(item.password)
        .then(() => {
          btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          setTimeout(() => {
            btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="action-icon-sm"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
          }, 1500);
        })
        .catch(err => console.error("Failed to copy history item:", err));
    });

    actionsDiv.appendChild(btnEye);
    actionsDiv.appendChild(btnCopy);

    itemDiv.appendChild(leftDiv);
    itemDiv.appendChild(actionsDiv);

    historyList.appendChild(itemDiv);
  });
}

/**
 * Reads UI state, generates the password/PIN, and displays it in the DOM.
 */
function generateAndDisplay() {
  const slider = document.getElementById('length-slider');
  const toggleNumbers = document.getElementById('toggle-numbers');
  const toggleSymbols = document.getElementById('toggle-symbols');
  const display = document.getElementById('password-display');
  const isRandomActive = document.getElementById('tab-random').classList.contains('active');

  const length = parseInt(slider.value, 10);
  let result = '';

  if (isRandomActive) {
    result = generatePassword(length, toggleNumbers.checked, toggleSymbols.checked);
  } else {
    result = generatePin(length);
  }

  display.textContent = result;

  // Calculate and update password strength indicator
  updatePasswordStrength(result, isRandomActive);
}

/**
 * Calculates entropy and updates the strength bar UI dynamically.
 * @param {string} password
 * @param {boolean} isRandomActive
 */
function updatePasswordStrength(password, isRandomActive) {
  const bar = document.getElementById('strength-bar');
  const status = document.getElementById('strength-status');
  if (!bar || !status) return;

  if (!password || password === 'Generating...') {
    bar.style.width = '0%';
    bar.style.backgroundColor = '#cbd5e1';
    status.textContent = '-';
    status.style.color = 'var(--color-text-muted)';
    return;
  }

  let poolSize = 0;
  if (!isRandomActive) {
    // PIN mode
    poolSize = 10;
  } else {
    // Random mode: find pool size based on character variety
    const hasLower = [...password].some(c => CHARS.lower.includes(c));
    const hasUpper = [...password].some(c => CHARS.upper.includes(c));
    const toggleNumbers = document.getElementById('toggle-numbers');
    const toggleSymbols = document.getElementById('toggle-symbols');

    if (hasLower) poolSize += CHARS.lower.length;
    if (hasUpper) poolSize += CHARS.upper.length;
    if (toggleNumbers && toggleNumbers.checked) poolSize += CHARS.numbers.length;
    if (toggleSymbols && toggleSymbols.checked) poolSize += CHARS.symbols.length;
    
    if (poolSize === 0) poolSize = 52; // Fallback to basic letters
  }

  const length = password.length;
  const entropy = length * Math.log2(poolSize);

  // Map entropy to percentage (maxing out at 120 bits = 100%)
  const percentage = Math.min(100, Math.max(5, Math.floor((entropy / 120) * 100)));
  bar.style.width = `${percentage}%`;

  let label = '';
  let color = '';

  if (entropy < 60) {
    label = 'Weak';
    color = '#ef4444'; // Red
  } else if (entropy < 80) {
    label = 'Medium';
    color = '#f97316'; // Orange
  } else if (entropy < 110) {
    label = 'Strong';
    color = '#2563eb'; // Blue
  } else {
    label = 'Very Strong';
    color = '#22c55e'; // Green
  }

  status.textContent = label;
  status.style.color = color;
  bar.style.backgroundColor = color;
}

/**
 * Synchronizes the Range Slider and Number Input controls.
 * @param {number} value
 */
function syncSliderAndInput(value) {
  const slider = document.getElementById('length-slider');
  const input = document.getElementById('length-input');

  if (slider && slider.value != value) {
    slider.value = value;
  }
  if (input && input.value != value) {
    input.value = value;
  }
}

/**
 * Switched between Random and PIN password generation modes.
 * @param {'random'|'pin'} type
 * @param {boolean} [skipSave=false]
 */
function switchPasswordType(type, skipSave = false) {
  const tabRandom = document.getElementById('tab-random');
  const tabPin = document.getElementById('tab-pin');
  const optionsContainer = document.getElementById('options-container');
  const slider = document.getElementById('length-slider');
  const input = document.getElementById('length-input');

  let currentVal = parseInt(slider.value, 10) || 24;

  if (type === 'random') {
    slider.min = 8;
    slider.max = 32;
    input.min = 8;
    input.max = 32;
    if (currentVal < 8) currentVal = 8;
    if (currentVal > 32) currentVal = 32;

    tabRandom.classList.add('active');
    tabRandom.setAttribute('aria-selected', 'true');
    tabPin.classList.remove('active');
    tabPin.setAttribute('aria-selected', 'false');
    optionsContainer.classList.remove('hidden');
  } else {
    slider.min = 4;
    slider.max = 24;
    input.min = 4;
    input.max = 24;
    if (currentVal < 4) currentVal = 4;
    if (currentVal > 24) currentVal = 24;

    tabPin.classList.add('active');
    tabPin.setAttribute('aria-selected', 'true');
    tabRandom.classList.remove('active');
    tabRandom.setAttribute('aria-selected', 'false');
    optionsContainer.classList.add('hidden');
  }

  syncSliderAndInput(currentVal);
  generateAndDisplay();
  if (!skipSave) {
    saveState();
  }
}

/**
 * Saves current generator settings to local storage.
 */
function saveState() {
  const isRandomActive = document.getElementById('tab-random').classList.contains('active');
  const slider = document.getElementById('length-slider');
  const toggleNumbers = document.getElementById('toggle-numbers');
  const toggleSymbols = document.getElementById('toggle-symbols');

  const state = {
    mode: isRandomActive ? 'random' : 'pin',
    length: parseInt(slider.value, 10),
    numbers: toggleNumbers.checked,
    symbols: toggleSymbols.checked
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(state);
  }
}

/**
 * Loads generator settings from local storage, falling back to defaults.
 * @param {function} callback
 */
function loadState(callback) {
  const defaults = {
    mode: 'random',
    length: 24,
    numbers: true,
    symbols: true
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(Object.keys(defaults), (result) => {
      const state = { ...defaults, ...result };
      callback(state);
    });
  } else {
    // Local fallback for standalone testing
    callback(defaults);
  }
}

/**
 * Copies the current password text to the clipboard and handles visual feedback.
 */
function copyToClipboard() {
  const display = document.getElementById('password-display');
  const btnCopy = document.getElementById('btn-copy');
  
  if (!display || !btnCopy) return;

  const text = display.textContent;
  if (!text || text === 'Generating...') return;

  navigator.clipboard.writeText(text)
    .then(() => {
      const originalText = btnCopy.textContent;
      btnCopy.textContent = 'Copied!';
      btnCopy.style.backgroundColor = '#16a34a'; // Success green background feedback
      
      addToHistory(text); // Add to history on copy success!

      setTimeout(() => {
        btnCopy.textContent = originalText;
        btnCopy.style.backgroundColor = ''; // Reverts back to CSS rule
      }, 1500);
    })
    .catch((err) => {
      console.error('Failed to copy password: ', err);
    });
}

// Bind event listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const tabRandom = document.getElementById('tab-random');
  const tabPin = document.getElementById('tab-pin');
  const slider = document.getElementById('length-slider');
  const input = document.getElementById('length-input');
  const toggleNumbers = document.getElementById('toggle-numbers');
  const toggleSymbols = document.getElementById('toggle-symbols');
  const btnCopy = document.getElementById('btn-copy');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Load configuration, load history, and trigger initial setup
  loadState((state) => {
    syncSliderAndInput(state.length);
    toggleNumbers.checked = state.numbers;
    toggleSymbols.checked = state.symbols;
    
    loadHistory(() => {
      pruneExpiredHistory(true); // Silent prune expired on startup
      renderHistory();
      switchPasswordType(state.mode, true);
    });
  });

  // Event bindings
  tabRandom.addEventListener('click', () => switchPasswordType('random'));
  tabPin.addEventListener('click', () => switchPasswordType('pin'));

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value, 10);
    syncSliderAndInput(val);
    generateAndDisplay();
    saveState();
  });

  input.addEventListener('input', () => {
    const val = parseInt(input.value, 10);
    const min = parseInt(input.min, 10) || 8;
    const max = parseInt(input.max, 10) || 32;
    if (!isNaN(val) && val >= min && val <= max) {
      syncSliderAndInput(val);
      generateAndDisplay();
      saveState();
    }
  });

  input.addEventListener('change', () => {
    let val = parseInt(input.value, 10);
    const min = parseInt(input.min, 10) || 8;
    const max = parseInt(input.max, 10) || 32;
    if (isNaN(val) || val < min) val = min;
    if (val > max) val = max;
    syncSliderAndInput(val);
    generateAndDisplay();
    saveState();
  });

  toggleNumbers.addEventListener('change', () => {
    generateAndDisplay();
    saveState();
  });

  toggleSymbols.addEventListener('change', () => {
    generateAndDisplay();
    saveState();
  });

  btnCopy.addEventListener('click', copyToClipboard);
  btnRefresh.addEventListener('click', () => generateAndDisplay());
  
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', clearHistory);
  }

  // Auto-prune expired history and refresh time labels every 15 seconds
  setInterval(() => {
    pruneExpiredHistory(false);
  }, 15000);
});
