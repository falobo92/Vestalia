// js/main.js - Main application logic

import {
  initDataStore,
  getIngredients,
  createOrUpdateIngredient,
  deleteIngredient,
  getSupplies,
  createOrUpdateSupply,
  deleteSupply,
  getEquipments,
  createOrUpdateEquipment,
  deleteEquipment,
  getRecipes,
  getRecipeById,
  createOrUpdateRecipe,
  deleteRecipe,
  getRecipeIngredientsByRecipeId,
  createOrUpdateRecipeIngredient,
  deleteRecipeIngredient,
  getRecipeSuppliesByRecipeId,
  createOrUpdateRecipeSupply,
  deleteRecipeSupply,
  getRecipeEquipmentsByRecipeId,
  createOrUpdateRecipeEquipment,
  deleteRecipeEquipment,
  getAllData,
  replaceAllData,
  getCostoKwhGlobal,
  setCostoKwhGlobal,
  forceSaveToLocalStorage,
} from "./dataStore.js";

import { exportDatabaseToExcel, importDatabaseFromExcel } from "./excelManager.js";
import { loadLegacyData } from "./seedLegacyData.js";

import { calculateRecipeCost, formatCLP, formatQuantity } from "./calculations.js";
import { normalizeNumber } from "./dataStore.js";

import {
  getElement,
  showView,
  renderRecipesList,
  filterRecipes,
  showSelectedRecipe,
  renderCalculationResults,
  renderConsolidatedShoppingList,
  renderIngredientsChart,
  renderRecipesBreakdown,
  initResultsTabs,
  showCalculationResults,
  updateSummary,
  initAdminTabs,
  renderAdminRecipesList,
  renderAdminIngredientsList,
  renderAdminSuppliesList,
  renderAdminEquipmentsList,
  showModal,
  hideModal,
  createIngredientForm,
  createSupplyForm,
  createEquipmentForm,
  createRecipeForm,
} from "./ui.js";

/* --------- Estado de la aplicación --------- */
let selectedRecipes = []; // Array de {recipeId, cantidad, recipe}
let currentView = "calculator";
let currentAdminTab = "recipes";
let allRecipes = [];
let allIngredients = [];
let allSupplies = [];
let allEquipments = [];
let lastCalculationResult = null; // Guardar resultado del último cálculo para exportación

/* --------- Inicialización --------- */
document.addEventListener("DOMContentLoaded", () => {
  initDataStore();
  initNavigation();
  initCalculatorView();
  initAdminView();
  refreshAllData();

  // Año en el footer
  const yearEl = getElement("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* --------- Navegación --------- */
function initNavigation() {
  const navCalculator = getElement("nav-calculator");
  const navAdmin = getElement("nav-admin");

  navCalculator.addEventListener("click", () => {
    currentView = "calculator";
    showView("calculator");
    refreshCalculatorView();
  });

  navAdmin.addEventListener("click", () => {
    currentView = "admin";
    showView("admin");
    refreshAdminView();
  });

  // Cerrar modal al hacer clic fuera
  const modalOverlay = getElement("modal-overlay");
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      hideModal();
    }
  });

  const modalClose = getElement("modal-close");
  modalClose.addEventListener("click", hideModal);
}

/* --------- Vista Calculadora --------- */
function initCalculatorView() {
  // Inicializar tabs de resultados
  initResultsTabs();

  const searchInput = getElement("search-recipes");
  const recipesList = getElement("recipes-list");
  const btnCalcular = getElement("btn-calcular");

  // Buscador
  searchInput.addEventListener("input", (e) => {
    const filtered = filterRecipes(allRecipes, e.target.value);
    renderRecipesList(filtered, recipesList, null, (recipe) => {
      addRecipeToShoppingList(recipe);
    });
  });

  // Botón calcular
  btnCalcular.addEventListener("click", performCalculation);

  // Botones de exportación
  const btnExportCSV = getElement("btn-export-csv-shopping");
  const btnExportHTML = getElement("btn-export-html-shopping");

  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => {
      if (!lastCalculationResult) {
        alert("No hay lista de compras para exportar. Calcula primero.");
        return;
      }
      showExportOptionsModal("csv");
    });
  }

  if (btnExportHTML) {
    btnExportHTML.addEventListener("click", () => {
      if (!lastCalculationResult) {
        alert("No hay lista de compras para exportar. Calcula primero.");
        return;
      }
      showExportOptionsModal("html");
    });
  }

  renderSelectedRecipesList();
}

function refreshCalculatorView() {
  const recipesList = getElement("recipes-list");
  const searchInput = getElement("search-recipes");

  const searchTerm = searchInput.value || "";
  const filtered = filterRecipes(allRecipes, searchTerm);
  renderRecipesList(filtered, recipesList, null, (recipe) => {
    addRecipeToShoppingList(recipe);
  });

  renderSelectedRecipesList();
  showCalculationResults(false);
}

function addRecipeToShoppingList(recipe) {
  if (!recipe || !recipe.id) return;

  // Verificar si ya está en la lista
  const existing = selectedRecipes.find(r => r.recipeId === recipe.id);
  if (existing) {
    // Si ya existe, incrementar cantidad
    existing.cantidad = (existing.cantidad || 1) + 1;
  } else {
    // Agregar nueva receta con cantidad inicial de 1
    selectedRecipes.push({
      recipeId: recipe.id,
      cantidad: 1,
      recipe: recipe
    });
  }

  renderSelectedRecipesList();
}

function removeRecipeFromShoppingList(recipeId) {
  selectedRecipes = selectedRecipes.filter(r => r.recipeId !== recipeId);
  renderSelectedRecipesList();
}

function updateRecipeQuantity(recipeId, cantidad) {
  const item = selectedRecipes.find(r => r.recipeId === recipeId);
  if (item) {
    item.cantidad = Math.max(1, normalizeNumber(cantidad, 1));
    renderSelectedRecipesList();
  }
}

