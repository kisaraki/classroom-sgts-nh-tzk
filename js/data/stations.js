export const WEATHER_STATIONS = Object.freeze(
  [
    {
      elevation: 27.5,
      exposure: 0.9,
      id: "naha",
      isVirtual: false,
      lat: 26.2072,
      lon: 127.6872,
      name: "那霸",
      region: "ryukyu",
      source: {
        authority: "Japan Meteorological Agency",
        stationCode: "47936",
        url: "https://www.data.jma.go.jp/env/ozonehp/en/nmhs/station.html"
      }
    },
    {
      elevation: 5.3,
      exposure: 0.72,
      id: "taipei",
      isVirtual: false,
      lat: 25.0377,
      lon: 121.5149,
      name: "臺北",
      region: "north",
      source: {
        authority: "中央氣象署",
        stationCode: "46692",
        url: "https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf"
      }
    },
    {
      elevation: 84.04,
      exposure: 0.7,
      id: "taichung",
      isVirtual: false,
      lat: 24.1457,
      lon: 120.6841,
      name: "臺中",
      region: "central",
      source: {
        authority: "中央氣象署",
        stationCode: "46749",
        url: "https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf"
      }
    },
    {
      elevation: 1017.5,
      exposure: 0.58,
      id: "sun-moon-lake",
      isVirtual: false,
      lat: 23.8813,
      lon: 120.9081,
      name: "日月潭",
      region: "central-mountain",
      source: {
        authority: "中央氣象署",
        stationCode: "46765",
        url: "https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf"
      }
    },
    {
      elevation: 16.1,
      exposure: 0.86,
      id: "hualien",
      isVirtual: false,
      lat: 23.9751,
      lon: 121.6133,
      name: "花蓮",
      region: "east",
      source: {
        authority: "中央氣象署",
        stationCode: "46699",
        url: "https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf"
      }
    },
    {
      elevation: 10.7,
      exposure: 0.95,
      id: "penghu",
      isVirtual: false,
      lat: 23.5655,
      lon: 119.5631,
      name: "澎湖",
      region: "offshore-west",
      source: {
        authority: "中央氣象署",
        stationCode: "46735",
        url: "https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf"
      }
    }
  ].map((station) =>
    Object.freeze({
      ...station,
      source: Object.freeze({ ...station.source })
    })
  )
);
