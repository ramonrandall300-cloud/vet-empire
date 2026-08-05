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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to activate your {siteName} account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brandRow}>🐾 {siteName}</Text>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>
            Thanks for signing up for{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            , the clinic management platform for veterinary teams.
          </Text>
          <Text style={text}>
            Confirm{' '}
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>{' '}
            to activate your account.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify email
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't create a {siteName} account, you can safely ignore
            this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
