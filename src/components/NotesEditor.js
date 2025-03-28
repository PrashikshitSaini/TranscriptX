import React, { useMemo, useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import {
  createEditor,
  Editor,
  Transforms,
  Text,
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

// Fixed PDF Export function with proper background and text colors
const exportToPDF = async (editorRef, editorValue) => {
  try {
    const content = editorRef.current;
    if (!content) {
      console.error("Editor content reference is null");
      alert("Could not find editor content to export");
      return;
    }

    // Add a short delay to ensure content is properly rendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create a temporary container to get a clean capture without toolbar
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.top = "-9999px";
    tempContainer.style.left = "-9999px";
    tempContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
    tempContainer.style.padding = "40px";
    tempContainer.style.backgroundColor = "#ffffff"; // White for PDF export
    tempContainer.style.color = "#000000"; // Black text for PDF export
    tempContainer.style.fontFamily = "Arial, sans-serif";

    // Clone the editor content (without toolbar)
    const clonedContent = content.cloneNode(true);

    // Remove the toolbar if present in the cloned content
    const toolbar = clonedContent.querySelector('div[role="toolbar"]');
    if (toolbar) {
      toolbar.remove();
    }

    // Deep clone only the editable content
    const editableContent = clonedContent.querySelector(
      '[contenteditable="true"]'
    );
    if (editableContent) {
      // Clear the temporary container and only add the editable part
      tempContainer.innerHTML = "";
      tempContainer.appendChild(editableContent);
    }

    // Apply PDF-friendly styles to force proper rendering
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      * {
        color: #000000 !important;
        background-color: transparent !important;
      }
      body, div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, span {
        color: #000000 !important;
        background-color: transparent !important;
        font-family: Arial, sans-serif !important;
      }
      h1 {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 10px !important;
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
      p {
        margin-bottom: 8px !important;
      }
      ul, ol {
        padding-left: 20px !important;
        margin-bottom: 10px !important;
      }
      li {
        margin-bottom: 3px !important;
      }
      blockquote {
        border-left: 2px solid #aaaaaa !important;
        padding-left: 10px !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        color: #333333 !important;
        background-color: #f5f5f5 !important;
        padding: 5px 10px !important;
      }
      .task-list-item {
        display: flex !important;
        align-items: center !important;
        margin-bottom: 3px !important;
      }
      .task-checkbox {
        margin-right: 5px !important;
      }
    `;

    // Add the styles to the document head for the temporary container
    document.head.appendChild(styleElement);

    // Add the temporary container to the document body
    document.body.appendChild(tempContainer);

    try {
      // Use html2canvas with explicit configuration for proper rendering
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Ensure the cloned document has proper styling
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            if (el.style) {
              el.style.color = "#000000";
              el.style.backgroundColor = "transparent";
            }
          });
        },
      });

      // Create PDF with the captured content
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Set PDF metadata
      pdf.setProperties({
        title: "TranscriptX Notes",
        subject: "Generated Notes",
        creator: "TranscriptX",
        author: "TranscriptX",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF with white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        "F"
      );
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Handle multi-page content
      let heightLeft = imgHeight - pageHeight;
      let position = -pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight(),
          "F"
        );
        position = position - pageHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save("TranscriptX_Notes.pdf");
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
      document.head.removeChild(styleElement);
    }
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Failed to export PDF: " + error.message);

    // Try alternate PDF generation method if the main method fails
    try {
      console.log("Attempting alternative PDF export method...");
      const content = editorRef.current;

      if (!content) {
        throw new Error("Could not find editor content");
      }

      // Create a new jsPDF instance
      const pdf = new jsPDF();

      // Convert editor content to text - pass editorValue parameter
      const textContent = extractTextFromNodes(editorValue);

      // Add text content to PDF manually
      const margins = {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      };

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);

      // Split text by paragraphs
      const paragraphs = textContent.split("\n");

      let yPos = margins.top;

      // Add each paragraph
      paragraphs.forEach((paragraph) => {
        if (paragraph.trim() === "") return;

        // Check if we need a new page
        if (yPos > pdf.internal.pageSize.height - margins.bottom) {
          pdf.addPage();
          yPos = margins.top;
        }

        // Add the paragraph text
        pdf.text(paragraph, margins.left, yPos);
        yPos += 10; // increment y position
      });

      pdf.save("TranscriptX_Notes_Alternative.pdf");
    } catch (fallbackError) {
      console.error("Alternative PDF export also failed:", fallbackError);
      alert("PDF export failed with both methods. Please try again later.");
    }
  }
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
