export interface Account {
  id: string
  name: string
  maskedIdentifier: string
  type: string
  currency: string
  availableBalance: number
  currentBalance: number
  scheduledActivity: string
  roundUps: string
  ownerFirstName: string
}

/** Fictionalized account used throughout the unofficial recreation. */
export const account: Account = {
  id: 'acc-go-001',
  name: 'Go Account',
  maskedIdentifier: '122-778 880774458',
  type: 'Transactional',
  currency: 'AUD',
  availableBalance: 320.02,
  currentBalance: 4516.01,
  scheduledActivity: 'None',
  roundUps: 'Off',
  ownerFirstName: 'Stepanos',
}
