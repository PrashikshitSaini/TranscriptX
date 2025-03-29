import React, { useMemo, useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import {
  createEditor,
  Editor,
  Transforms,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact, useSlate } from "slate-react";
import { withHistory } from "slate-history";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaCode,
  FaQuoteRight,
  FaListUl,
  FaListOl,
} from "react-icons/fa";
import { BiHeading } from "react-icons/bi";

const EditorContainer = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EditorHeader = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditorTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
`;

const StyledEditable = styled(Editable)`
  min-height: 300px;
  line-height: 1.6;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", sans-serif;
  padding: 10px 5px;

  h1 {
    font-size: 1.8em;
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 6px;
  }

  h2 {
    font-size: 1.5em;
    margin-top: 20px;
    margin-bottom: 10px;
    font-weight: 500;
  }

  h3 {
    font-size: 1.3em;
    margin-top: 18px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  p {
    margin-bottom: 12px;
    margin-top: 0;
  }

  ul,
  ol {
    padding-left: 24px;
    margin-bottom: 16px;
    margin-top: 0;
  }

  li {
    padding: 3px 0;
  }

  blockquote {
    border-left: 3px solid var(--accent-color);
    padding-left: 16px;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 16px;
    color: var(--text-secondary);
    background-color: rgba(0, 0, 0, 0.05);
    padding: 8px 16px;
    border-radius: 4px;
  }

  code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
  }

  .task-list-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 6px;
    padding: 3px 0;
  }

  .task-checkbox {
    margin-right: 8px;
    margin-top: 5px;
    cursor: pointer;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  background-color: var(--bg-secondary);
  border-radius: 6px 6px 0 0;
`;

const ToolbarButton = styled.button`
  background-color: ${(props) =>
    props.active ? "var(--accent-color-light)" : "var(--bg-primary, #f8f9fa)"};
  color: ${(props) =>
    props.active ? "var(--accent-color)" : "var(--text-primary)"};
  border: 1px solid
    ${(props) => (props.active ? "var(--accent-color)" : "var(--border-color)")};
  border-radius: 4px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--accent-color-light);
    border-color: var(--accent-color);
  }

  svg {
    font-size: 16px;
  }
`;

const ExportButton = styled.button`
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: var(--accent-color-dark);
  }
`;

const ContentArea = styled.div`
  border: 1px solid var(--border-color);
  border-radius: 0 0 6px 6px;
  background-color: var(--bg-secondary);
