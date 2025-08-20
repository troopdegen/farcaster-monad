# Crear y Gestionar Listas de Tokens de Monad Testnet

Nuestra Farcaster Mini App presenta menús desplegables de selección de tokens tanto para _sellToken_ como para _buyToken_ en la interfaz de intercambio.

![Campo de selección mostrando tokens disponibles para intercambiar](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/1b3f00c2-ba1c-474c-b437-e0e8e2818718)

Para cadenas establecidas, podemos aprovechar [Listas de Tokens](https://tokenlists.org/) curadas que estandarizan los metadatos de tokens ERC20 para filtrar tokens legítimos de estafas y duplicados. Sin embargo, para cadenas nuevas como Monad Testnet, necesitamos crear nuestras propias listas de tokens curadas.

Dado que Monad Testnet es una cadena más nueva, crearemos una lista de tokens personalizada con tokens cuidadosamente seleccionados para nuestra funcionalidad de intercambio. Este enfoque nos da control total sobre los tokens soportados y asegura una experiencia de usuario de alta calidad.

Aprendamos cómo crear y gestionar una lista de tokens para tokens de Monad Testnet en nuestra Farcaster Mini App.

## Código

En nuestra implementación, hemos creado una lista de tokens curada específicamente para Monad Testnet en [`/lib/tokens.ts`](../../lib/tokens.ts).

> **Mejor Práctica de Producción:** Mantener una lista de tokens curada es estándar para aplicaciones de producción ya que no todas las aplicaciones soportan todos los tokens disponibles.

> **Soporte Multi-cadena:** Aunque nos enfocamos en Monad Testnet, este patrón puede extenderse fácilmente para soporte multi-cadena.

Nuestra interfaz de token incluye metadatos esenciales:

```typescript
// lib/tokens.ts - Interfaz de Token
export interface Token {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}
```

## Configuración de Tokens de Monad Testnet

Nuestros tokens están organizados en el array `MONAD_TESTNET_TOKENS` y se hacen accesibles a través de objetos de búsqueda optimizados:

```typescript
// Patrones de acceso eficientes
export const MONAD_TESTNET_TOKENS_BY_SYMBOL: Record<string, Token>
export const MONAD_TESTNET_TOKENS_BY_ADDRESS: Record<string, Token>

// Funciones auxiliares
export function getTokenBySymbol(symbol: string): Token | undefined
export function getTokenByAddress(address: string): Token | undefined
```

**Lista Actual de Tokens de Monad Testnet:**
- **WMON** (Wrapped Monad) - `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- **WETH** (Wrapped Ether) - `0xB5a30b0FDc42e3E9760Cb8449Fb37`
- **WBTC** (Wrapped Bitcoin) - `0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d`
- **USDC** (USD Coin) - `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`
- **LINK** (ChainLink) - `0x6C6A73cb3549c8480F08420EE2e5DFaf9d2D4CDb`

Las listas de tokens se integran en nuestro componente de intercambio a través del componente Select de shadcn/ui:

```typescript
// components/swap/swap-erc20-modal.tsx - Vista simplificada
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MONAD_TESTNET_TOKENS,
  MONAD_TESTNET_TOKENS_BY_SYMBOL,
  Token,
  DEFAULT_SELL_TOKEN,
  DEFAULT_BUY_TOKEN,
} from '@/lib/tokens'

type SwapErc20ModalProps = {
  userAddress: `0x${string}` | undefined
}

