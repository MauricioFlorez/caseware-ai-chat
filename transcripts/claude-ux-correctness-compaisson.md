I want to discuss about Streaming UX correctness and resilence

Feb 21
Sure, let's dive into Streaming UX correctness and resilience! This is a rich topic that touches on both technical implementation and user experience design. What angle would you like to explore?

To help focus our conversation, here are some natural directions we could go:

Correctness might include things like ensuring the UI accurately reflects the true state of the stream (no phantom data, proper ordering, handling out-of-order chunks), backpressure management, or consistency between what the server sent and what the user sees.

Resilience often covers how the UX gracefully handles network interruptions, partial failures, reconnection strategies (like SSE reconnect with Last-Event-ID), timeout handling, and degrading gracefully when streaming isn't available.

There's also the intersection — for example, what happens when a stream is interrupted mid-response? Do you show partial content? Roll back? Mark it as incomplete?

Do you have a specific context in mind — like a chat interface (similar to this one), a data dashboard, media streaming, or something else? And are you approaching this from a frontend engineering perspective, product design, or backend architecture?

I wanna check the best practices in enteprise companies offering AI chats such as Google, Anthropic, Open AI.

Feb 21
Great topic! Streaming UX in AI chat products is a place where the big players have converged on some patterns but also diverged in interesting ways. Let me walk through what's considered best practice across Google (Gemini), Anthropic (Claude), and OpenAI (ChatGPT).

Core Correctness Practices

The fundamental challenge is rendering tokens as they arrive without creating a jarring or misleading experience. The industry standard is to buffer just enough to avoid layout thrashing — rendering token-by-token at the raw speed of the model creates flickering and reflow issues, especially with markdown. Most platforms now batch micro-renders (every ~50–100ms) rather than painting every single token immediately.

Markdown rendering mid-stream is particularly tricky. If you start rendering **bold** before the closing ** arrives, you get broken formatting. OpenAI and Anthropic both use partial markdown parsers that hold back ambiguous syntax until it resolves, rather than eagerly committing to a render state that may be wrong.

Resilience Patterns

All three companies use Server-Sent Events (SSE) as the transport rather than WebSockets for unidirectional streaming. SSE gives you automatic reconnection and a Last-Event-ID header for resumability essentially for free at the protocol level. The question is what you do with that reconnect — do you resume mid-response or restart? In practice, for AI responses, most platforms restart the generation rather than trying to resume from a mid-token state, but they preserve the conversation context so the model doesn't lose history.

On network interruption, the dominant pattern is to show a clear "something went wrong" affordance rather than silently stopping. Both ChatGPT and Claude show a retry button that lets you regenerate from that point, treating the incomplete response as if it never completed rather than presenting it as a finished answer. This is a correctness decision as much as a UX one — a half-finished response shown as complete is worse than an explicit failure.

Progressive Disclosure and Perceived Performance

One underrated practice is the distinction between time to first token (TTFT) and total generation time. Enterprise AI UX is heavily optimized around TTFT because it creates the perception of responsiveness even if the full response takes several seconds. Google's Gemini has experimented with showing a loading shimmer before the first token, then switching to streaming text, to manage the latency gap cleanly.

Anthropic's interface handles tool use and thinking steps with a collapsible "thinking" block that streams separately from the final answer — this is a good pattern for separating internal reasoning from the user-facing response, avoiding cognitive overload while still being transparent.

Handling Edge Cases

A few things separate mature implementations from naive ones. First, scroll anchoring — keeping the viewport pinned to the bottom as tokens stream in, but releasing that anchor the moment a user scrolls up, so you don't yank them back down while they're reading. All three platforms do this. Second, copy behavior — the copy button should copy the fully rendered text, not the raw markdown with syntax characters. Third, interruption — all three offer a stop-generation button, and the correct behavior is to commit whatever was generated up to that point as a valid (if incomplete) message, not to discard it.

Where They Differ

OpenAI tends to be more aggressive about streaming everything immediately, including code blocks, which can create partial syntax-highlighted code that looks broken mid-stream. Anthropic tends to hold code blocks until they're more complete. Google's Gemini has at times rendered the full response first and then "played it back" as a fake stream — which improves visual correctness but sacrifices the genuine perceived-performance benefit of real streaming.

What aspect would you like to go deeper on? The technical transport layer, the rendering/markdown challenge, resilience and retry logic, or something like the scroll and interaction behaviors?