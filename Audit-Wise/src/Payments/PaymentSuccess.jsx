import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserPlan } = useAuth();

  const purchasedPlan = location.state?.plan;

  useEffect(() => {
    if (purchasedPlan) {
      updateUserPlan(purchasedPlan.planType);
    }
  }, [purchasedPlan, updateUserPlan]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 6,
          width: 450,
          borderRadius: '15px',
          textAlign: 'center',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        
        <Typography variant="h4" fontWeight="bold" mb={2}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={1}>
          Your {purchasedPlan?.planType} plan has been activated.
        </Typography>

        <Typography variant="h5" fontWeight={600} color="primary" mb={3}>
          Amount Paid: ₹{purchasedPlan?.price}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            py: 1.5,
            background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
            fontWeight: 600,
          }}
          onClick={() => {
            
            navigate('/dashboard', { replace: true })
            window.location.reload()}
            
          }
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;