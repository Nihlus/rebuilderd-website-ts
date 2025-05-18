import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to a compilation failure during building the actual package.
 */
export class SourceBuildFailureBuildFailure implements IBuildFailure {
    format(): string {
        return "FTBFS";
    }
}

const ftbfsRegexp = /^E: Build failure \(dpkg-buildpackage died with exit .+\)$/m;

/**
 * Classifies instances of build failures due to a compilation failure during building the actual package.
 */
export class SourceBuildFailureClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (ftbfsRegexp.test(log)) {
            return new SourceBuildFailureBuildFailure();
        }

        return null;
    }
}
