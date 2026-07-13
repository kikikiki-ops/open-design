export interface DeckOutlinePage {
  id: string;
  title: string;
  points: string[];
}

const PAGE_HEADING_RE =
  /^#{2,3}\s+(?:(?:slide|page|页|頁)\s*)?(\d+)?[\s.、:：-]*(.*)$/iu;
const BULLET_RE = /^\s*(?:[-*+]|\d+[.)、])\s+(.+)$/u;

export function parseDeckOutlineMarkdown(markdown: string): DeckOutlinePage[] {
  const pages: DeckOutlinePage[] = [];
  let current: DeckOutlinePage | null = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const heading = PAGE_HEADING_RE.exec(line.trim());
    if (heading) {
      const fallbackNumber = pages.length + 1;
      const title = heading[2]?.trim() || `Slide ${heading[1] ?? fallbackNumber}`;
      current = {
        id: `page-${heading[1] ?? fallbackNumber}`,
        title,
        points: [],
      };
      pages.push(current);
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet?.[1] && current) {
      current.points.push(bullet[1].trim());
    }
  }

  return pages.length > 0 ? pages : defaultDeckOutline();
}

export function serializeDeckOutlineMarkdown(pages: readonly DeckOutlinePage[]): string {
  const normalized = pages.length > 0 ? pages : defaultDeckOutline();
  const sections = normalized.map((page, index) => {
    const title = page.title.trim() || `Slide ${index + 1}`;
    const points = page.points
      .map((point) => point.trim())
      .filter(Boolean)
      .map((point) => `- ${point}`)
      .join('\n');
    return `## ${index + 1}. ${title}${points ? `\n${points}` : ''}`;
  });
  return `# Deck outline\n\n${sections.join('\n\n')}\n`;
}

export function createDeckOutlinePage(index: number): DeckOutlinePage {
  return {
    id: `page-${Date.now()}-${index}`,
    title: `Slide ${index + 1}`,
    points: ['Add the key message for this slide'],
  };
}

export function defaultDeckOutline(): DeckOutlinePage[] {
  return [
    {
      id: 'page-1',
      title: 'Opening',
      points: ['Introduce the topic and the outcome'],
    },
    {
      id: 'page-2',
      title: 'Core idea',
      points: ['Explain the main insight with supporting evidence'],
    },
    {
      id: 'page-3',
      title: 'Next step',
      points: ['Close with one clear action'],
    },
  ];
}
