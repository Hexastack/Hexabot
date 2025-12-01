# Agentic Workflow DSL

This document describes the YAML DSL used in `workflow.yml` to orchestrate AI and automation workflows. It is intentionally declarative: the engine provides actions (LLMs, search, email, etc.) and the DSL wires them into a graph of tasks, branches, waits, and loops.

## File layout

- `workflow`: metadata for the run (`name`, `version`, `description`).
- `inputs`: required caller-provided payload. Each key under `schema` declares a JSON schema fragment (`type`, `enum`, `description`, `items`, …).
- `context`: read-only values injected by the runtime (authenticated user, channel, locale, etc.).
- `memory`: long-term or cross-run slots hydrated by the runtime (thread history, playbooks, briefs).
- `defaults`: settings inherited by every task unless overridden (timeouts, retries, guardrails, audit flags).
- `tasks`: the catalog of callable steps; each defines the action to invoke, its inputs/outputs mapping, and per-task settings.
- `flow`: ordered execution plan composed of `do`, `parallel`, `conditional`, and `loop` blocks.
- `outputs`: expressions that expose final artifacts from the run back to the caller.

## Expressions and scopes

- Any string starting with `=` is evaluated as a JSONata expression. All other strings are treated as literals (quoted or plain).
- Available scopes inside expressions:
  - `$input`: validated caller inputs.
  - `$context`: runtime-provided metadata.
  - `$memory`: hydrated long-term state.
  - `$output.<task>`: outputs produced by previously executed tasks.
  - `$result`: the raw return value of the action currently running (only valid inside `tasks.*.outputs`).
  - `$iteration`: loop locals (`item`, `index`) available inside `loop.steps`.
  - `$accumulator`: loop accumulator state when `accumulate` is used.
- Expressions can declare locals (e.g., `=$route := ...; ...`) and use JSONata helpers like `$exists`, `$size`, `$join`, and `$append`.

## Task definitions

Each entry under `tasks` has:

- `description`: human-readable purpose.
- `action`: engine-specific operation to call (`call_llm`, `search_web`, `await_user_input`, etc.). The DSL does not fix action semantics; the runtime must bind them.
- `inputs`: map of parameters passed to the action. Values can be literals or expressions (prefixed with `=`).
- `outputs`: map that projects fields from `$result` into named values available under `$output.<task>.*` for downstream steps.
- `settings`: execution hints (timeout, retries, model choice, temperature, guardrails, audit flags). Settings merge with `defaults.settings`, with task-level keys taking precedence.

Example: `tasks.understand_request` calls an LLM with a system prompt, user query, and context, then exposes `intent`, `confidence`, `summary`, and `missing_fields` via its `outputs` map.

## Flow primitives

The `flow` array defines the run order. Each item is exactly one of the following blocks:

- `do`: `{ do: <task_name> }` executes the referenced task sequentially.
- `parallel`: runs multiple `steps` concurrently. The example uses `strategy: wait_all`, meaning downstream steps wait for every child to finish; engines may also support `wait_any`.
- `conditional`: branching table evaluated top-to-bottom. Keys:
  - `when`: list of branches with `condition` (JSONata boolean) and `steps` to run on match.
  - `else`: optional branch with `steps` when nothing matches.
- `loop`: fan-out over a collection with optional short-circuit and accumulation:
  - `for_each`: `{ item: <alias>, in: <expression> }` defines the iterable. Inside the loop body, `$iteration.item` and `$iteration.index` are available.
  - `max_concurrency`: throttle parallel loop iterations.
  - `until`: stop condition checked after each iteration; if `true`, the loop exits early.
  - `accumulate`: maintains reducer-style state with `as` (name), `initial` (seed value), and `merge` (JSONata expression that receives `$accumulator` and current outputs).
  - `steps`: the same flow blocks allowed in the root flow (usually a series of `do` steps).

All branches and loop bodies can themselves contain nested `conditional` or `parallel` blocks.

## Human-in-the-loop pauses

- Use a task whose `action` supports waiting (e.g., `await_user_input`) and set `settings.await_user: true`.
- The engine should checkpoint the workflow, wait for a reply or timeout, then resume with the captured response surfaced via the task’s `outputs`.

## Final outputs

- Keys under the root `outputs` map expose data back to the caller. Each value is an expression evaluated after the flow completes, typically referencing `$output.*` from tasks.
- Example: `missing_fields_resolved` in the example returns `true` when the classifier found no missing fields after the run.

## Execution model and error handling

- Tasks inherit `defaults.settings` unless overridden. Common knobs: `timeout_ms`, `retries.max_attempts`, `retries.backoff_ms`, `guardrails.mode`, `audit`, and action-specific parameters like `model`/`temperature`.
- Engines should surface action failures and retry attempts; a task failing after retries should abort the workflow unless the engine supports optional continuation semantics.
- Parallel blocks honor task-level retries independently; the block completes based on its `strategy` (e.g., all tasks finishing for `wait_all`).

## Example walkthrough (`workflow.yml`)

The provided example is the authoritative reference of the DSL in action:

1) Classify the incoming request (`understand_request`), optionally ask the user for missing fields (`ask_for_missing_detail`), and fetch CRM context.  
2) Enrich in parallel with web search, memory recall, and calendar pulls.  
3) Synthesize research, route by intent, and branch into support drafting, sales pitch, or human escalation. High-priority support requests are drafted and then escalated.  
4) Fan out FYI emails to stakeholders via a `loop` with throttling, early exit on first acknowledgement, and an accumulator capturing delivery outcomes.  
5) Send the final email response, selecting the body based on the chosen route.

Notable conventions enforced in the example:

- All expression-bearing strings start with `=` to avoid ambiguity.
- Every task declares outputs explicitly; downstream steps only see what was mapped.
- The nested conditional in the support branch escalates only when `priority` is `high`; otherwise it continues without redundant fallback work.

## Authoring tips

- Prefer descriptive task names; keep actions generic and reusable.
- Minimize side effects inside JSONata; use expressions mainly for routing and lightweight data shaping.
- Treat `context` and `memory` as read-only; write outputs through tasks designed for persistence if needed.
- Keep parallel blocks small and bounded with `max_concurrency` when hitting external APIs or rate limits.
- Surface only the essentials in top-level `outputs` so callers get a clean contract.
