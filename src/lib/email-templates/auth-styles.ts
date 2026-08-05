// Shared brand styling for Vetigo auth emails.
// Body background stays #ffffff for deliverability across clients.

export const brand = {
  green: '#0f9d63',
  greenDark: '#0b7a4d',
  ink: '#132a22',
  body: '#4d5f57',
  muted: '#93a29b',
  border: '#e3ece7',
  tint: '#f3faf6',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '24px 0',
}

export const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '0 12px',
}

export const card = {
  border: `1px solid ${brand.border}`,
  borderRadius: '16px',
  padding: '32px 32px 28px',
  backgroundColor: '#ffffff',
}

export const brandRow = {
  fontSize: '18px',
  fontWeight: 700 as const,
  color: brand.green,
  letterSpacing: '-0.01em',
  margin: '0 0 24px',
}

export const h1 = {
  fontSize: '22px',
  fontWeight: 700 as const,
  color: brand.ink,
  letterSpacing: '-0.01em',
  margin: '0 0 14px',
}

export const text = {
  fontSize: '15px',
  color: brand.body,
  lineHeight: '1.6',
  margin: '0 0 18px',
}

export const link = { color: brand.greenDark, textDecoration: 'underline' }

export const button = {
  backgroundColor: brand.green,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '6px 0 4px',
}

export const code = {
  fontFamily: "'SFMono-Regular', Consolas, monospace",
  fontSize: '28px',
  fontWeight: 700 as const,
  letterSpacing: '0.18em',
  color: brand.ink,
  backgroundColor: brand.tint,
  border: `1px solid ${brand.border}`,
  borderRadius: '12px',
  padding: '16px 20px',
  textAlign: 'center' as const,
  margin: '0 0 22px',
}

export const hr = {
  borderColor: brand.border,
  margin: '26px 0 16px',
}

export const footer = {
  fontSize: '12px',
  color: brand.muted,
  lineHeight: '1.6',
  margin: '0',
}
