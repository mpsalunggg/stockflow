import { useCallback } from "react";
import { useSearchParams } from "react-router";

const maxLimit = 100;

type ParamValue = string | number | undefined;

function toPositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function useTableParams({ defaultLimit = 10 } = {}) {
  const [params, setParams] = useSearchParams();

  const page = toPositiveInt(params.get("page"), 1);
  const limit = Math.min(toPositiveInt(params.get("limit"), defaultLimit), maxLimit);
  const search = params.get("search") ?? "";

  const update = useCallback(
    (changes: Record<string, ParamValue>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPage = useCallback(
    (value: number) => update({ page: value > 1 ? value : undefined }, false),
    [update],
  );
  const setLimit = useCallback(
    (value: number) => update({ limit: value === defaultLimit ? undefined : value }),
    [update, defaultLimit],
  );
  const setSearch = useCallback((value: string) => update({ search: value }), [update]);
  const setFilter = useCallback(
    (key: string, value: ParamValue) => update({ [key]: value }),
    [update],
  );
  const getFilter = (key: string) => params.get(key) ?? "";

  return { page, limit, search, setPage, setLimit, setSearch, getFilter, setFilter, update };
}
