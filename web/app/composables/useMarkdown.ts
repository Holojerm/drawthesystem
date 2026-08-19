import { marked } from "marked";
export function renderMarkdown(md: string | null | undefined) {
  if (!md) return "";
  return marked.parse(md, { gfm: true, breaks: false }) as string;
}
/** Inline-only markdown (bold, code, links) for list items rendered outside a prose block. */
export function renderInline(md: string | null | undefined) {
  if (!md) return "";
  return marked.parseInline(md, { gfm: true, breaks: false }) as string;
}
