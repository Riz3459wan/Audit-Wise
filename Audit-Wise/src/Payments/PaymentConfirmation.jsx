import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  Paper,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material'

import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import GooglePayIcon from "../../CustomIcons/GooglePayIcon"
import PhonePeIcon from '../../CustomIcons/PhonePeIcon'
import PaytmIcon from '../../CustomIcons/PaytmIcon'

const PaymentPortal = ({ plan }) => {
  const [toggleCardInput, setToggleCardInput] = useState(false)
  const [toggleUpiInput, setToggleUpiInput] = useState(false)
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [remainingTime, setRemainingTime] = useState(300)
  const [openDialog, setOpenDialog] = useState(false)
  const navigate = useNavigate()
  const theme = "light"

  function handlePaymentSuccess() {
    sessionStorage.removeItem('redirectToPrice')
    
    navigate("/paymentSuccess", { 
      replace: true,
      state: { plan }
    })
  }

  function handlePaymentTypeChange(e) {
    setPaymentType(e.target.value)
    if (e.target.value === 'card') {
      setToggleCardInput(true)
      setToggleUpiInput(false)
    } else if (e.target.value === 'upi') {
      setToggleUpiInput(true)
      setToggleCardInput(false)
    }
  }

  const handleDialogClose = (confirm) => {
    if (confirm) {
      sessionStorage.removeItem('redirectToPrice')
      navigate("/price", { replace: true })
    } else {
      setOpenDialog(false)
      // Push a new state to keep user on the same page
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime === -1) {
          clearInterval(timer)
          alert("Time Limit Exceeded, Redirecting to Pricing Page")
          setTimeout(() => {
            sessionStorage.removeItem('redirectToPrice')
            navigate("/price", { replace: true })
          })
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  useEffect(() => {
    const shouldRedirect = sessionStorage.getItem('redirectToPrice')
    
    if (shouldRedirect === 'true') {
      sessionStorage.removeItem('redirectToPrice')
      navigate("/price", { replace: true })
    }
  }, [navigate])
  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname)

    const handlePopState = (event) => {
      event.preventDefault()
      window.history.pushState(null, '', window.location.pathname)
      setOpenDialog(true)
    }

    const handleBeforeUnload = (event) => {
      sessionStorage.setItem('redirectToPrice', 'true')
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("beforeunload", handleBeforeUnload)
   
    return () => {
      sessionStorage.removeItem('redirectToPrice')
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => handleDialogClose(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Leave Payment Page?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this page? Your payment session will be cancelled and you will be redirected to the pricing page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleDialogClose(true)} color="error" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ display: "flex", justifyContent: "space-between", p: 1, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Payment Overview
        </Typography>
        <Typography
          variant='h6'
          fontWeight={550}
          sx={{
            mt: 1,
            color: remainingTime <= 60 ? 'error.main' : 'text.primary'
          }}
        >
          Timer {theme === "dark" ? <AccessTimeIcon /> : <AccessTimeFilledIcon />} {formatTime(remainingTime)}
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 2, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Plan Details
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Plan Type: {plan.planType}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Grand Total: ₹{plan.price}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
            }
            label=""
          />
          <TextField
            fullWidth
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!sendEmail}
            size="small"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 5 }}>
          Send purchasing details to my E-mail ID
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Payment Options
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Please select one payment option
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            name="paymentType"
            value={paymentType}
            onChange={handlePaymentTypeChange}
          >
            <FormControlLabel
              value="upi"
              control={<Radio />}
              label="UPI/Payment using Mobile Banking/Wallet"
            />
            <FormControlLabel
              value="card"
              control={<Radio />}
              label="Cards (Credit Card/Debit Card)"
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {toggleCardInput && (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            CREDIT/DEBIT CARD
          </Typography>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Name as on the Card"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Card Number"
              placeholder=".... .... .... ...."
              variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="CVV"
                placeholder="..."
                variant="outlined"
                sx={{ width: '30%' }}
                type='password'
                inputProps={{ maxLength: 3 }}
              />

              <FormControl sx={{ width: '35%' }}>
                <InputLabel>Month</InputLabel>
                <Select label="Month" defaultValue="">
                  <MenuItem value="">Month</MenuItem>
                  <MenuItem value="1">January</MenuItem>
                  <MenuItem value="2">February</MenuItem>
                  <MenuItem value="3">March</MenuItem>
                  <MenuItem value="4">April</MenuItem>
                  <MenuItem value="5">May</MenuItem>
                  <MenuItem value="6">June</MenuItem>
                  <MenuItem value="7">July</MenuItem>
                  <MenuItem value="8">August</MenuItem>
                  <MenuItem value="9">September</MenuItem>
                  <MenuItem value="10">October</MenuItem>
                  <MenuItem value="11">November</MenuItem>
                  <MenuItem value="12">December</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Year"
                placeholder="YYYY"
                variant="outlined"
                sx={{ width: '35%' }}
                inputProps={{ maxLength: 4 }}
              />
            </Box>
          </Stack>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handlePaymentSuccess}
            disabled={!paymentType}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Confirm Payment Method
          </Button>
        </Paper>
      )}

      {toggleUpiInput && (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ marginTop: "10px", fontWeight: "550" }} variant='h4' component="h1">
            Select a UPI App of your choice
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button onClick={handlePaymentSuccess}><PhonePeIcon /></Button>
            <Button onClick={handlePaymentSuccess}><PaytmIcon /></Button>
            <Button onClick={handlePaymentSuccess}><GooglePayIcon /></Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export default PaymentPortal