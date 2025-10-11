import React, { useState, useCallback, useEffect } from 'react';
import { Upload, BarChart3, TrendingUp, Download, Dna, Play, Settings } from 'lucide-react';

// Material You Components
import { AppLayout, TopAppBar, NavigationTabs, ContentContainer, ContentSection, Grid, StatusIndicator } from '../components/Layout';
import { Card, CardHeader, CardContent, CardActions } from '../components/Card';
import { Button, IconButton } from '../components/Button';
import Charts from '../components/Charts';

// Analysis Utils
import Papa from 'papaparse';
import { PCA } from 'ml-pca';
import { kmeans } from 'ml-kmeans';

// Interfaces
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

export default function HeveaAnalysisInterface() {
  const [activeTab, setActiveTab] = useState<'upload' | 'pca' | 'clusters' | 'results'>('upload');
  const [data, setData] = useState<SNPData[]>([]);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [numClusters, setNumClusters] = useState(3);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'upload', label: 'Dados', icon: <Upload size={20} /> },
    { id: 'pca', label: 'PCA', icon: <TrendingUp size={20} /> },
    { id: 'clusters', label: 'Clustering', icon: <BarChart3 size={20} /> },
    { id: 'results', label: 'Resultados', icon: <Download size={20} /> }
  ];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as SNPData[];
        setData(parsedData);
        setLoading(false);
        setActiveTab('pca');
      },
      error: (error: any) => {
        console.error('Erro ao processar arquivo:', error);
        setLoading(false);
      }
    });
  }, []);

  const loadSampleData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/sample-data/hevea_snp_sample.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as SNPData[];
          setData(parsedData);
          setLoading(false);
          setActiveTab('pca');
        },
        error: (error: any) => {
          console.error('Erro ao carregar dados de exemplo:', error);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro ao buscar arquivo de exemplo:', error);
      setLoading(false);
    }
  }, []);

  const performPCA = useCallback(() => {
    if (data.length === 0) return;

    setLoading(true);
    
    try {
      console.log('PCA: Iniciando análise com', data.length, 'amostras');
      
      const numericColumns = Object.keys(data[0]).filter(key => key !== 'id' && !isNaN(Number(data[0][key])));
      console.log('PCA: Colunas numéricas encontradas:', numericColumns.length);
      
      const matrix = data.map(row => 
        numericColumns.map(col => Number(row[col]) || 0)
      );
      
      console.log('PCA: Matriz criada:', matrix.length, 'x', matrix[0]?.length);

      const pca = new PCA(matrix);
      const projectedData = pca.predict(matrix);
      
      const result: PCAResult = {
        eigenvalues: Array.from(pca.getEigenvalues()),
        eigenvectors: pca.getEigenvectors().to2DArray(),
        projectedData: projectedData.to2DArray(),
        explainedVariance: Array.from(pca.getExplainedVariance())
      };

      console.log('PCA: Resultado gerado:', {
        eigenvalues: result.eigenvalues.length,
        projectedData: result.projectedData.length,
        explainedVariance: result.explainedVariance.slice(0, 3)
      });

      setPcaResult(result);
      setActiveTab('clusters');
    } catch (error) {
      console.error('Erro na análise PCA:', error);
    } finally {
      setLoading(false);
    }
  }, [data]);

  const performClustering = useCallback(() => {
    if (!pcaResult) return;

    setLoading(true);
    
    try {
      console.log('Clustering: Iniciando com', numClusters, 'clusters');
      
      const pcaData = pcaResult.projectedData.map(row => [row[0], row[1]]);
      console.log('Clustering: Dados PCA preparados:', pcaData.length, 'pontos');
      
      const result = kmeans(pcaData, numClusters, { initialization: 'random' });
      console.log('Clustering: Resultado K-means:', result.clusters.length, 'assignments');

      const clusterData: ClusterResult = {
        clusters: result.clusters,
        centroids: result.centroids,
        assignments: result.clusters
      };

      console.log('Clustering: Dados finais:', {
        assignments: clusterData.assignments.length,
        centroids: clusterData.centroids.length,
        uniqueClusters: [...new Set(clusterData.assignments)]
      });

      setClusterResult(clusterData);
      setActiveTab('results');
    } catch (error) {
      console.error('Erro no clustering K-means:', error);
    } finally {
      setLoading(false);
    }
  }, [pcaResult, numClusters]);

  // Preparar dados para os gráficos
  const getPCAChartData = () => {
    if (!pcaResult || !clusterResult) return [];
    
    return pcaResult.projectedData.map((point, index) => ({
      x: Number(point[0]) || 0,
      y: Number(point[1]) || 0,
      cluster: clusterResult.assignments[index] || 0,
      id: data[index]?.id || `Sample ${index + 1}`
    }));
  };

  const getClusterChartData = () => {
    if (!clusterResult) return [];

    return Array.from({ length: numClusters }, (_, i) => {
      const count = clusterResult.assignments.filter(c => c === i).length;
      return {
        name: `Cluster ${i + 1}`,
        value: count,
        percentage: parseFloat(((count / data.length) * 100).toFixed(1))
      };
    });
  };

  const getVarianceChartData = () => {
    if (!pcaResult) return [];

    return pcaResult.explainedVariance.slice(0, 6).map((variance, index) => ({
      component: `PC${index + 1}`,
      variance: parseFloat((variance * 100).toFixed(2)),
      cumulative: parseFloat((pcaResult.explainedVariance.slice(0, index + 1)
        .reduce((sum, v) => sum + v, 0) * 100).toFixed(2))
    }));
  };

  // Carregar dados de exemplo automaticamente na inicialização
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Carregar dados de exemplo
        await loadSampleData();
      } catch (error) {
        console.error('Erro ao carregar dados de exemplo:', error);
      }
    };

    initializeApp();
  }, [loadSampleData]);

  // Executar análises automaticamente quando os dados estiverem carregados
  useEffect(() => {
    if (data.length > 0 && !pcaResult) {
      performPCA();
    }
  }, [data, pcaResult, performPCA]);

  useEffect(() => {
    if (pcaResult && !clusterResult) {
      performClustering();
    }
  }, [pcaResult, clusterResult, performClustering]);

  // Navegar automaticamente para a aba de resultados quando as análises estiverem prontas
  useEffect(() => {
    if (pcaResult && clusterResult && activeTab === 'upload') {
      setActiveTab('results');
    }
  }, [pcaResult, clusterResult, activeTab]);

  return (
    <AppLayout>
      <TopAppBar 
        title="Análise Genômica da Seringueira"
        navigationIcon={<Dna size={24} />}
        actions={
          <>
            <IconButton ariaLabel="Configurações">
              <Settings size={20} />
            </IconButton>
          </>
        }
      />
      
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        tabs={tabs}
      />

      <ContentContainer>
        {/* Status Summary */}
        <ContentSection>
          <Card>
            <CardContent>
              <Grid columns={4}>
                <StatusIndicator 
                  variant={data.length > 0 ? 'success' : 'info'}
                  icon={<Upload size={16} />}
                >
                  {data.length > 0 ? `${data.length} amostras` : 'Aguardando dados'}
                </StatusIndicator>
                
                <StatusIndicator 
                  variant={pcaResult ? 'success' : 'info'}
                  icon={<TrendingUp size={16} />}
                >
                  PCA {pcaResult ? 'Concluído' : 'Pendente'}
                </StatusIndicator>
                
                <StatusIndicator 
                  variant={clusterResult ? 'success' : 'info'}
                  icon={<BarChart3 size={16} />}
                >
                  Clustering {clusterResult ? 'Concluído' : 'Pendente'}
                </StatusIndicator>
                
                <StatusIndicator 
                  variant={pcaResult && clusterResult ? 'success' : 'info'}
                  icon={<Download size={16} />}
                >
                  {pcaResult && clusterResult ? 'Resultados prontos' : 'Aguardando análises'}
                </StatusIndicator>
              </Grid>
            </CardContent>
          </Card>
        </ContentSection>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <ContentSection>
            <Grid columns={2}>
              <Card>
                <CardHeader 
                  title="Upload de Dados"
                  subtitle="Carregue seus dados de SNPs em formato CSV"
                />
                <CardContent>
                  <div className="text-center py-8">
                    <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="mb-6 text-gray-600">
                      Selecione um arquivo CSV com dados de SNPs da seringueira
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={loading}
                    />
                    
                    <div className="space-y-3">
                      <label htmlFor="file-upload">
                        <Button variant="filled" disabled={loading}>
                          <Upload size={16} />
                          {loading ? 'Processando...' : 'Selecionar Arquivo'}
                        </Button>
                      </label>
                      
                      <div className="text-gray-500">ou</div>
                      
                      <Button 
                        variant="tonal" 
                        onClick={loadSampleData}
                        disabled={loading}
                      >
                        <Play size={16} />
                        Usar Dados de Exemplo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader 
                  title="Formato dos Dados"
                  subtitle="Estrutura esperada do arquivo CSV"
                />
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Estrutura do CSV:</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Primeira coluna: ID da amostra</li>
                        <li>• Demais colunas: Marcadores SNP (valores 0 ou 1)</li>
                        <li>• Primeira linha: Cabeçalhos das colunas</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Exemplo:</h4>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        id,SNP_1,SNP_2,SNP_3{'\n'}
                        RRIM_600_001,1,0,1{'\n'}
                        GT1_001,0,1,0
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </ContentSection>
        )}

        {activeTab === 'pca' && (
          <ContentSection>
            <Card>
              <CardHeader 
                title="Análise de Componentes Principais (PCA)"
                subtitle="Reduza a dimensionalidade dos dados de SNPs"
              />
              <CardContent>
                {data.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      Carregue os dados primeiro para executar a análise PCA
                    </p>
                    <Button 
                      variant="outlined"
                      onClick={() => setActiveTab('upload')}
                    >
                      Ir para Upload
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                        <div className="text-sm text-gray-600">Amostras</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {Object.keys(data[0] || {}).length - 1}
                        </div>
                        <div className="text-sm text-gray-600">Marcadores SNP</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {pcaResult ? pcaResult.explainedVariance.length : '?'}
                        </div>
                        <div className="text-sm text-gray-600">Componentes</div>
                      </div>
                    </div>

                    {pcaResult && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">✅ Análise PCA Concluída</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">PC1 explica:</span>
                            <span className="font-medium ml-1">
                              {(pcaResult.explainedVariance[0] * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-green-700">PC2 explica:</span>
                            <span className="font-medium ml-1">
                              {(pcaResult.explainedVariance[1] * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardActions>
                <Button
                  variant="filled"
                  onClick={performPCA}
                  disabled={data.length === 0 || loading}
                >
                  <TrendingUp size={16} />
                  {loading ? 'Processando...' : 'Executar PCA'}
                </Button>
              </CardActions>
            </Card>
          </ContentSection>
        )}

        {activeTab === 'clusters' && (
          <ContentSection>
            <Card>
              <CardHeader 
                title="Análise de Clustering K-means"
                subtitle="Agrupe as amostras baseado nos componentes principais"
              />
              <CardContent>
                {!pcaResult ? (
                  <div className="text-center py-8">
                    <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      Execute a análise PCA primeiro para continuar com o clustering
                    </p>
                    <Button 
                      variant="outlined"
                      onClick={() => setActiveTab('pca')}
                    >
                      Ir para PCA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número de Clusters
                      </label>
                      <select
                        value={numClusters}
                        onChange={(e) => setNumClusters(Number(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {[2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    {clusterResult && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">✅ Clustering Concluído</h4>
                        <p className="text-sm text-green-700">
                          {data.length} amostras organizadas em {numClusters} clusters
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardActions>
                <Button
                  variant="filled"
                  onClick={performClustering}
                  disabled={!pcaResult || loading}
                >
                  <BarChart3 size={16} />
                  {loading ? 'Processando...' : 'Executar Clustering'}
                </Button>
              </CardActions>
            </Card>
          </ContentSection>
        )}

        {activeTab === 'results' && (
          <ContentSection>
            {!pcaResult || !clusterResult ? (
              <Card>
                <CardHeader 
                  title="Resultados da Análise"
                  subtitle="Visualize e exporte os resultados das análises"
                />
                <CardContent>
                  <div className="text-center py-8">
                    <Download size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Análises Pendentes</h3>
                    <p className="text-gray-600 mb-6">
                      Complete as análises PCA e clustering para visualizar os resultados
                    </p>
                    
                    <div className="flex gap-2 justify-center">
                      {!pcaResult && (
                        <Button
                          variant="outlined"
                          onClick={() => setActiveTab('pca')}
                        >
                          Ir para PCA
                        </Button>
                      )}
                      {pcaResult && !clusterResult && (
                        <Button
                          variant="outlined"
                          onClick={() => setActiveTab('clusters')}
                        >
                          Ir para Clustering
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader 
                    title="Visualizações Interativas"
                    subtitle="Explore seus dados genômicos com múltiplos tipos de gráficos"
                  />
                  <CardActions>
                    <Button variant="tonal">
                      <Download size={16} />
                      Exportar Dados
                    </Button>
                    <Button variant="outlined">
                      <Download size={16} />
                      Salvar Gráfico
                    </Button>
                  </CardActions>
                </Card>

                <Charts
                  pcaData={getPCAChartData()}
                  clusterData={getClusterChartData()}
                  varianceData={getVarianceChartData()}
                  numClusters={numClusters}
                />

                <Grid columns={3}>
                  <Card elevated>
                    <CardHeader title="Resumo da Análise" />
                    <CardContent>
                      <div className="space-y-3 text-sm">
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
                    </CardContent>
                  </Card>

                  <Card elevated>
                    <CardHeader title="Qualidade da Análise" />
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Variância acumulada (PC1-PC2):</span>
                          <span className="font-medium">
                            {((pcaResult.explainedVariance[0] + pcaResult.explainedVariance[1]) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Componentes totais:</span>
                          <span className="font-medium">{pcaResult.explainedVariance.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Marcadores SNP:</span>
                          <span className="font-medium">{Object.keys(data[0] || {}).length - 1}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card elevated>
                    <CardHeader title="Distribuição dos Clusters" />
                    <CardContent>
                      <div className="space-y-2">
                        {getClusterChartData().map((cluster, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                              />
                              <span>{cluster.name}</span>
                            </div>
                            <span className="font-medium">{cluster.value} ({cluster.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </div>
            )}
          </ContentSection>
        )}
      </ContentContainer>
    </AppLayout>
  );
}