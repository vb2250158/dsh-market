import { marketFetch } from './net.ts';
/**
 * The anonymous daily count.
 *
 * One POST per install per UTC day, from the Node side only, carrying five
 * fields (see `Ping`). On a day the user opens the market page, a second POST
 * carries the same five plus `opened: true` — the only thing it adds is that
 * the page was opened, never what was done there. It is on by default and off
 * with one switch in the settings card or with an environment variable.
 * Everything about it is best effort: a failure changes nothing for the user
 * and is never an error.
 */
export declare const TELEMETRY_URL = "https://t.dshmarket.com/v1/ping";
/** The whole payload. Adding a field here is a privacy change: update SECURITY.md. */
export interface Ping {
    id: string;
    v: string;
    hv: string | null;
    kind: 'desktop' | 'web';
    region: string;
    /** Present (and true) only on the day's first open of the market page. */
    opened?: true;
}
interface TelemetryState {
    id?: string;
    lastDay?: string;
    lastOpenDay?: string;
    enabled: boolean;
}
export declare function telemetryFile(home?: string): string;
export declare function readTelemetryState(file?: string): TelemetryState;
/** Turn the count on or off. Keeps the rest of the file; deletes nothing else. */
export declare function setTelemetryEnabled(enabled: boolean, file?: string): void;
/** Why nothing may be sent right now, or null. Explicit opt-outs always win. */
export declare function suppressedBy(env: Record<string, string | undefined>): string | null;
export interface HeartbeatOptions {
    version: string;
    hostVersion: () => string | null;
    kind: () => 'desktop' | 'web';
    region: () => string;
    file?: string;
    env?: Record<string, string | undefined>;
    now?: () => number;
    fetch?: typeof marketFetch;
}
/** Send today's count if it is due. Never throws. */
export declare function sendHeartbeat(options: HeartbeatOptions): Promise<'sent' | 'skipped' | 'failed'>;
/** Note that the market page was opened today, if that has not been sent yet. Never throws. */
export declare function sendOpened(options: HeartbeatOptions): Promise<'sent' | 'skipped' | 'failed'>;
/** Start the schedule: first check after a short delay, then every ~6 hours. */
export declare function startHeartbeat(options: HeartbeatOptions, delayMs?: number, everyMs?: number): () => void;
export {};
