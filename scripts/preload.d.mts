export interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
}
export function routeSources(routePagesSource: string, routeIds: string[]): Record<string, string>;
export function chunkFiles(manifest: Record<string, ManifestChunk>, src: string): { js: string[]; css: string[] };
export function preloadTags(files: { js?: string[]; css?: string[] }, fonts: string[], base: string): string;
