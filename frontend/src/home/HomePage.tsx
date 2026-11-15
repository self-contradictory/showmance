import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { useHint } from "@/lib/useHint";
import { useShowList } from "@/show/useShowList";
import { Header } from "@/ui/Header";
import { ShowCard } from "./ShowCard";
import { Spotlight, WatchLabel } from "./Spotlight";

export function HomePage() {
  const shows = useShowList();
  const [hinting, dismissHint] = useHint("showmance:hint:watch", 500);
  const spotlit = hinting && Boolean(shows?.length);

  useEffect(() => {
    document.title = "Showmance";
  }, []);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="px-4 pt-2 pb-12 lg:px-6">
        <h1 className="sr-only">Shows</h1>
        {shows?.length === 0 && <p className="py-24 text-center text-muted">No shows are on right now.</p>}
        <ul className="grid gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-y-10">
          {shows?.map((show, index) => {
            const first = index === 0 && spotlit;
            return (
              <li key={show.slug} onClickCapture={first ? dismissHint : undefined} className={first ? "relative z-40" : undefined}>
                <ShowCard show={show} />
                <AnimatePresence>{first && <WatchLabel />}</AnimatePresence>
              </li>
            );
          })}
        </ul>
      </main>
      <AnimatePresence>{spotlit && <Spotlight onDismiss={dismissHint} />}</AnimatePresence>
    </div>
  );
}
