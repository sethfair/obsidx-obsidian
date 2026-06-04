import { requestUrl } from "obsidian";

/** One result chunk returned by `obsidx-recall-server`. */
export interface ObsidxResult {
	score: number;
	path: string;
	heading_path: string;
	status: string;
	scope: string;
	start_line: number;
	end_line: number;
	content: string;
	category_weight: number;
	tags: string[] | null;
}

interface SearchResponse {
	results: ObsidxResult[] | null;
	error?: string;
}

/** Normalize a base URL: trim whitespace and any trailing slashes. */
export function normalizeBaseUrl(url: string): string {
	return url.trim().replace(/\/+$/, "");
}

/** Build the JSON body for a `/search` POST. candidate_k widens recall. */
export function buildSearchBody(query: string, topN: number) {
	return {
		query,
		top_n: topN,
		candidate_k: Math.max(topN * 5, 50),
	};
}

/**
 * Thin client over the local obsidx recall server.
 *
 * Uses Obsidian's `requestUrl` rather than `fetch` so requests to
 * http://localhost:8765 are made natively and bypass the renderer's CORS
 * preflight (the Go server does not send CORS headers).
 */
export class ObsidxClient {
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = normalizeBaseUrl(baseUrl);
	}

	private url(path: string): string {
		return this.baseUrl + path;
	}

	/** Returns true if the recall server answers /health with 2xx. */
	async health(): Promise<boolean> {
		try {
			const res = await requestUrl({
				url: this.url("/health"),
				method: "GET",
				throw: false,
			});
			return res.status >= 200 && res.status < 300;
		} catch {
			return false;
		}
	}

	/** Run a semantic search. Throws on transport / server error. */
	async search(query: string, topN: number): Promise<ObsidxResult[]> {
		const res = await requestUrl({
			url: this.url("/search"),
			method: "POST",
			contentType: "application/json",
			body: JSON.stringify(buildSearchBody(query, topN)),
			throw: false,
		});

		if (res.status < 200 || res.status >= 300) {
			throw new Error(`obsidx server returned HTTP ${res.status}`);
		}

		const data = res.json as SearchResponse;
		if (data.error) {
			throw new Error(data.error);
		}
		return data.results ?? [];
	}
}
