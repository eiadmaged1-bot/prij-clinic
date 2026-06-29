import { normalizeText } from "./text-normalizer";

export type TextChunkInput = {
  text: string;
  maxWords?: number;
  overlapWords?: number;
};

export type TextChunk = {
  chunkIndex: number;
  heading: string;
  text: string;
  normalizedText: string;
  tokenEstimate: number;
};

export function chunkText({ text, maxWords = 180, overlapWords = 35 }: TextChunkInput): TextChunk[] {
  const cleaned = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  const chunks: TextChunk[] = [];
  let index = 0;
  let chunkIndex = 0;

  while (index < words.length) {
    const slice = words.slice(index, index + maxWords);
    const chunk = slice.join(" ").trim();
    chunks.push({
      chunkIndex,
      heading: detectHeading(chunk, chunkIndex),
      text: chunk,
      normalizedText: normalizeText(chunk),
      tokenEstimate: Math.ceil(slice.length * 1.3)
    });
    chunkIndex += 1;
    if (index + maxWords >= words.length) break;
    index += Math.max(1, maxWords - overlapWords);
  }

  return chunks;
}

function detectHeading(text: string, chunkIndex: number) {
  const firstSentence = text.split(/[.!?]\s/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 90) return firstSentence;
  return chunkIndex === 0 ? "Opening section" : `Section ${chunkIndex + 1}`;
}
