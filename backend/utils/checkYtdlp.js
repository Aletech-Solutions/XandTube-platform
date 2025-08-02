const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkYtdlpInstallation() {
  try {
    const { stdout } = await execPromise('yt-dlp --version', {
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer
    });
    console.log('✅ YT-DLP instalado - Versão:', stdout.trim());
    return true;
  } catch (error) {
    console.error('❌ YT-DLP não está instalado ou não está no PATH');
    console.error('Por favor, instale com: pip install yt-dlp');
    return false;
  }
}

async function testYtdlpWithUrl(url) {
  try {
    console.log('Testando YT-DLP com URL:', url);
    const { stdout } = await execPromise(`yt-dlp --dump-json "${url}"`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    const info = JSON.parse(stdout);
    
    console.log('✅ YT-DLP funcionando corretamente');
    console.log('Tipo:', info._type || 'video');
    console.log('Título:', info.title);
    console.log('É playlist:', !!info.entries);
    
    return info;
  } catch (error) {
    console.error('❌ Erro ao testar YT-DLP:', error.message);
    if (error.stderr) {
      console.error('Stderr:', error.stderr);
    }
    return null;
  }
}

module.exports = {
  checkYtdlpInstallation,
  testYtdlpWithUrl
};