/**
 * Reload the market's OWN server half inside the running DSH process.
 *
 * Why this exists: the market updates itself by replacing its files, and the
 * Node module it already imported keeps running. The browser, meanwhile, loads
 * the NEW client bundle, which calls routes the old process does not have (the
 * host answers 405 with an empty body). The only cure used to be a restart,
 * and on DSH Desktop even that is not ours to do (`allowRestart: false`).
 *
 * How: not by re-importing ourselves — Node never re-evaluates a module at a
 * URL it has already loaded, and a cache-busted URL only renews the entry
 * file while every sibling it imports stays the old one. The host already
 * solves exactly this for every plugin: `hmr.reconcileProfile()` (the service
 * `@deepseek-ai/dsh-hmr` publishes as `ctx.hmr`, present from DSH 0.2.1)
 * compares the files of every loaded module with the disk, evicts the ones
 * that changed together with their importers, stops the loader entries that
 * ran them and starts those entries again from the new files. The market is a
 * loader entry like any other, so it is replaced the same way. This module is
 * the orchestration around that one call.
 *
 * The part that is ours, and the reason this is more than one call:
 *
 * - The request that asks for the swap is served by the instance about to be
 *   replaced. Its closure outlives its own disposal (the HTTP response object
 *   belongs to the web server, not to the plugin), so the SAME request can
 *   still report how the swap went.
 * - The host does not restore the old code when the new code cannot start: it
 *   evicts the old modules without a backup. So the new build is imported
 *   first, from a private copy at a path Node has never seen, and the swap is
 *   only asked for when that worked. A build that cannot even load never
 *   replaces a market that is running fine.
 * - Which instance is serving is a fact held outside every module — on
 *   `globalThis` under a registered symbol — because the module that would
 *   hold it is exactly what gets replaced.
 */
/** The slice of the host's `hmr` service this relies on. */
export interface HmrLike {
    runExclusive<T>(operation: () => Promise<T>): Promise<T>;
    reconcileProfile(requiredIds?: readonly string[]): Promise<{
        warnings: readonly string[];
        /** Changed modules that keep running their old code until a restart. */
        pending: readonly {
            url: string;
            reason: string;
        }[];
        /** Why every change waits for a restart, when the host could not compare modules at all. */
        restartReason?: string;
    }>;
}
/**
 * The host's HMR service when it can replace modules, otherwise undefined.
 * Checked by shape: DSH 0.2.0 and earlier publish an `hmr` service without
 * `reconcileProfile`, and a call into it would fail after we had decided to
 * go ahead.
 */
export declare function asHmr(value: unknown): HmrLike | undefined;
/** The instance that registered its routes last. */
export interface InstanceRecord {
    id: string;
    version: string;
}
/**
 * Announce this instance as the one serving. Returns the id to compare
 * against, and a release that only clears the record when it is still this
 * instance's own — a late release from a replaced instance must not erase the
 * record its replacement has already written.
 */
export declare function claimInstance(version: string): {
    id: string;
    release(): void;
};
/** The instance serving right now, or undefined while none is. */
export declare function currentInstance(): InstanceRecord | undefined;
/** Verdict of {@link preflightBuild}. */
export type Preflight = {
    ok: true;
    checked: boolean;
} | {
    ok: false;
    detail: string;
};
/**
 * Whether the package now on disk can be loaded at all.
 *
 * Imports a private copy of its `lib/` from a path nobody has imported, so
 * the whole module graph is evaluated fresh and any failure — a syntax error,
 * a dependency that is missing, a top-level throw — surfaces here, while the
 * running market is still untouched. The copy sits NEXT TO the package so
 * bare imports resolve through the same `node_modules` chain as the real one,
 * and is deleted again afterwards; the host forgets files that disappeared.
 *
 * What it cannot see: a build that loads fine and then fails inside `apply`.
 * That is only learnable by running it.
 *
 * `checked: false` means the check could not be run (the directory is not
 * writable); the caller proceeds, because refusing every reload on a
 * read-only profile would make the feature useless there.
 */
export declare function preflightBuild(packageDir: string): Promise<Preflight>;
/** What a reload attempt came to. */
export type SelfReloadOutcome = {
    state: 'unsupported';
    /** The host cannot replace modules, or Market has no installed package. */
    reason: 'no-hmr' | 'not-installed';
}
/** The files on disk are the version already running: nothing to do. */
 | {
    state: 'current';
    version: string;
}
/** The new build cannot load. The running market was not touched. */
 | {
    state: 'refused';
    detail: string;
}
/** The new server half is serving. */
 | {
    state: 'reloaded';
    from: string;
    to: string;
}
/** The host could not replace the module; the running market is untouched. */
 | {
    state: 'restart-needed';
    detail: string;
}
/** Another host operation holds the reload queue; the swap will run when it ends. */
 | {
    state: 'queued';
}
/** The swap started and went wrong. `serving` says whether any instance is up. */
 | {
    state: 'failed';
    detail: string;
    serving: boolean;
};
export interface SelfReloadDeps {
    /** The host's HMR service, read at call time. */
    hmr: () => HmrLike | undefined;
    /** The version this process is running. */
    runningVersion: string;
    /** The version of the files on disk, or null when the market is not an installed package. */
    installedVersion: () => string | null;
    /** Where the installed package lives. */
    packageDir: () => string;
    /** This instance's id, from {@link claimInstance}. */
    instanceId: string;
    /** The instance serving now; injectable for the specs. */
    serving?: () => InstanceRecord | undefined;
    /** Defaults to {@link preflightBuild}. */
    preflight?: (packageDir: string) => Promise<Preflight>;
    /** How long to wait for the host's reload queue before reporting `queued`. */
    queueWaitMs?: number;
    /** How long to wait for the new instance to announce itself once the host reports done. */
    settleMs?: number;
    log?: (level: 'info' | 'warn', detail: string) => void;
}
/**
 * Ask the host to replace this market with the version on disk.
 *
 * The caller has already refused when an operation is running: a swap ends
 * the instance that would have finished it. Nothing here writes a file.
 */
export declare function reloadSelf(deps: SelfReloadDeps): Promise<SelfReloadOutcome>;
/**
 * The HTTP answer for an outcome. Every failure says what happened, why and
 * what to do now, in the project's two-language style; the state code is for
 * the page, which decides what to offer next.
 */
export declare function selfReloadReply(outcome: SelfReloadOutcome): {
    status: number;
    body: Record<string, unknown>;
};
