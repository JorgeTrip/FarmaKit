/**
 * @fileoverview Componente para consultar precios de medicamentos desde Alfabeta
 * Integración responsiva Grises Pro con bordes suaves.
 * @author J.O.T.
 */
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * Componente que muestra la página de precios de medicamentos de Alfabeta
 * @returns {JSX.Element} Componente con iframe para precios de medicamentos
 */
function MedicationPrices() {
  return (
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          letterSpacing: '-0.02em',
          textAlign: 'center', 
          mb: 3 
        }}
      >
        Precios de Medicamentos
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: 4, 
          borderRadius: '16px',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{
            width: '100%',
            height: '78vh',
            minHeight: '500px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#242426' : '#ffffff',
            '& iframe': {
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block'
            },
          }}
        >
          <iframe 
            src="https://alfabeta.net/precio/" 
            title="Precios de Medicamentos - Alfabeta"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default MedicationPrices;