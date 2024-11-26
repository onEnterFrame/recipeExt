// popup.js
document.addEventListener("DOMContentLoaded", async () => {
  // Get references to DOM elements
  const extractBtn = document.getElementById("extractRecipe");
  const spinner = document.getElementById("spinner");
  const recipeElement = document.getElementById("recipe");

  // Connect to the background script via a named port
  const port = chrome.runtime.connect({ name: "recipe_stream" });
  let fullResponse = "";

  // Listen for messages from the background script
  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case "chunk":
        // Append each chunk of the response to fullResponse
        fullResponse = msg.content;
        // Update the recipe element with the parsed markdown content
        recipeElement.innerHTML = marked.parse(fullResponse);
        // Show share buttons
        showShareButtons();
        break;

      case "complete":
        // Setup share buttons with the full response content
        setupShareButtons(fullResponse);
        // Hide the spinner
        spinner.classList.remove("active");
        break;

      case "error":
        // Display error message and prompt to try again
        recipeElement.innerHTML = marked.parse(
          "Error: " + msg.content + "\n\nPlease try again."
        );
        // Hide the spinner and re-enable the extract button
        spinner.classList.remove("active");
        extractBtn.disabled = false;
        break;
    }
  });

  // Add click event listener to the extract button
  extractBtn.addEventListener("click", async () => {
    // Disable the button and show the spinner
    extractBtn.disabled = true;
    spinner.classList.add("active");
    // Clear previous recipe content
    recipeElement.textContent = "";
    fullResponse = "";

    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Execute script in the active tab to extract page content
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });

    // Send the extracted content to the background script
    port.postMessage({
      type: "EXTRACT_RECIPE",
      content: result,
    });
  });
});

// Function to show share buttons
function showShareButtons() {
  document.getElementById("shareOptions").style.display = "flex";
}

// Function to setup share buttons with the recipe content
function setupShareButtons(recipe) {
  const shareButtons = {
    twitter: document.querySelector(".twitter"),
    facebook: document.querySelector(".facebook"),
    print: document.querySelector(".print"),
    newTab: document.querySelector(".new-tab"),
  };

  // Twitter share
  shareButtons.twitter.addEventListener("click", () => {
    const text = encodeURIComponent(recipe.substring(0, 280));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  });

  // Facebook share
  shareButtons.facebook.addEventListener("click", () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank"
    );
  });

  // Print
  shareButtons.print.addEventListener("click", () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Recipe</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>${marked.parse(recipe)}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });

  // New Tab
  shareButtons.newTab.addEventListener("click", () => {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Recipe</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>${marked.parse(recipe)}</body>
      </html>
    `);
  });

  // Enable buttons
  for (const button of Object.values(shareButtons)) {
    button.disabled = false;
  }
}
