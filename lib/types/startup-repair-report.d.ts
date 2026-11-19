import type { RepairFailureCause, RepairReport } from './pending-updates.ts';
export type StartupRepairEntry = {
    name: string;
} & ({
    state: 'reinstalled' | 'verified' | 'abandoned';
} | {
    state: 'pending';
    cause: RepairFailureCause;
});
export interface StartupRepairSnapshot {
    id: string;
    revision: number;
    checking: boolean;
    entries: StartupRepairEntry[];
}
/**
 * A later install or update of this package settled in this process, so what
 * start-up repair said about it is out of date. Drop it, or the panel keeps
 * saying "still pending" until the next restart.
 */
export declare function clearStartupRepairEntry(profile: string, directory: string, name: string): void;
/** Track what the existing startup repair found, without owning any package writes. */
export declare function observeStartupRepair(profile: string, directory: string): {
    read: () => StartupRepairSnapshot;
    finish: (report?: RepairReport) => void;
};
