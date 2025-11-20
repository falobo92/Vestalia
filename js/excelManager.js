import { normalizeNumber } from "./dataStore.js";

// Utilidad para generar IDs simples basados en nombres (para referencias estables)
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function normalizeName(name) {
  return name ? String(name).trim().toLowerCase() : "";
}

// --- EXPORTAR ---

export function exportDatabaseToExcel(data) {
  const wb = XLSX.utils.book_new();

  // 1. Hoja Ingredientes
  const ingRows = data.ingredients.map(i => ({
    "ID": i.id,
    "Nombre": i.nombre,
    "Unidad Medida": i.unidadMedida,
    "Costo Paquete": i.costoFormato,
    "Cantidad Paquete": i.formatoCantidad,
    "Proveedor": i.proveedor
  }));
  const wsIng = XLSX.utils.json_to_sheet(ingRows);
  XLSX.utils.book_append_sheet(wb, wsIng, "Ingredientes");

  // 2. Hoja Insumos
  const supRows = data.supplies.map(s => ({
    "ID": s.id,
    "Nombre": s.nombre,
    "Unidad": s.formatoUnidad,
    "Costo Paquete": s.costoFormato,
    "Cantidad Paquete": s.formatoCantidad
  }));
  const wsSup = XLSX.utils.json_to_sheet(supRows);
  XLSX.utils.book_append_sheet(wb, wsSup, "Insumos");

  // 3. Hoja Equipos
  const eqRows = data.equipments.map(e => ({
    "ID": e.id,
    "Nombre": e.nombre,
    "Potencia (Watts)": e.potenciaWatts,
    "Costo KWh": e.costoKwh, // Puede ser null/vacío
    "Fórmula": e.formulaKwh
  }));
  const wsEq = XLSX.utils.json_to_sheet(eqRows);
  XLSX.utils.book_append_sheet(wb, wsEq, "Equipos");

  // 4. Hoja Recetas (Cabecera)
  const recRows = data.recipes.map(r => ({
    "ID": r.id,
    "Nombre": r.nombreReceta,
    "Rendimiento": r.rendimientoBase,
    "Tiempo Horno (min)": r.tiempoHornoMinutos,
    "Temp Horno (C)": r.temperaturaHorno,
    "Descripción": r.descripcion,
    "Pasos": r.pasosPreparacion
  }));
  const wsRec = XLSX.utils.json_to_sheet(recRows);
  XLSX.utils.book_append_sheet(wb, wsRec, "Recetas");

  // 5. Hoja Receta_Detalle (Relaciones)
  // Aplanamos todas las relaciones en una sola tabla legible
  const detailRows = [];

  // Mapas para buscar nombres rápidamente por ID
  const recMap = new Map(data.recipes.map(r => [r.id, r.nombreReceta]));
  const ingMap = new Map(data.ingredients.map(i => [i.id, i.nombre]));
  const supMap = new Map(data.supplies.map(s => [s.id, s.nombre]));
  const eqMap = new Map(data.equipments.map(e => [e.id, e.nombre]));

  // Ingredientes de recetas
  data.recipeIngredients.forEach(ri => {
    detailRows.push({
      "Nombre Receta": recMap.get(ri.recetaId) || ri.recetaId,
      "Tipo": "Ingrediente",
      "Nombre Item": ingMap.get(ri.ingredienteId) || ri.ingredienteId,
      "Cantidad": ri.cantidadPorRendimientoBase
    });
  });

  // Insumos de recetas
  data.recipeSupplies.forEach(rs => {
    detailRows.push({
      "Nombre Receta": recMap.get(rs.recetaId) || rs.recetaId,
      "Tipo": "Insumo",
      "Nombre Item": supMap.get(rs.insumoId) || rs.insumoId,
      "Cantidad": rs.cantidadPorRendimientoBase
    });
  });

  // Equipos de recetas
  data.recipeEquipments.forEach(re => {
    detailRows.push({
      "Nombre Receta": recMap.get(re.recetaId) || re.recetaId,
      "Tipo": "Equipo",
      "Nombre Item": eqMap.get(re.equipmentId) || re.equipmentId,
      "Cantidad": re.tiempoHoras // En este caso "Cantidad" representa horas
    });
  });

  // Ordenar por nombre de receta para facilitar lectura
  detailRows.sort((a, b) => a["Nombre Receta"].localeCompare(b["Nombre Receta"]));

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Receta_Detalle");

  // 6. Configuración Global (Opcional, pero útil)
  const configRows = [{ "Clave": "CostoKwhGlobal", "Valor": data.costoKwhGlobal }];
  const wsConfig = XLSX.utils.json_to_sheet(configRows);
  XLSX.utils.book_append_sheet(wb, wsConfig, "Config");

  // Escribir archivo
  XLSX.writeFile(wb, "BaseDatos_Vestalia.xlsx");
}

// --- IMPORTAR ---

