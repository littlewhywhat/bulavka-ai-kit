import { useEffect, useState } from "react";
import { Flex } from "@radix-ui/themes";
import { TextField, IconButton } from "@radix-ui/themes";
import { MinusSvg, PlusSvg } from "../icons";

type NumberStepperProps = {
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
  onBoundary: (msg: string) => void;
  min: number;
  max: number;
  minMessage: string;
  maxMessage: string;
  disabled?: boolean;
};

export const NumberStepper = ({
  value,
  onChange,
  onBlur,
  onBoundary,
  min,
  max,
  minMessage,
  maxMessage,
  disabled,
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
    <Flex align="stretch" gap="1">
      <TextField.Root
        value={display}
        onChange={handleInput}
        onBlur={handleBlur}
        color={error ? "red" : undefined}
        style={{ width: 56, textAlign: "center" }}
        size="2"
        disabled={disabled}
      />
      <IconButton
        size="2"
        variant="soft"
        color="gray"
        type="button"
        onClick={() => step(-1)}
        disabled={disabled}
      >
        <MinusSvg />
      </IconButton>
      <IconButton
        size="2"
        variant="soft"
        color="gray"
        type="button"
        onClick={() => step(1)}
        disabled={disabled}
      >
        <PlusSvg />
      </IconButton>
    </Flex>
  );
};
