/**
 * Ensures a value is a non-null string
 * @param {*} value - Any value to convert to string
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} A guaranteed non-null string
 */
export const ensureString = (value, defaultValue = "") => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  try {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "object") {
      // Try to convert objects to JSON string, but catch errors
      try {
        return JSON.stringify(value);
      } catch (e) {
        console.warn("Failed to stringify object", e);
        return defaultValue;
      }
    }

    // For any other type, return default
    return defaultValue;
  } catch (e) {
    console.error("Error in ensureString:", e);
    return defaultValue;
  }
};

/**
 * Extracts a title from the content of a note
 * @param {Array} content - Slate content array
 * @param {string} defaultTitle - Default title if extraction fails
 * @returns {string} The extracted title or default title
 */
export const extractTitleFromContent = (
  content,
  defaultTitle = "Untitled Note"
) => {
  try {
    // Ensure content is an array
    if (!Array.isArray(content) || content.length === 0) {
      return defaultTitle;
    }

    // Try to find the first heading element
    for (const node of content) {
      if (
        node.type &&
        (node.type === "heading-one" ||
          node.type === "heading-two" ||
          node.type === "heading-three")
      ) {
        // Extract text from the heading
        if (node.children && Array.isArray(node.children)) {
          const text = node.children
            .map((child) => child.text || "")
            .join("")
            .trim();

          if (text) {
            return text.length > 100 ? text.substring(0, 97) + "..." : text;
          }
        }
      }
    }

    // If no heading found, try to use the first paragraph
    for (const node of content) {
      if (
        node.type === "paragraph" &&
        node.children &&
        Array.isArray(node.children)
      ) {
        const text = node.children
          .map((child) => child.text || "")
          .join("")
          .trim();

        if (text) {
          // Limit title length and add ellipsis if needed
          return text.length > 50 ? text.substring(0, 47) + "..." : text;
        }
      }
    }

    return defaultTitle;
  } catch (error) {
    console.error("Error extracting title:", error);
    return defaultTitle;
  }
};
