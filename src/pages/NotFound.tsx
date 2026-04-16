import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background noise-texture px-4">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="relative z-10 premium-card w-full max-w-lg rounded-3xl px-8 py-12 text-center">
        <p className="section-label mb-3">Route Not Found</p>
        <h1 className="mb-2 text-[4.5rem] font-display leading-none text-gradient">404</h1>
        <p className="mb-7 text-sm text-muted-foreground/85">
          This page does not exist or may have been moved.
        </p>
        <Link to="/" className="ui-primary-button inline-flex items-center justify-center rounded-xl px-6 py-3 text-[11px] uppercase tracking-[0.16em]">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
