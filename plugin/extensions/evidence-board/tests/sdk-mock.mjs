export class CanvasError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function createCanvas(options) {
  globalThis.__agentproofTestCanvas = options;
  return options;
}

export async function joinSession(options) {
  globalThis.__agentproofTestJoin = options;
  return {
    workspacePath: undefined,
    async log() {},
  };
}
