import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  Paper,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  AppBar,
  Card,
  CardContent,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { saveAs } from 'file-saver';
import React, { useRef, useState, Fragment } from 'react';
import { 
  Upload as UploadIcon, 
  Description as DescriptionIcon, 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';

/**
 * @fileoverview Componente para gestionar el checklist de cierre de caja de una farmacia
 * @author J.O.T.
 * @version 2.0.0
 */

/**
 * @description Lista de conceptos predefinidos para el checklist de cierre
 * @type {string[]}
 */
const predefinedItems = [
  'Deposito 1',
  'Deposito 2',
  'Deposito 3',
  'Deposito 4',
  'Depo Final',
  'Retiro',
  'Ajuste',
  'Gastos',
  'Notas de crédito',
  'Facturas manuales',
  'Extra Cash Posnet (Visa Electron + MasterCard)',
  'Extra Cash Mercado Pago',
  'Ventas Online',
  'Tarjetas',
  'Mercado Pago',
  'Pedidos Ya',
  'Rappi'
];

/**
 * @description Mapeo de conceptos de Sinergie a los nombres de la planilla
 * @type {Object.<string, string>}
 */
const sinergieToPlanillaMap = {
  'EFECTIVO': 'Efectivo',
  'TARJETAS': 'Tarjetas',
  'MERCADOPAGO': 'Mercado Pago',
  'PEDIDOSYA': 'Pedidos Ya',
  'RAPPI': 'Rappi',
  'TRANSFERENCIA': 'Transferencia',
  'CHEQUE': 'Cheque',
  'OTROS': 'Otros'
};

/**
 * @description Mapeo de turnos
 * @type {Object.<string, string>}
 */
const turnosMap = {
  'TURNO 1': 'Turno Mañana',
  'TURNO 2': 'Turno Tarde',
  'TURNO 3': 'Turno Noche'
};

/**
 * Componente para sumar múltiples importes
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Componente de diálogo
 */
const MultipleAmountDialog = ({ open, onClose, title, amounts, setAmounts, onSave, anchorEl }) => {
  // Estado local para gestionar los campos de entrada
  const [newAmount, setNewAmount] = useState('');
  const [formattedNewAmount, setFormattedNewAmount] = useState('');
  const inputRef = useRef(null);

  // Calcular el total de los importes
  const total = amounts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const formattedTotal = formatARS(Math.abs(total)).replace('$', '');
  
  // Función para agregar un nuevo importe a la lista
  const handleAddAmount = () => {
    if (newAmount) {
      // Agregar el nuevo importe a la lista
      setAmounts([...amounts, { 
        amount: newAmount, 
        formattedAmount: formattedNewAmount 
      }]);
      
      // Limpiar el campo después de agregar
      setNewAmount('');
      setFormattedNewAmount('');
    }
  };
  
  // Función para eliminar un importe de la lista
  const handleRemoveAmount = (index) => {
    const newAmounts = [...amounts];
    newAmounts.splice(index, 1);
    setAmounts(newAmounts);
  };
  
  // Manejar cambios en el campo de nuevo importe
  const handleNewAmountChange = (e) => {
    const value = e.target.value;
    
    if (value === '') {
      setNewAmount('');
      setFormattedNewAmount('');
      return;
    }
    
    const regex = /^[0-9,.]*$/;
    if (!regex.test(value)) return;
    
    const justAddedDot = value.endsWith('.') && !formattedNewAmount?.endsWith(',');
    
    let processedValue;
    if (justAddedDot) {
      processedValue = value.slice(0, -1) + ',';
    } else {
      processedValue = value;
    }
    
    const cleanValue = processedValue.replace(/[^0-9,.]/g, '');
    
    const hasDecimal = cleanValue.includes(',');
    
    let [integerPart, decimalPart] = cleanValue.split(',');
    integerPart = integerPart.replace(/\./g, '');
    
    // Formatear la parte entera con puntos para miles
    let formattedInteger = '';
    for (let i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedInteger += '.';
      }
      formattedInteger += integerPart[i];
    }
    
    // Crear el valor formateado final
    let formattedValue;
    if (hasDecimal) {
      formattedValue = formattedInteger + ',' + (decimalPart || '');
    } else {
      formattedValue = formattedInteger;
    }
    
    // Convertir a valor numérico
    let numericValue = parseFloat(integerPart + '.' + (decimalPart || '0'));
    
    setNewAmount(numericValue.toString());
    setFormattedNewAmount(formattedValue);
  };
  
  // Guardar los cambios y cerrar el diálogo
  const handleSave = () => {
    onSave(total, formattedTotal);
    onClose();
  };
  
  // Posición fija para el diálogo
  const dialogPosition = anchorEl ? {
    left: anchorEl.getBoundingClientRect().left + (anchorEl.offsetWidth / 2) - 175,
    top: anchorEl.getBoundingClientRect().top - 220 // Más cerca del botón
  } : { left: 'auto', top: 'auto' };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth={false}
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: 500 // 0.5 segundo para el efecto fade
      }}
      PaperProps={{
        sx: {
          width: '350px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
          position: 'absolute',
          left: dialogPosition.left,
          top: dialogPosition.top
        }
      }}
      BackdropProps={{
        style: { backgroundColor: 'transparent' }
      }}
      hideBackdrop={false}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Agregar importes individuales:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Importe"
              value={newAmount ? `$${formattedNewAmount}` : ''}
              onChange={(e) => {
                let value = e.target.value;
                if (value.startsWith('$')) value = value.substring(1);
                handleNewAmountChange({ target: { value } });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newAmount) {
                    // Si hay un valor, agregar a la lista
                    handleAddAmount();
                  } else {
                    // Si el campo está vacío, aplicar el total
                    handleSave();
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-input': {
                  textAlign: 'right'
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddAmount}
              disabled={!newAmount}
              startIcon={<AddIcon />}
            >
              Agregar
            </Button>
          </Box>
        </Box>
        
        {amounts.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Importes agregados:
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
              {amounts.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography>
                    ${item.formattedAmount}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => handleRemoveAmount(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ${formattedTotal}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" startIcon={<CalculateIcon />}>
          Aplicar Total
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Componente principal que gestiona el checklist de cierre
 * @returns {JSX.Element} Componente de checklist de cierre
 */
function ClosureChecklist() {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState(0);
  
  /** @type {[{name: string, amount: string, formattedAmount: string}[], Function]} Estado para almacenar los items del checklist */
  const [items, setItems] = useState(
    predefinedItems.map(name => ({ name, amount: '', formattedAmount: '' }))
  );
  
  /** @type {[{name: string, amount: string, formattedAmount: string}, Function]} Estado para el nuevo item que se está ingresando */
  const [newItem, setNewItem] = useState({ name: '', amount: '', formattedAmount: '' });
  
  /** @type {[boolean, Function]} Estado para controlar si el ajuste es egreso (true) o ingreso (false) */
  const [isAjusteEgreso, setIsAjusteEgreso] = useState(false);
  
  /** @type {React.MutableRefObject<HTMLInputElement[]>} Referencias a los campos de entrada para navegación con teclado */
  const inputRefs = useRef([]);
  
  /** @type {React.MutableRefObject<HTMLInputElement>} Referencia al input de carga de archivo */
  const fileInputRef = useRef(null);
  
  // Estado para el diálogo de múltiples importes
  const [multipleAmountDialogOpen, setMultipleAmountDialogOpen] = useState(false);
  const [currentMultipleAmountField, setCurrentMultipleAmountField] = useState('');
  const [multipleAmountAnchorEl, setMultipleAmountAnchorEl] = useState(null);
  const [tempAmounts, setTempAmounts] = useState([]);
  
  // Función para abrir el diálogo de múltiples importes
  const handleOpenMultipleAmountDialog = (fieldName, event) => {
    // Capturar el elemento actual antes de cualquier cambio de estado
    const currentTarget = event.currentTarget;
    
    // Obtener el índice del campo en el array de items
    const fieldIndex = items.findIndex(item => item.name === fieldName);
    
    // Si el campo ya tiene un valor, inicializar con ese valor
    if (fieldIndex !== -1 && items[fieldIndex].amount) {
      setTempAmounts([{
        amount: items[fieldIndex].amount,
        formattedAmount: items[fieldIndex].formattedAmount || formatARS(Math.abs(parseFloat(items[fieldIndex].amount))).replace('$', '')
      }]);
    } else {
      setTempAmounts([]);
    }
    
    // Primero establecer el campo y los valores, luego abrir el diálogo
    setCurrentMultipleAmountField(fieldName);
    
    // Importante: establecer el anchorEl antes de abrir el diálogo
    setMultipleAmountAnchorEl(currentTarget);
    
    // Usar un pequeño timeout para garantizar que el anchorEl esté establecido
    setTimeout(() => {
      setMultipleAmountDialogOpen(true);
    }, 10);
  };
  
  // Función para guardar el total de múltiples importes
  /**
   * Guarda el total de múltiples importes en el campo correspondiente
   * @param {number} total - Valor numérico total
   * @param {string} formattedTotal - Valor formateado para mostrar
   */
  const handleSaveMultipleAmounts = (total, formattedTotal) => {
    // Encontrar el índice del campo que estamos modificando
    const itemIndex = items.findIndex(item => item.name === currentMultipleAmountField);
    
    if (itemIndex !== -1) {
      // Crear una copia del array para mantener la inmutabilidad
      const newItems = [...items];
      
      // Actualizar el valor del campo específico
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        amount: total.toString(),
        formattedAmount: formattedTotal
      };
      
      // Actualizar el estado con el nuevo array
      setItems(newItems);
      
      console.log(`Aplicado total ${total} al campo ${currentMultipleAmountField}`);
    } else {
      console.warn(`No se encontró el campo '${currentMultipleAmountField}' para aplicar el total ${total}`);
    }
    
    // Cerrar el diálogo después de aplicar
    setMultipleAmountDialogOpen(false);
  };
  
  /**
   * @description Determina el turno según la hora actual
   * @returns {string} El turno correspondiente (Mañana, Tarde o Noche)
   */
  const detectarTurno = () => {
    const horaActual = new Date().getHours();
    
    if (horaActual >= 8 && horaActual < 15) {
      return 'Turno Mañana';
    } else if (horaActual >= 15 && horaActual < 22) {
      return 'Turno Tarde';
    } else {
      return 'Turno Noche';
    }
  };

  // Estado para los datos de Sinergie
  const [sinergieData, setSinergieData] = useState({
    turno: detectarTurno(),
    fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para input date
    hora: new Date().toTimeString().substring(0, 5), // Formato HH:MM
    cajero: ''
  });

  // Utilizamos la función formatARS definida al final del archivo
  
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
   * @description Maneja el cambio en campos con formato de moneda
   * @param {React.ChangeEvent} e - Evento de cambio
   * @param {number} index - Índice del ítem que se está editando
   */
  const handleFormattedChange = (e, index) => {
    const value = e.target.value;
    const prevItem = items[index];
    
    // Si el valor está vacío, reiniciar ambos estados
    if (value === '') {
      const newItems = [...items];
      newItems[index] = { ...prevItem, amount: '', formattedAmount: '' };
      setItems(newItems);
      return;
    }
    
    // Validar que solo contenga dígitos, puntos o comas
    const regex = /^[0-9,.]*$/;
    if (!regex.test(value)) return;
    
    // Detectar si se acaba de agregar un punto (probablemente desde el teclado numérico)
    const justAddedDot = value.endsWith('.') && !prevItem.formattedAmount?.endsWith(',');
    
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
    const cleanValue = processedValue.replace(/[^0-9,.]/g, '');
    
    // Verificar si ya existe una coma decimal
    const hasDecimal = cleanValue.includes(',');
    
    // Separar la parte entera y decimal (si existe)
    let [integerPart, decimalPart] = cleanValue.split(',');
    
    // Eliminar cualquier punto existente en la parte entera para reformatearla
    integerPart = integerPart ? integerPart.replace(/\./g, '') : '';
    
    // Limitar la parte decimal a 2 dígitos
    if (decimalPart !== undefined) {
      decimalPart = decimalPart.substring(0, 2);
    }
    
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
    
    // Convertir a número para asegurar que sea un formato válido
    let parsedValue = parseFloat(numericValue);
    
    // Si es el campo Ajuste y está marcado como egreso, hacer el valor negativo
    if (prevItem.name === 'Ajuste' && isAjusteEgreso && parsedValue > 0) {
      parsedValue = -parsedValue;
    } else if (prevItem.name === 'Ajuste' && !isAjusteEgreso && parsedValue < 0) {
      parsedValue = Math.abs(parsedValue);
    }
    
    // Actualizar el estado con el nuevo valor
    const newItems = [...items];
    newItems[index] = { 
      ...prevItem, 
      amount: !isNaN(parsedValue) ? parsedValue.toString() : '',
      formattedAmount: displayValue
    };
    setItems(newItems);
  };

  /**
   * @description Maneja el cambio en un campo numérico con formato para el nuevo item
   * @param {string} value - El valor ingresado
   * @param {string} prevValue - El valor anterior formateado (opcional)
   */
  const handleNewItemFormattedChange = (value, prevValue = '') => {
    // Si es un valor vacío, reiniciar ambos estados
    if (value === '') {
      setNewItem(prev => ({ ...prev, amount: '', formattedAmount: '' }));
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
      setNewItem(prev => ({ ...prev, amount: parsedValue.toString(), formattedAmount: displayValue }));
    } else if (displayValue === '' || displayValue === ',') {
      // Si solo hay una coma o está vacío
      setNewItem(prev => ({ ...prev, amount: '', formattedAmount: displayValue }));
    }
  };

  /**
   * @description Maneja los eventos de teclado en los campos de nuevo ítem
   * @param {React.KeyboardEvent} e - Evento de teclado
   */
  const handleNewItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newItem.name && newItem.amount) {
        handleAddItem();
      }
    }
  };

  /**
   * @description Maneja la adición de un nuevo item personalizado al checklist
   */
  const handleAddItem = () => {
    if (newItem.name && newItem.amount) {
      setItems(prev => [...prev, {
        name: newItem.name,
        amount: newItem.amount,
        formattedAmount: formatARS(parseFloat(newItem.amount))
      }]);
      setNewItem({ name: '', amount: '', formattedAmount: '' });
    }
  };

  /**
   * @description Maneja el cambio en el monto del nuevo ítem
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio
   */
  const handleNewItemAmountChange = (e) => {
    handleNewItemFormattedChange(e.target.value, newItem.formattedAmount);
  };

  /**
   * @description Maneja la adición de un nuevo item personalizado al checklist
   * @param {React.KeyboardEvent} e - Evento de teclado
   * @deprecated Usar handleNewItemKeyDown en su lugar
   */
  const handleAddCustom = (e) => {
    if (e.key === 'Enter' && newItem.name && newItem.amount) {
      setItems(prev => [...prev, {
        name: newItem.name,
        amount: parseFloat(newItem.amount).toFixed(2),
        formattedAmount: formatARS(parseFloat(newItem.amount))
      }]);
      setNewItem({ name: '', amount: '', formattedAmount: '' });
    }
  };

  /**
   * @description Actualiza el monto de un item específico en el checklist
   * @param {number} index - Índice del item a actualizar
   * @param {string} value - Nuevo valor para el monto
   */
  const updateItemAmount = (index, value) => {
    handleFormattedChange(value, index, items[index].formattedAmount);
  };

  const handleKeyDown = (event, currentRealIndex, allItems, inputRefs) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      let nextFocusableRealIndex = -1;
      // Start searching from the item *after* the current one in the global 'allItems' list
      for (let i = currentRealIndex + 1; i < allItems.length; i++) {
          // Check if the item at this 'realIndex' (i) has an input ref, 
          // meaning it's rendered and should be focusable.
          if (inputRefs.current[i]) {
              nextFocusableRealIndex = i;
              break;
          }
      }

      if (nextFocusableRealIndex !== -1) {
        const nextInput = inputRefs.current[nextFocusableRealIndex];
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  /**
   * @description Calcula el total de todos los montos ingresados
   * @type {number}
   */
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  /**
   * @description Calcula el total de efectivo y depósitos
   * @returns {number} Total de efectivo
   */
  const calcularTotalEfectivo = () => {
    return items
      .filter(item => [
        'Deposito 1', 'Deposito 2', 'Deposito 3', 'Deposito 4', 'Depo Final',
        'Extra Cash Mercado Pago', 'Extra Cash Posnet (Visa Electron + MasterCard)', 
        'Retiro', 'Ajuste', 'Gastos'
      ].includes(item.name))
      .reduce((acc, item) => {
        if (item.amount) {
          return acc + parseFloat(item.amount);
        }
        return acc;
      }, 0);
  };
  
  /**
   * @description Calcula el total de pagos electrónicos
   * @returns {number} Total de pagos electrónicos
   */
  const calcularTotalElectronico = () => {
    const mercadoPagoItem = items.find(i => i.name === 'Mercado Pago');
    const extraCashMPItem = items.find(i => i.name === 'Extra Cash Mercado Pago');
    const rappiItem = items.find(i => i.name === 'Rappi');
    const pedidosYaItem = items.find(i => i.name === 'Pedidos Ya');
    const tarjetasItem = items.find(i => i.name === 'Tarjetas');
    const extraCashPosnetItem = items.find(i => i.name === 'Extra Cash Posnet (Visa Electron + MasterCard)');

    const mercadoPagoAmount = parseFloat(mercadoPagoItem?.amount || "0");
    const extraCashMPAmount = parseFloat(extraCashMPItem?.amount || "0");
    const rappiAmount = parseFloat(rappiItem?.amount || "0");
    const pedidosYaAmount = parseFloat(pedidosYaItem?.amount || "0");
    const tarjetasAmount = parseFloat(tarjetasItem?.amount || "0");
    const extraCashPosnetAmount = parseFloat(extraCashPosnetItem?.amount || "0");

    const adjustedMercadoPagoAmount = mercadoPagoAmount - extraCashMPAmount;
    const adjustedTarjetasAmount = tarjetasAmount - extraCashPosnetAmount;

    return adjustedMercadoPagoAmount + rappiAmount + pedidosYaAmount + adjustedTarjetasAmount;
  };
  
  /**
   * @description Calcula el total de ventas online
   * @returns {number} Total de ventas online
   */
  const calcularTotalVentasOnline = () => {
    const mercadoPagoItem = items.find(i => i.name === 'Mercado Pago');
    const extraCashMPItem = items.find(i => i.name === 'Extra Cash Mercado Pago');
    const pedidosYaItem = items.find(i => i.name === 'Pedidos Ya');
    const rappiItem = items.find(i => i.name === 'Rappi');

    const mercadoPagoAmount = parseFloat(mercadoPagoItem?.amount || "0");
    const extraCashMPAmount = parseFloat(extraCashMPItem?.amount || "0");
    const pedidosYaAmount = parseFloat(pedidosYaItem?.amount || "0");
    const rappiAmount = parseFloat(rappiItem?.amount || "0");

    const adjustedMercadoPagoAmount = mercadoPagoAmount - extraCashMPAmount;

    const ventasOnlineItem = items.find(i => i.name === 'Ventas Online');
  const ventasOnlineAmount = parseFloat(ventasOnlineItem?.amount || "0");

  return adjustedMercadoPagoAmount + pedidosYaAmount + rappiAmount + ventasOnlineAmount;
  };

  /**
   * @description Limpia todos los campos y reinicia el estado del componente
   */
  const handleResetForm = () => {
    setItems(predefinedItems.map(name => ({ name, amount: '', formattedAmount: '' })));
    setNewItem({ name: '', amount: '', formattedAmount: '' });
  };

  /**
   * @description Limpia todos los campos y reinicia el estado del componente
   * @deprecated Usar handleResetForm en su lugar
   */
  const handleClearAll = () => {
    setItems(predefinedItems.map(name => ({ name, amount: '', formattedAmount: '' })));
    setNewItem({ name: '', amount: '', formattedAmount: '' });
  };

  /**
   * @description Formatea un valor numérico como moneda sin el símbolo $
   * @param {number} value - Valor a formatear
   * @returns {string} - Valor formateado
   */
  const formatARSWithoutSymbol = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0,00';
    
    // Convertir a número si es string
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Formatear con separador de miles y coma decimal
    return num.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('.', ',');
  };
  
  /**
   * @description Maneja el cambio en el switch de tipo de ajuste
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio
   */
  const handleAjusteTypeChange = (e) => {
    const isEgreso = e.target.checked;
    setIsAjusteEgreso(isEgreso);
    
    // Actualizar el valor del ajuste si ya tiene un monto
    const ajusteIndex = items.findIndex(item => item.name === 'Ajuste');
    if (ajusteIndex >= 0 && items[ajusteIndex].amount) {
      const ajusteItem = items[ajusteIndex];
      let numericAmount = parseFloat(ajusteItem.amount);
      
      if (numericAmount === 0) return;
      
      // Cambiar el signo del valor según corresponda
      if ((isEgreso && numericAmount > 0) || (!isEgreso && numericAmount < 0)) {
        numericAmount = -numericAmount;
        
        const newItems = [...items];
        newItems[ajusteIndex] = {
          ...ajusteItem,
          amount: numericAmount.toString()
        };
        
        setItems(newItems);
      }
    }
  };
  
  /**
   * @description Guarda el checklist actual en un archivo de texto
   */
  const handleSaveToFile = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Guardar solo los items que tienen valores
    const itemsWithValues = items.filter(item => item.amount);
    
    // Crear el contenido del archivo
    const content = itemsWithValues.map(item => {
      // Para los items individuales, usar el formato ya existente o formatear
      const amount = parseFloat(item.amount);
      const isNegative = amount < 0;
      const formattedValue = item.formattedAmount || formatARS(Math.abs(amount) || 0);
      return `${item.name.padEnd(25)}: ${isNegative ? '-$' : '$'}${formattedValue}`;
    }).join('\n') + `\n\nTOTAL GENERAL: ${total < 0 ? '-$' : '$'}${formatARS(Math.abs(total))}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${formattedDate} Cierre de caja.txt`);
  };

  /**
   * @description Maneja la apertura del diálogo de selección de archivo
   */
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  /**
   * @description Carga y procesa el archivo de texto seleccionado
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio del input de archivo
   */
  const handleLoadFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') return;

        console.log('Contenido del archivo cargado:', content); // Depuración

        // Procesar el contenido del archivo
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Crear una copia de los items predefinidos para construir el nuevo array
        // Importante: Necesitamos inicializar con la misma estructura exacta para mantener las referencias
        const initialItems = JSON.parse(JSON.stringify(items));
        const itemMap = {};
        
        // Mapear los items existentes por nombre para facilitar la búsqueda
        initialItems.forEach(item => {
          itemMap[item.name.toLowerCase()] = {
            index: initialItems.findIndex(i => i.name === item.name),
            item
          };
        });
        
        // Procesar cada línea
        lines.forEach(line => {
          // Omitir línea de total general
          if (line.toLowerCase().includes('total general')) return;
          
          // Extraer nombre y valor
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) return;
          
          const name = line.substring(0, colonIndex).trim();
          let valueStr = line.substring(colonIndex + 1).trim();
          
          console.log('Procesando línea:', name, valueStr); // Depuración
          
          // Eliminar símbolo de moneda y formateo
          if (valueStr.startsWith('$')) {
            valueStr = valueStr.substring(1).trim();
          }
          
          // Si el valor es solo guiones o está vacío, saltamos
          if (valueStr === '' || valueStr === '__________') return;
          
          // Convertir a formato numérico para JS
          const numericValue = valueStr.replace(/\./g, '').replace(',', '.');
          const amount = parseFloat(numericValue);
          
          if (!isNaN(amount)) {
            // Buscar item existente o una coincidencia parcial
            let foundItemKey = null;
            let foundPredefinedIndex = -1;
            
            // Primero buscar coincidencia exacta
            if (itemMap[name.toLowerCase()]) {
              foundItemKey = name.toLowerCase();
            } else {
              // Buscar coincidencias parciales
              Object.keys(itemMap).forEach(key => {
                if (name.toLowerCase().includes(key) || key.includes(name.toLowerCase())) {
                  foundItemKey = key;
                }
              });
              
              // Si no encontramos coincidencia, buscar en items predefinidos
              if (!foundItemKey) {
                foundPredefinedIndex = predefinedItems.findIndex(item => 
                  item.toLowerCase() === name.toLowerCase() || 
                  name.toLowerCase().includes(item.toLowerCase()) ||
                  item.toLowerCase().includes(name.toLowerCase()));
              }
            }
            
            if (foundItemKey) {
              // Actualizar item existente
              const { index } = itemMap[foundItemKey];
              initialItems[index] = {
                ...initialItems[index],
                amount: amount.toString(),
                formattedAmount: valueStr
              };
              console.log('Item existente actualizado:', initialItems[index].name, amount, valueStr); // Depuración
            } else if (foundPredefinedIndex >= 0) {
              // Actualizar item predefinido que no está en el mapa actual
              const predefinedName = predefinedItems[foundPredefinedIndex];
              const existingIndex = initialItems.findIndex(item => item.name === predefinedName);
              
              if (existingIndex >= 0) {
                initialItems[existingIndex] = {
                  ...initialItems[existingIndex],
                  amount: amount.toString(),
                  formattedAmount: valueStr
                };
                console.log('Item predefinido actualizado:', predefinedName, amount, valueStr); // Depuración
              }
            } else {
              // Es un item personalizado nuevo
              initialItems.push({
                name,
                amount: amount.toString(),
                formattedAmount: valueStr
              });
              console.log('Item personalizado agregado:', name, amount, valueStr); // Depuración
            }
          }
        });
        
        console.log('Items finales:', initialItems); // Depuración
        
        // Verificar si hay un ajuste con valor negativo para actualizar el switch
        const ajusteItem = initialItems.find(item => item.name === 'Ajuste');
        if (ajusteItem && ajusteItem.amount) {
          const ajusteValue = parseFloat(ajusteItem.amount);
          setIsAjusteEgreso(ajusteValue < 0);
          console.log('Ajuste detectado:', ajusteValue, 'Es egreso:', ajusteValue < 0); // Depuración
        }
        
        // Limpiar primero
        setItems([]);
        
        // Un pequeño timeout para asegurarnos que el estado se limpie primero
        setTimeout(() => {
          setItems(initialItems);
          console.log('Estado actualizado con items cargados del archivo'); // Depuración
          // Mostrar mensaje de éxito
          alert('Planilla cargada correctamente.');
        }, 50);
        
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        alert('Error al procesar el archivo. Verifique que el formato sea correcto.');
      }
      
      // Limpiar el input para permitir cargar el mismo archivo nuevamente
      e.target.value = '';
    };
    
    reader.readAsText(file);
  };

  /**
   * @description Maneja la navegación por teclado entre los campos de entrada
   * @param {number} index - Índice del campo actual
   * @param {React.KeyboardEvent} e - Evento de teclado
   */
  const handleKeyPress = (index, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = index + 1;
      
      if (nextIndex < items.length) {
        inputRefs.current[nextIndex]?.focus();
      } else {
        // Focus en el primer campo de custom al llegar al final
        document.getElementById('custom-name-input')?.focus();
      }
    }
  };

  /**
   * @description Maneja el cambio de pestaña
   * @param {React.SyntheticEvent} event - Evento de cambio de pestaña
   * @param {number} newValue - Índice de la nueva pestaña seleccionada
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  /**
   * @description Procesa el archivo de Sinergie cargado
   * @param {Event} event - Evento de cambio del input de archivo
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n');
        
        // Buscar información del turno, fecha, hora y cajero
        let turno = '';
        let fecha = '';
        let hora = '';
        let cajero = '';
        let totales = {};
        
        // Patrones para buscar en el archivo
        const turnoPattern = /TURNO\s*\d+/i;
        const fechaHoraPattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/;
        const cajeroPattern = /CAJERO\s*:\s*(.+)/i;
        const totalPattern = /^([A-Z\s]+)\s+([\d.,]+)$/i;
        
        lines.forEach(line => {
          // Buscar turno
          if (turnoPattern.test(line)) {
            const match = line.match(turnoPattern);
            if (match) turno = match[0].toUpperCase();
          }
          
          // Buscar fecha y hora
          const fechaHoraMatch = line.match(fechaHoraPattern);
          if (fechaHoraMatch) {
            fecha = fechaHoraMatch[1];
            hora = fechaHoraMatch[2];
          }
          
          // Buscar cajero
          const cajeroMatch = line.match(cajeroPattern);
          if (cajeroMatch) {
            cajero = cajeroMatch[1].trim();
          }
          
          // Buscar totales
          const totalMatch = line.match(totalPattern);
          if (totalMatch) {
            const concepto = totalMatch[1].trim().toUpperCase();
            const monto = totalMatch[2].replace(/\./g, '').replace(',', '.');
            
            // Mapear el concepto de Sinergie al formato de la planilla
            const conceptoMapeado = Object.keys(sinergieToPlanillaMap).find(
              key => concepto.includes(key)
            );
            
            if (conceptoMapeado) {
              totales[sinergieToPlanillaMap[conceptoMapeado]] = parseFloat(monto);
            }
          }
        });
        
        // Actualizar el estado con los datos extraídos
        setSinergieData({
          turno: turnosMap[turno] || turno,
          fecha,
          hora,
          cajero,
          totales
        });
        
        // Actualizar los items con los totales encontrados
        const updatedItems = items.map(item => {
          if (item.name in totales) {
            const amountNum = parseFloat(totales[item.name]);
            const formattedAmount = formatARS(amountNum);
            return {
              ...item,
              amount: amountNum.toString(),
              formattedAmount: formattedAmount
            };
          }
          return item;
        });
        
        setItems(updatedItems);
        setFileLoaded(true);
        setActiveTab(1); // Cambiar a la pestaña de planilla
        
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        alert('Error al procesar el archivo. Asegúrate de que sea un archivo de Sinergie válido.');
      }
    };
    
    reader.readAsText(file);
  };
  
  /**
   * @description Renderiza la vista de carga de archivo
   * @returns {JSX.Element} Componente de carga de archivo
   */
  const renderFileUpload = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 4,
      border: '2px dashed #90caf9',
      borderRadius: 2,
      textAlign: 'center',
      minHeight: '200px',
      backgroundColor: 'rgba(144, 202, 249, 0.05)'
    }}>
      <input
        accept=".txt"
        style={{ display: 'none' }}
        id="sinergie-file-upload"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="sinergie-file-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<UploadIcon />}
          sx={{ mb: 2 }}
        >
          Seleccionar archivo de Sinergie
        </Button>
      </label>
      <Typography variant="body1" color="textSecondary">
        Arrastra y suelta un archivo de cierre de Sinergie aquí, o haz clic para seleccionar
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
        Formato soportado: .txt (exportado desde Sinergie)
      </Typography>
    </Box>
  );
  
  /**
   * @description Renderiza la planilla de papel con los datos cargados
   * @returns {JSX.Element} Componente de planilla de papel
 */


  const renderPlanilla = () => {
    // Crear un tema que fuerce los estilos claros independientemente del tema global
    const planillaTheme = createTheme({
      palette: {
        mode: 'light', // Forzar modo claro
        background: {
          paper: '#fffde7',
          default: '#fffde7'
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
          disabled: 'rgba(0, 0, 0, 0.38)'
        }
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: '#fffde7',
              color: 'rgba(0, 0, 0, 0.87)',
              '& .MuiCardContent-root': {
                backgroundColor: '#fffde7',
                color: 'rgba(0, 0, 0, 0.87)'
              }
            }
          }
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              color: 'rgba(0, 0, 0, 0.87)'
            }
          }
        },
        MuiTable: {
          styleOverrides: {
            root: {
              '&, & *': {
                color: 'rgba(0, 0, 0, 0.87) !important',
                borderColor: 'rgba(0, 0, 0, 0.23) !important'
              }
            }
          }
        },
        MuiTableRow: {
          styleOverrides: {
            head: {
              backgroundColor: '#f5f5f5 !important',
              '& .MuiTableCell-head': {
                color: 'rgba(0, 0, 0, 0.87) !important',
                fontWeight: 'bold !important'
              }
            },
            root: {
              '&:nth-of-type(odd)': {
                backgroundColor: 'rgba(0, 0, 0, 0.02) !important'
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04) !important'
              },
              '& .MuiTableCell-root': {
                color: 'rgba(0, 0, 0, 0.87) !important',
                borderColor: 'rgba(0, 0, 0, 0.12) !important'
              }
            }
          }
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: 'rgba(0, 0, 0, 0.12) !important',
              color: 'rgba(0, 0, 0, 0.87) !important',
              '&.MuiTableCell-head': {
                color: 'rgba(0, 0, 0, 0.87) !important',
                fontWeight: 'bold !important'
              }
            }
          }
        }
      }
    });

    return (
      <Box sx={{ mt: 2, width: '100%', maxWidth: '100%' }}>
        <ThemeProvider theme={planillaTheme}>
          <Card variant="outlined" sx={{ mb: 3, width: '100%', maxWidth: '100%' }}>
            <CardContent>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  PLANILLA DE CIERRE DE CAJA
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">
                    <strong>FECHA:</strong> {sinergieData.fecha || '__________'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>TURNO:</strong> {sinergieData.turno || '__________'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>HORA:</strong> {sinergieData.hora || '__________'}
                  </Typography>
                </Box>
                <Typography variant="body1" align="left" sx={{ mb: 2 }}>
                  <strong>CAJERO/A:</strong> {sinergieData.cajero || '__________'}
                </Typography>
              </Box>
              
              <TableContainer>
                <Table size="small" sx={{ 
                  border: '1px solid #e0e0e0',
                  '& .MuiTableCell-root': {
                    color: 'rgba(0, 0, 0, 0.87)',
                    borderColor: 'rgba(0, 0, 0, 0.23)'
                  }
                }}>
                  <TableHead>
                    <TableRow sx={{ 
                      '& .MuiTableCell-root': {
                        backgroundColor: '#f5f5f5',
                        color: 'rgba(0, 0, 0, 0.87)'
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 'bold', border: '1px solid #e0e0e0', fontSize: 16, padding: '8px' }}>CONCEPTO</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #e0e0e0', fontSize: 16, padding: '8px' }}>IMPORTE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ border: '1px solid #e0e0e0', fontSize: 14, padding: '8px' }}>{item.name}</TableCell>
                        <TableCell align="right" sx={{ border: '1px solid #e0e0e0', fontSize: 14, padding: '8px' }}>
                          {item.amount ? formatARS(item.amount) : '__________'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ 
                      '& .MuiTableCell-root': {
                        backgroundColor: '#f5f5f5',
                        color: 'rgba(0, 0, 0, 0.87)'
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 'bold', border: '1px solid #e0e0e0' }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #e0e0e0' }}>
                        {formatARS(total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ mt: 2, width: { xs: '100%', sm: '48%' } }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>OBSERVACIONES:</strong>
                  </Typography>
                  <Box sx={{ border: '1px solid #e0e0e0', minHeight: '80px', p: 1 }}>
                    {sinergieData.observaciones || '________________________________________________________________'}
                  </Box>
                </Box>
                <Box sx={{ mt: 2, width: { xs: '100%', sm: '48%' } }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>FIRMA RESPONSABLE:</strong>
                  </Typography>
                  <Box sx={{ borderBottom: '1px solid #000', minHeight: '30px', mb: 2 }}></Box>
                  <Typography variant="body2" align="center">
                    Aclaración y Firma
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </ThemeProvider>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          gap: 2,
          mt: 2 
        }}>
          <Button 
            fullWidth
            variant="outlined" 
            onClick={() => setActiveTab(0)}
            startIcon={<DescriptionIcon />}
            sx={{ mb: { xs: 1, sm: 0 } }}
          >
            Volver a cargar archivo
          </Button>
          <Button 
            fullWidth
            variant="outlined" 
            onClick={() => setActiveTab(1)}
            // Podrías agregar un ícono si lo deseas, ej: endIcon={<ArrowForwardIcon />}
            sx={{ mb: { xs: 1, sm: 0 } }}
          >
            Ver planilla cierre ➡️
          </Button>
          <Button 
            fullWidth
            variant="contained" 
            color="primary" 
            onClick={handleSaveToFile}
            disabled={!fileLoaded}
            startIcon={<SaveIcon />}
          >
            Guardar Planilla
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%', 
      maxWidth: '1200px',
      boxSizing: 'border-box',
      mx: 'auto',
      '& .MuiFormControl-root': { mt: 1 },
      '& .MuiPaper-root': {
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      },
      '& .MuiGrid-item': {
        width: '100%',
        maxWidth: '100%'
      }
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        color: '#90caf9', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        mb: 2 
      }}>
        Planilla de Corte de Caja
      </Typography>
      
      <AppBar position="static" color="default" sx={{ mb: 3, borderRadius: 1, overflow: 'hidden', pr: 1 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Carga de Datos" />
          <Tab label="Planilla de Cierre" />
        </Tabs>
      </AppBar>

      {activeTab === 0 && (
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 3, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Datos del Turno
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2, '& .MuiFormControl-root': { width: '100%' } }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ position: 'relative', width: '100%', mt: 0, mb: 1, height: '56px', display: 'flex', alignItems: 'center' }}>
                  <select
                    value={sinergieData.turno}
                    onChange={(e) => setSinergieData(prev => ({ ...prev, turno: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '56px',
                      padding: '16px 14px',
                      marginTop: '15.5px',
                      border: '1px solid rgba(255, 255, 255, 0.23)',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      fontSize: '1rem',
                      color: sinergieData.turno ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.87)'
                      },
                      '&:focus': {
                        borderColor: '#90caf9',
                        borderWidth: '1px',
                        boxShadow: '0 0 0 1px #90caf9'
                      }
                    }}
                  >
                    <option value="" disabled style={{ color: 'rgba(255, 255, 255, 0.7)', backgroundColor: '#121212' }}>
                      Seleccionar turno
                    </option>
                      <option value="Turno Mañana" style={{ color: 'white', backgroundColor: '#121212' }}>Turno Mañana</option>
                    <option value="Turno Tarde" style={{ color: 'white', backgroundColor: '#121212' }}>Turno Tarde</option>
                    <option value="Turno Noche" style={{ color: 'white', backgroundColor: '#121212' }}>Turno Noche</option>
                  </select>
                  <Box sx={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    ▼
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  value={sinergieData.fecha}
                  onChange={(e) => setSinergieData(prev => ({ ...prev, fecha: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora"
                  value={sinergieData.hora}
                  onChange={(e) => setSinergieData(prev => ({ ...prev, hora: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Cajero/a"
                  value={sinergieData.cajero}
                  onChange={(e) => setSinergieData(prev => ({ ...prev, cajero: e.target.value }))}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ingresar Valores
              </Typography>
              
              {/* Caja 1: Cargar desde comprobantes */}
              <Box 
                sx={theme => ({ 
                  position: 'relative',
                  border: `2px solid ${theme.palette.divider}`, 
                  borderRadius: 2, 
                  p: 2, 
                  pt: 3,
                  mb: 3, 
                  mt: 3
                })}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={theme => ({ 
                    position: 'absolute',
                    top: '-12px',
                    left: '12px',
                    px: 1,
                    fontWeight: 'bold',
                    backgroundColor: theme.palette.background.paper, 
                    color: theme.palette.text.primary,
                    zIndex: 1
                  })}
                >
                  Cargar desde comprobantes
                </Typography>
                
                <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
                  {items.filter(item => [
                    'Deposito 1', 'Deposito 2', 'Deposito 3', 'Deposito 4', 'Depo Final', 
                    'Retiro', 'Ajuste', 'Gastos', 'Notas de crédito', 'Facturas manuales', 
                    'Extra Cash Posnet (Visa Electron + MasterCard)', 'Extra Cash Mercado Pago', 'Ventas Online'
                  ].includes(item.name)).map((item, index) => {
                    // Recalcular el índice real en el array original
                    const realIndex = items.findIndex(i => i.name === item.name);
                    return (
                      <Fragment key={realIndex}>
                        <Grid item xs={7} sm={8} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {item.name}
                            {item.name === 'Rappi' && (
                              <Tooltip title="Copiar antes de hacer el cierre X de Sinergie, ya que una vez hecho, el importe Rappi ya no se ve por separado, y pasa a sumarse con las Tarjetas.">
                                <WarningIcon 
                                  color="warning" 
                                  sx={{ 
                                    fontSize: '1rem', 
                                    ml: 1,
                                    verticalAlign: 'middle'
                                  }} 
                                />
                              </Tooltip>
                            )}
                            {item.name === 'Gastos' && (
                              <Tooltip title="Para cargar gastos de librería, mantenimiento, limpieza y otros autorizados por la empresa">
                                <WarningIcon 
                                  color="warning" 
                                  sx={{ 
                                    fontSize: '1rem', 
                                    ml: 1,
                                    verticalAlign: 'middle'
                                  }} 
                                />
                              </Tooltip>
                            )}
                          </Typography>
                          
                          {/* Switch para el campo Ajuste */}
                          {item.name === 'Ajuste' && (
                            <Tooltip title={isAjusteEgreso ? "Egreso (valor negativo)" : "Ingreso (valor positivo)"}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={isAjusteEgreso}
                                    onChange={handleAjusteTypeChange}
                                    color="primary"
                                  />
                                }
                                label={<Typography variant="caption" color="text.secondary">
                                  {isAjusteEgreso ? "Egreso" : "Ingreso"}
                                </Typography>}
                                sx={{ mb: 0, ml: 0 }}
                              />
                            </Tooltip>
                          )}
                        </Grid>
                        <Grid item xs={5} sm={4}>
                          {['Notas de crédito', 'Facturas manuales', 'Extra Cash Posnet (Visa Electron + MasterCard)', 'Extra Cash Mercado Pago', 'Gastos', 'Ventas Online'].includes(item.name) ? (
                            <Box>
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="text"
                                value={item.amount ? `${parseFloat(item.amount) < 0 ? '-$' : '$'}${item.formattedAmount || formatARS(Math.abs(parseFloat(item.amount)))}` : ''}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  if (value.startsWith('$')) value = value.substring(1);
                                  if (value.startsWith('-$')) value = value.substring(2);
                                  handleFormattedChange({ target: { value } }, realIndex);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, realIndex, items, inputRefs)}
                                inputRef={el => inputRefs.current[realIndex] = el}
                                inputProps={{
                                  inputMode: 'decimal',
                                  style: {
                                    textAlign: 'right',
                                    paddingRight: '12px'
                                  },
                                }}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end" sx={{ margin: 0, height: '100%' }}>
                                      <Tooltip title={`Sumar múltiples importes para ${item.name}`}>
                                        <Button
                                          variant="outlined"
                                          color="primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenMultipleAmountDialog(item.name, e);
                                          }}
                                          sx={{
                                            minWidth: '40px',
                                            width: '40px',
                                            height: '40px',
                                            margin: 0,
                                            padding: 0,
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                            marginLeft: '-1px',
                                            '&:hover': {
                                              borderColor: 'primary.main',
                                              zIndex: 1
                                            }
                                          }}
                                        >
                                          <CalculateIcon />
                                        </Button>
                                      </Tooltip>
                                    </InputAdornment>
                                  ),
                                  sx: {
                                    padding: 0,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderRight: 'none',
                                      borderTopRightRadius: '4px',
                                      borderBottomRightRadius: '4px'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'primary.main',
                                      borderTopRightRadius: '4px',
                                      borderBottomRightRadius: '4px'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'primary.main',
                                      borderRight: 'none',
                                      borderTopRightRadius: '4px',
                                      borderBottomRightRadius: '4px'
                                    }
                                  }
                                }}
                              />
                            </Box>
                          ) : (
                            <TextField
                              fullWidth
                              variant="outlined"
                              size="small"
                              type="text"
                              value={item.amount ? `${parseFloat(item.amount) < 0 ? '-$' : '$'}${item.formattedAmount || formatARS(Math.abs(parseFloat(item.amount)))}` : ''}
                              onChange={(e) => {
                                // Remover el símbolo $ si existe antes de procesar
                                let value = e.target.value;
                                if (value.startsWith('$')) value = value.substring(1);
                                if (value.startsWith('-$')) value = value.substring(2);
                                handleFormattedChange({ target: { value } }, realIndex);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, realIndex, items, inputRefs)}
                              inputRef={el => inputRefs.current[realIndex] = el}
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '40px'
                                },
                                '& .MuiOutlinedInput-input': {
                                  textAlign: 'right',
                                  padding: '8px 12px'
                                }
                              }}
                              inputProps={{
                                inputMode: 'decimal'
                              }}
                            />
                          )}
                        </Grid>
                      </Fragment>
                    );
                  })}
                </Grid>
              </Box>
              
              {/* Caja 2: Copiar desde Sinergie */}
              <Box 
                sx={theme => ({ 
                  position: 'relative',
                  border: `2px solid ${theme.palette.divider}`, 
                  borderRadius: 2, 
                  p: 2, 
                  pt: 3,
                  mb: 3,
                  mt: 3
                })}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={theme => ({ 
                    position: 'absolute',
                    top: '-12px',
                    left: '12px',
                    px: 1,
                    fontWeight: 'bold',
                    backgroundColor: theme.palette.background.paper, 
                    color: theme.palette.text.primary,
                    zIndex: 1
                  })}
                >
                  Copiar desde Sinergie
                </Typography>
                
                <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
                  {items.filter(item => [
                    'Tarjetas', 'Mercado Pago', 'Pedidos Ya', 'Rappi'
                  ].includes(item.name)).map((item, index) => {
                    // Recalcular el índice real en el array original
                    const realIndex = items.findIndex(i => i.name === item.name);
                    return (
                      <Fragment key={realIndex}>
                        <Grid item xs={7} sm={8} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {item.name}
                            {item.name === 'Rappi' && (
                              <Tooltip title="Copiar antes de hacer el cierre X de Sinergie, ya que una vez hecho, el importe Rappi ya no se ve por separado, y pasa a sumarse con las Tarjetas.">
                                <WarningIcon 
                                  color="warning" 
                                  sx={{ 
                                    fontSize: '1rem', 
                                    ml: 1,
                                    verticalAlign: 'middle'
                                  }} 
                                />
                              </Tooltip>
                            )}
                            {item.name === 'Gastos' && (
                              <Tooltip title="Para cargar gastos de librería, mantenimiento, limpieza y otros autorizados por la empresa">
                                <WarningIcon 
                                  color="warning" 
                                  sx={{ 
                                    fontSize: '1rem', 
                                    ml: 1,
                                    verticalAlign: 'middle'
                                  }} 
                                />
                              </Tooltip>
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={5} sm={4}>
                          {['Notas de crédito', 'Facturas manuales', 'Extra Cash Posnet (Visa Electron + MasterCard)', 'Extra Cash Mercado Pago', 'Gastos', 'Ventas Online'].includes(item.name) ? (
                            <Box>
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="text"
                                value={item.amount ? `${parseFloat(item.amount) < 0 ? '-$' : '$'}${item.formattedAmount || formatARS(Math.abs(parseFloat(item.amount)))}` : ''}
                                onChange={(e) => {
                                  // Remover el símbolo $ si existe antes de procesar
                                  let value = e.target.value;
                                  if (value.startsWith('$')) value = value.substring(1);
                                  if (value.startsWith('-$')) value = value.substring(2);
                                  handleFormattedChange({ target: { value } }, realIndex);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, realIndex, items, inputRefs)}
                                inputRef={el => inputRefs.current[realIndex] = el}
                                sx={{
                                  height: '40px', // Ensure consistent height
                                  '& .MuiOutlinedInput-root': {
                                    height: '100%',
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                    // Ajuste de altura de 1px si es necesario, ej: paddingTop: '1px'
                                  },
                                  '& .MuiOutlinedInput-input': {
                                    textAlign: 'right',
                                    padding: '8px 12px',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main', // Mantener hover
                                  },
                                }}
                                inputProps={{
                                  inputMode: 'decimal'
                                }}
                              />
                              <Tooltip title={`Sumar múltiples importes para ${item.name}`}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMultipleAmountDialog(item.name, e);
                                  }}
                                  sx={{
                                    height: '40px', // Ensure consistent height
                                    minWidth: '40px',
                                    p: 0,
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    marginLeft: '-1px', // Para que el borde se solape y parezca unido
                                    // Ajuste de altura de 1px si es necesario, ej: pt: '1px'
                                    '&:hover': {
                                      borderColor: 'primary.main', // Mantener hover
                                      zIndex: 1 // Para que el hover del botón se vea sobre el textfield
                                    }
                                  }}
                                >
                                  <CalculateIcon />
                                </Button>
                              </Tooltip>
                            </Box>
                          ) : (
                            <TextField
                              fullWidth
                              variant="outlined"
                              size="small"
                              type="text"
                              value={item.amount ? `${parseFloat(item.amount) < 0 ? '-$' : '$'}${item.formattedAmount || formatARS(Math.abs(parseFloat(item.amount)))}` : ''}
                              onChange={(e) => {
                                // Remover el símbolo $ si existe antes de procesar
                                let value = e.target.value;
                                if (value.startsWith('$')) value = value.substring(1);
                                if (value.startsWith('-$')) value = value.substring(2);
                                handleFormattedChange({ target: { value } }, realIndex);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, realIndex, items, inputRefs)}
                              inputRef={el => inputRefs.current[realIndex] = el}
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '40px'
                                },
                                '& .MuiOutlinedInput-input': {
                                  textAlign: 'right',
                                  padding: '8px 12px'
                                }
                              }}
                              inputProps={{
                                inputMode: 'decimal'
                              }}
                            />
                          )}
                        </Grid>
                      </Fragment>
                    );
                  })}
                </Grid>
              </Box>
            </Box>
                  
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              gap: 1,
              mt: 2 
            }}>
              <Button 
                fullWidth
                variant="outlined" 
                color="error"
                onClick={handleResetForm}
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                Limpiar Todo
              </Button>
              <Button 
                fullWidth
                variant="contained" 
                color="primary"
                onClick={handleSaveToFile}
                startIcon={<SaveIcon />}
                disabled={!total}
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                Guardar Planilla
              </Button>
              <Button 
                fullWidth
                variant="contained" 
                color="secondary"
                onClick={handleOpenFileDialog}
                startIcon={<UploadIcon />}
              >
                Cargar Planilla
              </Button>
              <Button 
                fullWidth
                variant="outlined" 
                color="info"
                onClick={() => setActiveTab(1)}
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                Ver planilla cierre ➡️
              </Button>
              <input
                type="file"
                accept=".txt"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleLoadFromFile}
              />
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Total General</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatARS(total)}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Vista Previa de la Planilla</Typography>
              <Button 
                variant="outlined" 
                onClick={() => setActiveTab(0)}
                startIcon={<DescriptionIcon />}
              >
                Volver a la carga
              </Button>
            </Box>
            
            <Box sx={{ maxWidth: '400px', mx: 'auto' }}>
              <ThemeProvider theme={createTheme({
                palette: {
                  mode: 'light',
                  background: {
                    paper: '#fffde7',
                    default: '#fffde7'
                  },
                  text: {
                    primary: 'rgba(0, 0, 0, 0.87)',
                    secondary: 'rgba(0, 0, 0, 0.6)'
                  }
                },
                components: {
                  MuiBox: {
                    styleOverrides: {
                      root: {
                        backgroundColor: '#fffde7',
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      }
                    }
                  },
                  MuiTypography: {
                    styleOverrides: {
                      root: {
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      }
                    }
                  },
                  MuiTableCell: {
                    styleOverrides: {
                      root: {
                        color: 'rgba(0, 0, 0, 0.87) !important',
                        borderColor: 'rgba(0, 0, 0, 0.12) !important'
                      },
                      head: {
                        fontWeight: 'bold !important',
                        backgroundColor: '#f5f5f5 !important'
                      }
                    }
                  },
                  MuiTableRow: {
                    styleOverrides: {
                      root: {
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02) !important'
                        }
                      }
                    }
                  }
                }
              })}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fffde7 !important' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1, color: 'rgba(0, 0, 0, 0.87) !important', fontSize: '1.1rem' }}>
                  PLANILLA DE CIERRE DE CAJA
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between', 
                  mb: 1, 
                  fontSize: '.8rem', 
                  color: 'rgba(0, 0, 0, 0.87) !important',
                  '& > span': {
                    mb: { xs: 0.5, sm: 0 }
                  }
                }}>
                  <span><strong>FECHA:</strong> {new Date().toLocaleDateString()}</span>
                  <span><strong>TURNO:</strong> {sinergieData.turno || '__________'}</span>
                  <span><strong>HORA:</strong> {new Date().toLocaleTimeString()}</span>
                </Box>
                <Typography variant="body2" sx={{ mb: 2, fontSize: '.8rem', color: 'rgba(0, 0, 0, 0.87) !important' }}>
                  <strong>CAJERO/A:</strong> {sinergieData.cajero || '__________'}
                </Typography>
                
                {/* Sección de Efectivo - Arqueo de Caja */}
                <Box sx={{ mb: 3, border: '1px solid #9e9e9e', borderRadius: '12px', overflow: 'hidden' }}>
                  <Box sx={{ 
                    p: 1, 
                    backgroundColor: '#e0e0e0', 
                    borderBottom: '1px solid #9e9e9e',
                    textAlign: 'center'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      ARQUEO DE CAJA - {sinergieData.turno} - Depósitos
                    </Typography>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small" sx={{ 
                      '& td, & th': { 
                        border: '1px solid #9e9e9e', 
                        p: 0.5, 
                        fontSize: '0.9rem', 
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      } 
                    }}>
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Descripción</TableCell>
                          <TableCell width="30%" align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Importe</TableCell>
                          <TableCell width="30%" align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Responsable</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Depósitos */}
                        {(() => {
                          const depositNames = ['Deposito 1', 'Deposito 2', 'Deposito 3', 'Deposito 4', 'Depo Final'];
                          const filledDepositItems = depositNames
                            .map(name => items.find(i => i.name === name))
                            .filter(item => item && item.amount && parseFormattedValue(item.amount) !== 0);

                          if (filledDepositItems.length > 0) {
                            return filledDepositItems.map((item, idx) => (
                              <TableRow key={`deposit-filled-${idx}`}>
                                <TableCell>Depósito</TableCell>
                                <TableCell align="right">{formatARS(item.amount)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ));
                          } else {
                            return (
                              <TableRow key="deposit-empty">
                                <TableCell>Depósito</TableCell>
                                <TableCell align="right">{''}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            );
                          }
                        })()}
                        
                        {/* Extra Cash */}
                        {['Extra Cash Mercado Pago', 'Extra Cash Posnet (Visa Electron + MasterCard)'].map((name, idx) => {
                          const item = items.find(i => i.name === name);
                          return (
                            <TableRow key={`extra-${idx}`}>
                              <TableCell>{name === 'Extra Cash Mercado Pago' ? 'Extra Cash M.P.' : 'Extra Cash Posnet'}</TableCell>
                              <TableCell align="right">{item && item.amount ? formatARS(item.amount) : ''}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Gastos */}
                        <TableRow>
                          <TableCell>Gasto</TableCell>
                          <TableCell align="right">
                            {items.find(i => i.name === 'Gastos')?.amount 
                              ? formatARS(items.find(i => i.name === 'Gastos')?.amount) 
                              : ''}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        {/* Ajuste */}
                        <TableRow>
                          <TableCell>Ajuste</TableCell>
                          <TableCell align="right">
                            {items.find(i => i.name === 'Ajuste')?.amount
                              ? formatARS(parseFloat(items.find(i => i.name === 'Ajuste')?.amount || "0"))
                              : ''}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* Retiro */}
                        <TableRow>
                          <TableCell>Retiro de monedas</TableCell>
                          <TableCell align="right">
                            {items.find(i => i.name === 'Retiro')?.amount 
                              ? formatARS(items.find(i => i.name === 'Retiro')?.amount) 
                              : ''}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* TOTAL EFECTIVO */}
                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>TOTAL EFECTIVO</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatARS(calcularTotalEfectivo())}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                {/* Sección de Pagos Electrónicos */}
                <Box sx={{ mb: 3, border: '1px solid #9e9e9e', borderRadius: '12px', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small" sx={{ 
                      '& td, & th': { 
                        border: '1px solid #9e9e9e', 
                        p: 0.5, 
                        fontSize: '0.9rem', 
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      } 
                    }}>
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Descripción</TableCell>
                          <TableCell width="30%" align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Importe</TableCell>
                          <TableCell width="30%" align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5 !important' }}>Responsable</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Pagos QR */}
                        <TableRow>
                          <TableCell>Pago QR M.P.</TableCell>
                          <TableCell align="right">
                            {(() => {
                              const mercadoPagoItem = items.find(i => i.name === 'Mercado Pago');
                              const extraCashMPItem = items.find(i => i.name === 'Extra Cash Mercado Pago');

                              const mercadoPagoAmount = parseFloat(mercadoPagoItem?.amount || "0");
                              const extraCashMPAmount = parseFloat(extraCashMPItem?.amount || "0");

                              const resultado = mercadoPagoAmount - extraCashMPAmount;
                              return formatARS(resultado);
                            })()}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Rappi</TableCell>
                          <TableCell align="right">
                            {items.find(i => i.name === 'Rappi')?.amount 
                              ? formatARS(items.find(i => i.name === 'Rappi')?.amount) 
                              : ''}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* Delivery */}
                        <TableRow>
                          <TableCell>PedidosYa</TableCell>
                          <TableCell align="right">
                            {items.find(i => i.name === 'Pedidos Ya')?.amount 
                              ? formatARS(items.find(i => i.name === 'Pedidos Ya')?.amount) 
                              : ''}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* Tarjetas */}
                        <TableRow>
                          <TableCell>TARJETA</TableCell>
                          <TableCell align="right">
                            {(() => {
                              const tarjetasItem = items.find(i => i.name === 'Tarjetas');
                              const extraCashPosnetItem = items.find(i => i.name === 'Extra Cash Posnet (Visa Electron + MasterCard)');

                              const tarjetasAmount = parseFloat(tarjetasItem?.amount || "0");
                              const extraCashPosnetAmount = parseFloat(extraCashPosnetItem?.amount || "0");

                              const resultado = tarjetasAmount - extraCashPosnetAmount;
                              return formatARS(resultado);
                            })()}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* TOTAL ELECTRÓNICO */}
                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>TOTAL ELECTRÓNICO</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatARS(calcularTotalElectronico())}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                {/* Sección de TOTAL VENTAS ONLINE */}
                <Box sx={{ mb: 2, border: '1px solid #9e9e9e', borderRadius: '12px', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small" sx={{ 
                      '& td, & th': { 
                        border: '1px solid #9e9e9e', 
                        p: 0.5, 
                        fontSize: '0.9rem', 
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      } 
                    }}>
                      <TableBody>
                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                          <TableCell width="40%" sx={{ fontWeight: 'bold' }}>TOTAL VENTAS ONLINE</TableCell>
                          <TableCell width="30%" align="right" sx={{ fontWeight: 'bold' }}>
                            {items.find(i => i.name === 'Ventas Online')?.amount ? formatARS(items.find(i => i.name === 'Ventas Online')?.amount) : ''}
                          </TableCell>
                          <TableCell width="30%"></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Sección de TOTAL DEL TURNO */}
                <Box sx={{ mb: 2, border: '1px solid #9e9e9e', borderRadius: '12px', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small" sx={{ 
                      '& td, & th': { 
                        border: '1px solid #9e9e9e', 
                        p: 0.5, 
                        fontSize: '0.9rem', 
                        color: 'rgba(0, 0, 0, 0.87) !important'
                      } 
                    }}>
                      <TableBody>
                        <TableRow sx={{ backgroundColor: '#d0d0d0' }}>
                          <TableCell width="40%" sx={{ fontWeight: 'bold' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              TOTAL DEL TURNO
                              <Tooltip title="Este total debe coincidir con el cierre X.">
                                <WarningIcon sx={{ ml: 1, fontSize: '1.2rem', color: 'orange' }} />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell width="30%" align="right" sx={{ fontWeight: 'bold' }}>
                            {formatARS(calcularTotalEfectivo() + calcularTotalElectronico())}
                          </TableCell>
                          <TableCell width="30%" />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </ThemeProvider>
            </Box>
          </Paper>
        </Box>
      )}

      

          {/* Diálogo de múltiples importes */}
      <MultipleAmountDialog
        open={multipleAmountDialogOpen}
        onClose={() => {
          // Primero cerrar el diálogo
          setMultipleAmountDialogOpen(false);
          
          // Usar un timeout para limpiar el anchorEl después de completar la animación
          setTimeout(() => {
            setMultipleAmountAnchorEl(null);
          }, 1000);
        }}
        title={`Importes para ${currentMultipleAmountField}`}
        amounts={tempAmounts}
        setAmounts={setTempAmounts}
        onSave={handleSaveMultipleAmounts}
        anchorEl={multipleAmountAnchorEl}
      />
    </Box>
  );
}

// Función para formatear un número como moneda argentina
const formatARS = (value) => {
  if (value === '' || value === null || value === undefined || isNaN(value)) return '0,00';
  
  // Asegurarse de que el valor sea un número
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  if (isNaN(numValue)) return '0,00';
  
  // Formatear el número con separadores de miles y decimales y el símbolo $
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export default ClosureChecklist;