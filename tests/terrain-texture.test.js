import assert from "node:assert/strict";
import test from "node:test";

import {
  TERRAIN_TEXTURE_SOURCE,
  clearTerrainTextureCache,
  loadTerrainTexture
} from "../js/data/terrainTexture.js";

class SuccessfulImage {
  static constructions = 0;

  constructor() {
    SuccessfulImage.constructions += 1;
    this.naturalHeight = TERRAIN_TEXTURE_SOURCE.height;
    this.naturalWidth = TERRAIN_TEXTURE_SOURCE.width;
  }

  set src(value) {
    this.source = value;
    globalThis.queueMicrotask(() => this.onload());
  }
}

test("terrain texture loader shares one same-origin image request", async () => {
  clearTerrainTextureCache();
  SuccessfulImage.constructions = 0;

  const firstPromise = loadTerrainTexture({ ImageClass: SuccessfulImage });
  const secondPromise = loadTerrainTexture({ ImageClass: SuccessfulImage });
  const [first, second] = await Promise.all([firstPromise, secondPromise]);

  assert.equal(firstPromise, secondPromise);
  assert.equal(first, second);
  assert.equal(SuccessfulImage.constructions, 1);
  assert.match(
    first.image.source,
    /assets\/maps\/northwest-pacific-terrain-v1\.webp$/u
  );
  clearTerrainTextureCache();
});

test("failed terrain image loads are evicted and can retry", async () => {
  let attempts = 0;
  class FlakyImage extends SuccessfulImage {
    set src(value) {
      this.source = value;
      attempts += 1;
      globalThis.queueMicrotask(() => {
        if (attempts === 1) {
          this.onerror();
        } else {
          this.onload();
        }
      });
    }
  }

  clearTerrainTextureCache();
  await assert.rejects(
    loadTerrainTexture({ ImageClass: FlakyImage }),
    /地形影像載入失敗/u
  );
  const texture = await loadTerrainTexture({ ImageClass: FlakyImage });

  assert.equal(attempts, 2);
  assert.equal(texture.image.naturalWidth, TERRAIN_TEXTURE_SOURCE.width);
  clearTerrainTextureCache();
});
