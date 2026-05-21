import { Category } from "@/lib/types";
import { CATEGORY_BG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", CATEGORY_BG[category])}>
      {category}
    </span>
  );
}
