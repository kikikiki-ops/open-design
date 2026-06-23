// useKitModuleUpload — wire the empty-module "upload" affordance in the kit view
// to a real save. We upload the file into the backing project, then patch the
// project's brand.json so the module renders the new asset on the next read.
//
// Only meaningful for editable design systems that have a writable brand.json
// (DesignKit.canUpload). Reuses the existing project file providers — no new
// daemon endpoint is required.

import { useCallback, useState } from 'react';
import type { Brand } from '@open-design/contracts';
import {
  fetchProjectFileText,
  uploadProjectFile,
  writeProjectTextFile,
} from '../providers/registry';

export type KitUploadModule = 'logo' | 'image' | 'font';

export interface KitModuleUpload {
  uploading: KitUploadModule | null;
  uploadModule: (module: KitUploadModule, file: File) => Promise<void>;
}

export function useKitModuleUpload(opts: {
  projectId?: string;
  onUploaded?: () => void;
}): KitModuleUpload {
  const { projectId, onUploaded } = opts;
  const [uploading, setUploading] = useState<KitUploadModule | null>(null);

  const uploadModule = useCallback(
    async (module: KitUploadModule, file: File) => {
      if (!projectId || uploading) return;
      setUploading(module);
      try {
        const dir = module === 'logo' ? 'logos' : module === 'font' ? 'fonts' : 'imagery';
        const safe =
          file.name.replace(/[^\w.\-]+/g, '-').replace(/^-+|-+$/g, '') || `${module}-asset`;
        const path = `${dir}/${safe}`;
        const uploaded = await uploadProjectFile(projectId, file, path);
        if (!uploaded) return;

        // Patch brand.json so the kit view picks up the new asset. Best-effort:
        // if there is no brand.json the file still lands in the project.
        const raw = await fetchProjectFileText(projectId, 'brand.json', { cache: 'no-store' });
        if (raw) {
          try {
            const brand = JSON.parse(raw) as Brand;
            if (module === 'logo') {
              const prev = brand.logo?.primary ?? null;
              brand.logo = brand.logo ?? { primary: null, alternates: [], notes: '' };
              brand.logo.alternates = brand.logo.alternates ?? [];
              if (prev && prev !== path && !brand.logo.alternates.includes(prev)) {
                brand.logo.alternates = [prev, ...brand.logo.alternates];
              }
              brand.logo.primary = path;
            } else if (module === 'image') {
              brand.imagery = brand.imagery ?? {
                style: '',
                subjects: [],
                treatment: '',
                avoid: [],
                samples: [],
              };
              brand.imagery.samples = brand.imagery.samples ?? [];
              brand.imagery.samples.push({ file: path, kind: 'upload' });
            } else {
              const family = safe
                .replace(/\.(otf|ttf|woff2?)$/i, '')
                .replace(/[-_]+/g, ' ')
                .trim() || 'Uploaded font';
              const spec = { family, fallbacks: ['system-ui', 'sans-serif'], weights: [400] };
              brand.typography = brand.typography ?? {};
              if (!brand.typography.display) brand.typography.display = spec;
              if (!brand.typography.body) brand.typography.body = spec;
            }
            await writeProjectTextFile(projectId, 'brand.json', JSON.stringify(brand, null, 2));
          } catch {
            // Malformed brand.json — leave the uploaded file in place.
          }
        }
        if (module === 'font') {
          const manifestRaw = await fetchProjectFileText(projectId, 'fonts/manifest.json', { cache: 'no-store' });
          const manifest = parseFontManifest(manifestRaw);
          const family = safe
            .replace(/\.(otf|ttf|woff2?)$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim() || 'Uploaded font';
          manifest.files = manifest.files.filter((entry) => entry.file !== safe);
          manifest.files.push({
            family,
            weight: '400',
            style: 'normal',
            file: safe,
            format: fontFormat(safe),
          });
          await writeProjectTextFile(projectId, 'fonts/manifest.json', JSON.stringify(manifest, null, 2));
        }
        onUploaded?.();
      } finally {
        setUploading(null);
      }
    },
    [projectId, uploading, onUploaded],
  );

  return { uploading, uploadModule };
}

interface FontManifest {
  files: {
    family: string;
    weight: string;
    style: string;
    file: string;
    format: string;
  }[];
}

function parseFontManifest(raw: string | null): FontManifest {
  if (!raw) return { files: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<FontManifest>;
    return { files: Array.isArray(parsed.files) ? parsed.files : [] };
  } catch {
    return { files: [] };
  }
}

function fontFormat(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.woff')) return 'woff';
  if (lower.endsWith('.otf')) return 'opentype';
  return 'truetype';
}
