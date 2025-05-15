// API handler for Vercel - Integração com o servidor Express existente
// Este arquivo serve como ponto de entrada para as funções serverless da Vercel
// Ele importa e utiliza o servidor Express existente em server/vercel.ts

// Importar o servidor Express configurado para o Vercel
import app from '../server/vercel';

// Exportar o servidor Express para a Vercel
export default app;
