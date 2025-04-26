import React, { useState, useEffect, useCallback } from "react"; // Removed useRef, useMemo
import styled from "styled-components";
// --- Removed Slate Imports ---
// import { createEditor, Editor, Transforms, Element as SlateElement, Text, Node, Range } from "slate";
// import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react";
// import { withHistory } from "slate-history";

// +++ Added TipTap Imports +++
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
// +++ Import Markdown extension +++
import { Markdown } from "tiptap-markdown";
// --- End TipTap Imports ---

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
// --- Removed some Fa icons if not used, added others ---
import {
  FaBold,
  FaItalic,
  FaStrikethrough, // Changed from FaUnderline
  FaHeading,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaCode,
  FaTable,
  FaSave,
  FaFilePdf, // Added PDF icon
} from "react-icons/fa";
// +++ Added Heading level icons +++
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
// --- Removed BiHeading ---
// import { BiHeading } from "react-icons/bi";
// --- Removed KaTeX imports (unless a TipTap math extension is added) ---
// import "katex/dist/katex.min.css";
// import katex from "katex";
// +++ Added DOMPurify +++
import DOMPurify from "dompurify";

// --- Styled Components ---
const EditorContainer = styled.div`
  border: 1px solid var(--bg-tertiary);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensure container takes height */
  overflow: hidden; /* Prevent content overflow */
  position: relative; /* Needed for loading overlay */
`;

const ToolbarContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--bg-tertiary);
  background-color: var(--bg-secondary);
  gap: 4px; /* Add gap between buttons */
`;

const ToolbarButton = styled.button`
  background: ${(props) =>
    props.active ? "var(--bg-tertiary)" : "transparent"};
  border: none;
  color: var(--text-primary);
  padding: 6px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px; /* Adjust icon size */
  min-width: 30px; /* Ensure buttons have minimum width */

  &:hover {
    background-color: var(--bg-tertiary);
  }

  &:disabled {
    color: var(--text-secondary);
    cursor: not-allowed;
    background-color: transparent;
  }
