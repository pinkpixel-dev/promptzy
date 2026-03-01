
import { useState } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchInput = ({ searchTerm, onSearchChange }: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hex = "#22d3ee";

  return (
    <div className="relative group w-full">
      {/* Focus Glow Background */}
      <div
        className="absolute -inset-0.5 rounded-xl blur transition duration-500"
        style={{
          backgroundColor: hex,
          opacity: isFocused ? 0.3 : 0,
        }}
      />
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-4 transition-colors duration-300 pointer-events-none"
          style={{ color: isFocused ? hex : "#71717a" }}
        />
        <input
          type="text"
          placeholder="Search prompts…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl focus:outline-none py-3 pl-11 pr-4 transition-all duration-300"
          style={{
            borderColor: isFocused ? hex : undefined,
            boxShadow: isFocused ? `0 0 0 1px ${hex}` : "none",
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
