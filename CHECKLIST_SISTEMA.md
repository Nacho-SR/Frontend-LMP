# Checklist del Sistema Frontend

Documento para repartir trabajo del frontend sin pisarse.

Actualizado tomando como referencia:

- `Backend-LMP/CHECKLIST_SISTEMA.md`
- `Backend-LMP/docs/API_FRONTEND.md`
- Guia del proyecto final: TaskFlow.

## Estado Actual

- Rama revisada: `develop`.
- Framework: Vue 3 + Vite + Pinia + Vue Router + TailwindCSS.
- Verificacion de build: `vite build` correcto.
- Estado Git al revisar: arbol limpio.
- Base URL esperada: `VITE_API_URL=http://localhost:3000/api`.

## Panorama General

Ya existen estas areas principales en frontend:

- Auth y sesion.
- Layout protegido.
- Equipos.
- Proyectos.
- Detalle de proyecto.
- Charts/tableros.
- Kanban.
- Stages/columnas.
- Tareas.
- Notificaciones.
- Perfil.
- Componentes UI reutilizables.

Paginas minimas de la guia:

- [x] Login.
- [x] Dashboard.
- [x] Proyectos.
- [x] Detalle de proyecto.
- [x] Tablero Kanban.
- [x] Tareas.
- [x] Notificaciones.
- [x] Perfil.

Pendientes transversales importantes:

- [ ] Probar flujo completo contra backend real.
- [ ] Corregir textos con encoding roto (`Ã`, `Â`, etc.).
- [ ] Conectar dashboard real con `GET /api/dashboard/summary`.
- [x] Integrar comentarios de tareas.
- [x] Ajustar notificaciones a timestamps ISO 8601.
- [ ] Completar filtros/query params documentados en `API_FRONTEND.md`.
- [ ] Documentar instalacion y uso del frontend en README.
- [ ] Preparar capturas o video corto para entrega.

---

## Bloque 1: Base, Configuracion y Calidad Visual

### Ya Tenemos

- Vite funcionando.
- Tailwind configurado.
- `.env.example` con `VITE_API_URL`.
- Estructura por carpetas:
  - `src/api`
  - `src/stores`
  - `src/views`
  - `src/components/ui`
  - `src/components/layout`
- Componentes UI base:
  - `BaseButton`
  - `BaseInput`
  - `BaseSelect`
  - `BaseTextarea`
  - `AlertMessage`
  - `LoadingState`
  - `EmptyState`
  - `StatusBadge`
  - `PriorityBadge`
  - `ConfirmDialog`
  - `PageHeader`
- Build de produccion pasa correctamente.

### Falta

- [ ] Corregir encoding roto en textos visibles.
- [ ] Revisar consistencia visual entre vistas.
- [ ] Eliminar assets del template Vite si ya no se usan.
- [ ] Revisar responsive en movil y tablet.
- [ ] Unificar idioma de UI: espanol completo.
- [ ] Evitar `console.error` en stores o moverlo a manejo visual controlado.
- [ ] Reducir `catch { /* ignore */ }` y mostrar errores utiles al usuario.

### Tareas Pequenas

- Persona A:
  - Corregir textos con caracteres rotos.
  - Revisar textos ingles/espanol en notificaciones.
- Persona B:
  - Revisar responsive de login, layout, projects, tasks y kanban.
  - Documentar problemas visuales encontrados.
- Persona C:
  - Limpiar assets no usados.
  - Revisar clases duplicadas o estilos inconsistentes.

---

## Bloque 2: Auth, Sesion y Perfil

### Ya Tenemos

- Login.
- Registro.
- Store de auth.
- Persistencia de `accessToken` y `refreshToken`.
- Inicializacion con `/auth/me`.
- Refresh token desde store.
- Logout.
- Rutas publicas y privadas.
- Redireccion a login cuando no hay sesion.
- Vista de perfil.
- Cambio de password desde perfil.

### Falta

- [ ] Probar login real contra backend.
- [ ] Probar register real contra backend.
- [ ] Probar refresh con access token expirado.
- [ ] Probar logout real y limpieza de sesion.
- [ ] Manejar 401 global en llamadas API posteriores al login.
- [ ] Mostrar feedback claro cuando la sesion expira.
- [ ] Confirmar que el frontend usa `role`, no `rol`.
- [ ] Mejorar validaciones visuales de password y confirmacion.

### Endpoints Relacionados

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `PATCH /api/auth/change-password`

### Tareas Pequenas

- Persona A:
  - Probar login/register/logout con backend real.
  - Registrar bugs de contrato si aparecen.
- Persona B:
  - Mejorar estados de error en login/register/perfil.
  - Revisar flujo de token expirado.

---

## Bloque 3: Layout Protegido y Navegacion

### Ya Tenemos

