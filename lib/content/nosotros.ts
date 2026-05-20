/**
 * Contenido editorial de /nosotros.
 * Guía de actualización: docs/CONTENT.md
 */

import { siteContact } from "@/lib/site/contact";

export const pullQuote = {
  eyebrow: "UNA ENTREVISTA · ABRIL 2026",
  quoteBefore: "Cocinar para otros nunca fue mi profesión. Era el lugar donde me ",
  quoteEm: "acordaba",
  quoteAfter: " de quién era.",
  attribution: "FUNDADORA · MENESTERES",
} as const;

export const interview = [
  {
    q: '¿Por qué Menesteres y no "Escuela de Cocina X"?',
    a: '"Menesteres" en castellano antiguo eran las cosas necesarias para vivir. Comer es la primera. No queríamos un nombre que sonara a institución. Queríamos uno que sonara a casa.',
  },
  {
    q: "¿Qué pasa en una clase que no pasa en un curso online?",
    a: "El error. Cuando algo se quema, cuando una masa no levanta, cuando una salsa se corta. Eso no se puede transmitir por pantalla. Y es lo único que de verdad enseña.",
  },
  {
    q: "¿Hay algo que no enseñan?",
    a: 'Atajos. Hay técnicas que requieren tiempo y no se pueden acortar sin perder lo que las hace valiosas. Si alguien viene buscando "cocina express en 30 minutos", esta no es la cocina.',
  },
  {
    q: "¿Cómo imaginás a quien entra por primera vez?",
    a: "Con ganas de tocar, oler y probar. No hace falta saber de antes: hace falta quedarse el tiempo que la receta pide.",
  },
] as const;

/** Cifras orientativas — validar con el cliente antes de campañas. */
export const stats = [
  { value: "2019", label: "Primera clase", animate: false as const },
  { value: "500+", label: "Personas en mesa", animate: true as const },
  { value: "200+", label: "Encuentros en cocina", animate: true as const },
  { value: "4", label: "Ciclos por año", animate: false as const },
] as const;

const street = siteContact.address.street;

export const timeline = [
  { year: "2019", text: "Primera clase — pastas frescas, cuatro comensales, una mesa." },
  { year: "2021", text: `Inauguración del espacio en ${street}.` },
  { year: "2023", text: 'Primer ciclo "Sabores de estación" — doce fechas, cupo completo.' },
  { year: "2024", text: "Viaje de investigación: cocina coreana y japonesa." },
  { year: "2026", text: "Apertura del espacio para alquiler a creadores y producciones." },
] as const;

export const houseRules = [
  {
    numeral: "I",
    rule: "El que llega tarde, lava los platos.",
    explanation:
      "No es un castigo. Es una manera de recordar que la cocina es de todos.",
  },
  {
    numeral: "II",
    rule: "Si una receta sale mal, se come igual.",
    explanation: "El error es parte del proceso. Lo único que no se hace es tirar la comida.",
  },
  {
    numeral: "III",
    rule: "El celular se apaga al cruzar la puerta.",
    explanation: "Tres horas sin pantalla. Ningún video sale tan rico como una clase atendida.",
  },
  {
    numeral: "IV",
    rule: "Preguntar no molesta; callar sí.",
    explanation: "La duda en voz alta es parte del aprendizaje. El silencio incómodo, no.",
  },
] as const;

export const openLetter = {
  scriptOpen: "Si llegaste hasta acá,",
  body1:
    "probablemente estás buscando algo más que aprender una receta. Está bien. Es lo mismo que buscamos nosotros cada vez que abrimos las puertas un sábado a la tarde.",
  body2:
    "No prometemos transformarte en chef. Sí prometemos que después de pasar por nuestra cocina, vas a mirar la tuya un poco distinto.",
  scriptClose: "Te esperamos.",
} as const;
