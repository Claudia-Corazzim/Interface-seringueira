import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { trainRegressionModels, type RegressionResult } from '../utils/mlAlgorithms';

interface PhenotypeAnalysisProps {
  phenotypeData: any[];
  markerData: any[];
}

export default function PhenotypeAnalysis({ 
  phenotypeData, 
  markerData
}: PhenotypeAnalysisProps) {
  const [selectedTrait, setSelectedTrait] = useState<string>('DAP');
  const [correlationMatrix, setCorrelationMatrix] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [regressionResults, setRegressionResults] = useState<RegressionResult[]>([]);

  // Traits principais (excluindo erros-padrão)
  const mainTraits = ['DAP', 'AP', 'DAP lw', 'DAP ww', 'AP lw', 'AP ww'];

  useEffect(() => {
    if (phenotypeData.length > 0) {
      calculateStatistics();
      calculateCorrelations();
    }
  }, [phenotypeData]);

  const calculateStatistics = () => {
    const stats: any = {};
    
    mainTraits.forEach(trait => {
      const values = phenotypeData
        .map(row => parseFloat(row[trait]))
        .filter(v => !isNaN(v));
      
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        stats[trait] = {
          mean: mean.toFixed(4),
          std: std.toFixed(4),
          min: min.toFixed(4),
          max: max.toFixed(4),
          count: values.length
        };
      }
    });
    
    setStatistics(stats);
  };

  const calculateCorrelations = () => {
    const correlations: any = {};
    
    mainTraits.forEach(trait1 => {
      correlations[trait1] = {};
      
      mainTraits.forEach(trait2 => {
        const values1 = phenotypeData.map(row => parseFloat(row[trait1])).filter(v => !isNaN(v));
        const values2 = phenotypeData.map(row => parseFloat(row[trait2])).filter(v => !isNaN(v));
        
        if (values1.length === values2.length && values1.length > 0) {
          const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
          const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
          
          let numerator = 0;
          let denom1 = 0;
          let denom2 = 0;
          
          for (let i = 0; i < values1.length; i++) {
            const diff1 = values1[i] - mean1;
            const diff2 = values2[i] - mean2;
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
          }
          
          const correlation = numerator / Math.sqrt(denom1 * denom2);
          correlations[trait1][trait2] = correlation;
        }
      });
    });
    
    setCorrelationMatrix(correlations);
  };

  const getColorForCorrelation = (value: number) => {
    // Red (negative) to White (0) to Blue (positive)
    if (value < 0) {
      const intensity = Math.abs(value) * 255;
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    } else {
      const intensity = value * 255;
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    }
  };

  const generateDistributionData = (trait: string) => {
    const values = phenotypeData
      .map(row => parseFloat(row[trait]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);
    
    if (values.length === 0) return [];
    
    // Create histogram bins
    const bins = 20;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    const histogram: any[] = [];
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      
      histogram.push({
        bin: `${binStart.toFixed(2)}`,
        count,
        binCenter: (binStart + binEnd) / 2
      });
    }
    
    return histogram;
  };

  const handlePredictTrait = async () => {
    if (!markerData || markerData.length === 0) {
      alert('❌ Carregue os dados de marcadores SNP primeiro!');
      return;
    }
    
    if (!phenotypeData || phenotypeData.length === 0) {
      alert('❌ Nenhum dado fenotípico disponível!');
      return;
    }
    
    setIsAnalyzing(true);
    setRegressionResults([]);
    
    try {
      console.log('🎯 Iniciando predição de característica:', selectedTrait);
      
      // Extract features (SNP markers) - get numeric columns only
      const numericColumns = Object.keys(markerData[0]).filter(
        key => key !== 'id' && !isNaN(Number(markerData[0][key]))
      );
      
      console.log(`📊 ${markerData.length} amostras x ${numericColumns.length} SNPs`);
      
      // Limit to 5000 SNPs for performance
      const selectedColumns = numericColumns.slice(0, 5000);
      
      const features: number[][] = markerData.map(sample =>
        selectedColumns.map(col => Number(sample[col]) || 0)
      );
      
      // Extract target values (phenotype trait)
      const target: number[] = phenotypeData.map(sample => {
        const value = sample[selectedTrait];
        return typeof value === 'string' ? parseFloat(value) : value;
      }).filter(val => !isNaN(val));
      
      console.log(`🎯 Target (${selectedTrait}): ${target.length} valores`);
      
      // Check if sample sizes match
      if (features.length !== target.length) {
        console.warn(`⚠️ Tamanhos diferentes: ${features.length} marcadores vs ${target.length} fenótipos`);
        
        // Take minimum length
        const minLength = Math.min(features.length, target.length);
        features.splice(minLength);
        target.splice(minLength);
        
        console.log(`✂️ Ajustado para ${minLength} amostras`);
      }
      
      if (target.length < 10) {
        alert('❌ Dados insuficientes para treinamento (mínimo 10 amostras)');
        setIsAnalyzing(false);
        return;
      }
      
      // Train regression models
      const results = await trainRegressionModels(
        features,
        target,
        ['Linear Regression', 'Ridge Regression', 'Random Forest'],
        0.3
      );
      
      setRegressionResults(results);
      
      console.log('✅ Treinamento concluído!', results);
      
    } catch (error) {
      console.error('❌ Erro durante predição:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (phenotypeData.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhum dado fenotípico carregado
        </h3>
        <p className="text-gray-500">
          Faça upload do arquivo fenotipo.csv na aba Upload
        </p>
      </div>
    );
  }

  const distributionData = generateDistributionData(selectedTrait);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-7 h-7 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            📊 Análise de Dados Fenotípicos
          </h2>
        </div>
        <p className="text-gray-600">
          {phenotypeData.length} amostras × {mainTraits.length} traços principais
        </p>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Estatísticas Descritivas
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold">Traço</th>
                  <th className="px-4 py-3 text-right font-semibold">Média</th>
                  <th className="px-4 py-3 text-right font-semibold">Desvio Padrão</th>
                  <th className="px-4 py-3 text-right font-semibold">Mínimo</th>
                  <th className="px-4 py-3 text-right font-semibold">Máximo</th>
                  <th className="px-4 py-3 text-right font-semibold">N</th>
                </tr>
              </thead>
              <tbody>
                {mainTraits.map(trait => (
                  <tr key={trait} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-700">{trait}</td>
                    <td className="px-4 py-3 text-right font-mono">{statistics[trait]?.mean}</td>
                    <td className="px-4 py-3 text-right font-mono">{statistics[trait]?.std}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{statistics[trait]?.min}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{statistics[trait]?.max}</td>
                    <td className="px-4 py-3 text-right font-mono">{statistics[trait]?.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Nota:</strong> Valores próximos de 0 indicam normalização Z-score (média ≈ 0, desvio padrão ≈ 1)
            </p>
          </div>
        </div>
      )}

      {/* Correlation Heatmap */}
      {correlationMatrix && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            Matriz de Correlação (Heatmap)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 border"></th>
                  {mainTraits.map(trait => (
                    <th key={trait} className="px-2 py-2 text-center text-xs font-semibold border">
                      {trait}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mainTraits.map(trait1 => (
                  <tr key={trait1}>
                    <td className="px-2 py-2 font-semibold text-xs bg-gray-50 border">{trait1}</td>
                    {mainTraits.map(trait2 => {
                      const corr = correlationMatrix[trait1]?.[trait2];
                      return (
                        <td 
                          key={trait2}
                          className="px-2 py-2 text-center text-xs font-mono border transition-all hover:scale-110 cursor-pointer"
                          style={{ 
                            backgroundColor: corr !== undefined ? getColorForCorrelation(corr) : 'white',
                            fontWeight: Math.abs(corr) > 0.7 ? 'bold' : 'normal'
                          }}
                          title={`Correlação ${trait1} vs ${trait2}: ${corr?.toFixed(3)}`}
                        >
                          {corr !== undefined ? corr.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border"></div>
              <span>Correlação negativa forte (&lt; -0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border"></div>
              <span>Sem correlação (~0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border"></div>
              <span>Correlação positiva forte (&gt; 0.7)</span>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Histogram */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Distribuição de Valores
          </h3>
          <select
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mainTraits.map(trait => (
              <option key={trait} value={trait}>{trait}</option>
            ))}
          </select>
        </div>
        
        {distributionData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="bin" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {statistics && statistics[selectedTrait] && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-purple-50 rounded-lg">
            <div>
              <span className="text-gray-600 text-sm">Média:</span>
              <div className="font-bold text-lg">{statistics[selectedTrait].mean}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Desvio Padrão:</span>
              <div className="font-bold text-lg">{statistics[selectedTrait].std}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Mínimo:</span>
              <div className="font-bold text-lg text-red-600">{statistics[selectedTrait].min}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Máximo:</span>
              <div className="font-bold text-lg text-green-600">{statistics[selectedTrait].max}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Amostras (N):</span>
              <div className="font-bold text-lg">{statistics[selectedTrait].count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-xl font-bold mb-4">🎯 Predição de Traços Fenotípicos</h3>
        <p className="text-gray-700 mb-4">
          Use os marcadores SNP como <strong>features</strong> para treinar modelos que predizem os valores fenotípicos (<strong>targets</strong>)
        </p>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <select
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mainTraits.map(trait => (
              <option key={trait} value={trait}>Predizer: {trait}</option>
            ))}
          </select>
          
          <button
            onClick={handlePredictTrait}
            disabled={isAnalyzing || markerData.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isAnalyzing ? '⏳ Analisando...' : '🚀 Treinar Modelo'}
          </button>
        </div>
        
        {markerData.length === 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              ⚠️ <strong>Atenção:</strong> Carregue os dados de marcadores SNP primeiro (MarcadoresMod.csv)
            </p>
          </div>
        )}
        
        {markerData.length > 0 && !isAnalyzing && regressionResults.length === 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              ✅ {markerData.length} amostras de marcadores carregadas e prontas para treinamento!
            </p>
          </div>
        )}
        
        {/* Regression Results */}
        {regressionResults.length > 0 && (
          <div className="mt-6 space-y-6">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Resultados da Predição de {selectedTrait}
            </h4>
            
            {/* Models Comparison Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      R² Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RMSE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MAE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo (ms)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {regressionResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-bold ${result.r2Score > 0.7 ? 'text-green-600' : result.r2Score > 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(result.r2Score * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {result.rmse.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {result.mae.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.trainingTime.toFixed(0)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Best Model Highlight */}
            {regressionResults.length > 0 && (() => {
              const bestModel = regressionResults.reduce((best, current) => 
                current.r2Score > best.r2Score ? current : best
              );
              
              return (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h5 className="font-semibold text-gray-900">Melhor Modelo: {bestModel.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        R² = {(bestModel.r2Score * 100).toFixed(2)}% | 
                        RMSE = {bestModel.rmse.toFixed(4)} | 
                        MAE = {bestModel.mae.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {bestModel.r2Score > 0.7 
                          ? '🎉 Excelente capacidade preditiva! O modelo explica mais de 70% da variação.'
                          : bestModel.r2Score > 0.4
                          ? '✅ Boa capacidade preditiva. O modelo captura padrões significativos.'
                          : '⚠️ Capacidade preditiva moderada. Considere mais dados ou feature engineering.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Scatter Plot: Predicted vs Actual */}
            {regressionResults.length > 0 && (() => {
              const bestModel = regressionResults.reduce((best, current) => 
                current.r2Score > best.r2Score ? current : best
              );
              
              const scatterData = bestModel.actualValues.map((actual, i) => ({
                actual,
                predicted: bestModel.predictions[i],
                name: `Amostra ${i + 1}`
              }));
              
              return (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3">
                    Predito vs Real ({bestModel.name})
                  </h5>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="actual" 
                        name="Valor Real"
                        label={{ value: 'Valor Real', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="predicted" 
                        name="Valor Predito"
                        label={{ value: 'Valor Predito', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis range={[50, 50]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
                      />
                      <Scatter 
                        name={selectedTrait} 
                        data={scatterData} 
                        fill="#3b82f6"
                        opacity={0.6}
                      />
                      {/* Perfect prediction line */}
                      <Scatter 
                        name="Linha Ideal"
                        data={[
                          { actual: Math.min(...scatterData.map(d => d.actual)), predicted: Math.min(...scatterData.map(d => d.actual)) },
                          { actual: Math.max(...scatterData.map(d => d.actual)), predicted: Math.max(...scatterData.map(d => d.actual)) }
                        ]}
                        fill="#ef4444"
                        line={{ stroke: '#ef4444', strokeWidth: 2 }}
                        shape="cross"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Pontos azuis: predições do modelo | Linha vermelha: predição perfeita (predito = real)
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
