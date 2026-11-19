/** Checkout links disconnected before replacing a local build. */
export interface PendingCheckoutLink {
    name: string;
    spec: string;
    rawTarget: string;
}
export interface CheckoutRecoveryEntry {
    name: string;
    reason: 'profile-busy' | 'package-run' | 'writer-lock' | 'check-failed';
    sourceExists: boolean;
}
export interface CheckoutRecoveryStatus {
    checking: boolean;
    entries: CheckoutRecoveryEntry[];
}
export declare class PendingCheckoutLinks {
    readonly file: string;
    constructor(profileDirectory: string);
    list(): PendingCheckoutLink[];
    record(item: PendingCheckoutLink): void;
    save(operations: PendingCheckoutLink[]): void;
}
/**
 * Claim the same exclusive profile writer lock as rc.3's plugin manager.
 * An occupied lock is left for the host to release or take over.
 */
export declare function withIdleProfile<T>(profileDirectory: string, action: () => T): T | null;
type HostProfileLock = <T>(file: string, action: () => Promise<T>, options: {
    waitMs: number;
}) => Promise<T>;
/** Resolve the lock implementation from the host's own plugin manager. */
export declare function loadHostProfileLock(installDirectory: string | null): Promise<HostProfileLock | null>;
/** A pnpm child may survive the process that owned the writer lock. */
export declare function hasUnsettledPackageRun(profileDirectory: string): boolean;
export {};
