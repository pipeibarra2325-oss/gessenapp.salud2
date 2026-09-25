// Genera el informe nutricional en PDF dirigido al profesional de la salud.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface GraficaPdf {
  titulo: string;
  contenedor: HTMLElement | null; // elemento que contiene el <svg> de Recharts
}

const VERDE: [number, number, number] = [5, 150, 105];
const GRIS: [number, number, number] = [100, 116, 139];

const fmt = (n: number | null | undefined, dec = 1) =>
  n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toLocaleString("es-CO", { maximumFractionDigits: dec, minimumFractionDigits: 0 });

const fechaLarga = (iso?: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "—";

// Convierte el SVG de una gráfica de Recharts en una imagen PNG
async function svgAPng(contenedor: HTMLElement): Promise<{ data: string; ancho: number; alto: number } | null> {
  const svg = contenedor.querySelector("svg.recharts-surface") as SVGSVGElement | null;
  if (!svg) return null;
  const { width, height } = svg.getBoundingClientRect();
  if (!width || !height) return null;

  const clon = svg.cloneNode(true) as SVGSVGElement;
  clon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clon.setAttribute("width", String(width));
  clon.setAttribute("height", String(height));
  clon.style.fontFamily = "Helvetica, Arial, sans-serif";
  const xml = new XMLSerializer().serializeToString(clon);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo convertir la gráfica"));
    img.src = url;
  });

  const escala = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * escala;
  canvas.height = height * escala;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { data: canvas.toDataURL("image/jpeg", 0.9), ancho: width, alto: height };
}

