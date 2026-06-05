export type ServiceType = "clases" | "eventos" | "alquiler";

export interface ServiceColors {
  bg: string;
  text: string;
  label: string;
}

export const SERVICE_COLORS: Record<ServiceType, ServiceColors> = {
  clases: { bg: "#D65226", text: "#FFFAF3", label: "CLASES" },
  eventos: { bg: "#813408", text: "#FFFAF3", label: "EVENTOS PRIVADOS" },
  alquiler: { bg: "#696027", text: "#FFFAF3", label: "ALQUILER DEL ESPACIO" },
};