function renderSelectedRecipesList() {
  const container = getElement("selected-recipes-list");
  const emptyState = getElement("no-recipes-selected");

  if (!container) return;

  // Limpiar contenedor
  container.innerHTML = "";

  if (selectedRecipes.length === 0) {
    if (emptyState) {
      container.appendChild(emptyState);
    } else {
      const empty = document.createElement("div");
      empty.id = "no-recipes-selected";
      empty.className = "empty-state-small";
      empty.innerHTML = "<p>Agrega recetas desde la lista de la izquierda</p>";
      container.appendChild(empty);
    }
    return;
  }

  selectedRecipes.forEach((item) => {
    const div = document.createElement("div");
    div.className = "selected-recipe-item";
    div.innerHTML = `
      <label class="selected-recipe-item-label">
        <div class="selected-recipe-item-content">
          <div class="selected-recipe-item-main">
            <span class="selected-recipe-item-name">${item.recipe.nombreReceta}</span>
            <span class="selected-recipe-item-meta">Rendimiento: ${item.recipe.rendimientoBase || 1} unidades</span>
          </div>
          <div class="selected-recipe-controls">
            <label class="quantity-label">Cantidad:</label>
            <input type="number" 
                   class="recipe-quantity-input" 
                   value="${item.cantidad}" 
                   min="1" 
                   step="1"
                   data-recipe-id="${item.recipeId}" />
          </div>
        </div>
        <button class="btn-remove-recipe" data-recipe-id="${item.recipeId}" title="Eliminar" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 1.125rem; height: 1.125rem;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </label>
    `;

    // Event listeners
    const input = div.querySelector(".recipe-quantity-input");
    input.addEventListener("change", (e) => {
      updateRecipeQuantity(item.recipeId, e.target.value);
    });

    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    const btnRemove = div.querySelector(".btn-remove-recipe");
    btnRemove.addEventListener("click", (e) => {
      e.stopPropagation();
      removeRecipeFromShoppingList(item.recipeId);
    });

    container.appendChild(div);
  });
}

