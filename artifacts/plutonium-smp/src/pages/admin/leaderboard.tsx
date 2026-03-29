import { useState } from "react";
import { useAdminGetLeaderboard, useAdminUpdateLeaderboardStats, useAdminSyncLeaderboard } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, RefreshCw, Crosshair, Trophy } from "lucide-react";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5"];

const TIER_STYLES: Record<string, string> = {
  HT1: "bg-red-500/20 text-red-400 border-red-500/40",
  HT2: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  HT3: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  HT4: "bg-green-500/20 text-green-400 border-green-500/40",
  HT5: "bg-teal-500/20 text-teal-400 border-teal-500/40",
  LT1: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  LT2: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  LT3: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  LT4: "bg-violet-500/20 text-violet-400 border-violet-500/40",
  LT5: "bg-muted text-muted-foreground border-border",
};

interface EditState {
  userId: string;
  username: string;
  tier: string;
  kills: number;
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
      tier: entry.tier || "LT5",
      kills: entry.kills,
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
          tier: editEntry.tier,
          kills: editEntry.kills,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard Management
          </h1>
          <p className="text-muted-foreground">Update player kills and tier placement.</p>
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
              <TableHead>Tier</TableHead>
              <TableHead>Active Rank</TableHead>
              <TableHead>
                <div className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-orange-400" /> Kills</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell colSpan={6}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
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
                      <Badge variant="outline" className={TIER_STYLES[entry.tier] || "bg-muted text-muted-foreground"}>
                        {entry.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.activeRank ? (
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">{entry.activeRank}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-400">{entry.kills}</TableCell>
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
                <Label>Tier</Label>
                <Select value={editEntry.tier} onValueChange={(v) => setEditEntry({ ...editEntry, tier: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HT1" className="text-red-400">HT1 — High Tier 1</SelectItem>
                    <SelectItem value="HT2" className="text-orange-400">HT2 — High Tier 2</SelectItem>
                    <SelectItem value="HT3" className="text-yellow-400">HT3 — High Tier 3</SelectItem>
                    <SelectItem value="HT4" className="text-green-400">HT4 — High Tier 4</SelectItem>
                    <SelectItem value="HT5" className="text-teal-400">HT5 — High Tier 5</SelectItem>
                    <SelectItem value="LT1" className="text-cyan-400">LT1 — Low Tier 1</SelectItem>
                    <SelectItem value="LT2" className="text-blue-400">LT2 — Low Tier 2</SelectItem>
                    <SelectItem value="LT3" className="text-indigo-400">LT3 — Low Tier 3</SelectItem>
                    <SelectItem value="LT4" className="text-violet-400">LT4 — Low Tier 4</SelectItem>
                    <SelectItem value="LT5">LT5 — Low Tier 5</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Active Rank</Label>
                <Input
                  value={editEntry.activeRank}
                  placeholder="VIP, MVP, Legend..."
                  onChange={(e) => setEditEntry({ ...editEntry, activeRank: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
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
