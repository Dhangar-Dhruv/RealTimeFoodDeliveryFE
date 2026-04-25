export function luhnCheck(digits: string): boolean {
  const len = digits.length;
  if (len === 0) return false;
  let sum = 0;
  let parity = len % 2;
  for (let i = 0; i < len; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === parity) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}
