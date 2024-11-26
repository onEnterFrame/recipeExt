async function extractRecipe() {
  try {
    // Create a new AI language model session with a system prompt
    const session = await ai.languageModel.create({
      systemPrompt:
        "You are a magnificent home cook! Look at this content and return a succent and comprehensive recipe.",
    });

    // Prompt the AI model with the page content and get the result
    const result = await session.prompt(document.body.innerText);
    return result;
  } catch (error) {
    // Log any errors that occur and return an error message
    console.error("Error:", error);
    return "Error processing recipe";
  }
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message type is "GET_PAGE_CONTENT"
  if (request.type === "GET_PAGE_CONTENT") {
    // Send the extracted recipe content as a response
    sendResponse({ content: extractRecipe() });
  }
});
