import { useState } from "react";
import { useGetStoreItems, useAdminCreateStoreItem, useAdminDeleteStoreItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminStore() {
  const { data: items, refetch } = useGetStoreItems();
  const { mutate: create } = useAdminCreateStoreItem();
  const { mutate: del } = useAdminDeleteStoreItem();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "ranks", price: 0, currency: "usd" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create({ data: form }, {
      onSuccess: () => {
        toast({ title: "Item Created" });
        setOpen(false);
        refetch();
      }
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Delete this item?")) {
      del({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Store Items</h1>
          <p className="text-muted-foreground">Manage packages available in the shop.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold"><Plus className="w-4 h-4 mr-2"/> Add Item</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Store Item</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Description</Label><Input required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price</Label><Input type="number" required value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} /></div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v=>setForm({...form, currency: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="owo">OWO Coins</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground">Save Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map(item => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-bold">{item.name}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{item.category}</Badge></TableCell>
                <TableCell>{item.price} {item.currency.toUpperCase()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
