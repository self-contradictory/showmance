export function worldSlug(world: { id: number; name: string }): string {
  const name = world.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${name || "world"}-${world.id}`;
}

export function worldIdFromSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}
