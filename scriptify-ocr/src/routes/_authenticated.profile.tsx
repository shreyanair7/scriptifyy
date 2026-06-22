import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { format } from "date-fns";
import { LogOut, Lock, Pencil } from "lucide-react";
import { GuestLocked } from "@/components/app/GuestLocked";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Scriptify" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refresh, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  if (!user) return null;
  if (isGuest) {
    return (
      <GuestLocked
        feature="Profile & account settings"
        description="Guest sessions don't have a profile. Create a free account to manage your details, password, and saved extractions."
      />
    );
  }
  const initials = user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account information.</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold truncate">{user.fullName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <InfoRow label="Full name" value={user.fullName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Account created" value={format(new Date(user.createdAt), "PPP")} />
            <InfoRow label="User ID" value={user.id.slice(0, 8) + "…"} mono />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit profile
            </Button>
            <Button variant="secondary" onClick={() => setPwdOpen(true)}>
              <Lock className="h-4 w-4 mr-2" /> Change password
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaults={{ fullName: user.fullName, email: user.email }}
        onSaved={refresh}
      />
      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className={"mt-1 text-sm truncate " + (mono ? "font-mono" : "font-medium")}>{value}</p>
    </div>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  defaults,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaults: { fullName: string; email: string };
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(defaults.fullName);
  const [email, setEmail] = useState(defaults.email);

  const save = () => {
    try {
      authService.updateProfile({ fullName: fullName.trim(), email: email.trim() });
      onSaved();
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = () => {
    if (
      next.length < 8 ||
      !/[A-Z]/.test(next) ||
      !/[a-z]/.test(next) ||
      !/\d/.test(next) ||
      !/[^A-Za-z0-9]/.test(next)
    ) {
      toast.error("Password must be 8+ chars with upper, lower, number & special character");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      authService.changePassword(current, next);
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Update password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
