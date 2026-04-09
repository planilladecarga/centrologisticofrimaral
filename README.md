# Frimaral Logística (MVP inicial)

Aplicación web simple (sin backend) para:

1. Subir un Excel actualizado de movimientos.
2. Extraer los registros de cada cliente (cliente, contenedor, pallets, cajas, kilos, contenido, lote, DUA, vencimiento).
3. Buscar y filtrar rápidamente.
4. Ver totales dinámicos de los registros filtrados.

## Cómo usar

1. Abrí `index.html` en un navegador moderno.
2. Cargá tu archivo `.xlsx`, `.xls` o `.csv`.
3. Usá los filtros para encontrar información por cliente, contenedor o lote.

## Notas

- Este primer paso usa el formato del Excel mostrado en tus capturas.
- Si en el futuro cambia mucho el diseño del archivo, habrá que ajustar la lógica de parseo en `app.js`.
- Próximo paso recomendado: guardar los archivos y datos en backend (histórico por fecha, usuarios y permisos).
