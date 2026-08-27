import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url));

const iconMap = {
  s3: "amazon-s3.svg",
  api: "amazon-api-gateway.svg",
  lambda: "aws-lambda.svg",
  dynamo: "amazon-dynamodb.svg",
  secrets: "aws-secrets-manager.svg",
  cloudwatch: "amazon-cloudwatch.svg",
  iam: "aws-iam.svg",
  sts: "aws-sts.svg",
  bedrock: "amazon-bedrock.svg",
  cloudfront: "amazon-cloudfront.svg",
  acm: "aws-certificate-manager.svg",
  route53: "amazon-route-53.svg",
  waf: "aws-waf.svg",
  cognito: "amazon-cognito.svg",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, max = 32) {
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
  const { size = 18, weight = 500, fill = "#161E2D", anchor = "start", lineHeight = Math.round(size * 1.3), max } = opts;
  const normalized = Array.isArray(lines) ? lines : max ? wrap(lines, max) : [lines];
  return normalized
    .map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(line)}</text>`)
    .join("\n");
}

function icon(name, x, y, size = 44) {
  if (iconMap[name]) {
    return `<image href="assets/aws-icons/${iconMap[name]}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const colors = { web: "#545B64", react: "#149ECA", json: "#687078", github: "#24292F", terraform: "#844FBA", tenant: "#01A88D", key: "#DD344C" };
  const labels = { web: "WEB", react: "R", json: "{}", github: "GH", terraform: "TF", tenant: "TEN", key: "KEY" };
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${colors[name] ?? "#545B64"}"/><text x="${x + size / 2}" y="${y + size / 2 + 7}" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">${labels[name] ?? name}</text>`;
}

function capabilityRow({ x, y, w, h, color, version, title, subtitle, icons, bullets }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#FFFFFF" stroke="#D5DBDB" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="12" height="${h}" fill="${color}"/>
      <text x="${x + 34}" y="${y + 40}" font-size="22" font-weight="900" fill="${color}">${esc(version)}</text>
      ${text(title, x + 116, y + 40, { size: 23, weight: 900 })}
      ${text(subtitle, x + 116, y + 67, { size: 14, weight: 700, fill: "#5F6B7A", max: 60 })}
      ${icons.map((name, i) => icon(name, x + 34 + i * 54, y + 84, 40)).join("\n")}
      ${bullets.map((b, i) => {
        const bx = x + 430 + (i % 2) * 270;
        const by = y + 102 + Math.floor(i / 2) * 34;
        return `<circle cx="${bx}" cy="${by - 6}" r="4" fill="${color}"/>${text(b, bx + 15, by, { size: 14, weight: 700, fill: "#414D5C", max: 25 })}`;
      }).join("\n")}
    </g>`;
}

