import type Database from "better-sqlite3";
import { getDb } from "./db";
import {
  DEFAULT_COVER_CHARGE,
  DEFAULT_RESERVATION_DURATION,
  GAME_CATEGORIES,
  TABLE_SECTIONS,
  VALID_EVENT_TYPES,
  VALID_TABLE_SHAPES,
} from "./constants";
import { CONDITION_LABELS, conditionScoreForLabel } from "./game-utils";
import type { GameCategory } from "./types";

type SeedResult = {
  games: number;
  tables: number;
  reservations: number;
  events: number;
  sessions: number;
  checkouts: number;
};

type CountRow = { count: number };
type ConditionLabel = (typeof CONDITION_LABELS)[number];
type TableSection = (typeof TABLE_SECTIONS)[number];
type TableShape = (typeof VALID_TABLE_SHAPES)[number];
type EventType = (typeof VALID_EVENT_TYPES)[number];

type SeedGame = {
  title: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  complexity: number;
  description: string;
  condition: ConditionLabel;
  replacementThreshold: number;
  copiesTotal: number;
  shelfLocation: string;
  lastInspectedAt: string;
};

type SeedTablePlan = {
  name: string;
  capacity: number;
  section: TableSection;
  status: "available" | "occupied" | "reserved" | "maintenance";
  x: number;
  y: number;
  shape: TableShape;
};

type SeededTable = SeedTablePlan & {
  id: number;
};

type SeededGame = SeedGame & {
  id: number;
  conditionScore: number;
};

type SeedReservation = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  tableId: number | null;
  reservationDate: string;
  reservationTime: string;
  durationMinutes: number;
  status: string;
  notes: string;
};

type EventPlan = {
  title: string;
  description: string;
  offsetDays: number;
  startTime: string;
  endTime: string;
  capacity: number;
  eventType: EventType;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  fillRatio: number;
};

