# Migration Module

The `migration` module for **Hexabot** provides a simple and effective way to manage database migrations. It allows you to create, execute, and roll back migrations, ensuring the database schema stays in sync with the version DB updates.

Whenever a new version is released which requires some DB updates, the onApplicationBootstrap()
will apply migrations automatically but only if it's a dev environement and `config.mongo.autoMigrate` is enabled.

## Features

- Generate timestamped migration files automatically in kebab-case.
- Track migration execution status in a MongoDB collection (`migrations`).
- Run individual or all migrations with ease.
- Built-in support for rollback logic.
- Keeps track of the database schema version in the metadata collection (SettingModule).

## Usage

### Creating a Migration

To create a new migration:

```bash
npm run cli migration create <version>
```

Replace `<version>` with the next version for your migration, such as `v2.1.1`.

Example:

```bash
npm run cli migration create v2.1.1
```

This will generate a new file under `src/migration/migrations/` with a timestamped filename in kebab-case.

### Running Migrations

#### Running a Specific Migration

To execute a specific migration, use:

```bash
npm run cli migration migrate up <version>
```

Example:

```bash
npm run cli migration migrate up v2.1.1
```

#### Rolling Back a Specific Migration

To roll back a specific migration, use:

```bash
npm run cli migration migrate down <version>
```

Example:

```bash
npm run cli migration migrate down v2.1.1
```

#### Running All Migrations

To execute all pending migrations:

```bash
npm run cli migration migrate up
```

#### Rolling Back All Migrations

To roll back all migrations:

```bash
npm run cli migration migrate down
```

### Tracking Migration Status

The migration status is stored in a MongoDB collection called `migrations`. This collection helps ensure that each migration is executed or rolled back only once, avoiding duplicate operations.

## Example Migration File

Below is an example migration file:

```typescript
import mongoose from 'mongoose';
import attachmentSchema, {
  Attachment,
} from '@/attachment/schemas/attachment.schema';

module.exports = {
  async up() {
    const AttachmentModel = mongoose.model<Attachment>(
      Attachment.name,
      attachmentSchema,
    );
    await AttachmentModel.updateMany({
        type: 'csv'
    }, {
        $set: {  type: 'text/csv' }
    });
  },
  async down() {
    // Rollback logic
    const AttachmentModel = mongoose.model<Attachment>(
      Attachment.name,
      attachmentSchema,
    );
    await AttachmentModel.updateMany({
        type: 'text/csv'
    }, {
        $set: {  type: 'csv' }
    });
  },
};
```

### Explanation

- **`up` Method**: Defines the operations to apply the migration (e.g., modifying schemas or inserting data).
- **`down` Method**: Defines the rollback logic to revert the migration.

## Best Practices

- Use semantic versioning (e.g., `v2.1.1`) for your migration names to keep track of changes systematically.
- Always test migrations in a development or staging environment before running them in production.
- Keep the `up` and `down` methods idempotent to avoid side effects from repeated execution.
