import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to the rebuilderd worker's temporary directory being mounted noexec.
 */
export class NoExecBuildFailure implements IBuildFailure {
    format(): string {
        return "Build directory is mounted noexec";
    }
}

const debianRulesNoExecRegexp = /^Can't exec "debian\/rules": Permission denied/m;

/**
 * Classifies instances of build failures due to the rebuilderd worker's temporary directory being mounted noexec.
 */
export class NoExecClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (debianRulesNoExecRegexp.test(log)) {
            return new NoExecBuildFailure();
        }

        return null;
    }
}
