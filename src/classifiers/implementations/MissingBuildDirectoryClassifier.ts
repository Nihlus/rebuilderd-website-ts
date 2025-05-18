import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

type MissingComponent = "rebuilderd" | "debootsnap" | "mmdebstrap" | "generic";

/**
 * Represents a build failure due to a missing directory on the rebuilderd worker.
 */
export class MissingBuildDirectoryBuildFailure implements IBuildFailure {
    path: string;
    component: MissingComponent;

    constructor(path: string, component: MissingComponent) {
        this.path = path;
        this.component = component;
    }

    format(): string {
        if (this.component === "generic") {
            return "Missing path on worker: " + this.path;
        }

        return `Missing temporary directory for  ${this.component}`;
    }
}

const missingDirRegexp = /No such file or directory.+at path "(?<MissingPath>.+)"/;

/**
 * Classifies instances of build failures due to a missing directory on the rebuilderd worker.
 */
export class MissingBuildDirectoryClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const matches = missingDirRegexp.exec(log);
        if (matches === null || matches.groups === undefined) {
            return null;
        }

        const missingPath = matches.groups.MissingPath;
        const basename = missingPath.substring(missingPath.lastIndexOf("/") + 1);

        if (basename.startsWith("rebuilderd")) {
            return new MissingBuildDirectoryBuildFailure(missingPath, "rebuilderd");
        }

        return null;
    }
}
