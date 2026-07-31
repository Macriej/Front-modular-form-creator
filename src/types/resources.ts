export type ResourceStatus = 'draft' | 'completed'

export type ResourceBasicInfo = {
  resourceName: string
  owner: string
  email: string
  description: string
  priority: string
}

export type ResourceProjectDetails = {
  projectName: string
  budget: string
  category: string
  options: string[]
}

export interface Resource {
  _id: string
  resourceId: number
  name: string
  status: ResourceStatus
  basicInfo: ResourceBasicInfo
  projectDetails: ResourceProjectDetails
  createdAt: string
  updatedAt: string
}

export interface ResourceListResponse {
  items: Resource[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}
