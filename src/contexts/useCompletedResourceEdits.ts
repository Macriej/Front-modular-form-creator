import { useContext } from 'react'
import { CompletedResourceEditContext } from './completedResourceEditStore'

export function useCompletedResourceEdits(resourceId: string) {
  const context = useContext(CompletedResourceEditContext)

  if (!context) throw new Error('useCompletedResourceEdits must be used within CompletedResourceEditProvider')

  return {
    bufferedEdits: context.edits[resourceId],
    setBasicInfo: context.setBasicInfo,
    setProjectDetails: context.setProjectDetails,
    clearEdits: context.clearEdits,
  }
}
