export const PROJECT_CONFIG = Object.freeze({
  id: "sgts-nh",
  title: "風暴創世神：北半球颱風模擬器",
  englishTitle: "Storm Genesis: Northern Hemisphere Typhoon Simulator",
  edition: "西北太平洋篇",
  brand: "KOSMOS TOOLKIT｜探真拓知酷",
  repository: "kisaraki/classroom-sgts-nh-tzk",
  pagesUrl: "https://kisaraki.github.io/classroom-sgts-nh-tzk/",
  schemaVersion: 1,
  modelVersion: "0.3.0-intensity",
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
  physicalConstants: Object.freeze({
    coriolisFullLatitude: 12,
    coriolisMinimumLatitude: 2,
    oceanHeatContentFull: 0.85,
    seaSurfaceTemperatureFull: 30,
    seaSurfaceTemperatureMinimum: 25.5
  }),
  modelParameters: Object.freeze({
    activeWindMinimum: 8,
    coldWakeFullPenalty: 3,
    coldWakePenaltyMaximum: 0.7,
    galeRadiusMaximum: 420,
    galeRadiusMinimum: 45,
    galeRadiusResponseHours: 18,
    galeRadiusStageFactors: Object.freeze({
      cluster: 0.82,
      comma: 1.08,
      decaying: 1.2,
      eye: 0.92,
      spiral: 1
    }),
    galeRadiusWindScale: 3.2,
    intensityNoiseMpsPerHour: 0.08,
    intensityResponseHours: 36,
    landPenaltyMaximum: 0.92,
    maximumDecreasePerStep: 0.65,
    maximumIncreasePerStep: 0.42,
    maximumWind: 85,
    minimumWind: 5,
    moistureFull: 0.82,
    moistureMinimum: 0.42,
    organizationMaximumChangePerStep: 0.025,
    organizationResponseHours: 24,
    pressureMaximum: 1010,
    pressureMinimum: 880,
    pressureOrganizationWeight: 0.25,
    pressureWindExponent: 1.35,
    shearFullPenalty: 25,
    shearLowPenalty: 5,
    structurePotentialFloor: 0.5,
    symmetryMaximumChangePerStep: 0.04,
    symmetryOrganizationFloor: 0.35,
    structureHysteresis: Object.freeze({
      commaEnterOrganization: 0.52,
      commaEnterWind: 24,
      commaExitOrganization: 0.42,
      commaExitSymmetry: 0.35,
      decayEnterPotential: 0.12,
      decayEnterWind: 20,
      decayExitOrganization: 0.25,
      decayExitPotential: 0.28,
      eyeEnterOrganization: 0.78,
      eyeEnterSymmetry: 0.72,
      eyeEnterWind: 40,
      eyeExitOrganization: 0.66,
      eyeExitSymmetry: 0.58,
      eyeExitWind: 34,
      spiralEnterOrganization: 0.35,
      spiralEnterWind: 15,
      spiralExitOrganization: 0.25
    }),
    terrainPenaltyHeight: 2600
  }),
  gameBalance: Object.freeze({
    demoEnvironment: Object.freeze({
      coldWake: 0,
      landFraction: 0,
      oceanHeatContent: 0.82,
      relativeHumidity: 0.78,
      seaSurfaceTemperature: 29,
      surfacePressure: 1010,
      surfaceRoughness: 0.03,
      terrainHeight: 0,
      verticalWindShear: 6
    }),
    demoSeed: "sgts-nh-phase-3",
    demoTyphoon: Object.freeze({
      centralPressure: 1004,
      galeRadius: 80,
      heading: 315,
      lat: 15,
      lon: 135,
      maxWind: 15,
      moisture: 0.72,
      name: "KOSMOS-03",
      organization: 0.28,
      structureStage: "cluster",
      symmetry: 0.32,
      translationSpeed: 0
    })
  }),
  renderingConfig: Object.freeze({
    particleAngularSpeed: 0.0018,
    particleCount: 140,
    particleMaximumRadiusScale: 1.35,
    particleMinimumRadiusScale: 0.28,
    particleSeed: "sgts-nh-phase-3-visual",
    particlesEnabled: true,
    stormMaximumPixelRadius: 64,
    stormMinimumPixelRadius: 18,
    stormRadiusKilometreScale: 7,
    trackMaximumPoints: 360
  }),
  performanceConfig: Object.freeze({
    dashboardUpdateEverySteps: 1,
    eventHistoryMaximumEntries: 720,
    trackRecordEverySteps: 6
  }),
  disclaimer:
    "本系統為科學教育與遊戲化模擬工具，不適用於真實天氣預報、防災決策或任何安全關鍵用途。"
});
