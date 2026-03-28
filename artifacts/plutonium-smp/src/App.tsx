import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Home from "@/pages/home";
import Store from "@/pages/store";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets/index";
import TicketDetail from "@/pages/tickets/[id]";
import Leaderboard from "@/pages/leaderboard";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminStore from "@/pages/admin/store";
import AdminTickets from "@/pages/admin/tickets";
import AdminPurchases from "@/pages/admin/purchases";
import AdminAnnouncements from "@/pages/admin/announcements";
import AdminCoupons from "@/pages/admin/coupons";
import AdminCurrency from "@/pages/admin/currency";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/store" component={Store} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/leaderboard" component={Leaderboard} />
      
      {/* Admin Routes wrapped in AdminLayout */}
      <Route path="/admin">{() => <Redirect to="/admin/dashboard" />}</Route>
      <Route path="/admin/dashboard">{() => <AdminLayout><AdminDashboard /></AdminLayout>}</Route>
      <Route path="/admin/users">{() => <AdminLayout><AdminUsers /></AdminLayout>}</Route>
      <Route path="/admin/store">{() => <AdminLayout><AdminStore /></AdminLayout>}</Route>
      <Route path="/admin/tickets">{() => <AdminLayout><AdminTickets /></AdminLayout>}</Route>
      <Route path="/admin/purchases">{() => <AdminLayout><AdminPurchases /></AdminLayout>}</Route>
      <Route path="/admin/announcements">{() => <AdminLayout><AdminAnnouncements /></AdminLayout>}</Route>
      <Route path="/admin/coupons">{() => <AdminLayout><AdminCoupons /></AdminLayout>}</Route>
      <Route path="/admin/currency">{() => <AdminLayout><AdminCurrency /></AdminLayout>}</Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
              <Navbar />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
