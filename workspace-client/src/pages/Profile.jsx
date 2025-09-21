import { useAuth } from "../AuthContext";
import { useState } from "react";
import api from "../api";

export default function Profile() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(user?.preferred_theme_id === 2 ? "dark" : "light");
  const [status, setStatus] = useState("");

  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    setStatus("Saving...");
    try {
      await api.put("/theme", { theme: newTheme });
      setStatus("Theme updated ✅");
    } catch (err) {
      setStatus("Failed to update theme ❌");
    }
  };

  if (!user) return <p>Please log in</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Profile</h2>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <div style={{ marginTop: "1rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Theme:</label>
        <select value={theme} onChange={handleThemeChange}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </div>
  );
}
