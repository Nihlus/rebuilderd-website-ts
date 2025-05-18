import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to a network error.
 */
export class NetworkErrorBuildFailure implements IBuildFailure {
    format(): string {
        return "Network error";
    }
}

const networkUnreachableRegex = /^OSError: \[Errno 101\] Network is unreachable$/m;
const connectionResetRegex = /^ConnectionResetError: \[Errno 104\] Connection reset by peer$/m;
const brokenPipeRegex = /^BrokenPipeError: \[Errno 32] Broken pipe$/m;

/**
 * Classifiers instances of a build failure due to a network error.
 */
export class NetworkErrorClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (networkUnreachableRegex.test(log)) {
            return new NetworkErrorBuildFailure();
        }

        if (connectionResetRegex.test(log)) {
            return new NetworkErrorBuildFailure();
        }

        if (brokenPipeRegex.test(log)) {
            return new NetworkErrorBuildFailure();
        }

        return null;
    }
}
