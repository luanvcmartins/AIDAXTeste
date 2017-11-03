# AIDAXTeste
Ferramenta web simples capaz de consumir um arquivo .csv com dados de usuários e registrar o conteúdo com a AIDAX Client-Side API.


## Como usar
1. Baixe o projeto e execute o index.js através do NodeJS;
2. Acesse sua máquina na porta 8080 para ter acesso à página (geralmente http://localhost:8080);
3. Na página, basta clicar em qualquer local para selecionar ou soltar um arquivo no formato .csv válido para realizar a importação.

## Client-side
Sempre tenho preferência em realizar qualquer trabalho do lado do cliente caso seja possível e seguro. Na tarefa em questão, em especial no requisito "Usar AIDAX client-side" é possível realizar todo trabalho do lado do cliente, sem realizar upload de arquivos ou processamento do servidor. 

## Server-side
Há também a opção de realizar o processamento do arquivo do lado do servidor, nesse caso deve ser feito o upload do arquivo para o servidor, que realiza o processo de enviar os dados para a AIDAX através de requisições HTTP (curl).