import { Link } from "wouter";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { CoinBalance } from "@/wallet/CoinBalance";
import { useOpenWallet } from "@/wallet/Wallet";

export function Header() {
  const openWallet = useOpenWallet();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6">
      <Link href="/" className="rounded-md font-serif text-2xl leading-none italic">
        showmance
      </Link>
      <div className="flex items-center gap-2">
        {openWallet && <CoinBalance onOpen={openWallet} />}
        <ThemeToggle />
      </div>
    </header>
  );
}
