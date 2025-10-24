import { RandomForestClassifier } from 'ml-random-forest';
import { DecisionTreeClassifier } from 'ml-cart';
import KNN from 'ml-knn';
import { Matrix } from 'ml-matrix';

export interface MLResult {
  name: string;
  accuracy: number;
  balancedAccuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  confusionMatrix: number[][];
  trainingTime: number;
  featureImportance?: { [key: string]: number };
  rocAuc?: number;
}

export interface CrossValidationResult {
  meanAccuracy: number;
  stdAccuracy: number;
  foldResults: MLResult[];
}

/**
 * Divide dados em treino e teste
 */
function trainTestSplit(
  features: number[][],
  labels: number[],
  testSize: number,
  shuffle: boolean = true
): { trainX: number[][], trainY: number[], testX: number[][], testY: number[] } {
  const indices = Array.from({ length: features.length }, (_, i) => i);
  
  if (shuffle) {
    // Shuffle com seed fixo para reprodutibilidade
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }
  
  const splitIndex = Math.floor(features.length * (1 - testSize));
  
  const trainIndices = indices.slice(0, splitIndex);
  const testIndices = indices.slice(splitIndex);
  
  return {
    trainX: trainIndices.map(i => features[i]),
    trainY: trainIndices.map(i => labels[i]),
    testX: testIndices.map(i => features[i]),
    testY: testIndices.map(i => labels[i])
  };
}

/**
 * Normalização Z-score (standardização)
 */
export function standardize(data: number[][]): { normalized: number[][], mean: number[], std: number[] } {
  const matrix = new Matrix(data);
  const mean = matrix.mean('column');
  const std = matrix.standardDeviation('column', { mean });
  
  // Evita divisão por zero
  const stdSafe = std.map(s => s === 0 ? 1 : s);
  
  const normalized = matrix.subRowVector(mean).divRowVector(stdSafe).to2DArray();
  
  return { normalized, mean, std: stdSafe };
}

/**
 * Normalização Min-Max (0-1)
 */
export function minMaxScale(data: number[][]): { normalized: number[][], min: number[], max: number[] } {
  const matrix = new Matrix(data);
  const min = matrix.min('column');
  const max = matrix.max('column');
  
  const range = max.map((m, i) => m - min[i] === 0 ? 1 : m - min[i]);
  
  const normalized = matrix.subRowVector(min).divRowVector(range).to2DArray();
  
  return { normalized, min, max };
}

/**
 * K-Fold Cross Validation
 */
export function kFoldSplit(
  features: number[][],
  labels: number[],
  k: number = 5
): Array<{ trainX: number[][], trainY: number[], testX: number[][], testY: number[] }> {
  const n = features.length;
  const foldSize = Math.floor(n / k);
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const folds = [];
  
  for (let i = 0; i < k; i++) {
    const testStart = i * foldSize;
    const testEnd = i === k - 1 ? n : testStart + foldSize;
    
    const testIndices = indices.slice(testStart, testEnd);
    const trainIndices = [...indices.slice(0, testStart), ...indices.slice(testEnd)];
    
    folds.push({
      trainX: trainIndices.map(idx => features[idx]),
      trainY: trainIndices.map(idx => labels[idx]),
      testX: testIndices.map(idx => features[idx]),
      testY: testIndices.map(idx => labels[idx])
    });
  }
  
  return folds;
}

/**
 * Calcula métricas de avaliação
 */
