export function isSerialNumber(text: string): boolean {
  return /^R[A-Za-z0-9]{13}$/.test(text);
}