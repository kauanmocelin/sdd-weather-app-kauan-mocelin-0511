# Especificação de Produto — Weather App

> **Status:** Proposta para validação de negócio  
> **Data:** 2026-11-05  
> **Fonte:** [`specs/discovery.md`](./discovery.md)  
> **Escopo:** MVP web responsivo

## Overview

O Weather App permite que pessoas consultem rapidamente o clima atual e a previsão diária de cinco dias para uma cidade escolhida. O produto atende usuários que planejam atividades cotidianas e viagens, com prioridade para uso em dispositivos móveis e sessões curtas.

O MVP é uma aplicação web responsiva, em português do Brasil, que usa a Open-Meteo para geocoding e previsão. Não exige conta, não solicita localização e mantém no dispositivo a última cidade, a unidade escolhida e dados em cache. O foco é apresentar informação climática essencial, identificar corretamente cidades homônimas e continuar mostrando a última previsão disponível quando a rede ou o provedor falhar.

**Resultados esperados para o usuário:**
- Consultar temperatura e condição atual da cidade selecionada.
- Ver em uma única consulta hoje e os quatro dias seguintes, com máxima, mínima e condição predominante por dia.
- Retomar a última cidade e unidade escolhidas em uma visita futura.

## Functional Requirements

| ID | Requisito | Prioridade | Definição |
|---|---|---|---|
| RF01 | Busca de cidades | Must | Permitir busca global por nome de cidade usando geocoding Open-Meteo. Remover espaços externos antes de validar; exigir pelo menos dois caracteres após essa normalização; preservar letras Unicode, diacríticos, espaços internos, apóstrofos e hífens como texto literal. Apresentar até 10 sugestões, localizadas em português quando disponível. Cada resultado identifica nome, região administrativa e país, quando fornecidos. Não aceitar CEP nem coordenadas como consultas no MVP. |
| RF02 | Seleção de cidade | Must | Permitir seleção explícita de um resultado e carregar os dados climáticos da localização correspondente. Nunca selecionar automaticamente o primeiro resultado. |
| RF03 | Clima atual | Must | Exibir para a cidade selecionada temperatura e condição, com descrição pt-BR e ícone correspondente ao código WMO. Identificar a fonte e distinguir o horário de referência dos dados do horário em que foram obtidos; usar o fuso da cidade. Dados em cache devem ser identificados como desatualizados e mostrar quando foram obtidos. |
| RF04 | Previsão de cinco dias | Must | Exibir hoje e os quatro dias seguintes, segundo as datas e o fuso da cidade fornecidos pela fonte. Cada dia deve conter data, máxima, mínima e a condição diária fornecida pela fonte. O forecast é completo somente quando há cinco datas consecutivas e máximas/mínimas numéricas para cada dia. |
| RF05 | Alternância de unidade | Must | Permitir alternar entre °C e °F sem nova consulta ao provedor. Normalizar os valores de origem em Celsius; converter pela fórmula °F = (°C × 9/5) + 32 e arredondar para o inteiro mais próximo somente na apresentação. |
| RF06 | Estados da interface | Must | Comunicar carregamento, vazio e erro separadamente para busca de cidades e consulta climática. Mensagens devem ser claras e em pt-BR. Uma falha de rede ou provedor não deve deixar a interface quebrada nem substituir dados válidos por valores inválidos. |
| RF07 | Tentar novamente | Must | Em erro recuperável, disponibilizar ação explícita para repetir a mesma operação com os mesmos parâmetros. Distinguir essa ação da atualização manual disponível após sucesso. Para HTTP 429, realizar no máximo uma repetição automática após o intervalo válido informado por `Retry-After`; sem intervalo válido, oferecer apenas a repetição manual. |
| RF08 | Persistência local | Must | Persistir no dispositivo unidade, última cidade selecionada e respostas válidas de forecast/geocoding com horário de obtenção. Cache com menos de 10 minutos pode ser reutilizado; com 10 minutos ou mais, deve ser atualizado quando houver conexão. Em falha ou offline, manter o último forecast válido, identificá-lo como desatualizado e mostrar seu horário de obtenção. |
| RF09 | Sugestões de busca | Should | Atualizar sugestões sem submissão manual, após 300 ms sem alteração do texto e somente com pelo menos dois caracteres após remoção dos espaços externos. Não deixar respostas antigas substituir resultados do texto atual. |

