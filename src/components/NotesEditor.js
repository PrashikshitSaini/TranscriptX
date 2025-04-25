import React, { useMemo, useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import {
  createEditor,
  Editor,
  Transforms,
  Element as SlateElement,
  Text,
  Node,
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
    type: "heading-one",
    children: [{ text: "Generated Notes" }],
  },
  {
    type: "paragraph",
    children: [{ text: "Your notes will appear here." }],
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
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    return latex;
  }
};

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
      return (
        <MathWrapper
          {...attributes}
          className={element.displayMode ? "display-mode" : ""}
          dangerouslySetInnerHTML={{
            __html: renderMath(element.formula, element.displayMode),
          }}
        >
          {children}
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

const processTextFormatting = (text) => {
  let children = [];

  // Process markdown-style formatting
  if (
    text.includes("**") ||
    text.includes("*") ||
    text.includes("`") ||
    text.includes("__")
  ) {
    let segments = [];
    let currentIndex = 0;

    // Process bold (either **bold** or __bold__)
    const boldRegex = /(\*\*|__)(.*?)(\*\*|__)/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      if (boldMatch.index > currentIndex) {
        segments.push({
          text: text.substring(currentIndex, boldMatch.index),
          format: null,
        });
      }

      segments.push({
        text: boldMatch[2],
        format: "bold",
      });

      currentIndex = boldMatch.index + boldMatch[0].length;
    }

    // Process italic (either *italic* or _italic_)
    if (segments.length === 0) {
      const italicRegex = /(\*|_)(.*?)(\*|_)/g;
      let italicMatch;
      while ((italicMatch = italicRegex.exec(text)) !== null) {
        if (italicMatch.index > currentIndex) {
          segments.push({
            text: text.substring(currentIndex, italicMatch.index),
            format: null,
          });
        }

        segments.push({
          text: italicMatch[2],
          format: "italic",
        });

        currentIndex = italicMatch.index + italicMatch[0].length;
      }
    }

    // Process inline code
    if (segments.length === 0) {
      const codeRegex = /`(.*?)`/g;
      let codeMatch;
      while ((codeMatch = codeRegex.exec(text)) !== null) {
        if (codeMatch.index > currentIndex) {
          segments.push({
            text: text.substring(currentIndex, codeMatch.index),
            format: null,
          });
        }

        segments.push({
          text: codeMatch[1],
          format: "code",
        });

        currentIndex = codeMatch.index + codeMatch[0].length;
      }
    }

    // Add any remaining text
    if (currentIndex < text.length) {
      segments.push({
        text: text.substring(currentIndex),
        format: null,
      });
    }

    // Convert segments to Slate format
    if (segments.length === 0) {
      children.push({ text });
    } else {
      segments.forEach((segment) => {
        if (segment.format === "bold") {
          children.push({ text: segment.text, bold: true });
        } else if (segment.format === "italic") {
          children.push({ text: segment.text, italic: true });
        } else if (segment.format === "code") {
          children.push({ text: segment.text, code: true });
        } else {
          children.push({ text: segment.text });
        }
      });
    }
  } else {
    children.push({ text });
  }

  return children.length > 0 ? children : [{ text }];
};

