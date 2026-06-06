declare global {
  interface CloudflareEnv {
    WEBHOOK_QUEUE: Queue;
  }
}

export {};
