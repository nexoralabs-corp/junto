const STORAGE_KEY = 'junto-lang'

export type Lang = 'en' | 'es'

const en = {
  nav: {
    home: 'Junto',
    tagline: 'Tools for small groups. No accounts. No servers. Just links.',
    scheduler: 'Sync Times',
    bills: 'Bill Splitter',
    lang: 'EN',
  },
  common: {
    back: '← Back',
    add: 'Add',
    remove: '×',
    copy_link: 'Copy link',
    copied: '✓ Copied!',
    reset: 'Reset',
  },
  scheduler: {
    title: 'Sync Times',
    subtitle: 'Pick your availability, share the link, see when everyone overlaps.',
    your_name: 'Your name',
    your_name_placeholder: 'e.g. Alex',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    participants: 'Participants',
    overlap_hint: 'Green = everyone is free.',
    save_share: 'Save & Share',
    no_name: 'Enter your name first.',
    best_times: 'Best times',
    no_overlap: 'No overlapping slots yet.',
    overlap_with_you: 'Overlaps with you',
    existing_overlap: 'Others agree on',
    tab_all: 'All',
    unnamed: 'Unnamed',
    add_person: 'Add person',
    add_from_link: 'Add from link',
    paste_link: 'Paste a Junto scheduler link…',
    import: 'Import',
    import_error: 'Invalid or empty link.',
    partial_overlap: 'Some overlap',
    all_free: 'Everyone free',
    share: 'Share',
    share_all: 'Everyone\'s schedule',
    share_one: 'Only this person',
    new_schedule: 'New',
  },
  bills: {
    title: 'Bill Splitter',
    subtitle: 'Add expenses, tag who was involved, get a clean settlement.',
    people: 'People',
    add_person: 'Add person',
    person_placeholder: 'e.g. Alex',
    expenses: 'Expenses',
    add_expense: 'Add expense',
    exp_description: 'What for',
    exp_description_placeholder: 'e.g. Dinner',
    exp_amount: 'Amount ($)',
    exp_paid_by: 'Paid by',
    exp_participants: 'Split between',
    settlement: 'Settlement',
    pays: 'pays',
    all_settled: 'All settled up! 🎉',
    share: 'Share settlement',
    no_expenses: 'No expenses yet.',
    need_people: 'Add at least 2 people to start.',
    total: 'Total',
    participants_label: 'Who was involved:',
    select_all: 'All',
    deselect_all: 'None',
  },
  modal: {
    close: 'Close',
    how_it_works: 'How it works',
    good_to_know: 'Good to know',
    scheduler_desc: 'Coordinate your group\'s availability without endless back-and-forth. Everyone adds their free slots to the same link — no accounts, no calendar access needed.',
    scheduler_step1: 'Pick the time slots when you\'re free on the weekly grid.',
    scheduler_step2: 'Hit "Save & Share" — your availability is encoded in the link.',
    scheduler_step3: 'Friends open the link, add their own slots, and share again. Green slots = everyone is free.',
    scheduler_note: 'The link is the data. No server involved — the URL itself holds everyone\'s schedule.',
    bills_desc: 'Track shared expenses and get a clean settlement — with the fewest transactions possible. Great for trips, dinners, or any group spending.',
    bills_step1: 'Add everyone in the group by name.',
    bills_step2: 'Log each expense: what it was for, who paid, and who was involved.',
    bills_step3: 'The app calculates exactly who pays whom. Share the link so everyone sees the breakdown.',
    bills_note: 'Uses a debt minimization algorithm — fewer transactions, same fair result. All math done in cents to avoid rounding errors.',
  },
}

