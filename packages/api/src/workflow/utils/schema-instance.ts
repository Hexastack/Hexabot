/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

/**
 * A small, practical TypeScript utility that binds an object JSON Schema + data
 * to be able to easily iterate through fields.
 *
 * @example:
 *
 *  const userSchema: JSONSchema = {
 *    type: "object",
 *    properties: {
 *      id: { type: "string", title: "User ID", description: "Unique identifier." },
 *      email: { type: "string", title: "Email", description: "Used for login." },
 *      profile: {
 *        type: "object",
 *        title: "Profile",
 *        properties: {
 *          firstName: { type: "string", title: "First name" },
 *          lastName: { type: "string", title: "Last name" },
 *        },
 *      },
 *    },
 *    required: ["id", "email"],
 *  };
 *
 *  const data = {
 *    id: "u_123",
 *    email: "a@b.com",
 *    profile: { firstName: "Foo", lastName: "Bar" },
 *    extraKey: 123,
 *  };
 *
 *  const view = new SchemaInstance(userSchema, data);
 *
 *  // Top-level only:
 *  for (const f of view.fields({ includeAdditional: true })) {
 *    console.log(f.name, f.title, f.description, f.value, f.required);
 *  }
 *  // Outputs:
 *  // - id, User ID, Unique identifier., u_123, true,
 *  // - email, Email, Used for login., a@b.com, true
 *  // - profile, Profile, undefined, (2) {firstName: "Foo", lastName: "Bar"}, false
 *  // ...
 *
 *  // Recursive:
 *  for (const f of view.fields({ includeAdditional: true, recursive: true })) {
 *    console.log(f.path, "=>", f.value);
 *  }
 *  // Outputs:
 *  // - id => u_123 email => a@b.com
 *  // - profile => (2) {firstName: "Foo", lastName: "Bar" }
 *  // - profile.firstName => Foo profile.lastName => Bar
 *  // - extraKey => 123
 */

import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

export type FieldInfo = {
  /** Field name relative to its parent object */
  name: string;
  /** Full path like "address.city" when recursive=true */
  path: string;

  title?: string;
  description?: string;

  value: unknown;

  required: boolean;

  /** The (best-effort) resolved schema for this field */
  schema: JSONSchema7;
};

export type IterateOptions = {
  /** Include keys found in data but not in schema.properties */
  includeAdditional?: boolean;
  /** Recursively traverse nested objects (schema type: object) */
  recursive?: boolean;
};

