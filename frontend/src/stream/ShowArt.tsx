type Props = { title: string; cover?: string };

export function ShowArt({ title, cover }: Props) {
  if (cover) return <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />;

  return (
    <div className="@container absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_50%_100%,var(--stage-glow)_0%,var(--stage)_80%)]">
      <p className="font-serif text-[9cqw] lowercase italic opacity-25">{title}</p>
    </div>
  );
}
