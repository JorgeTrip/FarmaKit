import React from 'react';
import { 
  Box, 
  Tooltip, 
  IconButton, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Description as SpreadsheetIcon, 
  AttachMoney as CashIcon, 
  Checklist as ChecklistIcon,
  LocalDrink as SyrupIcon,
  LocalPharmacy as PharmacyIcon,
  MenuBook as VademecumIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { paletaGrisesPro, configuracionEfectos } from '../configuracionEstetica';

/**
 * Elementos de navegación disponibles en FarmaKit
 */
const ELEMENTOS_NAVEGACION = [
  { id: 'home', etiqueta: 'Actualización y Muebles', icono: SpreadsheetIcon },
  { id: 'cashAssistant', etiqueta: 'Arqueo de Caja', icono: CashIcon },
  { id: 'checklist', etiqueta: 'Checklist de Cierre', icono: ChecklistIcon },
  { id: 'dosageCalculator', etiqueta: 'Dosis Pediátricas', icono: SyrupIcon },
  { id: 'medicationPrices', etiqueta: 'Precios de Medicamentos', icono: PharmacyIcon },
  { id: 'argentinaVademecum', etiqueta: 'Vademecum Argentina', icono: VademecumIcon },
];

/**
 * Barra de navegación unificada estilo Apple con Grises Pro.
 * En escritorio se acopla a la columna izquierda del layout central enmarcado.
 * En móvil se comporta como Bottom Bar flotante estilo iOS.
 */
function Sidebar({ onSelect, toggleTheme, themeMode, selectedComponent = 'home' }) {
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'));
  const paleta = themeMode === 'dark' ? paletaGrisesPro.oscuro : paletaGrisesPro.claro;

  return (
    <Box
      component="nav"
      aria-label="Navegación principal"
      sx={{
        backgroundColor: paleta.fondoBarra,
        backdropFilter: configuracionEfectos.desenfoqueBarra,
        WebkitBackdropFilter: configuracionEfectos.desenfoqueBarra,
        border: `1px solid ${paleta.bordeSutil}`,
        transition: configuracionEfectos.transicionSuave,
        boxShadow: configuracionEfectos.sombraFlotante,
        ...(esMovil
          ? {
              position: 'fixed',
              zIndex: 1100,
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 24px)',
              maxWidth: '480px',
              borderRadius: configuracionEfectos.radioPildora,
              height: '58px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              px: 1,
            }
          : {
              position: 'sticky',
              top: '80px',
              width: '64px',
              height: 'calc(100vh - 100px)',
              borderRadius: configuracionEfectos.radioBorde,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              flexShrink: 0,
            }),
      }}
    >
      {/* Contenedor de Botones de Navegación */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: esMovil ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: esMovil ? 'space-around' : 'flex-start',
          width: '100%',
          gap: esMovil ? 0.5 : 1.5,
          flexGrow: 1,
        }}
      >
        {ELEMENTOS_NAVEGACION.map(({ id, etiqueta, icono: Icono }) => {
          const estaActivo = selectedComponent === id;
          return (
            <Tooltip key={id} title={etiqueta} arrow placement={esMovil ? 'top' : 'right'}>
              <IconButton
                onClick={() => onSelect(id)}
                aria-label={etiqueta}
                aria-current={estaActivo ? 'page' : undefined}
                sx={{
                  color: estaActivo ? paleta.primario : paleta.textoSecundario,
                  backgroundColor: estaActivo
                    ? themeMode === 'dark' ? 'rgba(100, 181, 246, 0.16)' : 'rgba(0, 113, 227, 0.12)'
                    : 'transparent',
                  borderRadius: configuracionEfectos.radioBorde,
                  padding: esMovil ? '7px' : '10px',
                  transition: configuracionEfectos.transicionSuave,
                  '&:hover': {
                    color: paleta.textoPrincipal,
                    backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Icono sx={{ fontSize: esMovil ? 22 : 24 }} />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Alternador de Modo Claro / Oscuro */}
      <Box sx={{ mt: esMovil ? 0 : 'auto', mb: esMovil ? 0 : 0.5 }}>
        <Tooltip
          title={themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          arrow
          placement={esMovil ? 'top' : 'right'}
        >
          <IconButton
            onClick={toggleTheme}
            aria-label="Alternar tema"
            sx={{
              color: paleta.textoSecundario,
              borderRadius: configuracionEfectos.radioBorde,
              padding: esMovil ? '7px' : '10px',
              transition: configuracionEfectos.transicionSuave,
              '&:hover': {
                color: paleta.textoPrincipal,
                backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {themeMode === 'dark' ? (
              <LightModeIcon sx={{ fontSize: esMovil ? 20 : 22 }} />
            ) : (
              <DarkModeIcon sx={{ fontSize: esMovil ? 20 : 22 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default Sidebar;