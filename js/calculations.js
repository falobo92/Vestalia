// js/calculations.js

import { normalizeNumber } from "./dataStore.js";

// Funciones puras de cálculo

/**
 * calcula la cantidad requerida para un ingrediente o insumo
 * @param {number} cantidadBase cantidad por rendimiento base
 * @param {number} rendimientoBase unidades base de la receta
 * @param {number} unidadesSolicitadas unidades deseadas
 */
export function computeRequiredQuantity(cantidadBase, rendimientoBase, unidadesSolicitadas) {
  if (!rendimientoBase || rendimientoBase <= 0) return 0;
  return cantidadBase * (unidadesSolicitadas / rendimientoBase);
}

/**
 * Calcula el consumo energético en kWh usando una fórmula configurable.
 * @param {number} potenciaWatts - Potencia en watts
 * @param {number} tiempoHoras - Tiempo en horas
 * @param {string} formulaKwh - Fórmula JavaScript que usa 'potenciaWatts' y 'tiempoHoras' como variables
 * @returns {number} Consumo en kWh
 */
function computeKwhConsumption(potenciaWatts, tiempoHoras, formulaKwh) {
  const p = normalizeNumber(potenciaWatts, 0);
  const t = normalizeNumber(tiempoHoras, 0);
  
  // Si no hay fórmula o está vacía, usar la fórmula por defecto
  const formula = (typeof formulaKwh === "string" && formulaKwh.trim()) 
    ? formulaKwh.trim() 
    : "(potenciaWatts / 1000) * tiempoHoras";
  
  try {
    // Evaluar la fórmula de forma segura usando Function constructor
    // Esto permite usar potenciaWatts y tiempoHoras como variables
    const func = new Function("potenciaWatts", "tiempoHoras", `return ${formula};`);
    const resultado = func(p, t);
    return normalizeNumber(resultado, 0);
  } catch (error) {
    console.error("Error al evaluar fórmula de KWh:", error, "Fórmula:", formula);
    // En caso de error, usar fórmula por defecto
    return (p / 1000) * t;
  }
}

/**
 * Calcula el costo total de una receta dado su detalle de ingredientes, insumos y electrodomésticos.
 * Todo son funciones puras: no acceden al DOM ni al almacenamiento.
 *
 * @param {Object} params
 * @param {Object} params.receta objeto receta
 * @param {Array} params.detalleIngredientes lista de objetos:
 *        { detalleId, ingrediente, cantidadBase }
 * @param {Array} params.detalleInsumos lista de objetos:
 *        { detalleId, insumo, cantidadBase }
 * @param {Array} params.detalleEquipments lista de objetos:
 *        { detalleId, equipment, tiempoHoras }
 * @param {number} params.unidadesSolicitadas unidades a elaborar
 * @param {number} params.costoKwhGlobal costo global de KWh a usar cuando el equipo no tiene costo específico
 * @returns {Object} resultado estructurado para que la UI pueda renderizar
 */
export function calculateRecipeCost({
  receta,
  detalleIngredientes,
  detalleInsumos,
  detalleEquipments,
  unidadesSolicitadas,
  costoKwhGlobal = 230,
}) {
  const unidades = normalizeNumber(unidadesSolicitadas, 0);
  const rendimientoBase = receta ? normalizeNumber(receta.rendimientoBase, 0) : 0;

  const ingredientRows = [];
  const supplyRows = [];
  const equipmentRows = [];

  let totalIngredients = 0;
  let totalSupplies = 0;
  let totalEnergy = 0;

  if (receta && unidades > 0 && rendimientoBase > 0) {
    // Ingredientes
    for (const item of detalleIngredientes || []) {
      const { ingrediente, cantidadBase } = item;
      if (!ingrediente) continue;

      const required = computeRequiredQuantity(
        cantidadBase,
        rendimientoBase,
        unidades
      );

      const costoUnitario = normalizeNumber(ingrediente.costoUnitario, 0);
      const costoIngrediente = required * costoUnitario;

      totalIngredients += costoIngrediente;

      ingredientRows.push({
        nombre: ingrediente.nombre,
        cantidadRequerida: required,
        unidad: ingrediente.unidadMedida || "g",
        costoIngrediente,
      });
    }

    // Insumos
    for (const item of detalleInsumos || []) {
      const { insumo, cantidadBase } = item;
      if (!insumo) continue;

      const required = computeRequiredQuantity(
        cantidadBase,
        rendimientoBase,
        unidades
      );

      const costoUnitario = normalizeNumber(insumo.costoUnitario, 0);
      const costoInsumo = required * costoUnitario;

      totalSupplies += costoInsumo;

      supplyRows.push({
        nombre: insumo.nombre,
        cantidadRequerida: required,
        unidad: insumo.formatoUnidad || "unidad",
        costoInsumo,
      });
    }

    // Electrodomésticos (energía)
    for (const item of detalleEquipments || []) {
      const { equipment, tiempoHoras } = item;
      if (!equipment) continue;

      const potenciaWatts = normalizeNumber(equipment.potenciaWatts, 0);
      // Usar costoKwh del equipo si existe y es mayor a 0, sino usar el global
      const costoKwhEquipo = equipment.costoKwh != null ? normalizeNumber(equipment.costoKwh, null) : null;
      const costoKwh = (costoKwhEquipo != null && costoKwhEquipo > 0) ? costoKwhEquipo : normalizeNumber(costoKwhGlobal, 230);
      const tiempo = normalizeNumber(tiempoHoras, 0);
      const formulaKwh = equipment.formulaKwh || "(potenciaWatts / 1000) * tiempoHoras";

      const consumoKwh = computeKwhConsumption(potenciaWatts, tiempo, formulaKwh);
      const costoEnergia = consumoKwh * costoKwh;

      totalEnergy += costoEnergia;

      equipmentRows.push({
        nombre: equipment.nombre,
        tiempoHoras: tiempo,
        consumoKwh: consumoKwh,
        costoEnergia,
      });
    }
  }

  const total = totalIngredients + totalSupplies + totalEnergy;
  const unitario = unidades > 0 ? total / unidades : 0;

  return {
    unidadesSolicitadas: unidades,
    rendimientoBase,
    ingredientRows,
    supplyRows,
    equipmentRows,
    totalIngredients,
    totalSupplies,
    totalEnergy,
    total,
    unitario,
  };
}

/**
 * Formatea un valor numérico de CLP.
 */
export function formatCLP(value) {
  if (value == null || Number.isNaN(value)) return "–";
  const n = Math.round(Number(value));
  return n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Formatea una cantidad genérica con máximo 2 decimales (sin símbolo de moneda).
 */
export function formatQuantity(value) {
  if (value == null || Number.isNaN(value)) return "0";
  const num = Number(value);
  return num.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}


