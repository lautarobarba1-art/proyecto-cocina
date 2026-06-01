export interface GaleriaItem {
    id: string;
    type: "video" | "image";
    src: string;
    alt: string;       // caption en el lightbox y accesibilidad
    title?: string;    // título opcional en el overlay del grid
    objectPosition?: string;
  }
  
  export const GaleriaGrid: readonly GaleriaItem[] = [
    {
        id: "foto-1",
        type: "image",
        src: "/imagenes-b&w/persona-manos-en-plato.jpeg",
        alt: "Clase sushi y sake",
        title: "Clase sushi y sake",
        objectPosition: "center",
    },
    {
        id: "foto-2",
        type: "image",
        src: "/imagenes-comida/imagencomida2.webp",
        alt: "Sushi ball",
        title: "Sushi ball",
    },
    {
        id: "foto-3",
        type: "image",
        src: "/imagenes-b&w/copas-blancoynegro.jpeg",
        alt: "Celebración Menesteres",
        title: "Asian salad bowl",
    },
    {
        id: "foto-4",
        type: "image",
        src: "/imagenes-comida/imagencomida7.webp",
        alt: "salmon salad",
        title: "salmon salad",
    },
    {
        id: "foto-5",
        type: "image",
        src: "/imagenes-comida/imagencomida13 (1).webp",
        alt: "tortilla española",
        title: "tortilla española",
        objectPosition: "top 90% right 10%",
    },
    {
        id: "foto-6",
        type: "image",
        src: "/imagenes-b&w/mane-copetin-mano-blancoynegro.jpeg",
        alt: "mane copetin",
        title: "mane copetin",
    },
    {
        id: "foto-7",
        type: "image",
        src: "/imagenes-b&w/mane-prepa-plato-blancoynegro.jpeg",
        alt: "Evento de cocina",
        title: "Evento de cocina",
    },
    {
        id: "foto-8",
        type: "image",
        src: "/imagenes-comida/imagencomida1.webp",
        alt: "Trufas",
        title: "Trufas",
    },
    {
        id: "foto-9",
        type: "image",
        src: "/imagenes-comida/imagencomida8.webp",
        alt: "Papas rústicas con aderezo casero",
        title: "Papas rústicas con aderezo casero",
        objectPosition: "center top 50%",
    },
    {
        id: "foto-10",
        type: "image",
        src: "/imagenes-b&w/mane-pila-platos-blancoynegro.jpeg",
        alt: "evento de cocina v2",
        title: "evento de cocina v2",
        objectPosition: "center",
    },
  ];