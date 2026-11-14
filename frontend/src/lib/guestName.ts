import { readStored, writeStored } from "./storage";

const NAME_KEY = "showmance:name";

export function loadGuestName(): string {
  const saved = readStored(NAME_KEY);
  if (saved) return saved;
  const fresh = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
  writeStored(NAME_KEY, fresh);
  return fresh;
}
