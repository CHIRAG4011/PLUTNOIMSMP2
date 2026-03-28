import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, ShoppingCart, ShieldAlert } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Store", href: "/store" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Tickets", href: "/tickets" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="Plutonium SMP"
              className="w-10 h-10 rounded-xl group-hover:neon-glow transition-all duration-300"
            />
            <span className="font-display font-bold text-2xl tracking-tight hidden sm:block group-hover:neon-text-glow transition-all">
              PLUTONIUM<span className="text-primary">SMP</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-primary ${
                  location === link.href ? "text-primary neon-text-glow" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth/User */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart Button */}
            <Link href="/cart">
              <button className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border hover:border-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none rounded-full ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                      <AvatarImage src={user.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">Dashboard</Link>
                  </DropdownMenuItem>
                  {(user.role === "admin" || user.role === "owner") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer text-primary flex items-center justify-between">
                        Admin Panel
                        <ShieldAlert className="w-4 h-4" />
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-hover">
                    Play Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: cart + menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/cart">
              <button className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border">
                <ShoppingCart className="w-4 h-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary transition-colors p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl absolute w-full">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-xl text-base font-medium ${
                  location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border/50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center px-3 gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-muted-foreground hover:bg-card">Dashboard</Link>
                  {(user.role === "admin" || user.role === "owner") && (
                    <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-primary hover:bg-primary/10">Admin Panel</Link>
                  )}
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10">Logout</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 px-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
