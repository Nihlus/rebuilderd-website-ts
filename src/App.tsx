import {createTheme, Divider, Flex, Grid, Group, MantineProvider, Space} from '@mantine/core'
import {useCallback, useEffect, useMemo, useState} from "react";
import RebuilderdAPI, {DashboardState, PackageRelease} from "./api/RebuilderdAPI.ts";
import * as config from "./config/config.json";
import {IconCircleCheck, IconCircleX, IconProgress} from "@tabler/icons-react";
import {ActiveBuildsTable} from "./ActiveBuildsTable.tsx";
import {PackageTable} from "./PackageTable.tsx";
import {RebuildChart} from "./RebuildChart.tsx";

/**
 * Holds the general application theme.
 */
const theme = createTheme({});

/**
 * Formats the given count as a percentage of the given total, taking into account if either are undefined.
 * @param count The count.
 * @param total The total.
 */
function formatPercentage(count: number | undefined, total: number | undefined): string {
    if (count === undefined || total === undefined) {
        return "An unknown number";
    }

    return (count / total).toLocaleString(undefined, {style: "percent", minimumFractionDigits: 2});
}

/**
 * Renders the application.
 * @constructor
 */
function App() {
    const api = useMemo(() => {
        return new RebuilderdAPI(new URL(config.rebuilderd_host));
    }, []);

    const [packages, setPackages] = useState<PackageRelease[] | null>(null);
    const fetchPackagesContinuously = useCallback(function fetchPackages() {
        api.listPackages().then(p => {
            setPackages(p);
        }).catch(() => {
            // TODO: do something with the error
        });

        setTimeout(fetchPackages, 60000);
    }, [api]);

    useEffect(fetchPackagesContinuously, [fetchPackagesContinuously]);

    const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
    const fetchDashboardStateContinuously = useCallback(function fetchDashboardState() {
        api.getDashboardState().then(d => {
            setDashboardState(d);
        }).catch(() => {
            // TODO: do something with the error
        });

        setTimeout(fetchDashboardState, 60000);
    }, [api]);

    useEffect(fetchDashboardStateContinuously, [fetchDashboardStateContinuously]);

    const goodPackageCount = dashboardState?.suites.get("main")!.good;
    const badPackageCount = dashboardState?.suites.get("main")!.bad;
    const unknownPackageCount = dashboardState?.suites.get("main")!.unknown;

    const totalPackages = dashboardState === null
        ? undefined
        : goodPackageCount! + badPackageCount! + unknownPackageCount!;

    return (
        <MantineProvider theme={theme} defaultColorScheme={"dark"}>
            <Grid grow columns={2} ml={12} mr={12}>
                <Grid.Col span={1} p={"2vh"} mah={"100vh"}>
                    <Flex direction={"column"} h={"30%"}>
                        <h1>Rebuilder statistics for debian/bookworm amd64</h1>
                        <h2>
                            Success rate breakdown
                            <Divider orientation="horizontal"/>
                        </h2>
                        <Group>
                            <IconCircleCheck color="var(--mantine-color-green-outline)"/>
                            {formatPercentage(goodPackageCount, totalPackages)} of all packages have been bit-for-bit
                            reproduced
                        </Group>
                        <Group>
                            <IconCircleX color="var(--mantine-color-orange-filled)"/>
                            {formatPercentage(badPackageCount, packages?.length)} of all packages have been attempted
                            but failed
                        </Group>
                        <Group>
                            <IconProgress color="var(--mantine-color-yellow-outline)"/>
                            {formatPercentage(unknownPackageCount, packages?.length)} of all packages haven't been
                            attempted yet
                        </Group>
                        <h2>
                            Queue
                            <Divider orientation="horizontal"/>
                        </h2>
                        {dashboardState?.active_builds.length ?? "An unknown number of "} workers are working
                        hard on the following packages.
                    </Flex>
                    <Space h={"xl"}/>
                    <Divider orientation="horizontal"/>
                    <Space h={"xl"}/>
                    <Flex direction={"column"} h={"60%"}>
                        <ActiveBuildsTable dashboardState={dashboardState}/>
                    </Flex>
                </Grid.Col>
                <Grid.Col span={1} p={"2vh"} mah={"100vh"}>
                    <Flex direction={"column"} h={"30%"}>
                        <RebuildChart api={api} packages={packages}/>
                    </Flex>
                    <Space h={"xl"}/>
                    <Divider orientation="horizontal"/>
                    <Space h={"xl"}/>
                    <Flex direction={"column"} h={"60%"}>
                        <PackageTable api={api} packages={packages}/>
                    </Flex>
                </Grid.Col>
            </Grid>
        </MantineProvider>
    );
}


export default App;
