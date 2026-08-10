# ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE

## Sistema Web de Invitación y Gestión de Asistencia
### “Mis 15 – Sol Rabozzi”

**Versión:** 1.0  
**Fecha:** 09/08/2026  
**Evento:** 23/01/2027  
**Estado del documento:** Borrador inicial

---

# 1. Introducción

## 1.1 Propósito

El propósito de este documento es especificar los requerimientos del sistema web **“Mis 15 – Sol Rabozzi”**.

El sistema tendrá como finalidad proporcionar una invitación digital para los invitados al cumpleaños de 15 de Sol Rabozzi, permitiendo consultar información relacionada con el evento, confirmar asistencia, informar los asistentes asociados a una invitación, consultar el importe correspondiente, informar un pago mediante transferencia bancaria y adjuntar el comprobante correspondiente.

Adicionalmente, el sistema proporcionará un panel privado de administración desde el cual los responsables del evento podrán consultar las confirmaciones recibidas, controlar pagos, verificar comprobantes y obtener información consolidada de los asistentes.

Este documento servirá como base para las actividades posteriores de diseño, desarrollo, pruebas y validación del sistema.

## 1.2 Audiencia

El documento está dirigido a:

- Responsables de la organización del evento.
- Desarrolladores.
- Diseñadores de interfaz.
- Responsables de pruebas.
- Administradores del sistema.
- Otros stakeholders involucrados en el proyecto.

## 1.3 Alcance

El producto será una aplicación web responsive compuesta por dos áreas principales:

**Área pública**

Permitirá:

- Visualizar la invitación.
- Consultar información del evento.
- Consultar ubicación.
- Consultar fecha y horarios.
- Consultar información adicional.
- Consultar el valor vigente de la tarjeta.
- Confirmar asistencia.
- Registrar los integrantes de una invitación.
- Seleccionar la modalidad de pago.
- Consultar datos para realizar una transferencia.
- Adjuntar un comprobante.
- Recibir una confirmación del registro realizado.

**Área privada**

Permitirá a los administradores:

- Autenticarse.
- Consultar invitaciones.
- Consultar asistentes.
- Consultar estados de asistencia.
- Consultar estados de pago.
- Consultar comprobantes.
- Verificar pagos.
- Consultar indicadores generales.
- Exportar información.

## 1.4 Funcionalidades futuras

Las siguientes funcionalidades se consideran posibles ampliaciones y no forman parte obligatoria de la primera versión:

- Asignación de mesas.
- Código QR individual para ingreso al evento.
- Recordatorios automáticos por WhatsApp.
- Confirmaciones automáticas por WhatsApp.
- Galería de fotografías posterior al evento.
- Administración avanzada de invitaciones familiares.

Su incorporación deberá gestionarse como una modificación del alcance.

## 1.5 Definiciones

**Invitación:** registro utilizado para identificar una confirmación individual o grupal.

**Invitado:** persona responsable de completar la confirmación.

**Asistente:** cada persona registrada como participante del evento.

**Administrador:** usuario autorizado para ingresar al panel privado.

**Comprobante:** archivo presentado por un invitado como evidencia de una transferencia.

**RSVP:** confirmación de asistencia al evento.

**Pago pendiente:** estado que indica que existe una confirmación sin pago verificado.

**Pago a verificar:** estado que indica que existe un comprobante recibido pendiente de revisión.

**Pago verificado:** estado que indica que el administrador validó el pago correspondiente.

---

# 2. Visión del producto

## 2.1 Visión

Para los invitados al cumpleaños de 15 de Sol Rabozzi que necesitan consultar la invitación y confirmar su asistencia, **Mis 15 – Sol Rabozzi** será una aplicación web que centralizará la información del evento, la confirmación de asistencia y el registro de pagos.

Para los organizadores, el sistema permitirá disponer de información actualizada sobre asistentes, pagos y comprobantes desde un panel administrativo privado.

## 2.2 Objetivos

Los principales objetivos son:

