# LittleTec Web

## 0.3.0 — 29/10/2026

- Projeto unificado como LittleTec Studio; Web e Desktop no repositório `littletecstudio`.
- Desktop Electron com a interface React do Web e núcleo Python comum.
- Executável portátil com pacote embutido e abertura direta pelo WSL/Windows.
- Correção do fechamento da janela e da reabertura; integração nativa de arquivos.
- Organização da documentação, releases Windows/Web e vínculo com o OG preservado.
- Transferência da cópia Web interna e suas evidências para o histórico local do Studio.
- Perfis, chaves de armazenamento e dados anteriores preservados.

As versões abaixo pertencem ao histórico Web anterior.


## 0.2.0 — 28/10/2026

- Entrada ao vivo por Windows Raw Input: teclado, mídia e mouse do LittleTec,
  com filtro 1189:8842/MI_01 antes da interpretação. Sem bloquear as ações do sistema.
- Giros animados e teclas/cliques destacados a partir dos eventos recebidos.
  Associação usa as ações realmente lidas; comandos duplicados ficam ambíguos.
- Painel ao vivo com pausa, histórico, contador e opção de seguir a seleção.
- Área Giratórios com três ações por knob, presets, inversão, limpeza e cópia
  para outro knob ou camada, integrada ao histórico e à aplicação verificada.
- Correção para Win+D observado no clique real do knob 2: recuperação a partir
  da liberação do D e do contexto de modificadores, sem emitir teclas artificiais.
- Ícones refinados para brilho, bloqueio, desktop, aplicativos e teclas literais.
- Monitor compartilhado entre abas, cursores independentes, buffer limitado e
  encerramento por pausa, fechamento da página ou expiração da sessão.

## 0.1.0 — 28/10/2026

- Interface Next.js separada do Studio Windows, editor, perfis, iluminação,
  giratórios, histórico, cópias e diagnóstico.
- Ponte Windows com relay local para WSL/NAT; inicialização conjunta.