`;

// Default value with Notion-like structure
const DEFAULT_VALUE = [
  {
    type: "heading-one",
    children: [{ text: "Generated Notes" }],
  },
  {
    type: "paragraph",
    children: [{ text: "Your notes will appear here." }],
  },
];

// Enhanced deserializer for markdown that properly handles formatting
const deserialize = (content) => {
  if (!content || typeof content !== "string" || content.trim() === "") {
    return DEFAULT_VALUE;
  }

  try {
    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, "\n");

    // Pre-processing to fix common formatting issues
    let processedContent = normalizedContent;

    // Split by lines for processing
    const lines = processedContent.split("\n");
    const nodes = [];
    let currentList = null;
    let i = 0;

    while (i < lines.length) {
      let line = lines[i].trim();

      // Skip empty lines but add a paragraph to preserve spacing
      if (line === "") {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }
        i++;
        continue;
      }

      // Process heading lines
      if (line.startsWith("# ")) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        // Get all text after the # marker
        const headingText = line.substring(2);
        nodes.push({
          type: "heading-one",
          children: [{ text: headingText }],
        });
        i++;
      } else if (line.startsWith("## ")) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        const headingText = line.substring(3);
        nodes.push({
          type: "heading-two",
          children: [{ text: headingText }],
        });
        i++;
      } else if (line.startsWith("### ")) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        const headingText = line.substring(4);
        nodes.push({
          type: "heading-three",
          children: [{ text: headingText }],
        });
        i++;
      }
      // Process unordered list items
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        const listItemText = line.substring(2);

        // Process for bold, italic etc. within the list item
        const formattedText = processTextFormatting(listItemText);

        const listItem = {
          type: "list-item",
          children: formattedText,
        };

        if (!currentList) {
          currentList = {
            type: "bulleted-list",
            children: [listItem],
          };
        } else if (currentList.type === "bulleted-list") {
          currentList.children.push(listItem);
        } else {
          nodes.push(currentList);
          currentList = {
            type: "bulleted-list",
            children: [listItem],
          };
        }
        i++;
      }
      // Process numbered list items
      else if (/^\d+\.\s/.test(line)) {
        const listItemText = line.substring(line.indexOf(".") + 2);

        // Process for bold, italic etc. within the list item
        const formattedText = processTextFormatting(listItemText);

        const listItem = {
          type: "list-item",
          children: formattedText,
        };

        if (!currentList) {
          currentList = {
            type: "numbered-list",
            children: [listItem],
          };
        } else if (currentList.type === "numbered-list") {
          currentList.children.push(listItem);
        } else {
          nodes.push(currentList);
          currentList = {
            type: "numbered-list",
            children: [listItem],
          };
        }
        i++;
      }
      // Process blockquotes
      else if (line.startsWith("> ")) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        const quoteText = line.substring(2);
        const formattedText = processTextFormatting(quoteText);

        nodes.push({
          type: "block-quote",
          children: formattedText,
        });
        i++;
      }
      // Process task lists
      else if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        const isChecked = line.startsWith("- [x] ");
        const taskText = line.substring(6);
        const formattedText = processTextFormatting(taskText);

        nodes.push({
          type: "task-item",
          checked: isChecked,
          children: formattedText,
        });
        i++;
      }
      // Regular paragraphs - look for formatting
      else {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }

        const formattedText = processTextFormatting(line);

        nodes.push({
          type: "paragraph",
          children: formattedText,
        });
        i++;
      }
    }

    // Add any remaining list
    if (currentList) {
      nodes.push(currentList);
    }

    return nodes.length > 0 ? nodes : DEFAULT_VALUE;
  } catch (error) {
    console.error("Error parsing content for Slate editor:", error);
    return DEFAULT_VALUE;
  }
};

// Helper function to process text formatting like bold, italic, etc.
const processTextFormatting = (text) => {
  // Simple regex-based approach for basic formatting
  let children = [];

  // Check if there's any formatting to process
  if (text.includes("**") || text.includes("*") || text.includes("`")) {
    // Split text into segments based on formatting tokens
    let segments = [];
    let currentIndex = 0;

    // Bold processing
    const boldRegex = /\*\*(.*?)\*\*/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (boldMatch.index > currentIndex) {
        segments.push({
          text: text.substring(currentIndex, boldMatch.index),
          format: null,
        });
      }

      // Add the bold text
      segments.push({
        text: boldMatch[1],
        format: "bold",
      });

      currentIndex = boldMatch.index + boldMatch[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      segments.push({
        text: text.substring(currentIndex),
        format: null,
      });
    }

    // If no bold formatting was found, just use the original text
    if (segments.length === 0) {
      children.push({ text });
    } else {
      // Convert segments to children
      segments.forEach((segment) => {
        if (segment.format === "bold") {
          children.push({ text: segment.text, bold: true });
        } else {
          children.push({ text: segment.text });
        }
      });
    }
  } else {
    // No formatting, just add the text
    children.push({ text });
  }

  return children.length > 0 ? children : [{ text }];
};

// Helper function to extract text from children nodes
const extractTextFromChildren = (children) => {
  if (!children || !Array.isArray(children)) return "";

  return children
    .map((child) => {
      if (typeof child.text === "string") {
        return child.text;
      }
      return "";
    })
    .join("");
};

// Enhanced helper to extract text with formatting - fix for missing function
const extractFormattedText = (children) => {
  if (!children || !Array.isArray(children)) return "";

  return children
    .map((child) => {
      if (typeof child.text === "string") {
        let text = child.text;

        // No need to re-add markdown syntax, just return the text
        return text;
      }
      return "";
    })
    .join("");
};

// Helper function to extract plain text from editor nodes
const extractTextFromNodes = (nodes) => {
  let text = "";

  if (!nodes || !Array.isArray(nodes)) return text;

  nodes.forEach((node) => {
    if (node.type === "heading-one") {
      text += "# " + extractTextFromChildren(node.children) + "\n\n";
    } else if (node.type === "heading-two") {
      text += "## " + extractTextFromChildren(node.children) + "\n\n";
    } else if (node.type === "heading-three") {
      text += "### " + extractTextFromChildren(node.children) + "\n\n";
    } else if (node.type === "paragraph") {
      text += extractTextFromChildren(node.children) + "\n\n";
    } else if (node.type === "bulleted-list") {
      node.children.forEach((listItem) => {
        text += "• " + extractTextFromChildren(listItem.children) + "\n";
      });
      text += "\n";
    } else if (node.type === "numbered-list") {
      node.children.forEach((listItem, index) => {
        text +=
          index + 1 + ". " + extractTextFromChildren(listItem.children) + "\n";
      });
      text += "\n";
    } else if (node.type === "task-item") {
      text +=
        (node.checked ? "[x] " : "[ ] ") +
        extractTextFromChildren(node.children) +
        "\n";
    } else if (node.type === "block-quote") {
      text += "> " + extractTextFromChildren(node.children) + "\n\n";
    }
  });

  return text;
};

