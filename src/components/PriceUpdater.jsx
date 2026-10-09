import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert,
  Stack,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Download as DownloadIcon,
  Search as SearchIcon,
  CloudDownload as CloudDownloadIcon,
  Edit as EditIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Importar componentes
import FileDropZone from './PriceUpdater/FileDropZone';
import ProductSearch from './PriceUpdater/ProductSearch';
import FurnitureTable from './PriceUpdater/FurnitureTable';
import FurnitureEditor from './PriceUpdater/FurnitureEditor';
import { 
  processReferenceFile, 
  processUpdateFile, 
  updatePrices, 
  processOffersFile,
  integrateOffers
} from './PriceUpdater/dataProcessors';

/**
 * @fileoverview Componente para actualizar precios en una planilla de referencia
 * @author J.O.T.
 * @version 1.0.0
 */

/**
 * @description Componente principal para actualizar precios en una planilla de referencia
 * @returns {JSX.Element} Componente de actualización de precios
 */
const PriceUpdater = () => {
  // Estados para los archivos
  const [referenceFile, setReferenceFile] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  const [offersFile, setOffersFile] = useState(null);
  
  // Estados para los datos procesados
  const [referenceData, setReferenceData] = useState(null);
  const [updateData, setUpdateData] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);
  const [productsWithoutFurniture, setProductsWithoutFurniture] = useState([]);
  const [availableFurnitures, setAvailableFurnitures] = useState([]);
  
  // Estados para la interfaz
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingReference, setIsDraggingReference] = useState(false);
  const [isDraggingUpdate, setIsDraggingUpdate] = useState(false);
  const [isDraggingOffers, setIsDraggingOffers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Identificar productos sin mueble, con mueble "NO" o con mueble no encontrado
  useEffect(() => {
    if (updatedData) {
      const withoutFurniture = updatedData.filter(item => 
        !item.Mueble || 
        item.Mueble === 'NO' || 
        item.Mueble === 'Sin mueble' ||
        item.Mueble === 'no encontrado' ||
        item.Mueble === 'NO ENCONTRADO' ||
        item.Mueble.toLowerCase().includes('no encontrado') ||
        item.Mueble.toLowerCase().includes('sin asignar') ||
        item.Mueble.toLowerCase().includes('sin mueble')
      );
      setProductsWithoutFurniture(withoutFurniture);
      
      // Extraer muebles únicos para sugerencias
      const furnitures = [...new Set(
        updatedData
          .map(item => item.Mueble)
          .filter(mueble => 
            mueble && 
            mueble !== 'NO' && 
            mueble !== 'Sin mueble' &&
            mueble !== 'no encontrado' &&
            mueble !== 'NO ENCONTRADO' &&
            !mueble.toLowerCase().includes('no encontrado') &&
            !mueble.toLowerCase().includes('sin asignar') &&
            !mueble.toLowerCase().includes('sin mueble')
          )
      )];
      setAvailableFurnitures(furnitures);
    }
  }, [updatedData]);
  
  /**
   * @description Verifica si un mueble es válido para mostrarse en las tablas
   * @param {string} mueble - Nombre del mueble a verificar
   * @returns {boolean} True si el mueble es válido, false en caso contrario
   */
  const isFurnitureValid = (mueble) => {
    if (!mueble) return false;
    
    const invalidPatterns = [
      'NO',
      'Sin mueble',
      'sin mueble',
      'no encontrado',
      'NO ENCONTRADO',
      'sin asignar'
    ];
    
    // Verificar si el mueble coincide exactamente con alguno de los patrones inválidos
    if (invalidPatterns.includes(mueble)) return false;
    
    // Verificar si el mueble contiene alguno de los patrones inválidos
    const lowerMueble = mueble.toLowerCase();
    return !invalidPatterns.some(pattern => lowerMueble.includes(pattern.toLowerCase()));
  };
  
  // Agrupar datos por mueble para mostrar en tablas separadas
  // Excluir productos con muebles inválidos de las tablas por mueble
  const furnitureGroups = updatedData ? 
    Object.entries(
      updatedData
        .filter(item => isFurnitureValid(item.Mueble))
        .reduce((groups, item) => {
          const furniture = item.Mueble;
          if (!groups[furniture]) groups[furniture] = [];
          groups[furniture].push(item);
          return groups;
        }, {})
    ) : [];

  /**
   * @description Maneja la carga del archivo de referencia (A)
   * @param {File} file - Archivo Excel de referencia
   */
  const handleReferenceFileUpload = useCallback((file) => {
    setIsProcessing(true);
    setError(null);
    setInfo("Procesando archivo de referencia...");
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error("El archivo de referencia no contiene datos suficientes");
        }
        
        const processedData = processReferenceFile(jsonData);
        setReferenceData(processedData);
        setReferenceFile(file);
        setInfo("Archivo de referencia cargado correctamente. Ahora cargue el archivo de actualización de precios.");
      } catch (err) {
        setError(`Error al procesar el archivo de referencia: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo de referencia");
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  }, []);

  /**
   * @description Maneja la carga del archivo de actualización (B)
   * @param {File} file - Archivo Excel con los nuevos precios
   */
  const handleUpdateFileUpload = useCallback((file) => {
    if (!referenceData) {
      setError("Primero debe cargar el archivo de referencia");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setInfo("Procesando archivo de actualización...");
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error("El archivo de actualización no contiene datos suficientes");
        }
        
        const processedData = processUpdateFile(jsonData);
        setUpdateData(processedData);
        setUpdateFile(file);
        
        // Actualizar los precios
        const { updatedData: updated, stats } = updatePrices(referenceData, processedData);
        setUpdatedData(updated);
        
        setInfo(`Precios actualizados correctamente. Se actualizaron ${stats.changed} de ${stats.total} productos.`);
        setIsProcessing(false);
      } catch (err) {
        console.error("Error al procesar el archivo de actualización:", err);
        setError(`Error al procesar el archivo de actualización: ${err.message}`);
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo de actualización");
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  }, [referenceData]);

  /**
   * @description Busca productos en los datos actualizados
   * @param {string} term - Término de búsqueda
   */
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term.trim() || !updatedData) {
      setSearchResults([]);
      return;
    }
    
    const normalizedTerm = term.toLowerCase().trim();
    const results = updatedData.filter(item => 
      (item.Codigo && item.Codigo.toString().toLowerCase().includes(normalizedTerm)) ||
      (item.Droga && item.Droga.toString().toLowerCase().includes(normalizedTerm)) ||
      (item.Marca && item.Marca.toString().toLowerCase().includes(normalizedTerm))
    );
    
    setSearchResults(results);
  }, [updatedData]);

  /**
   * @description Maneja la actualización de muebles de productos
   * @param {Array} updatedProducts - Productos con muebles actualizados
   */
  const handleFurnitureUpdate = useCallback((updatedProducts) => {
    if (!updatedData) return;
    
    // Crear un mapa para buscar productos por código rápidamente
    const productMap = new Map();
    updatedProducts.forEach(product => {
      productMap.set(product.Codigo, product.Mueble);
    });
    
    // Actualizar los muebles en todos los datos
    const newUpdatedData = updatedData.map(item => {
      if (productMap.has(item.Codigo)) {
        return { ...item, Mueble: productMap.get(item.Codigo) };
      }
      return item;
    });
    
    setUpdatedData(newUpdatedData);
    setInfo("Muebles actualizados correctamente");
  }, [updatedData]);

  /**
   * @description Descarga los datos actualizados como archivo Excel
   * @param {string} format - Formato del archivo (xlsx, xls, csv)
   * @param {boolean} byFurniture - Indica si se debe separar por mueble
   */
  const handleDownload = useCallback((format = 'xlsx', byFurniture = false) => {
    if (!updatedData || updatedData.length === 0) {
      setError("No hay datos para descargar");
      return;
    }
    
    try {
      // Obtener la fecha actual en formato AAAA-MM-DD
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Definir el orden de las columnas para la planilla de referencia
      const columnOrder = [
        'Codigo',
        'Droga',
        'PrecioAnterior',
        'Mueble',
        'Marca',
        'Diferencia',
        'PorcentajeCambio',
        'EsOferta',
        'PrecioActualizado'
      ];
      
      // Función para ordenar las columnas en el orden deseado
      const orderColumns = (data) => {
        return data.map(item => {
          const orderedItem = {};
          columnOrder.forEach(col => {
            orderedItem[col] = item[col] !== undefined ? item[col] : '';
          });
          return orderedItem;
        });
      };
      
      if (byFurniture) {
        // Crear un libro con una hoja por mueble para imprimir
        const wb = XLSX.utils.book_new();
        
        // Configuración para formato de impresión
        const printOptions = {
          // Configuración para página A4 (ancho: 210mm, alto: 297mm)
          'fitToPage': true,
          'fitToHeight': 0,
          'fitToWidth': 1,
          'paperSize': 9, // A4
          'orientation': 'portrait',
          'horizontalDpi': 300,
          'verticalDpi': 300,
          'pageMargins': { 'left': 0.7, 'right': 0.7, 'top': 0.75, 'bottom': 0.75, 'header': 0.3, 'footer': 0.3 }
        };
        
        furnitureGroups.forEach(([furniture, items]) => {
          // Crear un libro de Excel para esta hoja
          const ws = XLSX.utils.aoa_to_sheet([]);
          
          // Configurar ancho de columnas (en caracteres)
          ws['!cols'] = [
            { wch: 40 }, // Droga - columna ancha
            { wch: 25 }, // Marca - columna media
            { wch: 12 }  // Precio - columna estrecha
          ];
          
          // Formatear el título del mueble según las reglas especificadas
          let titleText = '';
          
          if (furniture.trim().toUpperCase() === 'PS') {
            titleText = 'Psicofármacos';
          } else if (furniture.trim().toUpperCase() === 'H') {
            titleText = 'Heladera';
          } else {
            titleText = `Mueble ${furniture.trim().toUpperCase()}`;
          }
          
          // Agregar el título del mueble en la primera fila (celda A1)
          XLSX.utils.sheet_add_aoa(ws, [[titleText]], { origin: 'A1' });
          
          // Agregar una fila vacía (fila 2)
          XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' });
          
          // Agregar los encabezados de la tabla (fila 3)
          XLSX.utils.sheet_add_aoa(ws, [['Droga', 'Marca', 'Precio']], { origin: 'A3' });
          
          // Preparar los datos de productos
          const productData = items.map(item => [
            item.Droga,
            item.Marca,
            item.PrecioActualizado || item.PrecioAnterior || ''
          ]);
          
          // Agregar los datos de productos a partir de la fila 4
          if (productData.length > 0) {
            XLSX.utils.sheet_add_aoa(ws, productData, { origin: 'A4' });
          }
          
          // Aplicar estilos a las celdas
          // Fusionar celdas para el título
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } } // Fusionar A1:C1 para el título
          ];
          
          // Configurar estilos para Excel
          // Nota: Estos estilos son para la visualización en Excel, no para la exportación
          
          // Estilo para el título (primera fila)
          ws['A1'] = { 
            v: titleText, // valor formateado
            t: 's', // tipo: string
            s: { // estilo
              font: { bold: true, sz: 16 },
              alignment: { horizontal: 'center', vertical: 'center' }
            }
          };
          
          // Estilos para los encabezados (fila 3)
          ['A3', 'B3', 'C3'].forEach(cell => {
            if (ws[cell]) {
              ws[cell].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'DDDDDD' } },
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                }
              };
            }
          });
          
          // Estilos alternados para las filas de datos (a partir de la fila 4)
          const lastRow = 3 + productData.length;
          for (let r = 4; r <= lastRow; r++) {
            const fillColor = r % 2 === 0 ? 'F5F5F5' : 'FFFFFF';
            
            ['A', 'B', 'C'].forEach(col => {
              const cell = `${col}${r}`;
              if (ws[cell]) {
                ws[cell].s = {
                  fill: { fgColor: { rgb: fillColor } },
                  border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                  }
                };
                
                // Alinear los precios a la derecha
                if (col === 'C') {
                  ws[cell].s.alignment = { horizontal: 'right' };
                }
              }
            });
          }
          
          // Nombre seguro para la hoja
          const safeFurnitureName = furniture.replace(/[\/\?\*\[\]]/g, '_').substring(0, 30);
          
          // Configurar opciones de impresión
          ws['!printHeader'] = [3, 3]; // Repetir la tercera fila como encabezado
          ws['!pageSetup'] = printOptions;
          
          // Agregar la hoja al libro
          XLSX.utils.book_append_sheet(wb, ws, safeFurnitureName);
        });
        
        // Guardar el archivo
        const wbout = XLSX.write(wb, { bookType: format, type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${currentDate}_Precios_para_imprimir.${format}`);
        
        setInfo(`Archivo para impresión descargado correctamente en formato ${format.toUpperCase()}`);
      } else {
        // Crear un libro con todos los datos en una sola hoja (incluidos los "NO")
        // Ordenar las columnas antes de crear la hoja
        const orderedData = orderColumns(updatedData);
        const ws = XLSX.utils.json_to_sheet(orderedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Precios Actualizados");
        
        const wbout = XLSX.write(wb, { bookType: format, type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${currentDate}_Referencia_precios.${format}`);
        
        setInfo(`Archivo de referencia descargado correctamente en formato ${format.toUpperCase()}`);
      }
    } catch (err) {
      setError(`Error al descargar el archivo: ${err.message}`);
    }
  }, [updatedData, furnitureGroups]);

  /**
   * @description Maneja la carga del archivo de ofertas
   * @param {File} file - Archivo Excel de ofertas
   */
  const handleOffersFileUpload = useCallback((file) => {
    if (!referenceData) {
      setError("Primero debe cargar el archivo de referencia");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setInfo("Procesando archivo de ofertas...");
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error("El archivo de ofertas no contiene datos suficientes");
        }
        
        // Procesar el archivo de ofertas
        const processedOffers = processOffersFile(jsonData);
        setOffersFile(file);
        
        // Integrar las ofertas con los datos de referencia
        const { updatedData: integrated, stats } = integrateOffers(referenceData, processedOffers);
        setUpdatedData(integrated);
        
        setInfo(`Ofertas integradas correctamente. Se procesaron ${stats.integrated} de ${stats.total} ofertas (${stats.newProducts} nuevos productos, ${stats.updated} actualizados).`);
        setIsProcessing(false);
      } catch (err) {
        console.error("Error al procesar el archivo de ofertas:", err);
        setError(`Error al procesar el archivo de ofertas: ${err.message}`);
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo de ofertas");
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  }, [referenceData]);

  /**
   * @description Limpia todos los datos y archivos
   */
  const handleClear = useCallback(() => {
    setReferenceFile(null);
    setUpdateFile(null);
    setOffersFile(null);
    setReferenceData(null);
    setUpdateData(null);
    setUpdatedData(null);
    setError(null);
    setInfo(null);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  /**
   * @description Reinicia el estado y vuelve a empezar
   */
  const handleReset = useCallback(() => {
    // Reiniciar archivos
    setReferenceFile(null);
    setUpdateFile(null);
    setOffersFile(null);
    
    // Reiniciar datos
    setReferenceData(null);
    setUpdateData(null);
    setUpdatedData(null);
    
    // Reiniciar estados de UI
    setError(null);
    setInfo(null);
    setIsProcessing(false);
    setIsDraggingReference(false);
    setIsDraggingUpdate(false);
    setIsDraggingOffers(false);
    
    // Reiniciar búsqueda
    setSearchTerm('');
    setSearchResults([]);
    
    // Reiniciar muebles
    setProductsWithoutFurniture([]);
    setAvailableFurnitures([]);
    
    // Mostrar mensaje informativo
    setInfo('Se ha reiniciado el proceso. Puede cargar nuevos archivos.');
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
        Actualización de Precios
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#f48fb1', fontStyle: 'italic', letterSpacing: '0.1em', textAlign: 'center', mb: 4 }}>
        Actualice precios en su planilla de referencia
      </Typography>
      
      {/* Zona de carga de archivos */}
      {!updatedData && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          <FileDropZone
            onDrop={handleReferenceFileUpload}
            isDragActive={isDraggingReference}
            setIsDragActive={setIsDraggingReference}
            disabled={!!referenceFile || isProcessing}
            title="Cargar Planilla de Referencia"
            description="Arrastre aquí su planilla completa con muebles y precios"
            icon={<CloudDownloadIcon sx={{ fontSize: 40 }} />}
            file={referenceFile}
          />
          
          {referenceFile && !updateFile && !offersFile && (
            <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
              Seleccione una de las siguientes opciones para actualizar precios:
            </Typography>
          )}
          
          <FileDropZone
            onDrop={handleUpdateFileUpload}
            isDragActive={isDraggingUpdate}
            setIsDragActive={setIsDraggingUpdate}
            disabled={!referenceFile || !!updateFile || !!offersFile || isProcessing}
            title="Cargar Planilla de Actualización"
            description="Arrastre aquí su planilla con los nuevos precios (con códigos)"
            icon={<UploadIcon sx={{ fontSize: 40 }} />}
            file={updateFile}
          />
          
          <FileDropZone
            onDrop={handleOffersFileUpload}
            isDragActive={isDraggingOffers}
            setIsDragActive={setIsDraggingOffers}
            disabled={!referenceFile || !!updateFile || !!offersFile || isProcessing}
            title="Cargar Planilla de Ofertas"
            description="Arrastre aquí su planilla de ofertas (sin códigos)"
            icon={<UploadIcon sx={{ fontSize: 40 }} color="secondary" />}
            file={offersFile}
            color="secondary"
          />
        </Stack>
      )}
      
      {/* Mensajes de error e información */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 800, margin: '0 auto' }}>
          {error}
        </Alert>
      )}
      
      {info && (
        <Alert severity="info" sx={{ mb: 2, maxWidth: 800, margin: '0 auto' }}>
          {info}
        </Alert>
      )}
      
      {/* Editor de muebles para productos sin mueble asignado o con mueble "NO" */}
      {updatedData && productsWithoutFurniture.length > 0 && (
        <FurnitureEditor 
          products={productsWithoutFurniture} 
          onSave={handleFurnitureUpdate}
          availableFurnitures={availableFurnitures}
        />
      )}

      {/* Búsqueda de productos y resultados */}
      {updatedData && (
        <Box sx={{ mb: 4 }}>
          <ProductSearch 
            onSearch={handleSearch} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            placeholder="Buscar por código, droga o marca..."
          />
          
          {searchResults.length > 0 && (
            <Paper sx={{ mt: 2, p: 2, maxHeight: 300, overflow: 'auto' }}>
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
      
      {/* Tablas por mueble */}
      {updatedData && !searchTerm && (
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Productos por mueble ({updatedData.filter(item => isFurnitureValid(item.Mueble)).length} productos en {furnitureGroups.length} muebles)
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Se muestran solo los productos con mueble válido. Los productos sin mueble o con muebles como "NO", "no encontrado", etc. se pueden editar en la sección superior.
          </Typography>
          
          {furnitureGroups.map(([furniture, items]) => (
            <FurnitureTable 
              key={furniture}
              title={furniture}
              data={items}
            />
          ))}
        </Box>
      )}

      {/* Botones de descarga y reinicio */}
      {updatedData && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 4, justifyContent: 'center' }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload('xlsx')}
          >
            Descargar Planilla Completa
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload('xlsx', true)}
          >
            Descargar Separado por Mueble
          </Button>
          
          <Button
            variant="contained"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            Volver a empezar
          </Button>
        </Stack>
      )}
      
      {/* Botón de reinicio siempre visible */}
      {!updatedData && (referenceFile || updateFile || offersFile) && (
        <Box mt={4} textAlign="center">
          <Button
            variant="contained"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            Volver a empezar
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PriceUpdater;
