import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { USE_BACKEND } from "@/api/config";
import { CoinsDialog } from "./CoinsDialog";

const WalletContext = createContext<(() => void) | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openWallet = useCallback(() => setOpen(true), []);

  if (!USE_BACKEND) return children;
  return (
    <WalletContext value={openWallet}>
      {children}
      <CoinsDialog open={open} onClose={() => setOpen(false)} />
    </WalletContext>
  );
}

export function useOpenWallet(): (() => void) | null {
  return useContext(WalletContext);
}
