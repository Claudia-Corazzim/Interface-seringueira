declare module 'ml-knn' {
  export default class KNN {
    constructor(dataset: number[][], labels: number[], options?: { k?: number });
    predict(dataset: number[][]): number[];
  }
}

declare module 'ml-cart' {
  export interface DecisionTreeOptions {
    maxDepth?: number;
    minNumSamples?: number;
  }
  
  export class DecisionTreeClassifier {
    constructor(options?: DecisionTreeOptions);
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }
}
