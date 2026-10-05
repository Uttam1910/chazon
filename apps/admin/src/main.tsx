import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { RequireAuth } from './auth'
import { Root } from './layout/Root'
import { Shell } from './layout/Shell'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LeadDetail, Leads } from './pages/Leads'
import { AuditDetail, Audits } from './pages/Audits'
import { ServiceEdit, Services } from './pages/Services'
import { CaseStudies, CaseStudyEdit } from './pages/CaseStudies'
import { InsightEdit, Insights } from './pages/Insights'
import { Industries } from './pages/Industries'
import { Testimonials } from './pages/Testimonials'
import { MediaLibrary } from './pages/MediaLibrary'
import { WebsiteSettings } from './pages/Settings'
import { Seo } from './pages/Seo'
import { Users } from './pages/Users'
import { Account } from './pages/Account'
import { NotFound } from './pages/NotFound'
import './styles.css'

const router = createBrowserRouter([{
  element: <Root/>,
  children: [
    { path: '/login', element: <Login/> },
    {
      element: <RequireAuth><Shell/></RequireAuth>,
      children: [
        { index: true, element: <Dashboard/> },
        { path: 'leads', element: <Leads/> },
        { path: 'leads/:id', element: <LeadDetail/> },
        { path: 'audits', element: <Audits/> },
        { path: 'audits/:id', element: <AuditDetail/> },
        { path: 'services', element: <Services/> },
        { path: 'services/:id', element: <ServiceEdit/> },
        { path: 'case-studies', element: <CaseStudies/> },
        { path: 'case-studies/:id', element: <CaseStudyEdit/> },
        { path: 'insights', element: <Insights/> },
        { path: 'insights/:id', element: <InsightEdit/> },
        { path: 'industries', element: <Industries/> },
        { path: 'testimonials', element: <Testimonials/> },
        { path: 'media', element: <MediaLibrary/> },
        { path: 'settings', element: <WebsiteSettings/> },
        { path: 'seo', element: <Seo/> },
        { path: 'users', element: <RequireAuth role="ADMIN"><Users/></RequireAuth> },
        { path: 'account', element: <Account/> },
        { path: '*', element: <NotFound/> },
      ],
    },
  ],
}], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' }) // e.g. "/admin" when served under the website

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>)
