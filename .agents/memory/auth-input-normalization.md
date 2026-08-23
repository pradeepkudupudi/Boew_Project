---
name: Auth input normalization
description: Registration and login should normalize user-entered identifiers before validation.
---

Normalize email and display-name input before running the request schema validation.

**Why:** Users commonly paste email addresses with surrounding whitespace or inconsistent casing; validating the raw value rejects otherwise valid account attempts.

**How to apply:** Trim names and email addresses, lowercase emails, then validate and use the normalized values for lookup and persistence.