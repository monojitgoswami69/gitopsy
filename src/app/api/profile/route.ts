import { NextRequest, NextResponse } from "next/server";
import { SubjectProfile } from "@/types/domain";

interface CachedProfile {
  profile: SubjectProfile;
  expiresAt: number;
}

const profileCache = new Map<string, CachedProfile>();

export async function GET(request: NextRequest) {
  const token = request.cookies.get("gitopsy_token_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return from in-memory cache if fresh (5-minute TTL)
  const cached = profileCache.get(token);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(
      { profile: cached.profile },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  }

  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Gitopsy-Forensic-Analyzer",
      },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch profile from GitHub" },
        { status: userRes.status }
      );
    }

    const data = await userRes.json();

    const profile: SubjectProfile = {
      login: data.login,
      name: data.name || null,
      avatarUrl: data.avatar_url,
      bio: data.bio || null,
      company: data.company || null,
      location: data.location || null,
      createdAt: data.created_at,
      publicRepos: data.public_repos || 0,
      totalPrivateRepos: data.total_private_repos || 0,
      followers: data.followers || 0,
      following: data.following || 0,
    };

    // Evict expired entries on every request (insertion order = oldest first);
    // if still over capacity, drop the oldest remaining entries.
    for (const [key, val] of profileCache.entries()) {
      if (val.expiresAt <= now) {
        profileCache.delete(key);
      }
    }
    while (profileCache.size >= 200) {
      const oldest = profileCache.keys().next().value;
      if (oldest === undefined) break;
      profileCache.delete(oldest);
    }

    // Save to memory cache for 5 minutes
    profileCache.set(token, {
      profile,
      expiresAt: now + 5 * 60 * 1000,
    });

    return NextResponse.json(
      { profile },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
