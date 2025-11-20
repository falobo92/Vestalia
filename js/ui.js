// js/ui.js - UI functions for Vestalia

import { formatCLP, formatQuantity } from "./calculations.js";
import { getCostoKwhGlobal, normalizeNumber } from "./dataStore.js";

/* --------- Helpers generales de DOM --------- */
export function getElement(id) {
  return document.getElementById(id);
}

export function showView(viewName) {
  const calculatorView = getElement("view-calculator");
  const adminView = getElement("view-admin");
  const navCalculator = getElement("nav-calculator");
  const navAdmin = getElement("nav-admin");

  if (viewName === "calculator") {
    if (calculatorView) calculatorView.classList.add("active");
    if (adminView) adminView.classList.remove("active");
    if (navCalculator) navCalculator.classList.add("active");
    if (navAdmin) navAdmin.classList.remove("active");
  } else if (viewName === "admin") {
    if (calculatorView) calculatorView.classList.remove("active");
    if (adminView) adminView.classList.add("active");
    if (navCalculator) navCalculator.classList.remove("active");
    if (navAdmin) navAdmin.classList.add("active");
  }
}

/* --------- Modal --------- */
export function showModal(title, content) {
  const modalOverlay = getElement("modal-overlay");
  const modalTitle = getElement("modal-title");
  const modalBody = getElement("modal-body");
  const modalContentWrapper = document.querySelector(".modal-content");

  if (modalTitle) modalTitle.textContent = title;
  const targetContainer = modalBody || modalContentWrapper;
  if (targetContainer) {
    targetContainer.innerHTML = "";
    if (content instanceof HTMLElement) {
      targetContainer.appendChild(content);
    } else if (typeof content === "string") {
      targetContainer.innerHTML = content;
    }
  }

  requestAnimationFrame(() => {
    if (modalOverlay) modalOverlay.classList.add("active");
    if (modalContentWrapper) modalContentWrapper.classList.add("active");
  });
}

export function hideModal() {
  const modalOverlay = getElement("modal-overlay");
  const modalBody = getElement("modal-body");
  const modalContentWrapper = document.querySelector(".modal-content");

  if (modalOverlay) modalOverlay.classList.remove("active");
  if (modalContentWrapper) modalContentWrapper.classList.remove("active");
  if (modalBody) modalBody.innerHTML = "";
}

/* --------- Filtros y búsqueda --------- */
export function filterRecipes(recipes, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return recipes;
  const term = searchTerm.toLowerCase().trim();
  return recipes.filter((r) =>
    r.nombreReceta?.toLowerCase().includes(term)
  );
}

/* --------- Renderizado de recetas --------- */
export function renderRecipesList(recipes, containerEl, onSelect, onAdd) {
  if (!containerEl) return;
  containerEl.innerHTML = "";

  if (recipes.length === 0) {
    containerEl.innerHTML = '<div class="empty-state">No hay recetas disponibles</div>';
    return;
  }

  recipes.forEach((recipe) => {
    const div = document.createElement("div");
    div.className = "recipe-list-item";
    div.innerHTML = `
      <label class="recipe-list-item-label">
        <div class="recipe-list-item-content">
          <div class="recipe-list-item-main">
            <span class="recipe-list-item-name">${recipe.nombreReceta || "Sin nombre"}</span>
            ${recipe.descripcion ? `<span class="recipe-list-item-desc">${recipe.descripcion}</span>` : ""}
          </div>
          <span class="recipe-list-item-meta">Rendimiento: ${recipe.rendimientoBase || 1} unidades</span>
        </div>
        ${onAdd ? `
          <button class="btn-add-recipe" type="button" title="Agregar receta">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 1.125rem; height: 1.125rem;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ` : ""}
      </label>
    `;

    if (onSelect) {
      div.addEventListener("click", (e) => {
        if (!e.target.closest('.btn-add-recipe')) {
          onSelect(recipe);
        }
      });
    }
    if (onAdd) {
      const btnAdd = div.querySelector(".btn-add-recipe");
      if (btnAdd) {
        btnAdd.addEventListener("click", (e) => {
          e.stopPropagation();
          onAdd(recipe);
        });
      }
    }

    containerEl.appendChild(div);
  });
}