## User Stories

| ID | História | Requisito funcional |
|---|---|---|
| US01 | Como Mariana, a Planejadora do Dia a Dia, quero buscar minha cidade para consultar o tempo antes de sair de casa. | RF01 |
| US02 | Como Carlos, o Viajante que Planeja, quero distinguir cidades homônimas pela região e pelo país para escolher o destino certo para minha viagem. | RF02 |
| US03 | Como Mariana, a Planejadora do Dia a Dia, quero ver a temperatura e a condição atuais para decidir o que vestir e como me deslocar. | RF03 |
| US04 | Como Carlos, o Viajante que Planeja, quero consultar a máxima, a mínima e a condição dos próximos cinco dias para planejar a mala e meus compromissos. | RF04 |
| US05 | Como Carlos, o Viajante que Planeja, quero alternar entre Celsius e Fahrenheit para interpretar a previsão conforme minha preferência durante viagens. | RF05 |
| US06 | Como Mariana, a Planejadora do Dia a Dia, quero entender quando a busca ou os dados do clima estão carregando, vazios ou indisponíveis para saber se devo aguardar ou corrigir minha busca. | RF06 |
| US07 | Como Carlos, o Viajante que Planeja, quero tentar novamente quando uma consulta falhar para obter a previsão necessária ao planejamento da viagem. | RF07 |
| US08 | Como Mariana, a Planejadora do Dia a Dia, quero que minha última cidade e unidade sejam lembradas para consultar o clima rapidamente na manhã seguinte. | RF08 |
| US09 | Como Mariana, a Planejadora do Dia a Dia, quero ver sugestões de cidades enquanto digito para encontrar minha cidade com menos espera antes de sair. | RF09 |

## Acceptance Criteria

Cada critério abaixo segue o formato Dado/Quando/Então, é verificável e referencia o requisito funcional correspondente. A notação de temperatura e data deve respeitar pt-BR, salvo quando a unidade Fahrenheit tiver sido selecionada.

### US01 / RF01 — Busca

- **AC01.1** **Dado** que a busca está aberta, **Quando** a pessoa informa um nome de cidade com pelo menos dois caracteres e a consulta é disparada, **Então** é enviada uma consulta de geocoding à Open-Meteo com idioma `pt` e limite de 10 resultados.
- **AC01.2** **Dado** que o geocoding retorna resultados, **Quando** as sugestões são exibidas, **Então** cada resultado contém o nome da cidade, a região administrativa quando fornecida pela fonte e o país.
- **AC01.3** **Dado** que o geocoding retorna mais de 10 correspondências, **Quando** a lista de sugestões é apresentada, **Então** são exibidos no máximo 10 resultados.
- **AC01.4** **Dado** que o campo de busca contém menos de dois caracteres, **Quando** a pessoa altera o texto, **Então** nenhuma consulta de geocoding é enviada.
- **AC01.5** **Dado** que a busca está aberta, **Quando** a pessoa informa um CEP ou coordenadas, **Então** a entrada não é processada como busca por CEP ou coordenadas.

### US02 / RF02 — Seleção

- **AC02.1** **Dado** que há uma lista de sugestões, **Quando** a pessoa seleciona um resultado, **Então** o clima e a previsão carregados correspondem às coordenadas desse resultado.
- **AC02.2** **Dado** que a busca retorna uma ou mais sugestões, **Quando** nenhuma sugestão foi selecionada pela pessoa, **Então** nenhuma cidade é selecionada automaticamente.
- **AC02.3** **Dado** que há uma cidade selecionada e dados climáticos carregados, **Quando** a previsão é exibida, **Então** o nome da cidade selecionada permanece visível junto aos dados.

### US03 / RF03 — Clima atual