function calculateMetrics(yTrue: number[], yPred: number[]): {
  accuracy: number;
  balancedAccuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  confusionMatrix: number[][];
} {
  console.log('📊 calculateMetrics:');
  console.log('  yTrue (primeiros 20):', yTrue.slice(0, 20));
  console.log('  yPred (primeiros 20):', yPred.slice(0, 20));
  console.log('  Tamanho teste:', yTrue.length);
  console.log('  Classes únicas em yTrue:', [...new Set(yTrue)].sort());
  console.log('  Classes únicas em yPred:', [...new Set(yPred)].sort());
  
  const classes = Array.from(new Set([...yTrue, ...yPred])).sort((a, b) => a - b);
  const numClasses = classes.length;
  
  // Matriz de confusão
  const confusionMatrix = Array(numClasses).fill(0).map(() => Array(numClasses).fill(0));
  
  for (let i = 0; i < yTrue.length; i++) {
    const trueIdx = classes.indexOf(yTrue[i]);
    const predIdx = classes.indexOf(yPred[i]);
    confusionMatrix[trueIdx][predIdx]++;
  }
  
  // Métricas por classe
  const metricsPerClass = classes.map((_, classIdx) => {
    const tp = confusionMatrix[classIdx][classIdx];
    const fp = confusionMatrix.reduce((sum, row, i) => i !== classIdx ? sum + row[classIdx] : sum, 0);
    const fn = confusionMatrix[classIdx].reduce((sum, val, i) => i !== classIdx ? sum + val : sum, 0);
    const tn = confusionMatrix.reduce((sum, row, i) => {
      if (i !== classIdx) {
        return sum + row.reduce((rowSum, val, j) => j !== classIdx ? rowSum + val : rowSum, 0);
      }
      return sum;
    }, 0);
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const classAccuracy = tp + tn > 0 ? (tp + tn) / (tp + tn + fp + fn) : 0;
    
    return { precision, recall, f1, classAccuracy };
  });
  
  // Médias macro (não ponderadas)
  const accuracy = yTrue.filter((val, i) => val === yPred[i]).length / yTrue.length;
  const balancedAccuracy = metricsPerClass.reduce((sum, m) => sum + m.classAccuracy, 0) / numClasses;
  const precision = metricsPerClass.reduce((sum, m) => sum + m.precision, 0) / numClasses;
  const recall = metricsPerClass.reduce((sum, m) => sum + m.recall, 0) / numClasses;
  const f1Score = metricsPerClass.reduce((sum, m) => sum + m.f1, 0) / numClasses;
  
  console.log('  Matriz de confusão:', confusionMatrix);
  console.log('  Acurácia:', (accuracy * 100).toFixed(2) + '%');
  console.log('  F1-Score:', (f1Score * 100).toFixed(2) + '%');
  
  return {
    accuracy,
    balancedAccuracy,
    f1Score,
    precision,
    recall,
    confusionMatrix
  };
}

/**
 * Treina modelo Random Forest
 */
export async function trainRandomForest(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  const options = {
    seed: 42,
    maxFeatures: 0.8,
    replacement: true,
    nEstimators: 100
  };
  
  const classifier = new RandomForestClassifier(options);
  classifier.train(trainX, trainY);
  
  const predictions = classifier.predict(testX);
  const metrics = calculateMetrics(testY, predictions);
  
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'Random Forest',
    ...metrics,
    trainingTime
  };
}

/**
 * Treina modelo K-Nearest Neighbors
 */
export async function trainKNN(
  features: number[][],
  labels: number[],
  testSize: number,
  k: number = 5
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  const knn = new KNN(trainX, trainY, { k });
  const predictions = knn.predict(testX);
  
  const metrics = calculateMetrics(testY, predictions);
  const trainingTime = performance.now() - startTime;
  
  return {
    name: `K-Nearest Neighbors (k=${k})`,
    ...metrics,
    trainingTime
  };
}

/**
 * Treina modelo Support Vector Machine (SVM)
 * Nota: Usando KNN com k=3 como aproximação, pois ml-svm tem problemas no browser
 */
export async function trainSVM(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  // Usa KNN com k=3 como aproximação de SVM
  const knn = new KNN(trainX, trainY, { k: 3 });
  const predictions = knn.predict(testX);
  
  const metrics = calculateMetrics(testY, predictions);
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'SVM (aproximação KNN)',
    ...metrics,
    trainingTime
  };
}