- `ProtectedLayout`.
- Sidebar/topbar.
- Rutas protegidas:
  - `/`
  - `/teams`
  - `/teams/:teamId`
  - `/projects`
  - `/projects/:projectId`
  - `/projects/:projectId/kanban/:chartId`
  - `/tasks`
  - `/notifications`
  - `/profile`
- Usuario actual visible en layout.

### Falta

- [ ] Confirmar rutas activas en sidebar.
- [ ] Agregar contador de notificaciones sin leer si backend lo entrega.
- [ ] Ocultar acciones o links segun rol si aplica.
- [ ] Mejorar navegacion movil.
- [ ] Revisar que refresh de navegador en rutas privadas conserve sesion.

### Tareas Pequenas

- Persona A:
  - Revisar navegacion desktop/mobile.
- Persona B:
  - Agregar badge de notificaciones pendientes.
- Persona C:
  - Revisar permisos visuales por rol global/equipo.

---

## Bloque 4: Equipos y Miembros

### Ya Tenemos

- Servicio de equipos.
- Store de equipos.
- Vista de equipos.
- Detalle de equipo.
- Crear equipo.
- Unirse a equipo.
- Listar equipos.
- Ver equipo.
- Editar equipo.
- Archivar equipo.
- Listar miembros.
- Agregar miembro.
- Quitar miembro.
- Cambiar rol de miembro.

### Falta

- [x] Integrar `PATCH /api/teams/:teamId`.
- [x] Integrar `DELETE /api/teams/:teamId` para archivar equipo.
- [x] Integrar `PATCH /api/teams/:teamId/members/:userId/role`.
- [x] Ocultar agregar/quitar miembros si el rol no permite.
- [ ] Manejar error de ultimo `OWNER`.
- [ ] Mejorar busqueda/seleccion de usuarios al agregar miembro.
- [ ] Probar permisos por roles de equipo:
  - `OWNER`
  - `MANAGER`
  - `MEMBER`
  - `CLIENT`

### Endpoints Relacionados

- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/:teamId`
- `PATCH /api/teams/:teamId`
- `DELETE /api/teams/:teamId`
- `POST /api/teams/:teamId/join`
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/members`
- `PATCH /api/teams/:teamId/members/:userId/role`
- `DELETE /api/teams/:teamId/members/:userId`

### Tareas Pequenas

- Persona A:
  - Agregar editar/archivar equipo.
- Persona B:
  - Agregar cambio de rol de miembro.
- Persona C:
  - Reemplazar input de `userId` por buscador/listado de usuarios.

---

## Bloque 5: Proyectos

### Ya Tenemos

- Servicio de proyectos.
- Store de proyectos.
- Vista de proyectos.
- Crear proyecto.
- Listar proyectos.
- Ver detalle de proyecto.
- Editar proyecto.
- Cambiar status.
- Eliminar/archivar proyecto.
- Mostrar resumen de tareas del proyecto si backend lo devuelve.
- Filtrar charts del proyecto.
- Crear, renombrar y archivar charts desde detalle de proyecto.

### Falta

- [ ] Usar filtros documentados en `GET /api/projects`:
  - `teamId`
  - `status`
  - `search`
  - `ownerId`
- [ ] Agregar UI de busqueda.
- [ ] Agregar filtro por equipo.
- [ ] Agregar filtro por status.
- [ ] Confirmar permisos visuales con `team_members.role`.
- [ ] Probar crear proyecto con rol insuficiente.
- [ ] Mejorar empty states cuando no hay equipos/proyectos.

### Endpoints Relacionados

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `PATCH /api/projects/:projectId/status`
- `DELETE /api/projects/:projectId`

### Tareas Pequenas

- Persona A:
  - Agregar filtros en listado de proyectos.
- Persona B:
  - Probar permisos y errores de proyecto.
- Persona C:
  - Mejorar detalle de proyecto y estados vacios.

---

## Bloque 6: Charts, Stages y Kanban

### Ya Tenemos

- Servicio de charts.
- Store de charts.
- Servicio de stages.
- Store de stages.
- Vista Kanban.
- Abrir tablero desde detalle de proyecto.
- Crear chart.
- Renombrar chart.
- Archivar chart.
- Cargar stages del chart.
- Crear stage.
- Renombrar stage.
- Eliminar stage.
- Reordenar stages por drag and drop.
- Mover tareas entre stages por drag and drop.
- Manejar limite WIP en movimiento de tareas.
- Crear tarea desde Kanban.
- Modal de detalle/edicion de tarea en Kanban.

### Falta

- [ ] Probar flujo completo contra backend real.
- [ ] Confirmar que chart recien creado genera stages default.
- [ ] Agregar accion manual para crear stages default si hiciera falta.
- [ ] Mejorar manejo de errores al mover tareas.
- [ ] Revisar permisos visuales para crear/editar/eliminar stages.
- [ ] Revisar responsive del Kanban en pantallas pequenas.
- [ ] Revisar accesibilidad basica de drag and drop.
- [ ] Corregir textos con encoding roto en Kanban.

