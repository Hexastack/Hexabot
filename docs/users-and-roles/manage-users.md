---
description: >-
  Create admin users, assign roles, and control access to the Hexabot admin
  panel.
icon: circle-user
---

# Manage users

The Users page manages people who can sign in to the Hexabot admin panel. It is separate from the audience and subscriber lists, which track end users who interact with your bot.

<figure><img src="../.gitbook/assets/image.png" alt=""><figcaption></figcaption></figure>

Open it from **Administration > Users** or go directly to `/users`.

### Access requirements

The Users page is available when all of the following are true:

* Your account has the `read` permission on the `User` model.
* The workspace has an active plan that includes user management. The frontend currently gates user management behind the Pro plan or higher.
* User-management quota has not blocked the action you are trying to take.

If your plan does not include user management, the page shows a locked-state view with options to review pricing or enter a license key from the settings area.

When SSO is enabled, the page still lists users, but local role-management controls are hidden and status switches are disabled. In that mode, treat your identity provider as the source of truth for user access.

### User list

The table shows each admin user with:

* ID
* Avatar
* Full name
* Email
* Assigned roles
* Status
* Creation date
* Last update date

The page header includes a user quota chip in the format `Users: used/limit`. If the plan has no user limit, the limit is shown as unlimited. When the quota is reached, the Add action is blocked or wrapped in an upgrade prompt.

Use the search box to filter the list by first name or last name. The search value is synced to the URL, so you can refresh or share the filtered view.

### Add a user

<figure><img src="../.gitbook/assets/image (1).png" alt="" width="311"><figcaption></figcaption></figure>

Click **Add** to create a local admin user. The form requires:

* First name
* Last name
* Username
* Email
* Password
* Password confirmation
* At least one role

The email must be valid, the password must be at least 8 characters, and the confirmation must match the password.

The role selector supports multiple roles. Use **Manage** beside the selector to open the Roles page when you need to create or adjust a role before finishing the user record.

New users are created with an inactive status. Hexabot sends an account confirmation email to the new user; confirming the account activates it. If email delivery is not configured or the confirmation email cannot be sent, an administrator can activate the account manually from the Status switch.

### Manage roles for a user

Use the **Manage Roles** action in the Operations column to change which roles are assigned to a user. The dialog shows the user's full name and a multi-select role picker.

Role changes replace the user's assigned role list with the selected roles, so keep every role the user should retain selected before saving.

The current user cannot remove their own `admin` role through this endpoint. This protects the workspace from accidental loss of administrative access.

### Enable or disable a user

Use the Status switch to activate or deactivate a user account.

The switch is disabled when:

* You are looking at your own row.
* SSO is enabled.
* Your account does not have the `update` permission on `User`.

The backend also protects the signed-in user from disabling their own account.

### Permission reference

The Users page relies on these permissions:

<table><thead><tr><th width="153.01983642578125">Permission</th><th>What it controls</th></tr></thead><tbody><tr><td><code>User: read</code></td><td>Shows the Users page in the Administration menu and loads the user list.</td></tr><tr><td><code>User: create</code></td><td>Shows the Add button and allows creating users.</td></tr><tr><td><code>User: update</code></td><td>Allows changing user status and saving role assignments.</td></tr><tr><td><code>Role: read</code></td><td>Allows role names to be loaded and displayed in selectors and role chips.</td></tr></tbody></table>

Accounts that can create or update users should also understand the role model, because assigning a broader role immediately grants that user the permissions contained in the role.

### Operational notes

* Prefer disabling an account when you need to block access temporarily. The frontend does not expose a user-delete action on this page.
* Assign at least one role to every admin user. Users without roles cannot receive model permissions.
* Keep at least one confirmed, active administrator with full role-management access.
* After changing your own roles, refresh the page or sign out and back in if the sidebar does not immediately reflect the new permissions.
