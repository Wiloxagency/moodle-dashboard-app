# Componente: Exportar Nuevas Inscripciones

## Descripción

El componente `ExportarInscripciones` permite cargar un archivo Excel (.xlsx) para crear inscripciones y sus participantes asociados de forma masiva en el sistema.

## Ubicación

- **Componente**: `src/components/ExportarInscripciones.tsx`
- **Integrado en**: `src/pages/Dashboard.tsx`

## Funcionalidad

### Proceso de Importación

1. **Carga del archivo**: El usuario selecciona un archivo Excel (.xlsx) mediante el botón "Exportar nuevas inscripciones"

2. **Procesamiento**: El sistema lee el archivo y agrupa los participantes por el campo `ficha`

3. **Creación de empresas**: 
   - El sistema identifica todas las empresas únicas del Excel
   - Verifica cuáles ya existen en la base de datos
   - Crea automáticamente las empresas que no existen (solo con nombre y status "Activo")

4. **Generación de inscripciones**: 
   - Cada valor único de `ficha` genera una nueva inscripción
   - El número de inscripción comienza en **100100** y se incrementa secuencialmente
   - Los participantes con la misma `ficha` se agrupan en la misma inscripción

5. **Creación en base de datos**: Se crean las empresas, inscripciones y sus participantes asociados

## Estructura del Excel

### Columnas Requeridas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `ficha` | String/Number | Identificador para agrupar participantes en una inscripción |
| `nombres` | String | Nombres del participante |
| `apellidos` | String | Apellidos del participante |
| `rut` | String | RUT del participante |
| `mail` | String | Email del participante |
| `telefono` | String | Teléfono del participante (opcional) |
| `valorCobrado` | Number | Valor cobrado al participante (opcional) |
| `franquiciaPorcentaje` | Number | Porcentaje de franquicia (opcional) |
| `observacion` | String | Observación/estado del participante (opcional) |

### Ejemplo de Excel

```
| ficha | nombres | apellidos | rut        | mail              | telefono  | valorCobrado | franquiciaPorcentaje | observacion |
|-------|---------|-----------|------------|-------------------|-----------|--------------|----------------------|-------------|
| A001  | Juan    | Pérez     | 12345678-9 | juan@mail.com     | 912345678 | 100000       | 65                   | Activo      |
| A001  | María   | González  | 98765432-1 | maria@mail.com    | 987654321 | 100000       | 65                   | Activo      |
| A002  | Pedro   | López     | 11111111-1 | pedro@mail.com    | 911111111 | 150000       | 70                   | Pendiente   |
```

En este ejemplo:
- Se crearán 2 inscripciones
- Inscripción 1 (ficha: A001+2): Juan Pérez y María González
- Inscripción 2 (ficha: A002+1): Pedro López

## Reglas de Negocio

### Empresas
- Las empresas se crean automáticamente si no existen en la base de datos
- Solo se guarda el campo `nombre` (del Excel) y `status: "Activo"`
- El campo `code` se genera automáticamente por el backend
- Todos los demás campos (holding, rut, responsable, etc.) quedan vacíos
- Si la empresa ya existe, no se crea duplicada

### Campo `ficha`
- El campo `ficha` se guarda exactamente como viene en el Excel
- No se agrega ningún contador ni modificación
- Ejemplo: Si el Excel tiene "2506-001", se guarda "2506-001" en la BD

### Campo `rutkey`
- Se genera automáticamente en el backend
- Es igual al campo `rut` normalizado (sin puntos ni espacios)

### Campo `observacion` → `estadoInscripcion`
- El valor de la columna `observacion` del Excel se asigna al campo `estadoInscripcion` en la base de datos
- También se guarda en el campo `observacion` del participante

### Campos `costoOtic` y `costoEmpresa`
- Siempre se guardan como `null`, independientemente del valor en el Excel

### Valores vacíos o cero
- Si un campo viene vacío o con valor `0` en el Excel, se guarda como string vacío (`""`) en la base de datos

### Numeración de inscripciones
- La primera inscripción generada tiene el número **100100**
- Las siguientes se incrementan secuencialmente: 100101, 100102, 100103, etc.

## Campos Generados Automáticamente

### Para Inscripciones
- `numeroInscripcion`: Secuencial, comenzando en 100100
- `empresa`: Siempre "Mutual"
- `correlativo`: 0 (ajustar según necesidad)
- `codigoCurso`: "" (ajustar según necesidad)
- `idMoodle`: "" (ajustar según necesidad)
- `modalidad`: "e-learning" (por defecto)
- `inicio`: Fecha y hora actual (ISO string)
- `ejecutivo`: "" (ajustar según necesidad)
- `numAlumnosInscritos`: Cantidad de participantes en la inscripción
- `statusAlumnos`: "Pendiente"

### Para Participantes
- `numeroInscripcion`: Asignado según la inscripción a la que pertenece
- `rutkey`: Generado automáticamente por el backend (normalización del rut)
- `costoOtic`: null
- `costoEmpresa`: null

## Mensajes y Retroalimentación

### Éxito
- Muestra la cantidad de inscripciones creadas
- Muestra la cantidad de participantes creados
- Lista los primeros 5 errores (si los hay)

### Errores
- Archivo no válido (debe ser .xlsx)
- Error leyendo el archivo
- Error procesando el Excel
- Error creando inscripciones o participantes

## Validaciones

- El archivo debe tener extensión `.xlsx`
- Las filas sin valor en el campo `ficha` se omiten (con warning en consola)
- Los participantes deben tener al menos `rut` y `numeroInscripcion` para ser creados

## Consideraciones Técnicas

### Dependencias
- `xlsx`: Para leer archivos Excel
- `lucide-react`: Para iconos (Upload, CheckCircle, AlertCircle)

### Servicios utilizados
- `inscripcionesApi.create()`: Para crear inscripciones
- `participantesApi.create()`: Para crear participantes

### Procesamiento
- Se lee el archivo completo en memoria
- Se agrupa por `ficha` usando un `Map`
- Se crean las inscripciones y participantes secuencialmente
- Los errores en participantes individuales no detienen el proceso completo

## Mejoras Futuras

1. Permitir especificar campos adicionales del Excel (correlativo, codigoCurso, idMoodle, etc.)
2. Validación de formato de RUT
3. Validación de formato de email
4. Opción de vista previa antes de importar
5. Descarga de plantilla Excel con el formato correcto
6. Validación de duplicados antes de crear
7. Rollback en caso de error
