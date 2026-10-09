/**
 * @fileoverview Componente para calcular dosis pediátricas de medicamentos
 * Este componente permite calcular dosis de medicamentos comunes para niños
 * basándose en su peso y la concentración del medicamento, así como calcular
 * volúmenes necesarios para tratamientos con antibióticos.
 * @author J.O.T.
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  FormHelperText,
  InputAdornment
} from '@mui/material';

/**
 * Componente principal para la calculadora de dosis pediátricas
 * Permite calcular dosis de ibuprofeno, paracetamol y antibióticos
 * @returns {JSX.Element} Componente de calculadora de dosis
 */
function DosageCalculator() {
  // Estados para el tipo de medicamento y sus parámetros
  const [medication, setMedication] = useState('ibuprofen');
  const [concentration, setConcentration] = useState('2');
  const [weight, setWeight] = useState('');
  const [dosage, setDosage] = useState(null);
  const [totalDaily, setTotalDaily] = useState(null);
  const [error, setError] = useState('');
  // Estados para el cálculo de jarabe antibiótico
  const [prescribedDose, setPrescribedDose] = useState('5');
  const [frequency, setFrequency] = useState('8');
  const [duration, setDuration] = useState('7');
  const [requiredVolume, setRequiredVolume] = useState(null);
  // Estados para la comparación de concentraciones de antibióticos
  const [originalConcentration, setOriginalConcentration] = useState('500');
  const [alternativeConcentration, setAlternativeConcentration] = useState('500');
const [allowAltDose, setAllowAltDose] = useState(false);
  const [alternativeDose, setAlternativeDose] = useState(null);
  const [alternativeVolume, setAlternativeVolume] = useState(null);

  /**
   * Configuraciones de medicamentos con sus dosis recomendadas
   * Incluye información sobre ibuprofeno, paracetamol y antibióticos
   * con sus respectivas concentraciones y dosis por kg de peso
   */
  const medications = {
    ibuprofen: {
      name: 'Ibuprofeno',
      dosagePerKg: 10,
      maxDailyPerKg: 30,
      frequency: '6-8 horas',
      concentrations: [
        { value: '2', label: '2% (20 mg/ml)' },
        { value: '4', label: '4% (40 mg/ml)' }
      ],
      source: 'Vademécum Pediátrico del Hospital Garrahan, 2023' // Add the source here
    },
    paracetamol: {
      name: 'Paracetamol',
      dosagePerKg: 15,
      maxDailyPerKg: 60,
      frequency: '6 horas',
      concentrations: [
        { value: '2', label: '2% (20 mg/ml)' }
      ],
      source: 'Vademécum Pediátrico del Hospital Garrahan, 2023'
    },
    antibiotic: {
      name: 'Antibiótico',
      isCustom: true,
      concentrations: [
        { value: '125', label: '125 mg/5ml' },
        { value: '250', label: '250 mg/5ml' },
        { value: '400', label: '400 mg/5ml' },
        { value: '500', label: '500 mg/5ml' },
        { value: '750', label: '750 mg/5ml' },
        { value: '1000', label: '1000 mg/5ml' }
      ],
      source: 'Guía de Dosificación de Antibióticos, Sociedad Argentina de Pediatría'
    }
  };

  /**
   * Efecto para calcular la dosis cuando cambian los inputs
   * Determina qué cálculo realizar según el tipo de medicamento seleccionado
   */
  useEffect(() => {
    if (medication === 'antibiotic') {
      // Si la concentración alternativa está deshabilitada, igualarla a la original
      if (!allowAltDose && alternativeConcentration !== originalConcentration) {
        setAlternativeConcentration(originalConcentration);
      }
      calculateAntibioticVolume();
    } else if (weight && !isNaN(weight) && parseFloat(weight) > 0) {
      calculateDosage();
      setError('');
    } else if (weight) {
      setError('Por favor ingrese un peso válido');
      setDosage(null);
      setTotalDaily(null);
    }
  }, [medication, concentration, weight, prescribedDose, duration, originalConcentration, alternativeConcentration, allowAltDose]);

// Ajuste automático de frecuencia SOLO cuando cambia la concentración
useEffect(() => {
  if (medication === 'antibiotic' && !allowAltDose) {
    const origConcNum = parseFloat(originalConcentration);
    if (origConcNum >= 750) {
      setFrequency('12');
    } else if (origConcNum === 500) {
      setFrequency('8');
    }
  }
}, [originalConcentration, allowAltDose, medication]);

  /**
   * Calcula la dosis de medicamento basada en el peso del niño
   * Aplica para ibuprofeno y paracetamol
   */
  const calculateDosage = () => {
    const med = medications[medication];
    const weightNum = parseFloat(weight);
    const concNum = parseFloat(concentration);
    
    // Calculate single dose in ml
    const singleDose = (weightNum * med.dosagePerKg) / (concNum * 10);
    setDosage(singleDose);
    
    // Calculate total daily dose
    const dailyDose = weightNum * med.maxDailyPerKg;
    setTotalDaily(dailyDose);
  };

  /**
   * Calcula el volumen total de antibiótico necesario para un tratamiento
   * También calcula dosis alternativas si se cambia la concentración
   */
  const calculateAntibioticVolume = () => {
    if (!prescribedDose || !frequency || !duration) {
      setRequiredVolume(null);
      setAlternativeDose(null);
      setAlternativeVolume(null);
      return;
    }

    const dosePerTime = parseFloat(prescribedDose);
    const timesPerDay = 24 / parseFloat(frequency);
    const days = parseFloat(duration);
    const origConc = parseFloat(originalConcentration);
    const altConc = parseFloat(alternativeConcentration);

    if (isNaN(dosePerTime) || isNaN(timesPerDay) || isNaN(days) || isNaN(origConc) || isNaN(altConc)) {
      setRequiredVolume(null);
      setAlternativeDose(null);
      setAlternativeVolume(null);
      return;
    }

    // Calculate total volume needed for the entire treatment with original concentration
    const totalVolume = dosePerTime * timesPerDay * days;
    setRequiredVolume(totalVolume);

    // Calculate mg per dose with original concentration
    // For antibiotics, the concentration is typically expressed as mg per 5ml
    const mgPerDose = (dosePerTime / 5) * origConc;
    
    // Calculate alternative dose to maintain the same mg per dose
    const altDosePerTime = (mgPerDose * 5) / altConc;
    setAlternativeDose(altDosePerTime);
    
    // Calculate alternative total volume
    const altTotalVolume = altDosePerTime * timesPerDay * days;
    setAlternativeVolume(altTotalVolume);
  };

  /**
   * Formatea el valor de la dosis a dos decimales
   * @param {number} value - Valor numérico a formatear
   * @returns {string} Valor formateado con dos decimales
   */
  const formatDosage = (value) => {
    if (value === null) return '';
    return value.toFixed(2);
  };

  /**
   * Obtiene el texto descriptivo de las dosis diarias
   * @returns {string} Texto con la información de dosis por día
   */
  const getDosesPerDay = () => {
    const med = medications[medication];
    if (medication === 'ibuprofen') {
      return '3 tomas de ' + formatDosage(dosage) + ' ml cada 8 horas';
    } else if (medication === 'paracetamol') {
      return '4 tomas de ' + formatDosage(dosage) + ' ml cada 6 horas';
    }
    return '';
  };

  /**
   * Determina el tamaño de frasco recomendado según el volumen necesario
   * @param {number} volume - Volumen total necesario en ml
   * @returns {string|number} Tamaño de frasco recomendado o texto con recomendación
   */
  const getRecommendedBottleSize = (volume) => {
    // Common antibiotic bottle sizes in ml
    const commonSizes = [60, 90, 100, 120, 150, 200, 240];
    
    // Find the smallest bottle size that can contain the required volume
    for (const size of commonSizes) {
      if (size >= volume) {
        return size;
      }
    }
    
    // If volume is larger than all common sizes, recommend the largest one
    // or suggest multiple bottles
    if (volume > commonSizes[commonSizes.length - 1]) {
      const largestSize = commonSizes[commonSizes.length - 1];
      const bottles = Math.ceil(volume / largestSize);
      return `${bottles} frascos de ${largestSize} ml`;
    }
    
    return commonSizes[commonSizes.length - 1];
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
        Calculadora de Dosis Pediátricas
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#f48fb1', fontStyle: 'italic', letterSpacing: '0.1em', textAlign: 'center', mb: 4 }}>
    
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parámetros de cálculo
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="medication-label">Medicamento</InputLabel>
              <Select
                labelId="medication-label"
                value={medication}
                label="Medicamento"
                onChange={(e) => setMedication(e.target.value)}
              >
                <MenuItem value="ibuprofen">Ibuprofeno</MenuItem>
                <MenuItem value="paracetamol">Paracetamol</MenuItem>
                <MenuItem value="antibiotic">Antibiótico</MenuItem>
              </Select>
            </FormControl>
            
            {medication !== 'antibiotic' ? (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="concentration-label">Concentración</InputLabel>
                  <Select
                    labelId="concentration-label"
                    value={concentration}
                    label="Concentración"
                    onChange={(e) => setConcentration(e.target.value)}
                  >
                    {medications[medication].concentrations.map((conc) => (
                      <MenuItem key={conc.value} value={conc.value}>
                        {conc.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {concentration === '2' ? '20 mg/ml' : '40 mg/ml'}
                  </FormHelperText>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Peso del niño"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  error={!!error}
                  helperText={error || ''}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  sx={{ mb: 2 }}
                />
              </>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="original-concentration-label">Concentración Original</InputLabel>
                  <Select
                    labelId="original-concentration-label"
                    value={originalConcentration}
                    label="Concentración Original"
                    onChange={(e) => setOriginalConcentration(e.target.value)}
                  >
                    {medications.antibiotic.concentrations.map((conc) => (
                      <MenuItem key={conc.value} value={conc.value}>
                        {conc.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  <FormControl fullWidth>
    <InputLabel id="alternative-concentration-label">Concentración Alternativa</InputLabel>
    <Select
      labelId="alternative-concentration-label"
      value={alternativeConcentration}
      label="Concentración Alternativa"
      onChange={(e) => setAlternativeConcentration(e.target.value)}
      disabled={!allowAltDose}
      sx={(theme) => !allowAltDose
        ? {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(80,80,80,0.4)' : '#f0f0f0',
            color: theme.palette.mode === 'dark' ? '#bbb' : undefined
          }
        : undefined}
    >
      {medications.antibiotic.concentrations.map((conc) => (
        <MenuItem key={conc.value} value={conc.value}>
          {conc.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
  <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
    <input
      type="checkbox"
      id="allowAltDose"
      checked={allowAltDose}
      onChange={e => setAllowAltDose(e.target.checked)}
      style={{ marginRight: 4 }}
    />
    <label htmlFor="allowAltDose" style={{ fontSize: '0.8em', color: '#888' }}>dosis diferente</label>
  </Box>
</Box>
                
                <TextField
                  fullWidth
                  label="Dosis prescrita"
                  type="number"
                  value={prescribedDose}
                  onChange={(e) => setPrescribedDose(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="frequency-label">Frecuencia</InputLabel>
                  <Select
                    labelId="frequency-label"
                    value={frequency}
                    label="Frecuencia"
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <MenuItem value="6">Cada 6 horas</MenuItem>
                    <MenuItem value="8">Cada 8 horas</MenuItem>
                    <MenuItem value="12">Cada 12 horas</MenuItem>
                    <MenuItem value="24">Cada 24 horas</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Duración del tratamiento"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">días</InputAdornment>,
                    inputProps: { min: 1, step: 1 }
                  }}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <Card sx={{ mb: 2, bgcolor: 'rgba(144, 202, 249, 0.08)' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {medication === 'antibiotic' ? 'Fórmula para antibiótico:' : 'Fórmula general:'}
                </Typography>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  textAlign: 'center'
                }}>
                  {medication === 'antibiotic' 
                    ? 'Volumen total = Dosis por toma × (24 ÷ Frecuencia en horas) × Días'
                    : 'Dosis por toma = (Peso en kg × mg/kg/dosis) ÷ Concentración (mg/ml)'}
                </Box>
                {medications[medication].source && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontStyle: 'italic', color: 'text.secondary' }}>
                    Fuente: {medications[medication].source}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resultados
            </Typography>
            
            {medication === 'antibiotic' ? (
              requiredVolume !== null ? (
                <>
                  <Card sx={{ mb: 2, bgcolor: 'rgba(244, 143, 177, 0.08)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Para un tratamiento de {duration} días con dosis de {prescribedDose} ml cada {frequency} horas:
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        • Concentración original ({originalConcentration} mg/5ml):
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 2, mb: 1 }}>
                        - Dosis por toma: {prescribedDose} ml
                      </Typography>
                      <Typography variant="body3" sx={{ ml: 0, mb: 1, fontWeight: 'bold', color: '#1976d2', bgcolor: '#e3f2fd', px: 2, py: 1, borderRadius: 2, fontSize: '1.2em', boxShadow: 2 }}>
  - Vol. total necesario: {formatDosage(requiredVolume)} ml
</Typography>
                      
                      {originalConcentration !== alternativeConcentration && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            • Concentración alternativa ({alternativeConcentration} mg/5ml):
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 2, mb: 1 }}>
                            - Dosis por toma: {formatDosage(alternativeDose)} ml
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 2, mb: 1 }}>
                            - Volumen total necesario: {formatDosage(alternativeVolume)} ml
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
                    Recomendaciones clave:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Usar jeringa graduada según la dosis indicada por el médico
                    </Typography>
                    <Typography component="li" variant="body2">
                      Una vez abierto el frasco, mantener el antibiótico refrigerado durante el tratamiento
                    </Typography>
                    <Typography component="li" variant="body2">
                      Agitar el frasco antes de administrar cada dosis
                    </Typography>
                    <Typography component="li" variant="body2">
                      Completar todo el tratamiento aunque los síntomas mejoren
                    </Typography>
                    {originalConcentration !== alternativeConcentration && (
                      <Typography component="li" variant="body2" sx={{ fontWeight: 'bold', color: '#f48fb1' }}>
                        Al cambiar la concentración, asegúrese de ajustar la dosis a {formatDosage(alternativeDose)} ml para mantener la misma dosis total diaria!
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Ingrese los datos del tratamiento para calcular el volumen necesario
                </Typography>
              )
            ) : (
              dosage !== null ? (
                <>
                  <Card sx={{ mb: 2, bgcolor: 'rgba(244, 143, 177, 0.08)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Para un niño de {weight} kg con dosis de {medications[medication].dosagePerKg} mg/kg cada {medications[medication].frequency}:
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold', 
                          color: '#1976d2', 
                          bgcolor: '#e3f2fd', 
                          px: 2, 
                          py: 1, 
                          borderRadius: 2, 
                          boxShadow: 2,
                          display: 'inline-block'
                        }}>
                          Dosis por toma: {formatDosage(dosage)} ml
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold', 
                          color: '#1976d2', 
                          bgcolor: '#e3f2fd', 
                          px: 2, 
                          py: 1, 
                          borderRadius: 2, 
                          boxShadow: 2,
                          display: 'inline-block'
                        }}>
                          Total diario: {getDosesPerDay()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
                    Recomendaciones clave:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Verificar la concentración en la etiqueta ({concentration === '2' ? '2% = 20 mg/ml' : '4% = 40 mg/ml'})
                    </Typography>
                    <Typography component="li" variant="body2">
                      Usar jeringa graduada según la dosis indicada por el médico
                    </Typography>
                    <Typography component="li" variant="body2">
                      No superar: {medications[medication].name} {medications[medication].maxDailyPerKg} mg/kg/día
                    </Typography>
                    <Typography component="li" variant="body2">
                      Consultar al médico si el niño pesa menos de 5 kg o tiene menos de 3 meses
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Ingrese el peso del niño para ver los resultados del cálculo
                </Typography>
              ))
            }
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DosageCalculator;