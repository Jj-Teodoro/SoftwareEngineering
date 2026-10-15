import { useCallback, useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { api } from "../api/client";

const PAGE_SIZE = 8;

function formatName(user) {
  const middleInitial = user.middle_name ? ` ${user.middle_name[0]}.` : "";
  return `${user.last_name}, ${user.first_name}${middleInitial}`.toUpperCase();
}

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (query = "") => {
    setLoading(true);
    setError("");
    try {
      setUsers(await api.users.list({ search: query.trim() }));
      setPage(1);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
              placeholder="Search student ID or name"
              className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => loadUsers(search)}
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
                {["Student ID", "Name", "Section", "Role"].map((col) => (
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
              {(loading || error || pageUsers.length === 0) && (
                <tr>
                  <td colSpan={4} className={`px-6 py-8 text-center text-sm ${error ? "text-red-300" : "text-white/70"}`}>
                    {loading ? "Loading users..." : error || "No users found"}
                  </td>
                </tr>
              )}
              {!loading && !error && pageUsers.map((user, i) => (
                <tr
                  key={user.student_id}
                  className={`border-b border-dashed border-white/20 last:border-none ${
                    i % 2 === 0 ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-white">{user.student_id}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{formatName(user)}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{user.section}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{user.role.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
      </div>
    </div>
  );
}
