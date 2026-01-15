export type WorkingBreak = { start: string; end: string };

export type DayHours =
  | { closed: true }
  | { start: string; end: string; breaks?: WorkingBreak[] };

export type WorkingHours = {
  timezone: string; // "Europe/Istanbul"
  slotStepMin: number; // 15 | 30
  week: Record<string, DayHours>; // "0".."6" (0=Pazar)
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  timezone: "Europe/Istanbul",
  slotStepMin: 30,
  week: {
    "0": { closed: true },
    "1": { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] },
    "2": { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] },
    "3": { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] },
    "4": { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] },
    "5": { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] },
    "6": { start: "10:00", end: "20:00", breaks: [] },
  },
};
