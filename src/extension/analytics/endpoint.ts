const DEFAULT_DEV_ENDPOINT =
  "https://analytics.sidethreadgpt.com/api/extension-events?env=dev";

const DEFAULT_DEV_TOKEN = "dev";

const getEndpoint = (): string => {
  const env = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (env != null && env !== "") return env;
  return DEFAULT_DEV_ENDPOINT;
};

const getProjectToken = (): string => {
  const env = import.meta.env.VITE_PROJECT_TOKEN;
  if (env != null && env !== "") return env;
  return DEFAULT_DEV_TOKEN;
};

export { getEndpoint, getProjectToken };
