import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react"; // Added useRef
import styled from "styled-components";
import {
  createEditor,
  Editor,
  Transforms,
  Element as SlateElement,
  Text,
  Node, // Keep Node import
  Range,
} from "slate";
import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react";
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
  FaTable,
  FaSquareRootAlt,
  FaSave, // Import Save Icon
} from "react-icons/fa";
import { BiHeading } from "react-icons/bi";
import "katex/dist/katex.min.css";
import katex from "katex";

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
  flex-wrap: wrap; /* Allow wrapping */
  gap: 10px; /* Add gap */
`;

const EditorTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
  flex-grow: 1; /* Allow title to take space */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

// Style for Save Button (similar to Export)
const SaveButton = styled.button`
  background-color: var(--success-color); /* Green for save */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #218838; /* Darker green */
  }

  &:disabled {
    background-color: var(--text-secondary);
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  color: var(--text-primary);
  font-size: 1.2em;
  border-radius: 8px; /* Match container */
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

const CornellNoteContainer = styled.div`
  display: grid;
  grid-template-columns: 30% 70%;
  gap: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin: 12px 0;
  overflow: hidden;
`;

const CornellQuestionColumn = styled.div`
  background-color: var(--bg-tertiary);
  padding: 12px;
  border-right: 1px solid var(--border-color);
  font-weight: 500;
`;

const CornellAnswerColumn = styled.div`
  padding: 12px;
`;

const CornellSummary = styled.div`
  grid-column: span 2;
  border-top: 1px solid var(--border-color);
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  font-style: italic;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;

  td,
  th {
    border: 1px solid var(--bg-tertiary);
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: var(--bg-tertiary);
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const MathWrapper = styled.div`
  padding: 8px;
  margin: 8px 0;
  background-color: rgba(66, 133, 244, 0.05);
  border-radius: 4px;
  overflow-x: auto;
  position: relative;

  &.display-mode {
    text-align: center;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--bg-tertiary);
  padding-bottom: 12px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 0;

  &:hover {
    color: var(--text-primary);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--bg-tertiary);
  border-radius: 4px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const DEFAULT_VALUE = [
  {
    type: "paragraph",
    children: [{ text: "" }], // Ensure default has non-null text
  },
];

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

const FormatButton = ({ format, icon, blockFormat = false, tooltip }) => {
  const editor = useSlate();

  const isFormatActive = () => {
    if (blockFormat) {
      const [match] = Editor.nodes(editor, {
        match: (n) => n.type === format,
      });
      return !!match;
    } else {
      const marks = Editor.marks(editor);
      return marks ? marks[format] === true : false;
    }
  };

  const toggleFormat = (event) => {
    event.preventDefault();

    if (blockFormat) {
      const isActive = isFormatActive();
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
    } else {
      const isActive = isFormatActive();
      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    }
  };

  return (
    <ToolbarButton
      active={isFormatActive()}
      onMouseDown={toggleFormat}
      title={tooltip}
    >
      {icon}
    </ToolbarButton>
  );
};

const renderMath = (latex, displayMode = false) => {
  if (latex == null || latex === undefined || typeof latex !== "string") {
    console.warn("Attempted to render invalid LaTeX:", latex);
    return ""; // Return empty string instead of null
  }

  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode: displayMode,
      trust: true,
      strict: false,
    });
  } catch (err) {
    console.error("Math rendering error:", err, "for LaTeX:", latex);
    return `<span style="color: red;">Error: ${
      err.message || "Failed to render formula"
    }</span>`;
  }
};

const Element = ({ attributes, children, element }) => {
  // Safety check for null/undefined element
  if (!element) {
    console.warn("Received null/undefined element in Element component");
    return <p {...attributes}>{children}</p>;
  }

  // Default to paragraph type if none specified
  const elementType = element.type || "paragraph";

  switch (elementType) {
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
            onChange={() => {}}
            contentEditable={false}
          />
          <span>{children}</span>
        </div>
      );
    case "cornell-note":
      return (
        <CornellNoteContainer {...attributes} contentEditable={false}>
          <CornellQuestionColumn>{element.question}</CornellQuestionColumn>
          <CornellAnswerColumn>{element.answer}</CornellAnswerColumn>
          {element.summary && (
            <CornellSummary>{element.summary}</CornellSummary>
          )}
          {children}
        </CornellNoteContainer>
      );
    case "table":
      return (
        <StyledTable {...attributes}>
          <tbody>{children}</tbody>
        </StyledTable>
      );
    case "table-row":
      return <tr {...attributes}>{children}</tr>;
    case "table-cell":
      return <td {...attributes}>{children}</td>;
    case "table-header":
      return <th {...attributes}>{children}</th>;
    case "math":
      // Handle potentially null formula
      const formula = element.formula || "";
      const displayMode = !!element.displayMode;

      return (
        <MathWrapper
          {...attributes}
          className={displayMode ? "display-mode" : ""}
        >
          <span
            contentEditable={false}
            dangerouslySetInnerHTML={{
              __html: renderMath(formula, displayMode),
            }}
          />
          <span style={{ position: "absolute", opacity: 0 }}>{children}</span>
        </MathWrapper>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const TableButton = ({ editor }) => {
  const [showModal, setShowModal] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  const insertTable = () => {
    if (rows < 1 || columns < 1) return;

    const table = {
      type: "table",
      children: Array.from({ length: rows }).map((_, row) => ({
        type: "table-row",
        children: Array.from({ length: columns }).map((_, col) => ({
          type: row === 0 ? "table-header" : "table-cell",
          children: [{ text: "" }],
        })),
      })),
    };

    Transforms.insertNodes(editor, table);
    setShowModal(false);
  };

  return (
    <>
      <ToolbarButton onClick={() => setShowModal(true)} title="Insert Table">
        <FaTable />
      </ToolbarButton>

      {showModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>Insert Table</ModalTitle>
              <ModalCloseButton onClick={() => setShowModal(false)}>
                ×
              </ModalCloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>Rows:</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Columns:</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              />
            </FormGroup>

            <ButtonRow>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "white",
                }}
                onClick={insertTable}
              >
                Insert
              </button>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}
    </>
  );
};

