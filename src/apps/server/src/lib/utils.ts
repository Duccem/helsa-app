export function buildNextPagination(
	parsed: { page?: number; pageSize?: number },
	count: number,
): {
	nextPage: number | null;
	count: number;
	prevPage: number | null;
} {
	const totalPages = Math.ceil(count / (parsed.pageSize ?? 10));
	const currentPage = parsed.page ?? 1;
	return {
		nextPage: currentPage < totalPages ? currentPage + 1 : null,
		count,
		prevPage: currentPage > 1 ? currentPage - 1 : null,
	};
}
