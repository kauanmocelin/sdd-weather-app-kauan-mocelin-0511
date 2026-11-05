# Discovery — Weather App

> **Fase:** Discovery (pré-spec)
> **Autor:** Business Analyst (via GitHub Copilot)
> **Data:** 2026-11-05
> **Status:** Rascunho para validação com stakeholders
> **Revisão:** v3 — histórico resumido: (v2) requisitos reclassificados,
> personas, riscos RT/RP, perguntas P1–P22 com impacto, decisões D1–D9;
> (v3) D10 (contrato de geocoding), D11 (cache em localStorage / offline
> mínimo), D12 (observabilidade adiada — resolve RNF12×RNF08), RF08 promovido
> a Must, refresh separado de retry (D9), matriz de navegadores fixada (RNF05),
> régua de performance unificada em RNF14, escopo negativo firmado e tabela WMO
> declarada artefato da spec; (v4) D13 (uma cidade por vez), D14 (sem
> geolocalização) e D15 (sem exigência legal de a11y) fecham P15, P16 e P19 —
> **todas as perguntas técnicas e de produto estão resolvidas**.

---

## 1. Contexto

A empresa solicitou o desenvolvimento de uma **aplicação de previsão do tempo**
voltada a usuários finais. O briefing recebido é intencionalmente enxuto e
descreve cinco capacidades centrais:

1. Buscar cidades;
2. Visualizar o clima atual;
3. Visualizar a previsão para 5 dias;
4. Alternar entre unidades Celsius e Fahrenheit;
5. Utilizar a aplicação em dispositivos móveis.

O produto será construído como uma **aplicação web SPA responsiva** (React +
Vite + TypeScript) — decisão **D6**, seção 7 —, consumindo a **API Open-Meteo** (geocoding + forecast), que é
gratuita e não exige chave de API — o que elimina custos de licenciamento e
gestão de credenciais nesta fase. A entrega segue o fluxo de
**Spec-Driven Development**: este documento alimenta a especificação
(`specs/weather-app-spec.md`), que por sua vez alimenta plano, tarefas e código.

### Público-alvo presumido

Usuários finais genéricos (não especialistas em meteorologia) que desejam
consultar rapidamente as condições do tempo de uma cidade, majoritariamente a
partir de smartphones. Detalhado nas personas da seção 2.

### Problema de negócio

Oferecer uma forma rápida, acessível e confiável de consultar o clima atual e a
previsão de curto prazo, sem fricção de cadastro ou configuração.

---

## 2. Personas

> Personas propostas para ancorar decisões de priorização e UX. Devem ser
> validadas (ou substituídas por pesquisa real) junto aos stakeholders.

### Persona 1 — Mariana, a Planejadora do Dia a Dia 🏃‍♀️

| Atributo | Descrição |
|---|---|
| **Perfil** | 32 anos, analista em empresa pública, mora em Curitiba. Consulta o clima todo dia antes de sair de casa — decide roupa, se leva guarda-chuva e se vai de bicicleta ou ônibus. |
| **Objetivo principal** | Responder em segundos: *"Como está agora e como vai estar hoje na minha cidade?"* |
| **Contexto de uso** | **Mobile (90%)**, em pé, com uma mão, entre 6h30–7h30 da manhã; conexão 4G às vezes instável. Sessões de **menos de 30 segundos**. |
| **Comportamento-chave** | Sempre a mesma cidade → a persistência da última cidade consultada (RF08) é crítica; redigitar a busca toda manhã seria motivo de abandono. |
| **Métrica de sucesso (dela)** | **Tempo até a informação**: abrir o app e ver temperatura atual + condição do dia em **< 5 segundos**, sem nenhum toque adicional. |

### Persona 2 — Carlos, o Viajante que Planeja 🧳

| Atributo | Descrição |
|---|---|
| **Perfil** | 45 anos, representante comercial, viaja 2–3 vezes por mês para cidades diferentes do Brasil. Monta a mala e agenda visitas conforme a previsão. |
| **Objetivo principal** | Comparar a previsão de **5 dias** de cidades que ele *ainda não conhece*, com confiança de que está vendo a cidade certa. |
| **Contexto de uso** | **Misto**: desktop no escritório ao planejar a semana (tela cheia, previsão lado a lado); mobile na véspera e durante a viagem. |
| **Comportamento-chave** | Busca cidades novas com frequência → desambiguação por estado/país (RF01, RP04) é vital: "Santa Cruz" errada = compromisso perdido. Usa °F ocasionalmente em viagens internacionais (RF05). |
| **Métrica de sucesso (dele)** | **Confiabilidade da seleção + horizonte**: encontrar a cidade correta na primeira busca em ≥ 95% das vezes e ver máx/mín dos 5 dias em uma única tela. |

