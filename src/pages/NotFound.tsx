import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-muted-foreground mb-8">Pagina niet gevonden</p>
      <Link to="/">
        <Button>Terug naar home</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
