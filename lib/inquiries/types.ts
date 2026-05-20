export type InquiryType = "contact" | "espacio";

export interface ContactInquiryPayload {
  mensaje: string;
}

export interface EspacioInquiryPayload {
  marca: string;
  fecha: string;
  mensaje: string;
}

export type InquiryPayload = ContactInquiryPayload | EspacioInquiryPayload;
