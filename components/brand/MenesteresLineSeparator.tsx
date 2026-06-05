import Image from "next/image";

export interface MenesteresLineSeparatorProps {
  className?: string;
}

/** Línea separadora de marca — ancho completo del viewport (mobile, tablet, desktop). */
export function MenesteresLineSeparator({ className }: MenesteresLineSeparatorProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "relative w-screen max-w-[100vw] ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/brand-elements/menesteres-elements/linea-separadora-menesteres.svg"
        alt=""
        width={420}
        height={80}
        className="pointer-events-none h-auto w-full select-none opacity-[0.22]"
      />
    </div>
  );
}
