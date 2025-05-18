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

/**
 * Represents information about a failure to reproducibly build a package.
 */
export interface IBuildFailure {
    /**
     * Formats the build failure in a human-readable manner. This should return a short, descriptive string that is
     * unique among the various build failure types.
     * @return The descriptive string.
     */
    format(): string;
}

/**
 * Represents a build failure that we have no understanding of (yet). This class is used when no classifier matches the
 * build logs.
 */
export class UnknownBuildFailure implements IBuildFailure {
    format(): string {
        return "Unknown";
    }
}

/**
 * Represents a class that inspects a package, its build log, and determines whether it can identify a single cause of
 * the build failing to complete.
 */
export interface IBuildFailureClassifier {
    /**
     * Inspects the given package, determining whether this classifier can identify a single cause of the build failing
     * to complete.
     * @param packageInfo The base package information.
     * @param log The build log.
     * @return The identified build failure.
     */
    classify(packageInfo: PackageRelease, log: string): IBuildFailure | null;
}

/**
 * Exposes static, single-point access to all available build failure classifiers.
 */
export default class BuildFailureClassifier {
    /**
     * Holds the registered classifiers.
     */
    static classifiers: IBuildFailureClassifier[] = [];

    /**
     * Inspects the given package, determining whether this classifier can identify a single cause of the build failing
     * to complete.
     * @param packageInfo The base package information.
     * @param log The build log.
     * @return The identified build failure.
     */
    public static classify(packageInfo: PackageRelease, log: string): IBuildFailure {
        for (const classifier of BuildFailureClassifier.classifiers) {
            const buildFailure = classifier.classify(packageInfo, log);
            if (buildFailure !== null) {
                return buildFailure;
            }
        }

        return new UnknownBuildFailure();
    }

    /**
     * Registers the given classifier, enabling its use when classifying build logs.
     * @param instance The classifier to register.
     */
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
