/**
 * @file detectorRedLocal.mjs
 * @description Módulo para detectar la dirección IP local de red Wi-Fi/LAN descartando adaptadores virtuales.
 */

import os from "node:os";

const REGEX_ADAPTADOR_VIRTUAL = /vethernet|virtual|vbox|vmware|wsl|pseudo|loopback/i;
const RANGO_VBOX = /^192\.168\.56\./;

/**
 * Obtiene la dirección IPv4 principal de la red local para conexión desde dispositivos móviles.
 *
 * @returns {string} Dirección IP local o 'localhost' si no se detecta conexión activa.
 */
export function obtenerIpRedLocal() {
  const interfaces = os.networkInterfaces();
  const candidatas = [];

  for (const [nombreInterfaz, detalles] of Object.entries(interfaces)) {
    if (REGEX_ADAPTADOR_VIRTUAL.test(nombreInterfaz) || !detalles) {
      continue;
    }

    for (const info of detalles) {
      if (info.family === "IPv4" && !info.internal) {
        if (!RANGO_VBOX.test(info.address)) {
          candidatas.push(info.address);
        }
      }
    }
  }

  const ipPrioritaria = candidatas.find(
    (ip) => ip.startsWith("192.168.") || ip.startsWith("10.")
  );

  return ipPrioritaria || candidatas[0] || "localhost";
}
