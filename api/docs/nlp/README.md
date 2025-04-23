# NLP Block Scoring
## Purpose 

**NLP Block Scoring** is  mechanism used to select the most relevant response block based on:

- Matching patterns between user input and block definitions
- Configurable weights assigned to each entity type
- Confidence values provided by the NLU engine for detected entities

It enables more intelligent and context-aware block selection in conversational flows.

## Core Use Cases
### Standard Matching

A user input contains entities that directly match a block’s patterns.
```bash
Example: Input: intent = enquiry, subject = claim
Block A: Patterns: intent: enquiry, subject: claim
Block A will be selected.
```

### High Confidence, Partial Match

A block may match only some patterns but have high-confidence input on those matched ones, making it a better candidate than others with full matches but low-confidence entities.
**Note: Confidence is multiplied by a pre-defined weight for each entity type.**

```bash
Example:
Input: intent = issue (confidence: 0.92), subject = claim (confidence: 0.65)
Block A: Pattern: intent: issue
Block B: Pattern: subject: claim
➤ Block A gets a high score based on confidence × weight (assuming both weights are equal to 1).
```

### Multiple Blocks with Similar Patterns

```bash
Input: intent = issue, subject = insurance
Block A: intent = enquiry, subject = insurance
Block B: subject = insurance
➤    Block B is selected — Block A mismatches on `intent`.
```

### Exclusion Due to Extra Patterns

If a block contains patterns that require entities not present in the user input, the block is excluded from scoring altogether. No penalties are applied — the block simply isn't considered a valid candidate.

```bash
Input: intent = issue, subject = insurance
Block A: intent = enquiry, subject = insurance, location = office
Block B: subject = insurance, time = morning
➤ Neither block is selected due to unmatched required patterns (`location`, `time`)
```

### Tie-Breaking with Penalty Factors

When multiple blocks receive similar scores, penalty factors can help break the tie — especially in cases where patterns are less specific (e.g., using `Any` as a value).

```bash
Input: intent = enquiry, subject = insurance

Block A: intent = enquiry, subject = Any
Block B: subject = insurance, subject = insurance
Block C: subject = insurance

Scoring Summary:
- Block A matches both patterns, but `subject = Any` is considered less specific.
- Block B has a redundant but fully specific match.
- Block C matches only one pattern.

➤ Block A and Block B have similar raw scores.
➤ A **penalty factor** is applied to Block A due to its use of `Any`, reducing its final score.
➤ Block B is selected.
```

## How Scoring Works
### Matching and Confidence

For each entity in the block's pattern:
- If the entity `matches` an entity in the user input:
    - the score is increased by: `confidence × weight`
        - `Confidence` is a value between 0 and 1, returned by the NLU engine.
        - `Weight` is a configured importance factor for that specific entity type.
- If the match is a wildcard (i.e., the block accepts any value):
   - A **penalty factor** is applied to slightly reduce its contribution:
    ``confidence × weight × penaltyFactor``. This encourages more specific matches when available.

### Scoring Formula Summary

For each matched entity: 

```bash
score += confidence × weight × [optional penalty factor if wildcard]
```

The total block score is the sum of all matched patterns in that block.

### Penalty Factor

The **penalty factor** is a global multiplier (typically less than `1`, e.g., `0.8`) applied when the match type is less specific — such as wildcard or loose entity type matches. It allows the system to:
- Break ties in favor of more precise blocks
- Discourage overly generic blocks from being selected when better matches are available