### Implicações para a spec

- **Mariana** valida a priorização de RF08 (persistência) e RNF01/RNF14 (performance) — e é o argumento mais forte a favor da geolocalização (P15).
- **Carlos** justifica RF01 com desambiguação como *Must* e pressiona pela visão de 5 dias legível também em desktop (P7).
- As duas juntas confirmam **mobile-first** com desktop funcional, e **Celsius como padrão** (nenhuma persona primária usa °F no dia a dia — P17).
- Acessibilidade (RNF03/RNF10, RP05) permanece como requisito de qualidade transversal, independente de persona dedicada.

---

## 3. Requisitos Funcionais

| ID | Requisito | Descrição | Prioridade |
|------|-----------|-----------|------------|
| RF01 | Busca de cidades | O usuário pode digitar o nome de uma cidade e obter uma lista de resultados correspondentes (via API de geocoding), incluindo desambiguação por país/região quando houver homônimos. | Must |
| RF02 | Seleção de cidade | O usuário pode selecionar uma cidade da lista de resultados para carregar seus dados climáticos. | Must |
| RF03 | Clima atual | Exibir as condições atuais da cidade selecionada: **temperatura** e **condição do tempo** (ex.: ensolarado, chuvoso), conforme decisão D7. Indicadores complementares ficam fora do MVP. | Must |
| RF04 | Previsão de 5 dias | Exibir a previsão diária para **hoje + 4 dias seguintes** (decisão D2), com, por dia: temperaturas máxima e mínima e condição predominante. | Must |
| RF05 | Alternância de unidade | O usuário pode alternar entre Celsius (°C) e Fahrenheit (°F); a troca deve refletir em todos os valores de temperatura exibidos. | Must |
| RF06 | Estados de interface | Todas as telas devem exibir os estados de **carregamento**, **erro** (ex.: falha de rede/API) e **vazio** (ex.: busca sem resultados). A robustez diante de falhas é tratada no RNF04. | Must |
| RF07 | Tentar novamente | Telas de erro devem oferecer uma ação explícita de **"Tentar novamente"** que reexecuta a operação que falhou. | Must |
| RF08 | Persistência de preferências | A unidade de temperatura escolhida **e a última cidade consultada** devem ser lembradas entre sessões (localStorage, conforme D4). | Must |
| RF09 | Feedback de busca | A busca deve exibir sugestões conforme o usuário digita, sem exigir submissão manual. (Limites de tempo/debounce são definidos no RNF01.) | Should |

> **Reclassificados nesta revisão:** "Uso em dispositivos móveis" e
> "Acessibilidade" eram requisitos não-funcionais listados como RFs; foram
> consolidados em **RNF02** (responsividade) e **RNF03** (acessibilidade).

### Taxonomia de erros (detalha RF06/RF07)

| Caso | Detecção | Mensagem (pt-BR) | Ação oferecida |
|------|----------|------------------|----------------|
| Sem conexão | `fetch` falha / `navigator.onLine` | "Você está sem conexão. Verifique sua internet." | Tentar novamente (RF07); exibir último dado em cache com timestamp (D9), se houver. |
| Timeout da API | Requisição excede ~10 s (`AbortController`) | "O serviço de clima está demorando a responder." | Tentar novamente (RF07). |
| Erro da API (4xx/5xx) | Status HTTP de erro | "Não foi possível obter os dados do clima agora." | Tentar novamente (RF07); exibir cache com timestamp, se houver. |
| Rate limit (429) | Status HTTP 429 | "Muitas consultas em sequência. Aguarde alguns instantes." | Retry automático com backoff curto; depois, RF07. |
| Resposta inválida | Falha de parsing/validação do JSON | "Recebemos dados inesperados do serviço de clima." | Tentar novamente (RF07); logar via error boundary/`console.error` (D12). |
| Busca sem resultados | Lista vazia do geocoding | "Nenhuma cidade encontrada para '{termo}'." | **Estado vazio, não erro**: sugerir revisar a grafia. |

