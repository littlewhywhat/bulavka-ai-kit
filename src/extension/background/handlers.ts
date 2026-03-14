import { Effect, pipe } from "effect";
import { onBackgroundMessage } from "../shared/messaging";
import { storage } from "../shared/storage";

const getWeather = (city: string) =>
  pipe(
    Effect.tryPromise(() => storage.get("enabled")),
    Effect.flatMap((enabled) =>
      enabled
        ? Effect.succeed({ city, temp: 72, condition: "Sunny" })
        : Effect.fail("extension-disabled" as const),
    ),
    Effect.tap((weather) =>
      Effect.sync(() => console.log("Weather requested:", weather)),
    ),
  );

const registerHandlers = () => {
  onBackgroundMessage("get-weather", async (payload) => {
    return pipe(
      getWeather(payload.city),
      Effect.match({
        onSuccess: (data) => ({ ok: true as const, data }),
        onFailure: (error) => ({ ok: false as const, error: String(error) }),
      }),
      Effect.runPromise,
    );
  });

  onBackgroundMessage("get-status", async () => {
    const enabled = await storage.get("enabled");
    return { ok: true as const, data: { enabled } };
  });
};

export { registerHandlers };
