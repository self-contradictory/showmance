import type { CastMember } from "@/show/types";

type Props = { title: string; day: number; now: string; cast: CastMember[] };

export function ShowInfo({ title, day, now, cast }: Props) {
  return (
    <section className="shrink-0 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
        <span className="text-sm text-muted">Day {day}</span>
      </div>
      <p className="mt-0.5 text-sm">{now}</p>

      <ul className="mt-3 flex gap-4 overflow-x-auto" aria-label="Cast">
        {cast.map((member) => (
          <li key={member.id} title={member.role} className="flex shrink-0 flex-col items-center gap-1">
            <span
              className="grid size-10 place-items-center rounded-full bg-surface text-sm font-semibold ring-1 ring-line"
              aria-hidden
            >
              {member.name[0]}
            </span>
            <span className="text-xs text-muted">{member.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
