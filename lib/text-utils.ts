import * as React from "react";

export function highlightWords(text: string, words: string[]): React.ReactNode {
  if (words.length === 0) return text;

  const escapedWords = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escapedWords.join("|")})`, "gi");
  const highlighted = new Set(words.map((word) => word.toLocaleLowerCase("es")));

  return text.split(matcher).map((part, index) =>
    highlighted.has(part.toLocaleLowerCase("es")) ? (
      React.createElement("span", { key: `${part}-${index}`, style: { color: "#D65226" } }, part)
    ) : (
      part
    ),
  );
}
