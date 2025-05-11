import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

export class OutOfSpaceBuildFailure implements IBuildFailure {
    device?: string

    constructor(device?: string) {
        this.device = device
    }

    format(): string {
        if (this.device !== undefined) {
            return `Out of space on ${this.device}`
        }

        return "Out of space";
    }
}

const genericNoSpaceRegexp = /No space left on device/

export class OutOfSpaceClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        if (genericNoSpaceRegexp.test(log)) {
            return new OutOfSpaceBuildFailure();
        }

        return null;
    }
}