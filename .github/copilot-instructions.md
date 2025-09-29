# Interface para Análise Genômica da Seringueira

Este projeto é uma aplicação web científica para análise de dados genômicos de *Hevea brasiliensis* (seringueira), desenvolvida com React, TypeScript e Vite.

## Funcionalidades Implementadas

- ✅ Upload de arquivos CSV com dados de SNPs
- ✅ Análise PCA (Principal Component Analysis) 
- ✅ Clustering K-means baseado nos componentes principais
- ✅ Visualização interativa com gráficos de dispersão
- ✅ Estatísticas detalhadas dos clusters
- ✅ Exportação de resultados em CSV
- ✅ Interface moderna com Tailwind CSS
- ✅ Dados de exemplo incluídos

## Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Análise Científica**: ml-pca, ml-kmeans, ml-matrix
- **Visualização**: Recharts + D3.js
- **Processamento**: PapaParse para CSV
- **Ícones**: Lucide React

## Estrutura de Arquivos

- `src/HeveaAnalysisInterface.tsx` - Componente principal da interface
- `src/App.tsx` - Componente raiz
- `public/sample-data/hevea_snp_sample.csv` - Dados de exemplo
- `tailwind.config.js` - Configuração do Tailwind com cores customizadas

## Como Executar

O projeto está configurado e rodando em modo desenvolvimento:
- Servidor local: http://localhost:5173/
- Task ativa: "dev-server" (background)

## Dados de Exemplo

Incluí dados simulados de 6 clones diferentes de seringueira:
- RRIM 600, GT1, PB235, IAN 873, PR107, AVROS 2037
- 15 marcadores SNP por clone
- 5 amostras por clone (30 amostras totais)

## Próximos Desenvolvimentos Possíveis

- Análise de mais componentes principais (PC3, PC4, etc.)
- Algoritmos de clustering alternativos (hierarchical, DBSCAN)
- Análise de diversidade genética
- Filtros e buscas avançadas
- Exportação de gráficos
- Análise de estrutura populacional
- Integração com dados fenotípicos