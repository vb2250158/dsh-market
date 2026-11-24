/** The official Electron profile is owned by DSH's in-process plugin manager. */
import { type DesktopPluginRuntime, type HostPackageManager } from './dsh-cli.ts';
import { PendingUpdateJournal, type RepairReport } from './pending-updates.ts';
interface ManagedResult {
    application: string;
    error?: unknown;
    packageResult?: {
        exitCode: number | null;
        output?: string;
    };
    /**
     * The install never settled and the profile may be half-updated: the route
     * must not try to "restore" it through the same stuck manager.
     */
    repairOnRestart?: boolean;
    /** The refusal is the host's restart-first state, not a plugin in use (#1253). */
    needsRestart?: boolean;
    /**
     * The host stopped or undid its own work: the profile holds what it held
     * before the call. Set by the in-place update path, where a refusal at the
     * target check, a failed removal that never reached pnpm, and a failure the
     * host already rolled back all leave the old version in place.
     */
    untouched?: boolean;
    /** One more plain sentence for the user, appended to the failure's account. */
    note?: string;
    /**
     * The host replaced the running market itself during this call: the
     * instance that asked is already disposed (see `updateInPlace`).
     */
    selfSwapped?: boolean;
    /**
     * The host loaded the new build into the running process itself (HMR):
     * `applied`, not `restart-required`. The old module is gone from memory, so
     * the update route must not say "restart to apply".
     */
    liveSwap?: boolean;
}
/** What `updateBundle` answers (`PluginUpdateResult` in `@deepseek-ai/dsh-plugin-manager` 0.2.2+). */
export interface ManagedUpdateResult {
    from: string;
    to: string;
    /** The last step that ran: the target check, the removal, or the target's install. */
    step: 'check' | 'remove' | 'install';
    result: ManagedResult & {
        changed?: boolean;
        stage?: string;
        target?: string;
    };
    /** Present when the install failed after the old version was removed: the old version's reinstall. */
    restore?: ManagedResult;
}
/** The part of one `listBundles` row the in-place update decision reads. */
export interface ManagedBundleRow {
    name: string;
    installed?: boolean;
    version?: string;
    source?: string;
    /** How `updateBundle` can replace it; absent when it cannot. */
    update?: 'registry' | 'git';
}
export interface OfficialPluginManagerLike {
    installBundle(spec: string, options?: {
        requestId?: string;
        registry?: string;
    }): Promise<ManagedResult>;
    removeBundle(name: string): Promise<ManagedResult>;
    cancelInstall(requestId: string): Promise<unknown>;
    /**
     * Replace an installed bundle with a newer version, in one call. Only dsh
     * 0.2.2 and later: absent on 0.2.1, whose manager has no in-place update, and
     * every caller must feature-detect it.
     */
    updateBundle?(name: string, version: string, options?: {
        registry?: string | null;
        spec?: string;
        requestId?: string;
    }): Promise<ManagedUpdateResult>;
    /** Used with `updateBundle` to learn which bundles it can replace (`update`). */
    listBundles?(): Promise<ManagedBundleRow[]>;
}
/**
 * What a user can actually do when the market cannot perform an operation on
 * the official Desktop profile: the app's own Plugins page runs the same
 * managed pipeline. Bilingual, because it is read in the operations panel.
 */
export declare const OFFICIAL_PAGE_HINT = "\u5B98\u65B9\u684C\u9762\u5BA2\u6237\u7AEF\u7684\u8FD9\u4E2A\u63D2\u4EF6\u64CD\u4F5C\u9700\u8981\u5728\u300C\u8BBE\u7F6E \u2192 \u63D2\u4EF6\u300D\u91CC\u5B8C\u6210\uFF1B\u5E02\u573A\u65E0\u6CD5\u901A\u8FC7\u547D\u4EE4\u884C\u4FEE\u6539\u684C\u9762\u7AEF\u7684 profile\u3002 / On the official desktop app, do this from Settings \u2192 Plugins; the market cannot change the desktop profile through the command line.";
/** `dshmarket@1.66.32` → `dshmarket`; anything that is not a registry name stays unparsed. */
export declare function registryNameOf(spec: string): string | undefined;
/** What an update needs to journal itself and to be repaired later. */
interface UpdateContext {
    profile: string;
    profileDirectory: string;
    journal: PendingUpdateJournal;
    /** Bundled pnpm from the official desktop launcher; only used for the market itself. */
    packageManager?: HostPackageManager | null;
    /** Told when the market starts or ends a pnpm child of its own (the self-update overlay). */
    onOwnChild?: (running: boolean) => void;
    /**
     * The Git commit's package version, for a Git bundle's in-place update: the
     * host demands the exact version the spec will install, and a commit's
     * version is only in its package.json. Null when it cannot be read — the
     * update then takes the remove-and-install path instead.
     */
    gitVersionAt?: (spec: string) => Promise<string | null>;
    /**
     * Hear the host's own steps of one in-place update (`plugin-manager/update-
     * state`) so the page can say which one is running. Returns the unsubscribe.
     */
    watchUpdateSteps?: (requestId: string, listener: (step: string) => void) => () => void;
}
/** Test seam: a new host process starts with nothing pending. */
export declare function forgetRestartPending(): void;
/** The official runtime's own surface, plus the repair a later start owes the profile. */
export interface OfficialDesktopRuntime extends DesktopPluginRuntime {
    /**
     * Finish or undo an update an earlier start left half-applied (#928).
     * Returns after every record settled or was found unrepairable; never throws.
     */
    repairPendingUpdates(): Promise<RepairReport>;
    /**
     * Whether the manager is already running an operation of its own — the
     * state that makes `runPlugin` answer `busy: true` (see
     * `PluginCommandRuntime.busy`). `/dsh-market/status` reports it so the
     * client's queue waits instead of retrying into a refusal every 2s (#1140).
     */
    busy(): boolean;
}
/**
 * Never fall back to `dsh plugin --profile desktop`.
 *
 * Up to dsh 0.2.0-rc.1 the CLI refused that profile outright. From rc.2 it
 * accepts it only when Desktop's own carrier invokes it, with Desktop fully
 * quit — it takes a 120 s lock on the profile's package.json and says "fully
 * quit it before running". The market only ever runs inside a live Desktop, so
 * for the market the answer is the same on every version: the app's own
 * plugin manager is the only door.
 */
export declare function createOfficialDesktopRuntime(managerLookup: () => OfficialPluginManagerLike | undefined, profileName: string, _profileDirectory?: string, packageManager?: HostPackageManager | null, hooks?: Pick<UpdateContext, 'gitVersionAt' | 'watchUpdateSteps'>): OfficialDesktopRuntime;
export {};
