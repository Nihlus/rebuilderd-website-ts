import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to an invalid .buildinfo file.
 */
export class InvalidBuildInfoBuildFailure implements IBuildFailure {
    format(): string {
        return "Invalid .buildinfo";
    }
}

const invalidBuildInfoRegex = /^debrebuild: error: syntax error in .+\.buildinfo at line/m;

/**
 * Classifies instances of build failures due to an invalid .buildinfo file.
 */
export class InvalidBuildInfoClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (invalidBuildInfoRegex.test(log)) {
            return new InvalidBuildInfoBuildFailure();
        }

        return null;
    }
}
