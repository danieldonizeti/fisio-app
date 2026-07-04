import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import PatologiasScreen from '../screens/patologias/PatologiasScreen';
import PatologiaDetalheScreen from '../screens/patologias/PatologiaDetalheScreen';
import TestesScreen from '../screens/testes/TestesScreen';
import TesteDetalheScreen from '../screens/testes/TesteDetalheScreen';

import ExerciciosScreen from '../screens/exercicios/ExerciciosScreen';
import ExercicioDetalheScreen from '../screens/exercicios/ExercicioDetalheScreen';
import AnatomiaScreen from '../screens/anatomia/AnatomiaScreen';
import AnatomiaListaScreen from '../screens/anatomia/AnatomiaListaScreen';
import AnatomiaDetalheScreen from '../screens/anatomia/AnatomiaDetalheScreen';

import PacientesScreen from '../screens/pacientes/PacientesScreen';
import ConsultaIAScreen from '../screens/consulta_ia/ConsultaIAScreen';
import NovoPacienteScreen from '../screens/pacientes/NovoPacienteScreen';
import PacienteDetalheScreen from '../screens/pacientes/PacienteDetalheScreen';
import AnamneseScreen from '../screens/pacientes/AnamneseScreen';
import NovaSessaoScreen from '../screens/pacientes/NovaSessaoScreen';

import NovaSimulacaoScreen from '../screens/consulta_ia/NovaSimulacaoScreen';
import SimulacaoChatScreen from '../screens/consulta_ia/SimulacaoChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ConteudoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Patologias"
        component={PatologiasScreen}
        options={{ title: 'Patologias', headerTintColor: '#2563EB' }}
      />
      <Stack.Screen
        name="PatologiaDetalhe"
        component={PatologiaDetalheScreen}
        options={{ title: '', headerTintColor: '#2563EB' }}
    />
    <Stack.Screen
      name="TesteDetalhe"
      component={TesteDetalheScreen}
      options={{ title: '', headerTintColor: '#16A34A' }}
    />
      <Stack.Screen
        name="Testes"
        component={TestesScreen}
        options={{ title: 'Testes Especiais', headerTintColor: '#2563EB' }}
      />
      <Stack.Screen
        name="Exercicios"
        component={ExerciciosScreen}
        options={{ title: 'Exercícios', headerTintColor: '#EA580C' }}
      />
      <Stack.Screen
        name="ExercicioDetalhe"
        component={ExercicioDetalheScreen}
        options={{ title: '', headerTintColor: '#EA580C' }}
      />
      <Stack.Screen
        name="AnatomiaLista"
        component={AnatomiaListaScreen}
        options={{ title: '', headerTintColor: '#9333EA' }}
      />
      <Stack.Screen
        name="AnatomiaDetalhe"
        component={AnatomiaDetalheScreen}
        options={{ title: '', headerTintColor: '#9333EA' }}
      />
      <Stack.Screen
        name="Anatomia"
        component={AnatomiaScreen}
        options={{ title: 'Anatomia', headerTintColor: '#9333EA' }}
      />
    </Stack.Navigator>
  );
}
function PacientesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ListaPacientes"
        component={PacientesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NovoPaciente"
        component={NovoPacienteScreen}
        options={{ title: 'Novo Paciente', headerTintColor: '#E11D48' }}
      />
      <Stack.Screen
        name="PacienteDetalhe"
        component={PacienteDetalheScreen}
        options={{ title: '', headerTintColor: '#E11D48' }}
      />
      <Stack.Screen
        name="Anamnese"
        component={AnamneseScreen}
        options={{ title: 'Anamnese', headerTintColor: '#E11D48' }}
      />
      <Stack.Screen
        name="NovaSessao"
        component={NovaSessaoScreen}
        options={{ title: 'Nova Sessão', headerTintColor: '#E11D48' }}
      />
    </Stack.Navigator>
  );
}
function ConsultaIAStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ListaSimulacoes"
        component={ConsultaIAScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NovaSimulacao"
        component={NovaSimulacaoScreen}
        options={{ title: 'Nova Simulação', headerTintColor: '#0284C7' }}
      />
      <Stack.Screen
        name="SimulacaoChat"
        component={SimulacaoChatScreen}
        options={{ title: 'Simulação', headerTintColor: '#0284C7' }}
      />
    </Stack.Navigator>
  );
}

export default function AppRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Conteudo: focused ? 'grid' : 'grid-outline',
            Pacientes: focused ? 'people' : 'people-outline',
            ConsultaIA: focused ? 'chatbubbles' : 'chatbubbles-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Conteudo"
        component={ConteudoStack}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="Pacientes"
        component={PacientesStack}
        options={{ tabBarLabel: 'Pacientes', headerShown: false }}
      />
      <Tab.Screen
        name="ConsultaIA"
        component={ConsultaIAStack}
        options={{ tabBarLabel: 'Simulação IA', headerShown: false }}
      />
    </Tab.Navigator>
  );
}
