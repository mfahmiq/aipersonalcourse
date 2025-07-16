import { LessonJSON, LessonSection } from "./lessonTypes";

function stripGlobalMarkdownBlock(md: string): string {
  // Remove global code block ```markdown ... ``` if present
  if (md.trim().startsWith("```markdown")) {
    const lines = md.trim().split("\n");
    const endIdx = lines.lastIndexOf("```", 1);
    if (endIdx > 0) {
      return lines.slice(1, endIdx).join("\n");
    }
  }
  return md;
}

export function parseMarkdownToLessonJSON(
  markdown: string,
  meta: { id: string; title: string; description?: string }
): LessonJSON {
  markdown = stripGlobalMarkdownBlock(markdown);
  const sections: LessonSection[] = [];
  let buffer = "";
  const lines = markdown.split("\n");
  let mode: null | "video" | "image" = null;
  let blockBuffer: string[] = [];

  function flushBuffer() {
    if (buffer.trim()) {
      sections.push({ type: "markdown", data: buffer.trim() });
      buffer = "";
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Hapus parsing quiz dan flashcard
    // Parsing blok video dan image jika ada, sisanya markdown
    // (implementasi detail disesuaikan kebutuhan Anda)
    buffer += line + "\n";
  }
  flushBuffer();

  const now = new Date().toISOString();
  return {
    id: meta.id,
    title: meta.title,
    description: meta.description,
    sections,
    created_at: now,
    updated_at: now,
  };
} 