- Centralizar la información del evento.
- Simplificar la confirmación de asistencia.
- Registrar individualmente las personas que asistirán.
- Facilitar el cálculo del importe correspondiente.
- Facilitar la comunicación de los datos de transferencia.
- Centralizar los comprobantes recibidos.
- Identificar pagos pendientes.
- Identificar pagos pendientes de verificación.
- Mantener una lista actualizada de asistentes.
- Facilitar la preparación de la lista definitiva para el salón.

## 2.3 Fecha del evento

El evento se realizará el:

**23 de enero de 2027.**

## 2.4 Contexto

El sistema interactuará principalmente con:

- Invitados.
- Organizadores.
- Administradores.
- Servicio de almacenamiento de comprobantes.
- Servicio de mapas.
- Base de datos del sistema.

En versiones futuras podrá interactuar con:

- Servicios de WhatsApp.
- Sistemas de generación o validación de códigos QR.

---

# 3. Stakeholders

## STK-01 – Sol Rabozzi

Persona homenajeada en el evento.

Interés principal:

Que la experiencia visual de la invitación represente adecuadamente la estética de sus 15 años.

## STK-02 – Organizadores del evento

Responsables de organizar el cumpleaños.

Intereses principales:

- Conocer quién asistirá.
- Conocer cuántas personas asistirán.
- Conocer quién pagó.
- Identificar pagos pendientes.
- Consultar comprobantes.
- Obtener la lista definitiva de asistentes.

## STK-03 – Invitados

Personas que reciben la invitación.

Intereses principales:

- Consultar información del evento.
- Confirmar fácilmente su asistencia.
- Conocer el importe correspondiente.
- Obtener los datos para realizar el pago.
- Adjuntar el comprobante.
- Saber si su registro fue recibido correctamente.

## STK-04 – Administrador

Persona autorizada para gestionar el sistema.

Intereses principales:

- Consultar confirmaciones.
- Consultar pagos.
- Verificar comprobantes.
- Actualizar estados.
- Exportar información.

---

# 4. Actores

## ACT-01 – Invitado

Usuario que accede al área pública de la aplicación.

## ACT-02 – Administrador

Usuario autorizado para acceder al panel privado.

## ACT-03 – Servicio de mapas

Sistema externo utilizado para mostrar la ubicación del evento.

## ACT-04 – Servicio de almacenamiento

Servicio utilizado para almacenar los comprobantes presentados por los invitados.

---

# 5. Requerimientos funcionales

## 5.1 Invitación

### RF-001 – Visualización de la portada

El sistema deberá mostrar una portada correspondiente a los 15 años de Sol Rabozzi.

**Prioridad:** Alta.

### RF-002 – Fecha del evento

El sistema deberá mostrar la fecha 23 de enero de 2027.

**Prioridad:** Alta.

### RF-003 – Fotografía principal

El sistema deberá mostrar una fotografía principal de Sol.

**Prioridad:** Alta.

### RF-004 – Carrusel de fotografías

El sistema podrá mostrar un carrusel de fotografías de Sol.

**Prioridad:** Media.

### RF-005 – Cuenta regresiva

El sistema deberá mostrar el tiempo restante hasta el inicio del evento.

**Prioridad:** Media.

### RF-006 – Mensaje de bienvenida

El sistema deberá mostrar un mensaje de bienvenida definido por los organizadores.

**Prioridad:** Alta.

---

# 6. Información del evento

### RF-007 – Nombre del salón

El sistema deberá mostrar el nombre del salón donde se realizará el evento.

**Prioridad:** Alta.

### RF-008 – Dirección

El sistema deberá mostrar la dirección del salón.

**Prioridad:** Alta.

### RF-009 – Cómo llegar

El sistema deberá permitir al invitado abrir la ubicación del salón mediante un servicio de mapas.

**Prioridad:** Alta.

### RF-010 – Horarios

El sistema deberá mostrar el horario de inicio del evento.

**Prioridad:** Alta.

### RF-011 – Horario de finalización

El sistema deberá mostrar el horario de finalización del evento cuando este haya sido definido.

**Prioridad:** Media.

### RF-012 – Información adicional

El sistema deberá mostrar la información adicional definida por los organizadores.

**Prioridad:** Alta.

La información podrá incluir:

- Disponibilidad de estacionamiento.
- Recomendaciones para estacionar.
- Requisitos de identificación.
- Código de vestimenta.
- Otras recomendaciones.

