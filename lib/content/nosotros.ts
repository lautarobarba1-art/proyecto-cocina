/**
 * TODO: replace with real interview transcript from client meeting
 * TODO: confirm timeline events with client
 * TODO: confirm "house rules" with chef during discovery
 *
 * V1 placeholder copy — migrate to CMS (Sanity / Contentlayer) when ready.
 */

export const pullQuote = {
  eyebrow: "UNA ENTREVISTA · ABRIL 2026",
  quoteBefore: "Cocinar para otros nunca fue mi profesión. Era el lugar donde me ",
  quoteEm: "acordaba",
  quoteAfter: " de quién era.",
  attribution: "FUNDADORA · LA CHEF",
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
    q: "¿Hay algo que no enseñen?",
    a: 'Atajos. Hay técnicas que requieren tiempo y no se pueden acortar sin perder lo que las hace valiosas. Si alguien viene buscando "cocina express en 30 minutos", esta no es la cocina.',
  },
] as const;

export const stats = [
  { value: "2019", label: "Primera clase", animate: false as const },
  { value: "1247", label: "Alumnos", animate: true as const },
  { value: "312", label: "Clases dictadas", animate: true as const },
  { value: "8", label: "Países visitados", animate: true as const },
] as const;

export const timeline = [
  { year: "2019", text: "Primera clase — pastas frescas, 4 alumnos, una mesa." },
  { year: "2021", text: "Inauguración del espacio en San Martín 1234." },
  { year: "2023", text: 'Primer ciclo "Sabores de estación" — 12 clases, sold out.' },
  { year: "2024", text: "Viaje a Asia: investigación de cocina coreana y japonesa." },
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
] as const;

export const openLetter = {
  scriptOpen: "Si llegaste hasta acá,",
  body1:
    "probablemente estás buscando algo más que aprender una receta. Está bien. Es lo mismo que buscamos nosotros cada vez que abrimos las puertas un sábado a la tarde.",
  body2:
    "No prometemos transformarte en chef. Sí prometemos que después de pasar por nuestra cocina, vas a mirar la tuya un poco distinto.",
  scriptClose: "Te esperamos.",
} as const;
