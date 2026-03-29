import { useState } from "react";
import { useAdminGetUsers, useAdminBanUser, useAdminUnbanUser, useAdminSetUserRole } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, ShieldBan, ShieldCheck, ShieldAlert, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const ROLE_COLORS: Record<string, string> = {
  owner: "border-red-500/50 text-red-400 bg-red-500/10",
  admin: "border-green-500/50 text-green-400 bg-green-500/10",
  moderator: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  user: "border-border text-muted-foreground",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, refetch } = useAdminGetUsers({ query: { search, limit: 50 } });
  const { mutate: banUser, isPending: isBanning } = useAdminBanUser();
  const { mutate: unbanUser, isPending: isUnbanning } = useAdminUnbanUser();
  const { mutate: setRole, isPending: isSettingRole } = useAdminSetUserRole();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleBanToggle = (user: any) => {
    if (user.isBanned) {
      unbanUser({ id: user.id }, {
        onSuccess: () => { toast({ title: "User unbanned" }); refetch(); }
      });
    } else {
      const reason = window.prompt("Enter ban reason:");
      if (reason) {
        banUser({ id: user.id, data: { reason } }, {
          onSuccess: () => { toast({ title: "User banned", variant: "destructive" }); refetch(); }
        });
      }
    }
  };

  const handleRoleChange = (userId: string, username: string, newRole: "user" | "moderator" | "admin") => {
    setRole({ userId, role: newRole }, {
      onSuccess: (data) => {
        toast({ title: "Role updated", description: `${username} is now ${newRole}` });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed to update role", description: err?.message || "An error occurred", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <UserCog className="w-8 h-8 text-primary" />
            Manage Users
          </h1>
          <p className="text-muted-foreground">View, manage roles, and moderate player accounts.</p>
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
              <TableHead>Role</TableHead>
              <TableHead>Active Rank</TableHead>
              <TableHead>OWO</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u: any) => {
              const isOwner = u.role === "owner";
              const canChangeRole = !isOwner && u.id !== currentUser?.id;
              return (
                <TableRow key={u.id} className="border-border">
                  <TableCell>
                    <div className="font-bold">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                    {u.discordUsername && (
                      <div className="text-xs text-[#5865F2] mt-0.5">Discord: {u.discordUsername}</div>
                    )}
                    {u.isBanned && (
                      <Badge variant="destructive" className="text-[10px] mt-1">
                        <ShieldBan className="w-2.5 h-2.5 mr-1" />Banned: {u.banReason}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canChangeRole ? (
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.id, u.username, val as any)}
                        disabled={isSettingRole}
                      >
                        <SelectTrigger className={`w-32 h-8 text-xs border ${ROLE_COLORS[u.role] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          {currentUser?.role === "owner" && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`capitalize ${ROLE_COLORS[u.role] || ""}`}>
                        {u.role === "owner" && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {u.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.activeRank ? (
                      <Badge className="bg-primary/20 text-primary">{u.activeRank}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-primary">{u.owoBalance.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.isBanned ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleBanToggle(u)}
                      disabled={isOwner || isBanning || isUnbanning}
                      className="w-24"
                    >
                      {u.isBanned
                        ? <><ShieldCheck className="w-4 h-4 mr-1" />Unban</>
                        : <><ShieldBan className="w-4 h-4 mr-1" />Ban</>}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
