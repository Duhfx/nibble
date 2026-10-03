# Nibble

[English](README.md) · **Português**

Um bichinho em pixel art que mora na faixa acima do prompt do Claude Code. Ele come suas edições, comemora quando os testes passam, fica preocupado quando o contexto enche e cresce ao longo de semanas de uso. Ao lado dele, a faixa mostra o contexto e os limites de uso da sessão num relance.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/band-dark.svg">
  <img alt="A faixa do Nibble acima do prompt: o bichinho com seus medidores à esquerda, contexto e limites de uso à direita" src="assets/band-light.svg" width="100%">
</picture>

## Funcionalidades

- **Um bichinho vivo acima do prompt.** Ele quica, pisca, mastiga, dorme e comemora. No app desktop é um SVG animado; no terminal é pixel art desenhada com meio-bloco.
- **Ele se alimenta do seu trabalho.** Edições de arquivo e comandos de shell alimentam, testes passando deixam feliz, erros e testes falhando deixam preocupado.
- **Uma evolução longa.** Ovo → bebê → adulto → mestre (com coroa) → lenda (pelagem perolada e brilhos) → estrelas sem fim. Calibrada para quem usa muito continuar alcançando marcos por meses.
- **Uso da sessão num relance.** Ocupação do contexto, limite de 5h e limite semanal, com horários de reset e o início da sessão. As barras ficam âmbar acima de 60% e vermelhas acima de 85%.
- **Ele te avisa.** Com o contexto em 80% o bichinho pede um `/compact`; com um limite de uso em 90% ele fica cansado.
- **Seu bichinho, seu nome.** Renomeie com `/nibble-name`.
- **Português e inglês.** Troque com `/nibble-lang`.
- **Nunca morre, nunca perde progresso.** No pior caso fica faminto e emburrado até você voltar.

## Instalação

Por este repositório, como marketplace:

```
/plugin marketplace add Duhfx/nibble
/plugin install nibble@nibble
```

Ou carregue um clone local por uma sessão:

```bash
claude --plugin-dir /caminho/para/nibble
```

Requer uma versão do Claude Code com suporte a mods (function hooks).

## Comandos

| Comando | O que faz |
| --- | --- |
| `/nibble-name <nome>` | Renomeia o bichinho (até 16 caracteres). |
| `/nibble-lang pt-BR` · `/nibble-lang en` | Troca o idioma da faixa. |

## Como o bichinho funciona

Todos os medidores vão de 0 a 100. Só contam ações feitas dentro do Claude Code.

### ♥ Humor
- **+12** quando um teste passa, **−8** quando um teste falha. Teste é um comando de shell que contenha `test`, `pytest`, `jest`, `vitest`, `rspec` ou `phpunit`.
- **+2** a cada prompt que você envia.
- **−3** quando qualquer outra ferramenta dá erro.
- A cada minuto ele anda 1 ponto de volta em direção a 50.

### 🍗 Comida (cheia = bem alimentado)
- **+4** por edição de arquivo bem-sucedida (Edit, Write, MultiEdit, NotebookEdit).
- **+2** por comando de shell bem-sucedido.
- **−1** por minuto com o Claude Code aberto; **−1 a cada 10 minutos** com ele fechado.
- O ovo não sente fome. Leitura e busca não alimentam.

### ⚡ Energia
- **−0,5** por uso de ferramenta e **−1** por minuto enquanto você está ativo.
- **+4** por minuto depois de 5 minutos sem atividade.
- Volta a 100 depois de 30 minutos ou mais fora.

### ✨ XP
- **+3** por teste que passa, **+1** por edição de arquivo, **+1** por outro comando de shell. Teste falhando não dá nada.
- O xp nunca diminui. O nível é a raiz quadrada do xp.

<p align="center"><img alt="Estágios de evolução: ovo, bebê, adulto, mestre, lenda" src="assets/stages.svg" width="600"></p>

| Estágio | XP |
| --- | --- |
| 🥚 Ovo | 0 |
| 🟢 Bebê | 15 |
| 🟣 Adulto | 150 |
| 👑 Mestre | 3.000 |
| 🌟 Lenda | 20.000 |
| ★ Estrela | a cada 5.000 depois da Lenda |

Com cerca de 500 ações por dia: adulto no primeiro dia, mestre em cerca de uma semana, lenda em cerca de seis semanas e depois uma estrela a cada dez dias, mais ou menos.

### Rosto do bichinho
Vale a primeira regra que se aplicar:

1. **Uma reação curta** por alguns segundos: comendo após uma edição, comemorando um teste que passou ou um novo estágio, preocupado após um erro.
2. **Dormindo** com energia abaixo de 15 ou depois de 10 minutos sem atividade.
3. **Preocupado com a sessão** com o contexto em 80% ou mais, ou um limite de uso em 90% ou mais.
4. **Faminto** com comida abaixo de 25.
5. **Triste** com humor abaixo de 25.
6. **Feliz** com humor acima de 75.
7. **De boa** nos outros casos.

## O que os hooks fazem

O Nibble é um mod: um módulo de function hooks (`hooks/register.tsx`). Todo hook repassa o evento sem alterá-lo; nenhum bloqueia, reescreve ou atrasa nada do que você ou o Claude fazem.

| Hook | O que faz |
| --- | --- |
| `session.start` | Carrega o bichinho do armazenamento do plugin, aplica o tempo em que você ficou fora, registra `/nibble-name` e `/nibble-lang` e inicia dois timers: o quadro da animação (a cada 400 ms) e o tique de cada minuto (fome, energia, humor, atualização do uso). |
| `prompt.submit` | Dá um pouco de humor e marca você como ativo. O texto do prompt não é lido nem alterado. |
| `tool.call` | Deixa a ferramenta rodar e depois olha o nome dela e se deu certo (e, em comandos de shell, o texto do comando para reconhecer testes) para atualizar comida, humor, energia e xp. A chamada e o resultado seguem intactos. |
| `turn.complete` | Atualiza os números de contexto e de limites de uso, os mesmos da status line. |
| `command.run` | Responde a `/nibble-name` e `/nibble-lang`. |
| `ui.render` (`AbovePrompt`) | Desenha a faixa acima do prompt. Sai da frente quando uma pesquisa usa a faixa. |

## Privacidade

O Nibble roda localmente. Ele só olha qual ferramenta rodou e se deu certo (e o texto do comando de shell, para reconhecer testes). O estado fica no armazenamento de plugins do Claude Code, na sua máquina. Nada é enviado para lugar nenhum.

## Desenvolvimento

O plugin é um módulo de hooks (`hooks/register.tsx`), com os sprites em `hooks/sprites.ts`, os painéis do desktop em `hooks/band.ts` e todos os textos em `hooks/i18n.ts`. Para verificar:

```bash
claude plugin validate .
```
