import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class SourceBuildFailureBuildFailure implements IBuildFailure {
    format(): string {
        return "FTBFS";
    }
}

const ftbfsRegexp = /^E: Build failure \(dpkg-buildpackage died with exit .+\)$/m

export class SourceBuildFailureClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (ftbfsRegexp.test(log)) {
            return new SourceBuildFailureBuildFailure();
        }

        return null;
    }
}