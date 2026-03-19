import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-3xl font-bold">Instellingen</h1>
      <p className="text-muted-foreground mt-1">Beheer je account en organisatie</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Profiel</CardTitle>
        <CardDescription>Beheer je persoonlijke gegevens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Volledige naam</label>
          <Input placeholder="Je naam" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">E-mailadres</label>
          <Input placeholder="je@email.com" disabled />
        </div>
        <Button>Opslaan</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Abonnement</CardTitle>
        <CardDescription>Beheer je Nova Vista Boost abonnement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Gratis plan</p>
            <p className="text-sm text-muted-foreground">Basisfunctionaliteit</p>
          </div>
          <Button variant="outline">Upgraden</Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Organisatie</CardTitle>
        <CardDescription>Beheer je team en organisatie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Organisatienaam</label>
          <Input placeholder="Naam van je organisatie" />
        </div>
        <Button>Opslaan</Button>
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
