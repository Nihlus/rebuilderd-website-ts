import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to a missing dependency on the rebuilderd worker.
 */
export class WorkerDependencyMissingBuildFailure implements IBuildFailure {
    missingPackages: string[];

    /**
     * Initializes a new instance of the WorkerDependencyMissingBuildFailure class.
     * @param missingPackages The names of the missing packages.
     */
    constructor(...missingPackages: string[]) {
        this.missingPackages = missingPackages;
    }

    format(): string {
        return "Missing dependencies on worker: " + this.missingPackages.join(", ");
    }
}

const missingSystemKeyringRegexp = /dscverify: can't find any system keyrings/s;
const genericMissingPackageRegexpes = [
    /^(?<PackageName>.+?) is required but not installed/m,
    /you must have the (?<PackageName>.+?) package installed/m,
    /is (?<PackageName>.+?) installed\?/m
];

/**
 * Classifies instances of build failures due to a missing dependency on the rebuilderd worker.
 */
export class WorkerDependencyMissingClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const missingPackages: string[] = [];

        if (missingSystemKeyringRegexp.test(log)) {
            missingPackages.push("debian-keyring");
        }

        for (const regexp of genericMissingPackageRegexpes) {
            const genericMatches = regexp.exec(log);
            if (genericMatches?.groups !== undefined) {
                missingPackages.push(genericMatches.groups.PackageName);
            }
        }

        if (missingPackages.length <= 0) {
            return null;
        }

        return new WorkerDependencyMissingBuildFailure(...missingPackages);
    }
}
