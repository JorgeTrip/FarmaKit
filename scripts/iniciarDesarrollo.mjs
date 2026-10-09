import { spawn, exec } from "node:child_process";
import net from "node:net";
import os from "node:os";
import qrcode from "qrcode-terminal";

/**
 * Script de automatización para el entorno de desarrollo local.
 * Inicia el servidor de desarrollo de Vite exponiendo la red local (0.0.0.0),
 * detecta la dirección IP de la red Wi-Fi/LAN, genera un código QR para conexión rápida
 * desde dispositivos móviles y lanza automáticamente el navegador en cuanto esté listo.
 */

const PUERTO = process.env.PORT || 5173;
const URL_LOCAL = `http://localhost:${PUERTO}`;
const IP_RED = obtenerIpRedLocal();
const URL_RED = `http://${IP_RED}:${PUERTO}`;

console.log("\n====================================================");
console.log("🚀 Entorno de desarrollo local - FarmaKit");
console.log("====================================================");
console.log(`💻 Local (PC):        ${URL_LOCAL}`);
console.log(`📱 Red local (Móvil):  ${URL_RED}\n`);

if (IP_RED !== "localhost") {
    console.log("📷 Escanea este código QR con tu móvil (debe estar conectado en la misma red Wi-Fi que esta PC):");
    qrcode.generate(URL_RED, { small: true });
}
console.log("====================================================\n");

// Se ejecuta el comando de Vite enlazando con 0.0.0.0 para acceso en red local.
const procesoDev = spawn("npx vite --host 0.0.0.0", {
    stdio: "inherit",
    shell: true
});

let navegadorAbierto = false;

/**
 * Obtiene la dirección IPv4 local del equipo en la red (LAN/Wi-Fi).
 * Filtra adaptadores virtuales comunes como Docker, WSL, VirtualBox o VMware.
 *
 * @returns {string} Dirección IP para acceso en red local o 'localhost' como respaldo.
 */
function obtenerIpRedLocal() {
    const interfaces = os.networkInterfaces();
    const patronesExcluidos = /vethernet|virtual|vbox|vmware|wsl|pseudo|loopback/i;
    let ipCandidata = null;

    for (const [nombre, lista] of Object.entries(interfaces)) {
        if (!lista || patronesExcluidos.test(nombre)) continue;

        for (const detalle of lista) {
            if (detalle.family === "IPv4" && !detalle.internal) {
                // Excluir rangos típicos de VirtualBox Host-Only (192.168.56.x)
                if (detalle.address.startsWith("192.168.56.")) continue;

                // Priorizar redes domésticas típicas (192.168.x.x o 10.x.x.x)
                if (detalle.address.startsWith("192.168.") || detalle.address.startsWith("10.")) {
                    return detalle.address;
                }
                if (!ipCandidata) {
                    ipCandidata = detalle.address;
                }
            }
        }
    }

    return ipCandidata || "localhost";
}

/**
 * Lanza el navegador predeterminado hacia la URL local.
 * Utiliza el comando nativo según la plataforma para asegurar compatibilidad.
 *
 * @param {string} url - Dirección web a abrir.
 */
function abrirNavegador(url) {
    if (navegadorAbierto) return;
    navegadorAbierto = true;
    console.log(`\n✨ Servidor listo. Abriendo navegador en ${url}...`);
    const comando = process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    exec(comando);
}

/**
 * Comprueba de forma no bloqueante si el socket TCP del puerto especificado está activo.
 *
 * @param {number|string} puerto - Puerto a comprobar.
 * @param {string} host - Host a comprobar.
 * @returns {Promise<boolean>} Devuelve true si el socket acepta conexiones.
 */
function verificarPuertoActivo(puerto, host = "127.0.0.1") {
    return new Promise((resolver) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.on("connect", () => {
            socket.destroy();
            resolver(true);
        });
        socket.on("error", () => {
            socket.destroy();
            resolver(false);
        });
        socket.on("timeout", () => {
            socket.destroy();
            resolver(false);
        });
        socket.connect(Number(puerto), host);
    });
}

/**
 * Sondea activamente el servidor local mediante sondeo TCP.
 * En cuanto el servidor acepta conexiones, dispara la apertura del navegador.
 */
async function esperarServidorYabrir() {
    const tiempoMaximoEsperaMs = 30000;
    const inicio = Date.now();

    while (!navegadorAbierto && Date.now() - inicio < tiempoMaximoEsperaMs) {
        const puertoListo = await verificarPuertoActivo(PUERTO);
        if (puertoListo) {
            // Breve espera para estabilizar el socket antes de invocar la apertura del navegador
            await new Promise((resolver) => setTimeout(resolver, 300));
            abrirNavegador(URL_LOCAL);
            break;
        }
        await new Promise((resolver) => setTimeout(resolver, 500));
    }
}

// Iniciar sondeo no bloqueante
esperarServidorYabrir();

// Manejo de salida y cierre de procesos
procesoDev.on("close", (codigo) => {
    process.exit(codigo ?? 0);
});

process.on("SIGINT", () => {
    procesoDev.kill("SIGINT");
    process.exit(0);
});
