const FONT_SIZE_RELLENO = 16;
const FONT_SIZE_SITIO = 32; // Doble tamaño para el código/nombre del sitio
const FONT_SIZE_SPAT_PCT = 24; // Mitad del tamaño de los valores en rojo (v5)
const FONT_SIZE_SPAT_OHM = 48; // 3x más grande para lecturas de pozo a tierra (v5)

function setFuenteRelleno(ctx, color = "#111827", align = "center", baseline = "middle", size = FONT_SIZE_RELLENO) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
}

function activarTab(targetId, btnEl) {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  tabPanels.forEach((p) => p.classList.remove("active"));

  if (btnEl) {
    btnEl.classList.add("active");
    btnEl.setAttribute("aria-selected", "true");
  }
  const panel = document.getElementById(targetId);
  if (panel) panel.classList.add("active");

  dibujarTodo();
}

window.activarTab = activarTab;

function getSitio() {
  const input = document.getElementById("sitio");
  const val = input ? input.value : "";
  return val.trim().toUpperCase() || "SITIO";
}

function getSitioSlug() {
  return getSitio().replace(/[^A-Z0-9_-]+/g, "_") || "SITIO";
}

function parsePositiveNum(val, fallback = 0) {
  const num = parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.max(0, num);
}

function formatNum(val, dec = 2, fallback = 0) {
  return parsePositiveNum(val, fallback).toFixed(dec);
}

function setAviso(elementId, mensaje) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (mensaje) {
    el.textContent = mensaje;
    el.hidden = false;
  } else {
    el.textContent = "";
    el.hidden = true;
  }
}

