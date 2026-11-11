# Backlog de Tarefas — Weather App

> Derivado de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md). Os RFs e critérios de aceite da especificação prevalecem em caso de divergência.

As tarefas foram separadas por camada e por resultado verificável. Dependências devem estar concluídas antes do início da tarefa; `—` significa que não há dependência no backlog.

## Entrega 1 — Tipos do domínio

### T-01 — Definir os tipos de domínio
- **Descrição:** Criar contratos compartilhados para unidade, cidade, clima atual, previsão diária e conjunto de dados.
- **Critérios de aceite:** `Unit`, `City`, `CurrentWeather`, `ForecastDay` e `WeatherData` incluem os campos definidos no plano; temperaturas do domínio são `number` em Celsius; o arquivo não importa React; `pnpm build` conclui sem erro de tipo. (RF03–RF05, RF08)
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data

## Entrega 2 — Funções puras

### T-02 — Normalizar e validar consultas de cidade
- **Descrição:** Implementar função pura de normalização e validação do termo de busca.
- **Critérios de aceite:** `"  São José  "` normaliza para `"São José"`; `"a"` e texto vazio são inválidos e `"ab"` é válido; acentos, espaços internos, apóstrofos e hífens permanecem inalterados; CEPs e coordenadas não são convertidos em outro tipo de consulta. (RF01, RF09)
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/searchQuery.ts`
- **Tipo:** Data

### T-03 — Converter e formatar temperaturas
- **Descrição:** Implementar a conversão Celsius/Fahrenheit e formatação de apresentação.
- **Critérios de aceite:** Conversões retornam 32 para 0 °C, 212 para 100 °C e -40 para -40 °C; formatação arredonda para o inteiro mais próximo; alternar unidade não modifica o valor Celsius recebido. (RF05)
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data

### T-04 — Formatar datas civis
- **Descrição:** Implementar formatação pt-BR de datas recebidas para o fuso da cidade.
- **Critérios de aceite:** Uma entrada `YYYY-MM-DD` conserva o mesmo dia civil em fusos de dispositivo UTC-12 e UTC+14; a saída de apresentação usa locale `pt-BR`. (RF03, RF04, RNF09)
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/format.ts`
- **Tipo:** Data

### T-05 — Mapear códigos WMO
- **Descrição:** Mapear códigos meteorológicos para descrição pt-BR e categoria de ícone.
- **Critérios de aceite:** Cada código da tabela WMO da spec retorna exatamente sua descrição e categoria de ícone; código não listado retorna “Condição indisponível” e ícone neutro, preservando os valores de temperatura. (RF03, RF04)
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`
- **Tipo:** Data

## Entrega 3 — Serviços e persistência

### T-06 — Implementar serviço de geocoding
- **Descrição:** Encapsular a busca de cidades e o mapeamento de resultados da Open-Meteo.
- **Critérios de aceite:** Requisição usa endpoint HTTPS de geocoding, `language=pt`, `count=10`, `format=json` e `name` URL-encoded; resultado válido mapeia id, nome, latitude e longitude, copiando país/região apenas quando presentes; `results` vazio retorna lista vazia; falhas HTTP, rede e JSON incompatível retornam erro tipado; sinal de abort é encaminhado ao `fetch`. (RF01)
- **Dependências:** T-01, T-02
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data

### T-07 — Resolver política de HTTP 429
- **Descrição:** Alinhar a política de retry entre RF07, AC07.4, OQ08 e o plano antes da implementação.
- **Critérios de aceite:** RF07, AC07.4, OQ08 e o plano descrevem a mesma regra; ela especifica número máximo de retries automáticos e condição/intervalo de espera; nenhum intervalo fixo é introduzido sem decisão registrada. (RF07)
- **Dependências:** —
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra

### T-08 — Implementar serviço de forecast
- **Descrição:** Consultar e validar o payload agregado de clima atual e cinco dias.
- **Critérios de aceite:** URL contém latitude/longitude selecionadas, `current=temperature_2m,weather_code`, os campos diários, `forecast_days=5`, `timezone=auto` e `temperature_unit=celsius`; só retorna sucesso com cinco datas consecutivas e vetores alinhados; campos meteorológicos nulos/ausentes são mapeados para `null`, enquanto tipos inválidos/datas inválidas retornam erro tipado; timeout aborta após 10 s; `retrievedAt` é timestamp ISO gerado no recebimento; cancelamento é encaminhado ao `fetch`; 429 segue T-07. (RF03, RF04, RF06, RF07)
- **Dependências:** T-01, T-07
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data

### T-09 — Persistir preferências e última cidade
- **Descrição:** Isolar leitura e escrita da unidade e da última cidade selecionada.
- **Critérios de aceite:** Leitura sem chave, JSON inválido ou unidade fora de `celsius|fahrenheit` retorna Celsius; cidade inválida não é restaurada; exceções de leitura/escrita de `localStorage` não escapam do serviço nem impedem atualização do estado em memória. (RF08)
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/storageService.ts`
- **Tipo:** Data