> **Fora de escopo — decidido:** app nativo iOS/Android (D6), previsão horária
> detalhada (D2), indicadores complementares do clima atual (D7),
> login/cadastro (D4), telemetria em produção (D12), service worker/offline
> completo (D11), múltiplas cidades/favoritos (D13), geolocalização
> automática (D14).
> **Fora de escopo — presumido, a validar:** alertas meteorológicos push,
> mapas meteorológicos.

---

## 4. Requisitos Não-Funcionais

| ID | Categoria | Requisito |
|-------|-----------|-----------|
| RNF01 | Desempenho | Busca percebida como imediata: debounce ~300 ms e cancelamento de requisições obsoletas. (A régua de performance de carregamento é única e está em RNF14.) |
| RNF02 | Responsividade | Layout mobile-first, funcional de ~320 px até desktop; áreas de toque ≥ 44×44 px. |
| RNF03 | Acessibilidade | Conformidade com WCAG 2.1 nível AA: semântica HTML, foco visível, suporte a leitores de tela, navegação por teclado. |
| RNF04 | Confiabilidade | Degradação graciosa quando a API estiver indisponível: mensagens de erro claras, sem telas quebradas. (A ação funcional de "Tentar novamente" é o RF07.) |
| RNF05 | Compatibilidade | **Duas últimas versões major** de Chrome, Firefox, Edge e Safari; inclui Safari iOS ≥ 16 e Chrome Android. Fora dessa matriz: melhor esforço, sem suporte garantido. |
| RNF06 | Manutenibilidade | TypeScript em modo strict, lint (Biome) sem erros, componentes pequenos e testáveis, lógica de dados isolada em serviços. |
| RNF07 | Testabilidade | Critérios de aceite cobertos por testes unitários (Vitest + Testing Library) e E2E (Playwright). |
| RNF08 | Segurança/Privacidade | Nenhum dado pessoal coletado; sem chaves de API expostas (Open-Meteo não exige chave); comunicação exclusivamente via HTTPS. |
| RNF09 | Internacionalização | Interface em pt-BR nesta fase; formatação de datas/números respeitando o locale. (Suporte multi-idioma é questão em aberto.) |
| RNF10 | Restrição de design | Tema dark com estética glassmorphism (padrão visual do projeto), mantendo legibilidade com contraste mínimo de 4.5:1 para texto (WCAG AA). |
| RNF11 | Disponibilidade | Aplicação disponível ≥ 99,5% do tempo (hospedagem estática + CDN). Em caso de falha da Open-Meteo, exibir o último dado válido em cache com timestamp de atualização. |
| RNF12 | Observabilidade | **Adiada para pós-MVP (decisão D12)**: sem telemetria externa em produção. No MVP: error boundary + `console.error`; Web Vitals verificados em laboratório via Lighthouse CI. Reintrodução de telemetria exige análise LGPD (P20). |
| RNF13 | Eficiência de rede/dados | Bundle inicial ≤ ~200 KB gzip; cache das respostas de forecast (TTL ~10 min) para reduzir consumo de dados móveis e pressão de rate limit. |
| RNF14 | Performance quantificada | Metas de Core Web Vitals em dispositivo móvel mediano: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 — verificáveis via Lighthouse CI. |
| RNF15 | Capacidade/Escalabilidade | Suportar picos de acesso (ex.: eventos climáticos extremos) sem degradação, viabilizado pela arquitetura de SPA estática servida por CDN. |

---

## 5. Riscos

> Versão expandida: riscos separados em **técnicos (RT)** e **de produto (RP)**,
> com referências cruzadas às perguntas em aberto (P1–P22) e aos RNFs.

### 5.1 Riscos técnicos

