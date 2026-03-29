import { Router } from "express";
import { StoreItem, Purchase, User, Coupon, Otp, ProductReview } from "@workspace/db";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendOrderConfirmationEmail, sendCheckoutOtpEmail } from "../lib/email.js";

const router = Router();

router.get("/items", async (req, res) => {
  try {
    const { category, search } = req.query;
    const query: any = { isActive: true };

    if (category && typeof category === "string" && category !== "all") {
      query.category = category;
    }
    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }

    const items = await StoreItem.find(query);
    const sorted = items
      .map((i) => i.toJSON())
      .sort((a, b) => {
        if (b.isFeatured !== a.isFeatured) return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        return (b.sortOrder || 0) - (a.sortOrder || 0);
      });
    res.json(sorted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/items/:id", async (req, res) => {
  try {
    const item = await StoreItem.findOne({ _id: req.params.id });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/items/:id/reviews", async (req, res) => {
  try {
    const reviews = await ProductReview.find({ itemId: req.params.id }).sort({ createdAt: 1 });
    res.json(reviews.map((r) => r.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/items/:id/reviews", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be 1–5" });
      return;
    }
    if (!comment || !comment.trim()) {
      res.status(400).json({ error: "Comment is required" });
      return;
    }
    const item = await StoreItem.findOne({ _id: req.params.id });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const review = await ProductReview.create({
      _id: generateId(),
      itemId: req.params.id,
      userId: req.user!.id,
      username: req.user!.username,
      rating: Number(rating),
      comment: comment.trim(),
    });
    res.json(review.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/purchase", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { itemId, couponCode } = req.body;
    if (!itemId) {
      res.status(400).json({ error: "Item ID required" });
      return;
    }
    const item = await StoreItem.findOne({ _id: itemId, isActive: true });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const user = await User.findOne({ _id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let finalPrice = item.price;
    let couponUsed: string | null = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon) {
        const notExpired = !coupon.expiresAt || coupon.expiresAt > new Date();
        const withinLimit = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        if (notExpired && withinLimit) {
          finalPrice = Math.floor(finalPrice * (1 - coupon.discountPercent / 100));
          couponUsed = couponCode;
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } });
        }
      }
    }

    if (item.category === "ranks") {
      await User.updateOne({ _id: user._id }, { activeRank: item.name });
    }

    const purchase = await Purchase.create({
      _id: generateId(),
      userId: user.id,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      pricePaid: finalPrice,
      currency: "usd",
      couponUsed,
      status: "pending",
    });
    res.json(purchase.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/checkout/send-otp", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findOne({ _id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await Otp.deleteMany({ email: user.email, purpose: "checkout" });
    await Otp.create({ _id: generateId(), email: user.email, code, purpose: "checkout", expiresAt });

    await sendCheckoutOtpEmail(user.email, user.username, code);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/checkout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, couponCode, otpCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }
    if (!otpCode) {
      res.status(400).json({ error: "OTP verification required" });
      return;
    }

    const user = await User.findOne({ _id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const otp = await Otp.findOne({
      email: user.email,
      code: otpCode,
      purpose: "checkout",
      expiresAt: { $gt: new Date() },
    });
    if (!otp) {
      res.status(400).json({ error: "Invalid or expired OTP code" });
      return;
    }
    await Otp.deleteOne({ _id: otp._id });

    const itemIds = (items as { itemId: string; quantity: number }[]).map((i) => i.itemId);
    const storeItems = await StoreItem.find({ _id: { $in: itemIds }, isActive: true });

    if (storeItems.length === 0) {
      res.status(400).json({ error: "No valid items found" });
      return;
    }

    let discountPercent = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon) {
        const notExpired = !coupon.expiresAt || coupon.expiresAt > new Date();
        const withinLimit = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        if (notExpired && withinLimit) {
          discountPercent = coupon.discountPercent;
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } });
        }
      }
    }

    let totalUsd = 0;
    const orderItems: { name: string; price: number; quantity: number }[] = [];

    for (const cartItem of items as { itemId: string; quantity: number }[]) {
      const storeItem = storeItems.find((i) => i.id === cartItem.itemId);
      if (!storeItem) continue;
      const qty = Math.max(1, cartItem.quantity || 1);
      let unitPrice = storeItem.price;
      if (discountPercent > 0) unitPrice = Math.floor(unitPrice * (1 - discountPercent / 100));
      totalUsd += unitPrice * qty;
      orderItems.push({ name: storeItem.name, price: unitPrice, quantity: qty });

      for (let q = 0; q < qty; q++) {
        await Purchase.create({
          _id: generateId(),
          userId: user.id,
          itemId: storeItem.id,
          itemName: storeItem.name,
          itemCategory: storeItem.category,
          pricePaid: unitPrice,
          currency: "usd",
          couponUsed: couponCode || null,
          status: "pending",
        });
      }
    }

    sendOrderConfirmationEmail(
      user.email,
      user.username,
      orderItems,
      totalUsd,
      couponCode ? discountPercent : 0
    ).catch(() => {});

    res.json({ message: "Order placed successfully! Check your email for confirmation. Your order is pending review." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
