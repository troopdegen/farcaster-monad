# Obtener Precio para Intercambios en Monad Testnet

¡Ahora la parte emocionante! Implementemos la obtención de precios en tiempo real para nuestros tokens de Monad testnet usando el patrón de la [API de Swap de 0x](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice), adaptado para nuevas cadenas EVM 🚀

Nuestro objetivo es mostrar dinámicamente la cantidad de buyToken cuando los usuarios ingresen una cantidad de sellToken, proporcionando retroalimentación de precios en tiempo real en nuestra Farcaster Mini App.

![Modal mostrando un intercambio de WMATIC a USDC](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/5285ebcb-36c7-4a0b-ae20-7256d1c79a49)

## Precio vs Cotización

Antes de hacer una llamada, discutamos la diferencia entre _precio vs cotización_.

El endpoint [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) nos ayuda a obtener un _precio indicativo_.

Un precio indicativo se usa cuando los usuarios solo están _navegando_ y quieren verificar el precio que podrían recibir en un intercambio. Aún no están listos para una cotización firme.

Más tarde, cuando el usuario esté realmente listo para hacer un intercambio, llamaremos a [`/swap/permit2/quote`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getQuote) que devuelve una orden lista para ser enviada on-chain.

`/price` es casi idéntico a `/quote`, pero con algunas diferencias clave:

- `/price` no devuelve una orden que pueda enviarse on-chain; simplemente nos proporciona la misma información
- Piensa en él como la versión "solo lectura" de `/quote`

¡Es importante llamar a `/quote` solo cuando el usuario esté listo para enviar la orden porque los Market Makers deben comprometer sus activos para liquidar ese intercambio cuando proporcionan la cotización! Si llamamos a `/quote` demasiado cuando realmente solo estamos pidiendo un precio y no estamos listos para enviar una orden, ¡esto puede congestionar el sistema!

## Estrategia de Precios para Monad Testnet

Para cadenas nuevas como Monad Testnet, necesitamos un enfoque híbrido ya que el soporte directo de la API de 0x puede ser limitado:

### Nuestra Estrategia de Precios Multi-Capa:

1. **Primaria**: API de 0x con parámetros de Monad testnet
2. **Respaldo**: Calcular precio desde datos disponibles de buyAmount/sellAmount
3. **Manejo de Errores**: Degradación elegante con retroalimentación al usuario

### Lo que necesitamos implementar:

- Envolver el endpoint `/swap/permit2/price` detrás de nuestra ruta API de Next.js
- Manejar parámetros específicos de Monad testnet (Chain ID: 10143)
- Implementar cálculo de precio de respaldo cuando las respuestas de API están incompletas
- Formatear cantidades tanto para consumo de API como para visualización legible
- Auto-obtener precios cuando cambien las entradas

### Obtener una Clave API de 0x

Cada llamada a la API de 0x requiere una clave API. [Crea una cuenta de 0x](https://dashboard.0x.org/) y obtén tu clave API desde el [panel de control](https://dashboard.0x.org/).

Agrega tu clave API a `.env.local`:
```bash
NEXT_PUBLIC_ZEROEX_API_KEY=tu_clave_api_aqui
```

### Entendiendo el Manejo de Respuesta de Precio

Nuestro `SwapErc20Modal` muestra precios indicativos a usuarios navegando opciones de intercambio. Como Monad testnet tiene soporte limitado de 0x, hemos implementado lógica de respaldo robusta:

**Cuando la API de 0x devuelve datos completos:**
- Usar el campo `price` directamente

**Cuando la API de 0x devuelve datos parciales:**
- Calcular precio unitario desde `buyAmount` y `sellAmount`
- Mostrar tasa de cambio calculada a usuarios

Esto asegura visualización consistente de precios independientemente de la completitud de la respuesta de API.

## Obtener precio desde PriceView

En la lección anterior, vimos cómo obtener un precio usando `/swap/permit2/price`. Ahora necesitamos conectarlo a la UI.

### Paso 1. Crear Ruta API Protegida

Envolvemos nuestras llamadas a la API de 0x detrás de una ruta API de Next.js para proteger nuestras claves API y manejar parámetros específicos de Monad.

**¿Por qué envolver?** Las solicitudes del navegador exponen las claves API, pero las rutas del lado del servidor las mantienen seguras. Nuestro frontend llama a `/api/price`, que luego llama a la API de 0x con credenciales protegidas.

`/app/api/price/route.ts`

```typescript
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  try {
    const res = await fetch(
      `https://api.0x.org/swap/permit2/price?${searchParams}`,
      {
        headers: {
          '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY as string,
          '0x-version': 'v2',
        },
      }
    )
    const data = await res.json()

    console.log('URL de API 0x:', `https://api.0x.org/swap/permit2/price?${searchParams}`)
    console.log('Respuesta de API 0x:', data)

    return Response.json(data)
  } catch (error) {
    console.error('Error de API de Precio:', error)
    return Response.json({ error: 'Fallo al obtener precio' }, { status: 500 })
  }
}
```

**Características Clave:**
- Manejo seguro de clave API vía variables de entorno
- Manejo de errores con códigos de estado HTTP apropiados
- Registro para depuración de integración con Monad testnet
- Paso directo de parámetros de búsqueda a la API de 0x

### Paso 2. Obtener precio automáticamente con hook useEffect

Ahora necesitamos conectarlo al front-end y activar un cambio de precio cada vez que se actualice el sellAmount.

En `SwapErc20Modal`, usamos el patrón de obtención de datos incorporado del App Router de Next.js y el hook useEffect para obtener un precio y actualizar automáticamente la UI rápidamente para responder a cualquier cambio, como cuando el usuario ingresa un nuevo sellAmount.

Una visión general de las actualizaciones necesarias para nuestro componente `SwapErc20Modal`:

- Instalar el paquete `qs` vía `npm i qs`
- Instalar tipos de qs vía `npm i --save-dev @types/qs`
- Crear un archivo donde crearemos nuestros tipos de respuesta de API: `types/index.ts`
- Importar dependencias:
  - librería `qs` e interfaz `PriceResponse`
  - hook useChainId de wagmi para detectar la red conectada actual del usuario
  - `formatUnits` y `parseUnits`, un par de utilidades de Viem
- Un par de nuevas variables de estado para manejar la dirección del intercambio y la respuesta de Precio
- Funciones para manejar los datos de tokens seleccionados, junto con el análisis de los tokens

Para la llamada API, le pedimos a useEffect que monitoree una lista de parámetros (sellToken, buyToken, etc), y si alguno de estos parámetros cambia de valor, entonces se ejecuta la función main(). En esta función, obtenemos un nuevo /price con los valores de parámetros actualizados.

## Mejorando la UX

Como el endpoint de API que estamos usando solo soporta ciertas cadenas, necesitamos asegurarnos de que el usuario esté conectado a la cadena correcta. De lo contrario, tendremos problemas para obtener los datos correctos y no podremos enviar los datos de transacción correctos para ejecutar el intercambio.

Podemos lograr esto creando un componente `SwitchChainModal` que se mostrará SI el usuario NO está conectado a la cadena Monad (id: 10143). SI el usuario ESTÁ conectado, mostramos el `SwapErc20Modal`.

## Resumen

Obtener [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) está envuelto detrás de `app/api/price/route.ts` y activado en la UI por `useEffect` en nuestro componente de intercambio.

Tu aplicación ahora debería verse así:

![Modal mostrando precios de tokens obtenidos de API y formateados correctamente](https://react-to-web3-bootcamp.vercel.app/content/module-4/L3/1-swap-modal-price.png)