import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus } from "lucide-react";

export function GuestLocked({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in">
      <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-elevated overflow-hidden">
        <div className="bg-aurora">
          <CardContent className="p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight">{feature} is a member feature</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild className="shadow-glow">
                <Link to="/register">
                  <UserPlus className="h-4 w-4" /> Create free account
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/extract">Continue extracting</Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
