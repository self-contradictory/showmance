# frontend

React + TypeScript + Tailwind on Bun.

```bash
bun install      # install dependencies
bun dev          # dev server with hot reload
bun run build    # static build to dist/ (used by Vercel)
bun check        # type check
```

## 3D sets

The stream can be staged in a real 3D house (`src/world/sets.ts`) or in the original procedural rooms. Viewers switch sets with the house button in the player. Each model set lists its rooms: where people stand, where the camera films them, and which location kinds (pool, kitchen, bedroom...) they fit. Rooms filmed from outside use `cut`, which cuts the house away in front of the people, like a dollhouse.

Models are `.glb` files in `src/world/models`, compressed for the web with [glTF Transform](https://gltf-transform.dev):

```bash
bunx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false --palette false
```

Credits:

- Villa: "Two-storey villa" by Innerscene, CC0.
- Modern house: ["Modern House Interior + Exterior"](https://sketchfab.com/3d-models/modern-house-interior-exterior-free-b4053371db864bd2b0f59d16113d42ee) by Fazeel.Saeed, CC BY 4.0. The stage shows this credit while the set is on.