function performCalculation() {
  if (selectedRecipes.length === 0) {
    alert("Por favor, agrega al menos una receta a la lista.");
    return;
  }

  // Consolidar ingredientes, insumos y electrodomésticos de todas las recetas
  const consolidatedIngredients = new Map(); // key: ingredienteId, value: {ingrediente, cantidadTotal, costoTotal}
  const consolidatedSupplies = new Map(); // key: insumoId, value: {insumo, cantidadTotal, costoTotal}
  const consolidatedEquipments = new Map(); // key: equipmentId, value: {equipment, tiempoTotal, costoTotal}

  let totalUnidades = 0;
  let totalCosto = 0;

  const ingredientMap = new Map(allIngredients.map((i) => [i.id, i]));
  const supplyMap = new Map(allSupplies.map((s) => [s.id, s]));
  const equipmentMap = new Map(allEquipments.map((e) => [e.id, e]));

  // Procesar cada receta seleccionada
  selectedRecipes.forEach((selectedItem) => {
    const receta = selectedItem.recipe;
    const cantidadRecetas = selectedItem.cantidad;
    const unidadesPorReceta = receta.rendimientoBase || 1;
    const unidadesTotales = cantidadRecetas * unidadesPorReceta;
    totalUnidades += unidadesTotales;

    const detalleIngRaw = getRecipeIngredientsByRecipeId(receta.id);
    const detalleSupRaw = getRecipeSuppliesByRecipeId(receta.id);
    const detalleEqRaw = getRecipeEquipmentsByRecipeId(receta.id);

    // Consolidar ingredientes
    detalleIngRaw.forEach((ri) => {
      const ingrediente = ingredientMap.get(ri.ingredienteId);
      if (!ingrediente) return;

      const cantidadNecesaria = (normalizeNumber(ri.cantidadPorRendimientoBase, 0) / unidadesPorReceta) * unidadesTotales;
      const costoIngrediente = cantidadNecesaria * normalizeNumber(ingrediente.costoUnitario, 0);

      if (consolidatedIngredients.has(ri.ingredienteId)) {
        const existing = consolidatedIngredients.get(ri.ingredienteId);
        existing.cantidadTotal += cantidadNecesaria;
        existing.costoTotal += costoIngrediente;
      } else {
        consolidatedIngredients.set(ri.ingredienteId, {
          ingrediente,
          cantidadTotal: cantidadNecesaria,
          costoTotal: costoIngrediente
        });
      }
    });

    // Consolidar insumos
    detalleSupRaw.forEach((rs) => {
      const insumo = supplyMap.get(rs.insumoId);
      if (!insumo) return;

      const cantidadNecesaria = (normalizeNumber(rs.cantidadPorRendimientoBase, 0) / unidadesPorReceta) * unidadesTotales;
      const costoInsumo = cantidadNecesaria * normalizeNumber(insumo.costoUnitario, 0);

      if (consolidatedSupplies.has(rs.insumoId)) {
        const existing = consolidatedSupplies.get(rs.insumoId);
        existing.cantidadTotal += cantidadNecesaria;
        existing.costoTotal += costoInsumo;
      } else {
        consolidatedSupplies.set(rs.insumoId, {
          insumo,
          cantidadTotal: cantidadNecesaria,
          costoTotal: costoInsumo
        });
      }
    });

    // Consolidar electrodomésticos (sumar tiempos)
    detalleEqRaw.forEach((re) => {
      const equipment = equipmentMap.get(re.equipmentId);
      if (!equipment) return;

      const tiempoTotal = normalizeNumber(re.tiempoHoras, 0) * cantidadRecetas;
      const potenciaWatts = normalizeNumber(equipment.potenciaWatts, 0);
      const costoKwh = (equipment.costoKwh != null && equipment.costoKwh > 0) ? normalizeNumber(equipment.costoKwh, 230) : getCostoKwhGlobal();
      const consumoKwh = (potenciaWatts / 1000) * tiempoTotal;
      const costoEnergia = consumoKwh * normalizeNumber(costoKwh, 230);

      if (consolidatedEquipments.has(re.equipmentId)) {
        const existing = consolidatedEquipments.get(re.equipmentId);
        existing.tiempoTotal += tiempoTotal;
        existing.costoTotal += costoEnergia;
      } else {
        consolidatedEquipments.set(re.equipmentId, {
          equipment,
          tiempoTotal: tiempoTotal,
          costoTotal: costoEnergia
        });
      }
    });
  });

  // Convertir a formato de resultado
  const ingredientRows = Array.from(consolidatedIngredients.values()).map(item => ({
    nombre: item.ingrediente.nombre,
    proveedor: item.ingrediente.proveedor || "Sin proveedor",
    cantidadRequerida: item.cantidadTotal,
    unidad: item.ingrediente.unidadMedida || "g",
    costoIngrediente: item.costoTotal
  }));

  const supplyRows = Array.from(consolidatedSupplies.values()).map(item => ({
    nombre: item.insumo.nombre,
    cantidadRequerida: item.cantidadTotal,
    unidad: item.insumo.formatoUnidad || "unidad",
    costoInsumo: item.costoTotal
  }));

  const equipmentRows = Array.from(consolidatedEquipments.values()).map(item => ({
    nombre: item.equipment.nombre,
    tiempoHoras: item.tiempoTotal,
    consumoKwh: (item.equipment.potenciaWatts / 1000) * item.tiempoTotal,
    costoEnergia: item.costoTotal
  }));

  const totalIngredients = ingredientRows.reduce((sum, r) => sum + r.costoIngrediente, 0);
  const totalSupplies = supplyRows.reduce((sum, r) => sum + r.costoInsumo, 0);
  const totalEnergy = equipmentRows.reduce((sum, r) => sum + r.costoEnergia, 0);
  totalCosto = totalIngredients + totalSupplies + totalEnergy;

  const result = {
    ingredientRows,
    supplyRows,
    equipmentRows,
    totalIngredients,
    totalSupplies,
    totalEnergy,
    total: totalCosto,
    unitario: totalUnidades > 0 ? totalCosto / totalUnidades : 0,
    unidadesSolicitadas: totalUnidades
  };

  const tbodyEl = getElement("tabla-resultados-body");
  renderConsolidatedShoppingList(result, tbodyEl);

  // Calcular desglose por receta para el tab "Por Receta"
  const recipesBreakdownData = [];
  selectedRecipes.forEach((selectedItem) => {
    const receta = selectedItem.recipe;
    const cantidadRecetas = selectedItem.cantidad;
    const unidadesPorReceta = receta.rendimientoBase || 1;
    const unidadesTotales = cantidadRecetas * unidadesPorReceta;

    const detalleIngRaw = getRecipeIngredientsByRecipeId(receta.id);
    const detalleSupRaw = getRecipeSuppliesByRecipeId(receta.id);
    const detalleEqRaw = getRecipeEquipmentsByRecipeId(receta.id);

    const detalleIngredientes = detalleIngRaw.map((ri) => ({
      detalleId: ri.id,
      ingrediente: ingredientMap.get(ri.ingredienteId),
      cantidadBase: ri.cantidadPorRendimientoBase,
    }));

    const detalleInsumos = detalleSupRaw.map((rs) => ({
      detalleId: rs.id,
      insumo: supplyMap.get(rs.insumoId),
      cantidadBase: rs.cantidadPorRendimientoBase,
    }));

    const detalleEquipments = detalleEqRaw.map((re) => ({
      detalleId: re.id,
      equipment: equipmentMap.get(re.equipmentId),
      tiempoHoras: re.tiempoHoras,
    }));

    const recipeResult = calculateRecipeCost({
      receta,
      detalleIngredientes,
      detalleInsumos,
      detalleEquipments,
      unidadesSolicitadas: unidadesTotales,
      costoKwhGlobal: getCostoKwhGlobal(),
    });

    recipesBreakdownData.push({
      recipe: receta,
      cantidad: cantidadRecetas,
      ...recipeResult
    });
  });

  // Renderizar desglose por receta
  renderRecipesBreakdown(recipesBreakdownData);

  // Renderizar gráfico de costos más incidentes (incluye ingredientes, insumos y energía)
  const allCostItems = [];

  // Agregar ingredientes
  if (result.ingredientRows && result.ingredientRows.length > 0) {
    result.ingredientRows.forEach(row => {
      allCostItems.push({
        nombre: row.nombre,
        costo: row.costoIngrediente,
        tipo: 'Ingrediente',
        categoria: 'ingredientes'
      });
    });
  }

  // Agregar insumos
  if (result.supplyRows && result.supplyRows.length > 0) {
    result.supplyRows.forEach(row => {
      allCostItems.push({
        nombre: row.nombre,
        costo: row.costoInsumo,
        tipo: 'Insumo',
        categoria: 'insumos'
      });
    });
  }

  // Agregar energía
  if (result.equipmentRows && result.equipmentRows.length > 0) {
    result.equipmentRows.forEach(row => {
      allCostItems.push({
        nombre: row.nombre,
        costo: row.costoEnergia,
        tipo: 'Energía',
        categoria: 'energia'
      });
    });
  }

  // Renderizar gráfico con todos los costos
  const totalCostoGrafico = result.total || 0;
  if (allCostItems.length > 0 && totalCostoGrafico > 0) {
    renderIngredientsChart(allCostItems, totalCostoGrafico);
  } else {
    const chartContainer = getElement("ingredients-chart-container");
    if (chartContainer) chartContainer.style.display = "none";
  }

  updateSummary({
    total: result.total,
    unitario: result.unitario,
    unidades: totalUnidades,
    recetasCount: selectedRecipes.length
  });

  // Guardar resultado para exportación
  lastCalculationResult = result;

  showCalculationResults(true);
}