function missingCard({ x, y, w, h, service, title, bullets, color = "#7D3CDB" }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#FFFFFF" stroke="#D5DBDB" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${w}" height="7" fill="${color}"/>
      ${icon(service, x + 22, y + 36, 50)}
      ${text(title, x + 82, y + 47, { size: 16, weight: 900, max: 22 })}
      ${bullets.map((b, i) => `<circle cx="${x + 86}" cy="${y + 86 + i * 27}" r="3.5" fill="${color}"/>${text(b, x + 100, y + 91 + i * 27, { size: 13, weight: 700, fill: "#414D5C", max: 25 })}`).join("\n")}
    </g>`;
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

  ${text("CAPABILITIES DRAFT 02 / ROADMAP DE MADUREZ", 80, 70, { size: 13, weight: 900, fill: "#FF9900" })}
  ${text("Magic Cert: lo que ya se apila y lo que falta", 80, 120, { size: 40, weight: 900 })}
  ${text("La placa separa capacidades implementadas de gaps de produccion como SSL, dominio, WAF, Cognito y multi-tenant real.", 80, 156, { size: 18, weight: 650, fill: "#5F6B7A" })}

  <rect x="80" y="200" width="900" height="34" rx="3" fill="#232F3E"/>
  ${text("YA ESTA EN LA EVOLUCION", 108, 223, { size: 15, weight: 900, fill: "#FFFFFF" })}

  ${capabilityRow({
    x: 80,
    y: 252,
    w: 900,
    h: 138,
    color: "#879196",
    version: "v01",
    title: "Base local funcional",
    subtitle: "Validacion rapida de UX, preguntas y flujo de quiz.",
    icons: ["web", "react", "json"],
    bullets: ["Interfaz de quiz", "Estado local", "Preguntas JSON", "Sin backend"],
  })}

  ${capabilityRow({
    x: 80,
    y: 414,
    w: 900,
    h: 154,
    color: "#FF9900",
    version: "v02",
    title: "Runtime cloud serverless",
    subtitle: "La demo pasa a servicios administrados y operables en AWS.",
    icons: ["s3", "api", "lambda", "dynamo", "secrets", "cloudwatch", "terraform"],
    bullets: ["S3 website HTTP", "API Gateway HTTPS", "Lambda backend", "DynamoDB on-demand", "Clave JWT en Secrets", "CloudWatch + IaC"],
  })}

  ${capabilityRow({
    x: 80,
    y: 592,
    w: 900,
    h: 154,
    color: "#01A88D",
    version: "v03",
    title: "Delivery controlado + IA",
    subtitle: "Gobierno de cambios, credenciales temporales e IA cross-account.",
    icons: ["github", "iam", "sts", "bedrock", "lambda", "tenant"],
    bullets: ["GitHub OIDC", "Plan read-only PR", "Apply protegido", "Sin access keys largas", "Lambda ai-practice", "Base multi-deployment"],
  })}

  <path d="M990 668 C1042 650 1072 624 1100 590" fill="none" stroke="#7D3CDB" stroke-width="3" stroke-dasharray="8 7" marker-end="url(#arrow)"/>

  <rect x="1060" y="200" width="460" height="34" rx="3" fill="#7D3CDB"/>
  ${text("FALTA PARA PRODUCCION", 1128, 223, { size: 15, weight: 900, fill: "#FFFFFF" })}

  ${missingCard({ x: 1060, y: 252, w: 218, h: 154, service: "cloudfront", title: "HTTPS frontend", bullets: ["CloudFront", "Viewer HTTPS only", "Cache control"], color: "#8C4FFF" })}
  ${missingCard({ x: 1302, y: 252, w: 218, h: 154, service: "acm", title: "SSL/TLS", bullets: ["Certificado ACM", "TLS gestionado", "Sin HTTP publico"], color: "#DD344C" })}

  ${missingCard({ x: 1060, y: 430, w: 218, h: 154, service: "route53", title: "Dominio", bullets: ["Route 53", "DNS controlado", "URL estable"], color: "#8C4FFF" })}
  ${missingCard({ x: 1302, y: 430, w: 218, h: 154, service: "waf", title: "Proteccion edge", bullets: ["AWS WAF", "Rate limits", "Managed rules"], color: "#DD344C" })}

  ${missingCard({ x: 1060, y: 608, w: 218, h: 154, service: "cognito", title: "Auth productiva", bullets: ["Cognito", "Refresh/logout", "MFA opcional"], color: "#DD344C" })}
  ${missingCard({ x: 1302, y: 608, w: 218, h: 154, service: "tenant", title: "Multi-tenant real", bullets: ["Tenant isolation", "Datos por tenant", "Cost allocation"], color: "#01A88D" })}

  <rect x="80" y="802" width="1440" height="54" rx="4" fill="#F2F3F3" stroke="#D5DBDB"/>
  ${text("Mensaje: v03 mejora delivery e IA, pero SSL/HTTPS frontend, dominio, WAF, Cognito y multi-tenant real siguen siendo capas de hardening posteriores.", 112, 836, { size: 17, weight: 800, fill: "#414D5C" })}
</svg>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "magic-cert-capabilities-draft-02.svg"), svg);
console.log(`Generated capabilities draft 02 in ${outDir}`);
