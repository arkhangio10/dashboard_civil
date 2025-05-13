// src/components/common/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginForm.scss';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error de inicio de sesión', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img 
          src="https://storage.googleapis.com/formulario-hergonsa-produccion/logo_oficial.png" 
          alt="Logo" 
          className="login-logo" 
        />
        <h3>Acceso al Dashboard</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Correo electrónico:</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Contraseña:</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="d-grid">
          <button 
            type="submit" 
            id="login-button" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </div>
        
        {error && (
          <div className="auth-message" id="auth-message">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;