### T-10 — Persistir caches de geocoding e forecast
- **Descrição:** Isolar leitura e escrita dos resultados em cache e seus timestamps.
- **Critérios de aceite:** Chaves de geocoding derivam do termo normalizado e chaves de forecast das coordenadas; payload inválido não é lido como cache válido; idade menor que 600.000 ms é fresca e idade igual ou maior é expirada; falha de storage não interrompe a sessão. (RF08)
- **Dependências:** T-01, T-02
- **Arquivos prováveis:** `src/services/storageService.ts`
- **Tipo:** Data

## Entrega 4 — Hook e orquestração da aplicação

### T-11 — Orquestrar busca e descarte de respostas obsoletas
- **Descrição:** Implementar no hook o ciclo de busca, debounce e estados da consulta de cidades.
- **Critérios de aceite:** Com relógio falso, nenhuma busca é chamada antes de 300 ms e uma busca é chamada após 300 ms sem nova digitação; termo normalizado menor que dois caracteres não chama o serviço; status assume `loading`, depois `success`, `empty` ou `error` conforme o resultado; resposta de termo anterior não altera sugestões do termo atual. (RF01, RF06, RF09)
- **Dependências:** T-02, T-06
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-12 — Orquestrar cache e retry da busca
- **Descrição:** Integrar o cache de geocoding e a repetição manual da última busca.
- **Critérios de aceite:** Busca com cache de 599.999 ms não chama o serviço; cache com 600.000 ms chama o serviço; retry envia o mesmo termo normalizado da operação que falhou; erro de geocoding mantém inalterados os dados climáticos já exibidos. (RF06–RF08)
- **Dependências:** T-10, T-11
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-13 — Orquestrar seleção e consulta da cidade
- **Descrição:** Conectar seleção explícita a uma consulta de forecast e proteger o estado contra respostas atrasadas.
- **Critérios de aceite:** Receber sugestões não seleciona nenhuma cidade; selecionar uma cidade chama forecast uma vez com suas latitude/longitude; em duas chamadas resolvidas fora de ordem, somente a resposta da seleção mais recente atualiza o estado. (RF02, RF06)
- **Dependências:** T-01, T-08, T-11
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-14 — Orquestrar refresh, retry e cache stale
- **Descrição:** Gerenciar atualização climática, falhas e preservação do último forecast completo.
- **Critérios de aceite:** Retry e refresh chamam forecast com as mesmas coordenadas da cidade ativa, mas por ações distintas; em falha com cache completo, dados e `retrievedAt` permanecem e o indicador stale fica ativo; sem cache completo, status termina em erro e nenhum payload parcial é exposto. (RF06–RF08)
- **Dependências:** T-08, T-10, T-13
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-15 — Restaurar cidade e forecast na inicialização
- **Descrição:** Restaurar a última cidade e os dados disponíveis ao iniciar a aplicação.
- **Critérios de aceite:** Sem cidade persistida, inicialização não seleciona cidade; cache com idade menor que 600.000 ms é exibido sem chamada forecast; cache com idade igual ou maior inicia atualização; falha/offline mantém cache completo visível, stale, com o `retrievedAt` original. (RF08)
- **Dependências:** T-09, T-10, T-14
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-16 — Persistir alterações de unidade e cidade
- **Descrição:** Conectar alterações de preferência e seleção aos métodos de persistência.
- **Critérios de aceite:** Alterar unidade grava o novo valor e selecionar cidade grava a cidade selecionada; com `localStorage.setItem` configurado para lançar exceção, o hook mantém unidade/cidade no estado e ainda chama o serviço de forecast após seleção. (RF08)
- **Dependências:** T-09, T-13
- **Arquivos prováveis:** `src/hooks/useWeather.ts`, `src/services/storageService.ts`
- **Tipo:** Data

