/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  createContext,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CloseDialog,
  DialogComponent,
  DialogProviderProps,
  DialogStackEntry,
  OpenDialog,
  OpenDialogOptions,
} from "@/types/common/dialogs.types";

export const DialogsContext = createContext<
  | {
      open: OpenDialog;
      close: CloseDialog;
    }
  | undefined
>(undefined);

/**
 * Provider for Dialog stacks. The subtree of this component can use the `useDialogs` hook to
 * access the dialogs API. The dialogs are rendered in the order they are requested.
 *
 * Demos:
 *
 * - [useDialogs](https://mui.com/toolpad/core/react-use-dialogs/)
 *
 * API:
 *
 * - [DialogsProvider API](https://mui.com/toolpad/core/api/dialogs-provider)
 */
function DialogsProvider(props: DialogProviderProps) {
  const { children, unmountAfter = 1000 } = props;
  const [stack, setStack] = useState<DialogStackEntry<any, any>[]>([]);
  let selectComponent: (typeof stack)[number]["Component"] | undefined =
    undefined;
  const keyPrefix = useId();
  const nextId = useRef(0);
  const requestDialog = useCallback<OpenDialog>(
    function open<P, R>(
      Component: DialogComponent<P, R>,
      payload: P,
      options: OpenDialogOptions<R> = {},
    ) {
      const { onClose = async () => {}, isSingleton, ...rest } = options;
      let resolve: ((result: R) => void) | undefined;
      const promise = new Promise<R>((resolveImpl) => {
        resolve = resolveImpl;
      });

      if (!resolve) {
        throw new Error("resolve not set");
      }

      const key = `${keyPrefix}-${nextId.current}`;

      nextId.current += 1;

      const newEntry: DialogStackEntry<P, R> = {
        key,
        open: true,
        promise,
        Component,
        payload,
        onClose,
        resolve,
        msgProps: rest,
      };

      if (selectComponent !== Component || !isSingleton) {
        selectComponent = Component;
        setStack((prevStack) => [...prevStack, newEntry]);
      }

      return promise;
    },
    [keyPrefix],
  );
  const closeDialogUi = useCallback(
    function closeDialogUi<R>(dialog: Promise<R>) {
      setStack((prevStack) =>
        prevStack.map((entry) =>
          entry.promise === dialog ? { ...entry, open: false } : entry,
        ),
      );
      setTimeout(() => {
        // wait for closing animation
        setStack((prevStack) =>
          prevStack.filter((entry) => entry.promise !== dialog),
        );
      }, unmountAfter);
      selectComponent = undefined;
    },
    [unmountAfter],
  );
  const closeDialog = useCallback(
    async function closeDialog<R>(dialog: Promise<R>, result: R) {
      const entryToClose = stack.find((entry) => entry.promise === dialog);

      if (!entryToClose) {
        throw new Error("dialog not found");
      }

      await entryToClose.onClose(result);
      entryToClose.resolve(result);
      closeDialogUi(dialog);

      return dialog;
    },
    [stack, closeDialogUi],
  );
  const contextValue = useMemo(
    () => ({
      open: requestDialog,
      close: closeDialog,
    }),
    [requestDialog, closeDialog],
  );

  return (
    <DialogsContext.Provider value={contextValue}>
      {children}
      {stack.map(({ key, open, Component, payload, promise, msgProps }) => (
        <Component
          key={key}
          payload={payload}
          open={open}
          onClose={async (result) => {
            await closeDialog(promise, result);
          }}
          {...msgProps}
        />
      ))}
    </DialogsContext.Provider>
  );
}

export { DialogsProvider };