`;

const ContentArea = styled.div`
  flex-grow: 1;
  padding: 15px 25px; // Increased horizontal padding
  overflow-y: auto; /* Allow content to scroll */

  /* +++ Styles for TipTap Editor +++ */
  .tiptap {
    outline: none;
    color: var(--text-primary);
    line-height: 1.6;
    caret-color: var(--text-primary); // Ensure caret is visible

    /* Basic spacing and typography */
    > * + * {
      margin-top: 1em; // Increased default spacing
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      line-height: 1.2; // Tighter line height for headings
      margin-top: 1.8em; // More space above headings
      margin-bottom: 0.6em; // Less space below headings
      font-weight: 600;
      color: var(--text-primary); // Ensure heading color
    }
    h1 {
      font-size: 2em; // Larger H1
      border-bottom: 1px solid var(--bg-tertiary); // Add separator like Notion
      padding-bottom: 0.3em;
    }
    h2 {
      font-size: 1.5em; // Larger H2
      border-bottom: 1px solid var(--bg-tertiary);
      padding-bottom: 0.3em;
    }
    h3 {
      font-size: 1.25em; // Slightly larger H3
    }

    ul,
    ol {
      padding: 0 1.5rem; // Indent lists more
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }

    li {
      margin-bottom: 0.4em; // Space between list items
    }

    li > p {
      /* Target paragraphs inside list items if needed */
      margin: 0; // Remove default paragraph margin inside lists
    }

    blockquote {
      padding-left: 1.5rem; // More padding
      border-left: 4px solid var(--accent-color); // Thicker border
      color: var(--text-secondary);
      margin-left: 0;
      margin-right: 0;
      font-style: italic; // Italicize blockquotes
    }

    /* Code block styling */
    pre {
      background: var(--bg-tertiary);
      color: #f0f0f0; // Lighter text for code
      font-family: "JetBrainsMono", "Fira Code", monospace; // Common coding fonts
      padding: 1rem 1.2rem; // More padding
      border-radius: 6px; // Slightly rounder corners
      white-space: pre-wrap; /* Allow wrapping */
      margin: 1.5em 0; // More vertical space around code blocks

      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.9em; // Slightly smaller font size in blocks
      }
    }

    /* Inline code styling */
    code {
      background-color: rgba(135, 131, 120, 0.2); // Notion-like inline code bg
      border-radius: 4px;
      padding: 0.2em 0.4em;
      font-size: 85%;
      color: #eb5757; // Notion-like inline code color
      font-family: "JetBrainsMono", "Fira Code", monospace;
    }

    /* Table styling */
    table {
      border-collapse: collapse;
      margin: 1.5em 0; // More vertical margin
      overflow: hidden;
      // table-layout: fixed; // Removed for auto-sizing initially
      width: 100%;
      border: 1px solid var(--border-color); // Use border color

      td,
      th {
        border: 1px solid var(--border-color); // Use border color
        box-sizing: border-box;
        min-width: 1em;
        padding: 0.6em 0.8em; // Adjust padding
        position: relative;
        vertical-align: top;
        line-height: 1.5;

        > * {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        p {
          margin: 0;
        }
      }

      th {
        background-color: var(--bg-tertiary);
        font-weight: bold;
        text-align: left;
        color: var(--text-primary); // Ensure header text color
      }

      /* Resizing handles */
      .grip-column {
        /* Style the resize handles if using resizable tables */
        width: 8px;
        background-color: var(--accent-color);
        cursor: col-resize;
        position: absolute;
        top: 0;
        right: -4px; /* Center the handle */
        height: 100%;
        opacity: 0; /* Hide by default */
        transition: opacity 0.2s;
      }
      &:hover .grip-column {
        opacity: 0.4; /* Show on table hover */
      }
      .grip-column:hover {
        opacity: 1; /* Full opacity on handle hover */
      }
      .selectedCell:after {
        /* Highlight selected cell */
        content: "";
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(66, 133, 244, 0.15); /* Accent color with opacity */
        position: absolute;
        z-index: -1; /* Behind content */
        pointer-events: none;
      }
    }

    /* Placeholder styling */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--text-secondary);
      pointer-events: none;
      height: 0;
      font-style: italic; // Italicize placeholder
    }

    /* Fix potential focus outline */
    &.ProseMirror-focused {
      outline: none;
    }

    /* Add specific styles for links */
    a {
      color: var(--accent-color);
      text-decoration: underline;
      cursor: pointer;
    }
  }
`;

// +++ Added Loading Overlay +++
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2em;
  z-index: 10;
  border-radius: 8px; /* Match container */
  pointer-events: none; /* Allow interaction with toolbar if needed */
`;

// --- Removed Old Slate Specific Components (Leaf, Element, FormatButton etc.) ---

// --- Added Helper Functions ---

// +++ Basic conversion from Slate JSON to HTML (Highly Simplified - Lossy) +++
// A proper migration script would be needed for full fidelity.
const slateToHtml = (nodes) => {
  if (!Array.isArray(nodes)) return "";

  let html = "";
  try {
    nodes.forEach((node) => {
      const childrenHtml = node.children ? slateToHtml(node.children) : "";
      switch (node.type) {
        case "heading-one":
          html += `<h1>${childrenHtml}</h1>`;
          break;
        case "heading-two":
          html += `<h2>${childrenHtml}</h2>`;
          break;
        case "heading-three":
          html += `<h3>${childrenHtml}</h3>`;
          break;
        case "list-item":
          html += `<li>${childrenHtml}</li>`;
          break;
        case "bulleted-list":
          html += `<ul>${childrenHtml}</ul>`;
          break;
        case "numbered-list":
          html += `<ol>${childrenHtml}</ol>`;
          break;
        case "block-quote":
          html += `<blockquote>${childrenHtml}</blockquote>`;
          break;
        case "code-block":
          html += `<pre><code>${childrenHtml}</code></pre>`;
          break;
        case "paragraph":
          html += `<p>${childrenHtml}</p>`;
          break;
        // Basic table handling (very simplified)
        case "table":
          html += `<table><tbody>${childrenHtml}</tbody></table>`;
          break;
        case "table-row":
          html += `<tr>${childrenHtml}</tr>`;
          break;
        case "table-header":
          html += `<th>${childrenHtml}</th>`;
          break;
        case "table-cell":
          html += `<td>${childrenHtml}</td>`;
          break;
        // Ignoring math, cornell, task-item for simplicity here
        default:
          if (node.text !== undefined) {
            let text = node.text || "";
            // Basic marks
            if (node.bold) text = `<strong>${text}</strong>`;
            if (node.italic) text = `<em>${text}</em>`;
            if (node.underline) text = `<u>${text}</u>`; // TipTap uses strike
            if (node.code) text = `<code>${text}</code>`;
            html += text;
          } else {
            html += childrenHtml; // Append children if type unknown but has children
          }
          break;
      }
    });
  } catch (e) {
    console.error("Error converting Slate to HTML:", e);
    return "<p>Error loading content.</p>"; // Fallback HTML
  }
  return html;
};

