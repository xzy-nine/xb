export interface SuperTopicItem {
  title: string
  intro: string
  fansText: string
  link: string
  pic: string
  oid: string
  topicName: string
  statusCount: number
  followCount: number
}

export interface SuperTopicPage {
  name: string
  items: SuperTopicItem[]
  totalNumber: number
}