- **AC03.1** **Dado** que há uma resposta de clima atual para a cidade selecionada, **Quando** a área de clima atual é exibida, **Então** ela apresenta a temperatura e a descrição da condição em pt-BR; valores meteorológicos nulos ou ausentes aparecem como “—” ou “Condição indisponível”.
- **AC03.2** **Dado** que o código WMO está listado na tabela desta especificação, **Quando** a condição atual ou diária é apresentada, **Então** a descrição e a categoria de ícone correspondem ao mapeamento desse código.
- **AC03.3** **Dado** que o código WMO não consta na tabela, **Quando** a condição é apresentada, **Então** aparece “Condição indisponível” com ícone neutro e a tela continua utilizável.
- **AC03.4** **Dado** que há uma resposta válida de clima atual, **Quando** os dados atuais são apresentados, **Então** sensação térmica, umidade, vento e índice UV não são exibidos.

### US04 / RF04 — Previsão

- **AC04.1** **Dado** que há uma resposta válida de forecast para uma cidade, **Quando** a previsão diária é exibida, **Então** ela contém cinco datas consecutivas: hoje na cidade e os quatro dias seguintes.
- **AC04.2** **Dado** que há uma previsão diária válida, **Quando** qualquer um dos cinco dias é apresentado, **Então** esse dia exibe data, temperatura máxima, temperatura mínima e condição predominante; valores meteorológicos nulos ou ausentes são apresentados como “—”, sem inferir ou inventar valores.
- **AC04.3** **Dado** que a cidade tem um fuso horário diferente do dispositivo, **Quando** a previsão é apresentada, **Então** os dias correspondem às datas retornadas para o fuso da cidade.
- **AC04.4** **Dado** que há uma resposta diária válida com os cinco dias requeridos, **Quando** a previsão é carregada, **Então** os dados horários não são necessários para apresentar os critérios definidos em AC04.1 e AC04.2.

### US05 / RF05 — Unidade

- **AC05.1** **Dado** que não há unidade salva, **Quando** dados de temperatura são exibidos na primeira visita, **Então** todos são apresentados em Celsius (°C).
- **AC05.2** **Dado** que há dados de temperatura carregados em Celsius, **Quando** a pessoa seleciona Fahrenheit, **Então** todos os valores atuais, máximos e mínimos são apresentados em °F; quando seleciona Celsius, todos voltam a °C.
- **AC05.3** **Dado** que os dados de forecast já foram carregados, **Quando** a pessoa alterna a unidade, **Então** a quantidade de requisições de forecast não aumenta.
- **AC05.4** **Dado** que a pessoa selecionou uma unidade e ela foi salva, **Quando** a aplicação é reaberta, **Então** os valores são apresentados nessa unidade.

### US06 / RF06 — Estados

- **AC06.1** **Dado** que uma busca ou consulta climática foi iniciada e ainda não terminou, **Quando** a pessoa observa a área de resultados, **Então** a interface comunica que a operação está em andamento.
- **AC06.2** **Dado** que uma busca por “Recife” termina sem resultados, **Quando** a interface apresenta a resposta, **Então** exibe “Nenhuma cidade encontrada para 'Recife'.”, orienta revisar a grafia e não marca o estado como erro.
- **AC06.3** **Dado** que uma consulta falha por ausência de conexão, **Quando** a falha é apresentada, **Então** a mensagem exibida é “Você está sem conexão. Verifique sua internet.”.
- **AC06.4** **Dado** que uma consulta permanece sem resposta por 10 segundos, **Quando** o limite de timeout é atingido, **Então** a consulta é interrompida e a mensagem exibida é “O serviço de clima está demorando a responder.”.
- **AC06.5** **Dado** que a API retorna HTTP 4xx ou 5xx, exceto HTTP 429, **Quando** a falha é apresentada, **Então** a mensagem exibida é “Não foi possível obter os dados do clima agora.”.
- **AC06.6** **Dado** que a API retorna conteúdo JSON inválido, estrutura incompatível ou valor meteorológico de tipo inválido, **Quando** a resposta é tratada, **Então** a mensagem exibida é “Recebemos dados inesperados do serviço de clima.” e nenhum valor inválido é apresentado como previsão. Valores meteorológicos nulos ou ausentes são tratados como indisponíveis e apresentados como “—”.
- **AC06.7** **Dado** que há uma previsão válida em cache e uma falha ao atualizar, **Quando** a aplicação apresenta o resultado, **Então** mostra a previsão em cache, seu horário de atualização e o aviso de falha.
- **AC06.8** **Dado** que uma consulta de forecast falha e não há forecast em cache, **Quando** o estado final é exibido, **Então** a interface mostra o estado de erro sem apresentar dados climáticos inventados.

