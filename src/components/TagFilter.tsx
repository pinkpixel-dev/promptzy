
import { Tag } from "@/types";

interface TagFilterProps {
  allTags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
}

const TagFilter = ({ allTags, selectedTags, onToggleTag }: TagFilterProps) => {
  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-2.5"
        style={{ color: "var(--accent-yellow)", opacity: 0.85 }}
      >
        Filter by tag
      </p>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            className={`tag cursor-pointer ${selectedTags.includes(tag.id) ? "tag-active" : ""}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;
