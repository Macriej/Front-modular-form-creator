import { useMemo, useState, type ReactNode } from 'react'
import type { ResourceBasicInfo, ResourceProjectDetails } from '../types/resources'
import {
  CompletedResourceEditContext as SharedCompletedResourceEditContext,
  emptyBasicInfo,
  emptyProjectDetails,
} from './completedResourceEditStore'
import type { ResourceEditBuffer } from './completedResourceEditStore'

type Props = { children: ReactNode }

export function CompletedResourceEditProvider({ children }: Props) {
  const [edits, setEdits] = useState<Record<string, ResourceEditBuffer>>({})

  const setBasicInfo = (resourceId: string, basicInfo: ResourceBasicInfo) =>
    setEdits((prev) => ({
      ...prev,
      [resourceId]: {
        basicInfo,
        projectDetails: prev[resourceId]?.projectDetails ?? emptyProjectDetails,
      },
    }))

  const setProjectDetails = (resourceId: string, projectDetails: ResourceProjectDetails) =>
    setEdits((prev) => ({
      ...prev,
      [resourceId]: {
        basicInfo: prev[resourceId]?.basicInfo ?? emptyBasicInfo,
        projectDetails,
      },
    }))

  const clearEdits = (resourceId: string) =>
    setEdits((prev) => {
      const next = { ...prev }
      delete next[resourceId]
      return next
    })

  const value = useMemo(() => ({ edits, setBasicInfo, setProjectDetails, clearEdits }), [edits])

  return <SharedCompletedResourceEditContext.Provider value={value}>{children}</SharedCompletedResourceEditContext.Provider>
}
