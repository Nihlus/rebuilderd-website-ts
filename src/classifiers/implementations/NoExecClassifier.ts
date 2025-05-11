import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class NoExecBuildFailure implements IBuildFailure {
    format(): string {
        return "Build directory is mounted noexec";
    }
}

const debianRulesNoExecRegexp = /^Can't exec "debian\/rules": Permission denied/m

export class NoExecClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (debianRulesNoExecRegexp.test(log)) {
            return new NoExecBuildFailure();
        }

        return null;
    }
}