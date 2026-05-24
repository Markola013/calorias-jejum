'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const signupSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  confirmPassword: z.string().min(6, 'A confirmação de senha deve ter no mínimo 6 caracteres.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/onboarding');
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: SignupFormValues) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update Firebase auth display name
      await updateProfile(userCredential.user, {
        displayName: data.name
      });

      toast.success('Conta criada com sucesso!');
      router.push('/onboarding');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está sendo utilizado por outra conta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O endereço de e-mail inserido é inválido.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'O cadastro por e-mail e senha está desabilitado.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha digitada é muito fraca.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 overflow-hidden">
      {/* Decorative Blur Background Bulbs */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Criar Conta</CardTitle>
          <CardDescription className="text-zinc-400">
            Cadastre-se no NutriFast para começar a monitorar sua saúde.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Nome Completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  {...register('name')}
                  type="text"
                  placeholder="Seu nome"
                  className={`pl-10 border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 ${
                    errors.name ? 'border-red-500 focus-visible:ring-red-500/50' : ''
                  }`}
                  disabled={submitting}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="exemplo@email.com"
                  className={`pl-10 border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 ${
                    errors.email ? 'border-red-500 focus-visible:ring-red-500/50' : ''
                  }`}
                  disabled={submitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  className={`pl-10 border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 ${
                    errors.password ? 'border-red-500 focus-visible:ring-red-500/50' : ''
                  }`}
                  disabled={submitting}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Repita sua senha"
                  className={`pl-10 border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 ${
                    errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500/50' : ''
                  }`}
                  disabled={submitting}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/20"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-zinc-500">
          <p>
            Já possui uma conta?{' '}
            <Link href="/login" className="text-emerald-400 hover:underline transition-colors">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
