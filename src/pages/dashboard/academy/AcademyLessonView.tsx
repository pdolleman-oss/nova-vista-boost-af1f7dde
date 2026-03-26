import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckSquare, Square, Lightbulb } from "lucide-react";
import { Module, Lesson } from "./academyData";

interface Props {
  module: Module;
  lesson: Lesson;
  activeModule: number;
  activeLesson: number;
  progress: Record<string, boolean>;
  onBack: () => void;
  onToggle: (key: string, checked: boolean) => void;
}

const AcademyLessonView = ({ module, lesson, activeModule, activeLesson, progress, onBack, onToggle }: Props) => (
  <div className="space-y-6 max-w-3xl">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div>
        <p className="text-sm text-muted-foreground">{module.title}</p>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>
    </div>
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground leading-relaxed">{lesson.content}</p>
      </CardContent>
    </Card>
    {lesson.demoCase && (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Praktijkvoorbeeld
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{lesson.demoCase}</p>
        </CardContent>
      </Card>
    )}
    {lesson.checklist && lesson.checklist.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lesson.checklist.map((item, ci) => {
            const key = `${activeModule}-${activeLesson}-${ci}`;
            const checked = progress[key] || false;
            return (
              <button
                key={ci}
                onClick={() => onToggle(key, !checked)}
                className="flex items-start gap-3 w-full text-left hover:bg-secondary/30 p-2 rounded-lg transition-colors"
              >
                {checked ? (
                  <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className={checked ? "line-through text-muted-foreground" : ""}>{item}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>
    )}
  </div>
);

export default AcademyLessonView;
