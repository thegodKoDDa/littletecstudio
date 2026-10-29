# Paridade da aplicação web

Comparação com os 30 itens do inventário do Studio. “Implementado” descreve
código acessível e integração de software; **não equivale a teste físico pela web**.
O desktop 1.1 permanece confirmado pelo usuário para cores e mapeamento.
A leitura real pela web e a aplicação sem alterações foram verificadas em
28/10/2026; não houve novo ensaio físico de troca de configuração.

| Recurso | Destino / comportamento na web |
| --- | --- |
| Três camadas independentes | Mapeamento / Iluminação → abas de camada |
| 12 teclas com seleção e rótulos | Mapeamento → placa interativa |
| Dois giratórios: esquerda, clique e direita | Mapeamento → seis alvos; presets, inversão, cópia e troca de giros |
| Letras, números, navegação e numérico | Editor → Teclado / captura física |
| F1–F24 | Editor → Teclado → F1–F24 |
| Ctrl, Shift, Alt, Win dos dois lados | Editor → Teclado → oito modificadores; etapas editáveis |
| Símbolos e combinações rápidas | Editor → Teclado → posições US e Shift; editor de texto |
| Aliases command, option e control | Mesmos bits Win/Alt/Ctrl; aliases explicados no guia, sem prova macOS |
| Sequências por posição | Editor → adicionar à sequência; até 20 etapas para envio |
| Adicionar, remover e reordenar etapas | Editor → sequência → tecla/modificadores, remover e reordenar |
| 21 ações multimídia | Editor → Mídia; catálogo completo do Python |
| 11 ações de mouse e roda | Editor → Mouse; botões/roda e Ctrl/Shift/Alt |
| Atraso de 0 a 6000 ms | Editor → Atraso → 0 a 6000 ms |
| Sete cores de iluminação | Iluminação → sete cores nativas |
| Seis modos LED | Iluminação → seis modos |
| Iluminação por camada | Iluminação → camada atual / aplicar nas três |
| Ler configuração do aparelho | Conectar teclado / Ler teclado → ponte local Windows |
| Aplicar configuração | Aplicar mapeamento → serviço Python com releitura e tentativa de retorno |
| Limpar posição | Editor → ícone Limpar posição |
| Limpar camada ou tudo | Mapeamento → Limpar camada / Limpar tudo |
| Novo, abrir, salvar e salvar como | Perfis → criar, importar, exportar, biblioteca local e nome |
| 24 modelos de rascunho e personalizado | Perfis → modelos de rascunho → 24 modelos / personalizado |
| Desfazer/refazer | Barra de perfil → desfazer/refazer; Ctrl+Z / Ctrl+Y |
| Cópias brutas e importação com hash | Perfis → importar pasta / JSON de cópia e exportar os 72 relatórios |
| Revisão e exportação de alterações | Barra inferior → Revisar alterações → exportar revisão |
| Preservar dados desconhecidos | Perfis e editor preservam hex; escrita desconhecida recusada pelo serviço |
| Diagnóstico e exportação | Diagnóstico → coleta e exportação |
| Conexão, timeout e falhas de envio | API validada, fila serial, revisão entre abas, erros e rascunho preservado |
| Tema claro/escuro e redimensionamento | Barra lateral → tema claro/escuro; layouts responsivos |
| Aplicação direta de iluminação | Iluminação → envio direto, sem ensaio/recibo/confirmar cor |

## Compatibilidade e limites

- JSON v2 preserva modelos, iluminação desconhecida e registros opacos; v1 migra
  como no Python, mantendo suas posições de teclas sem inventar giratórios.
- Modelos diferentes de 12+2 são rascunhos. O serviço recusa aplicação em outros
  modelos e a interface desabilita essa ação. Não existe suporte USB implícito.
- Uma cópia contém os 72 relatórios observados; não inclui LED nem firmware.
  Importar cópia não muda o snapshot do dispositivo e não envia comandos.
- Sem LED readback. Os estados são seleção local e último envio conhecido;
  falhas de iluminação invalidam a referência das camadas afetadas.
- Ctrl/Win/Alt correspondem aos mesmos bits usados pelo desktop. No macOS,
  Win pode ser denominado command e Alt, option; execução macOS não foi validada.
- Atalhos de arquivo: Ctrl/Cmd+S salva na biblioteca, Shift+S exporta, O importa,
  N cria; Z e Y/Shift+Z controlam o histórico quando fora dos campos de texto.
- Leitura não substitui silenciosamente um rascunho existente. Edições feitas
  durante leitura/envio continuam locais e pendentes.
- A ponte fica no Windows; o Next pode estar no Windows ou no WSL/NAT da mesma máquina, com relay local; acesso direto por WebHID
  ou hospedagem com pareamento não faz parte desta implementação local.
