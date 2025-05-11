import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class BuildDependencyInstallationFailedBuildFailure implements IBuildFailure {
    format(): string {
        return "Build dependencies failed to install";
    }
}

const mmdebstrapFailedRegexp = /^E: mmdebstrap failed to run$/m

export class BuildDependencyInstallationFailedClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (mmdebstrapFailedRegexp.test(log)) {
            return new BuildDependencyInstallationFailedBuildFailure();
        }

        return null;
    }
}