import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url));

const aws = {
  s3: { color: "#7aa116", label: "S3", icon: "amazon-s3.svg" },
  api: { color: "#7d3cdb", label: "API", icon: "amazon-api-gateway.svg" },
  lambda: { color: "#ff9900", label: "λ", icon: "aws-lambda.svg" },
  dynamo: { color: "#3f74ba", label: "DB", icon: "amazon-dynamodb.svg" },
  secrets: { color: "#c925d1", label: "SEC", icon: "aws-secrets-manager.svg" },
  cloudwatch: { color: "#cf2e7d", label: "CW", icon: "amazon-cloudwatch.svg" },
  iam: { color: "#dd344c", label: "IAM", icon: "aws-iam.svg" },
  sts: { color: "#dd344c", label: "STS", icon: "aws-sts.svg" },
  bedrock: { color: "#1f77b4", label: "AI", icon: "amazon-bedrock.svg" },
  github: { color: "#24292f", label: "GH" },
  browser: { color: "#4b5563", label: "WEB" },
  react: { color: "#149eca", label: "R" },
  vite: { color: "#646cff", label: "V" },
  json: { color: "#64748b", label: "{}" },
  terraform: { color: "#844fba", label: "TF" },
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wordsToLines(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textBlock(lines, x, y, opts = {}) {
  const {
    size = 20,
    weight = 500,
    color = "#111827",
    anchor = "start",
    lineHeight = Math.round(size * 1.32),
    maxChars,
  } = opts;
  const normalized = Array.isArray(lines)
    ? lines
    : maxChars
      ? wordsToLines(lines, maxChars)
      : [lines];
  return normalized
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<text x="${x}" y="${y + dy}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(line)}</text>`;
    })
    .join("\n");
}

function bulletList(items, x, y, opts = {}) {
  const { size = 16, color = "#374151", width = 34, gap = 6 } = opts;
  let cursor = y;
  const out = [];
  for (const item of items) {
    const lines = wordsToLines(item, width);
    out.push(`<circle cx="${x}" cy="${cursor - 5}" r="3.5" fill="${color}" opacity="0.75"/>`);
    out.push(textBlock(lines, x + 16, cursor, { size, color, lineHeight: size + 5 }));
    cursor += lines.length * (size + 5) + gap;
  }
  return out.join("\n");
}

function serviceIcon(service, x, y, size = 74) {
  const s = aws[service] ?? aws.browser;
  if (s.icon) {
    return `
    <g>
      <image href="assets/aws-icons/${s.icon}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>
    </g>`;
  }
  const r = 10;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${s.color}"/>
      <rect x="${x + 8}" y="${y + 8}" width="${size - 16}" height="${size - 16}" rx="${r - 2}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
      <text x="${x + size / 2}" y="${y + size / 2 + 8}" font-size="${size < 62 ? 18 : 25}" font-weight="800" fill="#ffffff" text-anchor="middle">${esc(s.label)}</text>
    </g>`;
}

function card({ x, y, w, h, title, subtitle, service, bullets = [], stroke = "#d1d5db", fill = "#ffffff", titleColor = "#111827" }) {
  const icon = service ? serviceIcon(service, x + 24, y + 56, 74) : "";
  const textX = service ? x + 118 : x + 26;
  const bulletX = service ? x + 118 : x + 30;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      ${textBlock(title, x + w / 2, y + 32, { size: 22, weight: 800, color: titleColor, anchor: "middle" })}
      ${subtitle ? textBlock(subtitle, x + w / 2, y + 58, { size: 15, weight: 600, color: "#4b5563", anchor: "middle", maxChars: 38 }) : ""}
      ${icon}
      ${bulletList(bullets, bulletX, y + 96, { size: 15, width: service ? 29 : 36 })}
    </g>`;
}

function groupBox({ x, y, w, h, title, stroke = "#a78bfa", fill = "#fbfbff" }) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    ${textBlock(title, x + w / 2, y + 34, { size: 20, weight: 800, color: "#374151", anchor: "middle" })}`;
}

function arrow(x1, y1, x2, y2, label = "", color = "#374151", dashed = false) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" ${dashed ? 'stroke-dasharray="9 8"' : ""} marker-end="url(#arrowhead)"/>
    ${label ? `<rect x="${midX - 78}" y="${midY - 24}" width="156" height="28" rx="6" fill="#ffffff" opacity="0.92"/>\n${textBlock(label, midX, midY - 5, { size: 14, weight: 700, color, anchor: "middle" })}` : ""}`;
}

