import { eventBus } from '@/lib/event-bus';

// export const dynamic = "force-static"

export async function GET(req: Request) {
  const { signal } = req;

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = eventBus.subscribe(msg => {
        if (signal.aborted) return;

        try {
          controller.enqueue(`data: ${msg}\n\n`);
        } catch {
          unsubscribe();
        }
      });

      signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Encoding': 'none',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
