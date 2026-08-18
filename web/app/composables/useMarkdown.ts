import { marked } from "marked";
export function renderMarkdown(md: string | null | undefined) {
  if (!md) return "";
  return marked.parse(md, { gfm: true, breaks: false }) as string;
}
