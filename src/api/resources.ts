import { request } from './client'
import type {
  Resource,
  ResourceBasicInfo,
  ResourceProjectDetails,
  ResourceListResponse,
  ResourceStatus,
} from '../types/resources'

const RESOURCE_API = '/api/resources'

type ResourceListParams = {
  page?: number
  pageSize?: number
  status?: ResourceStatus
  name?: string
  sortOrder?: 'asc' | 'desc'
}

function buildQuery(params?: ResourceListParams): string {
  if (!params) {
    return ''
  }

  const query = new URLSearchParams()

  if (params.page !== undefined) {
    query.set('page', String(params.page))
  }
  if (params.pageSize !== undefined) {
    query.set('pageSize', String(params.pageSize))
  }
  if (params.status) {
    query.set('status', params.status)
  }
  if (params.name) {
    query.set('name', params.name)
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder)
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function listResources(params?: ResourceListParams): Promise<ResourceListResponse> {
  return request(`${RESOURCE_API}${buildQuery(params)}`)
}

export async function getResource(resourceId: string): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}`)
}

export async function createResource(resourceName: string): Promise<Resource> {
  return request(`${RESOURCE_API}`, {
    method: 'POST',
    body: JSON.stringify({ resourceName }),
  })
}

export async function deleteResource(resourceId: string): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}`, {
    method: 'DELETE',
  })
}

export async function updateBasicInfo(
  resourceId: string,
  basicInfo: ResourceBasicInfo,
): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}/basic-info`, {
    method: 'PATCH',
    body: JSON.stringify(basicInfo),
  })
}

export async function updateProjectDetails(
  resourceId: string,
  projectDetails: ResourceProjectDetails,
): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}/project-details`, {
    method: 'PATCH',
    body: JSON.stringify(projectDetails),
  })
}

export async function provisionResource(resourceId: string): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}/provisioning`, {
    method: 'PATCH',
  })
}

export async function replaceResource(
  resourceId: string,
  payload: Pick<Resource, 'name' | 'status' | 'basicInfo' | 'projectDetails'>,
): Promise<Resource> {
  return request(`${RESOURCE_API}/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
