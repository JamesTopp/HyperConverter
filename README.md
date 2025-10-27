# HyperConverter

**Instant, cursor-enabled unit conversions—right where you need them.**

Stop switching tabs to convert measurements. HyperConverter detects units on any webpage and shows conversions in a clean tooltip near your cursor. Like Metric ⇄ Imperial, instantly. Whether you're shopping internationally, reading technical specs, or following a recipe, get the measurements you need without breaking your flow.

**Key Features:**

- **Hover & convert** — Just move your cursor over any measurement
- **Smart detection** — Recognizes common units automatically (inches, meters, pounds, kilograms, etc.)
- **Lightning fast** — All conversions happen locally in your browser
- **Privacy-first** — Zero data sent to external servers
- **Selective control** — Enable or disable per website via the popup

## 🎬 See it in Action

![Demo GIF](images/demo.gif)

*HyperConverter tooltip appearing on hover*

<details>
<summary>More Screenshots</summary>

![Tooltip Example](images/screenshot-tooltip.png)
*Clean, unobtrusive tooltip design*

![Options Page](images/screenshot-options.png)
*Simple configuration options*

</details>

## 📦 Installation

## From Chrome Web Store (Recommended)

**[Add to Chrome →](your-chrome-web-store-link)**

Click "Add to Chrome" and you're ready to go.

## Manual Installation (Developer Mode)

1. Download the latest release from [Releases](https://github.com/jamestopp/hyperconverter/releases)
2. Unzip the file
3. Open `chrome://extensions/` in Chrome
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the unzipped folder

## 🔒 Permissions & Privacy

**We take your privacy seriously.**

- **Minimal permissions** — Only what's needed to detect text and show tooltips
- **100% local processing** — All conversions happen in your browser
- **No tracking** — We don't collect, store, or transmit your browsing data
- **No external servers** — Your data never leaves your device

[Read our full Privacy Policy →](PRIVACY.md)
```

## 🛠️ Technical Details

## Quick Start

For transparency and those curious about how HyperConverter works:

## Project Structure

```
├── content.js            # Content script (runs on web pages)
├── icon.png              # Extension icon
├── images/               # Folder containing extension assets
├── manifest.json         # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality script
├── PRIVACY.md            # Privacy policy documentation
└── README.md             # Project documentation
```

## 📋 Supported Units

HyperConverter currently supports conversions between:

**Length & Distance:**
- Inches ⇄ Centimeters, Millimeters
- Feet ⇄ Centimeters, Meters
- Yards ⇄ Meters
- Miles ⇄ Kilometers
- Millimeters ⇄ Inches
- Centimeters ⇄ Inches, Feet
- Meters ⇄ Feet, Yards
- Kilometers ⇄ Miles

**Weight & Mass:**
- Ounces ⇄ Grams
- Pounds ⇄ Kilograms, Grams
- Grams ⇄ Ounces, Pounds
- Kilograms ⇄ Pounds

**Volume:**
- Teaspoons ⇄ Milliliters
- Tablespoons ⇄ Milliliters
- Cups ⇄ Milliliters, Liters
- Gallons ⇄ Liters
- Milliliters ⇄ Teaspoons, Tablespoons, Cups
- Liters ⇄ Cups, Gallons

**Temperature:**
- Fahrenheit ⇄ Celsius
- Celsius ⇄ Fahrenheit

**Area:**
- Square inches ⇄ Square centimeters
- Square feet ⇄ Square meters

**Volume (3D):**
- Cubic inches ⇄ Cubic centimeters
- Cubic feet ⇄ Cubic meters

*More units and conversions coming in future updates!*

## 🐛 Troubleshooting

**Extension not converting measurements?**

- Verify the extension is enabled (check the puzzle icon in Chrome)
- Ensure you've granted necessary permissions for the website
- Refresh the page after enabling
- Check if the measurement format is supported

**Tooltip appearing in the wrong place?**

- This can happen on pages with complex layouts. I'm working on improvements!

**Found a bug?** Let me know in the popup!

## 📦 Releases & Versioning

We use semantic versioning (`v1.0.0`) and publish releases on GitHub.

**Latest Release:** [Download here](https://github.com/jamestopp/hyperconverter/releases/latest)

For manual installation, download the `.zip` file from Releases.

## © Copyright

Copyright © 2025 James Topp. All rights reserved.

## 💬 Contact & Support

- **Bug reports & feature requests:** [GitHub Issues](https://github.com/jamestopp/hyperconverter/issues)
- **Business inquiries:** itsjamestopp@gmail.com
- **Discussions:** [GitHub Discussions](https://github.com/jamestopp/hyperconverter/discussions)

## 🙏 Acknowledgments

Built with passion for a frictionless browsing experience. Special thanks to all early users!

**Enjoy HyperConverter? [Leave a review on the Chrome Web Store!](your-chrome-web-store-link)**

*Made with love by James (https://jamestopp.github.io/)*