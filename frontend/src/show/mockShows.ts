import type { CastMember, Location, Sky } from "./types";

export type Scene = { now: string; location: string; lines: [speaker: string, text: string][] };

export type ShowScript = {
  slug: string;
  title: string;
  day: number;
  viewers: number;
  cover?: string;
  sky: Sky;
  home?: string;
  locations: Location[];
  cast: CastMember[];
  scenes: Scene[];
  votes: { question: string; options: string[] }[];
  chatter: string[];
};

export const FAKE_VIEWERS = ["jess_k", "mike88", "tina", "sam_r", "dee", "carlos.v", "priya", "ben_t"];

export const SHOWS: ShowScript[] = [
  {
    slug: "the-villa",
    title: "The Villa",
    day: 3,
    viewers: 412,
    sky: "sunset",
    home: "villa",
    locations: [{ id: "pool", name: "Pool" }, { id: "kitchen", name: "Kitchen" }, { id: "bedroom", name: "Bedroom" }],
    cast: [
      { id: "mia", name: "Mia", role: "The planner", gender: "female", locationId: "pool" },
      { id: "jake", name: "Jake", role: "The charmer", gender: "male", locationId: "pool" },
      { id: "sara", name: "Sara", role: "The wildcard", gender: "female", locationId: "bedroom" },
      { id: "chris", name: "Chris", role: "The newcomer", gender: "male", locationId: "bedroom" },
      { id: "leo", name: "Leo", role: "The strategist", gender: "male", locationId: "kitchen" },
      { id: "nina", name: "Nina", role: "The queen bee", gender: "female", locationId: "kitchen" },
    ],
    scenes: [
      {
        now: "Mia and Jake are talking by the pool",
        location: "pool",
        lines: [
          ["Mia", "Do you ever think about what happens after this?"],
          ["Jake", "All the time. With you."],
          ["Mia", "That's a very good answer."],
          ["Jake", "I've been practicing."],
        ],
      },
      {
        now: "Leo and Nina are making plans in the kitchen",
        location: "kitchen",
        lines: [
          ["Leo", "If Chris stays another week, we're in trouble."],
          ["Nina", "Then we make sure he doesn't."],
          ["Leo", "Quietly."],
          ["Nina", "I'm always quiet."],
        ],
      },
      {
        now: "Chris is working up the nerve to talk to Sara",
        location: "bedroom",
        lines: [
          ["Chris", "Sara, got a second?"],
          ["Sara", "For you? Maybe two."],
          ["Chris", "I wanted to ask you something."],
          ["Sara", "Then ask."],
        ],
      },
      {
        now: "Sara can't stop thinking about the kiss",
        location: "bedroom",
        lines: [
          ["Sara", "I shouldn't have done that."],
          ["Sara", "Jake is with Mia. Everyone knows that."],
          ["Sara", "But I'd do it again."],
        ],
      },
    ],
    votes: [
      { question: "Who should Sara take on a date?", options: ["Chris", "Leo"] },
      { question: "Should Mia forgive Jake?", options: ["Forgive him", "Walk away"] },
      { question: "Who goes to the confession room?", options: ["Nina", "Leo", "Jake"] },
    ],
    chatter: [
      "he's done lol",
      "NINA PLANNED THIS",
      "Chris deserves better",
      "leo is so shady",
      "mia is too good for him",
      "sara really is the wildcard",
      "this villa is chaos",
      "jake has no idea what's coming",
      "the pool scene was everything",
      "who else is voting Chris",
    ],
  },
  {
    slug: "snowed-in",
    title: "Snowed In",
    day: 1,
    viewers: 268,
    sky: "snow",
    home: "two-story",
    locations: [{ id: "living", name: "Living room" }, { id: "kitchen", name: "Kitchen" }, { id: "bedroom", name: "Bedroom" }],
    cast: [
      { id: "ava", name: "Ava", role: "The skeptic", gender: "female", locationId: "living" },
      { id: "ethan", name: "Ethan", role: "The flirt", gender: "male", locationId: "living" },
      { id: "zoe", name: "Zoe", role: "The artist", gender: "female", locationId: "bedroom" },
      { id: "marcus", name: "Marcus", role: "The romantic", gender: "male", locationId: "bedroom" },
      { id: "lily", name: "Lily", role: "The quiet one", gender: "female", locationId: "kitchen" },
      { id: "ryan", name: "Ryan", role: "The joker", gender: "male", locationId: "kitchen" },
    ],
    scenes: [
      {
        now: "Ava and Ethan are sharing the last blanket",
        location: "living",
        lines: [
          ["Ava", "There's one blanket left."],
          ["Ethan", "Then we share it."],
          ["Ava", "Don't make this weird."],
          ["Ethan", "Too late."],
        ],
      },
      {
        now: "Zoe found Marcus's notebook by the fire",
        location: "living",
        lines: [
          ["Zoe", "Marcus, why is my name in here?"],
          ["Marcus", "Give that back."],
          ["Zoe", "It's three pages long."],
          ["Marcus", "They're good pages."],
        ],
      },
      {
        now: "The power just went out",
        location: "kitchen",
        lines: [
          ["Lily", "Everyone stay calm."],
          ["Ryan", "Who's holding my hand?"],
          ["Zoe", "Not me."],
          ["Lily", "Not me either."],
        ],
      },
    ],
    votes: [
      { question: "Who gets the warm room tonight?", options: ["Ava and Ethan", "Zoe and Marcus"] },
      { question: "Should Lily tell Ryan how she feels?", options: ["Tell him", "Wait"] },
    ],
    chatter: [
      "ethan is too smooth",
      "the blanket scene lol",
      "MARCUS WROTE THREE PAGES",
      "lily just say it",
      "who was holding his hand",
      "zoe and marcus forever",
      "ava is not convinced",
      "this chalet is chaos",
    ],
  },
  {
    slug: "last-resort",
    title: "Last Resort",
    day: 2,
    viewers: 183,
    sky: "day",
    home: "classic",
    locations: [{ id: "beach", name: "Beach" }, { id: "bar", name: "Bar" }, { id: "pool", name: "Pool" }],
    cast: [
      { id: "nora", name: "Nora", role: "The planner", gender: "female", locationId: "beach" },
      { id: "luca", name: "Luca", role: "The charmer", gender: "male", locationId: "beach" },
      { id: "ivy", name: "Ivy", role: "The dancer", gender: "female", locationId: "bar" },
      { id: "theo", name: "Theo", role: "The shy one", gender: "male", locationId: "bar" },
      { id: "rosa", name: "Rosa", role: "The competitor", gender: "female", locationId: "pool" },
      { id: "kai", name: "Kai", role: "The surfer", gender: "male", locationId: "pool" },
    ],
    scenes: [
      {
        now: "Nora and Luca missed the last boat",
        location: "beach",
        lines: [
          ["Nora", "We missed the boat."],
          ["Luca", "We did."],
          ["Nora", "You don't sound sorry."],
          ["Luca", "I'm not."],
        ],
      },
      {
        now: "Ivy is teaching Theo to dance",
        location: "bar",
        lines: [
          ["Ivy", "Left foot. Your other left."],
          ["Theo", "I have two left feet."],
          ["Ivy", "Then use both."],
        ],
      },
      {
        now: "Rosa and Kai are fighting over the last sunbed",
        location: "pool",
        lines: [
          ["Rosa", "I was here first."],
          ["Kai", "Your towel was here first."],
          ["Rosa", "Same thing."],
          ["Kai", "Share it?"],
        ],
      },
    ],
    votes: [
      { question: "Who should Luca take to the farewell party?", options: ["Nora", "Ivy"] },
      { question: "Should Rosa and Kai share the sunbed?", options: ["Share it", "Fight it out"] },
    ],
    chatter: [
      "nora missed that boat on purpose",
      "theo is trying his best",
      "the sunbed war continues",
      "luca is down bad",
      "rosa vs kai forever",
      "ivy is so patient",
      "who else ships nora and luca",
      "this resort is chaos",
    ],
  },
  {
    slug: "second-chances",
    title: "Second Chances",
    day: 5,
    viewers: 97,
    sky: "night",
    home: "cottage",
    locations: [{ id: "deck", name: "Deck" }, { id: "kitchen", name: "Kitchen" }, { id: "bedroom", name: "Bedroom" }],
    cast: [
      { id: "grace", name: "Grace", role: "The one who left", gender: "female", locationId: "kitchen" },
      { id: "daniel", name: "Daniel", role: "The one who stayed", gender: "male", locationId: "deck" },
      { id: "maya", name: "Maya", role: "The planner", gender: "female", locationId: "bedroom" },
      { id: "josh", name: "Josh", role: "The romantic", gender: "male", locationId: "bedroom" },
      { id: "elena", name: "Elena", role: "The skeptic", gender: "female", locationId: "deck" },
      { id: "sam", name: "Sam", role: "The surprise", gender: "male", locationId: "kitchen" },
    ],
    scenes: [
      {
        now: "Grace and Daniel are alone for the first time in two years",
        location: "kitchen",
        lines: [
          ["Grace", "You still take your coffee black?"],
          ["Daniel", "Some things don't change."],
          ["Grace", "Some things should."],
        ],
      },
      {
        now: "Maya just found a ring in Josh's bag",
        location: "bedroom",
        lines: [
          ["Maya", "Why is there a ring in your bag?"],
          ["Josh", "It's from before."],
          ["Maya", "Before what?"],
          ["Josh", "Before you left."],
        ],
      },
      {
        now: "Elena's ex just walked in",
        location: "deck",
        lines: [
          ["Elena", "No. Absolutely not."],
          ["Sam", "Hi, Elena."],
          ["Elena", "Who invited him?"],
          ["Sam", "You did. Three years ago."],
        ],
      },
    ],
    votes: [
      { question: "Should Grace give Daniel another chance?", options: ["Yes", "No"] },
      { question: "Should Maya keep the ring?", options: ["Keep it", "Give it back"] },
    ],
    chatter: [
      "the coffee line hurt",
      "JOSH HAD A RING",
      "elena's face lol",
      "they still love each other",
      "grace don't do it",
      "sam came prepared",
      "daniel waited two years",
      "this house is chaos",
    ],
  },
];

export function findShow(slug: string): ShowScript | undefined {
  return SHOWS.find((show) => show.slug === slug);
}

const SCENE_MS = 16_000;

export function sceneIndexNow(script: ShowScript): number {
  const offset = SHOWS.indexOf(script) * 5_000;
  return Math.floor((Date.now() + offset) / SCENE_MS) % script.scenes.length;
}