## Entrega 5 — Componentes

### T-17 — Construir busca e sugestões
- **Descrição:** Implementar o campo de busca e a lista de cidades, emitindo callbacks para consulta e seleção.
- **Critérios de aceite:** Campo tem label acessível; cada opção mostra nome e campos de região/país somente quando fornecidos; são renderizadas no máximo 10 opções; Enter seleciona a opção focada e nenhuma opção é selecionada ao apenas receber resultados. (RF01, RF02, RF09, RNF03)
- **Dependências:** T-11, T-12, T-13
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Tipo:** UI

### T-18 — Construir estado de carregamento
- **Descrição:** Implementar apresentação acessível do estado em andamento.
- **Critérios de aceite:** Enquanto busca ou forecast está pendente, a operação correspondente exibe indicador com role `status`; durante refresh, os dados climáticos anteriores continuam renderizados. (RF06)
- **Dependências:** T-11, T-14
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`
- **Tipo:** UI

### T-19 — Construir estado vazio
- **Descrição:** Implementar apresentação de busca concluída sem cidades.
- **Critérios de aceite:** Para termo `Recife`, renderiza “Nenhuma cidade encontrada para 'Recife'.” e orientação para revisar a grafia; o estado não usa role `alert` nem estilo de erro. (RF06, AC06.2)
- **Dependências:** T-11
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`
- **Tipo:** UI

### T-20 — Construir estado de erro e retry
- **Descrição:** Implementar apresentação de falha recuperável com ação de retry.
- **Critérios de aceite:** Rede exibe “Você está sem conexão. Verifique sua internet.”; timeout exibe “O serviço de clima está demorando a responder.”; HTTP não-429 exibe “Não foi possível obter os dados do clima agora.”; JSON incompatível exibe “Recebemos dados inesperados do serviço de clima.”; botão “Tentar novamente” chama o callback uma vez. (RF06, RF07, AC06.3–AC06.6, AC07.1)
- **Dependências:** T-11, T-14
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`
- **Tipo:** UI

### T-21 — Apresentar clima atual
- **Descrição:** Exibir cidade, temperatura, condição, fonte e horários relevantes.
- **Critérios de aceite:** Renderiza cidade, temperatura e descrição WMO, usando “—” ou condição indisponível para valores nulos/ausentes; fonte, horário de referência e horário de obtenção aparecem em elementos distinguíveis; estado stale mostra o horário de obtenção; sensação térmica, umidade, vento e UV não aparecem. (RF03, RF05, RF08, AC03.1–AC03.4)
- **Dependências:** T-01, T-03, T-04, T-05, T-14
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI

### T-22 — Construir cartão de previsão diária
- **Descrição:** Apresentar os valores de um único dia da previsão.
- **Critérios de aceite:** Dado um `ForecastDay`, o cartão renderiza sua data, `maxC`, `minC` convertidos para unidade selecionada e descrição correspondente ao `weatherCode`; valores nulos/ausentes aparecem como “—” ou condição indisponível; não calcula datas a partir do relógio local. (RF04, RF05)
- **Dependências:** T-01, T-03, T-04, T-05, T-16
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`
- **Tipo:** UI

