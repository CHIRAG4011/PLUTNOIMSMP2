import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="Plutonium SMP" 
                className="w-8 h-8 rounded-lg grayscale group-hover:grayscale-0 transition-all"
              />
              <span className="font-display font-bold text-xl tracking-tight">
                PLUTONIUM<span className="text-primary">SMP</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              The ultimate hardcore Minecraft Lifesteal experience. Die once, lose everything. Battle for survival, dominate the economy, and rise to the top.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-6">
              Not affiliated with Mojang AB.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 font-display">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/store" className="hover:text-primary transition-colors">Store</Link></li>
              <li><Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><Link href="/tickets" className="hover:text-primary transition-colors">Support Tickets</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 font-display">Connect</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://discord.gg/placeholder" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Discord Server</a></li>
              <li><a href="https://twitter.com/placeholder" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Twitter / X</a></li>
              <li><a href="https://youtube.com/placeholder" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Plutonium SMP. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
