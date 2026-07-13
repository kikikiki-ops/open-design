import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { FlowSnapshot } from '@open-design/contracts';

const MANAGED_BRIEF_START = '<!-- od:flow-clarify:start -->';
const MANAGED_BRIEF_END = '<!-- od:flow-clarify:end -->';
const FORM_BLOCK_RE =
  /<(question-form|ask-question)\b([^>]*)>([\s\S]*?)<\/\1\s*>/giu;
const ATTRIBUTE_RE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
const ANSWER_HEADER_RE =
  /^\s*\[form answers\s*(?:\u2014|-|for)\s*([^\]\r\n]+)\]\s*$/imu;

interface FlowArtifactMessage {
  role: string;
  content?: string | null;
}

interface ParsedQuestion {
  label: string;
  options: string[];
  defaultValue?: string | string[];
}

interface ParsedQuestionForm {
  id: string;
  title: string;
  description?: string;
  questions: ParsedQuestion[];
}

export interface MaterializeFlowArtifactsInput {
  conversationId: string;
  flow: FlowSnapshot;
  messages: FlowArtifactMessage[];
  projectRoot: string;
}

/**
 * Mirrors durable staged-flow decisions into Design Files. The conversation
 * transcript remains the source of truth; these files are stable, user-visible
 * projections that can be reopened without replaying the run.
 */
export async function materializeFlowArtifacts(
  input: MaterializeFlowArtifactsInput,
): Promise<string[]> {
  const generatedDir = path.join(input.projectRoot, 'generated');
  await mkdir(generatedDir, { recursive: true });

  const written: string[] = [];
  const forms = formsWithAnswers(input.messages);
  if (forms.length > 0) {
    const relativePath = 'generated/brief.md';
    const changed = await updateManagedMarkdown(
      path.join(input.projectRoot, relativePath),
      renderBrief(forms),
    );
    if (changed) written.push(relativePath);
  }

  if (input.flow.inspireChoice) {
    const relativePath = 'generated/inspiration.json';
    const content = `${JSON.stringify(
      {
        version: 1,
        conversationId: input.conversationId,
        selectedTemplateId: input.flow.inspireChoice.templateId,
        skipped: input.flow.inspireChoice.skipped,
        updatedAt: input.flow.updatedAt,
      },
      null,
      2,
    )}\n`;
    if (await writeWhenChanged(path.join(input.projectRoot, relativePath), content)) {
      written.push(relativePath);
    }
  }

  return written;
}

function formsWithAnswers(
  messages: FlowArtifactMessage[],
): Array<{ form: ParsedQuestionForm; answers: string[] }> {
  const found: Array<{ form: ParsedQuestionForm; answers: string[] }> = [];
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message?.role !== 'assistant' || typeof message.content !== 'string') continue;
    for (const form of parseQuestionForms(message.content)) {
      const answers = findSubmittedAnswers(messages, index + 1, form.id);
      found.push({ form, answers });
    }
  }
  return found;
}

function parseQuestionForms(content: string): ParsedQuestionForm[] {
  const forms: ParsedQuestionForm[] = [];
  FORM_BLOCK_RE.lastIndex = 0;
  for (let match = FORM_BLOCK_RE.exec(content); match; match = FORM_BLOCK_RE.exec(content)) {
    const attrs = parseAttributes(match[2] ?? '');
    const parsedBody = parseFormBody(match[3] ?? '');
    if (!parsedBody) continue;
    const id = attrs.id || parsedBody.id;
    if (!id) continue;
    forms.push({
      id,
      title: attrs.title || parsedBody.title || id,
      ...(parsedBody.description ? { description: parsedBody.description } : {}),
      questions: parsedBody.questions,
    });
  }
  return forms;
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTRIBUTE_RE.lastIndex = 0;
  for (let match = ATTRIBUTE_RE.exec(raw); match; match = ATTRIBUTE_RE.exec(raw)) {
    const key = match[1];
    if (key) attrs[key.toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? '');
  }
  return attrs;
}

