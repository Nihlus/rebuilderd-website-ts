import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import {LineChart} from "@mui/x-charts";
import {useTheme} from "@mui/material/styles";
import {useMemo, useState} from "react";
import {Box, Grid, MenuItem, Select} from "@mui/material";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";

interface RebuildChartProperties {
    api: RebuilderdAPI;
    packages: PackageRelease[] | null;
    architecture?: string;
}

interface RebuildChartSeries {
    xAxis: Date[];
    goodSeries: number[];
    badSeries: number[];
    unknownSeries: number[];
}

type ChartGranularity = "Month" | "Day" | "Hour" | "Auto";

function createDataSeries(
    packages: PackageRelease[] | null,
    granularity: ChartGranularity = "Auto",
    end: Date = new Date(),
    start?: Date
): RebuildChartSeries {
    const xAxis: Date[] = [];
    const goodSeries: number[] = [];
    const badSeries: number[] = [];
    const unknownSeries: number[] = [];

    if (packages === null)
    {
        return {
            xAxis: xAxis,
            goodSeries: goodSeries,
            badSeries: badSeries,
            unknownSeries: unknownSeries
        }
    }

    const sortedBuiltPackages = packages?.filter(p => p.built_at !== undefined).sort((a, b) => a.built_at! < b.built_at! ? -1 : 1);
    if (sortedBuiltPackages.length <= 0) {
        return {
            xAxis: xAxis,
            goodSeries: goodSeries,
            badSeries: badSeries,
            unknownSeries: unknownSeries
        }
    }

    // default to the earliest value
    start ??= sortedBuiltPackages[0].built_at!;

    // try to figure out a good data scope
    if (granularity === "Auto") {
        const timeDifference = end.getTime() - start.getTime();

        const roughHoursBetween = Math.floor(timeDifference / 3600000);
        const roughDaysBetween = Math.floor(timeDifference / 86400000);
        const roughMonthsBetween = Math.floor(timeDifference / 2628000000);

        if (roughHoursBetween <= 100) {
            granularity = "Hour";
        }
        else if (roughDaysBetween <= 100) {
            granularity = "Day";
        }
        else if (roughMonthsBetween <= 100) {
            granularity = "Month";
        }
        else {
            // fall back to months
            granularity = "Month";
        }
    }

    const sampleDate = new Date(start);
    while (sampleDate <= end) {
        const packagesAtSample = sortedBuiltPackages?.filter(p => p.built_at! <= sampleDate);

        let goodPackageCount = 0;
        let badPackageCount = 0;
        for (const pkg of packagesAtSample)
        {
            switch (pkg.status) {
                case "GOOD": {
                    ++goodPackageCount;
                    break;
                }
                case "BAD": {
                    ++badPackageCount;
                    break;
                }
            }
        }

        xAxis.push(new Date(sampleDate));
        goodSeries.push(goodPackageCount);
        badSeries.push(badPackageCount);
        unknownSeries.push(packages.length - goodPackageCount - badPackageCount);

        // increment by one day (JS handles rollover)
        switch (granularity) {
            case "Month": {
                sampleDate.setUTCMonth(sampleDate.getUTCMonth() + 1);
                break;
            }
            case "Day": {
                sampleDate.setUTCDate(sampleDate.getUTCDate() + 1);
                break;
            }
            case "Hour": {
                sampleDate.setUTCHours(sampleDate.getUTCHours() + 1);
                break;
            }
            default: {
                throw new RangeError("Invalid data granularity: " + granularity);
            }
        }
    }

    return {
        xAxis: xAxis,
        goodSeries: goodSeries,
        badSeries: badSeries,
        unknownSeries: unknownSeries
    }
}

export function RebuildChart({packages, architecture}: RebuildChartProperties) {
    if (architecture !== undefined) {
        packages = packages?.filter(p => p.architecture === architecture) ?? null;
    }

    const [granularity, setGranularity] = useState<ChartGranularity>("Auto");
    const [start, setStart] = useState<Date | undefined>(undefined);
    const [end, setEnd] = useState<Date>(new Date());
    const seriesData = useMemo(() => createDataSeries(packages, granularity), [granularity, packages]);
    const theme = useTheme();

    return (
        <Grid id="this one">
            <Box sx={{ flexGrow: 1 }}>
                <LineChart
                    xAxis={[{
                        id: "Date",
                        scaleType: "time",
                        data: seriesData.xAxis,
                        min: seriesData.xAxis[0],
                        max: seriesData.xAxis[-1],
                        valueFormatter: (date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
                    }]}
                    yAxis={[
                        {
                            width: 70,
                        },
                    ]}
                    series={[
                        { type: "line", data: seriesData.goodSeries, label: "GOOD", stack: "total", area: true, showMark: false, color: theme.palette.success.dark },
                        { type: "line", data: seriesData.badSeries, label: "BAD", stack: "total", area: true, showMark: false, color: theme.palette.error.dark },
                        { type: "line", data: seriesData.unknownSeries, label: "UNKWN", stack: "total", area: true, showMark: false, color: theme.palette.warning.dark }
                    ]}
                    loading={packages === null}
                />
            </Box>
            <Grid container direction="row" spacing={6} columns={3}>
                <Select
                    labelId="chart-granularity-select-label"
                    id="chart-granularity-select"
                    label="Granularity"
                    value={granularity} onChange={g => setGranularity(g.target.value as ChartGranularity)}
                >
                    <MenuItem value="Auto">Auto</MenuItem>
                    <MenuItem value="Month">Month</MenuItem>
                    <MenuItem value="Day">Day</MenuItem>
                    <MenuItem value="Hour">Hour</MenuItem>
                </Select>
                <DateTimePicker label="Start" />
                <DateTimePicker label="End" />
            </Grid>
        </Grid>
    );
}
