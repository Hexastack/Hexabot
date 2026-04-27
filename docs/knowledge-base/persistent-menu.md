---
icon: bars
---

# Manage Persistent Menu



The persistent menu defines menu items that are available from supported chat interfaces, including the web widget. It is useful for common actions such as contacting support, opening account pages, starting key workflows, or grouping self-service options.

<figure><img src="../.gitbook/assets/image (1).png" alt="" width="443"><figcaption></figcaption></figure>

Open it from **Content > Persistent Menu** or go to `/content/persistent-menu`.

### How It Works

The admin panel stores menu items as a tree. When a web-style channel source connects a widget session, Hexabot sends the menu tree to the client. The widget shows a menu button when menu items are available.

Clicking a menu item can:

<table><thead><tr><th width="130.25360107421875">Type</th><th>Runtime behavior</th></tr></thead><tbody><tr><td>Web URL</td><td>Opens the configured URL in a new browser tab.</td></tr><tr><td>Postback</td><td>Sends a postback message to Hexabot with text and payload.</td></tr><tr><td>Nested</td><td>Opens a submenu containing child menu items.</td></tr></tbody></table>

Use postback menu items when a workflow should react to the selection. Use web URL menu items when the user should leave the chat and open a page.

### Menu Page

The page shows root menu items and their nested children. Nested menu items can be expanded and collapsed.

<figure><img src="../.gitbook/assets/image (1) (1).png" alt="" width="427"><figcaption></figcaption></figure>

Available controls depend on permissions:

<table><thead><tr><th width="124.21307373046875">Control</th><th>Use it for</th></tr></thead><tbody><tr><td>Add</td><td>Create a root menu item.</td></tr><tr><td>Append</td><td>Add a child under a nested item.</td></tr><tr><td>Pencil</td><td>Edit an item.</td></tr><tr><td>Trash</td><td>Delete an item after confirmation.</td></tr></tbody></table>

The Add button is disabled when there are 10 root menu items.

### Create a Root Menu Item

1. Open **Content > Persistent Menu**.
2. Click **Add**.
3. Choose a type.
4. Enter a title.
5. Fill the type-specific field.
6. Click **Save**.

### Add a Submenu Item

1. Create or find a menu item with type **Nested**.
2. Click **Append** on that item.
3. Create a child menu item.
4. Save it.

Only nested items can have children. The backend rejects a child whose parent is not a nested item, and an item cannot be its own parent.

### Menu Item Types

#### Web URL

Use **Web URL** when the menu item should open an external page.

Required fields:

| Field   | Notes                                            |
| ------- | ------------------------------------------------ |
| Title   | Text shown in the menu.                          |
| Web URL | Must be an absolute `http://` or `https://` URL. |

In the web widget, clicking the item calls `window.open(url, "_blank")`.

#### Postback

Use **Postback** when the menu item should trigger automation.

Required fields:

| Field   | Notes                                                 |
| ------- | ----------------------------------------------------- |
| Title   | Text shown in the menu and sent as the postback text. |
| Payload | Value used by workflows to identify the selection.    |

The payload field defaults to the title. Use the switch next to Payload when you need a custom value. For example, title `Talk to support` can use payload `START_SUPPORT_HANDOVER`.

When clicked in the widget, Hexabot receives an inbound postback from source `persistent-menu` with:

| Value   | Source             |
| ------- | ------------------ |
| Text    | Menu item title.   |
| Payload | Menu item payload. |

Build workflow triggers around stable payload values rather than wording that may change.

#### Nested

Use **Nested** to group related menu choices.

Required fields:

| Field | Notes                       |
| ----- | --------------------------- |
| Title | Text shown for the submenu. |

Nested items do not have a URL or payload. They only organize children. A nested item with no children is allowed, but it will not lead anywhere useful for end users.

### Editing and Deleting

Use edit for title, URL, payload, and parent changes. Menu item type is effectively fixed after creation; create a new item when you need to change a Web URL into a Postback or Nested item.

Deleting a nested item also removes its descendants because child records depend on their parent.

### Recommended Payload Pattern

Use uppercase or namespaced payloads that are independent of the visible title:

| Title           | Payload                |
| --------------- | ---------------------- |
| Track my order  | `ORDER_TRACKING_START` |
| Talk to support | `HANDOVER_REQUEST`     |
| Pricing         | `OPEN_PRICING_FLOW`    |

This lets you rename menu items without breaking workflow conditions.

{% hint style="info" %}
**Additional Tips:**

* **Keep it Concise:** Limit your menu to the most important options to avoid overwhelming users.
* **Use Clear Labels:** Menu item labels should be descriptive and easy to understand.
* **Test Thoroughly:** Test your Persistent Menu on different devices and screen sizes to ensure it's working as expected and displays correctly.
{% endhint %}

