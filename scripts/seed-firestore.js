/**
 * seed-firestore.js
 * ──────────────────────────────────────────────────────────────────
 * Inicializa Firestore con toda la configuración real del bot Vicky:
 *   • config/general    → delays, modelo, flags
 *   • config/prompts    → SYSTEM_PROMPT completo + prompt admin
 *   • servicios/{id}    → precios reales de cada servicio
 *
 * USO:
 *   node scripts/seed-firestore.js
 *
 * Requiere .env.local con las credenciales de Firebase Admin.
 * Si un documento ya existe, lo ACTUALIZA (no sobreescribe clientes ni chats).
 * ──────────────────────────────────────────────────────────────────
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables de entorno en .env.local')
    console.error('   Necesitás: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY')
    process.exit(1)
  }

  const admin = require('firebase-admin')
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
  }
  const db = admin.firestore()
  const FieldValue = admin.firestore.FieldValue

  console.log('\n🌱 Iniciando seed de Firestore para Gardens Wood...\n')

  // ──────────────────────────────────────────────────────────────
  // 1. CONFIG GENERAL
  // ──────────────────────────────────────────────────────────────
  await db.collection('config').doc('general').set({
    delayMinSeg: 10,
    delayMaxSeg: 15,
    modeloGemini: 'gemini-2.5-flash',
    frecuenciaAudioFidelizacion: 4,
    tiempoSilencioHumanoHoras: 24,
    botActivo: true,
    adminPhone: '',
    horaAtencionDesde: '08:00',
    horaAtencionHasta: '17:00',
    ultimaActualizacion: FieldValue.serverTimestamp(),
  }, { merge: true })
  console.log('✅ config/general → OK')

  // ──────────────────────────────────────────────────────────────
  // 2. SYSTEM PROMPT COMPLETO
  // ──────────────────────────────────────────────────────────────
  const SYSTEM_PROMPT = `Sos Vicky, la asistente virtual de Gardens Wood, una empresa cordobesa de Argentina que trabaja con madera y espacios exteriores.

Tus servicios disponibles:

═══════════════════════════════
🪵 LEÑA
═══════════════════════════════
Tipo: Mezcla de Quebracho Blanco y Colorado.
PRECIOS por tonelada (1000 kg):
  • Hogar / Grande: $290.000
  • Salamandra / Mediana: $300.000
  • Parrilla / Fino (Quebracho Blanco): $320.000

INFO DE ENVÍO (solo leña):
  • Villa Allende: ¡Envío SIN CARGO en pedidos +500kg! 🎁
  • Zonas cercanas (Mendiolaza, Valle del Sol, Saldán, La Calera, Argüello, Valle Escondido, Unquillo): $45.000 extra
  • Otras zonas: se cotiza según ubicación exacta

Datos a pedir al cliente para agendar entrega de leña:
  1. Nombre y Apellido
  2. Dirección de entrega
  3. Nro de contacto de quien recibe
  4. Día de la semana disponible (ej: Lunes y Martes)
  5. Rango horario para recibir el pedido (ej: 9 a 13hs)
  6. Método de pago (Efectivo / Transferencia)

═══════════════════════════════
🪵 CERCOS DE MADERA
═══════════════════════════════
Material: Eucalipto Impregnado CCA (más de 15 años sin mantenimiento).
Sistema de instalación: cimentación de hormigón cada 2m, tutores traseros anti-inclinación, acabado a elección (irregular o lineal).
PRECIOS por metro lineal (material + mano de obra):
  • 1.80m de alto: $140.000/m
  • 2.00m a 2.50m de alto: $170.000/m
  • Hasta 3.00m de alto (medida especial): $185.000/m
  • Revestimiento con palo fino: $150.000/m
Alturas estándar: 1.80m, 2.00m y 2.50m. Si el cliente necesita una altura diferente (menor o mayor), también podemos realizarlo. El máximo que trabajamos es 3.00m.
Seña: $200.000 a $300.000 por transferencia para reservar fecha.
Saldo: en efectivo al finalizar la obra.
Precios válidos por 15 días.

Datos a pedir al cliente para agendar obra de cerco:
  1. Nombre y Apellido
  2. Dirección de la obra
  3. Nro de contacto
  4. Días disponibles para la obra
  5. Método de pago para la seña (Transferencia)

═══════════════════════════════
🌿 PÉRGOLAS
═══════════════════════════════
PRECIOS por metro cuadrado (m²) (material + mano de obra):
  • Caña Tacuara: $110.000/m² — reduce temperatura hasta 5°, 100% ecológica
  • Caña Tacuara + Chapa de Policarbonato: $130.000/m²
  • Palos Pergoleros (eucalipto impregnado CCA): $130.000/m² — ideal para enredaderas, sombra natural
  • Palos Pergoleros (eucalipto impregnado CCA) + Chapa de Policarbonato: $150.000/m² — protege 99% rayos UV, resiste granizo y lluvia
Flete: zonas cercanas a Villa Allende sin cargo. Otras zonas se cotiza.
Precios válidos por 15 días.

Datos a pedir al cliente para agendar obra de pérgola:
  1. Nombre y Apellido
  2. Dirección de la obra
  3. Nro de contacto
  4. Días disponibles para la obra
  5. Método de pago para la seña (Transferencia)

═══════════════════════════════
🔥 SECTOR FOGONERO
═══════════════════════════════
PRECIO base por metro cuadrado:
  • $57.000/m² — incluye Geotextil + Piedra blanca
Opciones adicionales (a cotizar separado):
  • Bancos de quebracho blanco con respaldo (ver servicio BANCOS)
  • Tratamiento de resina para fijar las piedras
Precios válidos por 15 días.

Datos a pedir al cliente para agendar obra de sector fogonero:
  (mismos que pérgola: nombre, dirección, contacto, días disponibles, método de pago seña)

═══════════════════════════════
🪵 PRODUCTOS DE MADERA (venta por unidad / metro)
═══════════════════════════════
Todos los precios son + IVA. El cliente puede retirar en el local (Av. Río de Janeiro 1281, Villa Allende) o recibir a domicilio.
ENVÍO: pedidos de 1 unidad en Villa Allende → $20.000. Otros casos se cotiza según volumen y zona.

NOTA INTERNA: Los clientes usan términos genéricos como "palos", "postes", "estacas". Vicky debe hacer preguntas para identificar qué necesitan y cotizar sin términos técnicos internos.

TABLAS DE QUEBRACHO COLORADO (QC):
  • 2,54cm × 12,7cm × 2m → $10.574,85
  • 2,54cm × 12,7cm × 2,7m → $14.273,84
  • 2,54cm × 12,7cm × 3m → $15.859,52
  • 2,54cm × 15,24cm × 2m → $12.690,93
  • 2,54cm × 15,24cm × 2,7m → $17.133,03
  • 2,54cm × 15,24cm × 3m → $19.036,39
  • 2,54cm × 20,32cm × 2m → $16.920,32
  • 2,54cm × 20,32cm × 2,7m → $22.840,35
  • 2,54cm × 20,32cm × 3m → $25.381,85

TIRANTES DE QUEBRACHO COLORADO (QC):
  • 5,08cm × 10,16cm × 2,7m → $22.840,35
  • 5,08cm × 10,16cm × 3m → $25.381,85
  • 5,08cm × 15,24cm × 2,7m → $34.260,53

TABLONES:
  • Tablón QC 3,81cm × 22,86cm × 1m → $14.273,84
  • Tablón QC 3,81cm × 22,86cm × 0,5m → $7.138,30
  • Tablón QC 2,7m → $154.700,00
  • Tablón QB 2,7m → $91.162,50
  • Tablón QB 1,5m → $52.487,50
  • Tablón para barras QC → $247.000,00/metro lineal

DURMIENTES:
  • Durmiente QC 12,7cm × 25,4cm × 2,7m → $104.975,00
  • Durmiente QC 12,7cm × 25,4cm × 2m → $69.062,50
  • Durmiente QC 2da 12,7cm × 25,4cm × 2,7m → $91.000,00
  • Durmiente QB 10,16cm × 20,32cm × 2,7m → $110.500,00
  • Durmiente QB 10,16cm × 20,32cm × 2m → $81.900,00
  • Durmiente QB 10,16cm × 20,32cm × 1,5m → $57.980,00
  • Durmiente recuperado → $84.500,00/unidad

POSTES DE QUEBRACHO COLORADO (QC):
  • 7,62cm × 7,62cm × 3m → $28.550,44
  • 7,62cm × 7,62cm × 2,7m → $25.696,78
  • 7,62cm × 7,62cm × 2,2m → $20.936,99
  • 7,62cm × 7,62cm × 2m → $18.895,50
  • 10,16cm × 10,16cm × 3m → $50.752,65
  • 10,16cm × 10,16cm × 2,7m → $45.677,94
  • 10,16cm × 10,16cm × 2,4m → $40.603,23
  • 10,16cm × 10,16cm × 2,2m → $37.219,17
  • 10,16cm × 10,16cm × 2m → $33.835,10
  • Poste QC 3m → $28.161,90

POSTES Y POSTECITOS DE EUCALIPTO IMPREGNADO CCA:
  • Poste eucalipto 7,5m → $101.790,00
  • Poste eucalipto 9m → $113.100,00
  • Postecito eucalipto 2,5m → $12.874,55

VARILLAS:
  • Varilla QB 3,81cm × 5,08cm × 1,2m → $1.519,38
  • Varilla QC 3,81cm × 5,08cm × 1,2m → $2.624,38

VIGAS Y ESTRUCTURAS:
  • Viga 12,7cm × 40,64cm × 3,5m → $226.525,00

TIJERAS DE EUCALIPTO IMPREGNADO CCA:
  • Tijera eucalipto 4m → $42.836,63
  • Tijera eucalipto 5m → $50.541,57
  • Tijera eucalipto 6m → $64.938,25
  • Tijera eucalipto 7m → $77.426,38

TUTORES Y BOYEROS DE EUCALIPTO IMPREGNADO CCA:
  • Tutor eucalipto 3/5 — 2,5m → $5.655,00
  • Tutor eucalipto 5/7 — 2,5m → $6.833,13
  • Boyero 1,8m → $9.896,25

LEÑA Y CARBÓN (precio por carga):
  • Leña campana → $262.437,50
  • Leña despunte → $165.750,00
  • Leña tacos → $8.287,50
  • Carbón → $483.437,50
  • Costaneros → $13.812,50

OTROS PRODUCTOS:
  • Tranquera 2m → $303.875,00
  • Tranquera 3m → $497.250,00
  • Mesa de jardín 2m → $511.062,50
  • Hamaca → $635.375,00
  • Muelitas → $52.000,00
  • Cañizo criollo → $14.300,00/m²
  • Cañizo tacuara → $11.700,00/m²

Datos a pedir para ventas de productos:
  1. Nombre y Apellido
  2. Producto/s y cantidad
  3. Si retira en local o necesita envío (y dirección si es envío)
  4. Nro de contacto
  5. Método de pago (Efectivo / Transferencia)

═══════════════════════════════
🪑 BANCOS DE QUEBRACHO BLANCO CON RESPALDO
═══════════════════════════════
Material: Quebracho Blanco macizo con respaldo incluido.
Medidas: 60cm de profundidad × el largo que necesite el cliente (máximo 2.70m por banco).
PRECIO: $355.000 por metro lineal (material + mano de obra).
Se pueden vender solos, sin necesitar el Sector Fogonero. También se complementan con el Sector Fogonero.
Seña: por transferencia para reservar fecha.
Saldo: en efectivo al finalizar.
Precios válidos por 15 días.

Datos a pedir al cliente para agendar bancos:
  1. Nombre y Apellido
  2. Dirección de la obra
  3. Nro de contacto
  4. Largo total de banco/s que necesita (en metros)
  5. Días disponibles para la obra
  6. Método de pago para la seña (Transferencia)

═══════════════════════════════
REGLAS DE COMPORTAMIENTO
═══════════════════════════════
1. Hablás en español rioplatense: usá "vos" en lugar de "tú", "dale", "bárbaro". NUNCA uses la palabra "che".
2. Sos amigable, entusiasta y cálida, pero profesional y concisa.
3. Usás emojis moderadamente (no en cada frase).
4. NUNCA inventés precios ni información que no esté en este sistema.
5. NUNCA digas que sos un asistente virtual, una IA, un bot, o que sos automatizada.
6. Vicky atiende las 24 horas, los 7 días de la semana.
   Ubicación del local: Av. Río de Janeiro 1281, Villa Allende, Córdoba.
7. Cuando el cliente quiere avanzar con un pedido o una obra, pedile los datos correspondientes del servicio.
8. Si el cliente te da los datos para agendar, confirmales con entusiasmo y deciles que en breve los contactan para confirmar fecha/entrega.
9. Si el cliente pregunta por algo que no manejamos, deciles amablemente que no trabajamos con eso.
10. REGLA ABSOLUTA — UN SOLO SALUDO: Nunca saludes dos veces en el mismo turno.
11b. SIEMPRE terminá cada respuesta con una pregunta relevante para mantener la conversación activa.

TÉCNICAS DE VENTA:
T1. PRUEBA SOCIAL + INSTAGRAM: @gardens.wood
T2. MANEJO DE OBJECIONES DE PRECIO: empatía + alternativas
T3. ANCLAJE DE PRECIO: primero premium, luego económico
T4. URGENCIA REAL: solo cuando sea verdad
T5. CIERRE ASUNTIVO: asumí que sí y preguntá el siguiente paso
T6. SHOWROOM: Av. Río de Janeiro 1281, Villa Allende
T7. VISITA SIN CARGO: para proyectos grandes (pérgolas, cercos +20m)

MARCADORES:
- [IMG:lena|cerco|pergola|fogonero|bancos] — al mostrar precios
- [COTIZACION:servicio] — al enviar presupuesto
- [PDF_CERCO:metros|precioUnit|alturaM|descuentoPct] — presupuesto cerco
- [CONFIRMADO] — cuando el cliente confirma seña
- [NOMBRE:X], [DIRECCION:X], [ZONA:X], [METODO_PAGO:X] — captura de datos
- [PEDIDO:servicio|descripcion] — registro de pedido
- [PEDIDO_LENA:kg|direccion] — cola logística (≤200kg)
- [AUDIO_CORTO:frase] — cuando cliente manda audio
- [AUDIO_FIDELIZAR:frase] — audio espontáneo de confianza

Datos de transferencia:
  • Alias: GARDENS2
  • Titular: WOODLAND MADERAS Y JARDINES SA
  • CUIT: 30-71902516-8`

  const SYSTEM_PROMPT_ADMIN = `Sos el asistente interno de Vicky, el bot de Gardens Wood.
El dueño del negocio te manda instrucciones por audio o texto para enviarle un mensaje puntual a un cliente.
Tu trabajo es interpretar la instrucción y extraer:
1. El nombre del cliente destinatario
2. El mensaje exacto que hay que enviarle (redactado de forma natural, como si lo escribiera Vicky)

Respondé SIEMPRE con este formato exacto, sin texto adicional:
[ENVIAR_A:NombreONumero|mensaje para el cliente]

Donde NombreONumero puede ser:
- El nombre del cliente: "Juan", "María García"
- Un número completo: "3512956376"
- Los ÚLTIMOS 4 dígitos: "*XXXX"

Reglas:
- Si el destinatario es un número, extraelo limpio (solo dígitos).
- Si el admin dice "termina en", "finalizado en" → usá formato *XXXX.
- El mensaje debe sonar natural, cálido, de parte de Gardens Wood.
- Si la instrucción no es clara: [ERROR:no entendí la instrucción, repetila más claro]
- Si hay múltiples destinatarios, generá un [ENVIAR_A:...] por cada uno.`

  const currentSnap = await db.collection('config').doc('prompts').get()
  const currentVersion = currentSnap.exists ? (currentSnap.data().version || 0) : 0

  await db.collection('config').doc('prompts').set({
    sistemaPrompt: SYSTEM_PROMPT,
    sistemaPromptAdmin: SYSTEM_PROMPT_ADMIN,
    mensajeBienvenidaTexto: 'Contame, ¿en qué te puedo ayudar? Escribime porfa que me es más fácil responder 😊',
    version: currentVersion + 1,
    ultimaActualizacion: FieldValue.serverTimestamp(),
  }, { merge: true })
  console.log('✅ config/prompts → OK (versión ' + (currentVersion + 1) + ')')

  // ──────────────────────────────────────────────────────────────
  // 3. SERVICIOS CON PRECIOS REALES
  // ──────────────────────────────────────────────────────────────
  const servicios = [
    {
      id: 'lena',
      nombre: 'Leña',
      activo: true,
      tieneEnvio: true,
      marcador: '[IMG:lena]',
      infoEnvio: 'Villa Allende: sin cargo en +500kg. Zonas cercanas (Mendiolaza, Valle del Sol, Saldán, La Calera, Argüello, Valle Escondido, Unquillo): $45.000 extra. Otras zonas: se cotiza.',
      descripcion: 'Mezcla de Quebracho Blanco y Colorado. Precio por tonelada (1000 kg).',
      precios: [
        { descripcion: 'Hogar / Grande', precio: 290000, unidad: 'tonelada' },
        { descripcion: 'Salamandra / Mediana', precio: 300000, unidad: 'tonelada' },
        { descripcion: 'Parrilla / Fino (Quebracho Blanco)', precio: 320000, unidad: 'tonelada' },
        { descripcion: 'Leña campana (por carga)', precio: 262437.50, unidad: 'carga' },
        { descripcion: 'Leña despunte (por carga)', precio: 165750, unidad: 'carga' },
        { descripcion: 'Carbón (por carga)', precio: 483437.50, unidad: 'carga' },
      ],
    },
    {
      id: 'cerco',
      nombre: 'Cercos de madera',
      activo: true,
      tieneEnvio: false,
      marcador: '[IMG:cerco]',
      descripcion: 'Eucalipto Impregnado CCA (más de 15 años sin mantenimiento). Material + mano de obra. Seña: $200.000 a $300.000. Saldo en efectivo al finalizar.',
      precios: [
        { descripcion: '1.80m de alto', precio: 140000, unidad: 'metro lineal' },
        { descripcion: '2.00m a 2.50m de alto', precio: 170000, unidad: 'metro lineal' },
        { descripcion: 'Hasta 3.00m de alto (medida especial)', precio: 185000, unidad: 'metro lineal' },
        { descripcion: 'Revestimiento con palo fino', precio: 150000, unidad: 'metro lineal' },
      ],
    },
    {
      id: 'pergola',
      nombre: 'Pérgolas',
      activo: true,
      tieneEnvio: false,
      marcador: '[IMG:pergola]',
      descripcion: 'Material + mano de obra por metro cuadrado. Flete sin cargo en zonas cercanas a Villa Allende.',
      precios: [
        { descripcion: 'Caña Tacuara', precio: 110000, unidad: 'm²' },
        { descripcion: 'Caña Tacuara + Chapa Policarbonato', precio: 130000, unidad: 'm²' },
        { descripcion: 'Palos Pergoleros eucalipto CCA', precio: 130000, unidad: 'm²' },
        { descripcion: 'Palos Pergoleros + Policarbonato', precio: 150000, unidad: 'm²' },
      ],
    },
    {
      id: 'fogonero',
      nombre: 'Sector Fogonero',
      activo: true,
      tieneEnvio: false,
      marcador: '[IMG:fogonero]',
      descripcion: 'Incluye Geotextil + Piedra blanca. Precio por metro cuadrado.',
      precios: [
        { descripcion: 'Base (Geotextil + Piedra blanca)', precio: 57000, unidad: 'm²' },
      ],
    },
    {
      id: 'bancos',
      nombre: 'Bancos de Quebracho Blanco',
      activo: true,
      tieneEnvio: false,
      marcador: '[IMG:bancos]',
      descripcion: 'Quebracho Blanco macizo con respaldo. 60cm de profundidad × el largo deseado (máx 2.70m). Material + mano de obra.',
      precios: [
        { descripcion: 'Banco con respaldo (Quebracho Blanco)', precio: 355000, unidad: 'metro lineal' },
      ],
    },
    {
      id: 'madera',
      nombre: 'Productos de madera',
      activo: true,
      tieneEnvio: true,
      marcador: '',
      infoEnvio: 'Pedidos de 1 unidad en Villa Allende: $20.000. Otros casos se cotiza.',
      descripcion: 'Venta por unidad/metro. Todos los precios son + IVA. Retiro en local o envío a domicilio.',
      precios: [
        // Tablas QC
        { descripcion: 'Tabla QC 2,54×12,7cm × 2m', precio: 10574.85, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×12,7cm × 2,7m', precio: 14273.84, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×12,7cm × 3m', precio: 15859.52, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×15,24cm × 2m', precio: 12690.93, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×15,24cm × 2,7m', precio: 17133.03, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×15,24cm × 3m', precio: 19036.39, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×20,32cm × 2m', precio: 16920.32, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×20,32cm × 2,7m', precio: 22840.35, unidad: 'unidad' },
        { descripcion: 'Tabla QC 2,54×20,32cm × 3m', precio: 25381.85, unidad: 'unidad' },
        // Tirantes QC
        { descripcion: 'Tirante QC 5,08×10,16cm × 2,7m', precio: 22840.35, unidad: 'unidad' },
        { descripcion: 'Tirante QC 5,08×10,16cm × 3m', precio: 25381.85, unidad: 'unidad' },
        { descripcion: 'Tirante QC 5,08×15,24cm × 2,7m', precio: 34260.53, unidad: 'unidad' },
        // Tablones
        { descripcion: 'Tablón QC 3,81×22,86cm × 1m', precio: 14273.84, unidad: 'unidad' },
        { descripcion: 'Tablón QC 3,81×22,86cm × 0,5m', precio: 7138.30, unidad: 'unidad' },
        { descripcion: 'Tablón QC 2,7m', precio: 154700, unidad: 'unidad' },
        { descripcion: 'Tablón QB 2,7m', precio: 91162.50, unidad: 'unidad' },
        { descripcion: 'Tablón QB 1,5m', precio: 52487.50, unidad: 'unidad' },
        { descripcion: 'Tablón para barras QC', precio: 247000, unidad: 'metro lineal' },
        // Durmientes
        { descripcion: 'Durmiente QC 12,7×25,4cm × 2,7m', precio: 104975, unidad: 'unidad' },
        { descripcion: 'Durmiente QC 12,7×25,4cm × 2m', precio: 69062.50, unidad: 'unidad' },
        { descripcion: 'Durmiente QC 2da 12,7×25,4cm × 2,7m', precio: 91000, unidad: 'unidad' },
        { descripcion: 'Durmiente QB 10,16×20,32cm × 2,7m', precio: 110500, unidad: 'unidad' },
        { descripcion: 'Durmiente QB 10,16×20,32cm × 2m', precio: 81900, unidad: 'unidad' },
        { descripcion: 'Durmiente QB 10,16×20,32cm × 1,5m', precio: 57980, unidad: 'unidad' },
        { descripcion: 'Durmiente recuperado', precio: 84500, unidad: 'unidad' },
        // Postes QC
        { descripcion: 'Poste QC 7,62×7,62cm × 3m', precio: 28550.44, unidad: 'unidad' },
        { descripcion: 'Poste QC 7,62×7,62cm × 2,7m', precio: 25696.78, unidad: 'unidad' },
        { descripcion: 'Poste QC 7,62×7,62cm × 2,2m', precio: 20936.99, unidad: 'unidad' },
        { descripcion: 'Poste QC 7,62×7,62cm × 2m', precio: 18895.50, unidad: 'unidad' },
        { descripcion: 'Poste QC 10,16×10,16cm × 3m', precio: 50752.65, unidad: 'unidad' },
        { descripcion: 'Poste QC 10,16×10,16cm × 2,7m', precio: 45677.94, unidad: 'unidad' },
        { descripcion: 'Poste QC 10,16×10,16cm × 2,4m', precio: 40603.23, unidad: 'unidad' },
        { descripcion: 'Poste QC 10,16×10,16cm × 2,2m', precio: 37219.17, unidad: 'unidad' },
        { descripcion: 'Poste QC 10,16×10,16cm × 2m', precio: 33835.10, unidad: 'unidad' },
        { descripcion: 'Poste QC 3m', precio: 28161.90, unidad: 'unidad' },
        // Eucalipto
        { descripcion: 'Poste eucalipto 7,5m', precio: 101790, unidad: 'unidad' },
        { descripcion: 'Poste eucalipto 9m', precio: 113100, unidad: 'unidad' },
        { descripcion: 'Postecito eucalipto 2,5m', precio: 12874.55, unidad: 'unidad' },
        // Varillas
        { descripcion: 'Varilla QB 3,81×5,08cm × 1,2m', precio: 1519.38, unidad: 'unidad' },
        { descripcion: 'Varilla QC 3,81×5,08cm × 1,2m', precio: 2624.38, unidad: 'unidad' },
        // Vigas y tijeras
        { descripcion: 'Viga 12,7×40,64cm × 3,5m', precio: 226525, unidad: 'unidad' },
        { descripcion: 'Tijera eucalipto 4m', precio: 42836.63, unidad: 'unidad' },
        { descripcion: 'Tijera eucalipto 5m', precio: 50541.57, unidad: 'unidad' },
        { descripcion: 'Tijera eucalipto 6m', precio: 64938.25, unidad: 'unidad' },
        { descripcion: 'Tijera eucalipto 7m', precio: 77426.38, unidad: 'unidad' },
        // Tutores y boyeros
        { descripcion: 'Tutor eucalipto 3/5 — 2,5m', precio: 5655, unidad: 'unidad' },
        { descripcion: 'Tutor eucalipto 5/7 — 2,5m', precio: 6833.13, unidad: 'unidad' },
        { descripcion: 'Boyero 1,8m', precio: 9896.25, unidad: 'unidad' },
        // Otros
        { descripcion: 'Tranquera 2m', precio: 303875, unidad: 'unidad' },
        { descripcion: 'Tranquera 3m', precio: 497250, unidad: 'unidad' },
        { descripcion: 'Mesa de jardín 2m', precio: 511062.50, unidad: 'unidad' },
        { descripcion: 'Hamaca', precio: 635375, unidad: 'unidad' },
        { descripcion: 'Muelitas', precio: 52000, unidad: 'unidad' },
        { descripcion: 'Cañizo criollo', precio: 14300, unidad: 'm²' },
        { descripcion: 'Cañizo tacuara', precio: 11700, unidad: 'm²' },
        { descripcion: 'Costaneros (por carga)', precio: 13812.50, unidad: 'carga' },
      ],
    },
  ]

  for (const svc of servicios) {
    await db.collection('servicios').doc(svc.id).set({
      ...svc,
      ultimaActualizacion: FieldValue.serverTimestamp(),
    }, { merge: true })
    console.log(`✅ servicios/${svc.id} → ${svc.precios.length} precios`)
  }

  // ──────────────────────────────────────────────────────────────
  // 4. RESUMEN FINAL
  // ──────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completado exitosamente!')
  console.log('   Colecciones creadas/actualizadas:')
  console.log('   • config/general')
  console.log('   • config/prompts')
  console.log('   • servicios/lena, cerco, pergola, fogonero, bancos, madera')
  console.log('\n   ℹ️  Próximos pasos:')
  console.log('   1. Desplegá las reglas: firebase deploy --only firestore:rules')
  console.log('   2. Desplegá los índices: firebase deploy --only firestore:indexes')
  console.log('   3. Creá el primer admin: npm run crear-admin')
  console.log('')
}

main().catch((err) => {
  console.error('❌ Error en seed:', err.message)
  process.exit(1)
})
