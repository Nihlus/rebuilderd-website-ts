import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to the file system needed by rebuilderd was read-only.
 */
export class ReadOnlyFilesystemBuildFailure implements IBuildFailure {
    format(): string {
        return "File system needed by rebuilderd was read-only";
    }
}

const readOnlyFilesystemRegex = /^rebuilderd: unexpected error while rebuilding package: Read-only file system/m;

/**
 * Classifies instances of build failures due to the file system needed by rebuilderd was read-only.
 */
export class ReadOnlyFilesystemClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (readOnlyFilesystemRegex.test(log)) {
            return new ReadOnlyFilesystemBuildFailure();
        }

        return null;
    }
}
