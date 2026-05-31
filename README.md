# Frontend-LMP — TaskFlow

Frontend en Vue 3 + Vite para TaskFlow, proyecto final de Lenguajes Modernos de Programacion.

## Stack

- Vue 3 + Vite
- Pinia (manejo de estado)
- Vue Router
- Tailwind CSS
- Axios

## Requisitos

- Node.js >= 18
- npm
- Backend ([Backend-LMP](https://github.com/CSGLMZBA/Backend-LMP)) corriendo en `http://localhost:3000/api`

## Instalacion

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd Frontend-LMP
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo de variables de entorno tomando como base `.env.example`:

```bash
cp .env.example .env
```

4. Completar las variables en `.env`.

5. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Aplicacion disponible en `http://localhost:5173`.

## Scripts

| Comando | Descripcion |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de produccion |
| `npm run preview` | Previsualiza el build de produccion |

## Variables de Entorno

| Variable | Descripcion |
|---|---|
| `VITE_API_URL` | URL base del backend (default: `http://localhost:3000/api`) |

## Vistas

| Ruta | Vista | Descripcion |
|---|---|---|
| `/login` | LoginView | Inicio de sesion |
| `/register` | RegisterView | Registro de usuario |
| `/` | DashboardView | Resumen general |
| `/teams` | TeamsView | Lista de equipos |
| `/teams/:teamId` | TeamDetailView | Detalle de un equipo |
| `/projects` | ProjectsView | Lista de proyectos |
| `/projects/:projectId` | ProjectDetailView | Detalle de un proyecto |
| `/projects/:projectId/kanban/:chartId` | KanbanView | Tablero Kanban de un proyecto |
| `/tasks` | TasksView | Lista de tareas |
| `/tasks/:taskId` | TaskDetailView | Detalle de una tarea |
| `/notifications` | NotificationsView | Notificaciones del usuario |
| `/profile` | ProfileView | Perfil del usuario |

## Exponer en red local

> El backend no esta preparado para recibir peticiones desde otras maquinas en la red.

```bash
npm run dev -- --host
```
