import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Img,
  Section,
  Row,
  Column,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface WelcomeEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const WelcomeEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao BroFit! Confirme sua conta e comece sua jornada fitness.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://vvbobbonmwccytcjhacm.supabase.co/storage/v1/object/public/exercise-images/brofit-logo.png"
            width="120"
            height="120"
            alt="BroFit Logo"
            style={logo}
          />
          <Heading style={h1}>BroFit</Heading>
        </Section>

        <Section style={heroSection}>
          <Heading style={h2}>Bem-vindo ao BroFit! 💪</Heading>
          <Text style={text}>
            Estamos animados para ter você conosco! O BroFit é sua plataforma completa 
            para acompanhar treinos, definir metas e alcançar seus objetivos fitness.
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Confirmar Conta
          </Link>
        </Section>

        <Section style={featuresSection}>
          <Heading style={h3}>O que você pode fazer no BroFit:</Heading>
          <Row style={featureRow}>
            <Column style={featureColumn}>
              <Text style={featureText}>🏋️ Acompanhar treinos</Text>
            </Column>
            <Column style={featureColumn}>
              <Text style={featureText}>📊 Ver progresso</Text>
            </Column>
          </Row>
          <Row style={featureRow}>
            <Column style={featureColumn}>
              <Text style={featureText}>🏆 Conquistas</Text>
            </Column>
            <Column style={featureColumn}>
              <Text style={featureText}>👥 Ranking com amigos</Text>
            </Column>
          </Row>
        </Section>

        <Section style={codeSection}>
          <Text style={codeText}>
            Ou cole este código de confirmação no app:
          </Text>
          <Text style={code}>{token}</Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            Se você não criou uma conta no BroFit, pode ignorar este email.
          </Text>
          <Text style={footerText}>
            <Link href="https://brofit.app" style={footerLink}>
              BroFit - Sua jornada fitness começa aqui
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// Styles using BroFit color scheme
const main = {
  backgroundColor: "#0D0D0D",
  fontFamily: "Inter, system-ui, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  margin: "0 auto 16px",
  borderRadius: "12px",
};

const h1 = {
  color: "#00FF47",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
  letterSpacing: "-0.5px",
};

const heroSection = {
  backgroundColor: "#1A1A1A",
  borderRadius: "12px",
  padding: "32px",
  marginBottom: "24px",
  border: "1px solid #2E2E2E",
};

const h2 = {
  color: "#EDEDED",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const h3 = {
  color: "#EDEDED",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#AAAAAA",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#00FF47",
  color: "#0D0D0D",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

const featuresSection = {
  backgroundColor: "#1A1A1A",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "24px",
  border: "1px solid #2E2E2E",
};

const featureRow = {
  marginBottom: "8px",
};

const featureColumn = {
  width: "50%",
  paddingLeft: "8px",
  paddingRight: "8px",
};

const featureText = {
  color: "#EDEDED",
  fontSize: "14px",
  margin: "0",
  textAlign: "center" as const,
};

const codeSection = {
  backgroundColor: "#1A1A1A",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "32px",
  border: "1px solid #2E2E2E",
  textAlign: "center" as const,
};

const codeText = {
  color: "#AAAAAA",
  fontSize: "14px",
  margin: "0 0 16px 0",
};

const code = {
  backgroundColor: "#2E2E2E",
  color: "#00FF47",
  fontSize: "18px",
  fontWeight: "600",
  fontFamily: "monospace",
  padding: "12px 16px",
  borderRadius: "6px",
  border: "1px solid #00FF47",
  display: "inline-block",
  letterSpacing: "2px",
  margin: "0",
};

const footerSection = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "0 0 8px 0",
};

const footerLink = {
  color: "#00FF47",
  textDecoration: "none",
};