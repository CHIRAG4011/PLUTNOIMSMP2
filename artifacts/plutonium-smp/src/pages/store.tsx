import { useState, useEffect } from "react";
import { useGetStoreItems } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Check, DollarSign, Search, Star, Package, Sword, Key, Sparkles, Zap, Box, Leaf, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "all",         label: "All Items",   icon: Package },
  { value: "ranks",       label: "Ranks",       icon: Sword },
  { value: "crate_keys",  label: "Crate Keys",  icon: Key },
  { value: "cosmetics",   label: "Cosmetics",   icon: Sparkles },
  { value: "coins",       label: "Coins",       icon: DollarSign },
  { value: "boosts",      label: "Boosts",      icon: Zap },
  { value: "bundles",     label: "Bundles",     icon: Box },
  { value: "seasonal",    label: "Seasonal",    icon: Leaf },
  { value: "permissions", label: "Permissions", icon: Shield },
];

export default function Store() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const { count } = useCart();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: any = {};
  if (category !== "all") params.category = category;
  if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

  const { data: items, isLoading } = useGetStoreItems(
    Object.keys(params).length ? params : undefined
  );

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login required", description: "Please log in to add items to your cart.", variant: "destructive" });
      return;
    }
    addItem(item);
    toast({ title: "Added to cart!", description: `${item.name} has been added to your cart.` });
  };

  return (
    <div className="min-h-screen pb-24">
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
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            Support the server and get exclusive perks. Purchases help keep the server running lag-free!
          </p>
          {count > 0 && (
            <Link href="/cart">
              <Button className="bg-primary text-primary-foreground neon-glow-hover font-bold gap-2">
                <ShoppingCart className="w-4 h-4" />
                View Cart ({count})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col gap-6 mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    category === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : items?.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xl font-medium mb-2">No items found</p>
            <p className="text-muted-foreground">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items?.map((item, i) => (
              <Link key={item.id} href={`/store/${item.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex flex-col bg-card rounded-2xl border border-border hover:border-primary/60 overflow-hidden group transition-all cursor-pointer h-full"
                >
                  {item.isFeatured && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                      FEATURED
                    </div>
                  )}

                  <div className="h-48 bg-background relative flex items-center justify-center p-6 border-b border-border overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="max-h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-border/50 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs shrink-0 text-primary border-primary/40">
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">{item.description}</p>

                    {item.features && item.features.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {item.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start text-xs text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                        {item.features.length > 3 && (
                          <li className="text-xs text-muted-foreground ml-5">+{item.features.length - 3} more...</li>
                        )}
                      </ul>
                    )}

                    <div className="pt-4 border-t border-border mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 font-bold text-xl">
                        {item.currency === "usd" ? (
                          <>
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span>{(item.price / 100).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-yellow-400">{item.price} OWO</span>
                        )}
                      </div>
                      <Button
                        onClick={(e) => handleAddToCart(item, e)}
                        size="sm"
                        className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
