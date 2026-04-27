---
description: >-
  Translate user-facing workflow text, refresh detected strings, and manage
  localized values for supported languages.
icon: language
---

# Translations

Use **Translations** to localize user-facing text in your workflows.

Hexabot translates strings that you explicitly mark in workflow definitions.

<figure><img src="../.gitbook/assets/image (58).png" alt="" width="563"><figcaption></figcaption></figure>

### How translations work

Translations follow this flow:

* Add your supported languages in [Languages](languages.md)
* Mark strings with `=$t("...")` in task inputs or settings
* Refresh the translation list
* Add translated values for each language

### Mark a string for translation

Use the `$t()` helper when you want a string to be translated.

Start the value with `=` so Hexabot evaluates it as an expression.

```yaml
defs:
  greet_user:
    kind: task
    action: send_text_message
    inputs:
      text: =$t("Hello World!")
```

You can use the same pattern in task settings and other workflow fields that accept expressions.

{% hint style="info" %}
Only strings wrapped with `$t()` are collected in **Translations**.
{% endhint %}

### Add translations

<figure><img src="../.gitbook/assets/image (59).png" alt="" width="479"><figcaption></figcaption></figure>

1. Open **Localization** → **Translations**.
2. Click **Refresh**.
3. Select the string you want to translate.
4. Enter the translated value for each language.
5. Click **Submit**.

**Refresh** scans your workflow definitions for translatable strings. It also removes entries that are no longer used.

### Good practices

{% hint style="info" %}
* Use the same source string when the meaning is the same.
* Click **Refresh** after changing workflow text.
* Test each language in a real workflow run.
{% endhint %}
