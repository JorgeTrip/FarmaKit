import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Alert, Stack, Paper, CircularProgress, Button } from '@mui/material';
import { CloudDownload as CloudDownloadIcon, RestartAlt as RestartAltIcon } from '@mui/icons-material';
import FileDropZone from './PriceUpdater/FileDropZone';
import ProductSearch from './PriceUpdater/ProductSearch';
import FurnitureTable from './PriceUpdater/FurnitureTable';
import { processReferenceFile } from './PriceUpdater/dataProcessors';
import * as XLSX from 'xlsx';

/**
 * @fileoverview Componente para buscar precios en una planilla de referencia
 * @author J.O.T.
 * @version 1.0.0
 */

/**
 * @description Componente principal para buscar precios en una planilla de referencia
 * @returns {JSX.Element} Componente de búsqueda de precios
 */
const PriceSearch = () => {
  // Estados para el archivo
  const [referenceFile, setReferenceFile] = useState(null);
  
  // Estados para los datos procesados
  const [referenceData, setReferenceData] = useState(null);
  
  // Estados para la interfaz
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isDraggingReference, setIsDraggingReference] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fileDate, setFileDate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * @description Maneja la carga del archivo de referencia
   * @param {File[]} acceptedFiles - Archivos aceptados por el dropzone
   */
  const handleReferenceFileUpload = useCallback((file) => {
    console.log('Archivo recibido:', file);
    
    if (file) {
      console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'bytes');
      
      setReferenceFile(file);
      setIsProcessing(true);
      setError(null);
      setInfo('Procesando archivo...');
      
      // Extraer la fecha del nombre del archivo si está en formato YYYY-MM-DD
      const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        console.log('Fecha encontrada en el nombre del archivo:', dateMatch[1]);
        setFileDate(dateMatch[1]);
      } else {
        // Si no hay fecha en el nombre, usar la fecha de modificación del archivo
        const modDate = new Date(file.lastModified);
        const formattedDate = modDate.toISOString().split('T')[0];
        console.log('Usando fecha de modificación del archivo:', formattedDate);
        setFileDate(formattedDate);
      }
      
      // Leer el archivo
      console.log('Iniciando lectura del archivo...');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('Archivo leído correctamente, procesando contenido...');
        try {
          const data = new Uint8Array(e.target.result);
          console.log('Datos binarios obtenidos, longitud:', data.length);
          
          console.log('Parseando archivo Excel...');
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('Hojas encontradas:', workbook.SheetNames);
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          console.log('Usando primera hoja:', firstSheetName);
          
          // Convertir a JSON con encabezados
          console.log('Convirtiendo hoja a formato JSON...');
          // Primero intentamos con encabezados automáticos
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Datos JSON obtenidos (con encabezados):', jsonData);
          
          if (jsonData.length === 0) {
            console.warn('No se pudieron obtener datos con encabezados, intentando sin encabezados...');
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            console.log('Datos JSON obtenidos (sin encabezados):', rawData);
            
            if (rawData.length === 0) {
              console.error('Error: El archivo no contiene datos');
              setError('El archivo no contiene datos. Verifique que no esté vacío.');
              setIsProcessing(false);
              return;
            }
          }
          
          // Procesar los datos directamente sin usar processReferenceFile
          console.log('Procesando datos directamente...');
          
          // Mapear los datos a un formato consistente
          const processedData = jsonData.map(row => {
            console.log('Procesando fila:', row);
            
            // Detectar las columnas según los nombres que vemos en la imagen
            const codigo = row.Codigo || row.codigo || row.COD || row.Id || row.ID || '';
            const droga = row.Droga || row.droga || row.Descripcion || row.descripcion || row.Producto || row.producto || '';
            const precio = row.PrecioActualizado || row.Precio || row.precio || row.PVP || row.pvp || row.PrecioAnterior || 0;
            const marca = row.Marca || row.marca || row.Laboratorio || row.laboratorio || '';
            
            return {
              Codigo: codigo,
              Droga: droga,
              Marca: marca,
              Precio: precio // Cambiado de PrecioActualizado a Precio
            };
          });
          
          console.log('Datos procesados:', processedData);
          
          if (processedData && processedData.length > 0) {
            console.log(`Procesamiento exitoso: ${processedData.length} productos encontrados`);
            setReferenceData(processedData);
            setInfo(`Se cargaron ${processedData.length} productos de la planilla de referencia.`);
            setError(null);
          } else {
            console.error('Error: No se pudieron procesar los datos');
            setError('No se pudieron procesar los datos de la planilla. Verifique el formato.');
          }
        } catch (error) {
          console.error('Error al procesar el archivo:', error);
          setError(`Error al procesar el archivo: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        setError('Error al leer el archivo. Verifique que no esté corrupto.');
        setIsProcessing(false);
      };
      
      // Iniciar la lectura del archivo
      console.log('Iniciando lectura del archivo como ArrayBuffer...');
      reader.readAsArrayBuffer(file);
    } else {
      console.warn('No se recibió un archivo válido');
    }
  }, []);
  
  /**
   * @description Maneja la búsqueda de productos
   * @param {string} term - Término de búsqueda
   */
  const handleSearch = useCallback((term) => {
    if (!term || !referenceData) {
      setSearchResults([]);
      return;
    }
    
    const normalizedTerm = term.toLowerCase().trim();
    
    // Buscar coincidencias en código, droga y marca
    const results = referenceData.filter(item => 
      (item.Codigo && item.Codigo.toString().toLowerCase().includes(normalizedTerm)) ||
      (item.Droga && item.Droga.toLowerCase().includes(normalizedTerm)) ||
      (item.Marca && item.Marca.toLowerCase().includes(normalizedTerm))
    );
    
    setSearchResults(results);
    
    if (results.length === 0) {
      setInfo(`No se encontraron productos que coincidan con "${term}".`);
    } else {
      setInfo(`Se encontraron ${results.length} productos que coinciden con "${term}".`);
    }
  }, [referenceData]);
  
  // Limpiar resultados cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setInfo(null);
    }
  }, [searchTerm]);
  
  /**
   * @description Reinicia el estado del componente
   */
  const handleReset = useCallback(() => {
    // Confirmar antes de reiniciar
    if (referenceData && !window.confirm('¿Está seguro de que desea volver a cargar? Se perderán los datos actuales.')) {
      return;
    }
    
    setReferenceFile(null);
    setReferenceData(null);
    setIsProcessing(false);
    setError(null);
    setInfo(null);
    setSearchTerm('');
    setSearchResults([]);
    setFileDate(null);
  }, [referenceData]);
  
  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
        Búsqueda de Precios
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#f48fb1', fontStyle: 'italic', letterSpacing: '0.1em', textAlign: 'center', mb: 4 }}>
        Consulte precios de productos en su planilla de referencia
      </Typography>
      
      {/* Zona de carga de archivo */}
      {!referenceData && (
        <>
          <FileDropZone
            onDrop={handleReferenceFileUpload}
            isDragActive={isDraggingReference}
            setIsDragActive={setIsDraggingReference}
            disabled={!!referenceFile || isProcessing}
            title="Cargar Planilla de Referencia"
            description="Arrastre aquí su planilla completa con precios"
            icon={<CloudDownloadIcon sx={{ fontSize: 40 }} />}
            file={referenceFile}
          />
          
          {/* Indicador de procesamiento */}
          {isProcessing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Procesando archivo...
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Mensajes de error e información */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 800, margin: '1rem auto' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Error al procesar el archivo:
          </Typography>
          <Typography variant="body1">{error}</Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Revise la consola del navegador (F12) para obtener más detalles sobre el error.
          </Typography>
        </Alert>
      )}
      
      {info && !error && (
        <Alert severity="info" sx={{ mb: 2, maxWidth: 800, margin: '1rem auto' }}>
          {info}
        </Alert>
      )}
      
      {/* Barra de búsqueda y resultados */}
      {referenceData && (
        <Box sx={{ mb: 4 }}>
          <ProductSearch 
            onSearch={handleSearch} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            placeholder="Buscar por código, droga o marca..."
          />
          
          {fileDate && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, mb: 2, color: 'text.secondary' }}>
              Precios actualizados al: {fileDate}
            </Typography>
          )}
          
          {/* Botón para volver a cargar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
              size="medium"
            >
              Volver a cargar archivo
            </Button>
          </Box>
          
          {searchResults.length > 0 && (
            <Paper sx={{ mt: 2, p: 2, maxHeight: 500, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Resultados de búsqueda
              </Typography>
              <FurnitureTable 
                title="Resultados" 
                data={searchResults} 
                highlightTerm={searchTerm}
              />
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PriceSearch;
