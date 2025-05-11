import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class MissingBuildInfoBuildFailure implements IBuildFailure {
    format(): string {
        return "Failed to download .buildinfo";
    }
}

const buildInfoDownloadFailureRegexp = /Failed to download build input from ".+?\.buildinfo"/

export class MissingBuildInfoClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (buildInfoDownloadFailureRegexp.test(log)) {
            return new MissingBuildInfoBuildFailure();
        }

        return null;
    }
}