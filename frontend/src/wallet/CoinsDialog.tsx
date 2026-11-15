import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import { STRIPE_KEY, TWIST_PRICE } from "@/api/config";
import type { CoinPack } from "@/api/types";
import { useViewer } from "@/show/useViewer";
import { Count } from "@/ui/Count";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { IconButton } from "@/ui/IconButton";

const Checkout = lazy(() => import("./Checkout"));

type Step = { name: "packs" } | { name: "checkout"; pack: CoinPack } | { name: "done"; pack: CoinPack };

type Props = { open: boolean; onClose: () => void };

const TITLE_ID = "coins-title";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function CoinsDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>({ name: "packs" });

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      aria-labelledby={TITLE_ID}
      onClose={() => {
        onClose();
        setStep({ name: "packs" });
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && step.name !== "checkout") close();
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-page text-ink backdrop:bg-overlay ${step.name === "checkout" ? "w-[min(36rem,calc(100%-2rem))]" : "w-[min(28rem,calc(100%-2rem))]"}`}
    >
      {open && (
        <div className="flex flex-col gap-4 p-5">
          {step.name === "packs" && (
            <Packs onClose={close} onPick={(pack) => setStep({ name: "checkout", pack })} />
          )}
          {step.name === "checkout" && (
            <Paying
              pack={step.pack}
              onBack={() => setStep({ name: "packs" })}
              onClose={close}
              onPaid={() => setStep({ name: "done", pack: step.pack })}
            />
          )}
          {step.name === "done" && <Done pack={step.pack} onClose={close} />}
        </div>
      )}
    </dialog>
  );
}

function Heading({ children, onBack, onClose }: { children: ReactNode; onBack?: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {onBack && (
        <IconButton label="Back to packs" onClick={onBack}>
          <ArrowLeft size={18} />
        </IconButton>
      )}
      <h2 id={TITLE_ID} className="flex-1 text-lg font-semibold">
        {children}
      </h2>
      <IconButton label="Close" onClick={onClose}>
        <X size={18} />
      </IconButton>
    </div>
  );
}

function Packs({ onPick, onClose }: { onPick: (pack: CoinPack) => void; onClose: () => void }) {
  const shop = useQuery({ queryKey: ["packs"], queryFn: api.packs, staleTime: Infinity });
  const coins = useViewer().data?.viewer.coins;

  return (
    <>
      <div>
        <Heading onClose={onClose}>Get coins</Heading>
        {coins !== undefined && (
          <p className="text-sm text-muted tabular-nums">
            You have <Count value={coins} /> coins
          </p>
        )}
      </div>

      {shop.isError ? (
        <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
          <p>The coin packs didn't load.</p>
          <button type="button" onClick={() => void shop.refetch()} className="font-semibold text-accent">
            Try again
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(shop.data?.packs ?? []).map((pack) => (
            <li key={pack.id}>
              <button
                type="button"
                disabled={!STRIPE_KEY}
                onClick={() => onPick(pack)}
                className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left transition-colors enabled:hover:bg-surface-strong disabled:opacity-60"
              >
                <span className="flex flex-col">
                  <span className="font-semibold tabular-nums">{pack.coins.toLocaleString("en-US")} coins</span>
                  <span className="text-sm text-muted">{Math.floor(pack.coins / TWIST_PRICE)} twists</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(pack.price_cents, shop.data?.currency ?? "usd")}
                </span>
              </button>
            </li>
          ))}
          {shop.isPending && [0, 1, 2].map((row) => <li key={row} className="h-[4.25rem] animate-pulse rounded-xl bg-surface" />)}
        </ul>
      )}

      {!STRIPE_KEY && <p className="text-sm text-muted">Buying coins isn't set up on this site yet.</p>}
    </>
  );
}

function Paying({
  pack,
  onBack,
  onClose,
  onPaid,
}: {
  pack: CoinPack;
  onBack: () => void;
  onClose: () => void;
  onPaid: () => void;
}) {
  const token = useViewer().data?.token;
  const unavailable = <p className="py-6 text-center text-sm text-muted">Checkout didn't load. Go back and try again.</p>;

  return (
    <>
      <Heading onBack={onBack} onClose={onClose}>
        {pack.coins.toLocaleString("en-US")} coins
      </Heading>
      {token ? (
        <ErrorBoundary fallback={unavailable}>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
            <Checkout key={pack.id} pack={pack} token={token} onPaid={onPaid} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        unavailable
      )}
    </>
  );
}

function Done({ pack, onClose }: { pack: CoinPack; onClose: () => void }) {
  const coins = useViewer().data?.viewer.coins;

  return (
    <div className="flex flex-col items-center gap-2 pt-2 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent text-on-accent">
        <Check size={24} />
      </span>
      <h2 id={TITLE_ID} className="mt-2 text-lg font-semibold">
        Added {pack.coins.toLocaleString("en-US")} coins
      </h2>
      {coins !== undefined && (
        <p className="text-sm text-muted tabular-nums">
          You have <Count value={coins} /> coins
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-3 h-10 w-full rounded-full bg-accent text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
      >
        Done
      </button>
    </div>
  );
}