| ID | Risco | Probabilidade | Impacto | Estratégia de mitigação |
|----|-------|:---:|:---:|------------------------|
| RT01 | **Dependência total de API de terceiros** (Open-Meteo): indisponibilidade, mudança de contrato ou descontinuação derrubam o app inteiro. | Média | Alto | Isolar acesso em camada de serviço (`src/services/`) com contrato próprio; tratar timeouts e erros; exibir último dado válido em cache com timestamp (RNF11); facilitar troca de provedor. |
| RT02 | **Rate limiting na busca com autocomplete** — cada tecla digitada pode virar uma requisição de geocoding. | Alta | Médio | Debounce (~300 ms), cancelamento de requisições obsoletas (`AbortController`), cache de resultados recentes. |
| RT03 | **Mapeamento incorreto de weather codes** (códigos WMO → ícones/descrições): códigos raros podem renderizar estado quebrado. | Média | Médio | A tabela de mapeamento WMO → descrição/ícone pt-BR é **artefato obrigatório da spec** (não nasce na fase Code); fallback visual para códigos desconhecidos; teste unitário cobrindo todos os códigos documentados. |
| RT04 | **Timezone e cálculo de "dia"** na previsão de 5 dias: usar o fuso do navegador em vez do fuso da cidade mostra dias errados. | Média | Alto | Usar o parâmetro `timezone` da API e as datas retornadas por ela; nunca derivar o dia no cliente; testes com cidades em fusos extremos (ex.: Tóquio, Honolulu). |
| RT05 | **Degradação de performance em mobile real** (3G, devices de entrada), apesar de funcionar no ambiente de dev. | Média | Médio | Orçamentos de bundle (≤ 200 KB gzip) e Core Web Vitals (RNF13/RNF14) verificados via Lighthouse CI; testar com throttling de CPU/rede. |
| RT06 | **Regressões por ausência de testes** derivados dos critérios de aceite (pressão para pular a fase Test). | Média | Alto | Seguir o pipeline SDD: cada tarefa de código só é "done" com `pnpm lint && pnpm build && pnpm test` verdes; E2E Playwright nos fluxos críticos (buscar → selecionar → ver clima → alternar unidade). |
| RT07 | **Estado inconsistente em respostas fora de ordem** (usuário troca de cidade antes da resposta anterior chegar). | Média | Médio | Cancelar/ignorar respostas obsoletas por request-id ou `AbortController`; testes simulando respostas lentas. |

### 5.2 Riscos de produto

| ID | Risco | Probabilidade | Impacto | Estratégia de mitigação |
|----|-------|:---:|:---:|------------------------|
| RP01 | **Expectativa de app nativo** — stakeholder esperava "app na loja" e recebe SPA responsiva (pergunta P6). | Média | Alto | **Mitigado pela decisão D6** (web responsiva, registrada por escrito); PWA instalável permanece como meio-termo possível em evolução futura. |
| RP02 | **Escopo de dados subestimado** — "clima atual" e "5 dias" sem definição de métricas geram retrabalho a cada demo (P10/P11). | Alta | Médio | **Mitigado pelas decisões D2 e D7** (contrato de dados fechado: temperatura + condição no atual; máx/mín + condição no diário). Wireframe de baixa fidelidade antes do código segue recomendado. |
| RP03 | **Ausência de geolocalização percebida como bug** — é o padrão de mercado em apps de clima (P15). | Média | Médio | **Decidido fora do MVP (D14)**: comunicar no roadmap; a persistência da última cidade (RF08) mitiga o caso de uso diário; UI deixa a busca como caminho óbvio. |
| RP04 | **Seleção de cidade errada por homônimos** mina a confiança no produto (P12). | Média | Médio | Exibir país/estado em cada resultado; exigir seleção explícita; nunca autoselecionar o primeiro resultado. |
| RP05 | **Não conformidade de acessibilidade** — ~~bloqueia lançamento~~ **rebaixado pela D15** (sem exigência legal/e-MAG). | Média | Baixo | WCAG 2.1 AA mantido como padrão interno de qualidade (RNF03/RNF10), com critérios de aceite por tarefa e testes de teclado/leitor de tela contínuos. |
| RP06 | **Precisão dos dados questionada** — usuários comparam com outros apps e culpam o produto (P13). | Baixa | Médio | Comunicar a fonte dos dados e horário de atualização na UI; alinhar expectativa de precisão com stakeholders. |
| RP07 | **Produto órfão pós-entrega** — sem dono para monitorar erros e manter dependências (P22). | Média | Alto | Definir responsável de operação antes do ship; documentar runbook básico. **Atenção:** com D12 (sem telemetria no MVP), a detecção de problemas depende de canal de feedback dos usuários — risco residual elevado até a reintrodução da observabilidade pós-MVP. |
| RP08 | **Sucesso indefinido** — sem métricas de negócio, o projeto não tem critério de conclusão (P3). | Alta | Médio | Acordar 2–3 métricas simples (ex.: tempo até primeira previsão exibida, taxa de erro de API, adoção) e instrumentá-las desde o início. |

### 5.3 Leitura rápida

- **Mais urgentes (alta probabilidade):** RT02 (barato de mitigar já no design do serviço de busca) e RP02/RP08 (resolvem-se com conversa, não com código).
- **Maior dano potencial:** RT01, RT04 e RP01 — os dois primeiros são insidiosos porque *parecem funcionar* em dev; o terceiro invalida a arquitetura.

