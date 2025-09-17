#!/usr/bin/env node

/**
 * Script para testar thumbnails
 */

const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          size: data.length,
          contentType: res.headers['content-type']
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testThumbnails() {
  console.log('🖼️ Teste de Thumbnails XandTube');
  console.log('=' .repeat(50));
  
  const testUrls = [
    'http://192.168.3.46:3001/api/direct-downloads/83/thumbnail',
    'http://192.168.3.46:3001/api/direct-downloads/177/thumbnail',
    'http://192.168.3.46:3002/api/direct-downloads/83/thumbnail'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔍 Testando: ${url}`);
    
    try {
      const result = await makeRequest(url);
      
      console.log(`✅ Status: ${result.statusCode}`);
      console.log(`📝 Content-Type: ${result.contentType || 'N/A'}`);
      console.log(`📊 Tamanho: ${result.size} bytes`);
      
      if (result.statusCode === 200 && result.contentType && result.contentType.startsWith('image/')) {
        console.log(`🎉 Thumbnail funcionando!`);
      } else if (result.statusCode === 200) {
        console.log(`⚠️ Status 200 mas não é imagem`);
      } else {
        console.log(`❌ Erro HTTP ${result.statusCode}`);
      }
      
    } catch (error) {
      console.log(`💥 Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Resumo:');
  console.log('• Porta 3001: API Backend (thumbnails devem funcionar)');
  console.log('• Porta 3002: Frontend React (deve retornar HTML)');
  console.log('• O problema pode ser proxy/CORS no frontend');
}

testThumbnails();
