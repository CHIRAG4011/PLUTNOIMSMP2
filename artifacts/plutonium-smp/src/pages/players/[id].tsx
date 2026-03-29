import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ArrowLeft, Crosshair, Trophy, Sword, Calendar, Gamepad2, ShieldCheck, Disc } from "lucide-react";
import { format } from "date-fns";

const TIER_META: Record<string, { label: string; glow: string; badge: string; bar: string }> = {
  HT1: { label: "High Tier 1", glow: "shadow-[0_0_60px_rgba(239,68,68,0.35)]",   badge: "bg-red-500/20 text-red-400 border-red-500/40",    bar: "bg-red-500" },
  HT2: { label: "High Tier 2", glow: "shadow-[0_0_60px_rgba(249,115,22,0.35)]",  badge: "bg-orange-500/20 text-orange-400 border-orange-500/40", bar: "bg-orange-500" },
  HT3: { label: "High Tier 3", glow: "shadow-[0_0_60px_rgba(234,179,8,0.35)]",   badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", bar: "bg-yellow-500" },
  HT4: { label: "High Tier 4", glow: "shadow-[0_0_60px_rgba(34,197,94,0.35)]",   badge: "bg-green-500/20 text-green-400 border-green-500/40",   bar: "bg-green-500" },
  HT5: { label: "High Tier 5", glow: "shadow-[0_0_60px_rgba(20,184,166,0.35)]",  badge: "bg-teal-500/20 text-teal-400 border-teal-500/40",      bar: "bg-teal-500" },
  LT1: { label: "Low Tier 1",  glow: "shadow-[0_0_60px_rgba(6,182,212,0.35)]",   badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",       bar: "bg-cyan-500" },
  LT2: { label: "Low Tier 2",  glow: "shadow-[0_0_60px_rgba(59,130,246,0.35)]",  badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",       bar: "bg-blue-500" },
  LT3: { label: "Low Tier 3",  glow: "shadow-[0_0_60px_rgba(99,102,241,0.35)]",  badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40", bar: "bg-indigo-500" },
  LT4: { label: "Low Tier 4",  glow: "shadow-[0_0_60px_rgba(139,92,246,0.35)]",  badge: "bg-violet-500/20 text-violet-400 border-violet-500/40", bar: "bg-violet-500" },
  LT5: { label: "Low Tier 5",  glow: "shadow-[0_0_40px_rgba(100,116,139,0.2)]",  badge: "bg-muted text-muted-foreground border-border",          bar: "bg-muted-foreground" },
};

const ROLE_BADGE: Record<string, string> = {
  owner:     "bg-red-500/20 text-red-400 border-red-500/30",
  admin:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
  moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user:      "bg-muted text-muted-foreground border-border",
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="bg-card border-border flex-1 min-w-0">
      <CardContent className="p-5 flex flex-col items-center text-center gap-1">
        <div className="text-muted-foreground mb-1">{icon}</div>
        <div className="text-2xl font-display font-black">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const { data: player, isLoading, error } = useQuery<any>({
    queryKey: [`/api/players/${id}`],
    queryFn: async () => {
      const res = await fetch(`${base}/api/players/${id}`);
      if (!res.ok) throw new Error("Player not found");
      return res.json();
    },
    enabled: !!id,
  });

  const tier = player?.tier ?? "LT5";
  const meta = TIER_META[tier] ?? TIER_META.LT5;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Trophy className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-muted-foreground">Player not found</h2>
        <Link href="/leaderboard">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboard</Button>
        </Link>
      </div>
    );
  }

  const rankPercent = Math.round(((player.totalPlayers - player.rank + 1) / player.totalPlayers) * 100);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        <Link href="/leaderboard">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
          </Button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`relative overflow-hidden border-border bg-card ${meta.glow}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-background/60 to-transparent pointer-events-none" />

            <CardContent className="relative p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-28 h-28 border-4 border-border shadow-2xl">
                    <AvatarImage
                      src={player.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                      alt={player.username}
                    />
                    <AvatarFallback className="text-3xl font-bold">{player.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-background border border-border rounded-full px-2 py-0.5 text-xs font-display font-black">
                    #{player.rank}
                  </div>
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="font-display text-4xl font-black">{player.username}</h1>
                    {player.role && player.role !== "user" && (
                      <Badge variant="outline" className={`capitalize text-xs ${ROLE_BADGE[player.role]}`}>
                        {player.role}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                    <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${meta.badge}`}>
                      {tier} — {meta.label}
                    </Badge>
                    {player.activeRank && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border border-primary/30">
                        {player.activeRank}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {player.minecraftUsername && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>MC: <span className="text-foreground font-medium">{player.minecraftUsername}</span></span>
                      </div>
                    )}
                    {player.discordUsername && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Disc className="w-3.5 h-3.5" />
                        <span>Discord: <span className="text-foreground font-medium">{player.discordUsername}</span></span>
                      </div>
                    )}
                    {player.joinedAt && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined <span className="text-foreground font-medium">{format(new Date(player.joinedAt), "MMMM yyyy")}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4"
        >
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Global Rank"
            value={`#${player.rank}`}
            sub={`of ${player.totalPlayers} players`}
          />
          <StatCard
            icon={<Crosshair className="w-5 h-5" />}
            label="Total Kills"
            value={player.kills.toLocaleString()}
          />
          <StatCard
            icon={<Sword className="w-5 h-5" />}
            label="Top"
            value={`${rankPercent}%`}
            sub="of all players"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Tier Standing
              </h2>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Tier</span>
                  <Badge variant="outline" className={`font-bold ${meta.badge}`}>{tier} — {meta.label}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leaderboard Position</span>
                  <span className="font-semibold">#{player.rank} / {player.totalPlayers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kills</span>
                  <span className="font-semibold text-orange-400 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5" />{player.kills.toLocaleString()}
                  </span>
                </div>
                {player.activeRank && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Store Rank</span>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">{player.activeRank}</Badge>
                  </div>
                )}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Top {rankPercent}% of players</span>
                    <span>#{player.rank} globally</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rankPercent}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${meta.bar}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
