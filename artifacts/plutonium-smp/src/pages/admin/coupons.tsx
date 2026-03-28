import { useState } from "react";
import { useAdminGetCoupons, useAdminCreateCoupon } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminCoupons() {
  const { data, refetch } = useAdminGetCoupons();
  const { mutate } = useAdminCreateCoupon();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: 10 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Create Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
            <form onSubmit={e => {
              e.preventDefault();
              mutate({ data: form }, { onSuccess: () => { setOpen(false); refetch(); } });
            }} className="space-y-4">
              <Input placeholder="CODE (e.g. SUMMER25)" value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} />
              <Input type="number" placeholder="Discount %" value={form.discountPercent} onChange={e=>setForm({...form, discountPercent: Number(e.target.value)})} />
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Uses</TableHead></TableRow></TableHeader>
        <TableBody>
          {data?.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
              <TableCell>{c.discountPercent}%</TableCell>
              <TableCell>{c.usageCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