/* --------- Vista Administración --------- */
function initAdminView() {
  initAdminTabs();

  // Tabs
  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentAdminTab = btn.dataset.tab;
      refreshAdminView();
    });
  });

  // Botón agregar
  const btnAdd = getElement("btn-add-item");
  btnAdd.addEventListener("click", () => {
    openAddModal();
  });

  // Campos de búsqueda
  const searchRecipes = getElement("search-recipes");
  if (searchRecipes) {
    searchRecipes.addEventListener("input", () => {
      if (currentAdminTab === "recipes") {
        refreshAdminView();
      }
    });
  }

  const searchIngredients = getElement("search-ingredients");
  if (searchIngredients) {
    searchIngredients.addEventListener("input", () => {
      if (currentAdminTab === "ingredients") {
        refreshAdminView();
      }
    });
  }

  const groupByProvider = getElement("group-by-provider");
  if (groupByProvider) {
    groupByProvider.addEventListener("change", () => {
      if (currentAdminTab === "ingredients") {
        refreshAdminView();
      }
    });
  }

  const searchSupplies = getElement("search-supplies");
  if (searchSupplies) {
    searchSupplies.addEventListener("input", () => {
      if (currentAdminTab === "supplies") {
        refreshAdminView();
      }
    });
  }

  const searchEquipments = getElement("search-equipments");
  if (searchEquipments) {
    searchEquipments.addEventListener("input", () => {
      if (currentAdminTab === "equipments") {
        refreshAdminView();
      }
    });
  }

  // Botón guardar costo global KWh
  const btnSaveGlobalKwh = getElement("btn-save-global-kwh");
  if (btnSaveGlobalKwh) {
    btnSaveGlobalKwh.addEventListener("click", () => {
      const input = getElement("global-kwh-cost");
      if (!input) return;

      const valor = Number(input.value);
      if (isNaN(valor) || valor < 0) {
        alert("Por favor, ingresa un valor válido mayor o igual a 0.");
        return;
      }

      setCostoKwhGlobal(valor);

      // Actualizar la vista de administración, especialmente si estamos en el tab de equipos
      if (currentAdminTab === "equipments") {
        // Recargar equipos y re-renderizar para mostrar el nuevo valor global
        allEquipments = getEquipments();
        renderAdminEquipmentsList(
          allEquipments,
          getElement("equipments-admin-list"),
          (eq) => openEditEquipmentModal(eq),
          (id) => handleDeleteEquipment(id)
        );
      } else if (currentAdminTab === "settings") {
        // Solo actualizar el input en el tab de configuración
        refreshAdminView();
      } else {
        refreshAdminView();
      }

      // Mostrar mensaje de confirmación de forma no bloqueante
      setTimeout(() => {
        alert(`Costo global de KWh actualizado a ${valor.toLocaleString("es-CL")} CLP`);
      }, 10);
    });
  }

  // Botones de importar/exportar (Excel)
  const btnExport = getElement("btn-export-csv");
  const btnImport = getElement("btn-import-csv");
  const fileInput = getElement("csv-file-input"); // Reutilizamos el ID del input aunque sea excel

  // Actualizar textos de UI para reflejar Excel
  if (btnExport) btnExport.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 1rem; height: 1rem; margin-right: 0.5rem;">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Exportar Excel
  `;
  
  if (btnImport) btnImport.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 1rem; height: 1rem; margin-right: 0.5rem;">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
    Importar Excel
  `;

  if (fileInput) fileInput.accept = ".xlsx, .xls";

  if (btnExport) {
    btnExport.addEventListener("click", () => {
      try {
        const data = getAllData();
        exportDatabaseToExcel(data);
        alert("Base de datos exportada a Excel exitosamente.");
      } catch (error) {
        console.error(error);
        alert("Error al exportar: " + error.message);
      }
    });
  }

  if (btnImport && fileInput) {
    btnImport.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Importar datos desde Excel
        const newState = await importDatabaseFromExcel(file);
        
        // Reemplazar estado en memoria y guardar caché
        replaceAllData(newState);
        
        // Refrescar UI
        refreshAllData();

        const totalRecetas = newState.recipes.length;
        alert(`Importación exitosa.\nSe cargaron ${totalRecetas} recetas y sus componentes.`);
        
        fileInput.value = "";
      } catch (error) {
        console.error(error);
        alert("Error al importar Excel: " + error.message);
        fileInput.value = "";
      }
    });
  }

  // Botón Restaurar Datos Fábrica
  const btnRestore = getElement("btn-restore-legacy");
  if (btnRestore) {
    btnRestore.addEventListener("click", () => {
      if (confirm("¿Estás seguro? Esto BORRARÁ todos los datos actuales y restaurará los datos de ejemplo originales.")) {
        try {
          const stats = loadLegacyData();
          refreshAllData();
          alert(`Datos restaurados correctamente.\n- ${stats.recipeCount} recetas\n- ${stats.ingredientCount} ingredientes\n\nAhora puedes usar 'Exportar Excel' para obtener el archivo.`);
        } catch (e) {
          console.error(e);
          alert("Error al restaurar datos: " + e.message);
        }
      }
    });
  }
}

function refreshAdminView() {
  // Actualizar badges
  updateAdminBadges();

  // Obtener término de búsqueda según el tab activo
  let searchTerm = "";
  switch (currentAdminTab) {
    case "recipes":
      const searchRecipes = getElement("search-recipes");
      searchTerm = searchRecipes ? searchRecipes.value : "";
      renderAdminRecipesList(
        allRecipes,
        getElement("recipes-admin-list"),
        (recipe) => openEditRecipeModal(recipe),
        (id) => handleDeleteRecipe(id),
        searchTerm
      );
      break;
    case "ingredients":
      const searchIngredients = getElement("search-ingredients");
      const groupByProvider = getElement("group-by-provider");
      searchTerm = searchIngredients ? searchIngredients.value : "";
      const shouldGroup = groupByProvider ? groupByProvider.checked : false;
      renderAdminIngredientsList(
        allIngredients,
        getElement("ingredients-admin-list"),
        (ing) => openEditIngredientModal(ing),
        (id) => handleDeleteIngredient(id),
        searchTerm,
        shouldGroup
      );
      break;
    case "supplies":
      const searchSupplies = getElement("search-supplies");
      searchTerm = searchSupplies ? searchSupplies.value : "";
      renderAdminSuppliesList(
        allSupplies,
        getElement("supplies-admin-list"),
        (sup) => openEditSupplyModal(sup),
        (id) => handleDeleteSupply(id),
        searchTerm
      );
      break;
    case "equipments":
      const searchEquipments = getElement("search-equipments");
      searchTerm = searchEquipments ? searchEquipments.value : "";
      renderAdminEquipmentsList(
        allEquipments,
        getElement("equipments-admin-list"),
        (eq) => openEditEquipmentModal(eq),
        (id) => handleDeleteEquipment(id),
        searchTerm
      );
      break;
    case "settings":
      // Cargar el valor actual del costo global de KWh
      const globalKwhInput = getElement("global-kwh-cost");
      if (globalKwhInput) {
        globalKwhInput.value = getCostoKwhGlobal();
      }
      break;
  }
}

function updateAdminBadges() {
  const badgeRecipes = getElement("badge-recipes");
  const badgeIngredients = getElement("badge-ingredients");
  const badgeSupplies = getElement("badge-supplies");
  const badgeEquipments = getElement("badge-equipments");

  if (badgeRecipes) badgeRecipes.textContent = allRecipes.length;
  if (badgeIngredients) badgeIngredients.textContent = allIngredients.length;
  if (badgeSupplies) badgeSupplies.textContent = allSupplies.length;
  if (badgeEquipments) badgeEquipments.textContent = allEquipments.length;
}