// --- Toolbar Component ---
// +++ Rewritten MenuBar for TipTap +++
const MenuBar = ({ editor, onSaveRequest, isLoading, noteId }) => {
  // +++ Move useCallback before the conditional return +++
  const addTable = useCallback(() => {
    // Ensure editor exists before using it inside the callback
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  }, [editor]); // Dependency array remains the same

  // +++ PDF Export Function (Adapted for TipTap) +++
  const handleExportPDF = async () => {
    // Ensure editor exists before proceeding
    if (!editor) return;

    const editorContentElement = document.querySelector(".tiptap"); // Target TipTap content
    if (!editorContentElement) {
      alert("Could not find editor content to export.");
      return;
    }

    // --- Revised PDF Export Logic ---
    const originalStyle = {
      overflow: editorContentElement.style.overflow,
      height: editorContentElement.style.height,
      width: editorContentElement.style.width,
      caretColor: editorContentElement.style.caretColor,
    };
    editorContentElement.style.overflow = "visible";
    editorContentElement.style.height = "auto";
    editorContentElement.style.width = "auto"; // Use auto width for capture
    editorContentElement.style.caretColor = "transparent";

    const computedStyle = window.getComputedStyle(editorContentElement);
    // Use a fallback background, but primary goal is visible text
    const backgroundColor = computedStyle.backgroundColor || "#ffffff"; // Default to white if needed
    const elementWidth = editorContentElement.scrollWidth;
    const elementHeight = editorContentElement.scrollHeight;

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(editorContentElement, {
        // scale: 2, // Remove scale for now
        useCORS: true,
        backgroundColor: backgroundColor, // Try capturing background
        width: elementWidth,
        height: elementHeight,
        x: 0,
        y: 0,
        logging: true,
        onclone: (clonedDoc) => {
          // --- Force text color to black for PDF visibility ---
          const clonedContent = clonedDoc.querySelector(".tiptap");
          if (clonedContent) {
            clonedContent.style.color = "black"; // Force text black
            // Force background white on body for consistency
            clonedDoc.body.style.backgroundColor = "white";
            // Apply to all children elements as well
            clonedContent.querySelectorAll("*").forEach((el) => {
              if (el.style) {
                // Check if style property exists
                el.style.color = "black";
                // Avoid overriding specific background colors like code blocks if possible
                // You might need more specific selectors if this overrides too much
              }
            });
          }
          // --- End forcing text color ---
        },
      });

      // Restore original styles
      editorContentElement.style.overflow = originalStyle.overflow;
      editorContentElement.style.height = originalStyle.height;
      editorContentElement.style.width = originalStyle.width;
      editorContentElement.style.caretColor = originalStyle.caretColor;

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // --- Use Standard A4 Page Size ---
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "l" : "p",
        unit: "px", // Use pixels for initial setup based on image
        format: "a4", // Use standard A4 size
        hotfixes: ["px_scaling"],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate the aspect ratio
      const ratio = imgWidth / imgHeight;
      let newImgWidth = pdfWidth; // Fit to page width
      let newImgHeight = newImgWidth / ratio;

      // If scaled height is still too large for the page, scale by height instead
      if (newImgHeight > pdfHeight) {
        newImgHeight = pdfHeight;
        newImgWidth = newImgHeight * ratio;
      }

      // Center the image (optional)
      const xPos = (pdfWidth - newImgWidth) / 2;
      const yPos = (pdfHeight - newImgHeight) / 2;

      // Add the image, scaled to fit the A4 page
      pdf.addImage(
        imgData,
        "PNG",
        xPos > 0 ? xPos : 0, // Add x offset for centering if needed
        yPos > 0 ? yPos : 0, // Add y offset for centering if needed
        newImgWidth,
        newImgHeight
      );
      // --- End Standard A4 Page Size Logic ---

      pdf.save(
        `${noteId || "notes"}_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Check console for details.");
      // Restore original styles even on error
      editorContentElement.style.overflow = originalStyle.overflow;
      editorContentElement.style.height = originalStyle.height;
      editorContentElement.style.width = originalStyle.width;
      editorContentElement.style.caretColor = originalStyle.caretColor;
    }
    // --- End Revised PDF Export Logic ---
  };

  // +++ Conditional return remains +++
  if (!editor) {
    return null;
  }

  const handleSave = () => {
    if (onSaveRequest) {
      onSaveRequest(editor.getHTML()); // Get HTML content from TipTap
    }
  };

  return (
    <ToolbarContainer>
      {/* --- TipTap Toolbar Buttons --- */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <FaBold />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <FaItalic />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <FaStrikethrough />
      </ToolbarButton>
      {/* --- Heading Buttons --- */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <LuHeading1 />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <LuHeading2 />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <LuHeading3 />
      </ToolbarButton>
      {/* --- List Buttons --- */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <FaListUl />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <FaListOl />
      </ToolbarButton>
      {/* --- Block Buttons --- */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <FaQuoteRight />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <FaCode />
      </ToolbarButton>
      {/* --- Table Button --- */}
      <ToolbarButton onClick={addTable} title="Insert Table">
        <FaTable />
      </ToolbarButton>
      {/* Add more buttons for table operations if needed (e.g., add row/col, delete table) */}

      {/* --- Save and Export Buttons (Keep at the end or group logically) --- */}
      <span style={{ marginLeft: "auto" }}>
        {" "}
        {/* Push save/export to the right */}
        <ToolbarButton
          onClick={handleSave}
          disabled={isLoading}
          title="Save Note"
        >
          <FaSave />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleExportPDF}
          disabled={isLoading}
          title="Export PDF"
        >
          <FaFilePdf />
        </ToolbarButton>
      </span>
    </ToolbarContainer>
  );
};

// --- NotesEditor Component ---
// +++ Rewritten NotesEditor for TipTap +++
function NotesEditor({
  initialValue,
  onSaveRequest,
  isLoading = false,
  noteId,
}) {
  // Removed Slate specific state and refs
  // const [editorValue, setEditorValue] = useState(DEFAULT_VALUE); // Removed
  // const editorRef = useRef(null); // Removed

  // +++ Added TipTap State +++
  // const [editorContent, setEditorContent] = useState(""); // Managed internally by TipTap now
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [internalError, setInternalError] = useState(null);

  // +++ TipTap useEditor Hook +++
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: {
            class: "code-block-wrapper",
          },
        },
        // Ensure other StarterKit defaults are fine (bold, italic, lists etc.)
      }),
      // Add Table extensions
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // +++ Add Markdown Extension +++
      Markdown.configure({
        html: true, // Allow HTML rendering
        tightLists: true, // No <p> inside <li> in markdown output
        tightListClass: "tight", // Add class to tight lists if needed
        bulletListMarker: "*", // Or '-'
        linkify: true, // Create links from URLs
        breaks: true, // Convert soft breaks to <br>
      }),
      // Add Placeholder extension if desired
      // Placeholder.configure({ placeholder: 'Start typing your notes...' }),
    ],
    // Content is set via useEffect below to handle async loading and conversion
    content: "", // Start empty, load via useEffect
    editable: !isLoading, // Initial editable state
    // --- TipTap Editor Event Handlers ---
    onUpdate: ({ editor }) => {
      // Handle content changes if needed (e.g., auto-save debounce)
      // console.log("Editor Updated:", editor.getHTML());
    },
    onCreate: ({ editor }) => {
      // Can perform actions once the editor is created but before content is fully set
      // Note: Content setting happens in useEffect
    },
    onTransaction: ({ editor, transaction }) => {
      // Check if the document content actually changed
      if (transaction.docChanged) {
        setIsEditorReady(true); // Mark ready once content is likely set/changed
      }
    },
    onDestroy: () => {
      setIsEditorReady(false);
    },
  });

  // +++ Effect to handle initialValue loading and conversion +++
  useEffect(() => {
    if (editor && initialValue !== undefined && !isLoading) {
      // Only run if editor exists, value provided, and not loading
      setIsEditorReady(false); // Mark as not ready while processing
      setInternalError(null); // Clear previous errors
      let contentToLoad = "";
      try {
        if (typeof initialValue === "string") {
          // Assume it's HTML already
          contentToLoad = initialValue;
        } else if (Array.isArray(initialValue) && initialValue.length > 0) {
          // Attempt conversion from Slate JSON (simplified)
          console.log("Attempting to convert Slate JSON to HTML...");
          contentToLoad = slateToHtml(initialValue);
        } else if (
          initialValue === null ||
          initialValue === "" ||
          (Array.isArray(initialValue) && initialValue.length === 0)
        ) {
          contentToLoad = "<p></p>"; // Use an empty paragraph for explicitly empty content
        } else {
          console.warn(
            "NotesEditor: Received unknown initialValue format.",
            initialValue
          );
          contentToLoad =
            "<p>Could not load content due to unknown format.</p>";
          setInternalError("Invalid note format.");
        }

        // Sanitize before setting content
        const sanitizedContent = DOMPurify.sanitize(contentToLoad);

        // Use TipTap's commands to set content
        // Check if content actually needs updating to avoid unnecessary transactions
        if (editor.getHTML() !== sanitizedContent) {
          editor.commands.setContent(sanitizedContent, false); // false = don't emit update event
          // Force focus or selection reset if needed after setting content
          // editor.commands.focus('end');
        }
        // Let onTransaction handle setting isEditorReady based on docChanged
        // setIsEditorReady(true); // Mark as ready after processing
      } catch (error) {
        console.error("Error processing initial editor content:", error);
        setInternalError("Failed to load note content.");
        editor.commands.setContent("<p>Error loading content.</p>", false);
        // setIsEditorReady(true); // Mark as ready even on error
      }
    } else if (isLoading) {
      setIsEditorReady(false); // Ensure not ready while loading
    }
  }, [editor, initialValue, isLoading]); // Rerun when editor, value, or loading state changes

  // +++ Effect to update editable state based on isLoading +++
  useEffect(() => {
    if (editor) {
      // Only allow editing if not loading AND the editor is considered ready
      editor.setEditable(!isLoading && isEditorReady);
    }
  }, [editor, isLoading, isEditorReady]);

  // --- Render Logic ---
  return (
    <EditorContainer>
      {/* Keep Loading Overlay */}
      {isLoading && <LoadingOverlay>Loading Note...</LoadingOverlay>}
      {/* Keep Internal Error Display */}
      {internalError && (
        <div
          style={{
            color: "var(--danger-color)",
            padding: "10px",
            background: "rgba(234, 67, 53, 0.1)",
            borderBottom: "1px solid var(--bg-tertiary)",
          }}
        >
          Error: {internalError}
        </div>
      )}
      {/* Render TipTap MenuBar */}
      <MenuBar
        editor={editor}
        onSaveRequest={onSaveRequest} // Pass the actual save handler
        isLoading={isLoading || !isEditorReady}
        noteId={noteId}
      />
      {/* Optional Bubble Menu for inline formatting */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: "top" }}
          className="bubble-menu"
        >
          {/* Add buttons to bubble menu */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          >
            <FaBold />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          >
            <FaItalic />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
          >
            <FaStrikethrough />
          </ToolbarButton>
          {/* Add Link button example */}
          {/* <ToolbarButton onClick={setLink} active={editor.isActive('link')}><FaLink /></ToolbarButton> */}
        </BubbleMenu>
      )}
      {/* Render TipTap EditorContent */}
      <ContentArea>
        <EditorContent editor={editor} />
      </ContentArea>
    </EditorContainer>
  );
}

export default NotesEditor;
