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
    q: '¿Cuál fue el incentivo principal para comenzar con las clases?',
    a: 'Quería encontrar una manera más descontracturada, cercana y humana de enseñar y transmitir lo que sé.'
  },
  {
    q: '¿Qué pasa en una clase que no pasa en un curso online?',
    a: 'En una clase presencial aparecen momentos espontáneos: una corrección a tiempo, un tip, una duda compartida o una idea que surge mientras se cocina. Esas pequeñas situaciones son las que hacen que el aprendizaje se vuelva más real y memorable.',
  },
  {
    q: "¿Qué te gustaría que la gente sienta cuando piensa en 'Menesteres'?",
    a: 'Me gustaría que lo sientan como una casa, no como una institución. Un lugar cálido, cercano y cotidiano, donde desde el primer momento puedan sentirse cómodos, aprender y compartir.',
  }
] as const;

/** Cifras orientativas — validar con el cliente antes de campañas. */
export const stats = [
  { value: "2018", label: "Primera clase", animate: false as const },
  { value: "300", suffix:"+", label: "Personas en mesa", animate: true as const },
  { value: "150", suffix:"+" ,label: "Encuentros en cocina", animate: true as const },
] as const;

const street = siteContact.address.street;

export const timeline = [
  { year: "2018", text: "Comienzo de 'Menesteres'" },
  { year: "2023", text: 'Primer ciclo "Sabores de estación" — doce fechas, cupo completo.' },
  { year: "2025", text: `Inauguración del espacio en ${street}.`},
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
  "probablemente estás buscando algo más que aprender una receta. Buscás un momento para cocinar, compartir y llevarte algo que después puedas repetir en tu casa.",
  body2:
  "No prometemos transformarte en chef. Sí prometemos que después de pasar por nuestra cocina, vas a mirar la tuya un poco distinto.",
  scriptClose: "Te esperamos.",
  } as const;
  
