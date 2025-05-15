// Arquivo JavaScript básico para o Vercel
// Este arquivo será usado se o build do TypeScript falhar

import React from 'react';
import { createRoot } from 'react-dom/client';

// Componente básico para a página inicial
function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>SIZ Cosméticos</h1>
      <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', marginBottom: '30px' }}>
        Bem-vindo à nossa loja de cosméticos e produtos de beleza premium. 
        Encontre perfumes, maquiagem, skincare e muito mais.
      </p>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '20px',
        maxWidth: '1200px'
      }}>
        {['Perfumes Femininos', 'Perfumes Masculinos', 'Skincare', 'Maquiagem'].map(category => (
          <div key={category} style={{
            width: '280px',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            backgroundColor: '#fff'
          }}>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>{category}</h2>
            <p style={{ color: '#666' }}>Explore nossa coleção de {category.toLowerCase()}</p>
            <button style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Ver Produtos
            </button>
          </div>
        ))}
      </div>
      <footer style={{ marginTop: '50px', color: '#999', fontSize: '14px' }}>
        © {new Date().getFullYear()} SIZ Cosméticos. Todos os direitos reservados.
      </footer>
    </div>
  );
}

// Renderizar o componente
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Elemento root não encontrado');
}
