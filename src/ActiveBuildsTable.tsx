import {useEffect, useMemo, useState} from "react";
import {ActiveBuild, DashboardState} from "./api/RebuilderdAPI.ts";
import {DataTable, type DataTableColumn} from "mantine-datatable";
import {IconHammer} from "@tabler/icons-react";
import {Container} from "@mantine/core";

/**
 * Represents the properties of the ActiveBuildsTable component.
 */
interface ActiveBuildsTableProperties {
    dashboardState: DashboardState | null;
}

/**
 * Renders a list of ongoing builds in the rebuilderd cluster.
 * @param dashboardState The precomputed dashboard state from the server.
 * @constructor
 */
export function ActiveBuildsTable({dashboardState}: ActiveBuildsTableProperties) {
    const columns: DataTableColumn<ActiveBuild>[] = useMemo(() => [
        {
            accessor: "status",
            title: "Status",
            render: () => {
                return (
                    <Container>
                        <IconHammer color="var(--mantine-color-cyan-filled)"/>
                    </Container>
                );
            },
            width: 80
        },
        {
            accessor: "pkgbase.name",
            title: "Name",
            width: 150,
            resizable: true,
            sortable: true
        },
        {accessor: "version", title: "Version"},
        {
            accessor: "pkgbase.architecture",
            title: "Architecture",
            width: 150,
            resizable: true,
            sortable: true
        },
        {
            accessor: "worker_id",
            headerName: "Worker",
            width: 150,
            resizable: true,
            sortable: true
        },
        {
            accessor: "queued_at",
            title: "Queued at",
            render: (record) => record.queued_at?.toUTCString() ?? "Not yet queued",
            minWidth: 250,
            resizable: true,
            sortable: true
        },
        {
            accessor: "started_at",
            title: "Started at",
            render: (record) => record.started_at?.toUTCString() ?? "Not yet started",
            minWidth: 250,
            resizable: true,
            sortable: true
        }
    ], []);

    const PAGE_SIZE = 15;
    const [page, setPage] = useState(1);
    const [records, setRecords] = useState(dashboardState?.active_builds.slice(0, PAGE_SIZE) ?? []);

    useEffect(() => {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;

        setRecords(dashboardState?.active_builds.slice(from, to) ?? []);
    }, [dashboardState?.active_builds, page]);

    return (
        <DataTable
            records={records}
            columns={columns}
            withColumnBorders
            withTableBorder
            striped
            highlightOnHover
            totalRecords={dashboardState?.active_builds.length ?? 0}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={p => setPage(p)}
            fetching={dashboardState == null}
        />
    );
}
