import { useState } from "react";
import { useAdminAdjustCurrency } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminCurrency() {
  const { mutate, isPending } = useAdminAdjustCurrency();
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: { userId, amount: Number(amount) } }, {
      onSuccess: () => {
        toast({ title: "Currency updated successfully." });
        setUserId("");
        setAmount("");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-3xl font-bold">Currency Adjustment</h1>
      <Card className="bg-card">
        <CardHeader><CardTitle>Give / Take OWO Coins</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">User ID</label>
              <Input required value={userId} onChange={e=>setUserId(e.target.value)} placeholder="UUID string" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount (Use negative to take)</label>
              <Input type="number" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="5000" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">Confirm Adjustment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
