import { useState } from "react";
import { useGetStoreItems, usePurchaseItem } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Check, Coins, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Store() {
  const [category, setCategory] = useState<string>("all");
  const { data: items, isLoading } = useGetStoreItems(category !== "all" ? { category } : undefined);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { mutate: purchase, isPending } = usePurchaseItem();
  
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handlePurchase = () => {
    if (!selectedItem) return;
    
    purchase({ data: { itemId: selectedItem.id } }, {
      onSuccess: () => {
        toast({ title: "Purchase successful!", description: `You bought ${selectedItem.name}.` });
        setSelectedItem(null);
      },
      onError: (err: any) => {
        toast({ 
          title: "Purchase failed", 
          description: err?.message || "Not enough balance or an error occurred.", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Store Header */}
      <div className="relative py-20 border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/store-bg.png`} 
            alt="Store Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight">
            Server <span className="text-primary">Store</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Support the server and get exclusive perks. Purchases help keep the server running lag-free!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Tabs value={category} onValueChange={setCategory} className="w-full mb-12">
          <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border flex-wrap">
            <TabsTrigger value="all" className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Items</TabsTrigger>
            <TabsTrigger value="ranks" className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ranks</TabsTrigger>
            <TabsTrigger value="crate_keys" className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Crate Keys</TabsTrigger>
            <TabsTrigger value="coins" className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">OWO Coins</TabsTrigger>
            <TabsTrigger value="cosmetics" className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Cosmetics</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items?.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={item.id} 
                className="relative flex flex-col bg-card rounded-2xl border border-border hover:border-primary/50 overflow-hidden group transition-all"
              >
                {item.isFeatured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                    FEATURED
                  </div>
                )}
                
                <div className="h-48 bg-background relative flex items-center justify-center p-6 border-b border-border">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="max-h-full object-contain drop-shadow-xl" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-border/50 flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  {item.badge && (
                    <Badge variant="outline" className="w-fit mb-3 text-primary border-primary/30">
                      {item.badge}
                    </Badge>
                  )}
                  
                  <h3 className="font-bold text-xl mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">{item.description}</p>
                  
                  {item.features && item.features.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {item.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start text-xs text-muted-foreground">
                          <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xl">
                      {item.currency === "owo" ? <Coins className="w-5 h-5 text-primary" /> : <DollarSign className="w-5 h-5 text-green-500" />}
                      <span>{item.price.toLocaleString()}</span>
                    </div>
                    <Button 
                      onClick={() => setSelectedItem(item)}
                      className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase <strong className="text-foreground">{selectedItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex justify-between items-center p-4 rounded-xl border border-border bg-background/50 mb-4">
              <span className="text-muted-foreground">Price</span>
              <div className="flex items-center gap-2 font-bold text-xl">
                {selectedItem?.currency === "owo" ? <Coins className="w-5 h-5 text-primary" /> : <DollarSign className="w-5 h-5 text-green-500" />}
                {selectedItem?.price.toLocaleString()} {selectedItem?.currency.toUpperCase()}
              </div>
            </div>

            {selectedItem?.currency === "owo" && user && (
              <div className="flex justify-between items-center p-4 rounded-xl border border-border bg-background/50">
                <span className="text-muted-foreground">Your Balance</span>
                <div className={`flex items-center gap-2 font-bold ${user.owoBalance >= selectedItem.price ? "text-primary" : "text-destructive"}`}>
                  <Coins className="w-5 h-5" />
                  {user.owoBalance.toLocaleString()} OWO
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                You must be logged in to make a purchase.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)} disabled={isPending}>Cancel</Button>
            <Button 
              onClick={handlePurchase} 
              disabled={isPending || !user || (selectedItem?.currency === "owo" && user.owoBalance < selectedItem.price)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
