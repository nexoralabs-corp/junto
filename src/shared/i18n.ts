const STORAGE_KEY = 'junto-lang'

export type Lang = 'en' | 'es'

const en = {
  nav: {
    home: 'Junto',
    tagline: 'Tools for small groups. No accounts. No servers. Just links.',
    scheduler: 'Sync Times',
    bills: 'Bill Splitter',
    lang: 'ES',
  },
  common: {
    back: '← Back',
    add: 'Add',
    remove: '×',
    copy_link: 'Copy link',
    copied: '✓ Copied!',
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
  },
}

const es: typeof en = {
  nav: {
    home: 'Junto',
    tagline: 'Herramientas para grupos. Sin cuentas. Sin servidores. Solo links.',
    scheduler: 'Sincronizar horarios',
    bills: 'Dividir cuenta',
    lang: 'EN',
  },
  common: {
    back: '← Volver',
    add: 'Agregar',
    remove: '×',
    copy_link: 'Copiar link',
    copied: '✓ ¡Copiado!',
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