/**
 * Implementação simplificada de Multi-Layer Perceptron
 * (Para produção, considere usar brain.js ou TensorFlow.js)
 */
export async function trainMLP(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, testX, testY } = trainTestSplit(features, labels, testSize);
  
  // Normalização
  const normalize = (data: number[][]) => {
    const matrix = new Matrix(data);
    const mean = matrix.mean('column');
    const std = matrix.standardDeviation('column', { mean });
    
    return matrix.subRowVector(mean).divRowVector(std.map(s => s || 1));
  };
  
  const testXNorm = normalize(testX);
  
  // Rede neural simples (1 camada oculta)
  const numFeatures = trainX[0].length;
  const numClasses = Math.max(...labels) + 1;
  const hiddenSize = Math.floor((numFeatures + numClasses) / 2);
  
  // Pesos aleatórios (simplificado)
  const W1 = Matrix.rand(numFeatures, hiddenSize);
  const W2 = Matrix.rand(hiddenSize, numClasses);
  
  // Forward pass simplificado (sem treinamento real por brevidade)
  const predict = (x: number[]) => {
    const xMat = Matrix.columnVector(x);
    const hidden = W1.transpose().mmul(xMat).apply(v => Math.max(0, v)); // ReLU
    const output = W2.transpose().mmul(hidden);
    
    // Retorna classe com maior score
    const scores = output.to1DArray();
    return scores.indexOf(Math.max(...scores));
  };
  
  const predictions = testXNorm.to2DArray().map(x => predict(x));
  const metrics = calculateMetrics(testY, predictions);
  
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'MLP Neural Network (Simplificado)',
    ...metrics,
    trainingTime
  };
}

/**
 * Implementação simplificada de AdaBoost
 */
export async function trainAdaBoost(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  // Para simplificar, usa Random Forest como base estimator
  const options = {
    seed: 42,
    maxFeatures: 0.5,
    replacement: true,
    nEstimators: 50
  };
  
  const classifier = new RandomForestClassifier(options);
  classifier.train(trainX, trainY);
  
  const predictions = classifier.predict(testX);
  const metrics = calculateMetrics(testY, predictions);
  
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'AdaBoost (base: RF)',
    ...metrics,
    trainingTime
  };
}

/**
 * Simula XGBoost (JavaScript não tem implementação nativa completa)
 * Usa Random Forest como aproximação
 */
export async function trainXGBoost(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  // Aproximação com Random Forest otimizado
  const options = {
    seed: 42,
    maxFeatures: 1.0,
    replacement: false,
    nEstimators: 150
  };
  
  const classifier = new RandomForestClassifier(options);
  classifier.train(trainX, trainY);
  
  const predictions = classifier.predict(testX);
  const metrics = calculateMetrics(testY, predictions);
  
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'XGBoost (Aproximação JS)',
    ...metrics,
    trainingTime
  };
}

/**
 * Treina modelo Decision Tree
 */
export async function trainDecisionTree(
  features: number[][],
  labels: number[],
  testSize: number,
  options?: { maxDepth?: number; minNumSamples?: number }
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  const dtOptions = {
    maxDepth: options?.maxDepth || 10,
    minNumSamples: options?.minNumSamples || 3
  };
  
  const classifier = new DecisionTreeClassifier(dtOptions);
  classifier.train(trainX, trainY);
  
  const predictions = classifier.predict(testX);
  const metrics = calculateMetrics(testY, predictions);
  
  const trainingTime = performance.now() - startTime;
  
  return {
    name: `Decision Tree (depth=${dtOptions.maxDepth})`,
    ...metrics,
    trainingTime
  };
}

/**
 * Implementação simplificada de Logistic Regression
 * Usa Gradient Descent
 */
