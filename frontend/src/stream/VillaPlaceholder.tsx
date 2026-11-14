/** Fills the stage until the 3D villa is ready. */
export function VillaPlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_50%_100%,var(--stage-glow)_0%,var(--stage)_80%)]">
      <p className="font-serif text-4xl italic opacity-25 sm:text-6xl">the villa</p>
    </div>
  );
}
