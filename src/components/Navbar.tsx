import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
    <div className="container flex h-16 items-center justify-between">
      <Logo />
      <div className="flex items-center gap-4">
        <Link to="/auth">
          <Button variant="ghost" size="sm">Inloggen</Button>
        </Link>
        <Link to="/auth">
          <Button size="sm">Gratis starten</Button>
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;
