import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { StickyNote as StickyNoteIcon, Loader2, ArrowLeft, Mail, Chrome } from "lucide-react";
import { toast } from "sonner";

type View = "login" | "signup" | "forgot" | "magic";

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
    } else if (view === "magic") {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) toast.error(error.message);
      else toast.success("Check your email for a magic link!");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  const handleAppleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Apple sign-in failed");
  };

  const titles: Record<View, string> = {
    login: "Welcome Back!", signup: "Join Sticky Notes", forgot: "Reset Password",
    magic: "Magic Link",
  };
  const buttons: Record<View, string> = {
    login: "Sign In", signup: "Sign Up", forgot: "Send Reset Link",
    magic: "Send Magic Link",
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

            {(view === "login" || view === "signup" || view === "forgot" || view === "magic") && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
              </div>
            )}

            {(view === "login" || view === "signup") && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
              </div>
            )}

            {view === "phone" && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="+1234567890" />
              </div>
            )}

            {view === "otp-verify" && (
              <div>
                <label className="block text-sm font-medium text-card-foreground/70 mb-1">OTP Code</label>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required maxLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring font-mono text-center tracking-[0.5em] text-xl" placeholder="000000" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {buttons[view]}
            </button>
          </form>

          {/* Social login buttons */}
          {isMainView && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-card-foreground/20" />
                <span className="text-xs text-card-foreground/50 uppercase">or continue with</span>
                <div className="flex-1 h-px bg-card-foreground/20" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background/50 text-foreground hover:bg-background/80 transition-colors font-medium text-sm">
                  <Chrome className="w-4 h-4" /> Google
                </button>
                <button onClick={handleAppleSignIn}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-foreground text-background hover:opacity-90 transition-opacity font-medium text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setView("magic")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background/50 text-foreground hover:bg-background/80 transition-colors font-medium text-sm">
                  <Mail className="w-4 h-4" /> Magic Link
                </button>
                <button onClick={() => setView("phone")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background/50 text-foreground hover:bg-background/80 transition-colors font-medium text-sm">
                  <Phone className="w-4 h-4" /> Phone
                </button>
              </div>
            </div>
          )}

          {/* Forgot password */}
          {view === "login" && (
            <button onClick={() => setView("forgot")} className="w-full text-center text-sm text-card-foreground/50 mt-3 hover:text-card-foreground/70 transition-colors">
              Forgot password?
            </button>
          )}

          {/* Navigation links */}
          {!isMainView ? (
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
