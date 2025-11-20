
// js/dataStore.js
// Contenedor de estado en memoria.
// La persistencia principal es ahora vía archivo Excel (externo).
// Se mantiene un localStorage simple solo para no perder datos al recargar la página.

const STORAGE_KEY = "vestaliaData_ExcelBased";

// Estructuras base en memoria
let ingredients = [];
let supplies = [];
let equipments = [];
let recipes = [];
let recipeIngredients = [];
let recipeSupplies = [];
let recipeEquipments = [];
let costoKwhGlobal = 230;

// --- Helpers Básicos ---

export function normalizeNumber(value, defaultValue = 0) {
  if (value == null || value === "") return defaultValue;
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return num;
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// --- Gestión del Estado Completo (Import/Export) ---

export function getAllData() {
  return {
    ingredients: [...ingredients],
    supplies: [...supplies],
    equipments: [...equipments],
    recipes: [...recipes],
    recipeIngredients: [...recipeIngredients],
    recipeSupplies: [...recipeSupplies],
    recipeEquipments: [...recipeEquipments],
    costoKwhGlobal
  };
}

export function replaceAllData(newData) {
  ingredients = newData.ingredients || [];
  supplies = newData.supplies || [];
  equipments = newData.equipments || [];
  recipes = newData.recipes || [];
  recipeIngredients = newData.recipeIngredients || [];
  recipeSupplies = newData.recipeSupplies || [];
  recipeEquipments = newData.recipeEquipments || [];
  costoKwhGlobal = newData.costoKwhGlobal != null ? newData.costoKwhGlobal : 230;
  
  saveToLocalStorage();
}

// --- Persistencia Local (Cache de Sesión) ---

function saveToLocalStorage() {
  try {
    const data = getAllData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Error guardando caché local:", e);
    return false;
  }
}

export function forceSaveToLocalStorage() {
  return saveToLocalStorage();
}

export function initDataStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
    const data = JSON.parse(raw);
      replaceAllData(data); // Cargar caché
    } else {
      // Estado inicial vacío si no hay caché
      console.log("Iniciando con base de datos vacía. Importe un Excel para comenzar.");
    }
  } catch (e) {
    console.error("Error cargando caché local:", e);
  }
}

// --- CRUD: Ingredientes ---

export function getIngredients() { return [...ingredients]; }

export function createOrUpdateIngredient(payload) {
  const id = payload.id || generateId("ing");
  const existingIndex = ingredients.findIndex(i => i.id === id);
  
  const item = {
    id: id,
    nombre: payload.nombre,
    unidadMedida: payload.unidadMedida,
    formatoCantidad: normalizeNumber(payload.formatoCantidad, 0),
    formatoUnidad: payload.formatoUnidad,
    costoFormato: normalizeNumber(payload.costoFormato, 0),
    costoUnitario: normalizeNumber(payload.costoUnitario, 0), // Se puede recalcular si se desea
    proveedor: payload.proveedor
  };

  if (item.formatoCantidad > 0) {
    item.costoUnitario = item.costoFormato / item.formatoCantidad;
  }

  if (existingIndex >= 0) {
    ingredients[existingIndex] = item;
    } else {
    ingredients.push(item);
  }
  saveToLocalStorage();
}

export function deleteIngredient(id) {
  ingredients = ingredients.filter(i => i.id !== id);
  recipeIngredients = recipeIngredients.filter(r => r.ingredienteId !== id);
    saveToLocalStorage();
}

// --- CRUD: Insumos ---

export function getSupplies() { return [...supplies]; }

export function createOrUpdateSupply(payload) {
  const id = payload.id || generateId("sup");
  const existingIndex = supplies.findIndex(s => s.id === id);

  const item = {
    id: id,
    nombre: payload.nombre,
    formatoCantidad: normalizeNumber(payload.formatoCantidad, 0),
    formatoUnidad: payload.formatoUnidad,
    costoFormato: normalizeNumber(payload.costoFormato, 0),
    costoUnitario: 0
  };

  if (item.formatoCantidad > 0) {
    item.costoUnitario = item.costoFormato / item.formatoCantidad;
  }

  if (existingIndex >= 0) {
    supplies[existingIndex] = item;
  } else {
    supplies.push(item);
  }
  saveToLocalStorage();
}

export function deleteSupply(id) {
  supplies = supplies.filter(s => s.id !== id);
  recipeSupplies = recipeSupplies.filter(r => r.insumoId !== id);
  saveToLocalStorage();
}

// --- CRUD: Equipos ---

export function getEquipments() { return [...equipments]; }
export function getEquipmentById(id) { return equipments.find(e => e.id === id); }

