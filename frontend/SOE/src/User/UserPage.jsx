import { useState } from "react";
import { FiSearch } from "react-icons/fi";

const SAMPLE_USERS = [
  { id: "2024-02333", name: "NIEVES, RAFAEL JOSEPH G.", section: "BSCPE-3A", status: "ACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
  { id: "2024-00429", name: "OCAMPO, NATHAN LEO", section: "BSCPE-3A", status: "INACTIVE" },
];

const TOTAL_PAGES = 8;

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Search + Filter row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <div className="flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-white/30 bg-white/10 px-5 backdrop-blur-md">
            <FiSearch className="text-white/70" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student ID or name"
              className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
            />
          </div>

          <button
            type="button"
            className="h-12 rounded-full bg-white/90 px-8 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
          >
            Enter
          </button>

          <button
            type="button"
            className="h-12 rounded-full bg-white/90 px-8 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="h-12 rounded-full border border-white/40 bg-white/5 px-8 text-sm font-bold uppercase tracking-[2px] text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            Select
          </button>
          <button
            type="button"
            className="h-12 rounded-full border border-white/40 bg-white/5 px-8 text-sm font-bold uppercase tracking-[2px] text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-[#7a1317]/70">
                {["Student ID", "Name", "Section", "Status"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-sm font-bold uppercase tracking-[2px] text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_USERS.map((user, i) => (
                <tr
                  key={`${user.id}-${i}`}
                  className={`border-b border-dashed border-white/20 last:border-none ${
                    i % 2 === 0 ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-white">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{user.section}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            className={`h-10 min-w-10 rounded-full border px-4 text-sm font-bold transition-all ${
              page === n
                ? "border-white/30 bg-[#97191d] text-white"
                : "border-white/40 bg-white/5 text-white backdrop-blur-md hover:bg-white/15"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/40 bg-white/5 px-4 text-sm font-bold text-white backdrop-blur-md">
          ...
        </span>
      </div>
    </div>
  );
}
