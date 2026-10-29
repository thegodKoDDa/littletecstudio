# Entrada ao vivo — LittleTec Web 0.2

Estado vigente em [ESTADO_ATUAL.md](ESTADO_ATUAL.md). O usuário confirmou o Web
funcional para mapeamento, cores e aplicação em 29/10/2026. Os números e os casos
concretos na seção Verificação abaixo são do ensaio de 28/10/2026.

Conecte o teclado pela interface. A entrada ao vivo inicia automaticamente e pode
ser pausada no painel acima do aparelho. Não grava configuração e não bloqueia
as teclas, atalhos, volume ou brilho no Windows. “Seguir entrada” muda a seleção
do editor, sem trocar de camada ou modificar o rascunho.

A nova área **Giratórios** mostra esquerda, clique e direita de cada knob.
Presets, inversão, limpeza e cópias alteram o rascunho como uma única ação
reversível; só **Aplicar mapeamento** envia ao aparelho.

## De onde vêm os movimentos

A ponte usa Windows Raw Input com `RIDEV_INPUTSINK` e uma janela oculta na thread
própria. Registra teclado, mouse e Consumer Control. Filtra `VID_1189&PID_8842`
e `MI_01` antes de interpretar ou reter eventos; não escuta o teclado principal.
Não abre outro handle HIDAPI e não consome respostas de configuração da MI_00.

As coleções de mídia são interpretadas por `HidP_GetUsages` sobre os descritores
que o próprio Windows fornece. Nesta máquina foram identificadas quatro
coleções de entrada (mídia, mouse e duas de teclado); o relatório de mídia tem
três bytes e Report ID 5. Isso não altera o relatório 3 de configuração do Studio.

O monitor associa os comandos recebidos ao **snapshot do aparelho**, não ao
rascunho ainda não enviado. Há buffer de 512 eventos, cursor por aba e long
polling fora da fila de gravação. Pausar uma aba não desliga outra. Leases expiram
após 15 segundos sem acompanhamento; o monitor encerra quando não há clientes.
No WSL o mesmo relay Windows já utilizado pela configuração transporta os eventos.

## Limites que a interface respeita

O firmware não informa, nesses eventos, o número da tecla/knob, a camada ativa
ou o ângulo físico. Por isso:

- Uma ação que corresponde a uma única posição física permite destacar a tecla
  ou animar o sentido do giro. O ângulo é uma representação visual dos comandos.
- A mesma posição em três camadas continua sendo uma única posição física;
  não é necessário inventar qual camada está ativa.
- Se a ação aparece em posições diferentes, os candidatos são destacados em
  âmbar. Nenhum sentido de giro é inventado nesse caso.
- Um exemplo real é Silenciar: na configuração lida durante aquele ensaio, estava na tecla 1 e no clique
  do giro 1. O relatório de mídia é igual e não distingue essas origens.
- Ações vazias e atraso sem saída não geram um evento observável. Monitorá-las
  como se fossem teclas identificadas exigiria informação que não existe no fluxo.
- Os comandos continuam atuando no Windows durante o monitoramento. Win+L,
  por exemplo, pode bloquear a sessão; a interface não suprime o atalho.

O clique Win+D do knob 2 revelou um caso concreto: a captura real trouxe Win-down,
Win-up e D-up, sem D-down. O decoder preserva o contexto de modificadores desse
aparelho por até 80 ms para reconhecer esse atalho pelo evento de liberação.
A captura mostrou intervalo de aproximadamente 5 ms. A origem do reconhecimento
é marcada como `release-context`; não são gerados eventos sintéticos no Windows.
O contexto expira para não atribuir uma liberação posterior a um atalho antigo.
Essa recuperação é restrita ao Win+D observado; não adivinha outros atalhos.

## Verificação

O usuário girou os dois knobs nos dois sentidos, clicou e pressionou teclas.
A captura inicial pela interface registrou 192 eventos: 158 de mídia e 34 de
teclado, incluindo volume/brilho nos dois sentidos, Silenciar e teclas comuns.
Nenhum relatório ficou sem interpretação. Houve quatro eventos com origem
ambígua de Silenciar, conforme a duplicação da configuração.

A imagem `.runtime/live-real-event.png` registra os dials girados e o controle
real de brilho destacado; `.runtime/live-physical-summary.json` resume o ensaio.
Os dois cliques adicionais e seu RAWKEYBOARD estão em
`.runtime/live-click-trace.json`; o vetor mínimo sem dados pessoais é preservado
em `tests/fixtures/live-win-d.json`. O caso Win+D foi validado reprocessando esse
vetor real no Linux e no Python Windows, além da integração simulada da interface.
Não alegar um novo teste físico posterior à correção do decoder sem essa evidência.

Os testes unitários usam entradas simuladas ou o vetor salvo e não iniciam
monitoramento físico. Nenhum ensaio de cores, A/F24 ou escrita dos slots foi
repetido para implementar este recurso.

## Referências de implementação

- [Windows Raw Input](https://learn.microsoft.com/en-us/windows/win32/inputdev/about-raw-input)
- [Registro em segundo plano](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-rawinputdevice)
- [RAWKEYBOARD](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-rawkeyboard)
- [HidP_GetUsages](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getusages)
