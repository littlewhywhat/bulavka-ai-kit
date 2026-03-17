const DEFAULT_DEV_ENDPOINT =
  "https://analytics.sidethreadgpt.com/api/extension-events?env=dev";

const DEFAULT_DEV_BASE = "https://analytics.sidethreadgpt.com";

const getEndpoint = (): string => {
  const env = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (env != null && env !== "") return env;
  return DEFAULT_DEV_ENDPOINT;
};

const getAnalyticsBase = (): string => {
  const env = import.meta.env.VITE_ANALYTICS_BASE;
  if (env != null && env !== "") return env;
  return DEFAULT_DEV_BASE;
};

const getProjectToken = (): string => import.meta.env.VITE_PROJECT_TOKEN ?? "";

export { getAnalyticsBase, getEndpoint, getProjectToken };
