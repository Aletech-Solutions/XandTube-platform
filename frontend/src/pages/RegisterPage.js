import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaYoutube, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserCircle } from 'react-icons/fa';
import api from '../services/api';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const RegisterCard = styled.div`
  background: #2d2d2d;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  svg {
    font-size: 50px;
    color: #FF0000;
    margin-bottom: 10px;
  }
  
  h1 {
    color: #333;
    font-size: 28px;
    margin: 0;
  }
  
  p {
    color: #666;
    margin-top: 5px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #555;
  border-radius: 5px;
  font-size: 16px;
  background-color: #2d2d2d;
  color: #ffffff;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &.error {
    border-color: #ff4444;
  }
  
  &.success {
    border-color: #44ff44;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const InputIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 18px;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 18px;
  
  &:hover {
    color: #667eea;
  }
`;

const PasswordStrength = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 5px;
  margin-bottom: 10px;
`;

const StrengthBar = styled.div`
  flex: 1;
  height: 3px;
  background: ${props => props.active ? props.color : '#e0e0e0'};
  border-radius: 3px;
  transition: background-color 0.3s;
`;

const ErrorMessage = styled.p`
  color: #ff4444;
  font-size: 14px;
  margin: 10px 0;
  text-align: center;
`;

const SuccessMessage = styled.p`
  color: #44ff44;
  font-size: 14px;
  margin: 10px 0;
  text-align: center;
`;

const ValidationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
  font-size: 12px;
  
  li {
    color: ${props => props.isValid ? '#44ff44' : '#999'};
    margin: 5px 0;
    
    &::before {
      content: ${props => props.isValid ? '"✓"' : '"○"'};
      margin-right: 8px;
    }
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 10px;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 20px;
  color: #666;
  
  a {
    color: #667eea;
    text-decoration: none;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Validações de senha
  const passwordValidations = {
    length: formData.password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
  };

  // Calcula força da senha
  const getPasswordStrength = () => {
    const validations = Object.values(passwordValidations).filter(v => v).length;
    if (validations <= 1) return { level: 0, color: '#ff4444' };
    if (validations === 2) return { level: 1, color: '#ffaa44' };
    if (validations === 3) return { level: 2, color: '#ffff44' };
    return { level: 3, color: '#44ff44' };
  };

  const passwordStrength = getPasswordStrength();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpa erros do campo específico
    setErrors({
      ...errors,
      [name]: ''
    });
    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.post('/auth/register', registerData);
      
      // Salva token e dados do usuário
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Configura token padrão no axios
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      setMessage('Conta criada com sucesso! Redirecionando...');
      console.log('Cadastro realizado com sucesso!');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrors({
        general: error.response?.data?.error || 'Erro ao criar conta'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <RegisterCard>
        <Logo>
          <FaYoutube />
          <h1>XandTube</h1>
          <p>Crie sua conta</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <FaUser />
            </InputIcon>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FaUserCircle />
            </InputIcon>
            <Input
              type="text"
              name="fullName"
              placeholder="Nome completo"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </InputGroup>

          {formData.password && (
            <>
              <PasswordStrength>
                <StrengthBar active={passwordStrength.level >= 0} color="#ff4444" />
                <StrengthBar active={passwordStrength.level >= 1} color="#ffaa44" />
                <StrengthBar active={passwordStrength.level >= 2} color="#ffff44" />
                <StrengthBar active={passwordStrength.level >= 3} color="#44ff44" />
              </PasswordStrength>
              
              <ValidationList isValid={passwordValidations.length}>
                <li style={{ color: passwordValidations.length ? '#44ff44' : '#999' }}>
                  {passwordValidations.length ? '✓' : '○'} Mínimo 6 caracteres
                </li>
                <li style={{ color: passwordValidations.hasLetter ? '#44ff44' : '#999' }}>
                  {passwordValidations.hasLetter ? '✓' : '○'} Contém letras
                </li>
                <li style={{ color: passwordValidations.hasNumber ? '#44ff44' : '#999' }}>
                  {passwordValidations.hasNumber ? '✓' : '○'} Contém números
                </li>
              </ValidationList>
            </>
          )}

          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirmar senha"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : passwordValidations.match ? 'success' : ''}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </InputGroup>

          {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
          {message && <SuccessMessage>{message}</SuccessMessage>}

          <SubmitButton 
            type="submit" 
            disabled={loading || Object.values(passwordValidations).some(v => !v)}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </SubmitButton>
        </Form>

        <LoginLink>
          Já tem uma conta? <Link to="/login">Fazer login</Link>
        </LoginLink>
      </RegisterCard>
    </Container>
  );
}

export default RegisterPage;