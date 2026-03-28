import { useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, Ticket, ShieldBan, Crown } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats();

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading stats...</div>;
  if (!stats) return <div className="p-8 text-destructive">Failed to load stats.</div>;

  const statCards = [
    { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-500" },
    { title: "New Users Today", value: `+${stats.newUsersToday}`, icon: Users, color: "text-green-500" },
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { title: "Revenue Today", value: `$${stats.revenueToday.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { title: "Total Purchases", value: stats.totalPurchases.toLocaleString(), icon: ShoppingCart, color: "text-purple-500" },
    { title: "Open Tickets", value: stats.openTickets.toLocaleString(), icon: Ticket, color: "text-yellow-500" },
    { title: "Active Ranks", value: stats.activeRanks.toLocaleString(), icon: Crown, color: "text-amber-500" },
    { title: "Banned Users", value: stats.bannedUsers.toLocaleString(), icon: ShieldBan, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Server statistics overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card border-border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