const deserialize = (content) => {
  if (!content || typeof content !== "string" || content.trim() === "") {
    return DEFAULT_VALUE;
  }

  try {
    const tablePattern = /\|(.*)\|\n\|([-:]+\|)+\n((?:\|.*\|\n)+)/g;
    content = content.replace(
      tablePattern,
      (match, headerRow, separator, bodyRows) => {
        const headers = headerRow
          .split("|")
          .filter((cell) => cell.trim() !== "")
          .map((h) => h.trim());
        const rows = bodyRows
          .split("\n")
          .filter((row) => row.trim() !== "" && row.includes("|"));

        let tableMarkup = "\n<table>\n<tr>";
        headers.forEach((header) => {
          tableMarkup += `<th>${header}</th>`;
        });
        tableMarkup += "</tr>\n";

        rows.forEach((row) => {
          const cells = row
            .split("|")
            .filter((cell) => cell.trim() !== "")
            .map((c) => c.trim());
          tableMarkup += "<tr>";
          cells.forEach((cell) => {
            tableMarkup += `<td>${cell}</td>`;
          });
          tableMarkup += "</tr>\n";
        });

        tableMarkup += "</table>\n";
        return tableMarkup;
      }
    );

    content = content.replace(/\$([^$\n]+?)\$/g, "<math inline>$1</math>");
    content = content.replace(/\$\$([^$]+?)\$\$/g, "<math display>$1</math>");

    const normalizedContent = content.replace(/\r\n/g, "\n");
    const lines = normalizedContent.split("\n");
    const nodes = [];
    let currentList = null;
    let i = 0;

    const hasExtendedFormatting =
      content.includes("<table>") || content.includes("<math");

    if (hasExtendedFormatting) {
      let currentIndex = 0;
      let currentText = "";

      while (currentIndex < content.length) {
        if (content.indexOf("<table>", currentIndex) === currentIndex) {
          if (currentText.trim()) {
            const textLines = currentText.trim().split("\n");
            textLines.forEach((line) => {
              if (line.trim()) {
                nodes.push({
                  type: "paragraph",
                  children: [{ text: line.trim() }],
                });
              }
            });
            currentText = "";
          }

          const tableEnd = content.indexOf("</table>", currentIndex);
          if (tableEnd !== -1) {
            const tableContent = content.substring(currentIndex + 7, tableEnd);

            const rows = tableContent.match(/<tr>(.*?)<\/tr>/gs);
            if (rows) {
              const tableRows = [];

              rows.forEach((row) => {
                const headerCells = row.match(/<th>(.*?)<\/th>/gs);
                const dataCells = row.match(/<td>(.*?)<\/td>/gs);

                if (headerCells) {
                  const rowCells = [];
                  headerCells.forEach((cell) => {
                    const cellContent = cell.replace(/<th>|<\/th>/g, "");
                    rowCells.push({
                      type: "table-header",
                      children: [{ text: cellContent.trim() }],
                    });
                  });

                  tableRows.push({
                    type: "table-row",
                    children: rowCells,
                  });
                } else if (dataCells) {
                  const rowCells = [];
                  dataCells.forEach((cell) => {
                    const cellContent = cell.replace(/<td>|<\/td>/g, "");
                    rowCells.push({
                      type: "table-cell",
                      children: [{ text: cellContent.trim() }],
                    });
                  });

                  tableRows.push({
                    type: "table-row",
                    children: rowCells,
                  });
                }
              });

              nodes.push({
                type: "table",
                children: tableRows,
              });
            }

            currentIndex = tableEnd + 8;
          } else {
            currentText += "<table>";
            currentIndex += 7;
          }
        } else if (content.indexOf("<math", currentIndex) === currentIndex) {
          if (currentText.trim()) {
            const textLines = currentText.trim().split("\n");
            textLines.forEach((line) => {
              if (line.trim()) {
                nodes.push({
                  type: "paragraph",
                  children: [{ text: line.trim() }],
                });
              }
            });
            currentText = "";
          }

          const isDisplay =
            content.indexOf("<math display>", currentIndex) === currentIndex;
          const mathTag = isDisplay ? "<math display>" : "<math inline>";
          const mathEnd = content.indexOf("</math>", currentIndex);

          if (mathEnd !== -1) {
            const formula = content.substring(
              currentIndex + mathTag.length,
              mathEnd
            );

            nodes.push({
              type: "math",
              formula: formula.trim(),
              displayMode: isDisplay,
              children: [{ text: "" }],
            });

            currentIndex = mathEnd + 7;
          } else {
            currentText += mathTag;
            currentIndex += mathTag.length;
          }
        } else {
          currentText += content[currentIndex];
          currentIndex++;
        }
      }

      if (currentText.trim()) {
        const textLines = currentText.trim().split("\n");
        textLines.forEach((line) => {
          if (line.trim()) {
            nodes.push({
              type: "paragraph",
              children: [{ text: line.trim() }],
            });
          }
        });
      }
    } else {
      const hasCornellFormat = lines.some(
        (line) =>
          line.includes("||") ||
          (line.includes("Question") && line.includes("Answer")) ||
          (line.includes("Cue") && line.includes("Note"))
      );

      if (hasCornellFormat) {
        let cornellNotes = [];
        let inSummary = false;

        while (i < lines.length) {
          const line = lines[i].trim();

          if (line === "") {
            i++;
            continue;
          }

          if (line.toLowerCase().includes("summary") && !line.includes("||")) {
            inSummary = true;
            i++;
            continue;
          }

          if (line.includes("||")) {
            const [question, answer] = line
              .split("||")
              .map((part) => part.trim());

            cornellNotes.push({
              type: "cornell-note",
              question: question || "",
              answer: answer || "",
              summary: "",
              children: [{ text: "" }],
            });
          } else if (inSummary) {
            if (
              cornellNotes.length > 0 &&
              cornellNotes[cornellNotes.length - 1].type === "cornell-note"
            ) {
              const lastNote = cornellNotes[cornellNotes.length - 1];
              lastNote.summary = (lastNote.summary + " " + line).trim();
            }
          } else {
            if (line.startsWith("# ")) {
              nodes.push({
                type: "heading-one",
                children: [{ text: line.substring(2) }],
              });
            } else if (
              !line.includes("Question") &&
              !line.includes("Answer") &&
              !line.includes("Cue") &&
              !line.includes("Note")
            ) {
              nodes.push({
                type: "paragraph",
                children: [{ text: line }],
              });
            }
          }

          i++;
        }

        if (cornellNotes.length > 0) {
          nodes.push(...cornellNotes);
        }
      } else {
        while (i < lines.length) {
          let line = lines[i].trim();

          if (line === "") {
            if (currentList) {
              nodes.push(currentList);
              currentList = null;
            }
            i++;
            continue;
          }

          if (line.startsWith("# ")) {
            if (currentList) {
              nodes.push(currentList);
              currentList = null;
            }

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
          } else if (line.startsWith("- ") || line.startsWith("* ")) {
            const listItemText = line.substring(2);

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
          } else if (/^\d+\.\s/.test(line)) {
            const listItemText = line.substring(line.indexOf(".") + 2);

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
          } else if (line.startsWith("> ")) {
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
          } else if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
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
          } else {
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

        if (currentList) {
          nodes.push(currentList);
        }
      }
    }

    return nodes.length > 0 ? nodes : DEFAULT_VALUE;
  } catch (error) {
    console.error("Error parsing content for Slate editor:", error);
    return DEFAULT_VALUE;
  }
};

const exportToPDF = async (editorRef, editorValue) => {
  try {
    const content = editorRef.current;
    if (!content) {
      console.error("Editor content reference is null");
      alert("Could not find editor content to export");
      return;
    }

    alert("Preparing PDF export. This may take a moment...");

    const exportContainer = document.createElement("div");
    exportContainer.style.position = "absolute";
    exportContainer.style.top = "-9999px";
    exportContainer.style.left = "-9999px";
    exportContainer.style.width = "794px";
    exportContainer.style.backgroundColor = "#ffffff";
    exportContainer.style.padding = "40px";
    exportContainer.style.color = "#000000";
    exportContainer.style.fontFamily = "Arial, sans-serif";

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
      
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 12px 0 !important;
      }
      
      td, th {
        border: 1px solid #cccccc !important;
        padding: 8px !important;
        text-align: left !important;
      }
      
      th {
        background-color: #f5f5f5 !important;
        font-weight: bold !important;
      }
      
      tr:nth-child(even) {
        background-color: #fafafa !important;
      }
      
      .math-wrapper {
        padding: 8px !important;
        margin: 8px 0 !important;
      }
      
      .math-wrapper.display-mode {
        text-align: center !important;
      }
      
      .cornell-note {
        display: grid;
        grid-template-columns: 30% 70%;
        border: 1px solid #cccccc;
        margin: 15px 0;
        page-break-inside: avoid;
      }
      .cornell-question {
        background-color: #f5f5f5;
        padding: 10px;
        border-right: 1px solid #cccccc;
        font-weight: 500;
      }
      .cornell-answer {
        padding: 10px;
      }
      .cornell-summary {
        grid-column: 1 / span 2;
        border-top: 1px solid #cccccc;
        padding: 10px;
        background-color: #f9f9f9;
        font-style: italic;
      }
    `;

    document.head.appendChild(styleElement);
    document.body.appendChild(exportContainer);

    try {
      const editorContent = content.querySelector('[contenteditable="true"]');
      if (!editorContent) {
        throw new Error("Could not find editable content");
      }

      const contentClone = editorContent.cloneNode(true);

      contentClone.style.color = "#000000";
      contentClone.style.backgroundColor = "#ffffff";
      contentClone.style.fontFamily = "Arial, sans-serif";
      contentClone.style.padding = "20px";
      contentClone.style.width = "auto";

      const tables = contentClone.querySelectorAll("table");
      tables.forEach((table) => {
        table.setAttribute("border", "1");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";
        table.style.marginBottom = "15px";

        const cells = table.querySelectorAll("td, th");
        cells.forEach((cell) => {
          cell.style.border = "1px solid #cccccc";
          cell.style.padding = "8px";

          if (cell.tagName === "TH") {
            cell.style.backgroundColor = "#f5f5f5";
            cell.style.fontWeight = "bold";
          }
        });
      });

      const mathElements = contentClone.querySelectorAll(".math-wrapper");
      mathElements.forEach((mathEl) => {
        mathEl.style.fontFamily = "KaTeX_Main, serif";

        if (mathEl.classList.contains("display-mode")) {
          mathEl.style.margin = "15px 0";
          mathEl.style.textAlign = "center";
        }
      });

      const cornellElements = contentClone.querySelectorAll(
        ".cornell-note-container"
      );
      cornellElements.forEach((element) => {
        const cornellDiv = document.createElement("div");
        cornellDiv.className = "cornell-note";

        const questionEl = element.querySelector("div:nth-child(1)");
        const answerEl = element.querySelector("div:nth-child(2)");
        const summaryEl = element.querySelector("div:nth-child(3)");

        if (questionEl) {
          const qDiv = document.createElement("div");
          qDiv.className = "cornell-question";
          qDiv.innerHTML = questionEl.innerHTML || "";
          cornellDiv.appendChild(qDiv);
        } else {
          const qDiv = document.createElement("div");
          qDiv.className = "cornell-question";
          cornellDiv.appendChild(qDiv);
        }

        if (answerEl) {
          const aDiv = document.createElement("div");
          aDiv.className = "cornell-answer";
          aDiv.innerHTML = answerEl.innerHTML || "";
          cornellDiv.appendChild(aDiv);
        } else {
          const aDiv = document.createElement("div");
          aDiv.className = "cornell-answer";
          cornellDiv.appendChild(aDiv);
        }

        if (summaryEl && summaryEl.innerHTML.trim()) {
          const sDiv = document.createElement("div");
          sDiv.className = "cornell-summary";
          sDiv.innerHTML = summaryEl.innerHTML;
          cornellDiv.appendChild(sDiv);
        }

        element.parentNode.replaceChild(cornellDiv, element);
      });

      exportContainer.innerHTML = "";
      exportContainer.appendChild(contentClone);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const contentHeight = exportContainer.offsetHeight;
      const pageContentHeight = (pdfHeight - 20) * 3.779527559;

      const totalPages = Math.ceil(contentHeight / pageContentHeight);

      for (let page = 0; page < totalPages; page++) {
        exportContainer.style.top = `-${page * pageContentHeight}px`;

        await new Promise((resolve) => setTimeout(resolve, 100));

        const canvas = await html2canvas(exportContainer, {
          scale: 2,
          logging: false,
          windowHeight: pageContentHeight,
          y: page * pageContentHeight,
          height: pageContentHeight,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");

        if (page > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save("TranscriptX_Notes.pdf");
    } finally {
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

function NotesEditor({ initialValue }) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [editorValue, setEditorValue] = useState(DEFAULT_VALUE);
  const [loading, setLoading] = useState(true);
  const editorRef = React.useRef(null);

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

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  if (loading) {
    return (
      <EditorContainer>
        <EditorHeader>
          <EditorTitle>Generated Notes(refresh page for new notes)</EditorTitle>
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
          <TableButton editor={editor} />
          <MathButton editor={editor} />
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