const MathButton = ({ editor }) => {
  const [showModal, setShowModal] = useState(false);
  const [formula, setFormula] = useState("\\frac{a}{b} + c^2");
  const [displayMode, setDisplayMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    try {
      const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode,
      });
      setPreviewHtml(html);
    } catch (err) {
      setPreviewHtml(
        `<span style="color: var(--danger-color)">Error: ${err.message}</span>`
      );
    }
  }, [formula, displayMode]);

  const insertMath = () => {
    const mathNode = {
      type: "math",
      formula,
      displayMode,
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, mathNode);
    setShowModal(false);
  };

  return (
    <>
      <ToolbarButton
        onClick={() => setShowModal(true)}
        title="Insert Math Formula"
      >
        <FaSquareRootAlt />
      </ToolbarButton>

      {showModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>Insert Math Formula</ModalTitle>
              <ModalCloseButton onClick={() => setShowModal(false)}>
                ×
              </ModalCloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>LaTeX Formula:</Label>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter LaTeX formula (e.g. \\frac{a}{b})"
              />
            </FormGroup>

            <FormGroup>
              <label>
                <input
                  type="checkbox"
                  checked={displayMode}
                  onChange={(e) => setDisplayMode(e.target.checked)}
                />{" "}
                Display mode (centered, larger)
              </label>
            </FormGroup>

            <FormGroup>
              <Label>Preview:</Label>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  minHeight: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: displayMode ? "center" : "flex-start",
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </FormGroup>

            <ButtonRow>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "white",
                }}
                onClick={insertMath}
              >
                Insert
              </button>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}
    </>
  );
};

