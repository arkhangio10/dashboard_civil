# Hergonsa Dashboard

Este proyecto es un dashboard para la gestión de reportes de construcción y análisis de KPIs.

## Tecnologías utilizadas

- React 18
- TypeScript
- Vite
- Firebase (Firestore y Authentication)
- Chart.js
- SASS para estilos
- React Router para navegación

## Requisitos previos

- Node.js (versión 16 o superior)
- npm o yarn

## Instalación

1. Clona este repositorio:

```bash
git clone https://github.com/tu-usuario/hergonsa-dashboard.git
cd hergonsa-dashboard
```

2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

> Nota: Si decides mantener la configuración de Firebase directamente en el código, puedes omitir este paso.

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## Compilación para producción

Para generar la versión de producción:

```bash
npm run build
# o
yarn build
```

Los archivos compilados estarán en la carpeta `dist`.

## Estructura del proyecto

- `/src/assets`: Imágenes, iconos y estilos globales
- `/src/components`: Componentes reutilizables
- `/src/contexts`: Contextos de React, incluyendo AuthContext
- `/src/hooks`: Hooks personalizados como useKPIData
- `/src/services`: Configuración de servicios externos (Firebase)
- `/src/utils`: Utilidades y funciones auxiliares
- `/src/views`: Páginas principales de la aplicación

## Características

- Autenticación de usuarios con Firebase
- Dashboard con múltiples pestañas para análisis de datos
- Visualización de datos con gráficos y tablas
- Filtrado de datos por fecha, subcontratista, categoría, etc.
- Análisis de KPIs de construcción
- Sistema de caché para mejorar el rendimiento

## Licencia

Este proyecto es privado y confidencial.