export async function importDatabaseFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        // Estructuras de salida
        const newState = {
          ingredients: [],
          supplies: [],
          equipments: [],
          recipes: [],
          recipeIngredients: [],
          recipeSupplies: [],
          recipeEquipments: [],
          costoKwhGlobal: 230 // Default
        };

        // Mapas para resolución de relaciones (Nombre -> ID)
        const ingNameMap = new Map();
        const supNameMap = new Map();
        const eqNameMap = new Map();
        const recNameMap = new Map(); // Nombre Receta -> ID Receta

        // 1. Leer Configuración
        if (wb.Sheets["Config"]) {
          const configData = XLSX.utils.sheet_to_json(wb.Sheets["Config"]);
          const kwhRow = configData.find(r => r.Clave === "CostoKwhGlobal");
          if (kwhRow) newState.costoKwhGlobal = normalizeNumber(kwhRow.Valor, 230);
        }

        // 2. Leer Ingredientes
        if (wb.Sheets["Ingredientes"]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets["Ingredientes"]);
          rows.forEach(r => {
            const id = r.ID || generateId("ing");
            const nombre = String(r.Nombre || "").trim();
            if (!nombre) return;

            const cantPaq = normalizeNumber(r["Cantidad Paquete"], 0);
            const costoPaq = normalizeNumber(r["Costo Paquete"], 0);
            const unitario = cantPaq > 0 ? costoPaq / cantPaq : 0;

            const item = {
              id: id,
              nombre: nombre,
              unidadMedida: r["Unidad Medida"] || "g",
              formatoCantidad: cantPaq,
              formatoUnidad: "", // No mapeado explícitamente en excel simple, se asume implícito
              costoFormato: costoPaq,
              costoUnitario: unitario,
              proveedor: r["Proveedor"] || ""
            };
            newState.ingredients.push(item);
            ingNameMap.set(normalizeName(nombre), id);
          });
        }

        // 3. Leer Insumos
        if (wb.Sheets["Insumos"]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets["Insumos"]);
          rows.forEach(r => {
            const id = r.ID || generateId("sup");
            const nombre = String(r.Nombre || "").trim();
            if (!nombre) return;

            const cantPaq = normalizeNumber(r["Cantidad Paquete"], 0);
            const costoPaq = normalizeNumber(r["Costo Paquete"], 0);
            const unitario = cantPaq > 0 ? costoPaq / cantPaq : 0;

            const item = {
              id: id,
              nombre: nombre,
              formatoCantidad: cantPaq,
              formatoUnidad: r["Unidad"] || "unidad",
              costoFormato: costoPaq,
              costoUnitario: unitario
            };
            newState.supplies.push(item);
            supNameMap.set(normalizeName(nombre), id);
          });
        }

        // 4. Leer Equipos
        if (wb.Sheets["Equipos"]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets["Equipos"]);
          rows.forEach(r => {
            const id = r.ID || generateId("eq");
            const nombre = String(r.Nombre || "").trim();
            if (!nombre) return;

            const item = {
              id: id,
              nombre: nombre,
              potenciaWatts: normalizeNumber(r["Potencia (Watts)"], 0),
              costoKwh: (r["Costo KWh"] != null && r["Costo KWh"] !== "") ? normalizeNumber(r["Costo KWh"], 0) : null,
              formulaKwh: r["Fórmula"] || "(potenciaWatts / 1000) * tiempoHoras"
            };
            newState.equipments.push(item);
            eqNameMap.set(normalizeName(nombre), id);
          });
        }

        // 5. Leer Recetas (Cabeceras)
        if (wb.Sheets["Recetas"]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets["Recetas"]);
          rows.forEach(r => {
            const id = r.ID || generateId("rec");
            const nombre = String(r.Nombre || "").trim();
            if (!nombre) return;

            const item = {
              id: id,
              nombreReceta: nombre,
              rendimientoBase: normalizeNumber(r["Rendimiento"], 1),
              tiempoHornoMinutos: normalizeNumber(r["Tiempo Horno (min)"], 0),
              temperaturaHorno: normalizeNumber(r["Temp Horno (C)"], 0),
              descripcion: r["Descripción"] || "",
              pasosPreparacion: r["Pasos"] || ""
            };
            newState.recipes.push(item);
            recNameMap.set(normalizeName(nombre), id);
          });
        }

        // 6. Leer Detalle Recetas (Relaciones)
        if (wb.Sheets["Receta_Detalle"]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets["Receta_Detalle"]);
          
          rows.forEach(row => {
            const recetaNombre = normalizeName(row["Nombre Receta"]);
            const recetaId = recNameMap.get(recetaNombre);
            
            if (!recetaId) return; // Receta no encontrada, saltar

            const tipo = normalizeName(row["Tipo"]);
            const itemNombre = normalizeName(row["Nombre Item"]);
            const cantidad = normalizeNumber(row["Cantidad"], 0);

            if (tipo.includes("ingrediente")) {
              const ingId = ingNameMap.get(itemNombre);
              if (ingId) {
                newState.recipeIngredients.push({
                  id: generateId("rIng"),
                  recetaId: recetaId,
                  ingredienteId: ingId,
                  cantidadPorRendimientoBase: cantidad
                });
              }
            } else if (tipo.includes("insumo")) {
              const supId = supNameMap.get(itemNombre);
              if (supId) {
                newState.recipeSupplies.push({
                  id: generateId("rSup"),
                  recetaId: recetaId,
                  insumoId: supId,
                  cantidadPorRendimientoBase: cantidad
                });
              }
            } else if (tipo.includes("equipo") || tipo.includes("electro")) {
              const eqId = eqNameMap.get(itemNombre);
              if (eqId) {
                newState.recipeEquipments.push({
                  id: generateId("rEq"),
                  recetaId: recetaId,
                  equipmentId: eqId,
                  tiempoHoras: cantidad // La columna es genérica "Cantidad", aqui se interpreta como horas
                });
              }
            }
          });
        }

        resolve(newState);

      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

