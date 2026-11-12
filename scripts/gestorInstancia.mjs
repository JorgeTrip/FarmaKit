/**
 * @file gestorInstancia.mjs
 * @description Gestión de instancia única con lock SHA-256, modelo de 3 estados,
 * detección robusta de --watch (Node 20+/26+) y negociación dinámica de puerto.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NOMBRE_PROYECTO = "farmakit";
const PUERTO_DEFECTO = 5173;
const RUTA_RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Obtiene la ruta determinista del lock efímero usando SHA-256 de la ruta raíz normalizada.
 *
 * @param {string} [rutaProyecto=RUTA_RAIZ] - Ruta raíz del proyecto.
 * @returns {string} Ruta absoluta del archivo .lock en el directorio temporal.
 */
export function obtenerRutaLock(rutaProyecto = RUTA_RAIZ) {
  const rutaNormalizada = path.resolve(rutaProyecto).toLowerCase();
  const hash = crypto.createHash("sha256").update(rutaNormalizada).digest("hex").slice(0, 12);
  return path.join(os.tmpdir(), `${NOMBRE_PROYECTO}_${hash}_dev.lock`);
}

/**
 * Comprueba si un proceso sigue activo en el sistema operativo mediante señal 0.
 *
 * @param {number} pid - Identificador del proceso.
 * @returns {boolean} Verdadero si el proceso está activo.
 */
export function estaProcesoVivo(pid) {
  if (!pid || typeof pid !== "number" || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === "EPERM";
  }
}

/**
 * Determina si la ejecución actual corre supervisada por `node --watch`.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Variables de entorno.
 * @param {string[]} [execArgv=process.execArgv] - Argumentos de ejecución de Node.
 * @returns {boolean} Verdadero si el proceso corre bajo vigilancia.
 */
export function esEjecucionWatch(env = process.env, execArgv = process.execArgv) {
  return Boolean(
    env?.WATCH_REPORT_DEPENDENCIES ||
      env?.DEV_WATCH_ACTIVO === "1" ||
      (Array.isArray(execArgv) && execArgv.some((arg) => arg.startsWith("--watch")))
  );
}

/**
 * Analiza el estado del lock efímero según el modelo de 3 estados.
 *
 * @param {string} [rutaLock=obtenerRutaLock()] - Ruta del archivo de bloqueo.
 * @returns {{ estado: "libre" | "reinicio_watch" | "activo", datos: object | null }}
 */
export function analizarEstadoLock(rutaLock = obtenerRutaLock()) {
  if (!fs.existsSync(rutaLock)) {
    return { estado: "libre", datos: null };
  }

  try {
    const datos = JSON.parse(fs.readFileSync(rutaLock, "utf-8"));
    const supervisorVivo = estaProcesoVivo(datos.pidSupervisor);
    const workerVivo = estaProcesoVivo(datos.pidWorker);

    if (
      datos.esModoWatch &&
      supervisorVivo &&
      datos.pidSupervisor === process.ppid &&
      datos.pidWorker !== process.pid
    ) {
      return { estado: "reinicio_watch", datos };
    }

    if (
      (supervisorVivo && datos.pidSupervisor !== process.ppid) ||
      (workerVivo && datos.pidWorker !== process.pid)
    ) {
      return { estado: "activo", datos };
    }

    fs.unlinkSync(rutaLock);
    return { estado: "libre", datos: null };
  } catch {
    try {
      fs.unlinkSync(rutaLock);
    } catch {}
    return { estado: "libre", datos: null };
  }
}

/**
 * Registra el bloqueo de la sesión activa con su supervisor, worker, modo watch y puerto.
 *
 * @param {number} puerto - Puerto asignado al servidor.
 * @param {string} [rutaLock=obtenerRutaLock()] - Ruta del archivo de bloqueo.
 * @param {object} [opciones={}] - Opciones de entorno/PID para pruebas.
 */
export function registrarLock(puerto, rutaLock = obtenerRutaLock(), opciones = {}) {
  const esModoWatch = opciones.esModoWatch ?? esEjecucionWatch(opciones.env, opciones.execArgv);
  const pidActual = opciones.pid ?? process.pid;
  const ppidActual = opciones.ppid ?? process.ppid;
  const datos = {
    pidSupervisor: esModoWatch ? ppidActual : pidActual,
    pidWorker: pidActual,
    esModoWatch,
    puerto,
    iniciadoEn: Date.now(),
  };
  fs.writeFileSync(rutaLock, JSON.stringify(datos, null, 2), "utf-8");
}

/**
 * Elimina de manera segura el archivo de bloqueo al cerrar intencionalmente la aplicación.
 *
 * @param {string} [rutaLock=obtenerRutaLock()] - Ruta del archivo de bloqueo.
 */
export function eliminarLock(rutaLock = obtenerRutaLock()) {
  try {
    if (fs.existsSync(rutaLock)) {
      fs.unlinkSync(rutaLock);
    }
  } catch {}
}

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
 * @param {number} [puertoBase=PUERTO_DEFECTO] - Puerto inicial preferido.
 * @returns {Promise<number>} Puerto disponible confirmado.
 */
export async function negociarPuertoLibre(puertoBase = PUERTO_DEFECTO) {
  let puertoActual = puertoBase;

  while (!(await probarPuertoDisponible(puertoActual))) {
    console.log(
      `⚠️ Puerto ${puertoActual} en uso por otro proceso. Asignando automáticamente puerto ${puertoActual + 1}.`
    );
    puertoActual++;
  }

  return puertoActual;
}

const esEjecucionDirecta =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esEjecucionDirecta && process.argv.includes("--verificar")) {
  const { estado, datos } = analizarEstadoLock();
  if (estado === "activo" && datos) {
    console.log("====================================================");
    console.log("⚠️ El entorno de desarrollo ya se encuentra en ejecución.");
    console.log(`📌 Instancia activa: PID ${datos.pidWorker} en el puerto ${datos.puerto}.`);
    console.log("Cerrando esta ventana secundaria para evitar duplicados...");
    console.log("====================================================");
    setTimeout(() => {
      process.exit(2);
    }, 1500);
  } else {
    process.exit(0);
  }
}