function openAddModal() {
  switch (currentAdminTab) {
    case "settings":
      // No hay modal para agregar en configuración
      return;
    case "recipes":
      openEditRecipeModal(null);
      break;
    case "ingredients":
      openEditIngredientModal(null);
      break;
    case "supplies":
      openEditSupplyModal(null);
      break;
    case "equipments":
      openEditEquipmentModal(null);
      break;
  }
}

function openEditIngredientModal(ingredient) {
  const form = createIngredientForm(
    ingredient,
    allIngredients,
    allSupplies,
    (payload) => {
      createOrUpdateIngredient(payload);
      refreshAllData();
      hideModal();
    },
    hideModal
  );
  showModal(
    ingredient ? "Editar Ingrediente" : "Agregar Ingrediente",
    form
  );
}

function openEditSupplyModal(supply) {
  const form = createSupplyForm(
    supply,
    (payload) => {
      createOrUpdateSupply(payload);
      refreshAllData();
      hideModal();
    },
    hideModal
  );
  showModal(supply ? "Editar Insumo" : "Agregar Insumo", form);
}

function openEditEquipmentModal(equipment) {
  const form = createEquipmentForm(
    equipment,
    (payload) => {
      createOrUpdateEquipment(payload);
      refreshAllData();
      hideModal();
    },
    hideModal
  );
  showModal(equipment ? "Editar Electrodoméstico" : "Agregar Electrodoméstico", form);
}

function openEditRecipeModal(recipe) {
  // Cargar datos existentes de la receta
  let existingIngredients = [];
  let existingSupplies = [];
  let existingEquipments = [];

  if (recipe?.id) {
    const oldIngs = getRecipeIngredientsByRecipeId(recipe.id);
    const oldSups = getRecipeSuppliesByRecipeId(recipe.id);
    const oldEqs = getRecipeEquipmentsByRecipeId(recipe.id);

    existingIngredients = oldIngs.map(ri => ({
      ingredienteId: ri.ingredienteId,
      cantidad: ri.cantidadPorRendimientoBase
    }));

    existingSupplies = oldSups.map(rs => ({
      insumoId: rs.insumoId,
      cantidad: rs.cantidadPorRendimientoBase
    }));

    existingEquipments = oldEqs.map(re => ({
      equipmentId: re.equipmentId,
      tiempoHoras: re.tiempoHoras
    }));
  }

  const recipeWithRelations = {
    ...recipe,
    ingredientes: existingIngredients,
    insumos: existingSupplies,
    equipments: existingEquipments,
  };

  const form = createRecipeForm(
    recipeWithRelations,
    allIngredients,
    allSupplies,
    allEquipments,
    (payload) => {
      // Convertir ingredientes, insumos y electrodomésticos a formato de relaciones
      // Crear/actualizar receta base y obtener el ID
      const recipeId = createOrUpdateRecipe({
        id: payload.id || null,
        nombreReceta: payload.nombreReceta,
        descripcion: payload.descripcion,
        rendimientoBase: payload.rendimientoBase,
        tiempoHornoMinutos: payload.tiempoHornoMinutos,
        temperaturaHorno: payload.temperaturaHorno,
        pasosPreparacion: payload.pasosPreparacion,
      });

      // Eliminar relaciones antiguas
      if (recipe?.id) {
        const oldIngs = getRecipeIngredientsByRecipeId(recipe.id);
        const oldSups = getRecipeSuppliesByRecipeId(recipe.id);
        const oldEqs = getRecipeEquipmentsByRecipeId(recipe.id);
        oldIngs.forEach((ri) => deleteRecipeIngredient(ri.id));
        oldSups.forEach((rs) => deleteRecipeSupply(rs.id));
        oldEqs.forEach((re) => deleteRecipeEquipment(re.id));
      }

      // Crear nuevas relaciones de ingredientes
      (payload.ingredientes || []).forEach((ing) => {
        createOrUpdateRecipeIngredient({
          recetaId: recipeId,
          ingredienteId: ing.ingredienteId,
          cantidadPorRendimientoBase: ing.cantidad,
        });
      });

      // Crear nuevas relaciones de insumos
      (payload.insumos || []).forEach((sup) => {
        createOrUpdateRecipeSupply({
          recetaId: recipeId,
          insumoId: sup.insumoId,
          cantidadPorRendimientoBase: sup.cantidad,
        });
      });

      // Crear nuevas relaciones de electrodomésticos
      (payload.equipments || []).forEach((eq) => {
        createOrUpdateRecipeEquipment({
          recetaId: recipeId,
          equipmentId: eq.equipmentId,
          tiempoHoras: eq.tiempoHoras,
        });
      });

      // Forzar guardado final explícito después de todas las operaciones
      // Cada función individual ya guarda, pero hacemos un guardado final para asegurar
      const saved = forceSaveToLocalStorage();
      if (!saved) {
        console.error("Advertencia: No se pudo verificar el guardado final");
      }

      // Refrescar datos locales después del guardado
      refreshAllData();

      // Verificar que la receta se guardó correctamente
      const savedRecipe = getRecipeById(recipeId);
      if (!savedRecipe) {
        console.error("Error: La receta no se encontró después de guardar. RecipeId:", recipeId);
        console.log("Recetas actuales:", allRecipes.map(r => ({ id: r.id, nombre: r.nombreReceta })));
        alert("Error al guardar la receta. Por favor, intenta nuevamente.");
        return;
      }

      console.log("Receta guardada exitosamente:", savedRecipe.nombreReceta, "ID:", recipeId);
      hideModal();
    },
    hideModal
  );
  showModal(recipe ? "Editar Receta" : "Agregar Receta", form);
}

function generateRecipeId() {
  return `rec_${crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(16).slice(2)}`;
}

function handleDeleteIngredient(id) {
  if (confirm("¿Estás seguro de que quieres eliminar este ingrediente?")) {
    deleteIngredient(id);
    allIngredients = allIngredients.filter((ing) => ing.id !== id);
    refreshAdminView();
    updateAdminBadges();
  }
}

