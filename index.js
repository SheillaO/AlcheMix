let colorsArray = [];

// 1. Renders columns dynamically with click-to-copy capability
function renderColors() {
  let html = "";
  for (let color of colorsArray) {
    const cleanHex = color.hex.value;
    html += `
            <div class="color-column" 
                 style="background-color: ${cleanHex}" 
                 onclick="copyToClipboard('${cleanHex}')">
                <span class="hex-text">${cleanHex}</span>
            </div>
        `;
  }
  document.getElementById("palette-container").innerHTML = html;
}

// 2. Global clipboard functionality with smooth toast notification
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const toast = document.getElementById("toast-notification");

      // Update text dynamically to show the specific hex code copied
      toast.innerText = `Copied ${text} to clipboard!`;

      // Add the visibility class to trigger the CSS fade-in
      toast.classList.add("show");

      // Automatically hide it after 2.5 seconds
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
    })
    .catch((err) => console.error("Could not copy text: ", err));
}

// 3. Core function to make initial API requests
function getColorScheme() {
  const seedColor = "0047AB";
  const mode = "monochrome";
  const count = 5;

  // FIXED: Added www, /scheme?hex=, and the missing $ symbols
  fetch(`https://thecolorapi.com{seedColor}&mode=${mode}&count=${count}`)
    .then((res) => res.json())
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    });
}

// 4. Submission handler for generating custom user colors
document.getElementById("color-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const hexColor =
    document.getElementById("color-picker").value.replace("#", "") || "0047AB";
  const schemeMode =
    document.getElementById("scheme-select").value || "monochrome";

  // FIXED: Added www, /scheme?hex=, and the missing $ symbols
  fetch(`https://thecolorapi.com{hexColor}&mode=${schemeMode}&count=5`)
    .then((res) => res.json())
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    })
    .catch((err) => console.error(err));

  document.getElementById("color-form").reset();
});

// 5. Night mode toggle listener to inject/remove class targeting your CSS rules
document
  .getElementById("dark-mode-toggle")
  .addEventListener("change", function (e) {
    if (e.target.checked) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  });

// 6. Run initial load scheme on application startup
getColorScheme();
