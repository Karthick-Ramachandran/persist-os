import { Readable, Writable } from "node:stream";

/**
 * Fake prompt streams for tests. Feeds the next queued line each time a
 * question prompt is written — mirroring a human typing after seeing each
 * prompt — which avoids the readline hang that pre-fed input causes on
 * sequential questions. Never ends the stream; destroy it in afterEach.
 */
export class FeedOnPrompt extends Writable {
  readonly input: Readable;

  text = "";

  private queue: string[];

  private fedThrough = 0;

  constructor(lines: string[]) {
    super();
    this.queue = [...lines];
    this.input = new Readable({ read() {} });
  }

  override _write(
    chunk: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.text += String(chunk);

    if (this.queue.length > 0 && this.text.length > this.fedThrough && /\]\s$/u.test(this.text)) {
      this.fedThrough = this.text.length;
      const next = this.queue.shift() ?? "";
      this.input.push(`${next}\n`);
    }

    callback();
  }

  written(): string {
    return this.text;
  }

  destroyInput(): void {
    this.input.destroy();
  }
}
