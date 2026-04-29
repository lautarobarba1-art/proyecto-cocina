export type ClassStatus = "disponible" | "últimos cupos" | "agotado";

export interface ClassMock {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  status: ClassStatus;
}

export const CLASSES_MOCK: ClassMock[] = [
  {
    id: "1",
    slug: "masa-madre-y-fermentacion",
    title: "Masa madre y fermentación",
    category: "Panadería",
    price: "$ 45.000",
    duration: "3 horas",
    description:
      "Levadura natural, autólisis y horneado de hogaza. Llevás tu propia masa lista para el frío.",
    image: {
      src: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=900&q=85",
      alt: "Panes artesanales y harina sobre mesa de madera",
    },
    status: "últimos cupos",
  },
  {
    id: "2",
    slug: "pasteleria-fina-clasica",
    title: "Pastelería fina clásica",
    category: "Pastelería",
    price: "$ 52.000",
    duration: "4 horas",
    description: "Técnicas francesas: merengue, cremas y montaje de torta en capas.",
    image: {
      src: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=900&q=85",
      alt: "Torta con frutos rojos y crema pastelera",
    },
    status: "disponible",
  },
  {
    id: "3",
    slug: "empanadas-norte",
    title: "Empanadas y repulgue norteño",
    category: "Cocina regional",
    price: "$ 38.000",
    duration: "2,5 horas",
    description: "Masa, rellenos clásicos y el repulgue que no se abre al horno.",
    image: {
      src: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=85",
      alt: "Empanadas recién horneadas en bandeja",
    },
    status: "disponible",
  },
  {
    id: "4",
    slug: "vegetariano-de-estacion",
    title: "Vegetariano de estación",
    category: "Vegetariano",
    price: "$ 42.000",
    duration: "3 horas",
    description: "Cuatro platos con verduras de mercado, texturas y emplatado editorial.",
    image: {
      src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85",
      alt: "Plato vegetal colorido en mesa clara",
    },
    status: "agotado",
  },
  {
    id: "5",
    slug: "asado-y-guarniciones",
    title: "Asado y guarniciones",
    category: "Fuego",
    price: "$ 48.000",
    duration: "3,5 horas",
    description: "Cortes, tiempos de parrilla y acompañamientos que no compiten con la carne.",
    image: {
      src: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900&q=85",
      alt: "Carnes a la parrilla con brasas",
    },
    status: "disponible",
  },
  {
    id: "6",
    slug: "pasta-fresca-en-casa",
    title: "Pasta fresca en casa",
    category: "Italiana",
    price: "$ 40.000",
    duration: "2,5 horas",
    description: "Salsas, fettuccine y ñoquis sin máquina — solo rodillo y manos.",
    image: {
      src: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&q=85",
      alt: "Pasta fresca colgando sobre superficie de cocina",
    },
    status: "últimos cupos",
  },
  {
    id: "7",
    slug: "sushi-para-principiantes",
    title: "Sushi para principiantes",
    category: "Mundo",
    price: "$ 55.000",
    duration: "3 horas",
    description: "Arroz, nigiris básicos y rolls firmes sin pegarse al mantel.",
    image: {
      src: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900&q=85",
      alt: "Bandeja de sushi variado",
    },
    status: "disponible",
  },
  {
    id: "8",
    slug: "chocolate-de-origen",
    title: "Chocolate de origen",
    category: "Pastelería",
    price: "$ 44.000",
    duration: "2 horas",
    description: "Temperado, ganache y tabletas con frutos secos tostados.",
    image: {
      src: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=900&q=85",
      alt: "Chocolate derretido y tabletas artesanales",
    },
    status: "disponible",
  },
];

export function getClassCategories(classes: ClassMock[]): string[] {
  const set = new Set(classes.map((c) => c.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
}

/** Turnos mock para el selector de reserva (frontend sin backend). */
export const DEFAULT_CLASS_SESSIONS: { id: string; label: string }[] = [
  { id: "ses-1", label: "Sábado 17 de mayo · 10:00 — 13:30" },
  { id: "ses-2", label: "Sábado 24 de mayo · 10:00 — 13:30" },
  { id: "ses-3", label: "Miércoles 4 de junio · 18:30 — 21:30" },
];

export function getClassBySlug(slug: string): ClassMock | undefined {
  return CLASSES_MOCK.find((c) => c.slug === slug);
}
