import React, { useState, useCallback, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FileUpload as FileUploadIcon,
  TableChart as TableChartIcon,
  Sort as SortIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * @fileoverview Componente para procesar archivos Excel y asignar muebles a productos
 * @author J.O.T.
 * @version 1.0.0
 */

/**
 * @description Componente que permite arrastrar y soltar archivos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onDrop - Función que se ejecuta cuando se suelta un archivo
 * @param {React.ReactNode} props.children - Contenido del componente
 * @param {boolean} props.isDragActive - Indica si hay un archivo siendo arrastrado sobre el componente
 * @param {boolean} props.disabled - Indica si el componente está deshabilitado
 * @returns {JSX.Element} Componente de zona para arrastrar y soltar archivos
 */
const DropZone = ({ onDrop, children, isDragActive, disabled }) => {
  /**
   * @description Maneja el evento de arrastrar sobre el componente
   * @param {React.DragEvent} e - Evento de arrastre
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * @description Maneja el evento de soltar un archivo en el componente
   * @param {React.DragEvent} e - Evento de soltar
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onDrop(files[0]);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        width: '100%',
        border: '2px dashed',
        borderColor: disabled ? 'rgba(255, 255, 255, 0.2)' : isDragActive ? '#90caf9' : 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        p: 3,
        transition: 'all 0.2s ease',
        backgroundColor: isDragActive ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        '&:hover': {
          borderColor: disabled ? 'rgba(255, 255, 255, 0.2)' : '#90caf9',
          backgroundColor: disabled ? 'transparent' : 'rgba(144, 202, 249, 0.04)'
        }
      }}
    >
      {children}
    </Box>
  );
};

/**
 * @description Componente principal para procesar archivos Excel y asignar muebles a productos
 * @returns {JSX.Element} Componente de procesamiento de archivos
 */
const FileProcessor = () => {
  /** @type {[Array|null, Function]} Estado para almacenar los datos procesados */
  const [data, setData] = useState(null);
  /** @type {[string|null, Function]} Estado para almacenar mensajes de error */
  const [error, setError] = useState(null);
  /** @type {[Array|null, Function]} Estado para almacenar los datos de referencia de muebles */
  const [referenceData, setReferenceData] = useState(null);
  /** @type {[boolean, Function]} Estado para controlar la visibilidad de los botones de carga */
  const [showUploadButtons, setShowUploadButtons] = useState(true);
  /** @type {[HTMLElement|null, Function]} Estado para el menú de descarga */
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  /** @type {[string, Function]} Estado para la dirección de ordenamiento */
  const [sortDirection, setSortDirection] = useState('desc');
  /** @type {[boolean, Function]} Estado para indicar si se está arrastrando un archivo de referencia */
  const [isDraggingReference, setIsDraggingReference] = useState(false);
  /** @type {[boolean, Function]} Estado para indicar si se está arrastrando un archivo de entrada */
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  /** @type {[boolean, Function]} Estado para indicar si se está descargando el archivo de referencia */
  const [isDownloadingReference, setIsDownloadingReference] = useState(false);
  /** @type {[string|null, Function]} Estado para almacenar mensajes de información */
  const [info, setInfo] = useState(null);
  /** @type {[boolean, Function]} Estado para indicar si el archivo de referencia ha sido descargado exitosamente */
  const [referenceDownloaded, setReferenceDownloaded] = useState(false);
  /** @type {[boolean, Function]} Estado para indicar si se ha mostrado el mensaje de ubicación del archivo */
  const [showLocationMessage, setShowLocationMessage] = useState(false);

  /**
   * @description Normaliza los códigos de producto para facilitar la comparación
   * @param {string|number} code - Código a normalizar
   * @returns {string} Código normalizado
   */
  const normalizeCode = (code) => {
    if (!code) return '';
    return String(code).trim().toUpperCase();
  };

  /**
   * @description Verifica si el tipo de archivo es válido para el procesamiento
   * @param {File} file - Archivo a verificar
   * @returns {boolean} Indica si el tipo de archivo es válido
   */
  const isValidFileType = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.ods'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  };

  /**
   * @description Normaliza los encabezados de las columnas para facilitar la identificación
   * @param {string} header - Encabezado a normalizar
   * @returns {string} Encabezado normalizado
   */
  const normalizeHeader = (header) => {
    return String(header)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  /**
   * @description Identifica la columna de código de producto usando múltiples criterios
   * @param {Object} row - Fila de datos para analizar
   * @returns {string|null} Nombre de la columna de código o null si no se encuentra
   */
  const identifyCodeColumn = (row) => {
    // Criterios para identificar la columna de código
    const possibleColumns = [];
    
    // Criterio 1: Nombre de columna contiene 'cod'
    for (const key in row) {
      const normalizedKey = normalizeHeader(key);
      if (normalizedKey.includes('cod')) {
        possibleColumns.push({
          key,
          priority: 1, // Alta prioridad para columnas con 'cod' en el nombre
          reason: 'Nombre contiene "cod"'
        });
      }
    }
    
    // Criterio 2: Contenido son números de 4 dígitos
    for (const key in row) {
      const value = String(row[key]);
      if (/^\d{4}$/.test(value)) {
        possibleColumns.push({
          key,
          priority: 2, // Prioridad media para columnas con valores de 4 dígitos
          reason: 'Contiene números de 4 dígitos'
        });
      }
    }
    
    // Criterio 3: Nombres específicos conocidos (para compatibilidad con versiones anteriores)
    const knownCodeColumns = ['CodProducto', 'COD', 'Código', 'Codigo', 'Code'];
    for (const key in row) {
      if (knownCodeColumns.includes(key) || knownCodeColumns.some(known => normalizeHeader(key) === normalizeHeader(known))) {
        possibleColumns.push({
          key,
          priority: 0, // Máxima prioridad para nombres conocidos
          reason: 'Nombre de columna conocido'
        });
      }
    }
    
    // Si no encontramos nada, intentar con la primera columna que parezca un código
    if (possibleColumns.length === 0) {
      for (const key in row) {
        const value = String(row[key]);
        // Buscar cualquier valor alfanumérico que parezca un código
        if (/^[A-Z0-9]{3,6}$/i.test(value)) {
          possibleColumns.push({
            key,
            priority: 3, // Baja prioridad
            reason: 'Formato similar a un código'
          });
        }
      }
    }
    
    // Ordenar por prioridad (menor número = mayor prioridad)
    possibleColumns.sort((a, b) => a.priority - b.priority);
    
    // Registrar las columnas candidatas para depuración
    console.log('Columnas candidatas para código:', possibleColumns);
    
    // Devolver la columna con mayor prioridad, o null si no hay candidatos
    return possibleColumns.length > 0 ? possibleColumns[0].key : null;
  };

  /**
 * @description Descarga el archivo de referencia desde la URL predefinida
 */
const handleDownloadReference = async () => {
  setIsDownloadingReference(true);
  setError(null);
  setInfo('Descargando archivo de referencia...');
  
  try {
    // URL del archivo de ejemplo incluido en el proyecto
    const response = await fetch('./data/Referencia_mueble_14-04-25.xlsx');
    if (!response.ok) {
      throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // Procesar el archivo descargado
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
    
    if (jsonData.length === 0) {
      throw new Error('El archivo de referencia está vacío');
    }
    
    // Normalizar los datos
    const headers = jsonData[0];
    let codigoKey = 'B', muebleKey = 'A';
    
    Object.keys(headers).forEach(key => {
      const normalized = normalizeHeader(headers[key]);
      if (normalized.includes('codigo ord 1')) codigoKey = key;
      if (normalized.includes('mueble')) muebleKey = key;
    });
    
    const normalizedData = jsonData.slice(1).map(row => ({
      mueble: row[muebleKey],
      codigo: normalizeCode(row[codigoKey])
    }));
    
    console.log('Datos de referencia descargados:', normalizedData);
    setReferenceData(normalizedData);
    setInfo('Archivo de referencia descargado y procesado correctamente');
    // Marcar que el archivo de referencia ha sido descargado exitosamente
    setReferenceDownloaded(true);
    
    // Guardar una copia local del archivo
    saveAs(
      new Blob([data], { type: 'application/octet-stream' }),
      'Referencia.xlsx'
    );
    
    // Limpiar el mensaje de información después de 5 segundos
    setTimeout(() => {
      setInfo(null);
    }, 5000);
  } catch (err) {
    console.error('Error al descargar el archivo de referencia:', err);
    setError(`Error al descargar el archivo de referencia: ${err.message}`);
    setReferenceDownloaded(false);
  } finally {
    setIsDownloadingReference(false);
  }
};

const handleReferenceFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (!isValidFileType(file)) {
        setError('Por favor, selecciona un archivo Excel o OpenOffice (.xlsx, .xls, .ods)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

          if (jsonData.length === 0) {
            throw new Error('El archivo de referencia está vacío');
          }

          // Normalizar códigos en los datos de referencia
          // Asumimos que el código está en la columna B y el mueble en la columna A
          // Add this helper function at the top of the component
          const normalizeHeader = (header) => {
            return String(header)
              .trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
          };
          
          // In handleReferenceFileUpload, modify the processing logic:
          const headers = jsonData[0];
          let codigoKey = 'B', muebleKey = 'A';
          
          Object.keys(headers).forEach(key => {
            const normalized = normalizeHeader(headers[key]);
            if (normalized.includes('codigo ord 1')) codigoKey = key;
            if (normalized.includes('mueble')) muebleKey = key;
          });
          
          // Keep only one normalizedData declaration
          const normalizedData = jsonData.slice(1).map(row => ({
            mueble: row[muebleKey],
            codigo: normalizeCode(row[codigoKey])
          }));

          console.log('Datos de referencia:', normalizedData);
          setReferenceData(normalizedData);
          setError(null);
        } catch (err) {
          console.error('Error al procesar el archivo de referencia:', err);
          setError('Error al procesar el archivo. Verifica que el formato sea correcto y contenga las columnas necesarias.');
        }
      };

      reader.onerror = () => {
        setError('Error al leer el archivo. Intenta nuevamente.');
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      setError('Error al procesar el archivo. Por favor, intenta nuevamente.');
    }
  };

  const handleInputFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!referenceData) {
      setError('Por favor, carga primero el archivo de referencia de muebles.');
      return;
    }

    try {
      if (!isValidFileType(file)) {
        setError('Por favor, selecciona un archivo Excel o OpenOffice (.xlsx, .xls, .ods)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error('El archivo está vacío');
          }

          // Identificar la columna de código en la primera fila
          const firstRow = jsonData[0];
          const codeColumnName = identifyCodeColumn(firstRow);
          
          if (!codeColumnName) {
            throw new Error('No se pudo identificar la columna de código en el archivo. Verifica el formato.');
          }
          
          console.log('Columna de código identificada:', codeColumnName);

          // Procesar datos y colocar mueble como primera columna
          const processedData = jsonData.map(row => {
            const normalizedCode = normalizeCode(row[codeColumnName]);
            console.log('Buscando código:', normalizedCode);
            const reference = referenceData.find(ref => ref.codigo === normalizedCode);
            console.log('Referencia encontrada:', reference);
            
            // Crear nuevo objeto con mueble como primera propiedad
            return {
              Mueble: reference ? reference.mueble : 'No encontrado',
              ...row
            };
          });

          setData(processedData);
          setError(null);
          setShowUploadButtons(false);
        } catch (err) {
          console.error('Error al procesar el archivo:', err);
          setError(`Error al procesar el archivo: ${err.message}`);
        }
      };

      reader.onerror = () => {
        setError('Error al leer el archivo. Intenta nuevamente.');
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      setError('Error al procesar el archivo. Por favor, intenta nuevamente.');
    }
  };

  const handleDownload = (format) => {
    if (!data) return;

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");
      
      let fileName = "resultados";
      switch(format) {
        case 'xls':
          fileName += '.xls';
          XLSX.writeFile(wb, fileName, { bookType: 'biff2' });
          break;
        case 'ods':
          fileName += '.ods';
          XLSX.writeFile(wb, fileName, { bookType: 'ods' });
          break;
        default: // xlsx
          fileName += '.xlsx';
          XLSX.writeFile(wb, fileName);
      }
    } catch (err) {
      console.error('Error al descargar el archivo:', err);
      setError('Error al generar el archivo de descarga. Por favor, intenta nuevamente.');
    }
    setDownloadAnchorEl(null);
  };

  const handleClear = () => {
    setData(null);
    setReferenceData(null);
    setError(null);
    setInfo(null);
    setShowUploadButtons(true);
    setReferenceDownloaded(false);
    setIsDraggingReference(false);
    setIsDraggingInput(false);
    setShowLocationMessage(false);
  };

  const handleSort = () => {
    if (!data) return;

    const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newDirection);

    const sortedData = [...data].sort((a, b) => {
      if (newDirection === 'asc') {
        return a.Mueble.localeCompare(b.Mueble);
      } else {
        return b.Mueble.localeCompare(a.Mueble);
      }
    });

    setData(sortedData);
  };

  const handleReferenceFileDrop = useCallback((file) => {
    if (isValidFileType(file)) {
      handleReferenceFileUpload({ target: { files: [file] } });
    } else {
      setError('Por favor, arrastra un archivo Excel o OpenOffice (.xlsx, .xls, .ods)');
    }
  }, []);

  const handleInputFileDrop = useCallback((file) => {
    if (!referenceData) {
      setError('Por favor, carga primero el archivo de referencia de muebles.');
      return;
    }
    if (isValidFileType(file)) {
      handleInputFileUpload({ target: { files: [file] } });
    } else {
      setError('Por favor, arrastra un archivo Excel o OpenOffice (.xlsx, .xls, .ods)');
    }
  }, [referenceData]);

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%', 
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center' }}>
        {showUploadButtons ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: '#90caf9', textAlign: 'center' }}>
              Pasos para procesar el archivo:
            </Typography>
            <Typography variant="body1" component="ol" align= "left" sx={{ pl: 2, mb: 4 }}>
              <li>Carga el archivo de referencia de muebles (.xls o .xlsx)</li>
              <li>Carga el archivo de precios a procesar (.xls o .xlsx)</li>
              <li>Descarga el archivo resultante con la columna de muebles agregada</li>
            </Typography>
            
            <Box sx={{ mb: 3, p: 2, border: '1px solid rgba(144, 202, 249, 0.5)', borderRadius: 1, backgroundColor: 'rgba(144, 202, 249, 0.08)' }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#90caf9', textAlign: 'center' }}>
                ¿No tienes el archivo de referencia? Puedes descargarlo automáticamente:
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  handleDownloadReference();
                  setShowLocationMessage(true);
                }}
                disabled={isDownloadingReference || referenceDownloaded}
                startIcon={isDownloadingReference ? <CircularProgress size={20} color="inherit" /> : <CloudDownloadIcon />}
                sx={{ 
                  width: '100%',
                  borderColor: '#90caf9',
                  color: '#90caf9',
                  '&:hover': { 
                    backgroundColor: 'rgba(144, 202, 249, 0.08)',
                    borderColor: '#64b5f6' 
                  }
                }}
              >
                {isDownloadingReference ? 'Descargando...' : referenceDownloaded ? 'Archivo descargado' : 'Descargar archivo de referencia'}
              </Button>
              
              {/* Mensaje informativo sobre la ubicación del archivo o el estado del proceso */}
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#f48fb1', textAlign: 'center' }}>
                {referenceDownloaded 
                  ? 'El archivo fue descargado y procesado correctamente' 
                  : showLocationMessage 
                    ? 'El archivo se guardará en tu carpeta de Descargas' 
                    : ''}
              </Typography>
            </Box>
            
            <Stack spacing={3} direction="column" sx={{ width: '100%', maxWidth: 600, alignItems: 'stretch' }}>
              <DropZone
                onDrop={handleReferenceFileDrop}
                isDragActive={isDraggingReference}
                disabled={referenceDownloaded}
              >
                <Stack spacing={2} alignItems="center">
                  <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1 }}>
                    {referenceDownloaded ? 'Archivo de referencia ya cargado ✓' : 'Arrastra aquí el archivo de referencia de muebles o'}
                  </Typography>
                  <Tooltip title="Selecciona el archivo que contiene la referencia de muebles" arrow>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<FileUploadIcon />}
                      color="primary"
                      disabled={referenceDownloaded}
                      sx={{ 
                        backgroundColor: '#90caf9',
                        '&:hover': { backgroundColor: '#64b5f6' },
                        py: 2
                      }}
                    >
                      {referenceDownloaded ? 'Archivo de referencia cargado ✓' : 'Paso 1: Seleccionar archivo de referencia'}
                      <input
                        type="file"
                        hidden
                        accept=".xlsx,.xls"
                        onChange={handleReferenceFileUpload}
                        // Mostrar mensaje informativo al hacer clic
                        onClick={() => {
                          // Mostrar un mensaje informativo más detallado sobre la ubicación del archivo
                          setInfo('Busca el archivo en tu carpeta de Descargas. El sistema operativo abrirá el explorador de archivos, pero deberás navegar manualmente a la carpeta de Descargas donde encontrarás el archivo de referencia si lo has descargado anteriormente.');
                          // Limpiar el mensaje después de 10 segundos para dar tiempo suficiente para leerlo
                          setTimeout(() => {
                            setInfo(null);
                          }, 10000);
                        }}
                      />
                    </Button>
                  </Tooltip>
                </Stack>
              </DropZone>
              
              <DropZone
                onDrop={handleInputFileDrop}
                isDragActive={isDraggingInput}
                disabled={!referenceData}
              >
                <Stack spacing={2} alignItems="center">
                  <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1 }}>
                    {referenceData ? '✓ Ahora arrastra aquí el archivo de precios o' : 'Arrastra aquí el archivo de precios o'}
                  </Typography>
                  <Tooltip title="Selecciona el archivo de precios que deseas procesar" arrow>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<TableChartIcon />}
                      disabled={!referenceData}
                      color="secondary"
                      sx={{ 
                        backgroundColor: '#f48fb1',
                        '&:hover': { backgroundColor: '#f06292' },
                        py: 2
                      }}
                    >
                      {referenceData ? 'Paso 2: Seleccionar archivo de precios ➤' : 'Paso 2: Seleccionar archivo de precios'}
                      <input
                        type="file"
                        hidden
                        accept=".xlsx,.xls"
                        onChange={handleInputFileUpload}
                      />
                    </Button>
                  </Tooltip>
                </Stack>
              </DropZone>
            </Stack>
          </>
        ) : (
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', width: '100%', flexWrap: 'wrap', gap: 1 }}>
            <Tooltip title="Ordenar por mueble" arrow>
              <Button
                variant="contained"
                color="info"
                startIcon={<SortIcon />}
                onClick={handleSort}
                sx={{ 
                  backgroundColor: '#4fc3f7',
                  '&:hover': { backgroundColor: '#29b6f6' }
                }}
              >
                {`Ordenar ${sortDirection === 'desc' ? '↑' : '↓'}`}
              </Button>
            </Tooltip>
            <Tooltip title="Descargar archivo procesado" arrow>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={(e) => setDownloadAnchorEl(e.currentTarget)}
                sx={{ 
                  backgroundColor: '#90caf9',
                  '&:hover': { backgroundColor: '#64b5f6' }
                }}
              >
                Descargar resultados
              </Button>
            </Tooltip>
            <Menu
              anchorEl={downloadAnchorEl}
              open={Boolean(downloadAnchorEl)}
              onClose={() => setDownloadAnchorEl(null)}
            >
              <MenuItem onClick={() => handleDownload('xlsx')}>Guardar como XLSX</MenuItem>
              <MenuItem onClick={() => handleDownload('xls')}>Guardar como XLS</MenuItem>
              <MenuItem onClick={() => handleDownload('ods')}>Guardar como ODS</MenuItem>
            </Menu>
            <Tooltip title="Volver a empezar" arrow>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={handleClear}
                sx={{ 
                  backgroundColor: '#f48fb1',
                  '&:hover': { backgroundColor: '#f06292' }
                }}
              >
                Volver a empezar
              </Button>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, margin: '0 auto' }}>
          {error}
        </Alert>
      )}
      
      {info && (
        <Alert severity="info" sx={{ mb: 2, maxWidth: 600, margin: '0 auto' }}>
          {info}
        </Alert>
      )}
      
      {/* Botón de Restablecer siempre visible */}
      {(referenceData || data || error || info) && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={handleClear}
          >
            Restablecer
          </Button>
        </Box>
      )}

      {data && (
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 404,
            maxWidth: '900px',
            mt: 2,
            '& .MuiPaper-root': {
              boxShadow: 'none'
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Object.keys(data[0]).map((key) => (
                  <TableCell 
                    key={key}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#2d2d2d'
                    }}
                  >
                    {key}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {Object.values(row).map((value, cellIndex) => (
                    <TableCell key={cellIndex}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FileProcessor;

// When processing the Excel rows:
const processExcelData = (data) => {
  // Get headers from first row
  const headers = data[0];
  
  // Find column indexes dynamically
  let codigoIndex = -1;
  let muebleIndex = -1;

  headers.forEach((header, index) => {
    const normalizedHeader = header.trim().toLowerCase();
    
    if (normalizedHeader.includes('código ord 1')) {
      codigoIndex = index;
    }
    if (normalizedHeader.includes('mueble')) {
      muebleIndex = index;
    }
  });

  // Validate required columns
  if (codigoIndex === -1 || muebleIndex === -1) {
    throw new Error('Columnas requeridas no encontradas en el archivo');
  }

  // Process remaining rows using found indexes
  return data.slice(1).map((row) => ({
    codigo: row[codigoIndex],
    mueble: row[muebleIndex]
  }));
};