// Helper function to convert editor value to properly formatted text
const convertEditorToText = (editorValue) => {
  let text = "";

  if (!editorValue || !Array.isArray(editorValue)) {
    return text;
  }

  editorValue.forEach((node) => {
    if (node.type === "heading-one") {
      text += `# ${extractFormattedText(node.children)}\n\n`;
    } else if (node.type === "heading-two") {
      text += `## ${extractFormattedText(node.children)}\n\n`;
    } else if (node.type === "heading-three") {
      text += `### ${extractFormattedText(node.children)}\n\n`;
    } else if (node.type === "paragraph") {
      text += `${extractFormattedText(node.children)}\n\n`;
    } else if (node.type === "bulleted-list") {
      node.children.forEach((item) => {
        text += `• ${extractFormattedText(item.children)}\n`;
      });
      text += "\n";
    } else if (node.type === "numbered-list") {
      node.children.forEach((item, i) => {
        text += `${i + 1}. ${extractFormattedText(item.children)}\n`;
      });
      text += "\n";
    } else if (node.type === "block-quote") {
      text += `> ${extractFormattedText(node.children)}\n\n`;
    } else if (node.type === "task-item") {
      text += `${node.checked ? "☑" : "☐"} ${extractFormattedText(
        node.children
      )}\n`;
    }
  });

  return text;
};

