import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import OrderTracking from "@/components/OrderTracking";

export default function TrackOrder() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="flex items-center text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a loja
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Rastreamento de Pedido</h1>
        <p className="text-gray-600 mb-8 text-center">
          Digite o código de rastreamento do seu pedido para acompanhar o status da entrega.
        </p>

        <OrderTracking />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Caso tenha algum problema com o rastreamento, entre em contato com nosso suporte.</p>
          <p className="mt-2">
            <Link href="/contact">
              <a className="text-primary hover:underline">Fale Conosco</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
