import { Router } from "express";
import { Ticket, TicketMessage } from "@workspace/db";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user!.id }).sort({ updatedAt: -1 });
    res.json(tickets.map((t) => t.toJSON()));
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
    const ticket = await Ticket.create({
      _id: ticketId,
      userId: req.user!.id,
      username: req.user!.username,
      subject,
      category,
      priority: priority || "medium",
      messageCount: 1,
    });

    await TicketMessage.create({
      _id: generateId(),
      ticketId,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      content: message,
      isStaff: ["admin", "owner", "moderator"].includes(req.user!.role),
    });

    res.json(ticket.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.userId !== req.user!.id && !["admin", "owner", "moderator"].includes(req.user!.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const messages = await TicketMessage.find({ ticketId: req.params.id }).sort({ createdAt: 1 });
    res.json({ ticket: ticket.toJSON(), messages: messages.map((m) => m.toJSON()) });
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
    const ticket = await Ticket.findOne({ _id: req.params.id });
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
    const msg = await TicketMessage.create({
      _id: generateId(),
      ticketId: req.params.id,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      content,
      isStaff,
    });

    await Ticket.updateOne(
      { _id: req.params.id },
      {
        messageCount: ticket.messageCount + 1,
        updatedAt: new Date(),
        status: isStaff ? "pending" : "open",
      }
    );

    res.json(msg.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/close", requireAuth, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.userId !== req.user!.id && !["admin", "owner", "moderator"].includes(req.user!.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await Ticket.updateOne({ _id: req.params.id }, { status: "closed", updatedAt: new Date() });
    res.json({ message: "Ticket closed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
