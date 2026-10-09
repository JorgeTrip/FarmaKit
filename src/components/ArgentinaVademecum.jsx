/**
 * @fileoverview Componente para consultar el Vademecum de Argentina desde Alfabeta.
 * En móviles y escritorio, aprovecha el 100% del ancho del marco sin márgenes ociosos
 * y adapta el zoom proporcionalmente para evitar scroll horizontal mientras permite
 * deslizamiento vertical completo.
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
        // Si el ancho disponible es menor que 800px, escala para que ocupe exactamente el 100%
        const nuevaEscala = Math.min(1, anchoDisponible / ANCHO_OBJETIVO);
        setEscala(nuevaEscala);
      }
    };

    ajustarEscala();
    // Ajustar también cuando se estabilicen fuentes/dimensiones
    const timer = setTimeout(ajustarEscala, 150);
    window.addEventListener('resize', ajustarEscala);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', ajustarEscala);
    };
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
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.5rem', sm: '2.125rem' }
        }}
      >
        Vademecum de Argentina
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, // 0 padding en móvil y desktop para aprovechar el 100% del ancho
          mb: 4, 
          borderRadius: { xs: '12px', sm: '16px' },
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#242426' : '#ffffff',
        }}
      >
        {/* Contenedor con scroll vertical y 100% de ancho útil */}
        <Box 
          ref={contenedorRef}
          sx={{
            width: '100%',
            height: '82vh',
            minHeight: '600px',
            overflowX: 'hidden',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
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
              minHeight: '2200px', // Altura completa para permitir scroll vertical
              height: '100%',
              transform: escala < 1 ? `scale(${escala})` : 'none',
              transformOrigin: 'top left', // Anclado a la izquierda para ocupar todo el ancho
              display: 'block',
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ArgentinaVademecum;