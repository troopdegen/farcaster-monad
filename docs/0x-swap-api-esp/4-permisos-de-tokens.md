# Establecer Permisos de Token y Verificar Balance Suficiente

¡Ahora podemos obtener un precio en vivo, incluso si la cartera del usuario no está conectada!

Ahora, antes de que podamos permitir que los usuarios llamen a `/quote` y realicen el intercambio, necesitaremos que el usuario conecte su cartera y apruebe un permiso de token.

Un permiso de token es requerido si quieres que un tercero mueva fondos en tu nombre. En resumen, les estás _permitiendo_ mover tus tokens.

En nuestro caso, queremos aprobar un permiso para que el contrato Permit2 intercambie nuestros tokens ERC20 por nosotros. Para hacer esto, necesitamos aprobar un permiso específico, permitiendo que este contrato mueva una cierta cantidad de nuestros tokens ERC20 en nuestro nombre. Lee más sobre [permisos de tokens](https://0x.org/docs/0x-swap-api/advanced-topics/how-to-set-your-token-allowances)

Esta aprobación de permiso aparecerá en la cartera del usuario para que la firme. Aquí hay un ejemplo de captura de pantalla de MetaMask:

![Extensión de navegador de cartera pidiendo confirmación de transacción de aprobación](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/9743b971-a8bc-4269-8b11-77ee2c64b609)

La lógica para verificar si el usuario ha aprobado un permiso de token para el token de venta seleccionado está configurada [aquí](https://github.com/dablclub/etherstart/blob/main/next-app/src/components/swapErc20Modal.tsx):

1. Primero, necesitamos verificar si el gastador (Permit2) ya tiene un permiso. Podemos usar el hook useReadContract() de wagmi para leer desde la función "allowance" del sellToken.
2. Si no hay permiso, entonces escribiremos una aprobación al contrato inteligente del sellToken usando useSimulateContract() y useWriteContract() de wagmi.
3. Por último, usar useWaitForTransactionReceipt() de wagmi para esperar a que se complete la transacción de aprobación

Ten en cuenta que aprobar un permiso es una transacción, que requiere que los usuarios paguen gas (ej. el usuario debe tener el token nativo de la cadena, MON en Monad).

¿Necesitas revocar rápidamente un permiso mientras pruebas? Para revocar un permiso, puedes establecer el permiso en 0. Esto se puede hacer programáticamente o a través de una UI como https://revoke.cash/.

## Aquí está la UI que necesitamos configurar:

- El usuario selecciona **tokens de venta** y **compra** de los selectores de tokens
- Los usuarios ingresan un **sellAmount**
- Cada vez que cambia sellAmount, **la aplicación obtiene un precio** incluso si una cartera no está conectada
- Muestra el **buyAmount** devuelto
- Cuando los usuarios encuentran un precio que les gusta, el botón ahora dice **Aprobar** si el usuario tiene suficiente del token de venta
  - El botón de Aprobación permite a los usuarios establecer un permiso de token
  - Esta es práctica estándar cuando los usuarios necesitan dar un permiso de token para que un tercero mueva fondos en nuestro nombre, en este caso el contrato inteligente del Protocolo 0x, específicamente el 0x Exchange Proxy para intercambiar los tokens ERC20 del usuario en su nombre.
  - Los usuarios pueden establecer una cantidad con la que se sientan cómodos, el valor por defecto que hemos establecido es el `sellAmount`
- Cuando el usuario está contento con este intercambio, el botón ahora es **"Revisar Intercambio"** porque el usuario ya aprobó el permiso de token, así que pueden avanzar para revisar la cotización firme

Para resumir,

![](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/05346bc2-8bae-4219-aa7b-18f6195cf246)

_La cartera conectada no ha aprobado un permiso de token para DAI -> el botón dice "Aprobar"_

![](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/adae9e12-5b93-45c5-965f-1048ec4c466d)

_La cartera conectada ya aprobó un permiso de token para WMATIC y tiene suficiente balance para proceder -> el botón dice "Revisar Intercambio"_

![](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/9f601765-5acd-4773-8f5d-caa3337ce6f3)

_La cartera conectada ya aprobó un permiso de token para WMATIC, pero no tiene suficiente balance para proceder -> el botón dice "Balance Insuficiente"_

## Código

```typescript
// ...imports previos
// actualizar imports de wagmi y viem
import {
  useBalance,
  useChainId,
  useReadContract,
  useSendTransaction,
  useSignTypedData,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi';
import {
  Address,
  concat,
  erc20Abi,
  formatUnits,
  Hex,
  numberToHex,
  parseUnits,
  size,
} from 'viem';

// actualizar import de constantes
import {
  AFFILIATE_FEE,
  FEE_RECIPIENT,
  MAX_ALLOWANCE,
  MONAD_TESTNET_TOKENS,
  MONAD_TESTNET_TOKENS_BY_SYMBOL,
  Token,
} from '@/lib/constants';
```

## Lógica de Aprobación para Monad Testnet

Para Monad testnet, implementamos una lógica de aprobación robusta que maneja los casos específicos de una nueva cadena EVM:

### Pasos de Aprobación:

1. **Verificar Balance**: Asegurarse de que el usuario tiene suficientes tokens para el intercambio
2. **Leer Permiso Actual**: Usar `useReadContract` para verificar el permiso existente
3. **Calcular Permiso Requerido**: Determinar si necesitamos aprobación adicional
4. **Ejecutar Aprobación**: Usar `useWriteContract` para aprobar tokens
5. **Esperar Confirmación**: Usar `useWaitForTransactionReceipt` para confirmación

### Consideraciones Específicas de Monad:

- **Dirección Permit2**: Configurar la dirección correcta del contrato Permit2 para Monad
- **Estimación de Gas**: Monad puede tener diferentes patrones de gas que Ethereum
- **Confirmación de Bloque**: Tiempos de confirmación más rápidos en Monad
- **Manejo de Errores**: Errores específicos de testnet y recuperación

```typescript
// Ejemplo de lógica de aprobación para Monad
export default function SwapErc20Modal({ userAddress }: SwapErc20ModalProps) {
  // Estados para manejo de aprobación
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // Hook para leer el permiso actual
  const { data: currentAllowance } = useReadContract({
    address: sellTokenObject.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, PERMIT2_ADDRESS], // Dirección específica de Monad
    query: { enabled: !!userAddress },
  })

  // Hook para escribir aprobación
  const { writeContract: approveToken, data: approveHash } = useWriteContract()

  // Esperar confirmación de aprobación
  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Función para manejar aprobación
  const handleApprove = async () => {
    if (!userAddress || !sellTokenObject) return
    
    try {
      setIsApproving(true)
      await approveToken({
        address: sellTokenObject.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PERMIT2_ADDRESS, parseUnits(sellAmount, sellTokenObject.decimals)],
      })
    } catch (error) {
      console.error('Error de aprobación:', error)
      setIsApproving(false)
    }
  }

  // Lógica para determinar el estado del botón
  const getButtonState = () => {
    if (insufficientBalance) return { text: 'Balance Insuficiente', disabled: true }
    if (needsApproval) return { text: 'Aprobar Tokens', disabled: false }
    if (isApproving || isApprovePending) return { text: 'Aprobando...', disabled: true }
    return { text: 'Revisar Intercambio', disabled: false }
  }

  return (
    <Dialog>
      <DialogTrigger asChild className="w-full">
        <Button>Intercambiar ERC20</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Intercambiar ERC20</DialogTitle>
          <DialogDescription>
            La cantidad ingresada será intercambiada por la cantidad de tokens
            mostrada en la segunda fila
          </DialogDescription>
        </DialogHeader>
        
        {/* UI de intercambio */}
        <div className="space-y-4">
          {/* Campos de entrada de tokens */}
          
          {/* Botón de acción dinámico */}
          <Button 
            onClick={needsApproval ? handleApprove : handleSwap}
            disabled={getButtonState().disabled}
            className="w-full"
          >
            {getButtonState().text}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Mejores Prácticas para Permisos en Monad

### Seguridad:
- Nunca apruebes más tokens de los necesarios
- Considera usar permisos con límite de tiempo cuando sea posible
- Implementa verificaciones de balance antes de las aprobaciones

### UX:
- Muestra claramente qué tokens están siendo aprobados
- Proporciona retroalimentación de progreso durante las aprobaciones
- Explica por qué se necesitan las aprobaciones

### Eficiencia:
- Reutiliza permisos existentes cuando sea posible
- Implementa lógica de almacenamiento en caché para verificaciones de permisos
- Optimiza las llamadas de gas para transacciones de Monad

## Resumen

En esta lección implementamos:

- ✅ Verificación de permisos de tokens usando wagmi
- ✅ Lógica de aprobación para Monad testnet
- ✅ Verificación de balance de usuario
- ✅ Estados dinámicos de botón basados en permisos
- ✅ Manejo robusto de errores para operaciones de testnet

El sistema de permisos está ahora listo para soportar intercambios seguros en Monad testnet, con degradación elegante para diversos estados de cartera y red.