// Enhanced helper to process markdown in HTML content before capture
function processMarkdownInHTML(element) {
  if (!element) return;

  // Process all paragraph and text elements
  const textContainers = element.querySelectorAll(
    "p, li, blockquote, h1, h2, h3, span"
  );

  textContainers.forEach((container) => {
    // Only process elements with markdown syntax
    if (
      !container.innerHTML ||
      !(
        container.innerHTML.includes("**") ||
        container.innerHTML.includes("*") ||
        container.innerHTML.includes("`")
      )
    ) {
      return;
    }

    let html = container.innerHTML;

    // Process code blocks first
    html = html.replace(
      /`([^`]+)`/g,
      '<code style="background-color:#f0f0f0;padding:2px 4px;border-radius:3px;font-family:monospace;">$1</code>'
    );

    // Process bold text
    html = html.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong style="font-weight:bold;">$1</strong>'
    );

    // Process italic text
    html = html.replace(
      /\*([^*]+)\*/g,
      '<em style="font-style:italic;">$1</em>'
    );

    // Update the HTML
    container.innerHTML = html;
  });
}

// Simplified PDF Export function with better markdown handling
const exportToPDF = async (editorRef, editorValue) => {
  try {
    const content = editorRef.current;
    if (!content) {
      console.error("Editor content reference is null");
      alert("Could not find editor content to export");
      return;
    }

    // Show a loading message
    alert("Preparing PDF export. This may take a moment...");

    // Create a clean container for capture
    const exportContainer = document.createElement("div");
    exportContainer.style.position = "absolute";
    exportContainer.style.top = "-9999px";
    exportContainer.style.left = "-9999px";
    exportContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
    exportContainer.style.backgroundColor = "#ffffff";
    exportContainer.style.padding = "40px";
    exportContainer.style.color = "#000000";
    exportContainer.style.fontFamily = "Arial, sans-serif";

    // Add styles for better PDF rendering
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      * {
        color: #000000 !important;
        background-color: transparent !important;
        font-family: Arial, sans-serif !important;
      }
      strong, b {
        font-weight: bold !important;
      }
      em, i {
        font-style: italic !important;
      }
      code {
        font-family: monospace !important;
        background-color: #f0f0f0 !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
      }
      h1 {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 12px !important;
        border-bottom: 1px solid #cccccc !important;
        padding-bottom: 5px !important;
      }
      h2 {
        font-size: 20px !important;
        font-weight: bold !important;
        margin-top: 15px !important;
        margin-bottom: 8px !important;
      }
      h3 {
        font-size: 16px !important;
        font-weight: bold !important;
        margin-top: 12px !important;
        margin-bottom: 6px !important;
      }
      p, li, blockquote {
        margin-bottom: 8px !important;
        line-height: 1.5 !important;
      }
      ul, ol {
        padding-left: 20px !important;
        margin-bottom: 10px !important;
      }
      blockquote {
        border-left: 2px solid #999 !important;
        padding-left: 10px !important;
        font-style: italic !important;
      }
    `;

    document.head.appendChild(styleElement);
    document.body.appendChild(exportContainer);

    try {
      // Clone the editor content but only get the editable part
      const editorContent = content.querySelector('[contenteditable="true"]');
      if (!editorContent) {
        throw new Error("Could not find editable content");
      }

      // Clone and clean up the content
      const contentClone = editorContent.cloneNode(true);

      // Apply styles for PDF
      contentClone.style.color = "#000000";
      contentClone.style.backgroundColor = "#ffffff";
      contentClone.style.fontFamily = "Arial, sans-serif";
      contentClone.style.padding = "20px";
      contentClone.style.width = "auto";

      // Process markdown syntax in the HTML content
      processMarkdownInHTML(contentClone);

      // Add additional styling for better appearance
      const allElements = contentClone.querySelectorAll("*");
      allElements.forEach((el) => {
        if (el.tagName === "H1") {
          Object.assign(el.style, {
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "12px",
            borderBottom: "1px solid #cccccc",
            paddingBottom: "5px",
            color: "#000000",
          });
        } else if (el.tagName === "H2") {
          Object.assign(el.style, {
            fontSize: "20px",
            fontWeight: "bold",
            marginTop: "15px",
            marginBottom: "8px",
            color: "#000000",
          });
        } else if (el.tagName === "H3") {
          Object.assign(el.style, {
            fontSize: "16px",
            fontWeight: "bold",
            marginTop: "12px",
            marginBottom: "6px",
            color: "#000000",
          });
        } else if (el.tagName === "P") {
          Object.assign(el.style, {
            marginBottom: "8px",
            lineHeight: "1.5",
            color: "#000000",
          });
        } else if (el.tagName === "UL" || el.tagName === "OL") {
          Object.assign(el.style, {
            paddingLeft: "20px",
            marginBottom: "10px",
            color: "#000000",
          });
        } else if (el.tagName === "LI") {
          Object.assign(el.style, {
            marginBottom: "3px",
            color: "#000000",
          });
        } else if (el.tagName === "BLOCKQUOTE") {
          Object.assign(el.style, {
            borderLeft: "2px solid #999",
            paddingLeft: "10px",
            fontStyle: "italic",
            color: "#000000",
          });
        } else if (el.tagName === "STRONG" || el.style.fontWeight === "bold") {
          el.style.fontWeight = "bold";
          el.style.color = "#000000";
        } else if (el.tagName === "EM" || el.style.fontStyle === "italic") {
          el.style.fontStyle = "italic";
          el.style.color = "#000000";
        } else if (el.tagName === "CODE") {
          Object.assign(el.style, {
            fontFamily: "monospace",
            backgroundColor: "#f0f0f0",
            padding: "2px 4px",
            borderRadius: "3px",
            color: "#000000",
          });
        }
      });

      exportContainer.innerHTML = "";
      exportContainer.appendChild(contentClone);

      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Split the content into page-sized chunks and create a PDF
      // We'll measure the actual content height
      const contentHeight = exportContainer.offsetHeight;
      const pageContentHeight = (pdfHeight - 20) * 3.779527559; // Convert mm to px

      // Calculate how many pages we need
      const totalPages = Math.ceil(contentHeight / pageContentHeight);

      // Capture each page separately
      for (let page = 0; page < totalPages; page++) {
        // Update container position to show the current page
        exportContainer.style.top = `-${page * pageContentHeight}px`;

        // Delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Capture the current visible part
        const canvas = await html2canvas(exportContainer, {
          scale: 2,
          logging: false,
          windowHeight: pageContentHeight,
          y: page * pageContentHeight,
          height: pageContentHeight,
          backgroundColor: "#ffffff",
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL("image/png");

        // Add new page if not first page
        if (page > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      // Save the PDF
      pdf.save("TranscriptX_Notes.pdf");
    } finally {
      // Clean up
      if (document.body.contains(exportContainer)) {
        document.body.removeChild(exportContainer);
      }
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    }
  } catch (error) {
    console.error("Error in PDF export:", error);
    alert(`PDF export failed: ${error.message}. Please try again.`);
  }
};

// Define custom elements for the editor
const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "heading-three":
      return <h3 {...attributes}>{children}</h3>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    case "task-item":
      return (
        <div className="task-list-item" {...attributes}>
          <input
            type="checkbox"
            className="task-checkbox"
            checked={element.checked || false}
            onChange={() => {
              // The checkbox state is managed through the editor
            }}
            contentEditable={false}
          />
          <span>{children}</span>
        </div>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Custom leaf renderer for handling marks like bold, italic, etc.
const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.code) {
    children = <code>{children}</code>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

// Toolbar button that applies formatting
const FormatButton = ({ format, icon, blockFormat = false, tooltip }) => {
  const editor = useSlate();

  const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });
    return !!match;
  };

  const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format);
    const isList = format === "bulleted-list" || format === "numbered-list";

    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        ["bulleted-list", "numbered-list"].includes(n.type),
      split: true,
    });

    const newType = isActive ? "paragraph" : isList ? "list-item" : format;

    Transforms.setNodes(editor, {
      type: newType,
    });

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  };

  const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  return (
    <ToolbarButton
      active={
        blockFormat
          ? isBlockActive(editor, format)
          : isMarkActive(editor, format)
      }
      onMouseDown={(event) => {
        event.preventDefault();
        if (blockFormat) {
          toggleBlock(editor, format);
        } else {
          toggleMark(editor, format);
        }
      }}
      title={tooltip}
    >
      {icon}
    </ToolbarButton>
  );
};

