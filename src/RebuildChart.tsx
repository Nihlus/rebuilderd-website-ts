import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import {type ChartsAxisData, LineChart} from "@mui/x-charts";
import {useTheme} from "@mui/material/styles";
import {useMemo, useState} from "react";
import {Box, Grid, MenuItem, Select} from "@mui/material";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

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
    selectedGranularity: ChartGranularity;
}

type ChartGranularity = "Month" | "Day" | "Hour" | "Auto";

function createDataSeries(
    packages: PackageRelease[] | null,
    granularity: ChartGranularity = "Auto",
    end?: Date,
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
            unknownSeries: unknownSeries,
            selectedGranularity: "Month"
        }
    }

    const sortedBuiltPackages = packages?.filter(p => p.built_at !== undefined).sort((a, b) => a.built_at! < b.built_at! ? -1 : 1);
    if (sortedBuiltPackages.length <= 0) {
        return {
            xAxis: xAxis,
            goodSeries: goodSeries,
            badSeries: badSeries,
            unknownSeries: unknownSeries,
            selectedGranularity: "Month"
        }
    }

    // default to the earliest value
    end ??= new Date();
    start ??= sortedBuiltPackages[0].built_at!;

    // try to figure out a good data scope
    if (granularity === "Auto") {
        const timeDifference = end.getTime() - start.getTime();

        const roughHoursBetween = Math.floor(timeDifference / 3600000);
        const roughDaysBetween = Math.floor(timeDifference / 86400000);
        const roughMonthsBetween = Math.floor(timeDifference / 2628000000);

        if (roughHoursBetween <= 200) {
            granularity = "Hour";
        }
        else if (roughDaysBetween <= 200) {
            granularity = "Day";
        }
        else if (roughMonthsBetween <= 200) {
            granularity = "Month";
        }
        else {
            // fall back to months
            granularity = "Month";
        }
    }

    let sampleDate = new Date(start);
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

        if (sampleDate == end) {
            break;
        }

        // increment by one unit (JS handles rollover)
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

        // always capture the last data point as now
        if (sampleDate > end) {
            sampleDate = end;
        }
    }

    return {
        xAxis: xAxis,
        goodSeries: goodSeries,
        badSeries: badSeries,
        unknownSeries: unknownSeries,
        selectedGranularity: granularity
    }
}

function formatDate(date: Date, granularity: ChartGranularity): string {
    switch (granularity) {
        case "Month": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}`
        }
        case "Day": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
        }
        case "Hour": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
        }
        default: {
            throw new RangeError("Invalid data granularity: " + granularity);
        }
    }
}

export function RebuildChart({packages, architecture}: RebuildChartProperties) {
    if (architecture !== undefined) {
        packages = packages?.filter(p => p.architecture === architecture) ?? null;
    }

    const [granularity, setGranularity] = useState<ChartGranularity>("Auto");
    const [start, setStart] = useState<Date | undefined>(undefined);
    const [end, setEnd] = useState<Date | undefined>(undefined);
    const seriesData = useMemo(() => createDataSeries(packages, granularity, end, start), [end, granularity, packages, start]);
    const [axisData, setAxisData] = useState<ChartsAxisData | null>();
    const theme = useTheme();

    return (
        <Grid container direction="column" size="grow">
            <Grid container size="auto" direction="row" spacing={2} columns={3}>
                <Box minWidth={200}>
                    <Select
                        labelId="chart-granularity-select-label"
                        id="chart-granularity-select"
                        label="Granularity"
                        value={granularity} onChange={g => setGranularity(g.target.value as ChartGranularity)}
                        fullWidth={true}
                    >
                        <MenuItem value="Auto">Auto</MenuItem>
                        <MenuItem value="Month">Month</MenuItem>
                        <MenuItem value="Day">Day</MenuItem>
                        <MenuItem value="Hour">Hour</MenuItem>
                    </Select>
                </Box>
                <DateTimePicker label="Start" value={dayjs(start ?? seriesData.xAxis[0])} onChange={v => setStart(v?.toDate())} ampm={false} />
                <DateTimePicker label="End" value={dayjs(end)} onChange={v => setEnd(v?.toDate() ?? new Date())} ampm={false} />
            </Grid>
            <Grid size="grow">
                <Box display="flex" alignItems="stretch" width="100%" height="100%">
                    <LineChart
                        xAxis={[{
                            id: "Date",
                            scaleType: "time",
                            data: seriesData.xAxis,
                            min: seriesData.xAxis[0],
                            max: seriesData.xAxis[-1],
                            valueFormatter: (date) => formatDate(date, seriesData.selectedGranularity)
                        }]}
                        yAxis={[
                            {
                                width: 70,
                            },
                        ]}
                        series={[
                            { id: "GOOD", type: "line", data: seriesData.goodSeries, label: "GOOD", stack: "total", area: true, showMark: false, color: theme.palette.success.dark },
                            { id: "BAD", type: "line", data: seriesData.badSeries, label: "BAD", stack: "total", area: true, showMark: false, color: theme.palette.error.dark },
                            { id: "UNKWN", type: "line", data: seriesData.unknownSeries, label: "UNKWN", stack: "total", area: true, showMark: false, color: theme.palette.warning.dark }
                        ]}
                        loading={packages === null}
                        onAxisClick={(_, d) => setAxisData(d)}
                    />
                </Box>
            </Grid>
        </Grid>
    );
}
