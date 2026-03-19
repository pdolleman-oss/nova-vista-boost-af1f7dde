import { Link } from "react-router-dom";
import { BarChart3, ArrowUpRight } from "lucide-react";

const Logo = () => (
  <Link to="/" className="flex items-center gap-2">
    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
      <BarChart3 className="w-4 h-4 text-primary" />
    </div>
    <span className="text-lg font-semibold tracking-tight">
      NOVA VISTA <span className="text-accent">BOOST</span>
    </span>
  </Link>
);

export default Logo;
