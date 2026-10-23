import { Fragment, useEffect } from 'react'
import { useRouter } from './location'
import { RouterProvider } from './router'
import { matchRoute } from './routes'
import { SiteProvider } from './site'

function Routes() {
  const { path, search, navigate } = useRouter()
  // Links from the previous single-page site (/?enquiry=talk#contact, /?enquiry=audit#contact) still arrive at the right form.
  const legacy = path === '/' ? new URLSearchParams(search).get('enquiry') : null
  useEffect(() => {
    if (legacy === 'talk') navigate('/contact', { replace: true })
    else if (legacy === 'audit') navigate('/growth-audit', { replace: true })
  }, [legacy, navigate])
  // Keyed by path so each page starts with fresh state.
  return <Fragment key={path}>{matchRoute(path).element}</Fragment>
}

export function App({ url }: { url: string }) {
  return <SiteProvider><RouterProvider url={url}><Routes/></RouterProvider></SiteProvider>
}
