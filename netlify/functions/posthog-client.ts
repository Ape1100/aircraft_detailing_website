import { PostHog } from "posthog-node";

/**
 * Creates a fresh PostHog client for a single serverless invocation.
 * flushAt:1 / flushInterval:0 ensures every capture is sent immediately
 * without waiting for a batch — required in short-lived Netlify Functions.
 * Always call `await client.shutdown()` before returning from your handler.
 */
export function createPostHogClient(): PostHog {
  return new PostHog(process.env.POSTHOG_API_KEY as string, {
    host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}