function featureBar(features) {
  const x = 140;
  const y = 704;
  const w = 900;
  const itemW = w / features.length;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="102" rx="12" fill="#fffdf5" stroke="#f3c969" stroke-width="2"/>
      ${textBlock("CARACTERISTICAS DE LA SOLUCION", x + w / 2, y + 28, { size: 18, weight: 800, color: "#d97706", anchor: "middle" })}
      ${features.map((f, i) => {
        const ix = x + i * itemW + 28;
        return `
          ${serviceIcon(f.service, ix, y + 39, 34)}
          ${textBlock(f.title, ix + 46, y + 55, { size: 13, weight: 800, color: "#111827" })}
          ${textBlock(f.desc, ix + 46, y + 73, { size: 11, weight: 500, color: "#4b5563", maxChars: 16 })}
        `;
      }).join("\n")}
    </g>`;
}

function legend(items) {
  const x = 140;
  const y = 815;
  const w = 1320;
  const labelW = 220;
  const itemsX = x + 220;
  const itemW = (w - 250) / items.length;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="52" rx="8" fill="#ffffff" stroke="#d1d5db" stroke-width="1.5"/>
      ${textBlock("SERVICIOS / COMPONENTES", x + 18, y + 31, { size: 12, weight: 800, color: "#374151" })}
      ${items.map((item, i) => {
        const ix = itemsX + i * itemW;
        return `
          ${serviceIcon(item.service, ix, y + 11, 30)}
          ${textBlock(item.name, ix + 40, y + 27, { size: 12, weight: 800, color: "#111827" })}
          ${textBlock(item.desc, ix + 40, y + 43, { size: 11, color: "#4b5563" })}
        `;
      }).join("\n")}
    </g>`;
}

function flowBox(items, x = 1110, y = 604, w = 350, h = 176) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#f9fafb" stroke="#d1d5db" stroke-width="2"/>
      ${textBlock("FLUJO PRINCIPAL", x + w / 2, y + 29, { size: 16, weight: 800, color: "#374151", anchor: "middle" })}
      ${items.map((item, i) => {
        const cy = y + 57 + i * 24;
        return `
          <circle cx="${x + 28}" cy="${cy - 5}" r="9" fill="#2563eb"/>
          ${textBlock(String(i + 1), x + 28, cy - 1, { size: 11, weight: 800, color: "#ffffff", anchor: "middle" })}
          ${textBlock(item, x + 44, cy, { size: 13, weight: 600, color: "#374151", maxChars: 39 })}
        `;
      }).join("\n")}
    </g>`;
}

function canvas(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(subtitle)}</desc>
  <defs>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
    </style>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
    <marker id="arrowhead" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
      <polygon points="0 0, 12 4.5, 0 9" fill="#374151"/>
    </marker>
  </defs>
  <rect width="1600" height="900" fill="#0f5f4f"/>
  <rect x="80" y="54" width="1440" height="792" rx="4" fill="#ffffff" filter="url(#shadow)"/>
  ${textBlock(title, 800, 111, { size: 34, weight: 900, color: "#111827", anchor: "middle" })}
  ${textBlock(subtitle, 800, 145, { size: 22, weight: 600, color: "#111827", anchor: "middle" })}
  ${body}
</svg>`;
}