### US07 / RF07 — Tentar novamente

- **AC07.1** **Dado** que uma operação está em estado de erro recuperável, **Quando** a mensagem de erro é exibida, **Então** há uma ação identificada como “Tentar novamente”.
- **AC07.2** **Dado** que uma busca ou consulta climática falhou, **Quando** a pessoa aciona “Tentar novamente”, **Então** a mesma operação é repetida com os parâmetros ainda selecionados.
- **AC07.3** **Dado** que a repetição da operação também falha, **Quando** o resultado da repetição é apresentado, **Então** a mensagem de erro e a ação “Tentar novamente” permanecem disponíveis.
- **AC07.4** **Dado** que a Open-Meteo responde HTTP 429, **Quando** ocorre o rate limit, **Então** a aplicação faz exatamente uma tentativa automática adicional após o backoff configurado e, se ela falhar, apresenta a ação manual “Tentar novamente”.
- **AC07.5** **Dado** que a consulta climática foi concluída com sucesso, **Quando** a pessoa solicita atualização dos dados, **Então** a ação de atualização manual é distinta de “Tentar novamente”.

### US08 / RF08 — Persistência e cache

- **AC08.1** **Dado** que uma cidade foi selecionada e salva, **Quando** a pessoa abre uma nova sessão, **Então** essa cidade é restaurada e seus dados locais são apresentados enquanto a atualização ocorre.
- **AC08.2** **Dado** que a pessoa alterou e salvou a unidade, **Quando** abre uma nova sessão, **Então** a mesma unidade é restaurada.
- **AC08.3** **Dado** que há uma resposta de forecast ou geocoding salva há menos de 10 minutos, **Quando** a mesma cidade ou termo é consultado novamente, **Então** a resposta em cache é reutilizada sem uma nova requisição correspondente.
- **AC08.4** **Dado** que há uma resposta em cache com pelo menos 10 minutos e conectividade disponível, **Quando** a cidade é carregada, **Então** a aplicação solicita dados atualizados.
- **AC08.5** **Dado** que há uma resposta válida em cache com pelo menos 10 minutos e ocorre uma falha na atualização, **Quando** os dados são exibidos, **Então** o último valor válido permanece visível com o horário da atualização bem-sucedida.
- **AC08.6** **Dado** que não há conectividade e existe forecast salvo, **Quando** a aplicação é recarregada, **Então** a previsão salva permanece visível com o horário em que foi atualizada.
- **AC08.7** **Dado** que não há unidade salva, **Quando** a aplicação inicia, **Então** a unidade padrão é Celsius.
- **AC08.8** **Dado** que não há cidade salva, **Quando** a aplicação inicia, **Então** nenhuma cidade é selecionada ou apresentada como se fosse a localização da pessoa.

### US09 / RF09 — Sugestões

- **AC09.1** **Dado** que o campo contém pelo menos dois caracteres, **Quando** a pessoa para de digitar, **Então** a consulta de sugestões é enviada após 300 ms sem novas alterações no texto.
- **AC09.2** **Dado** que uma consulta de sugestões está em andamento, **Quando** o texto muda antes de sua resposta, **Então** os resultados dessa consulta antiga não substituem as sugestões correspondentes ao texto atual.
- **AC09.3** **Dado** que sugestões de cidade estão visíveis, **Quando** a pessoa seleciona uma delas, **Então** a cidade é selecionada sem exigir submissão de formulário separado.

## Matriz de Rastreabilidade

Cada linha liga uma User Story ao requisito funcional, aos critérios de aceite que a verificam e aos requisitos não funcionais aplicáveis. O RNF07 (testabilidade) aplica-se transversalmente a todos os critérios e, por isso, não é repetido em cada linha.

