# 🧪 Guia de Teste - Machine Learning Supervisionado

## 📋 Passo a Passo para Testar

### 1️⃣ **Upload e PCA** (Pré-requisito)
- [ ] Clique em "📁 Carregar Arquivo CSV" 
- [ ] Selecione: `public/sample-data/hevea_snp_sample.csv`
- [ ] Clique em "🔬 Executar Análise PCA"
- [ ] Aguarde processamento (~2s)

### 2️⃣ **Acesse ML Supervisionado**
- [ ] Clique na aba **"ML Supervisionado"** com ícone 🧠
- [ ] Você verá:
  - ✅ Cabeçalho roxo/azul com título
  - ✅ Painel esquerdo com 6 modelos
  - ✅ Área central vazia esperando treinamento

### 3️⃣ **Configurar Modelos (Modo JavaScript)**

#### Verificar Toggle:
- [ ] Deve estar **MARCADO** ⚡ "JavaScript (Browser)"
- [ ] Se desmarcado, marque novamente para testar JS primeiro

#### Selecionar Modelos:
- [ ] **SVM** 🎯 (já selecionado por padrão)
- [ ] **Random Forest** 🌳 (já selecionado por padrão)
- [ ] Clique para adicionar mais:
  - [ ] XGBoost 🚀
  - [ ] K-Nearest Neighbors 📍
  - [ ] MLP Neural Network 🧠
  - [ ] AdaBoost ⚡

#### Ajustar Parâmetros:
- [ ] **Tamanho do Teste**: Mova o slider (recomendado: 30%)
- [ ] **Cross-Validation**: Selecione 5-Fold (padrão)

### 4️⃣ **Treinar Modelos**
- [ ] Clique em **"🚀 Treinar Modelos Selecionados"**
- [ ] Observe:
  - Botão muda para "🔄 Treinando..."
  - Progresso aparece no texto do botão
  - Aguarde ~5-10 segundos

### 5️⃣ **Analisar Resultados**

Você verá cards para cada modelo com:

#### 📊 Métricas (5 colunas coloridas):
- [ ] **Acurácia** (azul) - Deve estar entre 75-95%
- [ ] **Acur. Balanc.** (verde)
- [ ] **F1-Score** (roxo)
- [ ] **Precisão** (laranja)
- [ ] **Recall** (rosa)

#### 🎯 Ranking:
- [ ] Card no topo = **"Rank #1"** (melhor modelo)
- [ ] Próximos em ordem decrescente de acurácia

#### 🔢 Matriz de Confusão:
- [ ] **Verde** = Predições corretas (diagonal)
- [ ] **Vermelho** = Predições erradas
- [ ] Números mostram quantas amostras

#### ⏱️ Tempo de Treinamento:
- [ ] Aparece abaixo do nome do modelo
- [ ] Exemplo: "⏱️ Tempo: 1.23s"

### 6️⃣ **Testar Modo Python (Opcional)**

⚠️ **Requer backend rodando!**

#### Iniciar Backend:
```powershell
# Em um NOVO terminal
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

#### Aguarde mensagem:
```
🚀 Backend Python ML para Interface Seringueira
📡 Servidor rodando em: http://localhost:5000
```

#### Na Interface:
- [ ] **Desmarque** ⚡ "JavaScript (Browser)"
- [ ] Deve mudar para 🐍 "Python (Backend)"
- [ ] Texto muda para "Usa scikit-learn..."
- [ ] Treine os modelos novamente
- [ ] Compare resultados (Python geralmente mais preciso!)

## 🎨 O que Observar na Interface

### ✅ **Bons Sinais**:
- Cards aparecem após treinamento
- Métricas mostram percentuais válidos (>0%, <100%)
- Matriz de confusão tem números inteiros
- Tempo de treinamento é razoável (<30s)
- Ranking faz sentido (melhor modelo no topo)

### ⚠️ **Possíveis Avisos**:
- **"Execute a Análise PCA Primeiro"** 
  - Solução: Volte para aba PCA e execute
- **"Selecione os modelos..."** 
  - Solução: Marque pelo menos 1 modelo
- **Erro de conexão Python**
  - Solução: Backend não está rodando (ignore se não precisa)

## 📸 Checklist Visual

- [ ] **Cabeçalho**: Gradiente roxo→azul, ícone 🧠
- [ ] **Toggle**: Borda azul quando marcado, texto muda
- [ ] **Modelos**: 6 cards com emojis únicos
- [ ] **Slider**: Move suavemente, mostra percentual
- [ ] **Botão treinar**: Roxo vibrante, hover funciona
- [ ] **Cards de resultado**: Borda roxa à esquerda
- [ ] **Métricas**: 5 cores diferentes (azul, verde, roxo, laranja, rosa)
- [ ] **Matriz**: Verde/vermelho, grid 2x2
- [ ] **Animações**: Transições suaves

## 🚀 Testes Avançados

### Comparar Algoritmos:
- [ ] Treine TODOS os 6 modelos juntos
- [ ] Observe qual tem melhor acurácia
- [ ] Veja tempo de treinamento de cada um

### Ajustar Parâmetros:
- [ ] Teste com 10% de teste (mais dados treino)
- [ ] Teste com 50% de teste (menos dados treino)
- [ ] Compare diferenças nos resultados

### Modo Python vs JavaScript:
- [ ] Treine os mesmos 3 modelos em JS
- [ ] Treine os mesmos 3 modelos em Python
- [ ] Compare acurácias (Python deve ser ≥ JS)

## 📝 Anotações (use para feedback)

**O que funcionou bem:**
- 

**O que precisa melhorar:**
- 

**Sugestões:**
- 

---

✅ **Pronto para testar!** Abra http://localhost:5173 e siga este guia.
