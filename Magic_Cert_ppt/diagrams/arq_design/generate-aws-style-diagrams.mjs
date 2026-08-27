import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url));

const services = {
  s3: { icon: "amazon-s3.svg", name: "Amazon S3", color: "#7AA116" },
  api: { icon: "amazon-api-gateway.svg", name: "Amazon API Gateway", color: "#8C4FFF" },
  lambda: { icon: "aws-lambda.svg", name: "AWS Lambda", color: "#ED7100" },
  dynamo: { icon: "amazon-dynamodb.svg", name: "Amazon DynamoDB", color: "#C925D1" },
  secrets: { icon: "aws-secrets-manager.svg", name: "AWS Secrets Manager", color: "#DD344C" },
  cloudwatch: { icon: "amazon-cloudwatch.svg", name: "Amazon CloudWatch", color: "#DD344C" },
  iam: { icon: "aws-iam.svg", name: "AWS IAM", color: "#DD344C" },
  sts: { icon: "aws-sts.svg", name: "AWS STS", color: "#DD344C" },
  bedrock: { icon: "amazon-bedrock.svg", name: "Amazon Bedrock", color: "#01A88D" },
  cloudformation: { icon: "aws-cloudformation.svg", name: "AWS CloudFormation", color: "#E7157B" },
  browser: { name: "Browser", color: "#545B64", text: "WEB" },
  react: { name: "React", color: "#149ECA", text: "R" },
  vite: { name: "Vite", color: "#646CFF", text: "V" },
  json: { name: "JSON", color: "#545B64", text: "{}" },
  github: { name: "GitHub Actions", color: "#24292F", text: "GH" },
  terraform: { name: "Terraform", color: "#844FBA", text: "TF" },
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wrap(text, max = 32) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function txt(lines, x, y, opts = {}) {
  const {
    size = 18,
    weight = 500,
    fill = "#161E2D",
    anchor = "start",
    lineHeight = Math.round(size * 1.3),
    max,
  } = opts;
  const values = Array.isArray(lines) ? lines : max ? wrap(lines, max) : [lines];
  return values
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(line)}</text>`)
    .join("\n");
}

function bulletList(items, x, y, max = 34) {
  let cy = y;
  const out = [];
  for (const item of items) {
    const lines = wrap(item, max);
    out.push(`<circle cx="${x}" cy="${cy - 6}" r="3.5" fill="#879196"/>`);
    out.push(txt(lines, x + 15, cy, { size: 15, fill: "#414D5C", lineHeight: 19 }));
    cy += lines.length * 19 + 7;
  }
  return out.join("\n");
}

function icon(service, x, y, size = 72) {
  const svc = services[service];
  if (svc.icon) {
    return `<image href="assets/aws-icons/${svc.icon}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `
    <g>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="${svc.color}"/>
      <text x="${x + size / 2}" y="${y + size / 2 + 8}" font-size="${size < 48 ? 14 : 24}" font-weight="800" fill="#FFFFFF" text-anchor="middle">${svc.text}</text>
    </g>`;
}

function serviceCard({ service, x, y, w = 260, h = 150, title, subtitle, bullets = [], accent }) {
  const svc = services[service];
  const color = accent ?? svc.color;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#FFFFFF" stroke="#D5DBDB" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${w}" height="7" fill="${color}"/>
      ${icon(service, x + 20, y + 36, 70)}
      ${txt(title ?? svc.name, x + 108, y + 42, { size: 18, weight: 800, fill: "#161E2D", max: 21 })}
      ${subtitle ? txt(subtitle, x + 108, y + 67, { size: 13, weight: 700, fill: "#5F6B7A", max: 24 }) : ""}
      ${bulletList(bullets, x + 108, y + 101, 25)}
    </g>`;
}

