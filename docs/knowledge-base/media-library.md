---
icon: images
---

# Media Library

The media library lists uploaded content attachments. Use it to inspect files that can be reused by content entries and to select existing assets from file fields.

Open it from **Content > Media Library** or go to `/content/media-library`.

### What the Media Library Shows

The page lists attachments whose resource reference is Content. It is focused on assets uploaded for content fields, not every message attachment in the system.

Search filters by attachment name. On the standalone page, search state is synchronized with the URL.

### How Files Get Into the Media Library

Files are uploaded from File fields in content entry forms.

To upload a file:

1. Create a content type with a **File** field.
2. Open or create a content entry for that type.
3. In the File field, click or drag and drop a supported file.
4. Save the entry so the content record references the uploaded attachment.

The upload itself creates an attachment with Content as its resource reference. That attachment then appears in the media library and can be reused by other content entries.

### Select an Existing Asset

File fields also include a **Media Library** button.

Use it when the asset is already uploaded:

1. Open a content entry with a File field.
2. Click **Media Library** in that field.
3. Click a row to select an attachment.
4. Confirm the dialog.
5. Save the content entry.

When the library is opened as a picker, it can filter rows by the MIME types accepted by the field.

### Supported File Types

The frontend accepts common image, video, audio, and document MIME types, including:

<table><thead><tr><th width="194.16339111328125">Category</th><th>Examples</th></tr></thead><tbody><tr><td>Images</td><td>JPEG, PNG, WebP, BMP, GIF.</td></tr><tr><td>Video</td><td>MP4, WebM, OGG, QuickTime, AVI, MKV.</td></tr><tr><td>Audio</td><td>MP3, OGG, WAV, AAC.</td></tr><tr><td>Documents</td><td>PDF, Word, Excel, PowerPoint, TXT, RTF, EPUB, JSON, CSV, ZIP, 7z, RAR.</td></tr></tbody></table>

The upload control validates MIME type before sending the file. The server also enforces the configured maximum upload size.

### Preview Behavior

| File type  | Preview                       |
| ---------- | ----------------------------- |
| Image      | Inline thumbnail.             |
| Audio      | Audio icon in the media card. |
| Video      | Video icon in the media card. |
| Other file | Generic file icon.            |

If an attachment cannot be loaded, the UI shows an "Attachment is not found" fallback with the missing attachment ID.

### Deletion

The media library is for browsing and selecting assets. Attachment deletion is intentionally blocked by the backend to avoid breaking content entries, messages, or actions that reference the file.

If an asset should no longer be used, remove or replace it from the content entries that reference it.

### Using Media in Content Workflows

File fields are especially useful for list and carousel messages.

A common setup is:

1. Add a File field such as `hero_image` to a content type.
2. Upload image files when creating entries.
3. In the **Send List** action, select that field as the **Image URL Field**.
4. Send the entries as a list or carousel.

Use image files for fields mapped to card images. Other file types can still be stored in content, but channel rendering may show them differently or not use them as visual card media.

{% hint style="info" %}
**Tips for Media Management:**

* **Optimize File Sizes:** Compress your images and other media files before uploading them to reduce load times and improve chatbot performance.
* **Regular Cleanup:** Periodically review your Media Library and delete any unused or outdated files to keep it organized.
{% endhint %}
