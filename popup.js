console.log("Popup script loaded!");
document.getElementById("translateBtn").addEventListener("click", () => {
  const inputText = document.getElementById("inputText").value;
  const selectedLang = document.getElementById("toLang").value;
  
  if (inputText.trim() === "") {
    alert("Please enter some text to translate.");
    return;
  }
  
  // Temporary output before API integration
  document.getElementById("resultBox").innerText = 
    `You entered: "${inputText}"\nTarget language: ${selectedLang}`;
});
