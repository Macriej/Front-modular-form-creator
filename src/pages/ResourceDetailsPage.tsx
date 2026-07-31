import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../design-system'
import { PageShell } from '../components/PageShell'
import { getResource, replaceResource } from '../api/resources'
import type { Resource } from '../types/resources'
import { useCompletedResourceEdits } from '../contexts/useCompletedResourceEdits'
import { getBadgeVariant } from './resourceHelpers'

export function ResourceDetailsPage() {
  const params = useParams()
  const resourceId = params.resourceId ?? ''
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { bufferedEdits, clearEdits } = useCompletedResourceEdits(resourceId)

  const loadResource = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const fetched = await getResource(resourceId)
      setResource(fetched)
    } catch {
      setError('Unable to load resource details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      setMessage('')

      try {
        const fetched = await getResource(resourceId)
        if (!active) {
          return
        }

        setResource(fetched)
      } catch {
        if (active) {
          setError('Unable to load resource details.')
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
  }, [resourceId])

  const hasBufferedBasicInfo = (buf: typeof bufferedEdits | undefined) =>
    Boolean(buf?.basicInfo && Object.values(buf.basicInfo).some((v) => String(v).trim() !== ''))

  const hasBufferedProjectDetails = (buf: typeof bufferedEdits | undefined) =>
    Boolean(
      buf?.projectDetails &&
        (String(buf.projectDetails.projectName).trim() !== '' ||
          String(buf.projectDetails.budget).trim() !== '' ||
          String(buf.projectDetails.category).trim() !== '' ||
          (Array.isArray(buf.projectDetails.options) && buf.projectDetails.options.length > 0)),
    )

  const mergeBuffered = (resource: Resource, buf: typeof bufferedEdits) => {
    const mergedBasic = hasBufferedBasicInfo(buf)
      ? { ...resource.basicInfo, ...buf!.basicInfo }
      : { ...resource.basicInfo }

    mergedBasic.resourceName = (
      (hasBufferedBasicInfo(buf) ? buf!.basicInfo.resourceName : resource.basicInfo.resourceName) ?? resource.name ?? ''
    ).trim()

    const mergedProject = hasBufferedProjectDetails(buf)
      ? { ...resource.projectDetails, ...buf!.projectDetails }
      : { ...resource.projectDetails }

    return { basicInfo: mergedBasic, projectDetails: mergedProject }
  }

  const saveChanges = async () => {
    if (!resource || !bufferedEdits) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { basicInfo: basic, projectDetails: project } = mergeBuffered(resource, bufferedEdits)

      await replaceResource(resourceId, {
        name: resource.name,
        status: resource.status,
        basicInfo: basic,
        projectDetails: project,
      })

      clearEdits(resourceId)
      setMessage('Saved completed resource edits successfully.')
      // show right-side toast briefly
      setToast('Saved completed resource edits successfully.')
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => {
        setToast('')
        toastTimerRef.current = null
      }, 2000)

      loadResource()
    } catch {
      setError('Unable to save changes to the completed resource.')
    } finally {
      setLoading(false)
    }
  }

  const discardChanges = () => {
    clearEdits(resourceId)
    setMessage('Discarded local edits.')
  }

  const displayBasicInfo = useMemo(
    () => {
      // If buffered basicInfo exists but is empty (all fields blank), treat
      // it as absent and show canonical resource.basicInfo.
      if (!bufferedEdits?.basicInfo) return resource?.basicInfo
      const anyBasic = Object.values(bufferedEdits.basicInfo).some((v) => String(v).trim() !== '')
      return anyBasic ? bufferedEdits.basicInfo : resource?.basicInfo
    },
    [bufferedEdits, resource],
  )

  const displayProjectDetails = useMemo(() => {
    if (!bufferedEdits?.projectDetails) return resource?.projectDetails
    const anyProject =
      String(bufferedEdits.projectDetails.projectName).trim() !== '' ||
      String(bufferedEdits.projectDetails.budget).trim() !== '' ||
      String(bufferedEdits.projectDetails.category).trim() !== '' ||
      (Array.isArray(bufferedEdits.projectDetails.options) && bufferedEdits.projectDetails.options.length > 0)

    return anyProject ? bufferedEdits.projectDetails : resource?.projectDetails
  }, [bufferedEdits, resource])

  // toast state for saved edits
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }, [])

  return (
    <PageShell
      title="Resource details"
      description="Review resource values from both modules and persist completed-resource edits explicitly."
    >
      {loading && !resource ? <StatusMessage>Loading details…</StatusMessage> : null}
      {toast ? (
        <Snackbar>
          <IconWrapper aria-hidden="true" viewBox="0 0 24 24">
            <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2 18.6 6.8z" />
          </IconWrapper>
          <span>{toast}</span>
        </Snackbar>
      ) : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {message ? <SuccessMessage>{message}</SuccessMessage> : null}
      {resource ? (
        <>
          <HeaderRow>
            <div>
              <ResourceName>{resource.name}</ResourceName>
              <Badge variant={getBadgeVariant(resource.status)}>
                {resource.status}
              </Badge>
            </div>
            {resource.status === 'completed' ? (
              <ActionRow>
                <Button
                  variant="primary"
                  onClick={saveChanges}
                  disabled={!bufferedEdits || loading}
                >
                  Save edits
                </Button>
                <Button variant="secondary" onClick={discardChanges} disabled={!bufferedEdits || loading}>
                  Discard edits
                </Button>
              </ActionRow>
            ) : null}
          </HeaderRow>
          {resource.status === 'completed' && bufferedEdits ? (
            <NoticeCard>
              Completed resources can still be edited locally from their module pages. Persist changes here.
            </NoticeCard>
          ) : null}
          <ModulesGrid>
            <Card>
              <CardTitle>Basic Info</CardTitle>
              <Field>
                <Label>Resource name</Label>
                <Value>{displayBasicInfo?.resourceName || '—'}</Value>
              </Field>
              <Field>
                <Label>Owner</Label>
                <Value>{displayBasicInfo?.owner || '—'}</Value>
              </Field>
              <Field>
                <Label>Email</Label>
                <Value>{displayBasicInfo?.email || '—'}</Value>
              </Field>
              <Field>
                <Label>Description</Label>
                <Value>{displayBasicInfo?.description || '—'}</Value>
              </Field>
              <Field>
                <Label>Priority</Label>
                <Value>{displayBasicInfo?.priority || '—'}</Value>
              </Field>
            </Card>
            <Card>
              <CardTitle>Project Details</CardTitle>
              <Field>
                <Label>Project name</Label>
                <Value>{displayProjectDetails?.projectName || '—'}</Value>
              </Field>
              <Field>
                <Label>Budget</Label>
                <Value>{displayProjectDetails?.budget || '—'}</Value>
              </Field>
              <Field>
                <Label>Category</Label>
                <Value>{displayProjectDetails?.category || '—'}</Value>
              </Field>
              <Field>
                <Label>Team</Label>
                <Value>{displayProjectDetails?.options.join(', ') || '—'}</Value>
              </Field>
            </Card>
          </ModulesGrid>
          <ButtonRow>
            <Button
              variant="secondary"
              onClick={() => navigate(`/resources/${resource.resourceId}`)}
              disabled={loading}
            >
              Back to overview
            </Button>
          </ButtonRow>
        </>
      ) : null}
    </PageShell>
  )
}

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`

const ResourceName = styled.h2`
  margin: 0 0 10px;
  font-size: 1.5rem;
`

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
`

const ModulesGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
`

const CardTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 1.1rem;
`

const Field = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.9rem;
`

const Value = styled.span`
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
`

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Snackbar = styled.div`
  position: fixed;
  right: 24px;
  top: 24px;
  z-index: 50;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  font-weight: 600;
  min-width: 220px;
  max-width: calc(100vw - 48px);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  animation: appear 180ms ease-out;

  @keyframes appear {
    from {
      opacity: 0;
      transform: translateX(14px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

const IconWrapper = styled.svg`
  width: 20px;
  height: 20px;
  fill: currentColor;
  flex: 0 0 20px;
`

const NoticeCard = styled(Card)`
  padding: 16px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const StatusMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  margin: 0;
`

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.success};
  margin: 0;
`
