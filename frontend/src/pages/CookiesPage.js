import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './CookiesPage.css';

const CookiesPage = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState('chrome');
  const [extractionScript, setExtractionScript] = useState('');
  const [stats, setStats] = useState({});

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    cookieText: '',
    browserSource: 'chrome'
  });

  useEffect(() => {
    loadCookies();
    loadStats();
  }, []);

  const loadCookies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cookies');
      setCookies(response.data.data || []);
    } catch (err) {
      setError('Erro ao carregar cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/cookies/stats');
      setStats(response.data.data || {});
    } catch (err) {
      console.warn('Erro ao carregar estatísticas:', err);
    }
  };

  const handleUploadCookies = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.cookieText.trim()) {
      setError('Texto dos cookies é obrigatório');
      return;
    }

    try {
      setLoading(true);
      await api.post('/cookies', uploadForm);
      setSuccess('Cookies salvos com sucesso!');
      setShowUploadModal(false);
      setUploadForm({
        name: '',
        description: '',
        cookieText: '',
        browserSource: 'chrome'
      });
      loadCookies();
      loadStats();
    } catch (err) {
      setError('Erro ao salvar cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateCookies = async (cookieId) => {
    try {
      setLoading(true);
      const response = await api.put(`/cookies/${cookieId}/activate`);
      setSuccess(response.data.message);
      loadCookies();
    } catch (err) {
      setError('Erro ao ativar cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCookies = async (cookieId) => {
    try {
      setLoading(true);
      const response = await api.post(`/cookies/${cookieId}/validate`);
      setSuccess(response.data.message);
      loadCookies();
    } catch (err) {
      setError('Erro ao validar cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCookies = async (cookieId) => {
    if (!window.confirm('Tem certeza que deseja remover estes cookies?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/cookies/${cookieId}`);
      setSuccess('Cookies removidos com sucesso!');
      loadCookies();
      loadStats();
    } catch (err) {
      setError('Erro ao remover cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleShowScript = async (browser) => {
    try {
      const response = await api.get(`/cookies/extraction-script/${browser}`);
      setExtractionScript(response.data.data.script);
      setSelectedBrowser(browser);
      setShowScriptModal(true);
    } catch (err) {
      setError('Erro ao obter script: ' + (err.response?.data?.error || err.message));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Script copiado para a área de transferência!');
    }).catch(() => {
      setError('Erro ao copiar script');
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-success', text: 'Ativo' },
      invalid: { class: 'badge-danger', text: 'Inválido' },
      expired: { class: 'badge-warning', text: 'Expirado' },
      inactive: { class: 'badge-secondary', text: 'Inativo' }
    };
    
    const badge = badges[status] || badges.inactive;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="cookies-page">
      <div className="page-header">
        <h1>Gerenciamento de Cookies</h1>
        <p>Gerencie cookies do YouTube para evitar bloqueios e acessar conteúdo restrito</p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total de Cookies</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active || 0}</div>
          <div className="stat-label">Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.valid || 0}</div>
          <div className="stat-label">Válidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalUsage || 0}</div>
          <div className="stat-label">Usos Totais</div>
        </div>
      </div>

      {/* Ações principais */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          📤 Adicionar Cookies
        </button>
        
        <div className="extraction-buttons">
          <span>Extrair cookies do navegador:</span>
          <button 
            className="btn btn-outline"
            onClick={() => handleShowScript('chrome')}
          >
            🌐 Chrome
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => handleShowScript('firefox')}
          >
            🦊 Firefox
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => handleShowScript('manual')}
          >
            📖 Manual
          </button>
        </div>
      </div>

      {/* Lista de cookies */}
      <div className="cookies-list">
        {loading && <div className="loading">Carregando cookies...</div>}
        
        {!loading && cookies.length === 0 && (
          <div className="empty-state">
            <h3>Nenhum cookie encontrado</h3>
            <p>Adicione cookies para melhorar a compatibilidade com o YouTube</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              Adicionar Primeiro Cookie
            </button>
          </div>
        )}

        {cookies.map(cookie => (
          <div key={cookie.id} className="cookie-card">
            <div className="cookie-header">
              <h3>{cookie.name}</h3>
              {getStatusBadge(cookie.status)}
            </div>
            
            <div className="cookie-info">
              <div className="info-row">
                <span className="label">Navegador:</span>
                <span>{cookie.browserSource || 'Desconhecido'}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Criado em:</span>
                <span>{formatDate(cookie.createdAt)}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Último uso:</span>
                <span>{formatDate(cookie.lastUsed)}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Vezes usado:</span>
                <span>{cookie.timesUsed || 0}</span>
              </div>
              
              {cookie.expiresIn && (
                <div className="info-row">
                  <span className="label">Expira em:</span>
                  <span>{cookie.expiresIn}</span>
                </div>
              )}
              
              {cookie.description && (
                <div className="info-row">
                  <span className="label">Descrição:</span>
                  <span>{cookie.description}</span>
                </div>
              )}
              
              {cookie.validationError && (
                <div className="info-row error">
                  <span className="label">Erro:</span>
                  <span>{cookie.validationError}</span>
                </div>
              )}
            </div>
            
            <div className="cookie-actions">
              {cookie.status === 'active' && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleActivateCookies(cookie.id)}
                >
                  ✅ Ativar no Sistema
                </button>
              )}
              
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => handleValidateCookies(cookie.id)}
              >
                🔍 Validar
              </button>
              
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteCookies(cookie.id)}
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de upload */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Adicionar Cookies</h2>
              <button 
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUploadCookies} className="modal-body">
              <div className="form-group">
                <label>Nome (opcional):</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                  placeholder="Ex: Cookies Chrome 2024"
                />
              </div>
              
              <div className="form-group">
                <label>Navegador:</label>
                <select
                  value={uploadForm.browserSource}
                  onChange={(e) => setUploadForm({...uploadForm, browserSource: e.target.value})}
                >
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="edge">Edge</option>
                  <option value="safari">Safari</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Descrição (opcional):</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  placeholder="Descreva quando/como estes cookies foram obtidos"
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Cookies (formato Netscape):*</label>
                <textarea
                  value={uploadForm.cookieText}
                  onChange={(e) => setUploadForm({...uploadForm, cookieText: e.target.value})}
                  placeholder="Cole aqui o conteúdo do arquivo cookies.txt..."
                  rows="10"
                  required
                />
                <small>
                  Cole o conteúdo do arquivo cookies.txt no formato Netscape. 
                  Use os scripts de extração para obter os cookies automaticamente.
                </small>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Salvar Cookies
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de script */}
      {showScriptModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Script de Extração - {selectedBrowser.charAt(0).toUpperCase() + selectedBrowser.slice(1)}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowScriptModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="script-instructions">
                <h3>Instruções:</h3>
                <ol>
                  <li>Faça login no YouTube no seu navegador</li>
                  <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
                  <li>Vá para a aba "Console"</li>
                  <li>Cole o script abaixo e pressione Enter</li>
                  <li>O arquivo cookies.txt será baixado automaticamente</li>
                  <li>Abra o arquivo e cole o conteúdo no formulário acima</li>
                </ol>
              </div>
              
              <div className="script-container">
                <div className="script-header">
                  <span>Script para {selectedBrowser}:</span>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => copyToClipboard(extractionScript)}
                  >
                    📋 Copiar Script
                  </button>
                </div>
                <pre className="script-code">{extractionScript}</pre>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => copyToClipboard(extractionScript)}
                >
                  📋 Copiar Script
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowScriptModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookiesPage;
