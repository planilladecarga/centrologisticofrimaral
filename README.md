# Frimaral Logística (MVP inicial)

Aplicación web simple (sin backend) para:

1. Subir un Excel actualizado de movimientos.
2. Extraer los registros de cada cliente (cliente, contenedor, pallets, cajas, kilos, contenido, lote, DUA, vencimiento).
3. Buscar y filtrar rápidamente.
4. Ver totales dinámicos de los registros filtrados.

## Cómo usar local

1. Abrí `index.html` en un navegador moderno.
2. Cargá tu archivo `.xlsx`, `.xls` o `.csv`.
3. Usá los filtros para encontrar información por cliente, contenedor o lote.

## Publicar en GitHub Pages (GitHub Actions)

Si ves un **404** como en tu captura, normalmente significa que el sitio todavía no fue publicado en Pages.

1. Hacé push de este repositorio para que corra el workflow `Deploy static site to GitHub Pages`.
2. En GitHub: **Settings → Pages**.
3. En **Source**, seleccioná **GitHub Actions**.
4. Esperá que el workflow termine en verde (tab **Actions**).
5. Abrí la URL final:
   - `https://<tu-usuario>.github.io/<tu-repo>/`

> Ejemplo: si el repo es `centrologisticofrimaral` y el usuario `planilladecarga`, la URL es `https://planilladecarga.github.io/centrologisticofrimaral/`.

## Notas

- Este primer paso usa el formato del Excel mostrado en tus capturas.
- Si en el futuro cambia mucho el diseño del archivo, habrá que ajustar la lógica de parseo en `app.js`.
- Próximo paso recomendado: guardar los archivos y datos en backend (histórico por fecha, usuarios y permisos).
