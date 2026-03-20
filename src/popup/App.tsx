import {
  Box,
  Flex,
  Heading,
  Separator,
  Switch,
  Text,
  Theme,
  Tooltip,
} from "@radix-ui/themes";
import { Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { sendMessage } from "../extension/shared/messaging";
import { storage } from "../extension/shared/storage";
import { NumberStepper } from "./components/NumberStepper";
import { useColorScheme } from "./hooks/useColorScheme";
import { readCounts } from "./utils";

const ABSOLUTE_MAX = 25;

type FormValues = {
  pinsSectionEnabled: boolean;
  pinnedChatsSectionEnabled: boolean;
  initialPinsVisible: number;
  maxPins: number;
  initialPinnedChatsVisible: number;
  maxPinnedChats: number;
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
      pinsSectionEnabled: true,
      pinnedChatsSectionEnabled: true,
      initialPinsVisible: 3,
      maxPins: 5,
      initialPinnedChatsVisible: 3,
      maxPinnedChats: 5,
    },
  });

  const pinsSectionEnabled = watch("pinsSectionEnabled");
  const pinnedChatsSectionEnabled = watch("pinnedChatsSectionEnabled");
  const maxPins = watch("maxPins");
  const maxPinnedChats = watch("maxPinnedChats");

  useEffect(() => {
    Promise.all([storage.getAll(), readCounts()]).then(([s, c]) => {
      reset({
        pinsSectionEnabled: s.pinsSectionEnabled,
        pinnedChatsSectionEnabled: s.pinnedChatsSectionEnabled,
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
    (key: keyof FormValues, value: number | boolean) => {
      storage.set(key, value);

      if (key === "maxPins" && typeof value === "number") {
        const visible = getValues("initialPinsVisible");
        if (visible > value) {
          setValue("initialPinsVisible", value);
          storage.set("initialPinsVisible", value);
        }
      }
      if (key === "maxPinnedChats" && typeof value === "number") {
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

        <Text size="1" color="gray" mb="2" asChild>
          <p>
            Existing pins and favourites are preserved when a section is hidden.
            {` High limits may affect browser storage, therefore only max of ${ABSOLUTE_MAX} replies and chats is allowed.`}
          </p>
        </Text>

        <Flex direction="column" gap="3">
          <Flex align="center" justify="between">
            <Flex align="center" gap="1">
              <Text size="2" weight="bold" color="gray">
                Favourites
              </Text>
              <Tooltip content={"Favourite chats\nfor quick access"}>
                <Info
                  size={14}
                  color="var(--gray-a8)"
                  style={{ cursor: "default" }}
                />
              </Tooltip>
            </Flex>
            <Controller
              name="pinnedChatsSectionEnabled"
              control={control}
              render={({ field }) => (
                <Theme accentColor="green">
                  <Switch
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v);
                      save("pinnedChatsSectionEnabled", v);
                      void sendMessage("analytics-user-action", {
                        action: v
                          ? "enable_favourites_chats"
                          : "disable_favourites_chats",
                      }).catch(() => {});
                    }}
                  />
                </Theme>
              )}
            />
          </Flex>

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
                  disabled={!pinnedChatsSectionEnabled}
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
                  disabled={!pinnedChatsSectionEnabled}
                />
              )}
            />
          </Flex>

          <Separator size="4" />

          <Flex align="center" justify="between">
            <Flex align="center" gap="1">
              <Text size="2" weight="bold" color="gray">
                Pinned Replies
              </Text>
              <Tooltip content={"Pin AI replies to follow up\non them anytime"}>
                <Info
                  size={14}
                  color="var(--gray-a8)"
                  style={{ cursor: "default" }}
                />
              </Tooltip>
            </Flex>
            <Controller
              name="pinsSectionEnabled"
              control={control}
              render={({ field }) => (
                <Theme accentColor="green">
                  <Switch
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v);
                      save("pinsSectionEnabled", v);
                      void sendMessage("analytics-user-action", {
                        action: v
                          ? "enable_pin_replies"
                          : "disable_pin_replies",
                      }).catch(() => {});
                    }}
                  />
                </Theme>
              )}
            />
          </Flex>

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
                  disabled={!pinsSectionEnabled}
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
                  disabled={!pinsSectionEnabled}
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
