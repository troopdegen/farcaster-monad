# Confirmar Intercambio

En esta lección, configuraremos el ConfirmSwapButton donde los usuarios pueden obtener una cotización firme y finalmente realizar su orden.

![](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/dd535749-cdba-4cd2-a843-436e643d6f15)

## ¿Qué es?

Después de que el usuario haya hecho su selección de tokens, ingresado el `sellAmount`, y aprobado el permiso del token, les mostraremos el componente ConfirmSwapButton.

Junto al `ConfirmSwapButton`, en nuestro componente padre, `SwapErc20Modal`, proporcionaremos a nuestros usuarios una vista general de los detalles de la transacción antes de ejecutar el intercambio de tokens. Anteriormente, proporcionamos a los usuarios un precio indicativo porque solo estaban navegando por información de precios, así que no necesitaban una orden completa de 0x. Ahora, los usuarios están listos para completar la orden, así que necesitamos proporcionarles una cotización firme, y los Market Makers pueden saber reservar los activos adecuados para liquidar el intercambio.

## Recorrido de UI/UX

La UI para el `SwapErc20Modal` debe ser la siguiente:

- Muestra las **cantidades de venta** y **compra** que el usuario paga y recibe, respectivamente
  - La UI muestra las cantidades de venta y compra devueltas por el endpoint `/quote`. Estas se formatean basándose en los valores decimales de la lista de tokens. También muestra las imágenes de tokens recuperadas de nuestra lista de tokens.
- Desde aquí, el usuario puede **"Realizar Orden"** que crea, firma y envía una nueva transacción a la red.
- La UI debe manejar la lógica para renderizar ya sea el `ApproveOrReviewButton` o el `ConfirmSwapButton`

## Código

¡Vamos a codificarlo! A alto nivel, esto es lo que necesitaremos codificar:

- Crear un componente `ConfirmSwapButton`
- Obtener una cotización firme
- Enviar la transacción (usando los pasos de [la guía Send Transaction de wagmi](https://wagmi.sh/react/guides/send-transaction))

### 1. Crear un nuevo componente y conectarlo

Crear un nuevo componente `ConfirmSwapButton` que recibirá los datos de cotización, obtenidos cuando el usuario hace clic en el botón "Revisar Intercambio", indicando que están listos para confirmar y enviar la transacción.

También necesitamos un par de imports adicionales.

```typescript
// componentes previos (SwapErc20Modal, ApproveOrReviewButton)
function ConfirmSwapButton({
  userAddress,
  price,
  quote,
  setQuote,
  setFinalize,
}: {
  userAddress: Address | undefined;
  price: PriceResponse;
  quote: QuoteResponse | undefined;
  setQuote: (price: any) => void;
  setFinalize: (value: boolean) => void;
}) {
  const { signTypedDataAsync } = useSignTypedData();
  const { data: walletClient } = useWalletClient();

  // Obtener datos de cotización
  useEffect(() => {
    const params = {
      chainId: 10143, // Monad Testnet
      sellToken: price.sellToken,
      buyToken: price.buyToken,
      sellAmount: price.sellAmount,
      taker: userAddress,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: price.buyToken,
      tradeSurplusRecipient: FEE_RECIPIENT,
    };

    async function main() {
      const response = await fetch(`/api/quote?${qs.stringify(params)}`);
      const data = await response.json();
      console.log('Datos de cotización:', data);
      setQuote(data);
    }
    main();
  }, [
    price.sellToken,
    price.buyToken,
    price.sellAmount,
    userAddress,
    setQuote,
  ]);

  const { data: hash, isPending, sendTransaction } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  if (!quote) {
    return <div>Obteniendo mejor cotización...</div>;
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Button
        variant="ghost"
        onClick={(event) => {
          event.preventDefault();
          setFinalize(false);
        }}
      >
        Modificar intercambio
      </Button>
      <Button
        disabled={isPending}
        onClick={async (event) => {
          event.preventDefault();

          console.log('enviando cotización a blockchain');
          console.log('to', quote.transaction.to);
          console.log('value', quote.transaction.value);

          // Al hacer clic, (1) Firmar el mensaje Permit2 EIP-712 devuelto de quote
          if (quote.permit2?.eip712) {
            let signature: Hex | undefined;
            try {
              signature = await signTypedDataAsync(quote.permit2.eip712);
              console.log('Firmado mensaje permit2 de respuesta de cotización');
            } catch (error) {
              console.error('Error firmando permit2:', error);
              return;
            }

            // (2) Append signature length and signature data to calldata
            if (signature && quote.transaction.data) {
              const signatureLengthInHex = numberToHex(size(signature), {
                signed: false,
                size: 32,
              });

              const transactionData = concat([
                quote.transaction.data as Hex,
                signatureLengthInHex,
                signature,
              ]);

              // (3) Submit the transaction with Permit2 signature
              sendTransaction({
                to: quote.transaction.to,
                value: quote.transaction.value,
                data: transactionData,
                gas: quote.transaction.gas,
                gasPrice: quote.transaction.gasPrice,
              });
            }
          } else {
            // Standard transaction without Permit2
            sendTransaction({
              to: quote.transaction.to,
              value: quote.transaction.value,
              data: quote.transaction.data,
              gas: quote.transaction.gas,
              gasPrice: quote.transaction.gasPrice,
            });
          }
        }}
      >
        {isPending ? 'Confirmando...' : 'Confirmar Intercambio'}
      </Button>

      {hash && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Hash de transacción: {hash}
          </p>
          {isConfirming && <p>Esperando confirmación...</p>}
          {isConfirmed && <p>¡Intercambio completado exitosamente!</p>}
        </div>
      )}
    </div>
  );
}
```

### 2. Configurar Endpoint de API Quote

Necesitamos crear un endpoint de API para obtener cotizaciones firmes, similar a nuestro endpoint de precio pero para transacciones ejecutables.

`/app/api/quote/route.ts`

```typescript
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  try {
    // Para Monad testnet, podemos necesitar usar un proveedor de liquidez diferente
    // o implementar lógica de fallback
    const res = await fetch(
      `https://api.0x.org/swap/permit2/quote?${searchParams}`,
      {
        headers: {
          '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY as string,
          '0x-version': 'v2',
        },
      }
    )
    const data = await res.json()

    // Log para depuración en Monad testnet
    console.log('URL de API Quote 0x:', `https://api.0x.org/swap/permit2/quote?${searchParams}`)
    console.log('Respuesta de Quote 0x:', data)

    return Response.json(data)
  } catch (error) {
    console.error('Error de API Quote:', error)
    
    // Implementar lógica de fallback para Monad testnet
    return Response.json({ 
      error: 'Failed to fetch quote',
      fallback: 'Consider implementing Monad-specific DEX integration'
    }, { status: 500 })
  }
}
```

### 3. Integración con Monad Testnet

Para Monad testnet, necesitamos considerar adaptaciones específicas:

**Diferencias de Monad:**
- Chain ID: 10143 (no 137 como Polygon)
- Diferentes direcciones de contrato
- Posible soporte limitado de 0x API
- Diferentes patrones de gas y confirmación

**Estrategia de Implementación:**

```typescript
// Configuración específica de Monad
const MONAD_CONFIG = {
  chainId: 10143,
  permit2Address: '0x...', // Dirección específica de Monad si disponible
  exchangeProxy: '0x...', // Dirección del proxy de intercambio de Monad
  gasMultiplier: 1.2, // Multiplicador de gas para testnet
}

