// popup.js

document.getElementById("translateBtn").addEventListener("click", () => {
  const fromLang = document.getElementById("fromLang").value;
  const toLang = document.getElementById("toLang").value;
  const inputText = document.getElementById("inputText").value;

  if (!inputText) {
    alert("Please enter some text to translate!");
    return;
  }

  // For now just simulate translation (we will connect Groq API later)
  document.getElementById("outputText").value = 
    `[Simulated Translation] (${fromLang} → ${toLang}): ${inputText}`;
});
