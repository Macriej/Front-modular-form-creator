import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card, Input } from '../design-system'
import { PageShell } from '../components/PageShell'
import { createResource, deleteResource, listResources } from '../api/resources'
import type { Resource } from '../types/resources'
import { isBasicInfoComplete, isProjectDetailsComplete, getBadgeVariant } from './resourceHelpers'

export function ResourcesListPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [resourceName, setResourceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const snackbar = (location.state as { snackbar?: string } | null)?.snackbar ?? ''
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!snackbar) return
    const timer = window.setTimeout(() => navigate(location.pathname, { replace: true, state: null }), 2000)
    return () => window.clearTimeout(timer)
  }, [snackbar, navigate, location.pathname])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await listResources({ page: 1, pageSize: 50, sortOrder: 'desc' })
        if (active) {
          setResources(response.items)
        }
      } catch {
        if (active) {
          setError('Unable to load resources.')
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
  }, [])

  const handleCreate = async () => {
    if (!resourceName.trim()) {
      setError('Resource name is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const created = await createResource(resourceName.trim())
      setResourceName('')
      setResources((current) => [created, ...current])
      navigate(`/resources/${created.resourceId}`, {
        state: { snackbar: 'Resource created successfully.' },
      })
    } catch {
      setError('Unable to create resource.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (externalResourceId: string) => {
    setLoading(true)
    setError('')

    try {
      await deleteResource(externalResourceId)
      setResources((current) => current.filter((item) => String(item.resourceId) !== String(externalResourceId)))
      // show right-side toast with deleted resource id
      setToast(`Resource ${externalResourceId} deleted.`)
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => {
        setToast('')
        toastTimerRef.current = null
      }, 2000)
    } catch {
      setError('Unable to delete resource.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  return (
    <PageShell
      title="Resources"
      description="Create, track, and manage resources through the workflow defined by the backend contract."
    >
      <FormRow>
        <Input
          label="New resource name"
          value={resourceName}
          onChange={(event) => setResourceName(event.target.value)}
          placeholder="Enter resource name"
          disabled={loading}
        />
        <Button variant="primary" size="large" onClick={handleCreate} disabled={loading}>
          Create resource
        </Button>
      </FormRow>
      {(snackbar || toast) ? (
        <Snackbar>
          <IconWrapper aria-hidden="true" viewBox="0 0 24 24">
            <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2 18.6 6.8z" />
          </IconWrapper>
          <span>{snackbar || toast}</span>
        </Snackbar>
      ) : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <CardsGrid>
        {loading && resources.length === 0 ? (
          <StatusMessage>Loading resources…</StatusMessage>
        ) : resources.length === 0 ? (
          <StatusMessage>No resources found. Create one to begin.</StatusMessage>
          ) : (
          resources.map((resource) => {
            const basicComplete = isBasicInfoComplete(resource.basicInfo)
            const projectComplete = isProjectDetailsComplete(resource.projectDetails)

            return (
              <Card key={String(resource.resourceId)}>
                <ResourceRow>
                  <ResourceTitle>{resource.name}</ResourceTitle>
                  <Badge variant={getBadgeVariant(resource.status)}>
                    {resource.status}
                  </Badge>
                </ResourceRow>
                <Meta>
                  <Label>ID</Label>
                  <span>{resource.resourceId}</span>
                </Meta>
                <ProgressRow>
                  <ProgressLabel>Basic Info</ProgressLabel>
                  <StatusDot $completed={basicComplete}>{basicComplete ? 'Done' : 'Pending'}</StatusDot>
                </ProgressRow>
                <ProgressRow>
                  <ProgressLabel>Project Details</ProgressLabel>
                  <StatusDot $completed={projectComplete}>{projectComplete ? 'Done' : 'Pending'}</StatusDot>
                </ProgressRow>
                <Actions>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => navigate(`/resources/${resource.resourceId}`)}
                  >
                    Open
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => handleDelete(String(resource.resourceId))}>
                    Delete
                  </Button>
                </Actions>
              </Card>
            )
          })
        )}
      </CardsGrid>
    </PageShell>
  )
}

const FormRow = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr auto;
  align-items: end;
`

const CardsGrid = styled.div`
  display: grid;
  gap: 16px;
`

const ResourceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`

const ResourceTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Meta = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Label = styled.span`
  font-weight: 600;
`

const ProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const ProgressLabel = styled.span`
  color: ${({ theme }) => theme.colors.ink};
`

const StatusDot = styled.span<{ $completed: boolean }>`
  color: ${({ $completed, theme }) => ($completed ? theme.colors.success : theme.colors.warning)};
  font-weight: 600;
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  margin: 0;
`

const StatusMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Snackbar = styled.div`
  position: fixed;
  right: 24px;
  top: 24px;
  z-index: 50;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  font-weight: 600;
  min-width: 260px;
  max-width: calc(100vw - 48px);
  animation: appear 240ms ease-out;

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
