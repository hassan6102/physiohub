"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

type Options = { title: string; message: string; confirmLabel?: string; danger?: boolean };
type Ctx = (options: Options) => Promise<boolean>;
const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<Options | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<Ctx>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(options)}
        onClose={() => close(false)}
        title={options?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              إلغاء
            </Button>
            <Button variant={options?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {options?.confirmLabel ?? "تأكيد"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink">{options?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
