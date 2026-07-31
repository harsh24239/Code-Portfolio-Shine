import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, insertProjectSchema, updateProjectSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/** Simple API key guard for mutating endpoints */
function requireApiKey(req: Request, res: Response, next: () => void) {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ADMIN_API_KEY not configured on the server." });
    return;
  }
  const provided = req.headers["x-api-key"] ?? req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  if (provided !== apiKey) {
    res.status(401).json({ error: "Unauthorized. Pass the API key via X-Api-Key header." });
    return;
  }
  next();
}

/** GET /api/projects — list all projects ordered by sort_order */
router.get("/projects", async (_req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(projectsTable.sortOrder, projectsTable.createdAt);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

/** GET /api/projects/:id — get single project */
router.get("/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch project." });
  }
});

/** POST /api/projects — create a project (requires API key) */
router.post("/projects", requireApiKey, async (req: Request, res: Response, next) => {
  try {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed.", details: parsed.error.issues });
      return;
    }
    const [created] = await db.insert(projectsTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/projects/:id — update a project (requires API key) */
router.put("/projects/:id", requireApiKey, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed.", details: parsed.error.issues });
      return;
    }
    const [updated] = await db
      .update(projectsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/projects/:id — delete a project (requires API key) */
router.delete("/projects/:id", requireApiKey, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
