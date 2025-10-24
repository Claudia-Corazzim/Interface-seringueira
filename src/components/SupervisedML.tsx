import { useState } from 'react';
import { Brain, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { trainModels } from '../utils/mlAlgorithms';
import type { MLResult } from '../utils/mlAlgorithms';

interface SupervisedMLProps {
  data: any[];
  pcaResult: any;
}

type ModelResult = MLResult;

export default function SupervisedML({ data, pcaResult }: SupervisedMLProps) {
  const [results, setResults] = useState<ModelResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['svm', 'rf']);
  const [testSize, setTestSize] = useState(0.3);
  const [crossValidation, setCrossValidation] = useState(5);
  const [trainingProgress, setTrainingProgress] = useState('');
  const [useJavaScript, setUseJavaScript] = useState(true); // Toggle JS/Python

  const models = [
    { id: 'svm', name: 'SVM (Support Vector Machine)', icon: '🎯', description: 'Classificação por hiperplano ótimo' },
    { id: 'rf', name: 'Random Forest', icon: '🌳', description: 'Ensemble de árvores de decisão' },
    { id: 'xgboost', name: 'XGBoost', icon: '🚀', description: 'Gradient boosting otimizado' },
    { id: 'knn', name: 'K-Nearest Neighbors', icon: '📍', description: 'Classificação por vizinhos próximos' },
    { id: 'mlp', name: 'MLP Neural Network', icon: '🧠', description: 'Rede neural multicamadas' },
    { id: 'ada', name: 'AdaBoost', icon: '⚡', description: 'Boosting adaptativo' },
    { id: 'dt', name: 'Decision Tree', icon: '🌲', description: 'Árvore de decisão com poda' },
    { id: 'lr', name: 'Logistic Regression', icon: '📈', description: 'Regressão logística' },
    { id: 'nb', name: 'Naive Bayes', icon: '🎲', description: 'Classificador probabilístico' },
    { id: 'gb', name: 'Gradient Boosting', icon: '🔥', description: 'Gradient boosting clássico' }
  ];

  const trainModelsHandler = async () => {
    console.log('🚀 Botão clicado!');
    console.log('pcaResult:', pcaResult);
    console.log('data length:', data.length);
    console.log('selectedModels:', selectedModels);
    
    if (!pcaResult || data.length === 0) {
      console.warn('❌ Sem dados ou PCA!');
      alert('Por favor, execute a análise PCA primeiro!');
      return;
    }

    setIsTraining(true);
    setTrainingProgress('Preparando dados...');

    try {
      if (useJavaScript) {
        // Modo JavaScript - executa no navegador
        console.log('⚡ Modo JavaScript ativado');
        console.log('pcaResult estrutura:', Object.keys(pcaResult));
        
        // Usa projectedData que é o nome correto no PCA result
        const pcaScores = pcaResult.projectedData || pcaResult.scores || [];
        const features = pcaScores.map((row: number[]) => row.slice(0, 3)); // Usa PC1, PC2, PC3
        console.log('Features:', features.length, 'amostras');
        
        // Extrai labels dos clones de forma mais robusta
        const labels = data.map((d: any) => {
          const cloneName = String(d.Clone || d.Clones || d.Sample || '').toUpperCase();
          
          // Grupos de clones de seringueira
          if (cloneName.includes('RRIM')) return 0;
          if (cloneName.includes('GT') || cloneName.includes('GT1')) return 1;
          if (cloneName.includes('PB') || cloneName.includes('PB235')) return 2;
          if (cloneName.includes('IAN')) return 3;
          if (cloneName.includes('PR') || cloneName.includes('PR107')) return 4;
          if (cloneName.includes('AVROS')) return 5;
          
          // Default: usar hash simples do nome se não identificar
          return Math.abs(cloneName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6;
        });

        console.log('Labels:', labels);
        console.log('Classes únicas:', [...new Set(labels)].sort());
        console.log('Distribuição:', labels.reduce((acc: any, l) => {
          acc[l] = (acc[l] || 0) + 1;
          return acc;
        }, {}));
        
        // Verificar se há pelo menos 2 classes
        const uniqueLabels = [...new Set(labels)];
        if (uniqueLabels.length < 2) {
          alert(`Erro: Apenas ${uniqueLabels.length} classe detectada. São necessárias pelo menos 2 classes para classificação!`);
          setIsTraining(false);
          return;
        }
        
        console.log(`✓ ${uniqueLabels.length} classes detectadas`);
        console.log('Iniciando treinamento...');

        const mlResults = await trainModels(
          selectedModels,
          features,
          labels,
          testSize,
          (modelId, progress) => {
            console.log(`Progresso: ${modelId} - ${progress}%`);
            setTrainingProgress(`Treinando ${modelId}... ${progress.toFixed(0)}%`);
          }
        );

        console.log('✅ Resultados:', mlResults);
        setResults(mlResults);
      } else {
        // Modo Python - chama API backend
        setTrainingProgress('Conectando ao servidor Python...');
        
        const response = await fetch('http://localhost:5000/api/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            features: pcaResult.projectedData || pcaResult.scores || [],
            labels: data.map((_d: any, idx: number) => idx % 6), // Simplificado
            models: selectedModels,
            testSize,
            crossValidation
          })
        });

        if (!response.ok) {
          throw new Error('Servidor Python não está respondendo. Execute o backend primeiro!');
        }

        const mlResults = await response.json();
        setResults(mlResults);
      }

      setTrainingProgress('Concluído!');
    } catch (error) {
      console.error('❌ Erro ao treinar modelos:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsTraining(false);
      setTimeout(() => setTrainingProgress(''), 2000);
    }
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-7 h-7 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Machine Learning Supervisionado
          </h2>
        </div>
        <p className="text-gray-600">
          Classificação automática de grupos genéticos usando algoritmos de aprendizado de máquina
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-1 space-y-6">
          {/* Seleção de Modelos */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Modelos Disponíveis
            </h3>
            <div className="space-y-2">
              {models.map(model => (
                <label 
                  key={model.id} 
                  className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: selectedModels.includes(model.id) ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: selectedModels.includes(model.id) ? '#eff6ff' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onChange={() => toggleModel(model.id)}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <span className="text-xl">{model.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{model.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Parâmetros */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold mb-4">Parâmetros</h3>
            
            <div className="space-y-4">
              {/* Toggle JS/Python */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useJavaScript}
                    onChange={(e) => setUseJavaScript(e.target.checked)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {useJavaScript ? '⚡ JavaScript (Browser)' : '🐍 Python (Backend)'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {useJavaScript 
                        ? 'Executa no navegador - Rápido e sem dependências' 
                        : 'Usa scikit-learn - Requer servidor Python rodando'}
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho do Conjunto de Teste: {(testSize * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cross-Validation (K-Fold)
                </label>
                <select
                  value={crossValidation}
                  onChange={(e) => setCrossValidation(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={3}>3-Fold</option>
                  <option value={5}>5-Fold</option>
                  <option value={10}>10-Fold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botão Treinar */}
          <button
            onClick={trainModelsHandler}
            disabled={isTraining || selectedModels.length === 0 || !pcaResult}
            style={{
              backgroundColor: isTraining || selectedModels.length === 0 ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              opacity: isTraining || selectedModels.length === 0 ? 0.6 : 1
            }}
            className="w-full py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed"
          >
            {isTraining ? `🔄 ${trainingProgress}` : '🚀 Treinar Modelos Selecionados'}
          </button>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {!pcaResult ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Execute a Análise PCA Primeiro
              </h3>
              <p className="text-yellow-700">
                Os modelos de ML supervisionado precisam dos dados processados pelo PCA
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Selecione os modelos e clique em "Treinar" para ver os resultados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📊 Resultados dos Modelos
              </h3>
              
              {results.map((result, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">{result.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        ⏱️ Tempo: {(result.trainingTime / 1000).toFixed(2)}s
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      Rank #{idx + 1}
                    </span>
                  </div>
                  
                  {/* Métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(result.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Acurácia</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(result.balancedAccuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Acur. Balanc.</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(result.f1Score * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">F1-Score</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {(result.precision * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Precisão</div>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">
                        {(result.recall * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Recall</div>
                    </div>
                  </div>

                  {/* Matriz de Confusão */}
                  <div className="mt-4">
                    <h5 className="font-semibold mb-2 text-sm text-gray-700">Matriz de Confusão</h5>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      {result.confusionMatrix.map((row, i) => 
                        row.map((val, j) => (
                          <div 
                            key={`${i}-${j}`}
                            className="p-4 text-center rounded-lg font-bold text-lg"
                            style={{
                              backgroundColor: i === j ? '#dcfce7' : '#fee2e2',
                              color: i === j ? '#166534' : '#991b1b'
                            }}
                          >
                            {val}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Verdadeiro Negativo ↖</span>
                      <span>Verdadeiro Positivo ↘</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