export function showSelectedRecipe(recipe) {
  const container = getElement("selected-recipe-info");
  if (!container) return;

  if (!recipe) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <h3>${recipe.nombreReceta}</h3>
    ${recipe.descripcion ? `<p>${recipe.descripcion}</p>` : ""}
    <p><strong>Rendimiento base:</strong> ${recipe.rendimientoBase || 1} unidades</p>
  `;
}

/* --------- Resultados de cálculo --------- */
export function showCalculationResults(show) {
  const resultsEl = getElement("calculation-results");
  if (resultsEl) {
    resultsEl.style.display = show ? "block" : "none";
  }
}

export function updateSummary({ total, unitario, unidades, recetasCount }) {
  const totalEl = getElement("resumen-costo-total");
  const unitarioEl = getElement("resumen-costo-unitario");
  const unidadesEl = getElement("resumen-unidades");
  const recetasEl = getElement("resumen-recetas-count");

  if (totalEl) totalEl.textContent = formatCLP(total);
  if (unitarioEl) unitarioEl.textContent = formatCLP(unitario);
  if (unidadesEl) unidadesEl.textContent = `${formatQuantity(unidades)} unidades`;
  if (recetasEl) recetasEl.textContent = `${recetasCount || 0} receta(s)`;
}

export function renderConsolidatedShoppingList(result, tbodyEl) {
  if (!tbodyEl) return;
  tbodyEl.innerHTML = "";

  // Ingredientes
  if (result.ingredientRows && result.ingredientRows.length > 0) {
    const headerRow = document.createElement("tr");
    headerRow.className = "category-header";
    headerRow.innerHTML = `<td colspan="4"><strong>INGREDIENTES</strong></td>`;
    tbodyEl.appendChild(headerRow);

    result.ingredientRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.nombre}</td>
        <td class="text-right">${formatQuantity(row.cantidadRequerida)}</td>
        <td class="text-right">${row.unidad || ""}</td>
        <td class="text-right">${formatCLP(row.costoIngrediente)}</td>
      `;
      tbodyEl.appendChild(tr);
    });

    const subtotalRow = document.createElement("tr");
    subtotalRow.className = "subtotal-row";
    subtotalRow.innerHTML = `
      <td><strong>Subtotal Ingredientes</strong></td>
      <td colspan="2"></td>
      <td class="text-right"><strong>${formatCLP(result.totalIngredients || 0)}</strong></td>
    `;
    tbodyEl.appendChild(subtotalRow);
  }

  // Insumos
  if (result.supplyRows && result.supplyRows.length > 0) {
    const headerRow = document.createElement("tr");
    headerRow.className = "category-header";
    headerRow.innerHTML = `<td colspan="4"><strong>INSUMOS</strong></td>`;
    tbodyEl.appendChild(headerRow);

    result.supplyRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.nombre}</td>
        <td class="text-right">${formatQuantity(row.cantidadRequerida)}</td>
        <td class="text-right">${row.unidad || ""}</td>
        <td class="text-right">${formatCLP(row.costoInsumo)}</td>
      `;
      tbodyEl.appendChild(tr);
    });

    const subtotalRow = document.createElement("tr");
    subtotalRow.className = "subtotal-row";
    subtotalRow.innerHTML = `
      <td><strong>Subtotal Insumos</strong></td>
      <td colspan="2"></td>
      <td class="text-right"><strong>${formatCLP(result.totalSupplies || 0)}</strong></td>
    `;
    tbodyEl.appendChild(subtotalRow);
  }

  // Energía
  if (result.equipmentRows && result.equipmentRows.length > 0) {
    const headerRow = document.createElement("tr");
    headerRow.className = "category-header";
    headerRow.innerHTML = `<td colspan="4"><strong>ENERGÍA</strong></td>`;
    tbodyEl.appendChild(headerRow);

    result.equipmentRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.nombre}</td>
        <td class="text-right">${formatQuantity(row.tiempoHoras)} h</td>
        <td class="text-right">(${formatQuantity(row.consumoKwh)} kWh)</td>
        <td class="text-right">${formatCLP(row.costoEnergia)}</td>
      `;
      tbodyEl.appendChild(tr);
    });

    const subtotalRow = document.createElement("tr");
    subtotalRow.className = "subtotal-row";
    subtotalRow.innerHTML = `
      <td><strong>Subtotal Energía</strong></td>
      <td colspan="2"></td>
      <td class="text-right"><strong>${formatCLP(result.totalEnergy || 0)}</strong></td>
    `;
    tbodyEl.appendChild(subtotalRow);
  }
}

export function renderIngredientsChart(costItems, totalCost) {
  const container = getElement("ingredients-chart-container");
  if (!container) return;

  container.style.display = "block";
  const chartContent = container.querySelector("#ingredients-chart");
  if (!chartContent) return;

  // Si costItems es un array de objetos antiguos (solo ingredientes), convertirlos
  let items = [];
  if (costItems && costItems.length > 0) {
    if (costItems[0].costoIngrediente !== undefined) {
      // Formato antiguo: solo ingredientes
      items = costItems.map(row => ({
        nombre: row.nombre,
        costo: row.costoIngrediente,
        tipo: 'Ingrediente',
        categoria: 'ingredientes'
      }));
    } else {
      // Formato nuevo: todos los costos
      items = costItems;
    }
  }

  // Ordenar por costo y tomar top 15
  const sorted = [...items]
    .sort((a, b) => b.costo - a.costo)
    .slice(0, 15);

  if (sorted.length === 0) {
    chartContent.innerHTML = '<p class="empty-message">No hay costos para mostrar</p>';
    return;
  }

  // Crear lista visual de costos
  chartContent.innerHTML = "";
  sorted.forEach((item, index) => {
    const percentage = totalCost > 0 ? (item.costo / totalCost) * 100 : 0;
    const div = document.createElement("div");
    div.className = "chart-item-wrapper";

    // Color según categoría
    let barColor = "linear-gradient(135deg, var(--color-3) 0%, var(--color-4) 100%)";
    if (item.categoria === 'insumos') {
      barColor = "linear-gradient(135deg, var(--color-1) 0%, #f5a623 100%)";
    } else if (item.categoria === 'energia') {
      barColor = "linear-gradient(135deg, var(--color-2) 0%, #b83d4f 100%)";
    }

    div.innerHTML = `
      <div class="chart-item-content">
        <div class="chart-item-header-row">
          <div>
            <strong class="chart-item-name">${item.nombre}</strong>
            <small style="display: block; color: var(--gray-medium); font-size: 0.75rem; margin-top: 0.25rem;">${item.tipo || 'Ingrediente'}</small>
          </div>
          <span class="chart-item-value">${formatCLP(item.costo)}</span>
        </div>
        <div class="chart-item-bar-container">
          <div class="chart-item-bar" style="width: ${percentage}%; background: ${barColor};"></div>
        </div>
        <small class="chart-item-percentage">${percentage.toFixed(1)}% del costo total (${formatCLP(totalCost)})</small>
      </div>
    `;
    chartContent.appendChild(div);
  });
}

