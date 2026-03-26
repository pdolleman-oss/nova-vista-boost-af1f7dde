import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: string;
  link: string | null;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);
  };

  useEffect(() => { load(); }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between pr-4">
            <SheetTitle>Notificaties</SheetTitle>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
                Alles gelezen
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Geen notificaties</p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  n.read ? "bg-secondary/30" : "bg-primary/5 border border-primary/20"
                } hover:bg-secondary/50`}
                onClick={() => markRead(n.id)}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
