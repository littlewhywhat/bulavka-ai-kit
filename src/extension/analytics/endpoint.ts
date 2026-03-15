const DEFAULT_DEV =
  "https://analytics.sidethreadgpt.com/api/extension-events?env=dev";

const getEndpoint = (): string => {
  const env = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (env != null && env !== "") return env;
  return DEFAULT_DEV;
};

export { getEndpoint };
