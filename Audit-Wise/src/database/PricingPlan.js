export const pricingPlans = [
  {
    planType: "Free",
    price: 0,
    overview: "Basic features for individual users",
    details: [
      { icon: "✓", description: "5 uploads per month" },
      { icon: "✓", description: "Basic OCR scanning" },
      { icon: "✓", description: "Email support" },
      { icon: "✗", description: "Advanced analytics" },
      { icon: "✗", description: "Priority support" },
    ],
    maxUploads: 5,
  },
  {
    planType: "Pro",
    price: 499,
    overview: "Advanced features for professionals",
    details: [
      { icon: "✓", description: "50 uploads per month" },
      { icon: "✓", description: "Advanced OCR scanning" },
      { icon: "✓", description: "Priority email support" },
      { icon: "✓", description: "Advanced analytics" },
      { icon: "✗", description: "24/7 phone support" },
    ],
    maxUploads: 50,
  },
  {
    planType: "Business",
    price: 999,
    overview: "Complete solution for businesses",
    details: [
      { icon: "✓", description: "200 uploads per month" },
      { icon: "✓", description: "Advanced OCR + AI analysis" },
      { icon: "✓", description: "24/7 priority support" },
      { icon: "✓", description: "Advanced analytics + Reports" },
      { icon: "✓", description: "Team collaboration" },
    ],
    maxUploads: 200,
  },
];
