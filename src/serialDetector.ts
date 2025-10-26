export function isSerialNumber(text: string): boolean {
  const regex = /^R[A-Za-z0-9]{13}$/;
  if (regex.test(text)) {
    if (text.startsWith('RCFVBY') || text.startsWith('RCCVBY')) {
      return true;
    }
    return true;
  }
  return false;
}