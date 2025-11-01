
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <AnimatedGradient 
        className="absolute top-0 left-0 w-full h-full -z-10 mask-radial-gradient" 
        variant="accent"
        intensity="low"
      />
      
      <GlassCard className="p-8 max-w-md w-full text-center mx-auto animate-scale-in">
        <h1 className="text-7xl font-light mb-4">404</h1>
        <p className="text-xl mb-8">This page could not be found</p>
        <div className="flex flex-col gap-2 items-center">
          {/* Desktop version with arrow */}
          <Link to="/">
            <ActionButton variant="primary" motion="subtle" className="w-full sm:w-auto hidden md:flex" text="Return to Dashboard" leftIcon={<ArrowLeft size={18} />} />
          </Link>
          
          {/* Mobile version without arrow */}
          <Link to="/">
            <ActionButton variant="primary" motion="subtle" className="w-full sm:w-auto flex md:hidden" text="Return to Dashboard" />
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotFound;
