import type { ReleaseNotes } from './changelog.ts';
interface HistoryRelease extends ReleaseNotes {
    tag: string;
    commit: string | null;
}
interface RepositoryHistory {
    complete: boolean;
    releases: HistoryRelease[];
}
export interface ReleaseHistory {
    items: VersionedRelease[];
    partial: boolean;
}
type VersionedRelease = ReleaseNotes & {
    version: string;
};
export interface ReleaseHistorySource {
    repo: string;
    packageName: string;
    allowPlainTag: boolean;
}
export declare function isCommitId(value: string): boolean;
export declare function invalidateReleaseHistory(): void;
export declare function loadReleaseHistory(origin: string, repo: string): Promise<RepositoryHistory | null>;
/** A sibling's version or a number embedded in an unrelated tag is not a package release. */
export declare function packageReleaseVersion(tag: string | null, source: ReleaseHistorySource): string | null;
/** Installed and target versions are given by npm, or by exact release-tag SHAs for Git. */
export declare function releaseHistoryBetween(data: RepositoryHistory | null, source: ReleaseHistorySource, installed: string, target: string, current: string | null): {
    history: ReleaseHistory;
    targetVersion: string | null;
    targetCommit: string | null;
    preview: VersionedRelease | null;
};
export {};
