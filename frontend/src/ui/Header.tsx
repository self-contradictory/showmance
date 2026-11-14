import { Link } from "wouter";
import { ThemeToggle } from "@/theme/ThemeToggle";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6">
      <Link href="/" className="rounded-md font-serif text-2xl leading-none italic">
        showmance
      </Link>
      <ThemeToggle />
    </header>
  );
}
