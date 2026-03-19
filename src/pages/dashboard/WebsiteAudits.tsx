import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Search, Plus } from "lucide-react";

const WebsiteAudits = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Website Audits</h1>
        <p className="text-muted-foreground mt-1">Scan en analyseer websites van prospects</p>
      </div>
      <Button className="gap-2"><Plus className="w-4 h-4" /> Nieuwe scan</Button>
    </div>

    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Voer een website URL in om te scannen..." className="pl-10" />
      </div>
      <Button>Scannen</Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recente audits</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nog geen website audits uitgevoerd. Start je eerste scan hierboven.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default WebsiteAudits;
