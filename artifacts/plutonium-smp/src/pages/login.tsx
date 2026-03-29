import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const error = params.get("error");
    if (token) {
      setAuthToken(token);
      toast({ title: "Welcome!", description: "Logged in with Discord." });
      setLocation("/dashboard");
    }
    if (error) {
      const messages: Record<string, string> = {
        discord_not_configured: "Discord login is not configured.",
        discord_cancelled: "Discord login was cancelled.",
        discord_error: "Discord login failed. Please try again.",
      };
      toast({
        title: "Discord Login Failed",
        description: messages[error] || "An error occurred.",
        variant: "destructive",
      });
    }
  }, [search]);

  const onSubmitCredentials = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Login Failed",
          description: json.error || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }
      if (json.requiresOtp) {
        setPendingEmail(data.email);
        setStep("otp");
        toast({ title: "Code sent!", description: `A verification code was sent to ${data.email}` });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otpCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Invalid code",
          description: json.error || "Wrong or expired code.",
          variant: "destructive",
        });
        return;
      }
      setAuthToken(json.token);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      setLocation("/dashboard");
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDiscordLogin = () => {
    window.location.href = "/api/auth/discord";
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Login to your Plutonium account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {step === "credentials" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscordLogin}
                className="w-full mb-4 gap-2 border-[#5865F2]/50 hover:border-[#5865F2] hover:bg-[#5865F2]/10 text-[#5865F2]"
              >
                <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                Continue with Discord
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(onSubmitCredentials)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="steve@minecraft.net"
                    className="bg-background"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-background"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 text-lg mt-4 neon-glow-hover"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending code..." : "Login"}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm text-center">
                <Mail className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-primary font-medium">Code sent to {pendingEmail}</p>
                <p className="text-muted-foreground text-xs mt-0.5">Enter the 6-digit code from your inbox</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="bg-background text-center text-2xl tracking-widest font-bold h-12"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full bg-primary text-primary-foreground font-bold h-12 text-lg neon-glow-hover"
              >
                {isVerifying ? "Verifying..." : "Verify & Login"}
              </Button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtpCode(""); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
