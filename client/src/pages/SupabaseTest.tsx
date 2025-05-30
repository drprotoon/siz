import SupabaseTester from '../components/SupabaseTester';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';

export default function SupabaseTestPage() {
  return (
    <>
  
      
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Teste de Conexão com o Supabase</h1>
            <Button asChild variant="outline">
              <Link href="/">Voltar para a Loja</Link>
            </Button>
          </div>
          
          <p className="text-muted-foreground">
            Esta página permite testar a conexão com o Supabase, verificando se a autenticação e a exibição dos produtos estão funcionando corretamente.
          </p>
          
          <SupabaseTester />
          
          <div className="mt-8 p-4 bg-muted rounded-md">
            <h2 className="text-xl font-semibold mb-2">Informações de Ambiente</h2>
            <ul className="space-y-2">
              <li><strong>Modo:</strong> {import.meta.env.MODE}</li>
              <li><strong>Produção:</strong> {import.meta.env.PROD ? 'Sim' : 'Não'}</li>
              <li><strong>URL da API:</strong> {import.meta.env.VITE_API_URL || '/api'}</li>
              <li><strong>URL do Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 15)}...` : 'Não definido'}</li>
              <li><strong>Chave do Supabase:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 5)}...` : 'Não definido'}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
