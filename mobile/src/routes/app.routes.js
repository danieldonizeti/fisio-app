import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import PatologiasScreen from '../screens/patologias/PatologiasScreen';
import TestesScreen from '../screens/testes/TestesScreen';
import ExerciciosScreen from '../screens/exercicios/ExerciciosScreen';
import AnatomiaScreen from '../screens/anatomia/AnatomiaScreen';
import PacientesScreen from '../screens/pacientes/PacientesScreen';
import ConsultaIAScreen from '../screens/consulta_ia/ConsultaIAScreen';

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
        name="Anatomia"
        component={AnatomiaScreen}
        options={{ title: 'Anatomia', headerTintColor: '#9333EA' }}
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
        component={PacientesScreen}
        options={{ tabBarLabel: 'Pacientes' }}
      />
      <Tab.Screen
        name="ConsultaIA"
        component={ConsultaIAScreen}
        options={{ tabBarLabel: 'Simulação IA' }}
      />
    </Tab.Navigator>
  );
}