const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
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
  });
}

async function testRecommendations() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🎯 Testando sistema de recomendações...\n');
  
  // Teste 1: Recomendações gerais (populares)
  try {
    console.log('1. Testando recomendações gerais...');
    const generalResponse = await makeRequest(`${baseUrl}/api/recommendations`);
    console.log('✅ Recomendações gerais:', generalResponse.status);
    if (generalResponse.data.recommendations) {
      console.log(`   📊 ${generalResponse.data.recommendations.length} vídeos encontrados`);
      console.log(`   🎬 Primeiro vídeo: ${generalResponse.data.recommendations[0]?.title || 'N/A'}`);
    }
  } catch (error) {
    console.log('❌ Recomendações gerais:', error.message);
  }
  
  // Teste 2: Recomendações para vídeo específico
  try {
    console.log('\n2. Testando recomendações para vídeo específico...');
    const videoId = 'Htm6wnKPqKw_1754242008929'; // ID de exemplo
    const videoResponse = await makeRequest(`${baseUrl}/api/recommendations/${videoId}`);
    console.log('✅ Recomendações para vídeo:', videoResponse.status);
    if (videoResponse.data.recommendations) {
      console.log(`   📊 ${videoResponse.data.recommendations.length} recomendações encontradas`);
      console.log(`   🎯 Para vídeo: ${videoId}`);
    }
  } catch (error) {
    console.log('❌ Recomendações para vídeo:', error.message);
  }
  
  // Teste 3: Recomendações com limite personalizado
  try {
    console.log('\n3. Testando com limite personalizado...');
    const limitResponse = await makeRequest(`${baseUrl}/api/recommendations?limit=5`);
    console.log('✅ Recomendações com limite:', limitResponse.status);
    if (limitResponse.data.recommendations) {
      console.log(`   📊 ${limitResponse.data.recommendations.length} vídeos retornados (limite: 5)`);
    }
  } catch (error) {
    console.log('❌ Recomendações com limite:', error.message);
  }
  
  console.log('\n🏁 Teste concluído!');
}

testRecommendations().catch(console.error);