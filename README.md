# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

# Interface para Análise Genômica da Seringueira 🌿

Uma aplicação web moderna para análise de dados genômicos de *Hevea brasiliensis* (seringueira), desenvolvida com React, TypeScript e Vite.

## 🚀 Funcionalidades

- **Upload de Dados SNP**: Interface para carregar arquivos CSV com dados de SNPs
- **Análise PCA**: Análise de Componentes Principais para redução dimensional
- **Clustering K-means**: Agrupamento de amostras baseado nos componentes principais
- **Visualização Interativa**: Gráficos de dispersão com clusters coloridos
- **Exportação de Resultados**: Download dos resultados em formato CSV

## 🛠️ Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Recharts** para visualizações
- **D3.js** para manipulação de dados
- **ML-Matrix** e **ML-PCA** para análises estatísticas
- **PapaParse** para processamento de CSV
- **Lucide React** para ícones

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

## 🏃‍♂️ Como Executar

1. **Instalar dependências:**
```bash
npm install
```

2. **Executar em modo desenvolvimento:**
```bash
npm run dev
```

3. **Abrir no navegador:**
   - Acesse `http://localhost:5173`

## 📊 Dados de Exemplo

O projeto inclui um arquivo de exemplo em `public/sample-data/hevea_snp_sample.csv` com dados simulados de SNPs de diferentes clones de seringueira:

- **RRIM 600**: Clone resistente a doenças
- **GT1**: Clone de alto rendimento
- **PB235**: Clone comercial popular
- **IAN 873**: Clone amazônico
- **PR107**: Clone brasileiro
- **AVROS 2037**: Clone de origem asiática

## 🧬 Como Usar a Interface

### 1. Upload de Dados
- Clique na aba "Upload de Dados"
- Selecione um arquivo CSV com dados de SNPs
- O arquivo deve ter uma coluna 'id' e colunas numéricas para os SNPs

### 2. Análise PCA
- Após o upload, vá para a aba "Análise PCA"
- Clique em "Executar PCA" para calcular os componentes principais
- Visualize a variância explicada por cada componente

### 3. Clustering
- Na aba "Clustering", defina o número de clusters desejado
- Execute o algoritmo K-means baseado nos componentes PC1 e PC2
- Ajuste o número de clusters conforme necessário

### 4. Resultados
- Visualize o gráfico de dispersão com os clusters identificados
- Veja estatísticas detalhadas de cada cluster
- Exporte os resultados completos em CSV

## 📁 Estrutura do Projeto

```
src/
├── HeveaAnalysisInterface.tsx  # Componente principal da interface
├── App.tsx                     # Componente raiz da aplicação
├── main.tsx                    # Ponto de entrada da aplicação
├── index.css                   # Estilos globais com Tailwind
└── assets/                     # Recursos estáticos

public/
└── sample-data/
    └── hevea_snp_sample.csv   # Dados de exemplo
```

## 🔬 Metodologia Científica

### Análise PCA
- Reduz a dimensionalidade dos dados de SNPs
- Identifica os componentes que explicam maior variância
- Facilita a visualização de padrões genéticos

### Clustering K-means
- Agrupa amostras com perfis genéticos similares
- Utiliza os primeiros componentes principais
- Ajuda a identificar estrutura populacional

## 🧪 Formato dos Dados

O arquivo CSV deve seguir este formato:

```csv
id,SNP_1,SNP_2,SNP_3,...
AMOSTRA_001,1,0,1,...
AMOSTRA_002,0,1,0,...
```

- **id**: Identificador único da amostra
- **SNP_X**: Valores binários (0/1) ou alélicos para cada marcador SNP

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍🔬 Sobre a Seringueira

*Hevea brasiliensis* é uma espécie amazônica de grande importância econômica como fonte natural de látex. A análise genômica dessa espécie contribui para:

- Programas de melhoramento genético
- Conservação da diversidade genética
- Identificação de marcadores para características importantes
- Desenvolvimento de clones superiores

---

Desenvolvido com ❤️ para a comunidade científica brasileira

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
