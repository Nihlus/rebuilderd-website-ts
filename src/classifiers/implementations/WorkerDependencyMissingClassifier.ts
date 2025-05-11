import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class WorkerDependencyMissingBuildFailure implements IBuildFailure {
    missingPackages: string[];

    constructor(...missingPackages: string[]) {
        this.missingPackages = missingPackages;
    }

    format(): string {
        return "Missing dependencies on worker: " + this.missingPackages.join(", ");
    }
}

const missingSystemKeyringRegexp = /dscverify: can't find any system keyrings/s
const genericMissingPackageRegexpes = [
    /^(?<PackageName>.+?) is required but not installed/m,
    /you must have the (?<PackageName>.+?) package installed/m,
    /is (?<PackageName>.+?) installed\?/m
]

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