export class SchemaInstance<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  constructor(
    public readonly rootSchema: JSONSchema7,
    public readonly data: TData,
  ) {}

  /**
   * Iterate fields described by schema.properties (+ optionally additional data keys).
   * If recursive=true, yields nested object fields with dot paths.
   */
  *fields(options: IterateOptions = {}): IterableIterator<FieldInfo> {
    const { includeAdditional = false, recursive = false } = options;
    const schema = this.resolveSchema(this.rootSchema);
    if (!this.isObjectSchema(schema)) return;

    yield* this.iterateObject(schema, this.data, {
      includeAdditional,
      recursive,
      basePath: '',
    });
  }

  /** Convenience: get a field’s value by dot path (e.g., "address.city"). */
  getValue(path: string): unknown {
    if (!path) return this.data;
    const parts = path.split('.');
    let cur: any = this.data;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }

    return cur;
  }

  // -----------------------
  // Internal implementation
  // -----------------------

  private *iterateObject(
    objSchema: JSONSchema7,
    objValue: Record<string, unknown>,
    ctx: { includeAdditional: boolean; recursive: boolean; basePath: string },
  ): IterableIterator<FieldInfo> {
    const resolvedObjSchema = this.resolveSchema(objSchema);
    const props = resolvedObjSchema.properties ?? {};
    const requiredSet = new Set(resolvedObjSchema.required ?? []);
    const schemaKeys = Object.keys(props);
    const dataKeys = Object.keys(objValue ?? {});
    const extraKeys = ctx.includeAdditional
      ? dataKeys.filter((k) => !(k in props))
      : [];

    for (const name of [...schemaKeys, ...extraKeys]) {
      const rawPropSchema = props[name] ?? {};
      const propSchema = this.resolveSchema(rawPropSchema);
      const path = ctx.basePath ? `${ctx.basePath}.${name}` : name;
      const value = (objValue ?? {})[name];
      // Title/description: prefer explicit on property schema; fallback to resolved refs/allOf
      const { title, description, mergedSchema } =
        this.pickAnnotations(propSchema);
      const info: FieldInfo = {
        name,
        path,
        title: title ?? name, // optional: fallback title to name
        description,
        value,
        required: requiredSet.has(name),
        schema: mergedSchema,
      };

      yield info;

      if (ctx.recursive) {
        const childSchema = mergedSchema;
        if (
          this.isObjectSchema(childSchema) &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          yield* this.iterateObject(
            childSchema,
            value as Record<string, unknown>,
            {
              ...ctx,
              basePath: path,
            },
          );
        }
      }
    }
  }

  private isObjectSchema(s: JSONSchema7): boolean {
    const t = s.type;
    if (t === 'object') return true;
    if (Array.isArray(t) && t.includes('object')) return true;

    // If type is omitted but properties exist, treat as object-ish
    return !!s.properties;
  }

  /**
   * Best-effort schema resolving:
   * - local $ref (#/...)
   * - shallow allOf merge (enough for annotations/properties/required)
   */
  private resolveSchema(
    schema: JSONSchema7Definition | undefined | null,
    seen = new Set<JSONSchema7>(),
  ): JSONSchema7 {
    const normalizedSchema = this.normalizeSchema(schema);
    if (seen.has(normalizedSchema)) return normalizedSchema;
    seen.add(normalizedSchema);

    // Resolve $ref (local only)
    if (normalizedSchema.$ref) {
      const resolved = this.resolveLocalRef(normalizedSchema.$ref);
      if (resolved !== undefined) {
        // Merge: local overrides resolved
        return this.shallowMerge(
          this.resolveSchema(resolved, seen),
          normalizedSchema,
        );
      }
    }

    // Merge allOf shallowly (useful for properties/required/title/description)
    if (
      Array.isArray(normalizedSchema.allOf) &&
      normalizedSchema.allOf.length
    ) {
      const merged = normalizedSchema.allOf
        .map((s) => this.resolveSchema(s, seen))
        .reduce((acc, cur) => this.shallowMerge(acc, cur), {} as JSONSchema7);

      return this.shallowMerge(merged, normalizedSchema);
    }

    return normalizedSchema;
  }

  private pickAnnotations(schema: JSONSchema7Definition): {
    title?: string;
    description?: string;
    mergedSchema: JSONSchema7;
  } {
    const mergedSchema = this.resolveSchema(schema);
    // Title/description might be on the property schema itself or inside $ref/allOf
    const baseSchema = this.normalizeSchema(schema);
    const title = mergedSchema.title ?? baseSchema.title;
    const description = mergedSchema.description ?? baseSchema.description;

    return { title, description, mergedSchema };
  }

  private shallowMerge(a: JSONSchema7, b: JSONSchema7): JSONSchema7 {
    const out: JSONSchema7 = { ...a, ...b };

    // Merge properties shallowly
    if (a.properties || b.properties) {
      out.properties = { ...(a.properties ?? {}), ...(b.properties ?? {}) };
    }

    // Merge required as union
    if (a.required || b.required) {
      out.required = Array.from(
        new Set([...(a.required ?? []), ...(b.required ?? [])]),
      );
    }

    // Merge $defs/definitions shallowly
    const aDefs = a.$defs ?? a.definitions;
    const bDefs = b.$defs ?? b.definitions;
    if (aDefs || bDefs) {
      out.$defs = { ...(aDefs ?? {}), ...(bDefs ?? {}) };
    }

    return out;
  }

  private resolveLocalRef(ref: string): JSONSchema7Definition | undefined {
    if (!ref.startsWith('#/')) return undefined;

    // JSON Pointer: #/a/b => ["a","b"]
    const pointer = ref.slice(2).split('/').map(this.unescapeJsonPointer);
    // Per spec, prefer $defs; also allow "definitions"
    const root: any = this.rootSchema;
    let cur: any = root;

    for (const key of pointer) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[key];
    }

    return cur as JSONSchema7Definition | undefined;
  }

  private unescapeJsonPointer(segment: string): string {
    // ~1 => /, ~0 => ~
    return segment.replace(/~1/g, '/').replace(/~0/g, '~');
  }

  private normalizeSchema(
    schema: JSONSchema7Definition | undefined | null,
  ): JSONSchema7 {
    if (schema === false) {
      return { not: {} };
    }

    if (schema === true || schema == null) {
      return {};
    }

    return schema;
  }
}
