import {createTheme, ThemeProvider} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {PackageTable} from "./PackageTable.tsx";
import {Box, Grid} from "@mui/material";
import {useCallback, useEffect, useMemo, useState} from "react";
import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import {DashboardState} from "./api/RebuilderdAPI.ts";
import * as config from "./config/config.json";
import {RebuildChart} from "./RebuildChart.tsx";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelCircleIcon from "@mui/icons-material/Cancel";
import PendingCircleIcon from "@mui/icons-material/Pending";
import {ActiveBuildsTable} from "./ActiveBuildsTable.tsx";

/**
 * Holds the general application theme.
 */
const theme = createTheme({
    colorSchemes: {
        light: true,
        dark: true
    }
});

/**
 * Determines the current user's locale.
 */
function determineLocale(): string {
    // All modern browsers support this. Should match what's used by localeCompare() etc.
    const intl = window.Intl;
    if (intl !== undefined) {
        return intl.NumberFormat().resolvedOptions().locale;
    }

    // Fall back to ranked choice locales, which are configured in the browser but aren't necessarily
    // what's used in functions like localeCompare().
    const languages = navigator.languages as (string[] | undefined);
    if (languages !== undefined && languages.length > 0) {
        return languages[0];
    }

    // Old standard.
    return navigator.language ?? "en-US";
}

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
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={determineLocale().toLowerCase()}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Grid container columns={2} spacing={6} padding={3}>
                    <Grid container size="grow" paddingBottom={6} direction="column" spacing={2}>
                        <Grid size="grow" direction="column" spacing={0}>
                            <h1>Rebuilder statistics for debian/bookworm amd64</h1>
                            <h2>
                                Success rate breakdown
                                <Divider orientation="horizontal"/>
                            </h2>
                            <p>
                                <span style={{display: "flex", alignItems: "center"}}>
                                    <CheckCircleIcon color="success"
                                                     style={{marginRight: 6}}/><span>{formatPercentage(goodPackageCount, totalPackages)} of all packages have been bit-for-bit reproduced</span>
                                </span>
                                <span style={{display: "flex", alignItems: "center"}}>
                                    <CancelCircleIcon color="error"
                                                      style={{marginRight: 6}}/><span>{formatPercentage(badPackageCount, packages?.length)} of all packages have been attempted but failed</span>
                                </span>
                                <span style={{display: "flex", alignItems: "center"}}>
                                    <PendingCircleIcon color="info"
                                                       style={{marginRight: 6}}/><span>{formatPercentage(unknownPackageCount, packages?.length)} of all packages haven't been attempted yet</span>
                                </span>
                            </p>
                            <h2>
                                Queue
                                <Divider orientation="horizontal"/>
                            </h2>
                            <p>
                                {dashboardState?.active_builds.length ?? "An unknown number of "} workers are working
                                hard on the following packages.
                            </p>
                            <Grid container size="grow">
                                <Box maxHeight={300} width="100%">
                                    <ActiveBuildsTable dashboardState={dashboardState}/>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid size="auto">
                            <Divider orientation="horizontal"/>
                        </Grid>
                        <Grid container size="grow">
                            <RebuildChart api={api} packages={packages}/>
                        </Grid>
                    </Grid>
                    <Grid container size="grow">
                        <Box maxHeight="95vh" width="100%">
                            <PackageTable api={api} packages={packages}/>
                        </Box>
                    </Grid>
                </Grid>
            </ThemeProvider>
        </LocalizationProvider>
    );
}


export default App;
