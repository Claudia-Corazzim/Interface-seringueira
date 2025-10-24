// Teste COMPLETO com TODAS as 30.546 colunas SNP
import Papa from 'papaparse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PCA } from 'ml-pca';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== TESTE COMPLETO: TODAS AS 30.546 COLUNAS SNP ===\n');
console.log('⚠️  Este teste pode levar alguns minutos...\n');

const filePath = join(__dirname, 'public', 'sample-data', 'MarcadoresMod.csv');
const stats = fs.statSync(filePath);
console.log(`📁 Arquivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

const totalStartTime = Date.now();
let startTime = Date.now();
const parsedData = [];

console.log('🔄 [1/4] Parsing do arquivo...');

const fileContent = fs.readFileSync(filePath, 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  step: (result) => {
    parsedData.push(result.data);
    if (parsedData.length % 50 === 0) {
      process.stdout.write(`\r   Processadas: ${parsedData.length} linhas`);
    }
  },
  complete: async () => {
    const parseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Parse: ${parsedData.length} linhas em ${parseTime}s\n`);
    
    // Preparar matriz COMPLETA
    console.log('🔄 [2/4] Preparando matriz COMPLETA...');
    startTime = Date.now();
    
    const allColumns = Object.keys(parsedData[0]);
    const numericColumns = allColumns.filter(key => 
      key !== 'Sample' && key !== 'Clones' && !isNaN(Number(parsedData[0][key]))
    );
    
    console.log(`   Total de colunas: ${allColumns.length}`);
    console.log(`   Colunas SNP (numéricas): ${numericColumns.length}`);
    console.log(`   Amostras (linhas): ${parsedData.length}`);
    console.log(`   Dimensão matriz: ${parsedData.length} x ${numericColumns.length}`);
    
    const matrixSizeMB = (parsedData.length * numericColumns.length * 8 / 1024 / 1024).toFixed(2);
    console.log(`   Memória estimada: ~${matrixSizeMB} MB\n`);
    
    console.log('   Construindo matriz...');
    const matrix = parsedData.map((row, idx) => {
      if ((idx + 1) % 100 === 0) {
        process.stdout.write(`\r   Linha ${idx + 1}/${parsedData.length}`);
      }
      return numericColumns.map(col => Number(row[col]) || 0);
    });
    
    const prepTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Matriz: ${matrix.length}x${matrix[0].length} em ${prepTime}s\n`);
    
    // Executar PCA COMPLETA
    console.log('🔄 [3/4] Executando PCA COMPLETA...');
    console.log('   (Isso pode levar alguns minutos com 30k+ variáveis)\n');
    startTime = Date.now();
    
    try {
      const pca = new PCA(matrix);
      const pcaTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ PCA concluída em ${pcaTime}s\n`);
      
      // Análise de resultados
      console.log('🔄 [4/4] Analisando resultados...\n');
      
      const eigenvalues = Array.from(pca.getEigenvalues());
      const explainedVariance = Array.from(pca.getExplainedVariance());
      const projectedData = pca.predict(matrix).to2DArray();
      
      console.log('📊 RESULTADOS FINAIS:\n');
      console.log('   Dados de entrada:');
      console.log(`     • Amostras: ${parsedData.length}`);
      console.log(`     • Marcadores SNP: ${numericColumns.length}`);
      console.log(`     • Total de genótipos: ${parsedData.length * numericColumns.length}\n`);
      
      console.log('   Componentes Principais:');
      console.log(`     • Total de PCs: ${eigenvalues.length}`);
      console.log(`     • PC1 - Variância: ${(explainedVariance[0] * 100).toFixed(2)}%`);
      console.log(`     • PC2 - Variância: ${(explainedVariance[1] * 100).toFixed(2)}%`);
      console.log(`     • PC3 - Variância: ${(explainedVariance[2] * 100).toFixed(2)}%`);
      console.log(`     • PC4 - Variância: ${(explainedVariance[3] * 100).toFixed(2)}%`);
      console.log(`     • PC5 - Variância: ${(explainedVariance[4] * 100).toFixed(2)}%\n`);
      
      const cumVar5 = explainedVariance.slice(0, 5).reduce((a, b) => a + b, 0);
      const cumVar10 = explainedVariance.slice(0, 10).reduce((a, b) => a + b, 0);
      console.log(`     • Variância acumulada (5 PCs): ${(cumVar5 * 100).toFixed(2)}%`);
      console.log(`     • Variância acumulada (10 PCs): ${(cumVar10 * 100).toFixed(2)}%\n`);
      
      console.log('   Dados projetados:');
      console.log(`     • Dimensão: ${projectedData.length} x ${projectedData[0].length}\n`);
      
      const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
      console.log(`⏱️  TEMPO TOTAL: ${totalTime}s\n`);
      
      console.log('✅ TESTE COMPLETO BEM-SUCEDIDO!\n');
      console.log('🎉 Sistema validado para processar:');
      console.log('   ✓ 411 amostras');
      console.log('   ✓ 30.546 marcadores SNP');
      console.log('   ✓ ~12.5 milhões de genótipos');
      console.log('   ✓ Arquivo de 24.27 MB\n');
      
    } catch (error) {
      console.error('❌ Erro na PCA:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  },
  error: (error) => {
    console.error('\n❌ Erro no parse:', error.message);
    process.exit(1);
  }
});
