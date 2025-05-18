import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to the rebuilderd worker running out of disk space.
 */
export class OutOfSpaceBuildFailure implements IBuildFailure {
    device?: string;

    /**
     * Initializes a new instance of the OutOfSpaceBuildFailure class.
     * @param device The device that ran out of space.
     */
    constructor(device?: string) {
        this.device = device;
    }

    format(): string {
        if (this.device !== undefined) {
            return `Out of space on ${this.device}`;
        }

        return "Out of space";
    }
}

const genericNoSpaceRegexp = /No space left on device/;

/**
 * Classifies instances of build failures due to the rebuilderd worker running out of disk space.
 */
export class OutOfSpaceClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (genericNoSpaceRegexp.test(log)) {
            return new OutOfSpaceBuildFailure();
        }

        return null;
    }
}