export function renderRecipesBreakdown(recipesBreakdownData) {
  const container = getElement("recipes-breakdown");
  if (!container) return;

  container.innerHTML = "";

  if (recipesBreakdownData.length === 0) {
    container.innerHTML = '<div class="empty-state-small">No hay recetas para mostrar</div>';
    return;
  }

  recipesBreakdownData.forEach((item) => {
    const card = document.createElement("div");
    card.className = "recipe-breakdown-card";
    card.innerHTML = `
      <div class="recipe-breakdown-header">
        <h3 class="recipe-breakdown-title">${item.recipe.nombreReceta}</h3>
        <div class="recipe-breakdown-total">${formatCLP(item.total)}</div>
      </div>
      <div class="recipe-breakdown-content">
        <div class="breakdown-section">
          <h4 class="breakdown-section-title">Resumen</h4>
          <p>Cantidad: ${item.cantidad} receta(s)</p>
          <p>Costo total: ${formatCLP(item.total)}</p>
          <p>Costo unitario: ${formatCLP(item.unitario)}</p>
        </div>
        ${item.ingredientRows && item.ingredientRows.length > 0 ? `
          <div class="breakdown-section">
            <h4 class="breakdown-section-title">Ingredientes</h4>
            ${item.ingredientRows.map(row => `
              <div class="recipe-item-row">
                <div class="item-info">
                  <strong>${row.nombre}</strong>
                  <span class="item-quantity">${formatQuantity(row.cantidadRequerida)} ${row.unidad || ""}</span>
                </div>
                <div>${formatCLP(row.costoIngrediente)}</div>
              </div>
            `).join("")}
          </div>
        ` : ""}
        ${item.supplyRows && item.supplyRows.length > 0 ? `
          <div class="breakdown-section">
            <h4 class="breakdown-section-title">Insumos</h4>
            ${item.supplyRows.map(row => `
              <div class="recipe-item-row">
                <div class="item-info">
                  <strong>${row.nombre}</strong>
                  <span class="item-quantity">${formatQuantity(row.cantidadRequerida)} ${row.unidad || ""}</span>
                </div>
                <div>${formatCLP(row.costoInsumo)}</div>
              </div>
            `).join("")}
          </div>
        ` : ""}
        ${item.equipmentRows && item.equipmentRows.length > 0 ? `
          <div class="breakdown-section">
            <h4 class="breakdown-section-title">Energía</h4>
            ${item.equipmentRows.map(row => `
              <div class="recipe-item-row">
                <div class="item-info">
                  <strong>${row.nombre}</strong>
                  <span class="item-quantity">${formatQuantity(row.tiempoHoras)} h (${formatQuantity(row.consumoKwh)} kWh)</span>
                </div>
                <div>${formatCLP(row.costoEnergia)}</div>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

export function initResultsTabs() {
  const tabButtons = document.querySelectorAll(".results-tab-btn");
  const tabContents = document.querySelectorAll(".results-tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const content = document.getElementById(`tab-${tabName}`);
      if (content) content.classList.add("active");
    });
  });
}

export function renderCalculationResults(result) {
  // Esta función puede ser llamada pero renderConsolidatedShoppingList hace el trabajo
  const tbodyEl = getElement("tabla-resultados-body");
  if (tbodyEl) {
    renderConsolidatedShoppingList(result, tbodyEl);
  }
}

/* --------- Administración --------- */
export function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const contents = document.querySelectorAll(".admin-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const content = document.getElementById(`tab-${tabName}`);
      if (content) content.classList.add("active");
    });
  });
}

export function renderAdminRecipesList(recipes, containerEl, onEdit, onDelete, searchTerm = "") {
  if (!containerEl) return;

  let filtered = recipes;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = recipes.filter((r) =>
      r.nombreReceta?.toLowerCase().includes(term)
    );
  }

  containerEl.innerHTML = "";

  if (filtered.length === 0) {
    const emptyMessage = searchTerm ?
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>No se encontraron recetas que coincidan con "${searchTerm}"</p>
        <small style="color: var(--gray-medium);">Intenta con otros términos de búsqueda</small>
      </div>` :
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No hay recetas disponibles</p>
        <small style="color: var(--gray-medium);">Haz clic en "Agregar Recetas" para crear una nueva receta</small>
      </div>`;
    containerEl.innerHTML = emptyMessage;
    return;
  }

  filtered.forEach((recipe) => {
    const div = document.createElement("div");
    div.className = "admin-item";
    div.innerHTML = `
      <div class="admin-item-info">
        <h3>${recipe.nombreReceta || "Sin nombre"}</h3>
        <p>${recipe.descripcion || ""}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" title="Editar receta">
          <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="btn-delete" title="Eliminar receta">
          <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    div.querySelector(".btn-edit").addEventListener("click", () => onEdit(recipe));
    div.querySelector(".btn-delete").addEventListener("click", () => onDelete(recipe.id));

    containerEl.appendChild(div);
  });
}

export function renderAdminIngredientsList(ingredients, containerEl, onEdit, onDelete, searchTerm = "", groupByProvider = false) {
  if (!containerEl) return;

  let filtered = ingredients;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = ingredients.filter((i) =>
      i.nombre?.toLowerCase().includes(term) ||
      i.proveedor?.toLowerCase().includes(term)
    );
  }

  containerEl.innerHTML = "";

  if (filtered.length === 0) {
    const emptyMessage = searchTerm ?
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>No se encontraron ingredientes que coincidan con "${searchTerm}"</p>
        <small style="color: var(--gray-medium);">Intenta con otros términos de búsqueda</small>
      </div>` :
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No hay ingredientes disponibles</p>
        <small style="color: var(--gray-medium);">Haz clic en "Agregar Ingredientes" para crear un nuevo ingrediente</small>
      </div>`;
    containerEl.innerHTML = emptyMessage;
    return;
  }

  if (groupByProvider) {
    // Agrupar por proveedor
    const grouped = new Map();
    filtered.forEach(ing => {
      const provider = ing.proveedor || "Sin proveedor";
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider).push(ing);
    });

    // Ordenar proveedores alfabéticamente
    const sortedProviders = Array.from(grouped.keys()).sort();

    sortedProviders.forEach(provider => {
      // Header del grupo
      const groupHeader = document.createElement("div");
      groupHeader.className = "provider-group-header";
      groupHeader.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span>${provider}</span>
        <span class="provider-count">${grouped.get(provider).length} ingrediente(s)</span>
      `;
      containerEl.appendChild(groupHeader);

      // Items del grupo
      grouped.get(provider).forEach((ing) => {
        const div = document.createElement("div");
        div.className = "admin-item";
        div.innerHTML = `
          <div class="admin-item-info">
            <h3>${ing.nombre || "Sin nombre"}</h3>
            <p>Formato: ${formatQuantity(ing.formatoCantidad || 0)} ${ing.formatoUnidad || ""} - ${formatCLP(ing.costoFormato || 0)}</p>
            <p>Costo unitario: ${formatCLP(ing.costoUnitario || 0)}/${ing.unidadMedida || ""}</p>
            <p class="item-provider">Proveedor: ${ing.proveedor || "Sin proveedor"}</p>
          </div>
          <div class="admin-item-actions">
            <button class="btn-edit" title="Editar ingrediente">
              <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button class="btn-delete" title="Eliminar ingrediente">
              <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        `;

        div.querySelector(".btn-edit").addEventListener("click", () => onEdit(ing));
        div.querySelector(".btn-delete").addEventListener("click", () => onDelete(ing.id));

        containerEl.appendChild(div);
      });
    });
  } else {
    // Vista normal sin agrupar
    filtered.forEach((ing) => {
      const div = document.createElement("div");
      div.className = "admin-item";
      div.innerHTML = `
        <div class="admin-item-info">
          <h3>${ing.nombre || "Sin nombre"}</h3>
          <p>Formato: ${formatQuantity(ing.formatoCantidad || 0)} ${ing.formatoUnidad || ""} - ${formatCLP(ing.costoFormato || 0)}</p>
          <p>Costo unitario: ${formatCLP(ing.costoUnitario || 0)}/${ing.unidadMedida || ""}</p>
          ${ing.proveedor ? `<p class="item-provider">Proveedor: ${ing.proveedor}</p>` : ""}
        </div>
        <div class="admin-item-actions">
          <button class="btn-edit" title="Editar ingrediente">
            <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="btn-delete" title="Eliminar ingrediente">
            <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;

      div.querySelector(".btn-edit").addEventListener("click", () => onEdit(ing));
      div.querySelector(".btn-delete").addEventListener("click", () => onDelete(ing.id));

      containerEl.appendChild(div);
    });
  }
}

