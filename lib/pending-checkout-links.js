/** Checkout links disconnected before replacing a local build. */
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { randomUUID } from 'node:crypto';
import { closeSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hostNodeModulesRoot } from './install.js';
import { NPM_NAME_RE } from './sources.js';
export class PendingCheckoutLinks {
    file;
    constructor(profileDirectory) {
        this.file = join(profileDirectory, '.dsh-market', 'pending-checkout-links.json');
    }
    list() {
        let data;
        try {
            data = JSON.parse(readFileSync(this.file, 'utf8'));
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return [];
            throw error;
        }
        return Array.isArray(data?.operations) ? data.operations.filter((item) => item !== null && typeof item === 'object'
            && typeof item.name === 'string' && NPM_NAME_RE.test(item.name)
            && typeof item.spec === 'string' && /^link:.+/i.test(item.spec)
            && typeof item.rawTarget === 'string' && item.rawTarget !== '') : [];
    }
    record(item) {
        this.save([...this.list().filter(itemBefore => itemBefore.name !== item.name), item]);
    }
    save(operations) {
        mkdirSync(dirname(this.file), { recursive: true });
        const temporary = `${this.file}.tmp-${randomUUID()}`;
        writeFileSync(temporary, JSON.stringify({ operations }), { flag: 'wx' });
        try {
            renameSync(temporary, this.file);
        }
        catch (error) {
            try {
                unlinkSync(temporary);
            }
            catch { /* preserve the write failure */ }
            throw error;
        }
    }
}
/**
 * Claim the same exclusive profile writer lock as rc.3's plugin manager.
 * An occupied lock is left for the host to release or take over.
 */
export function withIdleProfile(profileDirectory, action) {
    const lock = join(profileDirectory, 'package.json.lock');
    let descriptor;
    try {
        descriptor = openSync(lock, 'wx', 0o600);
    }
    catch (error) {
        const code = error.code;
        if (code === 'EEXIST' || (code === 'EPERM' && lstatSync(lock, { throwIfNoEntry: false }) !== undefined))
            return null;
        throw error;
    }
    try {
        writeFileSync(descriptor, `${process.pid}\n`);
        return action();
    }
    finally {
        closeSync(descriptor);
        unlinkSync(lock);
    }
}
/** Resolve the lock implementation from the host's own plugin manager. */
export async function loadHostProfileLock(installDirectory) {
    if (installDirectory === null)
        return null;
    const nodeModules = hostNodeModulesRoot(installDirectory);
    const belongsToHost = (path) => {
        const inside = relative(nodeModules, path);
        return inside !== '' && !isAbsolute(inside) && inside !== '..' && !inside.startsWith(`..${sep}`);
    };
    try {
        const manager = createRequire(join(installDirectory, 'package.json')).resolve('@deepseek-ai/dsh-plugin-manager');
        if (!belongsToHost(manager))
            return null;
        const atomic = createRequire(manager).resolve('@deepseek-ai/dsh-atomic-write');
        if (!belongsToHost(atomic))
            return null;
        const module = await import(__rewriteRelativeImportExtension(pathToFileURL(atomic).href));
        return typeof module.withFileLock === 'function' ? module.withFileLock : null;
    }
    catch {
        return null;
    }
}
/** A pnpm child may survive the process that owned the writer lock. */
export function hasUnsettledPackageRun(profileDirectory) {
    try {
        const value = JSON.parse(readFileSync(join(profileDirectory, '.plugin-manager', 'run.json'), 'utf8'));
        const pid = value?.pid;
        const grouped = value?.grouped;
        if (typeof pid !== 'number' || !Number.isSafeInteger(pid) || pid <= 0 || typeof grouped !== 'boolean')
            return true;
        try {
            process.kill(grouped && process.platform !== 'win32' ? -pid : pid, 0);
            return true;
        }
        catch (error) {
            return error.code !== 'ESRCH';
        }
    }
    catch (error) {
        return error.code !== 'ENOENT';
    }
}
