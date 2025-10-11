import { useState, useCallback } from 'react';
import {
  UploadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Layout, Typography, Card, Button, Upload, message, Statistic, Row, Col, Divider, InputNumber, Steps, Tabs, Empty } from 'antd';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { PCA } from 'ml-pca';
import { kmeans } from 'ml-kmeans';
import { 
  ScatterChart, 
  Scatter as RechartsScatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import '../styles/HeveaAnalysis.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

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

interface ClusterStats {
  size: number;
  meanPC1: number;
  meanPC2: number;
  variance: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function HeveaAnalysisInterface() {
  const [data, setData] = useState<SNPData[]>([]);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [numClusters, setNumClusters] = useState(3);
  const [loading, setLoading] = useState(false);
  const [clusterStats, setClusterStats] = useState<ClusterStats[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const calculateClusterStats = useCallback(() => {
    if (!pcaResult || !clusterResult) return;

    const stats = Array.from({ length: numClusters }, (_, i) => {
      const clusterPoints = pcaResult.projectedData.filter((_, idx) => clusterResult.assignments[idx] === i);
      const meanPC1 = clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length;
      const meanPC2 = clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length;
      const variance = clusterPoints.reduce((sum, p) => 
        sum + Math.pow(p[0] - meanPC1, 2) + Math.pow(p[1] - meanPC2, 2), 0) / clusterPoints.length;

      return {
        size: clusterPoints.length,
        meanPC1,
        meanPC2,
        variance
      };
    });

    setClusterStats(stats);
  }, [pcaResult, clusterResult, numClusters]);

  const performPCA = useCallback(() => {
    if (data.length === 0) return;
    setLoading(true);
    
    try {
      const numericColumns = Object.keys(data[0]).filter(key => key !== 'id' && !isNaN(Number(data[0][key])));
      const matrix = data.map(row => 
        numericColumns.map(col => Number(row[col]))
      );

      const pca = new PCA(matrix);
      const eigenvalues = pca.getEigenvalues();
      const eigenvectors = pca.getEigenvectors().to2DArray();
      const explainedVariance = eigenvalues.map(val => val / eigenvalues.reduce((a, b) => a + b, 0));
      const projectedData = pca.predict(matrix).to2DArray();

      setPcaResult({
        eigenvalues,
        eigenvectors,
        projectedData,
        explainedVariance
      });

      message.success('Análise PCA concluída com sucesso!');
      nextStep();
    } catch (error) {
      console.error('Erro na análise PCA:', error);
      message.error('Erro ao realizar PCA');
    } finally {
      setLoading(false);
    }
  }, [data]);

  const performClustering = useCallback(() => {
    if (!pcaResult) return;
    setLoading(true);

    try {
      const pcaData = pcaResult.projectedData.map(row => [row[0], row[1]]);
      const result = kmeans(pcaData, numClusters, { initialization: 'random' });

      const clusterData: ClusterResult = {
        clusters: result.clusters,
        centroids: result.centroids,
        assignments: result.clusters
      };

      setClusterResult(clusterData);
      calculateClusterStats();
      message.success('Clustering concluído com sucesso!');
      nextStep();
    } catch (error) {
      console.error('Erro no clustering:', error);
      message.error('Erro ao realizar clustering');
    } finally {
      setLoading(false);
    }
  }, [pcaResult, numClusters, calculateClusterStats]);

  const getVisualizationData = useCallback(() => {
    if (!pcaResult || !clusterResult) return [];

    return pcaResult.projectedData.map((point, index) => ({
      x: point[0],
      y: point[1],
      cluster: clusterResult.assignments[index],
      id: data[index]?.id || `Sample ${index + 1}`
    }));
  }, [pcaResult, clusterResult, data]);

  const getClusterDistributionData = useCallback(() => {
    if (!clusterResult) return [];

    return Array.from({ length: numClusters }, (_, i) => {
      const count = clusterResult.assignments.filter(c => c === i).length;
      return {
        name: `Cluster ${i + 1}`,
        value: count,
        percentage: ((count / data.length) * 100).toFixed(1)
      };
    });
  }, [clusterResult, numClusters, data.length]);

  const getClusterRadarData = useCallback(() => {
    if (!clusterStats) return [];

    return clusterStats.map((stat, idx) => ({
      cluster: `Cluster ${idx + 1}`,
      size: stat.size,
      variance: stat.variance,
      meanPC1: Math.abs(stat.meanPC1),
      meanPC2: Math.abs(stat.meanPC2)
    }));
  }, [clusterStats]);

  const exportResults = useCallback(() => {
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
  }, [data, pcaResult, clusterResult]);

  const getVarianceData = useCallback(() => {
    if (!pcaResult) return [];
    return pcaResult.explainedVariance.map((v, i) => ({
      name: `PC${i + 1}`,
      variance: v * 100,
      cumulative: pcaResult.explainedVariance.slice(0, i + 1).reduce((a, b) => a + b, 0) * 100,
    }));
  }, [pcaResult]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="light">
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Title level={4}>Análise Genômica</Title>
        </div>
        <Steps direction="vertical" current={currentStep} style={{ padding: '0 24px' }}>
          <Steps.Step title="Upload de Dados" description="Carregue seu arquivo CSV." />
          <Steps.Step title="Análise PCA" description="Execute a análise de componentes." />
          <Steps.Step title="Clustering" description="Execute o K-means." />
          <Steps.Step title="Resultados" description="Visualize os gráficos." />
        </Steps>
      </Sider>
      <Layout>
        <Content style={{ padding: '24px' }}>
          {currentStep === 0 && (
            <Card title="Passo 1: Upload de Dados">
              <Upload.Dragger
                name="file"
                accept=".csv"
                multiple={false}
                showUploadList={false}
                beforeUpload={(file) => {
                  Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: ParseResult<SNPData>) => {
                      if (results.errors.length) {
                        console.error('Erro ao processar arquivo:', results.errors);
                        message.error('Erro ao processar o arquivo CSV.');
                        return;
                      }
                      setData(results.data);
                      message.success(`${file.name} carregado com sucesso!`);
                      nextStep();
                    },
                  });
                  return false; // Impede o upload automático do antd
                }}
              >
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">Clique ou arraste um arquivo CSV para esta área</p>
              </Upload.Dragger>
            </Card>
          )}

          {currentStep === 1 && (
            <Card title="Passo 2: Análise de Componentes Principais (PCA)">
              <Row gutter={[16, 16]}>
                <Col>
                  <Button type="primary" icon={<BarChartOutlined />} onClick={performPCA} loading={loading}>
                    Executar PCA
                  </Button>
                </Col>
                <Col>
                  <Button onClick={prevStep}>Voltar</Button>
                </Col>
              </Row>
              {pcaResult && (
                <>
                  <Divider />
                  <Title level={5}>Resultados do PCA</Title>
                  <Row gutter={[16, 16]}>
                    <Col span={8}><Card><Statistic title="Variância PC1" value={`${(pcaResult.explainedVariance[0] * 100).toFixed(2)}%`} /></Card></Col>
                    <Col span={8}><Card><Statistic title="Variância PC2" value={`${(pcaResult.explainedVariance[1] * 100).toFixed(2)}%`} /></Card></Col>
                    <Col span={8}><Card><Statistic title="Total (PC1+PC2)" value={`${((pcaResult.explainedVariance[0] + pcaResult.explainedVariance[1]) * 100).toFixed(2)}%`} /></Card></Col>
                  </Row>
                </>
              )}
            </Card>
          )}

          {currentStep === 2 && (
            <Card title="Passo 3: Clustering K-means">
              <Row gutter={[16, 16]} align="middle">
                <Col>
                  <InputNumber
                    min={2}
                    max={10}
                    value={numClusters}
                    onChange={(value) => setNumClusters(value || 2)}
                    addonBefore="Clusters"
                  />
                </Col>
                <Col>
                  <Button type="primary" icon={<LineChartOutlined />} onClick={performClustering} loading={loading}>
                    Executar Clustering
                  </Button>
                </Col>
                <Col>
                  <Button onClick={prevStep}>Voltar</Button>
                </Col>
              </Row>
            </Card>
          )}

          {currentStep === 3 && (
            <Card title="Passo 4: Resultados da Análise">
              <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                  <Button onClick={prevStep}>Voltar</Button>
                </Col>
                <Col>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={exportResults}>
                    Exportar Resultados
                  </Button>
                </Col>
              </Row>
              
              {clusterResult ? (
                <Tabs defaultActiveKey="1">
                  <TabPane tab="Gráficos Principais" key="1">
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Card title="Gráfico de Dispersão (PCA)">
                          <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart>
                              <CartesianGrid />
                              <XAxis type="number" dataKey="x" name="PC1" />
                              <YAxis type="number" dataKey="y" name="PC2" />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Legend />
                              <RechartsScatter data={getVisualizationData()} name="Amostras">
                                {getVisualizationData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
                                ))}
                              </RechartsScatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="Distribuição dos Clusters">
                          <ResponsiveContainer width="100%" height={400}>
                            <RechartsPieChart>
                              <Pie
                                data={getClusterDistributionData()}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={150}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                              >
                                {getClusterDistributionData().map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tab="Análise de Variância" key="2">
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Card title="Variância Explicada por Componente">
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={getVarianceData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="variance" name="Variância Explicada (%)" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="Variância Acumulada">
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={getVarianceData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="cumulative" name="Acumulada (%)" stroke="#82ca9d" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tab="Características dos Clusters" key="3">
                     <Row gutter={[24, 24]}>
                        <Col xs={24} lg={12}>
                          <Card title="Características dos Clusters (Radar)">
                            <ResponsiveContainer width="100%" height={400}>
                              <RechartsRadarChart data={getClusterRadarData()}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="cluster" />
                                <PolarRadiusAxis />
                                <Tooltip />
                                <Legend />
                                <Radar name="Tamanho" dataKey="size" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                                <Radar name="Variância" dataKey="variance" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.6} />
                              </RechartsRadarChart>
                            </ResponsiveContainer>
                          </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                           <Card title="Estatísticas dos Clusters">
                              <Row gutter={[16, 16]}>
                                {clusterStats.map((stat, index) => (
                                  <Col key={index} span={24}>
                                    <Card size="small">
                                      <Statistic
                                        title={`Cluster ${index + 1}`}
                                        value={stat.size}
                                        suffix={`/ ${data.length}`}
                                      />
                                      <Text type="secondary">Variância: {stat.variance.toFixed(2)}</Text>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                           </Card>
                        </Col>
                     </Row>
                  </TabPane>
                </Tabs>
              ) : (
                <Empty description="Execute o clustering para ver os resultados." />
              )}
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}