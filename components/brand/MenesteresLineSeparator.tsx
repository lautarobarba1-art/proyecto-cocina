export interface MenesteresLineSeparatorProps {
  className?: string;
}

const LINE_SRC = "/brand-elements/menesteres-elements/linea-separadora-menesteres.svg";

/** Línea separadora de marca — ancho completo del viewport, trazo completo (sin recorte). */
export function MenesteresLineSeparator({ className }: MenesteresLineSeparatorProps) {
  return (
    <div
      aria-hidden="true"
      className={["w-full overflow-hidden", className].filter(Boolean).join(" ")}
    >
      <div
        className="relative left-1/2 h-7 w-screen max-w-[100vw] -translate-x-1/2 bg-center bg-no-repeat opacity-[0.22] sm:h-8 md:h-9"
        style={{
          backgroundImage: `url('${LINE_SRC}')`,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
