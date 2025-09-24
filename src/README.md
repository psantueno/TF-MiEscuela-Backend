# 📚 MiEscuela 4.0 - Backend

Este repositorio contiene el backend de **MiEscuela 4.0**, una plataforma web interactiva para la gestión integral de instituciones educativas.

El backend está desarrollado con **Node.js + Express.js**, usa **PostgreSQL** como base de datos y **Sequelize** como ORM.  
Incluye autenticación con **JWT** y medidas de seguridad básicas.

---

## 🚀 Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior (se recomienda la v22).
- [PostgreSQL](https://www.postgresql.org/) instalado y corriendo.
- [Git](https://git-scm.com/).

---

## 📥 Instalación

1. Clonar el repositorio:
   
   git clone https://github.com/TU-USUARIO/miEscuela-backend.git
   cd miEscuela-backend

2. Instalar dependencias: npm install

3. Crear un archivo .env en la raíz del proyecto con tus credenciales:

PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
JWT_SECRET=
JWT_EXPIRATION=


4. Ejecutar en modo desarrollo: npm run dev


📂 Estructura de carpetas

miEscuela-backend/
│── src/
│   ├── config/        # Configuración (DB, entorno)
│   ├── models/        # Definición de entidades Sequelize
│   ├── controllers/   # Lógica de negocio
│   ├── routes/        # Endpoints de la API
│   ├── middlewares/   # Autenticación, validaciones
│   ├── services/      # Servicios externos o helpers
│   └── app.js         # Configuración principal de Express
│── .env               # Variables de entorno (ignorado en git)
│── .gitignore
│── package.json
│── README.md


📦 Dependencias utilizadas

🔹 En producción
express → Framework minimalista para crear la API.
sequelize → ORM para interactuar con PostgreSQL de forma más sencilla.
pg → Driver de PostgreSQL para Node.js.
pg-hstore → Soporte de PostgreSQL para campos JSON y hstore.
dotenv → Manejo de variables de entorno.
cors → Permite peticiones desde el frontend (control de orígenes cruzados).
jsonwebtoken → Generación y validación de JWT para autenticación.
bcrypt → Encriptación de contraseñas antes de guardarlas en la DB.
helmet → Añade cabeceras de seguridad HTTP.
morgan → Middleware de logs de peticiones HTTP.
express-rate-limit → Límite de requests por IP (prevención de fuerza bruta y DDoS).

🔹 En desarrollo
nodemon → Reinicia automáticamente el servidor al detectar cambios en el código.

🔐 Autenticación con JWT
El backend utiliza JSON Web Tokens (JWT) para manejar sesiones de usuario.

Tras iniciar sesión, el servidor genera un token firmado con una clave secreta (JWT_SECRET).

El token se devuelve al cliente, que puede guardarlo en localStorage, sessionStorage o en cookies HTTP-only (opción más segura en producción).

En cada petición privada, el cliente debe enviar el token (por header Authorization: Bearer <token> o en cookie).

El middleware de autenticación valida el token y permite o rechaza el acceso.

🛠 ## Scripts disponibles

npm run dev → Arranca el servidor en modo desarrollo con nodemon.
