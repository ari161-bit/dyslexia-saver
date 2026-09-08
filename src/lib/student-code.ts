// Excludes visually confusable characters (0/O, 1/I/L, 8/B, 2/Z, 5/S) —
// this code gets read aloud and typed back in by parents and teachers, so
// on a dyslexia-support app it especially can't rely on shape alone.
const CODE_ALPHABET = "34679ACDEFGHJKMNPQRTUVWXY";

export function generateStudentCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