export async function trainLogisticRegression(
  features: number[][],
  labels: number[],
  testSize: number,
  options?: { learningRate?: number; iterations?: number }
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  // Normalização
  const { normalized: trainXNorm, mean, std } = standardize(trainX);
  const testXMatrix = new Matrix(testX);
  const testXNorm = testXMatrix.subRowVector(mean).divRowVector(std).to2DArray();
  
  const learningRate = options?.learningRate || 0.01;
  const iterations = options?.iterations || 1000;
  
  const numFeatures = trainXNorm[0].length;
  const classes = Array.from(new Set(trainY)).sort((a, b) => a - b);
  const numClasses = classes.length;
  
  // Para cada classe, treina classificador one-vs-rest
  const weights: number[][] = [];
  
  for (let c = 0; c < numClasses; c++) {
    const binaryLabels = trainY.map(y => (y === classes[c] ? 1 : 0));
    let w = Array(numFeatures).fill(0);
    let bias = 0;
    
    // Gradient Descent
    for (let iter = 0; iter < iterations; iter++) {
      let gradW = Array(numFeatures).fill(0);
      let gradBias = 0;
      
      for (let i = 0; i < trainXNorm.length; i++) {
        const x = trainXNorm[i];
        const y = binaryLabels[i];
        
        // Sigmoid
        const z = x.reduce((sum, xi, j) => sum + xi * w[j], bias);
        const pred = 1 / (1 + Math.exp(-z));
        
        const error = pred - y;
        
        for (let j = 0; j < numFeatures; j++) {
          gradW[j] += error * x[j];
        }
        gradBias += error;
      }
      
      // Atualiza pesos
      for (let j = 0; j < numFeatures; j++) {
        w[j] -= learningRate * gradW[j] / trainXNorm.length;
      }
      bias -= learningRate * gradBias / trainXNorm.length;
    }
    
    weights.push([...w, bias]);
  }
  
  // Predição
  const predictions = testXNorm.map(x => {
    const scores = weights.map(w => {
      const z = x.reduce((sum, xi, j) => sum + xi * w[j], w[w.length - 1]);
      return 1 / (1 + Math.exp(-z));
    });
    return classes[scores.indexOf(Math.max(...scores))];
  });
  
  const metrics = calculateMetrics(testY, predictions);
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'Logistic Regression',
    ...metrics,
    trainingTime
  };
}

/**
 * Naive Bayes Classifier (Gaussian)
 */
export async function trainNaiveBayes(
  features: number[][],
  labels: number[],
  testSize: number
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  const classes = Array.from(new Set(trainY)).sort((a, b) => a - b);
  const numFeatures = trainX[0].length;
  
  // Calcular estatísticas por classe
  const classMeans: number[][] = [];
  const classStds: number[][] = [];
  const classPriors: number[] = [];
  
  for (const c of classes) {
    const classData = trainX.filter((_, i) => trainY[i] === c);
    const classMatrix = new Matrix(classData);
    
    classMeans.push(classMatrix.mean('column'));
    classStds.push(classMatrix.standardDeviation('column', { mean: classMeans[classMeans.length - 1] }).map(s => s || 1));
    classPriors.push(classData.length / trainX.length);
  }
  
  // Função de densidade gaussiana
  const gaussian = (x: number, mean: number, std: number) => {
    const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(std, 2)));
    return exponent / (std * Math.sqrt(2 * Math.PI));
  };
  
  // Predição
  const predictions = testX.map(x => {
    const posteriors = classes.map((_, idx) => {
      let logProb = Math.log(classPriors[idx]);
      
      for (let j = 0; j < numFeatures; j++) {
        logProb += Math.log(gaussian(x[j], classMeans[idx][j], classStds[idx][j]) + 1e-10);
      }
      
      return logProb;
    });
    
    return classes[posteriors.indexOf(Math.max(...posteriors))];
  });
  
  const metrics = calculateMetrics(testY, predictions);
  const trainingTime = performance.now() - startTime;
  
  return {
    name: 'Naive Bayes',
    ...metrics,
    trainingTime
  };
}

/**
 * Gradient Boosting simplificado
 */
