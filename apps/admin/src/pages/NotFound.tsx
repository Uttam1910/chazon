import { Link } from 'react-router'
import { PageHeader } from '../ui/Common'
import { EmptyState } from '../ui/States'

export function NotFound() {
  return <>
    <PageHeader title="Page not found"/>
    <EmptyState title="This page doesn’t exist" message="The link may be out of date." action={<Link className="btn" to="/">Back to dashboard</Link>}/>
  </>
}
