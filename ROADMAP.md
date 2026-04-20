# ROADMAP - Bitbucket DataCenter Gist Manager

## 📋 Visión General

Construir una aplicación completa de gestión de gists para Bitbucket Data Center con:
- API REST robusta
- Sincronización automática con repositorio
- Interfaz web (próximamente)
- Métricas y monitoreo
- Pruebas unitarias e integración

---

## 🎯 Fases de Desarrollo

### Fase 1: Fundamentos (v0.1.0) ✅ EN PROGRESO

**Objetivo:** Establecer la base del proyecto con funcionalidad CRUD básica

- [x] Estructura de proyecto
- [x] Configuración de Docker
- [x] API con BUN
- [x] Integración con Bitbucket Data Center API
- [x] Git Manager (clonar, pull, push)
- [x] Gist Manager (CRUD)
- [x] Endpoints RESTful básicos
- [ ] Tests unitarios
- [ ] Documentación API (OpenAPI/Swagger)

**Tickets:** Ver Issues #1-#8

---

### Fase 2: Seguridad y Autenticación (v0.2.0)

**Objetivo:** Implementar seguridad robusta

- [ ] Autenticación con Bitbucket OAuth2
- [ ] Autorización basada en roles (RBAC)
- [ ] Validación de permisos por gist
- [ ] Rate limiting
- [ ] Validación de entrada (sanitización)
- [ ] CORS configurado
- [ ] Encriptación de datos sensibles

**Tickets:** Ver Issues #9-#15

---

### Fase 3: Interfaz Web (v0.3.0)

**Objetivo:** Crear UI moderna para gestionar gists

- [ ] Frontend con React/Vue/Svelte (TBD)
- [ ] Listar gists con paginación
- [ ] Editor de código con syntax highlighting
- [ ] Búsqueda y filtros
- [ ] Vista previa de cambios
- [ ] Historial de versiones
- [ ] Compartir gists (links público/privado)
- [ ] Responsive design

**Tickets:** Ver Issues #16-#25

---

### Fase 4: Características Avanzadas (v0.4.0)

**Objetivo:** Funcionalidades que diferencian la app

- [ ] Sincronización bidireccional en tiempo real
- [ ] Branching de gists (versiones)
- [ ] Colaboración en tiempo real (WebSockets)
- [ ] Comentarios en gists
- [ ] Etiquetas y categorías
- [ ] Búsqueda fulltext
- [ ] Exportar gists (ZIP, PDF, etc.)
- [ ] Integración con CI/CD (ejecutar gists)

**Tickets:** Ver Issues #26-#35

---

### Fase 5: DevOps y Escalabilidad (v0.5.0)

**Objetivo:** Preparar para producción

- [ ] Kubernetes manifests
- [ ] CI/CD con GitHub Actions
- [ ] Monitoring y alertas (Prometheus, Grafana)
- [ ] Logging centralizado (ELK Stack)
- [ ] Backup automático
- [ ] Database (PostgreSQL/MongoDB)
- [ ] Caché (Redis)
- [ ] Load balancing

**Tickets:** Ver Issues #36-#45

---

### Fase 6: Optimización y Pulido (v1.0.0)

**Objetivo:** Release de versión estable

- [ ] Performance tuning
- [ ] Pruebas e2e completas
- [ ] Documentación final
- [ ] Security audit
- [ ] Publicar en registros (Docker Hub)
- [ ] Ejemplos de deployment

**Tickets:** Ver Issues #46-#50

---

## 📊 Tabla de Progreso

| Fase | Estado | Progreso | ETA |
|------|--------|----------|-----|
| 1: Fundamentos | 🟡 En Progreso | 60% | Semana de abril 21 |
| 2: Seguridad | ⚪ No iniciada | 0% | Mayo |
| 3: UI Web | ⚪ No iniciada | 0% | Junio |
| 4: Features Avanzadas | ⚪ No iniciada | 0% | Julio |
| 5: DevOps | ⚪ No iniciada | 0% | Agosto |
| 6: Optimización | ⚪ No iniciada | 0% | Septiembre |

---

## 🎯 Objetivos por Sprint

### Sprint 1 (Semana del 21 de abril)
- [ ] Finalizar tests unitarios
- [ ] Documentar API con Swagger
- [ ] Crear docker-compose.yml optimizado
- [ ] Guía de inicio rápido

### Sprint 2 (Semana del 28 de abril)
- [ ] Inicio de autenticación OAuth2
- [ ] Rate limiting middleware
- [ ] Validación de entrada robusta

### Sprint 3 (Mayo)
- [ ] Prototipo de UI
- [ ] Selector de tecnología frontend

---

## 🚀 Tecnologías Stack

### Backend
- **Runtime:** Bun 1.0+
- **Framework:** Bun native (no Express)
- **Base de datos:** PostgreSQL 15+ (fase 5)
- **Cache:** Redis (fase 5)
- **API Client:** bitbucket-datacenter-api-client

### Frontend (Planeado)
- **Framework:** A definir (React/Vue/Svelte)
- **UI Library:** Tailwind CSS / Material UI
- **Code Editor:** Monaco Editor / CodeMirror
- **Build Tool:** Vite

### DevOps
- **Containerización:** Docker
- **Orquestación:** Kubernetes (fase 5)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack

---

## 📝 Notas Importantes

1. **Sincronización de Repositorio**
   - Los gists se almacenan en una estructura de carpetas (`gists/ID/`)
   - Cada gist tiene metadata en `metadata.json`
   - Los cambios se commits y pushean automáticamente

2. **Convención de Commits**
   - Usar formato: `type(scope): description`
   - Ejemplo: `feat(gist): add collaborative editing`

3. **Versionamiento**
   - Semantic Versioning (MAJOR.MINOR.PATCH)
   - Tags en Git para releases

---

## 🔗 Links Útiles

- [Documentación de Bitbucket Server](https://confluence.atlassian.com/bitbucketserver)
- [Bun Documentation](https://bun.sh/docs)
- [simple-git Documentation](https://github.com/steelbrain/simple-git)
- [GitHub Issues](../../issues)

---

## 📞 Contacto

Para preguntas o sugerencias sobre el roadmap, abre un discussion o issue.

**Última actualización:** 19 de abril de 2026
