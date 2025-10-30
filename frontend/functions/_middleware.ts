/**
 * Cloudflare Pages Functions Middleware
 * This middleware fixes the Permissions-Policy header to allow camera access
 */

interface Env {
  ASSETS: { fetch: typeof fetch };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Get the response from the asset
  const response = await context.next();

  // Clone the response so we can modify headers
  const newResponse = new Response(response.body, response);

  // Remove the restrictive Permissions-Policy header
  newResponse.headers.delete('permissions-policy');
  newResponse.headers.delete('Permissions-Policy');

  // Add a permissive Permissions-Policy that allows camera
  newResponse.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), payment=(self)'
  );

  // Also set other security headers
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return newResponse;
};
