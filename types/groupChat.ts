export interface GroupChatMessage {
  id: string
  senderUid: string
  senderName: string
  senderMemberId: string
  type: 'text'
  text: string
  createdAt?: {
    toDate(): Date
  } | null
}
