declare module "@github/copilot-sdk/extension" {
  export type CanvasJsonSchema = Record<string, unknown>;

  export interface CanvasProviderOpenRequest {
    sessionId: string;
    extensionId: string;
    canvasId: string;
    instanceId: string;
    input?: unknown;
  }

  export interface CanvasProviderCloseRequest {
    sessionId: string;
    extensionId: string;
    canvasId: string;
    instanceId: string;
  }

  export interface CanvasProviderInvokeActionRequest {
    sessionId: string;
    extensionId: string;
    canvasId: string;
    instanceId: string;
    actionName: string;
    input?: unknown;
  }

  export interface CanvasAction {
    name: string;
    description?: string;
    inputSchema?: CanvasJsonSchema;
    handler: (context: CanvasProviderInvokeActionRequest) => Promise<unknown>;
  }

  export interface CanvasOptions {
    id: string;
    displayName: string;
    description: string;
    inputSchema?: CanvasJsonSchema;
    actions?: CanvasAction[];
    open: (context: CanvasProviderOpenRequest) =>
      | Promise<{ url?: string; title?: string; status?: string }>
      | {
          url?: string;
          title?: string;
          status?: string;
        };
    onClose?: (context: CanvasProviderCloseRequest) => Promise<void> | void;
  }

  export class CanvasError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
  }

  export function createCanvas(options: CanvasOptions): unknown;

  export function joinSession(options: { canvases: unknown[] }): Promise<{
    workspacePath?: string;
    log: (
      message: string,
      options?: { level?: "debug" | "info" | "warning" | "error"; ephemeral?: boolean },
    ) => Promise<void>;
  }>;
}
