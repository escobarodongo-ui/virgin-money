export type TransactionCategory =
  | 'incoming_transfer'
  | 'outgoing_transfer'
  | 'card'
  | 'pending'
  | 'refund'
  | 'deposit'
  | 'withdrawal'
  | 'bill'
  | 'fee'
  | 'internal_transfer'

export type TransactionIcon = 'transfer' | 'card' | 'deposit'

export interface Transaction {
  id: string
  title: string
  sub: string
  amount: number
  pending?: boolean
  icon: TransactionIcon
  category: TransactionCategory
  merchant?: string
  location?: string
  date: string
  time: string
  reference: string
  status: 'Posted' | 'Pending'
}

function categorize(t: {
  title: string
  sub: string
  amount: number
  pending?: boolean
  icon: TransactionIcon
}): TransactionCategory {
  if (t.pending) return 'pending'
  if (t.icon === 'card') return 'card'
  if (t.icon === 'deposit' || /deposit/i.test(t.sub)) return 'deposit'
  if (/fee/i.test(t.sub)) return 'fee'
  if (/bill/i.test(t.sub)) return 'bill'
  if (t.amount < 0 && /^To:/i.test(t.title)) return 'outgoing_transfer'
  if (t.amount > 0 && /^From:/i.test(t.title)) return 'incoming_transfer'
  if (t.amount < 0) return 'withdrawal'
  return 'incoming_transfer'
}

const DATE = '2026-10-19'
const DATE_LABEL = 'Monday, 19 October 2026'

