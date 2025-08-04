import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando confirmação de email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const next = searchParams.get('next') ?? '/dashboard';

        if (!token_hash || !type) {
          setStatus('error');
          setMessage('Link de confirmação inválido ou expirado.');
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error('Erro na confirmação:', error);
          setStatus('error');
          setMessage('Erro ao confirmar email. O link pode ter expirado.');
          toast.error('Erro ao confirmar email');
          return;
        }

        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando...');
        toast.success('Email confirmado com sucesso!');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate(next);
        }, 2000);

      } catch (error: any) {
        console.error('Erro inesperado:', error);
        setStatus('error');
        setMessage('Erro inesperado ao confirmar email.');
        toast.error('Erro inesperado');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-800">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${status === 'loading' ? 'text-white' : getColor()}`}>
            {status === 'loading' && 'Confirmando Email'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </CardTitle>
          <CardDescription className="text-slate-300 dark:text-slate-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'error' && (
            <p className="text-sm text-slate-400 mb-4">
              Tente fazer login novamente ou solicite um novo link de confirmação.
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-slate-400">
              Você será redirecionado automaticamente em alguns segundos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthConfirm;