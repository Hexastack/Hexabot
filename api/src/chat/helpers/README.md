# Envelope Helpers : Envelope Builder & Envelope Factory

The envelope helpers introduce two key components to streamline outgoing message envelope creation: the **Envelope Builder** and the **Envelope Factory**. Together, they offer a comprehensive solution for constructing, localizing, and validating messages in various formats with minimal boilerplate.

---

## Overview

- **Envelope Builder:**  
  A Proxy-based builder utility that provides chainable setter methods to dynamically create envelope objects. It validates the final envelope using Zod schemas and supports dynamic array handling through methods like `appendToQuickReplies`.

- **Envelope Factory:**  
  A higher-level abstraction that builds on the Envelope Builder. It integrates localization and templating using Handlebars and provides convenience methods for constructing different types of envelopes (text, quick replies, buttons, attachments, lists/carousels, and system messages).

---

## Key Features

### Envelope Builder

- **Chainable Setter Methods:**  
  Methods dynamically set and retrieve message properties, making envelope configuration both flexible and intuitive.

- **Dynamic Array Handling:**  
  Provides special `appendToX` methods to easily add items to array fields (e.g., quick replies, buttons).

- **Schema Validation:**  
  Uses Zod to validate envelopes against predefined schemas, ensuring message integrity and compliance with expected formats.

- **Format-Specific Construction:**  
  Pre-configured through `getEnvelopeBuilder` to support various message formats (text, quick replies, buttons, attachment, carousel, list, and system).

### Envelope Factory

- **Template Conversion & Compilation:**  
  - **toHandlebars:** Converts legacy single-curly brace templates (e.g., `{context.user.name}`) into Handlebars-style (`{{context.user.name}}`).  
  - **compileHandlebarsTemplate:** Compiles and processes these templates by injecting contextual data, allowing dynamic content generation.

- **Localization:**  
  Processes input text for localization using an integrated i18n service, ensuring that messages are tailored to the user's language settings.

- **Convenience Envelope Methods:**  
  Provides methods to build various envelope types:
  - **buildTextEnvelope:** Processes and builds text envelopes.
  - **buildQuickRepliesEnvelope:** Constructs quick reply messages with localized titles and payloads.
  - **buildButtonsEnvelope:** Handles both postback and non-postback buttons with proper text processing.
  - **buildAttachmentEnvelope:** Creates attachment envelopes with optional quick replies.
  - **buildListEnvelope:** Builds list/carousel envelopes using provided content options, elements, and pagination.
  - **buildSystemEnvelope:** Assembles system envelopes with outcomes and optional data.

- **Integration with Envelope Builder:**  
  Utilizes the Envelope Builder internally to ensure type-safe envelope construction and validation.

---

## Usage Examples

### Using Envelope Builder Directly

```typescript
// Build a simple text envelope:
const env1 = EnvelopeBuilder(OutgoingMessageFormat.text)
  .setText('Hello')
  .build();

// Append multiple quick replies:
const env2 = EnvelopeBuilder(OutgoingMessageFormat.quickReplies)
  .setText('Are you interested?')
  .appendToQuickReplies({
    content_type: QuickReplyType.text,
    title: 'Yes',
    payload: 'yes',
  })
  .appendToQuickReplies({
    content_type: QuickReplyType.text,
    title: 'No',
    payload: 'no',
  })
  .build();
```

### Using Envelope Factory

```typescript
const envelopeFactory = new EnvelopeFactory(context, settings, i18nService);

// Build a localized text envelope:
const textEnvelope = envelopeFactory.buildTextEnvelope('Hello, {context.user.name}!');

// Build a quick replies envelope with processed quick replies:
const quickRepliesEnvelope = envelopeFactory.buildQuickRepliesEnvelope(
  'Do you want to proceed?',
  [
    { content_type: QuickReplyType.text, title: 'Yes', payload: 'yes' },
    { content_type: QuickReplyType.text, title: 'No', payload: 'no' }
  ]
);
```

---

## Implementation Details

- **Proxy-based Dynamic Methods:**  
  The Envelope Builder leverages JavaScript Proxies to intercept property accesses, enabling both setter and getter behaviors, as well as dynamic array appending for enhanced flexibility.

- **Type Safety with Generics:**  
  Both components use TypeScript generics and strict typing to ensure that each envelope adheres to its specific format, reducing runtime errors and enforcing schema compliance.

- **Localization & Templating:**  
  The Envelope Factory integrates with an i18n service and uses Handlebars to convert and compile message templates, ensuring that all messages are correctly localized and dynamically composed with context-specific data.

- **Schema Mapping:**  
  A mapping between message formats and their corresponding Zod schemas guarantees that envelopes are built and validated against the correct structure.

