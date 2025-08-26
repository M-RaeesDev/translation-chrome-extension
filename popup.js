// Replace with your actual Groq API key
const GROQ_API_KEY = "YOUR_GROQ_API_KEY";

// Select DOM elements
const translateBtn = document.getElementById("translateBtn");
const inputText = document.getElementById("inputText");
const fromLang = document.getElementById("fromLang");
const toLang = document.getElementById("toLang");
const resultDiv = document.getElementById("resultBox");

translateBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  const source = fromLang.value;
  const target = toLang.value;

  if (!text) {
    resultDiv.innerText = "Please enter some text!";
    return;
  }

  resultDiv.innerText = "Translating...";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // You can use another Groq model if needed
        messages: [
          {
            role: "system",
            content: "You are a translation assistant."
          },
          {
            role: "user",
            content: `Translate this text from ${source} to ${target}: ${text}`
          }
        ]
      })
    });

    const data = await response.json();
    const translation = data.choices[0].message.content;

    resultDiv.innerText = translation;

  } catch (error) {
    console.error("Translation Error:", error);
    resultDiv.innerText = "Failed to translate. Please try again.";
  }
});
