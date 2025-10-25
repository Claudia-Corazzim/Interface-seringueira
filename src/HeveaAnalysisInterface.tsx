import React, { useState, useCallback } from 'react';
import { Upload, BarChart3, TrendingUp, Download, Info, Brain } from 'lucide-react';
import Papa from 'papaparse';
import { PCA } from 'ml-pca';
import { kmeans } from 'ml-kmeans';
import PhenotypeAnalysis from './components/PhenotypeAnalysis';
import PythonMLResults from './components/PythonMLResults';

import { 
  ScatterChart, 
  Scatter as RechartsScatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,

} from 'recharts';

interface SNPData {
  id: string;
  [key: string]: string | number;
}

interface PCAResult {
  eigenvalues: number[];
  eigenvectors: number[][];
  projectedData: number[][];
  explainedVariance: number[];
}

interface ClusterResult {
  clusters: number[];
  centroids: number[][];
  assignments: number[];
}

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function HeveaAnalysisInterface() {
  const [data, setData] = useState<SNPData[]>([]);
  const [phenotypeData, setPhenotypeData] = useState<any[]>([]);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [numClusters, setNumClusters] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'pca' | 'clusters' | 'results' | 'pythonml' | 'phenotype'>('upload');
  const [chartType, setChartType] = useState<'scatter' | 'bar' | 'pie' | 'line'>('scatter');
  const [maxSampleSize, setMaxSampleSize] = useState<number>(0); // 0 = sem limite, processar tudo

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileUpload chamado', event);
    const file = event.target.files?.[0];
    console.log('Arquivo selecionado:', file);
    if (!file) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Carregando arquivo...');
    
    const parsedData: SNPData[] = [];
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true, // Use Web Worker para não travar a UI
      step: (result, parser) => {
        rowCount++;
        parsedData.push(result.data as SNPData);
        
        // Atualizar progresso a cada 50 linhas para feedback mais frequente
        if (rowCount % 50 === 0) {
          const progress = Math.min(90, (rowCount / 500) * 100); // Ajustado para arquivos grandes
          setLoadingProgress(progress);
          setLoadingMessage(`Processando: ${rowCount} linhas carregadas...`);
        }
        
        // Somente limitar se maxSampleSize > 0
        if (maxSampleSize > 0 && rowCount >= maxSampleSize) {
          parser.abort();
          console.log(`Amostragem limitada a ${maxSampleSize} linhas`);
        }
      },
      complete: () => {
        console.log('Parse completo:', parsedData.length, 'linhas processadas');
        setLoadingProgress(100);
        setLoadingMessage('Concluído!');
        setData(parsedData);
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
          setActiveTab('pca');
        }, 500);
      },
      error: (error) => {
        console.error('Erro ao processar arquivo:', error);
        setLoading(false);
        setLoadingProgress(0);
        alert(`Erro ao processar arquivo: ${error.message}`);
      }
    });
  }, [maxSampleSize]);

  const handlePhenotypeUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Carregando dados fenotípicos...');

    const parsedData: any[] = [];

    Papa.parse(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      step: (results, parser) => {
        parsedData.push(results.data);
        const progress = Math.min(90, Math.floor((parsedData.length / 500) * 90));
        setLoadingProgress(progress);
        setLoadingMessage(`Processando dados fenotípicos: ${parsedData.length} linhas...`);
      },
      complete: () => {
        console.log('Dados fenotípicos carregados:', parsedData.length, 'linhas');
        setLoadingProgress(100);
        setLoadingMessage('Dados fenotípicos carregados!');
        setPhenotypeData(parsedData);
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
          setActiveTab('phenotype');
        }, 500);
      },
      error: (error) => {
        console.error('Erro ao processar arquivo fenotípico:', error);
        setLoading(false);
        setLoadingProgress(0);
        alert(`Erro ao processar arquivo: ${error.message}`);
      }
    });
  }, []);

  const performPCA = useCallback(async () => {
    if (data.length === 0) return;

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Preparando dados para PCA...');
    
    try {
      // Dar tempo para UI atualizar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoadingProgress(10);
      setLoadingMessage('Extraindo colunas numéricas...');
      
      // Prepare numeric data matrix (excluding ID column)
      const numericColumns = Object.keys(data[0]).filter(key => key !== 'id' && !isNaN(Number(data[0][key])));
      
      console.log(`PCA: ${data.length} amostras x ${numericColumns.length} colunas`);
      
      // Para arquivos muito grandes, usar apenas primeiras N colunas SNP
      const MAX_SNPS = 5000; // Limite para evitar travar navegador
      const columnsToUse = numericColumns.length > MAX_SNPS 
        ? numericColumns.slice(0, MAX_SNPS) 
        : numericColumns;
      
      if (numericColumns.length > MAX_SNPS) {
        console.log(`Usando ${MAX_SNPS} de ${numericColumns.length} SNPs para PCA (otimização)`);
      }
      
      setLoadingProgress(20);
      setLoadingMessage(`Construindo matriz ${data.length}x${columnsToUse.length}...`);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Construir matriz em chunks para não travar
      const matrix: number[][] = [];
      const chunkSize = 50;
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        const matrixChunk = chunk.map(row => 
          columnsToUse.map(col => Number(row[col]) || 0)
        );
        matrix.push(...matrixChunk);
        
        const progress = 20 + (i / data.length) * 20;
        setLoadingProgress(progress);
        setLoadingMessage(`Processando linhas ${i + 1}-${Math.min(i + chunkSize, data.length)}...`);
        
        // Dar tempo para UI atualizar
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setLoadingProgress(50);
      setLoadingMessage('Executando análise PCA (pode levar alguns segundos)...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pca = new PCA(matrix);
      
      setLoadingProgress(70);
      setLoadingMessage('Projetando dados...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const projectedData = pca.predict(matrix);
      
      setLoadingProgress(85);
      setLoadingMessage('Finalizando cálculos...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result: PCAResult = {
        eigenvalues: Array.from(pca.getEigenvalues()),
        eigenvectors: pca.getEigenvectors().to2DArray(),
        projectedData: projectedData.to2DArray(),
        explainedVariance: Array.from(pca.getExplainedVariance())
      };

      setLoadingProgress(100);
      setLoadingMessage('PCA concluída!');
      setPcaResult(result);
      
      console.log('PCA concluída:', result.explainedVariance.slice(0, 3));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
      setLoadingProgress(0);
      setActiveTab('clusters');
    } catch (error) {
      console.error('Erro na análise PCA:', error);
      alert(`Erro na análise PCA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLoading(false);
      setLoadingProgress(0);
    }
  }, [data]);

  const performClustering = useCallback(async () => {
    if (!pcaResult) return;

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Preparando dados para clustering...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoadingProgress(30);
      setLoadingMessage('Extraindo componentes PCA...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Use first 2 PCA components for clustering
      const pcaData = pcaResult.projectedData.map(row => [row[0], row[1]]);
      
      setLoadingProgress(50);
      setLoadingMessage(`Executando K-means (k=${numClusters})...`);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = kmeans(pcaData, numClusters, { initialization: 'random' });

      setLoadingProgress(80);
      setLoadingMessage('Finalizando clusters...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const clusterData: ClusterResult = {
        clusters: result.clusters,
        centroids: result.centroids,
        assignments: result.clusters
      };

      setLoadingProgress(100);
      setLoadingMessage('Clustering concluído!');
      setClusterResult(clusterData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
      setLoadingProgress(0);
      setActiveTab('results');
    } catch (error) {
      console.error('Erro no clustering K-means:', error);
      alert(`Erro no clustering: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLoading(false);
      setLoadingProgress(0);
    }
  }, [pcaResult, numClusters]);

  const getVisualizationData = () => {
    if (!pcaResult || !clusterResult) return [];

    const vizData = pcaResult.projectedData.map((point, index) => ({
      x: point[0],
      y: point[1],
      cluster: clusterResult.assignments[index],
      id: data[index]?.id || `Sample ${index + 1}`
    }));
    
    console.log('Visualization Data:', vizData);
    return vizData;
  };

  const getClusterDistributionData = () => {
    if (!clusterResult) return [];

    const distribution = Array.from({ length: numClusters }, (_, i) => {
      const count = clusterResult.assignments.filter(c => c === i).length;
      return {
        name: `Cluster ${i + 1}`,
        value: count,
        percentage: ((count / data.length) * 100).toFixed(1)
      };
    });

    return distribution;
  };

  const getVarianceData = () => {
    if (!pcaResult) return [];

    const varianceData = pcaResult.explainedVariance.slice(0, 6).map((variance, index) => ({
      component: `PC${index + 1}`,
      variance: parseFloat((variance * 100).toFixed(2)),
      cumulative: pcaResult.explainedVariance.slice(0, index + 1)
        .reduce((sum, v) => sum + v, 0) * 100
    }));
    
    console.log('Variance Data:', varianceData);
    return varianceData;
  };

  const exportResults = () => {
    if (!pcaResult || !clusterResult) return;

    const exportData = data.map((row, index) => ({
      ...row,
      PC1: pcaResult.projectedData[index][0],
      PC2: pcaResult.projectedData[index][1],
      cluster: clusterResult.assignments[index]
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'hevea_analysis_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-rubber-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Análise Genômica da Seringueira
            </h1>
          </div>
          <p className="text-gray-600">
            Interface para análise de SNPs, PCA e clustering K-means em dados de <em>Hevea brasiliensis</em>
          </p>
        </header>

        {/* Loading Progress Bar */}
        {loading && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{loadingMessage}</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(loadingProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-rubber-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'upload', label: 'Upload de Dados', icon: Upload },
            { id: 'pca', label: 'Análise PCA', icon: TrendingUp },
            { id: 'clusters', label: 'Clustering', icon: BarChart3 },
            { id: 'phenotype', label: 'Dados Fenotípicos', icon: BarChart3 },
            { id: 'pythonml', label: '🐍 ML Python (Real)', icon: Brain },
            { id: 'results', label: 'Resultados', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-rubber-green-100 text-rubber-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'upload' && (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload dos Dados SNP</h3>
              <p className="text-gray-600 mb-4">
                Faça upload de um arquivo CSV contendo os dados de SNPs da seringueira
              </p>
              
              {/* Sample Size Control */}
              <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Amostragem (opcional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Para datasets grandes, limite o número de linhas para análise mais rápida. Deixe vazio para processar tudo.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    placeholder="Ex: 1000 (0 ou vazio = sem limite)"
                    value={maxSampleSize || ''}
                    onChange={(e) => setMaxSampleSize(e.target.value ? parseInt(e.target.value) : 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {maxSampleSize > 0 && (
                    <button
                      onClick={() => setMaxSampleSize(0)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#15803d';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#16a34a';
                }}
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Processando...' : 'Selecionar Arquivo CSV'}
              </label>
              {data.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ {data.length} amostras carregadas com sucesso!
                  </p>
                  {maxSampleSize && data.length >= maxSampleSize && (
                    <p className="text-sm text-green-700 mt-2">
                      ℹ️ Amostragem limitada a {maxSampleSize} linhas
                    </p>
                  )}
                  
                  {/* Banner de Direcionamento para Resultados Reais */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                    <p className="font-bold text-lg mb-2">🎯 Dados Carregados! Próximo Passo:</p>
                    <p className="text-sm mb-3">
                      Para ver os <strong>resultados científicos validados</strong> destes dados (Grid Search + Cross-Validation com scikit-learn):
                    </p>
                    <button
                      onClick={() => setActiveTab('pythonml')}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-md"
                    >
                      🐍 Ver Resultados Reais (ML Python)
                    </button>
                    <p className="text-xs mt-2 opacity-90">
                      * Ou navegue normalmente pelas abas PCA, Clustering, etc.
                    </p>
                  </div>
                </div>
              )}

              {/* Phenotype Upload Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-2">Upload dos Dados Fenotípicos (Opcional)</h3>
                <p className="text-gray-600 mb-4">
                  Faça upload de um arquivo CSV contendo dados fenotípicos (DAP, AP, etc.) para análise de correlações e predição de características
                </p>
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={handlePhenotypeUpload}
                  style={{ display: 'none' }}
                  id="phenotype-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="phenotype-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    borderRadius: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#3b82f6';
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {loading ? 'Processando...' : 'Selecionar Arquivo de Fenótipo'}
                </label>
                {phenotypeData.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 font-medium">
                      ✅ {phenotypeData.length} registros fenotípicos carregados!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pca' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Análise de Componentes Principais (PCA)</h3>
                <button
                  onClick={performPCA}
                  disabled={data.length === 0 || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: data.length === 0 || loading ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: data.length === 0 || loading ? 'not-allowed' : 'pointer',
                    opacity: data.length === 0 || loading ? 0.5 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (data.length > 0 && !loading) {
                      e.currentTarget.style.backgroundColor = '#15803d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (data.length > 0 && !loading) {
                      e.currentTarget.style.backgroundColor = '#16a34a';
                    }
                  }}
                >
                  <TrendingUp className="h-4 w-4" />
                  {loading ? 'Processando...' : 'Executar PCA'}
                </button>
              </div>

              {pcaResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Variância Explicada</h4>
                      <div className="space-y-2">
                        {pcaResult.explainedVariance.slice(0, 5).map((variance, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>PC{index + 1}:</span>
                            <span className="font-medium">{(variance * 100).toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Informações</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Amostras:</span>
                          <span className="font-medium">{data.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Componentes:</span>
                          <span className="font-medium">{pcaResult.eigenvalues.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variância Total (PC1-PC2):</span>
                          <span className="font-medium">
                            {((pcaResult.explainedVariance[0] + pcaResult.explainedVariance[1]) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PCA Visualization */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-4">📊 Gráfico de Variância dos Componentes Principais</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getVarianceData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="component" />
                          <YAxis label={{ value: 'Variância (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Variância Explicada']}
                            labelFormatter={(label) => `Componente: ${label}`}
                          />
                          <Bar dataKey="variance" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clusters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Clustering K-means</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="num-clusters" className="text-sm font-medium">
                      Número de clusters:
                    </label>
                    <input
                      id="num-clusters"
                      type="number"
                      min="2"
                      max="10"
                      value={numClusters}
                      onChange={(e) => setNumClusters(parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <button
                    onClick={performClustering}
                    disabled={!pcaResult || loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: !pcaResult || loading ? '#9ca3af' : '#16a34a',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: !pcaResult || loading ? 'not-allowed' : 'pointer',
                      opacity: !pcaResult || loading ? 0.5 : 1,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (pcaResult && !loading) {
                        e.currentTarget.style.backgroundColor = '#15803d';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pcaResult && !loading) {
                        e.currentTarget.style.backgroundColor = '#16a34a';
                      }
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    {loading ? 'Processando...' : 'Executar Clustering'}
                  </button>
                </div>
              </div>

              {!pcaResult && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                  <Info className="h-4 w-4" />
                  Execute primeiro a análise PCA para continuar com o clustering
                </div>
              )}
            </div>
          )}

          {activeTab === 'pythonml' && (
            <div className="space-y-6">
              <PythonMLResults />
            </div>
          )}

          {activeTab === 'phenotype' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Análise de Dados Fenotípicos</h3>
              {phenotypeData.length > 0 ? (
                <PhenotypeAnalysis 
                  phenotypeData={phenotypeData} 
                  markerData={data}
                />
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Nenhum dado fenotípico carregado. Faça upload na aba "Upload de Dados".
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados da Análise</h3>
                <button
                  onClick={exportResults}
                  disabled={!pcaResult || !clusterResult}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: !pcaResult || !clusterResult ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: !pcaResult || !clusterResult ? 'not-allowed' : 'pointer',
                    opacity: !pcaResult || !clusterResult ? 0.5 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (pcaResult && clusterResult) {
                      e.currentTarget.style.backgroundColor = '#15803d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pcaResult && clusterResult) {
                      e.currentTarget.style.backgroundColor = '#16a34a';
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exportar Resultados
                </button>
              </div>

              {/* Chart Type Selector */}
              {pcaResult && clusterResult && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Tipo de Visualização:</span>
                  {[
                    { id: 'scatter', label: 'Dispersão PCA', icon: '📊' },
                    { id: 'bar', label: 'Variância PC', icon: '📈' },
                    { id: 'pie', label: 'Distribuição Clusters', icon: '🥧' },
                    { id: 'line', label: 'Variância Acumulada', icon: '📉' }
                  ].map(chart => (
                    <button
                      key={chart.id}
                      onClick={() => setChartType(chart.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: chartType === chart.id ? '#dcfce7' : '#f3f4f6',
                        color: chartType === chart.id ? '#15803d' : '#4b5563',
                        border: chartType === chart.id ? '1px solid #86efac' : '1px solid transparent',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (chartType !== chart.id) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (chartType !== chart.id) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                    >
                      <span>{chart.icon}</span>
                      {chart.label}
                    </button>
                  ))}
                </div>
              )}

              {pcaResult && clusterResult && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Visualization */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* Charts */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-3">
                        {chartType === 'scatter' && '📊 Gráfico de Dispersão PCA'}
                        {chartType === 'bar' && '📈 Variância dos Componentes Principais'}
                        {chartType === 'pie' && '🥧 Distribuição dos Clusters'}
                        {chartType === 'line' && '📉 Variância Acumulada'}
                      </h5>
                      <div className="w-full h-[400px] border border-gray-200 rounded bg-white relative overflow-hidden">
                        {/* TESTE: Sempre mostrar algo visível */}
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded z-20">
                          TESTE: Container visível - Chart: {chartType}
                        </div>
                        
                        {chartType === 'scatter' ? (
                          <div className="w-full h-full p-4">
                            {pcaResult && clusterResult ? (
                              <div style={{ width: '100%', height: '100%', background: 'yellow' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart 
                                    data={getVisualizationData()}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      type="number"
                                      dataKey="x"
                                      name="PC1"
                                      domain={['dataMin - 1', 'dataMax + 1']}
                                    />
                                    <YAxis
                                      type="number"
                                      dataKey="y"
                                      name="PC2"
                                      domain={['dataMin - 1', 'dataMax + 1']}
                                    />
                                    <Tooltip
                                      formatter={(value, name) => [
                                        typeof value === 'number' ? value.toFixed(3) : value,
                                        name === 'x' ? 'PC1' : name === 'y' ? 'PC2' : name
                                      ]}
                                    />
                                    <RechartsScatter name="Amostras">
                                      {getVisualizationData().map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[clusterResult.assignments[index] % COLORS.length]} />
                                      ))}
                                    </RechartsScatter>
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full bg-green-200 text-gray-800">
                                <p>Execute PCA e Clustering primeiro</p>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {chartType === 'bar' ? (
                          <div className="w-full h-full p-4">
                            {pcaResult ? (
                              <div style={{ width: '100%', height: '100%', background: 'lightblue' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={getVarianceData()}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="component" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${value}%`, 'Variância']} />
                                    <Bar dataKey="variance" fill="#22c55e" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full bg-orange-200 text-gray-800">
                                <p>Execute a análise PCA primeiro</p>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {chartType === 'pie' ? (
                          <div className="w-full h-full p-4">
                            {clusterResult ? (
                              <div style={{ width: '100%', height: '100%', background: 'lightgreen' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={getClusterDistributionData()}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                                      outerRadius={100}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {getClusterDistributionData().map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full bg-purple-200 text-gray-800">
                                <p>Execute o clustering primeiro</p>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {chartType === 'line' ? (
                          <div className="w-full h-full p-4">
                            {pcaResult ? (
                              <div style={{ width: '100%', height: '100%', background: 'lightyellow' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart 
                                    data={getVarianceData()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="component" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value}%`, 'Variância Acumulada']} />
                                    <Line 
                                      type="monotone" 
                                      dataKey="cumulative" 
                                      stroke="#22c55e" 
                                      strokeWidth={3} 
                                      dot={{ r: 6, fill: '#22c55e' }} 
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full bg-pink-200 text-gray-800">
                                <p>Execute a análise PCA primeiro</p>
                              </div>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Debug Info */}
                        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/80 px-2 py-1 rounded z-10">
                          Tipo: {chartType} | PCA: {pcaResult ? '✓' : '✗'} | Cluster: {clusterResult ? '✓' : '✗'} | Dados: {
                            chartType === 'scatter' ? getVisualizationData().length :
                            chartType === 'bar' || chartType === 'line' ? getVarianceData().length :
                            chartType === 'pie' ? getClusterDistributionData().length : 0
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Estatísticas dos Clusters</h4>
                      <div className="space-y-3">
                        {Array.from({ length: numClusters }, (_, i) => {
                          const clusterSamples = clusterResult.assignments.filter(c => c === i).length;
                          const percentage = ((clusterSamples / data.length) * 100).toFixed(1);
                          return (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-sm">Cluster {i + 1}</span>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">{clusterSamples}</div>
                                <div className="text-gray-500">({percentage}%)</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Resumo da Análise</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total de amostras:</span>
                          <span className="font-medium">{data.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clusters identificados:</span>
                          <span className="font-medium">{numClusters}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variância PC1:</span>
                          <span className="font-medium">{(pcaResult.explainedVariance[0] * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variância PC2:</span>
                          <span className="font-medium">{(pcaResult.explainedVariance[1] * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(!pcaResult || !clusterResult) && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <Info className="h-4 w-4" />
                  Complete as análises PCA e clustering para visualizar os resultados
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}