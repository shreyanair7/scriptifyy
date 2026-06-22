import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, ScanText, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Scriptify" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function LoginPage() {
  const { user, login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.isGuest ? "/extract" : "/dashboard"} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: typeof errors = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as "email" | "password"] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const exploreDemo = () => {
    loginAsGuest();
    toast.success("Exploring Scriptify demo workspace");
    navigate({ to: "/extract" });
  };

  return (
    <AuthShell>
      <Card className="shadow-elevated border-border/60 bg-card/80 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Scriptify account
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => toast.info("Reach out to support to reset your password")}
                  className="text-xs font-medium text-primary hover:text-accent-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              <span className="text-muted-foreground">Remember me</span>
            </label>

            <Button type="submit" className="w-full shadow-glow" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/30 hover:border-primary/60 hover:bg-primary/10"
            onClick={exploreDemo}
          >
            <Sparkles className="h-4 w-4" />
            Explore Demo Workspace
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:text-accent-foreground transition-colors">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <header className="relative px-6 md:px-10 py-6">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-primary-foreground shadow-glow group-hover:scale-105 transition-transform">
            <ScanText className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Scriptify</span>
        </Link>
      </header>
      <main className="relative flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
      <footer className="relative px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Scriptify. All rights reserved.
      </footer>
    </div>
  );
}