---

## 6. Perguntas em Aberto

> Versão expandida a partir de uma rodada de discovery cética (PM): cada item
> registra a ambiguidade/lacuna do briefing, a pergunta a fazer e o **impacto de
> seguir sem resposta**. Agrupadas por tema; priorização ao final da seção.

### 6.1 Produto e negócio

| ID | Ambiguidade / Lacuna | Pergunta em aberto | Impacto de seguir sem resposta |
|----|---|---|---|
| P1 | **Por que** a empresa quer esse app? Não há problema de negócio declarado. | Qual objetivo de negócio o app atende (produto interno, vitrine técnica, geração de receita, retenção)? | Sem "porquê", qualquer trade-off (prazo vs. qualidade, MVP vs. completo) vira chute. Risco de construir o produto certo para o problema errado. |
| P2 | **Quem** é o usuário? "Usuários" não define persona, região ou contexto de uso. | Quem usa, onde e em que momento (turista, agricultor, público geral BR, global)? | UI, idioma, unidade padrão e até as métricas exibidas mudam por persona. Retrabalho de UX quase garantido. |
| P3 | **Sucesso não é mensurável.** Nenhuma métrica ou critério de aceite de negócio. | Como saberemos que o app "deu certo" (DAU, tempo de resposta, NPS, adoção interna)? | Impossível priorizar ou declarar o projeto concluído; discussões de escopo viram opinião contra opinião. |
| P4 | **Monetização/custo** ausentes. | Há orçamento para APIs pagas, hospedagem, monitoramento? O app pode ter anúncios? | Escolha da API e da infra pode ter que ser refeita se surgirem restrições de custo depois. |
| P5 | **Prazo e marcos** não existem. | Existe data-alvo ou evento que ancora a entrega? | Sem prazo, não dá para fatiar MVP vs. incrementos; com prazo surpresa, corta-se escopo em pânico (geralmente a11y e testes). |

### 6.2 Plataforma e alcance

| ID | Ambiguidade / Lacuna | Pergunta em aberto | Impacto de seguir sem resposta |
|----|---|---|---|
| P6 | **"Usar em dispositivos móveis"** é a frase mais perigosa do briefing. | Web responsiva, PWA instalável ou app nativo nas lojas? | Diferença de **meses** de esforço e de stack inteira. Se a expectativa era "ícone na home via App Store", uma SPA responsiva será percebida como entrega errada. |
| P7 | **Desktop importa?** O briefing só cita mobile. | Desktop é cidadão de primeira classe ou basta "não quebrar"? | Define onde investir esforço de layout e teste cross-browser. |
| P8 | **Suporte offline** não mencionado — mas "mobile" sugere conexões instáveis. | Deve exibir últimos dados em cache sem conexão? | Se for requisito tardio, exige service worker e estratégia de cache que é cara de encaixar depois. |
| P9 | **Navegadores/dispositivos mínimos** indefinidos. | Qual a matriz de suporte (iOS Safari antigo? Android de entrada?) | Bugs descobertos em produção em devices que ninguém testou; polyfills de última hora. |

### 6.3 Funcionalidade e dados

| ID | Ambiguidade / Lacuna | Pergunta em aberto | Impacto de seguir sem resposta |
|----|---|---|---|
| P10 | **"Clima atual"** não diz *quais* métricas. | Só temperatura + condição, ou também sensação térmica, umidade, vento, UV, chuva? | Contrato de dados e layout refeitos a cada "ah, faltou o vento". Cada métrica nova mexe em API, tipos, UI e testes. |
| P11 | **"Previsão de 5 dias"** é ambígua em três eixos. | Inclui hoje ou começa amanhã? Granularidade diária ou horária? Quais campos por dia? | Interpretação errada = feature "pronta" rejeitada na demo. Horário vs. diário muda chamadas de API e UI por completo. |
| P12 | **"Buscar cidades"** — escopo geográfico e desambiguação. | Busca global ou só Brasil? Como tratar homônimos (ex.: 30+ "Santa Cruz")? Aceita CEP/coordenadas? | Usuário vê o clima da cidade errada e perde confiança no produto inteiro. |
| P13 | **Fonte de dados não especificada.** Open-Meteo é *nossa* suposição (S2). | A empresa exige algum provedor (contrato existente, INMET, AccuWeather)? Qual a precisão aceitável? | Trocar de provedor depois invalida contratos de dados, mapeamento de códigos de clima e testes. |
| P14 | **Frequência de atualização** indefinida. | Dados em "tempo real", a cada 10 min, ou só no load? | Expectativa de "tempo real" não atendida gera percepção de app quebrado; polling agressivo estoura rate limit. |
| P15 | **Geolocalização** ("clima onde estou") não citada — mas é o caso de uso nº 1 de apps de clima em mobile. | Detectar localização automaticamente no primeiro acesso? | Se stakeholder assume que sim (é o padrão do mercado), a ausência será vista como bug, não como corte de escopo. |
| P16 | **Favoritos / múltiplas cidades** não citados. | Uma cidade por vez ou lista de favoritas? | Afeta modelo de estado, persistência e navegação — caro de retrofitar. |
| P17 | **Unidade padrão** do toggle C/F. | Começa em Celsius, Fahrenheit, ou detecta pelo locale? A escolha persiste? | Detalhe pequeno, atrito grande: público BR vendo °F no primeiro acesso passa impressão de produto estrangeiro/descuidado. |

