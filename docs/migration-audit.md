# Auditoria y plan de migracion UX

## Diagnostico actual

| ACTUAL | Responsabilidad | Destino |
|---|---|---|
| `src/app/App.tsx` | Pantalla unica: selector, formulario, preview, resumen, numero de pedido y WhatsApp | Modificar como composicion; extraer carrusel y formulario reutilizable |
| `BanderinPreview` (local a `App.tsx`) | Renderiza el SVG como mascara y superpone el nombre | Reutilizar dentro de cada slot; conserva la ruta y el color dinamico |
| `src/store/garlandStore.ts` | Zustand + persistencia; guarda `GarlandLine[]` agrupadas con `quantity` | Migrar a exactamente 10 slots `Array<GarlandItem | null>` y acciones por indice |
| `src/domain/garland/types.ts` y `rules.ts` | `GarlandLine`, cantidad total, combinacion de lineas, limite 10 y validacion | Introducir `GarlandItem`; cambiar progreso/validacion a posiciones ocupadas; retirar reglas de quantity tras migrar consumidores |
| `src/domain/designs/designs.ts` | Catalogo y compatibilidad por forma | Mantener; ya distingue perro, gato, huesos, nombre y Dia de Muertos |
| `src/domain/colors/colors.ts` | Catalogo de colores | Mantener |
| `src/services/assets.ts` | Convierte `semi-circle`/`rectangle` a prefijo historico SVG | Mantener; resolver actual `/assets/<prefijo>-<designId>.svg` ya deriva por convencion |
| `src/services/whatsapp.ts` | Construye el mensaje a partir de lineas con cantidad | Adaptar para agrupar slots identicos y conservar numero, total y URL codificada |
| `src/public/assets/` + `vite.config.ts` | 41 SVG; Vite publica `src/public` en `/` | Mantener sin moverlos; conservar `/assets/<archivo>.svg` |
| `src/main.tsx` + Fluent UI | Arranque SPA y tema Fluent | Mantener; no hay router ni navegacion que migrar |
| `src/styles.css` | Layout de configurador en dos columnas y estilos de formulario/preview | Modificar layout para carrusel con tarjeta 75%, peek, scroll snap y sheet responsive |
| `tests/garland.test.ts` | Reglas de lineas y mensaje | Adaptar/agregar casos de slots, migracion, progreso, edicion y agrupacion |

## Store y consumidores

El store contiene `items: GarlandLine[]` y `orderNumber: string`. Expone agregar/actualizar/eliminar lineas, incrementar/decrementar cantidades, limpiar y guardar el numero. La persistencia Zustand usa la clave `petu-garland-config` y guarda solo `items` y `orderNumber`.

El unico consumidor de UI es `App.tsx`; las pruebas consumen las acciones directamente. No hay componentes en `src/components`, router, otras pantallas ni almacenamiento remoto. El formulario actual ya soporta validacion y modo editar; el dialogo del numero de pedido, el popover LolaPay, la limpieza al continuar y el servicio WhatsApp son reutilizables.

## Modelo actual -> nuevo

`GarlandLine { id, shape, designId, colorId, quantity, customization }` pasa a `GarlandItem { id, shape, designId, colorId, customization }`. El estado nuevo conserva `orderNumber` y mantiene exactamente 10 entradas, vacias con `null`. El progreso cuenta entradas ocupadas, no una suma de cantidades. Las repeticiones permanecen como posiciones independientes y solo se agrupan al generar el mensaje.

### Compatibilidad de LocalStorage

Versionar el estado persistido. La migracion lee cada linea anterior en su orden, la expande `quantity` veces a items con IDs individuales y rellena las posiciones restantes con `null`; conserva `orderNumber`. La validacion limita el resultado a 10 posiciones. No se crea historial ni se descarta una configuracion valida.

## Plan incremental

1. **Modelo:** agregar `GarlandItem`, `Garland` de 10 slots y helpers puros para crear slots vacios, contar ocupados y migrar lineas antiguas. Mantener temporalmente los tipos antiguos mientras sigan compilando sus consumidores.
2. **Store:** versionar persistencia, migrar el formato anterior y agregar `addItem(index, item)`, `updateItem(index, item)`, `removeItem(index)` y `resetGarland()`. Cambiar el store y su adaptador de UI en la misma etapa compilable; retirar acciones de cantidad cuando ya no tengan consumidores.
3. **Carrusel:** crear tarjetas para las 10 posiciones, `+` cuando vacias, SVG a todo el ancho, 75% del viewport por tarjeta, siguiente tarjeta visible y scroll snap. Tocar una posicion ocupada abre edicion.
4. **Configurador:** reutilizar el formulario existente como bottom sheet/dialog para crear y editar; filtrar disenos por forma, exigir nombre cuando aplique y eliminar el selector de cantidad.
5. **Flujo final:** progreso por slots ocupados, continuar solo con 10/10, conservar dialogo y ayuda del numero de pedido, agregar resumen y adaptar agrupacion WhatsApp por configuracion equivalente.
6. **Limpieza:** quitar `GarlandLine`, funciones de cantidad y layout anterior solo despues de eliminar todos sus consumidores; ampliar pruebas y validar build/navegador por etapa.

## Archivos previstos

- **Modificar:** `src/domain/garland/types.ts`, `src/domain/garland/rules.ts`, `src/store/garlandStore.ts`, `src/app/App.tsx`, `src/services/whatsapp.ts`, `src/styles.css`, `tests/garland.test.ts`.
- **Crear:** componente de carrusel/slot, componente reutilizable de configuracion, y helpers de migracion/versionado si no caben con claridad en el modulo de dominio/store.
- **Mantener:** `src/domain/designs/designs.ts`, `src/domain/colors/colors.ts`, `src/services/assets.ts`, los 41 SVG, `src/main.tsx`, configuracion de Vite, Fluent UI y Zustand.
- **Eliminar despues de validar:** modelo `GarlandLine`, acciones de cantidad y estilos del layout anterior que queden sin referencias.

## Estado de migracion

Las etapas de modelo, store, carrusel, configurador, renderer y flujo final ya estan implementadas. El store usa diez slots persistidos con version 1; los datos de lineas anteriores se expanden por cantidad y se conserva el numero de pedido. El formulario se reutiliza para crear/editar, los SVG siguen usando el resolver por convencion y WhatsApp agrupa items identicos.

QA actual: 7 pruebas pasan; `bun run build` pasa; se verificaron 10 tarjetas, progreso 10/10, edicion, eliminacion sin desplazar posiciones, resumen agrupado y limpieza de persistencia en navegador. No hay router ni lint configurado en el proyecto. La apertura externa de WhatsApp queda pendiente de una prueba manual en dispositivo/navegador real porque el navegador de automatizacion bloquea el popup sintetico.
