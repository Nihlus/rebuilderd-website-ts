import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to a missing package version.
 */
export class MissingPackageVersionBuildFailure implements IBuildFailure {
    versions: string[];

    constructor(versions: string[]) {
        this.versions = versions;
    }

    format(): string {
        return "Missing package version";
    }
}

const missingVersionsRegexp = /^cannot find:$\n(?<PackageNames>((.+)=.+\n)*)/m;

/**
 * Classifies instances of build failures due to a missing package version.
 */
export class MissingPackageVersionClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const multipleMissingMatches = missingVersionsRegexp.exec(log);
        if (multipleMissingMatches?.groups !== undefined) {
            return new MissingPackageVersionBuildFailure(multipleMissingMatches.groups.PackageNames.split("\n"));
        }

        return null;
    }
}
