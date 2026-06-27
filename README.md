This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Menesteres — Sistema de reservas y administración

Plataforma web para [Menesteres](https://menesteres.ar), estudio de cocina en 
Rafaela. Permite a clientes reservar clases y al estudio gestionar cupos, 
clases y comunicación por email, todo desde un panel de administración.

Desarrollado end-to-end (arquitectura, implementación, QA, deploy) como 
freelance bajo TARO.

## Funcionalidades

- Reserva de clases con gestión de cupos en tiempo real
- Panel de administración con autenticación por magic link
- Notificaciones transaccionales (confirmación, recordatorios, cancelación)
- Row Level Security en Supabase para separar datos públicos de admin

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, 
  Framer Motion
- **Backend:** Supabase (PostgreSQL + RLS + Magic Link auth)
- **Email transaccional:** Resend
- **Storage:** Vercel Blob
- **Infra:** Docker, deploy en Vercel

## Seguridad

Se realizó un audit de seguridad identificando y resolviendo (o documentando 
como pendiente):
- Rate limiting en endpoints públicos
- Sanitización de inputs en templates de email (XSS)
- Validación de CSV en exports
- Manejo de fallos silenciosos en envío de emails

[Esta sección sola hace más que cualquier otra cosa del README — mostrala]

## Demo

<img src="/galeria/panel1.png" alt="imagen del panel1">
<img src="/galeria/panel2.png" alt="imagen del panel2">
## Desarrollo local
npm install
npm run dev

Deploy (Vercel)
1. Conectar el repo a Vercel
2. Configurar todas las variables de entorno en el panel de Vercel 
3. Vercel hace deploy automático en cada push a main

## Base de datos
Las migraciones están en supabase/migrations/. Se aplican en orden cronológico usando la CLI de Supabase o manualmente en el dashboard.