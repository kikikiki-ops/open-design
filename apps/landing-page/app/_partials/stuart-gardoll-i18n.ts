/*
 * i18n data for the Stuart Gardoll customer story (/stories/stuart-gardoll) and
 * its card on the stories index (/stories/). English-first: only `en` is filled,
 * so every locale falls back to English until translations land — the story
 * pages and the index card both resolve with `X[locale] ?? X.en`. Add locales
 * here (mirroring ikigai-one-i18n.ts) when the localized copy is ready.
 */
import en from "./stuart-gardoll-main.html?raw";

export const STORY_BODY: Record<string, string> = { en };

export interface StoryMeta { title: string; description: string }
export const STORY_META: Record<string, StoryMeta> = {
  "en": { title: "“I go to Open Design first” — Stuart Gardoll", description: "Stuart Gardoll — solo AI builder and the Let’s Build YouTuber — ships app UI, motion graphics, and prototypes in Open Design, on whatever model he chooses." },
};

export interface StoryCard { title: string; blurb: string }
export const STORY_CARD: Record<string, StoryCard> = {
  "en": { title: "“I go to Open Design first”", blurb: "A solo AI builder and the Let’s Build YouTuber ships apps and motion graphics in Open Design — the creative surface he opens first, on whatever model he chooses." },
};