---

# 7. Valor de la tarjeta

### RF-013 – Precio unitario

El sistema deberá mostrar el valor vigente de la tarjeta por persona.

**Prioridad:** Alta.

### RF-014 – Vigencia del precio

El sistema deberá mostrar la fecha hasta la cual se mantiene vigente el valor informado cuando exista una fecha límite.

**Prioridad:** Alta.

### RF-015 – Condiciones de precio

El sistema deberá informar las condiciones aplicables al valor de la tarjeta.

**Prioridad:** Alta.

---

# 8. Confirmación de asistencia

### RF-016 – Modalidades de confirmación

El sistema deberá permitir seleccionar una modalidad de confirmación.

Las modalidades serán:

- Confirmar asistencia y pagar ahora.
- Confirmar asistencia y pagar después.

**Prioridad:** Alta.

### RF-017 – Nombre

El sistema deberá solicitar el nombre del invitado responsable de la confirmación.

**Prioridad:** Alta.

### RF-018 – Apellido

El sistema deberá solicitar el apellido del invitado responsable de la confirmación.

**Prioridad:** Alta.

### RF-019 – Teléfono

El sistema deberá solicitar un número de teléfono o WhatsApp.

**Prioridad:** Alta.

### RF-020 – Cantidad de asistentes

El sistema deberá permitir indicar la cantidad de personas que asistirán.

**Prioridad:** Alta.

### RF-021 – Datos de los asistentes

El sistema deberá solicitar el nombre completo de cada asistente informado.

**Prioridad:** Alta.

### RF-022 – Campos dinámicos

Cuando el invitado modifique la cantidad de asistentes, el sistema deberá ajustar automáticamente la cantidad de campos destinados a registrar asistentes.

**Prioridad:** Alta.

### RF-023 – Observaciones

El sistema deberá permitir ingresar observaciones asociadas a la confirmación.

**Prioridad:** Media.

---

# 9. Cálculo del importe

### RF-024 – Visualización del precio

El sistema deberá mostrar el precio unitario aplicable a la confirmación.

**Prioridad:** Alta.

### RF-025 – Cálculo del total

El sistema deberá calcular el importe total correspondiente a la confirmación.

**Prioridad:** Alta.

### RF-026 – Actualización del total

Cuando cambie la cantidad de asistentes, el sistema deberá actualizar automáticamente el importe total.

**Prioridad:** Alta.

---

# 10. Pago inmediato

### RF-027 – Datos de transferencia

Cuando el invitado seleccione “Confirmar y pagar ahora”, el sistema deberá mostrar los datos necesarios para realizar la transferencia.

**Prioridad:** Alta.

### RF-028 – Alias

El sistema deberá mostrar el alias bancario definido por los organizadores.

**Prioridad:** Alta.

### RF-029 – CBU

El sistema deberá mostrar el CBU definido por los organizadores.

**Prioridad:** Alta.

### RF-030 – Titular

El sistema deberá mostrar el nombre del titular de la cuenta.

**Prioridad:** Alta.

### RF-031 – Copiar alias

El sistema deberá permitir copiar el alias bancario al portapapeles.

**Prioridad:** Alta.

---

# 11. Comprobante

### RF-032 – Adjuntar comprobante

El sistema deberá permitir adjuntar un comprobante de transferencia.

**Prioridad:** Alta.

### RF-033 – Formatos admitidos

El sistema deberá aceptar comprobantes en formato JPG, PNG o PDF.

**Prioridad:** Alta.

### RF-034 – Asociación del comprobante

El sistema deberá asociar el comprobante recibido con la confirmación correspondiente.

**Prioridad:** Alta.

### RF-035 – Registro de comprobante enviado

Cuando se reciba correctamente un comprobante, el sistema deberá registrar el pago como pendiente de verificación.

**Prioridad:** Alta.

---

# 12. Confirmación con pago posterior

### RF-036 – Confirmación sin comprobante

Cuando el invitado seleccione “Confirmar asistencia – pagar después”, el sistema deberá permitir completar la confirmación sin adjuntar un comprobante.

**Prioridad:** Alta.

### RF-037 – Estado pendiente

