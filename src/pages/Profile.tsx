import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, Loader2, User, Save } from "lucide-react";
import { toast } from "sonner";

interface ProfileProps {
  session: Session;
}

export default function Profile({ session }: ProfileProps) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else {
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [session.user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-note-yellow shadow-note p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-destructive shadow-md z-10" />

          <div className="flex items-center gap-3 mb-6 justify-center">
            <User className="w-8 h-8 text-card-foreground" />
            <h1 className="text-3xl font-handwriting font-bold text-card-foreground">Your Profile</h1>
          </div>

          <div className="mb-4 text-sm text-card-foreground/60 text-center">
            {session.user.email || session.user.phone || "Signed in"}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground/70 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 justify-center w-full text-sm text-card-foreground/60 mt-4 hover:text-card-foreground/80 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Board
          </button>
        </div>
      </div>
    </div>
  );
}
