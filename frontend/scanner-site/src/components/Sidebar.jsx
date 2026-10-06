import oasis_logo from "../assets/oasislogo.gif";

const NAV_ITEMS = ["Event", "Scan", "Settings"];

export default function Sidebar({ active, onNavigate, currentUser, onLogout }) {
  return (
    <aside className="flex w-full max-w-[280px] flex-col items-center rounded-[30px] border border-white/20 bg-white/10 px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <img
        src={oasis_logo}
        alt="OASIS Logo"
        className="max-w-[180px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
      />

      {currentUser && (
        <div className="mt-6 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-center">
          <p className="truncate text-xs font-bold uppercase tracking-[1px] text-white">
            {currentUser.name}
          </p>
          <p className="mt-1 text-[11px] text-white/60">{currentUser.studentId}</p>
        </div>
      )}

      <nav className="mt-10 flex w-full flex-col gap-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item === active;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onNavigate?.(item)}
              className={`w-full rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-[2px] transition-all ${
                isActive
                  ? "border-white/30 bg-[#97191d] text-white shadow-[0_0_20px_rgba(184,31,37,0.5)]"
                  : "border-white/30 bg-white/5 text-white hover:bg-white/15"
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="mt-auto w-full rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-white/15"
        >
          Log Out
        </button>
      )}
    </aside>
  );
}
