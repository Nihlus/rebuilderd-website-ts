import {useEffect, useMemo, useState} from "react";
import RebuilderdAPI, {PackageRelease} from "./api/RebuilderdAPI.ts";
import BuildFailureReason from "./BuildFailureReason.tsx";
import {DataTable, type DataTableColumn, type DataTableSortStatus} from "mantine-datatable";
import {IconCircleCheck, IconCircleX, IconProgress} from "@tabler/icons-react";
import {Anchor, Container} from "@mantine/core";
import sortBy from 'lodash/sortBy';

/**
 * Represents the properties of the PackageTable component.
 */
interface PackageTableProperties {
    api: RebuilderdAPI;
    packages: PackageRelease[] | null;
}

/**
 * Renders a list of known packages and their status.
 * @param api The rebuilderd api.
 * @param packages The known packages.
 * @constructor
 */
export function PackageTable({api, packages}: PackageTableProperties) {
    const columns: DataTableColumn<PackageRelease>[] = useMemo(() => [
        {
            accessor: "status",
            title: "Status",
            render: (record) => {
                switch (record.status) {
                    case "GOOD": {
                        return (
                            <Container>
                                <IconCircleCheck color="var(--mantine-color-green-outline)"/>
                            </Container>
                        );
                    }
                    case "BAD": {
                        return (
                            <Container>
                                <IconCircleX color="var(--mantine-color-orange-filled)"/>
                            </Container>
                        );
                    }
                    case "UNKWN": {
                        return (
                            <Container>
                                <IconProgress color="var(--mantine-color-yellow-outline)"/>
                            </Container>
                        );
                    }
                }
            },
            sortable: true,
            resizable: false
        },
        {
            accessor: "name",
            title: "Name", width: 150,
            resizable: true,
            sortable: true
        },
        {
            accessor: "version",
            title: "Version",
            resizable: true,
            sortable: true
        },
        {
            accessor: "architecture",
            title: "Architecture",
            width: 150,
            resizable: true,
            sortable: true
        },
        {
            accessor: "built_at",
            title: "Built at",
            render: (record) => {
                if (record.built_at === undefined || record.build_id === undefined) {
                    return "Not yet built";
                }

                return (
                    <Anchor href={api.getLogUrl(record.build_id).toString()} size={"sm"}>
                        {record.built_at.toUTCString()}
                    </Anchor>
                );
            },
            minWidth: 250,
            resizable: true,
            sortable: true
        },
        {
            accessor: "failure_reason",
            title: "Reason",
            render: (record) => <BuildFailureReason api={api} packageInfo={record}/>,
            minWidth: 350,
            resizable: true,
            sortable: true
        }
    ], [api]);

    const PAGE_SIZE = 100;
    const [page, setPage] = useState(1);
    const [records, setRecords] = useState(packages?.slice(0, PAGE_SIZE) ?? []);

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<PackageRelease>>({
        columnAccessor: "name",
        direction: "asc"
    });

    useEffect(() => {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;

        let sorted = sortBy(packages, sortStatus.columnAccessor);
        if (sortStatus.direction === "desc") {
            sorted = sorted.reverse();
        }

        setRecords(sorted.slice(from, to));
    }, [packages, page, sortStatus]);

    return (
        <DataTable
            records={records}
            columns={columns}
            totalRecords={packages?.length ?? 0}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={p => setPage(p)}
            fetching={packages == null}
            withColumnBorders
            withTableBorder
            striped
            highlightOnHover
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            verticalSpacing={0}
        />
    );
}
