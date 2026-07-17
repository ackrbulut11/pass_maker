# Pass Maker

A simple Chrome Extension for generating secure random passwords and PINs.

## Features

- Generate random passwords (8 - 32 characters, using CSPRNG with category guarantees)
- Generate numeric PINs (4 - 24 digits)
- Customize password length
- Include or exclude numbers and symbols
- Password strength indicator 
- Temporary local history (saves last 3 copied passwords, hides when empty, auto-deletes after 3 minutes)
- Automatic dark mode support (adapts to browser/system preferences)
- One-click copy to clipboard
- Refresh to generate a new password

## Preview

<img src="assets/ss_PassMaker.png" alt="Pass Maker Screenshot" width="320">

## Installation

1. Clone this repository.
2. Open **Chrome** and go to `chrome://extensions/`
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project folder.

## Usage

1. Open the extension.
2. Choose **Random** or **PIN**.
3. Adjust the settings.
4. Copy the generated password with a single click.

## Technologies

- HTML
- CSS
- JavaScript
- Chrome Extensions API

## License

Apache 2.0
