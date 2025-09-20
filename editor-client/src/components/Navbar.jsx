import { useAuth } from "../AuthContext";   // ✅ go up from components to src
import { Link } from "react-router-dom";

function Navbar() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <nav style={styles.navbar}>
        <span style={styles.link}>Loading...</span>
      </nav>
    );
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>CodeEditor 🚀</Link>
      </div>

      <div style={styles.right}>
        {/* Show only when NOT logged in */}
        {!user && (
          <>
            <Link to="/register" style={styles.link}>Register</Link>
            <Link to="/login" style={styles.link}>Login</Link>
          </>
        )}

        {/* Show only when logged in */}
        {user && (
          <>
            <Link to="/projects" style={styles.link}>Projects</Link> {/* ✅ Step 5 */}
            <Link to="/editor" style={styles.link}>Editor</Link>
            <Link to="/profile" style={styles.link}>Profile</Link>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  left: { fontSize: "1.2rem", fontWeight: "bold" },
  right: { display: "flex", gap: "1rem" },
  brand: { color: "#fff", textDecoration: "none", fontWeight: "bold" },
  link: { color: "#fff", textDecoration: "none", fontWeight: 500 },
  logoutBtn: {
    padding: "0.3rem 0.8rem",
    border: "none",
    borderRadius: "4px",
    background: "#ff7675",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },
};

export default Navbar;
