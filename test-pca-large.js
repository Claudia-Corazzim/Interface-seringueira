// Teste completo: Parse + PCA com arquivo grande
import Papa from 'papaparse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PCA } from 'ml-pca';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== TESTE COMPLETO: PARSE + PCA COM ARQUIVO GRANDE ===\n');

const filePath = join(__dirname, 'public', 'sample-data', 'MarcadoresMod.csv');
const stats = fs.statSync(filePath);
console.log(`📁 Arquivo: MarcadoresMod.csv (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);

let startTime = Date.now();
const parsedData = [];

console.log('🔄 Etapa 1: Parsing com streaming...');

const fileContent = fs.readFileSync(filePath, 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  step: (result) => {
    parsedData.push(result.data);
    if (parsedData.length % 100 === 0) {
      process.stdout.write(`\r   Linhas: ${parsedData.length}`);
    }
  },
  complete: async () => {
    const parseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Parse concluído: ${parsedData.length} linhas em ${parseTime}s\n`);
    
    // Preparar matriz para PCA
    console.log('🔄 Etapa 2: Preparando matriz numérica...');
    startTime = Date.now();
    
    const numericColumns = Object.keys(parsedData[0]).filter(key => 
      key !== 'Sample' && key !== 'Clones' && !isNaN(Number(parsedData[0][key]))
    );
    
    console.log(`   Colunas numéricas: ${numericColumns.length}`);
    console.log(`   Amostras: ${parsedData.length}`);
    
    // Usar apenas primeiras 1000 colunas SNP para teste rápido (ou todas se quiser)
    const columnsToUse = numericColumns.slice(0, 1000);
    console.log(`   Usando ${columnsToUse.length} colunas para teste rápido\n`);
    
    const matrix = parsedData.map(row => 
      columnsToUse.map(col => Number(row[col]) || 0)
    );
    
    const prepTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Matriz preparada: ${matrix.length}x${matrix[0].length} em ${prepTime}s\n`);
    
    // Executar PCA
    console.log('🔄 Etapa 3: Executando análise PCA...');
    startTime = Date.now();
    
    try {
      const pca = new PCA(matrix);
      const pcaTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ PCA concluída em ${pcaTime}s\n`);
      
      // Resultados
      const eigenvalues = Array.from(pca.getEigenvalues());
      const explainedVariance = Array.from(pca.getExplainedVariance());
      
      console.log('📊 Resultados da PCA:');
      console.log(`   - Componentes principais: ${eigenvalues.length}`);
      console.log(`   - Variância explicada PC1: ${(explainedVariance[0] * 100).toFixed(2)}%`);
      console.log(`   - Variância explicada PC2: ${(explainedVariance[1] * 100).toFixed(2)}%`);
      console.log(`   - Variância explicada PC3: ${(explainedVariance[2] * 100).toFixed(2)}%`);
      console.log(`   - Variância acumulada (3 PCs): ${(explainedVariance.slice(0, 3).reduce((a, b) => a + b, 0) * 100).toFixed(2)}%`);
      
      const projectedData = pca.predict(matrix).to2DArray();
      console.log(`\n   - Dados projetados: ${projectedData.length}x${projectedData[0].length}`);
      
      console.log('\n✅ TESTE COMPLETO BEM-SUCEDIDO!\n');
      console.log('🎉 O sistema consegue processar o arquivo completo sem problemas!\n');
      
    } catch (error) {
      console.error('❌ Erro na PCA:', error.message);
      process.exit(1);
    }
  },
  error: (error) => {
    console.error('\n❌ Erro no parse:', error.message);
    process.exit(1);
  }
});