function domain({ x, y, w, h, title, label, color = "#FF9900" }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#FAFAFA" stroke="#D5DBDB" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="10" height="${h}" fill="${color}"/>
      <text x="${x + 24}" y="${y + 30}" font-size="17" font-weight="800" fill="#161E2D">${esc(title)}</text>
      <text x="${x + w - 24}" y="${y + 30}" font-size="12" font-weight="800" fill="#879196" text-anchor="end">${esc(label)}</text>
    </g>`;
}

function arrow(x1, y1, x2, y2, label = "", dashed = false) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#414D5C" stroke-width="2.5" ${dashed ? 'stroke-dasharray="8 7"' : ""} marker-end="url(#arrow)"/>
    ${label ? `<rect x="${mx - 68}" y="${my - 23}" width="136" height="26" rx="3" fill="#FFFFFF" stroke="#EAeded"/>\n${txt(label, mx, my - 5, { size: 12, weight: 800, fill: "#414D5C", anchor: "middle" })}` : ""}`;
}

function badge(text, x, y, color = "#FF9900") {
  return `
    <g>
      <rect x="${x}" y="${y}" width="168" height="32" rx="16" fill="${color}"/>
      ${txt(text, x + 84, y + 22, { size: 13, weight: 800, fill: "#FFFFFF", anchor: "middle" })}
    </g>`;
}

function footerNote(text) {
  return `<text x="80" y="854" font-size="12" font-weight="600" fill="#687078">${esc(text)}</text>`;
}

