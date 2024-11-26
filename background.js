// background.js
chrome.runtime.onConnect.addListener((port) => {
  // Check if the connected port is named "recipe_stream"
  if (port.name === "recipe_stream") {
    // Listen for messages on the port
    port.onMessage.addListener(async (request) => {
      // Check if the message type is "EXTRACT_RECIPE"
      if (request.type === "EXTRACT_RECIPE") {
        try {
          // Create a new AI language model session with a system prompt
          const session = await ai.languageModel.create({
            systemPrompt:
              "You are a magnificent home cook! Look at this content and return a succent and comprehensive recipe.",
          });

          // Start streaming the response from the AI model
          const stream = await session.promptStreaming(request.content);

          // Iterate over each chunk of the streamed response
          for await (const chunk of stream) {
            // Send each chunk to the client
            port.postMessage({
              type: "chunk",
              content: chunk,
            });
          }

          // Send a completion message when the streaming is done
          port.postMessage({
            type: "complete",
          });
        } catch (error) {
          // Send an error message if something goes wrong
          port.postMessage({
            type: "error",
            content: error.message,
          });
        }
      }
    });
  }
});
