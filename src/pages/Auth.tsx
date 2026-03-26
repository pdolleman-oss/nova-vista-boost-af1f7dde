import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

type View = "login" | "register" | "forgot";

const Auth = () => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Wachtwoord reset link verzonden! Check je e-mail.");
        setView("login");
      } else if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welkom terug!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account aangemaakt! Controleer je e-mail om te bevestigen.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<View, string> = {
    login: "Inloggen",
    register: "Account aanmaken",
    forgot: "Wachtwoord vergeten",
  };

  const descriptions: Record<View, string> = {
    login: "Log in op je Nova Vista Boost account",
    register: "Maak een gratis account aan",
    forgot: "Voer je e-mailadres in om je wachtwoord te resetten",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-foreground">{titles[view]}</CardTitle>
          <CardDescription>{descriptions[view]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {view !== "forgot" && (
              <Input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Laden..." : view === "forgot" ? "Reset link versturen" : view === "login" ? "Inloggen" : "Registreren"}
            </Button>
          </form>

          {view === "login" && (
            <button
              onClick={() => setView("forgot")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-primary mt-3"
            >
              Wachtwoord vergeten?
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            {view === "forgot" ? (
              <button onClick={() => setView("login")} className="text-primary hover:underline">
                Terug naar inloggen
              </button>
            ) : view === "login" ? (
              <>
                Nog geen account?{" "}
                <button onClick={() => setView("register")} className="text-primary hover:underline">
                  Registreer hier
                </button>
              </>
            ) : (
              <>
                Al een account?{" "}
                <button onClick={() => setView("login")} className="text-primary hover:underline">
                  Log hier in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
