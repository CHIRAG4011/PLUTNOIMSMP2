import { useAdminGetPurchases } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminPurchases() {
  const { data: purchases, isLoading } = useAdminGetPurchases();

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Purchase Log</h1>
        <p className="text-muted-foreground">All transactions across the server.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>Transaction ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases?.map(p => (
              <TableRow key={p.id} className="border-border">
                <TableCell className="font-mono text-xs">{p.id.slice(0,12)}...</TableCell>
                <TableCell className="font-bold">{p.itemName}</TableCell>
                <TableCell className="font-mono text-xs">{p.userId.slice(0,8)}</TableCell>
                <TableCell className="font-bold">{p.pricePaid} {p.currency.toUpperCase()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.status === 'completed' ? 'text-primary border-primary' : 'text-destructive border-destructive'}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{format(new Date(p.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
