import {DataGrid, type GridColDef} from "@mui/x-data-grid";
import {useMemo} from "react";
import {DashboardState} from "./api/RebuilderdAPI.ts";
import ConstructionIcon from '@mui/icons-material/Construction';

interface ActiveBuildsTableProperties {
    dashboardState: DashboardState | null;
}

export function ActiveBuildsTable({ dashboardState }: ActiveBuildsTableProperties) {
    const columns: GridColDef[] = useMemo(() => [
        {
            field: "status",
            headerName: "Status",
            renderCell: () => {
                return <ConstructionIcon color="secondary" />;
            },
            width: 60,
            resizable: false,
            filterable: false,
            sortable: false
        },
        {field: "name", headerName: "Name", width: 150, valueGetter: (_, row) => row.pkgbase.name},
        {field: "version", headerName: "Version"},
        {
            field: "architecture",
            headerName: "Architecture",
            width: 150,
            valueGetter: (_, row) => row.pkgbase.architecture
        },
        {field: "worker_id", headerName: "Worker", width: 150},
        {
            field: "queued_at",
            headerName: "Queued at",
            valueFormatter: (value?: Date) => value?.toUTCString() ?? "Not yet queued",
            minWidth: 250
        },
        {
            field: "started_at",
            headerName: "Started at",
            valueFormatter: (value?: Date) => value?.toUTCString() ?? "Not yet started",
            minWidth: 250
        }
    ], []);

    return (
        <DataGrid
            rows={dashboardState?.active_builds ?? []}
            columns={columns}
            getRowId={row => row.id}
            loading={dashboardState === null}
            rowHeight={30}
            columnHeaderHeight={40}
        />
    );
}