const es: typeof en = {
  nav: {
    home: 'Junto',
    tagline: 'Herramientas para grupos. Sin cuentas. Sin servidores. Solo links.',
    scheduler: 'Sincronizar horarios',
    bills: 'Dividir cuenta',
    lang: 'ES',
  },
  common: {
    back: '← Volver',
    add: 'Agregar',
    remove: '×',
    copy_link: 'Copiar link',
    copied: '✓ ¡Copiado!',
    reset: 'Reiniciar',
  },
  scheduler: {
    title: 'Sincronizar horarios',
    subtitle: 'Elige tu disponibilidad, comparte el link, ve cuándo todos coinciden.',
    your_name: 'Tu nombre',
    your_name_placeholder: 'ej. Alex',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    participants: 'Participantes',
    overlap_hint: 'Verde = todos están libres.',
    save_share: 'Guardar y compartir',
    no_name: 'Escribe tu nombre primero.',
    best_times: 'Mejores horarios',
    no_overlap: 'Sin horarios en común aún.',
    overlap_with_you: 'Coinciden contigo',
    existing_overlap: 'Los demás coinciden en',
    tab_all: 'Todos',
    unnamed: 'Sin nombre',
    add_person: 'Agregar persona',
    add_from_link: 'Agregar desde link',
    paste_link: 'Pega un link de Junto…',
    import: 'Importar',
    import_error: 'Link inválido o vacío.',
    partial_overlap: 'Coincidencia parcial',
    all_free: 'Todos libres',
    share: 'Compartir',
    share_all: 'Horario de todos',
    share_one: 'Solo esta persona',
    new_schedule: 'Nuevo',
  },
  bills: {
    title: 'Dividir cuenta',
    subtitle: 'Agrega gastos, marca quién participó, obtén un resumen claro.',
    people: 'Personas',
    add_person: 'Agregar persona',
    person_placeholder: 'ej. Alex',
    expenses: 'Gastos',
    add_expense: 'Agregar gasto',
    exp_description: 'Para qué',
    exp_description_placeholder: 'ej. Cena',
    exp_amount: 'Monto ($)',
    exp_paid_by: 'Pagó',
    exp_participants: 'Dividir entre',
    settlement: 'Liquidación',
    pays: 'le paga a',
    all_settled: '¡Todo saldado! 🎉',
    share: 'Compartir liquidación',
    no_expenses: 'Sin gastos aún.',
    need_people: 'Agrega al menos 2 personas para comenzar.',
    total: 'Total',
    participants_label: 'Quiénes participaron:',
    select_all: 'Todos',
    deselect_all: 'Ninguno',
  },
  modal: {
    close: 'Cerrar',
    how_it_works: 'Cómo funciona',
    good_to_know: 'Dato importante',
    scheduler_desc: 'Coordina la disponibilidad de tu grupo sin mensajes interminables. Cada persona agrega sus horarios libres al mismo link — sin cuentas ni acceso al calendario.',
    scheduler_step1: 'Selecciona las horas en que estás libre en la grilla semanal.',
    scheduler_step2: 'Toca "Guardar y compartir" — tu disponibilidad queda codificada en el link.',
    scheduler_step3: 'Tus amigos abren el link, agregan sus horarios y comparten de nuevo. Los casilleros verdes = todos están libres.',
    scheduler_note: 'El link es el dato. Sin servidor — la URL en sí guarda el horario de todos.',
    bills_desc: 'Registra gastos compartidos y obtén una liquidación clara — con la menor cantidad de transacciones posible. Ideal para viajes, cenas o cualquier gasto grupal.',
    bills_step1: 'Agrega a todos los integrantes del grupo por nombre.',
    bills_step2: 'Registra cada gasto: para qué fue, quién pagó y quiénes participaron.',
    bills_step3: 'La app calcula exactamente quién le paga a quién. Comparte el link para que todos vean el resumen.',
    bills_note: 'Usa un algoritmo de minimización de deuda — menos transacciones, mismo resultado justo. Todo en centavos para evitar errores de redondeo.',
  },
}

const dicts = { en, es }

export function getLang(): Lang {
  return (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'en'
}

export function setLang(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang)
}

export function toggleLang(): Lang {
  const next: Lang = getLang() === 'en' ? 'es' : 'en'
  setLang(next)
  return next
}

type NestedValue<T> = T extends string ? T : T extends string[] ? T : never

function getDeep(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, key) => {
    if (typeof acc === 'object' && acc !== null) return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj as unknown)
}

export function t(path: string): string {
  const val = getDeep(dicts[getLang()] as unknown as Record<string, unknown>, path)
  return typeof val === 'string' ? val : path
}

export function tArr(path: string): string[] {
  const val = getDeep(dicts[getLang()] as unknown as Record<string, unknown>, path)
  return Array.isArray(val) ? (val as string[]) : []
}

// Unused generic kept for type satisfaction
export type { NestedValue }