export function renderAdminSuppliesList(supplies, containerEl, onEdit, onDelete, searchTerm = "") {
  if (!containerEl) return;

  let filtered = supplies;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = supplies.filter((s) =>
      s.nombre?.toLowerCase().includes(term)
    );
  }

  containerEl.innerHTML = "";

  if (filtered.length === 0) {
    const emptyMessage = searchTerm ?
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>No se encontraron insumos que coincidan con "${searchTerm}"</p>
        <small style="color: var(--gray-medium);">Intenta con otros términos de búsqueda</small>
      </div>` :
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <p>No hay insumos disponibles</p>
        <small style="color: var(--gray-medium);">Haz clic en "Agregar Insumos" para crear un nuevo insumo</small>
      </div>`;
    containerEl.innerHTML = emptyMessage;
    return;
  }

  filtered.forEach((sup) => {
    const div = document.createElement("div");
    div.className = "admin-item";
    div.innerHTML = `
      <div class="admin-item-info">
        <h3>${sup.nombre || "Sin nombre"}</h3>
          <p>Formato: ${formatQuantity(sup.formatoCantidad || 0)} ${sup.formatoUnidad || ""} - ${formatCLP(sup.costoFormato || 0)}</p>
        <p>Costo unitario: ${formatCLP(sup.costoUnitario || 0)}/${sup.formatoUnidad || ""}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" title="Editar insumo">
          <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="btn-delete" title="Eliminar insumo">
          <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    div.querySelector(".btn-edit").addEventListener("click", () => onEdit(sup));
    div.querySelector(".btn-delete").addEventListener("click", () => onDelete(sup.id));

    containerEl.appendChild(div);
  });
}

export function renderAdminEquipmentsList(equipments, containerEl, onEdit, onDelete, searchTerm = "") {
  if (!containerEl) return;

  let filtered = equipments;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = equipments.filter((e) =>
      e.nombre?.toLowerCase().includes(term)
    );
  }

  containerEl.innerHTML = "";

  if (filtered.length === 0) {
    const emptyMessage = searchTerm ?
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>No se encontraron electrodomésticos que coincidan con "${searchTerm}"</p>
        <small style="color: var(--gray-medium);">Intenta con otros términos de búsqueda</small>
      </div>` :
      `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 3rem; height: 3rem; color: var(--gray-medium); margin-bottom: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p>No hay electrodomésticos disponibles</p>
        <small style="color: var(--gray-medium);">Haz clic en "Agregar Electrodomésticos" para crear un nuevo electrodoméstico</small>
      </div>`;
    containerEl.innerHTML = emptyMessage;
    return;
  }

  filtered.forEach((eq) => {
    const div = document.createElement("div");
    div.className = "admin-item";
    const potenciaKw = (eq.potenciaWatts || 0) / 1000;
    const costoKwh = eq.costoKwh != null && eq.costoKwh > 0 ? eq.costoKwh : getCostoKwhGlobal();
    const costoKwhText = eq.costoKwh != null && eq.costoKwh > 0 ? formatCLP(eq.costoKwh) : `${formatCLP(getCostoKwhGlobal())} (global)`;

    div.innerHTML = `
      <div class="admin-item-info">
        <h3>${eq.nombre || "Sin nombre"}</h3>
            <p>Potencia: ${formatQuantity(potenciaKw)} kW (${formatQuantity(eq.potenciaWatts || 0)} W)</p>
        <p>Costo KWh: ${costoKwhText}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" title="Editar electrodoméstico">
          <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="btn-delete" title="Eliminar electrodoméstico">
          <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    div.querySelector(".btn-edit").addEventListener("click", () => onEdit(eq));
    div.querySelector(".btn-delete").addEventListener("click", () => onDelete(eq.id));

    containerEl.appendChild(div);
  });
}

/* --------- Formularios --------- */
export function createIngredientForm(ingredient, allIngredients, allSupplies, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "modal-form";

  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nombre *</label>
      <input type="text" id="modal-ing-nombre" class="form-input" required value="${ingredient?.nombre || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Unidad de Medida *</label>
      <select id="modal-ing-unidad" class="form-input" required>
        <option value="g" ${ingredient?.unidadMedida === "g" ? "selected" : ""}>Gramos (g)</option>
        <option value="kg" ${ingredient?.unidadMedida === "kg" ? "selected" : ""}>Kilogramos (kg)</option>
        <option value="ml" ${ingredient?.unidadMedida === "ml" ? "selected" : ""}>Mililitros (ml)</option>
        <option value="l" ${ingredient?.unidadMedida === "l" ? "selected" : ""}>Litros (l)</option>
        <option value="unidad" ${ingredient?.unidadMedida === "unidad" ? "selected" : ""}>Unidad</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Formato de Compra - Cantidad *</label>
      <input type="number" id="modal-ing-cantidad" class="form-input" required step="0.01" min="0" value="${ingredient?.formatoCantidad || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Formato de Compra - Unidad *</label>
      <input type="text" id="modal-ing-formato-unidad" class="form-input" required value="${ingredient?.formatoUnidad || ""}" placeholder="Ej: kg, bolsa, caja" />
    </div>
    <div class="form-group">
      <label class="form-label">Costo del Formato (CLP) *</label>
      <input type="number" id="modal-ing-costo" class="form-input" required step="1" min="0" value="${ingredient?.costoFormato || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Proveedor</label>
      <input type="text" id="modal-ing-proveedor" class="form-input" value="${ingredient?.proveedor || ""}" />
    </div>
    <div class="modal-form-actions">
      <button type="button" class="btn-cancel">Cancelar</button>
      <button type="submit" class="btn-save">Guardar</button>
    </div>
  `;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      id: ingredient?.id,
      nombre: form.querySelector("#modal-ing-nombre").value.trim(),
      unidadMedida: form.querySelector("#modal-ing-unidad").value,
      formatoCantidad: form.querySelector("#modal-ing-cantidad").value,
      formatoUnidad: form.querySelector("#modal-ing-formato-unidad").value.trim(),
      costoFormato: form.querySelector("#modal-ing-costo").value,
      proveedor: form.querySelector("#modal-ing-proveedor").value.trim(),
    };
    onSubmit(payload);
  });

  form.querySelector(".btn-cancel").addEventListener("click", onCancel);

  return form;
}

