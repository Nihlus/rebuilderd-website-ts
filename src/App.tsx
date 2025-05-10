

import {ThemeProvider, createTheme} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {PackageTable} from "./PackageTable.tsx";
import {Box, Grid} from "@mui/material";
import {useEffect, useMemo, useState} from "react";
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

function App() {
    const api = useMemo(() => {
        return new RebuilderdAPI(new URL(config.rebuilderd_host));
    }, []);

    const [packages, setPackages] = useState<PackageRelease[] | null>(null);

    useEffect(() => {
        api.listPackages().then(p => {
            setPackages(p);
        }).catch(() => {
            // TODO: do something with the error
        });
    }, [api]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Grid container size="grow" spacing={5} padding={3}>
                    <Grid size="grow">
                        <RebuildChart api={api} packages={packages} />
                    </Grid>
                    <Grid size="grow" height="100vh" paddingBottom={6}>
                        <PackageTable api={api} packages={packages}/>
                    </Grid>
                </Grid>
            </ThemeProvider>
        </LocalizationProvider>
    );
}


export default App;
