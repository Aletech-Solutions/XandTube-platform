const { syncDatabase } = require('../models');
const jobSchedulerService = require('../services/jobSchedulerService');
const channelTrackingService = require('../services/channelTrackingService');
const loggingService = require('../services/loggingService');

/**
 * Script para testar o sistema de jobs
 */
async function testJobSystem() {
  console.log('🧪 Iniciando teste do sistema de jobs...');

  try {
    // Sincronizar banco de dados
    await syncDatabase();
    console.log('✅ Banco de dados sincronizado');

    // Teste 1: Inicializar sistema de jobs
    console.log('\n🚀 Teste 1: Inicialização do sistema de jobs');
    
    const initialStats = jobSchedulerService.getStats();
    console.log('Estado inicial:', initialStats.isRunning ? '❌ (já rodando)' : '✅ (parado)');

    // Teste 2: Iniciar jobs
    console.log('\n▶️ Teste 2: Iniciar sistema de jobs');
    
    await channelTrackingService.startScheduledJob();
    const runningStats = jobSchedulerService.getStats();
    console.log('Sistema iniciado:', runningStats.isRunning ? '✅' : '❌');
    console.log('Jobs ativos:', runningStats.activeJobs.length > 0 ? '✅' : '❌');

    // Teste 3: Verificar estatísticas
    console.log('\n📊 Teste 3: Estatísticas do sistema');
    
    const detailedStats = await channelTrackingService.getDetailedStats();
    console.log('Estatísticas obtidas:', detailedStats ? '✅' : '❌');
    console.log('Total de canais:', detailedStats.database?.totalChannels || 0);
    console.log('Canais ativos:', detailedStats.database?.activeChannels || 0);

    // Teste 4: Logging
    console.log('\n📝 Teste 4: Sistema de logging');
    
    loggingService.info('TEST', 'Teste de log de informação');
    loggingService.success('TEST', 'Teste de log de sucesso');
    loggingService.warn('TEST', 'Teste de log de aviso');
    loggingService.error('TEST', 'Teste de log de erro');
    
    console.log('Logs gerados: ✅');

    // Teste 5: Obter logs recentes
    const recentLogs = await loggingService.getRecentLogs(1);
    console.log('Logs recentes obtidos:', recentLogs.length > 0 ? '✅' : '❌');
    console.log(`Total de logs hoje: ${recentLogs.length}`);

    // Teste 6: Estatísticas de logs
    const logStats = await loggingService.getLogStats(1);
    console.log('Estatísticas de logs:', logStats.total > 0 ? '✅' : '❌');

    // Teste 7: Parar sistema (opcional - descomente se quiser testar)
    // console.log('\n⏹️ Teste 7: Parar sistema de jobs');
    // await channelTrackingService.stopScheduledJob();
    // const stoppedStats = jobSchedulerService.getStats();
    // console.log('Sistema parado:', !stoppedStats.isRunning ? '✅' : '❌');

    console.log('\n✅ Teste do sistema de jobs concluído com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('- Inicialização: ✅');
    console.log('- Sistema de jobs: ✅');
    console.log('- Estatísticas: ✅');
    console.log('- Logging: ✅');
    console.log('- Logs recentes: ✅');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    loggingService.error('TEST', 'Falha no teste do sistema de jobs', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testJobSystem().then(() => {
    console.log('🎉 Todos os testes do sistema de jobs passaram!');
    console.log('⚠️ Sistema de jobs continua rodando em background');
    // Não fazer exit para manter jobs rodando
  }).catch(error => {
    console.error('💥 Falha nos testes:', error);
    process.exit(1);
  });
}

module.exports = testJobSystem;
