import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";     
import { AuthProvider } from "./AuthContext";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuth from "./components/RedirectIfAuth";   // ✅ new import
import Files from "./pages/Files";
import ProjectEditor from "./pages/ProjectEditor"; // ✅ fix here

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Auth routes (redirect if already logged in) */}
          <Route element={<RedirectIfAuth />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected routes */}  
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/editor" element={<Editor />} />           {/* blank editor */}
            <Route path="/projects/:projectId/files" element={<Files />} />
            <Route path="/files/:fileId" element={<Editor />} />
            <Route path="/projects/:projectId/files/:fileId" element={<Editor />} />
            <Route path="/profile" element={<Profile />} />
             <Route path="/projects/:projectId" element={<ProjectEditor />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
