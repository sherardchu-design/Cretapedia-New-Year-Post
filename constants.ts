import { CharacterName } from "./types.ts";

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

export const AUDIO_CONFIG = {
  BGM_URL: "https://ia800503.us.archive.org/15/items/ChineseNewYearMusic/Chinese%20New%20Year%20Music%20-%2001%20-%20Spring%20Festival%20Overture.mp3", 
  // 烟花绽放音效 - 生成成功时播放
  SUCCESS_SFX_URL: "https://ia801402.us.archive.org/16/items/firework_202201/fireworks.mp3", 
  // 清脆的木鱼声 - 点击交互时播放
  CLICK_SFX_URL: "https://ia902807.us.archive.org/29/items/sound_effects_202008/WoodBlock.mp3"
};