export interface SummaryNode {
  id: string;
  type: string;
  label: string | null;
  x: number;
  y: number;
  /** Name of the enclosing container shape, if any. */
  container: string | null;
  color: string;
}

export interface SummaryContainer {
  label: string | null;
  members: string[];
}

export interface SummaryEdge {
  from: string;
  to: string;
  label: string | null;
  style: string;
  bidirectional: boolean;
  dangling: boolean;
}

export interface DiagramSummary {
  /** The label passed via opts.file, or "(document)". */
  file: string;
  nodes: SummaryNode[];
  containers: SummaryContainer[];
  edges: SummaryEdge[];
  floating_text: string[];
  stats: {
    shapes: number;
    arrows: number;
    unlabelled_shapes: number;
    dangling_arrows: number;
  };
}

/**
 * Summarise a parsed .excalidraw document (the JSON object, not a path) into
 * nodes/containers/edges/floating text so an agent can critique the diagram.
 */
export declare function summarizeExcalidraw(
  doc: unknown,
  opts?: { file?: string },
): DiagramSummary;

/** Render a summary as the human/agent-readable markdown report. */
export declare function renderSummaryMarkdown(summary: DiagramSummary): string;
