# Envelope Helpers : Envelope Builder & Envelope Factory

The envelope helpers introduce two key components to streamline outgoing message envelope creation: the **Envelope Builder** and the **Envelope Factory**. Together, they offer a comprehensive solution for constructing and validating messages in various types with minimal boilerplate.

---

## Overview

- **Envelope Builder:**  
  A Proxy-based builder utility that provides chainable setter methods to dynamically create envelope objects. It validates the final envelope using Zod schemas and supports dynamic array handling through methods like `appendToQuickReplies`.

- **Envelope Factory:**  
  A higher-level abstraction that builds on the Envelope Builder. It provides convenience methods for constructing different types of envelopes (text, quick replies, buttons, attachments, lists/carousels, and system messages).

---

## Key Features

### Envelope Builder

- **Chainable Setter Methods:**  
  Methods dynamically set and retrieve message properties, making envelope configuration both flexible and intuitive.

- **Dynamic Array Handling:**  
  Provides special `appendToX` methods to easily add items to array fields (e.g., quick replies, buttons).

- **Schema Validation:**  
  Uses Zod to validate envelopes against predefined schemas, ensuring message integrity and compliance with expected formats.

- **Type-Specific Construction:**  
  Pre-configured through `getEnvelopeBuilder` to support various message types (text, quick reply, buttons, attachment, carousel, list, and system).

### Envelope Factory

- **Convenience Envelope Methods:**  
  Provides methods to build various envelope types:
  - **buildTextEnvelope:** Processes and builds text envelopes.
  - **buildQuickRepliesEnvelope:** Constructs quick reply messages with processed titles and payloads.
  - **buildButtonsEnvelope:** Handles both postback and non-postback buttons with normalized text.
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
const env1 = EnvelopeBuilder(OutgoingMessageType.text)
  .setText('Hello')
  .build();

// Append multiple quick replies:
const env2 = EnvelopeBuilder(OutgoingMessageType.quickReply)
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
const envelopeFactory = new EnvelopeFactory();

// Build a text envelope:
const textEnvelope = envelopeFactory.buildTextEnvelope('Hello there!');

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
  Both components use TypeScript generics and strict typing to ensure that each envelope adheres to its specific type, reducing runtime errors and enforcing schema compliance.

- **Schema Mapping:**  
  A mapping between message types and their corresponding Zod schemas guarantees that envelopes are built and validated against the correct structure.