const raw: Array<{
  title: string
  sub: string
  amount: number
  pending?: boolean
  icon: TransactionIcon
  time?: string
}> = [
  { title: "From: SAINATH REDDY THARIGONDA", sub: 'Naruto reddy', amount: 120, icon: 'transfer', time: '09:14' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -46, icon: 'transfer', time: '09:02' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -514,
    pending: true,
    icon: 'card',
    time: '08:41',
  },
  { title: 'From: DANTE RIQUELME', sub: 'ASAP', amount: 200, icon: 'transfer', time: '08:20' },
  { title: 'From: TIANA HOTCHKISS', sub: 'Deposit', amount: 100, icon: 'deposit', time: '08:05' },
  { title: 'From: MYERS GRACE L', sub: 'fee', amount: 100, icon: 'transfer', time: '07:55' },
  { title: 'From: SHAMUS HAYES', sub: 'Gannet', amount: 80, icon: 'transfer', time: '07:40' },
  { title: 'From: NICOLA LORENZ', sub: 'Bill', amount: 75, icon: 'transfer', time: '07:22' },
  { title: 'From: STEVEN DUGON', sub: 'NA', amount: 100, icon: 'transfer', time: '07:10' },
  { title: "From: NOAH D'SYLVA", sub: 'dinner', amount: 70, icon: 'transfer', time: '06:58' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -70, icon: 'transfer', time: '06:50' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -70, icon: 'transfer', time: '06:48' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -698,
    pending: true,
    icon: 'card',
    time: '06:30',
  },
  { title: 'From: D S ROBINS', sub: 'Lunch', amount: 100, icon: 'transfer', time: '06:12' },
  { title: 'From: ZAINAB NAZARI', sub: 'Down Payment', amount: 200, icon: 'transfer', time: '05:55' },
  { title: 'From: Damien Griffin', sub: 'OSKO', amount: 150, icon: 'transfer', time: '05:40' },
  {
    title: 'From: MISS NATALIE REBECCA BUNNER',
    sub: 'Maceys Wash and Groom.',
    amount: 100,
    icon: 'transfer',
    time: '05:22',
  },
  { title: 'From: BENJAMIN RAWNSLEY', sub: 'Michael', amount: 127, icon: 'transfer', time: '05:05' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -40, icon: 'transfer', time: '04:50' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -360,
    pending: true,
    icon: 'card',
    time: '04:30',
  },
  { title: 'From: HOVINGTON BEAU STEVEN', sub: 'Huxley', amount: 120, icon: 'transfer', time: '04:10' },
  { title: 'From: DANIEL SCHILLING', sub: 'marketplace', amount: 75, icon: 'transfer', time: '03:55' },
  { title: 'From: MYERS GRACE L', sub: 'calvin harris x2', amount: 200, icon: 'transfer', time: '03:40' },
  { title: 'From: MYERS GRACE L', sub: 'calvin harris', amount: 200, icon: 'transfer', time: '03:22' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -90, icon: 'transfer', time: '03:05' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -810,
    pending: true,
    icon: 'card',
    time: '02:50',
  },
  { title: 'From: Elias Lee', sub: 'ti-lite wheelchair', amount: 450, icon: 'transfer', time: '02:30' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -40, icon: 'transfer', time: '02:15' },
  { title: 'From: YXAVEL DINO', sub: 'EMA0169', amount: 450, icon: 'transfer', time: '02:00' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -360,
    pending: true,
    icon: 'card',
    time: '01:45',
  },
  { title: 'From: SAIMA JAFARI', sub: 'Zara Larsson', amount: 200, icon: 'transfer', time: '01:30' },
  { title: 'From: JOANNA OLIVEIRA DE FARIAS', sub: '.', amount: 201, icon: 'transfer', time: '01:15' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -49, icon: 'transfer', time: '01:00' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -301,
    pending: true,
    icon: 'card',
    time: '00:45',
  },
  { title: 'From: MS SABRINA CARP', sub: 'NA', amount: 140, icon: 'transfer', time: '00:30' },
  { title: 'From: YU-SIN HUANG', sub: 'Isabella', amount: 185, icon: 'transfer', time: '00:15' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -135,
    pending: true,
    icon: 'card',
    time: '00:05',
  },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -30, icon: 'transfer', time: '23:50' },
  { title: "From: LIJO KOSHY THOMAS", sub: "P.express - E'hills", amount: 150, icon: 'transfer', time: '23:30' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -270,
    pending: true,
    icon: 'card',
    time: '23:10',
  },
  { title: 'From: BRODIE WOLFF', sub: 'Nickleback', amount: 300, icon: 'transfer', time: '22:55' },
  { title: "To: N D'SYLVA", sub: 'N/A', amount: -49, icon: 'transfer', time: '22:40' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -339,
    pending: true,
    icon: 'card',
    time: '22:20',
  },
  { title: 'From: K M MOONEY', sub: 'Kristy', amount: 100, icon: 'transfer', time: '22:00' },
  { title: 'From: SHELTON JAKE C', sub: 'NA', amount: 239.96, icon: 'transfer', time: '21:40' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -387,
    pending: true,
    icon: 'card',
    time: '21:20',
  },
  { title: 'From: MR CEASAR WHITE', sub: 'NA', amount: 420, icon: 'transfer', time: '21:00' },
  {
    title: 'RMTL*StepanosAudisho Seattle AU',
    sub: 'RMTL*StepanosAudisho',
    amount: -10,
    pending: true,
    icon: 'card',
    time: '20:40',
  },
  { title: "From: NOAH D'SYLVA", sub: 'food', amount: 11.99, icon: 'transfer', time: '20:20' },
  {
    title: 'WESTERN UNION SYDNEY AU',
    sub: 'WESTERN UNION',
    amount: -11.99,
    pending: true,
    icon: 'card',
    time: '20:00',
  },
  { title: "From: NOAH D'SYLVA", sub: 'food', amount: 5, icon: 'transfer', time: '19:40' },
  { title: "From: NOAH D'SYLVA", sub: 'food', amount: 10, icon: 'transfer', time: '19:20' },
]

export const TRANSACTION_DATE_LABEL = DATE_LABEL

export const transactions: Transaction[] = raw.map((t, index) => {
  const category = categorize(t)
  const ref = `VM${String(100000 + index).slice(1)}`
  return {
    id: `tx-${index + 1}`,
    title: t.title,
    sub: t.sub,
    amount: t.amount,
    pending: t.pending,
    icon: t.icon,
    category,
    merchant: t.sub !== 'N/A' && t.sub !== 'NA' && t.sub !== '.' ? t.sub : undefined,
    location: t.icon === 'card' ? t.title : undefined,
    date: DATE,
    time: t.time ?? '12:00',
    reference: ref,
    status: t.pending ? 'Pending' : 'Posted',
  }
})
