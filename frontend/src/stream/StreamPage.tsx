import { useShow } from "@/show/useShow";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { ShowInfo } from "./ShowInfo";
import { Stage } from "./Stage";
import { VillaPlaceholder } from "./VillaPlaceholder";

export function StreamPage() {
  const { show } = useShow();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 lg:px-6">
        <span className="font-serif text-2xl leading-none italic">showmance</span>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="flex shrink-0 flex-col lg:min-w-0 lg:flex-1">
          <Stage viewers={show.viewers} caption={show.caption}>
            <VillaPlaceholder />
          </Stage>
          <ShowInfo title={show.title} day={show.day} now={show.now} cast={show.cast} />
        </main>

        <aside className="border-line max-lg:flex-1 max-lg:border-t lg:w-[340px] lg:border-l" aria-label="Chat" />
      </div>
    </div>
  );
}
