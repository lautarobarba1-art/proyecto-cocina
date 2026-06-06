This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Menesteres- Web App

Sitio web + panel de administración para el estudio de cocina Menesteres.

## Stack
Next.js 15(App Router) + TypeScript
Supabase (base de datos + auth)
Resend (emails transaccionales)
Vercel (deploy y hosting)
Tailwind CSS

## Variables de entorno requeridas

Crear un archivo  '.env.local' en la raiz (ver '.env.example'):
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROL_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
ADMIN_EMAIL= lautarobarba1@gmail.com
FROM_EMAIL= noreply@menesteres.ar

## Desarrollo local
```bash
npm install
npm run dev

Deploy (Vercel)

1. Conectar el repo a Vercel
2. Configurar todas las variables de entorno en el panel de Vercel 
3. Vercel hace deploy automático en cada push a main

Panel Admin 

URL: https://menesteres.ar/admin
Acceso: por magic link (se envía un mail con el link de ingreso)
Emails autorizados: configurados en lib/admin/config.ts

Base de datos 

Las migraciones están en supabase/migrations/. Se aplican en orden cronológico usando la CLI de Supabase o manualmente en el dashboard.
