const el = {
  password: document.getElementById('password'),
  length: document.getElementById('length'),
  lenVal: document.getElementById('lenVal'),
  upper: document.getElementById('upper'),
  lower: document.getElementById('lower'),
  digits: document.getElementById('digits'),
  symbols: document.getElementById('symbols'),
  generate: document.getElementById('generate'),
  copyBtn: document.getElementById('copyBtn'),
  copyIcon: document.getElementById('copyIcon'),
  toast: document.getElementById('toast'),
  strengthBar: document.getElementById('strengthBar'),
};

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
};

function getRandomInt(max) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function generate() {
  const pools = [];
  if (el.upper.checked) pools.push(SETS.upper);
  if (el.lower.checked) pools.push(SETS.lower);
  if (el.digits.checked) pools.push(SETS.digits);
  if (el.symbols.checked) pools.push(SETS.symbols);

  if (pools.length === 0) {
    el.password.value = '';
    showToast('En az bir seçenek seçin');
    return;
  }

  const all = pools.join('');
  const len = parseInt(el.length.value, 10);
  let pwd = '';

  for (let i = 0; i < pools.length && i < len; i++) {
    pwd += pools[i][getRandomInt(pools[i].length)];
  }
  for (let i = pwd.length; i < len; i++) {
    pwd += all[getRandomInt(all.length)];
  }

  pwd = shuffle(pwd);
  el.password.value = pwd;
  updateStrength(len, pools.length);
}

function shuffle(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function updateStrength(len, variety) {
  const score = Math.min(100, len * 3 + variety * 8);
  let color;
  if (score < 40) color = '#f38ba8';
  else if (score < 70) color = '#f9e2af';
  else color = '#a6e3a1';
  el.strengthBar.style.width = score + '%';
  el.strengthBar.style.background = color;
}

function copy() {
  const pwd = el.password.value;
  if (!pwd) return;
  navigator.clipboard.writeText(pwd).then(() => showToast('Kopyalandı!'));
}

function showToast(msg) {
  el.toast.textContent = msg;
  setTimeout(() => { el.toast.textContent = ''; }, 1500);
}

el.length.addEventListener('input', () => {
  el.lenVal.textContent = el.length.value;
});
el.generate.addEventListener('click', generate);
el.copyBtn.addEventListener('click', copy);
el.copyIcon.addEventListener('click', copy);

generate();
