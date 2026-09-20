// jwt.js
import { createRemoteJWKSet, jwtVerify } from 'jose';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing from .env');
}

// JWKS endpoint: Supabase publishes its public signing keys here.
// jose caches these automatically, so this is a one-time fetch.
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
);

/**
 * Verify a Supabase-issued JWT locally and return its payload, or null if invalid.
 * This avoids the network round-trip to Supabase Auth on every request.
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });
    // Supabase puts the user id in `sub`
    return { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata };
  } catch (err) {
    console.warn('JWT verify failed:', err.message);
    return null;
  }
}