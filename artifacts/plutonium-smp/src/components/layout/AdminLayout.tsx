import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Users, ShoppingBag, Ticket, CreditCard, Megaphone, Tag, Coins, ShieldCheck } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4">
          <ShieldCheck className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold font-display">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view the admin panel.</p>
          <Link href="/" className="text-primary hover:underline block mt-4">Return Home</Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Store Items", href: "/admin/store", icon: ShoppingBag },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Purchases", href: "/admin/purchases", icon: CreditCard },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Currency", href: "/admin/currency", icon: Coins },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/50 bg-card p-4 flex flex-col gap-2 flex-shrink-0">
        <div className="mb-4 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Admin Portal
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 bg-background overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