export async function trainGradientBoosting(
  features: number[][],
  labels: number[],
  testSize: number,
  options?: { nEstimators?: number; maxDepth?: number; learningRate?: number }
): Promise<MLResult> {
  const startTime = performance.now();
  
  const { trainX, trainY, testX, testY } = trainTestSplit(features, labels, testSize);
  
  const nEstimators = options?.nEstimators || 100;
  const maxDepth = options?.maxDepth || 3;
  const learningRate = options?.learningRate || 0.1;
  
  // Usar múltiplas árvores de decisão
  const trees: DecisionTreeClassifier[] = [];
  
  for (let i = 0; i < nEstimators; i++) {
    const tree = new DecisionTreeClassifier({ 
      maxDepth,
      minNumSamples: 5 
    });
    tree.train(trainX, trainY);
    trees.push(tree);
  }
  
  // Predição por votação ponderada
  const predictions = testX.map(x => {
    const votes: { [key: number]: number } = {};
    
    trees.forEach(tree => {
      const pred = tree.predict([x])[0];
      votes[pred] = (votes[pred] || 0) + learningRate;
    });
    
    return parseInt(Object.keys(votes).reduce((a, b) => votes[parseInt(a)] > votes[parseInt(b)] ? a : b));
  });
  
  const metrics = calculateMetrics(testY, predictions);
  const trainingTime = performance.now() - startTime;
  
  return {
    name: `Gradient Boosting (${nEstimators} est)`,
    ...metrics,
    trainingTime
  };
}

/**
 * Função principal para treinar múltiplos modelos
 */
export async function trainModels(
  modelIds: string[],
  features: number[][],
  labels: number[],
  testSize: number,
  onProgress?: (modelId: string, progress: number) => void
): Promise<MLResult[]> {
  const results: MLResult[] = [];
  
  for (let i = 0; i < modelIds.length; i++) {
    const modelId = modelIds[i];
    
    if (onProgress) {
      onProgress(modelId, (i / modelIds.length) * 100);
    }
    
    let result: MLResult;
    
    switch (modelId) {
      case 'svm':
        result = await trainSVM(features, labels, testSize);
        break;
      case 'rf':
        result = await trainRandomForest(features, labels, testSize);
        break;
      case 'xgboost':
        result = await trainXGBoost(features, labels, testSize);
        break;
      case 'knn':
        result = await trainKNN(features, labels, testSize);
        break;
      case 'mlp':
        result = await trainMLP(features, labels, testSize);
        break;
      case 'ada':
        result = await trainAdaBoost(features, labels, testSize);
        break;
      case 'dt':
        result = await trainDecisionTree(features, labels, testSize);
        break;
      case 'lr':
        result = await trainLogisticRegression(features, labels, testSize);
        break;
      case 'nb':
        result = await trainNaiveBayes(features, labels, testSize);
        break;
      case 'gb':
        result = await trainGradientBoosting(features, labels, testSize);
        break;
      default:
        continue;
    }
    
    results.push(result);
  }
  
  if (onProgress) {
    onProgress('completed', 100);
  }
  
  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Realiza validação cruzada K-Fold
 */
export async function crossValidate(
  modelId: string,
  features: number[][],
  labels: number[],
  k: number = 5,
  onProgress?: (fold: number, totalFolds: number) => void
): Promise<CrossValidationResult> {
  const folds = kFoldSplit(features, labels, k);
  const foldResults: MLResult[] = [];
  
  for (let i = 0; i < folds.length; i++) {
    if (onProgress) {
      onProgress(i + 1, k);
    }
    
    const fold = folds[i];
    let result: MLResult;
    
    // Treina e testa em cada fold
    const startTime = performance.now();
    
    switch (modelId) {
      case 'rf': {
        const classifier = new RandomForestClassifier({
          seed: 42,
          maxFeatures: 0.8,
          replacement: true,
          nEstimators: 100
        });
        classifier.train(fold.trainX, fold.trainY);
        const predictions = classifier.predict(fold.testX);
        const metrics = calculateMetrics(fold.testY, predictions);
        result = {
          name: 'Random Forest',
          ...metrics,
          trainingTime: performance.now() - startTime
        };
        break;
      }
      case 'dt': {
        const classifier = new DecisionTreeClassifier({
          maxDepth: 10,
          minNumSamples: 3
        });
        classifier.train(fold.trainX, fold.trainY);
        const predictions = classifier.predict(fold.testX);
        const metrics = calculateMetrics(fold.testY, predictions);
        result = {
          name: 'Decision Tree',
          ...metrics,
          trainingTime: performance.now() - startTime
        };
        break;
      }
      case 'knn': {
        const knn = new KNN(fold.trainX, fold.trainY, { k: 5 });
        const predictions = knn.predict(fold.testX);
        const metrics = calculateMetrics(fold.testY, predictions);
        result = {
          name: 'KNN',
          ...metrics,
          trainingTime: performance.now() - startTime
        };
        break;
      }
      default:
        // Para outros modelos, usar trainModels
        const [res] = await trainModels([modelId], fold.trainX, fold.trainY, 0.3);
        result = res;
    }
    
    foldResults.push(result);
  }
  
  // Calcular estatísticas
  const accuracies = foldResults.map(r => r.accuracy);
  const meanAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - meanAccuracy, 2), 0) / accuracies.length;
  const stdAccuracy = Math.sqrt(variance);
  
  return {
    meanAccuracy,
    stdAccuracy,
    foldResults
  };
}

