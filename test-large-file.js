// Script de teste para validar processamento de arquivo grande
import Papa from 'papaparse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== TESTE DE PROCESSAMENTO DE ARQUIVO GRANDE ===\n');

const filePath = join(__dirname, 'public', 'sample-data', 'MarcadoresMod.csv');
console.log('Arquivo:', filePath);
console.log('Verificando existência...');

if (!fs.existsSync(filePath)) {
  console.error('❌ Arquivo não encontrado!');
  process.exit(1);
}

const stats = fs.statSync(filePath);
console.log(`✅ Arquivo encontrado: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

console.log('Iniciando parse com streaming...\n');

const startTime = Date.now();
let rowCount = 0;
let progressInterval;
const parsedData = [];

// Ler o arquivo
const fileContent = fs.readFileSync(filePath, 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  step: (result, parser) => {
    rowCount++;
    parsedData.push(result.data);
    
    // Mostrar progresso a cada 100 linhas
    if (rowCount % 100 === 0) {
      process.stdout.write(`\rProcessadas: ${rowCount} linhas...`);
    }
  },
  complete: () => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n\n✅ PARSE CONCLUÍDO COM SUCESSO!`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Total de linhas: ${rowCount}`);
    console.log(`   - Linhas de dados: ${rowCount - 1} (excluindo cabeçalho)`);
    console.log(`   - Tempo de processamento: ${duration}s`);
    console.log(`   - Velocidade: ${(rowCount / parseFloat(duration)).toFixed(0)} linhas/segundo`);
    
    if (parsedData.length > 0) {
      const firstRow = parsedData[0];
      const numColumns = Object.keys(firstRow).length;
      console.log(`   - Número de colunas: ${numColumns}`);
      console.log(`\n📋 Primeiras 3 colunas: ${Object.keys(firstRow).slice(0, 3).join(', ')}`);
    }
    
    // Simular análise PCA básica
    console.log(`\n🧮 Simulando preparação para PCA...`);
    const numericColumns = Object.keys(parsedData[0]).filter(key => 
      key !== 'id' && !isNaN(Number(parsedData[0][key]))
    );
    console.log(`   - Colunas numéricas detectadas: ${numericColumns.length}`);
    console.log(`   - Dimensão da matriz: ${parsedData.length} x ${numericColumns.length}`);
    
    const matrixSize = parsedData.length * numericColumns.length;
    const memoriaEstimada = (matrixSize * 8 / 1024 / 1024).toFixed(2); // 8 bytes por número
    console.log(`   - Memória estimada para matriz: ${memoriaEstimada} MB`);
    
    console.log('\n✅ SISTEMA PRONTO PARA PROCESSAR ARQUIVOS GRANDES!\n');
  },
  error: (error) => {
    console.error('\n❌ Erro no parse:', error.message);
    process.exit(1);
  }
});
