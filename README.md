# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

# Interface de Análise Genômica da Seringueira �

Interface web para análise de dados genômicos de *Hevea brasiliensis* (seringueira), desenvolvida com tecnologias modernas para facilitar a análise de SNPs e estrutura populacional.

## 🚀 Funcionalidades

- **Análise de Dados**
  - Upload de arquivos CSV com dados de SNPs
  - Análise de Componentes Principais (PCA)
  - Clustering K-means automático
  - Visualização interativa de resultados

- **Visualizações**
  - 📊 Gráfico de Dispersão PCA
  - 📈 Gráfico de Variância dos PCs
  - 🥧 Distribuição dos Clusters
  - 📉 Variância Acumulada

- **Recursos**
  - Estatísticas detalhadas por cluster
  - Exportação de resultados em CSV
  - Interface responsiva e intuitiva
  - Processamento local dos dados

## 🛠️ Tecnologias

- **Core:**
  - React 18
  - TypeScript
  - Vite

- **Estilização:**
  - Tailwind CSS
  - Lucide Icons

- **Análise de Dados:**
  - ml-pca
  - ml-kmeans
  - PapaParse

- **Visualização:**
  - Recharts
  - D3.js

## � Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/Claudia-Corazzim/Interface-seringueira.git
   ```

2. Instale as dependências:
   ```bash
   cd Interface-seringueira
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse a aplicação em `http://localhost:5173`

## 💻 Como Usar

1. **Upload de Dados**
   - Faça upload do arquivo CSV com dados de SNPs
   - Formato: uma linha por amostra, colunas para cada SNP

2. **Análise PCA**
   - Execute a análise de componentes principais
   - Visualize a variância explicada por cada componente

3. **Clustering**
   - Defina o número de clusters desejado
   - Execute o algoritmo K-means
   - Analise a distribuição das amostras

4. **Visualização**
   - Explore diferentes visualizações dos resultados
   - Exporte os dados processados

## � Dados de Exemplo

Incluímos um conjunto de dados de exemplo com:
- 6 clones de seringueira
  - RRIM 600
  - GT1
  - PB235
  - IAN 873
  - PR107
  - AVROS 2037
- 15 marcadores SNP por clone
- 5 amostras por clone
- Total: 30 amostras

## 🔜 Próximos Passos

- [ ] Análise de componentes adicionais (PC3, PC4)
- [ ] Implementação de novos algoritmos de clustering
- [ ] Análise de diversidade genética
- [ ] Sistema de filtros avançados
- [ ] Exportação de gráficos em alta resolução
- [ ] Integração com dados fenotípicos

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer um fork do projeto
2. Criar uma branch para sua feature
3. Commitar suas mudanças
4. Fazer push para a branch
5. Abrir um Pull Request

## 📧 Contato

Cláudia Corazzim - [GitHub](https://github.com/Claudia-Corazzim)

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