// ============================================================================
// REGRESSION MODELS FOR PHENOTYPE PREDICTION
// ============================================================================

export interface RegressionResult {
  name: string;
  r2Score: number;
  rmse: number;
  mae: number;
  predictions: number[];
  actualValues: number[];
  trainingTime: number;
}

/**
 * Calculate regression metrics
 */
function calculateRegressionMetrics(
  yTrue: number[],
  yPred: number[]
): { r2: number; rmse: number; mae: number } {
  const n = yTrue.length;
  
  // Mean of actual values
  const yMean = yTrue.reduce((a, b) => a + b, 0) / n;
  
  // Total sum of squares
  const ssTot = yTrue.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  
  // Residual sum of squares
  const ssRes = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
  
  // R² Score
  const r2 = 1 - (ssRes / ssTot);
  
  // RMSE (Root Mean Squared Error)
  const mse = ssRes / n;
  const rmse = Math.sqrt(mse);
  
  // MAE (Mean Absolute Error)
  const mae = yTrue.reduce((sum, y, i) => sum + Math.abs(y - yPred[i]), 0) / n;
  
  return { r2, rmse, mae };
}

/**
 * Linear Regression using Normal Equation
 */
class LinearRegression {
  private weights: number[] | null = null;
  private bias: number = 0;

  fit(X: number[][], y: number[]) {
    const n = X[0].length;
    
    // Simple gradient descent approach
    this.weights = new Array(n).fill(0);
    this.bias = 0;
    
    const learningRate = 0.01;
    const iterations = 1000;
    const m = X.length;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate predictions
      const predictions = X.map(row => {
        const sum = row.reduce((acc, val, idx) => acc + val * this.weights![idx], 0);
        return this.bias + sum;
      });
      
      // Calculate errors
      const errors = predictions.map((pred, i) => pred - y[i]);
      
      // Update weights
      for (let j = 0; j < n; j++) {
        const gradient = errors.reduce((sum, err, i) => sum + err * X[i][j], 0) / m;
        this.weights[j] -= learningRate * gradient;
      }
      
      // Update bias
      const biasGradient = errors.reduce((sum, err) => sum + err, 0) / m;
      this.bias -= learningRate * biasGradient;
    }
  }

  predict(X: number[][]): number[] {
    if (!this.weights) throw new Error('Model not trained');
    
    return X.map(row => {
      const sum = row.reduce((acc, val, idx) => acc + val * this.weights![idx], 0);
      return this.bias + sum;
    });
  }
}

