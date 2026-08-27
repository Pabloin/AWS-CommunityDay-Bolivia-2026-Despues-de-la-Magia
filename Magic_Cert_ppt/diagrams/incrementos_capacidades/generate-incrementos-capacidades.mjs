import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url));

const icons = {
  s3: "amazon-s3.svg",
  api: "amazon-api-gateway.svg",
  lambda: "aws-lambda.svg",
  dynamo: "amazon-dynamodb.svg",
  secrets: "aws-secrets-manager.svg",
  cloudwatch: "amazon-cloudwatch.svg",
  iam: "aws-iam.svg",
  sts: "aws-sts.svg",
  bedrock: "amazon-bedrock.svg",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wrap(text, max = 34) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function text(lines, x, y, opts = {}) {
  const {
    size = 18,
    weight = 500,
    fill = "#161E2D",
    anchor = "start",
    lineHeight = Math.round(size * 1.3),
    max,
  } = opts;
  const normalized = Array.isArray(lines) ? lines : max ? wrap(lines, max) : [lines];
  return normalized
    .map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(line)}</text>`)
    .join("\n");
}

function icon(name, x, y, size = 52) {
  if (icons[name]) {
    return `<image href="assets/aws-icons/${icons[name]}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const colors = {
    browser: "#545B64",
    react: "#149ECA",
    json: "#687078",
    github: "#24292F",
    terraform: "#844FBA",
    tenant: "#01A88D",
    shield: "#DD344C",
  };
  const labels = {
    browser: "WEB",
    react: "R",
    json: "{}",
    github: "GH",
    terraform: "TF",
    tenant: "TEN",
    shield: "IAM",
  };
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${colors[name] ?? "#545B64"}"/>
    <text x="${x + size / 2}" y="${y + size / 2 + 7}" font-size="${size < 42 ? 12 : 18}" font-weight="900" fill="#FFFFFF" text-anchor="middle">${labels[name] ?? name}</text>`;
}

function layer({ x, y, w, h, color, version, title, subtitle, items, iconNames, dashed = false }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#FFFFFF" stroke="${dashed ? color : "#D5DBDB"}" stroke-width="${dashed ? 2.5 : 1.5}" ${dashed ? 'stroke-dasharray="10 8"' : ""}/>
      <rect x="${x}" y="${y}" width="12" height="${h}" fill="${color}" opacity="${dashed ? 0.5 : 1}"/>
      <rect x="${x + 12}" y="${y}" width="${w - 12}" height="8" fill="${color}" opacity="${dashed ? 0.5 : 1}"/>
      ${text(version, x + 34, y + 42, { size: 22, weight: 900, fill: color })}
      ${text(title, x + 116, y + 42, { size: 23, weight: 900 })}
      ${text(subtitle, x + 116, y + 68, { size: 15, weight: 700, fill: "#5F6B7A", max: 72 })}
      <g>
        ${iconNames.map((name, i) => icon(name, x + 34 + i * 62, y + 82, 46)).join("\n")}
      </g>
      ${items.map((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = x + 360 + col * 360;
        const by = y + 100 + row * 36;
        return `
          <circle cx="${bx}" cy="${by - 6}" r="4" fill="${color}"/>
          ${text(item, bx + 16, by, { size: 16, weight: 650, fill: "#414D5C", max: 34 })}
        `;
      }).join("\n")}
    </g>`;
}

function connector(x, y1, y2, color) {
  return `
    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="4" marker-end="url(#arrow)"/>
    <text x="${x + 18}" y="${(y1 + y2) / 2}" font-size="14" font-weight="900" fill="${color}">se apila</text>`;
}

