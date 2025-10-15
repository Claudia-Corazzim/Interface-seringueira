# Interface para Análise Genômica da Seringueira 🌳🧬# React + TypeScript + Vite



Aplicação web científica para análise de dados genômicos de *Hevea brasiliensis* (seringueira), desenvolvida com React, TypeScript, Vite e Machine Learning.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## ✨ FuncionalidadesCurrently, two official plugins are available:



### 📊 Análises Implementadas- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh

- ✅ Upload de arquivos CSV com dados de SNPs- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- ✅ **Análise PCA** (Principal Component Analysis) com 2D/3D

- ✅ **Clustering K-means** baseado nos componentes principais## React Compiler

- ✅ **Machine Learning Supervisionado**:

  - 🎯 SVM (Support Vector Machine)The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

  - 🌳 Random Forest

  - 🚀 XGBoost# Interface de Análise Genômica da Seringueira �

  - 📍 K-Nearest Neighbors (KNN)

  - 🧠 MLP Neural NetworkInterface web para análise de dados genômicos de *Hevea brasiliensis* (seringueira), desenvolvida com tecnologias modernas para facilitar a análise de SNPs e estrutura populacional.

  - ⚡ AdaBoost

- ✅ Visualização interativa com gráficos de dispersão## 🚀 Funcionalidades

- ✅ Estatísticas detalhadas dos clusters

- ✅ Exportação de resultados em CSV- **Análise de Dados**

- ✅ Interface moderna com Tailwind CSS v4  - Upload de arquivos CSV com dados de SNPs

  - Análise de Componentes Principais (PCA)

### 🔬 Machine Learning - Dois Modos  - Clustering K-means automático

  - Visualização interativa de resultados

#### 1️⃣ JavaScript (Navegador) - Padrão ⚡

- Executa diretamente no navegador- **Visualizações**

- Sem necessidade de servidor Python  - 📊 Gráfico de Dispersão PCA

- Rápido para datasets pequenos/médios  - 📈 Gráfico de Variância dos PCs

- Usa: ml-random-forest, ml-svm, ml-knn  - 🥧 Distribuição dos Clusters

  - 📉 Variância Acumulada

#### 2️⃣ Python (Backend) - Profissional 🐍

- Usa scikit-learn e XGBoost reais- **Recursos**

- Resultados idênticos ao Jupyter Notebook  - Estatísticas detalhadas por cluster

- Melhor para datasets grandes  - Exportação de resultados em CSV

- Requer servidor Python rodando (veja instruções abaixo)  - Interface responsiva e intuitiva

  - Processamento local dos dados

## 🚀 Como Executar

## 🛠️ Tecnologias

### Frontend (React + TypeScript)

- **Core:**

```powershell  - React 18

# Instalar dependências  - TypeScript

npm install  - Vite



# Rodar em modo desenvolvimento- **Estilização:**

npm run dev  - Tailwind CSS

```  - Lucide Icons



Acesse: **http://localhost:5173/**- **Análise de Dados:**

  - ml-pca

### Backend Python (Opcional - para ML avançado)  - ml-kmeans

  - PapaParse

```powershell

# Navegar para pasta backend- **Visualização:**

cd backend  - Recharts

  - D3.js

# Criar ambiente virtual

python -m venv venv## � Instalação

.\venv\Scripts\Activate.ps1

1. Clone o repositório:

# Instalar dependências   ```bash

pip install -r requirements.txt   git clone https://github.com/Claudia-Corazzim/Interface-seringueira.git

   ```

# Rodar servidor

python app.py2. Instale as dependências:

```   ```bash

   cd Interface-seringueira

Servidor disponível em: **http://localhost:5000**   npm install

   ```

📚 **Documentação completa do backend**: [backend/README.md](backend/README.md)

3. Inicie o servidor de desenvolvimento:

## 📦 Tecnologias Utilizadas   ```bash

   npm run dev

### Frontend   ```

- **React 19** + **TypeScript** + **Vite 7**

- **Tailwind CSS 4** - Estilização moderna4. Acesse a aplicação em `http://localhost:5173`

- **ml-pca**, **ml-kmeans**, **ml-random-forest** - ML JavaScript

- **Recharts** - Visualização de dados## 💻 Como Usar

- **PapaParse** - Processamento CSV

- **Lucide React** - Ícones1. **Upload de Dados**

   - Faça upload do arquivo CSV com dados de SNPs

### Backend (Opcional)   - Formato: uma linha por amostra, colunas para cada SNP

- **Flask 3** - Web framework Python

- **scikit-learn 1.5** - Machine Learning2. **Análise PCA**

- **XGBoost 2.1** - Gradient Boosting   - Execute a análise de componentes principais

- **NumPy 1.26** - Computação numérica   - Visualize a variância explicada por cada componente



## 📁 Estrutura do Projeto3. **Clustering**

   - Defina o número de clusters desejado

