import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to invalid or unavailable snapshot repo metadata.
 */
export class InvalidSnapshotRepoMetadataBuildFailure implements IBuildFailure {
    format(): string {
        return "Invalid snapshot repo metadata";
    }
}

const invalidSignedFileRegex = /^\s+Clearsigned file isn't valid, got '(?<Reason>.+)' \(does the network require authentication\?\)/m;
const badRepoRequestRegex = /^ERROR:root:don't know how to handle this request: http:\/\/snapshot.debian.org/m;

/**
 * Classifies instances of build failures due to invalid or unavailable snapshot repo metadata.
 */
export class InvalidSnapshotRepoMetadataClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (invalidSignedFileRegex.test(log)) {
            return new InvalidSnapshotRepoMetadataBuildFailure();
        }

        if (badRepoRequestRegex.test(log)) {
            return new InvalidSnapshotRepoMetadataBuildFailure();
        }

        return null;
    }
}
