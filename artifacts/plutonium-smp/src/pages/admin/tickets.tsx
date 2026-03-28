import { useAdminGetTickets } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";

export default function AdminTickets() {
  const { data: tickets, isLoading } = useAdminGetTickets();

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">All Tickets</h1>
        <p className="text-muted-foreground">Manage user support requests.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets?.map(ticket => (
              <TableRow key={ticket.id} className="border-border">
                <TableCell>
                  <div className="font-bold">{ticket.subject}</div>
                  <div className="text-xs text-muted-foreground capitalize">{ticket.category.replace('_',' ')}</div>
                </TableCell>
                <TableCell className="font-medium">{ticket.username}</TableCell>
                <TableCell>
                  <Badge className={
                    ticket.status === 'open' ? 'bg-primary text-primary-foreground' :
                    ticket.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-muted text-muted-foreground'
                  }>{ticket.status.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt), 'MMM d, yy')}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/tickets/${ticket.id}`} className="text-primary hover:underline text-sm font-bold">View</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
