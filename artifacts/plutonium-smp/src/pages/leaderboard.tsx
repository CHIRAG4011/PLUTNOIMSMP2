import { useGetLeaderboard } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Heart, Crosshair, Coins } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: players, isLoading } = useGetLeaderboard();

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-5xl font-black mb-4 uppercase tracking-tight">
            Hall of <span className="text-primary">Fame</span>
          </h1>
          <p className="text-muted-foreground text-lg">Top players ranked by total kills.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {players?.map((player, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={player.userId}
              >
                <Card className={`flex items-center p-4 sm:p-6 border ${
                  i === 0 ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : 
                  i === 1 ? "border-gray-400 bg-gray-400/10" :
                  i === 2 ? "border-amber-700 bg-amber-700/10" :
                  "border-border bg-card hover:border-primary/30 transition-colors"
                }`}>
                  <div className="flex-shrink-0 w-12 text-center font-display font-black text-2xl text-muted-foreground">
                    #{player.rank}
                  </div>
                  
                  <Avatar className={`w-12 h-12 border-2 mx-4 ${i < 3 ? 'border-primary' : 'border-transparent'}`}>
                    <AvatarImage src={player.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} />
                    <AvatarFallback>{player.username[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {player.username}
                        {player.activeRank && <Badge className="text-[10px] bg-primary/20 text-primary hover:bg-primary/20">{player.activeRank}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">MC: {player.minecraftUsername || "Unknown"}</div>
                    </div>

                    <div className="flex items-center gap-6 text-sm font-semibold">
                      <div className="flex items-center gap-1.5 w-16" title="Kills">
                        <Crosshair className="w-4 h-4 text-red-500" />
                        {player.kills}
                      </div>
                      <div className="flex items-center gap-1.5 w-16" title="Hearts">
                        <Heart className="w-4 h-4 text-pink-500 fill-red-500/20" />
                        {player.hearts}
                      </div>
                      <div className="flex items-center gap-1.5 w-24" title="OWO Coins">
                        <Coins className="w-4 h-4 text-primary" />
                        {player.owoBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
