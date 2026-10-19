import { useState } from "react";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import PageBackground from "./PageBackground.jsx";

/**
 * Responsive layout for the admin and scanner sites: a fixed sidebar on large
 * screens, and a top bar with a slide-out menu on tablets and phones.
 *
 * nav: [{ id, label, icon: ReactIcon }]
 */
function NavList({ nav, active, onSelect }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            className={`group flex h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-left text-sm font-semibold transition-colors ${
              isActive
                ? "border-gold bg-white/[0.07] text-gold"
                : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {Icon && <Icon size={17} className="shrink-0" />}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SidebarBody({ nav, active, onSelect, user, role, logoSrc, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <img src={logoSrc} alt="OASIS" className="h-auto w-36 object-contain" />
      <p className="label mt-1 text-gold/80">{role}</p>

      {user && (
        <div className="surface-inset mt-6 px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate font-mono text-xs text-white/50">{user.username}</p>
        </div>
      )}

      <div className="mt-6 flex-1 overflow-y-auto">
        <NavList nav={nav} active={active} onSelect={onSelect} />
      </div>

      {onLogout && (
        <button type="button" onClick={onLogout} className="btn-ghost mt-4 w-full">
          <FiLogOut size={15} /> Log out
        </button>
      )}
    </div>
  );
}

export default function AppShell({ nav, active, onNavigate, user, role, logoSrc, onLogout, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = nav.find((n) => n.id === active);

  const select = (id) => {
    setDrawerOpen(false);
    onNavigate(id);
  };
  const body = { nav, active, onSelect: select, user, role, logoSrc, onLogout };

  return (
    <PageBackground>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-[#0e0809]/95 p-5 lg:block">
        <SidebarBody {...body} />
      </aside>

      {/* phone / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0e0809]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <FiMenu size={18} />
        </button>
        <img src={logoSrc} alt="OASIS" className="h-8 w-auto object-contain" />
        <span className="ml-auto truncate font-mono text-xs uppercase tracking-widest text-gold">
          {current?.label}
        </span>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/10 bg-[#0e0809] p-5">
            <button
              type="button"
              className="btn-icon absolute right-3 top-3 border-transparent bg-transparent"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
            <SidebarBody {...body} />
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </PageBackground>
  );
}