```   - Execute o algoritmo K-means

Interface-seringueira/   - Analise a distribuição das amostras

├── src/

│   ├── components/4. **Visualização**

│   │   └── SupervisedML.tsx          # Componente ML supervisionado   - Explore diferentes visualizações dos resultados

│   ├── utils/   - Exporte os dados processados

│   │   └── mlAlgorithms.ts           # Implementações ML JavaScript

│   ├── types/## � Dados de Exemplo

│   │   └── ml-libraries.d.ts         # Declarações TypeScript

│   ├── HeveaAnalysisInterface.tsx    # Componente principalIncluímos um conjunto de dados de exemplo com:

│   └── App.tsx- 6 clones de seringueira

├── backend/  - RRIM 600

│   ├── app.py                        # API Flask  - GT1

│   ├── requirements.txt              # Dependências Python  - PB235

│   └── README.md  - IAN 873

├── public/  - PR107

│   └── sample-data/  - AVROS 2037

│       └── hevea_snp_sample.csv      # Dados de exemplo- 15 marcadores SNP por clone

└── README.md- 5 amostras por clone

```- Total: 30 amostras



## 📊 Dados de Exemplo## 🔜 Próximos Passos



Inclusos dados simulados de 6 clones diferentes de seringueira:- [ ] Análise de componentes adicionais (PC3, PC4)

- **RRIM 600, GT1, PB235, IAN 873, PR107, AVROS 2037**- [ ] Implementação de novos algoritmos de clustering

- 15 marcadores SNP por clone- [ ] Análise de diversidade genética

- 5 amostras por clone (30 amostras totais)- [ ] Sistema de filtros avançados

- [ ] Exportação de gráficos em alta resolução

## 🎯 Como Usar- [ ] Integração com dados fenotípicos



1. **Upload**: Carregue um arquivo CSV com dados de SNPs## 📝 Licença

2. **PCA**: Execute análise de componentes principais

3. **Clustering**: Configure e execute K-meansEste projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

4. **ML Supervisionado**: 

   - Escolha entre modo JavaScript (⚡) ou Python (🐍)## ✨ Contribuições

   - Selecione os modelos desejados

   - Configure parâmetros (test size, cross-validation)Contribuições são bem-vindas! Sinta-se à vontade para:

   - Clique em "Treinar Modelos"1. Fazer um fork do projeto

5. **Resultados**: Visualize métricas, matriz de confusão e rankings2. Criar uma branch para sua feature

3. Commitar suas mudanças

## 🔧 Scripts Disponíveis4. Fazer push para a branch

5. Abrir um Pull Request

```powershell

npm run dev      # Servidor desenvolvimento## 📧 Contato

npm run build    # Build para produção

npm run preview  # Preview do buildCláudia Corazzim - [GitHub](https://github.com/Claudia-Corazzim)

npm run lint     # Linter ESLint

```You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



## 🧪 Testando o Backend Python```js

// eslint.config.js

```powershellimport reactX from 'eslint-plugin-react-x'

# Verificar se o servidor está rodandoimport reactDom from 'eslint-plugin-react-dom'

curl http://localhost:5000/api/health

export default defineConfig([

# Listar modelos disponíveis  globalIgnores(['dist']),

curl http://localhost:5000/api/models  {

```    files: ['**/*.{ts,tsx}'],

    extends: [

## 📈 Métricas de ML Disponíveis      // Other configs...

      // Enable lint rules for React

Para cada modelo treinado, o sistema calcula:      reactX.configs['recommended-typescript'],

- **Acurácia** - Proporção de predições corretas      // Enable lint rules for React DOM

- **Acurácia Balanceada** - Média das acurácias por classe      reactDom.configs.recommended,

- **F1-Score** - Média harmônica de precisão e recall    ],

- **Precisão** - Proporção de predições positivas corretas    languageOptions: {

- **Recall** - Proporção de casos positivos identificados      parserOptions: {

- **Matriz de Confusão** - Visualização dos erros de classificação        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Tempo de Treinamento** - Performance do algoritmo        tsconfigRootDir: import.meta.dirname,

      },

## 📝 Próximos Desenvolvimentos      // other options...

    },

- [ ] Visualização 3D PCA com Plotly.js  },

- [ ] Análise de diversidade genética])

- [ ] Integração com dados fenotípicos (DAP)```

- [ ] Análise de estrutura populacional
- [ ] Exportação de gráficos em PDF/PNG
- [ ] Testes unitários e E2E

## 🐛 Troubleshooting

### Erro: "Could not find module ml-svm"
```powershell
npm install ml-svm ml-knn ml-random-forest ml-cart
```

### Erro: Backend Python não conecta
- Verifique se o servidor Python está rodando em `http://localhost:5000`
- No componente React, desmarque "JavaScript (Browser)" para usar Python
- Verifique se instalou as dependências: `pip install -r backend/requirements.txt`

### Erro: Port 5173 já está em uso
```powershell
# Matar processo na porta
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
npm run dev
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License

## 👨‍💻 Autor

Interface científica desenvolvida para análise genômica de *Hevea brasiliensis*.

---

**Nota**: Este projeto é baseado em análises científicas de dados reais de SNPs de seringueira e implementa algoritmos de Machine Learning estado-da-arte para classificação genética.

## 🎓 Referências

- Adaptado de notebooks Jupyter com análises PCA, clustering e ML supervisionado
- Utiliza técnicas de bioinformática para análise de marcadores moleculares
- Implementa best practices de Machine Learning para classificação de genótipos
