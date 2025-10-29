/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type TFilterKeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type TFilterKeysOfNeverType<T> = Omit<T, TFilterKeysOfType<T, []>>;

export type NestedKeys<T> = T extends object
  ? {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      [K in keyof T]: T[K] extends Function
        ? never
        : Array<any> extends T[K]
          ? Exclude<K, symbol>
          : K extends symbol
            ? Exclude<K, symbol>
            : `${Exclude<K, symbol>}${'' | `.${NestedKeys<T[K]>}`}`;
    }[keyof T]
  : never;

export type ObjectWithNestedKeys<T, ValueType = any> = Partial<{
  [K in NestedKeys<T>]: ValueType;
}>;

export type TFilterNestedKeysOfType<T, U> = T extends object
  ? {
      [K in keyof T]: T[K] extends U
        ? `${K & string}`
        : T[K] extends object
          ? Array<any> extends T[K]
            ? never
            : `${K & string}.${TFilterNestedKeysOfType<T[K], U>}`
          : never;
    }[keyof T]
  : never;

export type WithoutGenericAny<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
      ? RecursivePartial<T[P]>
      : T[P];
};
//base controller validator types
type TAllowedKeys<T, TStub, TValue = (string | null | undefined)[]> = {
  [key in keyof Record<
    TFilterKeysOfType<
      TFilterPopulateFields<TFilterKeysOfNeverType<T>, TStub>,
      TValue
    >,
    TValue
  >]: TValue;
};

type TVirtualFields<T> = Pick<T, TFilterKeysOfType<T, undefined>>;

export type TValidateProps<T, TStub> = {
  dto:
    | Partial<TAllowedKeys<T, TStub>>
    | Partial<TAllowedKeys<T, TStub, string>>;
  allowedIds: Partial<
    Omit<
      TAllowedKeys<T, TStub, null | undefined | string | string[]>,
      keyof TVirtualFields<T>
    >
  >;
};

//populate types
export type TFilterPopulateFields<T, TStub> = Omit<
  T,
  TFilterKeysOfType<
    TStub,
    null | undefined | string | number | boolean | object
  >
>;

//search filter types
type TField<T> = {
  [key in T & string]: { contains: string };
};

type TOrField<T> = {
  where?: {
    or: TField<T>[];
  };
};

type TAndField<T> = {
  where?: TField<T>;
};

type TNorField<T> = {
  where?: {
    [key in T & string]: { '!=': string };
  };
};

export type TSearchFilterValue<T> = TOrField<T> | TAndField<T> | TNorField<T>;