| User Story | Requisito funcional | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|---|
| US01 — Buscar cidade | RF01 | AC01.1–AC01.5 | RNF01 (desempenho de busca), RNF02 (responsividade), RNF03 (acessibilidade), RNF05 (compatibilidade), RNF09 (localização), RNF13 (eficiência de rede), RNF14 (performance percebida) |
| US02 — Distinguir e selecionar cidade | RF02 | AC02.1–AC02.3 | RNF02 (responsividade), RNF03 (acessibilidade), RNF04 (confiabilidade), RNF05 (compatibilidade), RNF09 (localização) |
| US03 — Consultar clima atual | RF03 | AC03.1–AC03.4 | RNF03 (acessibilidade), RNF05 (compatibilidade), RNF09 (localização), RNF10 (apresentação visual) |
| US04 — Consultar previsão de cinco dias | RF04 | AC04.1–AC04.4 | RNF03 (acessibilidade), RNF05 (compatibilidade), RNF09 (localização), RNF10 (apresentação visual), RNF14 (performance percebida) |
| US05 — Alternar unidade | RF05 | AC05.1–AC05.4 | RNF03 (acessibilidade), RNF05 (compatibilidade), RNF09 (localização) |
| US06 — Entender estados da interface | RF06 | AC06.1–AC06.8 | RNF03 (acessibilidade), RNF04 (confiabilidade), RNF05 (compatibilidade), RNF09 (localização), RNF11 (continuidade), RNF12 (observabilidade) |
| US07 — Tentar novamente | RF07 | AC07.1–AC07.5 | RNF03 (acessibilidade), RNF04 (confiabilidade), RNF05 (compatibilidade), RNF12 (observabilidade) |
| US08 — Restaurar cidade, unidade e cache | RF08 | AC08.1–AC08.8 | RNF04 (confiabilidade), RNF05 (compatibilidade), RNF08 (segurança e privacidade), RNF09 (localização), RNF11 (continuidade), RNF13 (eficiência de rede) |
| US09 — Ver sugestões enquanto digita | RF09 | AC09.1–AC09.3 | RNF01 (desempenho de busca), RNF02 (responsividade), RNF03 (acessibilidade), RNF05 (compatibilidade), RNF09 (localização), RNF13 (eficiência de rede), RNF14 (performance percebida) |

## Non-Functional Requirements

| ID | Categoria | Requisito e verificação |
|---|---|---|
| RNF01 | Desempenho de busca | Debounce de aproximadamente 300 ms e cancelamento ou descarte de consultas obsoletas; verificar por teste de comportamento com digitação rápida. |
| RNF02 | Responsividade | Interface mobile-first funcional a partir de aproximadamente 320 px até desktop. Alvos de toque medem pelo menos 44 × 44 px; verificar em viewports móveis e desktop. |
| RNF03 | Acessibilidade | WCAG 2.1 AA como padrão interno: semântica, foco visível, operação por teclado e suporte a leitores de tela. Verificar navegação por teclado, nomes acessíveis e contraste. Não há exigência de certificação legal/e-MAG no MVP. |
| RNF04 | Confiabilidade | Falhas do provedor ou da rede resultam em mensagens claras e degradação graciosa, sem tela quebrada; verificar os casos de erro definidos em RF06. |
| RNF05 | Compatibilidade | Suportar as duas versões major mais recentes de Chrome, Firefox, Edge e Safari, além de Safari iOS 16 ou superior e Chrome Android. Outros ambientes são melhor esforço. |
| RNF06 | Manutenibilidade | O produto deve permanecer compatível com TypeScript strict e lint sem erros segundo as ferramentas estabelecidas pelo projeto. |
| RNF07 | Testabilidade | Critérios de aceite devem ter cobertura por testes automatizados adequados: testes unitários/de interface e E2E para o fluxo buscar → selecionar → consultar → alternar unidade. |
| RNF08 | Segurança e privacidade | Não coletar dados pessoais nem enviar preferências do usuário a um servidor; não exigir chave de API; servir a aplicação exclusivamente por HTTPS. |
| RNF09 | Localização | Interface em pt-BR; datas e números formatados em pt-BR, exceto a notação da unidade selecionada. |
| RNF10 | Apresentação visual | Usar o tema dark com estética glassmorphism prevista pelo projeto, preservando contraste mínimo de 4,5:1 para texto. |
| RNF11 | Disponibilidade e continuidade | Meta de disponibilidade da aplicação: pelo menos 99,5%. A falha da Open-Meteo não deve ocultar o último forecast válido em cache; exibir seu horário de atualização. O método de medição de disponibilidade depende da definição operacional em aberto. |
| RNF12 | Observabilidade | No MVP não há telemetria externa em produção. Erros são tratados por boundary de erro e registrados localmente em console; Web Vitals são verificados em laboratório via Lighthouse CI. Reintroduzir telemetria requer análise LGPD. |
| RNF13 | Eficiência de rede | Bundle inicial de até aproximadamente 200 KB gzip e cache de forecast/geocoding com TTL de 10 minutos. Verificar tamanho do bundle e comportamento do cache. |
| RNF14 | Performance percebida | Em dispositivo móvel mediano: LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1; verificar em Lighthouse CI. |
| RNF15 | Capacidade | A aplicação deve suportar picos de acesso sem degradação atribuível à hospedagem, usando distribuição por CDN. A capacidade concreta e o perfil de pico precisam ser acordados com a operação. |

