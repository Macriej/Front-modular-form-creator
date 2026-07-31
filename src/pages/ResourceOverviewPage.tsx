import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Badge, Button, Card } from '../design-system'
import { PageShell } from '../components/PageShell'
import { getResource, deleteResource, provisionResource } from '../api/resources'
import type { Resource } from '../types/resources'
import { useCompletedResourceEdits } from '../contexts/useCompletedResourceEdits'
import {
  isBasicInfoComplete,
  isProjectDetailsComplete,
  getBadgeVariant,
} from './resourceHelpers'

export function ResourceOverviewPage() {
  const params = useParams()
  const resourceId = params.resourceId ?? ''
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const snackbar = (location.state as { snackbar?: string } | null)?.snackbar ?? ''
  const { bufferedEdits } = useCompletedResourceEdits(resourceId)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!snackbar) {
      return
    }

    const timer = window.setTimeout(() => navigate(location.pathname, { replace: true, state: null }), 2000)
    return () => window.clearTimeout(timer)
  }, [snackbar, navigate, location.pathname])

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }, [])

  const loadResource = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const fetched = await getResource(resourceId)
      setResource(fetched)
    } catch {
      setError('Unable to load resource.')
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
          setError('Unable to load resource.')
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

  const handleProvision = async () => {
    if (!resource) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = (await provisionResource(resourceId)) as
        | Resource
        | { alreadyCompleted: boolean; resource: Resource }

      // backend may return either the resource directly or an object { alreadyCompleted, resource }
      const isCompleted =
        ('status' in result && result.status === 'completed') ||
        ('resource' in result && result.resource?.status === 'completed')


      // show toast on success
      setToast('Resource successfully provisioned.')

      if (isCompleted) {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = window.setTimeout(() => {
          setToast('')
          navigate('/resources')
          toastTimerRef.current = null
        }, 2000)
        return () => {
          if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        }
      }

      // otherwise refresh the current resource to show updated state
      loadResource()
    } catch {
      setError('Unable to provision resource. Ensure both modules are completed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      await deleteResource(resourceId)
      // show right-side toast with deleted resource id, then navigate after 2s
      setToast(`Resource ${resourceId} deleted.`)
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => {
        setToast('')
        navigate('/resources')
        toastTimerRef.current = null
      }, 2000)
    } catch {
      setError('Unable to delete resource.')
    } finally {
      setLoading(false)
    }
  }

  const canProvision =
    resource?.status === 'draft' &&
    resource &&
    isBasicInfoComplete(resource.basicInfo) &&
    isProjectDetailsComplete(resource.projectDetails)

  return (
    <PageShell
      title="Resource overview"
      description="Review current module progress and complete the resource when both modules are ready."
    >
      {loading && !resource ? (
        <StatusMessage>Loading resource…</StatusMessage>
      ) : null}
      {(snackbar || toast) ? (
        <Snackbar>
          <IconWrapper aria-hidden="true" viewBox="0 0 24 24">
            <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2 18.6 6.8z" />
          </IconWrapper>
          <span>{snackbar || toast}</span>
        </Snackbar>
      ) : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {message ? <SuccessMessage>{message}</SuccessMessage> : null}
      {resource ? (
        <>
          <SummaryRow>
            <SectionCard>
              <Title>{resource.name}</Title>
              <Badge variant={getBadgeVariant(resource.status)}>
                {resource.status}
              </Badge>
              <Meta>
                <Label>ID</Label>
                <span>{resource.resourceId}</span>
              </Meta>
            </SectionCard>
          </SummaryRow>
          {resource.status === 'completed' && bufferedEdits ? (
            <NoticeCard>
              <strong>Unsaved completed edits in local buffer.</strong> Navigate to details to persist or discard.
            </NoticeCard>
          ) : null}
          <ModulesGrid>
            <Card>
              <CardTitle>Basic Info</CardTitle>
              <LinkButton to={`/resources/${resource.resourceId}/basic-info`}>
                Edit module
              </LinkButton>
              <ModuleField>
                <Key>Owner</Key>
                <Value>{resource.basicInfo.owner || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Email</Key>
                <Value>{resource.basicInfo.email || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Description</Key>
                <Value>{resource.basicInfo.description || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Priority</Key>
                <Value>{resource.basicInfo.priority || '—'}</Value>
              </ModuleField>
            </Card>
            <Card>
              <CardTitle>Project Details</CardTitle>
              <LinkButton
                to={`/resources/${resource.resourceId}/project-details`}
                disabled={!isBasicInfoComplete(resource.basicInfo)}
              >
                Edit module
              </LinkButton>
              <ModuleField>
                <Key>Project</Key>
                <Value>{resource.projectDetails.projectName || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Budget</Key>
                <Value>{resource.projectDetails.budget || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Category</Key>
                <Value>{resource.projectDetails.category || '—'}</Value>
              </ModuleField>
              <ModuleField>
                <Key>Team</Key>
                <Value>{resource.projectDetails.options.join(', ') || '—'}</Value>
              </ModuleField>
            </Card>
          </ModulesGrid>
          <FooterActions>
            <Button
              variant="primary"
              onClick={handleProvision}
              disabled={!canProvision || loading}
            >
              Provision resource
            </Button>
            <Button variant="secondary" onClick={handleDelete} disabled={loading}>
              Delete resource
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/resources/${resource.resourceId}/details`)}
              disabled={loading}
            >
              View details
            </Button>
          </FooterActions>
        </>
      ) : null}
    </PageShell>
  )
}

const SummaryRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`

const SectionCard = styled(Card)`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Label = styled.span`
  font-weight: 600;
`

const ModulesGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`

const CardTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 1.1rem;
`

const ModuleField = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
`

const Key = styled.div`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.9rem;
`

const Value = styled.div`
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
`

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const LinkButton = styled(Link)<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.primaryStrong};
  text-decoration: none;
  background: ${({ theme }) => theme.colors.surfaceAlt};

  ${({ disabled }) =>
    disabled &&
    css`
      pointer-events: none;
      opacity: 0.45;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
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

const NoticeCard = styled(Card)`
  padding: 16px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`
