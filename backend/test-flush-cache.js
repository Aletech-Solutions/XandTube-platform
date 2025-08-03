const http = require('http');

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function testFlushCache() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🗑️ Testando sistema de flush cache...\n');
  
  // Teste 1: Verificar status do cache antes
  try {
    console.log('1. Verificando status do cache antes...');
    const statusBefore = await makeRequest(`${baseUrl}/api/direct-downloads/cache/status`);
    console.log('✅ Status do cache:', statusBefore.status);
    if (statusBefore.data.exists) {
      console.log(`   📁 Cache existe: ${statusBefore.data.exists ? 'Sim' : 'Não'}`);
      console.log(`   💾 Tamanho: ${statusBefore.data.size || 'N/A'}`);
      console.log(`   🕒 Modificado em: ${statusBefore.data.lastModified || 'N/A'}`);
    }
  } catch (error) {
    console.log('❌ Status do cache antes:', error.message);
  }
  
  // Teste 2: Limpar o cache
  try {
    console.log('\n2. Limpando cache...');
    const clearResponse = await makeRequest(`${baseUrl}/api/direct-downloads/cache/clear`, 'POST');
    console.log('✅ Clear cache:', clearResponse.status);
    if (clearResponse.data.message) {
      console.log(`   📝 Mensagem: ${clearResponse.data.message}`);
    }
  } catch (error) {
    console.log('❌ Clear cache:', error.message);
  }
  
  // Teste 3: Verificar status do cache depois
  try {
    console.log('\n3. Verificando status do cache depois...');
    const statusAfter = await makeRequest(`${baseUrl}/api/direct-downloads/cache/status`);
    console.log('✅ Status do cache pós-clear:', statusAfter.status);
    if (statusAfter.data.exists !== undefined) {
      console.log(`   📁 Cache existe: ${statusAfter.data.exists ? 'Sim' : 'Não'}`);
    }
  } catch (error) {
    console.log('❌ Status do cache depois:', error.message);
  }
  
  // Teste 4: Escanear pasta (recriar cache)
  try {
    console.log('\n4. Escaneando pasta (recriando cache)...');
    const scanResponse = await makeRequest(`${baseUrl}/api/direct-downloads/scan/folder`);
    console.log('✅ Scan pasta:', scanResponse.status);
    if (scanResponse.data.totalFound !== undefined) {
      console.log(`   📊 Total encontrado: ${scanResponse.data.totalFound}`);
    }
  } catch (error) {
    console.log('❌ Scan pasta:', error.message);
  }
  
  // Teste 5: Verificar status final
  try {
    console.log('\n5. Verificando status final do cache...');
    const statusFinal = await makeRequest(`${baseUrl}/api/direct-downloads/cache/status`);
    console.log('✅ Status final:', statusFinal.status);
    if (statusFinal.data.exists) {
      console.log(`   📁 Cache recriado: ${statusFinal.data.exists ? 'Sim' : 'Não'}`);
      console.log(`   💾 Novo tamanho: ${statusFinal.data.size || 'N/A'}`);
    }
  } catch (error) {
    console.log('❌ Status final:', error.message);
  }
  
  console.log('\n🏁 Teste de flush cache concluído!');
  console.log('\n💡 Para testar no frontend:');
  console.log('   1. Acesse /historico');
  console.log('   2. Clique no botão "Flush Cache" (vermelho)');
  console.log('   3. Observe o comportamento no console do navegador');
}

testFlushCache().catch(console.error);