type SeededEvent = EventPlan & {
  id: number;
  eventDate: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const HIGH_TRAFFIC_TITLES = new Set([
  "7 Wonders",
  "Azul",
  "Catan",
  "Codenames",
  "Crokinole",
  "Dominion",
  "Dune: Imperium",
  "Patchwork",
  "Pandemic",
  "Root",
  "Ticket to Ride",
  "Viticulture",
  "Wingspan",
]);

const WORN_TITLES = new Set([
  "Bananagrams",
  "Crokinole",
  "King of Tokyo",
  "Memoir '44",
  "Ticket to Ride",
  "UNO",
]);

const NEEDS_REPLACEMENT_TITLES = new Set([
  "Backgammon",
  "Clue",
  "Mille Bornes",
  "Sequence",
]);

const NEVER_CHECKED_OUT_TITLES = new Set([
  "Backgammon",
  "Blades in the Dark Score Kit",
  "Call of Cthulhu Intro",
  "Fiasco",
  "Mahjong",
  "Mille Bornes",
  "Nine Men's Morris",
  "Pente",
  "Pub Quiz Royale",
  "Tak",
  "Wanderhome",
]);

const CATEGORY_GAME_TITLES: Record<GameCategory, string[]> = {
  Strategy: [
    "Catan",
    "Carcassonne",
    "7 Wonders",
    "Terraforming Mars",
    "Brass: Birmingham",
    "Ark Nova",
    "Concordia",
    "Barrage",
    "Great Western Trail",
  ],
  Party: [
    "Codenames",
    "Wavelength",
    "Decrypto",
    "Just One",
    "Skull",
    "Monikers",
    "Telestrations",
    "Camel Up",
    "A Fake Artist Goes to New York",
  ],
  Cooperative: [
    "Pandemic",
    "Spirit Island",
    "The Crew",
    "Hanabi",
    "Forbidden Island",
    "Flash Point: Fire Rescue",
    "Robinson Crusoe",
    "Aeon's End",
    "Paleo",
  ],
  Family: [
    "Ticket to Ride",
    "Cascadia",
    "Kingdomino",
    "Quacks of Quedlinburg",
    "Tokaido",
    "Parks",
    "Takenoko",
    "Flamme Rouge",
    "My Little Scythe",
  ],
  "Card Game": [
    "Jaipur",
    "Lost Cities",
    "Scout",
    "The Fox in the Forest",
    "Sea Salt & Paper",
    "LLAMA",
    "Bohnanza",
    "Point Salad",
    "Love Letter",
  ],
  "Deck Building": [
    "Dominion",
    "Clank!",
    "Dune: Imperium",
    "Ascension",
    "Hero Realms",
    "Star Wars: The Deckbuilding Game",
    "DC Deck-Building Game",
    "Shards of Infinity",
    "Valley of the Kings",
  ],
  "Worker Placement": [
    "Viticulture",
    "Agricola",
    "Stone Age",
    "Architects of the West Kingdom",
    "Champions of Midgard",
    "Underwater Cities",
    "Anachrony",
    "Lords of Waterdeep",
    "Caylus 1303",
  ],
  "Area Control": [
    "Root",
    "Blood Rage",
    "Inis",
    "Kemet",
    "El Grande",
    "Small World",
    "Rising Sun",
    "Cyclades",
    "Tyrants of the Underdark",
  ],
  Dice: [
    "Sagrada",
    "Dice Forge",
    "Roll Player",
    "King of Tokyo",
    "Cubitos",
    "Las Vegas",
    "Railroad Ink",
    "That's Pretty Clever!",
    "Can't Stop",
  ],
  Trivia: [
    "Wits & Wagers",
    "Timeline",
    "Smart10",
    "Half Truth",
    "Geek Out!",
    "Bezzerwizzer",
    "Linkee",
    "Pub Quiz Royale",
    "Cranium Challenge",
  ],
  Dexterity: [
    "Crokinole",
    "PitchCar",
    "Junk Art",
    "Men at Work",
    "Ice Cool",
    "Rhino Hero",
    "KLASK",
    "Tumblin-Dice",
    "Tokyo Highway",
  ],
  Deduction: [
    "Mysterium",
    "Deception: Murder in Hong Kong",
    "Cryptid",
    "Clue",
    "Mind MGMT",
    "Awkward Guests",
    "Sherlock Holmes Consulting Detective",
    "Search for Planet X",
    "Turing Machine",
  ],
  "Engine Building": [
    "Wingspan",
    "Res Arcana",
    "Gizmos",
    "Furnace",
    "Century: Golem Edition",
    "It's a Wonderful World",
    "Splendor",
    "Imperial Settlers",
    "Space Base",
  ],
  Abstract: [
    "Chess",
    "Go",
    "Patchwork",
    "Hive",
    "Calico",
    "Santorini",
    "Onitama",
    "Blokus",
    "Azul",
  ],
  Wargame: [
    "Memoir '44",
    "Undaunted: Normandy",
    "Twilight Struggle",
    "Commands & Colors: Ancients",
    "Sekigahara",
    "Watergate",
    "878 Vikings",
    "Combat Commander: Europe",
    "Battle Line",
  ],
  RPG: [
    "Dungeons & Dragons Starter Set",
    "Pathfinder Beginner Box",
    "Call of Cthulhu Intro",
    "Blades in the Dark Score Kit",
    "Kids on Bikes",
    "Fiasco",
    "Ironsworn",
    "Root: The RPG",
    "Wanderhome",
  ],
  Thematic: [
    "Betrayal at House on the Hill",
    "Nemesis",
    "Eldritch Horror",
    "Mansions of Madness",
    "Dead of Winter",
    "Arkham Horror",
    "Zombicide: Black Plague",
    "Star Wars: Rebellion",
    "Unfathomable",
  ],
  "Word Game": [
    "Scrabble",
    "Bananagrams",
    "Letter Jam",
    "So Clover!",
    "Paperback",
    "Hardback",
    "Word on the Street",
    "Medium",
    "Cross Clues",
  ],
  Other: [
    "Mahjong",
    "Backgammon",
    "Sequence",
    "Tak",
    "Qwirkle",
    "Mille Bornes",
    "Nine Men's Morris",
    "UNO",
    "Pente",
  ],
};

const CATEGORY_PROFILES: Record<GameCategory, {
  playerRanges: ReadonlyArray<readonly [number, number]>;
  playTimes: readonly number[];
  complexities: readonly number[];
  hooks: readonly string[];
}> = {
  Strategy: {
    playerRanges: [[2, 4], [2, 5], [1, 4], [3, 6]],
    playTimes: [60, 75, 90, 120, 150],
    complexities: [2.4, 2.7, 3.0, 3.3, 3.7],
    hooks: ["resource timing", "positional planning", "smart tempo swings"],
  },
  Party: {
    playerRanges: [[3, 8], [4, 10], [2, 12]],
    playTimes: [15, 20, 30, 40],
    complexities: [1.1, 1.3, 1.5, 1.8],
    hooks: ["reading the room", "big-table laughter", "fast clue giving"],
  },
  Cooperative: {
    playerRanges: [[1, 4], [2, 4], [2, 5], [3, 6]],
    playTimes: [30, 45, 60, 90, 120],
    complexities: [1.8, 2.2, 2.6, 3.1, 3.6],
    hooks: ["shared planning", "tense teamwork", "coordinated problem solving"],
  },
  Family: {
    playerRanges: [[2, 4], [2, 5], [2, 6], [1, 4]],
    playTimes: [20, 30, 45, 60],
    complexities: [1.2, 1.5, 1.8, 2.1],
    hooks: ["easy teaching", "welcoming table talk", "fast turns"],
  },
  "Card Game": {
    playerRanges: [[2, 2], [2, 4], [2, 5], [3, 6]],
    playTimes: [15, 20, 30, 45],
    complexities: [1.3, 1.6, 1.9, 2.2],
    hooks: ["compact decks", "quick combos", "sharp tactical pivots"],
  },
  "Deck Building": {
    playerRanges: [[2, 4], [2, 5], [1, 4]],
    playTimes: [30, 45, 60, 90, 120],
    complexities: [1.9, 2.2, 2.6, 3.0],
    hooks: ["engine tuning", "card synergies", "upgrade racing"],
  },
  "Worker Placement": {
    playerRanges: [[1, 4], [2, 4], [2, 5], [1, 5]],
    playTimes: [60, 75, 90, 120],
    complexities: [2.4, 2.8, 3.1, 3.5],
    hooks: ["action blocking", "resource conversion", "timed placement pressure"],
  },
  "Area Control": {
    playerRanges: [[2, 4], [2, 5], [3, 6]],
    playTimes: [60, 75, 90, 120],
    complexities: [2.4, 2.8, 3.1, 3.5],
    hooks: ["map pressure", "territory contests", "conflict timing"],
  },
  Dice: {
    playerRanges: [[1, 4], [2, 4], [2, 6], [2, 8]],
    playTimes: [15, 25, 35, 45, 60],
    complexities: [1.2, 1.5, 1.8, 2.1],
    hooks: ["push-your-luck rolls", "combo chaining", "surprising swings"],
  },
  Trivia: {
    playerRanges: [[2, 6], [2, 8], [4, 12]],
    playTimes: [20, 30, 45, 60],
    complexities: [1.0, 1.2, 1.4, 1.6],
    hooks: ["quick recall", "team banter", "surprise fact drops"],
  },
  Dexterity: {
    playerRanges: [[2, 4], [2, 6], [2, 8]],
    playTimes: [10, 15, 20, 30, 45],
    complexities: [1.0, 1.2, 1.5, 1.8],
    hooks: ["steady hands", "physical precision", "crowd pleasing moments"],
  },
  Deduction: {
    playerRanges: [[1, 4], [2, 5], [3, 8], [4, 12]],
    playTimes: [20, 30, 45, 60, 90],
    complexities: [1.6, 1.9, 2.3, 2.8],
    hooks: ["logical elimination", "careful clue reading", "hidden information"],
  },
  "Engine Building": {
    playerRanges: [[1, 4], [2, 4], [2, 5]],
    playTimes: [30, 45, 60, 75, 90],
    complexities: [1.9, 2.2, 2.6, 3.0],
    hooks: ["snowballing combos", "resource loops", "efficient tableau growth"],
  },
  Abstract: {
    playerRanges: [[2, 2], [2, 4]],
    playTimes: [15, 20, 30, 45, 60],
    complexities: [1.6, 1.9, 2.2, 2.6, 3.0],
    hooks: ["clean decision spaces", "spatial tactics", "minimal rules with depth"],
  },
  Wargame: {
    playerRanges: [[2, 2], [2, 4], [2, 6]],
    playTimes: [45, 60, 90, 120, 180],
    complexities: [2.2, 2.7, 3.1, 3.5, 3.9],
    hooks: ["hand management under pressure", "front-line positioning", "scenario-driven tension"],
  },
  RPG: {
    playerRanges: [[2, 5], [3, 6], [4, 6]],
    playTimes: [60, 90, 120, 180],
    complexities: [2.0, 2.4, 2.8, 3.1],
    hooks: ["character-driven scenes", "shared storytelling", "creative problem solving"],
  },
  Thematic: {
    playerRanges: [[1, 4], [2, 4], [2, 5], [3, 6]],
    playTimes: [60, 90, 120, 150, 180],
    complexities: [2.2, 2.6, 3.0, 3.4],
    hooks: ["dramatic moments", "scenario tension", "immersive table presence"],
  },
  "Word Game": {
    playerRanges: [[2, 4], [2, 6], [3, 8]],
    playTimes: [15, 20, 30, 45],
    complexities: [1.1, 1.4, 1.7, 2.0],
    hooks: ["language play", "quick associations", "clever clue crafting"],
  },
  Other: {
    playerRanges: [[2, 2], [2, 4], [2, 6], [2, 10]],
    playTimes: [15, 30, 45, 60, 90],
    complexities: [1.0, 1.4, 1.8, 2.2],
    hooks: ["classic appeal", "timeless rulesets", "casual shelf browsing"],
  },
};

const TABLE_LAYOUT: readonly SeedTablePlan[] = [
  { name: "Dragon's Den", capacity: 4, section: "Main Floor", status: "occupied", x: 12, y: 12, shape: "rectangle" },
  { name: "Meeple Meadow", capacity: 2, section: "Main Floor", status: "available", x: 26, y: 12, shape: "circle" },
  { name: "Hex Harbor", capacity: 6, section: "Main Floor", status: "available", x: 40, y: 12, shape: "rectangle" },
  { name: "Guild Hall", capacity: 8, section: "Main Floor", status: "occupied", x: 55, y: 12, shape: "square" },
  { name: "Lantern Lounge", capacity: 2, section: "Quiet Corner", status: "reserved", x: 15, y: 28, shape: "circle" },
  { name: "Rulebook Nook", capacity: 4, section: "Quiet Corner", status: "available", x: 29, y: 28, shape: "square" },
  { name: "Scholar's Shelf", capacity: 6, section: "Quiet Corner", status: "available", x: 43, y: 28, shape: "rectangle" },
  { name: "Sunlit Strategy", capacity: 4, section: "Window Seats", status: "occupied", x: 58, y: 28, shape: "rectangle" },
  { name: "Dice & Daylight", capacity: 2, section: "Window Seats", status: "reserved", x: 72, y: 28, shape: "circle" },
  { name: "Victory Vista", capacity: 6, section: "Window Seats", status: "available", x: 86, y: 28, shape: "rectangle" },
  { name: "Draft Cave", capacity: 8, section: "Back Room", status: "available", x: 18, y: 45, shape: "square" },
  { name: "Side Quest Sofa", capacity: 4, section: "Back Room", status: "maintenance", x: 32, y: 45, shape: "rectangle" },
  { name: "Hidden Hex", capacity: 6, section: "Back Room", status: "occupied", x: 46, y: 45, shape: "rectangle" },
  { name: "Garden Gather", capacity: 6, section: "Patio", status: "reserved", x: 60, y: 45, shape: "circle" },
  { name: "Breeze Bazaar", capacity: 4, section: "Patio", status: "available", x: 74, y: 45, shape: "square" },
  { name: "Patio Prime", capacity: 8, section: "Patio", status: "occupied", x: 88, y: 45, shape: "rectangle" },
  { name: "Monarch Suite", capacity: 10, section: "Private Room", status: "reserved", x: 22, y: 63, shape: "rectangle" },
  { name: "Campaign Room", capacity: 12, section: "Private Room", status: "available", x: 38, y: 63, shape: "square" },
  { name: "Trophy Table", capacity: 6, section: "Private Room", status: "available", x: 54, y: 63, shape: "rectangle" },
  { name: "High Roller", capacity: 4, section: "Balcony", status: "available", x: 68, y: 63, shape: "circle" },
  { name: "Skyline Social", capacity: 6, section: "Balcony", status: "occupied", x: 82, y: 63, shape: "rectangle" },
  { name: "Whisper Wing", capacity: 2, section: "Balcony", status: "maintenance", x: 14, y: 80, shape: "square" },
  { name: "Overwatch", capacity: 8, section: "Mezzanine", status: "available", x: 34, y: 80, shape: "rectangle" },
  { name: "Starlight Six", capacity: 6, section: "Mezzanine", status: "available", x: 50, y: 80, shape: "circle" },
  { name: "Quiet Quest", capacity: 4, section: "Mezzanine", status: "available", x: 66, y: 80, shape: "square" },
  { name: "Final Turn", capacity: 2, section: "Mezzanine", status: "available", x: 82, y: 80, shape: "rectangle" },
];

const EVENT_PLANS: readonly EventPlan[] = [
  { title: "Strategy Tuesday League", description: "A rotating ladder night featuring the café's most requested thinky eurogames.", offsetDays: -20, startTime: "18:30", endTime: "22:00", capacity: 24, eventType: "Tournament", status: "completed", fillRatio: 0.92 },
  { title: "Family Brunch & Learn", description: "Low-stress teaching tables for parents, grandparents, and first-time players.", offsetDays: -17, startTime: "11:00", endTime: "13:30", capacity: 18, eventType: "Family Event", status: "completed", fillRatio: 0.78 },
  { title: "Designers Prototype Lab", description: "Indie designers bring prototypes for guided feedback and rapid playtesting.", offsetDays: -14, startTime: "18:00", endTime: "21:00", capacity: 16, eventType: "Workshop", status: "completed", fillRatio: 0.69 },
  { title: "Social Deduction Friday", description: "A high-energy night of hidden roles, accusations, and dramatic reveals.", offsetDays: -11, startTime: "19:00", endTime: "22:30", capacity: 28, eventType: "Social", status: "completed", fillRatio: 0.86 },
  { title: "Cooperative Campaign Club", description: "Returning groups continue narrative campaigns with staff teaching support.", offsetDays: -8, startTime: "18:30", endTime: "22:00", capacity: 20, eventType: "Game Night", status: "completed", fillRatio: 0.75 },
  { title: "Mini Painting Basics", description: "A beginner-friendly workshop covering prep, priming, and starter brush control.", offsetDays: -6, startTime: "17:30", endTime: "20:00", capacity: 14, eventType: "Workshop", status: "completed", fillRatio: 0.64 },
  { title: "Speed Cubes & Dexterity Dash", description: "Fast rounds of dexterity favorites with mini prizes between heats.", offsetDays: -3, startTime: "18:00", endTime: "21:30", capacity: 18, eventType: "Special", status: "completed", fillRatio: 0.72 },
  { title: "Trivia & Tea Tonight", description: "Board game pub trivia, afternoon tea specials, and cozy team tables.", offsetDays: -1, startTime: "19:00", endTime: "21:30", capacity: 30, eventType: "Social", status: "completed", fillRatio: 0.83 },
  { title: "Lunch Break Learn-to-Play", description: "Quick-start lunchtime demos that keep workday groups moving.", offsetDays: 0, startTime: "12:30", endTime: "14:00", capacity: 12, eventType: "Workshop", status: "ongoing", fillRatio: 0.67 },
  { title: "Catan City Championship", description: "The busiest tournament on the calendar, with prize support from local sponsors.", offsetDays: 2, startTime: "18:30", endTime: "22:30", capacity: 32, eventType: "Tournament", status: "upcoming", fillRatio: 1 },
  { title: "Cozy Couples Game Night", description: "A curated lineup of fast two-player favourites for date-night bookings.", offsetDays: 4, startTime: "19:00", endTime: "22:00", capacity: 16, eventType: "Game Night", status: "upcoming", fillRatio: 0.88 },
  { title: "RPG One-Shot Marathon", description: "Staff GMs rotate through short adventures so guests can sample new systems.", offsetDays: 6, startTime: "13:00", endTime: "19:00", capacity: 24, eventType: "Game Night", status: "upcoming", fillRatio: 0.95 },
  { title: "Family Saturday Sampler", description: "Drop-in teaching tables for all-ages favorites and snack bundles.", offsetDays: 8, startTime: "11:30", endTime: "14:30", capacity: 26, eventType: "Family Event", status: "upcoming", fillRatio: 0.73 },
  { title: "Trading Card Swap Meet", description: "An open-house meetup for collectors, traders, and after-hours café regulars.", offsetDays: 10, startTime: "17:00", endTime: "20:00", capacity: 22, eventType: "Special", status: "upcoming", fillRatio: 0.55 },
  { title: "Worker Placement Masterclass", description: "A guided workshop on planning tempo, action blocking, and efficiency curves.", offsetDays: 12, startTime: "18:30", endTime: "21:30", capacity: 14, eventType: "Workshop", status: "upcoming", fillRatio: 0.79 },
  { title: "All-Ages Trivia Cup", description: "An oversized trivia showdown with rotating categories and family-friendly finals.", offsetDays: 15, startTime: "18:00", endTime: "21:00", capacity: 34, eventType: "Social", status: "upcoming", fillRatio: 1 },
  { title: "New Releases Showcase", description: "First-look tables for the newest arrivals with staff recommendation cards.", offsetDays: 18, startTime: "18:30", endTime: "22:00", capacity: 28, eventType: "Game Night", status: "upcoming", fillRatio: 0.61 },
  { title: "Staff Picks After Dark", description: "A late-night showcase of quirky favorites normally hidden in the staff room.", offsetDays: 21, startTime: "20:00", endTime: "23:00", capacity: 20, eventType: "Special", status: "cancelled", fillRatio: 0 },
];

const COLOR_MAP: Record<string, string> = {
  Strategy: "#7c3aed",
  Party: "#f97316",
  Cooperative: "#10b981",
  Family: "#0ea5e9",
  "Card Game": "#ec4899",
  "Deck Building": "#8b5cf6",
  "Worker Placement": "#14b8a6",
  "Area Control": "#ef4444",
  Dice: "#f59e0b",
  Trivia: "#06b6d4",
  Dexterity: "#84cc16",
  Deduction: "#0f766e",
  "Engine Building": "#6366f1",
  Abstract: "#4f46e5",
  Wargame: "#b91c1c",
  RPG: "#9333ea",
  Thematic: "#dc2626",
  "Word Game": "#0891b2",
  Other: "#475569",
  "Game Night": "#7c3aed",
  Tournament: "#ef4444",
  Workshop: "#0ea5e9",
  Social: "#f97316",
  "Family Event": "#10b981",
  Special: "#e11d48",
};

function countRows(db: Database.Database, tableName: string): number {
  return (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as CountRow).count;
}

function currentCounts(db: Database.Database): SeedResult {
  return {
    games: countRows(db, "games"),
    tables: countRows(db, "tables"),
    reservations: countRows(db, "reservations"),
    events: countRows(db, "events"),
    sessions: countRows(db, "sessions"),
    checkouts: countRows(db, "game_checkouts"),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function sqliteDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function localTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addDays(baseDate: Date, days: number): Date {
  return new Date(baseDate.getTime() + days * DAY_MS);
}

function guestNameAt(index: number): string {
  const firstNames = [
    "Avery", "Brielle", "Cameron", "Dakota", "Emerson", "Finley", "Gray", "Harper", "Indigo", "Jordan",
    "Kai", "Logan", "Morgan", "Nico", "Oakley", "Parker", "Quinn", "Rowan", "Sawyer", "Taylor",
    "Uma", "Val", "Winter", "Xen", "Yael", "Zion",
  ] as const;
  const lastNames = [
    "Alvarez", "Bailey", "Cole", "Diaz", "Ellis", "Flores", "Garner", "Hayes", "Iverson", "Jenkins",
    "Kim", "Lopez", "Morris", "Nguyen", "Owens", "Patel", "Quintero", "Reed", "Singh", "Turner",
    "Usman", "Vega", "Ward", "Xu", "Young", "Zimmer",
  ] as const;

  const first = firstNames[index % firstNames.length] ?? "Guest";
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length] ?? "Guest";
  return `${first} ${last}`;
}

function guestEmailAt(index: number, name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return `${slug}.${pad(index % 100)}@example.com`;
}

function guestPhoneAt(index: number): string {
  return `555-${String(1200 + ((index * 73) % 7800)).padStart(4, "0")}`;
}

function conditionForGame(title: string, index: number): ConditionLabel {
  if (NEEDS_REPLACEMENT_TITLES.has(title)) return "Needs Replacement";
  if (WORN_TITLES.has(title)) return "Worn";
  if (index % 9 === 0) return "Fair";
  if (index % 6 === 0) return "Excellent";
  return "Good";
}

function replacementThresholdForGame(title: string, index: number): number {
  if (HIGH_TRAFFIC_TITLES.has(title)) return 3 + (index % 3);
  if (NEVER_CHECKED_OUT_TITLES.has(title)) return 18 + (index % 2);
  return 11 + (index % 6);
}

function copiesForGame(title: string, index: number): number {
  if (HIGH_TRAFFIC_TITLES.has(title)) return 3;
  return index % 4 === 0 ? 2 : 1;
}

function shelfLocationFor(index: number): string {
  const row = Math.floor(index / 8) + 1;
  const column = String.fromCharCode(65 + (index % 8));
  return `${column}${row}`;
}

function inspectionDateFor(index: number): string {
  const inspectedAt = new Date(Date.now() - ((index % 18) + 1) * DAY_MS);
  inspectedAt.setUTCHours(10 + (index % 7), (index * 13) % 60, 0, 0);
  return sqliteDateTime(inspectedAt);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCoverImage(title: string, label: string): string {
  const color = COLOR_MAP[label] ?? "#7c3aed";
  const initial = title.charAt(0).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="480" height="640" rx="32" fill="url(#g)" />
      <circle cx="372" cy="108" r="88" fill="rgba(255,255,255,0.12)" />
      <text x="56" y="132" font-size="82" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff">${initial}</text>
      <text x="56" y="474" font-size="42" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
      <text x="56" y="530" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#ede9fe">${escapeXml(label)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildGameDescription(
  title: string,
  category: GameCategory,
  hook: string,
  playerRange: readonly [number, number],
  playTimeMinutes: number,
): string {
  const [minPlayers, maxPlayers] = playerRange;
  const playerLabel = minPlayers === maxPlayers ? `${minPlayers} players` : `${minPlayers}-${maxPlayers} players`;
  return `${title} is a ${category.toLowerCase()} favorite built around ${hook}. It fits the café well for ${playerLabel} and usually wraps in about ${playTimeMinutes} minutes.`;
}

function buildBoardGames(): SeedGame[] {
  let gameIndex = 0;

  return GAME_CATEGORIES.flatMap((category, categoryIndex) => {
    const titles = CATEGORY_GAME_TITLES[category];
    const profile = CATEGORY_PROFILES[category];

    return titles.map((title, titleIndex) => {
      const index = gameIndex;
      gameIndex += 1;

      const playerRange = profile.playerRanges[(titleIndex + categoryIndex) % profile.playerRanges.length] ?? [2, 4];
      const playTimeMinutes = profile.playTimes[(titleIndex * 2 + categoryIndex) % profile.playTimes.length] ?? 45;
      const complexity = profile.complexities[(titleIndex + index) % profile.complexities.length] ?? 2.5;
      const hook = profile.hooks[titleIndex % profile.hooks.length] ?? "approachable strategy";
      const condition = conditionForGame(title, index);

      return {
        title,
        category,
        minPlayers: playerRange[0],
        maxPlayers: playerRange[1],
        playTimeMinutes,
        complexity,
        description: buildGameDescription(title, category, hook, playerRange, playTimeMinutes),
        condition,
        replacementThreshold: replacementThresholdForGame(title, index),
        copiesTotal: copiesForGame(title, index),
        shelfLocation: shelfLocationFor(index),
        lastInspectedAt: inspectionDateFor(index),
      } satisfies SeedGame;
    });
  });
}

function tableByName(tables: SeededTable[], name: string): SeededTable {
  const table = tables.find((entry) => entry.name === name);
  if (!table) {
    throw new Error(`Missing seeded table: ${name}`);
  }
  return table;
}

function buildReservations(tables: SeededTable[]): SeedReservation[] {
  const reservations: SeedReservation[] = [];
  const now = new Date();
  const today = isoDate(now);
  const reservedNowPlans = [
    { tableName: "Lantern Lounge", minutesFromNow: 15, partySize: 2, durationMinutes: 90, status: "confirmed", notes: "Quiet corner requested for a first date." },
    { tableName: "Dice & Daylight", minutesFromNow: 25, partySize: 2, durationMinutes: 120, status: "confirmed", notes: "Birthday pair arriving after cake service." },
    { tableName: "Garden Gather", minutesFromNow: -10, partySize: 5, durationMinutes: 120, status: "pending", notes: "Host called to say the whole group is parking now." },
    { tableName: "Monarch Suite", minutesFromNow: 35, partySize: 8, durationMinutes: 180, status: "confirmed", notes: "Private teach requested for a corporate group." },
  ] as const;

  reservedNowPlans.forEach((plan, index) => {
    const table = tableByName(tables, plan.tableName);
    const reservationTime = localTime(new Date(now.getTime() + plan.minutesFromNow * MINUTE_MS));
    const guestName = guestNameAt(index);
    reservations.push({
      guestName,
      guestEmail: guestEmailAt(index, guestName),
      guestPhone: guestPhoneAt(index),
      partySize: plan.partySize,
      tableId: table.id,
      reservationDate: today,
      reservationTime,
      durationMinutes: plan.durationMinutes,
      status: plan.status,
      notes: plan.notes,
    });
  });

  const seatableTables = tables.filter((table) => table.status !== "maintenance");
  if (seatableTables.length === 0) {
    throw new Error("No tables available for reservations");
  }

  const futureTimes = ["11:00", "13:30", "16:00", "18:30", "20:30"] as const;

  for (let index = 0; index < 32; index += 1) {
    const table = seatableTables[(index * 5 + 2) % seatableTables.length];
    if (!table) {
      throw new Error("Missing table for future reservation");
    }
    const assigned = index % 5 !== 0;
    const reservationDate = isoDate(addDays(now, Math.floor(index / 3) + 1));
    const guestName = guestNameAt(index + 10);
    const capacityGap = assigned ? Math.max(table.capacity - 1, 0) : 5;
    const partySize = assigned ? Math.min(table.capacity, 2 + (index % Math.max(capacityGap, 1))) : 2 + (index % 6);

    reservations.push({
      guestName,
      guestEmail: guestEmailAt(index + 10, guestName),
      guestPhone: guestPhoneAt(index + 10),
      partySize,
      tableId: assigned ? table.id : null,
      reservationDate,
      reservationTime: futureTimes[index % futureTimes.length] ?? futureTimes[0],
      durationMinutes: index % 4 === 0 ? 150 : DEFAULT_RESERVATION_DURATION,
      status: index % 4 === 0 ? "pending" : "confirmed",
      notes:
        index % 6 === 0
          ? "Please recommend a gateway strategy game."
          : index % 7 === 0
            ? "Window preference if reassigned."
            : "",
    });
  }

  const historicalStatuses = ["completed", "no-show", "cancelled", "completed", "completed", "completed", "no-show", "cancelled", "completed", "completed"] as const;

  historicalStatuses.forEach((status, index) => {
    const table = seatableTables[(index * 3 + 1) % seatableTables.length];
    if (!table) {
      throw new Error("Missing table for historical reservation");
    }

    const reservationDate = isoDate(addDays(now, -(index + 2)));
    const guestName = guestNameAt(index + 60);

    reservations.push({
      guestName,
      guestEmail: guestEmailAt(index + 60, guestName),
      guestPhone: guestPhoneAt(index + 60),
      partySize: Math.min(table.capacity, 2 + (index % Math.max(table.capacity - 1, 1))),
      tableId: table.id,
      reservationDate,
      reservationTime: futureTimes[(index + 2) % futureTimes.length] ?? futureTimes[0],
      durationMinutes: DEFAULT_RESERVATION_DURATION,
      status,
      notes: status === "no-show" ? "Guest did not arrive after confirmation text." : "",
    });
  });

  return reservations;
}

function buildEvents(now: Date): Omit<SeededEvent, "id">[] {
  return EVENT_PLANS.map((plan) => ({
    ...plan,
    eventDate: isoDate(addDays(now, plan.offsetDays)),
  }));
}

function buildEventRsvps(events: SeededEvent[]) {
  const rsvps: Array<{ eventId: number; guestName: string; guestEmail: string; partySize: number; status: string }> = [];
  const sizePattern = [2, 1, 3, 2, 1, 4, 2, 1, 2, 3] as const;
  let guestOffset = 200;

  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];
    if (!event || event.status === "cancelled") {
      continue;
    }

    const targetAttendees = Math.min(event.capacity, Math.round(event.capacity * event.fillRatio));
    let attendees = 0;
    let localIndex = 0;

    while (attendees < targetAttendees) {
      const guestName = guestNameAt(guestOffset);
      const nextPartySize = Math.min(sizePattern[(eventIndex + localIndex) % sizePattern.length] ?? 1, targetAttendees - attendees);

      rsvps.push({
        eventId: event.id,
        guestName,
        guestEmail: guestEmailAt(guestOffset, guestName),
        partySize: nextPartySize,
        status: "confirmed",
      });

      attendees += nextPartySize;
      guestOffset += 1;
      localIndex += 1;
    }
  }

  return rsvps;
}

function buildCheckoutRotation(games: SeedGame[]): string[] {
  const titles = games.map((game) => game.title).filter((title) => !NEVER_CHECKED_OUT_TITLES.has(title));
  const spotlight = titles.filter((title) => HIGH_TRAFFIC_TITLES.has(title));
  const rotation: string[] = [];

  titles.forEach((title, index) => {
    rotation.push(title);
    if (spotlight.length > 0 && index % 3 === 0) {
      const spotlightTitle = spotlight[index % spotlight.length];
      if (spotlightTitle) {
        rotation.push(spotlightTitle);
      }
    }
  });

  return rotation;
}

function nextCheckoutTitles(count: number, cursorStart: number, rotation: string[]): { titles: string[]; nextCursor: number } {
  const titles: string[] = [];
  let cursor = cursorStart;

  while (titles.length < count) {
    const title = rotation[cursor % rotation.length];
    cursor += 1;
    if (title && !titles.includes(title)) {
      titles.push(title);
    }
  }

  return { titles, nextCursor: cursor };
}

function historicalReturnCondition(index: number): ConditionLabel {
  const pattern: readonly ConditionLabel[] = [
    "Excellent",
    "Good",
    "Good",
    "Fair",
    "Good",
    "Good",
    "Fair",
    "Worn",
  ];
  return pattern[index % pattern.length] ?? "Good";
}

export function seedDatabase(database?: Database.Database): SeedResult {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is disabled in production");
  }

  const db = database ?? getDb();

  return db.transaction(() => {
    const existingCounts = currentCounts(db);
    const hasAnyData = Object.values(existingCounts).some((count) => count > 0);
    if (hasAnyData) {
      return existingCounts;
    }

    const games = buildBoardGames();
    const checkoutRotation = buildCheckoutRotation(games);
    const insertGame = db.prepare(`
      INSERT INTO games (
        title, min_players, max_players, play_time_minutes, complexity, category, description,
        image_url, copies_total, copies_available, condition, condition_score, last_inspected_at,
        replacement_threshold, needs_replacement, shelf_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const game of games) {
      const conditionScore = conditionScoreForLabel(game.condition);
      insertGame.run(
        game.title,
        game.minPlayers,
        game.maxPlayers,
        game.playTimeMinutes,
        game.complexity,
        game.category,
        game.description,
        buildCoverImage(game.title, game.category),
        game.copiesTotal,
        game.copiesTotal,
        game.condition,
        conditionScore,
        game.lastInspectedAt,
        game.replacementThreshold,
        conditionScore <= 2 ? 1 : 0,
        game.shelfLocation,
      );
    }

    const seededGames = db.prepare(`
      SELECT id, title, min_players, max_players, play_time_minutes, complexity, category, description,
             condition, condition_score, replacement_threshold, copies_total, shelf_location, last_inspected_at
      FROM games
      ORDER BY id ASC
    `).all() as Array<{
      id: number;
      title: string;
      min_players: number;
      max_players: number;
      play_time_minutes: number;
      complexity: number;
      category: GameCategory;
      description: string;
      condition: ConditionLabel;
      condition_score: number;
      replacement_threshold: number;
      copies_total: number;
      shelf_location: string;
      last_inspected_at: string;
    }>;

    const gameByTitle = new Map<string, SeededGame>(
      seededGames.map((game) => [
        game.title,
        {
          id: game.id,
          title: game.title,
          category: game.category,
          minPlayers: game.min_players,
          maxPlayers: game.max_players,
          playTimeMinutes: game.play_time_minutes,
          complexity: game.complexity,
          description: game.description,
          condition: game.condition,
          conditionScore: game.condition_score,
          replacementThreshold: game.replacement_threshold,
          copiesTotal: game.copies_total,
          shelfLocation: game.shelf_location,
          lastInspectedAt: game.last_inspected_at,
        },
      ]),
    );

    const insertTable = db.prepare(`
      INSERT INTO tables (name, capacity, section, status, x_position, y_position, shape)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const table of TABLE_LAYOUT) {
      insertTable.run(table.name, table.capacity, table.section, table.status, table.x, table.y, table.shape);
    }

    const seededTables = db.prepare(`
      SELECT id, name, capacity, section, status, x_position, y_position, shape
      FROM tables
      ORDER BY id ASC
    `).all() as Array<{
      id: number;
      name: string;
      capacity: number;
      section: TableSection;
      status: "available" | "occupied" | "reserved" | "maintenance";
      x_position: number;
      y_position: number;
      shape: TableShape;
    }>;

    const tables = seededTables.map((table) => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      section: table.section,
      status: table.status,
      x: table.x_position,
      y: table.y_position,
      shape: table.shape,
    } satisfies SeededTable));

    const insertReservation = db.prepare(`
      INSERT INTO reservations (
        guest_name, guest_email, guest_phone, party_size, table_id,
        reservation_date, reservation_time, duration_minutes, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const reservation of buildReservations(tables)) {
      insertReservation.run(
        reservation.guestName,
        reservation.guestEmail,
        reservation.guestPhone,
        reservation.partySize,
        reservation.tableId,
        reservation.reservationDate,
        reservation.reservationTime,
        reservation.durationMinutes,
        reservation.status,
        reservation.notes,
      );
    }

    const now = new Date();
    const insertEvent = db.prepare(`
      INSERT INTO events (
        title, description, event_date, start_time, end_time, capacity,
        rsvp_count, event_type, status, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const event of buildEvents(now)) {
      insertEvent.run(
        event.title,
        event.description,
        event.eventDate,
        event.startTime,
        event.endTime,
        event.capacity,
        0,
        event.eventType,
        event.status,
        buildCoverImage(event.title, event.eventType),
      );
    }

    const seededEvents = db.prepare(`
      SELECT id, title, description, event_date, start_time, end_time, capacity, event_type, status
      FROM events
      ORDER BY id ASC
    `).all() as Array<{
      id: number;
      title: string;
      description: string;
      event_date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      event_type: EventType;
      status: "upcoming" | "ongoing" | "completed" | "cancelled";
    }>;

    const eventFillRatioByTitle = new Map(EVENT_PLANS.map((plan) => [plan.title, plan.fillRatio]));
    const events = seededEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      offsetDays: 0,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      capacity: event.capacity,
      eventType: event.event_type,
      status: event.status,
      fillRatio: eventFillRatioByTitle.get(event.title) ?? 0,
    } satisfies SeededEvent));

    const insertRsvp = db.prepare(`
      INSERT INTO rsvps (event_id, guest_name, guest_email, party_size, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const rsvp of buildEventRsvps(events)) {
      insertRsvp.run(rsvp.eventId, rsvp.guestName, rsvp.guestEmail, rsvp.partySize, rsvp.status);
    }

    const insertSession = db.prepare(`
      INSERT INTO sessions (
        table_id, party_name, party_size, started_at, ended_at, status,
        rate_type, cover_charge_per_person, total_charge, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertCheckout = db.prepare(`
      INSERT INTO game_checkouts (
        session_id, game_id, checked_out_at, returned_at, return_condition, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const historyEligibleTables = tables.filter(
      (table) =>
        table.status !== "maintenance"
        && !["Overwatch", "Quiet Quest", "Final Turn"].includes(table.name),
    );
    const partySizeCycle = [2, 4, 3, 5, 6, 2, 7, 4, 1, 8] as const;
    const durationCycle = [45, 60, 75, 90, 120, 150, 180, 105] as const;
    const perTableRates = [18, 22, 26, 30] as const;
    const checkoutPattern = [1, 2, 3, 2, 1, 3, 2] as const;
    let checkoutCursor = 0;
    let sessionCounter = 0;

    for (let dayOffset = 30; dayOffset >= 1; dayOffset -= 1) {
      for (let slot = 0; slot < 2; slot += 1) {
        const partySize = partySizeCycle[sessionCounter % partySizeCycle.length] ?? 2;
        const candidateTables = historyEligibleTables.filter((table) => table.capacity >= partySize);
        const table = candidateTables[(sessionCounter + slot + dayOffset) % candidateTables.length] ?? candidateTables[0];
        if (!table) {
          throw new Error("No table available for seeded session");
        }

        const start = addDays(now, -dayOffset);
        start.setUTCHours(slot === 0 ? 15 + (dayOffset % 2) : 20 + (dayOffset % 2), (dayOffset * 13 + slot * 17) % 60, 0, 0);
        const durationMinutes = durationCycle[sessionCounter % durationCycle.length] ?? 90;
        const end = new Date(start.getTime() + durationMinutes * MINUTE_MS);
        const rateType = sessionCounter % 4 === 0 ? "per_table" : "per_person";
        const coverCharge = rateType === "per_table"
          ? perTableRates[sessionCounter % perTableRates.length] ?? perTableRates[0]
          : DEFAULT_COVER_CHARGE + (sessionCounter % 3);
        const totalCharge = rateType === "per_table" ? coverCharge : coverCharge * partySize;
        const partyName = guestNameAt(sessionCounter + 90);
        const sessionResult = insertSession.run(
          table.id,
          partyName,
          partySize,
          sqliteDateTime(start),
          sqliteDateTime(end),
          "completed",
          rateType,
          coverCharge,
          totalCharge,
          sessionCounter % 5 === 0 ? "Requested a quick rules overview before starting." : "",
        );
        const sessionId = Number(sessionResult.lastInsertRowid);
        const plannedCheckouts = checkoutPattern[sessionCounter % checkoutPattern.length] ?? 2;
        const selection = nextCheckoutTitles(plannedCheckouts, checkoutCursor, checkoutRotation);
        checkoutCursor = selection.nextCursor;

        selection.titles.forEach((title, checkoutIndex) => {
          const game = gameByTitle.get(title);
          if (!game) {
            throw new Error(`Missing seeded game: ${title}`);
          }

          const checkedOutAt = new Date(start.getTime() + checkoutIndex * 12 * MINUTE_MS);
          const returnedAt = new Date(end.getTime() - Math.max(5, (plannedCheckouts - checkoutIndex) * 7) * MINUTE_MS);
          insertCheckout.run(
            sessionId,
            game.id,
            sqliteDateTime(checkedOutAt),
            sqliteDateTime(returnedAt),
            historicalReturnCondition(sessionCounter + checkoutIndex),
            checkoutIndex === 0 ? "Staff recommended this title for the group size." : "",
          );
        });

        sessionCounter += 1;
      }
    }

    const activeSessionPlans = [
      { tableName: "Dragon's Den", partySize: 2, startedMinutesAgo: 35, rateType: "per_person", coverCharge: DEFAULT_COVER_CHARGE, titles: ["Catan"] },
      { tableName: "Guild Hall", partySize: 6, startedMinutesAgo: 55, rateType: "per_table", coverCharge: 26, titles: ["Wingspan", "Azul"] },
      { tableName: "Sunlit Strategy", partySize: 3, startedMinutesAgo: 70, rateType: "per_person", coverCharge: 6, titles: ["Codenames"] },
      { tableName: "Hidden Hex", partySize: 5, startedMinutesAgo: 95, rateType: "per_table", coverCharge: 30, titles: ["Root"] },
      { tableName: "Skyline Social", partySize: 4, startedMinutesAgo: 125, rateType: "per_person", coverCharge: DEFAULT_COVER_CHARGE, titles: ["Patchwork"] },
    ] as const;

    activeSessionPlans.forEach((plan, index) => {
      const table = tableByName(tables, plan.tableName);
      const startedAt = new Date(now.getTime() - plan.startedMinutesAgo * MINUTE_MS);
      const partyName = guestNameAt(index + 160);
      const sessionResult = insertSession.run(
        table.id,
        partyName,
        plan.partySize,
        sqliteDateTime(startedAt),
        null,
        "active",
        plan.rateType,
        plan.coverCharge,
        0,
        index === 1 ? "Celebrating a team win with a long table booking." : "",
      );
      const sessionId = Number(sessionResult.lastInsertRowid);

      plan.titles.forEach((title) => {
        const game = gameByTitle.get(title);
        if (!game) {
          throw new Error(`Missing seeded game: ${title}`);
        }
        insertCheckout.run(sessionId, game.id, sqliteDateTime(startedAt), null, null, "Currently in play.");
      });
    });

    db.exec(`
      UPDATE events
      SET rsvp_count = COALESCE((SELECT SUM(r.party_size) FROM rsvps r WHERE r.event_id = events.id), 0);

      UPDATE games
      SET copies_available = MAX(
            copies_total - COALESCE((
              SELECT COUNT(*)
              FROM game_checkouts gc
              WHERE gc.game_id = games.id
                AND gc.returned_at IS NULL
            ), 0),
            0
          ),
          needs_replacement = CASE
            WHEN condition_score <= 2 THEN 1
            WHEN COALESCE((SELECT COUNT(*) FROM game_checkouts gc WHERE gc.game_id = games.id), 0) >= replacement_threshold THEN 1
            ELSE 0
          END,
          updated_at = datetime('now');
    `);

    return currentCounts(db);
  })();
}
