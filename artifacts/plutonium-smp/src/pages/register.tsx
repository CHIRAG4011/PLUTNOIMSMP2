import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister, useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, CheckCircle } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  email: z.string().email("Invalid email address"),
  minecraftUsername: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const [otpStep, setOtpStep] = useState<"email" | "verify" | "done">("email");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const { mutate: sendOtp, isPending: sendingOtp } = useSendOtp();
  const { mutate: verifyOtp, isPending: verifyingOtp } = useVerifyOtp();
  const { mutate: registerMutation, isPending } = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", minecraftUsername: "", password: "", confirmPassword: "" }
  });

  const handleSendOtp = () => {
    if (!emailInput || !emailInput.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    sendOtp({ data: { email: emailInput, purpose: "registration" } }, {
      onSuccess: () => {
        toast({ title: "Code sent!", description: `A verification code was sent to ${emailInput}` });
        setVerifiedEmail(emailInput);
        setOtpStep("verify");
        form.setValue("email", emailInput);
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.message || "Could not send OTP.", variant: "destructive" });
      }
    });
  };

  const handleVerifyOtp = () => {
    verifyOtp({ data: { email: verifiedEmail, code: otpCode, purpose: "registration" } }, {
      onSuccess: () => {
        toast({ title: "Email verified!", description: "Now complete your profile." });
        setVerifiedOtp(otpCode);
        setOtpStep("done");
      },
      onError: (err: any) => {
        toast({ title: "Invalid code", description: err?.message || "Wrong or expired code.", variant: "destructive" });
      }
    });
  };

  const onSubmit = (data: RegisterForm) => {
    registerMutation({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        minecraftUsername: data.minecraftUsername || undefined,
        otpCode: verifiedOtp,
      }
    }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        toast({ title: "Account created!", description: "Welcome to Plutonium SMP." });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err?.message || "Something went wrong.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join the ultimate lifesteal server</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {/* Discord Signup */}
          <a href="/api/auth/discord">
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 gap-2 border-[#5865F2]/50 hover:border-[#5865F2] hover:bg-[#5865F2]/10 text-[#5865F2]"
            >
              <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Sign up with Discord
            </Button>
          </a>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or register with email</span>
            </div>
          </div>

          {/* Step 1: Enter email + send OTP */}
          {otpStep === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-input">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="steve@minecraft.net"
                    className="bg-background flex-1"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="bg-primary text-primary-foreground shrink-0"
                  >
                    {sendingOtp ? "..." : <Mail className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">We'll send a verification code to confirm your email.</p>
              </div>
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full bg-primary text-primary-foreground"
              >
                {sendingOtp ? "Sending code..." : "Send Verification Code"}
              </Button>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {otpStep === "verify" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm text-center">
                <Mail className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-primary font-medium">Code sent to {verifiedEmail}</p>
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
                />
              </div>
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full bg-primary text-primary-foreground"
              >
                {verifyingOtp ? "Verifying..." : "Verify Email"}
              </Button>
              <button
                type="button"
                onClick={() => { setOtpStep("email"); setOtpCode(""); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change email
              </button>
            </div>
          )}

          {/* Step 3: Full registration form */}
          {otpStep === "done" && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-green-500 font-medium">{verifiedEmail} verified</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="CoolPlayer123" className="bg-background" {...form.register("username")} />
                {form.formState.errors.username && <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minecraftUsername">Minecraft Username (Optional)</Label>
                <Input id="minecraftUsername" placeholder="Notch" className="bg-background" {...form.register("minecraftUsername")} />
                <p className="text-xs text-muted-foreground">Link your MC account for in-game syncing</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="bg-background" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" className="bg-background" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && <p className="text-destructive text-sm">{form.formState.errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 text-lg mt-6 neon-glow-hover"
                disabled={isPending}
              >
                {isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
