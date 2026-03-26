import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { modules } from "./academy/academyData";
import AcademyLessonView from "./academy/AcademyLessonView";
import AcademyModuleView from "./academy/AcademyModuleView";

const Academy = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasAccess(false); return; }
      setUserId(user.id);

      // Check access
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const userRoles = (roles || []).map(r => r.role);
      setHasAccess(userRoles.includes("admin") || userRoles.includes("client_owner") || userRoles.length === 0);

      // Load progress from database
      const { data: progressRows } = await supabase
        .from("academy_progress")
        .select("item_key, completed")
        .eq("user_id", user.id);

      if (progressRows && progressRows.length > 0) {
        const loaded: Record<string, boolean> = {};
        progressRows.forEach(r => { loaded[r.item_key] = r.completed; });
        setProgress(loaded);
      }
    };
    init();
  }, []);

  const saveProgress = useCallback(async (key: string, checked: boolean) => {
    setProgress(prev => ({ ...prev, [key]: checked }));

    if (!userId) return;

    if (checked) {
      await supabase.from("academy_progress").upsert(
        { user_id: userId, item_key: key, completed: true },
        { onConflict: "user_id,item_key" }
      );
    } else {
      await supabase.from("academy_progress")
        .delete()
        .eq("user_id", userId)
        .eq("item_key", key);
    }
  }, [userId]);

  const getModuleProgress = (moduleIdx: number) => {
    const mod = modules[moduleIdx];
    let total = 0, done = 0;
    mod.lessons.forEach((lesson, li) => {
      (lesson.checklist || []).forEach((_, ci) => {
        total++;
        if (progress[`${moduleIdx}-${li}-${ci}`]) done++;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules.map((m, i) => ({ ...m, origIdx: i }));
    const q = search.toLowerCase();
    return modules
      .map((m, i) => ({ ...m, origIdx: i }))
      .filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.lessons.some(l => l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q))
      );
  }, [search]);

  if (hasAccess === null) return null;
  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">Je hebt geen toegang tot de Academy. Neem contact op met je organisatie-eigenaar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeModule !== null && activeLesson !== null) {
    return (
      <AcademyLessonView
        module={modules[activeModule]}
        lesson={modules[activeModule].lessons[activeLesson]}
        activeModule={activeModule}
        activeLesson={activeLesson}
        progress={progress}
        onBack={() => setActiveLesson(null)}
        onToggle={saveProgress}
      />
    );
  }

  if (activeModule !== null) {
    return (
      <AcademyModuleView
        module={modules[activeModule]}
        moduleIdx={activeModule}
        progress={progress}
        onBack={() => setActiveModule(null)}
        onSelectLesson={setActiveLesson}
        getModuleProgress={getModuleProgress}
      />
    );
  }

  const totalProgress = modules.reduce((sum, _, i) => sum + getModuleProgress(i), 0);
  const avgProgress = Math.round(totalProgress / modules.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academy</h1>
        <p className="text-muted-foreground mt-1">
          8 modules • 31 SOP's • Totale voortgang: {avgProgress}%
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek in modules en lessen..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const prog = getModuleProgress(mod.origIdx);
          return (
            <Card key={mod.origIdx} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveModule(mod.origIdx)}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{prog}%</span>
                </div>
                <CardTitle className="text-lg">{mod.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{mod.lessons.length} SOP's</span>
                  </div>
                  <div className="w-20 h-1.5 bg-secondary rounded-full">
                    <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${prog}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Academy;
