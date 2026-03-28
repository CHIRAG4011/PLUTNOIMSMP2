import { useState } from "react";
import { useAdminGetUsers, useAdminBanUser, useAdminUnbanUser } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, ShieldBan, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, refetch } = useAdminGetUsers({ query: { search, limit: 50 } });
  const { mutate: banUser } = useAdminBanUser();
  const { mutate: unbanUser } = useAdminUnbanUser();
  const { toast } = useToast();

  const handleBanToggle = (user: any) => {
    if (user.isBanned) {
      unbanUser({ id: user.id }, {
        onSuccess: () => {
          toast({ title: "User unbanned" });
          refetch();
        }
      });
    } else {
      const reason = window.prompt("Enter ban reason:");
      if (reason) {
        banUser({ id: user.id, data: { reason } }, {
          onSuccess: () => {
            toast({ title: "User banned", variant: "destructive" });
            refetch();
          }
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Manage Users</h1>
          <p className="text-muted-foreground">View and manage all registered accounts.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input 
            className="pl-9 bg-card border-border" 
            placeholder="Search username/email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>User</TableHead>
              <TableHead>Role/Rank</TableHead>
              <TableHead>OWO</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map(u => (
              <TableRow key={u.id} className="border-border">
                <TableCell>
                  <div className="font-bold">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  {u.isBanned && <Badge variant="destructive" className="text-[10px] mt-1">Banned: {u.banReason}</Badge>}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                    {u.activeRank && <Badge className="bg-primary/20 text-primary block w-fit">{u.activeRank}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-primary">{u.owoBalance}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(u.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant={u.isBanned ? "outline" : "destructive"} 
                    size="sm"
                    onClick={() => handleBanToggle(u)}
                    className="w-24"
                  >
                    {u.isBanned ? <><ShieldCheck className="w-4 h-4 mr-1"/> Unban</> : <><ShieldBan className="w-4 h-4 mr-1"/> Ban</>}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
