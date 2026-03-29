import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Crosshair, Crown, Swords, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5"];

const TIER_STYLES: Record<string, { badge: string; label: string; glow: string; bar: string }> = {
  HT1: { badge: "bg-red-500/20 text-red-400 border-red-500/40",      label: "High Tier 1",   glow: "hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]",    bar: "bg-red-500" },
  HT2: { badge: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "High Tier 2", glow: "hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]", bar: "bg-orange-500" },
  HT3: { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", label: "High Tier 3", glow: "hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]",  bar: "bg-yellow-500" },
  HT4: { badge: "bg-green-500/20 text-green-400 border-green-500/40",    label: "High Tier 4", glow: "hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]",   bar: "bg-green-500" },
  HT5: { badge: "bg-teal-500/20 text-teal-400 border-teal-500/40",       label: "High Tier 5", glow: "hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]",   bar: "bg-teal-500" },
  LT1: { badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",        label: "Low Tier 1",  glow: "hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",    bar: "bg-cyan-500" },
  LT2: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",        label: "Low Tier 2",  glow: "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",   bar: "bg-blue-500" },
  LT3: { badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",  label: "Low Tier 3",  glow: "hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]", bar: "bg-indigo-500" },
  LT4: { badge: "bg-violet-500/20 text-violet-400 border-violet-500/40",  label: "Low Tier 4",  glow: "hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]", bar: "bg-violet-500" },
  LT5: { badge: "bg-muted text-muted-foreground border-border",           label: "Low Tier 5",  glow: "hover:border-border",                                                       bar: "bg-muted-foreground" },
};

const RANK_COLORS = [
  "border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-yellow-900/10 shadow-[0_0_30px_rgba(234,179,8,0.25)]",
  "border-slate-300 bg-gradient-to-br from-slate-400/20 to-slate-800/10 shadow-[0_0_20px_rgba(148,163,184,0.2)]",
  "border-amber-600 bg-gradient-to-br from-amber-700/20 to-amber-900/10 shadow-[0_0_20px_rgba(180,83,9,0.2)]",
];

const CROWN_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const PODIUM_HEIGHTS = ["h-36", "h-24", "h-28"];
const PODIUM_ORDER = [1, 0, 2];

function getAvatar(player: any) {
  if (player.avatarUrl) return player.avatarUrl;
  if (player.minecraftUsername) return `https://mc-heads.net/avatar/${player.minecraftUsername}/128`;
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.username}`;
}

function PodiumCard({ player, position }: { player: any; position: number }) {
  const colors = RANK_COLORS[position] ?? "";
  const crownColor = CROWN_COLORS[position] ?? "";
  const tier = TIER_STYLES[player.tier] ?? TIER_STYLES.LT5;

  return (
    <Link href={`/players/${player.userId}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 + 0.2 }}
        className="flex flex-col items-center gap-3 cursor-pointer group"
      >
        <Crown className={`w-6 h-6 ${crownColor} group-hover:scale-110 transition-transform`} />
        <Card className={`border-2 ${colors} w-44 transition-all duration-300 group-hover:scale-105`}>
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarImage src={getAvatar(player)} alt={player.username} />
                <AvatarFallback className="text-xl font-bold">{player.username[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
                #{player.rank}
              </div>
            </div>
            <div>
              <div className="font-display font-black text-sm leading-tight">{player.username}</div>
              {player.activeRank && (
                <Badge className="text-[9px] mt-1 bg-primary/20 text-primary hover:bg-primary/20 border-primary/30">{player.activeRank}</Badge>
              )}
            </div>
            <Badge variant="outline" className={`text-[10px] px-2 ${tier.badge}`}>{player.tier}</Badge>
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Crosshair className="w-3 h-3 text-red-400" />
              {player.kills.toLocaleString()} kills
            </div>
          </CardContent>
        </Card>
        <div className={`${PODIUM_HEIGHTS[position]} w-full rounded-t-lg ${position === 0 ? "bg-yellow-500/30 border border-yellow-500/40" : position === 1 ? "bg-slate-400/20 border border-slate-400/30" : "bg-amber-700/20 border border-amber-600/30"} flex items-end justify-center pb-2`}>
          <span className="font-display font-black text-2xl opacity-60">#{position + 1}</span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Leaderboard() {
  const { data: players, isLoading } = useGetLeaderboard();

  const top3 = (players ?? []).slice(0, 3);
  const rest = (players ?? []).slice(3);

  const grouped = TIERS.reduce((acc, t) => {
    const list = rest.filter((p: any) => p.tier === t);
    if (list.length) acc[t] = list;
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl font-black mb-3 uppercase tracking-tight"
          >
            Hall of <span className="text-primary">Fame</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            The greatest warriors on Plutonium SMP, ranked by tier and kills.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {top3.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-16"
              >
                <div className="flex items-end justify-center gap-4 sm:gap-6">
                  {PODIUM_ORDER.map(idx => (
                    top3[idx] ? <PodiumCard key={top3[idx].userId} player={top3[idx]} position={idx} /> : null
                  ))}
                </div>
              </motion.div>
            )}

            {Object.keys(grouped).length > 0 && (
              <div className="space-y-10">
                <div className="flex items-center gap-3 mb-6">
                  <Swords className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground font-semibold text-sm uppercase tracking-widest">Full Rankings</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {TIERS.filter(t => grouped[t]).map(tier => (
                  <div key={tier}>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${TIER_STYLES[tier].badge}`}>
                        {tier}
                      </Badge>
                      <span className="text-muted-foreground text-sm">{TIER_STYLES[tier].label}</span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{grouped[tier].length} players</span>
                    </div>

                    <div className="space-y-2">
                      {grouped[tier].map((player: any, i: number) => (
                        <motion.div
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={player.userId}
                        >
                          <Link href={`/players/${player.userId}`}>
                            <Card className={`flex items-center p-4 sm:p-5 border border-border bg-card cursor-pointer transition-all duration-200 ${TIER_STYLES[tier].glow} group`}>
                              <div className="flex-shrink-0 w-10 text-center font-display font-black text-xl text-muted-foreground">
                                #{player.rank}
                              </div>

                              <Avatar className="w-11 h-11 border-2 border-transparent mx-4 group-hover:border-primary/40 transition-all">
                                <AvatarImage src={getAvatar(player)} />
                                <AvatarFallback>{player.username[0]}</AvatarFallback>
                              </Avatar>

                              <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="font-bold text-base flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{player.username}</span>
                                    {player.activeRank && (
                                      <Badge className="text-[10px] bg-primary/20 text-primary hover:bg-primary/20 border-primary/30 shrink-0">{player.activeRank}</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    MC: {player.minecraftUsername || "Unknown"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-5 text-sm font-semibold shrink-0">
                                  <div className="flex items-center gap-1.5 text-muted-foreground" title="Kills">
                                    <Crosshair className="w-4 h-4 text-red-400" />
                                    <span>{player.kills.toLocaleString()}</span>
                                    <span className="text-xs font-normal text-muted-foreground/60">kills</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {top3.length < 3 && (players ?? []).length > 0 && (
              <div className="space-y-2">
                {(players ?? []).map((player: any, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={player.userId}
                  >
                    <Link href={`/players/${player.userId}`}>
                      <Card className={`flex items-center p-4 sm:p-5 border cursor-pointer transition-all duration-200 group ${
                        i === 0 ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]" :
                        i === 1 ? "border-slate-400 bg-slate-400/10" :
                        i === 2 ? "border-amber-600 bg-amber-700/10" :
                        "border-border bg-card hover:border-primary/30"
                      }`}>
                        <div className="flex-shrink-0 w-10 text-center font-display font-black text-xl text-muted-foreground">
                          #{player.rank}
                        </div>
                        <Avatar className="w-11 h-11 border-2 border-transparent mx-4">
                          <AvatarImage src={getAvatar(player)} />
                          <AvatarFallback>{player.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-base flex items-center gap-2">
                              {player.username}
                              {player.activeRank && (
                                <Badge className="text-[10px] bg-primary/20 text-primary hover:bg-primary/20">{player.activeRank}</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">MC: {player.minecraftUsername || "Unknown"}</div>
                          </div>
                          <div className="flex items-center gap-5 text-sm font-semibold">
                            <div className="flex items-center gap-1.5" title="Kills">
                              <Crosshair className="w-4 h-4 text-red-500" />
                              {player.kills} kills
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {(players ?? []).length === 0 && (
              <div className="text-center py-24 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No players on the leaderboard yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