function descargarCanvas(canvasId, prefijo) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `${prefijo}_${getSitioSlug()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function dibujarSimboloTorre(ctx, tipo, cx, cy, sizeMultiplier = 1) {
  ctx.save();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3.5;

  let textOffsetY = 0;

  if (tipo === "auto_cuadrado") {
    const s = 148 * sizeMultiplier;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
  } else if (tipo === "auto_triangulo") {
    const r = 82 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx - r * 0.9, cy + r * 0.72);
    ctx.lineTo(cx + r * 0.9, cy + r * 0.72);
    ctx.closePath();
    ctx.stroke();
    textOffsetY = 14 * sizeMultiplier;
  } else if (tipo === "monopolo") {
    const rad = 64 * sizeMultiplier;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tipo === "ventada") {
    const s = 86 * sizeMultiplier;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
  } else if (tipo === "arriostrada") {
    const rad = 40 * sizeMultiplier;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  setFuenteRelleno(ctx, "#111827", "center", "middle");
  ctx.fillText("TORRE", cx, cy + textOffsetY);
  ctx.restore();
}

function dibujarPozo(ctx, x, y, label) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2.5;
  ctx.fillRect(x - 14, y - 18, 28, 36);
  ctx.strokeRect(x - 14, y - 18, 28, 36);

  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y);
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x + 6, y + 6);
  ctx.moveTo(x - 3, y + 12);
  ctx.lineTo(x + 3, y + 12);
  ctx.stroke();

  setFuenteRelleno(ctx, "#111827", "center", "bottom");
  ctx.fillText(label, x, y - 22);
  ctx.restore();
}

function dibujarPuertaDobleHorizontal(ctx, x, y, anchoTotal, dirY = 1) {
  const half = anchoTotal / 2;
  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 2, y - 6, anchoTotal + 4, 12);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x, y + 6);
  ctx.moveTo(x + anchoTotal, y - 6);
  ctx.lineTo(x + anchoTotal, y + 6);
  ctx.stroke();

  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + dirY * half);
  ctx.moveTo(x + anchoTotal, y);
  ctx.lineTo(x + anchoTotal, y + dirY * half);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  if (dirY > 0) {
    ctx.arc(x, y, half, 0, Math.PI / 2, false);
    ctx.arc(x + anchoTotal, y, half, Math.PI / 2, Math.PI, false);
  } else {
    ctx.arc(x, y, half, -Math.PI / 2, 0, false);
    ctx.arc(x + anchoTotal, y, half, -Math.PI, -Math.PI / 2, false);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* =========================================================
   PESTAÑA 1: DIAGRAMA SPAT (F12M)
   ========================================================= */
function dibujarSpat() {
  const canvas = document.getElementById("canvasSpat");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const sitio = getSitio();
  const tipoTorre = document.getElementById("spatTipoTorre").value;
  const cantPozos = Math.min(6, Math.max(1, parseInt(document.getElementById("cantidadPozos").value, 10) || 3));
  const v50 = formatNum(document.getElementById("val50").value, 2);
  const v60 = formatNum(document.getElementById("val60").value, 2);
  const v70 = formatNum(document.getElementById("val70").value, 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxX = 65;
  const boxY = 55;
  const boxW = 380;
  const boxH = 400;

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  const centerX = boxX + boxW / 2;
  ctx.save();
  setFuenteRelleno(ctx, "#dc2626", "center", "middle", FONT_SIZE_SITIO);
  ctx.fillText(sitio, centerX, boxY + 42);
  ctx.restore();

  dibujarSimboloTorre(ctx, tipoTorre, centerX, boxY + boxH / 2 + 30, 1);

  const posicionesPozos = [
    { x: boxX + 275, y: boxY + 325 },
    { x: boxX + 275, y: boxY + 125 },
    { x: boxX + 190, y: boxY + 100 },
    { x: boxX + 95,  y: boxY + 125 },
    { x: boxX + 95,  y: boxY + 325 },
    { x: boxX + 185, y: boxY + 350 }
  ];

  if (cantPozos > 1) {
    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < cantPozos; i++) {
      const p = posicionesPozos[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < cantPozos; i++) {
    dibujarPozo(ctx, posicionesPozos[i].x, posicionesPozos[i].y, `PT0${i + 1}`);
  }

  const pt01 = posicionesPozos[0];
  const doorWidth = 76;
  const doorX = pt01.x - 28;
  const doorY = boxY + boxH;
  dibujarPuertaDobleHorizontal(ctx, doorX, doorY, doorWidth, 1);

  const telX = 435;
  const telY = 545;
  const telW = 30;
  const telH = 78;

  ctx.save();
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(pt01.x, pt01.y + 18);
  ctx.lineTo(pt01.x, doorY + 62);
  ctx.lineTo(telX + 10, telY + 18);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.fillRect(telX, telY, telW, telH);
  ctx.strokeRect(telX, telY, telW, telH);

  setFuenteRelleno(ctx, "#111827", "left", "middle");
  ctx.fillText("TELUROMETRO", telX + 38, telY + 24);
  ctx.restore();

  const endBlueX = 595;
  const endBlueY = 825;
  ctx.save();
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(telX + 8, telY + telH);
  ctx.lineTo(endBlueX, endBlueY);
  ctx.stroke();

  const endRedX = 720;
  const endRedY = 935;
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(telX + 22, telY + telH);
  ctx.lineTo(endRedX, endRedY);
  ctx.stroke();
  ctx.restore();

  // Valores en rojo desplazados más a la derecha para no cruzarse con la línea diagonal roja
  const lecturas = [
    { pct: "50%-15MTS=", ohm: `${v50} OHMS`, x: 565, y: 635 },
    { pct: "60%-18MTS=", ohm: `${v60} OHMS`, x: 645, y: 745 },
    { pct: "70%-21MTS=", ohm: `${v70} OHMS`, x: 725, y: 855 }
  ];

  lecturas.forEach((item) => {
    ctx.save();
    setFuenteRelleno(ctx, "#111827", "left", "top", FONT_SIZE_SPAT_PCT);
    ctx.fillText(item.pct, item.x, item.y);

    setFuenteRelleno(ctx, "#dc2626", "left", "top", FONT_SIZE_SPAT_OHM);
    ctx.fillText(item.ohm, item.x, item.y + 28);
    ctx.restore();
  });

  ctx.save();
  setFuenteRelleno(ctx, "#111827", "center", "top");
  ctx.fillText("30 MTS", endRedX, endRedY + 12);
  ctx.restore();

  setAviso("avisoSpat", "");
}

/* =========================================================
   PESTAÑA 2: ESQUEMA 1 - PERÍMETRO Y COORDENADAS INCLINADAS
   ========================================================= */
function dibujarCoordInclinada(ctx, x, y, titulo, coordTexto, angleRad) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  // Texto inclinado directo sin marco de rectángulo
  setFuenteRelleno(ctx, "#111827", "center", "middle");
  ctx.fillText(titulo, 0, -13);
  ctx.fillText(coordTexto || "-", 0, 13);
  ctx.restore();
}

function dibujarPerimetro() {
  const canvas = document.getElementById("canvasPerimetro");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const sitio = getSitio();
  const rawAncho = parseFloat(document.getElementById("perAncho").value);
  const rawLargo = parseFloat(document.getElementById("perLargo").value);
  const invalido = isNaN(rawAncho) || isNaN(rawLargo) || rawAncho <= 0 || rawLargo <= 0;

  const numAncho = rawAncho > 0 ? rawAncho : 8.1;
  const numLargo = rawLargo > 0 ? rawLargo : 10.0;
  const ancho = numAncho.toFixed(2);
  const largo = numLargo.toFixed(2);

  const tipoTorre = document.getElementById("perTipoTorre").value;
  const coordA = document.getElementById("coordA").value.trim();
  const coordB = document.getElementById("coordB").value.trim();
  const coordC = document.getElementById("coordC").value.trim();
  const coordD = document.getElementById("coordD").value.trim();

  setAviso(
    "avisoPerimetro",
    invalido ? "Ingresa valores mayores a 0 en Ancho y Largo para calcular la proporción exacta." : ""
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ratio = numAncho / numLargo;
  const maxW = 640;
  const maxH = 520;
  const minSide = 310;
  let rectW = maxW;
  let rectH = maxH;

  if (ratio >= 1) {
    rectW = maxW;
    rectH = Math.max(minSide, Math.min(maxH, maxW / ratio));
  } else {
    rectH = maxH;
    rectW = Math.max(minSide, Math.min(maxW, maxH * ratio));
  }

  const rectX = (canvas.width - rectW) / 2;
  const rectY = 145;

  const doorW = 84;
  const doorX = rectX + 24;
  const doorY = rectY;
  dibujarPuertaDobleHorizontal(ctx, doorX, doorY, doorW, -1);

  ctx.save();
  const calloutX = rectX - 24;
  const calloutY = rectY - 84;
  const calloutW = 190;
  const calloutH = 42;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  ctx.fillRect(calloutX, calloutY, calloutW, calloutH);
  ctx.strokeRect(calloutX, calloutY, calloutW, calloutH);

  ctx.beginPath();
  ctx.moveTo(calloutX + calloutW * 0.55, calloutY + calloutH);
  ctx.lineTo(doorX + doorW * 0.5, doorY - 40);
  ctx.stroke();

  setFuenteRelleno(ctx, "#111827", "center", "middle");
  ctx.fillText("PUERTA DE ACCESO", calloutX + calloutW / 2, calloutY + calloutH / 2);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 4;
  ctx.strokeRect(rectX, rectY, rectW, rectH);
  ctx.restore();

  const centerRectX = rectX + rectW / 2;
  const centerRectY = rectY + rectH / 2;

  // Cotas superiores e inferiores (Ancho) sin marco de rectángulo
  [rectY - 24, rectY + rectH + 26].forEach((cy) => {
    ctx.save();
    setFuenteRelleno(ctx, "#111827", "center", "middle");
    ctx.fillText(`MTS ${ancho}`, centerRectX, cy);
    ctx.restore();
  });

  // Cotas izquierda y derecha (Largo) sin marco de rectángulo
  [rectX - 28, rectX + rectW + 28].forEach((cx) => {
    ctx.save();
    ctx.translate(cx, centerRectY);
    ctx.rotate(-Math.PI / 2);
    setFuenteRelleno(ctx, "#111827", "center", "middle");
    ctx.fillText(`MTS ${largo}`, 0, 0);
    ctx.restore();
  });

  const sizeMult = Math.max(0.55, Math.min(0.85, Math.min(rectW, rectH) / 480));
  ctx.save();
  setFuenteRelleno(ctx, "#dc2626", "center", "middle", FONT_SIZE_SITIO);
  ctx.fillText(sitio, centerRectX, centerRectY - 92 * sizeMult);
  ctx.restore();

  dibujarSimboloTorre(ctx, tipoTorre, centerRectX, centerRectY + 18 * sizeMult, sizeMult);

  const diagOffsetX = Math.min(125, rectW * 0.24);
  const diagOffsetY = Math.min(78, rectH * 0.22);

  dibujarCoordInclinada(ctx, rectX + diagOffsetX, rectY + diagOffsetY, "COORDENADA A:", coordA, -Math.PI / 4);
  dibujarCoordInclinada(ctx, rectX + rectW - diagOffsetX, rectY + diagOffsetY, "COORDENADA B:", coordB, Math.PI / 4);
  dibujarCoordInclinada(ctx, rectX + rectW - diagOffsetX, rectY + rectH - diagOffsetY, "COORDENADA C:", coordC, -Math.PI / 4);
  dibujarCoordInclinada(ctx, rectX + diagOffsetX, rectY + rectH - diagOffsetY, "COORDENADA D:", coordD, Math.PI / 4);
}

/* =========================================================
   PESTAÑA 3: ESQUEMA 2 - ELEVACIÓN DE TORRE (EXACTAMENTE IGUAL A V5)
   ========================================================= */
const MODELOS_TORRE = {
  arbol: {
    nombre: "Torre público tipo árbol",
    src: "img/1_torre_arbol.png",
    sitioPos: { xRatio: 0.21, yRatio: 0.135 },
    cotas: (v) => [
      { texto: `${v.alturaTotal} m`, xRatio: 0.032, yRatio: 0.485, size: 17 },
      { texto: `${v.alturaBase} m`,  xRatio: 0.870, yRatio: 0.945, size: 16 }
    ]
  },
  monopolo: {
    nombre: "Torre monopolo",
    src: "img/2_torre_monopolo.png",
    sitioPos: { xRatio: 0.30, yRatio: 0.165 },
    cotas: (v) => [
      { texto: `${v.alturaTotal} m`, xRatio: 0.055, yRatio: 0.448, size: 18 },
      { texto: `${v.alturaBase} m`,  xRatio: 0.855, yRatio: 0.962, size: 15 },
      { texto: `${v.rol1Sup} m`,     xRatio: 0.785, yRatio: 0.125, size: 15 },
      { texto: `${v.rol1Inf} m`,     xRatio: 0.785, yRatio: 0.165, size: 15 },
      { texto: `${v.rol2Sup} m`,     xRatio: 0.785, yRatio: 0.245, size: 15 },
      { texto: `${v.rol2Inf} m`,     xRatio: 0.785, yRatio: 0.285, size: 15 },
      { texto: `${v.rol3Sup} m`,     xRatio: 0.815, yRatio: 0.365, size: 15 },
      { texto: `${v.rol3Inf} m`,     xRatio: 0.805, yRatio: 0.405, size: 15 }
    ]
  },
  autosoportada_normal: {
    nombre: "Torre autosoportada (roldana normal)",
    src: "img/3_torre_autosoportada_normal.png",
    sitioPos: { xRatio: 0.18, yRatio: 0.115 },
    cotas: (v) => [
      { texto: `${v.roldanaSup} m`,  xRatio: 0.165, yRatio: 0.502, size: 16 },
      { texto: `${v.roldanaInf} m`,  xRatio: 0.775, yRatio: 0.562, size: 16 },
      { texto: `${v.alturaTotal} m`, xRatio: 0.892, yRatio: 0.452, size: 16 },
      { texto: `${v.alturaBase} m`,  xRatio: 0.545, yRatio: 0.945, size: 16 }
    ]
  },
  arriostrada_escalera_gato: {
    nombre: "Torre arriostrada con escalera gato",
    src: "img/4_torre_arriostrada_escalera.png",
    sitioPos: { xRatio: 0.19, yRatio: 0.165 },
    cotas: (v) => [
      { texto: `${v.alturaBase} m`,     xRatio: 0.175, yRatio: 0.432, size: 15 },
      { texto: `${v.alturaTotal} m`,    xRatio: 0.655, yRatio: 0.278, size: 16 },
      { texto: `${v.alturaEscalera} m`, xRatio: 0.745, yRatio: 0.525, size: 15 },
      { texto: `${v.alturaEdificio} m`, xRatio: 0.870, yRatio: 0.790, size: 15 }
    ]
  },
  ventada_edificio: {
    nombre: "Torre ventada con edificio",
    src: "img/5_torre_ventada_edificio.png",
    sitioPos: { xRatio: 0.22, yRatio: 0.165 },
    cotas: (v) => [
      { texto: `${v.alturaTotal} m`,    xRatio: 0.775, yRatio: 0.342, size: 16 },
      { texto: `${v.alturaBase} m`,     xRatio: 0.535, yRatio: 0.512, size: 15 },
      { texto: `${v.alturaEdificio} m`, xRatio: 0.848, yRatio: 0.818, size: 16 }
    ]
  },
  ventada_piso: {
    nombre: "Torre ventada de piso",
    src: "img/6_torre_ventada_piso.png",
    sitioPos: { xRatio: 0.20, yRatio: 0.165 },
    cotas: (v) => [
      { texto: `${v.alturaTotal} m`, xRatio: 0.865, yRatio: 0.538, size: 16 },
      { texto: `${v.alturaBase} m`,  xRatio: 0.575, yRatio: 0.960, size: 15 }
    ]
  },
  autosoportada_encima: {
    nombre: "Torre autosoportada (roldana encima)",
    src: "img/7_torre_autosoportada_encima.png",
    sitioPos: { xRatio: 0.20, yRatio: 0.115 },
    cotas: (v) => [
      { texto: `${v.roldanaSup} m`,  xRatio: 0.165, yRatio: 0.495, size: 16 },
      { texto: `${v.roldanaInf} m`,  xRatio: 0.775, yRatio: 0.548, size: 16 },
      { texto: `${v.alturaTotal} m`, xRatio: 0.885, yRatio: 0.440, size: 16 },
      { texto: `${v.alturaBase} m`,  xRatio: 0.545, yRatio: 0.935, size: 16 }
    ]
  },
  arriostrada_edificio_normal: {
    nombre: "Torre arriostrada con edificio normal",
    src: "img/8_torre_arriostrada_edificio.png",
    sitioPos: { xRatio: 0.22, yRatio: 0.175 },
    cotas: (v) => [
      { texto: `${v.alturaBase} m`,     xRatio: 0.165, yRatio: 0.548, size: 16 },
      { texto: `${v.alturaTotal} m`,    xRatio: 0.775, yRatio: 0.342, size: 16 },
      { texto: `${v.alturaEdificio} m`, xRatio: 0.838, yRatio: 0.812, size: 16 }
    ]
  }
};

const cacheImagenesTorre = {};

function obtenerImagenTorre(tipo, callback) {
  if (cacheImagenesTorre[tipo] && cacheImagenesTorre[tipo].complete && cacheImagenesTorre[tipo].naturalWidth > 0) {
    callback(cacheImagenesTorre[tipo], true);
    return;
  }

  const modelo = MODELOS_TORRE[tipo];
  if (!modelo) {
    callback(null, false);
    return;
  }

  const img = new Image();
  img.onload = () => {
    cacheImagenesTorre[tipo] = img;
    callback(img, true);
  };
  img.onerror = () => {
    callback(null, false);
  };
  img.src = modelo.src;
}

function actualizarCamposTorre() {
  const tipo = document.getElementById("torreTipo").value;
  const isMonopolo = tipo === "monopolo";
  const isStdRoldana = tipo === "autosoportada_normal" || tipo === "autosoportada_encima";
  const hasEscalera = tipo === "arriostrada_escalera_gato";
  const hasEdificio =
    tipo === "ventada_edificio" ||
    tipo === "arriostrada_edificio_normal" ||
    tipo === "arriostrada_escalera_gato";

  document.querySelectorAll(".grp-monopolo").forEach((el) => (el.hidden = !isMonopolo));
  document.querySelectorAll(".grp-roldana-std").forEach((el) => (el.hidden = !isStdRoldana));
  document.querySelectorAll(".grp-edificio").forEach((el) => (el.hidden = !hasEdificio));
  document.querySelectorAll(".grp-escalera").forEach((el) => (el.hidden = !hasEscalera));
}

function dibujarTorreElevacion() {
  const canvas = document.getElementById("canvasTorre");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  actualizarCamposTorre();

  const sitio = getSitio();
  const tipoTorre = document.getElementById("torreTipo").value;
  const modelo = MODELOS_TORRE[tipoTorre];

  const rawAlturaTotal = parseFloat(document.getElementById("alturaTorre").value);
  const rawAlturaBase = parseFloat(document.getElementById("alturaBase").value);

  const valores = {
    alturaTotal: formatNum(document.getElementById("alturaTorre").value, 2, 30),
    alturaBase: formatNum(document.getElementById("alturaBase").value, 2, 1.2),
    roldanaSup: formatNum(document.getElementById("roldanaSup").value, 2, 28.5),
    roldanaInf: formatNum(document.getElementById("roldanaInf").value, 2, 27.3),
    rol1Sup: formatNum(document.getElementById("rol1Sup").value, 2, 29.0),
    rol1Inf: formatNum(document.getElementById("rol1Inf").value, 2, 27.8),
    rol2Sup: formatNum(document.getElementById("rol2Sup").value, 2, 26.0),
    rol2Inf: formatNum(document.getElementById("rol2Inf").value, 2, 24.8),
    rol3Sup: formatNum(document.getElementById("rol3Sup").value, 2, 23.0),
    rol3Inf: formatNum(document.getElementById("rol3Inf").value, 2, 21.8),
    alturaEdificio: formatNum(document.getElementById("alturaEdificio").value, 2, 12.0),
    alturaEscalera: formatNum(document.getElementById("alturaEscaleraGato").value, 2, 2.4)
  };

  const avisos = [];
  if (rawAlturaTotal <= 0 || isNaN(rawAlturaTotal)) {
    avisos.push("La altura total debe ser mayor a 0 m.");
  }
  if (!isNaN(rawAlturaBase) && !isNaN(rawAlturaTotal) && rawAlturaBase > rawAlturaTotal) {
    avisos.push("La altura de base/pedestal supera la altura total ingresada.");
  }

  obtenerImagenTorre(tipoTorre, (img, cargada) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!cargada || !img) {
      avisos.push(
        `No se encontró "${modelo.src}". Guarda la imagen en esa ruta o selecciónala en "Imagen base de este modelo (opcional)".`
      );
      setAviso("avisoTorre", avisos.join(" "));

      ctx.save();
      ctx.strokeStyle = "#94a3b8";
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      ctx.setLineDash([]);

      setFuenteRelleno(ctx, "#dc2626", "center", "middle", FONT_SIZE_SITIO);
      ctx.fillText(sitio, canvas.width / 2, canvas.height / 2 - 90);

      setFuenteRelleno(ctx, "#111827", "center", "middle", 20);
      ctx.fillText(modelo.nombre.toUpperCase(), canvas.width / 2, canvas.height / 2 - 40);

      setFuenteRelleno(ctx, "#334155", "center", "middle", 15);
      ctx.fillText(`Ruta esperada: ${modelo.src}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText("O usa el selector de archivo superior para insertar la imagen sin modificar su forma.", canvas.width / 2, canvas.height / 2 + 30);
      ctx.restore();
      return;
    }

    setAviso("avisoTorre", avisos.join(" "));

    // Escalar manteniendo 100% intacta la relación de aspecto original (sin estirar ni deformar)
    const pad = 20;
    const maxW = canvas.width - pad * 2;
    const maxH = canvas.height - pad * 2;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Dibujar nombre del sitio en tamaño grande (32px) en zona libre del plano
    const sx = drawX + drawW * modelo.sitioPos.xRatio;
    const sy = drawY + drawH * modelo.sitioPos.yRatio;
    ctx.save();
    setFuenteRelleno(ctx, "#dc2626", "center", "middle", FONT_SIZE_SITIO);
    ctx.fillText(sitio, sx, sy);
    ctx.restore();

    // Superponer valores numéricos integrados con la tipografía y color del plano sin cubrir letras
    const etiquetas = modelo.cotas(valores);
    etiquetas.forEach((item) => {
      const tx = drawX + drawW * item.xRatio;
      const ty = drawY + drawH * item.yRatio;
      const fSize = item.size || 16;

      ctx.save();
      setFuenteRelleno(ctx, "#1f2937", "left", "middle", fSize);
      ctx.fillText(item.texto, tx, ty);
      ctx.restore();
    });
  });
}

