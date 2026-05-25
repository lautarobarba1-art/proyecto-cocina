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
        src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local2.webp",
        alt: "Interior local",
        title: "Interior local",
        objectPosition: "center",
    },
    {
        id: "foto-2",
        type: "image",
        src: "/galeria/comida3.jpg",
        alt: "Mane Copetin",
        title: "Mane Copetin",
    },
    {
        id: "foto-3",
        type: "image",
        src: "/galeria/comida4.jpg",
        alt: "Mini cake",
        title: "Mini cake",
    },
    {
        id: "foto-4",
        type: "image",
        src: "/galeria/mane-b&w.jpg",
        alt: "Mane B&W",
        title: "Cocina en tiempo real",
    },
    {
        id: "foto-5",
        type: "image",
        src: "/galeria/copas-b&w.jpg",
        alt: "Copas B&W",
        title: "Equipo",
        objectPosition: "top 90% right 10%",
    },
    {
        id: "foto-6",
        type: "image",
        src: "/galeria/comida2.jpg",
        alt: "Arepas",
        title: "Arepas",
    },
    {
        id: "foto-7",
        type: "image",
        src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local10.webp",
        alt: "Interior local",
        title: "Interior local",
    },
    {
        id: "foto-8",
        type: "image",
        src: "/galeria/comida6.jpg",
        alt: "Mane Copetin",
        title: "Mane Copetin",
    },
    {
        id: "foto-9",
        type: "image",
        src: "/galeria/mane-copetin-b_w.webp",
        alt: "Mane Copetin",
        title: "Mane Copetin",
        objectPosition: "center top 50%",
    },
    {
        id: "foto-10",
        type: "image",
        src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local9.webp",
        alt: "Mane Copetin",
        title: "Mane Copetin",
        objectPosition: "center",
    },
  ];