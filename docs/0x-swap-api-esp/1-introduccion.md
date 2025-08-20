# Intercambio de Tokens en Farcaster Mini Apps con Monad

## Introducción

¿Alguna vez te has preguntado cómo las aplicaciones de trading encuentran los mejores precios para intercambios de tokens a través de diferentes fuentes de liquidez? En este tutorial, construiremos la funcionalidad de intercambio de tokens en una Farcaster Mini App usando la blockchain de alto rendimiento compatible con EVM de Monad.

![Captura de pantalla de Matcha para intercambio de tokens](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/3b98c278-8132-46f1-9e9d-8c123ae6ae50)

_Captura de pantalla de [Matcha.xyz](https://matcha.xyz/), una dApp de trading que agrega liquidez_

El intercambio de tokens en las aplicaciones DeFi modernas está impulsado por [agregadores de liquidez](https://0x.org/post/what-is-a-dex-aggregator), que resuelven el problema crítico de la fragmentación de liquidez en el ecosistema descentralizado.

![Ecosistema DeFi: fragmentación de liquidez](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/23b06ab3-2df4-4d48-8b94-231294962cb3)

Los agregadores de liquidez obtienen precios a través de fuentes **off-chain** (Market Makers, Libros de órdenes) y **on-chain** (DEXs, AMMs) para **encontrar el mejor precio para los usuarios**. Es similar a cómo Google Flights agrega datos de aerolíneas para mostrar las mejores rutas.

En este tutorial, aprenderemos cómo integrar la **[API de Swap de 0x](https://0x.org/docs/0x-swap-api/introduction)** en una Farcaster Mini App ejecutándose en **Monad Testnet**. Adaptaremos la API de 0x para el entorno compatible con EVM de Monad mientras aprovechamos el contexto social de Farcaster y el SDK de Mini App.

![Ejemplo de modal de intercambio](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/4a7497c9-11d9-4758-86fc-f041d5f2c2dd)

![Diagrama del agregador de Swap API](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/6d6edabb-8314-43b6-a8e8-fdc79102d124)

La API de Swap de 0x impulsa intercambios en carteras principales como MetaMask, Coinbase wallet, y [muchas más](https://0x.org/docs/introduction/introduction-to-0x#the-0x-ecosystem). Aunque Monad testnet tiene soporte directo limitado de 0x, mostraremos cómo adaptar los patrones de API para nuevas cadenas EVM.

![Stack de Swap API](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/73aae476-cdbd-4105-8a57-84798a8900cc)

## Lo que aprenderás

Al final de este módulo, aprenderás lo siguiente:

- Entender la **Agregación de Liquidez** en el contexto de nuevas cadenas EVM
- Crear y gestionar **listas de tokens de Monad Testnet**
- Adaptar **patrones de API de Swap de 0x** para nuevas redes blockchain
- Manejar **Aprobaciones de Tokens** y **firmas Permit2**
- Construir una **Farcaster Mini App** con funcionalidad de intercambio
- Integrar la **cadena Monad** con wagmi y el SDK de Farcaster

## Lo que construirás

Construiremos una interfaz completa de intercambio de tokens integrada en una Farcaster Mini App en Monad Testnet. La interfaz incluye selección de tokens, precios en tiempo real (con cálculos de respaldo), manejo de aprobaciones y ejecución de transacciones.

**Características Clave:**
- 🔄 Intercambio de tokens con 5+ tokens de Monad testnet
- 💰 Obtención de precios en tiempo real con respaldos de API
- 🔗 Cambio y validación de cadena
- 📱 Interfaz de Farcaster Mini App optimizada para móvil
- 🔐 Aprobaciones seguras de tokens usando Permit2
- ⚡ Transacciones de alto rendimiento en Monad

## Pre-requisitos

Antes de sumergirte en este tutorial, asegúrate de tener familiaridad con:

**Tecnologías Principales:**
- [React](https://react.dev/) y [Next.js 14](https://nextjs.org/)
- [wagmi v2](https://wagmi.sh/) y [viem](https://viem.sh/)
- [SDK de Farcaster Mini App](https://docs.farcaster.xyz/developers/frames/v2/mini-apps)

**Conocimiento de Blockchain:**
- Blockchains compatibles con EVM
- Tokens ERC20 y aprobaciones
- Conceptos de DEX e intercambio de tokens

Construiremos en **[Monad Testnet](https://docs.monad.xyz/)** (Chain ID: 10143), una blockchain L1 compatible con EVM de alto rendimiento diseñada para velocidad y eficiencia.

¡Comencemos!