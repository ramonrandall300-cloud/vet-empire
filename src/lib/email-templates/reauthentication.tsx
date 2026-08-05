import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import {
  brandRow,
  card,
  code,
  container,
  footer,
  h1,
  hr,
  main,
  text,
} from './auth-styles'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({
  token,
}: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Vetigo verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brandRow}>🐾 Vetigo</Text>
          <Heading style={h1}>Confirm it's you</Heading>
          <Text style={text}>
            Enter the verification code below to confirm your identity:
          </Text>
          <Text style={code}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            This code expires shortly. If you didn't request it, you can safely
            ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