// Improve the sanitizeNode function to handle all cases of null text and ensure valid children structure
const sanitizeNode = (node) => {
  // If node itself is null/undefined, return a default paragraph
  if (!node || typeof node !== "object") {
    console.warn(
      "Sanitize: Received invalid node, returning default paragraph.",
      node
    );
    return { type: "paragraph", children: [{ text: "" }] };
  }

  // Ensure node has a type, default to paragraph
  const type = typeof node.type === "string" ? node.type : "paragraph";

  // Create a safe copy of the node without reference to the original
  let cleanNode = { ...node, type };

  // Handle children: Ensure it's an array and sanitize recursively
  if (
    !node.children ||
    !Array.isArray(node.children)
    // Allow empty children for void elements if necessary in the future, but generally require children
    // || node.children.length === 0 // Removed this check, empty children might be valid during intermediate steps
  ) {
    // If children are missing or not an array, create a default text node child
    // unless it's a known void element type (add check here if needed)
    console.warn(
      `Sanitize: Node type '${type}' has invalid children, adding default text child.`,
      node.children
    );
    cleanNode.children = [{ text: "" }];
  } else {
    // Process children recursively
    const processedChildren = [];
    for (const child of node.children) {
      if (!child) {
        // Skip null/undefined children, but log it
        console.warn(
          `Sanitize: Found null/undefined child in node type '${type}', skipping.`
        );
        continue; // Skip this child entirely
      }

      if (Text.isText(child)) {
        // For text nodes, ensure text property exists and is a string
        processedChildren.push({
          ...child,
          text: typeof child.text === "string" ? child.text : "", // Ensure text is always a string
        });
      } else if (SlateElement.isElement(child)) {
        // Only sanitize if it's potentially a Slate Element
        // Avoid sanitizing plain objects that might be part of the structure temporarily
        processedChildren.push(sanitizeNode(child)); // Recursively sanitize element children
      } else {
        // If it's not Text or Element (e.g., plain object during parsing?), try to represent it safely
        console.warn(
          `Sanitize: Child is neither Text nor Element in node type '${type}', converting to text.`,
          child
        );
        // Ensure the fallback has a text property
        processedChildren.push({
          text: typeof child === "string" ? child : JSON.stringify(child),
        });
      }
    }

    // Ensure the children array is not empty after processing, unless it's a void element
    // For now, always ensure at least one child node exists for non-void elements
    if (processedChildren.length === 0 /* && !isVoidElement(cleanNode) */) {
      console.warn(
        `Sanitize: Node type '${type}' ended up with empty children after processing, adding default text child.`
      );
      cleanNode.children = [{ text: "" }];
    } else {
      cleanNode.children = processedChildren;
    }
  }

  // Special handling for specific node types (ensure properties are correct)
  if (type === "math") {
    cleanNode.formula =
      typeof cleanNode.formula === "string" ? cleanNode.formula : "";
    cleanNode.displayMode = !!cleanNode.displayMode;
    // Math nodes must have a single empty text child according to Slate patterns
    if (
      !cleanNode.children ||
      cleanNode.children.length === 0 ||
      !Text.isText(cleanNode.children[0])
    ) {
      cleanNode.children = [{ text: "" }];
    } else if (cleanNode.children.length > 1) {
      // Ensure math nodes only have a single child
      cleanNode.children = [cleanNode.children[0]];
    }
  } else if (type === "cornell-note") {
    cleanNode.question =
      typeof cleanNode.question === "string" ? cleanNode.question : "";
    cleanNode.answer =
      typeof cleanNode.answer === "string" ? cleanNode.answer : "";
    cleanNode.summary =
      typeof cleanNode.summary === "string" ? cleanNode.summary : "";
    // Cornell notes might have specific children structure, ensure it's valid or default
    if (
      !cleanNode.children ||
      cleanNode.children.length === 0 ||
      !Text.isText(cleanNode.children[0])
    ) {
      cleanNode.children = [{ text: "" }]; // Ensure default child if needed
    }
  } else if (type === "task-item") {
    cleanNode.checked = !!cleanNode.checked;
    // Ensure children are valid for task item text
  }
  // --- Corrected Table Sanitization ---
  else if (type === "table") {
    // Table should only contain table-row elements
    if (
      cleanNode.children.some(
        (child) => !SlateElement.isElement(child) || child.type !== "table-row"
      )
    ) {
      console.warn(
        `Sanitize: Table element contains non-table-row children, filtering.`
      );
      cleanNode.children = cleanNode.children.filter(
        (child) => SlateElement.isElement(child) && child.type === "table-row"
      );
      if (cleanNode.children.length === 0) {
        // Add a default row/cell structure if table becomes empty
        cleanNode.children = [
          {
            type: "table-row",
            children: [{ type: "table-cell", children: [{ text: "" }] }],
          },
        ];
      }
    }
  } else if (type === "table-row") {
    // Table-row should only contain table-cell or table-header elements
    if (
      cleanNode.children.some(
        (child) =>
          !SlateElement.isElement(child) ||
          !["table-cell", "table-header"].includes(child.type)
      )
    ) {
      console.warn(
        `Sanitize: Table-row element contains invalid children, filtering.`
      );
      cleanNode.children = cleanNode.children.filter(
        (child) =>
          SlateElement.isElement(child) &&
          ["table-cell", "table-header"].includes(child.type)
      );
      if (cleanNode.children.length === 0) {
        // Add a default cell if row becomes empty
        cleanNode.children = [{ type: "table-cell", children: [{ text: "" }] }];
      }
    }
  } else if (type === "table-cell" || type === "table-header") {
    // Table-cell/header should contain Text nodes (or valid inline elements, but primarily Text)
    // Ensure it doesn't contain block elements and has at least one Text node.
    if (
      cleanNode.children.some(
        (child) =>
          SlateElement.isElement(child) /* && !isInlineElement(child) */
      )
    ) {
      // Simplified: Assume only Text for now
      console.warn(
        `Sanitize: Table cell/header type '${type}' contains block-level elements, filtering.`
      );
      // Filter out block elements, keep Text nodes
      cleanNode.children = cleanNode.children.filter((child) =>
        Text.isText(child)
      );
    }
    // Ensure there's at least one child, and it's a Text node
    if (
      cleanNode.children.length === 0 ||
      !Text.isText(cleanNode.children[0])
    ) {
      console.warn(
        `Sanitize: Table cell/header type '${type}' has invalid or empty children, adding default text child.`
      );
      cleanNode.children = [{ text: "" }]; // Ensure default text child
    }
  }
  // --- End Corrected Table Sanitization ---

  // Final check: Ensure children is always an array
  if (!Array.isArray(cleanNode.children)) {
    console.error(
      `Sanitize: Node type '${type}' children is not an array after processing! Forcing default.`,
      cleanNode.children
    );
    cleanNode.children = [{ text: "" }];
  }

  return cleanNode;
};

