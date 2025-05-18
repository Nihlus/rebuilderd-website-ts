import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to build dependencies not installing properly. This can be caused by a variety of
 * issues (missing dependencies, network errors, etc.) but we bundle them together into one category.
 */
export class BuildDependencyInstallationFailedBuildFailure implements IBuildFailure {
    format(): string {
        return "Build dependencies failed to install";
    }
}

const mmdebstrapFailedRegexp = /^E: mmdebstrap failed to run$/m;

/**
 * Classifies instances of build failures due to build dependencies not installing properly.
 */
export class BuildDependencyInstallationFailedClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (mmdebstrapFailedRegexp.test(log)) {
            return new BuildDependencyInstallationFailedBuildFailure();
        }

        return null;
    }
}
