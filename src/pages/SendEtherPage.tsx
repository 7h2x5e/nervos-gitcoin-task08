import { AccountButton } from '../components/account/AccountButton'
import { Container, MainContent, Section, SectionRow } from '../components/base/base'
import { SendEthForm } from '../components/SendEthForm/SendEthForm'
import { Title } from '../typography/Title'


export const SendEtherPage = () => {
  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>Multi-sender</Title>
            <AccountButton />
          </SectionRow>
          <SendEthForm />
        </Section>
      </Container>
    </MainContent>
  )
}
