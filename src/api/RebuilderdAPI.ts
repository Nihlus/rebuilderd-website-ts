import "reflect-metadata";
import {jsonObject, jsonMember, TypedJSON} from "typedjson";

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

	public getLogUrl(buildId: number): URL {
		const path = `/api/v0/builds/${buildId}/log`;
		return this.buildRebuilderdUrl(path);
	}

	buildRebuilderdUrl(path: string): URL {
		return new URL(path, this.rebuilderd_host);
	}
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
