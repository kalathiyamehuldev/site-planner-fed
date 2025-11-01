
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutGrid, CheckSquare, FileText, Users, Settings, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ActionButton from "@/components/ui/ActionButton";

const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutGrid },
    { name: "Projects", path: "/projects", icon: FileText },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Clients", path: "/clients", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const NavItem = ({ item, index }: { item: typeof navItems[0], index: number }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <li 
        className={cn(
          "opacity-0 animate-delayed-fade-in",
          { "animation-delay-[0.1s]": index === 0 },
          { "animation-delay-[0.2s]": index === 1 },
          { "animation-delay-[0.3s]": index === 2 },
          { "animation-delay-[0.4s]": index === 3 },
          { "animation-delay-[0.5s]": index === 4 },
        )}
        style={{ animationFillMode: "forwards" }}
      >
        <Link
          to={item.path}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Icon size={18} className={cn(isActive ? "text-primary" : "text-foreground/60")} />
          <span>{item.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 px-4 md:px-8",
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold animate-fade-in">D</div>
            <span className="text-xl font-light tracking-tight animate-delayed-fade-in" style={{ animationFillMode: "forwards" }}>designflow</span>
          </Link>
        </div>

        {isMobile ? (
          <>
            <ActionButton
              variant="secondary"
              motion="subtle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-50"
              leftIcon={isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            />

            {/* Mobile Menu */}
            <div
              className={cn(
                "fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out py-20 px-6",
                isMenuOpen ? "translate-x-0" : "translate-x-full"
              )}
            >
              <nav className="mt-8">
                <ul className="space-y-4">
                  {navItems.map((item, i) => (
                    <NavItem key={item.path} item={item} index={i} />
                  ))}
                </ul>
              </nav>
            </div>
          </>
        ) : (
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item, i) => (
                <NavItem key={item.path} item={item} index={i} />
              ))}
            </ul>
          </nav>
        )}

        <div className="hidden md:block">
          <ActionButton 
            variant="primary" 
            motion="subtle"
            className="opacity-0 animate-delayed-fade-in" 
            style={{ animationFillMode: "forwards", animationDelay: "0.6s" }}
            text="Get Started"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
