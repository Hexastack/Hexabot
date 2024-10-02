---
icon: globe
---

# Languages

Once you have added multiple languages, your chatbot will dynamically respond to users based on their language preference. If the end-user’s language is detected, the chatbot will automatically switch to that language. Otherwise, the default language will be used.

<figure><img src="../../.gitbook/assets/image.png" alt=""><figcaption><p>Manage Languages</p></figcaption></figure>

### Adding a Language

To add a language to your chatbot, follow these steps:

1. Navigate to the **Languages** section of the chatbot builder.
2. Click on the **Add Language** button.
3. In the dialog, enter the following information:
   * **Title**: The name of the language (e.g., English, French, Arabic).
   * **Code**: The language code (e.g., `en` for English, `fr` for French, `ar` for Arabic). It is recommended to use the ISO 639-1 code for each language.
   * **RTL**: Toggle whether the language is a right-to-left language.
4. Click **Save** to add the language.

### Updating a Language

To update a language:

1. Navigate to the **Languages** section.
2. Select the language you want to update.
3. Modify the **Title**, **Code**, or **RTL** setting as needed.
4. Click **Save** to apply your changes.

### Deleting a Language

To delete a language:

1. Navigate to the **Languages** section.
2. Click on the delete icon next to the language you wish to remove.
3. Confirm the deletion.

> **Note**: Deleting a language will remove its translations from the chatbot. All NLU samples will be set to the default language which cannot be deleted. You need always to have at least one language.

### Default Language

The default language serves as the primary language for your chatbot. To set a default language:

1. Navigate to the **Languages** section.
2. Click the checkbox next to the language you want to set as default.
3. Click **Save**.

The default language will be used when the chatbot cannot detect the language of the end-user.