### T-23 — Construir lista de previsão
- **Descrição:** Apresentar os cinco cartões em uma lista responsiva.
- **Critérios de aceite:** Para forecast válido, renderiza exatamente cinco cartões em ordem de entrada, com as cinco datas recebidas; não cria, remove nem reordena dias. (RF04)
- **Dependências:** T-01, T-22
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Tipo:** UI

### T-24 — Construir alternância de unidade
- **Descrição:** Implementar controle para seleção de Celsius ou Fahrenheit.
- **Critérios de aceite:** Controle com nome acessível permite selecionar °C e °F por teclado; seleção atual é indicada; mudança chama o callback da unidade uma vez e não chama serviço de forecast. (RF05, RF08, RNF03)
- **Dependências:** T-03, T-16
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI
## Entrega 6 — Integração

### T-25 — Compor a tela principal
- **Descrição:** Conectar hook e componentes na hierarquia de tela definida pelo plano.
- **Critérios de aceite:** Em execução, digitar inicia busca, selecionar inicia forecast, retry repete a operação e refresh solicita atualização; falha de busca conserva o clima atual e falha de refresh conserva cache completo. (RF01–RF08)
- **Dependências:** T-11–T-16, T-17–T-24
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI

## Entrega 7 — Testes automatizados

### T-26 — Testar normalização de busca
- **Descrição:** Cobrir regras de normalização e validação do termo.
- **Critérios de aceite:** Testes passam para vazio e um caractere inválidos, dois caracteres válidos, trimming externo e preservação de `São José`, espaços internos, apóstrofos e hífens. (RF01, RF09)
- **Dependências:** T-02, T-25
- **Arquivos prováveis:** `tests/unit/searchQuery.test.ts`
- **Tipo:** Test

### T-27 — Testar conversão de temperatura
- **Descrição:** Testar unitariamente conversão °C/°F, arredondamento de apresentação e preservação dos dados em Celsius.
- **Critérios de aceite:** Testes esperam 0 °C → 32 °F, 100 °C → 212 °F, -40 °C → -40 °F e arredondamento consistente; após formatar em °F, o objeto de entrada em Celsius permanece idêntico. (RF05)
- **Dependências:** T-03, T-25
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Tipo:** Test

### T-28 — Testar formatação e códigos WMO
- **Descrição:** Cobrir datas civis, rótulos pt-BR e mapeamentos meteorológicos.
- **Critérios de aceite:** Uma data `YYYY-MM-DD` mantém o mesmo dia sob UTC-12 e UTC+14; cada código da tabela retorna descrição/categoria esperadas e código desconhecido retorna fallback neutro; texto formatado usa pt-BR. (RF03, RF04, RNF09)
- **Dependências:** T-04, T-05, T-25
- **Arquivos prováveis:** `tests/unit/format.test.ts`, `tests/unit/weatherCodes.test.ts`
- **Tipo:** Test

### T-29 — Testar serviço de geocoding
- **Descrição:** Verificar contrato HTTP e mapeamento do serviço de busca com `fetch` mockado.
- **Critérios de aceite:** Com `fetch` mockado, testes verificam host/path, `name`, `count=10`, `language=pt`, `format=json`; mapeamento de cidade com campos opcionais; lista vazia para `results` ausente/vazio conforme contrato; erro tipado para HTTP/rede/JSON inválido; signal abortável. (RF01)
- **Dependências:** T-06, T-25
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`
- **Tipo:** Test

### T-30 — Testar serviço de forecast
- **Descrição:** Verificar request, validação de resposta agregada e tratamento de erros de forecast com `fetch` mockado.
- **Critérios de aceite:** Com `fetch` e relógio mockados, testes verificam parâmetros do endpoint, mapeamento válido de current e cinco dias, valores nulos/ausentes preservados como `null`, timeout em 10 s, erros HTTP/rede, datas ausentes/inválidas, vetores desalinhados, valores de tipo inválido e resultado 429 segundo T-07. (RF03, RF04, RF06, RF07)
- **Dependências:** T-07, T-08, T-25
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`
- **Tipo:** Test