export function createOrUpdateEquipment(payload) {
  const id = payload.id || generateId("eq");
  const existingIndex = equipments.findIndex(e => e.id === id);

  const item = {
    id: id,
    nombre: payload.nombre,
    potenciaWatts: normalizeNumber(payload.potenciaWatts, 0),
    costoKwh: payload.costoKwh,
    formulaKwh: payload.formulaKwh || "(potenciaWatts / 1000) * tiempoHoras"
  };

  if (existingIndex >= 0) {
    equipments[existingIndex] = item;
  } else {
    equipments.push(item);
  }
  saveToLocalStorage();
}

export function deleteEquipment(id) {
  equipments = equipments.filter(e => e.id !== id);
  recipeEquipments = recipeEquipments.filter(r => r.equipmentId !== id);
  saveToLocalStorage();
}

export function getCostoKwhGlobal() { return costoKwhGlobal; }
export function setCostoKwhGlobal(val) { 
  costoKwhGlobal = normalizeNumber(val, 230); 
  saveToLocalStorage();
}

// --- CRUD: Recetas ---

export function getRecipes() { return [...recipes]; }
export function getRecipeById(id) { return recipes.find(r => r.id === id); }

export function createOrUpdateRecipe(payload) {
  const id = payload.id || generateId("rec");
  const existingIndex = recipes.findIndex(r => r.id === id);

  const item = {
    id: id,
    nombreReceta: payload.nombreReceta,
    descripcion: payload.descripcion,
    rendimientoBase: normalizeNumber(payload.rendimientoBase, 1),
    tiempoHornoMinutos: payload.tiempoHornoMinutos,
    temperaturaHorno: payload.temperaturaHorno,
    pasosPreparacion: payload.pasosPreparacion
  };

  if (existingIndex >= 0) {
    recipes[existingIndex] = item;
  } else {
    recipes.push(item);
  }
  saveToLocalStorage();
  return id;
}

export function deleteRecipe(id) {
  recipes = recipes.filter(r => r.id !== id);
  recipeIngredients = recipeIngredients.filter(r => r.recetaId !== id);
  recipeSupplies = recipeSupplies.filter(r => r.recetaId !== id);
  recipeEquipments = recipeEquipments.filter(r => r.recetaId !== id);
  saveToLocalStorage();
}

export function removeDuplicateRecipes() {
  // Stub para compatibilidad si se llama desde main, aunque ya no debería ser necesaria con Excel
  return 0;
}

// --- CRUD: Relaciones Receta ---

export function getRecipeIngredientsByRecipeId(rid) { return recipeIngredients.filter(r => r.recetaId === rid); }
export function getRecipeSuppliesByRecipeId(rid) { return recipeSupplies.filter(r => r.recetaId === rid); }
export function getRecipeEquipmentsByRecipeId(rid) { return recipeEquipments.filter(r => r.recetaId === rid); }

export function createOrUpdateRecipeIngredient(payload) {
  if (payload.id) {
    const idx = recipeIngredients.findIndex(r => r.id === payload.id);
    if (idx >= 0) recipeIngredients[idx] = { ...recipeIngredients[idx], ...payload };
  } else {
    recipeIngredients.push({ ...payload, id: generateId("rIng") });
  }
  saveToLocalStorage();
}

export function createOrUpdateRecipeSupply(payload) {
  if (payload.id) {
    const idx = recipeSupplies.findIndex(r => r.id === payload.id);
    if (idx >= 0) recipeSupplies[idx] = { ...recipeSupplies[idx], ...payload };
  } else {
    recipeSupplies.push({ ...payload, id: generateId("rSup") });
  }
  saveToLocalStorage();
}

export function createOrUpdateRecipeEquipment(payload) {
  if (payload.id) {
    const idx = recipeEquipments.findIndex(r => r.id === payload.id);
    if (idx >= 0) recipeEquipments[idx] = { ...recipeEquipments[idx], ...payload };
    } else {
    recipeEquipments.push({ ...payload, id: generateId("rEq") });
  }
    saveToLocalStorage();
}

export function deleteRecipeIngredient(id) {
  recipeIngredients = recipeIngredients.filter(r => r.id !== id);
  saveToLocalStorage();
}
export function deleteRecipeSupply(id) {
  recipeSupplies = recipeSupplies.filter(r => r.id !== id);
  saveToLocalStorage();
}
export function deleteRecipeEquipment(id) {
  recipeEquipments = recipeEquipments.filter(r => r.id !== id);
    saveToLocalStorage();
}

// --- Stubs para exportación antigua (para evitar romper main.js inmediatamente) ---
export function exportToCSV() { return ""; }
export function importFromCSV() { return {}; }
