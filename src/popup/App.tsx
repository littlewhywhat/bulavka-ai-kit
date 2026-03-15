import {
  Box,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  TextField,
  Theme,
} from "@radix-ui/themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { storage } from "../extension/shared/storage";

const ABSOLUTE_MAX = 50;
const PINS_KEY = "bulavka-ai-kit-pins";
const CHATS_KEY = "bulavka-ai-kit-pinned-chats";

const useColorScheme = (): "dark" | "light" => {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return dark ? "dark" : "light";
};

const parseStoredCount = (raw: unknown): number => {
  if (!raw || typeof raw !== "string") return 0;
  try {
    return (JSON.parse(raw) as unknown[]).length;
  } catch {
    return 0;
  }
};

const readCounts = async () => {
  const [pinsResult, chatsResult] = await Promise.all([
    chrome.storage.sync.get(PINS_KEY),
    chrome.storage.sync.get(CHATS_KEY),
  ]);
  return {
    pinCount: parseStoredCount(pinsResult[PINS_KEY]),
    chatCount: parseStoredCount(chatsResult[CHATS_KEY]),
  };
};

type FormValues = {
  initialPinsVisible: number;
  maxPins: number;
  initialPinnedChatsVisible: number;
  maxPinnedChats: number;
};

type NumberStepperProps = {
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
  onBoundary: (msg: string) => void;
  min: number;
  max: number;
  minMessage: string;
  maxMessage: string;
};

const MinusSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
  </svg>
);

const PlusSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const NumberStepper = ({
  value,
  onChange,
  onBlur,
  onBoundary,
  min,
  max,
  minMessage,
  maxMessage,
}: NumberStepperProps) => {
  const [display, setDisplay] = useState(String(value));
  const [error, setError] = useState(false);

  useEffect(() => {
    setDisplay(String(value));
    setError(false);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);

    if (raw === "") {
      setError(true);
      return;
    }

    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n) || String(n) !== raw) {
      setError(true);
      return;
    }

    if (n < min) {
      setError(true);
      onBoundary(minMessage);
      return;
    }
    if (n > max) {
      setError(true);
      onBoundary(maxMessage);
      return;
    }

    setError(false);
    onChange(n);
  };

  const handleBlur = () => {
    setDisplay(String(value));
    setError(false);
    onBlur();
  };

  const step = (delta: number) => {
    const next = value + delta;
    if (next < min) {
      onBoundary(minMessage);
      return;
    }
    if (next > max) {
      onBoundary(maxMessage);
      return;
    }
    onChange(next);
  };

  return (
    <Flex align="center" gap="1">
      <TextField.Root
        value={display}
        onChange={handleInput}
        onBlur={handleBlur}
        color={error ? "red" : undefined}
        style={{ width: 56, textAlign: "center" }}
        size="2"
      />
      <IconButton
        size="1"
        variant="soft"
        color="gray"
        type="button"
        onClick={() => step(-1)}
      >
        <MinusSvg />
      </IconButton>
      <IconButton
        size="1"
        variant="soft"
        color="gray"
        type="button"
        onClick={() => step(1)}
      >
        <PlusSvg />
      </IconButton>
    </Flex>
  );
};

const DEFAULT_STATUS = "Adjust pin and favourite limits";