### 6.4 Qualidade, conformidade e operação

| ID | Ambiguidade / Lacuna | Pergunta em aberto | Impacto de seguir sem resposta |
|----|---|---|---|
| P18 | **Idioma(s)** não especificado(s). | pt-BR basta ou precisa de EN/ES? | i18n encaixada depois força revisão de todos os componentes e textos. |
| P19 | **Acessibilidade como obrigação** vs. boa prática. | Há exigência legal/corporativa (WCAG AA, e-MAG por contexto de setor público)? | Não conformidade pode **bloquear o lançamento** inteiro em contexto de setor público. |
| P20 | **Privacidade/LGPD** — analytics e geolocalização tocam dados pessoais. | Podemos coletar analytics? Precisa de consentimento para localização? | Coleta sem base legal = risco jurídico; descobrir isso após instrumentar o app = retrabalho + exposição. |
| P21 | **Disponibilidade/SLA** inexistente. | Qual o uptime esperado? O que acontece quando o provedor de dados cair? | Sem SLA acordado, "o app caiu durante a tempestade" (pico de uso!) vira crise sem dono. |
| P22 | **Operação pós-entrega** não definida. | Quem monitora, corrige bugs e mantém depois do ship? | Produto órfão: erros em produção sem ninguém olhando; decisões de observabilidade não são tomadas. |

### 6.5 Priorização das respostas

- **Bloqueia a spec (responder antes de especificar):** P6 — ~~a única que pode invalidar a arquitetura inteira~~ **resolvida pela decisão D6 (web responsiva)**.
- **Risco de rejeição na demo (baratas de perguntar, caras de errar):** P10, P11, P15 — **todas resolvidas** (D7, D2, D14).
- **Bloqueadores silenciosos (aparecem na véspera do lançamento):** P19, P20 — **resolvidos/despressurizados** (D15, D12).
- **Demais:** destraváveis com suposições explícitas e reversíveis (seções 7 e 8).

---

## 7. Decisões

> Decisões fechadas em 2026-11-05 para destravar a especificação. Cada decisão
> promove uma suposição (seção 8) a compromisso firme e fecha (total ou
> parcialmente) perguntas em aberto da seção 6. Mudanças posteriores exigem
> revisão explícita da spec.