### T-31 — Testar persistência de preferências
- **Descrição:** Verificar leitura, escrita e valores padrão de unidade e cidade.
- **Critérios de aceite:** Testes verificam default Celsius, unidade salva restaurada, preferência/cidade inválida ignorada e exceções de leitura/escrita tratadas sem lançar erro. (RF08)
- **Dependências:** T-09, T-25
- **Arquivos prováveis:** `tests/unit/storageService.test.ts`
- **Tipo:** Test

### T-32 — Testar persistência e TTL de cache
- **Descrição:** Verificar chaves, timestamps, validação e expiração dos caches.
- **Critérios de aceite:** Testes verificam chaves de geocoding e coordenadas, cache fresco aos 599.999 ms, expirado aos 600.000 ms, rejeição de payload inválido e continuidade após exceção de storage. (RF08)
- **Dependências:** T-10, T-25
- **Arquivos prováveis:** `tests/unit/storageService.test.ts`
- **Tipo:** Test

### T-33 — Testar hook de busca
- **Descrição:** Cobrir estados, debounce e concorrência das sugestões.
- **Critérios de aceite:** Testes com relógio falso confirmam zero chamadas até 299 ms e uma chamada aos 300 ms; termo curto não chama serviço; respostas simuladas para vazio/erro geram os status correspondentes; resposta antiga não substitui sugestões atuais. (RF01, RF06, RF09)
- **Dependências:** T-11, T-12, T-25
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-34 — Testar hook de seleção e forecast
- **Descrição:** Cobrir seleção explícita, troca de cidade, refresh, retry e cache stale.
- **Critérios de aceite:** Serviços mockados recebem coordenadas da cidade selecionada; resposta atrasada de seleção anterior não atualiza estado; retry repete coordenadas; em falha, o objeto cacheado e seu timestamp permanecem e stale fica ativo. (RF02, RF06–RF08)
- **Dependências:** T-13, T-14, T-25
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-35 — Testar restauração e persistência da sessão
- **Descrição:** Cobrir inicialização a partir das preferências e caches salvos.
- **Critérios de aceite:** Sem armazenamento, hook inicia em Celsius e sem cidade; com valores salvos restaura unidade/cidade; cache <600.000 ms não chama forecast; cache expirado chama forecast; falha mantém forecast stale e `retrievedAt` original. (RF08)
- **Dependências:** T-15, T-16, T-25
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-36 — Testar busca e sugestões na interface
- **Descrição:** Verificar interação e acessibilidade básica do componente de busca.
- **Critérios de aceite:** Testing Library encontra o campo por label; teclado navega e seleciona uma opção; 11 opções recebidas resultam em no máximo 10 renderizadas; renderizar resultados não chama seleção. (RF01, RF02, RF09, RNF03)
- **Dependências:** T-17, T-25
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`
- **Tipo:** Test

### T-37 — Testar estado de carregamento
- **Descrição:** Verificar a mensagem e semântica do componente de loading.
- **Critérios de aceite:** Testing Library encontra o indicador por role `status` e nome/mensagem de carregamento; sem loading, esse indicador não é renderizado. (RF06, RNF03)
- **Dependências:** T-18, T-25
- **Arquivos prováveis:** `tests/unit/LoadingState.test.tsx`
- **Tipo:** Test

### T-38 — Testar estado vazio
- **Descrição:** Verificar mensagem e orientação para busca sem resultados.
- **Critérios de aceite:** Com termo `Recife`, teste encontra o texto exato “Nenhuma cidade encontrada para 'Recife'.” e a orientação de grafia; não encontra role `alert`. (RF06, AC06.2)
- **Dependências:** T-19, T-25
- **Arquivos prováveis:** `tests/unit/EmptyState.test.tsx`
- **Tipo:** Test

### T-39 — Testar estado de erro
- **Descrição:** Verificar mensagens e callback de retry.
- **Critérios de aceite:** Para cada tipo de erro coberto, teste encontra a mensagem especificada; clicar “Tentar novamente” chama o callback exatamente uma vez; sem callback, botão não é apresentado como ação funcional. (RF06, RF07)
- **Dependências:** T-20, T-25
- **Arquivos prováveis:** `tests/unit/ErrorState.test.tsx`
- **Tipo:** Test

### T-40 — Testar apresentação do clima atual
- **Descrição:** Verificar dados e metadados do componente de clima atual.
- **Critérios de aceite:** Testes encontram cidade, temperatura formatada, condição, fonte, hora de referência e hora de obtenção; com stale, encontram aviso e timestamp; não encontram umidade, vento, sensação térmica ou UV. (RF03, RF05, RF08)
- **Dependências:** T-21, T-25
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`
- **Tipo:** Test

