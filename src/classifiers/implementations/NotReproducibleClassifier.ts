import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailure, IBuildFailureClassifier} from "../BuildFailureClassifier.ts";

/**
 * Enumerates various reasons why an artifact was deemed not reproducible.
 */
type NotReproducibleReason = "SIZE_DIFFERS" | "SHA1_DIFFERS" | "MD5_DIFFERS" | "DIFFERENT_NUMBER_OF_FILES"

/**
 * Represents a build failure due to the resulting artifacts not being reproducible.
 */
export class NotReproducibleBuildFailure implements IBuildFailure {
    failedArtifacts: Map<string, NotReproducibleReason>;

    /**
     * Initializes a new instance of the NotReproducibleBuildFailure class.
     * @param failedArtifacts A map of the names of failed artifacts and the reason why.
     */
    constructor(failedArtifacts: Map<string, NotReproducibleReason>) {
        this.failedArtifacts = failedArtifacts;
    }

    format(): string {
        return "Not reproducible";
    }
}

const sizeDiffersRegexp = /size differs for (?<ArtifactName>.+\.u?deb)$/gm;
const sha1DiffersRegexp = /value of sha1 differs for (?<ArtifactName>.+\.u?deb)$/gm;
const md5DiffersRegexp = /value of md5 differs for (?<ArtifactName>.+\.u?deb)$/gm;
const differentNumberOfFilesRegexp = /new buildinfo contains a different number of files/m;

/**
 * Classifies instances of build failures due to the resulting artifacts not being reproducible.
 */
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

        while ((matches = md5DiffersRegexp.exec(log)) !== null) {
            if (matches.groups === undefined) {
                continue;
            }

            failedArtifacts.set(matches.groups.ArtifactName, "MD5_DIFFERS");
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
