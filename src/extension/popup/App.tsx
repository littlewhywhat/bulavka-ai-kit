import { Box, Card, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { sendMessage } from "../shared/messaging";

const App = () => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendMessage("get-status", undefined).then((res) => {
      if (res.ok) setEnabled(res.data.enabled);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    await chrome.storage.local.set({ enabled: checked });
  };

  return (
    <Box p="4" style={{ width: 320 }}>
      <Flex direction="column" gap="4">
        <Heading size="4">Extension Template</Heading>
        <Card>
          <Flex justify="between" align="center">
            <Text size="2">Enable weather button</Text>
            <Switch
              checked={enabled}
              disabled={loading}
              onCheckedChange={handleToggle}
            />
          </Flex>
        </Card>
        <Text size="1" color="gray">
          Injects a weather button on Google search pages.
        </Text>
      </Flex>
    </Box>
  );
};

export { App };
