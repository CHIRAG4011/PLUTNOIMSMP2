import { useAuth } from "@/lib/auth";
import { useGetUserPurchases } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Coins, User, Calendar, Shield, CreditCard, ShoppingBag } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { data: purchases, isLoading: purchasesLoading } = useGetUserPurchases({
    query: { enabled: !!user }
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Redirect to="/login" />;

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
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline" className="border-primary text-primary capitalize">{user.role}</Badge>
              {user.activeRank && <Badge variant="secondary">{user.activeRank}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm">OWO Balance</span>
              </div>
              <span className="font-bold text-lg text-primary">{user.owoBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <User className="w-4 h-4" />
              <span>MC: {user.minecraftUsername || "Not linked"}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Calendar className="w-4 h-4" />
              <span>Joined: {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Shield className="w-4 h-4" />
              <span>Status: {user.isBanned ? <span className="text-destructive font-bold">Banned</span> : <span className="text-primary font-bold">Active</span>}</span>
            </div>
          </CardContent>
        </Card>

        {/* Purchase History */}
        <Card className="col-span-1 md:col-span-2 border-border bg-card shadow-lg flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Purchase History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {purchasesLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading purchases...</div>
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
                          <div className="flex items-center gap-1 font-bold">
                            {p.currency === 'owo' ? <Coins className="w-3 h-3 text-primary" /> : '$'}
                            {p.pricePaid.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            p.status === 'completed' ? 'border-primary text-primary' : 
                            p.status === 'failed' ? 'border-destructive text-destructive' : ''
                          }>
                            {p.status}
                          </Badge>
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
                <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">No purchases yet.</p>
                <p className="text-sm text-muted-foreground/60">Visit the store to get exclusive perks.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
