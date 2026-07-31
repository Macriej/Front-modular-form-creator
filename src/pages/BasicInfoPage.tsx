import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Input, Select } from '../design-system'
import { PageShell } from '../components/PageShell'
import { getResource, updateBasicInfo } from '../api/resources'
import { ApiError } from '../api/client'
import type { Resource, ResourceBasicInfo } from '../types/resources'
import { useCompletedResourceEdits } from '../contexts/useCompletedResourceEdits'
import { getBadgeVariant } from './resourceHelpers'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function BasicInfoPage() {
  const params = useParams()
  const resourceId = params.resourceId ?? ''
  const [resource, setResource] = useState<Resource | null>(null)
  const [form, setForm] = useState<ResourceBasicInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { bufferedEdits, setBasicInfo } = useCompletedResourceEdits(resourceId)

  function normalizeBasicInfo(values: ResourceBasicInfo | undefined | null): ResourceBasicInfo | null {
    if (!values) return null
    return {
      ...values,
      priority: values.priority ? String(values.priority).toLowerCase() : '',
    }
  }

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
        setForm(normalizeBasicInfo(bufferedEdits?.basicInfo ?? fetched.basicInfo))
        setFieldErrors((current) => ({ ...current, priority: '' }))
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

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)

  const validateField = (field: keyof ResourceBasicInfo, value: string) => {
    if (!value.trim()) {
      return 'This field is required.'
    }

    if (field === 'email' && !isEmailValid(value)) {
      return 'Email must include @ and end with .com.'
    }

    return ''
  }

  const validateForm = (values: ResourceBasicInfo) => {
    const errors: Record<string, string> = {
      owner: validateField('owner', values.owner),
      email: validateField('email', values.email),
      description: validateField('description', values.description),
      priority: validateField('priority', values.priority),
    }
    setFieldErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const handleFieldChange = (field: keyof ResourceBasicInfo, value: string) => {
    setForm((current) =>
      current ? { ...current, [field]: value } : current,
    )
    setFieldErrors((current) => ({
      ...current,
      [field]: validateField(field, value),
    }))
    setMessage('')
    setError('')
  }

  const saveDraft = async () => {
    if (!resource || !form) return

    if (!validateForm(form)) {
      setError('Please fix the form errors before saving.')
      return
    }

    if (resource.status === 'completed') {
      setBasicInfo(resourceId, form)
      navigate(`/resources/${resource.resourceId}`, {
        state: { snackbar: 'Basic Info saved successfully.' },
      })
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateBasicInfo(resourceId, form)
      navigate(`/resources/${resource.resourceId}`, {
        state: { snackbar: 'Basic Info saved successfully.' },
      })
      return
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        // Try to map backend validation messages to specific fields so they
        // appear inline next to labels instead of as a top-level error.
        const msg = error.message ?? ''
        const fieldMap: [RegExp, keyof ResourceBasicInfo][] = [
          [/resourceName/i, 'resourceName'],
          [/owner/i, 'owner'],
          [/email/i, 'email'],
          [/description/i, 'description'],
          [/priority/i, 'priority'],
        ]

        const matched = fieldMap.find(([re]) => re.test(msg))
        if (matched) {
          const field = matched[1]
          setFieldErrors((current) => ({ ...current, [field]: msg }))
        } else {
          setError(msg)
        }
      } else {
        setError('Unable to save Basic Info.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formDisabled = !form

  const canSave = Boolean(
    form &&
      form.owner.trim() &&
      isEmailValid(form.email) &&
      form.description.trim() &&
      form.priority &&
      !Object.values(fieldErrors).some(Boolean),
  )

  const extraNote = resource?.status === 'completed'
    ? 'Completed resource edits are buffered locally until you submit them on the Details page.'
    : 'Draft resource changes are sent immediately to the backend.'

  const currentBasicInfo = useMemo(
    () => form ?? resource?.basicInfo,
    [form, resource],
  )

  return (
    <PageShell title="Basic Info" description={extraNote}>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {message ? <SuccessMessage>{message}</SuccessMessage> : null}
      {resource ? (
        <>
          <StatusHeading>
            <span>Status: </span>
            <StatusBadge variant={getBadgeVariant(resource.status)}>{resource.status}</StatusBadge>
          </StatusHeading>
          <FormGrid>
            <FieldWrapper>
              <Input
                label="Resource name"
                value={currentBasicInfo?.resourceName ?? ''}
                disabled
              />
            </FieldWrapper>
            <FieldWrapper>
              <Input
                label="Owner"
                value={currentBasicInfo?.owner ?? ''}
                onChange={(event) => handleFieldChange('owner', event.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.owner ? <FieldError>{fieldErrors.owner}</FieldError> : null}
            </FieldWrapper>
            <FieldWrapper>
              <Input
                label="Email"
                value={currentBasicInfo?.email ?? ''}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
            </FieldWrapper>
            <FieldWrapper>
              <Input
                label="Description"
                multiline
                rows={5}
                value={currentBasicInfo?.description ?? ''}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.description ? <FieldError>{fieldErrors.description}</FieldError> : null}
            </FieldWrapper>
            <FieldWrapper>
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={currentBasicInfo?.priority ?? ''}
                onChange={(event) => handleFieldChange('priority', event.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.priority ? <FieldError>{fieldErrors.priority}</FieldError> : null}
            </FieldWrapper>
          </FormGrid>
          <ActionsRow>
            <Button variant="primary" onClick={saveDraft} disabled={!canSave || loading || formDisabled}>
              Save Basic Info
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
  gap: 20px;
  max-width: 760px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 28px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
`

const FieldWrapper = styled.div`
  display: grid;
  gap: 8px;
`

const FieldError = styled.span`
  color: ${({ theme }) => theme.colors.warning};
  font-size: 0.9rem;
`

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  margin: 0 0 12px;
`

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.success};
`

const StatusHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
`

const StatusBadge = styled(Badge)`
  text-transform: capitalize;
`
