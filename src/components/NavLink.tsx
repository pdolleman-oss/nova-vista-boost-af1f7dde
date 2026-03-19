import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props extends NavLinkProps {
  activeClassName?: string;
}

const NavLink = ({ className, activeClassName = "bg-muted text-primary font-medium", ...props }: Props) => (
  <RouterNavLink
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50",
        isActive && activeClassName,
        className as string
      )
    }
    {...props}
  />
);

export { NavLink };
