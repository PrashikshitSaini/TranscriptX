import React, { useMemo, useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";

const EditorContainer = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
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

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 16px;
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 8px;
  }

  ul,
  ol {
    padding-left: 20px;
    margin-bottom: 8px;
  }

  blockquote {
    border-left: 3px solid var(--accent-color);
    padding-left: 16px;
    margin-left: 0;
    color: var(--text-secondary);
  }
`;

// Hard-coded default value that's guaranteed to work
const DEFAULT_VALUE = [
  {
    type: "paragraph",
    children: [{ text: "Your notes will appear here." }],
  },
];

// Convert string to Slate nodes with fallback
const deserialize = (content) => {
  // Simple conversion of a string to valid Slate structure
  if (!content || typeof content !== "string" || content.trim() === "") {
    return DEFAULT_VALUE;
  }

  try {
    // Split by newlines, but keep paragraph grouping
    const paragraphs = content
      .split("\n")
      .reduce(
        (acc, line) => {
          if (line.trim() === "") {
            // Empty line, start a new paragraph in next iteration
            acc.push("");
          } else if (acc.length === 0 || acc[acc.length - 1] === "") {
            // Start a new paragraph
            acc[acc.length - 1] = line;
          } else {
            // Append to existing paragraph
            acc[acc.length - 1] += "\n" + line;
          }
          return acc;
        },
        [""]
      )
      .filter((p) => p !== "");

    return paragraphs.map((paragraph) => {
      // Check if paragraph is a heading
      if (paragraph.startsWith("# ")) {
        return {
          type: "heading-one",
          children: [{ text: paragraph.substring(2) }],
        };
      } else if (paragraph.startsWith("## ")) {
        return {
          type: "heading-two",
          children: [{ text: paragraph.substring(3) }],
        };
      } else if (paragraph.startsWith("- ")) {
        // List item
        return {
          type: "list-item",
          children: [{ text: paragraph.substring(2) }],
        };
      } else {
        // Regular paragraph
        return {
          type: "paragraph",
          children: [{ text: paragraph }],
        };
      }
    });
  } catch (error) {
    console.error("Error parsing content for Slate editor:", error);
    return DEFAULT_VALUE;
  }
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

function NotesEditor({ initialValue }) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [editorValue, setEditorValue] = useState(DEFAULT_VALUE);
  const [loading, setLoading] = useState(true);

  // Debug output to help diagnose issues
  useEffect(() => {
    console.log("NotesEditor received initialValue:", initialValue);
    console.log("Type of initialValue:", typeof initialValue);
    console.log(
      "Length of initialValue:",
      initialValue ? initialValue.length : 0
    );
  }, [initialValue]);

  // Update the editor when initialValue changes
  useEffect(() => {
    try {
      setLoading(true);

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
      console.log("Processed editor content:", processed);

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

  // Define a rendering function for custom elements
  const renderElement = useCallback((props) => <Element {...props} />, []);

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
      </EditorHeader>

      <Slate
        editor={editor}
        value={editorValue}
        onChange={(value) => setEditorValue(value)}
      >
        <StyledEditable
          renderElement={renderElement}
          placeholder="Generated notes will appear here..."
          spellCheck
          autoFocus
        />
      </Slate>
    </EditorContainer>
  );
}

export default NotesEditor;
