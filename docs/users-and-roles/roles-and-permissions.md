---
description: >-
  Create admin roles, assign permissions, and control access across the Hexabot
  admin panel.
icon: shield-check
---

# Roles and Permissions

Roles group permissions for admin users. Each permission grants an action such as create, read, update, or delete over a model relation.

Use roles to control which product areas appear in the sidebar and which actions are available in lists and dialogs.

<figure><img src="../.gitbook/assets/image (61).png" alt=""><figcaption></figcaption></figure>

Open role management from **Administration > Roles** or go directly to `/roles`. The Roles menu item is hidden when SSO is enabled.

### How access control works

Hexabot uses role-based access control for admin users:

1. A user has one or more roles.
2. A role has zero or more permissions.
3. Each permission combines a model, an action, and a relation.

The frontend loads the signed-in user's permissions from `/user/permissions` and builds a model-to-actions map. That map controls visible sidebar entries, page buttons, table actions, and some inline controls.

The four permission actions are:

<table><thead><tr><th width="111.9544677734375">Action</th><th>Meaning</th></tr></thead><tbody><tr><td><code>create</code></td><td>Allows creating records for the model.</td></tr><tr><td><code>read</code></td><td>Allows listing or viewing records for the model.</td></tr><tr><td><code>update</code></td><td>Allows editing records for the model.</td></tr><tr><td><code>delete</code></td><td>Allows deleting records for the model.</td></tr></tbody></table>

The relation selector in the current permissions dialog creates role-scoped permissions. Leave the relation set to **Role** unless your deployment has custom backend logic that supports another relation.

### Default roles

Fresh installations seed three roles:

<table><thead><tr><th width="116.791259765625">Role</th><th>Default purpose</th></tr></thead><tbody><tr><td><code>admin</code></td><td>Full access to every seeded model.</td></tr><tr><td><code>manager</code></td><td>Broad operational access, excluding administration models such as <code>AuditLog</code>, <code>Role</code>, <code>User</code>, and <code>Permission</code>.</td></tr><tr><td><code>public</code></td><td>Reserved for public endpoints. Do not use it as an admin access profile unless you intentionally add permissions to it.</td></tr></tbody></table>

You can rename, extend, or replace roles to match your organization. Before changing default roles, make sure at least one active account keeps the ability to manage users, roles, and permissions.

### Roles list

The Roles page shows:

* ID
* Name
* Creation date
* Last update date
* Operations

Use the search box to filter roles by name. The search value is synced to the URL.

### Add or edit a role

Click **Add** to create a role. A role only needs a unique name.

Use **Edit** in the Operations column to rename an existing role. Renaming a role does not remove its permissions or user assignments.

Required permissions:

<table><thead><tr><th width="160.8572998046875">Permission</th><th>What it controls</th></tr></thead><tbody><tr><td><code>Role: read</code></td><td>Shows the Roles page and loads the role list.</td></tr><tr><td><code>Role: create</code></td><td>Shows the Add button and allows creating roles.</td></tr><tr><td><code>Role: update</code></td><td>Shows the Edit action and allows renaming roles.</td></tr></tbody></table>

### Delete a role

Use **Delete** in the Operations column to remove a role. Hexabot asks for confirmation before sending the delete request.

A role cannot be deleted when:

* It is assigned to the current account.
* It is assigned to any other user.
* Your account does not have `delete` permission on `Role`.

Remove the role from all users before deleting it. Deleting a role also removes the permissions attached to that role.

### Manage role permissions

<figure><img src="../.gitbook/assets/image (62).png" alt="" width="309"><figcaption></figcaption></figure>

Use **Permissions** in the Operations column to open the permission manager for a role.

The dialog is organized by model. Expand a model to see the permissions currently attached to the selected role. Each row shows:

* Action
* Relation
* A delete action for removing that permission

To add a permission:

1. Expand the target model.
2. Select an action: `create`, `read`, `update`, or `delete`.
3. Keep the relation set to **Role**.
4. Click the add icon.

To remove a permission, click the delete icon on that permission row.

Loading the model list requires `Model: read`. Saving permission changes requires `Permission: create` for additions and `Permission: delete` for removals.

The backend enforces uniqueness for the model, action, role, and relation combination. If you add the same permission twice, the UI shows a duplicate-permission error.

Changing permissions takes effect for users with that role the next time the frontend refreshes its permission data. Ask affected users to refresh the admin panel if menu items or buttons do not update immediately.