| ID | Decisão | Justificativa | O que resolve |
|----|---------|---------------|---------------|
| D1 | **Fonte de dados: Open-Meteo** (geocoding + forecast), sem API key. | Gratuita, sem gestão de credenciais nem risco de vazamento de chave; cobertura global; contrato de dados simples e bem documentado. | Fecha **P13** (provedor de dados); confirma S2. O risco RT01 (dependência de terceiro) permanece e segue mitigado via camada de serviço + cache. |
| D2 | **"5 dias" = hoje + 4 dias seguintes**, granularidade diária. | O dia atual é a informação mais consultada (persona Mariana); previsão iniciando "amanhã" frustraria o caso de uso principal. Granularidade diária mantém o MVP enxuto. | Fecha **P11** (horizonte da previsão); confirma S4. Detalhamento horário fica fora do MVP. |
| D3 | **Unidade padrão: Celsius**, com toggle para Fahrenheit. | Público-alvo primário é pt-BR (personas 1–2); Celsius é o padrão local. Preferência persistida localmente (RF08). | Fecha **P17** (unidade padrão); confirma S5. |
| D4 | **Sem autenticação e sem persistência de servidor** — estado apenas no cliente (localStorage). | Nenhuma feature do MVP exige conta; elimina backend, reduz superfície de segurança e simplifica a arquitetura para SPA estática (RNF11/RNF15). | Confirma S6; reduz drasticamente a exposição de **P20** (LGPD — nenhum dado pessoal sai do dispositivo); reforça RNF08. |
| D5 | **Idioma da UI: pt-BR**, sem i18n multi-idioma nesta fase. | Alinhado às personas e ao contexto da empresa; evita custo de estrutura de i18n sem demanda confirmada. | Fecha **P18** (idiomas); confirma S7. Formatação de datas/números segue o locale pt-BR (RNF09). |
| D6 | **Plataforma: aplicação web responsiva** (SPA mobile-first), sem app nativo nesta fase. | Atende "usar em dispositivos móveis" com o menor custo e prazo; mantém a stack única (React + Vite + TS); PWA instalável fica como evolução possível sem retrabalho. | Fecha **P6** (a pergunta mais crítica do discovery); confirma S1; elimina o risco RP01 como bloqueador de arquitetura. |
| D7 | **Clima atual = apenas temperatura + condição do tempo.** Contrato Open-Meteo: `current.temperature_2m` e `current.weather_code` (mapeado para descrição/ícone em pt-BR). | MVP enxuto e sem ambiguidade: dois campos fecham o contrato de dados, o layout e os testes. Indicadores complementares (sensação térmica, umidade, vento) ficam para iteração futura, sem quebra de contrato (campos aditivos). | Fecha **P10**; revisa S3 (que presumia mais métricas); reduz o risco RP02 (escopo de dados). |
| D8 | **Conversão de unidade no cliente**: os dados são buscados **uma única vez em °C** (unidade nativa da API) e a alternância para °F é feita por **função pura de conversão** no front-end. | Um único fetch por cidade (sem refetch no toggle), cache único e coerente, função trivialmente testável (`celsiusToFahrenheit`), toggle instantâneo mesmo offline/com API lenta. | Fecha a questão arquitetural da alternância (RF05); complementa D3; evita cache duplicado e pressão extra de rate limit (RT02). |
| D9 | **Frescor dos dados**: fetch ao carregar/selecionar cidade; resposta cacheada com **TTL de 10 min**; UI exibe **"Atualizado às HH:MM"**; **ação de refresh própria no caminho feliz** (distinta do "Tentar novamente" do RF07, que pertence às telas de erro). Dado stale (API indisponível) é exibido com o timestamp, nunca ocultado. | Equilibra percepção de "tempo real" com economia de requisições (RT02) e alinha com RNF11/RNF13, que já previam TTL de 10 min e timestamp. Sem polling automático no MVP. | Fecha **P14** (frequência de atualização); viabiliza a degradação graciosa de RNF04/RNF11. |
| D10 | **Contrato de geocoding**: busca **global**, via Open-Meteo Geocoding com `language=pt&count=10`; disparo com **≥ 2 caracteres**; cada resultado exibe **nome, região (admin1) e país**; sem suporte a CEP/coordenadas no MVP. | Fecha o contrato da feature mais interativa do app: nomes localizados ("Londres" encontra London), desambiguação de homônimos (RP04) e limites claros para debounce/cache (RT02). | Fecha **P12**; confirma S8; destrava o desenho da busca (RF01/RF09) na spec. |
| D11 | **Cache de dados em localStorage**: respostas de forecast/geocoding cacheadas em **localStorage** (chave por cidade + timestamp), não apenas em memória. **Exibição de dado stale offline está dentro do MVP; service worker/offline completo está fora.** | Honra a promessa da taxonomia de erros ("exibir último dado em cache" sem conexão) e o RNF11 mesmo após reload; coerente com D4 (estado 100% no cliente). Sem service worker, o custo é ~zero. | Resolve a ambiguidade de D9×D4; delimita **P8** (offline mínimo dentro, offline completo fora); suporta RNF04/RNF11. |
| D12 | **Observabilidade adiada para pós-MVP**: nenhuma telemetria externa (Sentry/analytics) em produção no MVP. Erros tratados com error boundary + `console.error`; Web Vitals verificados **em laboratório** (Lighthouse CI), não em produção. | Elimina a contradição entre RNF12 e RNF08/D4 ("nenhum dado pessoal coletado") sem decisão jurídica pendente (P20). Reintroduzir telemetria exigirá análise LGPD explícita. | Reconcilia **RNF12 × RNF08**; despressuriza **P20**; mantém RNF14 verificável via CI. |
| D13 | **Uma cidade por vez**: o app exibe os dados de uma única cidade selecionada; não há lista de favoritas nem múltiplas cidades no MVP. | Simplifica o modelo de estado (cidade corrente + preferências), a navegação e a persistência (RF08 guarda só a última cidade). Favoritos são evolução aditiva (lista em localStorage) sem quebra de arquitetura. | Fecha **P16**; confirma S9. |
| D14 | **Sem geolocalização automática** no MVP: a busca manual (RF01) é o único caminho de entrada; nenhuma permissão de localização é solicitada. | Evita fluxo de permissão/consentimento (LGPD — alinhado a D4/D12: nenhum dado pessoal), reduz escopo e riscos de UX em negativas de permissão. A persistência da última cidade (RF08) cobre o caso de uso diário da persona Mariana. | Fecha **P15**; completa S10; o risco RP03 vira comunicação de roadmap, não decisão pendente. |
| D15 | **Sem exigência legal/corporativa de acessibilidade** (e-MAG não se aplica): WCAG 2.1 AA permanece como **padrão interno de qualidade** (RNF03/RNF10), não como obrigação de conformidade. | Remove o cenário de bloqueio regulatório de lançamento; mantém o compromisso técnico com a11y já embutido nos critérios de aceite, sem o custo de certificação formal. | Fecha **P19**; rebaixa o impacto de RP05 (de bloqueio de lançamento para qualidade interna). |

