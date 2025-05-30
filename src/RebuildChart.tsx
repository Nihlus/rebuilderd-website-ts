import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import {useMemo, useState} from "react";
import {Combobox, Group, Input, InputBase, Stack, useCombobox} from "@mantine/core";
import {AreaChart} from "@mantine/charts";
import {DateTimePicker} from "@mantine/dates";

interface RebuildChartDataPoint {
    tick: string;
    date: Date;
    good: number;
    bad: number;
    unknown: number;
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
): RebuildChartDataPoint[] {
    const data: RebuildChartDataPoint[] = [];
    let selectedGranularity: ChartGranularity = "Month"

    if (packages === null) {
        return data;
    }

    const sortedBuiltPackages = packages?.filter(p => p.built_at !== undefined).sort((a, b) => a.built_at! <
    b.built_at! ? -1 : 1);
    if (sortedBuiltPackages.length <= 0) {
        return data;
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
            selectedGranularity = "Hour";
        } else if (roughDaysBetween <= 200) {
            selectedGranularity = "Day";
        } else if (roughMonthsBetween <= 200) {
            selectedGranularity = "Month";
        } else {
            // fall back to months
            selectedGranularity = "Month";
        }
    } else {
        selectedGranularity = granularity;
    }

    const sampleDate = new Date(start);
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

        data.push({
            tick: formatDate(sampleDate, selectedGranularity),
            date: new Date(sampleDate),
            good: goodPackageCount,
            bad: badPackageCount,
            unknown: packages.length - goodPackageCount - badPackageCount
        })

        // increment by one unit (JS handles rollover)
        switch (selectedGranularity) {
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
        }
    }

    return data;
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
    const data = useMemo(() => createDataSeries(packages, granularity, end, start), [end, granularity, packages, start]);

    const granularityCombobox = useCombobox({
        onDropdownClose: () => granularityCombobox.resetSelectedOption()
    });

    return (
        <Stack justify={"flex-start"}>
            <AreaChart
                type="percent"
                curveType="natural"
                data={data}
                dataKey="tick"
                series={[
                    {
                        name: "bad",
                        label: "Bad",
                        color: "var(--mantine-color-orange-filled)"
                    },
                    {
                        name: "good",
                        label: "Good",
                        color: "var(--mantine-color-green-outline)"
                    },
                    {
                        name: "unknown",
                        label: "Unknown",
                        color: "var(--mantine-color-cyan-filled)"
                    }
                ]}
                h={300}
                withLegend
            />
            <Group>
                <Combobox
                    store={granularityCombobox}
                    onOptionSubmit={value => {
                        setGranularity(value as ChartGranularity);
                        granularityCombobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <InputBase
                            label={"Granularity"}
                            component={"button"}
                            type={"button"}
                            miw={150}
                            pointer
                            rightSection={<Combobox.Chevron/>}
                            rightSectionPointerEvents={"none"}
                            onClick={() => granularityCombobox.toggleDropdown()}
                        >
                            {granularity || <Input.Placeholder>Select data granularity</Input.Placeholder>}
                        </InputBase>
                    </Combobox.Target>
                    <Combobox.Dropdown>
                        <Combobox.Options>
                            <Combobox.Option value={"Auto"} key={"Auto"}>Auto</Combobox.Option>
                            <Combobox.Option value={"Month"} key={"Month"}>Month</Combobox.Option>
                            <Combobox.Option value={"Day"} key={"Day"}>Day</Combobox.Option>
                            <Combobox.Option value={"Hour"} key={"Hour"}>Hour</Combobox.Option>
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
                <DateTimePicker
                    label="Start"
                    value={start ?? data[0]?.date ?? new Date()}
                    onChange={v => setStart(v == null ? data[0]?.date ?? new Date() : new Date(v))}
                    miw={150}
                />
                <DateTimePicker
                    label="End"
                    value={end ?? new Date()}
                    onChange={v => setEnd(v == null ? new Date() : new Date(v))}
                    miw={150}
                />
            </Group>
        </Stack>
    );
}
