import React, { useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

export default function FotoCard({ foto, altura = 200, placeholder = '🖼️', cor = '#EFF6FF' }) {
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);


  const uri = foto && !erro ? foto : null;

  if (!uri) {
    return (
      <View style={[styles.placeholder, { height: altura, backgroundColor: cor }]}>
        <Text style={styles.placeholderIcone}>{placeholder}</Text>
        <Text style={styles.placeholderTexto}>Sem imagem</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri }}
        style={[styles.imagem, { height: altura }]}
        resizeMode="cover"
        onError={() => setErro(true)}
        onLoadEnd={() => setCarregando(false)}
      />
      {carregando && (
        <View style={[styles.placeholder, { height: altura, position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: cor }]}>
          <Text style={styles.placeholderIcone}>{placeholder}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imagem: {
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcone: { fontSize: 40 },
  placeholderTexto: { fontSize: 13, color: '#9CA3AF' },
});