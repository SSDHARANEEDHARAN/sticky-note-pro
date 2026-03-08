import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote as StickyNoteIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type View = "login" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (view === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for a password reset link!");
    } else if (view === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/");
    } else if (view === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  const titles: Record<View, string> = {
    login: "Welcome Back!", signup: "Join Sticky Notes", forgot: "Reset Password",
  };
  const buttons: Record<View, string> = {
    login: "Sign In", signup: "Sign Up", forgot: "Send Reset Link",
  };

  const isMainView = view === "login" || view === "signup";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-note-yellow shadow-note p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-destructive shadow-md z-10" />

          <div className="flex items-center gap-3 mb-6 justify-center">
            <StickyNoteIcon className="w-8 h-8 text-card-foreground" />
            <h1 className="text-3xl font-handwriting font-bold text-card-foreground">{titles[view]}</h1>
          </div>

          {view === "forgot" && (
            <p className="text-sm text-card-foreground/60 text-center mb-4">Enter your email and we'll send you a reset link.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-card-foreground/70 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
            </div>

            {(view === "login" || view === "signup") && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {buttons[view]}
            </button>
          </form>

          {/* Forgot password */}
          {view === "login" && (
            <button onClick={() => setView("forgot")} className="w-full text-center text-sm text-card-foreground/50 mt-3 hover:text-card-foreground/70 transition-colors">
              Forgot password?
            </button>
          )}

          {/* Navigation links */}
          {view === "forgot" ? (
            <button onClick={() => setView("login")} className="flex items-center gap-1 justify-center w-full text-sm text-card-foreground/60 mt-4 hover:text-card-foreground/80">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </button>
          ) : (
            <p className="text-center text-sm text-card-foreground/60 mt-4">
              {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setView(view === "login" ? "signup" : "login")} className="text-primary font-medium underline hover:opacity-80">
                {view === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