// Función auxiliar para manejar transacciones de Monad
const handleMonadTransaction = async (quote: QuoteResponse) => {
  // Lógica específica para Monad testnet
  // Puede incluir estimación de gas personalizada,
  // manejo de errores específico de testnet, etc.
}
```

## Estados de Transacción

El componente maneja varios estados:

1. **Cargando Cotización**: Mostrando "Obteniendo mejor cotización..."
2. **Listo para Confirmar**: Botón "Confirmar Intercambio" habilitado
3. **Pendiente**: Transacción enviada, esperando confirmación
4. **Confirmado**: Intercambio completado exitosamente
5. **Error**: Manejo de errores con mensajes informativos

## Mejores Prácticas para Monad

### Manejo de Errores:
- Implementar reintentos para inestabilidad de testnet
- Proporcionar mensajes de error claros específicos de Monad
- Fallback a estimación de gas local si la API falla

### Optimización de UX:
- Mostrar progreso de transacción paso a paso
- Proporcionar enlaces al explorador de bloques de Monad
- Implementar notificaciones de éxito/error

### Seguridad:
- Validar todos los datos de cotización antes del envío
- Implementar límites de slippage
- Verificar balances antes de la ejecución

## Resumen

En esta lección implementamos:

- ✅ Componente ConfirmSwapButton para ejecución de intercambios
- ✅ Integración de API quote con manejo de Monad testnet
- ✅ Lógica de firma Permit2 para aprobaciones eficientes
- ✅ Manejo completo de estados de transacción
- ✅ Adaptaciones específicas para Monad testnet

El sistema de intercambio está ahora completo, permitiendo a los usuarios:
1. Seleccionar tokens
2. Ver precios en tiempo real
3. Aprobar permisos de tokens
4. Ejecutar intercambios de forma segura
5. Rastrear el progreso de transacciones

¡Tu Farcaster Mini App ahora soporta intercambio completo de tokens en Monad testnet! 🎉