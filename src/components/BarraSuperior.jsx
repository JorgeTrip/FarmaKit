/**
 * @fileoverview Barra de navegación superior con efecto translúcido Apple (Glassmorphism).
 * Mantiene el contenido perfectamente alineado con el contenedor central de 1200px.
 * @author J.O.T.
 */
import React from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';
import { configuracionEfectos } from '../configuracionEstetica';

export function BarraSuperior() {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 2,
        width: '100%',
        backgroundColor: (theme) => theme.palette.background.barra,
        backdropFilter: configuracionEfectos.desenfoqueBarra,
        WebkitBackdropFilter: configuracionEfectos.desenfoqueBarra,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3 }, boxSizing: 'border-box' }}>
        <Toolbar disableGutters sx={{ height: '64px', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'primary.main',
                  lineHeight: 1,
                }}
              >
                FarmaKit
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  display: { xs: 'none', sm: 'inline-block' },
                }}
              >
                Herramientas de farmacia
              </Typography>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              by J.O.T.
            </Typography>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
}
