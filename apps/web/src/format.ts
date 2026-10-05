export const formatDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : ''
