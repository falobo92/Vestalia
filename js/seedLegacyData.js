import { 
  generateId, 
  normalizeNumber, 
  replaceAllData, 
  forceSaveToLocalStorage 
} from "./dataStore.js";

export function loadLegacyData() {
  console.log("Iniciando restauración de datos de fábrica...");

  const ingredients = [];
  const supplies = [];
  const equipments = [];
  const recipes = [];
  const recipeIngredients = [];
  const recipeSupplies = [];
  const recipeEquipments = [];

  // Helper para IDs
  const createId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

  // 1. INGREDIENTES ORIGINALES
  const ingData = [
    ["Aceite", 900, 1690, "Unimarc"],
    ["Acido cítrico", 100, 990, ""],
    ["Agua", 20000, 3000, ""],
    ["Almendras", 1000, 9800, "La vega"],
    ["Amapola", 125, 1490, "feria"],
    ["Avellana europea", 1000, 13500, "La vega"],
    ["Azúcar", 1000, 1000, ""],
    ["Azúcar flor", 500, 970, ""],
    ["Azúcar morena", 1000, 1700, "La vega"],
    ["Bicarbonato", 100, 490, ""],
    ["Cacao en polvo", 150, 2350, "La vega"],
    ["Café instantaneo", 220, 8290, ""],
    ["Canela en polvo", 500, 6900, ""],
    ["Chancaca", 400, 1890, "Central Mayorista"],
    ["Chocolate blanco chip", 1000, 8750, "Tienda dulce"],
    ["Chocolate blanco Sicao 31%", 1000, 26090, "Tienda dulce"],
    ["Chocolate negro chip", 770, 5990, "Tienda dulce"],
    ["Chocolate sicao 58% cacao", 1000, 26090, "Tienda dulce"],
    ["Claras", 1500, 7000, "Don Héctor"],
    ["Clavo de olor en polvo", 100, 2200, "La vega"],
    ["Crema de leche 35% materia grasa", 1000, 3470, "Central Mayorista"],
    ["Croissant", 10, 5526, "Elaboración propia"],
    ["Esencia de vainilla", 500, 2590, "Lider"],
    ["Frutilla", 2000, 5890, ""],
    ["Gelatina 180° Bloom", 30, 930, ""],
    ["Glucosa", 1000, 4090, "Tienda dulce"],
    ["Harina de almendras", 250, 4500, "Tostaduría Talca"],
    ["Harina de fuerza", 25000, 22253, "LeeFood"],
    ["Harina floja", 25000, 18445, "La estampa"],
    ["Higo", 1000, 10200, "La Vega"],
    ["Huevos", 1500, 7000, "Don Héctor"],
    ["Jengibre en polvo", 250, 2000, "La vega"],
    ["Jugo de limón", 2000, 1000, ""],
    ["Jugo de naranja", 3000, 6600, ""],
    ["Leche condensada", 397, 1390, "Central Mayorista"],
    ["Leche en polvo", 900, 7650, ""],
    ["Leche entera", 1000, 1100, "Unimarc"],
    ["leche evaporada", 410, 1510, "Central Mayorista"],
    ["Levadura fresca", 500, 2750, "Líder"],
    ["Licor Cointreau", 700, 26002, ""],
    ["Maicena", 500, 3090, "Líder"],
    ["Maicena (almidón de maíz)", 1000, 2000, ""],
    ["Manjar", 1000, 4090, "Líder"],
    ["Mantequilla con sal", 250, 2550, ""],
    ["Mantequilla extra seca", 700, 7900, ""],
    ["Mantequilla sin sal", 250, 2500, "La vega"],
    ["Manzana", 1000, 1000, ""],
    ["Masa base croissant", 780.3, 2776, "Elaboración propia"],
    ["Merengue en polvo", 1000, 3800, "La Vega"],
    ["Mermelada de naranja", 1000, 1600, "Elaboración propia"],
    ["Miel", 1000, 4900, "La vega"],
    ["Naranja", 1000, 800, ""],
    ["Naranja confitada", 1000, 10000, "La vega"],
    ["Nueces", 1000, 8500, "La vega"],
    ["Nuez moscada en polvo", 100, 2200, "La vega"],
    ["Pasas morenas", 100, 790, ""],
    ["Pasta de almendras", 1000, 11250, "Elaboración propia"],
    ["Pasta de avellanas", 3000, 15000, ""],
    ["Pasta de vainilla", 1000, 51680, ""],
    ["Pectina NH", 100, 6390, ""],
    ["Polvos de hornear", 1000, 3200, "La vega"],
    ["Puré de frambuesa", 400, 3200, ""],
    ["Ron añejo", 1000, 5190, "Unimarc"],
    ["Sal", 1000, 450, ""],
    ["Sobrantes de masa", 1030.3, 5526, "Elaboración propia"],
    ["Vaina de vainilla (unidad)", 1, 4490, "Líder"],
    ["Vinagre", 500, 950, "Lider"],
    ["Yemas", 1500, 7000, "Don Héctor"],
    ["Yogurth", 140, 700, "Supermercado"],
    ["Zeste de limón", 2000, 1000, ""],
    ["Zeste de naranja", 130, 2090, ""],
  ];

  for (const [nombre, formatoCantidad, costoFormato, proveedor] of ingData) {
    const cantidadNum = normalizeNumber(formatoCantidad, 0);
    const costoNum = normalizeNumber(costoFormato, 0);
    const costoUnitario = cantidadNum > 0 ? costoNum / cantidadNum : 0;
    
    ingredients.push({
      id: createId("ing"),
      nombre: nombre,
      unidadMedida: "g", // Default
      formatoCantidad: cantidadNum,
      formatoUnidad: "",
      costoFormato: costoNum,
      costoUnitario: costoUnitario,
      proveedor: proveedor || ""
    });
  }

  // 2. INSUMOS ORIGINALES
  const supData = [
    ["Caja torta", 1, 1800],
    ["Gauntes", 1, 0],
    ["Manga pastelera", 1, 0],
    ["Bolsa celofán 15x25", 100, 1700],
    ["Stickers Vestalia", 100, 5000],
    ["Bandeja redonda", 1, 990],
    ["Blonda redonda", 1, 1190],
    ["Bolsa celofán 30x40", 100, 5800],
    ["Capsula individual", 100, 5000],
    ["Capsula panetonne", 30, 5400],
    ["Capsula pan de pascua", 20, 3200],
    ["Alusa", 300, 5500],
  ];

  for (const [nombre, formatoCantidad, costoFormato] of supData) {
    const cantidadNum = normalizeNumber(formatoCantidad, 0);
    const costoNum = normalizeNumber(costoFormato, 0);
    const costoUnitario = cantidadNum > 0 ? costoNum / cantidadNum : 0;

    supplies.push({
      id: createId("sup"),
      nombre: nombre,
      formatoCantidad: cantidadNum,
      formatoUnidad: "unidad",
      costoFormato: costoNum,
      costoUnitario: costoUnitario
    });
  }

  // 3. EQUIPOS ORIGINALES
  const eqData = [
    ["Horno", 2770],
    ["Cocina", 6000],
    ["Thermomix sin calor", 500],
    ["Thermomix con calor", 1500],
    ["Batidora pedestal FDV", 800],
  ];

  for (const [nombre, potenciaWatts] of eqData) {
    equipments.push({
      id: createId("eq"),
      nombre: nombre,
      potenciaWatts: normalizeNumber(potenciaWatts, 0),
      costoKwh: null, // Global
      formulaKwh: "(potenciaWatts / 1000) * tiempoHoras"
    });
  }

  // 4. RECETAS ORIGINALES
  
  // Receta 1: Cupcakes (Ejemplo con relaciones)
  const recetaCupcake = {
    id: createId("rec"),
    nombreReceta: "Cupcakes de vainilla",
    descripcion: "Cupcakes esponjosos de vainilla clásica.",
    rendimientoBase: 12,
    tiempoHornoMinutos: 20,
    temperaturaHorno: 180,
    pasosPreparacion: "1) Batir mantequilla con azúcar.\n2) Agregar huevos.\n3) Incorporar harina.\n4) Hornear.",
  };
  recipes.push(recetaCupcake);

  // Relaciones Cupcakes
  const addRel = (type, itemName, qty) => {
    if (type === 'ing') {
      const item = ingredients.find(i => i.nombre === itemName);
      if (item) recipeIngredients.push({ id: createId("ri"), recetaId: recetaCupcake.id, ingredienteId: item.id, cantidadPorRendimientoBase: qty });
    } else if (type === 'sup') {
      const item = supplies.find(i => i.nombre === itemName);
      if (item) recipeSupplies.push({ id: createId("rs"), recetaId: recetaCupcake.id, insumoId: item.id, cantidadPorRendimientoBase: qty });
    }
  };

  addRel('ing', "Harina floja", 200);
  addRel('ing', "Azúcar", 150);
  addRel('ing', "Mantequilla sin sal", 120);
  addRel('ing', "Huevos", 3); // Asumiendo que son gramos en realidad o unidades mapeadas
  addRel('sup', "Caja torta", 1);

  // Receta 2: Pan de Pascua (Completa)
  const panPascua = {
    id: createId("rec"),
    nombreReceta: "Pan de pascua",
    descripcion: "Pan de pascua tradicional de 1 kg",
    rendimientoBase: 1,
    tiempoHornoMinutos: 90,
    temperaturaHorno: 180,
    pasosPreparacion: "1) Batir mantequilla con azúcar.\n2) Agregar huevos y miel...\n(Ver receta completa en sistema)",
  };
  recipes.push(panPascua);

  const ppIngs = [
    { nombre: "Mantequilla sin sal", cantidad: 112.45 },
    { nombre: "Azúcar morena", cantidad: 112.45 },
    { nombre: "Harina floja", cantidad: 240.96 },
    { nombre: "Huevos", cantidad: 168.67 },
    { nombre: "Miel", cantidad: 32.13 },
    { nombre: "Polvos de hornear", cantidad: 8.03 },
    { nombre: "Bicarbonato", cantidad: 4.02 },
    { nombre: "Higo", cantidad: 128.51 },
    { nombre: "Naranja confitada", cantidad: 48.19 },
    { nombre: "Almendras", cantidad: 51.41 },
    { nombre: "Nueces", cantidad: 51.41 },
    { nombre: "Avellana europea", cantidad: 25.70 },
    { nombre: "Nuez moscada en polvo", cantidad: 4.02 },
    { nombre: "Ron añejo", cantidad: 51.41 },
    { nombre: "Jengibre en polvo", cantidad: 4.02 },
    { nombre: "Canela en polvo", cantidad: 4.02 },
    { nombre: "Clavo de olor en polvo", cantidad: 4.02 }
  ];
  
  ppIngs.forEach(item => {
    const ing = ingredients.find(i => i.nombre === item.nombre);
    if (ing) recipeIngredients.push({ id: createId("ri"), recetaId: panPascua.id, ingredienteId: ing.id, cantidadPorRendimientoBase: item.cantidad });
  });

  const ppSups = [
    { nombre: "Capsula pan de pascua", cantidad: 1 },
    { nombre: "Bolsa celofán 30x40", cantidad: 1 },
    { nombre: "Stickers Vestalia", cantidad: 1 },
  ];

  ppSups.forEach(item => {
    const sup = supplies.find(s => s.nombre === item.nombre);
    if (sup) recipeSupplies.push({ id: createId("rs"), recetaId: panPascua.id, insumoId: sup.id, cantidadPorRendimientoBase: item.cantidad });
  });

  const ppEqs = [
    { nombre: "Batidora pedestal FDV", tiempoHoras: 0.25 },
    { nombre: "Horno", tiempoHoras: 1.5 },
  ];

  ppEqs.forEach(item => {
    const eq = equipments.find(e => e.nombre === item.nombre);
    if (eq) recipeEquipments.push({ id: createId("re"), recetaId: panPascua.id, equipmentId: eq.id, tiempoHoras: item.tiempoHoras });
  });

  // Lista de nombres de recetas adicionales (solo cabeceras)
  const simpleRecipes = [
    "Pie", "Crocante de lúcuma", "Torta merengue manjar", "Mini dulces", "Tapaditos",
    "Barquillos", "Merengue", "Empolvados", "Alfajor de maicena", "Príncipes",
    "Queque de naranja", "Caluga chocolate blanco", "Caluga café", "Caluga nuez",
    "Medias lunas", "Manjarcitos", "Pan de chocolate", "Croissant", "Panettone"
  ];

  for (const name of simpleRecipes) {
    recipes.push({
      id: createId("rec"),
      nombreReceta: name,
      rendimientoBase: 1,
      descripcion: "",
      pasosPreparacion: ""
    });
  }

  // GUARDAR TODO EN STORE
  replaceAllData({
    ingredients,
    supplies,
    equipments,
    recipes,
    recipeIngredients,
    recipeSupplies,
    recipeEquipments,
    costoKwhGlobal: 230
  });

  return { recipeCount: recipes.length, ingredientCount: ingredients.length };
}

