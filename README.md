# 🥗 NutriFast - Sistema Premium de Registro de Calorias, Hidratação e Jejum

O **NutriFast** é um web-app de alto padrão para saúde e nutrição, desenvolvido de forma modular. Ele conta com um design totalmente responsivo e híbrido (Dual-Mode: Sidebar elegante no desktop e barra inferior fluida em smartphones). O sistema oferece acompanhamento calórico diário, controle de macronutrientes, histórico de pesagem, metas inteligentes e um cronômetro de jejum interativo em tempo real.

---

## 🌟 Principais Funcionalidades

### 📊 1. Dashboard Principal (Painel)
* **Anel de Progresso SVG**: Exibição circular geométrica precisa do consumo de calorias vs. meta diária.
* **Proporção de Macronutrientes**: Medidores horizontais fluídos para acompanhar carboidratos, proteínas e gorduras em tempo real.
* **Reservatório de Água Interativo**: Barra de nível dinâmica que simula o preenchimento de água consumida ao longo do dia.
* **Mini-Widgets de Status**: Resumos de jejum ativo, pesagem atual e metas hídricas.

### 🍎 2. Diário de Refeições
* **Categorização por Período**: Registro de alimentos subdivididos em Café da Manhã, Almoço, Jantar e Lanches.
* **Cálculo Nutricional**: Somatório automático em tempo real de calorias, carboidratos, proteínas e gorduras ingeridos no dia.
* **Gerenciador de Alimentos**: Possibilidade de adicionar novos registros com formulários e remover itens facilmente com exclusão instantânea.

### ⏱️ 3. Cronômetro de Jejum Interativo
* **Anel de Contagem Ativo**: Relógio que atualiza a duração do jejum a cada segundo com cálculo de porcentagem de conclusão.
* **Protocolos Populares**: Suporte a protocolos clássicos (12:12, 14:10, 16:8, 18:6, 20:4) ou ajuste livre customizável.
* **Ajuste Retroativo**: Opção de iniciar jejuns de forma retroativa (ex: há 30 min ou 1 hora atrás).
* **Notas de Humor e Sintomas**: Ao encerrar o jejum, o usuário pode registrar notas sobre como se sentiu.

### ⚖️ 4. Registro de Peso Corporal
* **Variação Inteligente (Delta)**: O app sinaliza a variação em kg em relação à meta do usuário.
* **Goal Tracking**: Compara se o usuário está acima ou abaixo do peso desejado com cores adaptativas (verde para progresso, roxo para alvo).

### 📈 5. Análise de Desempenho e Evolução
* **Gráfico de Evolução de Peso**: Gráfico de linha (`Recharts`) mostrando a variação de peso ao longo do tempo.
* **Gráfico de Calorias Semanais**: Gráfico de barras comparando a ingestão diária de calorias com a meta do usuário nos últimos 7 dias.
* **Insights de Consistência**: Métricas de porcentagem de jejuns concluídos sem interrupção e horas totais de autofagia.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: [Next.js (App Router)](https://nextjs.org) + React 19
* **Linguagem**: [TypeScript](https://www.typescriptlang.org) (Tipagem estrita livre de `any`)
* **Estilização**: [Tailwind CSS (v4)](https://tailwindcss.com) (Visual escuro premium, glassmorphism e OKLCH)
* **Componentes de UI**: [shadcn/ui](https://ui.shadcn.com) + [Lucide React Icons](https://lucide.dev)
* **Banco de Dados & Autenticação**: [Firebase (Auth & Cloud Firestore)](https://firebase.google.com)
* **Gráficos**: [Recharts](https://recharts.org)
* **Formulários e Validação**: [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
* **Manipulação de Datas**: [date-fns](https://date-fns.org)

---

## 📂 Arquitetura do Projeto

```text
calorias-jejum/
├── app/
│   ├── layout.tsx              # RootLayout (next-themes, AuthContext, Sonner Toaster)
│   ├── page.tsx                # Dashboard principal: Anel de calorias SVG e status
│   ├── login/                  # Tela de Login com Zod validation
│   ├── signup/                 # Tela de Registro de conta
│   ├── onboarding/             # Onboarding: Mifflin-St Jeor TDEE e metas corporais
│   ├── meals/                  # Gerenciador de refeições e macronutrientes
│   ├── fasting/                # Cronômetro visual e histórico de jejum
│   ├── water/                  # Interface do copo de água e incrementos
│   ├── weight/                 # Logs de pesagem e deltas dinâmicos com goal tracking
│   └── analytics/              # Recharts de peso e ingestão semanal de calorias
├── components/
│   ├── ui/                     # Componentes básicos (button, input, card, dialog, sonner)
│   ├── layout/                 # MobileShell: Layout Responsivo Desktop/Mobile
│   └── theme-provider.tsx      # Configuração de tema escuro/claro
├── context/
│   └── AuthContext.tsx         # Provedor global de estado de autenticação e profile fetch
├── lib/
│   ├── firebase.ts             # Instanciação do Firebase Client SDK
│   ├── firestore-services.ts   # camada de persistência de dados (CRUD)
│   ├── tdee.ts                 # Algoritmo de TDEE e Mifflin-St Jeor
│   └── utils.ts                # Fusão de classes do Tailwind
├── types/
│   └── index.ts                # Contratos e interfaces de tipos TypeScript
└── package.json
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o projeto e instalar dependências
```bash
git clone <url-do-repositorio>
cd calorias-jejum
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto e configure suas credenciais do Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=SUA_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID
```

### 3. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra o navegador em **[http://localhost:3000](http://localhost:3000)** para ver o sistema rodando!

---

## 🎓 Contexto Acadêmico
Este sistema foi desenvolvido como projeto de cunho acadêmico, aplicando conceitos avançados de **Desenvolvimento Web Moderno**, **Arquitetura Responsiva Híbrida**, **Bancos de Dados NoSQL em Nuvem** e **Cálculos Fisiológicos Científicos** (Fórmula de Mifflin-St Jeor para Taxa Metabólica Basal e Gasto Energético Diário Total).
