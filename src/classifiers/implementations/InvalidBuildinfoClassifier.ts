import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class InvalidBuildInfoBuildFailure implements IBuildFailure {
    format(): string {
        return "Invalid .buildinfo";
    }
}

const invalidBuildInfoRegex = /^debrebuild: error: syntax error in .+\.buildinfo at line/m

export class InvalidBuildInfoClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (invalidBuildInfoRegex.test(log)) {
            return new InvalidBuildInfoBuildFailure();
        }

        return null;
    }
}