### T-41 — Testar apresentação da previsão
- **Descrição:** Verificar cartão e composição da lista de dias.
- **Critérios de aceite:** Fixture de cinco dias produz exatamente cinco cartões na mesma ordem; cada cartão contém data, condição, máxima e mínima na unidade selecionada. (RF04, RF05)
- **Dependências:** T-22, T-23, T-25
- **Arquivos prováveis:** `tests/unit/ForecastCard.test.tsx`, `tests/unit/ForecastList.test.tsx`
- **Tipo:** Test

### T-42 — Testar alternância de unidade
- **Descrição:** Verificar seleção de unidade e emissão do callback.
- **Critérios de aceite:** Testes operam °C/°F por teclado, verificam o estado selecionado e confirmam callback com a unidade escolhida; nenhuma chamada de forecast é feita ao alternar. (RF05, RF08, RNF03)
- **Dependências:** T-24, T-25
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`
- **Tipo:** Test

### T-43 — Testar composição da aplicação
- **Descrição:** Verificar integração entre estado do hook e tela principal.
- **Critérios de aceite:** Teste de integração percorre busca, seleção e renderização; mocks confirmam os callbacks de seleção/retry/refresh; erro de busca e falha de refresh mantêm dados climáticos válidos renderizados. (RF01–RF08)
- **Dependências:** T-25
- **Arquivos prováveis:** `tests/unit/App.test.tsx`
- **Tipo:** Test

### T-44 — Testar fluxo principal em E2E
- **Descrição:** Cobrir busca, seleção, exibição do clima e alternância com APIs interceptadas.
- **Critérios de aceite:** Com endpoints interceptados e fixtures fixas, Playwright executa busca → seleção → clima atual e cinco cartões → alternância °C/°F em desktop e viewport mobile `390 × 844`; em ambos, confirma que alternar unidade não aumenta chamadas de forecast. (RF01–RF05, RNF02)
- **Dependências:** T-25
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test

### T-45 — Testar falhas e continuidade em E2E
- **Descrição:** Cobrir estados recuperáveis e cache em cenários de integração.
- **Critérios de aceite:** Cenários Playwright interceptados verificam estado vazio, erro seguido de retry, rejeição de resposta parcial, inicialização offline com cache stale e refresh com erro mantendo os dados e timestamp anteriores. (RF06–RF09)
- **Dependências:** T-25
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test

## Entrega 8 — Hardening e qualidade

### T-46 — Corrigir acessibilidade de controles
- **Descrição:** Ajustar semântica, foco e operação por teclado nos controles de busca e unidade.
- **Critérios de aceite:** Auditoria por teclado percorre busca e unidade sem armadilha de foco; cada controle tem nome acessível; indicador visual acompanha foco; estado selecionado é exposto semanticamente e validado por teste de acessibilidade/manual checklist WCAG 2.1 AA. (RNF03)
- **Dependências:** T-17, T-18, T-19, T-20, T-24, T-25, T-26–T-45
- **Arquivos prováveis:** `src/components/SearchBar.tsx`, `src/components/UnitToggle.tsx`
- **Tipo:** UI

### T-47 — Ajustar layout responsivo e contraste
- **Descrição:** Corrigir layout e estilos da tela principal para larguras mobile e desktop.
- **Critérios de aceite:** Em 320 px e 390 px de largura, `scrollWidth` não excede `clientWidth`; controles interativos medem pelo menos 44 × 44 CSS px; contraste de texto normal medido é ≥4,5:1. (RNF02, RNF03)
- **Dependências:** T-25, T-26–T-45
- **Arquivos prováveis:** `src/App.tsx`, `src/styles/index.css`
- **Tipo:** UI

### T-48 — Validar viewports mobile em E2E
- **Descrição:** Adicionar verificação responsiva automatizada do fluxo principal.
- **Critérios de aceite:** Playwright executa em `320 × 800` e `390 × 844`; em ambos `scrollWidth <= clientWidth`, o teste preenche o campo de busca e seleciona a unidade oposta, confirmando o estado selecionado após a interação. (RNF02)
- **Dependências:** T-44, T-47
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test

### T-49 — Verificar orçamento do bundle
- **Descrição:** Medir o bundle inicial gzip e definir verificação repetível do limite.
- **Critérios de aceite:** Um comando documentado gera/mede o bundle de produção gzip; resultado ≤200 KB passa e resultado >200 KB falha ou sinaliza claramente no CI. (RNF13)
- **Dependências:** T-48
- **Arquivos prováveis:** `package.json`, `vite.config.ts`
- **Tipo:** Infra

### T-50 — Configurar verificação Lighthouse CI
- **Descrição:** Configurar execução de Lighthouse em laboratório para as métricas do produto.
- **Critérios de aceite:** Workflow executa Lighthouse CI contra build local em ambiente definido e publica os três valores; gate passa somente com LCP ≤2,5 s, INP ≤200 ms e CLS ≤0,1. (RNF14)
- **Dependências:** T-49
- **Arquivos prováveis:** configuração Lighthouse CI, workflow de CI
- **Tipo:** Infra

### T-51 — Executar gates de qualidade
- **Descrição:** Rodar os gates do projeto após implementação e hardening.
- **Critérios de aceite:** Os quatro comandos `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` terminam com código 0; se algum não puder ser executado, registrar comando, bloqueio e resultado obtido. (RNF06, RNF07)
- **Dependências:** T-26–T-50
- **Arquivos prováveis:** `package.json`
- **Tipo:** Test

## Rastreabilidade

| Requisito funcional | Tarefas de implementação | Tarefas de validação |
|---|---|---|
| RF01 — Busca de cidades | T-02, T-06, T-11, T-12, T-17, T-25 | T-26, T-29, T-33, T-36, T-44 |
| RF02 — Seleção de cidade | T-13, T-17, T-25 | T-34, T-36, T-43, T-44 |
| RF03 — Clima atual | T-05, T-08, T-13, T-14, T-21, T-25 | T-28, T-30, T-34, T-40, T-44 |
| RF04 — Previsão de cinco dias | T-08, T-22, T-23, T-25 | T-28, T-30, T-41, T-44 |
| RF05 — Alternância de unidade | T-03, T-16, T-21, T-22, T-24, T-25 | T-27, T-42, T-44 |
| RF06 — Estados da interface | T-08, T-11, T-14, T-18, T-19, T-20, T-25 | T-30, T-33, T-37, T-38, T-39, T-43, T-45 |
| RF07 — Tentar novamente | T-07, T-08, T-12, T-14, T-20, T-25 | T-30, T-33, T-34, T-39, T-43, T-45 |
| RF08 — Persistência local | T-09, T-10, T-12, T-14, T-15, T-16, T-21, T-25 | T-31, T-32, T-35, T-40, T-43, T-45 |
| RF09 — Sugestões de busca | T-02, T-11, T-12, T-17, T-25 | T-26, T-33, T-36, T-44 |

Todos os RFs de RF01 a RF09 têm ao menos uma tarefa de implementação e uma tarefa de validação correspondente.

| Requisito não funcional | Tarefas relacionadas |
|---|---|
| RNF02–RNF03 — Responsividade e acessibilidade | T-17–T-20, T-24, T-36–T-39, T-42, T-46–T-48 |
| RNF06–RNF07 — Qualidade e testabilidade | T-26–T-51 |
| RNF13–RNF14 — Bundle e Web Vitals | T-49–T-50 |

**Lacunas:** Nenhum RF está sem tarefa correspondente. RF07 depende da decisão de política de HTTP 429 em T-07 antes de concluir a implementação e seus testes.

## Prioridade e tamanho

P0 identifica tarefas do caminho crítico para a primeira consulta visível. P1 cobre requisitos restantes e validação antes de concluir o MVP. P2 é trabalho de menor urgência, posterior à primeira fatia; não elimina requisitos da spec e deve ser concluído se RNF13/RNF14 forem gates de release. Tamanho é relativo: P = tarefa isolada; M = fluxo ou conjunto de testes moderado; G = cruzamento de camadas, validação ampla ou decisão externa. Não é estimativa de duração.

| Prioridade | Tamanho | Tarefas |
|---|---|---|
| P0 | P | T-01, T-02, T-04, T-05, T-18, T-22, T-23 |
| P0 | M | T-06, T-07, T-13, T-17, T-21, T-44 |
| P0 | G | T-08, T-11, T-25 |
| P1 | P | T-03, T-09, T-19, T-24, T-26, T-27, T-31, T-37, T-38, T-39, T-42 |
| P1 | M | T-10, T-12, T-15, T-16, T-20, T-28, T-29, T-30, T-32, T-33, T-34, T-35, T-36, T-40, T-41, T-43, T-46, T-47, T-48, T-51 |
| P1 | G | T-14, T-45 |
| P2 | P | — |
| P2 | M | T-49 |
| P2 | G | T-50 |

## Sequência por fatias verticais

1. **Primeiro valor visível — buscar e exibir previsão:** T-01, T-02, T-04–T-08, T-11, T-13, T-17, T-18, T-21–T-23, T-25 e T-44. Resultado: selecionar uma cidade e ver clima atual e cinco dias, com smoke E2E em desktop e mobile.
2. **Completar o uso diário — unidade e continuidade:** T-03, T-09–T-10, T-12, T-14–T-16, T-19–T-20, T-24, T-27, T-31–T-35, T-38–T-39, T-42 e T-45. Resultado: alternância C/F, restauração de preferências, cache, retry e degradação offline.
3. **Fechar cobertura e acessibilidade:** T-26, T-28–T-30, T-36–T-43 e T-46–T-48. Resultado: regressões cobertas nos helpers, services, componentes e integração; fluxo principal e viewports mobile verificados.
4. **Medir limites de release:** T-49–T-51. Resultado: orçamento de bundle, Web Vitals e gates de qualidade reportados.

**Bloqueio para antecipar a primeira fatia:** hoje T-25 depende de T-11–T-16 e T-17–T-24, então também espera cache, persistência, erro e alternância de unidade antes de integrar o fluxo feliz. Recomenda-se dividir T-25 em uma integração mínima do fluxo busca → seleção → previsão e uma integração posterior de continuidade/preferências; isso permite entregar a fatia 1 sem esperar toda a fatia 2.

## Observação de dependência

T-07 resolve a divergência da origem: o plano determina no máximo uma repetição automática apenas após `Retry-After` válido, enquanto AC07.4 e OQ08 citam um backoff ainda não definido. A implementação em T-08 e seus testes em T-30 devem seguir a regra que ficar registrada, sem assumir intervalo fixo não aprovado.