## Edge Cases

| Situação | Comportamento esperado |
|---|---|
| Texto de busca vazio ou com menos de dois caracteres | Não consultar geocoding; manter a interface de busca pronta para entrada. |
| Nenhuma cidade corresponde ao texto | Mostrar estado vazio em pt-BR, incluir o termo consultado e sugerir revisar a grafia. |
| Vários resultados com o mesmo nome | Mostrar região e país em cada opção; exigir seleção explícita. |
| Resultado sem região administrativa | Mostrar nome e país sem inventar região. |
| Cidade restaurada do armazenamento local, mas sem rede | Mostrar a previsão salva, marcá-la como desatualizada e exibir o horário de atualização. Se não existir cache, mostrar erro recuperável. |
| Cache de forecast com mais de 10 minutos | Tentar atualizar ao carregar/selecionar a cidade; conservar o dado stale se a atualização falhar e indicar o timestamp. |
| Timeout, perda de rede, HTTP 4xx/5xx ou JSON inválido | Mostrar a mensagem correspondente e opção de tentar novamente; usar cache de forecast válido como degradação quando disponível. |
| HTTP 429 | Informar que há muitas consultas, fazer uma tentativa automática com backoff curto e então permitir nova tentativa manual se necessário. |
| Respostas de busca chegam fora de ordem | Ignorar resposta obsoleta que não corresponda ao texto atual. |
| Pessoa troca de cidade enquanto uma requisição está em andamento | Não permitir que a resposta atrasada da cidade anterior substitua a cidade atualmente selecionada. |
| Código WMO desconhecido | Mostrar descrição genérica de condição indisponível e ícone neutro, mantendo temperatura e previsão disponíveis. |
| Data ausente/inválida ou sequência diária incompleta | Tratar como resposta inválida; não inventar datas. Valores meteorológicos nulos/ausentes em datas válidas são apresentados como “—”; valores de tipo inválido resultam em erro. |
| Preferências ausentes ou ilegíveis no armazenamento local | Usar Celsius e estado sem cidade selecionada; permitir continuar sem falha da aplicação. |
| Armazenamento local indisponível ou cheio | A consulta online deve continuar utilizável durante a sessão; avisar de forma não bloqueante que preferências/cache podem não persistir. |
| Usuário nega permissões do navegador | Nenhuma permissão de geolocalização é solicitada pelo MVP. |

## Assumptions

- As decisões D1–D15 do discovery são compromissos do MVP e prevalecem sobre suposições anteriores que as contradigam.
- A Open-Meteo (geocoding e forecast) está disponível sem chave e atende à cobertura global desejada; a aplicação não garante precisão meteorológica independente da fonte.
- A primeira experiência sem dados persistidos começa sem cidade selecionada e usa Celsius.
- Os nomes, regiões, países, timestamps, coordenadas e códigos de condição dependem do conteúdo fornecido pela API; campos que a fonte não fornece não serão inventados.
- O produto atende usuários finais genéricos, com prioridade para pessoas no Brasil que consultam o tempo rapidamente, principalmente em celular.
- A hospedagem será estática e distribuída por CDN, mas provedor, orçamento, prazo e responsáveis operacionais ainda não foram definidos.
- Cache offline significa exibir dados previamente salvos no armazenamento local; não significa que a aplicação inteira possa ser carregada offline.

## Risks

