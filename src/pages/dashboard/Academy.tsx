import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, PlayCircle } from "lucide-react";

const courses = [
  { title: "Marketing Fundamentals", lessons: 8, desc: "Leer de basis van digitale marketing." },
  { title: "SEO Masterclass", lessons: 12, desc: "Alles over zoekmachineoptimalisatie." },
  { title: "Social Media Strategie", lessons: 6, desc: "Bouw een effectieve social media strategie." },
  { title: "E-mail Marketing", lessons: 5, desc: "Leer e-mail campagnes die converteren." },
];

const Academy = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Academy</h1>
      <p className="text-muted-foreground mt-1">Leer marketing met onze cursussen</p>
    </div>

    <div className="grid sm:grid-cols-2 gap-4">
      {courses.map((course) => (
        <Card key={course.title} className="hover:border-primary/30 transition-colors cursor-pointer">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
              <PlayCircle className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{course.desc}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessons} lessen</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Academy;
