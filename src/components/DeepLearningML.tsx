import { useState } from 'react';
import { Brain, Activity, Settings, Play, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DeepLearningMLProps {
  data: any[];
  pcaResult: any;
}

interface LayerConfig {
  neurons: number;
  activation: 'relu' | 'sigmoid' | 'tanh';
  dropout: number;
}

interface TrainingHistory {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

export default function DeepLearningML({ data, pcaResult }: DeepLearningMLProps) {
  const [layers, setLayers] = useState<LayerConfig[]>([
    { neurons: 64, activation: 'relu', dropout: 0.2 },
    { neurons: 32, activation: 'relu', dropout: 0.2 },
    { neurons: 16, activation: 'relu', dropout: 0 }
  ]);
  
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 30, // Reduzido para arquivos grandes
    batchSize: 32, // Aumentado para processar mais rápido
    learningRate: 0.001,
    validationSplit: 0.2,
    earlyStopping: true,
    patience: 5
  });
  
  const [isTraining, setIsTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState(0);

  const addLayer = () => {
    setLayers([...layers, { neurons: 32, activation: 'relu', dropout: 0.2 }]);
  };

  const removeLayer = (index: number) => {
    if (layers.length > 1) {
      setLayers(layers.filter((_, i) => i !== index));
    }
  };

  const updateLayer = (index: number, field: keyof LayerConfig, value: any) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], [field]: value };
    setLayers(newLayers);
  };

  const trainNeuralNetwork = async () => {
    if (!pcaResult || data.length === 0) {
      alert('Por favor, execute a análise PCA primeiro!');
      return;
    }

    setIsTraining(true);
    setTrainingHistory([]);
    setCurrentEpoch(0);
    setBestAccuracy(0);

    try {
      // Preparar dados
      const pcaScores = pcaResult.projectedData || pcaResult.scores || [];
      const features = pcaScores.map((row: number[]) => row.slice(0, 3)); // PC1, PC2, PC3
      
      const labels = data.map((d: any) => {
        const cloneName = d.Clone || d.Sample || '';
        const cloneGroups: { [key: string]: number } = {
          'RRIM': 0, 'GT1': 1, 'PB235': 2, 'IAN': 3, 'PR107': 4, 'AVROS': 5
        };
        
        for (const [key, value] of Object.entries(cloneGroups)) {
          if (cloneName.includes(key)) return value;
        }
        return 0;
      });

      const numSamples = features.length;
      const numClasses = Math.max(...labels) + 1;
      const inputDim = features[0].length;

      // Normalização Z-score
      const normalize = (data: number[][]) => {
        const means: number[] = [];
        const stds: number[] = [];
        
        for (let j = 0; j < data[0].length; j++) {
          const col = data.map(row => row[j]);
          const mean = col.reduce((a, b) => a + b, 0) / col.length;
          const variance = col.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / col.length;
          const std = Math.sqrt(variance) || 1;
          
          means.push(mean);
          stds.push(std);
        }
        
        return data.map(row => row.map((val, j) => (val - means[j]) / stds[j]));
      };

      const normalizedFeatures = normalize(features);

      // Split train/validation
      const valSize = Math.floor(numSamples * trainingConfig.validationSplit);
      const trainSize = numSamples - valSize;
      
      const indices = Array.from({ length: numSamples }, (_, i) => i);
      // Shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      const trainIndices = indices.slice(0, trainSize);
      const valIndices = indices.slice(trainSize);

      const trainX = trainIndices.map(i => normalizedFeatures[i]);
      const trainY = trainIndices.map(i => labels[i]);
      const valX = valIndices.map(i => normalizedFeatures[i]);
      const valY = valIndices.map(i => labels[i]);

      // Inicializar pesos da rede neural
      const weights: number[][][] = [];
      const biases: number[][] = [];
      
      let prevSize = inputDim;
      for (const layer of layers) {
        // Xavier initialization
        const w: number[][] = [];
        for (let i = 0; i < prevSize; i++) {
          const row: number[] = [];
          for (let j = 0; j < layer.neurons; j++) {
            row.push((Math.random() * 2 - 1) * Math.sqrt(2 / (prevSize + layer.neurons)));
          }
          w.push(row);
        }
        weights.push(w);
        biases.push(Array(layer.neurons).fill(0));
        prevSize = layer.neurons;
      }
      
      // Camada de saída
      const outputWeights: number[][] = [];
      for (let i = 0; i < prevSize; i++) {
        const row: number[] = [];
        for (let j = 0; j < numClasses; j++) {
          row.push((Math.random() * 2 - 1) * Math.sqrt(2 / (prevSize + numClasses)));
        }
        outputWeights.push(row);
      }
      weights.push(outputWeights);
      biases.push(Array(numClasses).fill(0));

      // Funções de ativação
      const activate = (x: number, type: string) => {
        switch (type) {
          case 'relu': return Math.max(0, x);
          case 'sigmoid': return 1 / (1 + Math.exp(-x));
          case 'tanh': return Math.tanh(x);
          default: return x;
        }
      };

      const activateDerivative = (x: number, type: string) => {
        switch (type) {
          case 'relu': return x > 0 ? 1 : 0;
          case 'sigmoid': {
            const sig = 1 / (1 + Math.exp(-x));
            return sig * (1 - sig);
          }
          case 'tanh': {
            const t = Math.tanh(x);
            return 1 - t * t;
          }
          default: return 1;
        }
      };

      // Forward pass
      const forward = (input: number[], applyDropout: boolean = false) => {
        const activations: number[][] = [input];
        const zValues: number[][] = [];
        
        let currentInput = input;
        
        for (let l = 0; l < layers.length; l++) {
          const z: number[] = [];
          for (let j = 0; j < layers[l].neurons; j++) {
            let sum = biases[l][j];
            for (let i = 0; i < currentInput.length; i++) {
              sum += currentInput[i] * weights[l][i][j];
            }
            z.push(sum);
          }
          
          const a = z.map(val => activate(val, layers[l].activation));
          
          // Dropout durante treinamento
          if (applyDropout && layers[l].dropout > 0) {
            for (let i = 0; i < a.length; i++) {
              if (Math.random() < layers[l].dropout) {
                a[i] = 0;
              } else {
                a[i] /= (1 - layers[l].dropout);
              }
            }
          }
          
          zValues.push(z);
          activations.push(a);
          currentInput = a;
        }
        
        // Output layer (softmax)
        const z: number[] = [];
        for (let j = 0; j < numClasses; j++) {
          let sum = biases[layers.length][j];
          for (let i = 0; i < currentInput.length; i++) {
            sum += currentInput[i] * weights[layers.length][i][j];
          }
          z.push(sum);
        }
        
        // Softmax
        const maxZ = Math.max(...z);
        const expZ = z.map(val => Math.exp(val - maxZ));
        const sumExpZ = expZ.reduce((a, b) => a + b, 0);
        const output = expZ.map(val => val / sumExpZ);
        
        zValues.push(z);
        activations.push(output);
        
        return { activations, zValues, output };
      };

      // Training loop
      let bestValAccuracy = 0;
      let patienceCounter = 0;
      
      for (let epoch = 0; epoch < trainingConfig.epochs; epoch++) {
        // Processar de forma assíncrona para não travar a UI
        await new Promise(resolve => setTimeout(resolve, 0));
        // Mini-batch gradient descent
        let epochLoss = 0;
        let correct = 0;
        
        // Shuffle training data
        const batchIndices = Array.from({ length: trainX.length }, (_, i) => i);
        for (let i = batchIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [batchIndices[i], batchIndices[j]] = [batchIndices[j], batchIndices[i]];
        }
        
        for (let batchStart = 0; batchStart < trainX.length; batchStart += trainingConfig.batchSize) {
          const batchEnd = Math.min(batchStart + trainingConfig.batchSize, trainX.length);
          const batchSize = batchEnd - batchStart;
          
          // Acumular gradientes
          const weightGrads: number[][][] = weights.map(w => w.map(row => row.map(() => 0)));
          const biasGrads: number[][] = biases.map(b => b.map(() => 0));
          
          for (let b = batchStart; b < batchEnd; b++) {
            const idx = batchIndices[b];
            const { activations, zValues, output } = forward(trainX[idx], true);
            
            // Cross-entropy loss
            const label = trainY[idx];
            epochLoss += -Math.log(output[label] + 1e-10);
            
            if (output.indexOf(Math.max(...output)) === label) {
              correct++;
            }
            
            // Backpropagation
            const deltas: number[][] = [];
            
            // Output layer delta
            const outputDelta = output.map((o, i) => o - (i === label ? 1 : 0));
            deltas.unshift(outputDelta);
            
            // Hidden layers deltas
            for (let l = layers.length - 1; l >= 0; l--) {
              const delta: number[] = [];
              for (let j = 0; j < layers[l].neurons; j++) {
                let error = 0;
                for (let k = 0; k < deltas[0].length; k++) {
                  error += deltas[0][k] * weights[l + 1][j][k];
                }
                delta.push(error * activateDerivative(zValues[l][j], layers[l].activation));
              }
              deltas.unshift(delta);
            }
            
            // Accumulate gradients
            for (let l = 0; l < weights.length; l++) {
              for (let i = 0; i < weights[l].length; i++) {
                for (let j = 0; j < weights[l][i].length; j++) {
                  weightGrads[l][i][j] += activations[l][i] * deltas[l][j] / batchSize;
                }
              }
              
              for (let j = 0; j < biases[l].length; j++) {
                biasGrads[l][j] += deltas[l][j] / batchSize;
              }
            }
          }
          
          // Update weights and biases
          for (let l = 0; l < weights.length; l++) {
            for (let i = 0; i < weights[l].length; i++) {
              for (let j = 0; j < weights[l][i].length; j++) {
                weights[l][i][j] -= trainingConfig.learningRate * weightGrads[l][i][j];
              }
            }
            
            for (let j = 0; j < biases[l].length; j++) {
              biases[l][j] -= trainingConfig.learningRate * biasGrads[l][j];
            }
          }
        }
        
        // Validation
        let valLoss = 0;
        let valCorrect = 0;
        
        for (let i = 0; i < valX.length; i++) {
          const { output } = forward(valX[i], false);
          const label = valY[i];
          
          valLoss += -Math.log(output[label] + 1e-10);
          if (output.indexOf(Math.max(...output)) === label) {
            valCorrect++;
          }
        }
        
        const trainAcc = correct / trainX.length;
        const valAcc = valCorrect / valX.length;
        
        // Update history
        const history: TrainingHistory = {
          epoch: epoch + 1,
          loss: epochLoss / trainX.length,
          accuracy: trainAcc,
          valLoss: valLoss / valX.length,
          valAccuracy: valAcc
        };
        
        setTrainingHistory(prev => [...prev, history]);
        setCurrentEpoch(epoch + 1);
        
        if (valAcc > bestValAccuracy) {
          bestValAccuracy = valAcc;
          setBestAccuracy(valAcc);
          patienceCounter = 0;
        } else {
          patienceCounter++;
        }
        
        // Early stopping
        if (trainingConfig.earlyStopping && patienceCounter >= trainingConfig.patience) {
          console.log(`Early stopping at epoch ${epoch + 1}`);
          break;
        }
      }
      
      alert(`Treinamento concluído!\nMelhor acurácia de validação: ${(bestValAccuracy * 100).toFixed(2)}%`);
      
    } catch (error) {
      console.error('Erro no treinamento:', error);
      alert('Erro durante o treinamento: ' + error);
    } finally {
      setIsTraining(false);
    }
  };

  const exportModel = () => {
    const modelConfig = {
      layers,
      trainingConfig,
      trainingHistory,
      bestAccuracy
    };
    
    const blob = new Blob([JSON.stringify(modelConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural_network_model_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Deep Learning - Redes Neurais Profundas</h2>
        </div>
        <p className="text-purple-100">
          Configure e treine redes neurais customizáveis para predição de grupos genéticos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arquitetura da Rede */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Arquitetura da Rede
          </h3>
          
          <div className="space-y-3">
            {layers.map((layer, index) => (
              <div key={index} className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Camada {index + 1}</span>
                  {layers.length > 1 && (
                    <button
                      onClick={() => removeLayer(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕ Remover
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Neurônios</label>
                    <input
                      type="number"
                      min="4"
                      max="256"
                      value={layer.neurons}
                      onChange={(e) => updateLayer(index, 'neurons', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Ativação</label>
                    <select
                      value={layer.activation}
                      onChange={(e) => updateLayer(index, 'activation', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="relu">ReLU</option>
                      <option value="sigmoid">Sigmoid</option>
                      <option value="tanh">Tanh</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Dropout</label>
                    <input
                      type="number"
                      min="0"
                      max="0.5"
                      step="0.1"
                      value={layer.dropout}
                      onChange={(e) => updateLayer(index, 'dropout', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addLayer}
              className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              + Adicionar Camada
            </button>
          </div>
        </div>

        {/* Configurações de Treinamento */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Configurações de Treinamento
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Épocas: {trainingConfig.epochs}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={trainingConfig.epochs}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, epochs: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size: {trainingConfig.batchSize}
              </label>
              <input
                type="range"
                min="8"
                max="128"
                step="8"
                value={trainingConfig.batchSize}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, batchSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Rate: {trainingConfig.learningRate}
              </label>
              <input
                type="range"
                min="0.0001"
                max="0.01"
                step="0.0001"
                value={trainingConfig.learningRate}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, learningRate: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validation Split: {(trainingConfig.validationSplit * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.3"
                step="0.05"
                value={trainingConfig.validationSplit}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, validationSplit: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={trainingConfig.earlyStopping}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, earlyStopping: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-700">
                Early Stopping (patience: {trainingConfig.patience})
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={trainNeuralNetwork}
          disabled={isTraining || !pcaResult}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          {isTraining ? `🔄 Treinando... Época ${currentEpoch}/${trainingConfig.epochs}` : '▶ Treinar Rede Neural'}
        </button>
        
        {trainingHistory.length > 0 && (
          <button
            onClick={exportModel}
            className="py-3 px-6 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar Modelo
          </button>
        )}
      </div>

      {/* Curvas de Treinamento */}
      {trainingHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="text-lg font-semibold mb-4">Curvas de Treinamento</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loss */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Loss (Cross-Entropy)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="loss" stroke="#8b5cf6" name="Training Loss" strokeWidth={2} />
                  <Line type="monotone" dataKey="valLoss" stroke="#ec4899" name="Validation Loss" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Accuracy */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Acurácia</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" name="Training Accuracy" strokeWidth={2} />
                  <Line type="monotone" dataKey="valAccuracy" stroke="#10b981" name="Validation Accuracy" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Épocas Completadas</div>
              <div className="text-2xl font-bold text-purple-600">{currentEpoch}</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Melhor Acurácia Val</div>
              <div className="text-2xl font-bold text-green-600">{(bestAccuracy * 100).toFixed(2)}%</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Loss Final</div>
              <div className="text-2xl font-bold text-blue-600">
                {trainingHistory[trainingHistory.length - 1]?.valLoss.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
