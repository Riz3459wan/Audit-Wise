import { Box, Typography, Container, useTheme } from '@mui/material'
import PricingCard from '../components/PricingCard'
import { pricingPlans } from '../Database/pricingPlan'
import { useEffect } from 'react'

const Pricing = ({ limit, currentUsage, currentPlan, setSelectedPlanForPayment }) => {
  const pricingPlan = pricingPlans
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  return (
    <Container 
      maxWidth="xl" 
      sx={{
        py: 2, 
        backgroundColor: isDarkMode ? '#121212' : '#f5f5f5', 
        minHeight: '100vh' 
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ 
            fontWeight: 800, 
            color: 'primary.main', 
            mb: 2 
          }}
        >
          You still have {limit - currentUsage} attempts left based on your current plan
        </Typography>

        <Typography
          variant="h6"
          component="h4"
          color="text.secondary"
          sx={{ 
            fontWeight: 500, 
            maxWidth: 600, 
            mx: 'auto' 
          }}
        >
          To avail more benefits, check out the other plans
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          justifyContent: 'center', 
          alignItems: 'stretch',
          flexWrap: 'wrap',
          px: 2 
        }}
      >
        {pricingPlan.map((plan, idx) => (
          <Box 
            key={idx} 
            sx={{ 
              flex: '1 1 280px',
              maxWidth: 350,
              minWidth: 280,
              display: 'flex'
            }}
          >
            <PricingCard
              plan={plan}
              currentPlan={currentPlan}
              setSelectedPlanForPayment={setSelectedPlanForPayment}
              className={currentPlan === plan.planType ? currentPlan : ""}
            />
          </Box>
        ))}
      </Box>
    </Container>
  )
}

export default Pricing