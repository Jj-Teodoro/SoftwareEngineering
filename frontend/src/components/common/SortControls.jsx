import { FiArrowDown, FiArrowUp } from "react-icons/fi";

/** Sorts a copy of `list` by `getValue`, numbers as numbers and text A–Z, then flips it for "desc". */
export function sortBy(list, getValue, dir = "asc") {
  const sorted = [...list].sort((a, b) => {
    const x = getValue(a);
    const y = getValue(b);
    if (typeof x === "number" && typeof y === "number") return x - y;
    return String(x ?? "").localeCompare(String(y ?? ""), undefined, { numeric: true, sensitivity: "base" });
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

const CHIP_ON = "border-gold bg-gold/15 text-gold";
const CHIP_OFF = "border-white/15 text-white/65 hover:bg-white/10";
const CHIP = "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors";

/** Ascending / Descending as two chips, for filter panels. */
export function DirectionChips({ dir, onChange, ascLabel = "Ascending", descLabel = "Descending" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onChange("asc")} className={`${CHIP} ${dir === "asc" ? CHIP_ON : CHIP_OFF}`}>
        <FiArrowUp size={11} /> {ascLabel}
      </button>
      <button type="button" onClick={() => onChange("desc")} className={`${CHIP} ${dir === "desc" ? CHIP_ON : CHIP_OFF}`}>
        <FiArrowDown size={11} /> {descLabel}
      </button>
    </div>
  );
}

/** A choice between a few options as chips (e.g. what to sort by). */
export function OptionChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`${CHIP} ${value === o.value ? CHIP_ON : CHIP_OFF}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A small dropdown for compact toolbars (dashboard cards). */
export function MiniSelect({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="min-w-0 max-w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white focus:border-gold/60 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1c1011]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One button that flips between ascending and descending. */
export function DirectionToggle({ dir, onChange }) {
  const asc = dir === "asc";
  return (
    <button
      type="button"
      onClick={() => onChange(asc ? "desc" : "asc")}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/80 transition hover:border-gold/50 hover:text-white"
      title={asc ? "Ascending: click for descending" : "Descending: click for ascending"}
      aria-label={asc ? "Sorted ascending" : "Sorted descending"}
    >
      {asc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
      {asc ? "Asc" : "Desc"}
    </button>
  );
}
