import { createContext } from 'react'
import type { ResourceBasicInfo, ResourceProjectDetails } from '../types/resources'

export type ResourceEditBuffer = {
  basicInfo: ResourceBasicInfo
  projectDetails: ResourceProjectDetails
}

export type CompletedResourceEditContextValue = {
  edits: Record<string, ResourceEditBuffer>
  setBasicInfo: (resourceId: string, basicInfo: ResourceBasicInfo) => void
  setProjectDetails: (resourceId: string, projectDetails: ResourceProjectDetails) => void
  clearEdits: (resourceId: string) => void
}

export const CompletedResourceEditContext = createContext<CompletedResourceEditContextValue | undefined>(undefined)

export const emptyBasicInfo: ResourceBasicInfo = {
  resourceName: '',
  owner: '',
  email: '',
  description: '',
  priority: '',
}

export const emptyProjectDetails: ResourceProjectDetails = {
  projectName: '',
  budget: '',
  category: '',
  options: [],
}
