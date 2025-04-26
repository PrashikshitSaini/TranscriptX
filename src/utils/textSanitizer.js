import DOMPurify from "dompurify";
// Use a lightweight parser if needed, or rely on browser's DOMParser
// import parse from 'html-react-parser'; // Example if using this library

/**
 * Extracts text content from various formats (string, basic HTML).
 * @param {any} content - The content to extract text from.
 * @returns {string} The extracted plain text.
 */
export const extractTextFromContent = (content) => {
  if (typeof content === "string") {
    // Basic HTML stripping (consider a more robust library for complex HTML)
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = DOMPurify.sanitize(content); // Sanitize first
    return tempDiv.textContent || tempDiv.innerText || "";
  }
  // Add handling for Slate format if necessary for backward compatibility during transition
  if (Array.isArray(content)) {
    try {
      return content
        .map((node) => node.children?.map((child) => child.text).join("") || "")
        .join("\n");
    } catch (e) {
      return ""; // Fallback for complex/invalid Slate structure
    }
  }
  return "";
};

/**
 * Extracts a title from HTML content by looking for the first heading tag (h1, h2, h3).
 * Falls back to the first paragraph or a default title.
 * @param {string | Array} content - HTML string or potentially old Slate Array content.
 * @param {string} defaultTitle - Default title if extraction fails.
 * @returns {string} The extracted title or default title.
 */
export const extractTitleFromContent = (
  content,
  defaultTitle = "Untitled Note"
) => {
  if (!content) {
    return defaultTitle;
  }

  let htmlContent = "";

  // If it's an array (likely old Slate format), try basic text extraction
  if (Array.isArray(content)) {
    try {
      // Attempt to find first heading in Slate structure
      for (const node of content) {
        if (node.type?.startsWith("heading-")) {
          const text = node.children
            ?.map((child) => child.text || "")
            .join("")
            .trim();
          if (text) return text.substring(0, 100); // Limit title length
        }
      }
      // Fallback: Join first few lines of text from Slate structure
      const firstText = content
        .slice(0, 3) // Take first few nodes
        .map(
          (node) =>
            node.children?.map((child) => child.text || "").join("") || ""
        )
        .join(" ")
        .trim();
      return firstText ? firstText.substring(0, 100) : defaultTitle;
    } catch (e) {
      console.warn("Could not parse Slate content for title", e);
      return defaultTitle;
    }
  } else if (typeof content === "string") {
    htmlContent = content;
  } else {
    return defaultTitle; // Unknown format
  }

  try {
    // Use DOMParser to safely parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      DOMPurify.sanitize(htmlContent),
      "text/html"
    );

    // Look for first h1, h2, or h3
    const heading = doc.querySelector("h1, h2, h3");
    if (heading && heading.textContent) {
      const title = heading.textContent.trim();
      if (title) return title.substring(0, 100); // Limit title length
    }

    // Fallback: Look for the first paragraph with text
    const paragraph = doc.querySelector("p");
    if (paragraph && paragraph.textContent) {
      const title = paragraph.textContent.trim();
      // Use paragraph only if it's reasonably short
      if (title && title.length < 100) return title;
    }

    // Final fallback
    return defaultTitle;
  } catch (error) {
    console.error("Error extracting title from HTML content:", error);
    return defaultTitle;
  }
};

/**
 * Basic text sanitization (Example - consider more robust libraries if needed)
 * @param {string} text - Input text
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  // Basic example: remove script tags (DOMPurify is better for HTML)
  return text.replace(/<script.*?>.*?<\/script>/gi, "");
};
