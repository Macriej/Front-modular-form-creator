import type {
  Resource,
  ResourceBasicInfo,
  ResourceProjectDetails,
} from '../types/resources'

export function isBasicInfoComplete(basicInfo: ResourceBasicInfo) {
  return Boolean(
    basicInfo.resourceName &&
      basicInfo.owner &&
      basicInfo.email &&
      basicInfo.description &&
      basicInfo.priority,
  )
}

export function isProjectDetailsComplete(projectDetails: ResourceProjectDetails) {
  return Boolean(
    projectDetails.projectName &&
      projectDetails.budget &&
      projectDetails.category &&
      projectDetails.options.length > 0,
  )
}

export function getResourceStatusLabel(status: Resource['status']) {
  return status === 'draft' ? 'Draft' : 'Completed'
}

export function getBadgeVariant(status: Resource['status']) {
  return status === 'draft' ? 'warning' : 'success'
}
