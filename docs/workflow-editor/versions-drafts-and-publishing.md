---
icon: code-branch
---

# Versions, Drafts, and Publishing

The Workflow Editor separates editing from execution. You can change and save a workflow without making those changes live. A workflow only becomes active for execution when a saved version is published.

<figure><img src="../.gitbook/assets/image (2) (1) (1).png" alt="" width="375"><figcaption></figcaption></figure>



This gives workflow authors a safe review cycle:

1. Edit the graph or YAML.
2. Save a valid definition as a workflow version.
3. Test the saved version.
4. Publish when the version is ready to run.

### Core Terms

| Term              | Meaning                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| Workflow version  | A saved snapshot of the workflow YAML definition.                         |
| Current version   | The version currently loaded in the editor.                               |
| Published version | The version active for execution.                                         |
| Draft workflow    | A workflow with no published version.                                     |
| Unsaved changes   | Local editor changes that have not yet been saved as the current version. |

The `Draft` badge in the editor means the workflow has no published version. It does not always mean the editor has unsaved local changes. Unsaved changes are shown by the Save button becoming available and by the workflow being temporarily different from its current saved version.

### Saving Versions

Hexabot stores workflow logic as YAML on workflow versions. When you edit the graph, action forms, operator drawers, or YAML editor, the editor updates the same definition.

Valid definition changes are saved in two ways:

| Save path   | Behavior                                                   |
| ----------- | ---------------------------------------------------------- |
| Autosave    | Valid definition changes are saved after a short debounce. |
| Save button | Commits the current valid definition immediately.          |

The Save button is enabled only when the editor has a valid definition with unsaved changes. If the YAML does not parse or the workflow definition does not validate, the editor cannot save that definition as a version.

When a version is saved:

* Hexabot creates a new workflow version snapshot.
* The workflow's `currentVersion` points to that new snapshot.
* The version appears in the version history.
* The published version is not changed automatically.

### Drafts

A workflow is a draft when it has no published version.

Draft workflows can still be edited, saved, and tested in the editor. They are not active for normal execution until a version is published.

Use drafts when:

* building a new workflow;
* making changes that should not affect live traffic yet;
* testing a manual or scheduled workflow before making it active;
* preparing a replacement for an already published workflow.

If a workflow already has a published version, saving new edits creates a newer current version, but execution continues to use the existing published version until you publish again.

### Publishing

Publishing points the workflow's published version to a saved version.

The main Publish button in the editor publishes the current version. It is available only when:

* the workflow has a current saved version;
* the current editor definition is valid;
* there are no unsaved changes waiting to be saved;
* the current version is not already the published version;
* the editor is not currently saving, publishing, or unpublishing.

After publishing:

* the workflow status changes from `Draft` to `Published` when it had no previous published version;
* the published version becomes the version used for execution;
* later edits remain inactive until saved and published again.

### Unpublishing

Unpublishing clears the workflow's published version. The saved versions remain in history, but the workflow no longer has an active published version.

Use Unpublish when a workflow should no longer run from its trigger, channel, schedule, or published execution path.

Unpublishing does not delete versions and does not discard the current editor version. You can publish a saved version again later.

### Version History Drawer

Open the workflows drawer and use the history button to show version history.

The version history drawer shows a timeline of saved versions for the selected workflow. Versions are listed with the newest entries first.

Each version entry can show:

| Item            | Meaning                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| Version number  | Sequential saved version number.                                                      |
| Action badge    | Why the version was created, such as `Created`, `Updated`, `Restored`, or `Imported`. |
| Current badge   | This version is loaded as the current editor version.                                 |
| Published badge | This version is active for execution.                                                 |
| Author          | User who created the version, or `System` when no user is available.                  |
| Time            | When the version was created.                                                         |
| Note            | Optional human-readable note for the version.                                         |

New workflows can start with an initial blank version. Later edits create higher numbered versions.

### Version Actions

Version actions appear on a version entry when available.

| Action    | What it does                                                             |
| --------- | ------------------------------------------------------------------------ |
| Add note  | Adds or edits the note attached to that version.                         |
| Publish   | Makes that saved version the published version.                          |
| Unpublish | Clears the published version when the entry is currently published.      |
| Restore   | Creates a new current version from that older version's YAML definition. |

Actions are disabled while a save, publish, unpublish, restore, or note update is in progress.

#### Publishing from History

The version history drawer can publish a saved version directly.

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1).png" alt="" width="375"><figcaption></figcaption></figure>

Publishing a historical version changes what is active for execution. It does not have to restore that version as the current editor version first. This is useful when you need to roll live execution back to a known good version quickly.

#### Restoring a Version

Restore does not overwrite the old version. Instead, Hexabot creates a new version whose definition is copied from the restored version.

For example:

1. Current version is Version 8.
2. You restore Version 5.
3. Hexabot creates Version 9 with the YAML from Version 5.
4. Version 9 becomes the current editor version.
5. The published version remains unchanged until you publish Version 9.

This keeps the full history intact and makes the restore visible in the timeline with a `Restored` action badge.

### Common Workflows

#### Publish a New Workflow

1. Create the workflow.
2. Build the graph or edit YAML.
3. Save the definition.
4. Test the workflow.
5. Click Publish.

#### Update a Published Workflow Safely

1. Edit the workflow.
2. Wait for autosave or click Save.
3. Test the current saved version.
4. Publish only after the new version is ready.

Until step 4, the previous published version remains active.

#### Roll Back a Published Workflow

1. Open version history.
2. Find the previous known good version.
3. Click Publish on that version to make it active immediately.
4. Optionally click Restore if you also want the editor's current version to become a new snapshot based on that older version.

#### Restore and Continue Editing

1. Open version history.
2. Click Restore on the version you want to reuse.
3. Edit the restored current version.
4. Save the new changes.
5. Publish when ready.

### Troubleshooting

| Problem                                | Likely cause                                                                                                              | What to do                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Publish is disabled                    | The current version is already published, the definition is invalid, there are unsaved changes, or saving is in progress. | Fix validation errors, click Save, or wait for saving to finish.          |
| Save is disabled                       | There are no unsaved changes, or the current definition is invalid.                                                       | Make a change or resolve YAML and workflow validation errors.             |
| Workflow still runs the old behavior   | A newer current version was saved but not published.                                                                      | Publish the current version or publish the intended version from history. |
| Workflow shows Draft                   | It has no published version.                                                                                              | Publish a saved version when the workflow should become active.           |
| Restore did not make the workflow live | Restore creates a new current version but does not publish it.                                                            | Publish the restored version after reviewing it.                          |
