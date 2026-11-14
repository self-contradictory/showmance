import { useEffect } from "react";
import { useShowList } from "@/show/useShowList";
import { Header } from "@/ui/Header";
import { ShowCard } from "./ShowCard";

export function HomePage() {
  const shows = useShowList();

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
          {shows?.map((show) => (
            <li key={show.slug}>
              <ShowCard show={show} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