function NotesEditor({ initialValue }) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [editorValue, setEditorValue] = useState(DEFAULT_VALUE);
  const [loading, setLoading] = useState(true);
  const editorRef = React.useRef(null);

  // Update the editor when initialValue changes
  useEffect(() => {
    try {
      setLoading(true);
      console.log(
        "Processing initialValue:",
        initialValue?.substring(0, 100) + "..."
      );

      if (
        !initialValue ||
        typeof initialValue !== "string" ||
        initialValue.trim() === ""
      ) {
        console.warn("NotesEditor: Empty or invalid initialValue received");
        setEditorValue(DEFAULT_VALUE);
        return;
      }

      const processed = deserialize(initialValue);
      console.log("Processed editor content:", processed.slice(0, 2));

      if (Array.isArray(processed) && processed.length > 0) {
        setEditorValue(processed);
      } else {
        console.warn("NotesEditor: deserialize returned invalid content");
        setEditorValue(DEFAULT_VALUE);
      }
    } catch (e) {
      console.error("Failed to parse initial content:", e);
      setEditorValue(DEFAULT_VALUE);
    } finally {
      setLoading(false);
    }
  }, [initialValue]);

  // Define a rendering function for custom elements and leafs
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  if (loading) {
    return (
      <EditorContainer>
        <EditorHeader>
          <EditorTitle>Generated Notes</EditorTitle>
        </EditorHeader>
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "var(--text-secondary)",
          }}
        >
          Loading notes...
        </div>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Generated Notes</EditorTitle>
        <ExportButton onClick={() => exportToPDF(editorRef, editorValue)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"
              fill="currentColor"
            />
          </svg>
          Export PDF
        </ExportButton>
      </EditorHeader>

      <Slate
        editor={editor}
        value={editorValue}
        onChange={(value) => setEditorValue(value)}
      >
        <Toolbar>
          <FormatButton format="bold" icon={<FaBold />} tooltip="Bold" />
          <FormatButton format="italic" icon={<FaItalic />} tooltip="Italic" />
          <FormatButton
            format="underline"
            icon={<FaUnderline />}
            tooltip="Underline"
          />
          <FormatButton format="code" icon={<FaCode />} tooltip="Code" />
          <FormatButton
            format="heading-one"
            icon={<BiHeading />}
            blockFormat={true}
            tooltip="Heading 1"
          />
          <FormatButton
            format="heading-two"
            icon={
              <>
                H<sub>2</sub>
              </>
            }
            blockFormat={true}
            tooltip="Heading 2"
          />
          <FormatButton
            format="block-quote"
            icon={<FaQuoteRight />}
            blockFormat={true}
            tooltip="Quote"
          />
          <FormatButton
            format="bulleted-list"
            icon={<FaListUl />}
            blockFormat={true}
            tooltip="Bullet List"
          />
          <FormatButton
            format="numbered-list"
            icon={<FaListOl />}
            blockFormat={true}
            tooltip="Numbered List"
          />
        </Toolbar>

        <ContentArea ref={editorRef}>
          <StyledEditable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Generated notes will appear here..."
            spellCheck
            autoFocus
          />
        </ContentArea>
      </Slate>
    </EditorContainer>
  );
}

export default NotesEditor;
