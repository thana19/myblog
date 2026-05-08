import { Link, Form, useNavigate, useRouteLoaderData } from "react-router";
import { useState } from "react";
import type { Category, SiteSettings } from "~/lib/db.server";
import ThemeToggle from "~/components/ThemeToggle";

interface NavbarProps {
  categories: Category[];
  activeCategorySlug?: string;
  user?: { name: string; avatar?: string } | null;
}

export default function Navbar({ categories, activeCategorySlug, user }: NavbarProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const rootData = useRouteLoaderData<SiteSettings>("root");
  const siteName = rootData?.site_name ?? "myblog";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setMenuOpen(false);
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/");
    }
  }

  return (
    <>
      <header className="bg-surface-container border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <Link to="/" className="text-xl font-black tracking-tighter text-on-surface uppercase">
            {siteName}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4 text-sm font-medium tracking-tight">
              <Link
                to="/"
                className={`pb-2 transition-colors duration-200 ${
                  !activeCategorySlug
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/${cat.slug}`}
                  className={`pb-2 transition-colors duration-200 ${
                    activeCategorySlug === cat.slug
                      ? "text-primary border-b-2 border-primary font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline outline-none"
              />
            </form>

            <ThemeToggle />

            <Link
              to="/profile"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              Profile
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                >
                  Admin
                </Link>
                <Form method="post" action="/auth/logout">
                  <button className="flex items-center gap-2 p-1 rounded-full border-2 border-primary cursor-pointer">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
                        {user.name[0]}
                      </div>
                    )}
                  </button>
                </Form>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Panel */}
          <div
            className="absolute top-[65px] left-0 right-0 bg-surface-container border-b border-outline-variant shadow-lg px-6 py-5 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search + Profile in same row */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline outline-none"
                />
              </form>
              <ThemeToggle />
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
              >
                Profile
              </Link>
            </div>

            {/* Categories */}
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className={`${
                  !activeCategorySlug
                    ? "text-primary font-bold"
                    : "text-on-surface-variant"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className={`${
                    activeCategorySlug === cat.slug
                      ? "text-primary font-bold"
                      : "text-on-surface-variant"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div className="border-t border-outline-variant" />

            {/* Auth */}
            {user && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
                      {user.name[0]}
                    </div>
                  )}
                  <span className="text-sm text-on-surface">{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Admin
                  </Link>
                  <Form method="post" action="/auth/logout">
                    <button className="text-sm text-error hover:opacity-80 transition-opacity">
                      Logout
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