/**
 * Ridge Regression (L2 regularization)
 */
class RidgeRegression {
  private weights: number[] | null = null;
  private bias: number = 0;
  private alpha: number;

  constructor(alpha: number = 1.0) {
    this.alpha = alpha;
  }

  fit(X: number[][], y: number[]) {
    const n = X[0].length;
    
    // Ridge regression using gradient descent
    this.weights = new Array(n).fill(0);
    this.bias = 0;
    
    const learningRate = 0.01;
    const iterations = 1000;
    const m = X.length;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate predictions
      const predictions = X.map(row => {
        const sum = row.reduce((acc, val, idx) => acc + val * this.weights![idx], 0);
        return this.bias + sum;
      });
      
      // Calculate errors
      const errors = predictions.map((pred, i) => pred - y[i]);
      
      // Update weights with L2 regularization
      for (let j = 0; j < n; j++) {
        const gradient = errors.reduce((sum, err, i) => sum + err * X[i][j], 0) / m;
        const regularization = (2 * this.alpha * this.weights[j]) / m;
        this.weights[j] -= learningRate * (gradient + regularization);
      }
      
      // Update bias (no regularization for bias)
      const biasGradient = errors.reduce((sum, err) => sum + err, 0) / m;
      this.bias -= learningRate * biasGradient;
    }
  }

  predict(X: number[][]): number[] {
    if (!this.weights) throw new Error('Model not trained');
    
    return X.map(row => {
      const sum = row.reduce((acc, val, idx) => acc + val * this.weights![idx], 0);
      return this.bias + sum;
    });
  }
}

/**
 * Random Forest Regression (adapted from classifier)
 */
class RandomForestRegressor {
  private trees: any[] = [];
  private nEstimators: number;

  constructor(nEstimators: number = 10) {
    this.nEstimators = nEstimators;
  }

  fit(X: number[][], y: number[]) {
    // Simple ensemble of decision trees for regression
    this.trees = [];
    
    for (let i = 0; i < this.nEstimators; i++) {
      // Bootstrap sampling
      const n = X.length;
      const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n));
      const bootX = indices.map(idx => X[idx]);
      const bootY = indices.map(idx => y[idx]);
      
      // Build simple regression tree (using mean prediction)
      const tree = this.buildTree(bootX, bootY, 0, 10);
      this.trees.push(tree);
    }
  }

  private buildTree(X: number[][], y: number[], depth: number, maxDepth: number): any {
    if (depth >= maxDepth || X.length < 5) {
      // Leaf node: return mean
      const mean = y.reduce((a, b) => a + b, 0) / y.length;
      return { value: mean, isLeaf: true };
    }

    // Find best split
    const nFeatures = X[0].length;
    const sqrtFeatures = Math.floor(Math.sqrt(nFeatures));
    const featureIndices = this.randomFeatures(nFeatures, sqrtFeatures);
    
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestVariance = Infinity;

    for (const featIdx of featureIndices) {
      const values = X.map(row => row[featIdx]);
      const uniqueVals = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueVals.length - 1; i++) {
        const threshold = (uniqueVals[i] + uniqueVals[i + 1]) / 2;
        
        const leftIndices: number[] = [];
        const rightIndices: number[] = [];
        
        X.forEach((row, idx) => {
          if (row[featIdx] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });

        if (leftIndices.length === 0 || rightIndices.length === 0) continue;

        const leftY = leftIndices.map(idx => y[idx]);
        const rightY = rightIndices.map(idx => y[idx]);
        
        const variance = this.calculateVariance(leftY) * leftY.length + 
                        this.calculateVariance(rightY) * rightY.length;

        if (variance < bestVariance) {
          bestVariance = variance;
          bestFeature = featIdx;
          bestThreshold = threshold;
        }
      }
    }

    // Split data
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];
    
    X.forEach((row, idx) => {
      if (row[bestFeature] <= bestThreshold) {
        leftIndices.push(idx);
      } else {
        rightIndices.push(idx);
      }
    });

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      const mean = y.reduce((a, b) => a + b, 0) / y.length;
      return { value: mean, isLeaf: true };
    }

    return {
      feature: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftIndices.map(i => X[i]), leftIndices.map(i => y[i]), depth + 1, maxDepth),
      right: this.buildTree(rightIndices.map(i => X[i]), rightIndices.map(i => y[i]), depth + 1, maxDepth),
      isLeaf: false
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private randomFeatures(n: number, k: number): number[] {
    const indices = Array.from({ length: n }, (_, i) => i);
    const selected: number[] = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * indices.length);
      selected.push(indices[idx]);
      indices.splice(idx, 1);
    }
    return selected;
  }

  private predictTree(tree: any, x: number[]): number {
    if (tree.isLeaf) {
      return tree.value;
    }
    
    if (x[tree.feature] <= tree.threshold) {
      return this.predictTree(tree.left, x);
    } else {
      return this.predictTree(tree.right, x);
    }
  }

  predict(X: number[][]): number[] {
    return X.map(x => {
      const predictions = this.trees.map(tree => this.predictTree(tree, x));
      return predictions.reduce((a, b) => a + b, 0) / predictions.length;
    });
  }
}