function parseFormBody(body: string): ParsedQuestionForm | null {
  const normalized = body
    .trim()
    .replace(/^```(?:json)?\s*/iu, '')
    .replace(/\s*```$/u, '');
  try {
    const value = JSON.parse(normalized) as Record<string, unknown>;
    const questions = Array.isArray(value.questions)
      ? value.questions.flatMap((question): ParsedQuestion[] => {
          if (!question || typeof question !== 'object') return [];
          const record = question as Record<string, unknown>;
          const label =
            typeof record.label === 'string'
              ? record.label.trim()
              : typeof record.question === 'string'
                ? record.question.trim()
                : '';
          if (!label) return [];
          const options = Array.isArray(record.options)
            ? record.options.flatMap((option): string[] => {
                if (typeof option === 'string') return [option];
                if (!option || typeof option !== 'object') return [];
                const optionRecord = option as Record<string, unknown>;
                return typeof optionRecord.label === 'string'
                  ? [optionRecord.label]
                  : typeof optionRecord.value === 'string'
                    ? [optionRecord.value]
                    : [];
              })
            : [];
          const parsed: ParsedQuestion = { label, options };
          if (
            typeof record.defaultValue === 'string' ||
            (Array.isArray(record.defaultValue) &&
              record.defaultValue.every((item) => typeof item === 'string'))
          ) {
            parsed.defaultValue = record.defaultValue as string | string[];
          }
          return [parsed];
        })
      : [];
    return {
      id: typeof value.id === 'string' ? value.id : '',
      title: typeof value.title === 'string' ? value.title : '',
      ...(typeof value.description === 'string'
        ? { description: value.description }
        : {}),
      questions,
    };
  } catch {
    return null;
  }
}

function findSubmittedAnswers(
  messages: FlowArtifactMessage[],
  startIndex: number,
  formId: string,
): string[] {
  for (let index = startIndex; index < messages.length; index += 1) {
    const message = messages[index];
    if (!message) continue;
    if (message.role === 'assistant') return [];
    if (message.role !== 'user' || typeof message.content !== 'string') continue;
    const lines = message.content.split(/\r?\n/u);
    const header = lines[0]?.match(ANSWER_HEADER_RE);
    if (header?.[1]?.trim().toLowerCase() !== formId.trim().toLowerCase()) continue;
    return lines.slice(1).filter((line) => line.trim().length > 0);
  }
  return [];
}

function renderBrief(
  forms: Array<{ form: ParsedQuestionForm; answers: string[] }>,
): string {
  const lines = [
    MANAGED_BRIEF_START,
    '# Decisions and answers',
    '',
  ];
  for (const { form, answers } of forms) {
    lines.push(`## ${form.title}`);
    if (form.description) lines.push('', form.description);
    if (form.questions.length > 0) {
      lines.push('');
      for (const question of form.questions) {
        lines.push(`### ${question.label}`);
        if (question.options.length > 0) {
          lines.push('', question.options.map((option) => `\`${option}\``).join(' · '));
        }
        if (question.defaultValue !== undefined) {
          const recommended = Array.isArray(question.defaultValue)
            ? question.defaultValue.join(', ')
            : question.defaultValue;
          lines.push('', `⭐ ${recommended}`);
        }
        lines.push('');
      }
    }
    if (answers.length > 0) {
      lines.push('### Submitted answers', '', ...answers, '');
    } else {
      lines.push('_(Waiting for answers)_', '');
    }
  }
  lines.push(MANAGED_BRIEF_END);
  return `${lines.join('\n').trim()}\n`;
}

async function updateManagedMarkdown(filePath: string, managedBlock: string): Promise<boolean> {
  const existing = await readTextFile(filePath);
  const start = existing.indexOf(MANAGED_BRIEF_START);
  const end = existing.indexOf(MANAGED_BRIEF_END);
  let next: string;
  if (start !== -1 && end >= start) {
    const after = end + MANAGED_BRIEF_END.length;
    next = `${existing.slice(0, start)}${managedBlock.trim()}${existing.slice(after)}`;
  } else if (existing.trim()) {
    next = `${managedBlock.trim()}\n\n---\n\n${existing.trim()}\n`;
  } else {
    next = managedBlock;
  }
  return writeWhenChanged(filePath, next);
}

async function writeWhenChanged(filePath: string, content: string): Promise<boolean> {
  const existing = await readTextFile(filePath);
  if (existing === content) return false;
  await writeFile(filePath, content, 'utf8');
  return true;
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, '\'')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}
