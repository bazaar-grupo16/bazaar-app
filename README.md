# Bazaar

Aplicación de marketplace mobile construida con React Native + Expo, siguiendo la arquitectura **Feature-Sliced Design (FSD)**.

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| [Expo](https://expo.dev) | SDK 54 | Runtime y toolchain |
| [React Native](https://reactnative.dev) | 0.81 | Framework UI |
| [React Navigation](https://reactnavigation.org) | v7 | Navegación (stack + tabs) |
| [TanStack Query](https://tanstack.com/query) | v5 | Server state (fetching, caché, sincronización) |
| [Zustand](https://zustand-demo.pmnd.rs) | v4 | Client state |
| TypeScript | 5.x | Tipado estático en modo `strict` |

---

## Arquitectura: Feature-Sliced Design

FSD divide la aplicación en **capas** ordenadas de mayor a menor abstracción. Una capa solo puede importar de las capas que están **por debajo** de ella — nunca hacia arriba, nunca en círculos.

```
src/
  pages/      ← vistas completas
  widgets/    ← bloques UI reutilizables
  features/   ← interacciones del usuario
  entities/   ← modelos de negocio
  shared/     ← utilidades sin lógica de dominio (estilos, UI base, API client)
  navigation/ ← configuración de navegadores
```

---

## Estructura de carpetas

```
bazaar-app/
├── .github/
│   └── workflows/         # Pipelines de CI/CD
│
├── assets/                # Imágenes y recursos estáticos (íconos, splash, fuentes)
│
├── src/
│   ├── navigation/        # Navegadores de React Navigation (stack raíz, tabs, etc.)
│   │
│   ├── pages/             # Una carpeta por vista/ruta (ej: home/, login/, cart/)
│   │
│   ├── widgets/           # Bloques UI reutilizables con lógica de dominion (ej: ProductCard, CartSummary)
│   │
│   ├── features/          # Acciones del usuario que cruzan entidades (ej: add-to-cart/, checkout/)
│   │
│   ├── entities/          # Un slice por modelo de negocio, con su UI, tipos y queries (ej: product/, user/, cart/)
│   │
│   └── shared/
│       ├── api/           # Cliente HTTP base y configuración de endpoints
│       ├── styles/        # Tokens de diseño: colores, tipografía, espaciados
│       └── ui/            # Componentes genéricos sin lógica de negocio (ej: Button, Input)
│
├── App.tsx                # Entry point: providers y navegador raíz
├── index.js               # Registro de la app con Expo
├── app.json               # Configuración de Expo (nombre, íconos, permisos)
├── tsconfig.json          # TypeScript strict + alias @/* → src/*
└── package.json
```

---

## Comunicación con microservicios

La app se comunica con los microservicios del backend a través de HTTP REST. El cliente HTTP centralizado vive en `src/shared/api/` y es consumido por las queries de cada entidad.

```
shared/api/client.ts      ← cliente HTTP base (headers, base URL, manejo de errores)

entities/
  [entidad]/
    model/queries.ts      ← hooks de TanStack Query que llaman al client
```

Cada microservicio tiene su propia base URL configurada vía variables de entorno. TanStack Query se encarga del caché, los reintentos y los estados de carga/error de forma declarativa.


## Cómo correr la app

### Requisitos previos

- Node.js 20+
- npm 10+
- [Expo Go](https://expo.dev/client) en el celular (SDK 54) **o** un emulador configurado

### Instalación

```bash
npm install
npm start
```

| Tecla | Acción |
|---|---|
| `a` | Abrir en emulador Android |
| `i` | Abrir en simulador iOS (solo macOS) |
| `w` | Abrir en navegador web |
| Escanear QR | Abrir en Expo Go (celular físico, misma red WiFi) |


## Convenciones para contribuir

Al agregar una nueva funcionalidad, seguir el flujo FSD:

1. **¿Es un modelo de negocio nuevo?** → crear en `entities/`
2. **¿Es una acción del usuario?** → crear en `features/`
3. **¿Es un bloque UI reutilizable en múltiples páginas?** → crear en `widgets/`
4. **¿Es la vista de una ruta?** → crear en `pages/` y registrar en `src/navigation/`
5. **¿Es una utilidad sin lógica de dominio?** → crear en `shared/`

Cada slice expone su API pública únicamente a través de su `index.ts`. No importar desde subcarpetas internas de otro slice.
