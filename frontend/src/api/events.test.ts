import { expect, test } from "bun:test";
import { EventParser } from "./events";

test("events come out whole even when split across chunks", () => {
  const parser = new EventParser();

  const first = parser.push('id: 7\ndata: {"kind":');
  const second = parser.push('"say"}\n\nevent: viewers\ndata: 3\n\n');

  expect(first).toEqual([]);
  expect(second).toEqual([
    { type: "message", data: '{"kind":"say"}', id: "7" },
    { type: "viewers", data: "3", id: null },
  ]);
});

test("a line break split between chunks still ends the event once", () => {
  const parser = new EventParser();

  const events = [...parser.push("event: chat\r\ndata: hi\r"), ...parser.push("\n\r\n")];

  expect(events).toEqual([{ type: "chat", data: "hi", id: null }]);
});

test("comments are skipped and data lines join", () => {
  const parser = new EventParser();

  expect(parser.push(": ping\ndata: one\ndata: two\n\n")).toEqual([{ type: "message", data: "one\ntwo", id: null }]);
});
