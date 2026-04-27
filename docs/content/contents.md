---
icon: book-open-lines
---

# Contents

Content entries are the records stored under a content type. Each entry has a title, status, timestamps, and the custom fields defined by its content type.

<figure><img src="../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>

Open entries from **Content > Content Types**, then click the **Content** operation on the content type you want to manage. The entries URL is `/content-types/content/<content_type_id>`.

### What Entries Are For

Use content entries when workflow authors need structured records instead of hard-coded text in workflow steps.

Common examples include:

| Content type | Example entries                                       |
| ------------ | ----------------------------------------------------- |
| FAQ          | Refund policy, delivery times, password reset.        |
| Product      | Product A, Product B, Product C.                      |
| Location     | Downtown branch, airport kiosk, warehouse pickup.     |
| Plan         | Free plan, Pro plan, Enterprise plan.                 |
| Article      | Troubleshooting page, onboarding guide, legal notice. |

### Entries List

The entries page is scoped to one selected content type. A chip in the page header shows the selected type. The search box filters entries by title and keeps the search in the URL. The page also filters by the selected content type automatically.

### Create an Entry

1. Open the entries page for the target content type.
2. Click **Add**.
3. Fill in the generated form.
4. Set **Status** to active when the entry should be available to workflows.
5. Click **Save**.

<figure><img src="../.gitbook/assets/image (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

The form is generated from the content type schema. If the content type has a File field, that field lets you upload a file or choose an existing file from the media library.

### Edit an Entry

Use **Edit** from the operations column. The edit dialog shows the same generated form and pre-fills existing values.

Typical edits include:

* updating copy or URLs;
* replacing an attached image or document;
* enabling or disabling the entry with the status field;
* filling newly added content type fields.

The save button is disabled when there are visible validation errors or no changes.

### Status

Status controls whether workflows should use an entry.

| Status   | Behavior                                                                |
| -------- | ----------------------------------------------------------------------- |
| Active   | The entry can be returned by content list/carousel retrieval.           |
| Inactive | The entry remains stored but is excluded from normal content retrieval. |

You can toggle status directly from the entries table if you have update permission.

RAG retrieval also excludes inactive content by default. A RAG action can include inactive content only when its settings allow it, and RAG indexing may also be configured to index active content only.

### File Fields and Attachments

File fields are backed by the media library.

When filling a File field, you can:

* click or drag and drop a supported file to upload it;
* open **Media Library** and select an existing content attachment;
* clear the selected attachment from the entry field.

For list and carousel messages, use image files in fields that will be mapped to the action's **Image URL Field**. Non-image files can still be stored, but they may not render as card images in every channel.

### Delete an Entry

Use **Delete** from the operations column. The frontend asks for confirmation before deleting.

Delete entries when they should no longer exist. Use inactive status when you want to keep the record for later review or reactivation.

### How Workflows Use Entries

Workflow actions can retrieve entries from a selected content type.

The **Send List** action:

* selects a content type;
* fetches active entries;
* maps entry fields to card title, subtitle, image, URL, and buttons;
* sends the result as a list or carousel;
* can paginate results with a "View More" button when more entries are available.

The **Retrieve RAG Content** action:

* searches indexed content using a query;
* can filter by content type;
* returns matching hits and combined text for downstream AI steps.

Use content entries when business content changes more often than workflow logic. Authors can update entries without editing workflow YAML.
