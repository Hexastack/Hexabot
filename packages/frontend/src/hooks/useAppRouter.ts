/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback, useMemo } from "react";
import {
  NavigateOptions,
  Params,
  To,
  useLocation,
  useNavigate,
  useParams,
  useRoutes,
  useSearchParams,
} from "react-router-dom";

import { routes } from "@/routes";
import { RouteObjectItem } from "@/routes/routeConfig";

export type QueryValue = string | string[] | undefined;

export interface UrlObject {
  pathname?: string;
  hash?: string;
  query?: Record<string, QueryValue>;
}

export interface AppRouter {
  pathname: string;
  asPath: string;
  query: Record<string, QueryValue>;
  isReady: boolean;
  push: (
    url: To | UrlObject,
    state?: NavigateOptions["state"],
  ) => Promise<boolean>;
  replace: (
    url: To | UrlObject,
    state?: NavigateOptions["state"],
  ) => Promise<boolean>;
  reload: () => void;
  params: Readonly<Params<string>>;
  routeObject: RouteObjectItem;
  element: React.ReactElement | null;
}

const buildSearchString = (query?: Record<string, QueryValue>) => {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "undefined") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry !== "undefined") {
          searchParams.append(key, entry);
        }
      });
    } else {
      searchParams.append(key, value);
    }
  });

  const searchString = searchParams.toString();

  return searchString ? `?${searchString}` : "";
};
const resolveUrlObject = (url: UrlObject): string => {
  const pathname = url.pathname || "/";
  const search = buildSearchString(url.query);
  const hash = url.hash
    ? url.hash.startsWith("#")
      ? url.hash
      : `#${url.hash}`
    : "";

  return `${pathname}${search}${hash}`;
};
const normalizeTo = (url: To | UrlObject): To => {
  if (typeof url === "string") {
    return url;
  }

  return resolveUrlObject(url);
};

export const useAppRouter = (): AppRouter => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const element = useRoutes(routes);
  const { match } = element?.props;
  const [searchParams] = useSearchParams();
  const query = useMemo<Record<string, QueryValue>>(() => {
    const queryEntries: Record<string, QueryValue> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        queryEntries[key] = value as QueryValue;
      }
    });

    searchParams.forEach((value, key) => {
      if (queryEntries[key]) {
        const existingValue = queryEntries[key];

        if (Array.isArray(existingValue)) {
          queryEntries[key] = [...existingValue, value];
        } else {
          queryEntries[key] = [existingValue as string, value];
        }
      } else {
        queryEntries[key] = value;
      }
    });

    return queryEntries;
  }, [params, searchParams]);
  const asPath = `${location.pathname}${location.search}${location.hash}`;
  const push = useCallback(
    async (url: To | UrlObject, state?: NavigateOptions["state"]) => {
      navigate(normalizeTo(url), { state });

      return true;
    },
    [navigate],
  );
  const replace = useCallback(
    async (url: To | UrlObject, state?: NavigateOptions["state"]) => {
      navigate(normalizeTo(url), { replace: true, state });

      return true;
    },
    [navigate],
  );
  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    pathname: location.pathname,
    asPath,
    query,
    isReady: true,
    push,
    replace,
    reload,
    params,
    element,
    routeObject: match.route,
  };
};
