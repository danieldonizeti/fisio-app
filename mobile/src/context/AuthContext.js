import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarToken();
  }, []);

  async function verificarToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      const dadosUsuario = await AsyncStorage.getItem('usuario');
      if (token && dadosUsuario) {
        setUsuario(JSON.parse(dadosUsuario));
        api.defaults.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Erro ao verificar token:', error);
    } finally {
      setCarregando(false);
    }
  }

  async function login(email, senha) {
    const response = await api.post('/api/auth/login/', {
      email: email.trim(),
      password: senha,
    });

    const { access } = response.data;
    await AsyncStorage.setItem('token', access);

    const perfil = await api.get('/api/users/me/', {
      headers: { Authorization: `Bearer ${access}` },
    });

    await AsyncStorage.setItem('usuario', JSON.stringify(perfil.data));
    setUsuario(perfil.data);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