| ID | Risco | Mitigação prevista |
|---|---|---|
| RT01 | Indisponibilidade ou alteração contratual da Open-Meteo interrompe a consulta. | Isolar dependência do provedor, validar respostas, oferecer retry e exibir cache válido com timestamp. |
| RT02 | Autocomplete gera excesso de requisições e pode sofrer rate limit. | Debounce, mínimo de dois caracteres, descarte de consultas obsoletas e cache; limitar a 10 resultados. |
| RT03 | Código WMO raro ou não reconhecido resulta em condição incorreta ou interface quebrada. | Manter a tabela WMO desta especificação e fallback neutro; validar códigos documentados por teste. |
| RT04 | Datas calculadas no fuso do dispositivo mostram dias errados para a cidade. | Usar as datas e o fuso retornados pela fonte; cobrir fusos extremos nos testes. |
| RT05 | Desempenho em dispositivos de entrada ou redes móveis fica abaixo das metas. | Verificar bundle e Core Web Vitals em Lighthouse CI com condições de laboratório representativas. |
| RT06 | Cobertura de testes insuficiente permite regressões nos fluxos principais. | Derivar testes dos critérios de aceite e cobrir o fluxo crítico em E2E. |
| RT07 | Respostas fora de ordem exibem dados de cidade ou busca incorretos. | Cancelar/ignorar resultados obsoletos e testar operações lentas com troca de cidade/termo. |
| RP01 | Stakeholders esperam aplicativo nativo instalável em loja. | Validar a decisão de web responsiva antes do planejamento; app nativo não faz parte deste MVP. |
| RP02 | Definição limitada de indicadores climáticos diverge das expectativas de stakeholders. | Confirmar explicitamente que o MVP inclui apenas os campos definidos em RF03 e RF04. |
| RP03 | Ausência de geolocalização é percebida como falha de produto. | Manter busca manual evidente e persistir a última cidade; comunicar a decisão de escopo. |
| RP04 | Homônimo leva usuário a consultar a cidade errada. | Exibir nome, região e país e exigir seleção explícita. |
| RP05 | Acessibilidade não atende ao padrão interno esperado. | Verificar critérios WCAG 2.1 AA continuamente; não tratar certificação legal como escopo do MVP. |
| RP06 | Usuários questionam precisão ou atualidade dos dados. | Identificar fonte e horário de atualização na experiência do produto. |
| RP07 | Não há responsável para operação e correção após a entrega; ausência de telemetria externa dificulta detectar problemas. | Definir responsável e canal de feedback antes do lançamento; registrar limites de observabilidade do MVP. |
| RP08 | Sem métricas de negócio acordadas, não há critério para avaliar sucesso do produto. | Definir métricas e metas com stakeholders antes de declarar sucesso ou expansão do produto. |

## Out of Scope

- Aplicativos nativos para iOS ou Android e publicação em lojas.
- Instalação como PWA e service worker para carregamento/offline completo.
- Geolocalização automática ou solicitação de permissão de localização.
- Login, cadastro, sincronização ou persistência em servidor.
- Lista de favoritas, comparação simultânea ou gestão de múltiplas cidades; uma cidade é exibida por vez.
- Previsão horária detalhada.
- Sensação térmica, umidade, vento, UV e outros indicadores além da temperatura e condição atuais e dos campos diários definidos.
- CEP e coordenadas como entrada de busca.
- Atualização automática contínua/polling; os dados são obtidos ao carregar ou selecionar cidade e podem ser atualizados por ação explícita de refresh.
- Alertas meteorológicos push e mapas meteorológicos.
- Interface em idiomas além de pt-BR.
- Analytics, Sentry ou outra telemetria externa em produção no MVP.
- Certificação formal WCAG/e-MAG ou obrigação regulatória de acessibilidade; WCAG 2.1 AA continua sendo padrão interno de qualidade.

## Open Questions

As perguntas abaixo não bloqueiam a especificação funcional, mas precisam de resposta para planejamento, operação e avaliação de negócio. Correspondem às lacunas remanescentes do discovery.

