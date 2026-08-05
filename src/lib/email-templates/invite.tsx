import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import {
  brandRow,
  button,
  card,
  container,
  footer,
  h1,
  hr,
  link,
  main,
  text,
} from './auth-styles'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brandRow}>🐾 {siteName}</Text>
          <Heading style={h1}>You've been invited</Heading>
          <Text style={text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Accept the invitation to set up your account and access your
            clinic's console.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept invitation
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore this
            email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
