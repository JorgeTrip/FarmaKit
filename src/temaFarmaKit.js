/**
 * @fileoverview Configuración del tema Material-UI para FarmaKit.
 * Aplica la paleta Grises Pro, tipografía moderna y micro-interacciones.
 * @author J.O.T.
 */
import { createTheme } from '@mui/material/styles';
import { paletaGrisesPro, configuracionEfectos } from './configuracionEstetica';

export const crearTemaFarmaKit = (modo) => {
  const paleta = modo === 'dark' ? paletaGrisesPro.oscuro : paletaGrisesPro.claro;

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: paleta.primario,
      },
      secondary: {
        main: paleta.secundario,
      },
      background: {
        default: paleta.fondoBase,
        paper: paleta.fondoTarjeta,
        barra: paleta.fondoBarra,
      },
      text: {
        primary: paleta.textoPrincipal,
        secondary: paleta.textoSecundario,
      },
      divider: paleta.bordeSutil,
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: paleta.fondoTarjeta,
            borderRadius: configuracionEfectos.radioBorde,
            border: `1px solid ${paleta.bordeSutil}`,
            boxShadow: configuracionEfectos.sombraTarjeta,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '0.95rem',
            transition: configuracionEfectos.transicionSuave,
          },
          containedPrimary: {
            backgroundColor: paleta.primario,
            color: modo === 'dark' ? '#000000' : '#ffffff',
            '&:hover': {
              backgroundColor: modo === 'dark' ? '#90caf9' : '#005bb5',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: paleta.bordeSutil,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: paleta.fondoElevado,
          },
        },
      },
    },
  });
};
