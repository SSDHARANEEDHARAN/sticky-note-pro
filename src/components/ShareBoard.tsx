import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Copy, Check, Link2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface ShareBoardProps {
  userId: string;
}

function generateShareCode(): string {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function ShareBoard({ userId }: ShareBoardProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    const code = generateShareCode();
    const { error } = await supabase.from("board_shares").insert({
      owner_id: userId,
      share_code: code,
    });
    if (error) {
      toast.error("Failed to generate share code");
    } else {
      setShareCode(code);
      toast.success("Share code created!");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (joinCode.length !== 10) {
      toast.error("Please enter a valid 10-digit code");
      return;
    }
    setLoading(true);

    // Find the unclaimed share
    const { data: share, error: findError } = await supabase
      .from("board_shares")
      .select("*")
      .eq("share_code", joinCode)
      .is("guest_id", null)
      .maybeSingle();

    if (findError || !share) {
      toast.error("Invalid or already used share code");
      setLoading(false);
      return;
    }

    if (share.owner_id === userId) {
      toast.error("You can't join your own board!");
      setLoading(false);
      return;
    }

    // Claim the share
    const { error: updateError } = await supabase
      .from("board_shares")
      .update({ guest_id: userId })
      .eq("id", share.id);

    if (updateError) {
      toast.error("Failed to join board");
    } else {
      toast.success("Connected! You can now see their notes.");
      setJoinCode("");
      setShowPanel(false);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-note"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-card rounded-xl shadow-note-hover p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-handwriting text-lg font-bold text-card-foreground">Share Board</h3>
            <button onClick={() => setShowPanel(false)} className="text-muted-foreground hover:text-card-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Generate share code */}
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Generate a 10-digit code to share
            </p>
            {shareCode ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-center text-lg font-mono tracking-widest text-card-foreground">
                  {shareCode}
                </code>
                <button onClick={handleCopy} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                Generate Code
              </button>
            )}
          </div>

          {/* Join with code */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <UserPlus className="w-3 h-3" /> Join someone's board
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter 10-digit code"
                maxLength={10}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50 text-foreground outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider text-center"
              />
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 10}
                className="p-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
