export type Sizes = Record<string, { js?: number; css?: number }>;
export const BUDGETS: Record<string, { js?: number; css?: number }>;
export const PDF_CHUNK: RegExp;
export function initialAssets(html: string): { js: string[]; css: string[] };
export function shellAssets(html: string): { js: string[]; css: string[] };
export function lazyPdfErrors(file: string, html: string): string[];
export function budgetErrors(sizes: Sizes, budgets?: Record<string, { js?: number; css?: number }>): string[];
export function kb(bytes: number): string;
