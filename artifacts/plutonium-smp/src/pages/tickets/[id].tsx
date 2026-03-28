import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetTicket, useSendTicketMessage, useCloseTicket } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ShieldAlert, Send, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data, isLoading, refetch } = useGetTicket(id, { query: { enabled: !!user } });
  const { mutate: sendMessage, isPending: sending } = useSendTicketMessage();
  const { mutate: closeTicket, isPending: closing } = useCloseTicket();

  const [message, setMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessage({ id, data: { content: message } }, {
      onSuccess: () => {
        setMessage("");
        refetch();
      }
    });
  };

  const handleClose = () => {
    closeTicket({ id }, {
      onSuccess: () => {
        toast({ title: "Ticket closed" });
        refetch();
      }
    });
  };

  if (isLoading) return <div className="p-12 text-center animate-pulse">Loading...</div>;
  if (!data) return <div className="p-12 text-center text-destructive">Ticket not found</div>;

  const { ticket, messages } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      <Link href="/tickets" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tickets
      </Link>

      <div className="bg-card border border-border rounded-t-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold">{ticket.subject}</h1>
            <Badge className={
              ticket.status === 'open' ? 'bg-primary' :
              ticket.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-muted'
            }>
              {ticket.status.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Ticket #{ticket.id} • Category: {ticket.category.replace('_', ' ')}
          </div>
        </div>
        
        {ticket.status !== 'closed' && (
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleClose} disabled={closing}>
            <Lock className="w-4 h-4 mr-2" /> Close Ticket
          </Button>
        )}
      </div>

      <div className="flex-1 bg-background border-x border-border p-6 flex flex-col gap-6 overflow-y-auto min-h-[400px]">
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <Avatar className={`w-10 h-10 flex-shrink-0 ${msg.isStaff ? 'border-2 border-primary/50' : ''}`}>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} />
                <AvatarFallback>{msg.username[0]}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-muted-foreground">{msg.username}</span>
                  {msg.isStaff && <Badge variant="secondary" className="text-[10px] h-5 px-1.5"><ShieldAlert className="w-3 h-3 mr-1"/> Staff</Badge>}
                  <span className="text-xs text-muted-foreground/60">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.isStaff 
                    ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tl-sm' 
                    : isMe 
                      ? 'bg-card border border-border text-foreground rounded-tr-sm'
                      : 'bg-muted/30 border border-border text-foreground rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-b-xl p-4">
        {ticket.status === 'closed' ? (
          <div className="text-center p-4 text-muted-foreground bg-background rounded-lg border border-border">
            <Lock className="w-5 h-5 mx-auto mb-2 opacity-50" />
            This ticket is closed. You cannot send further messages.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-4">
            <Textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] max-h-[200px] bg-background resize-y"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button type="submit" disabled={sending || !message.trim()} className="h-auto px-6 bg-primary text-primary-foreground font-bold">
              {sending ? "..." : <><Send className="w-4 h-4 mr-2"/> Send</>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