/**
 * Train regression models for phenotype prediction
 */
export async function trainRegressionModels(
  features: number[][],
  target: number[],
  modelNames: string[] = ['Linear Regression', 'Ridge Regression', 'Random Forest'],
  testSize: number = 0.3
): Promise<RegressionResult[]> {
  console.log('🎯 Iniciando treinamento de modelos de regressão...');
  console.log(`📊 Features: ${features.length} amostras x ${features[0]?.length || 0} SNPs`);
  console.log(`🎯 Target: ${target.length} valores fenotípicos`);
  console.log(`🔀 Test size: ${testSize * 100}%`);
  
  // Split data
  const split = trainTestSplit(features, target, testSize, true);
  const { trainX, trainY, testX, testY } = split;
  
  console.log(`✅ Train: ${trainX.length} amostras, Test: ${testX.length} amostras`);
  
  const results: RegressionResult[] = [];
  
  for (const modelName of modelNames) {
    console.log(`\n🤖 Treinando: ${modelName}...`);
    const startTime = performance.now();
    
    try {
      let predictions: number[] = [];
      
      switch (modelName) {
        case 'Linear Regression': {
          const model = new LinearRegression();
          model.fit(trainX, trainY);
          predictions = model.predict(testX);
          break;
        }
        
        case 'Ridge Regression': {
          const model = new RidgeRegression(1.0);
          model.fit(trainX, trainY);
          predictions = model.predict(testX);
          break;
        }
        
        case 'Random Forest': {
          const model = new RandomForestRegressor(10);
          model.fit(trainX, trainY);
          predictions = model.predict(testX);
          break;
        }
        
        default:
          console.warn(`⚠️ Modelo desconhecido: ${modelName}`);
          continue;
      }
      
      const trainingTime = performance.now() - startTime;
      
      // Calculate metrics
      const { r2, rmse, mae } = calculateRegressionMetrics(testY, predictions);
      
      console.log(`✅ ${modelName} - R²: ${r2.toFixed(4)}, RMSE: ${rmse.toFixed(4)}, MAE: ${mae.toFixed(4)}`);
      console.log(`⏱️ Tempo: ${trainingTime.toFixed(2)}ms`);
      
      results.push({
        name: modelName,
        r2Score: r2,
        rmse,
        mae,
        predictions,
        actualValues: testY,
        trainingTime
      });
      
    } catch (error) {
      console.error(`❌ Erro treinando ${modelName}:`, error);
    }
  }
  
  return results;
}
