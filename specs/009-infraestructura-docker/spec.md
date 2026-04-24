# Feature Specification: Infraestructura Docker

**Feature Branch**: `009-infraestructura-docker`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Feature: Infraestructura Docker

Objetivo:
Despliegue local reproducible.

Requerimientos:

- docker-compose
- nginx proxy
- frontend
- backend

Extras:
- Configuración ventas.local
- Documentar hosts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Levantar el sistema completo localmente (Priority: P1)

Como operador o responsable tecnico del entorno local, necesito iniciar la aplicacion completa con un procedimiento reproducible para usar ventas sin depender de configuraciones manuales inconsistentes.

**Why this priority**: Es el valor central de la feature: disponer de un despliegue local repetible que incluya la experiencia web y los servicios necesarios.

**Independent Test**: Puede probarse en una maquina limpia con los requisitos base instalados, siguiendo la documentacion de despliegue y verificando que la aplicacion queda disponible localmente.

**Acceptance Scenarios**:

1. **Given** una maquina local con el entorno de contenedores disponible, **When** el usuario ejecuta el procedimiento documentado de despliegue, **Then** el frontend, backend y proxy quedan iniciados como una unidad operativa.
2. **Given** que el despliegue local esta iniciado, **When** el usuario abre la aplicacion desde el navegador, **Then** accede a la interfaz de ventas sin configurar manualmente puertos de cada componente.
3. **Given** que el despliegue fue detenido, **When** el usuario vuelve a iniciarlo con el mismo procedimiento, **Then** obtiene el mismo comportamiento esperado sin pasos adicionales no documentados.

---

### User Story 2 - Acceder mediante ventas.local (Priority: P2)

Como usuario del entorno local, necesito acceder a la aplicacion mediante el nombre `ventas.local` para evitar recordar direcciones tecnicas o puertos durante la operacion diaria.

**Why this priority**: Un nombre local estable reduce friccion operativa y evita errores al alternar entre frontend y backend.

**Independent Test**: Puede probarse configurando el host local segun la documentacion y confirmando que `ventas.local` abre la aplicacion correcta.

**Acceptance Scenarios**:

1. **Given** que el despliegue esta activo y el host local fue configurado, **When** el usuario visita `ventas.local`, **Then** ve la aplicacion frontend servida por el proxy local.
2. **Given** que el frontend necesita comunicarse con el backend, **When** el usuario realiza una operacion que consulta datos, **Then** la solicitud se resuelve dentro del mismo entorno local sin exponer rutas tecnicas al usuario.
3. **Given** que `ventas.local` no fue configurado en el sistema operativo, **When** el usuario sigue la guia de hosts, **Then** puede completar la configuracion sin investigar pasos externos.

---

### User Story 3 - Diagnosticar el despliegue local (Priority: P3)

Como responsable tecnico, necesito instrucciones claras para verificar el estado de los componentes y resolver fallas comunes del despliegue local.

**Why this priority**: La reproducibilidad no solo depende de iniciar el sistema; tambien requiere comprobaciones y recuperacion basica ante errores comunes.

**Independent Test**: Puede probarse provocando o simulando condiciones comunes, como host no configurado o servicio detenido, y verificando que la documentacion permite identificar el problema.

**Acceptance Scenarios**:

1. **Given** que un componente no esta disponible, **When** el responsable tecnico consulta la documentacion, **Then** encuentra una forma clara de revisar el estado del frontend, backend y proxy.
2. **Given** que `ventas.local` no resuelve en el navegador, **When** se consulta la seccion de hosts, **Then** se identifica que entrada debe existir y como validarla.
3. **Given** que el despliegue local ya no se necesita, **When** el usuario sigue la documentacion de apagado, **Then** los componentes se detienen de forma ordenada.

### Edge Cases

