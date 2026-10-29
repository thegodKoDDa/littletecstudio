# Estado atual — LittleTec Web 0.2.0

Atualizado em **29/10/2026**.

## Confirmação de funcionamento

O usuário confirmou que **desktop e, principalmente, Web estão funcionando
normalmente: mapeando, trocando cores e aplicando mudanças no teclado**.
O Web local com ponte Windows tem uso real confirmado. Não retomar integração,
escrita dos giratórios ou iluminação como funcionalidades ainda por concluir.
Não repetir ensaios físicos por rotina.

Essa confirmação é de uso, não um novo laudo automatizado de cada efeito,
combinação, camada ou persistência após reconexão. Os laudos históricos preservam
seu alcance. LED continua sem readback; último envio e prévia local não são
leitura do estado interno.

## Versões e publicação

| Produto | Versão publicada | Commit da versão | Main consultada em 29/10/2026 |
| --- | --- | --- | --- |
| Web | `v0.2.0` | `256e0ce` | `7f0bb11` |
| Studio desktop | `v1.1.0` | `f234995` | `eaa6f36` |

[Repositório Web](https://github.com/thegodKoDDa/littletec-web),
[release Web](https://github.com/thegodKoDDa/littletec-web/releases/tag/v0.2.0),
[Pages](https://thegodkodda.github.io/littletec-web/) e
[desktop](https://github.com/thegodKoDDa/littletec).
CI das duas main consultadas, release Web e deploy Pages concluíram com sucesso.
Pages respondeu HTTP 200 na consulta de 29/10/2026. Commits posteriores às tags
atualizam a documentação de convergência; não são novas versões do produto.

## Formas de execução

| Forma | Capacidades |
| --- | --- |
| Web local com ponte Python Windows | Ler teclado, editar e aplicar mapeamento/cores; entrada física ao vivo |
| GitHub Pages | Editor, rascunhos e importação/exportação de perfis; sem ponte USB incluída |
| Pacote HTML estático | Editor de perfis; sem ponte USB incluída |

A confirmação de uso USB se refere à integração local, não a acesso direto ao
hardware pelo Pages. Não há transporte WebHID implementado.

## Código, cópias e evidências

- `src/components/`: Studio, editor, placa, giratórios e painel ao vivo.
- `src/lib/`: perfil v1/v2, catálogo, transporte e estado de entrada ao vivo.
- `src/app/api/device/route.ts`: API local de comandos de alto nível.
- `bridge/server.py`: serialização, revisão do snapshot e coordenação dos serviços.
- `bridge/relay.py`: transporte pelo loopback Windows a partir do WSL.
- `bridge/input_events.py`, `live_input.py`, `raw_input_windows.py`: monitor passivo
  MI_01 e associação ao mapeamento lido; configuração usa MI_00 por HIDAPI.
- No repositório independente, `bridge/core/littletec/` inclui o núcleo Python.
  A cópia interna em `littletec/web/` importa o núcleo do desktop em `../novo/src/`.
- As duas cópias não se sincronizam automaticamente; lançadores, documentação e
  artefatos podem diferir. Em 29/10/2026, os 14 módulos do núcleo incluído coincidiam
  com os correspondentes do desktop.
- Capturas de desenvolvimento ficam em `littletec/web/.runtime/`, fora do Git.
  Sua ausência em um clone público não significa ausência de validação anterior.

## Alcance das verificações

A documentação da 0.2 registra 14 testes TypeScript, 28 Python e 9 Playwright,
build/tipos, leitura USB real e eventos físicos dos knobs/teclas. São resultados
daquela sessão; não foram reexecutados para organizar estes documentos.
A confirmação atual de uso acrescenta troca de cores e aplicação de alterações.
Detalhes em [VERIFICACAO.md](VERIFICACAO.md).

Modelos diferentes do 12+2 são rascunhos. Perfis opacos e reservados permanecem
preservados; cópias cobrem 72 relatórios, sem firmware nem estado LED interno.
O monitor não informa diretamente origem física, camada ativa ou ângulo absoluto;
associação ao snapshot mantém ambiguidades de comandos repetidos.

O Web é a referência registrada para futura convergência visual do desktop.
Essa direção não significa migração concluída nem tarefa iniciada nesta revisão.
Documentação em [README.md](README.md) e uso em [../README.md](../README.md).
