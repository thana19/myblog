import { Link, useRouteLoaderData } from "react-router";
import type { SiteSettings } from "~/lib/db.server";

export default function Footer() {
  const year = new Date().getFullYear();
  const rootData = useRouteLoaderData<SiteSettings>("root");
  const siteName = rootData?.site_name ?? "myblog";
  const tagline = rootData?.tagline ?? "A personal blog by me.";

  return (
    <footer className="bg-surface-container border-t border-outline-variant mt-12">
      <div className="flex flex-col md:flex-row justify-between items-center py-8 px-6 max-w-7xl mx-auto w-full">
        <div className="mb-6 md:mb-0">
          <Link to="/" className="text-lg font-bold text-on-surface">
            {siteName}
          </Link>
          <p className="text-xs text-on-surface-variant mt-1">
            {tagline}
          </p>
        </div>
        <nav className="flex gap-8 mb-6 md:mb-0">
          <Link
            to="/about"
            className="text-xs text-on-surface-variant hover:text-primary transition-all underline-offset-4 hover:underline"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-xs text-on-surface-variant hover:text-primary transition-all underline-offset-4 hover:underline"
          >
            Contact
          </Link>
        </nav>
        <div className="text-xs text-on-surface-variant">
          © {year} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
