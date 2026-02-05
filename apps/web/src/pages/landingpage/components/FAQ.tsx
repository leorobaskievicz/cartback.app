import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { faqItems } from '../data/faq'

export default function FAQ() {
  const [expanded, setExpanded] = useState<string | false>('panel0')
  const theme = useTheme()

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  return (
    <Box
      id="faq"
      sx={{
        py: { xs: 8, md: 12 },
        background: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Perguntas Frequentes
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Tire suas dúvidas sobre o Cartback
          </Typography>
        </Box>

        {faqItems.map((item, index) => (
          <Accordion
            key={index}
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{
              mb: 2,
              '&:before': {
                display: 'none',
              },
              boxShadow: theme.shadows[1],
              borderRadius: 2,
              '&.Mui-expanded': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                py: 2,
                '& .MuiAccordionSummary-content': {
                  my: 1,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  )
}
