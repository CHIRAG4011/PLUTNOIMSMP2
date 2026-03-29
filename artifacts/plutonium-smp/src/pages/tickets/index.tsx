import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetTickets, useCreateTicket } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, Plus, MessageSquare, Swords, ShoppingCart, Flag, HelpCircle, ShieldAlert, Bug, Star, CreditCard, User, Crown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TICKET_CATEGORIES = [
  {
    group: "General",
    items: [
      { value: "support",          label: "General Support",       icon: HelpCircle,   description: "General questions and help" },
      { value: "general",          label: "General Inquiry",       icon: MessageSquare, description: "Other general inquiries" },
      { value: "suggestions",      label: "Suggestion",            icon: Lightbulb,    description: "Share ideas to improve the server" },
    ],
  },
  {
    group: "Account & Billing",
    items: [
      { value: "purchase_issues",  label: "Purchase Issue",        icon: ShoppingCart, description: "Problems with a store purchase" },
      { value: "billing",          label: "Billing Dispute",       icon: CreditCard,   description: "Payment or refund issues" },
      { value: "account_issues",   label: "Account Issue",         icon: User,         description: "Login, profile, or data issues" },
      { value: "rank_issues",      label: "Rank / Perk Issue",     icon: Crown,        description: "Missing rank or in-game perks" },
    ],
  },
  {
    group: "Reports & Appeals",
    items: [
      { value: "report_player",    label: "Report a Player",       icon: Flag,         description: "Report rule-breaking behavior" },
      { value: "ban_appeal",       label: "Ban Appeal",            icon: ShieldAlert,  description: "Appeal a ban or mute" },
      { value: "bug_report",       label: "Bug Report",            icon: Bug,          description: "Report a game bug or glitch" },
    ],
  },
  {
    group: "Staff",
    items: [
      { value: "staff_application",label: "Staff Application",     icon: Star,         description: "Apply for a staff position" },
    ],
  },
];

const ALL_CATEGORIES = TICKET_CATEGORIES.flatMap(g => g.items);

function categoryLabel(val: string) {
  return ALL_CATEGORIES.find(c => c.value === val)?.label ?? val.replace(/_/g, " ");
}

const STATUS_CLASSES: Record<string, string> = {
  open:    "bg-primary text-primary-foreground",
  pending: "bg-yellow-500 text-black",
  closed:  "bg-muted text-muted-foreground",
};

export default function Tickets() {
  const { user } = useAuth();
  const { data: tickets, isLoading, refetch } = useGetTickets({ query: { enabled: !!user } });
  const { mutate: createTicket, isPending } = useCreateTicket();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "", priority: "medium", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket({ data: form }, {
      onSuccess: () => {
        toast({ title: "Ticket created", description: "Our team will respond shortly." });
        setOpen(false);
        setForm({ subject: "", category: "", priority: "medium", message: "" });
        refetch();
      },
      onError: () => toast({ title: "Failed to create ticket", variant: "destructive" }),
    });
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <TicketIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-xl font-medium mb-2">Sign in to view tickets</p>
        <p className="text-muted-foreground mb-6">You need to be logged in to open or view support tickets.</p>
        <Link href="/login"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-primary" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground mt-1">Need help? Open a ticket to speak with staff.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold neon-glow-hover">
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>Open a Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })} required>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map(group => (
                      <SelectGroup key={group.group}>
                        <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
                          {group.group}
                        </SelectLabel>
                        {group.items.map(cat => {
                          const Icon = cat.icon;
                          return (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                  <div className="font-medium text-sm">{cat.label}</div>
                                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — I can wait</SelectItem>
                    <SelectItem value="medium">Medium — Normal issue</SelectItem>
                    <SelectItem value="high">High — Urgent problem</SelectItem>
                    <SelectItem value="urgent">Urgent — Needs immediate attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="bg-background min-h-[120px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold"
                disabled={isPending || !form.category || !form.subject || !form.message}
              >
                {isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading tickets...</div>
        ) : tickets?.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-xl font-medium mb-2">No active tickets</p>
            <p className="text-muted-foreground">You don't have any support requests right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets?.map(ticket => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block hover:bg-background/50 transition-colors p-4 sm:p-6 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg group-hover:text-primary transition-colors truncate">{ticket.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{categoryLabel(ticket.category)}</Badge>
                      <Badge variant="outline" className={`text-xs capitalize ${
                        ticket.priority === "urgent" ? "border-red-500 text-red-500" :
                        ticket.priority === "high" ? "border-orange-500 text-orange-500" :
                        ticket.priority === "low" ? "border-muted-foreground text-muted-foreground" : ""
                      }`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                      <span>#{ticket.id.slice(0, 8)}</span>
                      <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {ticket.messageCount}
                      </span>
                    </div>
                  </div>
                  <Badge className={`shrink-0 ${STATUS_CLASSES[ticket.status] ?? ""}`}>
                    {ticket.status.toUpperCase()}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
