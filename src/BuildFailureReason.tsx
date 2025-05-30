import type {PackageRelease} from "./api/RebuilderdAPI.ts";
import RebuilderdAPI from "./api/RebuilderdAPI.ts";
import {useEffect, useState} from "react";
import BuildFailureClassifier, {type IBuildFailure} from "./classifiers/BuildFailureClassifier.ts";

/**
 * Represents the properties of the BuildFailureReason component.
 */
export interface BuildFailureReasonProperties {
    api: RebuilderdAPI;
    packageInfo: PackageRelease;
}

/**
 * Renders a short explanation of a build failure for the given package, fetching the build logs if required and
 * classifying them.
 * @param api The rebuilderd API.
 * @param packageInfo The base information of the package.
 * @constructor
 */
export default function BuildFailureReason({api, packageInfo}: BuildFailureReasonProperties) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [buildFailure, setBuildFailure] = useState<IBuildFailure | undefined | null>(undefined)

    useEffect(() => {
        if (packageInfo.status !== "BAD" || packageInfo.build_id === undefined) {
            return;
        }

        const logUrl = api.getLogUrl(packageInfo.build_id);
        fetch(logUrl).then(res => {
                res.text().then(text => {
                    setBuildFailure(BuildFailureClassifier.classify(packageInfo, text))
                    setIsLoading(false);
                }).catch(() => {
                    setIsLoading(false);
                });
            }
        ).catch(() => {
            setIsLoading(false);
        });
    }, [api, packageInfo]);

    if (packageInfo.status !== "BAD") {
        return null;
    }

    if (isLoading) {
        return "Checking...";
    }

    return buildFailure?.format();
}
