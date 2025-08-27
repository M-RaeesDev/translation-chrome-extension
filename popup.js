// popup.js

document.getElementById("translateBtn").addEventListener("click", () => {
  const fromLang = document.getElementById("fromLang").value;
  const toLang = document.getElementById("toLang").value;
  const inputText = document.getElementById("inputText").value;

  if (!inputText.trim()) {
    alert("Please enter text to translate!");
    return;
  }

  // Call our translation function
  translateText(fromLang, toLang, inputText);
});

async function translateText(fromLang, toLang, text) {
  const apiKey = "YOUR_REAL_API_KEY"; 
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a translation assistant. Translate the following text from ${fromLang} to ${toLang}.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || "No translation found.";

    document.getElementById("outputText").value = translatedText;

  } catch (error) {
    console.error("Error translating:", error);
    document.getElementById("outputText").value = "Error: Could not fetch translation.";
  }
}
