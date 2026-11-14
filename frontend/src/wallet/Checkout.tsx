import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api, ApiError } from "@/api/client";
import { STRIPE_KEY } from "@/api/config";
import type { CoinPack, Viewer, ViewerSession } from "@/api/types";

const stripe = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
const CONFIRM_TRIES = 5;
const CONFIRM_WAIT_MS = 1500;

type Props = { pack: CoinPack; token: string; onPaid: () => void };

async function confirmPaid(purchaseId: string, token: string): Promise<Viewer> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await api.confirmPurchase(purchaseId, token);
    } catch (error) {
      const pending = error instanceof ApiError && error.status === 409;
      if (!pending || attempt >= CONFIRM_TRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, CONFIRM_WAIT_MS));
    }
  }
}

function startProblem(error: unknown): string {
  if (error instanceof ApiError && error.status === 503) return "Buying coins isn't set up on this site yet.";
  return "Checkout didn't start. Go back and try again.";
}

export default function Checkout({ pack, token, onPaid }: Props) {
  const queryClient = useQueryClient();
  const purchaseId = useRef<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  async function confirm() {
    const id = purchaseId.current;
    if (!id) return;
    setUnconfirmed(false);
    try {
      const viewer = await confirmPaid(id, token);
      queryClient.setQueryData<ViewerSession>(["viewer"], (session) => (session ? { ...session, viewer } : session));
      onPaid();
    } catch {
      setUnconfirmed(true);
    }
  }

  const [options] = useState(() => ({
    fetchClientSecret: async () => {
      try {
        const checkout = await api.startPurchase(pack.id, token);
        purchaseId.current = checkout.id;
        return checkout.client_secret;
      } catch (error) {
        setProblem(startProblem(error));
        throw error;
      }
    },
    onComplete: () => void confirm(),
  }));

  if (problem) return <p className="py-6 text-center text-sm text-muted">{problem}</p>;

  return (
    <div className="flex flex-col gap-3">
      {unconfirmed && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
          <p>Your payment went through, but the coins haven't arrived yet.</p>
          <button type="button" onClick={() => void confirm()} className="shrink-0 font-semibold text-accent">
            Try again
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-xl">
        <EmbeddedCheckoutProvider stripe={stripe} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
