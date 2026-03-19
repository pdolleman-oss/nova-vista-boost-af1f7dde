import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

const stages = ["Nieuw", "Contact gelegd", "Offerte verstuurd", "Gewonnen", "Verloren"];

const Pipeline = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Beheer je sales pipeline</p>
      </div>
      <Button className="gap-2"><Plus className="w-4 h-4" /> Lead toevoegen</Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stages.map((stage) => (
        <Card key={stage} className="min-h-[300px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {stage}
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground text-center">Geen leads</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Pipeline;