const App = () => {
  const appearance = useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const [counts, setCounts] = useState({ pinCount: 0, chatCount: 0 });
  const [statusMsg, setStatusMsg] = useState(DEFAULT_STATUS);
  const [statusVariant, setStatusVariant] = useState<
    "info" | "success" | "error"
  >("info");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { control, reset, watch, setValue, getValues } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      initialPinsVisible: 3,
      maxPins: 5,
      initialPinnedChatsVisible: 3,
      maxPinnedChats: 5,
    },
  });

  const maxPins = watch("maxPins");
  const maxPinnedChats = watch("maxPinnedChats");

  useEffect(() => {
    Promise.all([storage.getAll(), readCounts()]).then(([s, c]) => {
      reset({
        initialPinsVisible: s.initialPinsVisible,
        maxPins: s.maxPins,
        initialPinnedChatsVisible: s.initialPinnedChatsVisible,
        maxPinnedChats: s.maxPinnedChats,
      });
      setCounts(c);
      setLoaded(true);
    });
  }, [reset]);

  const resetStatus = useCallback(() => {
    setStatusMsg(DEFAULT_STATUS);
    setStatusVariant("info");
  }, []);

  const showStatus = useCallback(
    (msg: string, variant: "success" | "error", durationMs = 3000) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatusMsg(msg);
      setStatusVariant(variant);
      timerRef.current = setTimeout(resetStatus, durationMs);
    },
    [resetStatus],
  );

  const showSaved = useCallback(
    () => showStatus("Updated. Refresh ChatGPT page if needed", "success"),
    [showStatus],
  );

  const showError = useCallback(
    (msg: string) => showStatus(msg, "error", 2000),
    [showStatus],
  );

  const save = useCallback(
    (key: keyof FormValues, value: number) => {
      storage.set(key, value);

      if (key === "maxPins") {
        const visible = getValues("initialPinsVisible");
        if (visible > value) {
          setValue("initialPinsVisible", value);
          storage.set("initialPinsVisible", value);
        }
      }
      if (key === "maxPinnedChats") {
        const visible = getValues("initialPinnedChatsVisible");
        if (visible > value) {
          setValue("initialPinnedChatsVisible", value);
          storage.set("initialPinnedChatsVisible", value);
        }
      }

      showSaved();
    },
    [showSaved, getValues, setValue],
  );

  if (!loaded) return null;

  return (
    <Theme appearance={appearance} accentColor="gray" radius="medium">
      <Box p="4">
        <Heading size="4" mb="2">
          Bulavka AI Kit
        </Heading>

        <Box mb="3" py="1" style={{ minHeight: 20 }}>
          <Text
            size="1"
            color={
              statusVariant === "success"
                ? "green"
                : statusVariant === "error"
                  ? "red"
                  : "gray"
            }
          >
            {statusMsg}
          </Text>
        </Box>

        <Flex direction="column" gap="3">
          <Text size="2" weight="bold" color="gray">
            Pinned Replies
          </Text>

          <Flex align="center" justify="between">
            <Text size="2">Initially visible</Text>
            <Controller
              name="initialPinsVisible"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    save("initialPinsVisible", v);
                  }}
                  onBlur={field.onBlur}
                  onBoundary={showError}
                  min={1}
                  max={maxPins}
                  minMessage="Minimum is 1"
                  maxMessage={`Can't exceed maximum (${maxPins})`}
                />
              )}
            />
          </Flex>

          <Flex align="center" justify="between">
            <Text size="2">Maximum</Text>
            <Controller
              name="maxPins"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    save("maxPins", v);
                  }}
                  onBlur={field.onBlur}
                  onBoundary={showError}
                  min={Math.max(1, counts.pinCount)}
                  max={ABSOLUTE_MAX}
                  minMessage={
                    counts.pinCount > 1
                      ? `You have ${counts.pinCount} pinned replies`
                      : "Minimum is 1"
                  }
                  maxMessage={`Can't exceed ${ABSOLUTE_MAX}`}
                />
              )}
            />
          </Flex>

          <Separator size="4" />

          <Text size="2" weight="bold" color="gray">
            Favourites
          </Text>

          <Flex align="center" justify="between">
            <Text size="2">Initially visible</Text>
            <Controller
              name="initialPinnedChatsVisible"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    save("initialPinnedChatsVisible", v);
                  }}
                  onBlur={field.onBlur}
                  onBoundary={showError}
                  min={1}
                  max={maxPinnedChats}
                  minMessage="Minimum is 1"
                  maxMessage={`Can't exceed maximum (${maxPinnedChats})`}
                />
              )}
            />
          </Flex>

          <Flex align="center" justify="between">
            <Text size="2">Maximum</Text>
            <Controller
              name="maxPinnedChats"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    save("maxPinnedChats", v);
                  }}
                  onBlur={field.onBlur}
                  onBoundary={showError}
                  min={Math.max(1, counts.chatCount)}
                  max={ABSOLUTE_MAX}
                  minMessage={
                    counts.chatCount > 1
                      ? `You have ${counts.chatCount} favourites`
                      : "Minimum is 1"
                  }
                  maxMessage={`Can't exceed ${ABSOLUTE_MAX}`}
                />
              )}
            />
          </Flex>
        </Flex>
      </Box>
    </Theme>
  );
};

export { App };
