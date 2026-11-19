import type { CatalogReleaseSource } from './sources.ts';
export { catalogReleaseSourceOf, type CatalogReleaseSource } from './sources.ts';
export declare function publishedReleaseUpdate(source: CatalogReleaseSource, name: string): Promise<{
    version: string;
    target: string;
} | null>;
