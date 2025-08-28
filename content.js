// Inject Popup HTML
function createPopup() {
  const popup = document.createElement("div");
  popup.id = "translate-popup";
  popup.style.position = "absolute";
  popup.style.display = "none"; // default hidden

  popup.innerHTML = `
    <div id="popup-header">
      <span>AI Translator</span>
      <div>
        <select id="fromLang" class="lang-select">
          <option value="auto">Auto</option>
          <option value="en">English</option>
          <option value="ur">Urdu</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
        →
        <select id="toLang" class="lang-select">
          <option value="en">English</option>
          <option value="ur">Urdu</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>
      <button id="close-btn">x</button>
    </div>
    <div id="popup-result">Select text to translate...</div>
    <div id="popup-footer">
      <button id="copy-btn">Copy Text</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Prevent inside popup clicks from bubbling
  popup.addEventListener("click", e => e.stopPropagation());
  return popup;
}

const popupEl = createPopup();
const resultEl = document.getElementById("popup-result");
const fromEl = document.getElementById("fromLang");
const toEl = document.getElementById("toLang");
const closeBtn = document.getElementById("close-btn");

let lastSelectionText = "";
let translationDone = false; // track translation state

// Show popup when selecting text
document.addEventListener("mouseup", (event) => {
  if (event.target.closest("#translate-popup")) return;

  const sel = window.getSelection();
  const selectedText = sel ? sel.toString().trim() : "";

  if (!selectedText) return;
  if (selectedText === lastSelectionText) return;
  lastSelectionText = selectedText;

  let top = event.pageY;
  let left = event.pageX;
  if (sel && sel.rangeCount > 0) {
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect) {
      top = window.scrollY + rect.bottom + 8;
      left = window.scrollX + rect.left;
    }
  }

  popupEl.style.display = "block";
  popupEl.style.top = `${top}px`;
  popupEl.style.left = `${left}px`;

  resultEl.innerText = "Translating...";
  translationDone = false;
  translateText(selectedText);
});

// Re-translate if language dropdowns change
[fromEl, toEl].forEach(el => {
  el.addEventListener("change", () => {
    if (lastSelectionText) {
      resultEl.innerText = "Translating...";
      translationDone = false;
      translateText(lastSelectionText);
    }
  });
});

// Close button
closeBtn.onclick = (e) => {
  e.stopPropagation();
  popupEl.style.display = "none";
  lastSelectionText = "";
  translationDone = false;
};

// Hide popup on outside click (only after translation done)
document.addEventListener("click", (event) => {
  if (
    translationDone &&
    !event.target.closest("#translate-popup") &&
    popupEl.style.display === "block"
  ) {
    popupEl.style.display = "none";
    lastSelectionText = "";
    translationDone = false;
  }
});

// Translation function
async function translateText(text) {
  const fromLang = fromEl.value;
  const toLang = toEl.value;
  const GROQ_API_KEY = "api-here";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a translation assistant. Translate the user's text from ${fromLang === "auto" ? "the detected language" : fromLang} to ${toLang}. Respond with translated text only.`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await response.json();
    const translation = data?.choices?.[0]?.message?.content?.trim();

    if (!response.ok) {
      resultEl.innerText = `Error: ${translation || data?.error?.message || "Translation failed!"}`;
      return;
    }

    resultEl.innerText = translation || "No translation returned.";
    translationDone = true; // ✅ allow outside click to close now

    // Copy button
    const copyBtn = document.getElementById("copy-btn");
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(resultEl.innerText);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Text"), 900);
    };

  } catch (error) {
    resultEl.innerText = "Network error. Please try again.";
    console.error(error);
  }
}
