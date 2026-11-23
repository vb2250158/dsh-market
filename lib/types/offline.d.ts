/**
 * Offline bundles: a catalog plus the package files it lists, in one archive,
 * for machines that cannot reach npm at all.
 *
 * Layout of a bundle (made by scripts/offline-pack.mjs):
 *
 *   plugins.json          the catalog; each entry carries `tarball: "./tarballs/<file>.tgz"`
 *   tarballs/<file>.tgz   the package files, one per entry
 *
 * Importing one is the only place the market unpacks an archive it did not
 * make, so the rules here are strict and boring:
 *
 * - Only regular files. A link, device or directory-traversal name anywhere
 *   in the archive refuses the whole import; nothing is half-extracted.
 * - Only the two places above: `plugins.json` at the top and `*.tgz` files
 *   under `tarballs/`. Anything else is refused rather than ignored.
 * - Size and count limits, on the way in and after decompression.
 * - Extracted into a temporary directory and moved into place only when the
 *   whole archive passed; a failure leaves nothing behind.
 *
 * A tarball path in a catalog is resolved by {@link resolveBundleFile}: it must
 * be that exact shape, and the file it names must be a plain file inside the
 * bundle's own directory — never a link out, never an absolute path.
 */
/** Where imported bundles live: `<DSH_HOME>/dsh-market/offline/<id>/`. */
export declare function offlineRoot(env?: Record<string, string | undefined>): string;
/** Whether `path` is inside the imported-bundles directory. */
export declare function isInsideOfflineRoot(path: string, env?: Record<string, string | undefined>): boolean;
export declare const MAX_BUNDLE_BYTES: number;
export declare const MAX_BUNDLE_FILES = 2000;
/**
 * The absolute path a catalog entry's `tarball` names, or null when it is not
 * a plain file strictly inside `baseDir`. Never trusts the string: the shape
 * is fixed, and the result is checked on disk after resolving links.
 */
export declare function resolveBundleFile(baseDir: string, relative: unknown): string | null;
export declare class BundleError extends Error {
    readonly code: 'too-big' | 'not-archive' | 'unsafe' | 'layout' | 'empty';
    readonly detail: string;
    constructor(code: BundleError['code'], detail: string);
}
export interface ExtractedBundle {
    id: string;
    dir: string;
    /** Absolute path of the catalog inside the bundle. */
    catalogFile: string;
    files: number;
}
/**
 * Unpack a bundle into `<root>/<id>/`, or throw {@link BundleError} having
 * written nothing. `id` is derived from the content, so importing the same
 * bundle twice is one directory, and importing a newer one replaces it.
 */
export declare function extractBundle(archive: Buffer, root?: string): ExtractedBundle;
