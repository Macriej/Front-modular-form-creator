import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Input, Select, CheckboxGroup } from '../design-system'
import { PageShell } from '../components/PageShell'
import { getResource, updateProjectDetails } from '../api/resources'
import type { Resource, ResourceProjectDetails } from '../types/resources'
import { useCompletedResourceEdits } from '../contexts/useCompletedResourceEdits'
import { isBasicInfoComplete, getBadgeVariant } from './resourceHelpers'
import { ApiError } from '../api/client'

const CATEGORY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'vendor', label: 'Vendor' },
]

const TEAM_OPTIONS = ['FE devs', 'BE devs', 'Designer', 'Data Eng', 'Product Owner']

export function ProjectDetailsPage() {
  const params = useParams()
  const resourceId = params.resourceId ?? ''
  const [resource, setResource] = useState<Resource | null>(null)
  const [form, setForm] = useState<ResourceProjectDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { bufferedEdits, setProjectDetails } = useCompletedResourceEdits(resourceId)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const fetched = await getResource(resourceId)
        if (!active) {
          return
        }

        setResource(fetched)
        setForm(bufferedEdits?.projectDetails ?? fetched.projectDetails)
      } catch {
        if (active) {
          setError('Unable to load resource data.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [resourceId, bufferedEdits])

  const saveProjectDetails = async () => {
    if (!resource || !form) return

    if (resource.status === 'completed') {
      setProjectDetails(resourceId, form)
      navigate(`/resources/${resource.resourceId}`, {
        state: { snackbar: 'Project Details saved successfully.' },
      })
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await updateProjectDetails(resourceId, form)
      navigate(`/resources/${resource.resourceId}`, {
        state: { snackbar: 'Project Details saved successfully.' },
      })
      return
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const msg = error.message ?? ''
        const fieldMap: [RegExp, string][] = [
          [/projectName/i, 'projectName'],
          [/budget/i, 'budget'],
          [/category/i, 'category'],
          [/options|team/i, 'options'],
        ]

        const matched = fieldMap.find(([re]) => re.test(msg))
        if (matched) {
          const field = matched[1]
          setFieldErrors((current) => ({ ...current, [field]: msg }))
        } else {
          setError(msg)
        }
      } else {
        setError('Unable to save Project Details.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formDisabled = !form || (resource?.status === 'draft' && !isBasicInfoComplete(resource.basicInfo))

  const canSave = Boolean(
    form &&
      form.projectName.trim() &&
      form.budget.trim() &&
      isBudgetValid(form.budget) &&
      form.category.trim() &&
      form.options.length > 0,
  )

  const currentProjectDetails = useMemo(
    () => form ?? resource?.projectDetails,
    [form, resource],
  )

  function isBudgetValid(value: string) {
    return /^[0-9]+$/.test(String(value).trim())
  }

  return (
    <PageShell
      title="Project Details"
      description={
        resource?.status === 'completed'
          ? 'Completed resource edits are buffered locally until you submit them on the Details page.'
          : 'Draft resource module changes are sent immediately to the backend once valid.'
      }
    >
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {message ? <SuccessMessage>{message}</SuccessMessage> : null}
      {resource ? (
        <>
          <StatusHeading>
            <span>Status: </span>
            <StatusBadge variant={getBadgeVariant(resource.status)}>{resource.status}</StatusBadge>
          </StatusHeading>
          {resource.status === 'draft' && !isBasicInfoComplete(resource.basicInfo) ? (
            <Notice>Complete Basic Info before editing Project Details.</Notice>
          ) : null}
          <FormGrid>
            <Input
              label="Project name"
              value={currentProjectDetails?.projectName ?? ''}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? { ...current, projectName: event.target.value }
                    : null,
                )
              }
              disabled={formDisabled}
            />
            {fieldErrors.projectName ? <FieldError>{fieldErrors.projectName}</FieldError> : null}
            <Input
              label="Budget"
              value={currentProjectDetails?.budget ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setForm((current) =>
                  current
                    ? { ...current, budget: value }
                    : null,
                )
                setFieldErrors((current) => ({
                  ...current,
                  budget: isBudgetValid(value) ? '' : 'Budget must contain only digits (e.g. "123").',
                }))
              }}
              disabled={formDisabled}
            />
            {fieldErrors.budget ? <FieldError>{fieldErrors.budget}</FieldError> : null}
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={currentProjectDetails?.category ?? ''}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? { ...current, category: event.target.value }
                    : null,
                )
              }
              disabled={formDisabled}
            />
            {fieldErrors.category ? <FieldError>{fieldErrors.category}</FieldError> : null}
            <CheckboxGroup
              label="Team options"
              options={TEAM_OPTIONS}
              value={currentProjectDetails?.options ?? []}
              onChange={(value) =>
                setForm((current) =>
                  current
                    ? { ...current, options: value }
                    : null,
                )
              }
              disabled={formDisabled}
              helper="Select at least one team member option."
            />
            {fieldErrors.options ? <FieldError>{fieldErrors.options}</FieldError> : null}
          </FormGrid>
          <ActionsRow>
            <Button variant="primary" onClick={saveProjectDetails} disabled={!canSave || loading || formDisabled}>
              Save Project Details
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/resources/${resource.resourceId}`)}>
              Back to overview
            </Button>
          </ActionsRow>
        </>
      ) : null}
    </PageShell>
  )
}

const FormGrid = styled.div`
  display: grid;
  gap: 18px;
  max-width: 720px;
`

const ActionsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.warning};
`

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.success};
`

const FieldError = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: 0.9rem;
`

const StatusHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
`

const StatusBadge = styled('span')<{variant?: string}>`
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 600;
  text-transform: capitalize;
`

const Notice = styled.p`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
`