export async function descargarReportePdf(reporte: any, graficas: GraficaPdf[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15; // margen
  const ANCHO = doc.internal.pageSize.getWidth() - 2 * M;
  const ALTO_PAG = doc.internal.pageSize.getHeight();
  let y = M;

  const saltoSiHaceFalta = (alto: number) => {
    if (y + alto > ALTO_PAG - 18) {
      doc.addPage();
      y = M;
    }
  };

  const titulo = (texto: string) => {
    saltoSiHaceFalta(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...VERDE);
    doc.text(texto, M, y);
    doc.setDrawColor(...VERDE);
    doc.line(M, y + 1.5, M + ANCHO, y + 1.5);
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  // ---------- Encabezado ----------
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Informe nutricional del paciente", M, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("GessenApp · Apoyo al profesional de la salud en la orientación alimentaria", M, 17.5);
  doc.text(`Generado: ${new Date(reporte.generado).toLocaleString("es-CO")}`, M + ANCHO, 17.5, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y = 32;

  // ---------- Datos del paciente ----------
  const u = reporte.usuario;
  const p = reporte.periodo;
  titulo("Datos del paciente");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 1.2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 }, 2: { fontStyle: "bold", cellWidth: 38 } },
    body: [
      ["Nombre", u.nombre, "Correo", u.email],
      ["Edad", u.edad != null ? `${u.edad} años` : "—", "Género", u.genero || "—"],
      ["Estatura / peso", `${fmt(u.estatura, 0)} cm / ${fmt(u.peso)} kg`, "IMC", u.imc != null ? `${fmt(u.imc)} kg/m² (${u.clasificacion_imc})` : "—"],
      ["Departamento", u.departamento || "—", "Condiciones", u.enfermedades || "—"],
      ["Periodo analizado", `${fechaLarga(p.desde)} a ${fechaLarga(p.hasta)}`, "Registros", `${p.total_registros} en ${p.dias_con_registro} día(s)`],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ---------- Resumen para el médico ----------
  titulo("Resumen de la alimentación para el médico");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  for (const obs of reporte.observaciones as string[]) {
    const lineas = doc.splitTextToSize(obs, ANCHO - 5);
    saltoSiHaceFalta(lineas.length * 4.6 + 1.5);
    doc.setFillColor(...VERDE);
    doc.circle(M + 1.2, y - 1.2, 0.8, "F");
    doc.text(lineas, M + 4, y);
    y += lineas.length * 4.6 + 1.5;
  }
  y += 2;

  // ---------- Promedios diarios ----------
  const pr = reporte.promedios;
  const de = reporte.distribucionEnergia;
  const ref = reporte.referencias;
  titulo("Promedio diario de nutrientes");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    headStyles: { fillColor: VERDE },
    styles: { fontSize: 9.5 },
    head: [["Nutriente", "Promedio por día", "% de la energía", "Referencia orientativa"]],
    body: [
      ["Energía", `${fmt(pr.calorias, 0)} kcal`, "—", "Según requerimiento individual"],
      ["Carbohidratos", `${fmt(pr.carbohidratos)} g`, `${fmt(de.carbohidratos)} %`, "Individualizar; priorizar fuentes de bajo IG"],
      ["Proteínas", `${fmt(pr.proteinas)} g`, `${fmt(de.proteinas)} %`, "Según función renal y requerimiento"],
      ["Grasas", `${fmt(pr.grasas)} g`, `${fmt(de.grasas)} %`, "Preferir grasas insaturadas"],
      ["Azúcares", `${fmt(pr.azucares)} g`, `${fmt(reporte.azucaresPctEnergia)} %`, `Menos del ${ref.azucares_max_pct} % de la energía`],
      ["Fibra", `${fmt(pr.fibra)} g`, "—", `Al menos ${ref.fibra_min_g} g por día`],
      ["Sodio", `${fmt(pr.sodio, 0)} mg`, "—", `Máximo ${ref.sodio_max_mg.toLocaleString("es-CO")} mg por día`],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ---------- Gráficas ----------
  const imagenes = [];
  for (const g of graficas) {
    if (!g.contenedor) continue;
    try {
      const png = await svgAPng(g.contenedor);
      if (png) imagenes.push({ ...png, titulo: g.titulo });
    } catch (e) {
      console.warn(e);
    }
  }
  if (imagenes.length) {
    titulo("Gráficas del periodo");
    const anchoCelda = (ANCHO - 6) / 2;
    for (let i = 0; i < imagenes.length; i += 2) {
      const fila = imagenes.slice(i, i + 2);
      const altos = fila.map((im) => (anchoCelda * im.alto) / im.ancho);
      const altoFila = Math.max(...altos) + 7;
      saltoSiHaceFalta(altoFila);
      fila.forEach((im, j) => {
        const x = M + j * (anchoCelda + 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...GRIS);
        doc.text(im.titulo, x, y);
        doc.addImage(im.data, "JPEG", x, y + 2, anchoCelda, altos[j]);
      });
      doc.setTextColor(0, 0, 0);
      y += altoFila + 3;
    }
  }

  // ---------- Platillos más frecuentes ----------
  if (reporte.platillosFrecuentes.length) {
    titulo("Platillos consumidos con mayor frecuencia");
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      headStyles: { fillColor: VERDE },
      styles: { fontSize: 9.5 },
      head: [["Platillo", "Veces"]],
      body: reporte.platillosFrecuentes.map((f: any) => [f.nombre, f.cantidad]),
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ---------- Detalle de registros ----------
  if (reporte.registros.length) {
    titulo("Detalle de los consumos registrados");
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      headStyles: { fillColor: VERDE, fontSize: 8 },
      styles: { fontSize: 7.8, cellPadding: 1.3 },
      head: [["Fecha", "Momento", "Platillo", "Porción", "kcal", "Carb. (g)", "Azúc. (g)", "Fibra (g)", "Sodio (mg)", "IG"]],
      body: reporte.registros.map((r: any) => [
        r.fecha_consumo, r.meal_time, r.nombre_platillo, fmt(r.porcion_consumida),
        fmt(r.calorias_consumidas, 0), fmt(r.carbs_consumidos), fmt(r.azucares_consumidos),
        fmt(r.fibra_consumida), fmt(r.sodio_consumido, 0), r.nivel_glucemico || "—",
      ]),
      columnStyles: { 2: { cellWidth: 45 } },
    });
  }

  // ---------- Pie de página ----------
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text(
      "Documento generado automáticamente por GessenApp. Las observaciones son orientativas y no reemplazan la valoración clínica del profesional.",
      M, ALTO_PAG - 8, { maxWidth: ANCHO - 20 }
    );
    doc.text(`Página ${i} de ${paginas}`, M + ANCHO, ALTO_PAG - 8, { align: "right" });
  }

  const nombreArchivo = `Informe_nutricional_${u.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
}
