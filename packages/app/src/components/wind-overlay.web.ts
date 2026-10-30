/// <reference lib="dom" />
import type { ImageSource, Map as MapLibreMap } from 'maplibre-gl';
import { sampleWind, speedColor, type WindField } from '../format/wind-field';

const SOURCE_ID = 'hawa-wind';
const LAYER_ID = 'hawa-wind-speed';
const WASH_OPACITY = 0.6;
const OPAQUE = 255;
const PARTICLE_COUNT = 900;
const MAX_AGE_FRAMES = 90;
const PIXELS_PER_KMH_PER_FRAME = 0.035;
const TRAIL_FADE = 'rgba(0, 0, 0, 0.07)';
const LINE_COLOR = 'rgba(255, 255, 255, 0.85)';
const LINE_WIDTH = 1.2;

type Corner = [number, number];

interface Particle {
  x: number;
  y: number;
  age: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function washImage(field: WindField): string {
  const { grid } = field;
  const canvas = document.createElement('canvas');
  canvas.width = grid.nLon;
  canvas.height = grid.nLat;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(grid.nLon, grid.nLat);
  for (let iLat = 0; iLat < grid.nLat; iLat++) {
    const row = grid.nLat - 1 - iLat;
    for (let iLon = 0; iLon < grid.nLon; iLon++) {
      const i = iLat * grid.nLon + iLon;
      const [r, g, b] = speedColor(Math.hypot(field.u[i]!, field.v[i]!));
      const p = (row * grid.nLon + iLon) * 4;
      image.data[p] = r;
      image.data[p + 1] = g;
      image.data[p + 2] = b;
      image.data[p + 3] = OPAQUE;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function washCorners(field: WindField): [Corner, Corner, Corner, Corner] {
  const { grid } = field;
  const half = grid.step / 2;
  const west = grid.lonMin - half;
  const east = grid.lonMin + (grid.nLon - 1) * grid.step + half;
  const south = grid.latMin - half;
  const north = grid.latMin + (grid.nLat - 1) * grid.step + half;
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}

export class WindOverlay {
  private field: WindField | null = null;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private frame: number | null = null;
  private moving = false;

  constructor(private readonly map: MapLibreMap) {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
    });
    map.getCanvasContainer().appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    map.on('resize', this.resize);
    map.on('movestart', this.onMoveStart);
    map.on('moveend', this.onMoveEnd);
  }

  setField(field: WindField): void {
    this.field = field;
    this.whenStyleReady(() => this.showWash(field));
    this.seed();
    if (this.frame === null && !prefersReducedMotion()) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  hide(): void {
    this.field = null;
    this.stop();
    this.clear();
    if (this.map.getLayer(LAYER_ID)) {
      this.map.removeLayer(LAYER_ID);
    }
    if (this.map.getSource(SOURCE_ID)) {
      this.map.removeSource(SOURCE_ID);
    }
  }

  destroy(): void {
    this.stop();
    this.map.off('resize', this.resize);
    this.map.off('movestart', this.onMoveStart);
    this.map.off('moveend', this.onMoveEnd);
    this.canvas.remove();
  }

  private whenStyleReady(run: () => void): void {
    if (this.map.isStyleLoaded()) {
      run();
    } else {
      this.map.once('idle', run);
    }
  }

  private showWash(field: WindField): void {
    if (this.field !== field) {
      return;
    }
    const url = washImage(field);
    const coordinates = washCorners(field);
    const source = this.map.getSource(SOURCE_ID) as ImageSource | undefined;
    if (source !== undefined) {
      source.updateImage({ url, coordinates });
      return;
    }
    this.map.addSource(SOURCE_ID, { type: 'image', url, coordinates });
    const firstLabel = this.map
      .getStyle()
      .layers.find(layer => layer.type === 'symbol');
    this.map.addLayer(
      {
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        paint: {
          'raster-opacity': WASH_OPACITY,
          'raster-resampling': 'linear',
          'raster-fade-duration': 0,
        },
      },
      firstLabel?.id,
    );
  }

  private readonly resize = (): void => {
    const { clientWidth, clientHeight } = this.map.getContainer();
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = clientWidth * ratio;
    this.canvas.height = clientHeight * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.seed();
  };

  private readonly onMoveStart = (): void => {
    this.moving = true;
    this.clear();
  };

  private readonly onMoveEnd = (): void => {
    this.moving = false;
    this.seed();
  };

  private randomParticle(): Particle {
    const { clientWidth, clientHeight } = this.map.getContainer();
    return {
      x: Math.random() * clientWidth,
      y: Math.random() * clientHeight,
      age: Math.floor(Math.random() * MAX_AGE_FRAMES),
    };
  }

  private seed(): void {
    this.particles = Array.from({ length: PARTICLE_COUNT }, () =>
      this.randomParticle(),
    );
  }

  private clear(): void {
    const { clientWidth, clientHeight } = this.map.getContainer();
    this.ctx.clearRect(0, 0, clientWidth, clientHeight);
  }

  private stop(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  private readonly tick = (): void => {
    this.frame = requestAnimationFrame(this.tick);
    const field = this.field;
    if (field === null || this.moving) {
      return;
    }
    const { clientWidth, clientHeight } = this.map.getContainer();
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = TRAIL_FADE;
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();

    this.particles = this.particles.map(particle => {
      const at = this.map.unproject([particle.x, particle.y]);
      const wind = sampleWind(field, at.lat, at.lng);
      if (wind === null || particle.age > MAX_AGE_FRAMES) {
        return this.randomParticle();
      }
      const x = particle.x + wind.u * PIXELS_PER_KMH_PER_FRAME;
      const y = particle.y - wind.v * PIXELS_PER_KMH_PER_FRAME;
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(x, y);
      return { x, y, age: particle.age + 1 };
    });
    ctx.stroke();
  };
}
