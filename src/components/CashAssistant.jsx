import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

/**
 * @fileoverview Componente para asistir en el arqueo de caja de una farmacia
 * @author J.O.T.
 * @version 1.0.0
 */

/**
 * @description Componente principal que gestiona el arqueo de caja
 * @returns {JSX.Element} Componente de asistente de arqueo de caja
 */
function CashAssistant() {
  // Estados para gestionar los montos y cálculos
  /** @type {[string[], Function]} Estado para almacenar la lista de montos ingresados */
  const [amounts, setAmounts] = useState([]);
  /** @type {[string, Function]} Estado para el monto que se está ingresando actualmente */
  const [currentAmount, setCurrentAmount] = useState('');
  /** @type {[string, Function]} Estado para el valor formateado del monto actual */
  const [formattedAmount, setFormattedAmount] = useState('');
  /** @type {[string, Function]} Estado para el fondo de caja */
  const [cashFund, setCashFund] = useState('');
  /** @type {[string, Function]} Estado para el valor formateado del fondo de caja */
  const [formattedCashFund, setFormattedCashFund] = useState('');
  /** @type {[boolean, Function]} Estado para controlar si se incluye el fondo de caja en los cálculos */
  const [includeCashFund, setIncludeCashFund] = useState(false);
  /** @type {[number, Function]} Estado para el total reportado por el sistema */
  const [systemTotal, setSystemTotal] = useState(0);
  /** @type {[string, Function]} Estado para el valor formateado del total del sistema */
  const [formattedSystemTotal, setFormattedSystemTotal] = useState('');
  /** @type {[number, Function]} Estado para la diferencia entre el total físico y el del sistema */
  const [discrepancy, setDiscrepancy] = useState(0);

  /**
   * @description Formatea un valor numérico a formato de moneda argentina
   * @param {number} value - El valor a formatear
   * @returns {string} El valor formateado como moneda argentina con punto como separador de miles y coma para decimales
   */
  const formatARS = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    
    // Usar Intl.NumberFormat para formatear con puntos y comas
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    return formatted;
  };

  /**
   * @description Convierte un valor formateado a número
   * @param {string} formattedValue - El valor formateado
   * @returns {number} El valor numérico
   */
  const parseFormattedValue = (formattedValue) => {
    if (!formattedValue) return 0;
    // Eliminar todos los puntos y reemplazar la coma por punto decimal
    const numericString = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
  };

  /**
   * @description Maneja el cambio en un campo numérico con formato
   * @param {string} value - El valor ingresado
   * @param {Function} setRawValue - Función para establecer el valor crudo
   * @param {Function} setFormattedValue - Función para establecer el valor formateado
   * @param {string} prevValue - El valor anterior formateado (opcional)
   */
  const handleFormattedChange = (value, setRawValue, setFormattedValue, prevValue = '') => {
    // Si es un valor vacío, reiniciar ambos estados
    if (value === '') {
      setRawValue('');
      setFormattedValue('');
      return;
    }
    
    // Detectar si se acaba de agregar un punto (probablemente desde el teclado numérico)
    const justAddedDot = value.endsWith('.') && !prevValue.endsWith(',');
    
    // Conservar los puntos de miles existentes y solo convertir el último punto a coma si se acaba de agregar
    let processedValue;
    if (justAddedDot) {
      // Si se acaba de agregar un punto al final, convertirlo en coma
      processedValue = value.slice(0, -1) + ',';
    } else {
      // De lo contrario, mantener el valor tal como está
      processedValue = value;
    }
    
    // Eliminar cualquier caracter que no sea dígito, punto o coma
    const cleanValue = processedValue.replace(/[^0-9.,]/g, '');
    
    // Verificar si ya existe una coma decimal
    const hasDecimal = cleanValue.includes(',');
    
    // Separar la parte entera y decimal (si existe)
    let [integerPart, decimalPart] = cleanValue.split(',');
    
    // Eliminar cualquier punto existente en la parte entera para reformatearla
    integerPart = integerPart ? integerPart.replace(/\./g, '') : '';
    
    // Formatear la parte entera con puntos cada 3 dígitos
    let formattedInteger = '';
    for (let i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedInteger += '.';
      }
      formattedInteger += integerPart[i];
    }
    
    // Reconstruir el valor con la parte decimal si existe
    let displayValue = formattedInteger;
    if (decimalPart !== undefined) {
      displayValue += ',' + decimalPart;
    }
    
    // Para cálculos internos, convertir a formato numérico estándar
    let numericValue = integerPart;
    if (decimalPart !== undefined) {
      numericValue += '.' + decimalPart;
    }
    
    // Guardar ambos valores: el numérico para cálculos y el formateado para mostrar
    const parsedValue = parseFloat(numericValue);
    
    if (!isNaN(parsedValue)) {
      setRawValue(parsedValue.toString());
      setFormattedValue(displayValue);
    } else if (displayValue === '' || displayValue === ',') {
      // Si solo hay una coma o está vacío
      setRawValue('');
      setFormattedValue(displayValue);
    }
  };

  /**
   * @description Efecto que actualiza la discrepancia cuando cambian los valores relevantes
   */
  useEffect(() => {
    setDiscrepancy(calculatePhysicalTotal() - systemTotal);
  }, [amounts, cashFund, includeCashFund, systemTotal]);

  /**
   * @description Calcula el total físico basado en los montos ingresados y el fondo de caja
   * @returns {number} El total físico calculado
   */
  const calculatePhysicalTotal = () => {
    const total = amounts.reduce((sum, amount) => sum + Number(amount), 0);
    return includeCashFund ? total - (Number(cashFund) || 0) : total;
  };

  /**
   * @description Maneja la adición de un nuevo monto a la lista
   * @param {React.KeyboardEvent} e - Evento de teclado
   */
  const handleAddAmount = (e) => {
    if (e.key === 'Enter' && currentAmount) {
      const amount = parseFloat(currentAmount);
      if (!isNaN(amount) && amount > 0) {
        // Almacenar el valor con 2 decimales fijos
        setAmounts(prev => [...prev, amount.toFixed(2)]);
        // Limpiar los campos de entrada
        setCurrentAmount('');
        setFormattedAmount('');
      }
    }
  };

  /**
   * @description Limpia todos los campos y reinicia el estado del componente
   */
  const handleClearAll = () => {
    setAmounts([]);
    setCurrentAmount('');
    setFormattedAmount('');
    setCashFund('');
    setFormattedCashFund('');
    setSystemTotal(0);
    setFormattedSystemTotal('');
    setIncludeCashFund(false);
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#90caf9', fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
        Asistente de Arqueo de Caja
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#f48fb1', fontStyle: 'italic', letterSpacing: '0.1em', textAlign: 'center', mb: 4 }}>
      
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Recuento Físico
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
            Instrucciones: Ingrese cada monto individual y presione Enter para confirmar.
            <br/>
            Ejemplo: Para ingresar $1.500,75 → Escriba "1500.75" y presione Enter
          </Typography>

          <TextField
            fullWidth
            label="Ingresar monto (Presione Enter)"
            value={formattedAmount}
            onChange={(e) => handleFormattedChange(e.target.value, setCurrentAmount, setFormattedAmount, formattedAmount)}
            onKeyPress={handleAddAmount}
            InputProps={{
              inputProps: { inputMode: 'decimal' },
              startAdornment: formattedAmount ? '$' : null
            }}
            sx={{ mb: 3 }}
          />

          <List dense sx={{ border: '1px solid #555', borderRadius: 1, minHeight: '60px', maxHeight: 'none', overflow: 'visible' }}>
            {amounts.map((amount, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={`${index + 1}. $${formatARS(amount)}`}
                  sx={{ '& .MuiListItemText-primary': { fontFamily: 'monospace' } }}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeCashFund}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setIncludeCashFund(isChecked);
                    setCashFund(isChecked ? '' : '0');
                  }}
                />
              }
              label="Incluir fondo de caja"
            />
            
            <Button variant="outlined" color="error" onClick={handleClearAll}>
              Borrar Todo
            </Button>
          </Box>

          {includeCashFund && (
            <TextField
              fullWidth
              label="Fondo de caja"
              value={formattedCashFund}
              onChange={(e) => handleFormattedChange(e.target.value, setCashFund, setFormattedCashFund, formattedCashFund)}
              InputProps={{
                inputProps: { inputMode: 'decimal' },
                startAdornment: formattedCashFund ? '$' : null
              }}
              sx={{ mt: 2 }}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Totales
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Concepto</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Total ingresado</TableCell>
                  <TableCell align="right">${formatARS(amounts.reduce((sum, amount) => sum + Number(amount), 0))}</TableCell>
                </TableRow>
                {includeCashFund && (
                  <TableRow>
                    <TableCell>Fondo de caja (-)</TableCell>
                    <TableCell align="right">${formatARS(cashFund)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>Total físico</TableCell>
                  <TableCell align="right">${formatARS(calculatePhysicalTotal())}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ width: '200px' }}>
                    <TextField
                      fullWidth
                      label="Total sistema"
                      value={formattedSystemTotal}
                      onChange={(e) => handleFormattedChange(e.target.value, setSystemTotal, setFormattedSystemTotal, formattedSystemTotal)}
                      onFocus={(e) => systemTotal === 0 && setFormattedSystemTotal('')}
                      InputProps={{
                        inputProps: { inputMode: 'decimal' },
                        startAdornment: formattedSystemTotal ? '$' : null
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ width: '150px' }}>${formattedSystemTotal || (systemTotal ? formatARS(systemTotal) : '')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Diferencia</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: discrepancy === 0 ? 'inherit' : discrepancy > 0 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}
                  >
                    ${formatARS(discrepancy)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CashAssistant;