export default function SwapErc20Modal({ userAddress }: SwapErc20ModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [sellToken, setSellToken] = useState(DEFAULT_SELL_TOKEN.toLowerCase())
  const [sellAmount, setSellAmount] = useState('')
  const [buyToken, setBuyToken] = useState(DEFAULT_BUY_TOKEN.toLowerCase())
  const [buyAmount, setBuyAmount] = useState('')

  // Obtener objetos de token de nuestra lista de tokens de Monad
  const sellTokenObject = MONAD_TESTNET_TOKENS_BY_SYMBOL[sellToken]
  const buyTokenObject = MONAD_TESTNET_TOKENS_BY_SYMBOL[buyToken]

  const handleSellTokenChange = (value: string) => {
    setSellToken(value)
  }

  const handleBuyTokenChange = (value: string) => {
    setBuyToken(value)
  }

  const handleSwap = (event: React.FormEvent) => {
    event?.preventDefault()
    console.log('La funcionalidad de intercambio se implementará a continuación')
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Intercambiar Tokens
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Intercambio de Tokens en Monad</DialogTitle>
          <DialogDescription>
            Intercambia tokens en Monad Testnet con precios en tiempo real
          </DialogDescription>
        </DialogHeader>
        {isMounted ? (
          <div className="space-y-4">
            {/* Selección de Token de Venta */}
            <div className="flex items-center space-x-2">
              <Image
                alt={sellTokenObject.symbol}
                className="h-8 w-8 rounded-md"
                src={sellTokenObject.logoURI}
                width={32}
                height={32}
              />
              <Select onValueChange={handleSellTokenChange} defaultValue={DEFAULT_SELL_TOKEN.toLowerCase()}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONAD_TESTNET_TOKENS.map((token: Token) => (
                    <SelectItem key={token.address} value={token.symbol.toLowerCase()}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Selección de Token de Compra */}
            <div className="flex items-center space-x-2">
              <Image
                alt={buyTokenObject.symbol}
                className="h-8 w-8 rounded-md"
                src={buyTokenObject.logoURI}
                width={32}
                height={32}
              />
              <Select onValueChange={handleBuyTokenChange} defaultValue={DEFAULT_BUY_TOKEN.toLowerCase()}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONAD_TESTNET_TOKENS.map((token: Token) => (
                    <SelectItem key={token.address} value={token.symbol.toLowerCase()}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                disabled
                className="flex-1"
              />
            </div>

            <Button onClick={handleSwap} className="w-full">
              Intercambiar Tokens
            </Button>
          </div>
        ) : (
          <p>Cargando...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Revisión del Código:**
- Importar constantes de tokens específicas de Monad desde nuestro `lib/tokens.ts`
- Usar `DEFAULT_SELL_TOKEN` y `DEFAULT_BUY_TOKEN` para el estado inicial
- Mapear a través de `MONAD_TESTNET_TOKENS` para las opciones del menú desplegable
- Mostrar logos de tokens usando el `logoURI` de nuestros metadatos de token
- Configurar gestión de estado para cantidades de intercambio y tokens seleccionados

## Mejores Prácticas de Listas de Tokens para Nuevas Cadenas

Al construir para cadenas más nuevas como Monad, considera estos enfoques:

**1. Listas Curadas (Nuestro Enfoque):**
- Control total sobre tokens soportados
- Asegura experiencia de usuario de alta calidad
- Más fácil de mantener para conjuntos de tokens más pequeños

**2. Listas Impulsadas por API:**
- Descubrimiento dinámico de tokens
- Actualizaciones automáticas para nuevos tokens
- Requiere proveedores de datos de tokens confiables

**3. Enfoque Híbrido:**
- Comenzar con lista curada
- Agregar gradualmente integración con API
- Volver a tokens curados si la API falla

## Agregar Nuevos Tokens a la Lista de Monad

Para agregar un nuevo token a nuestra lista de Monad testnet, necesitarás:

```typescript
// Ejemplo: Agregando un nuevo token DEX
{
  chainId: 10143,
  name: "MonadSwap Token",
  symbol: "MSWAP",
  decimals: 18,
  address: "0x..." // Dirección del contrato en Monad testnet
  logoURI: "https://..." // URL del logo del token
}
```

Agrégalo al array `MONAD_TESTNET_TOKENS` en `/lib/tokens.ts`, y estará automáticamente disponible en todos los objetos de búsqueda y componentes de UI.

## Fuentes Futuras de Tokens para Monad

A medida que el ecosistema de Monad crece, posibles fuentes de listas de tokens:

- **Fundación Monad** - Registros oficiales de tokens
- **Protocolos DeFi** - Listas de tokens específicas de DEX
- **Listas Comunitarias** - Registros mantenidos por la comunidad
- **Protocolos de Puente** - Mapeos de tokens cross-chain

## Resumen

En esta lección, creamos un sistema integral de gestión de tokens para Monad Testnet:

- ✅ Definimos interfaz de token estandarizada
- ✅ Creamos lista curada de tokens de Monad testnet
- ✅ Construimos sistemas de búsqueda eficientes
- ✅ Integramos tokens en componentes de UI de intercambio
- ✅ Establecimos patrones para agregar nuevos tokens

![Modal final mostrando los tokens disponibles para intercambiar](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/a5992263-0839-4ed0-9132-75d7b741aac8)