- El host `ventas.local` no esta configurado o apunta a una direccion incorrecta.
- El puerto local requerido por el proxy ya esta ocupado por otro servicio.
- El backend esta detenido o aun no esta listo cuando el frontend empieza a recibir trafico.
- El frontend esta disponible pero no puede completar operaciones por fallo de comunicacion con backend.
- El usuario reinicia el despliegue despues de cambios de configuracion local.
- La maquina local esta sin conexion a internet durante la operacion diaria, despues de haber preparado las dependencias necesarias.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer un procedimiento unico y documentado para iniciar el despliegue local completo.
- **FR-002**: El despliegue local MUST incluir los componentes frontend, backend y proxy local necesarios para operar la aplicacion.
- **FR-003**: El proxy local MUST ofrecer un punto de entrada unico para usuarios del entorno local.
- **FR-004**: El punto de entrada local MUST soportar el nombre `ventas.local` cuando el host local este configurado segun la documentacion.
- **FR-005**: La documentacion MUST indicar exactamente que entrada de hosts debe agregarse para resolver `ventas.local`.
- **FR-006**: La documentacion MUST cubrir instrucciones para iniciar, detener, reiniciar y verificar el estado del despliegue local.
- **FR-007**: El despliegue local MUST enrutar las solicitudes de la interfaz hacia el backend sin requerir que el usuario final conozca rutas o puertos internos.
- **FR-008**: El despliegue local MUST mantener la aplicacion usable en LAN/local sin dependencia cloud para la operacion normal.
- **FR-009**: El sistema MUST exponer una forma clara de comprobar que frontend, backend y proxy estan disponibles.
- **FR-010**: El despliegue local MUST manejar reinicios de componentes de forma predecible, conservando el mismo punto de acceso para el usuario.
- **FR-011**: La documentacion MUST incluir pasos de preparacion y solucion basica de problemas para host no configurado, puerto ocupado y servicio no disponible.
- **FR-012**: La configuracion de despliegue MUST ser versionada junto al proyecto para que otra maquina local pueda reproducir el entorno con los mismos pasos.
- **FR-013**: El despliegue local MUST preservar las reglas de negocio existentes del backend y no introducir rutas alternativas que modifiquen datos por fuera de la aplicacion.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a despliegue local reproducible con frontend, backend, proxy y dominio local. Orquestacion multiambiente, balanceo avanzado, certificados publicos y monitoreo externo quedan fuera.
- **CA-002 Domain Model**: No se agregan entidades de negocio. Las entidades existentes como `Venta`, `Cliente` y `Pago` deben seguir siendo servidas por el backend actual.
- **CA-003 Backend Rules**: Todas las reglas de ventas, clientes, pagos, reportes y dashboard permanecen en el backend; el proxy solo facilita acceso local y no redefine comportamiento de negocio.
- **CA-004 Persistence**: La persistencia local existente debe seguir disponible para el backend y conservar compatibilidad con la evolucion relacional PostgreSQL-compatible definida por el proyecto.
- **CA-005 Security**: El despliegue queda orientado a uso local/LAN y no publica la aplicacion en internet. No introduce nuevas operaciones administrativas ni cambios de autenticacion.
- **CA-006 Modularity**: El impacto se concentra en infraestructura local y documentacion; los modulos funcionales Ventas, Clientes, Reportes, Administracion y Analisis no cambian su responsabilidad.
- **CA-007 UX Productivity**: El usuario accede por un nombre local estable y un unico punto de entrada, reduciendo configuracion manual y errores por puertos.
- **CA-008 AI Decoupling**: La feature no modifica ni depende de `/api/analisis`; cualquier capacidad de analisis existente queda aislada.
- **CA-009 Export Compatibility**: Reportes y exportaciones existentes deben conservar su comportamiento; el despliegue no cambia formatos formales o informales.
- **CA-010 Deploy Local-First**: La feature implementa el principio local-first mediante un despliegue reproducible, operable en LAN/offline-capable y preparado para Docker Compose.
- **CA-011 Traceability**: La configuracion versionada y la documentacion deben permitir rastrear que componentes, puertos publicos locales y entrada de hosts forman parte del despliegue.
- **CA-012 Phase Control**: Esta fase cubre infraestructura Docker local. Automatizacion CI/CD, despliegue cloud, TLS publico, backups automatizados y observabilidad avanzada quedan fuera de alcance.

### Key Entities *(include if feature involves data)*

- **Despliegue Local**: Conjunto reproducible de componentes necesarios para operar la aplicacion en una maquina local o LAN.
- **Componente de Aplicacion**: Parte ejecutable del sistema dentro del despliegue local: frontend, backend o proxy.
- **Host Local**: Entrada del sistema operativo que resuelve `ventas.local` hacia la maquina local.
- **Punto de Entrada**: Direccion unica usada por el usuario para abrir la aplicacion sin conocer detalles internos de componentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona tecnica puede iniciar el despliegue local completo desde una copia del proyecto en menos de 15 minutos siguiendo solo la documentacion del repositorio.
- **SC-002**: El 100% de los componentes requeridos para operar localmente queda disponible con un unico procedimiento de inicio.
- **SC-003**: Usuarios locales pueden abrir la aplicacion mediante `ventas.local` en menos de 30 segundos despues de configurar hosts.
- **SC-004**: La documentacion permite verificar el estado de frontend, backend y proxy con pasos explicitos y sin consultar fuentes externas.
- **SC-005**: El despliegue local puede detenerse e iniciarse nuevamente al menos 3 veces consecutivas manteniendo el mismo punto de acceso y comportamiento funcional.
- **SC-006**: El 100% de las operaciones funcionales existentes sigue pasando por el backend como fuente de verdad durante el despliegue local.

## Assumptions

- El usuario objetivo del despliegue es una persona tecnica u operador avanzado con permisos para editar el archivo hosts de su sistema operativo.
- El entorno local tendra disponible una plataforma de contenedores compatible antes de iniciar el procedimiento.
- `ventas.local` resolvera a la maquina local, normalmente `127.0.0.1`, salvo que la documentacion indique una direccion LAN especifica.
- La primera version prioriza uso local o LAN interna y no exposicion publica en internet.
- Las dependencias necesarias pueden prepararse con conectividad inicial; la operacion diaria debe funcionar sin servicios cloud.
- La configuracion existente de frontend y backend puede adaptarse al punto de entrada local sin cambiar reglas de negocio.
