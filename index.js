let colorsArray = [];


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


function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const toast = document.getElementById("toast-notification");

     
      toast.innerText = `Copied ${text} to clipboard!`;

   
      toast.classList.add("show");

      
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
    })
    .catch((err) => console.error("Could not copy text: ", err));
}


function getColorScheme() {
  const seedColor = "0047AB";
  const mode = "monochrome";
  const count = 5;

 
  fetch(`https://thecolorapi.com{seedColor}&mode=${mode}&count=${count}`)
    .then((res) => res.json())
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    });
}


document.getElementById("color-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const hexColor =
    document.getElementById("color-picker").value.replace("#", "") || "0047AB";
  const schemeMode =
    document.getElementById("scheme-select").value || "monochrome";

  
  fetch(`https://thecolorapi.com{hexColor}&mode=${schemeMode}&count=5`)
    .then((res) => res.json())
    .then((data) => {
      colorsArray = data.colors;
      renderColors();
    })
    .catch((err) => console.error(err));

  document.getElementById("color-form").reset();
});


document
  .getElementById("dark-mode-toggle")
  .addEventListener("change", function (e) {
    if (e.target.checked) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  });


getColorScheme();