document.getElementById("customTorreImg").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const tipo = document.getElementById("torreTipo").value;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      cacheImagenesTorre[tipo] = img;
      dibujarTorreElevacion();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

function dibujarTodo() {
  dibujarSpat();
  dibujarPerimetro();
  dibujarTorreElevacion();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-tab");
    if (targetId) activarTab(targetId, btn);
  });
});

const allInputs = [
  "sitio",
  "spatTipoTorre", "cantidadPozos", "val50", "val60", "val70",
  "perAncho", "perLargo", "perTipoTorre", "coordA", "coordB", "coordC", "coordD",
  "torreTipo", "alturaTorre", "alturaBase", "roldanaSup", "roldanaInf",
  "rol1Sup", "rol1Inf", "rol2Sup", "rol2Inf", "rol3Sup", "rol3Inf",
  "alturaEdificio", "alturaEscaleraGato"
];

allInputs.forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", dibujarTodo);
    el.addEventListener("change", dibujarTodo);
  }
});

document.getElementById("btnActualizarSpat").addEventListener("click", dibujarSpat);
document.getElementById("btnDescargarSpat").addEventListener("click", () => descargarCanvas("canvasSpat", "ESQUEMA_SPAT"));

document.getElementById("btnActualizarPer").addEventListener("click", dibujarPerimetro);
document.getElementById("btnDescargarPer").addEventListener("click", () => descargarCanvas("canvasPerimetro", "ESQUEMA_1_PERIMETRO"));

document.getElementById("btnActualizarTorre").addEventListener("click", dibujarTorreElevacion);
document.getElementById("btnDescargarTorre").addEventListener("click", () => descargarCanvas("canvasTorre", "ESQUEMA_2_TORRE"));

dibujarTodo();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    }).catch(() => {});
  });
}
