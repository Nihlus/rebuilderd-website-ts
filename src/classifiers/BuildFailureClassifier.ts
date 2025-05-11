import type {PackageRelease} from "../api/RebuilderdAPI.ts";
import DependencyHashSumMismatchClassifier from "./implementations/DependencyHashSumMismatchClassifier.ts";
import {WorkerDependencyMissingClassifier} from "./implementations/WorkerDependencyMissingClassifier.ts";
import {OutOfSpaceClassifier} from "./implementations/OutOfSpaceClassifier.ts";
import {MissingBuildDirectoryClassifier} from "./implementations/MissingBuildDirectoryClassifier.ts";
import {NoExecClassifier} from "./implementations/NoExecClassifier.ts";
import {MissingBuildInfoClassifier} from "./implementations/MissingBuildinfoClassifier.ts";
import {PermissionDeniedClassifier} from "./implementations/PermissionDeniedClassifier.ts";
import {NotReproducibleClassifier} from "./implementations/NotReproducibleClassifier.ts";
import {InvalidPackageVersionClassifier} from "./implementations/InvalidPackageVersionClassifier.ts";
import {MissingBuildDependenciesClassifier} from "./implementations/MissingBuildDependenciesClassifier.ts";
import {SourceBuildFailureClassifier} from "./implementations/SourceBuildFailureClassifier.ts";
import {InvalidSnapshotRepoMetadataClassifier} from "./implementations/InvalidSnapshotRepoMetadataClassifier.ts";
import {NetworkErrorClassifier} from "./implementations/NetworkErrorClassifier.ts";
import {ReadOnlyFilesystemClassifier} from "./implementations/ReadOnlyFilesystemClassifier.ts";
import {InvalidBuildInfoClassifier} from "./implementations/InvalidBuildinfoClassifier.ts";
import {
    BuildDependencyInstallationFailedClassifier
} from "./implementations/BuildDependencyInstallationFailedClassifier.ts";
import {MissingPackageVersionClassifier} from "./implementations/MissingPackageVersionClassifier.ts";

export interface IBuildFailure {
    format(): string;
}

export class UnknownBuildFailure implements IBuildFailure {
    format(): string {
        return "Unknown";
    }
}

export interface IBuildFailureClassifier {
    classify(packageInfo: PackageRelease, log: string): IBuildFailure | null;
}

export default class BuildFailureClassifier {
    static classifiers: IBuildFailureClassifier[] = [];

    public static classify(packageInfo: PackageRelease, log: string): IBuildFailure {
        for (const classifier of BuildFailureClassifier.classifiers) {
            const buildFailure = classifier.classify(packageInfo, log);
            if (buildFailure !== null) {
                return buildFailure;
            }
        }

        return new UnknownBuildFailure();
    }

    public static registerClassifier<T extends IBuildFailureClassifier>(instance: T) {
        BuildFailureClassifier.classifiers.push(instance);
    }
}

BuildFailureClassifier.registerClassifier(new DependencyHashSumMismatchClassifier());
BuildFailureClassifier.registerClassifier(new WorkerDependencyMissingClassifier());
BuildFailureClassifier.registerClassifier(new OutOfSpaceClassifier());
BuildFailureClassifier.registerClassifier(new MissingBuildDirectoryClassifier());
BuildFailureClassifier.registerClassifier(new NoExecClassifier());
BuildFailureClassifier.registerClassifier(new MissingBuildInfoClassifier());
BuildFailureClassifier.registerClassifier(new PermissionDeniedClassifier());
BuildFailureClassifier.registerClassifier(new NotReproducibleClassifier());
BuildFailureClassifier.registerClassifier(new InvalidPackageVersionClassifier());
BuildFailureClassifier.registerClassifier(new MissingBuildDependenciesClassifier());
BuildFailureClassifier.registerClassifier(new SourceBuildFailureClassifier());
BuildFailureClassifier.registerClassifier(new InvalidSnapshotRepoMetadataClassifier());
BuildFailureClassifier.registerClassifier(new NetworkErrorClassifier());
BuildFailureClassifier.registerClassifier(new ReadOnlyFilesystemClassifier());
BuildFailureClassifier.registerClassifier(new InvalidBuildInfoClassifier());
BuildFailureClassifier.registerClassifier(new BuildDependencyInstallationFailedClassifier());
BuildFailureClassifier.registerClassifier(new MissingPackageVersionClassifier());