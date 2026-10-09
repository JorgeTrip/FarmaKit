/**
 * @fileoverview Componente principal FarmaKit con arquitectura modular,
 * paleta Grises Pro, navegación fluida Apple-Style y límite menor a 200 líneas.
 * @author J.O.T.
 */
import React, { useState, useMemo } from 'react';
import { Box, CssBaseline, ThemeProvider, Container } from '@mui/material';
import { crearTemaFarmaKit } from './temaFarmaKit';
import { BarraSuperior } from './components/BarraSuperior';
import { VistaInicioPrecios } from './components/VistaInicioPrecios';
import Sidebar from './components/Sidebar';
import FileProcessor from './components/FileProcessor';
import CashAssistant from './components/CashAssistant';
import ClosureChecklist from './components/ClosureChecklist';
import DosageCalculator from './components/DosageCalculator';
import MedicationPrices from './components/MedicationPrices';
import ArgentinaVademecum from './components/ArgentinaVademecum';
import PriceUpdater from './components/PriceUpdater';
import PriceSearch from './components/PriceSearch';

function App() {
  const [componenteSeleccionado, setComponenteSeleccionado] = useState('home');
  const [modoTema, setModoTema] = useState('dark');

  const tema = useMemo(() => crearTemaFarmaKit(modoTema), [modoTema]);

  const alternarTema = () => {
    setModoTema((anterior) => (anterior === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <BarraSuperior />

        <Box sx={{ display: 'flex', flexGrow: 1, pt: '64px' }}>
          <Sidebar
            onSelect={setComponenteSeleccionado}
            toggleTheme={alternarTema}
            themeMode={modoTema}
            selectedComponent={componenteSeleccionado}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: '100%',
              minHeight: 'calc(100vh - 64px)',
              pl: { xs: 0, sm: '88px' },
              pr: { xs: 0, sm: 2 },
              pb: { xs: '84px', sm: 4 },
              pt: { xs: 2, sm: 4 },
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Container
              maxWidth="lg"
              sx={{
                width: '100%',
                px: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {componenteSeleccionado === 'home' && (
                <VistaInicioPrecios alSeleccionar={setComponenteSeleccionado} />
              )}
              {componenteSeleccionado === 'fileProcessor' && <FileProcessor />}
              {componenteSeleccionado === 'priceSearch' && <PriceSearch />}
              {componenteSeleccionado === 'priceUpdater' && <PriceUpdater />}
              {componenteSeleccionado === 'cashAssistant' && <CashAssistant />}
              {componenteSeleccionado === 'checklist' && <ClosureChecklist />}
              {componenteSeleccionado === 'dosageCalculator' && <DosageCalculator />}
              {componenteSeleccionado === 'medicationPrices' && <MedicationPrices />}
              {componenteSeleccionado === 'argentinaVademecum' && <ArgentinaVademecum />}
            </Container>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
