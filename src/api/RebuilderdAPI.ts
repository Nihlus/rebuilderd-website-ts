import "reflect-metadata";
import {jsonObject, jsonMember, TypedJSON} from "typedjson";
import {jsonArrayMember} from "typedjson";
import {jsonMapMember} from "typedjson";

export default class RebuilderdAPI {
	rebuilderd_host: URL;

	constructor(host: URL = new URL("https://localhost")) {
		this.rebuilderd_host = host;
	}

	public async listPackages(): Promise<PackageRelease[]> {
		const path = "/api/v0/pkgs/list";
		const response = await fetch(this.buildRebuilderdUrl(path));

		const packageReleaseSerializer = new TypedJSON(PackageRelease);
		return packageReleaseSerializer.parseAsArray(await response.json()) as PackageRelease[];
	}

	public async getDashboardState(): Promise<DashboardState> {
		const path = "/api/v0/dashboard";
		const response = await fetch(this.buildRebuilderdUrl(path));

		const dashboardStateSerializer = new TypedJSON(DashboardState);
		return dashboardStateSerializer.parse(await response.json()) as DashboardState;
	}

	public getLogUrl(buildId: number): URL {
		const path = `/api/v0/builds/${buildId}/log`;
		return this.buildRebuilderdUrl(path);
	}

	buildRebuilderdUrl(path: string): URL {
		return new URL(path, this.rebuilderd_host);
	}
}

@jsonObject
export class DashboardSuite {
	@jsonMember(Number)
	readonly good!: number;

	@jsonMember(Number)
	readonly unknown!: number;

	@jsonMember(Number)
	readonly bad!: number;
}

@jsonObject
export class PackageArtifact {
	@jsonMember(String)
	readonly name!: string;

	@jsonMember(String)
	readonly version!: string;

	@jsonMember(() => URL, { deserializer: value => new URL(value)})
	readonly url!: URL;
}

@jsonObject
export class PackageBase {
	@jsonMember(String)
	readonly name!: string;

	@jsonMember(String)
	readonly version!: string;

	@jsonMember(String)
	readonly distro!: string;

	@jsonMember(String)
	readonly suite!: string;

	@jsonMember(String)
	readonly architecture!: string;

	@jsonMember(() => URL, { deserializer: value => new URL(value)})
	readonly input_url!: URL;

	@jsonArrayMember(PackageArtifact)
	readonly artifacts!: PackageArtifact[];
}

@jsonObject
export class ActiveBuild {
	@jsonMember(Number)
	readonly id!: number;

	@jsonMember(PackageBase)
	readonly pkgbase!: PackageBase;

	@jsonMember(String)
	readonly version!: string;

	@jsonMember(Date)
	readonly queued_at!: Date;

	@jsonMember(Number)
	readonly worker_id!: number;

	@jsonMember(Date)
	readonly started_at!: Date;

	@jsonMember(Date)
	readonly last_ping!: Date;
}

@jsonObject
export class DashboardState {
	@jsonMapMember(String, DashboardSuite, { deserializer: suiteJson => {
		const map = new Map<string, DashboardSuite>();

		const dashboardSuiteSerializer = new TypedJSON(DashboardSuite);
		Object.entries(suiteJson).forEach(([key, value]) => {
			map.set(key as string, dashboardSuiteSerializer.parse(value)!)
		})

		return map;
	}})
	readonly suites!: Map<string, DashboardSuite>;

	@jsonArrayMember(ActiveBuild)
	readonly active_builds!: ActiveBuild[];

	@jsonMember(Number)
	readonly queue_length!: number;

	@jsonMember(Date)
	readonly now!: Date;
}

@jsonObject
export class PackageRelease {
	@jsonMember(String)
	readonly name!: string;

	@jsonMember(String)
	readonly version!: string;

	@jsonMember(String)
	readonly status!: Status;

	@jsonMember(String)
	readonly distro!: string;

	@jsonMember(String)
	readonly suite!: string;

	@jsonMember(String)
	readonly architecture!: string;

	@jsonMember(String)
	readonly artifact_url!: string;

	@jsonMember(Number)
	readonly build_id?: number;

	@jsonMember(Date)
	readonly built_at?: Date;

	@jsonMember(Boolean)
	readonly has_diffoscope!: boolean;

	@jsonMember(Boolean)
	readonly has_attestation!: boolean;
}

export type Status = "GOOD" | "BAD" | "UNKWN";
