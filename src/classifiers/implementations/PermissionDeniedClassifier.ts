import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to missing permissions on the sbuild temporary directory.
 */
export class PermissionDeniedBuildFailure implements IBuildFailure {
    format(): string {
        return "Missing permssions on sbuild tempdir";
    }
}

const unableToAccessRegexp = /^E: unable to access (?<Path>.+)$/m;

/**
 * Classifies instances of build failures due to missing permissions on the sbuild temporary directory.
 */
export class PermissionDeniedClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const matches = unableToAccessRegexp.exec(log);
        if (matches === null || matches.groups === undefined) {
            return null;
        }

        const missingPath = matches.groups.Path;
        const basename = missingPath.substring(missingPath.lastIndexOf("/") + 1);

        if (basename.startsWith("tmp.sbuild")) {
            return new PermissionDeniedBuildFailure();
        }

        return null;
    }
}
