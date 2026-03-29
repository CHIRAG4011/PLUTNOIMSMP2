import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  ArrowLeft, Crosshair, Trophy, Sword, Calendar, Gamepad2,
  MessageSquare, ShieldCheck, Star, TrendingUp, Users, Heart,
  Crown, Zap,
} from "lucide-react";
import { format } from "date-fns";

const TIER_META: Record<string, {
  label: string;
  short: string;
  glow: string;
  badge: string;
  bar: string;
  gradient: string;
  ring: string;
  color: string;
}> = {
  HT1: {
    label: "High Tier 1", short: "Elite",
    glow: "shadow-[0_0_80px_rgba(239,68,68,0.3)]",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    bar: "bg-gradient-to-r from-red-600 to-red-400",
    gradient: "from-red-900/40 via-red-950/20 to-transparent",
    ring: "border-red-500/60",
    color: "text-red-400",
  },
  HT2: {
    label: "High Tier 2", short: "Veteran",
    glow: "shadow-[0_0_80px_rgba(249,115,22,0.3)]",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    bar: "bg-gradient-to-r from-orange-600 to-orange-400",
    gradient: "from-orange-900/40 via-orange-950/20 to-transparent",
    ring: "border-orange-500/60",
    color: "text-orange-400",
  },
  HT3: {
    label: "High Tier 3", short: "Skilled",
    glow: "shadow-[0_0_80px_rgba(234,179,8,0.3)]",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    bar: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    gradient: "from-yellow-900/40 via-yellow-950/20 to-transparent",
    ring: "border-yellow-500/60",
    color: "text-yellow-400",
  },
  HT4: {
    label: "High Tier 4", short: "Competent",
    glow: "shadow-[0_0_80px_rgba(34,197,94,0.3)]",
    badge: "bg-green-500/20 text-green-400 border-green-500/40",
    bar: "bg-gradient-to-r from-green-600 to-green-400",
    gradient: "from-green-900/40 via-green-950/20 to-transparent",
    ring: "border-green-500/60",
    color: "text-green-400",
  },
  HT5: {
    label: "High Tier 5", short: "Developing",
    glow: "shadow-[0_0_80px_rgba(20,184,166,0.3)]",
    badge: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    bar: "bg-gradient-to-r from-teal-600 to-teal-400",
    gradient: "from-teal-900/40 via-teal-950/20 to-transparent",
    ring: "border-teal-500/60",
    color: "text-teal-400",
  },
  LT1: {
    label: "Low Tier 1", short: "Rising",
    glow: "shadow-[0_0_60px_rgba(6,182,212,0.25)]",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    bar: "bg-gradient-to-r from-cyan-600 to-cyan-400",
    gradient: "from-cyan-900/30 via-cyan-950/10 to-transparent",
    ring: "border-cyan-500/50",
    color: "text-cyan-400",
  },
  LT2: {
    label: "Low Tier 2", short: "Amateur",
    glow: "shadow-[0_0_60px_rgba(59,130,246,0.25)]",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    bar: "bg-gradient-to-r from-blue-600 to-blue-400",
    gradient: "from-blue-900/30 via-blue-950/10 to-transparent",
    ring: "border-blue-500/50",
    color: "text-blue-400",
  },
  LT3: {
    label: "Low Tier 3", short: "Beginner",
    glow: "shadow-[0_0_60px_rgba(99,102,241,0.25)]",
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    bar: "bg-gradient-to-r from-indigo-600 to-indigo-400",
    gradient: "from-indigo-900/30 via-indigo-950/10 to-transparent",
    ring: "border-indigo-500/50",
    color: "text-indigo-400",
  },
  LT4: {
    label: "Low Tier 4", short: "Novice",
    glow: "shadow-[0_0_60px_rgba(139,92,246,0.2)]",
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/40",
    bar: "bg-gradient-to-r from-violet-600 to-violet-400",
    gradient: "from-violet-900/30 via-violet-950/10 to-transparent",
    ring: "border-violet-500/50",
    color: "text-violet-400",
  },
  LT5: {
    label: "Low Tier 5", short: "Unranked",
    glow: "shadow-[0_0_40px_rgba(100,116,139,0.15)]",
    badge: "bg-muted text-muted-foreground border-border",
    bar: "bg-muted-foreground",
    gradient: "from-muted/30 to-transparent",
    ring: "border-border",
    color: "text-muted-foreground",
  },
};