export function createSupplyForm(supply, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "modal-form";

  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nombre *</label>
      <input type="text" id="modal-sup-nombre" class="form-input" required value="${supply?.nombre || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Formato de Compra - Cantidad *</label>
      <input type="number" id="modal-sup-cantidad" class="form-input" required step="0.01" min="0" value="${supply?.formatoCantidad || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Formato de Compra - Unidad *</label>
      <select id="modal-sup-formato-unidad" class="form-input" required>
        <option value="unidad" ${supply?.formatoUnidad === "unidad" ? "selected" : ""}>Unidad</option>
        <option value="paquete" ${supply?.formatoUnidad === "paquete" ? "selected" : ""}>Paquete</option>
        <option value="rollo" ${supply?.formatoUnidad === "rollo" ? "selected" : ""}>Rollo</option>
        <option value="caja" ${supply?.formatoUnidad === "caja" ? "selected" : ""}>Caja</option>
        <option value="bolsa" ${supply?.formatoUnidad === "bolsa" ? "selected" : ""}>Bolsa</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Costo del Formato (CLP) *</label>
      <input type="number" id="modal-sup-costo" class="form-input" required step="1" min="0" value="${supply?.costoFormato || ""}" />
    </div>
    <div class="modal-form-actions">
      <button type="button" class="btn-cancel">Cancelar</button>
      <button type="submit" class="btn-save">Guardar</button>
    </div>
  `;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      id: supply?.id,
      nombre: form.querySelector("#modal-sup-nombre").value.trim(),
      formatoCantidad: form.querySelector("#modal-sup-cantidad").value,
      formatoUnidad: form.querySelector("#modal-sup-formato-unidad").value,
      costoFormato: form.querySelector("#modal-sup-costo").value,
    };
    onSubmit(payload);
  });

  form.querySelector(".btn-cancel").addEventListener("click", onCancel);

  return form;
}

export function createEquipmentForm(equipment, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "modal-form";

  const usarGlobal = equipment?.costoKwh == null || equipment?.costoKwh === 0;
  const costoGlobalActual = getCostoKwhGlobal();

  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nombre *</label>
      <input type="text" id="modal-eq-nombre" class="form-input" required value="${equipment?.nombre || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Potencia (Watts) *</label>
      <input type="number" id="modal-eq-potencia" class="form-input" required min="0" step="1" value="${equipment?.potenciaWatts || ""}" />
    </div>
    <div class="form-group">
      <label class="form-label">Costo por kWh (CLP)</label>
      <div style="margin-bottom: 0.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="kwh-option" id="kwh-global" ${usarGlobal ? "checked" : ""} />
          <span>Usar costo global (${formatCLP(costoGlobalActual)})</span>
        </label>
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="kwh-option" id="kwh-specific" ${!usarGlobal ? "checked" : ""} />
          <span>Especificar costo</span>
        </label>
      </div>
      <input type="number" id="modal-eq-costo-kwh" class="form-input" min="0" step="1" value="${!usarGlobal ? (equipment?.costoKwh || "") : ""}" ${usarGlobal ? "disabled" : ""} style="margin-top: 0.5rem;" />
    </div>
    <div class="form-group">
      <label class="form-label">Fórmula de KWh (opcional)</label>
      <input type="text" id="modal-eq-formula-kwh" class="form-input" value="${equipment?.formulaKwh || ""}" placeholder="Ej: (potenciaWatts / 1000) * tiempoHoras" />
      <small style="color: var(--gray-medium); display: block; margin-top: 0.25rem;">
        Usa 'potenciaWatts' y 'tiempoHoras' como variables. Si está vacío, se usa la fórmula por defecto.
      </small>
    </div>
    <div class="modal-form-actions">
      <button type="button" class="btn-cancel">Cancelar</button>
      <button type="submit" class="btn-save">Guardar</button>
    </div>
  `;

  // Manejar radio buttons
  const radioGlobal = form.querySelector("#kwh-global");
  const radioSpecific = form.querySelector("#kwh-specific");
  const inputCosto = form.querySelector("#modal-eq-costo-kwh");

  radioGlobal.addEventListener("change", () => {
    if (radioGlobal.checked) {
      inputCosto.disabled = true;
      inputCosto.value = "";
    }
  });

  radioSpecific.addEventListener("change", () => {
    if (radioSpecific.checked) {
      inputCosto.disabled = false;
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const usarGlobalValue = form.querySelector("#kwh-global").checked;
    const payload = {
      id: equipment?.id,
      nombre: form.querySelector("#modal-eq-nombre").value.trim(),
      potenciaWatts: Number(form.querySelector("#modal-eq-potencia").value) || 0,
      costoKwh: usarGlobalValue ? null : (Number(form.querySelector("#modal-eq-costo-kwh").value) || 0),
      formulaKwh: form.querySelector("#modal-eq-formula-kwh").value.trim() || null,
    };
    onSubmit(payload);
  });

  form.querySelector(".btn-cancel").addEventListener("click", onCancel);

  return form;
}

export function createRecipeForm(recipe, allIngredients, allSupplies, allEquipments, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "modal-form recipe-edit-form";

  const currentIngredientes = recipe?.ingredientes || [];
  const currentInsumos = recipe?.insumos || [];
  const currentEquipments = recipe?.equipments || [];

  const convertToHours = (value, unit) => {
    const val = Number(value) || 0;
    switch (unit) {
      case "minutes":
        return val / 60;
      case "seconds":
        return val / 3600;
      default:
        return val;
    }
  };

  const convertFromHours = (hours, unit) => {
    const val = Number(hours) || 0;
    switch (unit) {
      case "minutes":
        return val * 60;
      case "seconds":
        return val * 3600;
      default:
        return val;
    }
  };

  const formatInputValue = (value) => Number((value ?? 0).toFixed(1));

  form.innerHTML = `
    <div class="recipe-form-section">
      <div class="section-header">
        <div>
          <h3>Datos generales</h3>
          <p class="section-description">Completa la información base para cálculos y reportes.</p>
        </div>
      </div>
      <div class="section-body recipe-general-grid">
        <div class="form-group full-width">
          <label class="form-label">Nombre de la Receta *</label>
          <input type="text" id="modal-rec-nombre" class="form-input" required value="${recipe?.nombreReceta || ""}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Descripción</label>
          <textarea id="modal-rec-desc" class="form-input" rows="3" placeholder="Describe brevemente la receta...">${recipe?.descripcion || ""}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Rendimiento Base (unidades) *</label>
          <input type="number" id="modal-rec-rendimiento" class="form-input" required min="1" step="1" value="${recipe?.rendimientoBase || 1}" />
        </div>
        <div class="form-group">
          <label class="form-label">Tiempo en Horno (minutos, opcional)</label>
          <input type="number" id="modal-rec-tiempo-horno" class="form-input" min="0" step="1" value="${recipe?.tiempoHornoMinutos || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">Temperatura Horno (°C, opcional)</label>
          <input type="number" id="modal-rec-temperatura" class="form-input" min="0" step="1" value="${recipe?.temperaturaHorno || ""}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Pasos de Preparación</label>
          <textarea id="modal-rec-pasos" class="form-input" rows="4" placeholder="Describe los pasos principales...">${recipe?.pasosPreparacion || ""}</textarea>
        </div>
      </div>
    </div>

    <div class="recipe-summary-cards">
      <div class="summary-card">
        <span class="summary-label">Ingredientes</span>
        <span class="summary-value" id="summary-ingredients-count">${currentIngredientes.length}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Insumos</span>
        <span class="summary-value" id="summary-supplies-count">${currentInsumos.length}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Electrodomésticos</span>
        <span class="summary-value" id="summary-equipments-count">${currentEquipments.length}</span>
      </div>
    </div>

    <div class="recipe-form-section">
      <div class="section-header">
        <div>
          <h3>Ingredientes</h3>
          <p class="section-description">Selecciona los ingredientes y define la cantidad base.</p>
        </div>
        <span class="section-chip" id="summary-ingredients-chip">${currentIngredientes.length}</span>
      </div>
      <div class="section-body">
        <div class="select-search-group">
          <input type="text" id="search-ingrediente-select" class="form-input select-search-input" placeholder="Buscar ingrediente..." />
          <select id="select-ingrediente" class="form-input">
            <option value="">Seleccionar ingrediente...</option>
            ${allIngredients.map((ing) => `<option value="${ing.id}">${ing.nombre}</option>`).join("")}
          </select>
          <div class="inline-input-group">
            <input type="number" id="cantidad-ingrediente" class="form-input" step="0.1" min="0" placeholder="Cantidad" />
            <button type="button" id="btn-add-ingrediente" class="btn-secondary-small">Agregar</button>
          </div>
        </div>
        <div id="ingredientes-list-container" class="item-list-container"></div>
      </div>
    </div>

    <div class="recipe-form-section">
      <div class="section-header">
        <div>
          <h3>Insumos</h3>
          <p class="section-description">Incluye insumos auxiliares o materiales de empaque.</p>
        </div>
        <span class="section-chip" id="summary-supplies-chip">${currentInsumos.length}</span>
      </div>
      <div class="section-body">
        <div class="select-search-group">
          <input type="text" id="search-insumo-select" class="form-input select-search-input" placeholder="Buscar insumo..." />
          <select id="select-insumo" class="form-input">
            <option value="">Seleccionar insumo...</option>
            ${allSupplies.map((sup) => `<option value="${sup.id}">${sup.nombre}</option>`).join("")}
          </select>
          <div class="inline-input-group">
            <input type="number" id="cantidad-insumo" class="form-input" step="0.1" min="0" placeholder="Cantidad" />
            <button type="button" id="btn-add-insumo" class="btn-secondary-small">Agregar</button>
          </div>
        </div>
        <div id="insumos-list-container" class="item-list-container"></div>
      </div>
    </div>

    <div class="recipe-form-section">
      <div class="section-header">
        <div>
          <h3>Electrodomésticos</h3>
          <p class="section-description">Indica el tiempo de uso y la unidad preferida.</p>
        </div>
        <span class="section-chip" id="summary-equipments-chip">${currentEquipments.length}</span>
      </div>
      <div class="section-body">
        <div class="select-search-group">
          <input type="text" id="search-equipment-select" class="form-input select-search-input" placeholder="Buscar electrodoméstico..." />
          <select id="select-equipment" class="form-input">
            <option value="">Seleccionar electrodoméstico...</option>
            ${allEquipments.map((eq) => `<option value="${eq.id}">${eq.nombre}</option>`).join("")}
          </select>
          <div class="inline-input-group">
            <input type="number" id="tiempo-equipment" class="form-input" step="0.1" min="0" placeholder="Tiempo" />
            <select id="tiempo-equipment-unit" class="form-input time-unit-select">
              <option value="hours" selected>Horas</option>
              <option value="minutes">Minutos</option>
              <option value="seconds">Segundos</option>
            </select>
            <button type="button" id="btn-add-equipment" class="btn-secondary-small">Agregar</button>
          </div>
        </div>
        <div id="equipments-list-container" class="item-list-container"></div>
      </div>
    </div>

    <div class="modal-form-actions">
      <button type="button" class="btn-cancel">Cancelar</button>
      <button type="submit" class="btn-save">Guardar</button>
    </div>
  `;

  const setupSearchableSelect = (selectSelector, searchSelector, collection, placeholder) => {
    const selectEl = form.querySelector(selectSelector);
    const searchEl = form.querySelector(searchSelector);
    if (!selectEl) return () => { };
    const renderOptions = (term = "") => {
      const normalized = term.toLowerCase();
      const options = collection
        .filter((item) => (item.nombre || "").toLowerCase().includes(normalized))
        .map((item) => `<option value="${item.id}">${item.nombre}</option>`)
        .join("");
      selectEl.innerHTML = `<option value="">${placeholder}</option>${options}`;
    };
    renderOptions();
    if (searchEl) {
      searchEl.addEventListener("input", () => renderOptions(searchEl.value.trim()));
    }
    return () => renderOptions(searchEl ? searchEl.value.trim() : "");
  };

  const refreshIngredientOptions = setupSearchableSelect("#select-ingrediente", "#search-ingrediente-select", allIngredients, "Seleccionar ingrediente...");
  const refreshSupplyOptions = setupSearchableSelect("#select-insumo", "#search-insumo-select", allSupplies, "Seleccionar insumo...");
  const refreshEquipmentOptions = setupSearchableSelect("#select-equipment", "#search-equipment-select", allEquipments, "Seleccionar electrodoméstico...");

  const showEmptyState = (container, message) => {
    container.innerHTML = `<div class="item-list-empty">${message}</div>`;
  };

  const updateSummaryCounters = () => {
    const ingCount = form.querySelector("#summary-ingredients-count");
    const ingChip = form.querySelector("#summary-ingredients-chip");
    const supCount = form.querySelector("#summary-supplies-count");
    const supChip = form.querySelector("#summary-supplies-chip");
    const eqCount = form.querySelector("#summary-equipments-count");
    const eqChip = form.querySelector("#summary-equipments-chip");
    if (ingCount) ingCount.textContent = currentIngredientes.length;
    if (ingChip) ingChip.textContent = currentIngredientes.length;
    if (supCount) supCount.textContent = currentInsumos.length;
    if (supChip) supChip.textContent = currentInsumos.length;
    if (eqCount) eqCount.textContent = currentEquipments.length;
    if (eqChip) eqChip.textContent = currentEquipments.length;
  };

  function renderIngredientesList() {
    const container = form.querySelector("#ingredientes-list-container");
    if (!container) return;
    container.innerHTML = "";
    if (currentIngredientes.length === 0) {
      showEmptyState(container, "No has agregado ingredientes aún.");
      updateSummaryCounters();
      return;
    }
    currentIngredientes.forEach((item) => {
      const ing = allIngredients.find((i) => i.id === item.ingredienteId);
      if (!ing) return;
      const div = document.createElement("div");
      div.className = "item-edit-row";
      div.innerHTML = `
        <div class="item-edit-info">
          <strong>${ing.nombre}</strong>
          <small>${ing.unidadMedida || ""}</small>
        </div>
        <div class="item-edit-controls">
          <input type="number" class="form-input quantity-input" step="0.1" min="0" value="${parseFloat((item.cantidad || 0).toFixed(1))}" data-ingrediente-id="${item.ingredienteId}" />
          <button type="button" class="btn-delete-small" title="Eliminar">&times;</button>
        </div>
      `;
      const cantidadInput = div.querySelector("input");
      const updateCantidad = (e) => {
        const cantidad = Number(e.target.value) || 0;
        const index = currentIngredientes.findIndex((i) => i.ingredienteId === item.ingredienteId);
        if (index >= 0) currentIngredientes[index].cantidad = Math.max(0, cantidad);
      };
      cantidadInput.addEventListener("input", updateCantidad);
      cantidadInput.addEventListener("change", updateCantidad);
      div.querySelector(".btn-delete-small").addEventListener("click", () => {
        const index = currentIngredientes.findIndex((i) => i.ingredienteId === item.ingredienteId);
        if (index >= 0) currentIngredientes.splice(index, 1);
        renderIngredientesList();
      });
      container.appendChild(div);
    });
    updateSummaryCounters();
  }

  function renderInsumosList() {
    const container = form.querySelector("#insumos-list-container");
    if (!container) return;
    container.innerHTML = "";
    if (currentInsumos.length === 0) {
      showEmptyState(container, "No has agregado insumos aún.");
      updateSummaryCounters();
      return;
    }
    currentInsumos.forEach((item) => {
      const sup = allSupplies.find((s) => s.id === item.insumoId);
      if (!sup) return;
      const div = document.createElement("div");
      div.className = "item-edit-row";
      div.innerHTML = `
        <div class="item-edit-info">
          <strong>${sup.nombre}</strong>
          <small>${sup.formatoUnidad || ""}</small>
        </div>
        <div class="item-edit-controls">
          <input type="number" class="form-input quantity-input" step="0.1" min="0" value="${parseFloat((item.cantidad || 0).toFixed(1))}" data-insumo-id="${item.insumoId}" />
          <button type="button" class="btn-delete-small" title="Eliminar">&times;</button>
        </div>
      `;
      const cantidadInput = div.querySelector("input");
      const updateCantidad = (e) => {
        const cantidad = Number(e.target.value) || 0;
        const index = currentInsumos.findIndex((s) => s.insumoId === item.insumoId);
        if (index >= 0) currentInsumos[index].cantidad = Math.max(0, cantidad);
      };
      cantidadInput.addEventListener("input", updateCantidad);
      cantidadInput.addEventListener("change", updateCantidad);
      div.querySelector(".btn-delete-small").addEventListener("click", () => {
        const index = currentInsumos.findIndex((s) => s.insumoId === item.insumoId);
        if (index >= 0) currentInsumos.splice(index, 1);
        renderInsumosList();
      });
      container.appendChild(div);
    });
    updateSummaryCounters();
  }

  function renderEquipmentsList() {
    const container = form.querySelector("#equipments-list-container");
    if (!container) return;
    container.innerHTML = "";
    if (currentEquipments.length === 0) {
      showEmptyState(container, "No has agregado electrodomésticos aún.");
      updateSummaryCounters();
      return;
    }
    currentEquipments.forEach((item) => {
      const eq = allEquipments.find((e) => e.id === item.equipmentId);
      if (!eq) return;
      const div = document.createElement("div");
      div.className = "item-edit-row";
      const potenciaKw = (eq.potenciaWatts || 0) / 1000;
      div.innerHTML = `
        <div class="item-edit-info">
          <strong>${eq.nombre}</strong>
          <small>Potencia: ${formatQuantity(potenciaKw)} kW</small>
        </div>
        <div class="item-edit-controls time-edit-controls">
          <div class="time-edit-combo">
            <input type="number" class="form-input time-value-input" step="0.1" min="0" value="0" data-equipment-id="${item.equipmentId}" />
            <select class="form-input time-unit-select">
              <option value="hours">Horas</option>
              <option value="minutes">Minutos</option>
              <option value="seconds">Segundos</option>
            </select>
          </div>
          <button type="button" class="btn-delete-small" title="Eliminar">&times;</button>
        </div>
      `;
      const valueInput = div.querySelector(".time-value-input");
      const unitSelect = div.querySelector(".time-unit-select");
      const syncInputs = () => {
        valueInput.value = formatInputValue(convertFromHours(item.tiempoHoras || 0, unitSelect.value));
      };
      syncInputs();

      const updateTiempo = () => {
        const index = currentEquipments.findIndex((eqItem) => eqItem.equipmentId === item.equipmentId);
        if (index >= 0) {
          const numericValue = Number(valueInput.value) || 0;
          currentEquipments[index].tiempoHoras = Math.max(0, convertToHours(numericValue, unitSelect.value));
        }
      };

      valueInput.addEventListener("input", updateTiempo);
      valueInput.addEventListener("change", updateTiempo);
      unitSelect.addEventListener("change", () => {
        syncInputs();
        updateTiempo();
      });

      div.querySelector(".btn-delete-small").addEventListener("click", () => {
        const index = currentEquipments.findIndex((eqItem) => eqItem.equipmentId === item.equipmentId);
        if (index >= 0) currentEquipments.splice(index, 1);
        renderEquipmentsList();
      });
      container.appendChild(div);
    });
    updateSummaryCounters();
  }

  form.querySelector("#btn-add-ingrediente").addEventListener("click", () => {
    const select = form.querySelector("#select-ingrediente");
    const cantidad = form.querySelector("#cantidad-ingrediente");
    if (select.value && cantidad.value) {
      currentIngredientes.push({
        ingredienteId: select.value,
        cantidad: Math.max(0, Number(cantidad.value)),
      });
      renderIngredientesList();
      refreshIngredientOptions();
      select.value = "";
      cantidad.value = "";
    }
  });

  form.querySelector("#btn-add-insumo").addEventListener("click", () => {
    const select = form.querySelector("#select-insumo");
    const cantidad = form.querySelector("#cantidad-insumo");
    if (select.value && cantidad.value) {
      currentInsumos.push({
        insumoId: select.value,
        cantidad: Math.max(0, Number(cantidad.value)),
      });
      renderInsumosList();
      refreshSupplyOptions();
      select.value = "";
      cantidad.value = "";
    }
  });

  form.querySelector("#btn-add-equipment").addEventListener("click", () => {
    const select = form.querySelector("#select-equipment");
    const tiempoInput = form.querySelector("#tiempo-equipment");
    const unidadSelect = form.querySelector("#tiempo-equipment-unit");
    if (select.value && tiempoInput.value) {
      currentEquipments.push({
        equipmentId: select.value,
        tiempoHoras: Math.max(0, convertToHours(Number(tiempoInput.value), unidadSelect.value)),
      });
      renderEquipmentsList();
      refreshEquipmentOptions();
      select.value = "";
      tiempoInput.value = "";
      unidadSelect.value = "hours";
    }
  });

  renderIngredientesList();
  renderInsumosList();
  renderEquipmentsList();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      id: recipe?.id,
      nombreReceta: form.querySelector("#modal-rec-nombre").value.trim(),
      descripcion: form.querySelector("#modal-rec-desc").value.trim(),
      rendimientoBase: Number(form.querySelector("#modal-rec-rendimiento").value) || 1,
      tiempoHornoMinutos: form.querySelector("#modal-rec-tiempo-horno").value ? Number(form.querySelector("#modal-rec-tiempo-horno").value) : null,
      temperaturaHorno: form.querySelector("#modal-rec-temperatura").value ? Number(form.querySelector("#modal-rec-temperatura").value) : null,
      pasosPreparacion: form.querySelector("#modal-rec-pasos").value.trim(),
      ingredientes: currentIngredientes,
      insumos: currentInsumos,
      equipments: currentEquipments,
    };
    onSubmit(payload);
  });

  form.querySelector(".btn-cancel").addEventListener("click", onCancel);

  return form;
}



