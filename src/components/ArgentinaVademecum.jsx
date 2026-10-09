/**
 * @fileoverview Componente para consultar el Vademecum de Argentina desde Alfabeta.
 * Permite desplazamiento vertical completo de la web externa mientras adapta
 * el ancho al 100% sin scroll horizontal.
 * @author J.O.T.
 */
import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ANCHO_OBJETIVO = 800; // Ancho natural de la web de Alfabeta (780px + márgenes)

function ArgentinaVademecum() {
  const contenedorRef = useRef(null);
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const ajustarEscala = () => {
      if (contenedorRef.current) {
        const anchoDisponible = contenedorRef.current.clientWidth;
        // Solo escala si la pantalla es más angosta que 800px para que quepa en ancho
        const nuevaEscala = Math.min(1, anchoDisponible / ANCHO_OBJETIVO);
        setEscala(nuevaEscala);
      }
    };

    ajustarEscala();
    window.addEventListener('resize', ajustarEscala);
    return () => window.removeEventListener('resize', ajustarEscala);
  }, []);

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
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
        Vademecum de Argentina
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: 4, 
          borderRadius: '16px',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#242426' : '#ffffff',
        }}
      >
        {/* Contenedor con scroll vertical habilitado y scroll horizontal bloqueado */}
        <Box 
          ref={contenedorRef}
          sx={{
            width: '100%',
            height: '82vh',
            minHeight: '600px',
            borderRadius: '12px',
            overflowX: 'hidden',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <iframe 
            src="https://alfabeta.net/medicamento/index-ar.jsp" 
            title="Vademecum de Argentina - Alfabeta"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            style={{
              border: 'none',
              width: escala < 1 ? `${ANCHO_OBJETIVO}px` : '100%',
              minHeight: '1800px', // Altura suficiente para navegar y hacer scroll vertical
              height: '100%',
              transform: escala < 1 ? `scale(${escala})` : 'none',
              transformOrigin: 'top center',
              display: 'block',
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ArgentinaVademecum;