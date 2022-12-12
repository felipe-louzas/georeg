# GeoReg
[![GitHub license](https://img.shields.io/github/license/felipe-louzas/georeg-hackathon-web3)](https://github.com/felipe-louzas/georeg-hackathon-web3/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/felipe-louzas/georeg-hackathon-web3)](https://github.com/felipe-louzas/georeg-hackathon-web3/issues)
[![GitHub stars](https://img.shields.io/github/stars/felipe-louzas/georeg-hackathon-web3)](https://github.com/felipe-louzas/georeg-hackathon-web3/stargazers)
[![GitHub stars](https://img.shields.io/github/forks/felipe-louzas/georeg-hackathon-web3)](https://github.com/felipe-louzas/georeg-hackathon-web3/network/members)

### Registro de Imóveis Georreferenciados em blockchain
---------

※ Esse projeto foi submetido ao "*[Hackathon Web3 da Secretaria do Patrimônio da União](https://desafios.enap.gov.br/pt/desafios/hackathon-web3-tokenizacao-do-patrimonio-da-uniao)*" ※

*ESSE REPOSITÓRIO NÃO FAZ PARTE DA SUBMISSÃO AO HACKATHON!*

O repositório do projeto submetido ao Hackathon é este: [https://github.com/felipe-louzas/georeg-hackathon-web3](https://github.com/felipe-louzas/georeg-hackathon-web3)

------

O presente projeto buscou identificar uma solução inovadora que atendesse aos objetivos da Secretaria de Patrimônio da União – SPU quanto a caracterização e incorporação de imóveis, a partir da superação dos seus principais desafios e de uma proposta de aplicações futuras, a fim de aprimorar a gestão do patrimônio da União. Assim, a questão a ser respondida foi: como gerar, registrar, organizar e acessar os dados dos imóveis georreferenciados para caracterizá-los, incorporá-los ao patrimônio da União e regularizar o domínio dos bens pela União, de forma confiável, transparente, segura e acessível? 

Para responder a essa questão realizamos pesquisas sobre as melhores práticas de administração de terras e patrimônio público e as tecnologias utilizadas para gerar, validar e registrar dados sobre imóveis. Nesse contexto, selecionamos o SOLA - Solutions for Open Land Administration como referencial teórico-prático para o desenvolvimento da solução, além das tecnologias de georreferenciamento e blockchain. O blockchain foi escolhido especialmente com o objetivo de superar as limitações identificadas nos processos do SOLA, a fim de garantir uma maior transparência, confiabilidade e segurança nos processos relacionados à administração do patrimônio público.

Sendo assim, o  projeto desenvolveu uma solução, que denominaremos GeoReg, definida como uma aplicação baseada em blockchain e georreferenciamento para gerar, registrar, organizar e acessar os dados dos imóveis do patrimônio da União. Para testar se o GeoReg cumpre seu objetivo, foi realizada uma prova de conceito, que analisou se era possível cadastrar imóveis georreferenciados em blockchain e validar se existe ou não sobreposição de registros. Para desenvolver o GeoReg foram utilizados o blockchain Celo e o S2 Geometry, uma tecnologia de geração de dados georreferenciados já utilizada pelo mercado.


Demonstração
============
Uma demonstração deste projeto poderá ser acessando em https://v2tutq-3000.preview.csb.app/

Configuração
============
O GeoReg é uma prova de conceito com o objetivo de demonstrar a capacidade de armazenamento e validação de dados georeferenciados em blockchain. Ele é composto por 3 componentes:

1. Os contratos inteligentes escritos em Solidity, utilizando os frameworks OpenZepplin e Truffle
1. Uma aplicação frontend web desenvovida em React que permite realizar o geoereferenciamento e visualizar a geração das células S2, como também visualizar as áreas registradas no blockchain e realizar o registro da área demarcada.
1. Uma aplicação backend em Node.js e Express para realizar o interfaceamento com as bibliotecas de georeferenciamento do S2 e realizar as necessárias conversões de dados.

Para executar o sistema:

Clone esse repositório. 
``` 
git clone https://github.com/felipe-louzas/georeg-hackathon-web3.git
```

Os contratos foram desenvovidos utilizando o [truffle framework](https://www.trufflesuite.com/), portanto verifique as configurações em `blockchain/truffle-config.js` antes de continuar.

Se você ainda não possui um ambiente de desenvolvimento configurado :

```
npm install -g ganache-cli
npm install -g truffle
```

Inicie uma simulação de blockchain ethereum :

```
ganche-cli
```

Todas as dependencias do projeto podem ser gerenciadas pelo yarn.

```
yarn install
```

Após a instalação das dependencias, realiza a migração dos constratos para sua EVM local
```
cd blockchain
truffle migrate --reset --network develop
```

Para iniciar o backend e o servidor de desenvolvimento do React, pode-se executar a partir da pasta raiz do projeto
```
yarn start
```


## Detalhes técnicos de implementação

Foram avaliadas 4 implementações de DGGS (Discrete Global Grid Systems) para determinar a melhor forma de armazenar os dados de georeferênciamento no blockchain
 - [Geohash](https://en.wikipedia.org/wiki/Geohash)
 - [H3](https://eng.uber.com/h3/) desenvolvido pelo Uber
 - [S2](https://s2geometry.io/) utilizada pelo Google no Google Maps
 - [Bing Tiles](https://docs.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system) desenvolvido pela Microsoft.
 
Apesar da dificuldade de encontrar bibliotecas para a implementação do S2, ela foi a implementação escolhida para este projeto por ser a única baseada em uma projeção esférica, e por isso não possui distorções como as outras. Além disso, por ser um sistema hierárquico, onde as células de resoluções menores são completamente contidas dentro da área das celulas de resoluções maiores, diferente, por exemplo da H3, isso facilitou as rotinas de verificação de sobreposição de áreas. A possibilidade de utilizar células de múltiplas resoluções com precisão máxima de até alguns cm², a depender da área sendo mapeada, também foi fator determinante na escolha desta implementaão.

Os dados georeferenciados foram armazenados no blockchain utilizando uma estrutura de árvore de mapeamentos, o que permite validar sobreposição e inclusão praticamente em tempo constante, em troca de um processo de registro um pouco mais oneroso, onde todos os nós da raiz até o nó de registro são atualizados.

Os contratos inteligêntes foram implementados na rede Alfajores de testes da Celo, um blockchain compatível com EVM. O contrato principal está disponível no endereço [0xE6dE4daff89851E371506ee49148e55a2D1266F9](https://alfajores.celoscan.io/address/0xe6de4daff89851e371506ee49148e55a2d1266f9).

Referências Adicionais
============
## Georeferenciamento no blockchain
- [FOAM Space Public Research](https://github.com/f-o-a-m/public-research)
- [DeLA : Decentralized Land Administration](https://github.com/enlight-me/decentralized-land-admin)
- [Decentralised Location-Based Reputation Management System in IoT using Blockchain](https://github.com/GeoTecINIT/uji_mt-contracts)
- [dPoL: A Peer-to-Peer Digital Location System](https://medium.com/@kierstenJ/dpol-a-peer-to-peer-digital-location-system-af623f4e0a10)
- [Platin Proof of Location on the Blockchain](https://youtu.be/Wx2cCUYbQuE)
- [How to Enable a Smart Contract to Get Real-World Location Data](https://www.howtotoken.com/for-developers/enable-a-smart-contract-to-get-real-world-location-data/)
- [XYO Network : An open, secure crypto-location oracle network](https://github.com/XYOracleNetwork)

## Administração de imóveis nacionais
- [UN FAO - Solutions for Open Land Administration (SOLA) & Open Tenure Using open-source software to help protect tenure rights](http://www.fao.org/3/a-i5480e.pdf)
- [Solutions for Open Land Administration (SOLA-FAO)](https://github.com/SOLA-FAO/) 
- [UN FAO Open Tenure  project](https://github.com/OpenTenure)
- [Open Land Data in the Fight Against Corruption - Discussion Report - landportal.org](https://landportal.org/file/47749/download)
- [CADASTA-ESRI | Fit-for-Purpose Land Administration with LADM](https://www.youtube.com/watch?v=6QjH4vdtlrU) 
