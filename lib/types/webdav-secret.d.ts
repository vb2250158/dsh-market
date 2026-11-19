/**
 * The remembered WebDAV password (#1058), opt-in and off by default.
 *
 * The DSH host exposes no secret store to plugins, so the one place it can
 * live is a 0600 file in the market's own state directory under DSH_HOME —
 * outside the profile directory, so exported backups (which walk the profile)
 * never contain it. It is bound to the URL and username it was saved for: a
 * password is never sent to a different server just because the form changed.
 */
export interface RememberedWebdav {
    url: string;
    username: string;
    password: string;
}
export declare function webdavSecretFile(home?: string): string;
export declare function readWebdavSecret(file?: string): RememberedWebdav | null;
/** The remembered password, only when it was saved for exactly this URL and username. */
export declare function webdavSecretFor(url: string, username: string, file?: string): string | null;
export declare function writeWebdavSecret(value: RememberedWebdav, file?: string): void;
export declare function clearWebdavSecret(file?: string): void;
