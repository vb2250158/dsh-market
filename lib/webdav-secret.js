import { chmodSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveDshHome } from './home-paths.js';
export function webdavSecretFile(home = resolveDshHome()) {
    return join(home, 'dsh-market', 'webdav.json');
}
export function readWebdavSecret(file = webdavSecretFile()) {
    try {
        const value = JSON.parse(readFileSync(file, 'utf8'));
        if (typeof value.url === 'string' && typeof value.username === 'string' && typeof value.password === 'string' && value.password !== '') {
            return { url: value.url, username: value.username, password: value.password };
        }
    }
    catch { /* absent or unreadable: nothing remembered */ }
    return null;
}
/** The remembered password, only when it was saved for exactly this URL and username. */
export function webdavSecretFor(url, username, file = webdavSecretFile()) {
    const stored = readWebdavSecret(file);
    return stored !== null && stored.url === url && stored.username === username ? stored.password : null;
}
export function writeWebdavSecret(value, file = webdavSecretFile()) {
    mkdirSync(dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify(value), { mode: 0o600 });
    try {
        chmodSync(temp, 0o600);
    }
    catch { /* filesystems without POSIX modes */ }
    renameSync(temp, file);
}
export function clearWebdavSecret(file = webdavSecretFile()) {
    rmSync(file, { force: true });
}
