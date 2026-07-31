import { Link } from 'react-router-dom'
import styled from 'styled-components'

type PageShellProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <Shell>
      <Header>
        <Title>{title}</Title>
        <NavLink to="/resources">Resources</NavLink>
      </Header>
      {description ? <Description>{description}</Description> : null}
      <Content>{children}</Content>
    </Shell>
  )
}

const Shell = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px 64px;
`

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Description = styled.p`
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.inkMuted};
  max-width: 780px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`
