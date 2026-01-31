# FarmaKit - Suite de Herramientas para Farmacia

**FarmaKit** es una aplicación web integral diseñada para optimizar las tareas diarias en el entorno farmacéutico. Esta suite unifica múltiples herramientas esenciales en una interfaz moderna, intuitiva y personalizable, facilitando desde la gestión de precios hasta cálculos clínicos pediátricos.

## 🚀 Características Principales

### 📊 Gestión Comercial y Administrativa

#### 1. 🪑 Procesador de Precios con Muebles
Herramienta potente para la actualización masiva de precios y organización logística.
*   **Drag & Drop**: Carga intuitiva de archivos Excel (`.xlsx`, `.xls`, `.ods`).
*   **Asignación Inteligente**: Cruce automático de datos para asignar muebles/ubicaciones a cada producto basándose en un archivo maestro.
*   **Validación de Datos**: Detección automática de errores en formatos.
*   **Exportación Flexible**: Generación de reportes ordenados listos para imprimir o procesar.

#### 2. 💰 Asistente de Arqueo de Caja
Simplifica el cierre de caja diario minimizando errores humanos.
*   **Conteo por Denominación**: Ingresa cantidades de billetes para cálculo automático.
*   **Gestión de Fondo de Caja**: Separación clara de retiros y fondos fijos.
*   **Comparación en Tiempo Real**: Visualización inmediata de sobrantes o faltantes respecto al sistema.
*   **Alertas Visuales**: Indicadores de color para diferencias de caja.

#### 3. 📋 Checklist de Cierre y Apertura
Asegura el cumplimiento de procedimientos operativos estándar.
*   **Listas Dinámicas**: Agrega o quita tareas según la necesidad del día.
*   **Reportes de Cierre**: Generación de resumen en texto plano para bitácoras o emails.
*   **Persistencia**: Guardado automático del estado de las tareas.

### ⚕️ Herramientas Clínicas y de Referencia

#### 4. 👶 Calculadora de Dosis Pediátrica
Asistente crítico para la validación y cálculo de dispensación pediátrica.
*   **Multi-Fármaco**: Algoritmos específicos para:
    *   **Ibuprofeno**: (2% y 4%) según peso.
    *   **Paracetamol**: Dosis seguras por peso.
    *   **Antibióticos**: (Amoxicilina, etc.) Cálculo de volúmenes de suspensión.
*   **Volumen de Tratamiento**: Calcula automáticamente cuántos frascos son necesarios para un tratamiento completo de antibióticos (ej. 7 días cada 8hs).
*   **Seguridad**: Advertencias sobre dosis máximas diarias.

#### 5. 🔍 Búsqueda y Actualización de Precios
*   **Buscador Integrado**: Acceso rápido a referencias de precios.
*   **Actualizador**: Herramienta dedicada para aplicar porcentajes de aumento o reglas de precios específicas.

#### 6. 📘 Integración con Vademecum
*   **Vademecum Argentina**: Acceso directo embebido a información farmacológica actualizada (vía Alfabeta).
*   **Consulta de Precios**: Verificación rápida de precios de venta al público oficiales.

## 🛠️ Tecnologías

Este proyecto está construido con un stack moderno enfocado en performance y experiencia de usuario:

*   **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **UI/UX**: [Material UI (MUI)](https://mui.com/) con tema personalizable (Dark/Light Mode).
*   **Manejo de Datos**: [SheetJS (xlsx)](https://docs.sheetjs.com/) para procesamiento de hojas de cálculo.
*   **Enrutamiento**: React Router Dom.

## 💻 Instalación y Uso Local

Requisitos previos: **Node.js v18+** y **npm v9+**.

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/JorgeTrip/Agregar_mueble_actualizacion_precio.git
    cd farmakit
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Iniciar servidor de desarrollo**
    ```bash
    npm run dev
    # O simplemente ejecuta el archivo run.bat en Windows
    ```

4.  **Construir para producción**
    ```bash
    npm run build
    ```

## 🌍 Despliegue

Configurado para **Netlify**. El archivo `netlify.toml` maneja automáticamente la configuración de build y redirecciones para SPA.

1.  Conectar repositorio a Netlify.
2.  El sistema detectará Vite y desplegará automáticamente.

---

<p align="center">
  <i>Desarrollado por J.O.T. para optimizar la gestión farmacéutica diaria.</i>
</p>
