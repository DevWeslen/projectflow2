# ProjectFlow - Sistema de Gestão de Projetos

ProjectFlow é uma plataforma robusta e moderna para gestão de projetos, desenvolvida para oferecer uma visão clara e controle total sobre cronogramas, tarefas, riscos e indicadores de desempenho (KPIs).

---

## 🏗️ Arquitetura e Design do Sistema

O ProjectFlow foi construído com as tecnologias mais modernas do ecossistema Web para garantir performance, escalabilidade e uma excelente experiência do usuário.

### Tech Stack Detalhada
*   **Framework:** [Next.js 15+](https://nextjs.org/) utilizando **App Router** para renderização híbrida (Server e Client Components).
*   **Banco de Dados:** [SQLite](https://www.sqlite.org/) com [Prisma ORM](https://www.prisma.io/), garantindo uma estrutura de dados tipada e migrações seguras.
*   **Gerenciamento de Estado:** [Zustand](https://docs.pmnd.rs/zustand/) para estados globais leves e reativos.
*   **Interface (UI):** [Tailwind CSS](https://tailwindcss.com/) para estilos e [Radix UI](https://www.radix-ui.com/) (via shadcn/ui) para componentes acessíveis.
*   **Gráficos e Visualização:** [Recharts](https://recharts.org/) para BI e [Mermaid.js](https://mermaid.js.org/) para diagramas de fluxo automáticos.

---

## 🗄️ Camada de Dados (Database Layer)

O banco de dados foi modelado para suportar complexidade mantendo a agilidade:
*   **Projetos & Metas:** Armazenamos KPIs e metas anuais em formatos JSON flexíveis, permitindo que cada projeto tenha suas próprias métricas sem engessar o esquema do banco.
*   **Hierarquia de Tarefas:** Suporte a tarefas pai e filhas (`parentId`), permitindo a criação de subtarefas em níveis infinitos e cálculo automático de progresso consolidado.
*   **Análise de Riscos Extensível:** Um modelo genérico de `RiskAnalysis` que utiliza campos JSON para armazenar diferentes tipos de ferramentas (SWOT, 5W2H, etc) em um único lugar.

---

## 🧩 Módulos e Funcionalidades no Detalhe

### 📋 Gestão de Projetos e Dashboards
*   **Dashboard Consolidado:** Um "centro de comando" que processa dados de todos os projetos em tempo real, gerando indicadores de saúde, progresso global e status de entregas.
*   **Timeline Visual:** Visualização do ciclo de vida do projeto para acompanhamento de prazos e marcos importantes.

### 🧩 Gestão Ágil de Tarefas
*   **Quadro Kanban:** Interface visual com suporte a arraste (drag-and-drop) para gestão do fluxo de trabalho.
*   **Task Tree:** Uma visão estruturada para quem prefere organizar o projeto como uma lista detalhada de entregáveis.
*   **Anexos e Documentação:** Sistema de upload integrado para manter toda a documentação relevante centralizada na tarefa.

### ⚠️ Ferramentas de Qualidade e Risco
Integrado com metodologias de consultoria e gestão de qualidade:
*   **5W2H:** Para planos de ação detalhados (O que, Por que, Onde, Quando, Quem, Como e Quanto).
*   **SWOT:** Análise estratégica de Forças, Fraquezas, Oportunidades e Ameaças.
*   **5 Porquês:** Ferramenta para análise de causa raiz de problemas encontrados durante a execução.

---

## 📦 Estrutura do Repositório

```text
├── app/                  # Rotas e páginas (Next.js App Router)
│   ├── api/              # Endpoints da API (Projetos, Tarefas, Usuários, etc)
│   └── globals.css       # Estilos globais e Tailwind
├── components/           # Componentes React reaproveitáveis
│   ├── ui/               # Componentes de base (Shadcn/UI)
│   ├── risk-tools/       # Ferramentas de análise de risco (5W2H, SWOT, etc)
│   └── ...               # Dashboards, Kanban, Forms
├── lib/                  # Utilitários, configurações do Prisma e funções auxiliares
├── prisma/               # Schema do banco de dados e migrações
├── scripts/              # Scripts auxiliares (Patching, manutenção)
└── ecosystem.config.js   # Configuração de deploy para PM2
```

---

## ⚙️ Instalação e Configuração

### Requisitos
*   Node.js 18+
*   npm ou yarn

### Passo a Passo
1.  **Clonar e Instalar:**
    ```bash
    git clone [url-do-repositorio]
    npm install
    ```
2.  **Preparar Banco de Dados:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```
3.  **Executar (Desenvolvimento):**
    ```bash
    npm run dev
    ```
    Acesse: `http://localhost:3002`

### Deploy com PM2
```bash
npm run build
pm2 start ecosystem.config.js
```

---

## 📝 Notas de Versão
*   Utiliza SQLite local (`dev.db`) para portabilidade.
*   Sistema de permissões baseado em papéis (Roles) definido no modelo de usuário.

---
Desenvolvido com foco em eficiência, visibilidade operacional e gestão de alta performance.
