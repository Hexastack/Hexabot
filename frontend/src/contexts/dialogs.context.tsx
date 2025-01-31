/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import * as React from "react";

export interface OpenDialogOptions<R> {
  /**
   * A function that is called before closing the dialog closes. The dialog
   * stays open as long as the returned promise is not resolved. Use this if
   * you want to perform an async action on close and show a loading state.
   *
   * @param result The result that the dialog will return after closing.
   * @returns A promise that resolves when the dialog can be closed.
   */
  onClose?: (result: R) => Promise<void>;
}

/**
 * The props that are passed to a dialog component.
 */
export interface DialogProps<P = undefined, R = void> {
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: P;
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: (result: R) => Promise<void>;
}

export type DialogComponent<P, R> = React.ComponentType<DialogProps<P, R>>;

export interface OpenDialog {
  /**
   * Open a dialog without payload.
   * @param Component The dialog component to open.
   * @param options Additional options for the dialog.
   */
  <P extends undefined, R>(
    Component: DialogComponent<P, R>,
    payload?: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>;
  /**
   * Open a dialog and pass a payload.
   * @param Component The dialog component to open.
   * @param payload The payload to pass to the dialog.
   * @param options Additional options for the dialog.
   */
  <P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>;
}

export interface CloseDialog {
  /**
   * Close a dialog and return a result.
   * @param dialog The dialog to close. The promise returned by `open`.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog is fully closed.
   */
  <R>(dialog: Promise<R>, result: R): Promise<R>;
}

export interface DialogHook {
  // alert: OpenAlertDialog;
  // confirm: OpenConfirmDialog;
  // prompt: OpenPromptDialog;
  open: OpenDialog;
  close: CloseDialog;
}

export const DialogsContext = React.createContext<{
  open: OpenDialog;
  close: CloseDialog;
} | null>(null);

interface DialogStackEntry<P, R> {
  key: string;
  open: boolean;
  promise: Promise<R>;
  Component: DialogComponent<P, R>;
  payload: P;
  onClose: (result: R) => Promise<void>;
  resolve: (result: R) => void;
}

export interface DialogProviderProps {
  children?: React.ReactNode;
  unmountAfter?: number;
}

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
  const [stack, setStack] = React.useState<DialogStackEntry<any, any>[]>([]);
  const keyPrefix = React.useId();
  const nextId = React.useRef(0);
  const requestDialog = React.useCallback<OpenDialog>(
    function open<P, R>(
      Component: DialogComponent<P, R>,
      payload: P,
      options: OpenDialogOptions<R> = {},
    ) {
      const { onClose = async () => {} } = options;
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
      };

      setStack((prevStack) => [...prevStack, newEntry]);

      return promise;
    },
    [keyPrefix],
  );
  const closeDialogUi = React.useCallback(
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
    },
    [unmountAfter],
  );
  const closeDialog = React.useCallback(
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
  const contextValue = React.useMemo(
    () => ({ open: requestDialog, close: closeDialog }),
    [requestDialog, closeDialog],
  );

  return (
    <DialogsContext.Provider value={contextValue}>
      {children}
      {stack.map(({ key, open, Component, payload, promise }) => (
        <Component
          key={key}
          payload={payload}
          open={open}
          onClose={async (result) => {
            await closeDialog(promise, result);
          }}
        />
      ))}
    </DialogsContext.Provider>
  );
}

export { DialogsProvider };
