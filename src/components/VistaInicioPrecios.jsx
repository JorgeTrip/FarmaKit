/**
 * @fileoverview Vista de inicio de FarmaKit para selección de herramientas de precios.
 * Componente modular con diseño Apple-Style, tarjetas interactivas y Grises Pro.
 * @author J.O.T.
 */
import React from 'react';
import { Box, Typography, Card, CardActionArea, CardContent, Grid } from '@mui/material';
import {
  Search as SearchIcon,
  Update as UpdateIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';

const OPCIONES_PRECIOS = [
  {
    id: 'priceSearch',
    titulo: 'Buscar Precios',
    descripcion: 'Consulta rápida de precios de productos en tu planilla de referencia cargada.',
    icono: SearchIcon,
  },
  {
    id: 'priceUpdater',
    titulo: 'Actualización de Precios',
    descripcion: 'Actualiza y compara precios incorporando ofertas y planillas de proveedores.',
    icono: UpdateIcon,
  },
  {
    id: 'fileProcessor',
    titulo: 'Agregar Muebles a Planillas',
    descripcion: 'Asigna automáticamente ubicaciones de muebles a productos en listas de precios.',
    icono: TableChartIcon,
  },
];

export function VistaInicioPrecios({ alSeleccionar }) {
  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', mx: 'auto', py: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 1,
          }}
        >
          Herramientas para Listas de Precios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selecciona una acción para comenzar a procesar tus archivos de farmacia
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {OPCIONES_PRECIOS.map(({ id, titulo, descripcion, icono: Icono }) => (
          <Grid item xs={12} sm={4} key={id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => alSeleccionar(id)}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.12)' : 'rgba(0, 113, 227, 0.08)',
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  <Icono sx={{ fontSize: 32 }} />
                </Box>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    {titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {descripcion}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
