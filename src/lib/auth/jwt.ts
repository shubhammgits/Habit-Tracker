import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type SessionTokenPayload = {
  sub: string; // userId
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

export function signSessionToken(params: { userId: string; email: string }): string {
  return jwt.sign(
    {
      sub: params.userId,
      email: params.email,
    },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "30d",
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }
  );
}

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as SessionTokenPayload;
}
