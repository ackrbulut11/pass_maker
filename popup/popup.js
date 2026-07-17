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

  // Load state and trigger initial generation
  loadState((state) => {
    syncSliderAndInput(state.length);
    toggleNumbers.checked = state.numbers;
    toggleSymbols.checked = state.symbols;
    switchPasswordType(state.mode, true);
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
  btnRefresh.addEventListener('click', generateAndDisplay);
});
