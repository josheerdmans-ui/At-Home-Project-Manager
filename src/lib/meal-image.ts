const CACHE_PREFIX = "meal-img:";

function cacheKey(name: string) {
  return `${CACHE_PREFIX}${name.toLowerCase().trim()}`;
}

function searchQueries(mealName: string): string[] {
  const trimmed = mealName.trim();
  const simplified = trimmed
    .replace(/\b(homemade|night|family)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = simplified.split(" ").filter(Boolean);
  const short = words.length > 3 ? words.slice(-3).join(" ") : simplified;

  return [...new Set([trimmed, simplified, short].filter(Boolean))];
}

async function searchTheMealDb(query: string): Promise<string | null> {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { meals?: { strMealThumb?: string }[] | null };
  const thumb = data.meals?.[0]?.strMealThumb;
  return thumb && thumb.length > 0 ? thumb : null;
}

/** Free food photo lookup by meal name (TheMealDB). Cached per session. */
export async function fetchMealImageUrl(mealName: string): Promise<string | null> {
  const key = cacheKey(mealName);
  try {
    const cached = sessionStorage.getItem(key);
    if (cached === "none") return null;
    if (cached) return cached;
  } catch {
    /* private mode */
  }

  for (const query of searchQueries(mealName)) {
    const thumb = await searchTheMealDb(query);
    if (thumb) {
      try {
        sessionStorage.setItem(key, thumb);
      } catch {
        /* ignore */
      }
      return thumb;
    }
  }

  try {
    sessionStorage.setItem(key, "none");
  } catch {
    /* ignore */
  }
  return null;
}
