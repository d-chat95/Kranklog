import { createClient } from "@supabase/supabase-js";
import type { RequestHandler, Request } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for auth to work."
  );
}

const supabaseAdmin = createClient(supabaseUrl ?? "", supabaseServiceKey ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Augment Express Request with auth user
declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware that verifies a Supabase JWT from the Authorization header
 * and auto-syncs the user to our local users table.
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    req.authUser = {
      id: user.id,
      email: user.email ?? "",
    };

    // Auto-sync user to our local users table (upsert)
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email ?? null,
        firstName: user.user_metadata?.first_name ?? null,
        lastName: user.user_metadata?.last_name ?? null,
        profileImageUrl: user.user_metadata?.avatar_url ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email ?? null,
          firstName: user.user_metadata?.first_name ?? null,
          lastName: user.user_metadata?.last_name ?? null,
          profileImageUrl: user.user_metadata?.avatar_url ?? null,
          updatedAt: new Date(),
        },
      });

    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/** Extract the authenticated user's ID from the request */
export function getUserId(req: Request): string {
  return req.authUser!.id;
}

/** Get auth user profile from our local users table */
export async function getAuthUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
}