### Endpoints Relacionados

- `GET /api/charts`
- `POST /api/charts`
- `GET /api/charts/:chartId`
- `PATCH /api/charts/:chartId`
- `DELETE /api/charts/:chartId`
- `GET /api/stages/chart/:chartId/team/:teamId`
- `POST /api/stages`
- `POST /api/stages/default`
- `PATCH /api/stages/:stageId`
- `DELETE /api/stages/:stageId`
- `PATCH /api/stages/chart/:chartId/team/:teamId/order`
- `POST /api/stages/tasks/move`

### Tareas Pequenas

- Persona A:
  - Probar Kanban con proyecto/chart real.
  - Probar movimiento entre stages.
- Persona B:
  - Pulir responsive y overflow horizontal.
- Persona C:
  - Mejorar errores visuales de Kanban.

---

## Bloque 7: Tareas

### Ya Tenemos

- Servicio de tareas.
- Store de tareas.
- Vista `/tasks`.
- Listado por equipo.
- Crear tarea.
- Eliminar tarea.
- Avanzar estado.
- Completar review.
- Rechazar review.
- Asignarse a tarea.
- Tomar revision.
- Badges de prioridad y status.
- Filtros visuales por status.
- Selector de equipo.
- Asociacion con proyecto.

### Falta

- [ ] Usar query params documentados:
  - `teamId`
  - `projectId`
  - `stageId`
  - `priority`
  - `status`
  - `assignedTo`
  - `search`
  - `limit`
  - `offset`
  - `sortBy`
  - `sortOrder`
- [ ] Agregar busqueda.
- [ ] Agregar filtro por prioridad.
- [ ] Agregar filtro por responsable.
- [ ] Agregar paginacion si el backend la requiere.
- [x] Integrar detalle de tarea independiente si se decide.
- [x] Agregar comentarios en detalle/modal de tarea.
- [ ] Mejorar manejo de errores, hoy hay varios `catch` silenciosos.
- [ ] Corregir textos con encoding roto.

### Endpoints Relacionados

- `GET /api/tasks/my-tasks`
- `GET /api/tasks/team/:teamId`
- `GET /api/tasks/team/:teamId/stage/:stageId`
- `GET /api/tasks/team/:teamId/priority/:priority`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/assign`
- `DELETE /api/tasks/:id`

### Tareas Pequenas

- Persona A:
  - Agregar filtros faltantes.
- Persona B:
  - Mejorar errores y loading states.
- Persona C:
  - Preparar componente de detalle de tarea reutilizable.

---

## Bloque 8: Comentarios

### Ya Tenemos

- Comentarios integrados en `TaskDetailView`.
- `fetchTaskComments`, `postTaskComment`, `deleteTaskComment` en `tasks.store.js`.
- Listar comentarios con autor y fecha.
- Crear comentario.
- Eliminar comentario propio (boton visible solo si `posterId === user.id`).

### Falta

- [ ] Crear `comments.service.js` como archivo separado (actualmente la logica esta en `tasks.store.js`).
- [x] Crear store de comentarios o composable local.
- [x] Integrar comentarios en modal/detalle de tarea.
- [x] Listar comentarios.
- [x] Crear comentario.
- [ ] Editar comentario propio.
- [x] Eliminar comentario propio.
- [x] Mostrar autor y fecha.
- [x] Manejar permisos (autor puede eliminar su comentario).

### Endpoints Relacionados

- `GET /api/tasks/:id/comments`
- `GET /api/tasks/:id/comments/:commentId`
- `POST /api/tasks/:id/comments`
- `PUT /api/tasks/:id/comments/:commentId`
- `PATCH /api/tasks/:id/comments/:commentId`
- `DELETE /api/tasks/:id/comments/:commentId`

### Tareas Pequenas

- Persona A:
  - Crear servicio y store de comentarios.
- Persona B:
  - Crear componente `TaskComments`.
- Persona C:
  - Integrar comentarios en Kanban y Tasks.

---

## Bloque 9: Notificaciones

### Ya Tenemos

- Servicio de notificaciones.
- Store de notificaciones.
- Vista de notificaciones.
- Listar notificaciones.
- Marcar todas como leidas.
- Marcar una como leida/no leida.
- Eliminar notificacion.

### Falta

- [x] Ajustar timestamp a ISO 8601; la vista actual usaba `createdAt._seconds`.
- [ ] Unificar textos a espanol.
- [ ] Mejorar nombres de metodos en servicio:
  - `deleteNotificationRequest`
  - `markNotificationReadRequest`
  - `markNotificationUnreadRequest`
- [ ] Mostrar contador de no leidas en layout.
- [ ] Manejar tipos de notificacion con icono/badge.
- [ ] Probar `GET /api/notifications/:notificationId`.
- [ ] Evitar recargar toda la lista cuando no sea necesario.

### Endpoints Relacionados

- `GET /api/notifications`
- `GET /api/notifications/:notificationId`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/:notificationId/unread`
- `DELETE /api/notifications/:notificationId`

