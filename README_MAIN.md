# Después de la Magia: de localhost a producción

**Nerdearla Ciudad de México 2026** · 18 de noviembre, 11:00 a 12:00 (GMT-6) · Workshops virtuales 2

[Información de la charla](https://nerdearla.com/en/mexico/schedule/despues-de-la-magia-de-localhost-a-produccion/)

## 🎯 Presentación

La magia del Vibe Coding termina cuando llega el primer usuario real. Esta presentación usa Magic Cert para mostrar las decisiones de ingeniería y arquitectura que permiten llevar una aplicación de localhost a producción en AWS.

---

## 📊 Etapas de la Presentación

### 🌟 **v01: Magic Cert - Creación Mágica en Localhost**
**Estado: ✅ COMPLETADO**

📁 **Ubicación:** `Magic_Cert_v01/`

**¿Qué es?**
Una aplicación de quiz para certificaciones AWS creada completamente con IA generativa (Kiro AI).

**Características:**
- ✅ Aplicación de quiz interactiva para certificaciones AWS
- ✅ 10 preguntas de ejemplo SAA-C03 (Solutions Architect Associate)
- ✅ Estructura TypeScript completa con tipos e interfaces
- ✅ Sistema de gestión de preguntas con filtros y búsqueda
- ✅ Documentación completa de estructura de preguntas
- ✅ Categorías: Compute, Storage, Database, Networking, Security, etc.
- ✅ Niveles de dificultad: Easy, Medium, Hard
- ✅ Referencias a documentación oficial de AWS

**Tecnologías:**
- TypeScript
- React (preparado para implementación)
- Vite
- JSON para banco de preguntas

**La Magia:**
Todo el código base, estructura del proyecto, tipos TypeScript, preguntas de ejemplo y documentación fueron generados automáticamente por IA en cuestión de minutos. ¡Ninguna línea fue escrita manualmente!

**Cómo ejecutar:**
```bash
cd Magic_Cert_v01
npm install
npm run dev
```

---

### 🏗️ **v02: Despliegue serverless con Terraform**
**Estado: ✅ Documentado**

📁 **Ubicación:** `Magic_Cert_v02/`

**¿Qué agrega?**
Infraestructura reproducible con Terraform para el frontend y la API.

**Incluye:**
- Frontend estático en S3
- API Gateway, Lambda y DynamoDB
- CloudWatch para registros y métricas
- Scripts de despliegue

**Objetivos:**
- Infraestructura versionada y reproducible
- Fácil creación/destrucción de ambientes
- Documentación de recursos en código
- Best practices de seguridad AWS

**Tecnologías:**
- Terraform
- AWS CLI
- Scripts de automatización

---

### ☁️ **v03: Entrega en producción con OIDC y Bedrock**
**Estado: ✅ Documentado y desplegado**

📁 **Ubicación:** `Magic_Cert_v03/`

**¿Qué agrega?**
Extiende v02 con entrega del frontend por HTTPS y un flujo de despliegue orientado a producción.

**Incluye:**
- S3 privado, CloudFront, ACM y Route 53
- API Gateway, Lambda y DynamoDB
- GitHub Actions con OIDC para Terraform
- Explicaciones opcionales con Amazon Bedrock
- CloudWatch para registros y métricas

**Objetivos:**
- Aplicación funcionando en producción
- Alta disponibilidad y escalabilidad
- Seguridad siguiendo AWS best practices
- Monitoreo y observabilidad
- Costos optimizados

**Tecnologías:**
- AWS S3, CloudFront, Route53
- AWS Lambda, API Gateway, DynamoDB
- Amazon Bedrock y CloudWatch
- GitHub Actions y Terraform

---

## 🎭 Mensaje de la Presentación: "Después de la Magia"

### La Magia (v01): ✨
- Crear aplicaciones rápidamente con IA
- Generación automática de código
- Prototipado instantáneo
- Desarrollo asistido por IA

### Después de la Magia (v02 y v03): 🔧
- Infraestructura profesional
- Escalabilidad y disponibilidad
- Seguridad y cumplimiento
- Operaciones y mantenimiento
- Costos y optimización
- CI/CD y automatización

### El Punto Clave: 💡
**La IA puede crear el código rápidamente, pero los profesionales de tecnología son esenciales para:**
- ✅ Diseñar arquitecturas escalables
- ✅ Implementar seguridad robusta
- ✅ Gestionar infraestructura en la nube
- ✅ Optimizar rendimiento y costos
- ✅ Asegurar alta disponibilidad
- ✅ Mantener y evolucionar sistemas
- ✅ Aplicar mejores prácticas de la industria

---

## 📁 Estructura del Repositorio

```
AWS-Nerdearla-2026-Mexico-Localhost-2-Produccion/
├── README_MAIN.md                 # Este archivo - Overview de la presentación
├── .gitignore
│
├── Magic_Cert_v01/                # ✅ v01: Aplicación base con IA
│   ├── README.md                  # Documentación específica v01
│   ├── QUESTION_STRUCTURE.md
│   ├── PROJECT_STRUCTURE.md
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── data/                  # 10 preguntas SAA-C03
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── tests/
│
├── Magic_Cert_v02/                # ✅ Serverless + Terraform
│   ├── README.md
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   └── scripts/
│
└── Magic_Cert_v03/                # ✅ HTTPS + OIDC + Bedrock
    ├── README.md
    ├── terraform/
    ├── backend/
    └── scripts/
```

---

## 🎤 Audiencia Objetivo

- Desarrolladores interesados en IA generativa
- Arquitectos de soluciones AWS
- DevOps Engineers
- Estudiantes de certificaciones AWS
- Profesionales de la nube

---

## 🎓 Aprendizajes Clave

1. **IA como Acelerador**: La IA puede acelerar dramáticamente el desarrollo inicial
2. **Conocimiento Profesional es Crítico**: La infraestructura, seguridad y operaciones requieren experiencia humana
3. **Infraestructura como Código**: Terraform permite gestionar infraestructura de forma reproducible
4. **Servicios Serverless**: AWS ofrece servicios que eliminan la gestión de servidores
5. **Mejores Prácticas**: Siempre aplicar Well-Architected Framework de AWS

---

## 🛠️ Requisitos Previos

### Para v01:
- Node.js 16+
- npm o yarn
- Editor de código

### Para v02:
- Todo lo de v01
- Terraform instalado
- AWS CLI configurado
- Cuenta AWS

### Para v03:
- Todo lo de v01 y v02
- Permisos IAM apropiados
- GitHub account (para CI/CD)

---

## 🚀 Quick Start

```bash
# Clonar el repositorio
git clone [repository-url]
cd AWS-Nerdearla-2026-Mexico-Localhost-2-Produccion

# Ejecutar v01
cd Magic_Cert_v01
npm install
npm run dev

# Para v02 y v03, consultar sus README antes de desplegar
```

---

## 📞 Contacto

**Nerdearla Ciudad de México 2026**
- Charla: [Después de la Magia: de localhost a producción](https://nerdearla.com/en/mexico/schedule/despues-de-la-magia-de-localhost-a-produccion/)
- Fecha y horario: 18 de noviembre de 2026, 11:00 a 12:00 (GMT-6)
- Sala: Workshops virtuales 2

---

## 📝 Licencia

MIT License - Ver archivo LICENSE para detalles

---

## 🌟 Agradecimientos

- AWS Community Builders
- Comunidad de Nerdearla Ciudad de México
- Asistentes de la charla
- Herramientas de IA que hicieron posible v01

---

*Después de la magia, toca construir y operar una aplicación que funcione para usuarios reales.*
