export type SourceResult<T> =
  | { status: "ok"; data: T }
  | { status: "unconfigured"; hint: string }
  | { status: "error"; message: string };

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  due: string | null; // ISO date or datetime
  url: string;
  doToday?: boolean;
  buckets?: string[];
  priority?: string | null;
  urgency?: string | null;
  recurring?: boolean;
  days?: string[];
  assignees?: string[]; // names from the Notion "Assignee" people property
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  location?: string;
  source: "google" | "outlook";
}

export interface ReminderItem {
  id: string;
  title: string;
  due: string | null;
  priority: number; // 0 = none, 1 highest .. 9 lowest
  list?: string;
  tags: string[];
}

export interface RemindersData {
  groceries: ReminderItem[] | null; // null = the Shortcut has never sent data for this target
  daily: ReminderItem[] | null;
  groceriesUpdatedAt: string | null;
  dailyUpdatedAt: string | null;
}

export interface WeatherData {
  temperature: number;
  tempMin: number;
  tempMax: number;
  precipitationChance: number;
  code: number;
  label: string;
  glyph: string;
}
