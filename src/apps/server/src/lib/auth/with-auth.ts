import { type NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import type { AppError } from "../error";
import { type BetterSession, getSession } from "./auth";

export type AuthHandlerContext<P, B, Q> = {
	request: NextRequest;
	params: P;
	body: B;
	queryParams: Q;
	session: BetterSession;
};
export type AuthenticatedHandler<P, B, Q> = (
	context: AuthHandlerContext<P, B, Q>,
) => Promise<NextResponse>;

export type AuthenticatedHandlerOptions<P, B, Q> = {
	bodySchema?: ZodType<B>;
	querySchema?: ZodType<Q>;
	paramsSchema?: ZodType<P>;
};

export const withAuth = async <P, B, Q>(
	handler: AuthenticatedHandler<P, B, Q>,
	options?: AuthenticatedHandlerOptions<P, B, Q>,
	onError?: (error: AppError) => NextResponse,
) => {
	return async (req: NextRequest, { params }: { params: Promise<P> }) => {
		const session = await getSession();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const parsedBody = await parseBody<B>(req, options?.bodySchema);
		const parsedParams = await parseParams<P>(params, options?.paramsSchema);
		const parsedQuery = await parseQueryParams<Q>(req, options?.querySchema);

		const context: AuthHandlerContext<P, B, Q> = {
			request: req,
			params: parsedParams,
			body: parsedBody,
			queryParams: parsedQuery,
			session,
		};

		try {
			return await handler(context);
		} catch (error) {
			console.error("Error in authenticated handler:", error);
			if (onError) {
				return onError(error as AppError);
			}
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 },
			);
		}
	};
};

async function parseBody<B>(req: NextRequest, schema?: ZodType<B>): Promise<B> {
	if (req.method === "GET" || req.method === "HEAD") {
		return {} as B; // No body for GET or HEAD requests
	}
	if (!schema) {
		try {
			const data = await req.json();
			return data as B;
		} catch (_error) {
			return {} as B;
		}
	}
	return schema.parse(await req.json());
}

async function parseParams<P>(
	params: Promise<P>,
	schema?: ZodType<P>,
): Promise<P> {
	const resolvedParams = await params;
	if (!schema) {
		return resolvedParams;
	}
	return schema.parse(resolvedParams);
}

function parseQueryParams<Q>(req: NextRequest, schema?: ZodType<Q>): Q {
	if (!schema) {
		return Object.fromEntries(req.nextUrl.searchParams.entries()) as Q;
	}
	return schema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
}
