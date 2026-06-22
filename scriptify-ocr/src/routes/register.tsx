import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Eye, EyeOff, Loader2, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AuthShell } from "./login";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Scriptify" }] }),
  component: RegisterPage,
});

const passwordChecks = [
  { id: "len", label: "At least 8 characters", test: (s: string) => s.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (s: string) => /[A-Z]/.test(s) },
  { id: "lower", label: "One lowercase letter", test: (s: string) => /[a-z]/.test(s) },
  { id: "num", label: "One number", test: (s: string) => /\d/.test(s) },
  { id: "special", label: "One special character", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/\d/, "Include a number")
      .regex(/[^A-Za-z0-9]/, "Include a special character"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

function RegisterPage() {
  const { user, register, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.isGuest ? "/extract" : "/dashboard"} replace />;

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const checks = useMemo(
    () => passwordChecks.map((c) => ({ ...c, pass: c.test(form.password) })),
    [form.password],
  );
  const strength = checks.filter((c) => c.pass).length;
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor =
    strength <= 1 ? "bg-destructive" :
    strength === 2 ? "bg-warning" :
    strength === 3 ? "bg-warning" :
    strength === 4 ? "bg-accent-foreground" :
    "bg-success";

  const confirmMatch = form.confirm.length > 0 && form.password === form.confirm;
  const confirmMismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register(parsed.data.fullName, parsed.data.email, parsed.data.password);
      toast.success("Account created — welcome to Scriptify");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start extracting text from any image in seconds
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name" error={errors.fullName}>
              <Input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Jane Cooper"
                autoComplete="name"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-3 space-y-2.5 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-300", strengthColor)}
                        style={{ width: `${(strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {strengthLabel}
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {checks.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full transition-colors",
                            c.pass ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c.pass ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                        </span>
                        <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>
                          {c.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  autoComplete="new-password"
                  className={cn(
                    "pr-10",
                    confirmMatch && "border-success/60 focus-visible:ring-success/40",
                    confirmMismatch && "border-destructive/60 focus-visible:ring-destructive/40",
                  )}
                />
                {form.confirm && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {confirmMatch ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {form.confirm && (
                <p className={cn("text-xs mt-1", confirmMatch ? "text-success" : "text-destructive")}>
                  {confirmMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </Field>

            <Button type="submit" className="w-full shadow-glow" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
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
            Continue as Guest
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-accent-foreground transition-colors">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
