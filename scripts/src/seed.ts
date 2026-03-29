import { connectDB, User, StoreItem, Leaderboard, Announcement } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Seeding database...");

  const adminId = "admin-plutonium-001";
  const existingAdmin = await User.findOne({ _id: adminId });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await User.findOneAndUpdate(
      { _id: adminId },
      {
        $setOnInsert: {
          _id: adminId,
          username: "PlutoniumAdmin",
          email: "admin@plutoniumsmp.net",
          passwordHash,
          role: "owner",
          owoBalance: 999999,
          minecraftUsername: "PlutoniumAdmin",
          activeRank: "Owner",
        },
      },
      { upsert: true }
    );
    console.log("Created admin user: admin@plutoniumsmp.net / admin123");
  }

  const existingItems = await StoreItem.findOne();
  if (!existingItems) {
    await StoreItem.insertMany([
      { _id: "rank-vip", name: "VIP", description: "Get VIP access with exclusive perks and commands!", category: "ranks", price: 5000, currency: "owo", features: ["Custom Tag", "2x OWO Rewards", "VIP Kit", "/fly in spawn", "Priority Queue"], isActive: true, isFeatured: false, badge: "VIP", badgeColor: "#4ADE80" },
      { _id: "rank-mvp", name: "MVP", description: "Become an MVP with premium features and special abilities!", category: "ranks", price: 12000, currency: "owo", features: ["All VIP Perks", "Custom Particle Effects", "3x OWO Rewards", "MVP Kit", "/nick command", "Exclusive Discord Role"], isActive: true, isFeatured: true, badge: "POPULAR", badgeColor: "#60A5FA" },
      { _id: "rank-legend", name: "Legend", description: "The ultimate rank. Stand above the rest as a Legend!", category: "ranks", price: 25000, currency: "owo", features: ["All MVP Perks", "5x OWO Rewards", "Legend Kit", "Custom Join Message", "God Mode PvP Potions", "Exclusive Legend Discord Channel"], isActive: true, isFeatured: true, badge: "BEST VALUE", badgeColor: "#FF6B6B" },
      { _id: "crate-common", name: "Common Crate Key", description: "A common crate key with a chance to get decent loot!", category: "crate_keys", price: 500, currency: "owo", features: ["Random Gear", "OWO Coins", "XP Bottles"], isActive: true, isFeatured: false },
      { _id: "crate-rare", name: "Rare Crate Key", description: "A rare crate key with excellent loot chances!", category: "crate_keys", price: 1500, currency: "owo", features: ["Enhanced Gear", "Lots of OWO Coins", "Special Potions", "Rare Items"], isActive: true, isFeatured: false, badge: "POPULAR", badgeColor: "#60A5FA" },
      { _id: "crate-legendary", name: "Legendary Crate Key", description: "A legendary crate key with the best loot in the game!", category: "crate_keys", price: 5000, currency: "owo", features: ["God-tier Gear", "Massive OWO Coins", "Exclusive Items", "Rank Fragments"], isActive: true, isFeatured: true, badge: "LEGENDARY", badgeColor: "#F59E0B" },
      { _id: "coins-1000", name: "1,000 OWO Coins", description: "Get a quick boost of 1,000 OWO coins!", category: "coins", price: 100, currency: "owo", features: ["Instant Delivery", "Use in Store"], isActive: true, isFeatured: false },
      { _id: "coins-5000", name: "5,000 OWO Coins", description: "Stock up with 5,000 OWO coins at a great value!", category: "coins", price: 450, currency: "owo", features: ["Instant Delivery", "10% Bonus Coins", "Use in Store"], isActive: true, isFeatured: false, badge: "BEST VALUE", badgeColor: "#4ADE80" },
    ]);
    console.log("Created store items");
  }

  const existingLb = await Leaderboard.findOne();
  if (!existingLb) {
    await Leaderboard.insertMany([
      { _id: "lb-1", userId: "admin-plutonium-001", username: "PlutoniumAdmin", minecraftUsername: "PlutoniumAdmin", tier: "HT1", kills: 420, activeRank: "Owner", updatedAt: new Date() },
      { _id: "lb-2", userId: "lb-user-2", username: "HeartThief_X", tier: "HT1", kills: 312, activeRank: "Legend", updatedAt: new Date() },
      { _id: "lb-3", userId: "lb-user-3", username: "NeonSlayer", tier: "HT2", kills: 287, activeRank: "MVP", updatedAt: new Date() },
      { _id: "lb-4", userId: "lb-user-4", username: "LifeStealKing", tier: "HT2", kills: 198, activeRank: "Legend", updatedAt: new Date() },
      { _id: "lb-5", userId: "lb-user-5", username: "GreenReaper", tier: "HT3", kills: 176, activeRank: "MVP", updatedAt: new Date() },
      { _id: "lb-6", userId: "lb-user-6", username: "AtomicBoom", tier: "HT3", kills: 154, activeRank: "VIP", updatedAt: new Date() },
      { _id: "lb-7", userId: "lb-user-7", username: "CrystalHunter", tier: "HT4", kills: 132, updatedAt: new Date() },
      { _id: "lb-8", userId: "lb-user-8", username: "PlutoPvP", tier: "LT1", kills: 98, activeRank: "VIP", updatedAt: new Date() },
      { _id: "lb-9", userId: "lb-user-9", username: "RadiationX", tier: "LT2", kills: 87, updatedAt: new Date() },
      { _id: "lb-10", userId: "lb-user-10", username: "NuclearFrost", tier: "LT3", kills: 65, updatedAt: new Date() },
    ]);
    console.log("Created leaderboard entries");
  }

  const existingAnn = await Announcement.findOne();
  if (!existingAnn) {
    await Announcement.insertMany([
      { _id: "ann-1", title: "Welcome to Plutonium SMP!", content: "The server is now live! Join us at play.plutoniumsmp.net and experience the ultimate Lifesteal SMP. Survive, steal hearts, and dominate the leaderboard!", type: "info", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
      { _id: "ann-2", title: "Weekend 2x OWO Event", content: "This weekend only - earn DOUBLE OWO coins for all kills and activities! Stack up your balance and dominate the store. Event runs Friday-Sunday.", type: "event", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
      { _id: "ann-3", title: "Season 2 Update v1.21.1", content: "We've upgraded to Minecraft 1.21.1! New crates, new ranks, and an improved PvP system. Check the store for the new Legendary crate keys!", type: "update", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
    ]);
    console.log("Created announcements");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
