export type NodeKind =
  | "client"
  | "service"
  | "lb"
  | "cdn"
  | "db"
  | "cache"
  | "queue"
  | "storage"
  | "external"
  | "note";

export interface SpecNode {
  id: string;
  /** Defaults to `id`. Use \n for explicit line breaks; long lines wrap. */
  label?: string;
  /** Picks the colour; defaults to "service". */
  kind?: NodeKind;
  /** Column, 0 = leftmost. Defaults to 0. */
  layer?: number;
  /** Pins the node to a grid row within its layer (0 = top). */
  row?: number;
  /** Explicit position override. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Small grey caption rendered under the node. */
  note?: string;
}

export interface SpecEdge {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
  /** Forces a lane route around the diagram for a long/backward edge. */
  via?: "top" | "bottom";
}

export interface SpecGroup {
  label?: string;
  nodes?: string[];
}

export interface ExcalidrawSpec {
  /** Optional title rendered at top. */
  title?: string;
  nodes?: SpecNode[];
  edges?: SpecEdge[];
  groups?: SpecGroup[];
  /** Free-floating assumption/context notes, rendered bottom-left. */
  notes?: string[];
}

export interface ExcalidrawDocument {
  type: "excalidraw";
  version: 2;
  source: string;
  elements: Record<string, unknown>[];
  appState: { viewBackgroundColor: string; gridSize: number | null };
  files: Record<string, never>;
}

/**
 * Build a valid .excalidraw document from a graph spec (layered auto-layout,
 * orthogonal edge routing, coloured by node kind). Pure — no I/O.
 */
export declare function buildExcalidraw(spec: ExcalidrawSpec): ExcalidrawDocument;
