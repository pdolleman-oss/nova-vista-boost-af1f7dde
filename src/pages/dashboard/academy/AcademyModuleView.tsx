import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Module } from "./academyData";

interface Props {
  module: Module;
  moduleIdx: number;
  progress: Record<string, boolean>;
  onBack: () => void;
  onSelectLesson: (li: number) => void;
  getModuleProgress: (idx: number) => number;
}

const AcademyModuleView = ({ module, moduleIdx, progress, onBack, onSelectLesson, getModuleProgress }: Props) => {
  const Icon = module.icon;
  const prog = getModuleProgress(moduleIdx);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{module.title}</h1>
            <p className="text-sm text-muted-foreground">{module.desc}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{module.lessons.length} SOP's</span>
        <span>•</span>
        <span>{prog}% voltooid</span>
        <div className="flex-1 h-2 bg-secondary rounded-full max-w-[200px]">
          <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${prog}%` }} />
        </div>
      </div>
      <div className="grid gap-3">
        {module.lessons.map((lesson, li) => {
          const lessonChecks = (lesson.checklist || []).length;
          const lessonDone = (lesson.checklist || []).filter((_, ci) => progress[`${moduleIdx}-${li}-${ci}`]).length;
          return (
            <Card
              key={li}
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => onSelectLesson(li)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    {li + 1}
                  </div>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    {lessonChecks > 0 && (
                      <p className="text-xs text-muted-foreground">{lessonDone}/{lessonChecks} items afgevinkt</p>
                    )}
                  </div>
                </div>
                <PlayCircle className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AcademyModuleView;
