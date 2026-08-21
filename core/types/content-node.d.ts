import type { Content } from "./content.js";

/**
 * Read and parse the skill/rubric content with fs (Node/Bun only — Workers
 * consumers import "@drawthesystem/core/content" through a bundler instead).
 * `rootDir` defaults to the repo root (the package's parent directory).
 */
export declare function loadContent(rootDir?: string): Content;
