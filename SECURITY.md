# Segurança

## O que o projeto protege

- **Credenciais**:
  - O `refresh_token` fica num arquivo com modo 600, gravado de forma atômica, ou no `TokenStore` que você fornecer.
  - CPF e senha (opcionais, só no `b3 login`) vêm do ambiente ou do cofre do sistema: DPAPI no Windows, Keychain no macOS, Secret Service no Linux. São digitados sem eco e passam aos utilitários do sistema por stdin, nunca por argumento.
  - O `b3 login` nunca resolve nem contorna CAPTCHA ou código de verificação: isso fica com a pessoa, na janela.
  - Nada disso vai para logs, saída de comandos ou respostas HTTP.
- **Rede**: o código só fala com `b3investidor.b2clogin.com` e `investidor.b3.com.br`, além do `B3_ALERT_WEBHOOK`, se você configurar um. Sem telemetria.
- **Servidor**:
  - escuta em `127.0.0.1` por padrão;
  - exige `x-api-key` (mínimo 16 caracteres, comparação em tempo constante);
  - oculta `authorization` e `x-api-key` nos logs;
  - nunca devolve o token recebido em `POST /v1/session`.
- **Só leitura**: o único POST para a B3 é o de renovação do token.

## O que é responsabilidade sua

- Exponha o servidor para fora da sua máquina só atrás de HTTPS e com uma chave forte.
- Quem tem o `session.json` ou a `x-api-key` lê a sua carteira e o seu cadastro.
- Prefira `b3 credenciais salvar` ou injeção na hora (gerenciador de segredos) a deixar a senha em `.env`.

## Reportar uma vulnerabilidade

Não abra issue pública. Use o recurso **"Report a vulnerability"** (GitHub Security Advisories) deste repositório. Respondemos assim que possível.
