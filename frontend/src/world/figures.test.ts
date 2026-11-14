import { expect, test } from "bun:test";
import { figureFor } from "./figures";

test("men and women get their own character, and anyone else alternates", () => {
  expect(figureFor("female", 0)).not.toBe(figureFor("male", 0));
  expect(figureFor(undefined, 0)).toBe(figureFor("female", 0));
  expect(figureFor(undefined, 1)).toBe(figureFor("male", 0));
});
