// ─── State ────────────────────────────────────────────────────────────────────
// Identical to original
let colorsArray = [];

// Token scale labels — maps array index to Tailwind-style design token names
const tokenScale = ["100", "300", "500", "700", "900"];

// ─── WCAG Contrast Helpers ────────────────────────────────────────────────────
// Pure JS math — no extra API needed
// Formula source: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function toLinear(c) {
  // Linearise an sRGB channel value
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

// ─── Render ───────────────────────────────────────────────────────────────────
// Updated from original: adds token label + WCAG contrast badges per swatch
// Core loop and innerHTML strategy identical

function renderColors() {
  let html = "";

  for (let i = 0; i < colorsArray.length; i++) {
    const color = colorsArray[i];
    const cleanHex = color.hex.value;
    const token = `--brand-${tokenScale[i] || (i + 1) * 100}`;

    // Contrast against pure white and pure black
    const vsWhite = getContrastRatio(cleanHex, "#FFFFFF");
    const vsBlack = getContrastRatio(cleanHex, "#000000");
    const passWhite = vsWhite >= 4.5; // WCAG AA normal text threshold
    const passBlack = vsBlack >= 4.5;

    html += `
            <div class="color-column"
                 style="background-color: ${cleanHex}"
                onclick="copyToClipboard('${cleanHex}', '${token}')">
                <div class="color-info">
                    <span class="token-name">${token}</span>
                    <span class="hex-text">${cleanHex}</span>
                    <div class="contrast-badges">
                        <span class="badge ${passWhite ? "pass" : "fail"}">
                            ${passWhite ? "✓" : "✗"} White ${vsWhite}:1
                        </span>
                        <span class="badge ${passBlack ? "pass" : "fail"}">
                            ${passBlack ? "✓" : "✗"} Black ${vsBlack}:1
                        </span>
                    </div>
                </div>
            </div>
        `;
  }

  document.getElementById("palette-container").innerHTML = html;
}

// ─── Copy single hex ──────────────────────────────────────────────────────────
// Identical to original, extended with optional label param for token copy

function copyToClipboard(text, label) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const toast = document.getElementById("toast-notification");
      toast.innerText = label
        ? `Copied ${label}!`
        : `Copied ${text} to clipboard!`;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
    })
    .catch((err) => console.error("Could not copy text: ", err));
}

// ─── Copy all as CSS tokens ───────────────────────────────────────────────────
// New: builds a :root { } block from current colorsArray and copies it

function copyAllAsTokens() {
  if (colorsArray.length === 0) {
    alert("Generate a palette first.");
    return;
  }

  const lines = colorsArray.map((color, i) => {
    const token = `--brand-${tokenScale[i] || (i + 1) * 100}`;
    return `  ${token}: ${color.hex.value};`;
  });

  const cssBlock = `:root {\n${lines.join("\n")}\n}`;
  copyToClipboard(cssBlock, "CSS tokens");
}

// ─── Initial fetch ────────────────────────────────────────────────────────────
// Identical to original — loads default palette on page open

function getColorScheme() {
  const seedColor = "0047AB";
  const mode = "monochrome";
  const count = 5;

  fetch(
    `https://thecolorapi.com/scheme?hex=${seedColor}&mode=${mode}&count=${count}`,
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    })
    .catch((err) => {
      console.error(
        "Initial load failed. Check your internet connection:",
        err,
      );

      // Identical fallback from original
      colorsArray = [
        { hex: { value: "#0047AB" } },
        { hex: { value: "#1E3A8A" } },
        { hex: { value: "#3B82F6" } },
        { hex: { value: "#60A5FA" } },
        { hex: { value: "#93C5FD" } },
      ];
      renderColors();
    });
}

// ─── Shared fetch helper ─────────────────────────────────────────────────────
// Extracted so both the form submit and the color picker call the same logic
// without duplicating the fetch + state update + render pattern

function fetchScheme(hex, mode) {
  fetch(`https://thecolorapi.com/scheme?hex=${hex}&mode=${mode}&count=5`)
    .then((res) => res.json())
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    })
    .catch((err) => console.error(err));
}

// ─── Form submit ──────────────────────────────────────────────────────────────
// Now delegates to fetchScheme() instead of inlining the fetch

document.getElementById("color-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const hex =
    document.getElementById("color-picker").value.replace("#", "") || "0047AB";
  const mode = document.getElementById("scheme-select").value || "monochrome";
  fetchScheme(hex, mode);
});

// ─── Color picker live update ─────────────────────────────────────────────────
// "change" fires once when the user commits a color selection
// "input" would fire on every drag pixel and hammer the API unnecessarily

document.getElementById("color-picker").addEventListener("change", function () {
  const hex = this.value.replace("#", "") || "0047AB";
  const mode = document.getElementById("scheme-select").value || "monochrome";
  fetchScheme(hex, mode);
});

document
  .getElementById("scheme-select")
  .addEventListener("change", function () {
    const hex =
      document.getElementById("color-picker").value.replace("#", "") ||
      "0047AB";
    fetchScheme(hex, this.value);
  });

// ─── Dark mode ────────────────────────────────────────────────────────────────
// Identical to original

document
  .getElementById("dark-mode-toggle")
  .addEventListener("change", function (e) {
    if (e.target.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
  });

function initializeDarkMode() {
  const darkModeSetting = localStorage.getItem("darkMode");
  const toggleCheckbox = document.getElementById("dark-mode-toggle");

  if (darkModeSetting === "enabled") {
    document.body.classList.add("dark-mode");
    toggleCheckbox.checked = true;
  }
}

// ─── Startup ──────────────────────────────────────────────────────────────────
// Identical to original
initializeDarkMode();
getColorScheme();
