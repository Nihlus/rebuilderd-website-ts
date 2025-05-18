import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to an invalid package version. This means the version is malformed, missing from the
 * snapshots repo, or otherwise unavailable.
 */
export class InvalidPackageVersionBuildFailure implements IBuildFailure {
    version: string;

    constructor(version: string) {
        this.version = version;
    }

    format(): string {
        return "Invalid package version";
    }
}

const notAValidVersionRegex = /^debsnap: error: (?<Version>.+) is not a valid version$/m;

/**
 * Classifies instances of build failures due to an invalid package version.
 */
export class InvalidPackageVersionClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const matches = notAValidVersionRegex.exec(log);
        if (matches === null || matches.groups === undefined) {
            return null;
        }

        return new InvalidPackageVersionBuildFailure(matches.groups.Version);
    }
}
