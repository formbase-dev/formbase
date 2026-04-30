import { queryClient } from '@formbase/db';

export async function GET() {
  try {
    await queryClient.execute('SELECT 1000');

    return new Response('All systems operational', { status: 200 });
  } catch {
    return new Response(`An error occured`, { status: 500 });
  }
}
