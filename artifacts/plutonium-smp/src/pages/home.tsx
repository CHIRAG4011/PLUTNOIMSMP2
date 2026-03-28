import { useState } from "react";
import { Link } from "wouter";
import { Copy, Check, Users, Sword, Shield, Coins, AlertCircle } from "lucide-react";
import { useGetServerStatus, useGetAnnouncements } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  const [copied, setCopied] = useState(false);
  
  const { data: serverStatus } = useGetServerStatus();
  const { data: announcements } = useGetAnnouncements();

  const handleCopyIP = () => {
    navigator.clipboard.writeText("play.plutoniumsmp.net");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-32 lg:py-48 flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Minecraft Landscape" 
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-8 neon-glow backdrop-blur-md">
              <span className="relative flex h-3 w-3">
                {serverStatus?.online ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                )}
              </span>
              {serverStatus?.online 
                ? `${serverStatus.players} / ${serverStatus.maxPlayers} PLAYERS ONLINE` 
                : "SERVER OFFLINE"}
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 uppercase">
              Die Once. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-300 neon-text-glow">
                Lose Everything.
              </span>
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
              The most brutal Minecraft Lifesteal experience. Steal hearts, build your empire, and dominate the leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
              <button 
                onClick={handleCopyIP}
                className="flex items-center justify-between w-full sm:w-auto flex-1 px-6 py-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Server IP</span>
                  <span className="font-mono text-lg font-bold text-foreground">play.plutoniumsmp.net</span>
                </div>
                <div className="ml-4 p-2 rounded-lg bg-border group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </div>
              </button>
              
              <Link href="/store" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-[74px] px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-hover transition-all">
                  Visit Store
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <section className="py-12 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold font-display">Latest Updates</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {announcements.filter(a => a.isActive).slice(0, 3).map(ann => (
                <div key={ann.id} className="p-5 rounded-2xl border border-border/50 bg-background/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary/10 text-primary uppercase">{ann.type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Why Plutonium?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We've custom coded every aspect of the server to provide an unmatched, lag-free competitive experience.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Sword, title: "Lifesteal Core", desc: "Kill players to steal their hearts. Hit 0 hearts and you're banned until the next season." },
              { icon: Coins, title: "OWO Economy", desc: "Farm, trade, and grind to earn OWO coins. Use them to buy exclusive gear and ranks." },
              { icon: Shield, title: "Custom Enchants", desc: "Over 50+ unique balanced enchants to forge the ultimate god sets." },
              { icon: Users, title: "Active Community", desc: "Join hundreds of other players in massive clan wars and daily events." },
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
