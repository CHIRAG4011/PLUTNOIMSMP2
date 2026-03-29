import { useState } from "react";
import { useAdminGetLeaderboard, useAdminUpdateLeaderboardStats, useAdminSyncLeaderboard } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, RefreshCw, Heart, Crosshair, Coins, Trophy } from "lucide-react";

interface EditState {
  userId: string;
  username: string;
  hearts: number;
  kills: number;
  owoBalance: number;
  activeRank: string;
  minecraftUsername: string;
}

export default function AdminLeaderboard() {
  const { data: entries, isLoading, refetch } = useAdminGetLeaderboard();
  const { mutate: updateStats, isPending: isUpdating } = useAdminUpdateLeaderboardStats();
  const { mutate: syncLeaderboard, isPending: isSyncing } = useAdminSyncLeaderboard();
  const { toast } = useToast();
  const [editEntry, setEditEntry] = useState<EditState | null>(null);

  const handleSync = () => {
    syncLeaderboard(undefined, {
      onSuccess: (data) => {
        toast({ title: "Synced!", description: data.message });
        refetch();
      },
      onError: () => toast({ title: "Sync failed", variant: "destructive" }),
    });
  };

  const handleEdit = (entry: any) => {
    setEditEntry({
      userId: entry.userId,
      username: entry.username,
      hearts: entry.hearts,
      kills: entry.kills,
      owoBalance: entry.owoBalance,
      activeRank: entry.activeRank || "",
      minecraftUsername: entry.minecraftUsername || "",
    });
  };

  const handleSave = () => {
    if (!editEntry) return;
    updateStats(
      {
        userId: editEntry.userId,
        data: {
          hearts: editEntry.hearts,
          kills: editEntry.kills,
          owoBalance: editEntry.owoBalance,
          activeRank: editEntry.activeRank,
          minecraftUsername: editEntry.minecraftUsername,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Stats updated", description: `${editEntry.username}'s stats saved.` });
          setEditEntry(null);
          refetch();
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  };

  const rankBadgeStyle = (rank: string | null) => {
    if (!rank) return "bg-muted text-muted-foreground";
    const map: Record<string, string> = {
      Owner: "bg-red-500/20 text-red-400 border-red-500/30",
      Legend: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      MVP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      VIP: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return map[rank] || "bg-primary/20 text-primary";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard Management
          </h1>
          <p className="text-muted-foreground">Update player stats, ranks, and hearts.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync All Users"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>
                <div className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> Hearts</div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-orange-400" /> Kills</div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-primary" /> OWO</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell colSpan={7}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              : entries?.map((entry) => (
                  <TableRow key={entry.userId} className="border-border hover:bg-muted/20">
                    <TableCell className="font-display font-bold text-muted-foreground">#{entry.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`} />
                          <AvatarFallback>{entry.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm">{entry.username}</div>
                          <div className="text-xs text-muted-foreground">MC: {entry.minecraftUsername || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.activeRank ? (
                        <Badge variant="outline" className={rankBadgeStyle(entry.activeRank)}>{entry.activeRank}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-red-400">{entry.hearts}</TableCell>
                    <TableCell className="font-semibold text-orange-400">{entry.kills}</TableCell>
                    <TableCell className="font-semibold text-primary">{entry.owoBalance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(entry)} className="gap-1.5">
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stats — {editEntry?.username}</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Hearts</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={editEntry.hearts}
                  onChange={(e) => setEditEntry({ ...editEntry, hearts: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kills</Label>
                <Input
                  type="number"
                  min={0}
                  value={editEntry.kills}
                  onChange={(e) => setEditEntry({ ...editEntry, kills: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>OWO Balance</Label>
                <Input
                  type="number"
                  min={0}
                  value={editEntry.owoBalance}
                  onChange={(e) => setEditEntry({ ...editEntry, owoBalance: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Active Rank</Label>
                <Input
                  value={editEntry.activeRank}
                  placeholder="VIP, MVP, Legend..."
                  onChange={(e) => setEditEntry({ ...editEntry, activeRank: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Minecraft Username</Label>
                <Input
                  value={editEntry.minecraftUsername}
                  placeholder="Steve123"
                  onChange={(e) => setEditEntry({ ...editEntry, minecraftUsername: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Stats"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
