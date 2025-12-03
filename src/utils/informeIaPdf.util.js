import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const LOGO_CANDIDATES = [
  process.env.PDF_LOGO_PATH,
  path.resolve(process.cwd(), "src", "assets", "logo_oficial.png"),
  path.resolve(
    process.cwd(),
    "..",
    "miEscuela-frontend",
    "src",
    "assets",
    "img",
    "logo_oficial.png"
  ),
];

let cachedLogo = null;
let triedLogo = false;

const loadLogoBuffer = async () => {
  if (cachedLogo || triedLogo) return cachedLogo;
  for (const candidate of LOGO_CANDIDATES) {
    if (!candidate) continue;
    try {
      const stats = await fs.promises.stat(candidate);
      if (!stats.isFile()) continue;
      cachedLogo = await fs.promises.readFile(candidate);
      return cachedLogo;
    } catch {
      // ignore and try next
    }
  }
  triedLogo = true;
  return null;
};

const formatDate = (value) => {
  if (!value) return "N/D";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/D";
  return DATE_FORMATTER.format(date);
};

const slugify = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "informe";

const addSectionTitle = (doc, title) => {
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10);
};

const addKeyValueList = (doc, entries = []) => {
  entries.forEach(([key, value]) => {
    doc
      .font("Helvetica-Bold")
      .text(`${key}:`, { continued: true })
      .font("Helvetica")
      .text(` ${value}`);
  });
};

export const buildInformeIAPdf = async ({ payload, informeText }) => {
  if (!payload) {
    throw new Error("Payload del informe IA no disponible");
  }

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers = [];
  const logoBuffer = await loadLogoBuffer();

  doc.on("data", (chunk) => buffers.push(chunk));

  const context = payload.contexto_general || {};
  const alumnoNombre = context.alumno || "Alumno";
  const periodo = formatDate(new Date());

  if (logoBuffer) {
    doc.image(logoBuffer, 40, 35, { width: 60 });
  }

  doc.font("Helvetica-Bold").fontSize(16).text("MiEscuela 4.0", logoBuffer ? 110 : 40, 40);
  doc
    .fontSize(12)
    .text("Informe de Rendimiento Academico generado con IA", logoBuffer ? 110 : 40, 60);

  doc.moveDown(2);
  addSectionTitle(doc, "Contexto general");
  addKeyValueList(doc, [
    ["Alumno", alumnoNombre],
    ["Curso / Division", context.curso || "N/D"],
    ["Ciclo lectivo", context.ciclo_lectivo?.anio || "N/D"],
    ["Periodo analizado", periodo || "N/D"],
  ]);

  doc.moveDown();
  doc.font("Helvetica").fontSize(10).text(informeText || "No se registro contenido en el informe.", {
    align: informeText ? "justify" : "left",
    lineGap: informeText ? 4 : undefined,
  });

  doc.moveDown();
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .fillColor("#555")
    .text(
      "Este informe ha sido generado automaticamente a partir de los datos institucionales y la asistencia anual.",
      { align: "left" }
    );

  await new Promise((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);
    doc.end();
  });

  return Buffer.concat(buffers);
};

export const buildInformeFileName = (payload) => {
  const alumno = payload?.contexto_general?.alumno || "alumno";
  const periodo = payload?.contexto_general?.periodo_solicitado?.hasta || new Date().toISOString();
  const fecha = slugify(formatDate(periodo));
  return `informe-ia-${slugify(alumno)}-${fecha}.pdf`;
};
