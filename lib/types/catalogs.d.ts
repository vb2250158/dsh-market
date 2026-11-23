/**
 * Catalog sources beyond the public one: an organization's own list of
 * plugins, in the same shape as the public `plugins.json`.
 *
 * Where they come from:
 * - the policy file's `catalogs` (locked; the user cannot remove them), and
 * - the user's own, added in the market's settings (stored in the profile's
 *   market state) unless the policy says `"userCatalogs": false`.
 *
 * This module holds everything about them EXCEPT the public catalog, whose
 * fetch path (and its 304 validator) stays in src/registry.ts exactly as it
 * was. `loadRegistry` there calls in here only when something is configured;
 * with nothing configured it never gets here, which is what makes "no policy,
 * no user catalogs" the same requests as before.
 *
 * ## Failure
 *
 * A source that cannot be read costs the user that source, not the market:
 * every source is fetched on its own, what loaded is merged, and each failure
 * is reported per source as a code plus detail (`SourceError`) for the UI to
 * say in the user's language. Secrets: header values and `.npmrc` tokens are
 * never put into a message — {@link scrub} removes any configured header value
 * and URL credentials from every failure text before it leaves this module.
 */
import { type LocalizedLabel, type Policy } from './policy.ts';
import type { Registry, RegistryPlugin } from './registry.ts';
/** A saved user catalog: a URL or an absolute file path, nothing secret. */
export interface UserCatalog {
    id: string;
    url?: string;
    file?: string;
}
export declare const MAX_USER_CATALOGS = 8;
export type SourceErrorCode = 'network' | 'timeout' | 'auth' | 'http' | 'invalid' | 'empty' | 'file' | 'env' | 'policy';
/** What went wrong with one source: a code the UI words, plus a short detail. */
export interface SourceError {
    code: SourceErrorCode;
    detail: string;
}
/** What the settings list and the Discover banner know about one source. No secrets, ever. */
export interface SourceInfo {
    id: string;
    kind: 'public' | 'policy' | 'user';
    label: LocalizedLabel;
    /** Host and path (or file path) for display; no credentials, no query. */
    where: string;
    /** `off`: the policy turned the public catalog off. */
    status: 'ok' | 'failed' | 'off';
    count: number;
    /** Entries skipped because they were not usable (no name, no link, no category). */
    skipped: number;
    error?: SourceError;
    /** Set by the organization: the user cannot remove or switch it. */
    locked: boolean;
    /** Its entries install from package files shipped with it, not from a registry. */
    offline?: true;
}
/** The public catalog's label, as plugin cards and the source list show it. */
export declare const PUBLIC_LABEL: LocalizedLabel;
/** A source ready to fetch: what to read, and the headers it needs. */
export interface ExtraSource {
    id: string;
    kind: 'policy' | 'user';
    label: LocalizedLabel;
    url?: string;
    file?: string;
    /** Unexpanded; `${ENV}` is expanded per request. */
    headers: Record<string, string>;
}
/** Replace the user's saved catalogs (read from the profile's market state). */
export declare function setUserCatalogs(list: readonly UserCatalog[]): void;
export declare function currentUserCatalogs(): readonly UserCatalog[];
export interface CatalogConfig {
    policy: Policy;
    publicEnabled: boolean;
    extras: ExtraSource[];
    /** Anything beyond "the public catalog and nothing else". */
    active: boolean;
    /** Changes whenever what would be fetched (or filtered) changes. */
    signature: string;
}
/** Host name or file name: a label for a catalog that did not name itself. */
export declare function fallbackLabel(entry: Pick<UserCatalog, 'url' | 'file'>): LocalizedLabel;
/** The sources and filters in force right now. Cheap: the policy is cached. */
export declare function catalogConfig(): CatalogConfig;
/** Remove URL credentials, query strings, and any configured header value from a text. */
export declare function scrub(text: string, secrets?: readonly string[]): string;
/** The plain location of a source for display: host and path, or the file path. */
export declare function displayWhere(source: Pick<ExtraSource, 'url' | 'file'>): string;
/** Drop every validator, so the next read of each source is unconditional. */
export declare function forgetExtraCatalogs(): void;
/**
 * A git source an entry may install from, as pnpm's spec, or null.
 *
 * https and ssh remotes (plus plain http for hosts that only speak it), an
 * optional `#ref`. A password in the address is refused: a catalog is shared
 * text, and a secret does not belong in it. ssh keys are the machine's own.
 */
export declare function normalizeGitSpec(value: unknown): string | null;
export interface ExtraResult {
    info: SourceInfo;
    registry: Registry | null;
}
/** Read one source and report it; never throws. */
export declare function loadExtra(source: ExtraSource, options?: {
    fresh?: boolean;
    env?: NodeJS.ProcessEnv;
}): Promise<ExtraResult>;
/** Whether the policy's `allow` list lets this entry be shown and installed. */
export declare function entryAllowed(entry: Pick<RegistryPlugin, 'name' | 'npm'>, allow: readonly string[] | null): boolean;
export interface MergeInput {
    /** The public catalog, or null when it is off or failed. */
    publicRegistry: Registry | null;
    publicInfo: SourceInfo | null;
    /** In priority order: policy catalogs, then the user's. */
    extras: readonly {
        info: SourceInfo;
        registry: Registry | null;
    }[];
    allow: readonly string[] | null;
    /** The administrator's exact-version pins by npm package name. */
    pins?: Readonly<Record<string, string>>;
}
/**
 * Combine the sources. Pure.
 *
 * - The same repository URL, or the same npm package, in two sources: the
 *   private one wins (earlier private sources before later ones). One plugin
 *   must not appear as two cards because two catalogs both list it.
 * - Private entries come first: they are why the organization set this up.
 * - Categories merge; a category id a private entry uses that nothing
 *   describes shows under its own id.
 * - `source` is stamped here on every private entry, and removed from public
 *   ones, so a catalog cannot pass itself off as another source.
 * - `allow` filters the union; `pins` fix the version an entry shows and installs.
 */
export declare function mergeSources(input: MergeInput): Registry;
/** What a person typed into the add box, as a source, or why not. */
export declare function parseCatalogInput(text: string): {
    url?: string;
    file?: string;
} | {
    error: 'empty' | 'credentials' | 'unrecognized';
};
/** A stable id for a user catalog, so adding the same thing twice is one entry. */
export declare function userCatalogId(entry: {
    url?: string;
    file?: string;
}): string;
/** Read a candidate once, for the add box: the count on success, the reason on failure. */
export declare function probeCatalog(entry: {
    url?: string;
    file?: string;
}, env?: NodeJS.ProcessEnv): Promise<ExtraResult>;
/** The shape the id of a saved catalog must have; stored state is untrusted. */
export declare function validUserCatalog(value: unknown): UserCatalog | null;
