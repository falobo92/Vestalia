# Guía de Gestión de Datos con Excel

Vestalia ahora utiliza un archivo Excel (`.xlsx`) como base de datos maestra. Esto permite editar precios, ingredientes y recetas de manera masiva y cómoda.

## 1. Exportar la Base de Datos Actual

1. Ve a la pestaña **Administración**.
2. Haz clic en el botón **"Exportar Excel"** (arriba a la derecha).
3. Se descargará un archivo `BaseDatos_Vestalia.xlsx`.

## 2. Estructura del Excel

El archivo tiene 6 hojas principales:

*   **Ingredientes**: Lista de materias primas.
    *   *Costo Paquete / Cantidad Paquete*: Útil para que el sistema calcule el precio por gramo automáticamente.
    *   *Nombre*: Debe ser único.
*   **Insumos**: Materiales no comestibles (cajas, bolsas).
*   **Equipos**: Electrodomésticos y su potencia.
*   **Recetas**: Cabecera de la receta (Rendimiento, Tiempos).
*   **Receta_Detalle**: ¡Lo más importante! Aquí asignas ingredientes a las recetas.
    *   *Nombre Receta*: Debe coincidir exactamente con el nombre en la hoja "Recetas".
    *   *Tipo*: Puede ser `Ingrediente`, `Insumo` o `Equipo`.
    *   *Nombre Item*: Debe coincidir con el nombre en su hoja respectiva.
    *   *Cantidad*: Gramos (ingredientes), Unidades (insumos) u Horas (equipos).
*   **Config**: Variables globales como el Costo KWh.

## 3. Editar Datos

*   Puedes **agregar filas** nuevas libremente.
*   Puedes **borrar filas** para eliminar datos.
*   Puedes **cambiar precios** masivamente.
*   **IMPORTANTE**: Si cambias el nombre de un ingrediente, asegúrate de actualizarlo también en la hoja `Receta_Detalle`.

## 4. Importar Nuevamente

1. Guarda tus cambios en Excel.
2. En Vestalia > Administración, haz clic en **"Importar Excel"**.
3. Selecciona tu archivo `.xlsx`.
4. El sistema recargará toda la información.

> **Nota**: Al importar, la base de datos de la aplicación se **REEMPLAZA COMPLETAMENTE** con lo que haya en el Excel. ¡Asegúrate de tener tu archivo actualizado!

