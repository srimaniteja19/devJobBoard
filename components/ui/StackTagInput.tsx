"use client";

import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { STACK_OPTIONS } from "@/types";

interface StackTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

export default function StackTagInput({
  value,
  onChange,
  error,
}: StackTagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = STACK_OPTIONS.filter(
    (opt) =>
      !value.includes(opt) &&
      opt.toLowerCase().includes(input.toLowerCase())
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInput("");
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`flex flex-wrap gap-1.5 border bg-bg px-3 py-2 transition-theme focus-within:border-accent ${
          error ? "border-[#f87171]" : "border-edge"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-[#1a1a2e] px-2 py-0.5 text-[11px] font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 transition-theme hover:text-t-primary"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Type and press Enter..." : ""}
          className="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-[13px] text-t-primary outline-none placeholder:text-t-faint"
        />
      </div>

      {showSuggestions && input && suggestions.length > 0 && (
        <div className="border border-edge bg-surface py-1">
          {suggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="w-full px-3 py-1.5 text-left text-[13px] font-light text-t-muted transition-theme hover:bg-bg hover:text-t-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {value.length === 0 && !input && (
        <div className="flex flex-wrap gap-1">
          {STACK_OPTIONS.slice(0, 10).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="bg-edge px-2 py-0.5 text-[11px] text-t-faint transition-theme hover:text-t-muted"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
}
