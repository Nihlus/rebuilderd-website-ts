

import {ThemeProvider, createTheme} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {PackageTable} from "./PackageTable.tsx";
import {Box, Grid} from "@mui/material";
import {useCallback, useEffect, useMemo, useState} from "react";
import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import * as config from "./config/config.json";
import {RebuildChart} from "./RebuildChart.tsx";
import {LocalizationProvider} from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const theme = createTheme({
    colorSchemes: {
        light: true,
        dark: true
    }
});

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

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={determineLocale().toLowerCase()}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Grid container columns={2} spacing={6} padding={3}>
                    <Grid container size="grow" paddingBottom={6} direction="column" spacing={1}>
                        <RebuildChart api={api} packages={packages} />
                    </Grid>
                    <Grid container size="grow">
                        <Box height="100vh" width="100%" paddingBottom={6}>
                            <PackageTable api={api} packages={packages} />
                        </Box>
                    </Grid>
                </Grid>
            </ThemeProvider>
        </LocalizationProvider>
    );
}


export default App;