const diagrams = {
  "magic-cert-v01-arquitectura.svg": canvas(
    "Arquitectura - Magic Cert v01",
    "SPA local generada con IA, sin backend ni servicios cloud",
    `
    ${groupBox({ x: 140, y: 188, w: 300, h: 450, title: "USUARIO" })}
    ${serviceIcon("browser", 254, 252, 76)}
    ${card({ x: 178, y: 368, w: 224, h: 214, title: "Browser", subtitle: "localhost:5173", service: "browser", bullets: ["Interfaz de quiz", "Estado en React", "Resultado inmediato"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}

    ${card({ x: 548, y: 210, w: 290, h: 175, title: "Vite Dev Server", subtitle: "Build y hot reload local", service: "vite", bullets: ["Sirve assets", "HMR para desarrollo"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}
    ${card({ x: 548, y: 458, w: 290, h: 175, title: "React App", subtitle: "TypeScript + CSS", service: "react", bullets: ["App.tsx", "Quiz logic", "Componentes inline"], stroke: "#7dd3fc", fill: "#f0fbff", titleColor: "#0369a1" })}

    ${card({ x: 968, y: 210, w: 350, h: 175, title: "Data estatica", subtitle: "saa-c03-questions.json", service: "json", bullets: ["Preguntas embebidas", "Sin fetching runtime", "Bundled en frontend"], stroke: "#cbd5e1", fill: "#f8fafc" })}
    ${card({ x: 968, y: 458, w: 350, h: 175, title: "Types y Utils", subtitle: "question.ts / questionLoader.ts", service: "json", bullets: ["Contratos TS", "Helpers opcionales", "Validacion en compile-time"], stroke: "#cbd5e1", fill: "#f8fafc" })}

    ${arrow(440, 413, 548, 298, "HTTP local")}
    ${arrow(693, 385, 693, 458, "sirve bundle")}
    ${arrow(838, 546, 968, 546, "usa tipos")}
    ${arrow(838, 298, 968, 298, "importa JSON")}
    ${arrow(968, 330, 838, 502, "datos compile-time", "#64748b", true)}

    ${featureBar([
      { service: "browser", title: "Costo cero", desc: "Corre local" },
      { service: "react", title: "Rapido para demo", desc: "SPA simple" },
      { service: "json", title: "Sin persistencia", desc: "JSON estatico" },
      { service: "vite", title: "Developer loop", desc: "Vite HMR" },
      { service: "browser", title: "Gap productivo", desc: "No backend" },
    ])}
    ${flowBox(["Usuario abre localhost", "Vite entrega el bundle", "React carga preguntas JSON", "Quiz vive en estado local", "No hay AWS ni datos persistidos"], 1088, 642, 372, 156)}
    ${legend([
      { service: "browser", name: "Browser", desc: "Cliente local" },
      { service: "vite", name: "Vite", desc: "Dev server" },
      { service: "react", name: "React", desc: "SPA" },
      { service: "json", name: "JSON", desc: "Preguntas" },
      { service: "json", name: "TypeScript", desc: "Tipos" },
    ])}
  `
  ),

  "magic-cert-v02-arquitectura.svg": canvas(
    "Arquitectura - Magic Cert v02",
    "MVP serverless en AWS para convertir la demo local en sistema cloud",
    `
    ${groupBox({ x: 140, y: 190, w: 290, h: 448, title: "USUARIO" })}
    ${card({ x: 176, y: 280, w: 218, h: 270, title: "Frontend", subtitle: "React / Vite", service: "browser", bullets: ["Registro y login", "Practica SAA-C03", "Progreso del usuario"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}

    ${card({ x: 512, y: 214, w: 292, h: 170, title: "Amazon S3", subtitle: "Static website hosting", service: "s3", bullets: ["Assets publicos", "HTTP para demo", "Deploy por script"], stroke: "#8ac07a", fill: "#f8fff4", titleColor: "#166534" })}
    ${card({ x: 884, y: 214, w: 300, h: 170, title: "Amazon API Gateway", subtitle: "REST API HTTPS", service: "api", bullets: ["GET /questions", "POST /auth/*", "GET/POST /user/*"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}
    ${card({ x: 650, y: 466, w: 390, h: 188, title: "AWS Lambda", subtitle: "Backend business logic", service: "lambda", bullets: ["questions / auth", "user-profile", "user-progress", "JWT y validaciones"], stroke: "#f4b25d", fill: "#fffaf0", titleColor: "#c26700" })}
    ${card({ x: 1190, y: 194, w: 270, h: 210, title: "Amazon DynamoDB", subtitle: "Persistencia on-demand", service: "dynamo", bullets: ["questions", "users", "progress", "sessions + TTL"], stroke: "#7aa7e8", fill: "#f3f8ff", titleColor: "#1d4ed8" })}
    ${card({ x: 1118, y: 460, w: 342, h: 166, title: "Seguridad y Observabilidad", subtitle: "Secrets + logs + alarmas", service: "secrets", bullets: ["JWT en Secrets Manager", "CloudWatch logs", "Dashboard y alarms"], stroke: "#e5b2d5", fill: "#fff7fc", titleColor: "#a21caf" })}

    ${arrow(430, 415, 512, 300, "HTTP")}
    ${arrow(804, 300, 884, 300, "HTTPS API")}
    ${arrow(1034, 384, 875, 466, "invoca")}
    ${arrow(1040, 548, 1190, 304, "lee / escribe")}
    ${arrow(1040, 576, 1118, 548, "secretos / logs")}
    ${arrow(884, 342, 804, 342, "JSON respuesta")}

    ${featureBar([
      { service: "s3", title: "Frontend cloud", desc: "S3 website" },
      { service: "api", title: "API real", desc: "REST HTTPS" },
      { service: "lambda", title: "Serverless", desc: "Funciones Node.js" },
      { service: "dynamo", title: "Persistencia", desc: "DynamoDB on-demand" },
      { service: "terraform", title: "IaC", desc: "Terraform + scripts" },
    ])}
    ${flowBox(["Usuario abre website S3", "Frontend llama API Gateway", "API invoca Lambdas", "Lambda persiste en DynamoDB", "Secrets y CloudWatch cubren operacion"], 1088, 622, 372, 172)}
    ${legend([
      { service: "s3", name: "Amazon S3", desc: "Frontend" },
      { service: "api", name: "API Gateway", desc: "REST API" },
      { service: "lambda", name: "AWS Lambda", desc: "Backend" },
      { service: "dynamo", name: "DynamoDB", desc: "Datos" },
      { service: "secrets", name: "Secrets", desc: "JWT" },
    ])}
  `
  ),

  "magic-cert-v03-arquitectura.svg": canvas(
    "Arquitectura - Magic Cert v03",
    "Runtime serverless con delivery controlado por GitHub OIDC y practica con IA",
    `
    ${groupBox({ x: 130, y: 188, w: 300, h: 430, title: "USUARIO" })}
    ${card({ x: 166, y: 280, w: 228, h: 250, title: "Frontend", subtitle: "React / Vite en S3", service: "browser", bullets: ["Practica guiada", "Login y perfil", "Explicacion con IA"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}

    ${card({ x: 510, y: 200, w: 248, h: 150, title: "Amazon S3", subtitle: "Static website", service: "s3", bullets: ["Assets frontend", "Deploy CI/script"], stroke: "#8ac07a", fill: "#f8fff4", titleColor: "#166534" })}
    ${card({ x: 820, y: 200, w: 260, h: 150, title: "API Gateway", subtitle: "REST HTTPS", service: "api", bullets: ["Auth / questions", "Progress / AI"], stroke: "#a78bfa", fill: "#fbfbff", titleColor: "#5146a6" })}
    ${card({ x: 650, y: 430, w: 360, h: 168, title: "AWS Lambda", subtitle: "5 funciones Node.js", service: "lambda", bullets: ["questions, auth", "profile, progress", "ai-practice"], stroke: "#f4b25d", fill: "#fffaf0", titleColor: "#c26700" })}
    ${card({ x: 1128, y: 184, w: 330, h: 160, title: "DynamoDB + Secrets", subtitle: "Datos y JWT", service: "dynamo", bullets: ["questions / users / progress", "sessions TTL", "JWT secret"], stroke: "#7aa7e8", fill: "#f3f8ff", titleColor: "#1d4ed8" })}
    ${card({ x: 1128, y: 404, w: 330, h: 166, title: "Bedrock Account", subtitle: "STS AssumeRole cross-account", service: "bedrock", bullets: ["Amazon Nova default", "Anthropic opcional", "Payloads auditables"], stroke: "#7aa7e8", fill: "#f3f8ff", titleColor: "#1d4ed8" })}

    ${groupBox({ x: 146, y: 622, w: 870, h: 74, title: "CI/CD: GitHub Actions + OIDC + Terraform", stroke: "#c4b5fd", fill: "#faf7ff" })}
    ${serviceIcon("github", 184, 664, 30)}
    ${textBlock("PR: terraform plan", 224, 685, { size: 13, weight: 800, color: "#374151" })}
    ${serviceIcon("iam", 438, 664, 30)}
    ${textBlock("Prod: assume apply role", 478, 685, { size: 13, weight: 800, color: "#374151" })}
    ${serviceIcon("terraform", 716, 664, 30)}
    ${textBlock("Terraform aplica infra", 756, 685, { size: 13, weight: 800, color: "#374151" })}

    ${arrow(430, 405, 510, 276, "HTTP")}
    ${arrow(758, 276, 820, 276, "HTTPS")}
    ${arrow(950, 350, 842, 430, "invoca")}
    ${arrow(1010, 500, 1128, 264, "datos / JWT")}
    ${arrow(1010, 520, 1128, 488, "STS + IA")}
    ${arrow(844, 626, 820, 598, "deploy", "#64748b", true)}

    ${featureBar([
      { service: "github", title: "OIDC", desc: "Credenciales cortas" },
      { service: "terraform", title: "IaC controlada", desc: "Plan PR / apply prod" },
      { service: "lambda", title: "AI Lambda", desc: "ai-practice" },
      { service: "sts", title: "Cross-account", desc: "AssumeRole" },
      { service: "bedrock", title: "Bedrock", desc: "Amazon Nova" },
    ])}
    ${flowBox(["Usuario usa S3 frontend", "API Gateway invoca Lambdas", "Datos quedan en DynamoDB", "ai-practice asume rol Bedrock", "GitHub OIDC controla cambios"], 1088, 600, 372, 194)}
    ${legend([
      { service: "github", name: "GitHub", desc: "Actions" },
      { service: "iam", name: "OIDC/IAM", desc: "Roles" },
      { service: "lambda", name: "Lambda", desc: "Runtime" },
      { service: "sts", name: "STS", desc: "AssumeRole" },
      { service: "bedrock", name: "Bedrock", desc: "IA" },
    ])}
  `
  ),
};

mkdirSync(outDir, { recursive: true });

for (const [filename, svg] of Object.entries(diagrams)) {
  writeFileSync(join(outDir, filename), svg);
}

console.log(`Generated ${Object.keys(diagrams).length} SVG diagrams in ${outDir}`);