function legend() {
  const entries = [
    ["v01", "Prototipo funcional local"],
    ["v02", "Runtime cloud serverless"],
    ["v03", "Delivery controlado, IA y base multi-deployment"],
    ["vNext", "Multi-tenant real como siguiente capa"],
  ];
  return `
    <rect x="1012" y="112" width="430" height="150" rx="5" fill="#F2F3F3" stroke="#D5DBDB"/>
    ${text("Como leer la placa", 1044, 150, { size: 20, weight: 900 })}
    ${entries.map(([k, v], i) => `
      <text x="1044" y="${183 + i * 25}" font-size="14" font-weight="900" fill="#161E2D">${esc(k)}</text>
      <text x="1100" y="${183 + i * 25}" font-size="14" font-weight="650" fill="#5F6B7A">${esc(v)}</text>
    `).join("\n")}
  `;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img">
  <defs>
    <style>text { font-family: Amazon Ember, Arial, Helvetica, sans-serif; }</style>
    <marker id="arrow" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
      <path d="M0,0 L12,4.5 L0,9 Z" fill="#414D5C"/>
    </marker>
  </defs>
  <rect width="1600" height="900" fill="#FFFFFF"/>
  <rect x="0" y="0" width="1600" height="16" fill="#232F3E"/>
  <rect x="0" y="16" width="1600" height="5" fill="#FF9900"/>

  ${text("STACK DE INCREMENTOS / DESPUES DE LA MAGIA", 80, 72, { size: 13, weight: 900, fill: "#FF9900" })}
  ${text("Magic Cert: capacidades que se apilan", 80, 123, { size: 42, weight: 900 })}
  ${text("Cada version conserva lo anterior y agrega nuevas responsabilidades de producto, arquitectura y operacion.", 80, 162, { size: 20, weight: 650, fill: "#5F6B7A" })}
  ${legend()}

  ${layer({
    x: 180,
    y: 632,
    w: 1110,
    h: 150,
    color: "#879196",
    version: "v01",
    title: "Base local funcional",
    subtitle: "Lo minimo para validar la experiencia y el contenido.",
    iconNames: ["browser", "react", "json"],
    items: [
      "Interfaz de quiz",
      "Estado local en React",
      "Preguntas JSON embebidas",
      "Sin backend ni persistencia",
    ],
  })}

  ${connector(735, 596, 632, "#FF9900")}

  ${layer({
    x: 180,
    y: 402,
    w: 1110,
    h: 174,
    color: "#FF9900",
    version: "v02",
    title: "MVP cloud serverless",
    subtitle: "La demo deja de vivir en una maquina y gana runtime AWS operable.",
    iconNames: ["s3", "api", "lambda", "dynamo", "secrets", "cloudwatch", "terraform"],
    items: [
      "Frontend en S3 website",
      "API Gateway HTTPS",
      "Lambdas de negocio",
      "DynamoDB on-demand",
      "JWT en Secrets Manager",
      "Logs, dashboard y alarmas",
      "Infraestructura con Terraform",
      "Scripts de deploy y seed",
    ],
  })}

  ${connector(735, 366, 402, "#01A88D")}

  ${layer({
    x: 180,
    y: 178,
    w: 1110,
    h: 168,
    color: "#01A88D",
    version: "v03",
    title: "Delivery controlado + IA",
    subtitle: "Se suma gobierno de cambios, credenciales temporales e IA desacoplada.",
    iconNames: ["github", "iam", "sts", "bedrock", "lambda", "terraform", "tenant"],
    items: [
      "GitHub Actions con OIDC",
      "Plan read-only en PR",
      "Apply protegido por environment",
      "Sin access keys largas",
      "Lambda ai-practice",
      "STS hacia cuenta Bedrock",
      "Amazon Nova por default",
      "deployment_id como base multi-deployment",
    ],
  })}

  ${layer({
    x: 1326,
    y: 330,
    w: 194,
    h: 318,
    color: "#7D3CDB",
    version: "vNext",
    title: "Multi-tenant real",
    subtitle: "Siguiente capa posible, no parte del runtime actual.",
    iconNames: ["tenant", "shield", "dynamo"],
    dashed: true,
    items: [
      "Aislamiento tenant",
      "Auth por tenant",
      "Particiones de datos",
      "Cost allocation",
    ],
  })}

  <path d="M1290 262 C1365 262 1390 315 1408 330" fill="none" stroke="#7D3CDB" stroke-width="3" stroke-dasharray="9 7" marker-end="url(#arrow)"/>
  ${text("camino natural", 1326, 282, { size: 14, weight: 900, fill: "#7D3CDB" })}

  <rect x="80" y="818" width="1440" height="44" rx="4" fill="#F2F3F3" stroke="#D5DBDB"/>
  ${text("Mensaje: la magia genera una app; la arquitectura apila capacidades hasta convertirla en un sistema operable y extensible.", 112, 846, { size: 17, weight: 800, fill: "#414D5C" })}
</svg>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "magic-cert-incrementos-capacidades.svg"), svg);

console.log(`Generated increment stack diagram in ${outDir}`);
