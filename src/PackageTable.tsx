import {useMemo} from "react";
import RebuilderdAPI, {PackageRelease, type Status} from "./api/RebuilderdAPI.ts";
import {DataGrid, type GridCellParams, type GridColDef} from "@mui/x-data-grid";
import {Link} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelCircleIcon from "@mui/icons-material/Cancel";
import PendingCircleIcon from "@mui/icons-material/Pending";
import BuildFailureReason from "./BuildFailureReason.tsx";

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
    const columns: GridColDef[] = useMemo(() => [
        {
            field: "status",
            headerName: "Status",
            renderCell: (params: GridCellParams<PackageRelease, Status>) => {
                switch (params.value) {
                    case "GOOD": {
                        return <CheckCircleIcon color="success"/>;
                    }
                    case "BAD": {
                        return <CancelCircleIcon color="error"/>;
                    }
                    case "UNKWN": {
                        return <PendingCircleIcon color="info"/>;
                    }
                    default: {
                        return null;
                    }
                }
            },
            resizable: false
        },
        {field: "name", headerName: "Name", width: 150},
        {field: "version", headerName: "Version"},
        {field: "architecture", headerName: "Architecture", width: 150},
        {
            field: "built_at",
            headerName: "Built at",
            renderCell: (params: GridCellParams<PackageRelease>) => {
                if (params.row.built_at === undefined || params.row.build_id === undefined) {
                    return "Not yet built";
                }

                return (
                    <Link href={api.getLogUrl(params.row.build_id).toString()}>
                        {params.row.built_at.toUTCString()}
                    </Link>
                );
            },
            minWidth: 250
        },
        {
            field: "failure_reason",
            headerName: "Reason",
            renderCell: (params: GridCellParams<PackageRelease>) => <BuildFailureReason api={api}
                                                                                        packageInfo={params.row}/>,
            minWidth: 350
        }
    ], [api]);

    return (
        <DataGrid
            checkboxSelection={true}
            rows={packages ?? []}
            columns={columns}
            getRowId={row => `${row.name}-${row.version}_${row.architecture}`}
            loading={packages === null}
            rowHeight={30}
            columnHeaderHeight={40}
        />
    );
}
