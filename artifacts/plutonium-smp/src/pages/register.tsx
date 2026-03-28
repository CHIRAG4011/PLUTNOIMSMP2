import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

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
  
  const { mutate: registerMutation, isPending } = useRegister();
  
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", minecraftUsername: "", password: "", confirmPassword: "" }
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation({ 
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        minecraftUsername: data.minecraftUsername || undefined
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="CoolPlayer123" className="bg-background" {...form.register("username")} />
              {form.formState.errors.username && <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="steve@minecraft.net" className="bg-background" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>}
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
              {isPending ? "Creating account..." : "Register"}
            </Button>
          </form>
          
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
