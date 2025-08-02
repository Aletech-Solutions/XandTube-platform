import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px 20px;
`;

const ErrorTitle = styled.h2`
  color: #fff;
  font-size: 24px;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  color: #aaa;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 24px;
  max-width: 500px;
`;

const ErrorButton = styled.button`
  padding: 12px 24px;
  background-color: #065fd4;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0751ba;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para que a próxima renderização mostre a UI de erro
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Você pode registrar o erro em um serviço de relatório de erro
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Ops! Algo deu errado</ErrorTitle>
          <ErrorMessage>
            Ocorreu um erro inesperado na aplicação. 
            Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
          </ErrorMessage>
          <ErrorButton onClick={this.handleReload}>
            Recarregar Página
          </ErrorButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;