Cuando una confirmación sea registrada sin comprobante, el sistema deberá registrar el pago como pendiente.

**Prioridad:** Alta.

---

# 13. Mensajes de resultado

### RF-038 – Confirmación con comprobante

Cuando una confirmación con comprobante sea registrada correctamente, el sistema deberá informar que el registro fue recibido.

**Prioridad:** Alta.

Mensaje sugerido:

“¡Gracias! Recibimos tu confirmación para los 15 de Sol. Cuando verifiquemos el pago tu asistencia quedará confirmada definitivamente.”

### RF-039 – Confirmación sin pago

Cuando una confirmación sin pago sea registrada correctamente, el sistema deberá informar que el lugar fue registrado con pago pendiente.

**Prioridad:** Alta.

Mensaje sugerido:

“¡Gracias por confirmar! Reservamos tu lugar para los 15 de Sol. Tu pago se encuentra pendiente.”

---

# 14. Panel administrativo

### RF-040 – Acceso privado

El sistema deberá restringir el acceso al panel administrativo a usuarios autorizados.

**Prioridad:** Alta.

### RF-041 – Autenticación

El sistema deberá solicitar credenciales antes de permitir el acceso al panel administrativo.

**Prioridad:** Alta.

### RF-042 – Listado de confirmaciones

El sistema deberá permitir consultar las confirmaciones registradas.

**Prioridad:** Alta.

### RF-043 – Información de confirmación

Para cada confirmación, el sistema deberá mostrar como mínimo:

- Invitado responsable.
- Teléfono.
- Cantidad de personas.
- Importe total.
- Estado de asistencia.
- Estado del pago.
- Disponibilidad del comprobante.

**Prioridad:** Alta.

### RF-044 – Consulta de asistentes

El sistema deberá permitir consultar los nombres de los asistentes asociados a una confirmación.

**Prioridad:** Alta.

### RF-045 – Visualización del comprobante

El sistema deberá permitir al administrador consultar el comprobante asociado a una confirmación.

**Prioridad:** Alta.

### RF-046 – Verificación de pago

El sistema deberá permitir al administrador registrar un pago como verificado.

**Prioridad:** Alta.

### RF-047 – Actualización del estado

Cuando el administrador verifique un pago, el sistema deberá actualizar el estado de pago correspondiente.

**Prioridad:** Alta.

---

# 15. Estados

El sistema contemplará como mínimo los siguientes estados del proceso:

1. Invitación enviada.
2. Confirmó asistencia.
3. Pago pendiente.
4. Comprobante enviado.
5. Pago verificado.
6. Confirmado.

### RF-048 – Estado de asistencia

El sistema deberá almacenar el estado actual de la asistencia.

### RF-049 – Estado de pago

El sistema deberá almacenar el estado actual del pago.

### RF-050 – Modificación administrativa

El sistema deberá permitir al administrador modificar los estados autorizados.

---

# 16. Indicadores administrativos

### RF-051 – Invitaciones confirmadas

El sistema deberá mostrar la cantidad de invitaciones con asistencia confirmada.

### RF-052 – Personas totales

El sistema deberá mostrar la cantidad total de asistentes registrados.

### RF-053 – Pagos verificados

El sistema deberá mostrar la cantidad de confirmaciones con pago verificado.

### RF-054 – Pagos pendientes

El sistema deberá mostrar la cantidad de confirmaciones con pago pendiente.

### RF-055 – Recaudación

El sistema deberá mostrar el importe total correspondiente a pagos verificados.

### RF-056 – Importe pendiente

El sistema deberá mostrar el importe total pendiente de cobro.

---

# 17. Exportación

### RF-057 – Exportar CSV

El sistema deberá permitir al administrador exportar la información de asistentes en formato CSV.

**Prioridad:** Alta.

### RF-058 – Exportar Excel

El sistema debería permitir al administrador exportar la información de asistentes a un formato compatible con Microsoft Excel.

**Prioridad:** Media.

---

# 18. Información adicional de asistentes

### RF-059 – Restricciones alimentarias

El sistema debería permitir registrar restricciones alimentarias de cada asistente.

**Prioridad:** Media.

Entre otras:

- Celiaquía.
- Vegetarianismo.
- Veganismo.
- Alergias alimentarias.
- Otras restricciones.

