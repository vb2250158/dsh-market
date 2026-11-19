export interface ReleaseBlocker {
    name: string;
    version: string;
    /** ISO time pnpm printed, or null when it printed none we can read. */
    publishedAt: string | null;
    /** ISO time the safety wait ends, or null when it cannot be worked out. */
    readyAt: string | null;
}
/** How long a blocker with an unknown end time is believed (same as #961). */
export declare const UNKNOWN_BLOCKER_TTL_MS: number;
/**
 * Read the entries pnpm refused out of its violation output.
 * @param output - pnpm's combined stdout and stderr.
 * @param windowMs - the profile's effective wait, or null when it is unknown.
 * @param now - epoch ms, injectable for tests.
 * @returns one blocker per `name@version`; empty when the output names none.
 */
export declare function parseReleaseAgeBlockers(output: string, windowMs: number | null, now?: number): ReleaseBlocker[];
/** Remember what pnpm just refused, replacing whatever was known for this profile. */
export declare function recordReleaseBlockers(dir: string, blockers: readonly ReleaseBlocker[], now?: number): void;
/** Forget every blocker of this profile (a mutation went through without a bypass). */
export declare function clearReleaseBlockers(dir: string): void;
/** Test seam: drop the in-memory copy so the next read comes from disk (a restart). */
export declare function forgetReleaseBlockerMemory(): void;
/**
 * The blockers that still hold, with the ended and the departed dropped.
 * A blocker ends at its time, or after {@link UNKNOWN_BLOCKER_TTL_MS} when
 * the time is unknown, or as soon as the lockfile no longer pins it.
 */
export declare function activeReleaseBlockers(dir: string, now?: number): ReleaseBlocker[];
/** The one blocker to name: an unknown time first (nothing is certain), else the last to end. */
export declare function headlineBlocker(blockers: readonly ReleaseBlocker[]): ReleaseBlocker | null;
/** What the update route says when it declines to start (bilingual, `zh / en`). */
export declare function releaseBlockedMessage(blocker: ReleaseBlocker): string;
