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
/** Track what the existing startup repair found, without owning any package writes. */
export declare function observeStartupRepair(profile: string, directory: string): {
    read: () => StartupRepairSnapshot;
    finish: (report?: RepairReport) => void;
};
