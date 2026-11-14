# frontend

React + TypeScript + Tailwind on Bun.

```bash
bun install      # install dependencies
bun dev          # dev server with hot reload
bun run build    # static build to dist/ (used by Vercel)
bun check        # type check
```

## 3D homes

Each world is staged in one home: a 3D house model (`src/world/sets.ts`) or the original procedural rooms (`classic`). A world picks it with its `home` id; worlds without one use the villa. Each home lists its rooms: where people gather, where the camera films them, and which location kinds (pool, kitchen, bedroom...) they fit. People in a room gather on a half circle and turn toward each other. Rooms filmed from outside use `cut`, which cuts the house away in front of the people, like a dollhouse.

Models are `.glb` files in `src/world/models`, compressed for the web with [glTF Transform](https://gltf-transform.dev):

```bash
bunx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false --palette false
```

Credits:

- `villa`: "Two-storey villa" by Innerscene, CC0.
- `cottage`: ["Low Poly House Interior"](https://sketchfab.com/3d-models/low-poly-house-interior-62b1714ef66f4e0d9f42dcd12efb3f52) by Paolo Mercogliano, CC BY 4.0.
- `two-story`: ["Two Stories with Interiors"](https://sketchfab.com/3d-models/two-stories-with-interiors-e9a17d0ce2f649aea834fc7629649cd6) by lurtisrules, CC BY 4.0.
