"""
Backend Python para Machine Learning da Interface Seringueira
Usa scikit-learn, XGBoost e outras bibliotecas Python ML profissionais

Executar:
    python app.py

API estará disponível em: http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, 
    balanced_accuracy_score, 
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix
)
import time
import warnings

# Suprimir warnings do sklearn
warnings.filterwarnings('ignore')

# Tenta importar XGBoost (opcional)
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    print("⚠️  XGBoost não instalado. Instale com: pip install xgboost")
    XGBOOST_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend React

def calculate_metrics(y_true, y_pred):
    """Calcula todas as métricas de avaliação"""
    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'balancedAccuracy': float(balanced_accuracy_score(y_true, y_pred)),
        'f1Score': float(f1_score(y_true, y_pred, average='macro')),
        'precision': float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
        'confusionMatrix': confusion_matrix(y_true, y_pred).tolist()
    }

def train_model(model_id, X_train, X_test, y_train, y_test, cv_folds=5):
    """Treina um modelo específico e retorna métricas"""
    start_time = time.time()
    
    # Seleciona o modelo
    if model_id == 'svm':
        model = SVC(kernel='rbf', gamma='scale', random_state=42)
        name = 'SVM (Support Vector Machine)'
    elif model_id == 'rf':
        model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        name = 'Random Forest'
    elif model_id == 'xgboost':
        if XGBOOST_AVAILABLE:
            model = XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1,
                eval_metric='logloss'
            )
            name = 'XGBoost'
        else:
            # Fallback para Random Forest se XGBoost não disponível
            model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
            name = 'XGBoost (usando RF como fallback)'
    elif model_id == 'knn':
        model = KNeighborsClassifier(n_neighbors=5, n_jobs=-1)
        name = 'K-Nearest Neighbors (k=5)'
    elif model_id == 'mlp':
        model = MLPClassifier(
            hidden_layer_sizes=(100, 50),
            max_iter=500,
            random_state=42,
            early_stopping=True
        )
        name = 'MLP Neural Network'
    elif model_id == 'ada':
        model = AdaBoostClassifier(n_estimators=50, random_state=42)
        name = 'AdaBoost'
    else:
        raise ValueError(f"Modelo desconhecido: {model_id}")
    
    # Treina o modelo
    model.fit(X_train, y_train)
    
    # Predição
    y_pred = model.predict(X_test)
    
    # Calcula métricas
    metrics = calculate_metrics(y_test, y_pred)
    
    # Cross-validation (opcional, mas útil)
    try:
        cv_scores = cross_val_score(
            model, 
            np.vstack([X_train, X_test]), 
            np.hstack([y_train, y_test]),
            cv=StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42),
            scoring='accuracy',
            n_jobs=-1
        )
        metrics['cvScores'] = cv_scores.tolist()
        metrics['cvMean'] = float(cv_scores.mean())
        metrics['cvStd'] = float(cv_scores.std())
    except:
        pass
    
    training_time = (time.time() - start_time) * 1000  # em ms
    
    return {
        'name': name,
        **metrics,
        'trainingTime': training_time
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se o servidor está rodando"""
    return jsonify({
        'status': 'ok',
        'message': 'Backend Python ML está rodando!',
        'xgboost_available': XGBOOST_AVAILABLE
    })

@app.route('/api/train', methods=['POST'])
def train_models():
    """Endpoint principal para treinar modelos"""
    try:
        data = request.json
        
        # Extrai dados da requisição
        features = np.array(data['features'])
        labels = np.array(data['labels'])
        model_ids = data['models']
        test_size = data.get('testSize', 0.3)
        cv_folds = data.get('crossValidation', 5)
        
        # Valida dados
        if len(features) == 0 or len(labels) == 0:
            return jsonify({'error': 'Dados vazios'}), 400
        
        if len(features) != len(labels):
            return jsonify({'error': 'Features e labels devem ter o mesmo tamanho'}), 400
        
        # Split treino/teste
        X_train, X_test, y_train, y_test = train_test_split(
            features, 
            labels, 
            test_size=test_size,
            random_state=42,
            stratify=labels if len(np.unique(labels)) > 1 else None
        )
        
        # Treina cada modelo selecionado
        results = []
        for model_id in model_ids:
            try:
                result = train_model(model_id, X_train, X_test, y_train, y_test, cv_folds)
                results.append(result)
            except Exception as e:
                print(f"Erro ao treinar {model_id}: {str(e)}")
                continue
        
        # Ordena por acurácia
        results.sort(key=lambda x: x['accuracy'], reverse=True)
        
        return jsonify(results)
    
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def list_models():
    """Lista modelos disponíveis"""
    models = [
        {'id': 'svm', 'name': 'SVM (Support Vector Machine)', 'available': True},
        {'id': 'rf', 'name': 'Random Forest', 'available': True},
        {'id': 'xgboost', 'name': 'XGBoost', 'available': XGBOOST_AVAILABLE},
        {'id': 'knn', 'name': 'K-Nearest Neighbors', 'available': True},
        {'id': 'mlp', 'name': 'MLP Neural Network', 'available': True},
        {'id': 'ada', 'name': 'AdaBoost', 'available': True}
    ]
    return jsonify(models)

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Backend Python ML para Interface Seringueira")
    print("=" * 60)
    print("📡 Servidor rodando em: http://localhost:5000")
    print("🧪 Teste de saúde: http://localhost:5000/api/health")
    print("📚 Modelos disponíveis: http://localhost:5000/api/models")
    print("-" * 60)
    if XGBOOST_AVAILABLE:
        print("✅ XGBoost está instalado e disponível")
    else:
        print("⚠️  XGBoost não instalado - usando Random Forest como fallback")
    print("=" * 60)
    
    app.run(debug=True, port=5000)