### Tareas Pequenas

- Persona A:
  - Corregir fechas ISO y textos.
- Persona B:
  - Agregar contador de no leidas.
- Persona C:
  - Pulir diseno de lista de notificaciones.

---

## Bloque 10: Dashboard

### Ya Tenemos

- Vista Dashboard existe.
- Layout protegido carga dashboard.

### Falta Critico

- [ ] Crear `dashboard.service.js`.
- [ ] Crear `dashboard.store.js` o cargar summary directo en vista.
- [ ] Consumir `GET /api/dashboard/summary`.
- [ ] Mostrar:
  - equipos visibles
  - proyectos por status
  - tareas totales
  - tareas por status
  - tareas por prioridad
  - tareas vencidas
  - tareas asignadas al usuario
  - resumen por proyecto
- [ ] Agregar accesos rapidos:
  - crear equipo
  - crear proyecto
  - ver tareas
  - abrir notificaciones
- [ ] Manejar loading/error/empty.

### Endpoints Relacionados

- `GET /api/dashboard/summary`

### Tareas Pequenas

- Persona A:
  - Crear servicio/store de dashboard.
- Persona B:
  - Disenar cards de resumen.
- Persona C:
  - Integrar datos reales y estados vacios.

---

## Bloque 11: Usuarios, Admin, Permisos y Auditoria

### Ya Tenemos

- Servicio minimo `fetchUserList`.
- Se usa lista de usuarios para mostrar nombres/asignaciones.

### Falta

- [ ] Integrar busqueda de usuarios por username:
  - `GET /api/users/search?userName=<texto>`
- [ ] Usar busqueda de usuarios al agregar miembros/asignar tareas.
- [ ] Decidir si habra vistas admin.
- [ ] Si hay vistas admin:
  - usuarios
  - roles
  - permisos
  - auditoria
- [ ] Si no hay vistas admin, documentar que se prueba por API/Postman.

### Endpoints Relacionados

- `GET /api/users/search?userName=<texto>`
- `GET /api/users/list`
- `GET /api/audit`
- `GET /api/permissions`

### Tareas Pequenas

- Persona A:
  - Crear buscador de usuarios reutilizable.
- Persona B:
  - Integrarlo en miembros de equipo.
- Persona C:
  - Integrarlo en asignaciones de tareas.

---

## Bloque 12: QA, Documentacion y Entrega

### Ya Tenemos

- Build pasa.
- Estructura de frontend alineada a la guia.
- Checklist de frontend en este archivo.

### Falta

- [ ] README frontend real:
  - instalacion
  - variables
  - ejecucion local
  - backend requerido
  - usuario de prueba
- [ ] Pruebas manuales documentadas.
- [ ] Capturas o video corto.
- [ ] Checklist de navegacion por rutas.
- [ ] Probar flujo completo:
  - register
  - login
  - me
  - crear equipo
  - crear proyecto
  - crear chart
  - crear tarea
  - mover tarea
  - comentar tarea
  - revisar notificaciones
  - logout
- [ ] Probar refresh de navegador en cada ruta privada.
- [ ] Probar token invalido/expirado.
- [ ] Probar permisos por roles de equipo.
- [ ] Probar responsive.

### Tareas Pequenas

- Persona A:
  - Crear README frontend.
- Persona B:
  - Ejecutar y documentar pruebas manuales.
- Persona C:
  - Tomar capturas/video para entrega.

---

## Prioridad Recomendada

1. Corregir encoding roto y textos mixtos.
2. Conectar Dashboard con `/api/dashboard/summary`.
3. Integrar comentarios de tareas.
4. Ajustar notificaciones a timestamps ISO y contador de no leidas.
5. Completar filtros de proyectos y tareas.
6. Probar flujo completo con backend real.
7. Pulir responsive y permisos visuales.
8. Preparar README, pruebas manuales y capturas/video.

## Reparto Recomendado

- Persona 1:
  - Dashboard.
  - Notificaciones.
  - README/capturas.
- Persona 2:
  - Comentarios.
  - Detalle/modal de tarea.
  - Filtros de tareas.
- Persona 3:
  - Teams/proyectos.
  - Buscador de usuarios.
  - Permisos visuales por rol.

## Nota Para el Equipo

El frontend debe seguir el contrato de `docs/API_FRONTEND.md` como fuente principal. Si una vista necesita inventar datos, estructuras o reglas que no aparecen en ese documento, primero hay que ajustar el backend o documentar el contrato nuevo.
