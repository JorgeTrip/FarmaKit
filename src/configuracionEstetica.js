/**
 * @fileoverview Tokens centrales de diseño estético para FarmaKit.
 * Sigue la paleta "Grises Pro", principios Apple-Style, micro-interacciones
 * y directrices de contraste WCAG 2.1 AA.
 * @author J.O.T.
 */

export const paletaGrisesPro = {
  oscuro: {
    fondoBase: '#1C1C1E',
    fondoTarjeta: '#2C2C2E',
    fondoElevado: '#3A3A3C',
    fondoBarra: 'rgba(28, 28, 30, 0.85)',
    textoPrincipal: '#F5F5F7',
    textoSecundario: '#A1A1A6',
    bordeSutil: 'rgba(255, 255, 255, 0.08)',
    bordeActivo: 'rgba(144, 202, 249, 0.4)',
    primario: '#64B5F6',
    secundario: '#F48FB1',
    exito: '#34C759',
    alerta: '#FF9F0A',
    error: '#FF453A',
  },
  claro: {
    fondoBase: '#F5F5F7',
    fondoTarjeta: '#FFFFFF',
    fondoElevado: '#E5E5EA',
    fondoBarra: 'rgba(245, 245, 247, 0.85)',
    textoPrincipal: '#1C1C1E',
    textoSecundario: '#6E6E73',
    bordeSutil: 'rgba(0, 0, 0, 0.08)',
    bordeActivo: 'rgba(25, 118, 210, 0.4)',
    primario: '#0071E3',
    secundario: '#D81B60',
    exito: '#28CD41',
    alerta: '#FF9500',
    error: '#FF3B30',
  }
};

export const configuracionEfectos = {
  desenfoqueBarra: 'blur(20px)',
  transicionSuave: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  radioBorde: '14px',
  radioPildora: '9999px',
  sombraTarjeta: '0 4px 20px rgba(0, 0, 0, 0.08)',
  sombraFlotante: '0 8px 30px rgba(0, 0, 0, 0.16)',
};
