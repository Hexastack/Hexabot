---
icon: book-open
---

# Content Types

Content types define the schema for reusable content entries. They are the starting point for the Content area: create a content type first, then add entries that follow that type's fields.

Open them from **Content > Content Types** or go to `/content-types`.

Use content types to model records such as products, help articles, policies, locations, FAQs, plans, or any structured knowledge that workflows should retrieve and send.

### How Content Types Fit Together

| Item                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| Content type        | Defines the fields authors can fill in.                         |
| Content entry       | One record that belongs to a content type.                      |
| Media library asset | An uploaded attachment that can be selected by file fields.     |
| Workflow action     | Uses content entries in list, carousel, or RAG retrieval flows. |

For example, a `Product` content type might define `title`, `status`, `summary`, `image`, `details_url`, and `category`. Each product entry then stores values for those fields.

### Content Types List

The search box filters content types by name and keeps the search in the URL.

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1).png" alt="" width="563"><figcaption></figcaption></figure>

Available operations are:

| Operation | Use it for                                  |
| --------- | ------------------------------------------- |
| Content   | Open the entries for that content type.     |
| Edit      | Change the content type name or schema.     |
| Delete    | Remove the content type after confirmation. |

### Create a Content Type

1. Open **Content > Content Types**.
2. Click **Add**.
3. Enter a required **Name**.
4. Define the fields in the **Schema** builder.
5. Click **Save**.

<figure><img src="../.gitbook/assets/image (2) (1).png" alt="" width="465"><figcaption></figcaption></figure>

New content types start with two default fields:

| Field    | Type     | Purpose                                                                   |
| -------- | -------- | ------------------------------------------------------------------------- |
| `title`  | Text     | Main title shown in tables and commonly mapped to list or carousel cards. |
| `status` | Checkbox | Enables or disables entries for workflow retrieval.                       |

Keep these fields unless you have a deliberate reason to change the schema. The content entries table and workflow actions expect title and status concepts to exist.

### Schema Builder

The schema builder creates the form that entry authors use later.

Each property has:

| Setting       | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| Property name | Technical key stored in the content entry. It must be unique. |
| Required      | Makes the field mandatory in the entry form.                  |
| Type          | Controls how the entry form renders the field.                |
| Title         | Human-readable label shown to authors.                        |
| Description   | Optional helper text for the generated field.                 |

When you type a property name, the title is auto-filled from it unless you override the title manually.

Available field types are:

| Type     | Entry form behavior                                        | Typical use                                             |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Text     | Single-line text input.                                    | Titles, categories, short labels.                       |
| URL      | URL-formatted text input.                                  | Detail links, source links, button URLs.                |
| Textarea | Multi-line text input.                                     | Summaries, article bodies, long answers.                |
| Checkbox | Boolean on/off value.                                      | Flags, eligibility, feature toggles.                    |
| File     | Attachment picker with upload and media library selection. | Images, documents, audio, video.                        |
| HTML     | Text field for HTML or markup-like content.                | Rich snippets consumed by custom workflows or channels. |

The frontend validates the schema before saving. Property names must be present and unique, and the generated schema must be valid.

### Editing a Content Type

Edit a content type when you need to add, rename, require, or remove fields. Existing entries are edited through the current schema, so plan schema changes carefully when the content type already has many records.

Use these rules when evolving a schema:

* Add new optional fields when possible.
* Avoid renaming property names after entries have been imported, because CSV columns and workflow mappings depend on those keys.
* Check workflows that use the content type after changing field types.
* Review a few existing entries after saving the schema to confirm the generated form still behaves as expected.

### Using Content Types in Workflows

Content types become selectable in workflow forms that work with content.

The **Send List** action uses a content type to fetch active entries and render them as a list or carousel. After selecting a content type, the action can map:

<table><thead><tr><th width="221.55682373046875">Mapping</th><th>Eligible content fields</th></tr></thead><tbody><tr><td>Title</td><td>Text fields.</td></tr><tr><td>Subtitle</td><td>Text fields.</td></tr><tr><td>Image URL Field</td><td>File fields.</td></tr><tr><td>URL</td><td>URL fields.</td></tr><tr><td>Action payload fields</td><td>Values from the selected entry.</td></tr></tbody></table>

The **Retrieve RAG Content** action can also filter retrieval by content type. RAG retrieval excludes inactive content by default unless the action settings explicitly include inactive entries.

{% hint style="info" %}
**Tips**

* **Plan Your Content Structure:** Think carefully about the types of information your chatbot needs and design your content types accordingly.
* **Keep it Simple:** Start with the essential fields and add more as needed. It's easier to add fields later than to remove them if they prove to be unnecessary.
* **Use Descriptive Names:** Make field names easy to understand for you and anyone else who might be working with your chatbot's content.
{% endhint %}
