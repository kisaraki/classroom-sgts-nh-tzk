export const PROJECT_CONFIG = Object.freeze({
  id: "sgts-nh",
  title: "風暴創世神：北半球颱風模擬器",
  englishTitle: "Storm Genesis: Northern Hemisphere Typhoon Simulator",
  edition: "西北太平洋篇",
  brand: "KOSMOS TOOLKIT｜探真拓知酷",
  repository: "kisaraki/classroom-sgts-nh-tzk",
  pagesUrl: "https://kisaraki.github.io/classroom-sgts-nh-tzk/",
  schemaVersion: 1,
  modelVersion: "0.2.0-geography",
  geography: Object.freeze({
    bounds: Object.freeze({
      maxLat: 40,
      maxLon: 160,
      minLat: 0,
      minLon: 100
    }),
    graticuleDegrees: 5
  }),
  simulation: Object.freeze({
    maxCatchUpSteps: 8,
    maxFrameDeltaMs: 250,
    realStepMs: 1000,
    speeds: Object.freeze([1, 4, 12, 24]),
    stepMinutes: 10
  }),
  disclaimer:
    "本系統為科學教育與遊戲化模擬工具，不適用於真實天氣預報、防災決策或任何安全關鍵用途。"
});
