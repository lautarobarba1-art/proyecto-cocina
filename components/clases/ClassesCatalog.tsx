"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CLASSES_MOCK, getClassCategories } from "@/lib/classes-mock";

import { ClaseCard } from "./ClaseCard";

const ALL = "Todas";

export interface ClassesCatalogProps {
  className?: string;
}

export function ClassesCatalog({ className }: ClassesCatalogProps) {
  const categories = React.useMemo(() => [ALL, ...getClassCategories(CLASSES_MOCK)], []);
  const [active, setActive] = React.useState<string>(ALL);

  const filtered = React.useMemo(
    () => (active === ALL ? CLASSES_MOCK : CLASSES_MOCK.filter((c) => c.category === active)),
    [active],
  );

  return (
    <div className={className ?? ""}>
      <nav
        className="mb-14 border-b border-carbon/10 pb-1"
        aria-label="Filtrar por categoría"
      >
        <ul className="flex min-w-0 flex-wrap gap-2 md:gap-3">
          {categories.map((label) => {
            const isActive = active === label;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => setActive(label)}
                  aria-pressed={isActive}
                  className={[
                    "min-h-11 whitespace-nowrap border-b-2 px-2 py-2.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300 ease-snap sm:px-3",
                    isActive
                      ? "border-terracota text-terracota"
                      : "border-transparent text-carbon/50 hover:text-carbon/80",
                  ].join(" ")}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="grid min-w-0 grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-16"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={["min-h-0", index === 0 ? "lg:col-span-2" : ""].join(" ")}
            >
              <ClaseCard item={item} isFeatured={index === 0} className="h-full min-h-0 w-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
