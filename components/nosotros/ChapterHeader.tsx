export interface ChapterHeaderProps {
  chapter: string;
  section: string;
  totalPages: number;
}

export function ChapterHeader({ chapter, section, totalPages }: ChapterHeaderProps) {
  const pages = String(totalPages).padStart(2, "0");

  return (
    <header className="border-b border-carbon bg-crema px-8 py-4 lg:px-10 lg:py-5">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between">
        <p className="font-mono text-[10px] font-medium uppercase tracking-eyebrow text-carbon">
          MENESTERES <span aria-hidden="true">·</span> CAP. {chapter} <span aria-hidden="true">·</span>{" "}
          {section}
        </p>
        <p className="font-mono text-[10px] font-medium uppercase tracking-eyebrow text-carbon/60">
          PÁG. 01 <span aria-hidden="true">/</span> {pages}
        </p>
      </div>
    </header>
  );
}