> **Ainda em aberto após estas decisões:** nenhuma pergunta **técnica ou de
> produto** bloqueia a spec. Restam apenas questões de contexto de negócio
> (P1–P5: objetivo, métricas de sucesso, prazo; P22: operação pós-entrega),
> que devem ser registradas na spec como premissas de projeto.

---

## 8. Suposições

> Suposições adotadas para destravar a especificação. Cada uma deve ser
> confirmada ou revisada pelos stakeholders; se invalidada, a spec será ajustada.
> **S2, S4, S5, S6 e S7 foram promovidas a decisões firmes (seção 7).**

| ID | Suposição | Status |
|----|-----------|--------|
| S1 | "Dispositivos móveis" = **aplicação web responsiva** (mobile-first), sem app nativo nesta fase. | ✅ Decidida (D6) |
| S2 | A fonte de dados será a **API Open-Meteo** (geocoding + forecast), sem necessidade de API key e sem custo. | ✅ Decidida (D1) |
| S3 | O **clima atual** exibirá, no mínimo: temperatura, condição do tempo, sensação térmica, umidade e velocidade do vento. | ⚠️ Revisada por D7 — apenas **temperatura + condição** no MVP |
| S4 | A **previsão de 5 dias** exibirá, por dia: temperaturas máxima/mínima e condição predominante, iniciando no dia atual. | ✅ Decidida (D2) |
| S5 | A unidade padrão inicial será **Celsius**, com alternância manual para Fahrenheit; a preferência será persistida localmente (localStorage). | ✅ Decidida (D3) |
| S6 | Não haverá autenticação, cadastro ou coleta de dados pessoais. | ✅ Decidida (D4) |
| S7 | O idioma da interface será **pt-BR**, sem i18n multi-idioma nesta fase. | ✅ Decidida (D5) |
| S8 | A busca é **global** (qualquer cidade do mundo coberta pelo geocoding da Open-Meteo), não restrita ao Brasil. | ✅ Decidida (D10) |
| S9 | Apenas **uma cidade por vez** é consultada; favoritos ficam fora do MVP. | ✅ Decidida (D13) |
| S10 | Geolocalização automática e suporte offline ficam **fora do MVP**, podendo entrar em iterações futuras. | ✅ Decidida — geolocalização fora (D14); offline: cache stale dentro, service worker fora (D11) |

---

## Próximos passos

1. Registrar na spec, como premissas de projeto, as questões de negócio ainda
   abertas (P1–P5, P22) — nenhuma bloqueia a especificação técnica;
2. Produzir a especificação formal em [`specs/weather-app-spec.md`](./weather-app-spec.md) (agente **Spec**),
   tomando as decisões D1–D15 como compromissos firmes e incluindo como
   artefatos obrigatórios: critérios de aceite por RF, tabela WMO →
   descrição/ícone (RT03) e wireframe de baixa fidelidade (RP02);
3. Seguir o pipeline SDD: Spec → Plan → Tasks → Code → Test → Review.
