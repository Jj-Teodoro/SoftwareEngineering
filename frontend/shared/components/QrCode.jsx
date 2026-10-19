import qrcode from "qrcode-generator";

/** Small QR code drawn as one SVG path. Encodes the given text (the student ID). */
export default function QrCode({ value, className = "", color = "#2b0a0c" }) {
  const qr = qrcode(0, "M");
  qr.addData(String(value));
  qr.make();

  const count = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`QR code for student ID ${value}`}
    >
      <path d={path} fill={color} />
    </svg>
  );
}
