// Code 39 patterns: 9 elements per character (bar, space, bar, ...), n = narrow, w = wide.
const CODE39 = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "-": "nwnnnnwnw",
  "*": "nwnnwnwnn",
};

const NARROW = 1.4;
const WIDE = 3.2;

export default function Barcode({ value, className = "" }) {
  const chars = ["*", ...String(value).split("").filter((c) => CODE39[c]), "*"];
  if (chars.length <= 2) return null;

  let x = 0;
  const bars = [];
  chars.forEach((char, ci) => {
    CODE39[char].split("").forEach((element, i) => {
      const width = element === "w" ? WIDE : NARROW;
      if (i % 2 === 0) {
        bars.push(<rect key={`${ci}-${i}`} x={x} y={0} width={width} height={40} />);
      }
      x += width;
    });
    x += NARROW;
  });

  return (
    <svg
      viewBox={`0 0 ${x - NARROW} 40`}
      preserveAspectRatio="none"
      className={className}
      fill="#1a1a1a"
      role="img"
      aria-label={`Barcode for student ID ${value}`}
    >
      {bars}
    </svg>
  );
}
