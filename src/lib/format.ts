export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function fmtShortDate(iso: string): string {
  // Handles both "yyyy-mm-dd" and "dd/mm/yyyy"
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) d = new Date(iso);
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) {
    const [dd, mm, yy] = iso.split("/");
    d = new Date(`${yy}-${mm}-${dd}`);
  } else d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function dayShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function hourShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}
