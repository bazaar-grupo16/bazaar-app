export const PRODUCT_CATEGORIES = [
  "Electrónica",
  "Ropa y accesorios",
  "Hogar y muebles",
  "Deportes",
  "Juguetes y niños",
  "Libros y educación",
  "Vehículos",
  "Inmuebles",
  "Servicios",
  "Otros",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
