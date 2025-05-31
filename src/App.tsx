import {AppShell, Burger, createTheme, Divider, Group, Image, MantineProvider, Stack, Text} from '@mantine/core'
import {useCallback, useEffect, useMemo, useState} from "react";
import RebuilderdAPI, {DashboardState, PackageRelease} from "./api/RebuilderdAPI.ts";
import * as config from "./config/config.json";
import {IconCircleCheck, IconCircleX, IconProgress} from "@tabler/icons-react";
import {ActiveBuildsTable} from "./ActiveBuildsTable.tsx";
import {PackageTable} from "./PackageTable.tsx";
import {RebuildChart} from "./RebuildChart.tsx";
import {useDisclosure} from "@mantine/hooks";

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

    const [opened, {toggle}] = useDisclosure();

    return (
        <MantineProvider theme={theme} defaultColorScheme={"dark"}>
            <AppShell
                header={{
                    height: 60
                }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: {mobile: !opened}
                }}
                padding={"md"}
            >
                <AppShell.Header>
                    <Burger opened={opened} onClick={toggle} hiddenFrom={"sm"} size={"sm"}/>
                    <Group wrap={"nowrap"}>
                        <Image
                            src={"/rb-logo-only.svg"}
                            w={"auto"}
                            fit={"contain"}
                            h={"calc(var(--app-shell-header-height, 0px))"}
                            p={10}
                        />
                        <Text size={"xl"} fw={700}>Rebuilderd statistics</Text>
                    </Group>
                </AppShell.Header>

                <AppShell.Navbar p={"md"}>
                    bookworm/amd64
                </AppShell.Navbar>

                <AppShell.Main>
                    <Group
                        grow
                        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px) - var(--mantine-spacing-xl))"
                    >
                        <Stack justify={"flex-start"} h={"100%"}>
                            <div>
                                <h2>
                                    Success rate breakdown
                                    <Divider orientation="horizontal"/>
                                </h2>
                                <Group wrap={"nowrap"}>
                                    <IconCircleCheck color="var(--mantine-color-green-outline)"/>
                                    {formatPercentage(goodPackageCount, totalPackages)} of all packages have been
                                    bit-for-bit
                                    reproduced
                                </Group>
                                <Group wrap={"nowrap"}>
                                    <IconCircleX color="var(--mantine-color-orange-filled)"/>
                                    {formatPercentage(badPackageCount, packages?.length)} of all packages have been
                                    attempted
                                    but failed
                                </Group>
                                <Group wrap={"nowrap"}>
                                    <IconProgress color="var(--mantine-color-yellow-outline)"/>
                                    {formatPercentage(unknownPackageCount, packages?.length)} of all packages haven't
                                    been
                                    attempted yet
                                </Group>
                            </div>

                            <div>
                                <h2>
                                    Queue
                                    <Divider orientation="horizontal"/>
                                </h2>
                                {dashboardState?.active_builds.length ?? "An unknown number of "} workers are working
                                hard on the following packages.
                            </div>

                            <Divider orientation="horizontal"/>

                            <ActiveBuildsTable dashboardState={dashboardState}/>
                        </Stack>
                        <Stack justify={"flex-start"} h={"100%"}>
                            <RebuildChart api={api} packages={packages}/>

                            <Divider orientation="horizontal"/>

                            <PackageTable api={api} packages={packages}/>
                        </Stack>
                    </Group>
                </AppShell.Main>
            </AppShell>
        </MantineProvider>
    );
}


export default App;
