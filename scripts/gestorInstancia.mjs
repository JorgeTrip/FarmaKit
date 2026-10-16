/**
 * @file gestorInstancia.mjs
 * @description Gestión de instancia única, prevención de colisiones de puertos y locks efímeros.
 */

import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const NOMBRE_PROYECTO = "farmakit";
const RUTA_ARCHIVO_LOCK = path.join(os.tmpdir(), `${NOMBRE_PROYECTO}_dev.lock`);

/**
 * Comprueba si un proceso sigue activo en el sistema operativo mediante señal 0.
 *
 * @param {number} pid - Identificador del proceso.
 * @returns {boolean} Verdadero si el proceso está activo.
 */
export function estaProcesoVivo(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee el archivo de bloqueo efímero si existe y no está huérfano.
 *
 * @returns {object | null} Datos del lock o null si no existe/está huérfano.
 */
export function leerLockActivo() {
  if (!fs.existsSync(RUTA_ARCHIVO_LOCK)) return null;

  try {
    const contenido = fs.readFileSync(RUTA_ARCHIVO_LOCK, "utf-8");
    const datos = JSON.parse(contenido);

    if (estaProcesoVivo(datos.pid) && datos.pid !== process.pid) {
      return datos;
    }

    fs.unlinkSync(RUTA_ARCHIVO_LOCK);
    return null;
  } catch {
    try {
      fs.unlinkSync(RUTA_ARCHIVO_LOCK);
    } catch {}
    return null;
  }
}

/**
 * Registra el bloqueo de la sesión activa con su PID y puerto.
 *
 * @param {number} puerto - Puerto en el que corre el servidor.
 */
export function registrarLock(puerto) {
  const datos = {
    pid: process.pid,
    pidSupervisor: process.ppid,
    puerto,
    iniciadoEn: Date.now(),
  };
  fs.writeFileSync(RUTA_ARCHIVO_LOCK, JSON.stringify(datos, null, 2), "utf-8");
}

/**
 * Elimina de manera segura el archivo de bloqueo al cerrar la aplicación.
 */
export function eliminarLock() {
  try {
    if (fs.existsSync(RUTA_ARCHIVO_LOCK)) {
      fs.unlinkSync(RUTA_ARCHIVO_LOCK);
    }
  } catch {}
}

/**
 * Verifica si un puerto TCP específico está disponible en todas las interfaces.
 *
 * @param {number} puerto - Puerto a probar.
 * @returns {Promise<boolean>}
 */
function probarPuertoDisponible(puerto) {
  return new Promise((resolve) => {
    const servidor = net.createServer();
    servidor.once("error", () => resolve(false));
    servidor.once("listening", () => {
      servidor.close(() => resolve(true));
    });
    servidor.listen(puerto, "0.0.0.0");
  });
}

/**
 * Negocia secuencialmente el primer puerto libre a partir del puerto base indicado.
 *
 * @param {number} [puertoBase=5173] - Puerto inicial preferido.
 * @returns {Promise<number>} Puerto disponible confirmado.
 */
export async function negociarPuertoLibre(puertoBase = 5173) {
  let puertoActual = puertoBase;

  while (!(await probarPuertoDisponible(puertoActual))) {
    console.log(
      `⚠️ Puerto ${puertoActual} en uso por otro proceso. Asignando automáticamente puerto ${puertoActual + 1}.`
    );
    puertoActual++;
  }

  return puertoActual;
}

if (process.argv.includes("--verificar")) {
  const lockActivo = leerLockActivo();
  if (lockActivo) {
    console.log(`====================================================`);
    console.log(`⚠️ El entorno de desarrollo ya se encuentra en ejecución.`);
    console.log(`📌 Instancia activa: PID ${lockActivo.pid} en el puerto ${lockActivo.puerto}.`);
    console.log(`Cerrando esta ventana secundaria para evitar duplicados...`);
    console.log(`====================================================`);
    setTimeout(() => {
      process.exit(2);
    }, 1500);
  } else {
    process.exit(0);
  }
}
