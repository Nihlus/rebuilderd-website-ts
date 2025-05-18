import type {PackageRelease} from "../../api/RebuilderdAPI.ts";
import type {IBuildFailure, IBuildFailureClassifier} from "../BuildFailureClassifier.ts";

/**
 * Represents a build failure due to downloaded dependencies not having the expected hash or filesize. While relatively
 * common, it's not known exactly why this happens intermittently.
 */
export class DependencyHashSumMismatchBuildFailure implements IBuildFailure {
    /**
     * Holds the name of the file that had a mismatch.
     */
    public readonly file: string;

    /**
     * Holds the expected SHA256 sum of the file.
     */
    public readonly expectedSha256Sum: string;

    /**
     * Holds the expected MD5 sum of the file
     */
    public readonly expectedMd5Sum: string;

    /**
     * Holds the expected size of the file.
     */
    public readonly expectedFilesize: number;

    /**
     * Holds the received SHA256 sum of the file.
     */
    public readonly receivedSha256Sum: string;

    /**
     * Holds the received MD5 sum of the file.
     */
    public readonly receivedMd5Sum: string;

    /**
     * Holds the received size of the file.
     */
    public readonly receivedFilesize: number;

    /**
     * Initializes a new instance of the DependencyHashSumMismatchBuildFailure class.
     * @param file The name of the file that had a mismatch.
     * @param expectedSha256Sum The expected SHA256 sum of the file.
     * @param expectedMd5Sum The expected MD5 sum of the file.
     * @param expectedFilesize The expected size of the file.
     * @param receivedSha256Sum The received SHA256 sum of the file.
     * @param receivedMd5Sum The received MD5 sum of the file.
     * @param receivedFilesize The received size of the file.
     */
    constructor(
        file: string,
        expectedSha256Sum: string,
        expectedMd5Sum: string,
        expectedFilesize: number,
        receivedSha256Sum: string,
        receivedMd5Sum: string,
        receivedFilesize: number
    ) {
        this.file = file;
        this.expectedSha256Sum = expectedSha256Sum;
        this.expectedMd5Sum = expectedMd5Sum;
        this.expectedFilesize = expectedFilesize;
        this.receivedSha256Sum = receivedSha256Sum;
        this.receivedMd5Sum = receivedMd5Sum;
        this.receivedFilesize = receivedFilesize;
    }

    format(): string {
        if (this.receivedFilesize === 0) {
            return "Received dependency with filesize zero";
        }

        if (this.receivedSha256Sum !== this.expectedSha256Sum) {
            return "SHA256 sum of received dependency did not match";
        }

        if (this.receivedMd5Sum !== this.expectedMd5Sum) {
            return "MD5 sum of received dependency did not match";
        }

        if (this.receivedFilesize !== this.expectedFilesize) {
            return "Filesize of received dependency did not match";
        }

        return "Dependency hash sum mismatch";
    }
}

const hashSumRegexp: RegExp = /Failed to fetch (?<File>.+\.u?deb)\s*Hash Sum mismatch.+Hashes of expected file:.+?SHA256:(?<ExpectedSHA256>[0-9a-z]+).+?MD5Sum:(?<ExpectedMD5Sum>[0-9a-z]+).+?Filesize:(?<ExpectedFilesize>[0-9]+).*Hashes of received file:.+?.+?SHA256:(?<ReceivedSHA256>[0-9a-z]+).+?MD5Sum:(?<ReceivedMD5Sum>[0-9a-z]+).+?Filesize:(?<ReceivedFilesize>[0-9]+)/s;

/**
 * Classifies instances of build failures due to downloaded dependencies not having the expected hash or filesize.
 */
export default class DependencyHashSumMismatchClassifier implements IBuildFailureClassifier {
    classify(_: PackageRelease, log: string): IBuildFailure | null {
        const matches = hashSumRegexp.exec(log);
        if (matches === null) {
            return null;
        }

        if (matches.groups === undefined) {
            return null;
        }

        return new DependencyHashSumMismatchBuildFailure(
            matches.groups.File,
            matches.groups.ExpectedSHA256,
            matches.groups.ExpectedMD5Sum,
            Number(matches.groups.ExpectedFilesize),
            matches.groups.ReceivedSHA256,
            matches.groups.ReceivedMD5Sum,
            Number(matches.groups.ReceivedFilesize)
        );
    }
}
