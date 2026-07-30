export const PROJECT_CONFIG = Object.freeze({
  id: "sgts-nh",
  title: "風暴創世神：北半球颱風模擬器",
  englishTitle: "Storm Genesis: Northern Hemisphere Typhoon Simulator",
  edition: "西北太平洋篇",
  brand: "KOSMOS TOOLKIT｜探真拓知酷",
  repository: "kisaraki/classroom-sgts-nh-tzk",
  pagesUrl: "https://kisaraki.github.io/classroom-sgts-nh-tzk/",
  buildCommit: "local-development",
  schemaVersion: 1,
  modelVersion: "0.7.0-taiwan-wayne",
  geography: Object.freeze({
    bounds: Object.freeze({
      maxLat: 40,
      maxLon: 160,
      minLat: 0,
      minLon: 100
    }),
    graticuleDegrees: 5,
    gridResolutionDegrees: 1
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
  environmentConfig: Object.freeze({
    backgroundFlowU: -1.2,
    backgroundFlowV: 0.2,
    baseOceanHeatContent: 0.88,
    baseSeaSurfaceTemperature: 30,
    baseSurfacePressure: 1010,
    highEastwardTurnMaximum: 6.2,
    highInfluenceLongitudeSpan: 12,
    highInfluenceLatitudeSpan: 8,
    highPressureAnomalyMaximum: 5,
    highPolewardFlowMaximum: 2.5,
    highWestwardFlowMaximum: 5.8,
    humidityBase: 0.68,
    humidityMonsoonContribution: 0.22,
    latitudeOceanHeatLoss: 0.012,
    latitudeTemperatureLoss: 0.13,
    monsoonTroughPressureDropMaximum: 5,
    monsoonUMaximum: 3.8,
    monsoonVMaximum: 3.3,
    oceanHeatContentMinimum: 0.25,
    pressureNoiseMaximum: 0.45,
    roughnessLand: 0.42,
    roughnessOcean: 0.03,
    seaSurfaceTemperatureMinimum: 24,
    steeringNoiseMaximum: 0.12,
    terrainPlaceholderLandHeight: 120
  }),
  environmentControls: Object.freeze({
    subtropicalHighIntensity: Object.freeze({
      defaultValue: 0.72,
      maximum: 1,
      minimum: 0,
      responseHours: 12,
      step: 0.05,
      unit: "%"
    }),
    subtropicalHighWestwardExtent: Object.freeze({
      defaultValue: 128,
      maximum: 150,
      minimum: 112,
      responseHours: 18,
      step: 1,
      unit: "°E"
    }),
    subtropicalHighRidgeLatitude: Object.freeze({
      defaultValue: 26,
      maximum: 34,
      minimum: 20,
      responseHours: 18,
      step: 1,
      unit: "°N"
    }),
    southwestMonsoonIntensity: Object.freeze({
      defaultValue: 0.38,
      maximum: 1,
      minimum: 0,
      responseHours: 9,
      step: 0.05,
      unit: "%"
    }),
    southwestMonsoonMoisture: Object.freeze({
      defaultValue: 0.78,
      maximum: 0.95,
      minimum: 0.5,
      responseHours: 9,
      step: 0.05,
      unit: "%"
    }),
    verticalWindShear: Object.freeze({
      defaultValue: 7,
      maximum: 30,
      minimum: 0,
      responseHours: 6,
      step: 1,
      unit: "m/s"
    })
  }),
  steeringConfig: Object.freeze({
    betaDriftU: -0.45,
    betaDriftV: 0.65,
    maximumPathSegmentKm: 3,
    maximumTranslationSpeedKmh: 45,
    perturbationMaximumMps: 0.14,
    responseHours: 3,
    vectorDisplayScale: 5
  }),
  landInteractionConfig: Object.freeze({
    centralMountainHeight: 2600,
    coastRangeHeight: 1200,
    eastRiftValleyHeight: 350,
    genericLandHeight: 120,
    maximumPathSamples: 96,
    minimumReorganizationFactor: 0.35,
    organizationLossPerHour: 0.055,
    pathSampleKm: 0.5,
    reorganizationDelayHours: 9,
    roughness: Object.freeze({
      centralMountains: 0.82,
      coastRange: 0.68,
      eastRiftValley: 0.48,
      genericLand: 0.42,
      westPlain: 0.58
    }),
    symmetryLossPerHour: 0.08,
    westPlainHeight: 120,
    windLossPerHour: 1.65
  }),
  oceanCoolingConfig: Object.freeze({
    coolingRateCelsiusPerHour: 0.34,
    coverageRadiusMultiplier: 1,
    maximumColdWake: 5,
    minimumCoverageRadiusKm: 70,
    minimumEffectiveSST: 22,
    recoveryHours: 240,
    referenceWindMps: 50,
    slowSpeedScaleKmh: 12
  }),
  rainfallConfig: Object.freeze({
    asymmetryFloor: 0.72,
    coldWakeRainPenaltyMaximum: 0.35,
    maximumRainRateMmPerHour: 60,
    minimumRainRadiusKm: 120,
    monsoonContribution: 0.45,
    radialRadiusMultiplier: 2.2,
    rainShadowMinimum: 0.42,
    terrainLiftMaximum: 2.2
  }),
  observationConfig: Object.freeze({
    gustFactor: 1.32,
    innerWindRadiusFraction: 0.62,
    maximumGustMps: 95,
    maximumSustainedWindMps: 75,
    terrainShelterMaximum: 0.45,
    windDecayRadiusMultiplier: 1.35
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
    demoSeed: "sgts-nh-phase-5",
    demoTyphoon: Object.freeze({
      centralPressure: 955,
      galeRadius: 180,
      heading: 275,
      lat: 23.5,
      lon: 124.5,
      maxWind: 42,
      moisture: 0.82,
      name: "KOSMOS-05",
      organization: 0.78,
      structureStage: "comma",
      symmetry: 0.74,
      translationSpeed: 12
    })
  }),
  renderingConfig: Object.freeze({
    currentVectorDisplayScale: 8,
    fieldArrowHeadPixels: 4,
    fieldArrowMaximumPixels: 18,
    fieldArrowSpacingDegrees: 5,
    fieldArrowVectorScale: 3.2,
    highRangeLatitudeRadius: 7,
    highRangeLongitudeRadius: 15,
    isobarCount: 3,
    monsoonTroughLatitude: 13,
    particleAngularSpeed: 0.0018,
    particleCount: 700,
    particleProfiles: Object.freeze({
      high: 1200,
      low: 300,
      medium: 700
    }),
    particleMaximumRadiusScale: 1.35,
    particleMinimumRadiusScale: 0.28,
    particleSeed: "sgts-nh-phase-6-visual",
    coldWakeTileMinimum: 0.04,
    rainfallMaximumDisplayRate: 45,
    particlesEnabled: true,
    stormMaximumPixelRadius: 64,
    stormMinimumPixelRadius: 18,
    stormRadiusKilometreScale: 7,
    temperatureTileDegrees: 5,
    trackMaximumPoints: 360
  }),
  performanceConfig: Object.freeze({
    dashboardUpdateEverySteps: 1,
    eventHistoryMaximumEntries: 720,
    frameSampleWindow: 600,
    trackRecordEverySteps: 6
  }),
  disclaimer:
    "本系統為科學教育與遊戲化模擬工具，不適用於真實天氣預報、防災決策或任何安全關鍵用途。"
});
