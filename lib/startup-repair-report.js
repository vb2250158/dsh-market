import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { NPM_NAME_RE } from './sources.js';
// The host can unload and evaluate the market module again during a repair.
const REPORTS = Symbol.for('dshmarket.startup-update-repair-reports');
function entriesOf(report) {
    const abandoned = new Set(report.abandoned);
    return [
        ...report.reinstalled.map(name => ({ name, state: 'reinstalled' })),
        ...report.finished.map(name => ({ name, state: 'verified' })),
        ...report.failed.filter(({ name }) => !abandoned.has(name))
            .map(({ name, cause }) => ({ name, cause, state: 'pending' })),
        ...report.abandoned.map(name => ({ name, state: 'abandoned' })),
    ].filter(({ name }) => NPM_NAME_RE.test(name));
}
function keyOf(profile, directory) {
    const absolute = resolve(directory);
    return JSON.stringify([profile, process.platform === 'win32' ? absolute.toLowerCase() : absolute]);
}
/**
 * A later install or update of this package settled in this process, so what
 * start-up repair said about it is out of date. Drop it, or the panel keeps
 * saying "still pending" until the next restart.
 */
export function clearStartupRepairEntry(profile, directory, name) {
    const state = globalThis[REPORTS]?.get(keyOf(profile, directory));
    if (state === undefined || !state.entries.delete(name))
        return;
    state.revision += 1;
}
/** Track what the existing startup repair found, without owning any package writes. */
export function observeStartupRepair(profile, directory) {
    const global = globalThis;
    const reports = global[REPORTS] ??= new Map();
    const key = keyOf(profile, directory);
    const state = reports.get(key) ?? { id: randomUUID(), revision: 0, outstanding: new Set(), entries: new Map() };
    reports.set(key, state);
    const attempt = ++state.revision;
    state.outstanding.add(attempt);
    return {
        read: () => ({
            id: state.id,
            revision: state.revision,
            checking: state.outstanding.size > 0,
            entries: [...state.entries.values()].map(({ entry }) => entry),
        }),
        finish: report => {
            if (!state.outstanding.delete(attempt))
                return;
            state.revision += 1;
            if (report === undefined)
                return;
            for (const entry of entriesOf(report)) {
                const previous = state.entries.get(entry.name);
                if (previous === undefined || previous.attempt <= attempt)
                    state.entries.set(entry.name, { attempt, entry });
            }
        },
    };
}
