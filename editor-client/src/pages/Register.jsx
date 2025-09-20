import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.username, form.email, form.password);
      navigate("/editor"); // redirect after register
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>Register</button>
        </form>
        <p style={styles.text}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex", justifyContent: "center", alignItems: "center",
    minHeight: "100vh", background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
  },
  card: {
    background: "#fff", padding: "2rem", borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px"
  },
  title: { marginBottom: "1.5rem", textAlign: "center", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: {
    padding: "0.8rem", borderRadius: "6px",
    border: "1px solid #ccc", fontSize: "1rem"
  },
  button: {
    padding: "0.8rem", borderRadius: "6px", border: "none",
    background: "#4e54c8", color: "#fff", fontWeight: "bold",
    cursor: "pointer", transition: "0.2s"
  },
  text: { marginTop: "1rem", textAlign: "center" },
  link: { color: "#4e54c8", textDecoration: "none", fontWeight: "bold" },
  error: { color: "red", fontSize: "0.9rem", textAlign: "center" },
};
