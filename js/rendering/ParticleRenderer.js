import { PROJECT_CONFIG } from "../config.js";
import { geoToCanvas } from "../utils/geo.js";
import { SeededRandom } from "../utils/random.js";
import {
  particleAngleAt,
  resolveTyphoonVisualMetrics
} from "./TyphoonVisuals.js";

const TAU = Math.PI * 2;

export class ParticleRenderer {
  #enabled;
  #particles;
  #seed;

  constructor({
    count = PROJECT_CONFIG.renderingConfig.particleCount,
    enabled = PROJECT_CONFIG.renderingConfig.particlesEnabled,
    random = null,
    seed = PROJECT_CONFIG.renderingConfig.particleSeed
  } = {}) {
    this.#enabled = Boolean(enabled);
    this.#seed = seed;
    this.#particles = this.#createParticles(
      count,
      random ?? new SeededRandom(seed)
    );
  }

  get count() {
    return this.#particles.length;
  }

  setCount(count) {
    if (!Number.isInteger(count) || count < 0 || count > 2000) {
      throw new RangeError("Particle count must be an integer from 0 to 2000.");
    }

    this.#particles = this.#createParticles(
      count,
      new SeededRandom(this.#seed)
    );
  }

  #createParticles(count, random) {
    if (!Number.isInteger(count) || count < 0 || count > 2000) {
      throw new RangeError("Particle count must be an integer from 0 to 2000.");
    }

    return Array.from({ length: count }, () =>
      Object.freeze({
        angle: random.nextRange(0, TAU),
        alpha: random.nextRange(0.12, 0.68),
        radiusScale: random.nextRange(
          PROJECT_CONFIG.renderingConfig.particleMinimumRadiusScale,
          PROJECT_CONFIG.renderingConfig.particleMaximumRadiusScale
        ),
        size: random.nextRange(0.7, 2.2),
        speedScale: random.nextRange(0.65, 1.45)
      })
    );
  }

  get enabled() {
    return this.#enabled;
  }

  setEnabled(enabled) {
    this.#enabled = Boolean(enabled);
  }

  draw({
    bounds,
    context,
    height,
    padding,
    simulationMinutes,
    typhoon,
    width
  }) {
    if (!this.#enabled || !typhoon) {
      return;
    }

    const center = geoToCanvas(typhoon, {
      bounds,
      height,
      padding,
      width
    });
    const visual = resolveTyphoonVisualMetrics(typhoon);
    const stormRadius = visual.radius;

    context.save();
    context.fillStyle = "#d9f9ff";

    for (const particle of this.#particles) {
      const angle = particleAngleAt({
        angle: particle.angle,
        lat: typhoon.lat,
        simulationMinutes,
        speedScale: particle.speedScale
      });
      const radius = stormRadius * particle.radiusScale;
      context.globalAlpha = particle.alpha * visual.opacity;
      context.beginPath();
      context.arc(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius * 0.72,
        particle.size,
        0,
        TAU
      );
      context.fill();
    }

    context.restore();
  }
}
