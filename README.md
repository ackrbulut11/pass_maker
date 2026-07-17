# pass_maker

`pass_maker` is a premium, modern, and cryptographically secure random password and PIN generator Chrome extension built using **Manifest V3**. It runs entirely client-side with zero external dependencies and zero background service workers.

---

## 🌟 Features

- **Cryptographically Secure (CSPRNG)**: Utilizes `window.crypto.getRandomValues()` instead of `Math.random()` for secure entropy generation.
- **Character set guarantees**: Ensures at least one character from each active category (lowercase, uppercase, numbers, and symbols) is present in the final password.
- **Adaptive PIN / Password Modes**: 
  - **Random Mode**: Ranges from `8` to `32` characters.
  - **PIN Mode**: Purely numeric, ranging from `4` to `24` digits.
- **Password Strength Indicator**: Dynamically calculates Shannon Entropy ($E = L \times \log_2(R)$) and displays ratings (**Weak**, **Medium**, **Strong**, **Very Strong**) with corresponding colors.
- **Temporary Local History**:
  - Saves the last **3 copied** passwords/PINs securely in `chrome.storage.local`.
  - Automatically hides when the history is empty.
  - Masks passwords by default (`pa••••12`) with an eye-icon to reveal/hide.
  - Auto-prunes and deletes history items older than **3 minutes** for privacy.
- **Automatic Dark Mode**: Adapts dynamically to browser/system preferences using standard CSS media queries.
- **No Scrollbars Layout**: Body heights and element spacings are optimized (`overflow: hidden`) to ensure the extension window dynamically sizes without scrollbars.

---

## 📁 Directory Structure

```text
pass_maker/
├── .gitignore
├── README.md
├── LICENSE
├── manifest.json
├── icons/
│   ├── pass_maker.png   # Source icon
│   ├── icon16.png        # Action icon (16x16)
│   ├── icon48.png        # Action icon (48x48)
│   └── icon128.png       # Action icon (128x128)
└── popup/
    ├── popup.html        # Clean HTML markup
    ├── popup.css         # Modern, responsive stylesheet
    └── popup.js          # Modular JavaScript logic
```

---

## ⚙️ Installation

1. Open Google Chrome and navigate to the extensions management page: `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** (Paketlenmemiş öğe yükle) button in the top-left corner.
4. Select the root folder of this repository (`C:\Users\ackrb\projects\pass_maker`).
5. The extension is now loaded! Pin the `pass_maker` icon to the toolbar to access it quickly.

---

## 🛠️ Code Modularity

The [popup/popup.js](popup/popup.js) file is structured into clean modular functions:

- `generatePassword(length, includeNumbers, includeSymbols)`: CSPRNG generator with category guarantees.
- `generatePin(length)`: Numeric-only sequence generator.
- `shuffleArray(array)`: Fisher-Yates shuffle algorithm using Web Crypto API.
- `updatePasswordStrength(password, isRandomActive)`: Entropy calculator and visual updater.
- `copyToClipboard()`: Writes to clipboard with dynamic button states and history triggers.
- `syncSliderAndInput(value)`: Handles two-way binding of bounds.
- `switchPasswordType(type, skipSave)`: Dynamic tab switcher and UI component toggling.
- `addToHistory(password)`: Appends to the history buffer and triggers storage save.
- `clearHistory()`: Wipes local history.
- `pruneExpiredHistory(silent)`: Auto-clears entries older than 3 minutes.
- `renderHistory()`: Dynamically builds the history list and handles eye-reveal buttons.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
