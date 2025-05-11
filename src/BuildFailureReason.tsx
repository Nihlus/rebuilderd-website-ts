import type {PackageRelease} from "./api/RebuilderdAPI.ts";
import RebuilderdAPI from "./api/RebuilderdAPI.ts";
import {useState} from "react";
import {useEffect} from "react";
import BuildFailureClassifier from "./classifiers/BuildFailureClassifier.ts";

export interface BuildFailureReasonProperties {
    api: RebuilderdAPI;
    packageInfo: PackageRelease
}

export default function BuildFailureReason({ api, packageInfo }: BuildFailureReasonProperties) {
    const [log, setLog] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (packageInfo.status !== "BAD" || packageInfo.build_id === undefined) {
            return;
        }

        const logUrl = api.getLogUrl(packageInfo.build_id);
        fetch(logUrl).then(res => {
                res.text().then(text => {
                    setLog(text);
                    setIsLoading(false);
                }).catch(() => {
                    setIsLoading(false);
                })
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

    if (log === null) {
        return "No logs available";
    }

    const buildFailure = BuildFailureClassifier.classify(packageInfo, log);
    return buildFailure.format();
}