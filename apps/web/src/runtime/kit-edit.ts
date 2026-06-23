import type { Brand } from '@open-design/contracts';
import {
  fetchProjectFileText,
  writeProjectTextFile,
} from '../providers/registry';

export type KitTextModule = 'identity' | 'voice' | 'imagery-layout' | 'design-md';

async function readBrand(projectId: string): Promise<Brand | null> {
  const raw = await fetchProjectFileText(projectId, 'brand.json', { cache: 'no-store' });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Brand;
  } catch {
    return null;
  }
}

async function writeBrand(projectId: string, brand: Brand): Promise<boolean> {
  const file = await writeProjectTextFile(projectId, 'brand.json', JSON.stringify(brand, null, 2));
  return Boolean(file);
}

export async function patchBrand(projectId: string, mutate: (brand: Brand) => void): Promise<boolean> {
  const brand = await readBrand(projectId);
  if (!brand) return false;
  mutate(brand);
  return writeBrand(projectId, brand);
}

export async function updateBrandColor(projectId: string, index: number, hex: string): Promise<boolean> {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  return patchBrand(projectId, (brand) => {
    const color = brand.colors?.[index];
    if (!color) return;
    color.hex = hex.toUpperCase();
  });
}

export async function deleteBrandLogo(projectId: string, index: number): Promise<boolean> {
  return patchBrand(projectId, (brand) => {
    const logo = brand.logo;
    if (!logo) return;
    const alternates = logo.alternates ?? [];
    if (index <= 0) {
      logo.primary = alternates.shift() ?? null;
      logo.alternates = alternates;
      return;
    }
    logo.alternates = alternates.filter((_, i) => i !== index - 1);
  });
}

export async function deleteBrandImage(projectId: string, index: number): Promise<boolean> {
  return patchBrand(projectId, (brand) => {
    if (!brand.imagery?.samples) return;
    brand.imagery.samples = brand.imagery.samples.filter((_, i) => i !== index);
  });
}

export async function readDesignMd(projectId: string): Promise<string> {
  return (await fetchProjectFileText(projectId, 'DESIGN.md', { cache: 'no-store' })) ?? '';
}

export async function writeDesignMd(projectId: string, body: string): Promise<boolean> {
  const file = await writeProjectTextFile(projectId, 'DESIGN.md', body);
  return Boolean(file);
}

export async function readTextFile(file: File): Promise<string> {
  return await file.text();
}
