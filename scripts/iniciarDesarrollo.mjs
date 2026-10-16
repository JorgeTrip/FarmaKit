/**
 * @file iniciarDesarrollo.mjs
 * @description Lanzador del entorno de desarrollo local con Vite, código QR y apertura automática.
 */

import { spawn } from "node:child_process";
import net from "node:net";
import qrcode from "qrcode-terminal";
import { obtenerIpRedLocal } from "./detectorRedLocal.mjs";
import {
  leerLockActivo,
  registrarLock,
  eliminarLock,
  negociarPuertoLibre,
} from "./gestorInstancia.mjs";

const TITULO_PROYECTO = "FarmaKit";
const PUERTO_BASE = Number(process.env.PORT) || 5173;

/**
 * Espera de forma no bloqueante a que el servidor HTTP esté listo para aceptar conexiones.
 *
 * @param {number} puerto - Puerto TCP a sondear.
 * @returns {Promise<boolean>}
 */
function esperarServidorListo(puerto) {
  return new Promise((resolve) => {
    let intentos = 0;
    const intervalo = setInterval(() => {
      intentos++;
      const socket = new net.Socket();
      socket.setTimeout(250);
      socket.once("connect", () => {
        clearInterval(intervalo);
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => socket.destroy());
      socket.once("timeout", () => socket.destroy());
      socket.connect(puerto, "127.0.0.1");

      if (intentos > 80) {
        clearInterval(intervalo);
        resolve(false);
      }
    }, 150);
  });
}

/**
 * Abre el navegador de forma desacoplada y multiplataforma.
 *
 * @param {string} url - Dirección a abrir.
 */
function abrirNavegador(url) {
  const plataforma = process.platform;
  if (plataforma === "win32") {
    spawn("cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (plataforma === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

async function iniciar() {
  const lockPrevio = leerLockActivo();
  if (lockPrevio) {
    console.log(`⚠️ Servidor ya activo en PID ${lockPrevio.pid}. Cerrando ventana...`);
    process.exit(2);
  }

  const puerto = await negociarPuertoLibre(PUERTO_BASE);
  registrarLock(puerto);

  const ipRed = obtenerIpRedLocal();
  const urlLocal = `http://localhost:${puerto}`;
  const urlMovil = `http://${ipRed}:${puerto}`;

  console.log(`====================================================`);
  console.log(`🚀 Entorno de desarrollo local - ${TITULO_PROYECTO}`);
  console.log(`====================================================`);
  console.log(`💻 Local (PC):        ${urlLocal}`);
  console.log(`📱 Red local (Móvil):  ${urlMovil}\n`);
  console.log(`📷 Escanea este código QR con tu móvil (debe estar conectado en la misma red Wi-Fi que esta PC):`);

  qrcode.generate(urlMovil, { small: true }, (qr) => {
    console.log(qr);
    console.log(`====================================================\n`);
  });

  const esWin = process.platform === "win32";
  const ejecutable = esWin ? "cmd.exe" : "npx";
  const argumentos = esWin
    ? ["/d", "/s", "/c", "npx", "vite", "--host", "0.0.0.0", "--port", String(puerto)]
    : ["vite", "--host", "0.0.0.0", "--port", String(puerto)];
  const procesoVite = spawn(ejecutable, argumentos, { stdio: "inherit" });

  const limpiar = () => {
    eliminarLock();
    if (!procesoVite.killed) {
      procesoVite.kill();
    }
  };

  process.on("SIGINT", () => {
    limpiar();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    limpiar();
    process.exit(0);
  });
  process.on("exit", limpiar);

  procesoVite.on("exit", (codigo) => {
    eliminarLock();
    process.exit(codigo || 0);
  });

  esperarServidorListo(puerto).then((listo) => {
    if (listo) {
      abrirNavegador(urlLocal);
    }
  });
}

iniciar().catch((error) => {
  console.error("❌ Error al iniciar el entorno de desarrollo:", error);
  eliminarLock();
  process.exit(1);
});
