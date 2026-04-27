---
description: Store structured content, media, and menu items that workflows can use.
icon: books
---

# Knowledge Base

The knowledge base is the content layer for Hexabot. Use it to store structured records, upload reusable files, and manage persistent navigation that workflows can reference.

Open the section from **Content** in the admin panel.

### What the knowledge base is for

Use the knowledge base when business content changes more often than workflow logic.

Common examples include:

* FAQs and help articles;
* product catalogs and service lists;
* locations, plans, policies, and menu items.

Instead of hard-coding this data in workflow steps, store it once and let workflows retrieve it when needed.

### How it fits together

The knowledge base has four main parts:

* [Content Types](content-types.md) define the schema for a category of records.
* [Contents Entries](content-entries.md) store the actual entries for each content type.
* [Media Library](media-library.md) stores files uploaded from content fields.
* [Persistent Menu](persistent-menu.md) controls always-available menu options for end-users.

In most setups, you create a content type first, then add entries that match its fields.

### Typical workflow

1. Create a content type such as `FAQ`, `Product`, or `Location`.
2. Add the fields that authors need to fill in.
3. Create entries under that content type.
4. Upload or reuse files through File fields when needed.
5. Reference that content from workflow actions.

### How workflows use knowledge base content

Workflows can use knowledge base content in several ways:

* list or carousel actions can send active entries as structured results;
* retrieval steps can search indexed content for relevant answers;
* file fields can provide images or attachments used in messages;
* persistent menus can give users quick access to common actions.

### Best practices

* Model content around business objects, not around one workflow.
* Keep field names stable after workflows start using them.
* Use active and inactive states to control availability without deleting records.
* Store reusable assets in content fields instead of duplicating links.
