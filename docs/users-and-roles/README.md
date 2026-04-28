---
description: >-
  Manage admin users, assign roles, and control access across the Hexabot admin
  panel.
icon: users-gear
---

# Users and Roles

Users and roles control access to the Hexabot admin panel.

Users are the people who can sign in. Roles group permissions. Assign one or more roles to each user to control what they can view and change.

This area is separate from subscribers and audience records. It only covers internal admin access.

### How access control works

Hexabot uses role-based access control for admin users:

1. A user has one or more roles.
2. A role has zero or more permissions.
3. Each permission combines a model, an action, and a relation.

These permissions control which pages appear in the sidebar and which actions are available in lists, dialogs, and forms.

The four permission actions are:

<table><thead><tr><th width="126.6917724609375">Action</th><th>Meaning</th></tr></thead><tbody><tr><td><code>create</code></td><td>Allows creating records for the model.</td></tr><tr><td><code>read</code></td><td>Allows listing or viewing records.</td></tr><tr><td><code>update</code></td><td>Allows editing records.</td></tr><tr><td><code>delete</code></td><td>Allows deleting records.</td></tr></tbody></table>

### Manage users

Use the **Users** page to manage admin accounts.

Common tasks:

* create a local admin user;
* assign or change one or more roles;
* activate or deactivate an account.

User management depends on your permissions, your plan, and whether SSO is enabled.

When SSO is enabled, the user list is still visible, but local role-management controls and status switches are limited. In that setup, treat your identity provider as the source of truth for access.

### Manage roles

Use the **Roles** page to define access levels for admin users.

Common tasks:

* create a new role;
* rename an existing role;
* add or remove permissions for that role.

Fresh installations include seeded roles such as `admin`, `manager`, and `public`. You can extend or replace them to match your organization.

Before changing default roles, make sure at least one active account keeps full access to users, roles, and permissions.

### Recommended workflow

For most teams, access setup follows a simple order:

1. Create or review the roles you need.
2. Add users or identify existing users.
3. Assign the right roles to each user.
4. Test access with the affected account.

Use the smallest permission set that still lets each person do their work.
