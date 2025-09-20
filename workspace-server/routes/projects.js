// routes/projects.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ensureAuth } = require("../middleware/auth");

/**
 * Get all projects for the logged-in user
 * GET /api/projects
 */
router.get("/", ensureAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT project_id,
              project_name,
              description,
              language,
              created_at,
              updated_at
         FROM projects
        WHERE user_id = ?
        ORDER BY updated_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch projects" });
  }
});

/**
 * Create a new project
 * POST /api/projects
 * body: { project_name, description?, content?, language? }
 */
router.post("/", ensureAuth, async (req, res) => {
  const {
    project_name,
    description = null,
    content = null,
    language = "javascript",
  } = req.body;

  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: "project_name is required" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO projects (user_id, project_name, description, content, language)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, project_name.trim(), description, content, language]
    );

    const [rows] = await pool.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at
         FROM projects
        WHERE project_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create project" });
  }
});

/**
 * Get a single project (must belong to user)
 * GET /api/projects/:id
 */
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at
         FROM projects
        WHERE project_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch project" });
  }
});

/**
 * Update a project (content/language/name/description)
 * PUT /api/projects/:id
 * body: { project_name?, description?, content?, language? }
 */
router.put("/:id", ensureAuth, async (req, res) => {
  const { project_name, description, content, language } = req.body;

  try {
    // Verify ownership
    const [own] = await pool.query(
      "SELECT project_id FROM projects WHERE project_id = ? AND user_id = ?",
      [req.params.id, req.user.user_id]
    );
    if (own.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    await pool.query(
      `UPDATE projects
          SET project_name = COALESCE(?, project_name),
              description  = COALESCE(?, description),
              content      = COALESCE(?, content),
              language     = COALESCE(?, language),
              updated_at   = CURRENT_TIMESTAMP
        WHERE project_id = ?`,
      [project_name, description, content, language, req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at
         FROM projects
        WHERE project_id = ?`,
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update project" });
  }
});

module.exports = router;