| ID | Pergunta | Impacto se não respondida |
|---|---|---|
| OQ01 (P1) | Qual objetivo de negócio o produto deve atender? | Pode levar a decisões de prioridade e trade-offs desalinhadas ao propósito do projeto. |
| OQ02 (P2) | As personas presumidas e a prioridade ao público brasileiro representam os usuários reais? | Pode exigir revisão de linguagem, comportamento e prioridades do produto. |
| OQ03 (P3) | Quais métricas e metas definirão sucesso do MVP? | Não será possível avaliar objetivamente adoção, qualidade ou conclusão do projeto. |
| OQ04 (P4) | Qual orçamento está disponível para hospedagem, manutenção e evolução? Há outras restrições comerciais? | Pode alterar escolhas de operação ou evolução após o MVP. |
| OQ05 (P5) | Existe prazo-alvo, marco de negócio ou data de lançamento? | Impede estimar e priorizar entregas com base em uma data acordada. |
| OQ06 (P22) | Quem será responsável por monitorar, manter e responder a problemas após a entrega, e qual será o canal de feedback? | Sem ownership, falhas podem permanecer sem diagnóstico ou correção, especialmente sem telemetria externa. |
| OQ07 (RNF11/RNF15) | Quem fornecerá hospedagem/CDN e como serão medidos o uptime de 99,5% e os picos de acesso esperados? | As metas de disponibilidade e capacidade não podem ser verificadas sem operação e perfil de carga definidos. |
| OQ08 (RF07) | Qual é a duração exata do backoff antes da tentativa automática após HTTP 429? | Os testes automatizados podem verificar a quantidade de retries, mas precisam do intervalo acordado para validar o tempo de espera. |

## Artefatos de UX e dados

### Wireframe de baixa fidelidade

```text
+--------------------------------------------------+
| Weather App                 [°C] [°F]            |
| [ Buscar cidade...                               ]|
|   Curitiba, Paraná, Brasil                       |
|                                                  |
| Atualizado às HH:MM             [Atualizar]      |
|                                                  |
| Curitiba, PR                                     |
| 18 °C     Parcialmente nublado       [ícone]     |
|                                                  |
| Próximos dias                                    |
| Hoje       [condição]    Máx. 21°   Mín. 14°    |
| Amanhã     [condição]    Máx. 22°   Mín. 13°    |
| Dia +2     [condição]    Máx. 19°   Mín. 12°    |
| Dia +3     [condição]    Máx. 20°   Mín. 11°    |
| Dia +4     [condição]    Máx. 23°   Mín. 15°    |
+--------------------------------------------------+
```

O wireframe representa a hierarquia mínima: busca e unidade, identificação da cidade, atualização, clima atual e cinco dias. Em carregamento, erro ou vazio, a área de resultados comunica o respectivo estado sem remover a possibilidade de busca.

### Tabela de códigos WMO

Ícones abaixo são categorias semânticas de apresentação; a seleção visual final pertence ao design do produto. Códigos não listados ou não reconhecidos usam “Condição indisponível” e ícone neutro.

| Código(s) WMO | Descrição pt-BR | Categoria de ícone |
|---|---|---|
| 0 | Céu limpo | Sol |
| 1 | Predominantemente limpo | Sol com poucas nuvens |
| 2 | Parcialmente nublado | Sol entre nuvens |
| 3 | Nublado | Nuvem |
| 45, 48 | Neblina | Neblina |
| 51 | Chuvisco leve | Chuvisco |
| 53 | Chuvisco moderado | Chuvisco |
| 55 | Chuvisco intenso | Chuvisco |
| 56, 57 | Chuvisco congelante (leve / intenso) | Chuvisco congelante |
| 61 | Chuva leve | Chuva |
| 63 | Chuva moderada | Chuva |
| 65 | Chuva intensa | Chuva forte |
| 66, 67 | Chuva congelante (leve / intensa) | Chuva congelante |
| 71 | Neve leve | Neve |
| 73 | Neve moderada | Neve |
| 75 | Neve intensa | Neve forte |
| 77 | Grãos de neve | Neve |
| 80 | Pancadas de chuva leves | Pancadas de chuva |
| 81 | Pancadas de chuva moderadas | Pancadas de chuva |
| 82 | Pancadas de chuva violentas | Pancadas de chuva forte |
| 85 | Pancadas de neve leves | Pancadas de neve |
| 86 | Pancadas de neve intensas | Pancadas de neve forte |
| 95 | Trovoada | Trovoada |
| 96, 99 | Trovoada com granizo (leve / intenso) | Trovoada com granizo |
