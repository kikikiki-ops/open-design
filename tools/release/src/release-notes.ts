import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export type ReleaseNoteFormat = "html" | "markdown";

export type ReleaseNoteSourceFile = {
  contentType: string;
  extension: "html" | "md";
  format: ReleaseNoteFormat;
  locale: string;
  name: string;
  path: string;
  size: number;
};

export type ReleaseNotePublishedFile = Omit<ReleaseNoteSourceFile, "path"> & {
  url: string;
};

export type ReleaseNotesMetadata = {
  defaultLocale: "en";
  files: Record<string, Partial<Record<ReleaseNoteFormat, ReleaseNotePublishedFile>>>;
  requiredMarkdownLocales: string[];
  version: string;
};

export const RELEASE_NOTES_DEFAULT_LOCALE = "en";
export const RELEASE_NOTES_REQUIRED_MARKDOWN_LOCALES = ["en", "zh-CN"] as const;

function releaseNotesRoot(): string {
  return process.env.OPEN_DESIGN_RELEASE_NOTES_ROOT ?? join(process.cwd(), "docs", "CHANGELOG");
}

export function releaseNotesSourceDir(releaseVersion: string): string {
  return join(releaseNotesRoot(), `v${releaseVersion}`);
}

function releaseNoteFormat(extension: string): ReleaseNoteFormat | null {
  if (extension === "html") return "html";
  if (extension === "md") return "markdown";
  return null;
}

function releaseNoteContentType(extension: "html" | "md"): string {
  return extension === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";
}

function parseReleaseNoteFileName(name: string): { extension: "html" | "md"; format: ReleaseNoteFormat; locale: string } | null {
  const match = /^([A-Za-z][A-Za-z0-9-]*)\.(html|md)$/.exec(name);
  if (match?.[1] == null || match[2] == null) return null;
  const extension = match[2] as "html" | "md";
  const format = releaseNoteFormat(extension);
  if (format == null) return null;
  return {
    extension,
    format,
    locale: match[1],
  };
}

export function discoverReleaseNotes(releaseVersion: string): ReleaseNoteSourceFile[] {
  const sourceDir = releaseNotesSourceDir(releaseVersion);
  if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    throw new Error(`stable release notes directory is required: ${sourceDir}`);
  }

  const files: ReleaseNoteSourceFile[] = [];
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const parsed = parseReleaseNoteFileName(entry.name);
    if (parsed == null) continue;
    const path = join(sourceDir, entry.name);
    files.push({
      contentType: releaseNoteContentType(parsed.extension),
      extension: parsed.extension,
      format: parsed.format,
      locale: parsed.locale,
      name: entry.name,
      path,
      size: statSync(path).size,
    });
  }

  files.sort((left, right) => left.name.localeCompare(right.name));
  return files;
}

export function assertStableReleaseNotes(releaseVersion: string): ReleaseNoteSourceFile[] {
  const files = discoverReleaseNotes(releaseVersion);
  const names = new Set(files.map((file) => file.name));
  const missing = RELEASE_NOTES_REQUIRED_MARKDOWN_LOCALES
    .map((locale) => `${locale}.md`)
    .filter((name) => !names.has(name));
  if (missing.length > 0) {
    throw new Error(
      `stable release notes require ${missing.join(", ")} under ${releaseNotesSourceDir(releaseVersion)}`,
    );
  }
  return files;
}

export function releaseNotesMetadata(
  releaseVersion: string,
  files: ReleaseNotePublishedFile[],
): ReleaseNotesMetadata {
  const byLocale: ReleaseNotesMetadata["files"] = {};
  for (const file of files) {
    byLocale[file.locale] ??= {};
    byLocale[file.locale][file.format] = file;
  }
  return {
    defaultLocale: RELEASE_NOTES_DEFAULT_LOCALE,
    files: byLocale,
    requiredMarkdownLocales: [...RELEASE_NOTES_REQUIRED_MARKDOWN_LOCALES],
    version: releaseVersion,
  };
}
