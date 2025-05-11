import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailureClassifier} from "../BuildFailureClassifier.ts";
import type {IBuildFailure} from "../BuildFailureClassifier.ts";

type NotReproducibleReason = "SIZE_DIFFERS" | "SHA1_DIFFERS" | "DIFFERENT_NUMBER_OF_FILES"

export class NotReproducibleBuildFailure implements IBuildFailure {
    failedArtifacts: Map<string, NotReproducibleReason>;

    constructor(failedArtifacts: Map<string, NotReproducibleReason>) {
        this.failedArtifacts = failedArtifacts;
    }

    format(): string {
        return "Not reproducible";
    }
}

const sizeDiffersRegexp = /^size differs for (?<ArtifactName>.+\.u?deb)$/gm
const sha1DiffersRegexp = /^value of sha1 differs for (?<ArtifactName>.+\.u?deb)$/gm
const differentNumberOfFilesRegexp = /new buildinfo contains a different number of files/m

export class NotReproducibleClassifier implements IBuildFailureClassifier {
    classify(packageInfo: PackageRelease, log: string): IBuildFailure | null {
        const failedArtifacts: Map<string, NotReproducibleReason> = new Map();

        let matches: RegExpExecArray | null = null;
        while ((matches = sizeDiffersRegexp.exec(log)) !== null) {
            if (matches.groups === undefined) {
                continue;
            }

            failedArtifacts.set(matches.groups.ArtifactName, "SIZE_DIFFERS");
        }

        while ((matches = sha1DiffersRegexp.exec(log)) !== null) {
            if (matches.groups === undefined) {
                continue;
            }

            failedArtifacts.set(matches.groups.ArtifactName, "SHA1_DIFFERS");
        }

        if (differentNumberOfFilesRegexp.test(log)) {
            failedArtifacts.set(
                `${packageInfo.name}_${packageInfo.version}_${packageInfo.architecture}.buildinfo`,
                "DIFFERENT_NUMBER_OF_FILES"
            );
        }

        if (failedArtifacts.size > 0) {
            return new NotReproducibleBuildFailure(failedArtifacts);
        }

        return null;
    }
}