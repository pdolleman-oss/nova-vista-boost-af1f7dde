import Logo from "./Logo";

const Footer = () => (
  <footer className="border-t border-border/50 py-12">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <Logo />
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nova Vista Progressus. Alle rechten voorbehouden.
      </p>
    </div>
  </footer>
);

export default Footer;
