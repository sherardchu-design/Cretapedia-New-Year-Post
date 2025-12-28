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
  // 替换为您喜欢的粤语新年歌 MP3 链接
  // 示例链接为免版权喜庆音乐，建议替换为具体的《财神到》或《恭喜发财》链接
  BGM_URL: "https://ia800403.us.archive.org/21/items/CNY_Music/GongXiGongXi.mp3", 
  // 烟花/成功音效
  SUCCESS_SFX_URL: "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3" 
};