const ROLE_META: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  owner:     { label: "Owner",     style: "bg-red-500/20 text-red-400 border-red-500/40",       icon: <Crown className="w-3 h-3" /> },
  admin:     { label: "Admin",     style: "bg-orange-500/20 text-orange-400 border-orange-500/40", icon: <ShieldCheck className="w-3 h-3" /> },
  moderator: { label: "Moderator", style: "bg-blue-500/20 text-blue-400 border-blue-500/40",     icon: <ShieldCheck className="w-3 h-3" /> },
  user:      { label: "Player",    style: "bg-muted text-muted-foreground border-border",          icon: null },
};

function getAvatar(player: any) {
  if (player.avatarUrl) return player.avatarUrl;
  if (player.minecraftUsername) return `https://mc-heads.net/avatar/${player.minecraftUsername}/128`;
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.username}`;
}

function getMcBody(player: any) {
  if (player.minecraftUsername) return `https://mc-heads.net/body/${player.minecraftUsername}/200`;
  return null;
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="bg-card border-border flex-1 min-w-0">
      <CardContent className="p-5 flex flex-col items-center text-center gap-1">
        <div className={`mb-1 ${color ?? "text-muted-foreground"}`}>{icon}</div>
        <div className={`text-2xl font-display font-black ${color ?? ""}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}

function HeartRow({ count, max = 20 }: { count: number; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          className={`w-4 h-4 ${i < count ? "text-red-500 fill-red-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
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
  const role = player?.role ?? "user";
  const roleMeta = ROLE_META[role] ?? ROLE_META.user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center">
          <Trophy className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-black mb-2">Player Not Found</h2>
          <p className="text-muted-foreground">This player doesn't exist or hasn't joined the server yet.</p>
        </div>
        <Link href="/leaderboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
          </Button>
        </Link>
      </div>
    );
  }

  const rankPercent = Math.max(1, Math.round(((player.totalPlayers - player.rank + 1) / player.totalPlayers) * 100));
  const isTop3 = player.rank <= 3;
  const hearts = Math.max(1, Math.min(20, 20 - Math.floor((player.rank - 1) / (player.totalPlayers / 20))));
  const mcBodyUrl = getMcBody(player);

  return (
    <div className="min-h-screen pb-16">
      <div className={`relative overflow-hidden bg-gradient-to-b ${meta.gradient} border-b border-border`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/leaderboard">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground -ml-2 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4 lg:items-start"
            >
              <div className="relative">
                <div className={`w-32 h-32 rounded-2xl border-2 ${meta.ring} ${meta.glow} overflow-hidden bg-card flex items-center justify-center`}>
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={getAvatar(player)} alt={player.username} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black rounded-none">{player.username[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className={`absolute -bottom-3 -right-3 bg-background border-2 ${meta.ring} rounded-xl px-3 py-1 font-display font-black text-lg ${meta.color}`}>
                  #{player.rank}
                </div>
              </div>

              {mcBodyUrl && (
                <div className="hidden lg:block">
                  <img
                    src={mcBodyUrl}
                    alt={`${player.minecraftUsername} skin`}
                    className="h-40 object-contain opacity-70 hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-grow"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {role !== "user" && (
                  <Badge variant="outline" className={`flex items-center gap-1.5 capitalize px-3 py-1 ${roleMeta.style}`}>
                    {roleMeta.icon}
                    {roleMeta.label}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${meta.badge}`}>
                  {tier} — {meta.label}
                </Badge>
                {player.activeRank && (
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border border-primary/30 px-3 py-1">
                    <Star className="w-3 h-3 mr-1.5" />
                    {player.activeRank}
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-5xl sm:text-6xl font-black mb-4 leading-none">
                {player.username}
              </h1>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-5">
                {player.minecraftUsername && (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-green-500" />
                    <span className="text-foreground font-medium">{player.minecraftUsername}</span>
                    <span className="text-muted-foreground/50">on Minecraft</span>
                  </div>
                )}
                {player.discordUsername && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span className="text-foreground font-medium">{player.discordUsername}</span>
                    <span className="text-muted-foreground/50">on Discord</span>
                  </div>
                )}
                {player.joinedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined <span className="text-foreground font-medium">{format(new Date(player.joinedAt), "MMMM yyyy")}</span></span>
                  </div>
                )}
              </div>

              {isTop3 && (
                <div className="flex items-center gap-2 text-sm">
                  <Crown className={`w-4 h-4 ${player.rank === 1 ? "text-yellow-400" : player.rank === 2 ? "text-slate-300" : "text-amber-600"}`} />
                  <span className={`font-semibold ${player.rank === 1 ? "text-yellow-400" : player.rank === 2 ? "text-slate-300" : "text-amber-600"}`}>
                    {player.rank === 1 ? "Champion of the Server" : player.rank === 2 ? "Runner-Up" : "Third Place"}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Global Rank"
            value={`#${player.rank}`}
            sub={`of ${player.totalPlayers}`}
            color={isTop3 ? (player.rank === 1 ? "text-yellow-400" : player.rank === 2 ? "text-slate-300" : "text-amber-600") : meta.color}
          />
          <StatCard
            icon={<Crosshair className="w-5 h-5" />}
            label="Total Kills"
            value={player.kills.toLocaleString()}
            color="text-red-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Top Percentile"
            value={`${rankPercent}%`}
            sub="of all players"
            color="text-primary"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Tier"
            value={tier}
            sub={meta.short}
            color={meta.color}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display font-bold">
                  <ShieldCheck className={`w-5 h-5 ${meta.color}`} />
                  Combat Profile
                </CardTitle>
              </CardHeader>
              <Separator className="bg-border mb-4" />
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Leaderboard Position
                    </span>
                    <span className="font-semibold">#{player.rank} / {player.totalPlayers} players</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Sword className="w-3.5 h-3.5" /> Tier Classification
                    </span>
                    <Badge variant="outline" className={`font-bold ${meta.badge}`}>{tier} — {meta.label}</Badge>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5" /> Total Kills
                    </span>
                    <span className={`font-semibold flex items-center gap-1.5 ${meta.color}`}>
                      <Crosshair className="w-3.5 h-3.5" />
                      {player.kills.toLocaleString()}
                    </span>
                  </div>
                  {player.activeRank && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" /> Store Rank
                      </span>
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-primary/30">{player.activeRank}</Badge>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ranking Progress</span>
                    <span>Top {rankPercent}% globally</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rankPercent}%` }}
                      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${meta.bar}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/60">
                    <span>#{player.totalPlayers}</span>
                    <span>#1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display font-bold">
                  <Heart className="w-5 h-5 text-red-400" />
                  Hearts Remaining
                </CardTitle>
              </CardHeader>
              <Separator className="bg-border mb-4" />
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Estimated based on leaderboard standing. Steal hearts by killing players, lose them when defeated.
                </p>
                <HeartRow count={hearts} />
                <div className="text-sm font-semibold tabular-nums">
                  <span className="text-red-400">{hearts}</span>
                  <span className="text-muted-foreground"> / 20 hearts</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(hearts / 20) * 100}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {(player.minecraftUsername || player.discordUsername || player.joinedAt) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display font-bold">
                  <Users className="w-5 h-5 text-primary" />
                  Identity
                </CardTitle>
              </CardHeader>
              <Separator className="bg-border mb-4" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {player.minecraftUsername && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                        <Gamepad2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Minecraft</div>
                        <div className="font-semibold text-sm truncate">{player.minecraftUsername}</div>
                      </div>
                    </div>
                  )}
                  {player.discordUsername && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Discord</div>
                        <div className="font-semibold text-sm truncate">{player.discordUsername}</div>
                      </div>
                    </div>
                  )}
                  {player.joinedAt && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Member Since</div>
                        <div className="font-semibold text-sm">{format(new Date(player.joinedAt), "MMM d, yyyy")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-4"
        >
          <Link href="/leaderboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
            </Button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
