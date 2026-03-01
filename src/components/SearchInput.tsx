
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchInput = ({ searchTerm, onSearchChange }: SearchInputProps) => {
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: "var(--accent-cyan)", opacity: 0.7 }}
      />
      <Input
        type="text"
        placeholder="Search prompts…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "var(--text-strong)",
          borderRadius: "12px",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.40)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,211,238,0.10)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
};

export default SearchInput;
