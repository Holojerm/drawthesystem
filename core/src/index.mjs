// @drawthesystem/core — shared brain of drawthesystem and the cloud product.
// Content exports live in separate subpaths because they resolve .md files:
//   @drawthesystem/core/content       (bundler entry: needs an .md-as-text rule)
//   @drawthesystem/core/content/node  (Node-only: reads the files with fs)
export { buildExcalidraw } from "./excalidraw.mjs";
export { summarizeExcalidraw, renderSummaryMarkdown } from "./read-excalidraw.mjs";
export * from "./bundle.mjs";
