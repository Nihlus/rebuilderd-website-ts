import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class MissingBuildDependenciesBuildFailure implements IBuildFailure {
    format(): string {
        return "Missing build dependencies";
    }
}

const missingBuildDependenciesRegex = /^The following packages have unmet dependencies:$/m

export class MissingBuildDependenciesClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (missingBuildDependenciesRegex.test(log)) {
            return new MissingBuildDependenciesBuildFailure();
        }

        return null;
    }
}