
import React, { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Tag } from "@/types";

interface TagInputProps {
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (tagId: string) => void;
}

const TagInput = ({ tags, onAddTag, onRemoveTag }: TagInputProps) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: tagInput.trim(),
      };
      onAddTag(newTag);
      setTagInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add tags..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-secondary/50 border-secondary"
        />
        <Button
          type="button"
          onClick={handleAddTag}
          className="px-2 transition-all duration-200"
          style={{
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.35)",
            color: "#22d3ee",
            boxShadow: "0 0 10px rgba(34,211,238,0.12)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.22)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(34,211,238,0.32)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.12)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(34,211,238,0.12)";
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="tag flex items-center gap-1"
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag.id)}
                className="text-cyan-300 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
