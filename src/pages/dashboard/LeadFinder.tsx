import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

const LeadFinder = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Leadfinder</h1>
        <p className="text-muted-foreground mt-1">Vind en analyseer potentiële klanten</p>
      </div>
      <Button className="gap-2"><Plus className="w-4 h-4" /> Bedrijf toevoegen</Button>
    </div>

    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek op bedrijfsnaam of domein..." className="pl-10" />
      </div>
      <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filters</Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gevonden leads</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Zoek naar bedrijven om leads te vinden en te analyseren.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default LeadFinder;
