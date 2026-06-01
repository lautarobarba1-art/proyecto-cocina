export type InquiryType = "contact" | "espacio" | "eventos";

export interface ContactInquiryPayload {
  mensaje: string;
}

export interface EspacioInquiryPayload {
  marca: string;
  fecha: string;
  mensaje: string;
}

export interface EventosInquiryPayload {
  fecha: string;
  mensaje: string;
}

export type InquiryPayload =
  | ContactInquiryPayload
  | EspacioInquiryPayload
  | EventosInquiryPayload;