// Helper function to process inline markdown formatting (**bold**, *italic*, `code`)
// Returns an array of Slate Text nodes, ensuring at least one node [{ text: '' }]
const processTextFormatting = (text) => {
  // Ensure text is a string
  if (typeof text !== "string") {
    text = String(text || "");
  }

  // If no markdown characters are present or text is empty, return a single text node
  if (!text || !text.match(/(\*\*|__|\*|_|`)/)) {
    // Ensure even empty strings result in a valid text node structure
    return [{ text: text || "" }];
  }

  let segments = [{ text: text, formats: {} }]; // Start with the whole text and no formats

  // Define formatters (regex, mark) - Order can matter for nested/overlapping cases
  const formatters = [
    { regex: /(`)(.*?)\1/g, mark: "code" }, // Code: `text` (Process first to prevent inner parsing)
    { regex: /(\*\*|__)(.*?)\1/g, mark: "bold" }, // Bold: **text** or __text__
    { regex: /(\*|_)(.*?)\1/g, mark: "italic" }, // Italic: *text* or _text_ (Handles remaining *)
    // Add other inline formats like strikethrough if needed: { regex: /(~~)(.*?)\1/g, mark: 'strikethrough' },
  ];

  // Apply formatters iteratively
  formatters.forEach(({ regex, mark }) => {
    let newSegments = [];
    segments.forEach((segment) => {
      // Skip if already processed for this mark or if it's code (code shouldn't contain other marks)
      if (
        segment.formats[mark] ||
        (mark !== "code" && segment.formats["code"])
      ) {
        newSegments.push(segment);
        return;
      }

      let lastIndex = 0;
      let match;
      // Reset regex lastIndex before each exec loop on a new segment
      regex.lastIndex = 0;
      while ((match = regex.exec(segment.text)) !== null) {
        const textBefore = segment.text.substring(lastIndex, match.index);
        // Group 2 is the content for **/__/*/_ , Group 1 for `
        const matchedText = match[2] !== undefined ? match[2] : match[1];

        if (textBefore) {
          newSegments.push({
            text: textBefore,
            formats: { ...segment.formats },
          });
        }
        // Ensure matchedText is not undefined before pushing
        if (matchedText !== undefined) {
          newSegments.push({
            text: matchedText,
            formats: { ...segment.formats, [mark]: true },
          });
        }
        lastIndex = regex.lastIndex;
        // Handle empty matches correctly if regex allows (e.g., ``)
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      const textAfter = segment.text.substring(lastIndex);
      if (textAfter) {
        newSegments.push({ text: textAfter, formats: { ...segment.formats } });
      }
    });
    segments = newSegments;
  });

  // Convert segments to Slate Text nodes
  const children = segments
    .map((seg) => ({ text: seg.text, ...seg.formats }))
    .filter((node) => node.text !== undefined && node.text !== null); // Filter out nodes without text

  // Ensure children is never empty and always contains valid text nodes
  // If filtering results in an empty array, return the default empty text node.
  if (children.length === 0) {
    return [{ text: "" }];
  }

  return children;
};

// Improve the deserialize function to handle all edge cases and use the enhanced sanitizeNode
const deserialize = (content) => {
  // Handle null or undefined content
  if (content === null || content === undefined) {
    console.warn(
      "Deserialize: Received null or undefined content, using default."
    );
    return DEFAULT_VALUE;
  }

  try {
    // If content is already a Slate structure (array of nodes)
    if (Array.isArray(content)) {
      if (content.length === 0) {
        console.warn("Deserialize: Received empty array, using default.");
        return DEFAULT_VALUE;
      }

      // Sanitize each node deeply to ensure no null text nodes or invalid structures
      const sanitizedContent = content
        .map((node) => sanitizeNode(node)) // Use the enhanced sanitizeNode
        .filter(Boolean); // Filter out any potential nulls returned by sanitizeNode (though it shouldn't return null)

      // Ensure the final result is not empty and is valid
      if (
        sanitizedContent.length === 0 ||
        !SlateElement.isElement(sanitizedContent[0])
      ) {
        console.warn(
          "Deserialize: Array content sanitized to invalid state, using default.",
          sanitizedContent
        );
        return DEFAULT_VALUE;
      }
      return sanitizedContent;
    }

    // If content is a string, parse it
    if (typeof content === "string") {
      if (content.trim() === "") {
        console.warn("Deserialize: Received empty string, using default.");
        return DEFAULT_VALUE;
      }

      try {
        // --- Start of String Parsing Logic ---
        // Convert Markdown tables and math to intermediate HTML-like tags for easier parsing
        let processedContent = content;
        const tablePattern =
          /^\s*\|(.+)\|\s*\n\s*\|([\s\-|:]+)\|\s*\n((?:^\s*\|(?:.*)\|\s*\n?)+)/gm;
        processedContent = processedContent.replace(
          tablePattern,
          (match, headerRow, separator, bodyRows) => {
            // Basic validation
            if (!headerRow || !separator || !bodyRows) return match;

            const headers = headerRow
              .split("|")
              .map((h) => h.trim())
              .filter(Boolean);
            const rows = bodyRows
              .split("\n")
              .map((r) => r.trim())
              .filter((r) => r.startsWith("|") && r.endsWith("|"));

            if (headers.length === 0 || rows.length === 0) return match; // Avoid creating empty tables

            let tableMarkup = "\n<table>\n  <tr>";
            headers.forEach((header) => {
              tableMarkup += `<th>${header}</th>`;
            });
            tableMarkup += "</tr>\n";

            rows.forEach((row) => {
              const cells = row
                .slice(1, -1)
                .split("|")
                .map((c) => c.trim());
              // Ensure cell count matches header count? Optional, maybe pad.
              tableMarkup += "  <tr>";
              // Use headers.length for cell iteration to handle potentially mismatched columns
              for (let k = 0; k < headers.length; k++) {
                tableMarkup += `<td>${cells[k] || ""}</td>`; // Add empty cell if missing
              }
              tableMarkup += "</tr>\n";
            });

            tableMarkup += "</table>\n";
            return tableMarkup;
          }
        );

        // Convert LaTeX math $$...$$ and $...$ to tags
        processedContent = processedContent.replace(
          /\$\$(.*?)\$\$/gs,
          "<mathdisplay>$1</math>"
        ); // Display math
        processedContent = processedContent.replace(
          /\$([^$\n]+?)\$/g,
          "<math inline>$1</math>"
        ); // Inline math

        const normalizedContent = processedContent.replace(/\r\n/g, "\n");
        const lines = normalizedContent.split("\n");
        let nodes = []; // Initialize nodes array
        let currentList = null;
        let i = 0;

        // Check if intermediate tags exist for special parsing loop
        const hasExtendedFormatting = /<(table|mathdisplay|math inline)>/.test(
          normalizedContent
        );

        if (hasExtendedFormatting) {
          // --- Parsing Loop for Content with Intermediate Tags ---
          let currentIndex = 0;
          let currentText = "";

          while (currentIndex < normalizedContent.length) {
            const tableMatch = normalizedContent.indexOf(
              "<table>",
              currentIndex
            );
            const mathMatch = normalizedContent.indexOf("<math", currentIndex);

            let firstMatchIndex = -1;
            let isTable = false;
            let isMath = false;

            if (
              tableMatch !== -1 &&
              (firstMatchIndex === -1 || tableMatch < firstMatchIndex)
            ) {
              firstMatchIndex = tableMatch;
              isTable = true;
              isMath = false;
            }
            if (
              mathMatch !== -1 &&
              (firstMatchIndex === -1 || mathMatch < firstMatchIndex)
            ) {
              firstMatchIndex = mathMatch;
              isTable = false;
              isMath = true;
            }

            // Process text before the next tag
            const textBefore =
              firstMatchIndex === -1
                ? normalizedContent.substring(currentIndex)
                : normalizedContent.substring(currentIndex, firstMatchIndex);
            if (textBefore.trim()) {
              currentText += textBefore;
              // Split accumulated text into paragraphs/blocks based on newlines
              const textLines = currentText.trim().split("\n");
              textLines.forEach((line) => {
                if (line.trim()) {
                  nodes.push({
                    type: "paragraph",
                    children: processTextFormatting(line.trim()),
                  });
                }
              });
              currentText = ""; // Reset accumulated text
            } else if (textBefore) {
              // Preserve whitespace between blocks if needed?
              currentText += textBefore; // Accumulate whitespace or minor text
            }

            if (firstMatchIndex === -1) {
              // No more tags, break loop
              currentIndex = normalizedContent.length;
              continue;
            }

            // --- Process Found Tag ---
            currentIndex = firstMatchIndex; // Move index to the start of the tag

            if (isTable) {
              const tableEnd = normalizedContent.indexOf(
                "</table>",
                currentIndex
              );
              if (tableEnd !== -1) {
                const tableContent = normalizedContent.substring(
                  currentIndex + 7,
                  tableEnd
                ); // 7 is length of <table>
                const rows = tableContent.match(/<tr>(.*?)<\/tr>/gs);
                if (rows) {
                  const tableRows = [];
                  rows.forEach((row, rowIndex) => {
                    const headerCells = row.match(/<th>(.*?)<\/th>/gs);
                    const dataCells = row.match(/<td>(.*?)<\/td>/gs);
                    const cells = headerCells || dataCells; // Prefer headers if present

                    if (cells) {
                      const rowCells = [];
                      cells.forEach((cell) => {
                        const isHeader =
                          headerCells && headerCells.includes(cell);
                        const cellContent = cell.replace(/<\/?(th|td)>/g, "");
                        // *** Use processTextFormatting for cell content ***
                        const formattedChildren = processTextFormatting(
                          cellContent.trim()
                        );
                        rowCells.push({
                          type: isHeader ? "table-header" : "table-cell",
                          // *** Ensure children is always valid ***
                          children:
                            formattedChildren.length > 0
                              ? formattedChildren
                              : [{ text: "" }],
                        });
                      });
                      if (rowCells.length > 0) {
                        tableRows.push({
                          type: "table-row",
                          children: rowCells,
                        });
                      }
                    }
                  });
                  if (tableRows.length > 0) {
                    nodes.push({ type: "table", children: tableRows });
                  }
                }
                currentIndex = tableEnd + 8; // Move past </table>
              } else {
                // Malformed table, treat tag as text
                currentText += "<table>";
                currentIndex += 7;
              }
            } else if (isMath) {
              const isDisplay = normalizedContent.startsWith(
                "<mathdisplay>",
                currentIndex
              );
              const mathTag = isDisplay ? "<mathdisplay>" : "<math inline>";
              const mathEnd = normalizedContent.indexOf(
                "</math>",
                currentIndex
              );

              if (mathEnd !== -1) {
                const formula = normalizedContent.substring(
                  currentIndex + mathTag.length,
                  mathEnd
                );
                nodes.push({
                  type: "math",
                  formula: formula.trim(),
                  displayMode: isDisplay,
                  children: [{ text: "" }], // Math node needs an empty text child
                });
                currentIndex = mathEnd + 7; // Move past </math>
              } else {
                // Malformed math tag, treat as text
                currentText += mathTag;
                currentIndex += mathTag.length;
              }
            }
          } // End while loop for extended parsing
        } else {
          // --- Standard Markdown Parsing (No intermediate tags) ---
          // Check for Cornell Notes format first (optional, can be complex)
          const hasCornellFormat = lines.some(/* ... */); // Keep Cornell check if implemented

          if (hasCornellFormat) {
            // ... (Keep existing Cornell parsing logic if present) ...
            // Ensure processTextFormatting is used for question/answer/summary
          } else {
            // --- Standard Markdown Line-by-Line Parsing ---
            while (i < lines.length) {
              let line = lines[i]; // Don't trim yet, preserve indentation for potential code blocks?

              // Handle empty lines: End current list if any
              if (line.trim() === "") {
                if (currentList) {
                  nodes.push(currentList);
                  currentList = null;
                }
                i++;
                continue;
              }

              // Trim line for block detection
              const trimmedLine = line.trim();

              // Check for different markdown elements (headings, lists, quotes, tasks, paragraphs)
              // Ensure processTextFormatting is called for the text content of each element

              // Heading 1-3
              if (trimmedLine.startsWith("# ")) {
                if (currentList) {
                  nodes.push(currentList);
                  currentList = null;
                }
                const level = trimmedLine.match(/^#+/)[0].length;
                const headingText = trimmedLine.substring(level).trim();
                const type =
                  level === 1
                    ? "heading-one"
                    : level === 2
                    ? "heading-two"
                    : "heading-three";
                if (level <= 3) {
                  nodes.push({
                    type: type,
                    children: processTextFormatting(headingText),
                  });
                } else {
                  // Treat deeper headings as paragraphs or h3
                  nodes.push({
                    type: "heading-three",
                    children: processTextFormatting(trimmedLine),
                  });
                }
                i++;
              }
              // Bulleted List
              else if (
                trimmedLine.startsWith("- ") ||
                trimmedLine.startsWith("* ")
              ) {
                const listItemText = trimmedLine.substring(2);
                const formattedText = processTextFormatting(listItemText);
                const listItem = { type: "list-item", children: formattedText };

                if (!currentList || currentList.type !== "bulleted-list") {
                  if (currentList) nodes.push(currentList); // Push previous list if type changes
                  currentList = { type: "bulleted-list", children: [listItem] };
                } else {
                  currentList.children.push(listItem);
                }
                i++;
              }
              // Numbered List
              else if (/^\d+\.\s/.test(trimmedLine)) {
                const listItemText = trimmedLine
                  .substring(trimmedLine.indexOf(".") + 1)
                  .trim();
                const formattedText = processTextFormatting(listItemText);
                const listItem = { type: "list-item", children: formattedText };

                if (!currentList || currentList.type !== "numbered-list") {
                  if (currentList) nodes.push(currentList); // Push previous list if type changes
                  currentList = { type: "numbered-list", children: [listItem] };
                } else {
                  currentList.children.push(listItem);
                }
                i++;
              }
              // Block Quote
              else if (trimmedLine.startsWith("> ")) {
                if (currentList) {
                  nodes.push(currentList);
                  currentList = null;
                }
                const quoteText = trimmedLine.substring(2);
                const formattedText = processTextFormatting(quoteText);
                nodes.push({ type: "block-quote", children: formattedText });
                i++;
              }
              // Task List
              else if (
                trimmedLine.startsWith("- [ ] ") ||
                trimmedLine.startsWith("- [x] ")
              ) {
                if (currentList) {
                  nodes.push(currentList);
                  currentList = null;
                }
                const isChecked = trimmedLine.startsWith("- [x] ");
                const taskText = trimmedLine.substring(6);
                const formattedText = processTextFormatting(taskText);
                nodes.push({
                  type: "task-item",
                  checked: isChecked,
                  children: formattedText,
                });
                i++;
              }
              // Paragraph (default)
              else {
                if (currentList) {
                  nodes.push(currentList);
                  currentList = null;
                }
                const formattedText = processTextFormatting(trimmedLine);
                // Check if the previous node was a paragraph, if so, append with newline?
                // For simplicity, treat each line as a separate paragraph for now.
                nodes.push({ type: "paragraph", children: formattedText });
                i++;
              }
            } // End while loop

            // Push the last list if it exists
            if (currentList) {
              nodes.push(currentList);
            }
          } // End standard markdown parsing
        } // End Markdown/HTML parsing choice

        // --- End of String Parsing Logic ---

        // Ensure all nodes created from string parsing are also sanitized
        const deepSanitizedNodes = nodes
          .map((node) => sanitizeNode(node)) // Use enhanced sanitizeNode
          .filter(Boolean); // Filter out potential nulls

        // Ensure the final result is not empty and is valid
        if (
          deepSanitizedNodes.length === 0 ||
          !SlateElement.isElement(deepSanitizedNodes[0])
        ) {
          console.warn(
            "Deserialize: String content parsed to invalid state, using default.",
            deepSanitizedNodes
          );
          return DEFAULT_VALUE;
        }
        return deepSanitizedNodes;
      } catch (error) {
        console.error(
          "Error parsing string content:",
          error,
          "Content:",
          content
        );
        return DEFAULT_VALUE; // Fallback on parsing error
      }
    }

    // Handle objects that are not arrays (should not happen ideally)
    if (typeof content === "object") {
      console.warn(
        "Deserialize: Received object that is not an array, attempting to sanitize as single node or using default.",
        content
      );
      if (SlateElement.isElement(content)) {
        const sanitized = sanitizeNode(content);
        return [sanitized]; // Wrap single sanitized element in array
      }
      return DEFAULT_VALUE;
    }

    // Handle other types (numbers, booleans?) more safely
    console.warn(
      "Deserialize: Content is unexpected type, using default.",
      typeof content,
      content
    );
    return DEFAULT_VALUE;
  } catch (error) {
    console.error("Critical error in deserialize:", error, "Content:", content);
    return DEFAULT_VALUE; // Fallback on any unexpected error
  }
};

// --- End Deserialize Function ---

// Move the exportToPDF declaration above the NotesEditor component
const exportToPDF = async (editorRef, editorValue) => {
  // Declare variables outside of try/finally so they remain in scope
  let exportContainer = null;
  let styleElement = null;

  try {
    const content = editorRef.current;
    if (!content) {
      console.error("Editor content reference is null");
      alert("Could not find editor content to export");
      return;
    }

    alert("Preparing PDF export. This may take a moment...");

    exportContainer = document.createElement("div");
    exportContainer.style.position = "absolute";
    exportContainer.style.top = "-9999px";
    exportContainer.style.left = "-9999px";
    exportContainer.style.width = "794px";
    exportContainer.style.backgroundColor = "#ffffff";
    exportContainer.style.padding = "40px";
    exportContainer.style.color = "#000000";
    exportContainer.style.fontFamily = "Arial, sans-serif";

    // Add your desired styles for the PDF export here
    styleElement = document.createElement("style");
    styleElement.innerHTML = `
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
      }
      h1, h2, h3 {
        color: #000000;
      }
      h1 {
        font-size: 24px;
      }
      h2 {
        font-size: 22px;
      }
      h3 {
        font-size: 20px;
      }
      p {
        margin: 12px 0;
      }
      ul, ol {
        margin: 12px 0;
        padding-left: 20px;
      }
      blockquote {
        margin: 12px 0;
        padding-left: 10px;
        border-left: 2px solid #cccccc;
      }
      code {
        font-family: monospace;
        background-color: #f4f4f4;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .task-list-item {
        display: flex;
        align-items: center;
      }
      .task-checkbox {
        margin-right: 8px;
      }
    `;
    document.head.appendChild(styleElement);

    // Clone the editor content into the export container
    exportContainer.innerHTML = content.innerHTML;

    document.body.appendChild(exportContainer);

    // Use html2canvas to take a snapshot of the exportContainer
    const canvas = await html2canvas(exportContainer, {
      scale: 2, // Adjust the scale for higher resolution
    });
    const imgData = canvas.toDataURL("image/png");

    // Add the image to the PDF
    const pdf = new jsPDF();
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("TranscriptX_Notes.pdf");
  } finally {
    if (exportContainer && document.body.contains(exportContainer)) {
      document.body.removeChild(exportContainer);
    }
    if (styleElement && document.head.contains(styleElement)) {
      document.head.removeChild(styleElement);
    }
  }
};

// Add onSaveRequest, isLoading, noteId props
function NotesEditor({
  initialValue,
  onSaveRequest,
  isLoading = false,
  noteId,
}) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  // Initialize with default value, let useEffect handle the actual initialValue
  const [editorValue, setEditorValue] = useState(DEFAULT_VALUE);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [internalError, setInternalError] = useState(null); // State to track internal errors
  const editorRef = useRef(null);

  // Safely process initialValue
  useEffect(() => {
    setIsEditorReady(false); // Set to not ready while processing
    setInternalError(null); // Clear previous errors

    // Use setTimeout to ensure this runs after the initial render potentially clears state
    const timerId = setTimeout(() => {
      try {
        const processed = deserialize(initialValue); // Use the improved deserialize
        // Validate the processed value before setting state
        if (
          !Array.isArray(processed) ||
          processed.length === 0 ||
          !SlateElement.isElement(processed[0])
        ) {
          console.error(
            "NotesEditor: Deserialization resulted in invalid Slate structure, using default.",
            processed
          );
          setEditorValue(DEFAULT_VALUE);
          setInternalError(
            "Failed to load note content due to invalid format."
          );
        } else {
          // Ensure editor state is updated correctly
          // Resetting editor state completely might be safer
          editor.children = processed;
          editor.selection = null; // Reset selection
          editor.history = { undos: [], redos: [] }; // Reset history
          setEditorValue(processed); // Update React state
          // Force normalization after setting new content
          Editor.normalize(editor, { force: true });
        }
      } catch (e) {
        console.error(
          "NotesEditor: Critical error processing initial editor content:",
          e,
          "Initial Value:",
          initialValue
        );
        setEditorValue(DEFAULT_VALUE); // Fallback to default on error
        setInternalError(`Error loading notes: ${e.message}`);
      } finally {
        setIsEditorReady(true); // Set ready regardless of success/failure to show either editor or error
      }
    }, 0); // setTimeout with 0 delay

    // Cleanup function to clear the timeout if the component unmounts or initialValue changes again quickly
    return () => clearTimeout(timerId);
  }, [initialValue, editor]); // Rerun when initialValue or editor instance changes

  const renderElement = useCallback(({ attributes, children, element }) => {
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
              onChange={() => {}}
              contentEditable={false}
            />
            <span>{children}</span>
          </div>
        );
      case "cornell-note":
        return (
          <CornellNoteContainer {...attributes} contentEditable={false}>
            <CornellQuestionColumn>{element.question}</CornellQuestionColumn>
            <CornellAnswerColumn>{element.answer}</CornellAnswerColumn>
            {element.summary && (
              <CornellSummary>{element.summary}</CornellSummary>
            )}
            {children}
          </CornellNoteContainer>
        );
      case "table":
        return (
          <StyledTable {...attributes}>
            <tbody>{children}</tbody>
          </StyledTable>
        );
      case "table-row":
        return <tr {...attributes}>{children}</tr>;
      case "table-cell":
        return <td {...attributes}>{children}</td>;
      case "table-header":
        return <th {...attributes}>{children}</th>;
      case "math":
        // Handle potentially null formula
        const formula = element.formula || "";
        const displayMode = !!element.displayMode;

        return (
          <MathWrapper
            {...attributes}
            className={displayMode ? "display-mode" : ""}
          >
            <span
              contentEditable={false}
              dangerouslySetInnerHTML={{
                __html: renderMath(formula, displayMode),
              }}
            />
            <span style={{ position: "absolute", opacity: 0 }}>{children}</span>
          </MathWrapper>
        );
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const handleSaveClick = () => {
    if (onSaveRequest) {
      onSaveRequest(editorValue); // Pass the current editor state
    }
  };

  // Show loading state if the parent indicates loading OR if the editor isn't ready yet
  if (isLoading || !isEditorReady) {
    return (
      <EditorContainer style={{ position: "relative" }}>
        <EditorHeader>
          <EditorTitle>
            {noteId ? "Editing Note" : "Generated Notes"}
          </EditorTitle>
        </EditorHeader>
        {/* Keep LoadingOverlay consistent */}
        <LoadingOverlay>Loading notes...</LoadingOverlay>
      </EditorContainer>
    );
  }

  // Show error state if internal error occurred during processing
  if (internalError) {
    return (
      <EditorContainer
        style={{
          position: "relative",
          border: "1px solid var(--danger-color)",
        }}
      >
        <EditorHeader>
          <EditorTitle style={{ color: "var(--danger-color)" }}>
            Error Loading Notes
          </EditorTitle>
        </EditorHeader>
        <div style={{ padding: "20px", color: "var(--danger-color)" }}>
          <p>Could not display the note content due to an internal error.</p>
          <p>
            <strong>Details:</strong> {internalError}
          </p>
          <p>
            Please try selecting the note again, generating new notes, or check
            the console for more details.
          </p>
        </div>
      </EditorContainer>
    );
  }

  // Render the editor only if ready and no errors
  return (
    <EditorContainer ref={editorRef} style={{ position: "relative" }}>
      <EditorHeader>
        <EditorTitle>{noteId ? "Editing Note" : "Generated Notes"}</EditorTitle>
        <HeaderActions>
          {/* Add Save Button */}
          <SaveButton
            onClick={handleSaveClick}
            disabled={isLoading || !isEditorReady}
          >
            <FaSave /> {noteId ? "Save Changes" : "Save Note"}
          </SaveButton>
          <ExportButton
            onClick={() => exportToPDF(editorRef, editorValue)}
            disabled={isLoading || !isEditorReady}
          >
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
        </HeaderActions>
      </EditorHeader>

      <Slate
        editor={editor}
        // Use editorValue state which is updated by useEffect
        value={editorValue}
        onChange={(newValue) => {
          // Basic check: Ensure the new value is an array before updating state
          // More complex validation could be added here if needed
          if (Array.isArray(newValue)) {
            // Check if the change is significant enough to warrant a state update
            // This can prevent minor normalization changes from causing excessive re-renders
            const isAstChange = editor.operations.some(
              (op) => "set_selection" !== op.type
            );
            if (isAstChange) {
              setEditorValue(newValue);
            }
          } else {
            console.warn(
              "Slate onChange received non-array value, ignoring update.",
              newValue
            );
          }
        }}
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
            format="heading-three"
            icon={
              <>
                H<sub>3</sub>
              </>
            }
            blockFormat={true}
            tooltip="Heading 3"
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
          <TableButton editor={editor} />
          <MathButton editor={editor} />
        </Toolbar>

        <ContentArea>
          <StyledEditable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Start typing your notes..."
            spellCheck
            // autoFocus // Consider removing autoFocus if it causes issues with loading
            readOnly={isLoading || !isEditorReady} // Make read-only while loading/not ready
            // Add key to force re-render on error? Maybe not needed with error boundary above.
            // key={internalError ? 'editor-error' : 'editor-ok'}
          />
        </ContentArea>
      </Slate>
    </EditorContainer>
  );
}

export default NotesEditor;
