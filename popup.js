/* ---------- popup.js (Full advanced features) ---------- */

const GROQ_API_KEY = "Api_key"; 
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama3-8b-8192";

const LANGUAGE_NAMES = {
  auto: "Auto Detect",
  en: "English",
  ur: "Urdu",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  ar: "Arabic"
};

async function groqChatRequest(messages) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messages
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  if (!choice) throw new Error("Invalid API response format.");
  return choice.message?.content ?? "";
}

async function detectLanguage(text) {
  if (!text || !text.trim()) return null;
  const messages = [
    {
      role: "system",
      content:
        `You are a helpful assistant. When asked to detect language, respond with ONLY a JSON object with the field "language" whose value is a two-letter language code (ISO 639-1). Example: {"language":"en"}`
    },
    {
      role: "user",
      content: `Detect the language of this text: """${text}""".`
    },
    
  ];

  const reply = await groqChatRequest(messages);

  try {
    const parsed = JSON.parse(reply);
    if (parsed && parsed.language) return parsed.language;
    const code = reply.trim().replace(/["'{}]/g, "");
    if (LANGUAGE_NAMES[code]) return code;
  } catch (e) {
    const candidate = reply.trim().slice(0, 10).replace(/[^a-zA-Z]/g, "");
    if (candidate && LANGUAGE_NAMES[candidate]) return candidate;
  }
  return null;
}

function showDetectedInDropdown(detectedCode) {
  const fromSelect = document.getElementById("fromLang");
  const prevTemp = fromSelect.querySelector('option[data-temp="true"]');
  if (prevTemp) prevTemp.remove();

  if (!detectedCode || !LANGUAGE_NAMES[detectedCode]) {
    return;
  }

  const tempOption = document.createElement("option");
  tempOption.value = `detected-${detectedCode}`;
  tempOption.textContent = `Detected: ${LANGUAGE_NAMES[detectedCode]} (${detectedCode})`;
  tempOption.setAttribute("data-temp", "true");

  const autoOption = fromSelect.querySelector('option[value="auto"]');
  if (autoOption && autoOption.nextSibling) {
    fromSelect.insertBefore(tempOption, autoOption.nextSibling);
  } else {
    fromSelect.appendChild(tempOption);
  }

  fromSelect.value = tempOption.value;
}

function removeDetectedTempOption() {
  const fromSelect = document.getElementById("fromLang");
  const prevTemp = fromSelect.querySelector('option[data-temp="true"]');
  if (prevTemp) prevTemp.remove();
}

document.getElementById("fromLang").addEventListener("change", () => {
  const v = document.getElementById("fromLang").value;
  if (!v.startsWith("detected-")) removeDetectedTempOption();
});

// Dark mode injection
function injectDarkModeToggle() {
  const container = document.querySelector(".popup-container");
  if (!container) return;

  const toggleWrapper = document.createElement("div");
  toggleWrapper.style.display = "flex";
  toggleWrapper.style.justifyContent = "flex-end";
  toggleWrapper.style.marginBottom = "8px";

  const btn = document.createElement("button");
  btn.id = "darkModeToggle";
  btn.innerText = "🌙";
  btn.title = "Toggle dark mode";
  btn.style.border = "none";
  btn.style.background = "transparent";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "18px";
  btn.style.padding = "4px";

  toggleWrapper.appendChild(btn);
  container.insertBefore(toggleWrapper, container.firstChild);

  btn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("quickTranslateDark", isDark ? "1" : "0");
  });

  const saved = localStorage.getItem("quickTranslateDark");
  if (saved === "1") document.body.classList.add("dark");
}

async function translateFlow() {
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const fromSelect = document.getElementById("fromLang");
  const toSelect = document.getElementById("toLang");

  const rawText = (inputEl.value || "").trim();
  if (!rawText) {
    outputEl.value = "⚠ Please enter text to translate.";
    return;
  }

  outputEl.value = "Translating...";

  let sourceLang = fromSelect.value;
  try {
    if (sourceLang === "auto") {
      const detected = await detectLanguage(rawText);
      if (detected) {
        showDetectedInDropdown(detected);
        sourceLang = detected;
      } else {
        // proceed with auto if detection failed
        sourceLang = "auto";
      }
    } else if (sourceLang.startsWith("detected-")) {
      sourceLang = sourceLang.replace("detected-", "");
    }
  } catch (err) {
    console.error("Detection error:", err);
    outputEl.value = "Warning: detection failed. Proceeding with auto-detection by translation model...";
    sourceLang = "auto";
  }

  const translationSystem = {
    role: "system",
    content:
      `You are a translation assistant. Translate the user's text from ${sourceLang === "auto" ? "the detected language" : sourceLang} to ${toSelect.value}. ` +
      `Respond with the translated text ONLY (no commentary).`
  };
  const translationUser = { role: "user", content: rawText };

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resultText = await groqChatRequest([translationSystem, translationUser]);
      if (!resultText || resultText.trim().length === 0) {
        outputEl.value = "No translation returned by the model.";
      } else {
        outputEl.value = resultText.trim();
      }
      break;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) {
        if (error.message && error.message.includes("429")) {
          outputEl.value = "Error: Rate limit reached. Please wait and try again.";
        } else if (error.message && error.message.includes("401")) {
          outputEl.value = "Error: Unauthorized. Check your API key.";
        } else {
          outputEl.value = "Error: Could not reach translation service. Check internet or API key.";
        }
      } else {
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }
}

// Setup DOM listeners
document.addEventListener("DOMContentLoaded", () => {
  injectDarkModeToggle();

  document.getElementById("translateBtn").addEventListener("click", translateFlow);
});
