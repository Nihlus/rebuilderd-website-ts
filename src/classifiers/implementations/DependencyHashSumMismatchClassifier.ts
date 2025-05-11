import type { PackageRelease } from "../../api/RebuilderdAPI.ts";
import type {IBuildFailure, IBuildFailureClassifier} from "../BuildFailureClassifier.ts";

export class DependencyHashSumMismatchBuildFailure implements IBuildFailure {
    public readonly file: string;

    public readonly expectedSha256Sum: string;
    public readonly expectedMd5Sum: string;
    public readonly expectedFilesize: number;

    public readonly actualSha256Sum: string;
    public readonly actualMd5Sum: string;
    public readonly actualFilesize: number;

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
        this.actualSha256Sum = receivedSha256Sum;
        this.actualMd5Sum = receivedMd5Sum;
        this.actualFilesize = receivedFilesize;
    }

    format(): string {
        if (this.actualFilesize === 0) {
            return "Received dependency with filesize zero";
        }

        if (this.actualSha256Sum !== this.expectedSha256Sum) {
            return "SHA256 sum of received dependency did not match";
        }

        if (this.actualMd5Sum !== this.expectedMd5Sum) {
            return "MD5 sum of received dependency did not match";
        }

        if (this.actualFilesize !== this.expectedFilesize) {
            return "Filesize of received dependency did not match";
        }

        return "Dependency hash sum mismatch";
    }
}

const hashSumRegexp: RegExp = /Failed to fetch (?<File>.+\.u?deb)\s*Hash Sum mismatch.+Hashes of expected file:.+?SHA256:(?<ExpectedSHA256>[0-9a-z]+).+?MD5Sum:(?<ExpectedMD5Sum>[0-9a-z]+).+?Filesize:(?<ExpectedFilesize>[0-9]+).*Hashes of received file:.+?.+?SHA256:(?<ReceivedSHA256>[0-9a-z]+).+?MD5Sum:(?<ReceivedMD5Sum>[0-9a-z]+).+?Filesize:(?<ReceivedFilesize>[0-9]+)/s

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
