export function code(n) {
  if (!Number.isInteger(n) || n < 0 || n > 48) throw Error('checkpoint');
  const payload = 100 + n;
  return String(payload) + '-' + String((payload * 131 + 73) % 997).padStart(3,'0');
}
export function decode(raw) {
  if (typeof raw !== 'string' || raw.length > 64 || /[^A-Za-z0-9\s-]/.test(raw)) return null;
  const s = raw.toUpperCase().replace(/[ \t\r\n-]/g,'');
  for (let n=0; n<=48; n++) {
    const a='0123456789ABCDEFGHJKMNPQRSTVWXYZ', check=(330+131*n)%1021;
    const legacy='1'+a[n>>5]+a[n%32]+a[check>>5]+a[check%32];
    if (s===code(n).replace('-','') || s===legacy) return n;
  }
  return null;
}
