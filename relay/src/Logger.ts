import { createHash } from 'node:crypto';

const SATURATION = 0.65;
const VALUE = 0.95;

function hueFor(name: string): number {
  const digest = createHash('sha256').update(name).digest();
  return digest.readUInt32BE(0) / 2 ** 32;
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const [r, g, b] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export class Logger {
  private static readonly instances = new Map<string, Logger>();
  private readonly name: string;
  private readonly ansiColor: string;

  private constructor(name: string) {
    this.name = name;
    const [r, g, b] = hsvToRgb(hueFor(name), SATURATION, VALUE);
    this.ansiColor = `\x1b[38;2;${r};${g};${b}m`;
  }

  static get(name: string): Logger {
    let instance = Logger.instances.get(name);
    if (!instance) {
      instance = new Logger(name);
      Logger.instances.set(name, instance);
    }
    return instance;
  }

  debug(message: string, ...meta: unknown[]): void {
    this.emit(console.debug, message, meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.emit(console.info, message, meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.emit(console.warn, message, meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.emit(console.error, message, meta);
  }

  private emit(sink: (...args: unknown[]) => void, message: string, meta: unknown[]): void {
    if (process.env.VITEST) return;
    sink(`${this.ansiColor}[${this.name}]\x1b[0m ${message}`, ...meta);
  }
}