function frame(title, subtitle, eyebrow, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img">
  <defs>
    <style>text { font-family: Amazon Ember, Arial, Helvetica, sans-serif; }</style>
    <marker id="arrow" markerWidth="11" markerHeight="8" refX="10" refY="4" orient="auto">
      <path d="M0,0 L11,4 L0,8 Z" fill="#414D5C"/>
    </marker>
  </defs>
  <rect width="1600" height="900" fill="#FFFFFF"/>
  <rect x="0" y="0" width="1600" height="16" fill="#232F3E"/>
  <rect x="0" y="16" width="1600" height="5" fill="#FF9900"/>
  <text x="80" y="70" font-size="13" font-weight="900" fill="#FF9900" letter-spacing="2">${esc(eyebrow)}</text>
  ${txt(title, 80, 118, { size: 39, weight: 900, fill: "#161E2D" })}
  ${txt(subtitle, 80, 154, { size: 19, weight: 600, fill: "#5F6B7A" })}
  ${body}
</svg>`;
}

const v01 = frame(
  "Magic Cert v01: prototipo local generado con IA",
  "La aplicacion funciona, pero todo vive dentro del browser y la maquina del desarrollador.",
  "VERSION 01 / LOCAL",
  `
    ${badge("$0/month", 1296, 78, "#1D8102")}
    ${domain({ x: 80, y: 205, w: 420, h: 440, title: "Maquina del desarrollador", label: "LOCAL", color: "#879196" })}
    ${serviceCard({ service: "browser", x: 126, y: 278, w: 330, h: 156, title: "Browser", subtitle: "localhost:5173", bullets: ["Sesion del usuario", "Estado del quiz", "Feedback inmediato"], accent: "#545B64" })}
    ${serviceCard({ service: "vite", x: 126, y: 464, w: 330, h: 138, title: "Vite dev server", subtitle: "Ciclo local", bullets: ["Sirve assets", "Hot reload"], accent: "#646CFF" })}

    ${domain({ x: 590, y: 205, w: 430, h: 440, title: "Aplicacion frontend", label: "SPA", color: "#149ECA" })}
    ${serviceCard({ service: "react", x: 636, y: 278, w: 338, h: 156, title: "React + TypeScript", subtitle: "UI de Magic Cert", bullets: ["App.tsx", "Render de preguntas", "Calculo de score"], accent: "#149ECA" })}
    ${serviceCard({ service: "json", x: 636, y: 464, w: 338, h: 138, title: "JSON estatico", subtitle: "Catalogo embebido", bullets: ["Sin base de datos", "Sin API runtime"], accent: "#687078" })}

    ${domain({ x: 1110, y: 205, w: 410, h: 440, title: "Limite arquitectonico", label: "SIN CLOUD", color: "#DD344C" })}
    ${txt("Que demuestra", 1160, 293, { size: 24, weight: 900 })}
    ${bulletList(["Una UX funcional puede generarse rapido", "La idea de producto es testeable", "Aun faltan decisiones de arquitectura", "Sin estado compartido, auth, API, monitoreo ni deployment"], 1164, 338, 33)}

    ${arrow(456, 356, 636, 356, "HTTP local")}
    ${arrow(456, 532, 636, 532, "bundle")}
    ${arrow(805, 464, 805, 434, "imports")}

    <rect x="80" y="700" width="1440" height="92" rx="4" fill="#F2F3F3" stroke="#D5DBDB"/>
    ${txt("Narrativa", 112, 735, { size: 18, weight: 900 })}
    ${txt("La primera version sirve como prototipo rapido. El siguiente paso no es solo pulir la UI: es darle a la app una arquitectura cloud real.", 112, 766, { size: 18, weight: 600, fill: "#414D5C", max: 128 })}
    ${footerNote("Progresion Magic Cert: prototipo local -> MVP serverless -> delivery controlado y practica con IA.")}
  `
);

const v02 = frame(
  "Magic Cert v02: MVP serverless en AWS",
  "El prototipo de browser se convierte en un sistema desplegable con API, compute, persistencia, secretos y monitoreo.",
  "VERSION 02 / SERVERLESS MVP",
  `
    ${badge("~$5-10/month", 1258, 78, "#FF9900")}
    ${domain({ x: 80, y: 205, w: 300, h: 420, title: "Usuarios", label: "CLIENTE", color: "#545B64" })}
    ${serviceCard({ service: "browser", x: 116, y: 304, w: 230, h: 166, title: "Cliente web", subtitle: "React app", bullets: ["Registro/login", "Examen practico", "Progreso"], accent: "#545B64" })}

    ${domain({ x: 450, y: 205, w: 300, h: 420, title: "Frontend", label: "PUBLICO", color: services.s3.color })}
    ${serviceCard({ service: "s3", x: 486, y: 304, w: 230, h: 166, title: "Amazon S3", subtitle: "Static website", bullets: ["Assets publicos", "Sitio HTTP demo", "Upload por script"] })}

    ${domain({ x: 820, y: 205, w: 300, h: 420, title: "Backend", label: "API + COMPUTE", color: services.lambda.color })}
    ${serviceCard({ service: "api", x: 856, y: 256, w: 230, h: 148, title: "API Gateway", subtitle: "REST HTTPS", bullets: ["Rutas auth", "Rutas questions"] })}
    ${serviceCard({ service: "lambda", x: 856, y: 444, w: 230, h: 148, title: "AWS Lambda", subtitle: "Handlers Node.js", bullets: ["questions", "auth/profile/progress"] })}

    ${domain({ x: 1190, y: 205, w: 330, h: 420, title: "Datos y operacion", label: "MANAGED", color: "#C925D1" })}
    ${serviceCard({ service: "dynamo", x: 1226, y: 246, w: 258, h: 142, title: "DynamoDB", subtitle: "Tablas on-demand", bullets: ["questions/users", "progress/sessions"] })}
    ${serviceCard({ service: "secrets", x: 1226, y: 414, w: 258, h: 142, title: "Secrets + CloudWatch", subtitle: "Seguridad y observabilidad", bullets: ["JWT secret", "Logs, dashboard, alarms"] })}

    ${arrow(346, 388, 486, 388, "HTTP")}
    ${arrow(716, 388, 856, 330, "HTTPS")}
    ${arrow(971, 404, 971, 444, "invoke")}
    ${arrow(1086, 510, 1226, 316, "read/write")}
    ${arrow(1086, 530, 1226, 484, "logs/secret")}

    <rect x="80" y="696" width="1440" height="102" rx="4" fill="#F2F3F3" stroke="#D5DBDB"/>
    ${txt("Tradeoff del MVP", 112, 731, { size: 18, weight: 900 })}
    ${txt("S3 website hosting mantiene simple la historia de costos, pero el frontend queda en HTTP. API Gateway sigue en HTTPS. Sirve para demo; no para login productivo real.", 112, 764, { size: 18, weight: 600, fill: "#414D5C", max: 124 })}
    ${footerNote("Servicios v02: S3, API Gateway, Lambda, DynamoDB, Secrets Manager, CloudWatch e infraestructura Terraform.")}
  `
);

const v03 = frame(
  "Magic Cert v03: delivery controlado y practica con IA",
  "El runtime serverless se mantiene; GitHub OIDC elimina credenciales largas y Bedrock agrega explicaciones con IA.",
  "VERSION 03 / DELIVERY + AI",
  `
    ${badge("~$20-30/month+", 1234, 78, "#FF9900")}
    ${domain({ x: 80, y: 205, w: 410, h: 440, title: "Ruta runtime", label: "TRAFICO", color: "#FF9900" })}
    ${serviceCard({ service: "s3", x: 116, y: 278, w: 338, h: 132, title: "Amazon S3", subtitle: "Frontend hosting", bullets: ["Assets React/Vite"] })}
    ${serviceCard({ service: "api", x: 116, y: 442, w: 338, h: 132, title: "API Gateway", subtitle: "REST HTTPS", bullets: ["auth/questions/progress/AI"] })}

    ${domain({ x: 590, y: 205, w: 430, h: 440, title: "Backend aplicacion", label: "SERVERLESS", color: services.lambda.color })}
    ${serviceCard({ service: "lambda", x: 636, y: 278, w: 338, h: 142, title: "AWS Lambda", subtitle: "5 funciones", bullets: ["questions/auth/profile/progress", "ai-practice"] })}
    ${serviceCard({ service: "dynamo", x: 636, y: 458, w: 338, h: 142, title: "DynamoDB + Secrets", subtitle: "Estado y JWT", bullets: ["users/questions/progress", "sessions TTL + JWT secret"] })}

    ${domain({ x: 1110, y: 205, w: 410, h: 440, title: "Cuenta de IA", label: "CROSS-ACCOUNT", color: services.bedrock.color })}
    ${serviceCard({ service: "sts", x: 1150, y: 278, w: 330, h: 132, title: "AWS STS", subtitle: "AssumeRole", bullets: ["Rol externo Bedrock"] })}
    ${serviceCard({ service: "bedrock", x: 1150, y: 442, w: 330, h: 132, title: "Amazon Bedrock", subtitle: "Explicaciones IA", bullets: ["Amazon Nova default", "Anthropic opcional"] })}

    ${arrow(286, 410, 286, 442, "HTTPS API")}
    ${arrow(454, 508, 636, 348, "invoke")}
    ${arrow(805, 420, 805, 458, "state")}
    ${arrow(974, 348, 1150, 344, "assume role")}
    ${arrow(1315, 410, 1315, 442, "invoke model")}

    <rect x="80" y="682" width="1440" height="118" rx="4" fill="#232F3E"/>
    <rect x="80" y="682" width="12" height="118" fill="#FF9900"/>
    ${icon("github", 124, 714, 44)}
    ${txt("GitHub Actions", 184, 730, { size: 18, weight: 900, fill: "#FFFFFF" })}
    ${txt("OIDC entrega credenciales temporales; los PR ejecutan terraform plan read-only; solo el ambiente production protegido puede asumir el rol de apply.", 184, 762, { size: 16, weight: 600, fill: "#D5DBDB", max: 115 })}
    ${icon("iam", 1170, 706, 52)}
    ${icon("terraform", 1250, 706, 52)}
    ${txt("Sin access keys", 1322, 738, { size: 17, weight: 900, fill: "#FFFFFF" })}
    ${footerNote("v03 agrega GitHub OIDC, rol apply protegido, Lambda ai-practice, STS cross-account y Amazon Bedrock.")}
  `
);

const evolution = frame(
  "Magic Cert: evolucion de arquitectura",
  "La misma idea de producto, tres niveles de madurez arquitectonica.",
  "STORY ARC / DESPUES DE LA MAGIA",
  `
    <rect x="80" y="218" width="420" height="430" rx="4" fill="#FFFFFF" stroke="#D5DBDB"/>
    <rect x="80" y="218" width="420" height="8" fill="#879196"/>
    ${txt("v01", 116, 282, { size: 44, weight: 900, fill: "#161E2D" })}
    ${txt("Prototipo local", 116, 322, { size: 24, weight: 900, fill: "#414D5C" })}
    ${icon("browser", 116, 366, 76)}
    ${icon("react", 212, 366, 76)}
    ${icon("json", 308, 366, 76)}
    ${bulletList(["Corre local con Vite", "Preguntas embebidas como JSON", "Sin backend, base de datos, borde de auth ni deployment"], 122, 494, 36)}
    ${badge("$0/month", 116, 586, "#1D8102")}

    <rect x="590" y="218" width="420" height="430" rx="4" fill="#FFFFFF" stroke="#D5DBDB"/>
    <rect x="590" y="218" width="420" height="8" fill="#FF9900"/>
    ${txt("v02", 626, 282, { size: 44, weight: 900, fill: "#161E2D" })}
    ${txt("MVP serverless", 626, 322, { size: 24, weight: 900, fill: "#414D5C" })}
    ${icon("s3", 626, 366, 66)}
    ${icon("api", 710, 366, 66)}
    ${icon("lambda", 794, 366, 66)}
    ${icon("dynamo", 878, 366, 66)}
    ${bulletList(["Frontend en S3 website", "API Gateway + Lambda", "Persistencia en DynamoDB", "Secrets y CloudWatch"], 632, 494, 34)}
    ${badge("~$5-10/month", 626, 608, "#FF9900")}

    <rect x="1100" y="218" width="420" height="430" rx="4" fill="#FFFFFF" stroke="#D5DBDB"/>
    <rect x="1100" y="218" width="420" height="8" fill="#01A88D"/>
    ${txt("v03", 1136, 282, { size: 44, weight: 900, fill: "#161E2D" })}
    ${txt("Delivery controlado + IA", 1136, 322, { size: 24, weight: 900, fill: "#414D5C" })}
    ${icon("github", 1136, 366, 60)}
    ${icon("iam", 1212, 366, 60)}
    ${icon("sts", 1288, 366, 60)}
    ${icon("bedrock", 1364, 366, 60)}
    ${bulletList(["GitHub OIDC y rol apply protegido", "Workflow Terraform plan/apply", "Lambda ai-practice", "STS hacia cuenta Bedrock"], 1142, 494, 36)}
    ${badge("~$20-30/month+", 1136, 608, "#01A88D")}

    ${arrow(500, 430, 590, 430, "arquitectura")}
    ${arrow(1010, 430, 1100, 430, "operacion + IA")}

    <rect x="80" y="714" width="1440" height="84" rx="4" fill="#F2F3F3" stroke="#D5DBDB"/>
    ${txt("Mensaje de la charla", 112, 748, { size: 18, weight: 900 })}
    ${txt("La IA puede producir la primera pantalla funcional. Ingenieria la convierte en sistema: hosting, APIs, persistencia, seguridad, observabilidad, delivery controlado e integracion con IA.", 112, 779, { size: 18, weight: 600, fill: "#414D5C", max: 130 })}
    ${footerNote("Draft 03 usa composicion estilo AWS e iconos oficiales AWS Architecture Icons para servicios AWS.")}
  `
);

const files = {
  "magic-cert-v01-aws-style.svg": v01,
  "magic-cert-v02-aws-style.svg": v02,
  "magic-cert-v03-aws-style.svg": v03,
  "magic-cert-evolucion-aws-style.svg": evolution,
};

mkdirSync(outDir, { recursive: true });
for (const [filename, svg] of Object.entries(files)) {
  writeFileSync(join(outDir, filename), svg);
}

console.log(`Generated ${Object.keys(files).length} AWS-style SVG diagrams in ${outDir}`);
