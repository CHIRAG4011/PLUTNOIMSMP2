import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useGetUserPurchases } from "@workspace/api-client-react";
import { Redirect, Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { User, Calendar, Shield, ShoppingBag, Package, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: JSX.Element; className: string }> = {
    completed: { label: "Completed", icon: <CheckCircle className="w-3 h-3" />, className: "border-green-500 text-green-500 bg-green-500/10" },
    pending:   { label: "Pending",   icon: <Clock className="w-3 h-3" />,        className: "border-yellow-500 text-yellow-500 bg-yellow-500/10" },
    failed:    { label: "Failed",    icon: <XCircle className="w-3 h-3" />,      className: "border-destructive text-destructive bg-destructive/10" },
    refunded:  { label: "Refunded",  icon: <RotateCcw className="w-3 h-3" />,    className: "border-blue-500 text-blue-500 bg-blue-500/10" },
  };
  const s = map[status] || { label: status, icon: <Clock className="w-3 h-3" />, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${s.className}`}>
      {s.icon}{s.label}
    </Badge>
  );
}

export default function Dashboard() {
  const { user, isLoading, login: setAuthToken } = useAuth();
  const search = useSearch();
  const { data: purchases, isLoading: purchasesLoading } = useGetUserPurchases({
    query: { enabled: !!user }
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user && !new URLSearchParams(search).get("token")) return <Redirect to="/login" />;

  const pending = purchases?.filter(p => p.status === "pending") ?? [];
  const completed = purchases?.filter(p => p.status === "completed") ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Your Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Profile Card */}
        <Card className="col-span-1 border-border bg-card shadow-lg">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
              <AvatarImage src={user.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-bold">{user.username}</CardTitle>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="border-primary text-primary capitalize">{user.role}</Badge>
              {user.activeRank && <Badge variant="secondary">{user.activeRank}</Badge>}
              {user.discordUsername && (
                <Badge variant="outline" className="border-[#5865F2] text-[#5865F2] text-xs">
                  Discord: {user.discordUsername}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {user.minecraftUsername && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
                <User className="w-4 h-4 text-primary" />
                <span>MC: {user.minecraftUsername}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Joined: {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Shield className="w-4 h-4 text-primary" />
              <span>Status: {user.isBanned ? <span className="text-destructive font-bold">Banned</span> : <span className="text-primary font-bold">Active</span>}</span>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-background border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{completed.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="bg-background border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{pending.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>

            <Link href="/store">
              <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors mt-2">
                Visit Store
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="col-span-1 md:col-span-2 border-border bg-card shadow-lg flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Order History
              </CardTitle>
              {pending.length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  {pending.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {purchasesLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>
            ) : purchases && purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{p.itemName}</span>
                            <span className="text-xs text-muted-foreground capitalize">{p.itemCategory.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">
                            ${(p.pricePaid / 100).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {format(new Date(p.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">No orders yet.</p>
                <p className="text-sm text-muted-foreground/60 mb-6">Visit the store to get exclusive perks.</p>
                <Link href="/store">
                  <Button variant="outline" size="sm">Browse Store</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders Alert */}
      {pending.length > 0 && (
        <Card className="mt-6 border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-500">You have {pending.length} pending order{pending.length > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pending orders are awaiting payment confirmation. Please contact an admin on our Discord server to complete your payment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
