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
import { createHash, randomBytes } from 'node:crypto';
import { lstatSync, mkdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { resolveDshHome } from './home-paths.js';
/** Where imported bundles live: `<DSH_HOME>/dsh-market/offline/<id>/`. */
export function offlineRoot(env = process.env) {
    return join(resolveDshHome(undefined, env), 'dsh-market', 'offline');
}
/** Whether `path` is inside the imported-bundles directory. */
export function isInsideOfflineRoot(path, env = process.env) {
    const root = resolve(offlineRoot(env)) + sep;
    return resolve(path).startsWith(root);
}
export const MAX_BUNDLE_BYTES = 512 * 1024 * 1024;
export const MAX_BUNDLE_FILES = 2000;
const TARBALL_RE = /^(?:\.\/)?tarballs\/[A-Za-z0-9][A-Za-z0-9._@+-]*\.tgz$/u;
/**
 * The absolute path a catalog entry's `tarball` names, or null when it is not
 * a plain file strictly inside `baseDir`. Never trusts the string: the shape
 * is fixed, and the result is checked on disk after resolving links.
 */
export function resolveBundleFile(baseDir, relative) {
    if (typeof relative !== 'string' || !TARBALL_RE.test(relative))
        return null;
    try {
        const base = realpathSync(baseDir);
        const candidate = join(base, relative.replace(/^\.\//u, ''));
        const info = lstatSync(candidate);
        if (!info.isFile() || info.isSymbolicLink())
            return null;
        const real = realpathSync(candidate);
        return real.startsWith(base + sep) ? real : null;
    }
    catch {
        return null;
    }
}
export class BundleError extends Error {
    code;
    detail;
    constructor(code, detail) {
        super(`${code}: ${detail}`);
        this.name = 'BundleError';
        this.code = code;
        this.detail = detail;
    }
}
const octal = (field) => {
    const text = field.toString('latin1').replace(/\0.*$/su, '').trim();
    return text === '' ? 0 : Number.parseInt(text, 8);
};
const text = (field) => field.toString('utf8').replace(/\0.*$/su, '');
/** Read every entry of an uncompressed tar, refusing anything but plain files and directories. */
function readTar(tar) {
    const files = [];
    let offset = 0;
    let longName = null;
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        if (header.every(byte => byte === 0))
            break;
        const size = octal(header.subarray(124, 136));
        const type = String.fromCharCode(header[156] === 0 ? 48 : header[156]);
        let name = text(header.subarray(0, 100));
        const prefix = text(header.subarray(345, 500));
        if (prefix !== '' && header.subarray(257, 262).toString('latin1') === 'ustar')
            name = `${prefix}/${name}`;
        const body = tar.subarray(offset + 512, offset + 512 + size);
        if (body.length < size)
            throw new BundleError('not-archive', 'the archive is cut short');
        offset += 512 + Math.ceil(size / 512) * 512;
        if (type === 'x' || type === 'g') {
            // pax header: only `path` matters; anything it does not carry is ignored.
            const match = /(?:^|\n)\d+ path=([^\n]*)\n/u.exec(body.toString('utf8'));
            if (type === 'x' && match !== null)
                longName = match[1];
            continue;
        }
        if (type === 'L') {
            longName = text(body);
            continue;
        }
        if (longName !== null) {
            name = longName;
            longName = null;
        }
        if (type === '5')
            continue; // a directory entry: layout is checked on the files
        if (type !== '0')
            throw new BundleError('unsafe', `${name} is not a plain file (type ${type})`);
        files.push({ name, data: Buffer.from(body) });
    }
    return files;
}
/** A name is acceptable only as a relative, forward-slash path with no dot segments. */
function cleanName(name) {
    const stripped = name.replace(/^\.\//u, '');
    if (stripped === '' || stripped.startsWith('/') || /^[A-Za-z]:/u.test(stripped) || stripped.includes('\\') || stripped.includes('\0')) {
        throw new BundleError('unsafe', `${name} is not a relative path`);
    }
    if (stripped.split('/').some(part => part === '' || part === '.' || part === '..')) {
        throw new BundleError('unsafe', `${name} escapes the bundle`);
    }
    return stripped;
}
/**
 * Unpack a bundle into `<root>/<id>/`, or throw {@link BundleError} having
 * written nothing. `id` is derived from the content, so importing the same
 * bundle twice is one directory, and importing a newer one replaces it.
 */
export function extractBundle(archive, root = offlineRoot()) {
    if (archive.length > MAX_BUNDLE_BYTES)
        throw new BundleError('too-big', `${String(archive.length)} bytes`);
    let tar;
    try {
        tar = gunzipSync(archive, { maxOutputLength: MAX_BUNDLE_BYTES });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new BundleError(/larger than|maxOutputLength/iu.test(message) ? 'too-big' : 'not-archive', message.slice(0, 120));
    }
    const files = readTar(tar);
    if (files.length === 0)
        throw new BundleError('empty', 'no files');
    if (files.length > MAX_BUNDLE_FILES)
        throw new BundleError('too-big', `${String(files.length)} files`);
    const seen = new Set();
    let catalog = false;
    for (const file of files) {
        file.name = cleanName(file.name);
        if (seen.has(file.name))
            throw new BundleError('layout', `${file.name} appears twice`);
        seen.add(file.name);
        if (file.name === 'plugins.json')
            catalog = true;
        else if (!TARBALL_RE.test(file.name))
            throw new BundleError('layout', `${file.name} is not part of a bundle`);
    }
    if (!catalog)
        throw new BundleError('layout', 'plugins.json is missing');
    const id = `offline-${createHash('sha1').update(archive).digest('hex').slice(0, 8)}`;
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const temporary = join(root, `.import-${randomBytes(6).toString('hex')}`);
    try {
        for (const file of files) {
            const target = join(temporary, file.name);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, file.data, { mode: 0o600 });
        }
        const dir = join(root, id);
        rmSync(dir, { recursive: true, force: true });
        renameSync(temporary, dir);
        return { id, dir, catalogFile: join(dir, 'plugins.json'), files: files.length };
    }
    finally {
        rmSync(temporary, { recursive: true, force: true });
    }
}
