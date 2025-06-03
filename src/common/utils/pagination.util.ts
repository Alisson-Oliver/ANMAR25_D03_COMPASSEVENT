interface PaginateOptions {
  page?: number;
  limit?: number;
}

export function getPaginationParams({ page = 1, limit = 10 }: PaginateOptions) {
  const take = limit;
  const skip = (page - 1) * limit;
  return { skip, take };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit),
    },
  };
}
