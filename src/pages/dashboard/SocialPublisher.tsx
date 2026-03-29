import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook, Link2, Send, Save, Loader2, CheckCircle2, XCircle, Clock,
  ArrowLeft, Plus, RefreshCw,
} from "lucide-react";
import { socialApi, type SocialPost, type SocialConnection } from "@/services/socialApi";
import { toast } from "sonner";

type View = "list" | "create" | "detail";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  draft: { label: "Concept", icon: Clock, className: "text-muted-foreground" },
  approved: { label: "Goedgekeurd", icon: CheckCircle2, className: "text-primary" },
  published: { label: "Gepubliceerd", icon: CheckCircle2, className: "text-green-500" },
  failed: { label: "Mislukt", icon: XCircle, className: "text-destructive" },
};

const SocialPublisher = () => {
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Create form
  const [postText, setPostText] = useState("");
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Connect form
  const [fbToken, setFbToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [postsRes, connRes] = await Promise.all([
      socialApi.listPosts(),
      socialApi.getConnectionStatus(),
    ]);
    if (postsRes.success) setPosts(postsRes.data);
    if (connRes.success) setConnections(connRes.data);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!fbToken.trim()) return;
    setConnecting(true);
    try {
      const res = await socialApi.connectFacebook(fbToken.trim());
      if (res.success) {
        toast.success(`Facebook Page "${res.data.page_name}" gekoppeld!`);
        setFbToken("");
        loadData();
      } else {
        toast.error(res.error || "Koppeling mislukt");
      }
    } catch {
      toast.error("Verbindingsfout");
    }
    setConnecting(false);
  };

  const handleSave = async () => {
    if (!postText.trim()) return;
    setSaving(true);
    try {
      const res = await socialApi.createPost({
        post_text: postText,
        title: title || undefined,
        media_url: mediaUrl || undefined,
      });
      if (res.success) {
        toast.success("Post opgeslagen als concept");
        setPostText("");
        setTitle("");
        setMediaUrl("");
        setView("list");
        loadData();
      } else {
        toast.error(res.error || "Opslaan mislukt");
      }
    } catch {
      toast.error("Fout bij opslaan");
    }
    setSaving(false);
  };

  const handlePublish = async (postId: string) => {
    if (connections.length === 0) {
      toast.error("Koppel eerst je Facebook Page");
      return;
    }
    setPublishing(true);
    try {
      const res = await socialApi.publishPost(postId);
      if (res.success) {
        toast.success("Post gepubliceerd op Facebook!");
        loadData();
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, status: "published", external_post_id: res.data.external_post_id });
        }
      } else {
        toast.error(res.error || "Publiceren mislukt");
      }
    } catch {
      toast.error("Publicatiefout");
    }
    setPublishing(false);
  };

  const openDetail = (post: SocialPost) => {
    setSelectedPost(post);
    setView("detail");
  };

  const fbConnected = connections.some(c => c.channel === "facebook");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Detail View ──
  if (view === "detail" && selectedPost) {
    const cfg = statusConfig[selectedPost.status] || statusConfig.draft;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedPost(null); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedPost.title || "Social Post"}</h1>
            <div className={`flex items-center gap-1 text-sm ${cfg.className}`}>
              <cfg.icon className="w-4 h-4" /> {cfg.label}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Facebook Post</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{selectedPost.post_text}</p>
              {selectedPost.media_url && (
                <div className="text-xs text-muted-foreground truncate">🔗 {selectedPost.media_url}</div>
              )}
            </div>

            {selectedPost.error_message && (
              <div className="mt-3 p-3 rounded bg-destructive/10 text-destructive text-sm">
                Fout: {selectedPost.error_message}
              </div>
            )}

            {selectedPost.external_post_id && (
              <div className="mt-3 text-sm text-muted-foreground">
                Facebook Post ID: <code className="text-xs">{selectedPost.external_post_id}</code>
              </div>
            )}
          </CardContent>
        </Card>

        {(selectedPost.status === "draft" || selectedPost.status === "failed") && (
          <div className="flex gap-3">
            <Button
              onClick={() => handlePublish(selectedPost.id)}
              disabled={publishing || !fbConnected}
              className="gap-2"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publiceren naar Facebook
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Create View ──
  if (view === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nieuwe Social Post</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Titel (optioneel)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Schrijf je Facebook post..."
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
            <Input
              placeholder="Media URL (optioneel, bijv. link naar afbeelding)"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        {postText.trim() && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Facebook Post</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{postText}</p>
                {mediaUrl && (
                  <div className="text-xs text-muted-foreground truncate">🔗 {mediaUrl}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving || !postText.trim()} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Opslaan als concept
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!postText.trim()) return;
              setSaving(true);
              const res = await socialApi.createPost({
                post_text: postText,
                title: title || undefined,
                media_url: mediaUrl || undefined,
              });
              if (res.success) {
                await handlePublish(res.data.id);
                loadData();
                setView("list");
                setPostText("");
                setTitle("");
                setMediaUrl("");
              }
              setSaving(false);
            }}
            disabled={saving || publishing || !postText.trim() || !fbConnected}
            className="gap-2"
          >
            <Send className="w-4 h-4" /> Direct publiceren
          </Button>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Publisher</h1>
          <p className="text-muted-foreground mt-1">Beheer en publiceer social media posts</p>
        </div>
        <Button onClick={() => setView("create")} className="gap-2">
          <Plus className="w-4 h-4" /> Nieuwe post
        </Button>
      </div>

      {/* Facebook Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Facebook className="w-5 h-5 text-blue-500" /> Facebook Koppeling
          </CardTitle>
          <CardDescription>
            {fbConnected
              ? `Gekoppeld met: ${connections.find(c => c.channel === "facebook")?.page_name}`
              : "Koppel je Facebook Page om posts te publiceren"}
          </CardDescription>
        </CardHeader>
        {!fbConnected && (
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Genereer een User Access Token via de{" "}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Meta Graph API Explorer
              </a>{" "}
              met de permissions <code className="text-xs">pages_manage_posts</code> en <code className="text-xs">pages_read_engagement</code>.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Plak je Facebook User Access Token"
                value={fbToken}
                onChange={e => setFbToken(e.target.value)}
                type="password"
              />
              <Button onClick={handleConnect} disabled={connecting || !fbToken.trim()} className="gap-2 shrink-0">
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Koppelen
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Posts list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Posts</h2>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1">
            <RefreshCw className="w-4 h-4" /> Vernieuwen
          </Button>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nog geen posts. Maak je eerste social post aan!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {posts.map(post => {
              const cfg = statusConfig[post.status] || statusConfig.draft;
              return (
                <Card
                  key={post.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => openDetail(post)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium truncate">{post.title || post.post_text.slice(0, 60)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{post.post_text.slice(0, 100)}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm shrink-0 ml-3 ${cfg.className}`}>
                      <cfg.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPublisher;
