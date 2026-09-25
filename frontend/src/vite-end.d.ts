/// <reference types="vite/client" />

// Solo añadimos lo que realmente necesitamos (evitamos duplicados)
declare module '*.css' {
  const content: string;
  export default content;
}

// Si usas CSS Modules (ej: Button.module.css)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Imágenes y assets comunes
declare module '*.png' { 
  const src: string; 
  export default src; 
}

declare module '*.jpg' { 
  const src: string; 
  export default src; 
}

declare module '*.jpeg' { 
  const src: string; 
  export default src; 
}

declare module '*.svg' { 
  const src: string; 
  export default src; 
}