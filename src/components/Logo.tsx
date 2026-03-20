import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-v3.png";

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <img src={logoIcon} alt="Nova Vista Boost" className="w-8 h-8" />
    <span className="text-lg font-semibold tracking-tight text-foreground">
      NOVA VISTA <span className="text-primary">BOOST</span>
    </span>
  </Link>
);

export default Logo;