function handleDeleteSupply(id) {
  if (confirm("¿Estás seguro de que quieres eliminar este insumo?")) {
    deleteSupply(id);
    allSupplies = allSupplies.filter((sup) => sup.id !== id);
    refreshAdminView();
    updateAdminBadges();
  }
}

function handleDeleteEquipment(id) {
  if (confirm("¿Estás seguro de que quieres eliminar este electrodoméstico?")) {
    deleteEquipment(id);
    allEquipments = allEquipments.filter((eq) => eq.id !== id);
    refreshAdminView();
    updateAdminBadges();
  }
}

function handleDeleteRecipe(id) {
  if (confirm("¿Estás seguro de que quieres eliminar esta receta?")) {
    deleteRecipe(id);
    // Limpiar selección si la receta eliminada estaba seleccionada
    if (currentRecipeId === id) {
      currentRecipeId = null;
      // Limpiar vista de calculadora si estaba seleccionada
      const selectedRecipeEl = document.querySelector(".recipe-list-item.selected");
      if (selectedRecipeEl) {
        selectedRecipeEl.classList.remove("selected");
      }
      showSelectedRecipe(null);
    }
    allRecipes = allRecipes.filter((rec) => rec.id !== id);
    refreshAdminView();
    updateAdminBadges();
  }
}

/* --------- Refrescar todos los datos --------- */
function refreshAllData() {
  allRecipes = getRecipes();
  allIngredients = getIngredients();
  allSupplies = getSupplies();
  allEquipments = getEquipments();

  // Actualizar badges siempre que cambian los datos
  updateAdminBadges();

  if (currentView === "calculator") {
    refreshCalculatorView();
  } else if (currentView === "admin") {
    refreshAdminView();
  }
}

/* --------- Modal de opciones de exportación --------- */
function showExportOptionsModal(format) {
  if (!lastCalculationResult) {
    alert("No hay datos para exportar. Calcula primero.");
    return;
  }

  const form = document.createElement("div");
  form.className = "export-options-form";
  form.style.padding = "1.5rem";

  const title = document.createElement("h3");
  title.style.marginTop = "0";
  title.style.marginBottom = "1.5rem";
  title.style.color = "var(--color-5)";
  title.textContent = `Seleccionar categorías para exportar (${format.toUpperCase()})`;

  const optionsDiv = document.createElement("div");
  optionsDiv.style.display = "flex";
  optionsDiv.style.flexDirection = "column";
  optionsDiv.style.gap = "1rem";

  // Checkbox para ingredientes
  const hasIngredients = lastCalculationResult.ingredientRows && lastCalculationResult.ingredientRows.length > 0;
  const ingCheckbox = document.createElement("label");
  ingCheckbox.style.display = "flex";
  ingCheckbox.style.alignItems = "center";
  ingCheckbox.style.gap = "0.75rem";
  ingCheckbox.style.cursor = "pointer";
  ingCheckbox.style.padding = "0.75rem";
  ingCheckbox.style.borderRadius = "0.5rem";
  ingCheckbox.style.border = "2px solid var(--gray-border)";
  ingCheckbox.style.backgroundColor = hasIngredients ? "var(--white)" : "var(--gray-light)";
  ingCheckbox.innerHTML = `
    <input type="checkbox" id="export-ingredients" ${hasIngredients ? "checked" : ""} ${hasIngredients ? "" : "disabled"} style="width: 1.25rem; height: 1.25rem; cursor: pointer;" />
    <div style="flex: 1;">
      <div style="font-weight: 600; color: var(--color-5);">Ingredientes</div>
      <div style="font-size: 0.875rem; color: var(--gray-medium);">
        ${hasIngredients ? `${lastCalculationResult.ingredientRows.length} ingredientes - ${formatCLP(lastCalculationResult.totalIngredients || 0)}` : "Sin ingredientes"}
      </div>
    </div>
  `;

  // Checkbox para insumos
  const hasSupplies = lastCalculationResult.supplyRows && lastCalculationResult.supplyRows.length > 0;
  const supCheckbox = document.createElement("label");
  supCheckbox.style.display = "flex";
  supCheckbox.style.alignItems = "center";
  supCheckbox.style.gap = "0.75rem";
  supCheckbox.style.cursor = "pointer";
  supCheckbox.style.padding = "0.75rem";
  supCheckbox.style.borderRadius = "0.5rem";
  supCheckbox.style.border = "2px solid var(--gray-border)";
  supCheckbox.style.backgroundColor = hasSupplies ? "var(--white)" : "var(--gray-light)";
  supCheckbox.innerHTML = `
    <input type="checkbox" id="export-supplies" ${hasSupplies ? "checked" : ""} ${hasSupplies ? "" : "disabled"} style="width: 1.25rem; height: 1.25rem; cursor: pointer;" />
    <div style="flex: 1;">
      <div style="font-weight: 600; color: var(--color-5);">Insumos</div>
      <div style="font-size: 0.875rem; color: var(--gray-medium);">
        ${hasSupplies ? `${lastCalculationResult.supplyRows.length} insumos - ${formatCLP(lastCalculationResult.totalSupplies || 0)}` : "Sin insumos"}
      </div>
    </div>
  `;

  // Checkbox para energía
  const hasEnergy = lastCalculationResult.equipmentRows && lastCalculationResult.equipmentRows.length > 0;
  const energyCheckbox = document.createElement("label");
  energyCheckbox.style.display = "flex";
  energyCheckbox.style.alignItems = "center";
  energyCheckbox.style.gap = "0.75rem";
  energyCheckbox.style.cursor = "pointer";
  energyCheckbox.style.padding = "0.75rem";
  energyCheckbox.style.borderRadius = "0.5rem";
  energyCheckbox.style.border = "2px solid var(--gray-border)";
  energyCheckbox.style.backgroundColor = hasEnergy ? "var(--white)" : "var(--gray-light)";
  energyCheckbox.innerHTML = `
    <input type="checkbox" id="export-energy" ${hasEnergy ? "checked" : ""} ${hasEnergy ? "" : "disabled"} style="width: 1.25rem; height: 1.25rem; cursor: pointer;" />
    <div style="flex: 1;">
      <div style="font-weight: 600; color: var(--color-5);">Energía</div>
      <div style="font-size: 0.875rem; color: var(--gray-medium);">
        ${hasEnergy ? `${lastCalculationResult.equipmentRows.length} electrodomésticos - ${formatCLP(lastCalculationResult.totalEnergy || 0)}` : "Sin energía"}
      </div>
    </div>
  `;

  const groupProviderOption = document.createElement("label");
  groupProviderOption.style.display = "flex";
  groupProviderOption.style.alignItems = "center";
  groupProviderOption.style.gap = "0.75rem";
  groupProviderOption.style.cursor = hasIngredients ? "pointer" : "not-allowed";
  groupProviderOption.style.padding = "0.75rem";
  groupProviderOption.style.borderRadius = "0.5rem";
  groupProviderOption.style.border = "2px dashed var(--gray-border)";
  groupProviderOption.style.backgroundColor = hasIngredients ? "var(--white)" : "var(--gray-light)";
  groupProviderOption.innerHTML = `
    <input type="checkbox" id="export-group-provider" ${hasIngredients ? "" : "disabled"} style="width: 1.25rem; height: 1.25rem; cursor: ${hasIngredients ? "pointer" : "not-allowed"};" />
    <div style="flex: 1;">
      <div style="font-weight: 600; color: var(--color-5);">Agrupar ingredientes por proveedor</div>
      <div style="font-size: 0.875rem; color: var(--gray-medium);">
        Genera una sección por proveedor en la exportación para facilitar compras
      </div>
    </div>
  `;

  optionsDiv.appendChild(ingCheckbox);
  optionsDiv.appendChild(supCheckbox);
  optionsDiv.appendChild(energyCheckbox);
  optionsDiv.appendChild(groupProviderOption);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "modal-form-actions";
  actionsDiv.style.marginTop = "1.5rem";
  actionsDiv.innerHTML = `
    <button type="button" class="btn-cancel">Cancelar</button>
    <button type="button" class="btn-save" id="btn-confirm-export">Exportar</button>
  `;

  form.appendChild(title);
  form.appendChild(optionsDiv);
  form.appendChild(actionsDiv);

  showModal(`Opciones de Exportación (${format.toUpperCase()})`, form);

  // Event listeners
  const btnCancel = form.querySelector(".btn-cancel");
  const btnConfirm = form.querySelector("#btn-confirm-export");

  btnCancel.addEventListener("click", hideModal);

  btnConfirm.addEventListener("click", () => {
    const exportIngredients = form.querySelector("#export-ingredients")?.checked || false;
    const exportSupplies = form.querySelector("#export-supplies")?.checked || false;
    const exportEnergy = form.querySelector("#export-energy")?.checked || false;
    const groupByProvider = form.querySelector("#export-group-provider")?.checked || false;

    if (!exportIngredients && !exportSupplies && !exportEnergy) {
      alert("Por favor, selecciona al menos una categoría para exportar.");
      return;
    }

    hideModal();

    if (format === "csv") {
      exportShoppingListToCSV(exportIngredients, exportSupplies, exportEnergy, groupByProvider);
    } else {
      exportShoppingListToHTML(exportIngredients, exportSupplies, exportEnergy, groupByProvider);
    }
  });
}

