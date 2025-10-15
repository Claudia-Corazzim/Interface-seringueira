# Backend Python - Interface Seringueira

Este diretório contém o backend Python para análises de Machine Learning usando scikit-learn e XGBoost.

## 🚀 Instalação

### 1. Criar ambiente virtual (recomendado)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Instalar dependências

```powershell
pip install -r requirements.txt
```

## ▶️ Executar

```powershell
python app.py
```

O servidor estará disponível em: **http://localhost:5000**

## 🧪 Testar

Verifique se está funcionando:
```powershell
curl http://localhost:5000/api/health
```

Ou abra no navegador: http://localhost:5000/api/health

## 📡 Endpoints

- `GET /api/health` - Verifica status do servidor
- `GET /api/models` - Lista modelos disponíveis
- `POST /api/train` - Treina modelos ML (usado pelo frontend)

## 🔧 Modelos Disponíveis

- ✅ SVM (Support Vector Machine)
- ✅ Random Forest
- ✅ XGBoost
- ✅ K-Nearest Neighbors (KNN)
- ✅ MLP Neural Network
- ✅ AdaBoost

## 💡 Uso no Frontend

No componente React, desmarque a opção "JavaScript (Browser)" para usar o backend Python.

## 🐛 Troubleshooting

**Erro: "XGBoost não instalado"**
```powershell
pip install xgboost
```

**Erro: "Port 5000 já está em uso"**
Altere a porta no final de `app.py`:
```python
app.run(debug=True, port=5001)
```

E atualize a URL no frontend React (`SupervisedML.tsx`).