### RF-060 – Tipo de asistente

El sistema debería permitir clasificar a un asistente como adulto o menor.

**Prioridad:** Media.

### RF-061 – Mesa

El sistema podrá permitir asignar una mesa a cada asistente.

**Prioridad:** Baja / versión futura.

---

# 19. Requerimientos no funcionales

## RNF-001 – Diseño responsive

El sistema deberá adaptar su interfaz a dispositivos móviles, tablets y computadoras de escritorio.

## RNF-002 – Usabilidad

El proceso de confirmación deberá presentar instrucciones comprensibles para un usuario sin conocimientos técnicos.

## RNF-003 – Identidad visual

El área pública deberá utilizar una estética correspondiente a una invitación de cumpleaños de 15.

## RNF-004 – Seguridad administrativa

El sistema deberá impedir el acceso al panel administrativo a usuarios no autenticados.

## RNF-005 – Protección de comprobantes

El sistema deberá restringir el acceso a los comprobantes a usuarios autorizados.

## RNF-006 – Integridad

El sistema deberá mantener la relación entre una invitación, sus asistentes y sus comprobantes.

## RNF-007 – Compatibilidad

El sistema deberá funcionar en versiones modernas de los principales navegadores web.

## RNF-008 – Persistencia

El sistema deberá conservar las confirmaciones registradas después de finalizar la sesión del usuario.

## RNF-009 – Retroalimentación

El sistema deberá informar al usuario el resultado de las operaciones de confirmación.

## RNF-010 – Validación

El sistema deberá validar los datos obligatorios antes de registrar una confirmación.

---

# 20. Reglas de negocio

## RN-001 – Fecha del evento

La fecha del evento será el 23 de enero de 2027.

## RN-002 – Cálculo del importe

El importe total se calculará a partir de la cantidad de asistentes y el valor aplicable a cada asistente.

## RN-003 – Pago pendiente

Una confirmación sin comprobante deberá permanecer con estado de pago pendiente hasta que se registre un pago.

## RN-004 – Comprobante enviado

La presentación de un comprobante no implicará automáticamente que el pago fue verificado.

## RN-005 – Verificación

Un pago solamente podrá considerarse verificado después de la validación correspondiente por parte de un administrador.

## RN-006 – Confirmación definitiva

La condición exacta para considerar una asistencia como definitivamente confirmada deberá ser acordada con los organizadores.

## RN-007 – Valor de la tarjeta

El valor definitivo de la tarjeta deberá ser definido por los organizadores.

## RN-008 – Precios diferenciados

La existencia de valores diferenciados para adultos y menores deberá ser definida por los organizadores.

---

# 21. Modelo conceptual de datos

## Entidad: INVITACION

Atributos propuestos:

- id
- nombre
- apellido
- telefono
- cantidad_personas
- fecha_confirmacion
- modalidad_pago
- estado_asistencia
- estado_pago
- importe_total
- observaciones
- fecha_pago
- fecha_creacion
- fecha_actualizacion

## Entidad: ASISTENTE

Atributos propuestos:

- id
- invitacion_id
- nombre
- apellido
- tipo_asistente
- restriccion_alimentaria
- mesa

Relación:

**Una INVITACION puede contener uno o varios ASISTENTES.**

## Entidad: COMPROBANTE

Atributos propuestos:

- id
- invitacion_id
- archivo
- tipo_archivo
- fecha_carga
- estado_verificacion

Relación:

**Un COMPROBANTE deberá pertenecer a una INVITACION.**

## Entidad: ADMINISTRADOR

Atributos conceptuales:

- id
- usuario
- credencial_autenticacion
- estado

---

# 22. Casos de uso principales

## CU-001 – Consultar invitación

**Actor:** Invitado.

**Objetivo:** consultar la información de los 15 de Sol.

**Precondición:** ninguna.

**Curso normal:**

1. El invitado accede al sitio.
2. El sistema muestra la portada.
3. El invitado consulta la información.
4. El sistema muestra los datos del evento.
5. El invitado puede continuar hacia la confirmación.

**Postcondición:** ninguna.

---

## CU-002 – Confirmar asistencia y pagar ahora

