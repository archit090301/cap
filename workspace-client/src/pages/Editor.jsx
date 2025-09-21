// src/pages/Editor.jsx
import { useAuth } from "../AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import api from "../api"; // axios instance with baseURL=/api and withCredentials

// DB language IDs (1–4)
const dbLanguageMap = { javascript: 1, python: 2, cpp: 3, java: 4 };
const idToLanguage = { 1: "javascript", 2: "python", 3: "cpp", 4: "java" };

// Judge0 IDs
const judge0LanguageMap = { javascript: 63, python: 71, cpp: 54, java: 62 };

export default function Editor() {
  const { user, loading } = useAuth();
  const { projectId, fileId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// write code here");
  const [status, setStatus] = useState("loading");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [fileName, setFileName] = useState("");

  // NEW: state for scratchpad save dialog
  const [projects, setProjects] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [scratchpadFileName, setScratchpadFileName] = useState("scratchpad.js");

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  // Fetch file details
  useEffect(() => {
    if (!fileId) {
      setStatus("ready");
      // fetch projects only if scratchpad
      api.get("/projects")
        .then((res) => setProjects(res.data))
        .catch((err) => console.error(err));
      return;
    }

    api
      .get(`/files/${fileId}`)
      .then((res) => {
        const f = res.data || {};
        setCode(f.content ?? "// new file");
        setLanguage(idToLanguage[f.language_id] || "javascript");
        setFileName(f.file_name || `File ${fileId}`);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setCode("// error loading file");
        setStatus("error");
      });
  }, [fileId]);

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
        languageId: judge0LanguageMap[language],
        code,
        stdin,
      });

      let out = "";
      if (data.stdout) out += `✅ Output:\n${data.stdout}\n`;
      if (data.stderr) out += `⚠️ Runtime Error:\n${data.stderr}\n`;
      if (data.compile_output) out += `❌ Compilation Error:\n${data.compile_output}\n`;
      if (!out.trim()) out = "No output";

      setOutput(out);
    } catch (e) {
      console.error(e);
      setOutput(e.response?.data?.error || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  // Save existing file
  const handleSave = async () => {
    if (!fileId) {
      setShowSaveDialog(true);
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/files/${fileId}`, {
        content: code,
        language_id: dbLanguageMap[language],
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

  // Save Scratchpad to Project or New Project
  const handleSaveToProject = async () => {
    try {
      let projectIdToUse = selectedProject;

      // Create project if new name is given
      if (!projectIdToUse && newProjectName.trim()) {
        const { data: newProj } = await api.post("/projects", {
          name: newProjectName.trim(),
        });
        projectIdToUse = newProj.project_id;
      }

      if (!projectIdToUse) {
        alert("Please select or create a project.");
        return;
      }

      // Save file under that project
      const { data: file } = await api.post(`/projects/${projectIdToUse}/files`, {
        file_name: scratchpadFileName,
        language_id: dbLanguageMap[language],
        content: code,
      });

      setSaveMsg(`Saved to ${file.file_name} in Project ${projectIdToUse} ✅`);
      setShowSaveDialog(false);

      // redirect user to that file’s editor
      navigate(`/projects/${projectIdToUse}/files/${file.file_id}`);
    } catch (e) {
      console.error(e);
      setSaveMsg(e.response?.data?.error || "Save failed");
    }
  };

  const editorTheme = user?.preferred_theme_id === 2 ? oneDark : "light";

  return (
    <div style={{ padding: "2rem" }}>
      <h2>
        {fileId
          ? `Editor (${fileName} in Project ${projectId})`
          : "Editor (Scratchpad)"}
      </h2>

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
          disabled={saving}
          style={btnSecondary}
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

      {/* CodeMirror Editor */}
      {status === "loading" ? (
        <p>Loading file...</p>
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

      {/* Save to Project Modal */}
      {showSaveDialog && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Save Scratchpad File</h3>

            <label>File Name:</label>
            <input
              value={scratchpadFileName}
              onChange={(e) => setScratchpadFileName(e.target.value)}
              style={inputStyle}
            />

            <label>Choose Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label>Or Create New Project:</label>
            <input
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={inputStyle}
            />

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSaveToProject} style={btnPrimary}>
                Save
              </button>
              <button onClick={() => setShowSaveDialog(false)} style={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBox = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "10px",
  width: "400px",
  maxWidth: "90%",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  margin: "0.3rem 0 1rem 0",
  border: "1px solid #ccc",
  borderRadius: "6px",
};
