import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, ticketMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tickets = await db.select().from(ticketsTable)
      .where(eq(ticketsTable.userId, req.user!.id))
      .orderBy(desc(ticketsTable.updatedAt));
    res.json(tickets);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { subject, category, priority, message } = req.body;
    if (!subject || !category || !message) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const ticketId = generateId();
    const [ticket] = await db.insert(ticketsTable).values({
      id: ticketId,
      userId: req.user!.id,
      username: req.user!.username,
      subject,
      category: category as any,
      priority: (priority as any) || "medium",
      messageCount: 1,
    }).returning();

    const msgId = generateId();
    await db.insert(ticketMessagesTable).values({
      id: msgId,
      ticketId,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      content: message,
      isStaff: ["admin", "owner", "moderator"].includes(req.user!.role),
    });

    res.json(ticket);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, req.params.id)).limit(1);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.userId !== req.user!.id && !["admin", "owner", "moderator"].includes(req.user!.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const messages = await db.select().from(ticketMessagesTable)
      .where(eq(ticketMessagesTable.ticketId, req.params.id))
      .orderBy(ticketMessagesTable.createdAt);
    res.json({ ticket, messages });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Content required" });
      return;
    }
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, req.params.id)).limit(1);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.status === "closed") {
      res.status(400).json({ error: "Ticket is closed" });
      return;
    }
    if (ticket.userId !== req.user!.id && !["admin", "owner", "moderator"].includes(req.user!.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const isStaff = ["admin", "owner", "moderator"].includes(req.user!.role);
    const msgId = generateId();
    const [msg] = await db.insert(ticketMessagesTable).values({
      id: msgId,
      ticketId: req.params.id,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      content,
      isStaff,
    }).returning();

    await db.update(ticketsTable).set({
      messageCount: ticket.messageCount + 1,
      updatedAt: new Date(),
      status: isStaff ? "pending" : "open",
    }).where(eq(ticketsTable.id, req.params.id));

    res.json(msg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/close", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, req.params.id)).limit(1);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.userId !== req.user!.id && !["admin", "owner", "moderator"].includes(req.user!.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.update(ticketsTable).set({ status: "closed", updatedAt: new Date() }).where(eq(ticketsTable.id, req.params.id));
    res.json({ message: "Ticket closed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
