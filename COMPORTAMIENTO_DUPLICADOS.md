# Comportamiento al Cargar el Mismo Excel Dos Veces

## 🔍 Análisis del Comportamiento

### Primera Carga
✅ **Todo se crea correctamente:**
- Empresas: Se crean las 53 empresas únicas
- Inscripciones: Se crean 456 inscripciones (con números 100100-100555)
- Participantes: Se crean 2,912 participantes vinculados a sus inscripciones

### Segunda Carga (mismo Excel)

#### 1. **Empresas** ✅
- **NO se duplican**
- El sistema verifica qué empresas ya existen
- Solo crea las que NO existen
- Resultado: `✓ 0 empresas creadas (todas ya existían)`

#### 2. **Inscripciones** ⚠️
- **SE DUPLICAN**
- Cada inscripción obtiene un nuevo `numeroInscripcion`
- El sistema NO verifica si ya existe una inscripción igual
- Primera carga: 100100-100555
- Segunda carga: 100556-101011
- **Resultado: 456 inscripciones duplicadas**

#### 3. **Participantes** ❌
- **FALLAN por duplicados**
- El backend tiene un índice único: `(numeroInscripcion, rutKey)`
- Como se crean nuevas inscripciones, los `numeroInscripcion` son diferentes
- Pero... espera, si el numeroInscripcion es diferente, NO deberían fallar
- **Resultado: 2,912 participantes se crearían con nuevos numeroInscripcion**

## 🚨 Problema Real

**Si cargas el mismo Excel dos veces:**

```
Primera carga:
✓ 53 empresas creadas
✓ 456 inscripciones creadas (100100-100555)
✓ 2,912 participantes creados

Segunda carga:
✓ 0 empresas creadas
✓ 456 inscripciones creadas (100556-101011) <- DUPLICADAS
✓ 2,912 participantes creados <- DUPLICADOS

Base de datos final:
- 53 empresas (OK)
- 912 inscripciones (456 duplicadas)
- 5,824 participantes (2,912 duplicados)
```

## 📊 Consecuencias

1. **Datos duplicados** en inscripciones y participantes
2. **Desperdiciar números de inscripción**
3. **Confusión** al tener múltiples inscripciones con misma ficha
4. **Participantes duplicados** con diferentes números de inscripción

## 🔧 Soluciones Posibles

### Opción 1: Advertencia al Usuario
Mostrar un mensaje de confirmación antes de procesar:
```
"¿Estás seguro de importar este archivo?
Esta acción creará nuevas inscripciones y participantes.
Si ya cargaste este archivo antes, se crearán duplicados."
```

### Opción 2: Validación por Ficha
Antes de crear inscripciones, verificar si ya existe una inscripción con esa ficha:
- Si existe: Mostrar advertencia y opciones (reemplazar/saltar/continuar)
- Si no existe: Crear normalmente

### Opción 3: Validación por RUT (Participantes)
Antes de crear participantes, verificar si ya existe un participante con ese RUT:
- En cualquier inscripción
- Mostrar advertencia con lista de RUTs duplicados

### Opción 4: Modo "Upsert" para Inscripciones
Usar la ficha como clave única:
- Si existe inscripción con esa ficha → Actualizar
- Si no existe → Crear nueva

## 💡 Recomendación

La mejor opción depende de tu caso de uso:

### Si NUNCA deberías cargar el mismo Excel dos veces:
→ **Opción 1**: Advertencia simple

### Si PODRÍAS actualizar datos de inscripciones existentes:
→ **Opción 4**: Modo upsert por ficha

### Si quieres máximo control:
→ **Opción 2 + Opción 3**: Validación completa con opciones al usuario

## 🎯 Comportamiento Actual

**El sistema NO impide duplicados** de inscripciones ni participantes al cargar el mismo Excel dos veces.

Solo las **empresas** tienen protección contra duplicados.

## ⚠️ Importante

Si accidentalmente cargas el mismo Excel dos veces:
- Tendrás inscripciones duplicadas
- Tendrás participantes duplicados
- Necesitarás limpiar manualmente la base de datos
