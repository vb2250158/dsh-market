/**
 * Access to the curated list from awesome-dsh-plugin.com. Each new load
 * revalidates the catalog with its source.
 */
import { type Region } from './regions.ts';
import { type SourceInfo } from './catalogs.ts';
export interface RegistryPlugin {
    name: string;
    owner: string;
    url: string;
    /** One legacy category id or several category ids. */
    category: string | string[];
    description: Record<string, string>;
    npm?: string | null;
    tarball?: string | null;
    stars?: number | null;
    starsCheckedAt?: string | null;
    /** All public Release assets in this repository, lifetime count; never npm's window. */
    githubReleaseDownloads?: number | null;
    githubReleaseDownloadsCheckedAt?: string | null;
    /** Public package declarations at this exact pinned install tag. */
    releaseManifest?: {
        tarball: string;
        checkedAt: string;
        version: string | null;
        enginesDsh: string | null;
        peerDependencies: Record<string, string>;
    };
    /**
     * npm downloads in the last 30 days, when the entry has a published
     * package. `null`/absent means "no npm package" — a coverage gap, not a
     * zero — so sorting must not read it as "less popular than 0".
     */
    downloads?: number | null;
    /** Source-reported download window (YYYY-MM-DD), not lifetime totals. */
    downloadsStart?: string | null;
    downloadsEnd?: string | null;
    /** When the source checked this statistic; never the client's fetch time. */
    downloadsCheckedAt?: string | null;
    /**
     * Registry `dist-tags.latest` from awesome-dsh-plugin (#348). A string when
     * known; `null`/absent when github-only or not yet backfilled — the UI
     * omits the byline segment rather than showing a placeholder.
     */
    version?: string | null;
    /**
     * Catalog-declared storefront tile (icon). Same trust boundary as screenshots:
     * the catalog is untrusted input, so the client re-validates the URL before
     * creating an <img>. Absent = fall back to the owner's GitHub avatar.
     */
    icon?: string | null;
    install: string;
    added: string;
    /**
     * Which catalog this entry came from. Present ONLY on entries from a
     * catalog the organization or the user added; the public catalog's entries
     * carry none, so a plain install looks exactly as it always did. Stamped by
     * the market after merging, never taken from a catalog's own text.
     */
    source?: {
        id: string;
        label: Record<string, string>;
    };
    /**
     * Internal repository to install from (`git+https://…#ref`, `git+ssh://…`).
     * Honored only on an entry from an added catalog — the market stamps
     * `source` itself — and never taken from a request.
     */
    git?: string;
    /**
     * Absolute path of a package file that ships with an offline bundle. Set by
     * the market while reading a file catalog, after checking it lies inside
     * that catalog's own directory; a catalog's own text cannot set it.
     */
    offlineTarball?: string;
    /** The version an administrator's policy fixed this entry to. */
    pinned?: string;
    /** Curated screenshot URLs. */
    screenshots?: string[];
    /**
     * Catalog-side deprecation flags (#60): supplied by awesome-dsh-plugin,
     * absent for every normal entry — the market only consumes them, so a
     * catalog without the fields behaves exactly as before.
     */
    deprecated?: boolean;
    /** Catalog name of the suggested replacement plugin, when deprecated. */
    replacement?: string;
    /**
     * npm package names this entry used BEFORE its current one (#1012).
     *
     * The catalog is the only place a rename can be stated ahead of time: the
     * old name's npm metadata is gone (no dist-tags, no `deprecated` message),
     * so nothing the market can fetch still knows the two names are one plugin.
     * Same trust boundary as `deprecated`/`replacement` — absent for every
     * normal entry, and a catalog without the field behaves exactly as before.
     *
     * Values are validated where they are consumed (normalized by
     * {@link pluginPreviousNpm}, cross-entry rules in scripts/validate-registry.mjs):
     * a former name must never be a live package in the catalog, and one former
     * name may only have one successor.
     */
    previousNpm?: string[];
    /**
     * Capability disclosure (#401): what a static scan of the artifact a user
     * would install reported touching — `shell`, `network`, `credentials`,
     * `fs-read`, `fs-write`, `env`, `llm`, `dynamic-code`, ...
     *
     * Disclosure, not a verdict, and the type says so by being ABSENT when the
     * entry was never scanned: `capabilities: []` means "scanned, nothing
     * detected" and `undefined` means "we could not look". The two render
     * differently (未检出 vs 未扫描) because they are different sentences, and
     * only one of them is a statement about the plugin.
     */
    capabilities?: string[];
    /** Combinations a reader should look at, in the scanner's own words. */
    capabilityRedLines?: string[];
    /** When the scan behind those fields ran (ISO 8601). */
    capabilityCheckedAt?: string | null;
}
/**
 * Category ids for one catalog entry, de-duplicated in declaration order.
 *
 * Catalog JSON is an external input, so malformed array members are omitted
 * here and an entry with no usable category is rejected by `asRegistry`.
 */
export declare function pluginCategories(plugin: Pick<RegistryPlugin, 'category'>): string[];
export interface Registry {
    updated: string;
    count: number;
    categories: Record<string, Record<string, string>>;
    plugins: RegistryPlugin[];
    /** Per-source status; present only when more than the public catalog is configured. */
    sources?: SourceInfo[];
}
/**
 * Former npm names for one catalog entry, normalized (#1012).
 *
 * Catalog JSON is external input, so a malformed declaration is dropped
 * rather than trusted: only syntactically valid npm names survive, an entry
 * may not list itself (its own `npm` or `name`), and duplicates collapse in
 * declaration order. Cross-entry rules — a former name that is still live
 * elsewhere, or two entries claiming one former name — cannot be judged per
 * entry; the validator enforces them for the catalog, and
 * `findCatalogRename` fails closed on ambiguity at runtime.
 */
export declare function pluginPreviousNpm(plugin: Pick<RegistryPlugin, 'name' | 'npm' | 'previousNpm'>): string[];
/**
 * Drop the validator and detach any earlier load, so the next call starts an
 * unconditional request. Earlier callers can still receive their own result.
 */
export declare function forgetCatalog(): void;
/** Every source failed (or the only one did): the message for the page, and what each source said. */
export declare class CatalogLoadError extends Error {
    readonly sources: SourceInfo[];
    constructor(message: string, sources: SourceInfo[]);
}
/**
 * The catalog, revalidated on each new load: the public catalog plus whatever
 * the organization's policy and the user added.
 *
 * With nothing configured this IS {@link loadPublicCatalog} — the same
 * requests, the same object — which is the promise that a user with no policy
 * and no extra catalogs sees no change. Otherwise every source is read on its
 * own, in parallel: one that fails costs the user that source and is reported
 * in `sources`, never the others.
 * @throws when nothing could be loaded; {@link CatalogLoadError} carries the per-source detail.
 */
export declare function loadRegistry(region?: Region): Promise<Registry>;
/**
 * A catalog failure with the facts needed to classify it, in the message
 * itself.
 *
 * The market shows this string and the log export carries it, so it is the
 * whole of what a bug report will contain. "The operation was aborted due to
 * timeout" alone cannot distinguish a slow link from a blocked one from a
 * proxy this process cannot use — and Node's `fetch` ignores HTTP_PROXY
 * entirely (measured on Node 25), so a machine whose only route out is a
 * proxy fails here every time while every other tool on it works.
 */
export declare function describeFetchFailure(error: unknown, elapsedMs: number, attempts?: number, failures?: readonly {
    source: string;
    reason: string;
}[]): string;
