import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Crosshair } from "lucide-react";
import { motion } from "framer-motion";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5"];

const TIER_STYLES: Record<string, { badge: string; label: string }> = {
  HT1: { badge: "bg-red-500/20 text-red-400 border-red-500/40",    label: "HT1" },
  HT2: { badge: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "HT2" },
  HT3: { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", label: "HT3" },
  HT4: { badge: "bg-green-500/20 text-green-400 border-green-500/40",   label: "HT4" },
  HT5: { badge: "bg-teal-500/20 text-teal-400 border-teal-500/40",      label: "HT5" },
  LT1: { badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",      label: "LT1" },
  LT2: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",      label: "LT2" },
  LT3: { badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40", label: "LT3" },
  LT4: { badge: "bg-violet-500/20 text-violet-400 border-violet-500/40", label: "LT4" },
  LT5: { badge: "bg-muted text-muted-foreground border-border",          label: "LT5" },
};

export default function Leaderboard() {
  const { data: players, isLoading } = useGetLeaderboard();

  const grouped = TIERS.reduce((acc, t) => {
    const list = (players ?? []).filter((p: any) => p.tier === t);
    if (list.length) acc[t] = list;
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-5xl font-black mb-4 uppercase tracking-tight">
            Hall of <span className="text-primary">Fame</span>
          </h1>
          <p className="text-muted-foreground text-lg">Players ranked by tier and kills.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {TIERS.filter(t => grouped[t]).map(tier => (
              <div key={tier}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${TIER_STYLES[tier].badge}`}>
                    {tier}
                  </Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {grouped[tier].map((player: any, i: number) => {
                    const globalIdx = (players ?? []).indexOf(player);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        key={player.userId}
                      >
                        <Card className={`flex items-center p-4 sm:p-5 border ${
                          globalIdx === 0 ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]" :
                          globalIdx === 1 ? "border-gray-400 bg-gray-400/10" :
                          globalIdx === 2 ? "border-amber-700 bg-amber-700/10" :
                          "border-border bg-card hover:border-primary/30 transition-colors"
                        }`}>
                          <div className="flex-shrink-0 w-10 text-center font-display font-black text-xl text-muted-foreground">
                            #{player.rank}
                          </div>

                          <Avatar className={`w-11 h-11 border-2 mx-4 ${globalIdx < 3 ? "border-primary" : "border-transparent"}`}>
                            <AvatarImage src={player.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} />
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
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
