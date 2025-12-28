import { CharacterName } from "./types";

// Note: In a production environment, API keys should be proxied or handled server-side
// to prevent exposure. For this standalone demo, we use the provided key.
export const DIFY_API_KEY = "app-jehf2wTtMhaNfYkGflbtXHFX";
export const DIFY_BASE_URL = "https://api.dify.ai/v1";

export const CHARACTERS = [
  { id: CharacterName.PIPI, label: "皮皮", desc: "活泼可爱" },
  { id: CharacterName.SHANDIAN, label: "闪电", desc: "聪明机智" },
  { id: CharacterName.TANGTANG, label: "糖糖", desc: "甜美贴心" },
  { id: CharacterName.ZACK, label: "Zack", desc: "帅气酷炫" },
  { id: CharacterName.BADOU, label: "八斗", desc: "憨厚老实" },
];

export const PLACEHOLDER_IMAGE = "https://picsum.photos/400/600";