**Actor:** Invitado.

**Precondición:** el sitio se encuentra disponible.

**Curso normal:**

1. El invitado selecciona “Confirmar y pagar ahora”.
2. El sistema muestra el formulario.
3. El invitado ingresa sus datos.
4. El invitado indica la cantidad de asistentes.
5. El sistema solicita los datos de los asistentes.
6. El sistema calcula el importe total.
7. El sistema muestra los datos de transferencia.
8. El invitado realiza la transferencia fuera del sistema.
9. El invitado adjunta el comprobante.
10. El invitado confirma la operación.
11. El sistema registra la confirmación.
12. El sistema registra el comprobante.
13. El sistema establece el pago como pendiente de verificación.
14. El sistema muestra el mensaje de confirmación.

**Postcondición:** existe una confirmación con comprobante pendiente de verificación.

---

## CU-003 – Confirmar asistencia y pagar después

**Actor:** Invitado.

**Curso normal:**

1. El invitado selecciona “Confirmar asistencia – pagar después”.
2. El sistema muestra el formulario.
3. El invitado ingresa sus datos.
4. El invitado indica la cantidad de asistentes.
5. El sistema solicita los datos de cada asistente.
6. El sistema calcula el importe correspondiente.
7. El invitado confirma la operación.
8. El sistema registra la confirmación.
9. El sistema establece el pago como pendiente.
10. El sistema muestra el mensaje correspondiente.

**Postcondición:** existe una confirmación con pago pendiente.

---

## CU-004 – Verificar pago

**Actor:** Administrador.

**Precondiciones:**

- El administrador se encuentra autenticado.
- Existe una confirmación con comprobante.

**Curso normal:**

1. El administrador consulta las confirmaciones.
2. El administrador selecciona una confirmación.
3. El sistema muestra sus datos.
4. El administrador consulta el comprobante.
5. El administrador verifica externamente la transferencia.
6. El administrador registra el pago como verificado.
7. El sistema actualiza el estado.
8. El sistema actualiza los indicadores administrativos.

**Postcondición:** el pago queda registrado como verificado.

---

## CU-005 – Exportar asistentes

**Actor:** Administrador.

**Precondición:** el administrador se encuentra autenticado.

**Curso normal:**

1. El administrador accede al listado.
2. El administrador solicita una exportación.
3. El sistema genera el archivo.
4. El sistema permite obtener el archivo generado.

**Postcondición:** el administrador dispone de una copia exportada de la información.

---

# 23. Criterios de aceptación iniciales

## CA-001 – Cantidad de asistentes

**Dado** que un invitado está completando la confirmación,  
**cuando** indique una cantidad de 4 asistentes,  
**entonces** el sistema deberá permitir registrar los datos correspondientes a 4 asistentes.

## CA-002 – Cálculo del importe

**Dado** un precio unitario de $50.000,  
**cuando** una confirmación incluya 3 personas,  
**entonces** el sistema deberá informar un total de $150.000.

## CA-003 – Pago posterior

**Dado** que un invitado seleccionó pagar posteriormente,  
**cuando** complete correctamente la confirmación,  
**entonces** el sistema deberá registrar el pago como pendiente.

## CA-004 – Comprobante

**Dado** que un invitado seleccionó pagar ahora,  
**cuando** presente un comprobante válido,  
**entonces** el sistema deberá asociarlo con su confirmación.

## CA-005 – Comprobante pendiente de verificación

**Dado** que se recibió un comprobante,  
**cuando** todavía no haya sido validado por un administrador,  
**entonces** el pago deberá permanecer pendiente de verificación.

## CA-006 – Verificación administrativa

**Dado** que existe un pago pendiente de verificación,  
**cuando** un administrador lo valide,  
**entonces** el sistema deberá registrar el pago como verificado.

## CA-007 – Seguridad

**Dado** un usuario no autenticado,  
**cuando** intente acceder al panel administrativo,  
**entonces** el sistema deberá impedir el acceso.

---

# 24. Trazabilidad inicial

