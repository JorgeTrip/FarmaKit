/**
 * @fileoverview Componente principal FarmaKit con layout centralizado y enmarcado
 * en escritorio dentro de un contenedor de 1200px (Header, Sidebar y Contenido alineados).
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
          width: '100%',
          backgroundColor: 'background.default',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <BarraSuperior />

        {/* Marco centralizado unificado en escritorio: exactamente 1200px centrados */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto',
            display: 'flex',
            flexGrow: 1,
            pt: '80px',
            pb: { xs: '84px', sm: 4 },
            px: { xs: 2, sm: 3 },
            boxSizing: 'border-box',
            gap: { xs: 0, sm: 3 },
          }}
        >
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
              minWidth: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
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
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
