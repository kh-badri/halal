import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.SESSION_SECRET || 'roadtohalal_super_secret_jwt_key_at_least_32_chars_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  identifier: string;
  role: 'pria' | 'wanita';
  isAdmin: boolean;
  workspaceId?: string;
  [key: string]: any;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}
