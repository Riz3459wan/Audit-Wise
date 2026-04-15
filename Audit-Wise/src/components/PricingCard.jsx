import { useNavigate } from "react-router-dom"
import { Card,CardContent,CardActions,Typography,Button,Box,Chip,Stack,Divider} from "@mui/material"
const PricingCard = ({ plan, className, currentPlan, setSelectedPlanForPayment }) => {
    const navigate = useNavigate()
    function handlePayment(plan) {
        setSelectedPlanForPayment(plan)
        navigate("/paymentConfirmation",{replace:true})
   
    }
    const isCurrentPlan = currentPlan === plan.planType
   return (
        <Box sx={{ position: "relative", width: "100%", maxWidth: 400, mx: "auto" }}>
            {isCurrentPlan && (
                <Chip
                    label="Current Plan"
                    color="primary"
                    size="small"
                    sx={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1,
                        fontWeight: 600,
                        backgroundColor:"green"
                    }}
                />
            )}

            <Card
                className={className ?? "card-style"}
                elevation={isCurrentPlan ? 8 : 3}
                sx={{
                    border: 2,
                    borderColor: isCurrentPlan ? "primary.main" : "grey.300",
                    borderRadius: 3,
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    height: "100%",
                    minHeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: 6
                    }
                }}
            >
                <CardContent sx={{ flexGrow: 1, p: 4, display: "flex", flexDirection: "column" }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            color: "steelblue",
                            mb: 2,
                            minHeight: 40
                        }}
                    >
                        {plan.planType}
                    </Typography>

                    <Box sx={{ mb: 3, minHeight: 100 }}>
                        <Typography
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 700,
                                color: "text.primary"
                            }}
                        >
                            ₹{plan.price}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            INR/month
                        </Typography>
                     
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 1, fontStyle: "italic", minHeight: 20 }}
                            >
                                (exclusive of GST)
                            </Typography>
                        
                        {plan.planType === currentPlan && (
                            <Box sx={{ minHeight: 20, mt: 1 }} />
                        )}
                    </Box>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 1, minHeight:20 }}
                    >
                        {plan.overview}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                        {plan.details.map((detail, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    justifyContent: "flex-start",
                                    px: 2
                                }}
                            >
                                <Box sx={{ color: "primary.main", display: "flex", minWidth: 24 }}>
                                    {detail.icon}
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: "left",
                                        color: "text.primary"
                                    }}
                                >
                                    {detail.description}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", p: 3, pt: 0 }}>
                    <Button
                        
                        variant={isCurrentPlan ? "outlined" : "contained"}
                        size="large"
                        fullWidth
                        onClick={() => {
                            if (!(isCurrentPlan || plan.planType === "Free")) {
                                handlePayment(plan)
                            }
                        }}
                        sx={{
                            py: 1.5,
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: "none",
                            fontSize: "1rem",
                            cursor: (isCurrentPlan || plan.planType === "Free") ? "not-allowed" : "pointer",
                            "&.Mui-disabled": {
                                cursor: "not-allowed",
                                pointerEvents: "auto" 
                            }
                        }}

                        disabled={plan.planType === currentPlan || plan.planType==="Free"}
                    >
                        {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.planType} `}
                    </Button>

                </CardActions>
            </Card>
        </Box>
    )
}

export default PricingCard