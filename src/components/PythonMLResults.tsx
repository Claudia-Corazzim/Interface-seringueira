import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

interface ModelResult {
  model: string;
  bestParams: any;
  bestScore: number;
  meanTrainScore: number;
  stdScore: number;
  allScores: number[];
}

export default function PythonMLResults() {
  const [results, setResults] = useState<ModelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPythonResults();
  }, []);

  const loadPythonResults = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/sample-data/Resultados_Modelos/validation_results.json');
      
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      
      const data = await response.json();
      
      const processedResults: ModelResult[] = [];
      
      // Processar cada modelo
      Object.keys(data).forEach(modelName => {
        const modelData = data[modelName];
        
        // Encontrar o melhor resultado
        const bestIndex = modelData.mean_test_score.indexOf(
          Math.max(...modelData.mean_test_score)
        );
        
        processedResults.push({
          model: modelName,
          bestParams: modelData.params[bestIndex],
          bestScore: modelData.mean_test_score[bestIndex],
          meanTrainScore: modelData.mean_train_score[bestIndex],
          stdScore: modelData.std_test_score[bestIndex],
          allScores: modelData.mean_test_score
        });
      });
      
      // Ordenar por melhor score
      processedResults.sort((a, b) => b.bestScore - a.bestScore);
      setResults(processedResults);
      if (processedResults.length > 0) {
        setSelectedModel(processedResults[0].model);
      }
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
      setError('Erro ao carregar resultados do arquivo JSON');
    } finally {
      setIsLoading(false);
    }
  };

  const getModelIcon = (modelName: string) => {
    const icons: { [key: string]: string } = {
      'SVM': '🎯',
      'Random Forest': '🌳',
      'AdaBoost': '🚀',
      'XGBoost': '⚡',
      'KNN': '📍',
      'MLP Neural Network': '🧠'
    };
    return icons[modelName] || '🤖';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.60) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.55) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatParams = (params: any) => {
    return Object.entries(params).map(([key, value]) => {
      let displayValue = value;
      if (Array.isArray(value)) {
        displayValue = `[${value.join(', ')}]`;
      }
      return `${key}: ${displayValue}`;
    }).join(' | ');
  };

  const selectedModelData = results.find(r => r.model === selectedModel);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando resultados validados do Python...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-bold text-red-800">Erro ao Carregar Resultados</h3>
        </div>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadPythonResults}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Award className="w-8 h-8" />
          Resultados Validados - Python (scikit-learn)
        </h2>
        <p className="text-blue-100 mb-4">
          Grid Search com Cross-Validation (5-fold) | {results.length} modelos otimizados
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/20 rounded p-3">
            <p className="text-sm">✅ Pipeline: TASSEL-GBS → Bowtie2 → snpReady → kNNI</p>
          </div>
          <div className="bg-white/20 rounded p-3">
            <p className="text-sm">✅ Dados: 434 genótipos × ~30.546 marcadores SNP</p>
          </div>
        </div>
      </div>

      {/* Ranking dos Modelos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Ranking dos Modelos (Melhor → Pior)
        </h3>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={result.model}
              onClick={() => setSelectedModel(result.model)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedModel === result.model
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="text-2xl flex-shrink-0">{getModelIcon(result.model)}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-lg">{result.model}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {formatParams(result.bestParams)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(result.bestScore)}`}>
                    {(result.bestScore * 100).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ± {(result.stdScore * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhes do Modelo Selecionado */}
      {selectedModelData && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">
              📊 Detalhes: {getModelIcon(selectedModelData.model)} {selectedModelData.model}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Acurácia Teste (CV)</p>
                <p className="text-2xl font-bold text-green-600">
                  {(selectedModelData.bestScore * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Acurácia Treino</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(selectedModelData.meanTrainScore * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-gray-600 mb-1">Desvio Padrão</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ± {(selectedModelData.stdScore * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Configs Testadas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedModelData.allScores.length}
                </p>
              </div>
            </div>

            {/* Análise de Overfitting */}
            {selectedModelData.meanTrainScore - selectedModelData.bestScore > 0.2 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
                <p className="text-yellow-800 font-semibold">⚠️ Possível Overfitting Detectado</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Diferença treino-teste: {((selectedModelData.meanTrainScore - selectedModelData.bestScore) * 100).toFixed(1)}%. 
                  O modelo pode estar memorizando os dados de treino.
                </p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold mb-3 text-gray-800">⚙️ Melhores Hiperparâmetros:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selectedModelData.bestParams).map(([key, value]) => (
                  <div key={key} className="bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-600 text-sm">{key}:</span>
                    <span className="font-mono font-bold ml-2 text-blue-600">
                      {Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico de Todas as Configurações Testadas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">📈 Todas as Configurações Testadas (Grid Search)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedModelData.allScores.map((score, idx) => ({
                config: `#${idx + 1}`,
                score: score * 100,
                fill: idx === selectedModelData.allScores.indexOf(Math.max(...selectedModelData.allScores)) ? '#22c55e' : '#3b82f6'
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="config" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  label={{ value: 'Acurácia (%)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value: any) => `${value.toFixed(2)}%`}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
                />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 text-center mt-2">
              Barra verde = melhor configuração | Azul = outras configurações testadas
            </p>
          </div>
        </>
      )}

      {/* Comparação Visual de Todos os Modelos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">📊 Comparação de Performance: Treino vs Teste</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={results.map(r => ({
            model: r.model.length > 15 ? r.model.substring(0, 15) + '...' : r.model,
            fullModel: r.model,
            test: r.bestScore * 100,
            train: r.meanTrainScore * 100
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="model" 
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ value: 'Acurácia (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: any) => `${value.toFixed(2)}%`}
              labelFormatter={(label: any, payload: any) => payload[0]?.payload.fullModel || label}
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
            />
            <Legend />
            <Bar dataKey="test" name="Acurácia Teste (CV)" fill="#22c55e" />
            <Bar dataKey="train" name="Acurácia Treino" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 text-center mt-2">
          Verde = Teste (mais importante) | Azul = Treino (gap grande indica overfitting)
        </p>
      </div>

      {/* Notas Metodológicas */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-800 mb-2">📝 Notas Metodológicas:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Cross-Validation (5-fold):</strong> Cada modelo foi testado em 5 divisões diferentes dos dados para robustez</li>
          <li>• <strong>Grid Search:</strong> Teste exaustivo de múltiplas combinações de hiperparâmetros</li>
          <li>• <strong>mean_test_score:</strong> Média das acurácias nos 5 folds (métrica mais confiável que single split)</li>
          <li>• <strong>std_test_score:</strong> Desvio padrão indica estabilidade/consistência do modelo</li>
          <li>• <strong>Overfitting:</strong> Quando Treino ≈ 100% mas Teste ≈ 60%, modelo memorizou padrões específicos</li>
          <li>• <strong>Biblioteca:</strong> scikit-learn (Python) - implementações otimizadas e validadas cientificamente</li>
        </ul>
      </div>

      {/* Melhor Modelo Highlight */}
      {results.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8" />
            <h3 className="text-2xl font-bold">🏆 Modelo Campeão</h3>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-xl font-bold mb-2">
              {getModelIcon(results[0].model)} {results[0].model}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="opacity-80">Acurácia:</span>
                <span className="font-bold ml-2">{(results[0].bestScore * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="opacity-80">Estabilidade:</span>
                <span className="font-bold ml-2">± {(results[0].stdScore * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="opacity-80">Configurações:</span>
                <span className="font-bold ml-2">{results[0].allScores.length} testadas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
