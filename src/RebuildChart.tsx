import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import {LineChart} from "@mui/x-charts/LineChart";
import {useTheme} from "@mui/material/styles";
import {useMemo, useState} from "react";
import Box from "@mui/material/Box";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import {MenuItem} from "@mui/material";

/**
 * Represents computed data series based on the current known packages.
 */
interface RebuildChartSeries {
    xAxis: Date[];
    goodSeries: number[];
    badSeries: number[];
    unknownSeries: number[];
    selectedGranularity: ChartGranularity;
}

/**
 * Enumerates data granularity levels for the chart.
 */
type ChartGranularity = "Month" | "Day" | "Hour" | "Auto";

/**
 * Computes a set of data series for build statuses over time given the package statuses.
 * @param packages The packages.
 * @param granularity The data granularty to use. Affects the number of data points.
 * @param end The start of the time slice to compute. Defaults to now.
 * @param start The end of the time slice to compute. Defaults to the earliest known build.
 * @return The computed data series.
 */
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

    if (packages === null) {
        return {
            xAxis: xAxis,
            goodSeries: goodSeries,
            badSeries: badSeries,
            unknownSeries: unknownSeries,
            selectedGranularity: "Month"
        };
    }

    const sortedBuiltPackages = packages?.filter(p => p.built_at !== undefined).sort((a, b) => a.built_at! <
    b.built_at! ? -1 : 1);
    if (sortedBuiltPackages.length <= 0) {
        return {
            xAxis: xAxis,
            goodSeries: goodSeries,
            badSeries: badSeries,
            unknownSeries: unknownSeries,
            selectedGranularity: "Month"
        };
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
        } else if (roughDaysBetween <= 200) {
            granularity = "Day";
        } else if (roughMonthsBetween <= 200) {
            granularity = "Month";
        } else {
            // fall back to months
            granularity = "Month";
        }
    }

    let sampleDate = new Date(start);
    while (sampleDate <= end) {
        const packagesAtSample = sortedBuiltPackages?.filter(p => p.built_at! <= sampleDate);

        let goodPackageCount = 0;
        let badPackageCount = 0;
        for (const pkg of packagesAtSample) {
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
    };
}

/**
 * Formates the given date based on the chart granularity.
 * @param date The date to format.
 * @param granularity The data granularity.
 * @return The formatted date.
 */
function formatDate(date: Date, granularity: ChartGranularity): string {
    switch (granularity) {
        case "Month": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
        }
        case "Day": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
        }
        case "Hour": {
            return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
        }
        default: {
            throw new RangeError("Invalid data granularity: " + granularity);
        }
    }
}


/**
 * Represents the properties of the RebuildChart component.
 */
interface RebuildChartProperties {
    api: RebuilderdAPI;
    packages: PackageRelease[] | null;
    architecture?: string;
}

/**
 * Renders a stacked chart of reproduction status data.
 * @param packages The packages.
 * @param architecture The architecture of the packages to render. "all" is always included.
 * @constructor
 */
export function RebuildChart({packages, architecture}: RebuildChartProperties) {
    if (architecture !== undefined) {
        packages = packages?.filter(p => p.architecture === architecture || p.architecture === "all") ?? null;
    }

    const [granularity, setGranularity] = useState<ChartGranularity>("Auto");
    const [start, setStart] = useState<Date | undefined>(undefined);
    const [end, setEnd] = useState<Date | undefined>(undefined);
    const seriesData = useMemo(() => createDataSeries(packages, granularity, end, start), [end, granularity, packages, start]);
    const theme = useTheme();

    return (
        <Grid container direction="column" size="grow">
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
                            {
                                id: "GOOD",
                                type: "line",
                                data: seriesData.goodSeries,
                                label: "GOOD",
                                stack: "total",
                                area: true,
                                showMark: false,
                                color: theme.palette.success.dark
                            },
                            {
                                id: "BAD",
                                type: "line",
                                data: seriesData.badSeries,
                                label: "BAD",
                                stack: "total",
                                area: true,
                                showMark: false,
                                color: theme.palette.error.dark
                            },
                            {
                                id: "UNKWN",
                                type: "line",
                                data: seriesData.unknownSeries,
                                label: "UNKWN",
                                stack: "total",
                                area: true,
                                showMark: false,
                                color: theme.palette.warning.dark
                            }
                        ]}
                        loading={packages === null}
                    />
                </Box>
            </Grid>
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
                <DateTimePicker
                    label="Start"
                    value={dayjs(start ?? seriesData.xAxis[0])}
                    onChange={v => setStart(v?.toDate())}
                    ampm={false}
                />
                <DateTimePicker
                    label="End"
                    value={dayjs(end)}
                    onChange={v => setEnd(v?.toDate() ?? new Date())}
                    ampm={false}
                />
            </Grid>
        </Grid>
    );
}
