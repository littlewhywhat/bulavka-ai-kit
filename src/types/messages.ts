import type { MessageResponse } from "../common/types";

type WeatherData = {
  city: string;
  temp: number;
  condition: string;
};

type BackgroundMessages = {
  "get-weather": {
    request: { city: string };
    response: MessageResponse<WeatherData>;
  };
  "get-status": {
    request: undefined;
    response: MessageResponse<{ enabled: boolean }>;
  };
};

type ContentMessages = {
  "toggle-ui": {
    request: { visible: boolean };
    response: undefined;
  };
};

export type {
  WeatherData,
  BackgroundMessages,
  ContentMessages,
};