| Caso de uso | Requerimientos relacionados |
|---|---|
| CU-001 Consultar invitación | RF-001 a RF-015 |
| CU-002 Confirmar y pagar ahora | RF-016 a RF-035, RF-038 |
| CU-003 Confirmar y pagar después | RF-016 a RF-026, RF-036, RF-037, RF-039 |
| CU-004 Verificar pago | RF-040 a RF-050 |
| CU-005 Exportar asistentes | RF-057, RF-058 |

La matriz deberá ampliarse durante el proyecto para relacionar:

**Objetivo → Requerimiento → Caso de uso → Interfaz → Implementación → Caso de prueba.**

---

# 25. Información pendiente de definición

Antes de establecer una línea base definitiva de requerimientos deberán confirmarse los siguientes datos:

1. Nombre del salón.
2. Dirección exacta.
3. Horario de inicio.
4. Horario de finalización.
5. Valor definitivo de la tarjeta.
6. Fecha de vigencia del precio.
7. Existencia de precio diferenciado para menores.
8. Alias definitivo.
9. CBU definitivo.
10. Titular de la cuenta.
11. Código de vestimenta.
12. Información de estacionamiento.
13. Necesidad de presentar DNI.
14. Restricciones alimentarias que deberán ofrecerse.
15. Cantidad máxima de personas permitidas por invitación.
16. Tamaño máximo permitido para comprobantes.
17. Condición exacta para considerar definitivamente confirmada una asistencia.
18. Usuarios que tendrán acceso al panel administrativo.

---

# 26. Funcionalidades propuestas para futuras versiones

Las siguientes funcionalidades quedan identificadas para análisis posterior:

### F-001 – Código QR

Generación de un código QR asociado al asistente para controlar el ingreso.

### F-002 – WhatsApp

Envío de recordatorios de pago mediante WhatsApp.

### F-003 – Confirmación automática

Envío de una comunicación después de verificarse un pago.

### F-004 – Gestión de mesas

Administración de mesas desde el panel privado.

### F-005 – Galería

Publicación de una galería de fotografías después del evento.

Estas funcionalidades deberán analizarse y aprobarse antes de incorporarse al alcance.

---

# 27. Restricciones tecnológicas propuestas

Debe ser responsive. Como arquitectura inicial se propone:

**Frontend:** Next.js / React vite.  
**Backend y base de datos:** node js & Mongodb.  


Estas tecnologías constituyen actualmente una **propuesta de solución** y no un requerimiento funcional del producto. Su adopción definitiva deberá establecerse como decisión de arquitectura.

---

# 28. Validación

Los requerimientos deberán validarse con los organizadores antes del inicio de la implementación.

La validación deberá comprobar especialmente:

- Completitud.
- Correctitud.
- Consistencia.
- Necesidad.
- Ausencia de ambigüedad.
- Factibilidad.
- Verificabilidad.
- Prioridad.
- Trazabilidad.

Se recomienda utilizar:

- Revisión de requerimientos.
- Prototipos de interfaz.
- Criterios de aceptación.
- Casos de prueba.

Los prototipos deberán ser revisados por los organizadores antes de implementar las interfaces definitivas.

---

# 29. Administración de cambios

Cada modificación posterior a la aprobación del documento deberá registrarse como cambio de requerimiento.

Para cambios relevantes deberán identificarse:

- Requerimiento afectado.
- Motivo del cambio.
- Solicitante.
- Impacto.
- Prioridad.
- Decisión.
- Versión en la que será incorporado.

La incorporación de una funcionalidad futura no deberá realizarse automáticamente por haber sido solicitada. Primero deberá evaluarse su impacto sobre el alcance, desarrollo, datos, pruebas y fecha de entrega.

---

# 30. Conclusión

El sistema **“Mis 15 – Sol Rabozzi”** proporcionará una solución integrada para presentar digitalmente la invitación al evento y administrar el proceso de confirmación de asistencia y seguimiento de pagos.

La separación entre el área pública orientada a los invitados y el área privada destinada a los organizadores permitirá mantener una experiencia visual acorde con el evento sin perder las funcionalidades necesarias para su administración.

Esta versión constituye la especificación inicial del producto.

Los requerimientos identificados deberán ser revisados con los stakeholders, completar la información pendiente y posteriormente establecer una línea base que sirva como referencia para diseño, implementación, pruebas y aceptación del sistema.