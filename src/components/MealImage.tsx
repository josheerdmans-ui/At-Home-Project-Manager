import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import { fetchMealImageUrl } from "../lib/meal-image";

type Props = {
  mealName: string;
  className?: string;
  iconSize?: number;
};

export function MealImage({ mealName, className = "", iconSize = 28 }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setUrl(null);

    fetchMealImageUrl(mealName).then((found) => {
      if (!cancelled) {
        setUrl(found);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mealName]);

  if (url) {
    return <img src={url} alt="" className={`object-cover ${className}`} loading="lazy" />;
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-700 ${className} ${loading ? "animate-pulse" : ""}`}
      aria-hidden
    >
      <ChefHat size={iconSize} />
    </div>
  );
}
