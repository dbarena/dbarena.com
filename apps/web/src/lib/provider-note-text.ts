export function providerNoteLine(note: string) {
  const [first] = note.split(/\n\n/);
  return (first ?? note).replace(/\s+/g, " ").trim();
}
