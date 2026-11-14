import type { CastMember } from "@/show/types";

type Props = { title: string; day?: number; now: string; cast: CastMember[] };

export function ShowInfo({ title, day, now, cast }: Props) {
  return (
    <section className="px-4 pt-3 pb-4 lg:flex lg:shrink-0 lg:items-start lg:justify-between lg:gap-6 lg:px-0 lg:pt-4 lg:pb-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold">{title}</h1>
          {day !== undefined && <span className="text-sm text-muted">Day {day}</span>}
        </div>
        <p className="mt-0.5 text-sm">{now}</p>
      </div>

      <ul className="flex shrink-0 gap-3 max-lg:hidden" aria-label="Cast">
        {cast.map((member) => (
          <li key={member.id} className="flex flex-col items-center gap-1">
            {member.portrait ? (
              <img src={member.portrait} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <span
                className="grid size-9 place-items-center rounded-full bg-surface text-sm font-semibold"
                aria-hidden
              >
                {member.name[0]}
              </span>
            )}
            <span className="text-xs text-muted">{member.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