/* --------- Exportación de lista de compras --------- */
function groupIngredientsByProvider(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    const provider = row?.proveedor || "Sin proveedor";
    if (!map.has(provider)) {
      map.set(provider, []);
    }
    map.get(provider).push(row);
  });
  return map;
}

function exportShoppingListToCSV(includeIngredients = true, includeSupplies = true, includeEnergy = true, groupByProvider = false) {
  if (!lastCalculationResult) {
    alert("No hay lista de compras para exportar. Calcula primero.");
    return;
  }

  const escapeCSV = (str) => {
    if (str == null) return "";
    const s = String(str);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const ingredientRows = lastCalculationResult.ingredientRows || [];
  const supplyRows = lastCalculationResult.supplyRows || [];
  const equipmentRows = lastCalculationResult.equipmentRows || [];

  const lines = [];
  lines.push("Categoría,Proveedor,Ítem,Cantidad Necesaria,Unidad,Costo Estimado");

  if (includeIngredients && ingredientRows.length > 0) {
    if (groupByProvider) {
      const grouped = groupIngredientsByProvider(ingredientRows);
      grouped.forEach((rows, provider) => {
        lines.push(["Proveedor", escapeCSV(provider), "", "", "", ""].join(","));
        rows.forEach((row) => {
          lines.push([
            "Ingrediente",
            escapeCSV(provider),
            escapeCSV(row.nombre),
            escapeCSV(formatQuantity(row.cantidadRequerida)),
            escapeCSV(row.unidad || ""),
            escapeCSV(formatCLP(row.costoIngrediente).replace(/[^\d,]/g, "").replace(",", "")),
          ].join(","));
        });
        lines.push("");
      });
    } else {
      ingredientRows.forEach((row) => {
        const provider = row.proveedor || "Sin proveedor";
        lines.push([
          "Ingrediente",
          escapeCSV(provider),
          escapeCSV(row.nombre),
          escapeCSV(formatQuantity(row.cantidadRequerida)),
          escapeCSV(row.unidad || ""),
          escapeCSV(formatCLP(row.costoIngrediente).replace(/[^\d,]/g, "").replace(",", "")),
        ].join(","));
      });
    }
  }

  if (includeSupplies && supplyRows.length > 0) {
    supplyRows.forEach((row) => {
      lines.push([
        "Insumo",
        "",
        escapeCSV(row.nombre),
        escapeCSV(formatQuantity(row.cantidadRequerida)),
        escapeCSV(row.unidad || ""),
        escapeCSV(formatCLP(row.costoInsumo).replace(/[^\d,]/g, "").replace(",", "")),
      ].join(","));
    });
  }

  if (includeEnergy && equipmentRows.length > 0) {
    equipmentRows.forEach((row) => {
      lines.push([
        "Energía",
        "",
        escapeCSV(row.nombre),
        escapeCSV(`${formatQuantity(row.tiempoHoras)} h (${formatQuantity(row.consumoKwh)} kWh)`),
        "",
        escapeCSV(formatCLP(row.costoEnergia).replace(/[^\d,]/g, "").replace(",", "")),
      ].join(","));
    });
  }

  if (lines.length <= 1) {
    alert("No hay datos seleccionados para exportar.");
    return;
  }

  const csv = lines.join("\n");
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csv;
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `lista_compras_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    const categoryCount = [
      includeIngredients && ingredientRows.length > 0 ? 1 : 0,
      includeSupplies && supplyRows.length > 0 ? 1 : 0,
      includeEnergy && equipmentRows.length > 0 ? 1 : 0,
    ].filter(Boolean).length;
    console.log(`Exportación CSV completada: ${categoryCount} categoría(s) exportada(s)`);
  }, 100);
}

function exportShoppingListToHTML(includeIngredients = true, includeSupplies = true, includeEnergy = true, groupByProvider = false) {
  if (!lastCalculationResult) {
    alert("No hay lista de compras para exportar. Calcula primero.");
    return;
  }

  function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  const ingredientRows = lastCalculationResult.ingredientRows || [];
  const supplyRows = lastCalculationResult.supplyRows || [];
  const equipmentRows = lastCalculationResult.equipmentRows || [];

  const renderIngredientRow = (row) => `
    <tr>
      <td>
        <div class="item-name">${escapeHtml(row.nombre)}</div>
        <div class="item-provider">Proveedor: ${escapeHtml(row.proveedor || "Sin proveedor")}</div>
      </td>
      <td class="text-right">${formatQuantity(row.cantidadRequerida)}</td>
      <td class="text-right">${escapeHtml(row.unidad || "")}</td>
      <td class="text-right">${formatCLP(row.costoIngrediente)}</td>
    </tr>
  `;

  let tableRows = "";

  if (includeIngredients && ingredientRows.length > 0) {
    tableRows += `<tr class="section-header-row"><td colspan="4">INGREDIENTES</td></tr>`;
    if (groupByProvider) {
      const grouped = groupIngredientsByProvider(ingredientRows);
      grouped.forEach((rows, provider) => {
        tableRows += `<tr class="provider-row"><td colspan="4">${escapeHtml(provider)}</td></tr>`;
        rows.forEach((row) => {
          tableRows += renderIngredientRow(row);
        });
      });
    } else {
      ingredientRows.forEach((row) => {
        tableRows += renderIngredientRow(row);
      });
    }
    tableRows += `<tr class="subtotal-row"><td>Subtotal Ingredientes</td><td colspan="2"></td><td class="text-right">${formatCLP(lastCalculationResult.totalIngredients || 0)}</td></tr>`;
  }

  if (includeSupplies && supplyRows.length > 0) {
    tableRows += `<tr class="section-header-row"><td colspan="4">INSUMOS</td></tr>`;
    supplyRows.forEach((row) => {
      tableRows += `
        <tr>
          <td>${escapeHtml(row.nombre)}</td>
          <td class="text-right">${formatQuantity(row.cantidadRequerida)}</td>
          <td class="text-right">${escapeHtml(row.unidad || "")}</td>
          <td class="text-right">${formatCLP(row.costoInsumo)}</td>
        </tr>
      `;
    });
    tableRows += `<tr class="subtotal-row"><td>Subtotal Insumos</td><td colspan="2"></td><td class="text-right">${formatCLP(lastCalculationResult.totalSupplies || 0)}</td></tr>`;
  }

  if (includeEnergy && equipmentRows.length > 0) {
    tableRows += `<tr class="section-header-row"><td colspan="4">ENERGÍA</td></tr>`;
    equipmentRows.forEach((row) => {
      tableRows += `
        <tr>
          <td>${escapeHtml(row.nombre)}</td>
          <td class="text-right">${formatQuantity(row.tiempoHoras)} h</td>
          <td class="text-right">(${formatQuantity(row.consumoKwh)} kWh)</td>
          <td class="text-right">${formatCLP(row.costoEnergia)}</td>
        </tr>
      `;
    });
    tableRows += `<tr class="subtotal-row"><td>Subtotal Energía</td><td colspan="2"></td><td class="text-right">${formatCLP(lastCalculationResult.totalEnergy || 0)}</td></tr>`;
  }

  if (!tableRows) {
    alert("No hay datos seleccionados para exportar.");
    return;
  }

  const totalSelected = (includeIngredients ? (lastCalculationResult.totalIngredients || 0) : 0) +
    (includeSupplies ? (lastCalculationResult.totalSupplies || 0) : 0) +
    (includeEnergy ? (lastCalculationResult.totalEnergy || 0) : 0);

  const resumenUnidades = getElement("resumen-unidades");
  const resumenRecetas = getElement("resumen-recetas-count");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lista de Compras - Vestalia</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #003d5b;
    }
    h1 {
      color: #003d5b;
      border-bottom: 2px solid #00798c;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #00798c;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e9ecef;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .text-right {
      text-align: right;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 1.1em;
    }
    .summary-label {
      font-weight: 600;
    }
    .section-header-row td {
      background-color: rgba(0, 121, 140, 0.1);
      font-weight: 700;
    }
    .provider-row td {
      background-color: #edf2f7;
      font-weight: 600;
      color: #0f172a;
    }
    .item-provider {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 4px;
    }
    .subtotal-row td {
      background-color: rgba(0, 121, 140, 0.05);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>Lista de Compras Consolidada</h1>
  <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-CL")}</p>
  <table>
    <thead>
      <tr>
        <th>Ítem</th>
        <th class="text-right">Cantidad</th>
        <th class="text-right">Unidad</th>
        <th class="text-right">Costo</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Costo Total Seleccionado:</span>
      <span>${formatCLP(totalSelected)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Total de Unidades:</span>
      <span>${resumenUnidades ? resumenUnidades.textContent : "–"}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Recetas Incluidas:</span>
      <span>${resumenRecetas ? resumenRecetas.textContent : "–"}</span>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `lista_compras_${new Date().toISOString().split("T")[0]}.html`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  // Limpiar después de un pequeño delay para asegurar que el click se procese
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    // Mensaje de confirmación
    const categoryCount = [
      includeIngredients && lastCalculationResult.ingredientRows ? lastCalculationResult.ingredientRows.length : 0,
      includeSupplies && lastCalculationResult.supplyRows ? lastCalculationResult.supplyRows.length : 0,
      includeEnergy && lastCalculationResult.equipmentRows ? lastCalculationResult.equipmentRows.length : 0
    ].filter(n => n > 0).length;
    console.log(`Exportación HTML completada: ${categoryCount} categoría(s) exportada(s)`);
  }, 100);
}
