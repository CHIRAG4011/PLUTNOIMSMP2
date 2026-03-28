import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetTickets, useCreateTicket } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        toast({ title: "Ticket created", description: "Support will respond shortly." });
        setOpen(false);
        setForm({ subject: "", category: "", priority: "medium", message: "" });
        refetch();
      }
    });
  };

  if (!user) return <div className="p-12 text-center text-muted-foreground">Please log in to view tickets.</div>;

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
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Open New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})} required>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">General Support</SelectItem>
                    <SelectItem value="purchase_issues">Purchase Issues</SelectItem>
                    <SelectItem value="report_player">Report Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Message</label>
                <Textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="bg-background min-h-[100px]" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold" disabled={isPending || !form.category}>
                {isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading tickets...</div>
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg group-hover:text-primary transition-colors">{ticket.subject}</span>
                      <Badge variant="outline" className="text-xs uppercase">{ticket.category.replace('_', ' ')}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>ID: #{ticket.id.slice(0,8)}</span>
                      <span>Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ticket.messageCount}</span>
                    </div>
                  </div>
                  <Badge className={
                    ticket.status === 'open' ? 'bg-primary text-primary-foreground' :
                    ticket.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-muted text-muted-foreground'
                  }>
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
