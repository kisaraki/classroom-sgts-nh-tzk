export const TERRAIN_TEXTURE_SOURCE = Object.freeze({
  assetUrl: new URL(
    "../../assets/maps/northwest-pacific-terrain-v1.webp",
    import.meta.url
  ),
  bounds: Object.freeze({
    maxLat: 40,
    maxLon: 160,
    minLat: 0,
    minLon: 100
  }),
  height: 1600,
  id: "natural-earth-ii-northwest-pacific-v1",
  projection: "equirectangular",
  width: 2400
});

let terrainTexturePromise = null;

export const clearTerrainTextureCache = () => {
  terrainTexturePromise = null;
};

export const loadTerrainTexture = ({
  ImageClass = globalThis.Image,
  source = TERRAIN_TEXTURE_SOURCE
} = {}) => {
  if (terrainTexturePromise) {
    return terrainTexturePromise;
  }

  if (typeof ImageClass !== "function") {
    return Promise.reject(
      new TypeError("此執行環境不支援地形影像載入。")
    );
  }

  const pending = new Promise((resolve, reject) => {
    const image = new ImageClass();
    image.decoding = "async";
    image.onload = () => {
      if (
        image.naturalWidth !== source.width ||
        image.naturalHeight !== source.height
      ) {
        reject(new Error("地形影像尺寸與來源中繼資料不符。"));
        return;
      }

      resolve(Object.freeze({ image, source }));
    };
    image.onerror = () => {
      reject(new Error("Natural Earth II 地形影像載入失敗。"));
    };
    image.src = source.assetUrl.href;
  });

  terrainTexturePromise = pending;
  pending.catch(() => {
    if (terrainTexturePromise === pending) {
      terrainTexturePromise = null;
    }
  });
  return pending;
};
