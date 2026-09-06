const SATURATION = 0.65;
const VALUE = 0.95;

// FNV-1a: fast, deterministic, synchronous — good enough for picking a
// display color, no need for a cryptographic hash here.
function hashHue(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 2 ** 32;
}

function hsvToHex(h: number, s: number, v: number): string {
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
  const toHex = (channel: number) => Math.round(channel * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export class Logger {
  private static readonly instances = new Map<string, Logger>();
  private readonly name: string;
  private readonly color: string;

  private constructor(name: string) {
    this.name = name;
    this.color = hsvToHex(hashHue(name), SATURATION, VALUE);
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
    if (import.meta.env.MODE === 'test') return;
    sink(`%c[${this.name}]%c ${message}`, `color: ${this.color}`, '', ...meta);
  }
}
