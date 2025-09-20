import { useAuth } from "../AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import api from "../api"; // axios instance with baseURL=/api and withCredentials

export default function Editor() {
  const { user, loading } = useAuth();
  const { projectId } = useParams();

  const [code, setCode] = useState("// write code here");
  const [status, setStatus] = useState("loading");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    if (!projectId) {
      setStatus("ready");
      return;
    }

    api
      .get(`/projects/${projectId}`)
      .then((res) => {
        const p = res.data || {};
        setCode(p.content ?? "// new project");
        setLanguage(p.language ?? "javascript");
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setCode("// error loading project");
        setStatus("error");
      });
  }, [projectId]);

  const getExtensions = () => {
    switch (language) {
      case "python":
        return [python()];
      case "java":
        return [java()];
      case "cpp":
        return [cpp()];
      default:
        return [javascript()];
    }
  };

  // Run code (Judge0 via backend)
  const handleRun = async () => {
    setRunning(true);
    setOutput("Running...");
    try {
      const { data } = await api.post("/run", {
        language,
        code,
        stdin,
      });
      setOutput(data.output || "No output");
    } catch (e) {
      console.error(e);
      setOutput(e.response?.data?.error || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  // Save project to DB
  const handleSave = async () => {
    if (!projectId) {
      setSaveMsg("Open a project from Projects page to save.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/projects/${projectId}`, {
        content: code,
        language,
      });
      setSaveMsg("Saved ✅");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setSaveMsg(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const editorTheme = user?.preferred_theme_id === 2 ? oneDark : "light";

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Code Editor {projectId ? `(Project ${projectId})` : "(Scratchpad)"}</h2>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <label>Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: "0.3rem" }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button
          onClick={handleRun}
          disabled={running}
          style={btnPrimary}
          title="Execute code"
        >
          {running ? "Running..." : "Run"}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !projectId}
          style={btnSecondary}
          title={projectId ? "Save project" : "Open a project to enable saving"}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {saveMsg && <span style={{ marginLeft: 8, opacity: 0.85 }}>{saveMsg}</span>}
      </div>

      {/* stdin */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Input (stdin):</label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Enter program input here..."
          style={ta}
        />
      </div>

      {/* Editor */}
      {status === "loading" ? (
        <p>Loading project...</p>
      ) : (
        <CodeMirror
          value={code}
          height="60vh"
          width="100%"
          theme={editorTheme}
          extensions={getExtensions()}
          onChange={(val) => setCode(val)}
        />
      )}

      {/* Output */}
      <div style={outBox}>
        <strong>Output:</strong>
        <div>{output}</div>
      </div>
    </div>
  );
}

const btnPrimary = {
  padding: "0.4rem 1rem",
  background: "#4e54c8",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "0.4rem 1rem",
  background: "#eaeaea",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
};

const ta = {
  display: "block",
  width: "100%",
  height: "80px",
  padding: "0.5rem",
  marginTop: "0.3rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontFamily: "monospace",
};

const outBox = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#f7f7f7",
  borderRadius: "8px",
  border: "1px solid #ddd",
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
};
